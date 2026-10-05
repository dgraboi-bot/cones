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

async function assertLoadedTargetImage(locator, message) {
  await locator.waitFor({ state: "visible" });
  const imageState = await locator.evaluate((image) => ({
    src: image.getAttribute("src") || "",
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight
  }));
  assert(
    imageState.src.includes("imagepairs/") &&
      imageState.complete &&
      imageState.naturalWidth > 0 &&
      imageState.naturalHeight > 0,
    `${message}: ${JSON.stringify(imageState)}`
  );
}

async function verifyCoveredScreenLaunch() {
  const browser = await chromium.launch({ headless: true });
  const androidContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"
  });
  const page = await androidContext.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(20000);

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
    const tourOption = page.locator('[data-remote-viewer-experience="tour"]');
    const unsavedOption = page.locator('[data-remote-viewer-experience="practice-unsaved"]');
    const saveOption = page.locator('[data-remote-viewer-experience="practice-saved"]');
    const goButton = page.locator('[data-remote-viewer-go]');
    assert(await tourOption.isChecked(), "Anonymous Covered Screen use must default to a tour.");
    assert(await saveOption.isDisabled(), "Anonymous visitors must not be able to select saved results.");
    assert(
      (await goButton.getAttribute("title")) === "Press the GO button to start a tour of this exercise.",
      "Anonymous tour tooltip is incorrect."
    );
    await unsavedOption.evaluate((input) => input.click());
    assert(
      (await goButton.getAttribute("title")) === "Press the GO button to start practicing this exercise without saving results.",
      "Unsaved-practice tooltip is incorrect."
    );
    await page.locator('[data-remote-viewer-save-option]').dispatchEvent("pointerenter");
    const saveResultsHint = page.locator('[data-remote-viewer-save-results-hint]');
    await saveResultsHint.waitFor({ state: "visible" });
    assert(
      (await saveResultsHint.textContent()).includes("Results are saved after you claim a unique name for yourself."),
      "Anonymous saved-results explanation is missing."
    );
    assert(
      !(await saveResultsHint.evaluate((hint) => hint.closest('[aria-modal="true"]'))),
      "Anonymous saved-results hint must not be modal."
    );
    const radioSizes = await page.locator('[data-remote-viewer-experience]').evaluateAll((inputs) =>
      inputs.map((input) => {
        const rect = input.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    );
    assert(
      radioSizes.every((size) => size.width === radioSizes[0].width && size.height === radioSizes[0].height),
      "All Clairvoyance experience radio controls must have the same size."
    );
    await page.waitForTimeout(250);
    assert(!(await saveResultsHint.evaluate((hint) => hint.hidden)), "Anonymous saved-results hint should remain until dismissed.");
    await saveResultsHint.locator('[data-remote-viewer-save-results-cancel]').evaluate((button) => button.click());
    assert(await saveResultsHint.isHidden(), "Cancel must dismiss the anonymous saved-results hint.");
    await saveResultsHint.evaluate((hint) => {
      hint.hidden = false;
      hint.setAttribute("aria-hidden", "false");
    });
    await saveResultsHint.locator('[data-remote-viewer-save-results-claim]').evaluate((button) => button.click());
    const handleOverlay = page.locator('[data-handle-overlay]');
    await handleOverlay.waitFor({ state: "visible" });
    await handleOverlay.locator('[data-close-handle]').click();
    assert(
      await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => card.classList.contains("active")),
      "Cancelling the unique-name claim must return to the expanded Clairvoyance panel."
    );
    await tourOption.evaluate((input) => input.click());
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
    assert(
      (await modal.locator('[data-covered-screen-instruction-copy]').textContent()) === "COVER THE SCREEN DURING THE COUNTDOWN FROM SEVEN TO ONE.\n\nWHEN READY, BEFORE YOU REMOVE THE COVER, PRESS A KEY OR TAP AN EXPOSED PART OF THE SCREEN TO REMOVE THE HIDDEN IMAGE.",
      "Covered Screen instructions do not use the approved wording."
    );
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
      (await page.locator("#guidedTourCopy").textContent()).includes("Tap the message below when you are ready to cover the screen during the countdown before something will be displayed on it."),
      "Anonymous Covered Screen tour did not begin at the ready prompt."
    );
    assert(await page.locator("#countdownNumber").textContent() === "Press when ready.", "Covered Screen tour did not reach the ready prompt.");
    assert(await page.locator("#guidedTourNextButton").isHidden(), "Covered Screen preparation should not require a NEXT acknowledgement.");

    await page.locator("#countdownBox").click();
    await page.waitForFunction(() => document.querySelector("#guidedTourCopy")?.textContent?.startsWith("At the end of the countdown"));
    const coveredTargetImage = page.locator("#receiverImageDisplayPanel.visible .image-display-asset");
    await assertLoadedTargetImage(
      coveredTargetImage,
      "Exercise 2 on Android must reveal a decoded target image after the countdown"
    );
    const guidedTargetSrc = await coveredTargetImage.getAttribute("src");
    await page.locator("#guidedTourNextButton").click();
    await page.waitForFunction(() => document.querySelector("#guidedTourCopy")?.textContent?.startsWith("Look into your mind's eye carefully"));
    const probeButton = page.locator("#guidedTourProbeButton");
    const probeTooltip = "Knowing more about how this skill works can help you improve";
    assert(await probeButton.getAttribute("data-tooltip") === probeTooltip, "Probe Deeper tooltip text is incorrect.");
    assert(await probeButton.getAttribute("title") === null, "Probe Deeper must not show a second browser-native tooltip.");
    await probeButton.hover();
    await page.waitForTimeout(160);
    const probeTooltipStyle = await probeButton.evaluate((button) => {
      const tooltip = getComputedStyle(button, "::after");
      return { opacity: Number.parseFloat(tooltip.opacity), top: tooltip.top, bottom: tooltip.bottom };
    });
    assert(probeTooltipStyle.opacity > 0.95, "Probe Deeper instant tooltip did not appear on hover.");
    assert(
      Number.parseFloat(probeTooltipStyle.bottom) > 0 && Number.parseFloat(probeTooltipStyle.top) < 0,
      `Probe Deeper tooltip must appear above its button: ${JSON.stringify(probeTooltipStyle)}`
    );
    await probeButton.click();
    const probeScreen = page.locator("#guidedTourProbeScreen");
    await probeScreen.waitFor({ state: "visible" });
    await probeScreen.locator("[data-probe-topic-open]").first().click();
    assert(await probeScreen.locator("h3").first().textContent() === "A Peaceful Environment", "Probe Deeper OPEN did not show its selected topic.");
    assert(
      (await page.locator("#guidedTourCopy").textContent()).startsWith("Look into your mind's eye carefully"),
      "Probe Deeper OPEN incorrectly advanced the underlying guided tour."
    );

    await page.locator("#guidedTourProbeBackButton").click();
    await page.locator("#guidedTourProbeBackButton").click();
    await probeScreen.waitFor({ state: "hidden" });

    // Finish a real touch-guided Exercise 2 round and verify that its result
    // action cannot be swallowed by the guided-tour input guard.
    await page.locator("#guidedTourNextButton").tap();
    await page.waitForFunction(() => document.querySelector("#guidedTourCopy")?.textContent?.startsWith("After you have had enough time"));
    await page.locator("#countdownBox").tap();
    const guidedRoundChoices = page.locator("#receiverLevelFourChoiceGrid.visible .image-choice-card");
    await guidedRoundChoices.first().waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector("#guidedTourCopy")?.textContent?.startsWith("For this tour, tap the highlighted correct answer"));
    const guidedCorrectChoice = page.locator("#receiverLevelFourChoiceGrid.visible .image-choice-card.guided-tour-runtime-allowed");
    assert(await guidedCorrectChoice.count() === 1, "The guided Exercise 2 target did not match exactly one choice.");
    assert(
      await guidedCorrectChoice.locator("img").getAttribute("src") === guidedTargetSrc,
      "The guide marked an image other than the displayed Exercise 2 target as correct."
    );
    const guidedChoiceHitTarget = await guidedCorrectChoice.evaluate((choice) => {
      const rect = choice.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        reachesChoice: hit === choice || choice.contains(hit),
        hitId: hit?.id || "",
        hitClass: hit?.className || ""
      };
    });
    assert(guidedChoiceHitTarget.reachesChoice, `The guided Exercise 2 target is covered: ${JSON.stringify(guidedChoiceHitTarget)}`);
    await guidedCorrectChoice.tap();
    const guidedContinueButton = page.getByRole("button", { name: "Continue Session" });
    await guidedContinueButton.waitFor({ state: "visible" });
    await guidedContinueButton.tap();
    const continuedGuidedInstruction = page.locator("[data-covered-screen-runtime-instruction-overlay]");
    if (await continuedGuidedInstruction.isVisible()) {
      assert(
        (await continuedGuidedInstruction.locator('[data-covered-screen-runtime-instruction-copy]').textContent()) === "COVER THE SCREEN DURING THE COUNTDOWN FROM SEVEN TO ONE.\n\nWHEN READY, BEFORE YOU REMOVE THE COVER, PRESS A KEY OR TAP AN EXPOSED PART OF THE SCREEN TO REMOVE THE HIDDEN IMAGE.",
        "In-session Covered Screen instructions do not use the approved wording."
      );
      await continuedGuidedInstruction.getByRole("button", { name: "OK" }).tap();
    }
    await page.waitForFunction(() => document.querySelector("#countdownNumber")?.textContent === "Press when ready.");
    assert(
      await page.locator("#receiverDecisionPanel").isHidden(),
      "Guided Continue Session must leave the Exercise 2 result choices instead of freezing on them."
    );
    assert(
      await page.locator("#guidedTourOverlay").isHidden(),
      "Guided Continue Session must clear the result guide before returning to Press when ready."
    );

    const freshSessionAndroidContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"
    });
    const unsavedPage = await freshSessionAndroidContext.newPage();
    unsavedPage.setDefaultTimeout(20000);
    unsavedPage.setDefaultNavigationTimeout(20000);
    await unsavedPage.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
    await unsavedPage.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        entryMode: "visitor",
        remoteViewerSimulationMode: "covered-screen"
      }));
      sessionStorage.setItem("cones-covered-screen-instruction-dismiss-v1", "1");
    }, { key: launcherStorageKey });
    await unsavedPage.reload({ waitUntil: "domcontentloaded" });
    await unsavedPage.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });
    await unsavedPage.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
      card.hidden = false;
    });
    await unsavedPage.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    await unsavedPage.locator('[data-remote-viewer-experience="practice-unsaved"]').evaluate((input) => input.click());
    await unsavedPage.locator('[data-role-difficulty-bump="remote-viewer"][data-direction="up"]').evaluate((button) => button.click());
    await unsavedPage.waitForFunction(() => (
      document.querySelector('[data-role-identifier-note="remote-viewer"]')?.textContent?.includes("In Exercise 2")
    ));
    const unsavedLaunchUrls = [];
    unsavedPage.on("framenavigated", (frame) => {
      if (frame === unsavedPage.mainFrame()) {
        unsavedLaunchUrls.push(frame.url());
      }
    });
    await unsavedPage.locator('[data-remote-viewer-go]').evaluate((button) => button.click());
    const newSessionInstruction = unsavedPage.locator('[data-covered-screen-instruction-overlay]');
    await newSessionInstruction.waitFor({ state: "visible" });
    assert(
      await unsavedPage.evaluate(() => sessionStorage.getItem("cones-covered-screen-instruction-dismiss-v1") === null),
      "A new Covered Screen session must clear an earlier session-only acknowledgement dismissal."
    );
    const newSessionCheckbox = newSessionInstruction.locator('[data-covered-screen-instruction-checkbox]');
    await newSessionCheckbox.check();
    assert(
      await newSessionCheckbox.isChecked(),
      "The Covered Screen instruction acknowledgement must retain its in-session dismissal choice."
    );
    await newSessionInstruction.getByRole("button", { name: "OK" }).click();
    await unsavedPage.waitForURL(/receiver\.html/);
    const unsavedLaunchUrl = unsavedLaunchUrls.find((url) => url.includes("receiver.html?")) || "";
    assert(unsavedLaunchUrl.includes("save_results=0"), `Unsaved practice must explicitly disable result storage at launch: ${unsavedLaunchUrl}`);
    assert(!unsavedLaunchUrl.includes("guided_tour="), "Unsaved practice must not be converted into a guided tour.");
    await unsavedPage.waitForFunction(() => (
      document.querySelector("#countdownNumber")?.textContent === "Press when ready."
    ));
    await unsavedPage.locator("#countdownBox").click();
    const secondSessionTargetImage = unsavedPage.locator("#receiverImageDisplayPanel.visible .image-display-asset");
    await assertLoadedTargetImage(
      secondSessionTargetImage,
      "A new Android Exercise 2 session must display a decoded target image after the countdown"
    );

    // The acknowledgement stays suppressed only for this one run.  A second
    // trial must still display its next Exercise 2 target after Continue Session.
    await unsavedPage.locator("#receiverImageDisplayPanel").click();
    const firstRoundChoices = unsavedPage.locator("#receiverLevelFourChoiceGrid.visible .image-choice-card");
    await firstRoundChoices.first().waitFor({ state: "visible" });
    await firstRoundChoices.first().click();
    const continueSessionButton = unsavedPage.getByRole("button", { name: "Continue Session" });
    await continueSessionButton.waitFor({ state: "visible" });
    const decisionHitTarget = await continueSessionButton.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return hit === button || button.contains(hit);
    });
    assert(decisionHitTarget, "The Android Continue Session button is covered by another element.");
    await continueSessionButton.tap();
    await unsavedPage.waitForFunction(() => (
      document.querySelector("#countdownNumber")?.textContent === "Press when ready."
    ));
    // Wait past the regular heartbeat. Before the regression fix, it hid the
    // prompt and left Android on a blank screen before a human could tap it.
    await unsavedPage.waitForTimeout(1500);
    assert(
      await unsavedPage.locator("#countdownBox").isVisible() &&
        (await unsavedPage.locator("#countdownNumber").textContent()) === "Press when ready.",
      "Continue Session must keep the Covered Screen ready prompt visible through the next heartbeat."
    );
    await unsavedPage.locator("#countdownBox").click();
    const continuedSessionTargetImage = unsavedPage.locator("#receiverImageDisplayPanel.visible .image-display-asset");
    await assertLoadedTargetImage(
      continuedSessionTargetImage,
      "A continued Android Exercise 2 trial must display a decoded target image after the countdown"
    );
    await freshSessionAndroidContext.close();

    const recognizedPage = await browser.newPage();
    recognizedPage.setDefaultTimeout(20000);
    await recognizedPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await recognizedPage.evaluate(({ key }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({
        recognizedIdentity: "Local Test User",
        ownNames: { "remote-viewer": "Local Test User" },
        remoteViewerSimulationMode: "covered-screen"
      }));
    }, { key: launcherStorageKey });
    await recognizedPage.reload({ waitUntil: "domcontentloaded" });
    await recognizedPage.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });
    await recognizedPage.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
      card.hidden = false;
    });
    await recognizedPage.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    const recognizedSaveOption = recognizedPage.locator('[data-remote-viewer-experience="practice-saved"]');
    assert(await recognizedSaveOption.isChecked(), "Recognized users must default to saved Clairvoyance practice.");
    assert(!(await recognizedSaveOption.isDisabled()), "Recognized users must be able to choose saved Clairvoyance practice.");
    assert(
      (await recognizedPage.locator('[data-remote-viewer-go]').getAttribute("title")) === "Press the GO button to start practicing this exercise and saving your results.",
      "Recognized saved-practice tooltip is incorrect."
    );
    const recognizedSetupPrompt = recognizedPage.locator('[data-role-setup-wrap="remote-viewer"]');
    await recognizedSetupPrompt.waitFor({ state: "visible" });
    await recognizedPage.locator('[data-remote-viewer-experience="practice-unsaved"]').evaluate((input) => input.click());
    assert(await recognizedSetupPrompt.isVisible(), "Changing a Clairvoyance experience must not hide the optional setup link.");
    await recognizedPage.close();

  } finally {
    await androidContext.close();
    await browser.close();
  }
}

