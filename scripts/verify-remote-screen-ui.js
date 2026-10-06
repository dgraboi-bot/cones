const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";
const launcherStorageKey = "cones-beginner-launcher-v2";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyRemoteLoadingPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    const remoteUrl = new URL("remote", baseUrl).href;
    await page.goto(remoteUrl, { waitUntil: "domcontentloaded" });
    const status = page.locator("[data-remote-loading-status]");
    await status.waitFor({ state: "visible" });
    assert(
      (await status.textContent()).trim() === "Opening Remote Device Setup. Please Wait...",
      "The /remote entry must show its loading status before the launcher opens."
    );

    await page.waitForURL(/telepathybeginner\.html\?open=remote-device/);
    await page.locator("[data-remote-device-setup-overlay]").waitFor({ state: "visible" });
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDeviceInstructions() {
  const browser = await chromium.launch({ headless: true });
  const platforms = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"
  ];

  try {
    for (const userAgent of platforms) {
      const context = await browser.newContext({ userAgent });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
      await page.locator("[data-remote-device-setup-overlay]").waitFor({ state: "visible" });
      await page.locator("[data-open-remote-device-instructions]").click();
      const instructions = page.locator("[data-remote-device-instructions-overlay]");
      await instructions.waitFor({ state: "visible" });
      const instructionText = (await instructions.locator(".about-section-copy").allTextContents()).join(" ").trim();
      assert(
        instructionText.includes("screen is prevented from going to sleep") && instructionText.includes("plug it in to its charger"),
        "Remote device instructions must explain sleep prevention and charging."
      );
      assert(
        instructionText.includes("COMPLETELY BLANK") && instructionText.includes("UNBLANK THE SCREEN"),
        "Remote device instructions must explain how to unblank the standby screen."
      );
      await instructions.locator("[data-close-remote-device-instructions]").click();
      assert(await instructions.isHidden(), "Closing remote device instructions must return to the setup form.");
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function verifyRemoteScreenUi() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ entryMode: "visitor" }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    // The launcher performs its initial state render asynchronously after DOMContentLoaded.
    await page.waitForTimeout(700);
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
      card.hidden = false;
    });
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await page.waitForFunction(() => document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active"));
    await page.locator('[data-remote-view-mode-open]').evaluate((button) => button.click());
    await page.locator('[data-remote-view-mode-card="remote-device"]').evaluate((button) => button.click());

    const remoteScreenOptions = page.locator('[data-remote-viewer-remote-screen-options]');
    await remoteScreenOptions.waitFor({ state: "visible" });
    assert(
      JSON.stringify(await remoteScreenOptions.locator("span").allTextContents()) === JSON.stringify([
        "Practice without saving results",
        "Practice and save results"
      ]),
      "Remote Screen must display its two visual practice choices."
    );
    assert(
      await page.locator('[data-remote-viewer-experience-wrap]').isHidden(),
      "Covered Screen experience controls must remain hidden in Remote Screen mode."
    );
    assert(
      await page.locator('[data-remote-viewer-own]').inputValue() === "Recognized Unique Name required. Click GO.",
      "A Remote Screen must initially guide the viewer to claim a unique name."
    );
    assert(
      await page.locator('[data-remote-viewer-partner]').inputValue() === "Recognized Remote Device name needed. Click GO.",
      "A Remote Screen must initially guide the viewer to set up a remote device."
    );
    assert(
      await page.locator('[data-remote-viewer-display-device]').count() === 0,
      "The viewer-only Clairvoyance panel must not offer a display-device checkbox."
    );
    await page.locator('[data-remote-viewer-go]').evaluate((button) => button.click());
    const claimDialog = page.locator('[data-handle-overlay]');
    await claimDialog.waitFor({ state: "visible" });
    assert(
      await claimDialog.locator("h2").textContent() === "Choose Unique Name For Use With This Browser",
      "An anonymous Remote Screen viewer must receive the Clairvoyance-specific name claim flow."
    );
    assert(
      (await claimDialog.locator('[data-handle-intro]').textContent()).includes("recognized user for all Clairvoyance / Remote Viewing exercises"),
      "The Clairvoyance name claim must explain the purpose of recognition."
    );
    assert(await claimDialog.locator('[data-handle-input]').getAttribute("placeholder") === "Your handle.", "The claim input must use the requested hint.");
    await claimDialog.locator('[data-close-handle]').click();

    assert(
      await page.locator('[data-remote-viewer-go]').evaluate((button) => getComputedStyle(button).gridColumn === "2"),
      "Remote Screen GO must use the compact lower-right viewer position."
    );

    // Exercise selection remains device-local for a Robot simulation.
    // Verify the circular Exercise 1 <-> Exercise 4 behavior directly.
    await page.locator('[data-remote-viewer-partner]').evaluate((input) => {
      input.value = "Robot";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Let the initial asynchronous difficulty-label refresh finish before testing the local Robot cycle.
    await page.waitForTimeout(700);
    await page.locator('[data-role-difficulty-bump="remote-viewer"][data-direction="down"]').evaluate((button) => button.click());
    await page.waitForFunction(() => (
      document.querySelector('[data-pair-difficulty-label="remote-viewer"]')?.textContent.trim() === "Exercise 4"
    ));
    await page.waitForFunction(() => (
      !document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("role-card-level-adjusting")
    ));
    await page.waitForTimeout(100);
    await page.locator('[data-role-difficulty-bump="remote-viewer"][data-direction="up"]').evaluate((button) => button.click());
    await page.waitForFunction(() => (
      document.querySelector('[data-pair-difficulty-label="remote-viewer"]')?.textContent.trim() === "Exercise 1"
    ));
  } finally {
    await browser.close();
  }
}

async function verifyMobileReceiverTourLauncher() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ entryMode: "visitor" }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.locator("[data-start-guided-receiver-tour-landing]").evaluate((button) => button.click());

    const receiverButton = page.locator('[data-role-card="receiver"] .role-card-toggle');
    const guide = page.locator("[data-guided-tour-balloon]");
    await guide.waitFor({ state: "visible" });
    const [receiverBox, guideBox] = await Promise.all([receiverButton.boundingBox(), guide.boundingBox()]);
    assert(receiverBox && guideBox, "The mobile receiver tour must show both the required button and its guide.");
    assert(
      guideBox.y >= receiverBox.y + receiverBox.height,
      "The mobile receiver tour guide must be positioned below, not over, the Receiver button."
    );
    assert(
      await guide.evaluate((element) => getComputedStyle(element).touchAction === "none"),
      "The mobile tour guide must retain touch drags rather than letting the page pan behind it."
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

async function verifyNarrowPhoneClairvoyanceLayout() {
  const browser = await chromium.launch({ headless: true });
  const devices = [
    {
      name: "iPhone",
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"
    },
    {
      name: "Android phone",
      viewport: { width: 412, height: 915 },
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"
    }
  ];

  try {
    for (const device of devices) {
      const context = await browser.newContext({
        viewport: device.viewport,
        isMobile: true,
        hasTouch: true,
        userAgent: device.userAgent
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      await page.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
      await page.evaluate(({ key }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(key, JSON.stringify({ entryMode: "visitor" }));
      }, { key: launcherStorageKey });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
      await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => {
        view.classList.remove("beginner-view-hidden");
      });
      await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
        card.hidden = false;
      });

      const header = page.locator('[data-role-card="remote-viewer"] .role-card-header');
      const card = page.locator('[data-role-card="remote-viewer"]');
      const inlineBack = card.locator('[data-collapse-role-card="remote-viewer"]');
      const tagline = page.locator('[data-role-card="remote-viewer"] .role-card-tagline');
      const [headerBox, taglineBox] = await Promise.all([
        header.boundingBox(),
        tagline.boundingBox()
      ]);
      assert(headerBox && taglineBox, `${device.name} must render the collapsed Clairvoyance header.`);
      assert(
        taglineBox.x >= headerBox.x && taglineBox.x + taglineBox.width <= headerBox.x + headerBox.width + 1,
        `${device.name} skill banner must stay inside the Clairvoyance header.`
      );

      for (const horizontalPosition of [0.15, 0.5]) {
        await header.click({
          position: {
            x: headerBox.width * horizontalPosition,
            y: headerBox.height / 2
          }
        });
        await page.waitForFunction(() => document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active"));
        assert(
          await card.evaluate((element) => element.classList.contains("active")),
          `${device.name} must open Clairvoyance from its visible ${horizontalPosition < 0.5 ? "title" : "header"} area.`
        );
        await inlineBack.click();
        await page.waitForFunction(() => !document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active"));
      }

      await header.click({ position: { x: headerBox.width * 0.15, y: headerBox.height / 2 } });
      await page.waitForFunction(() => document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active"));
      assert(await tagline.isHidden(), `${device.name} expanded Clairvoyance header must hide its skill banner.`);

      const modeButton = page.locator('[data-remote-view-mode-open]');
      const exerciseStack = page.locator('[data-role-difficulty-stack="remote-viewer"]');
      const backButton = page.locator('[data-collapse-role-card="remote-viewer"]');
      const [modeBox, exerciseBox, backBox] = await Promise.all([
        modeButton.boundingBox(),
        exerciseStack.boundingBox(),
        backButton.boundingBox()
      ]);
      assert(modeBox && exerciseBox && backBox, `${device.name} must render Clairvoyance controls after expansion.`);
      assert(modeBox.height >= 44 && backBox.height >= 44, `${device.name} Clairvoyance controls need phone-sized tap targets.`);
      assert(
        modeBox.x + modeBox.width <= exerciseBox.x && exerciseBox.x + exerciseBox.width <= backBox.x,
        `${device.name} Set Mode, Exercise, and BACK controls must not overlap.`
      );

      await modeButton.click();
      await page.locator('[data-remote-view-mode-card="remote-device"]').click();
      const ownInput = page.locator('[data-remote-viewer-own]');
      const deviceInput = page.locator('[data-remote-viewer-partner]');
      assert(await ownInput.inputValue() === "Name required. Tap GO.", `${device.name} must use the compact required-name instruction.`);
      assert(await deviceInput.inputValue() === "Device name required. Tap GO.", `${device.name} must use the compact required-device instruction.`);
      assert(await page.locator('[data-remote-viewer-own-mobile-hint]').isVisible(), `${device.name} must show the full name-setup guidance below the field.`);
      assert(await page.locator('[data-remote-viewer-partner-mobile-hint]').isVisible(), `${device.name} must show the full remote-device guidance below the field.`);

      await page.locator('[data-remote-viewer-remote-screen-options]').scrollIntoViewIfNeeded();
      const optionBoxes = await page.locator('[data-remote-viewer-remote-screen-options] .remote-viewer-experience-option').evaluateAll((labels) => (
        labels.map((label) => {
          const box = label.getBoundingClientRect();
          return { height: box.height, receivesOwnCenter: label.contains(document.elementFromPoint(box.x + (box.width / 2), box.y + (box.height / 2))) };
        })
      ));
      assert(
        optionBoxes.length === 2 && optionBoxes.every((option) => option.height >= 44 && option.receivesOwnCenter),
        `${device.name} Remote Screen practice choices must be full-height, directly tappable controls.`
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function verifyClairvoyanceCoveredScreenTourLaunch() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ entryMode: "visitor" }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.locator("[data-open-clairvoyance-viewing]").evaluate((button) => button.click());
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await page.waitForFunction(() => document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active"));
    await page.locator('[data-remote-viewer-experience][value="tour"]').check();

    await page.locator("[data-remote-viewer-go]").evaluate((button) => button.click());
    const coveredScreenDialog = page.locator("[data-covered-screen-instruction-overlay]");
    await coveredScreenDialog.waitFor({ state: "visible" });
    const runtimeRequestPromise = page.waitForRequest((request) => (
      request.isNavigationRequest() && request.url().includes("/receiver.html")
    ));
    await coveredScreenDialog.locator("button").click();
    const runtimeRequest = await runtimeRequestPromise;
    await page.waitForURL(/receiver\.html/);

    const runtimeUrl = new URL(runtimeRequest.url());
    assert(
      runtimeUrl.searchParams.get("guided_tour") === "receiver-experience",
      `Covered Screen Tour must launch the Receiver runtime with its guided-tour flag; received ${runtimeUrl.href}.`
    );
    await page.locator("#guidedTourOverlay").waitFor({ state: "visible" });
  } finally {
    await browser.close();
  }
}

async function verifyLandingMoreAndEspProExplore() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${baseUrl}?open=landing`, { waitUntil: "domcontentloaded" });
    assert(
      (await page.locator("#temporary-home-esp-pro").textContent()).includes("The flagship ESP GYM software app"),
      "The ESP PRO Landing Page card does not use the approved description."
    );
    assert(
      (await page.locator("#temporary-home-ongoing-research").textContent()).includes("one or more ESP GYM practice tools"),
      "The Ongoing Research Landing Page card does not use the approved description."
    );
    await page.locator("#temporary-home-rich-courseware").evaluate((card) => { card.hidden = false; });
    assert(
      await page.locator("#temporary-home-rich-courseware").getByRole("button", { name: "More" }).count() === 1,
      "Rich Courseware must include a More action beside Explore."
    );
    await page.locator("[data-temporary-home-explore]").evaluate((button) => button.click());
    const keyConceptsTab = page.locator('[data-learning-center-tab="key-concepts"]');
    await keyConceptsTab.waitFor({ state: "visible" });
    assert(
      await keyConceptsTab.getAttribute("aria-selected") === "true",
      "The Rich Courseware More button must open the Key Concepts tab."
    );
    assert(
      await page.locator('[data-learning-center-concept-card]:visible').count() > 0,
      "The Rich Courseware More button must display the first Key Concepts page."
    );
    await page.locator("[data-close-learning-center]").evaluate((button) => button.click());
    await page.waitForFunction(() => !document.querySelector('[data-view="temporary-home-page"]')?.classList.contains("beginner-view-hidden"));
    await page.locator("[data-temporary-home-esp-pro-explore]").click();
    await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
    await page.locator("[data-open-landing-page]").click();
    await page.waitForURL(/open=landing-preview/);
    assert(
      new URL(page.url()).searchParams.has("scroll_y"),
      "ESP PRO Explore must preserve a Landing Page scroll position for the Main Menu BACK action."
    );
    await page.locator('[data-view="temporary-home-page"]').waitFor({ state: "visible" });
  } finally {
    await browser.close();
  }
}

async function verifyHelpProFeatureSummaryNavigation() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-view="help"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator("[data-open-help-pro-feature-summary]").evaluate((button) => button.click());
    await page.locator('[data-view="go-pro-includes"]').waitFor({ state: "visible" });
    await page.locator("[data-close-go-pro-includes]").evaluate((button) => button.click());
    await page.waitForFunction(() => !document.querySelector('[data-view="help"]')?.classList.contains("beginner-view-hidden"));
  } finally {
    await browser.close();
  }
}

function verifyClairvoyanceTourImplementation() {
  const launcherSource = fs.readFileSync(path.resolve(__dirname, "..", "telepathybeginner.js"), "utf8");
  const launcherMarkup = fs.readFileSync(path.resolve(__dirname, "..", "telepathybeginner.html"), "utf8");
  assert(
    launcherSource.includes('const coveredScreenGuidedTour = coveredScreenMode && experienceMode === "tour";')
      && launcherSource.includes('guidedTour: coveredScreenGuidedTour ? guidedReceiverTourMode : ""'),
    "Every Covered Screen Tour, including a recognized user tour, must launch the runtime guided tour."
  );
  assert(
    launcherMarkup.includes("Experience What Practicing Telepathic Reception is like")
      && launcherMarkup.includes("Experience What Practicing Telepathic Sending is like")
      && launcherMarkup.includes("Experience What Practicing Remote Viewing is like"),
    "The User Guide must show the three approved practice-experience labels."
  );
  assert(
    launcherSource.includes("function startClairvoyanceGuidedTourFromUserGuide()")
      && launcherSource.includes('latest.remoteViewerExperienceMode = "tour"')
      && launcherSource.includes('view: "temporary-home-page"'),
    "The User Guide Remote Viewing tour must start in Covered Screen Tour mode and retain a Landing Page return route."
  );
}

async function verifyRemoteDeviceRoute() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ entryMode: "visitor" }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    const dialog = page.locator('[data-remote-device-setup-overlay]');
    await dialog.waitFor({ state: "visible" });
    assert(await dialog.locator("h2").textContent() === "Remote Device Setup", "The /remote route must open device setup.");
    assert(
      (await dialog.locator('[data-remote-device-user-copy]').textContent()).trim() === "Please fill in your unique recognized ESP GYM name.",
      "The /remote route must explain the required recognized user name."
    );
    assert(
      (await dialog.locator('[data-remote-device-name-copy]').textContent()).includes("Choose a unique remote device name for this browser and device combination"),
      "The /remote route must explain remote-device name creation."
    );
    assert(await dialog.locator('[data-remote-device-confirm]').isDisabled(), "Remote setup must require both names before confirmation.");
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDeviceNameDraftRemainsEditable() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "Moomoo",
              preferred_identifier: "Moomoo",
              preferred_handle: "moomoo",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ok: true, remote_display_devices: [] })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "Moomoo" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "Moomoo",
        deviceName: "",
        controlToken: ""
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    const dialog = page.locator('[data-remote-device-setup-overlay]');
    const deviceNameInput = dialog.locator('[data-remote-device-name-input]');
    await dialog.waitFor({ state: "visible" });
    await deviceNameInput.fill("M");
    // The availability check runs each second. A draft must survive that check
    // and remain editable until the user submits a complete device name.
    await page.waitForTimeout(1250);
    await deviceNameInput.pressSequentially("imi");
    assert(await deviceNameInput.inputValue() === "Mimi", "A new remote-device name must remain editable after its first character.");
    assert(!(await deviceNameInput.evaluate((input) => input.readOnly)), "Only a server-accepted remote-device name may become read-only.");
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDevicePersistence() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "dan's remote", owner_identifier: "molly" }
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      // A remote display runtime can cache its device name as the generic
      // launcher identity. Its saved owner must still populate the You field.
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "dan's remote" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "molly",
        deviceName: "dan's remote",
        controlToken: "a".repeat(64)
      }));
    }, { key: launcherStorageKey });
    const setupBeforeReload = await page.evaluate(() => localStorage.getItem("cones-remote-display-setup-v1"));
    assert(setupBeforeReload !== null, "Test setup must save the remote-device registration before reload.");
    await page.reload({ waitUntil: "domcontentloaded" });

    const dialog = page.locator('[data-remote-device-setup-overlay]');
    await dialog.waitFor({ state: "visible" });
    const restoredOwner = await dialog.locator('[data-remote-device-user-input]').inputValue();
    const restoredDevice = await dialog.locator('[data-remote-device-name-input]').inputValue();
    const persistedSetup = await page.evaluate(() => localStorage.getItem("cones-remote-display-setup-v1"));
    assert(restoredOwner === "molly", `Remote setup must restore its saved owner on reload; received ${JSON.stringify(restoredOwner)} with setup ${JSON.stringify(persistedSetup)}.`);
    assert(restoredDevice === "dan's remote", `Remote setup must restore its saved device name on reload; received ${JSON.stringify(restoredDevice)}.`);
    assert(await dialog.locator('[data-remote-device-reset]').isEnabled(), "A restored remote setup must remain resettable by this browser.");
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDeviceResetClearsReleasedSetup() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let initialStatusLookupStarted;
  const initialStatusLookup = new Promise((resolve) => {
    initialStatusLookupStarted = resolve;
  });
  let releaseInitialStatusLookup;
  const initialStatusRelease = new Promise((resolve) => {
    releaseInitialStatusLookup = resolve;
  });
  let resetRequested = false;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        initialStatusLookupStarted();
        await initialStatusRelease;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "dan's remote", owner_identifier: "molly" }
          })
        });
        return;
      }
      if (request.action === "reset_remote_display_device") {
        resetRequested = true;
        releaseInitialStatusLookup();
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ok: true, remote_display_device_reset: { device_name: "dan's remote" } })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "molly" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "molly",
        deviceName: "dan's remote",
        controlToken: "a".repeat(64)
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    const dialog = page.locator('[data-remote-device-setup-overlay]');
    await dialog.waitFor({ state: "visible" });
    await initialStatusLookup;
    page.once("dialog", (dialogEvent) => dialogEvent.accept());
    await dialog.locator('[data-remote-device-reset]').click();
    await page.waitForFunction(() => document.querySelector('[data-remote-device-status]')?.textContent === "Remote device setup has been reset.");
    assert(resetRequested, "RESET must release the registered remote device before clearing the browser setup.");
    assert(await dialog.locator('[data-remote-device-user-input]').inputValue() === "", "RESET must leave the Remote Device owner field blank.");
    assert(await dialog.locator('[data-remote-device-name-input]').inputValue() === "", "RESET must leave the Remote Device name field blank.");
    assert(!(await dialog.locator('[data-remote-device-user-input]').evaluate((input) => input.readOnly)), "RESET must make the Remote Device owner field editable.");
    assert(!(await dialog.locator('[data-remote-device-name-input]').evaluate((input) => input.readOnly)), "RESET must make the Remote Device name field editable.");
    assert(await dialog.locator('[data-remote-device-reset]').isDisabled(), "RESET must be unavailable after the remote-device registration is released.");
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDeviceContinueMarksReady() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let readyRequest = null;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "dan's remote 2", owner_identifier: "molly" }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_devices: [{
              device_name: "dan's remote 2",
              owner_identifier: "molly",
              is_active: true,
              is_ready: true
            }]
          })
        });
        return;
      }
      if (request.action === "mark_remote_display_device_ready") {
        readyRequest = request;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "dan's remote 2", owner_identifier: "molly", is_ready: true }
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "molly" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "molly",
        deviceName: "dan's remote 2",
        controlToken: "a".repeat(64)
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    const dialog = page.locator('[data-remote-device-setup-overlay]');
    await dialog.waitFor({ state: "visible" });
    await dialog.locator('[data-remote-device-confirm]').click();
    const runtimeFrame = page.locator('[data-remote-display-runtime-frame]');
    await runtimeFrame.waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const frame = document.querySelector('[data-remote-display-runtime-frame]');
      return frame?.getAttribute("src")?.includes("sender.html");
    });
    assert(!/sender\.html/.test(page.url()), "CONTINUE must keep Remote Device Setup loaded around the remote runtime.");
    assert(
      readyRequest?.owner_identifier === "molly" &&
        readyRequest?.device_name === "dan's remote 2" &&
        readyRequest?.device_control_token === "a".repeat(64),
      "CONTINUE must confirm the registered remote device is ready before opening standby."
    );
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDeviceBlocksCompetingLiveDisplay() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let androidRemoteIsLive = true;
  let readyRequests = 0;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "Moomoo",
              preferred_identifier: "Moomoo",
              preferred_handle: "Moomoo",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "iPad Remote", owner_identifier: "Moomoo" }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_devices: [{
              device_name: "Android Remote",
              owner_identifier: "Moomoo",
              is_active: true,
              is_ready: androidRemoteIsLive
            }, {
              device_name: "iPad Remote",
              owner_identifier: "Moomoo",
              is_active: false,
              is_ready: false
            }]
          })
        });
        return;
      }
      if (request.action === "mark_remote_display_device_ready") {
        readyRequests += 1;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ok: true, remote_display_device: { device_name: "iPad Remote", owner_identifier: "Moomoo" } })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "Moomoo" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "Moomoo",
        deviceName: "iPad Remote",
        controlToken: "b".repeat(64)
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    const dialog = page.locator('[data-remote-device-setup-overlay]');
    const continueButton = dialog.locator('[data-remote-device-confirm]');
    const status = dialog.locator('[data-remote-device-setup-status]');
    await dialog.waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector('[data-remote-device-confirm]')?.disabled === true);
    assert(await status.textContent() === "Android Remote is currently the active remote display for Moomoo. Please close that active display before making this device the active remote display for Moomoo.", "A competing live remote display must explain why CONTINUE is disabled.");
    await continueButton.click({ force: true });
    assert(readyRequests === 0, "A disabled CONTINUE button must not replace the active remote display.");

    androidRemoteIsLive = false;
    await page.waitForFunction(() => document.querySelector('[data-remote-device-confirm]')?.disabled === false, null, { timeout: 5000 });
    assert((await status.textContent()).includes("Remote device is now available"), "CONTINUE must become available once the prior remote display is no longer live.");
  } finally {
    await browser.close();
  }
}

async function verifyStaleRemoteRuntimeReturnsToSetupOnActivationConflict() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let readyRequests = 0;
  let androidRemoteIsLive = false;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests receive an idle response below.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "Moomoo",
              preferred_identifier: "Moomoo",
              preferred_handle: "moomoo",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "iPhone Remote", owner_identifier: "Moomoo" }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        const devices = androidRemoteIsLive
          ? [{ device_name: "Android Remote", owner_identifier: "Moomoo", is_active: true, is_ready: true }]
          : [{ device_name: "iPhone Remote", owner_identifier: "Moomoo", is_active: true, is_ready: true }];
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ok: true, remote_display_devices: devices })
        });
        return;
      }
      if (request.action === "mark_remote_display_device_ready") {
        readyRequests += 1;
        if (readyRequests === 1) {
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              remote_display_device: { device_name: "iPhone Remote", owner_identifier: "Moomoo", is_ready: true }
            })
          });
          return;
        }
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            error: "Android Remote is currently the active remote display for Moomoo. Please close that active display before making this device the active remote display for Moomoo."
          })
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          server_now_ms: Date.now(),
          state: {
            sender_online: true,
            receiver_online: false,
            receiver_ready: false,
            receiver_view: { phase: "idle" },
            post_round: null,
            timeout_notice: null,
            timeout_exit: null,
            abort_notice: null,
            partner_finished_notice: null,
            session_limit_notice: null,
            authorization_notice: null,
            round: null
          }
        })
      });
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "Moomoo" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "Moomoo",
        deviceName: "iPhone Remote",
        controlToken: "b".repeat(64)
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    const dialog = page.locator('[data-remote-device-setup-overlay]');
    const status = dialog.locator('[data-remote-device-setup-status]');
    await dialog.waitFor({ state: "visible" });
    await dialog.locator('[data-remote-device-confirm]').click();
    await page.waitForFunction(() => document.querySelector('[data-remote-display-runtime-frame]')?.src.includes("sender.html"));
    let runtimeFrame = null;
    for (let attempt = 0; attempt < 40 && !runtimeFrame; attempt += 1) {
      runtimeFrame = page.frames().find((frame) => frame.url().includes("sender.html")) || null;
      if (!runtimeFrame) {
        await page.waitForTimeout(50);
      }
    }
    assert(runtimeFrame, "Remote Device Setup must open its embedded remote runtime before it can receive a conflict message.");
    await runtimeFrame.evaluate(() => {
      window.parent.postMessage({
        type: "espgym-remote-display-activation-rejected",
        message: "Android Remote is currently the active remote display for Moomoo. Please close that active display before making this device the active remote display for Moomoo."
      }, window.location.origin);
    });
    androidRemoteIsLive = true;
    assert(readyRequests >= 1, "CONTINUE must first confirm that its own registered remote device is ready.");
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-device-setup-status]')?.textContent ===
      "Android Remote is currently the active remote display for Moomoo. Please close that active display before making this device the active remote display for Moomoo."
    ));
    assert(await page.locator('[data-remote-display-runtime-shell]').isHidden(), "A rejected stale runtime must return to Remote Device Setup.");
    assert((await status.textContent()).includes("Android Remote is currently the active remote display"), "Remote Device Setup must visibly explain the competing active display.");
  } finally {
    await browser.close();
  }
}

async function verifyIncompleteRemoteDeviceSetup() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=remote-device`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "molly" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "molly",
        deviceName: "",
        controlToken: ""
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    const dialog = page.locator('[data-remote-device-setup-overlay]');
    await dialog.waitFor({ state: "visible" });
    assert(await dialog.locator('[data-remote-device-user-input]').inputValue() === "molly", "An incomplete setup must retain the accepted owner name.");
    assert(await dialog.locator('[data-remote-device-name-input]').inputValue() === "", "An incomplete setup must keep the remote device field ready for a new name.");
    assert(await dialog.locator('[data-remote-device-reset]').isDisabled(), "RESET must remain unavailable until a remote device is fully registered.");
    assert(
      (await dialog.locator('[data-remote-device-setup-status]').textContent()).includes("not currently configured as a remote display device"),
      "An incomplete setup must explain that a new remote device name is needed."
    );

    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "molly" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "molly",
        deviceName: "",
        controlToken: ""
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.confirm = () => true;
      document.querySelector('[data-reset-this-device]')?.click();
    });
    await page.waitForURL(/open=landing/);
    assert(
      await page.evaluate(() => localStorage.getItem("cones-remote-display-setup-v1") === null),
      "Reset This Device must clear an owner-only remote setup directly."
    );
  } finally {
    await browser.close();
  }
}

async function verifyViewerDiscoversRemoteDeviceAfterModal() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let remoteDeviceReady = false;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_devices: remoteDeviceReady
              ? [{ device_name: "dan's remote", owner_identifier: "molly", is_ready: true, is_active: false }]
              : []
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: request.device_name === "dan's remote" && remoteDeviceReady
              ? { device_name: "dan's remote", owner_identifier: "molly", is_ready: true, is_standby: true }
              : null
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "molly",
        ownNames: { "remote-viewer": "molly" },
        remoteViewerSimulationMode: "remote-device"
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.locator('[data-open-clairvoyance-viewing]').evaluate((button) => button.click());
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    const remoteScreenInput = page.locator('[data-remote-viewer-partner]');
    await remoteScreenInput.waitFor({ state: "visible" });
    assert(
      await remoteScreenInput.inputValue() === "Recognized Remote Device name needed. Click GO.",
      "A viewer without a remote device must start with the clear setup instruction."
    );

    // The remote laptop can be configured while this viewer remains open. The
    // viewer must discover that one device without requiring a modal close,
    // page reload, or manually typed device name.
    remoteDeviceReady = true;
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "dan's remote"
    ));
    assert(
      await remoteScreenInput.inputValue() === "dan's remote",
      "An open viewer must discover a newly registered remote device automatically."
    );

    // Return to the no-device state before opening the setup instruction. The
    // remote device will become available again while that instruction is open.
    remoteDeviceReady = false;
    await remoteScreenInput.evaluate((input) => {
      input.value = "Recognized Remote Device name needed. Click GO.";
    });

    await page.locator('[data-remote-viewer-go]').evaluate((button) => button.click());
    const instructionModal = page.locator('[data-unique-name-required-overlay]');
    await instructionModal.waitFor({ state: "visible" });
    assert(
      (await instructionModal.locator('[data-unique-name-required-title]').textContent()).trim() === "Remote Device Name Needed",
      "GO must direct the viewer to set up the remote device."
    );

    // The other device completes setup while this viewer remains on the instruction modal.
    remoteDeviceReady = true;
    await instructionModal.locator('[data-unique-name-required-close]').click();
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "dan's remote"
    ));
    assert(await remoteScreenInput.inputValue() === "dan's remote", "Closing the instruction modal must discover and fill the newly registered remote device.");
  } finally {
    await browser.close();
  }
}

