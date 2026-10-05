const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";
const launcherStorageKey = "cones-beginner-launcher-v2";

function visitorLauncherUrl() {
  const url = new URL(baseUrl);
  url.searchParams.set("open", "visitor-launcher");
  return url.toString();
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

async function loadVisitorLauncher(page) {
  await page.goto(visitorLauncherUrl(), { waitUntil: "domcontentloaded" });
  await page.locator('[data-role-card="receiver"] .role-card-toggle').waitFor({ state: "attached" });
  await page.evaluate(({ key }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(key, JSON.stringify({
      entryMode: "visitor",
      remoteViewerSimulationMode: "covered-screen"
    }));
  }, { key: launcherStorageKey });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-role-card="receiver"] .role-card-toggle').waitFor({ state: "attached" });
  await page.waitForFunction(() => {
    const own = document.querySelector('[data-role-form="receiver"] input[name="ownName"]');
    const partner = document.querySelector('[data-role-form="receiver"] input[name="partnerName"]');
    return own?.value === "Anonymous Visitor" && own.readOnly && partner?.value === "Robot" && partner.readOnly;
  });
}

async function openLearningCenterFromVisitorLanding(page) {
  await page.locator('[data-temporary-home-open-fresh]').click();
  await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
  await page.locator('[data-open-options]').click();
  await page.locator('[data-view="options"]').waitFor({ state: "visible" });
  await page.locator('[data-open-aids]').click();
  await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
}

async function assertTelepathyVisitorCard(page, role) {
  await page.locator(`[data-role-card="${role}"] .role-card-toggle`).evaluate((button) => button.click());
  await page.locator(`[data-role-card="${role}"]`).evaluate((card, selectedRole) => {
    if (!card.classList.contains("active")) {
      throw new Error(`${selectedRole} visitor card did not expand.`);
    }
  }, role);
  const form = page.locator(`[data-role-form="${role}"]`);
  const own = form.locator('input[name="ownName"]');
  const partner = form.locator('input[name="partnerName"]');
  assertEqual(await own.inputValue(), "Anonymous Visitor", `${role} visitor name`);
  const ownLock = await own.evaluate((input) => ({
    readOnly: input.readOnly,
    ariaReadOnly: input.getAttribute("aria-readonly"),
    title: input.title
  }));
  assertEqual(ownLock.readOnly, true, `${role} visitor name lock (${JSON.stringify(ownLock)})`);
  assertEqual(await partner.inputValue(), "Robot", `${role} visitor partner`);
  assertEqual(await partner.evaluate((input) => input.readOnly), true, `${role} visitor partner lock`);
}

async function assertExerciseLabelOpensTelepathyCard(page, role) {
  const card = page.locator(`[data-role-card="${role}"]`);
  const exerciseLabel = card.locator(`[data-pair-difficulty-label="${role}"]`);
  await exerciseLabel.click();
  assertEqual(
    await card.evaluate((element) => element.classList.contains("active")),
    true,
    `${role} Exercise label opens its collapsed card`
  );
}

async function assertFeatureSetupReturnsToRoleCard(page, role) {
  await loadVisitorLauncher(page);
  await page.locator(`[data-role-card="${role}"] .role-card-toggle`).evaluate((button) => button.click());
  const setupLink = page.locator(`[data-open-feature-setup="${role}"]`);
  assertEqual(
    (await setupLink.textContent()).trim(),
    "Click here to set up optional features of this app",
    `${role} feature-setup link wording`
  );
  await setupLink.evaluate((button) => {
    const wrap = button.closest("[data-role-setup-wrap]");
    if (wrap) {
      wrap.hidden = false;
    }
    button.click();
  });
  await page.locator('[data-view="feature-setup"]').waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-close-feature-setup]');
    return button instanceof HTMLButtonElement && !button.hidden && !button.disabled;
  });
  await page.locator('[data-close-feature-setup]').evaluate((button) => button.click());
  assertEqual(
    await page.locator(`[data-role-card="${role}"]`).evaluate((card) => card.classList.contains("active")),
    true,
    `${role} feature-setup BACK returns to the expanded card`
  );
}