async function verifyPostTourModeControl() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(20000);

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
    await page.goto(
      `${baseUrl}?open=remote-viewer&direct_open=1&guided_tour_complete=1&guided_tour_continue=receiver-experience&own_email=Anonymous%20Visitor&partner_email=Robot&visitor_display_name=Anonymous%20Visitor&difficulty_level=2`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForFunction(() => (
      document.querySelector('[data-role-card="remote-viewer"]')?.classList.contains("active")
    ));
    assert(
      await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => card.classList.contains("active")),
      "A completed Clairvoyance tour must return to the expanded Clairvoyance panel."
    );
    await page.locator("[data-remote-view-mode-open]").click();
    assert(
      await page.locator("[data-remote-view-mode-overlay]").evaluate((overlay) => !overlay.classList.contains("beginner-view-hidden")),
      "Set Mode must remain usable while the post-tour completion notice is visible."
    );
    await page.locator('[data-remote-view-mode-card="remote-device"]').click();
    assert(
      (await page.locator("[data-remote-view-mode-status]").textContent()).includes("Remote Screen"),
      "The post-tour completion notice must not block choosing Remote Screen."
    );
    await page.locator("[data-remote-viewer-go]").click();
    const claimOverlay = page.locator("[data-handle-overlay]");
    await claimOverlay.waitFor({ state: "visible" });
    await claimOverlay.locator("[data-close-handle]").click();
    await claimOverlay.waitFor({ state: "hidden" });
  } finally {
    await browser.close();
  }
}