async function verifyBrowserRegisteredIdentityCannotBeOverwritten() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const notices = [];

  try {
    page.on("dialog", async (dialog) => {
      notices.push(dialog.message());
      await dialog.dismiss();
    });
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "graboi",
        ownNames: { sender: "graboi", receiver: "graboi", "remote-viewer": "graboi" }
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);

    const replaceAndExpectRestore = async (input) => {
      await input.evaluate((element) => {
        element.value = "molly";
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.waitForTimeout(100);
      assert(await input.inputValue() === "graboi", "A browser-bound recognized name must be restored after a different name is entered.");
    };

    await page.locator('[data-role-card="receiver"] .role-card-toggle').evaluate((button) => button.click());
    await replaceAndExpectRestore(page.locator('[data-role-form="receiver"] input[name="ownName"]'));

    await page.locator('[data-role-card="sender"] .role-card-toggle').evaluate((button) => button.click());
    await replaceAndExpectRestore(page.locator('[data-role-form="sender"] input[name="ownName"]'));

    await page.locator('[data-open-clairvoyance-viewing]').evaluate((button) => button.click());
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await replaceAndExpectRestore(page.locator('[data-remote-viewer-own]'));

    assert(
      notices.filter((message) => message === "The recognized name for this browser is graboi.").length === 3,
      "Sender, Receiver, and Clairvoyance must restore the browser's recognized name after a different name is entered."
    );
  } finally {
    await browser.close();
  }
}

