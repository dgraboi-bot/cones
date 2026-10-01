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

async function verifyCoveredScreenLaunch() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);

  try {
    await page.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        entryMode: "visitor",
        remoteViewerSimulationMode: "covered-screen"
      }));
    }, { key: launcherStorageKey });
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });
    await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
      card.hidden = false;
    });
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    const ownInput = page.locator('[data-remote-viewer-own]');
    assert(await ownInput.inputValue() === "Anonymous Visitor", "Clairvoyance visitor name was not populated.");

    await page.locator('[data-remote-viewer-go]').evaluate((button) => button.click());
    const modal = page.locator('[data-covered-screen-instruction-overlay]');
    await modal.waitFor({ state: "visible" });
    assert(await modal.locator("h2").textContent() === "Covered Screen", "Covered Screen instructions did not open.");
    const checkbox = modal.locator('[data-covered-screen-instruction-checkbox]');
    await checkbox.click();
    assert(await checkbox.isChecked(), "Covered Screen instruction checkbox did not respond.");

    await modal.getByRole("button", { name: "OK" }).click();
    await page.waitForURL(/receiver\.html/);
    await page.locator("#guidedTourOverlay").waitFor({ state: "visible" });
    assert(
      (await page.locator("#guidedTourCopy").textContent()).includes("Sender has not yet pressed his GO button"),
      "Anonymous Covered Screen tour was not started."
    );
  } finally {
    await browser.close();
  }
}

function verifyRuntimeGuards() {
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "telepathy.js"), "utf8");
  const launcherSource = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.js"), "utf8");
  assert(
    runtimeSource.includes("coveredScreenInstructionOverlay?.contains(target)"),
    "Guided-tour click guard must allow the Covered Screen instruction controls to receive input."
  );
  assert(
    runtimeSource.includes("This is the time to be clairvoyantly viewing new visual information in your mind's eye."),
    "Covered Screen guided-tour wording is missing."
  );
  assert(
    runtimeSource.includes("Continue Session") && runtimeSource.includes("End Session"),
    "Covered Screen result guidance is missing."
  );
  assert(
    launcherSource.includes('normalizedRole === "sender" || normalizedRole === "remote-viewer"'),
    "Clairvoyance exercise explanations must not be replaced by the timed fallback message."
  );
  assert(
    /if \(coveredScreenMode\) \{\s+const confirmed = await confirmCoveredScreenInstructionBeforeLaunch\(\);/.test(launcherSource),
    "Anonymous Covered Screen tours must display the instruction modal before launch."
  );
}

Promise.resolve()
  .then(verifyRuntimeGuards)
  .then(verifyCoveredScreenLaunch)
  .then(() => console.log("Clairvoyance Covered Screen guided-tour flow verified."))
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
