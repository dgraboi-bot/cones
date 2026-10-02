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

    await page.locator('[data-remote-viewer-display-device]').evaluate((input) => input.click());
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-own]')?.value === "Anonymous Remote Device"
    ));
    assert(
      await page.locator('[data-remote-viewer-go]').evaluate((button) => getComputedStyle(button).gridColumn === "2"),
      "Remote Screen GO must use the compact lower-right grid position."
    );

    // With no remote-device name entered, the control remains device-local.
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

verifyRemoteScreenUi()
  .then(() => console.log("Remote Screen visual-only UI verified."))
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