async function assertGuidedTourHidesFeatureSetupLink(page, role) {
  await loadVisitorLauncher(page);
  await openLearningCenterFromVisitorLanding(page);
  await page.locator('[data-learning-center-tab="start-here"]').click();
  const tourLink = page.locator(`#learningCenterTabStartHere [data-learning-center-action="guided-${role}-tour"]`);
  await tourLink.click();
  await page.locator('[data-guided-tour-overlay]').waitFor({ state: "visible" });
  await page.locator(`[data-role-card="${role}"] .role-card-toggle`).click();
  await page.locator(`[data-role-card="${role}"].active`).waitFor();
  await page.waitForTimeout(250);
  const setupWrap = page.locator(`[data-role-setup-wrap="${role}"]`);
  assertEqual(await setupWrap.isHidden(), true, `${role} guided tour hides the feature-setup link`);
}

async function assertLandingGuidedReceiverTourHidesFeatureSetupLink(page) {
  await loadVisitorLauncher(page);
  await page.locator('[data-start-guided-receiver-tour-landing]').click();
  await page.locator('[data-guided-tour-overlay]').waitFor({ state: "visible" });
  await page.locator('[data-role-card="receiver"] .role-card-toggle').click();
  await page.locator('[data-role-card="receiver"].active').waitFor();
  await page.waitForTimeout(250);
  assertEqual(
    await page.locator('[data-role-setup-wrap="receiver"]').isHidden(),
    true,
    "Landing Page guided receiver tour hides feature setup"
  );
}

async function assertLearningCenterFeatureSetupBack(page) {
  await loadVisitorLauncher(page);
  await page.locator('[data-open-aids]').evaluate((button) => button.click());
  await page.locator('[data-learning-center-tab="start-here"]').click();
  await page.locator('#learningCenterTabStartHere [data-learning-center-action="setup-features"]').evaluate((button) => button.click());
  await page.locator('[data-view="feature-setup"]').waitFor({ state: "visible" });
  const backButton = page.locator('[data-close-feature-setup]');
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-close-feature-setup]');
    return button instanceof HTMLButtonElement && !button.hidden && !button.disabled;
  });
  await backButton.evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-view="learning-center"]').evaluate((view) => !view.classList.contains("beginner-view-hidden")),
    true,
    "Learning Center feature-setup BACK returns to Learning Center"
  );
  assertEqual(
    await page.locator('[data-learning-center-tab="start-here"]').getAttribute("aria-selected"),
    "true",
    "Learning Center feature-setup BACK restores Quick Links"
  );

  await page.locator('[data-learning-center-tab="index"]').evaluate((button) => button.click());
  await page.locator('#learningCenterTabIndex [data-learning-center-action="setup-features"]').evaluate((button) => button.click());
  await page.locator('[data-view="feature-setup"]').waitFor({ state: "visible" });
  await page.locator('[data-close-feature-setup]').evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-learning-center-tab="index"]').getAttribute("aria-selected"),
    "true",
    "Learning Center feature-setup BACK restores Index"
  );
}

async function assertLearningCenterIndexNavigation(page) {
  await loadVisitorLauncher(page);
  await page.locator('[data-open-aids]').evaluate((button) => button.click());
  await page.locator('[data-learning-center-tab="index"]').click();
  await page.locator('#learningCenterTabIndex [data-learning-center-action="baseline"]').evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-learning-center-tab="course"]').getAttribute("aria-selected"),
    "true",
    "Baseline Questions temporarily displays Course"
  );
  assertEqual(
    (await page.locator('[data-learning-center-course-title]').isHidden()),
    true,
    "Baseline Questions displays Course page 3"
  );
  await page.locator('[data-close-learning-center]').evaluate((button) => button.click());
  await page.locator('[data-view="options"]').waitFor({ state: "visible" });
  await page.locator('[data-open-aids]').evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-learning-center-tab="index"]').getAttribute("aria-selected"),
    "true",
    "Learning Center reopens at the last user-selected Index tab"
  );

  await page.locator('#learningCenterTabIndex [data-learning-center-action="review-location"]').evaluate((button) => button.click());
  await page.locator('[data-view="feature-setup"]').waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const item = document.querySelector('[data-feature-setup-item="location"]');
    const rect = item?.getBoundingClientRect();
    return !!rect && rect.top >= 0 && rect.top < window.innerHeight;
  });
  await page.locator('[data-close-feature-setup]').evaluate((button) => button.click());
  await page.locator('[data-learning-center-tab="course"]').click();
  await page.locator('[data-learning-center-course-next]').evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-learning-center-course-lesson-list-section]').isHidden(),
    false,
    "Course page 4 displays its lesson list"
  );
  await page.locator('[data-close-learning-center]').evaluate((button) => button.click());
  await page.locator('[data-view="options"]').waitFor({ state: "visible" });
  await page.locator('[data-open-aids]').evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-learning-center-tab="course"]').getAttribute("aria-selected"),
    "true",
    "Learning Center reopens at an intentionally selected Course tab"
  );
  assertEqual(
    await page.locator('[data-learning-center-course-lesson-list-section]').isHidden(),
    false,
    "Learning Center preserves the intentional Course page selection"
  );
}

