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
    const explanation = page.locator('[data-role-identifier-note="remote-viewer"]');
    await page.waitForFunction(() => {
      const note = document.querySelector('[data-role-identifier-note="remote-viewer"]');
      return note?.textContent?.includes("In Exercise 1");
    });
    await page.locator('[data-role-difficulty-bump="remote-viewer"][data-direction="up"]').evaluate((button) => button.click());
    await page.waitForFunction(() => {
      const note = document.querySelector('[data-role-identifier-note="remote-viewer"]');
      return note?.textContent?.includes("In Exercise 2");
    });
    await page.waitForTimeout(3200);
    assert((await explanation.textContent()).includes("In Exercise 2"), "Clairvoyance exercise explanation timed out.");

    await page.locator('[data-remote-viewer-go]').evaluate((button) => button.click());
    const modal = page.locator('[data-covered-screen-instruction-overlay]');
    await modal.waitFor({ state: "visible" });
    assert(await modal.locator("h2").textContent() === "Covered Screen", "Covered Screen instructions did not open.");
    const checkbox = modal.locator('[data-covered-screen-instruction-checkbox]');
    await checkbox.click();
    assert(await checkbox.isChecked(), "Covered Screen instruction checkbox did not respond.");

    const okButton = modal.getByRole("button", { name: "OK" });
    const okButtonStyle = await okButton.evaluate((button) => ({
      className: button.className,
      cursor: getComputedStyle(button).cursor
    }));
    assert(
      okButtonStyle.className.includes("covered-screen-instruction-ok"),
      "Covered Screen acknowledgement is missing its standard action-button style."
    );
    assert(okButtonStyle.cursor === "pointer", "Covered Screen acknowledgement does not use the hand cursor.");

    await okButton.click();
    await page.waitForURL(/receiver\.html/);
    await page.locator("#guidedTourOverlay").waitFor({ state: "visible" });
    assert(
      (await page.locator("#guidedTourCopy").textContent()).includes("Tap the message below when you are ready to begin receiving."),
      "Anonymous Covered Screen tour did not begin at the ready prompt."
    );
    assert(await page.locator("#countdownNumber").textContent() === "Press when ready.", "Covered Screen tour did not reach the ready prompt.");
    assert(await page.locator("#guidedTourNextButton").isHidden(), "Covered Screen preparation should not require a NEXT acknowledgement.");

  } finally {
    await browser.close();
  }
}

function verifyRuntimeGuards() {
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "telepathy.js"), "utf8");
  const runtimeStyles = fs.readFileSync(path.join(__dirname, "..", "telepathy.css"), "utf8");
  const launcherSource = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.js"), "utf8");
  assert(
    runtimeSource.includes("coveredScreenInstructionOverlay?.contains(target)"),
    "Guided-tour click guard must allow the Covered Screen instruction controls to receive input."
  );
  assert(
    runtimeSource.includes("You are assumed to have covered the screen with a piece of cloth or cardboard so as to hide this image.") &&
      runtimeSource.includes("that information might have appeared to you before the image actually displayed!"),
    "Covered Screen guided-tour wording is missing."
  );
  assert(
    runtimeSource.includes("guidedReceiverTourBalloonDragSuppressClickUntil") &&
      runtimeSource.includes("event.stopImmediatePropagation()"),
    "Dragging a guided-tour panel must not activate a tour button on release."
  );
  assert(
    runtimeSource.includes("This also blocks Covered Screen's underlying \"tap anywhere\" completion handler."),
    "Guided-tour steps must block blank-screen clicks from advancing Covered Screen trials."
  );
  assert(
    runtimeSource.includes('placement: "stage-below-choice-grid"') &&
      runtimeSource.includes('case "stage-below-choice-grid"'),
    "Guided-tour choice instructions must be positioned below the active choice grid."
  );
  assert(
    runtimeSource.includes("Tap the message below when you are ready to begin receiving."),
    "Covered Screen tour must begin at the ready prompt."
  );
  assert(
    runtimeSource.includes("Continue Session") && runtimeSource.includes("End Session"),
    "Covered Screen result guidance is missing."
  );
  assert(
    runtimeSource.includes("covered-screen-runtime-instruction-ok"),
    "Runtime Covered Screen acknowledgement is missing its standard action-button class."
  );
  assert(
    runtimeSource.includes("[data-covered-screen-runtime-instruction-overlay]"),
    "Covered Screen tap-to-clear handling must not intercept the in-session instruction modal."
  );
  assert(
    runtimeSource.includes('overlay.addEventListener("pointerdown"') && runtimeSource.includes('overlay.addEventListener("click"'),
    "In-session Covered Screen controls must isolate their input from runtime-level handlers."
  );
  assert(
    runtimeStyles.includes(".covered-screen-runtime-instruction-backdrop") &&
      runtimeStyles.includes(".covered-screen-runtime-instruction-checkbox") &&
      runtimeStyles.includes(".covered-screen-runtime-instruction-ok") &&
      runtimeStyles.includes("pointer-events: auto"),
    "In-session Covered Screen controls must remain interactive above the runtime screen."
  );
  assert(
    launcherSource.includes('normalizedRole === "sender" || normalizedRole === "remote-viewer"'),
    "Clairvoyance exercise explanations must not be replaced by the timed fallback message."
  );
  assert(
    launcherSource.includes('String(role || "").trim() === "remote-viewer"'),
    "Clairvoyance explanation clearing must remain disabled."
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
