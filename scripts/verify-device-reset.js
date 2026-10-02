const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";
const launcherStorageKey = "cones-beginner-launcher-v2";
const remoteSetupKey = "cones-remote-display-setup-v1";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function showOtherFunctionsForTest(page) {
  await page.locator('[data-view="other-settings"]').evaluate((view) => {
    view.classList.remove("beginner-view-hidden");
  });
}

async function verifyDeviceReset() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "molly",
        ownNames: { receiver: "molly" }
      }));
      localStorage.setItem("reset-test-marker", "remove-me");
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    await showOtherFunctionsForTest(page);
    const resetButton = page.locator('[data-reset-this-device]');
    assert(await resetButton.isVisible(), "Other Functions must expose Reset This Device.");
    assert((await resetButton.textContent()).trim() === "Reset This Device", "The device reset button must use the standard mixed-case menu label.");
    assert(await resetButton.getAttribute("data-tooltip"), "Reset This Device must explain its effect.");

    page.once("dialog", (dialog) => dialog.accept());
    await Promise.all([
      page.waitForURL((url) => new URL(url).searchParams.get("open") === "landing"),
      resetButton.click()
    ]);

    await page.locator('[data-view="temporary-home-page"]').waitFor({ state: "visible" });
    const resetState = await page.evaluate(({ key }) => ({
      launcher: JSON.parse(localStorage.getItem(key) || "{}"),
      marker: localStorage.getItem("reset-test-marker"),
      remoteSetup: localStorage.getItem("cones-remote-display-setup-v1")
    }), { key: launcherStorageKey });
    assert(!resetState.launcher.recognizedIdentity, "Device reset must remove the prior launcher identity.");
    assert(resetState.launcher.entryMode === "visitor", "Device reset must create a fresh anonymous visitor state.");
    assert(resetState.marker === null, "Device reset must clear browser-local ESP GYM state.");
    assert(resetState.remoteSetup === null, "A normal device reset must leave no remote-device local setup.");
  } finally {
    await browser.close();
  }
}

async function verifyRemoteDeviceSafeguard() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    await page.goto(`${baseUrl}?open=launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify({ entryMode: "visitor" }));
      localStorage.setItem("cones-remote-display-setup-v1", JSON.stringify({
        ownerName: "molly",
        deviceName: "molly remote",
        controlToken: "a".repeat(64)
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });
    await showOtherFunctionsForTest(page);

    const resetButton = page.locator('[data-reset-this-device]');
    await resetButton.click();
    const resetChoice = page.locator('[data-device-reset-choice-overlay]');
    await resetChoice.waitFor({ state: "visible" });
    assert(await resetChoice.locator('[data-device-reset-remote]').isVisible(), "A remote device must offer a safe remote reset path.");
    assert(await resetChoice.locator('[data-device-reset-keep-remote]').isVisible(), "A remote device must allow its remote-display status to remain intentionally.");
    await resetChoice.locator('[data-device-reset-cancel]').click();
    const remoteSetup = await page.evaluate((key) => localStorage.getItem(key), remoteSetupKey);
    assert(remoteSetup !== null, "Device reset must not clear a remote-device registration.");

    await resetButton.click();
    await Promise.all([
      page.waitForURL((url) => new URL(url).searchParams.get("open") === "landing"),
      resetChoice.locator('[data-device-reset-keep-remote]').click()
    ]);
    const retainedState = await page.evaluate(({ launcherKey, remoteSetupKey }) => ({
      launcher: JSON.parse(localStorage.getItem(launcherKey) || "{}"),
      remoteSetup: JSON.parse(localStorage.getItem(remoteSetupKey) || "null")
    }), { launcherKey: launcherStorageKey, remoteSetupKey });
    assert(retainedState.launcher.entryMode === "visitor", "Keeping the remote device must still reset the normal app to a visitor state.");
    assert(retainedState.remoteSetup?.ownerName === "molly", "Keeping the remote device must preserve its owner registration.");
    assert(retainedState.remoteSetup?.deviceName === "molly remote", "Keeping the remote device must preserve its remote-device name.");
  } finally {
    await browser.close();
  }
}

Promise.all([verifyDeviceReset(), verifyRemoteDeviceSafeguard()])
  .then(() => console.log("User-facing device reset verified."))
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
