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
      await page.locator('[data-remote-viewer-partner]').inputValue() === "Recognized Remote Device name needed. Click GO.",
      "A Remote Screen must initially guide the viewer to set up a remote device."
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

    await page.locator('[data-remote-viewer-display-device]').evaluate((input) => input.click());
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-own]')?.value === "Anonymous Remote Device"
    ));
    assert(
      await page.locator('[data-remote-viewer-go]').evaluate((button) => getComputedStyle(button).gridColumn === "2"),
      "Remote Screen GO must use the compact lower-right grid position."
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

function verifyPersistentRemoteDisplayImplementation() {
  const launcherSource = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "telepathy.js"), "utf8");

  assert(
    !launcherSource.includes('remoteDeviceConfirmButton?.dataset.ready !== "true"'),
    "Remote setup must not require a second OK click after CONFIRM."
  );
  assert(
    launcherSource.includes('remoteDeviceSetupStatus.textContent = "Opening remote display standby..."'),
    "CONFIRM must immediately enter remote-display standby."
  );
  assert(
    runtimeSource.includes("function showRemoteDisplayStandbyState()"),
    "Remote display standby state is missing."
  );
  assert(
    runtimeSource.includes("if (isRemoteDisplayMode) {\n      showRemoteDisplayStandbyState();\n      return;"),
    "A completed remote session must return the display to standby instead of the launcher."
  );
}

Promise.all([verifyRemoteScreenUi(), verifyRemoteDeviceRoute()])
  .then(() => {
    verifyPersistentRemoteDisplayImplementation();
    console.log("Remote Screen and remote-device setup UI verified.");
  })
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
