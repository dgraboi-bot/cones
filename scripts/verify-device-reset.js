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
    assert(await resetButton.isVisible(), "Other Functions must expose RESET THIS DEVICE.");
    assert(await resetButton.getAttribute("data-tooltip"), "RESET THIS DEVICE must explain its effect.");

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
    page.once("dialog", (dialog) => dialog.dismiss());
    await resetButton.click();
    const remoteSetup = await page.evaluate((key) => localStorage.getItem(key), remoteSetupKey);
    assert(remoteSetup !== null, "Device reset must not clear a remote-device registration.");
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