async function verifyViewerSelectsTheSingleReadyRemoteDevice() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let secondDeviceReady = false;
  let activeDeviceExerciseRequest = null;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_devices: [
              { device_name: "dan's remote", owner_identifier: "molly", is_ready: true, is_active: !secondDeviceReady },
              { device_name: "dan's remote 2", owner_identifier: "molly", is_ready: secondDeviceReady, is_active: secondDeviceReady }
            ]
          })
        });
        return;
      }
      if (request.action === "set_pair_difficulty" && request.session_code === "dansremote2__molly") {
        activeDeviceExerciseRequest = request;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ok: true, pair_difficulty: request.difficulty_level })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "molly",
        ownNames: { "remote-viewer": "molly" },
        remoteViewerSimulationMode: "remote-device",
        launcherProfiles: {
          molly: {
            "remote-viewer": { currentPartner: "dan's remote" }
          }
        }
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => { card.hidden = false; });
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    const remoteScreenInput = page.locator('[data-remote-viewer-partner]');
    await remoteScreenInput.waitFor({ state: "visible" });
    await remoteScreenInput.evaluate((input) => { input.value = "dan's remote"; });

    secondDeviceReady = true;
    // Returning to the viewer after preparing a remote display must perform an
    // immediate availability refresh, not wait for the next polling interval.
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "dan's remote 2"
    ));
    assert(
      await remoteScreenInput.inputValue() === "dan's remote 2",
      "A viewer must select the newly active remote display even when an older device remains ready."
    );
    assert(
      activeDeviceExerciseRequest?.difficulty_level === "1",
      "An automatically selected active remote display must inherit the viewer's current Exercise."
    );
  } finally {
    await browser.close();
  }
}