async function verifyRemoteScreenRequiredNames() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(20000);

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
    await page.locator("[data-remote-view-mode-open]").evaluate((button) => button.click());
    await page.locator('[data-remote-view-mode-card="remote-device"]').evaluate((button) => button.click());

    assert(
      await page.locator("[data-remote-viewer-own]").inputValue() === "Recognized Unique Name required. Click GO.",
      "An unrecognized Remote Screen viewer must be directed to claim a unique name."
    );
    assert(
      await page.locator("[data-remote-viewer-partner]").inputValue() === "Recognized Remote Device name needed. Click GO.",
      "An unknown Remote Screen device must be identified clearly."
    );

    await page.locator("[data-remote-viewer-go]").evaluate((button) => button.click());
    const claimOverlay = page.locator("[data-handle-overlay]");
    await claimOverlay.waitFor({ state: "visible" });
    assert(
      await claimOverlay.locator("#handleDialogTitle").textContent() === "Choose Unique Name For Use With This Browser",
      "Remote Screen name claiming must use the Clairvoyance-specific claim title."
    );
    assert(
      (await claimOverlay.locator("[data-handle-intro]").textContent()).includes("recognized user for all Clairvoyance / Remote Viewing exercises"),
      "Remote Screen name claiming must explain its Clairvoyance purpose."
    );
    assert(
      Number(await claimOverlay.evaluate((overlay) => getComputedStyle(overlay).zIndex)) > 90,
      "The name-claim modal must remain above guided-tour content."
    );
  } finally {
    await browser.close();
  }
}