async function assertMainMenuFeatureSetupBack(page) {
  await loadVisitorLauncher(page);
  await page.locator('[data-open-messaging-setup]').evaluate((button) => button.click());
  await page.locator('[data-view="feature-setup"]').waitFor({ state: "visible" });
  await page.locator('[data-close-feature-setup]').evaluate((button) => button.click());
  assertEqual(
    await page.locator('[data-view="options"]').evaluate((view) => !view.classList.contains("beginner-view-hidden")),
    true,
    "Main Menu feature-setup BACK returns to Main Menu"
  );
}

async function assertGuidedRemoteViewTourQuickLink(page) {
  await loadVisitorLauncher(page);
  await page.locator('[data-open-aids]').evaluate((button) => button.click());
  await page.locator('[data-learning-center-tab="start-here"]').click();

  const quickLink = page.locator('[data-learning-center-action="guided-remote-view-tour"]');
  assertEqual(
    await quickLink.getAttribute("aria-label"),
    "Guided Remote View Tour",
    "Quick Links guided remote-view tour label"
  );
  await quickLink.evaluate((button) => button.click());

  await page.locator('[data-view="clairvoyance-viewing"]').waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const card = document.querySelector('[data-role-card="remote-viewer"]');
    const label = document.querySelector('[data-pair-difficulty-label="remote-viewer"]');
    const prompt = document.querySelector('[data-guided-tour-overlay]');
    return card?.classList.contains("active") &&
      label?.textContent?.trim() === "Exercise 2" &&
      prompt && !prompt.hidden;
  });

  const storedState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), launcherStorageKey);
  assertEqual(storedState.remoteViewerSimulationMode, "covered-screen", "Quick Links remote-view tour mode");
  assertEqual(storedState.remoteViewerExperienceMode, "tour", "Quick Links remote-view tour type");
  assertEqual(storedState.roleDifficultyLevels?.["remote-viewer"], "2", "Quick Links remote-view tour exercise");
  assertEqual(await page.locator('[data-remote-viewer-experience="tour"]').isChecked(), true, "Quick Links remote-view tour radio selection");

  const prompt = page.locator('[data-guided-tour-overlay]');
  await prompt.waitFor({ state: "visible" });
  assertEqual(
    (await prompt.locator('[data-guided-tour-copy]').textContent()).trim(),
    "Clairvoyance / Remote View Tour. Press GO.",
    "Quick Links remote-view tour prompt"
  );
  const promptStyle = await prompt.locator('[data-guided-tour-balloon]').evaluate((balloon) => ({
    pointerEvents: getComputedStyle(balloon).pointerEvents,
    rect: balloon.getBoundingClientRect().toJSON(),
    viewport: { width: window.innerWidth, height: window.innerHeight }
  }));
  assertEqual(promptStyle.pointerEvents, "none", "Quick Links remote-view prompt must not block GO");
  if (Math.abs(promptStyle.rect.left + (promptStyle.rect.width / 2) - (promptStyle.viewport.width / 2)) >= 2) {
    throw new Error(`Quick Links remote-view prompt must be centered horizontally: ${JSON.stringify(promptStyle.rect)}`);
  }
  if (Math.abs(promptStyle.rect.top + (promptStyle.rect.height / 2) - (promptStyle.viewport.height / 2)) >= 2) {
    throw new Error(`Quick Links remote-view prompt must be centered vertically: ${JSON.stringify(promptStyle.rect)}`);
  }

  await page.locator('[data-remote-viewer-go]').click();
  await page.locator('[data-covered-screen-instruction-overlay]').waitFor({ state: "visible" });
  assertEqual(await prompt.isHidden(), true, "Quick Links remote-view prompt clears when GO is pressed");
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(8000);
  page.on("pageerror", (error) => {
    throw error;
  });

  try {
    await loadVisitorLauncher(page);
    await assertExerciseLabelOpensTelepathyCard(page, "receiver");

    await loadVisitorLauncher(page);
    await assertExerciseLabelOpensTelepathyCard(page, "sender");

    await loadVisitorLauncher(page);
    await assertTelepathyVisitorCard(page, "receiver");

    await page.locator('[data-inline-start-receiver-tour]').evaluate((button) => button.click());
    await page.waitForTimeout(100);
    const guidedTourOwn = page.locator('[data-role-form="receiver"] input[name="ownName"]');
    assertEqual(await guidedTourOwn.inputValue(), "Anonymous Visitor", "guided receiver tour name");
    assertEqual(await guidedTourOwn.evaluate((input) => input.readOnly), true, "guided receiver tour name lock");
    assertEqual(await page.locator('[data-role-setup-wrap="receiver"]').isHidden(), true, "guided receiver tour hides feature setup");

    await assertGuidedTourHidesFeatureSetupLink(page, "sender");
    await assertGuidedTourHidesFeatureSetupLink(page, "receiver");
    await assertLandingGuidedReceiverTourHidesFeatureSetupLink(page);
    await assertFeatureSetupReturnsToRoleCard(page, "receiver");
    await assertFeatureSetupReturnsToRoleCard(page, "sender");
    await assertLearningCenterFeatureSetupBack(page);
    await assertLearningCenterIndexNavigation(page);
    await assertMainMenuFeatureSetupBack(page);
    await assertGuidedRemoteViewTourQuickLink(page);

    await loadVisitorLauncher(page);
    await assertTelepathyVisitorCard(page, "receiver");
    await page.locator('[data-inline-open-handle="receiver"]').evaluate((button) => button.click());
    assertEqual(await page.locator('[data-handle-overlay]').evaluate((overlay) => !overlay.classList.contains("beginner-view-hidden")), true, "visitor claim flow opens");
    assertEqual(await page.locator('#handleDialogTitle').textContent(), "Choose Unique Name For Use With This Browser", "claim dialog title");
    assertEqual(
      (await page.locator('[data-handle-intro]').textContent()).replace(/\s+/g, " ").trim(),
      "Choose a unique name between 3 and 24 characters long using letters, numbers, spaces, period, underscore, apostrophe, or hyphen. With this unique name, you become a recognized user and can use the Practice Telepathy tools with any other recognized user of ESP PRO. Being recognized allows your data to be saved along with performance reporting. Using email for confirmation is optional and is never sold or shared (see privacy policy).",
      "claim dialog privacy copy"
    );
    await page.locator('[data-handle-input]').fill("draft-name");
    await page.locator('[data-open-handle-privacy]').click();
    assertEqual(await page.locator('[data-view="about"]').evaluate((view) => !view.classList.contains("beginner-view-hidden")), true, "privacy policy opens");
    await page.locator('[data-close-about]').click();
    assertEqual(await page.locator('[data-handle-overlay]').evaluate((overlay) => !overlay.classList.contains("beginner-view-hidden")), true, "privacy policy returns to claim dialog");
    assertEqual(await page.locator('[data-handle-input]').inputValue(), "draft-name", "claim draft survives privacy return");

    await loadVisitorLauncher(page);
    await assertTelepathyVisitorCard(page, "sender");

    await loadVisitorLauncher(page);
    await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
    const remoteOwn = page.locator('[data-remote-viewer-own]');
    assertEqual(await remoteOwn.inputValue(), "Anonymous Visitor", "clairvoyance visitor name");
    assertEqual(await remoteOwn.evaluate((input) => input.readOnly), true, "clairvoyance visitor name lock");

    console.log("Anonymous visitor tour-only policy verified.");
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