async function verifyViewerClearsReleasedRemoteDevice() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let remoteDevicePresent = true;

  try {
    // Keep this regression test on the current source instead of an
    // identically versioned service-worker cache from an earlier test run.
    await page.route("**/telepathybeginner.js*", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: fs.readFileSync(path.resolve(process.cwd(), "telepathybeginner.js"), "utf8")
      });
    });
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_launcher_profile") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            launcher_profile: {
              own_email: "molly",
              current_partner: "",
              difficulty_level: "1",
              partner_history: [],
              deleted_partners: []
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: remoteDevicePresent
              ? { device_name: "dan's remote", owner_identifier: "molly", is_ready: true }
              : null
          })
        });
        return;
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_devices: remoteDevicePresent
              ? [{ device_name: "dan's remote", owner_identifier: "molly", is_ready: true, is_active: true }]
              : [{ device_name: "RV Test Screen", owner_identifier: "molly", is_ready: false, is_active: false }]
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "molly",
        ownNames: { "remote-viewer": "molly" },
        currentPartners: { "remote-viewer": "dan's remote" },
        launcherProfiles: {
          "remote-viewer::molly": {
            currentPartner: "dan's remote",
            difficultyLevel: "1",
            partnerHistory: ["dan's remote"],
            deletedPartners: []
          }
        },
        remoteViewerSimulationMode: "remote-device"
      }));
      localStorage.setItem("cones-settings-v2-remote-viewer", JSON.stringify({
        own_email: "molly",
        partner_email: "dan's remote"
      }));
      localStorage.setItem("cones-browser-identity-authorizations-v1", JSON.stringify({
        molly: "a".repeat(64)
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-open-clairvoyance-viewing]').evaluate((button) => button.click());
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await page.locator('[data-remote-view-mode-card="remote-device"]').evaluate((button) => button.click());
    await page.bringToFront();
    const remoteScreenInput = page.locator('[data-remote-viewer-partner]');
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "dan's remote"
    ));
    // Reproduce a remote-device RESET after the viewer has already selected it.
    remoteDevicePresent = false;
    // A foreground viewer refreshes the selected device immediately on focus.
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "Recognized Remote Device name needed. Click GO."
    ));
    assert(
      await remoteScreenInput.inputValue() === "Recognized Remote Device name needed. Click GO.",
      "A viewer must clear a remote device that was released by reset and must not select an inactive legacy device."
    );
    const stored = await page.evaluate(({ key }) => {
      const launcher = JSON.parse(localStorage.getItem(key) || "{}");
      const settings = JSON.parse(localStorage.getItem("cones-settings-v2-remote-viewer") || "{}");
      return {
        currentPartner: launcher.currentPartners?.["remote-viewer"] || "",
        profilePartner: launcher.launcherProfiles?.["remote-viewer::molly"]?.currentPartner || "",
        runtimePartner: settings.partner_email || ""
      };
    }, { key: launcherStorageKey });
    assert(
      JSON.stringify(stored) === JSON.stringify({ currentPartner: "", profilePartner: "", runtimePartner: "" }),
      `A released remote device must be removed from every viewer-side current-partner store; received ${JSON.stringify(stored)}.`
    );
  } finally {
    await browser.close();
  }
}

