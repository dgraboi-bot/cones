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
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
      card.hidden = false;
    });
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
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

    // Exercise selection remains device-local until a remote device is ready.
    // Verify the circular Exercise 1 <-> Exercise 4 behavior directly.
    await page.locator('[data-remote-viewer-partner]').evaluate((input) => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.locator('[data-role-difficulty-bump="remote-viewer"][data-direction="down"]').evaluate((button) => button.click());
    await page.waitForFunction(() => (
      document.querySelector('[data-pair-difficulty-label="remote-viewer"]')?.textContent.trim() === "Exercise 4"
    ));
    await page.locator('[data-role-difficulty-bump="remote-viewer"][data-direction="up"]').evaluate((button) => button.click());
    await page.waitForFunction(() => (
      document.querySelector('[data-pair-difficulty-label="remote-viewer"]')?.textContent.trim() === "Exercise 1"
    ));
  } finally {
    await browser.close();
  }
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
      localStorage.setItem(key, JSON.stringify({ recognizedIdentity: "molly" }));
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
              ? [{ device_name: "dan's remote", owner_identifier: "molly" }]
              : []
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
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => { card.hidden = false; });
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
    assert(await remoteScreenInput.inputValue() === "dan's remote", "An open viewer must discover a newly registered remote device automatically.");

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
    await instructionModal.locator('[data-unique-name-required-close]').click();
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "dan's remote"
    ));
    assert(await remoteScreenInput.inputValue() === "dan's remote", "Closing the instruction modal must discover and fill the newly registered remote device.");
  } finally {
    await browser.close();
  }
}

async function verifyViewerClearsReleasedRemoteDevice() {
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
          body: JSON.stringify({ ok: true, remote_display_device: null })
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
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => { card.hidden = false; });
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    const remoteScreenInput = page.locator('[data-remote-viewer-partner]');
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "Recognized Remote Device name needed. Click GO."
    ));
    assert(
      await remoteScreenInput.inputValue() === "Recognized Remote Device name needed. Click GO.",
      "A viewer must clear a remote device that was released by reset."
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
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => { card.hidden = false; });
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await page.locator('[data-remote-view-mode-open]').evaluate((button) => button.click());
    await page.locator('[data-remote-view-mode-card="remote-device"]').evaluate((button) => button.click());
    await page.locator('[data-remote-viewer-remote-screen-options]').waitFor({ state: "visible" });
    await page.locator('[data-remote-viewer-remote-screen-options] .remote-viewer-experience-option').filter({ hasText: "Practice and save results" }).evaluate((label) => label.click());
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}").remoteViewerExperienceMode === "practice-saved");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => { card.hidden = false; });
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
  } finally {
    await browser.close();
  }
}

function verifyPersistentRemoteDisplayImplementation() {
  const launcherSource = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.js"), "utf8");
  const launcherMarkup = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.html"), "utf8");
  const launcherStyles = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.css"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "telepathy.js"), "utf8");

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
    runtimeSource.includes("function showRemoteDisplayStandbyState()"),
    "Remote display standby state is missing."
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
}

Promise.all([verifyRemoteScreenUi(), verifyRemoteDeviceRoute(), verifyRemoteDevicePersistence(), verifyViewerDiscoversRemoteDeviceAfterModal(), verifyViewerClearsReleasedRemoteDevice(), verifyRemoteScreenSettingsPersistAcrossReload()])
  .then(() => {
    verifyPersistentRemoteDisplayImplementation();
    console.log("Remote Screen and remote-device setup UI verified.");
  })
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