function verifyRuntimeGuards() {
  const runtimeSource = fs.readFileSync(path.join(__dirname, "..", "telepathy.js"), "utf8");
  const runtimeStyles = fs.readFileSync(path.join(__dirname, "..", "telepathy.css"), "utf8");
  const receiverMarkup = fs.readFileSync(path.join(__dirname, "..", "receiver.html"), "utf8");

  assert(
    receiverMarkup.includes('<div class="countdown-box hidden" id="countdownBox"'),
    "Receiver startup must keep its generic waiting placeholder hidden until the runtime selects a meaningful prompt."
  );
  const launcherSource = fs.readFileSync(path.join(__dirname, "..", "telepathybeginner.js"), "utf8");
  assert(
    launcherSource.includes('"practice-unsaved"') &&
      launcherSource.includes('"practice-saved"'),
    "Clairvoyance must offer distinct tour, unsaved-practice, and saved-practice choices."
  );
  assert(
    runtimeSource.includes('const shouldSaveResults = String(runtimeQuery.get("save_results") || "1").trim() !== "0"') &&
      runtimeSource.includes("!shouldSaveResults || isGuidedExperienceTour"),
    "Unsaved Clairvoyance practice must be blocked at both trial-record storage paths."
  );
  assert(
    runtimeSource.includes("coveredScreenInstructionOverlay?.contains(target)"),
    "Guided-tour click guard must allow the Covered Screen instruction controls to receive input."
  );
  assert(
    runtimeSource.includes("You are assumed to have covered the screen with a piece of cloth or cardboard to hide this image.") &&
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
    runtimeSource.includes("keepSelectionNodesBright: true") &&
      runtimeSource.includes("step?.keepSelectionNodesBright && selectionNodes.has(node)"),
    "Guided-tour answer choices must remain visible while input stays locked."
  );
  assert(
    launcherSource.includes('document.documentElement.classList.add("launcher-direct-open-pending")'),
    "Covered Screen acknowledgement must hide the launcher before navigating to the trial."
  );
  assert(
    launcherSource.includes("coveredScreenInstructionOverlay?.contains(target)"),
    "The completed-tour click guard must allow the next Covered Screen acknowledgement."
  );
  assert(
    runtimeSource.includes('postRound.resolved === "end" && isGuidedExperienceTour'),
    "Completed guided tours must return without briefly redrawing the choice stage."
  );
  assert(
    runtimeSource.includes("Tap the message below when you are ready to cover the screen during the countdown before something will be displayed on it."),
    "Covered Screen tour must begin at the ready prompt."
  );
  assert(
    runtimeSource.includes("isRemoteViewerCoveredMode && isGuidedReceiverTour") &&
      runtimeSource.includes("hideCountdown();"),
    "Covered Screen guided tours must hide the transient preparation prompt."
  );
  assert(
    runtimeSource.includes("Continue Session") && runtimeSource.includes("End Session"),
    "Covered Screen result guidance is missing."
  );
  assert(
    runtimeSource.includes("whatever manifested in your mind's eye about the time that the beep occurred.\""),
    "Clairvoyance observation guidance must end at the beep-time instruction."
  );
  assert(
    !runtimeSource.includes("This is your task."),
    "Clairvoyance observation guidance must not include the redundant task sentence."
  );
  assert(
    runtimeSource.includes("tap anywhere on the screen or press a key to say you are done viewing clairvoyantly") &&
      runtimeSource.includes("allowed: isRemoteViewerCoveredMode ? [document.body] : [countdownBox]"),
    "Covered Screen tours must allow a click anywhere on the available screen to finish viewing."
  );
  assert(
    runtimeSource.includes("Tap an available space on the screen or press a key to continue."),
    "Covered Screen's viewing prompt must explain both available completion actions."
  );
  assert(
    runtimeSource.includes("guidedTourProbeScreen?.contains(target)"),
    "Probe Deeper interactions must not reach Covered Screen's underlying completion handler."
  );
  assert(
    runtimeSource.includes("event.stopPropagation();") && runtimeSource.includes("Rendering a selected topic replaces this button"),
    "Probe Deeper topic navigation must stop its click before the runtime redraws the selected topic."
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
    launcherSource.includes('["receiver", "sender", "remote-viewer"].includes(String(role || "").trim())'),
    "Clairvoyance exercise explanations must not be replaced by the timed fallback message."
  );
  assert(
    launcherSource.includes('["receiver", "sender", "remote-viewer"].includes(normalizedRole)'),
    "Clairvoyance explanation clearing must remain disabled."
  );
  assert(
    /if \(coveredScreenMode\) \{\s+resetCoveredScreenInstructionForNewSession\(\);\s+const confirmed = await confirmCoveredScreenInstructionBeforeLaunch\(\);/.test(launcherSource),
    "Every new Covered Screen session must reset its acknowledgement before displaying the instruction modal."
  );
  const coveredContinueStart = runtimeSource.indexOf('if (mode === "continue") {\n        if (isRemoteViewerCoveredMode) {');
  const coveredContinueEnd = runtimeSource.indexOf("        } else if (isRobotSenderLikeMode)", coveredContinueStart);
  const coveredContinueBlock = runtimeSource.slice(coveredContinueStart, coveredContinueEnd);
  assert(
    coveredContinueStart >= 0 &&
      coveredContinueEnd > coveredContinueStart &&
      coveredContinueBlock.includes("await confirmCoveredScreenInstructionBeforeCoveredRestart()") &&
      coveredContinueBlock.includes("setPrompt(prompt, true, prompt)") &&
      !coveredContinueBlock.includes("startCoveredScreenRoundNow()"),
    "Continuing a Covered Screen session must return to Press when ready instead of starting the countdown."
  );
}

Promise.resolve()
  .then(verifyRuntimeGuards)
  .then(verifyCoveredScreenLaunch)
  .then(verifyPostTourModeControl)
  .then(verifyRemoteScreenRequiredNames)
  .then(() => console.log("Clairvoyance Covered Screen guided-tour flow verified."))
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