async function verifyRemoteScreenSettingsPersistAcrossReload() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let serverProfile = {
    own_email: "molly",
    current_partner: "dan's remote",
    difficulty_level: "2",
    partner_history: ["dan's remote"],
    deleted_partners: []
  };

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_identifier_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            identifier_status: {
              input_identifier: "molly",
              preferred_identifier: "molly",
              preferred_handle: "molly",
              formal_identity_exists: true,
              uses_handle: true
            }
          })
        });
        return;
      }
      if (request.action === "get_remote_display_device_status") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_device: { device_name: "dan's remote", owner_identifier: "molly" }
          })
        });
        return;
      }
      if (request.action === "get_launcher_profile") {
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, launcher_profile: serverProfile }) });
        return;
      }
      if (request.action === "save_launcher_profile") {
        serverProfile = {
          own_email: "molly",
          current_partner: request.launcher_profile?.current_partner || "",
          difficulty_level: request.launcher_profile?.difficulty_level || "1",
          partner_history: request.launcher_profile?.partner_history || [],
          deleted_partners: request.launcher_profile?.deleted_partners || []
        };
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, launcher_profile: serverProfile }) });
        return;
      }
      if (request.action === "get_pair_difficulty" || request.action === "set_pair_difficulty") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            pair_difficulty: "2",
            pair_difficulty_meta: { max_allowed_difficulty_level: 4 }
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "molly",
        ownNames: { "remote-viewer": "molly" },
        currentPartners: { "remote-viewer": "dan's remote" },
        roleDifficultyLevels: { "remote-viewer": "2" },
        remoteViewerExperienceMode: "practice-unsaved",
        remoteViewerSimulationMode: "remote-device"
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.locator('[data-open-clairvoyance-viewing]').evaluate((button) => button.click());
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await page.waitForFunction(() => document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active"));
    await page.locator('[data-remote-view-mode-open]').evaluate((button) => button.click());
    await page.locator('[data-remote-view-mode-card="remote-device"]').evaluate((button) => button.click());
    await page.locator('[data-remote-viewer-remote-screen-options]').waitFor({ state: "visible" });
    await page.locator('[data-remote-viewer-remote-screen-options] .remote-viewer-experience-option').filter({ hasText: "Practice and save results" }).evaluate((label) => label.click());
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}").remoteViewerExperienceMode === "practice-saved");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.locator('[data-open-clairvoyance-viewing]').evaluate((button) => button.click());
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await page.locator('[data-remote-viewer-remote-screen-options]').waitFor({ state: "visible" });
    await page.waitForTimeout(250);
    const restored = await page.evaluate(({ key }) => {
      const launcher = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        label: document.querySelector('[data-pair-difficulty-label="remote-viewer"]')?.textContent.trim() || "",
        localDifficulty: launcher.roleDifficultyLevels?.["remote-viewer"] || "",
        profileDifficulty: launcher.launcherProfiles?.["remote-viewer::molly"]?.difficultyLevel || ""
      };
    }, { key: launcherStorageKey });
    assert(
      restored.label === "Exercise 2",
      `Remote Screen must restore Exercise 2 after reload; received ${JSON.stringify(restored)}.`
    );
    assert(
      await page.locator('[data-remote-viewer-remote-screen-experience="practice-saved"]').isChecked(),
      "Remote Screen must restore the selected saved-results choice after reload."
    );

    await page.locator('[data-remote-viewer-remote-screen-experience="practice-unsaved"]').check();
    let launchedUrl = "";
    await page.route("**/receiver.html?*", async (route) => {
      launchedUrl = route.request().url();
      await route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Remote run</title>" });
    });
    const remoteRunNavigation = page.waitForURL(/receiver\.html\?/, { timeout: 10000 });
    await page.locator('[data-remote-viewer-go]').evaluate((button) => button.click());
    await remoteRunNavigation;
    assert(
      new URL(launchedUrl).searchParams.get("save_results") === "0",
      "Remote Screen practice without saving results must launch the runtime with save_results=0."
    );
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDisplayExerciseTwoRendersTarget() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const targetUrl = new URL("cone-lowglow-transparent.png", baseUrl).href;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Respond with a safe idle state if a malformed test request occurs.
      }
      const idleState = {
        sender_online: true,
        receiver_online: true,
        receiver_ready: true,
        receiver_view: { phase: "idle" },
        post_round: null,
        timeout_notice: null,
        timeout_exit: null,
        abort_notice: null,
        partner_finished_notice: null,
        session_limit_notice: null,
        authorization_notice: null,
        round: null
      };
      if (request.action === "start_round") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            server_now_ms: Date.now(),
            round: {
              id: "remote-image-pair-round",
              sender_client_id: request.client_id,
              start_server_ms: Date.now() - 8000,
              difficulty_level: "2",
              stimulus_kind: "image_pair",
              image_pair_id: "test-pair",
              image_sent_index: 1,
              image_sent: targetUrl,
              image_choice_a: targetUrl,
              image_choice_b: targetUrl
            }
          })
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: true, server_now_ms: Date.now(), state: idleState })
      });
    });

    await page.goto(
      `${baseUrl.replace("telepathybeginner.html", "sender.html")}?runtime_mode=remote-display&prefill=1&own_email=molly&partner_email=dansremote3&difficulty_level=2`,
      { waitUntil: "domcontentloaded" }
    );
    const targetPanel = page.locator("#senderImageDisplayPanel");
    await targetPanel.waitFor({ state: "visible" });
    assert(
      await targetPanel.locator("img").getAttribute("src") === targetUrl,
      "Remote Screen Exercise 2 must render its assigned target image on the remote display."
    );
    const [stageBox, targetBox] = await Promise.all([
      page.locator("#stage").boundingBox(),
      targetPanel.boundingBox()
    ]);
    assert(stageBox && targetBox, "The remote target and its display stage must be measurable.");
    assert(
      Math.abs((targetBox.x + (targetBox.width / 2)) - (stageBox.x + (stageBox.width / 2))) <= 2
        && Math.abs((targetBox.y + (targetBox.height / 2)) - (stageBox.y + (stageBox.height / 2))) <= 2,
      "A remote target image must be centered in the Remote Device display."
    );
    assert(
      await page.locator("#remoteDisplayPauseButton").count() === 0,
      "The Remote Device pause control must not exist while a target image is displayed."
    );
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDisplayAbortReturnsToStandby() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  let abortDelivered = false;
  let remoteAbortClearRequested = false;

  try {
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Respond with a safe idle state if a malformed test request occurs.
      }
      const idleState = {
        sender_online: true,
        receiver_online: false,
        receiver_ready: false,
        receiver_view: { phase: "idle" },
        post_round: null,
        timeout_notice: null,
        timeout_exit: null,
        abort_notice: null,
        partner_finished_notice: null,
        session_limit_notice: null,
        authorization_notice: null,
        round: null
      };
      if (request.action === "heartbeat" && !abortDelivered) {
        abortDelivered = true;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            server_now_ms: Date.now(),
            state: {
              ...idleState,
              abort_notice: {
                message: "Your partner has quit this trial and returned to the home screen.",
                by_role: "receiver"
              }
            }
          })
        });
        return;
      }
      if (request.action === "clear_abort_notice" && abortDelivered) {
        remoteAbortClearRequested = true;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: true, server_now_ms: Date.now(), state: idleState })
      });
    });

    await page.goto(
      `${baseUrl.replace("telepathybeginner.html", "sender.html")}?runtime_mode=remote-display&prefill=1&own_email=molly&partner_email=dansremote3&difficulty_level=2`,
      { waitUntil: "domcontentloaded" }
    );
    for (let attempt = 0; attempt < 20 && !remoteAbortClearRequested; attempt += 1) {
      await page.waitForTimeout(50);
    }
    await page.waitForFunction(() => document.querySelector("#countdownNumber")?.textContent.includes("Waiting for remote viewer to be online"));
    assert(remoteAbortClearRequested, "A remote display must clear a viewer abort instead of presenting a home-screen prompt.");
  } finally {
    await browser.close();
  }
}

function verifyPersistentRemoteDisplayImplementation() {
  const launcherSource = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.js"), "utf8");
  const launcherMarkup = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.html"), "utf8");
  const launcherStyles = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.css"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "telepathy.js"), "utf8");
  const runtimeStyles = fs.readFileSync(path.join(__dirname, "..", "telepathy.css"), "utf8");
  const apiSource = fs.readFileSync(path.join(__dirname, "..", "api.php"), "utf8");

  assert(
    !launcherSource.includes('remoteDeviceConfirmButton?.dataset.ready !== "true"'),
    "Remote setup must not require a second OK click after CONTINUE."
  );
  assert(
    launcherSource.includes('remoteDeviceSetupStatus.textContent = "Opening remote display standby..."'),
    "CONTINUE must immediately enter remote-display standby."
  );
  assert(
    launcherMarkup.includes('data-remote-device-confirm disabled>CONTINUE</button>'),
    "Remote setup must label its final action CONTINUE."
  );
  assert(
    !launcherMarkup.includes("data-remote-viewer-display-device"),
    "The display-device checkbox markup must be removed from the viewer panel."
  );
  assert(
    launcherStyles.includes('accent-color: #39ff6a;'),
    "Selected Clairvoyance practice choices must use the high-visibility green indicator."
  );
  assert(
    launcherSource.includes("This removes this browser's remote device and releases the remote device name."),
    "Remote-device RESET must use the approved confirmation wording."
  );
  assert(
    launcherSource.includes("getRemoteDeviceActiveBlockMessage") && launcherSource.includes("startRemoteDeviceSetupAvailabilityChecks"),
    "Remote Device Setup must block and recheck a competing live remote display."
  );
  assert(
    launcherSource.includes("let remoteDeviceSetupGeneration = 0;") &&
      launcherSource.includes("setupGeneration !== remoteDeviceSetupGeneration"),
    "RESET must invalidate stale setup lookups so released values cannot return to its fields."
  );
  assert(
    apiSource.includes("$activeDeviceKey !== '' && $activeDeviceKey !== $deviceKey") &&
      apiSource.includes("Please close that active display before making this device the active remote display"),
    "The server must reject a race that attempts to replace a competing live remote display."
  );
  assert(
    runtimeSource.includes("function returnRemoteDisplayToSetupAfterActivationConflict") &&
      runtimeSource.includes("remoteDisplayActivationRejected = true") &&
      runtimeSource.includes("espgym-remote-display-activation-rejected"),
    "A stale remote display must stop heartbeats and report an activation conflict instead of retrying indefinitely."
  );
  assert(
    launcherSource.includes("espgym-remote-display-activation-rejected") &&
      launcherSource.includes("remoteDisplayRuntimeReturnStatus"),
    "Remote Device Setup must return from a rejected runtime and visibly retain the server conflict message."
  );
  assert(
    runtimeSource.includes("function showRemoteDisplayStandbyState()"),
    "Remote display standby state is missing."
  );
  assert(
    runtimeSource.includes("mark_remote_display_device_ready"),
    "A remote display must publish its ready status while it is in standby."
  );
  assert(
    runtimeSource.includes("navigator.wakeLock?.request") && runtimeSource.includes("remote_display_visibility_changed"),
    "A remote display must request a screen wake lock when available and trace foreground/background changes."
  );
  assert(
    runtimeSource.includes("remoteDisplayIdleFadeMs")
      && runtimeSource.includes("function handleRemoteDisplayStandbyScreenTap")
      && runtimeSource.includes("espgym-remote-display-standby-exit"),
    "A ready remote display must fade its static standby screen and return setup control to its parent on a tap."
  );
  assert(
    launcherSource.includes("function requestRemoteDeviceFullscreen()")
      && launcherSource.includes("void requestRemoteDeviceFullscreen();")
      && launcherSource.includes("function showRemoteDisplayRuntime(targetUrl)"),
    "CONTINUE must request fullscreen before opening the embedded Remote Device runtime."
  );
  assert(
    runtimeSource.includes("function prepareRemoteDisplayTargetPresentation")
      && !runtimeSource.includes("remoteDisplayPauseButton"),
    "A Remote Device must present targets without a pause control."
  );
  assert(
    runtimeStyles.includes(".stage.remote-display-target-presenting.visible")
      && runtimeStyles.includes("body.remote-display-standby-dimmed"),
    "Remote targets must be centered and standby controls must fade to a blank display."
  );
  assert(
    runtimeSource.includes("if (isRemoteDisplayMode) {\n      showRemoteDisplayStandbyState();\n      return;"),
    "A completed remote session must return the display to standby instead of the launcher."
  );
  assert(
    runtimeSource.includes("const finalShouldShowWaitingBack = !isRemoteDisplayMode && ("),
    "Remote-display standby must not expose the generic BACK button."
  );
  assert(
    runtimeSource.includes("function returnRemoteDisplayToStandbyAfterSession()"),
    "Remote-display sessions must have a direct completion-to-standby path."
  );
  assert(
    launcherMarkup.includes('data-remote-display-runtime-shell')
      && launcherMarkup.includes('data-remote-display-runtime-frame'),
    "The Remote Device runtime must remain inside its same-origin fullscreen parent shell."
  );
  assert(
    launcherSource.includes('actionLabel: "LOCATION"'),
    "Setup Website Features must label its location action LOCATION."
  );
  assert(
    !launcherSource.includes("pauseSelectedRemoteViewerDevice")
      && !runtimeSource.includes("Pause Remote Device")
      && !runtimeSource.includes("Resume Remote Device"),
    "Pause and Resume must be removed from the viewer and Remote Device runtime."
  );
  assert(
    runtimeSource.includes('if (String(round?.stimulus_kind || "") === "image_pair") {')
      && runtimeSource.includes("Remote display intentionally does not satisfy the legacy level-four helper."),
    "Remote Screen Exercise 2 image-pair rounds must render an image target instead of a cone layout."
  );
  assert(
    runtimeSource.includes('void api("clear_timeout_notice")')
      && runtimeSource.includes("The remote display is an appliance: acknowledge a stale session"),
    "A timed-out remote display must clear the session and return directly to standby."
  );
  assert(
    runtimeSource.includes('void api("clear_abort_notice")')
      && runtimeSource.includes("The remote display remains ready for the next viewer after the"),
    "A remote display must return to standby after its viewer aborts a session."
  );
  assert(
    runtimeSource.includes("returnRemoteDisplayToStandbyAfterSession();\n      return;"),
    "A remote display must not render the normal sender completion prompt after End Session."
  );
  assert(
    launcherSource.includes("localStorage.clear();") && launcherSource.includes("clear_all_app_storage: true"),
    "ADMIN local-storage clearing must remove Remote Screen state with all other device state."
  );
  assert(
    launcherSource.includes("await completeDeviceResetToAnonymousVisitor();"),
    "Reset This Device must use the same full device-state clearing path."
  );
  assert(
    launcherSource.includes("if (hasCompleteRemoteDisplaySetup(remoteSetup))"),
    "Only a complete remote-device registration may divert Reset This Device to remote setup."
  );
}

async function run() {
  // Each case uses the same origin and local-storage keys, so run them in
  // sequence to prevent one browser context from overwriting another's setup.
  await verifyRemoteLoadingPage();
  await verifyRemoteDeviceInstructions();
  await verifyRemoteScreenUi();
  await verifyMobileReceiverTourLauncher();
  await verifyNarrowPhoneClairvoyanceLayout();
  await verifyClairvoyanceCoveredScreenTourLaunch();
  await verifyLandingMoreAndEspProExplore();
  await verifyHelpProFeatureSummaryNavigation();
  await verifyRemoteDeviceRoute();
  await verifyRemoteDeviceNameDraftRemainsEditable();
  await verifyRemoteDevicePersistence();
  await verifyRemoteDeviceResetClearsReleasedSetup();
  await verifyRemoteDeviceContinueMarksReady();
  await verifyRemoteDeviceBlocksCompetingLiveDisplay();
  await verifyStaleRemoteRuntimeReturnsToSetupOnActivationConflict();
  await verifyIncompleteRemoteDeviceSetup();
  await verifyViewerDiscoversRemoteDeviceAfterModal();
  await verifyBrowserRegisteredIdentityCannotBeOverwritten();
  await verifyViewerSelectsTheSingleReadyRemoteDevice();
  await verifyViewerClearsReleasedRemoteDevice();
  await verifyRemoteScreenSettingsPersistAcrossReload();
  await verifyRemoteDisplayExerciseTwoRendersTarget();
  await verifyRemoteDisplayAbortReturnsToStandby();
  verifyClairvoyanceTourImplementation();
  verifyPersistentRemoteDisplayImplementation();
}

run()
  .then(() => {
    console.log("Remote Screen and remote-device setup UI verified.");
  })
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
