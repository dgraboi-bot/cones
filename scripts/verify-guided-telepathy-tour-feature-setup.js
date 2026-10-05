const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";
const launcherStorageKey = "cones-beginner-launcher-v2";

function visitorLauncherUrl() {
  const url = new URL(baseUrl);
  url.searchParams.set("open", "visitor-launcher");
  return url.toString();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loadVisitorLauncher(page) {
  await page.goto(visitorLauncherUrl(), { waitUntil: "domcontentloaded" });
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
}

async function openLearningCenterFromVisitorLanding(page) {
  await page.locator('[data-temporary-home-open-fresh]').click();
  await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
  await page.locator('[data-open-options]').click();
  await page.locator('[data-view="options"]').waitFor({ state: "visible" });
  await page.locator('[data-open-aids]').click();
  await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
}

async function assertSetupLinkHiddenDuringTour(page, role, launchTour) {
  await loadVisitorLauncher(page);
  await launchTour();
  await page.locator('[data-guided-tour-overlay]').waitFor({ state: "visible" });
  await page.locator(`[data-role-card="${role}"] .role-card-toggle`).click();
  await page.locator(`[data-role-card="${role}"].active`).waitFor();

  // Opening the card and hovering its exercise control previously reopened this link.
  await page.locator(`[data-role-difficulty-stack="${role}"]`).hover();
  await page.waitForTimeout(300);

  const setupWrap = page.locator(`[data-role-setup-wrap="${role}"]`);
  assert(
    await setupWrap.isHidden(),
    `${role} guided tour exposes the optional-features link after the panel renders.`
  );
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(8000);

  try {
    await assertSetupLinkHiddenDuringTour(page, "receiver", async () => {
      await openLearningCenterFromVisitorLanding(page);
      await page.locator('[data-learning-center-tab="start-here"]').click();
      await page.locator('#learningCenterTabStartHere [data-learning-center-action="guided-receiver-tour"]').click();
    });

    await assertSetupLinkHiddenDuringTour(page, "sender", async () => {
      await openLearningCenterFromVisitorLanding(page);
      await page.locator('[data-learning-center-tab="start-here"]').click();
      await page.locator('#learningCenterTabStartHere [data-learning-center-action="guided-sender-tour"]').click();
    });

    await assertSetupLinkHiddenDuringTour(page, "receiver", async () => {
      await page.locator('[data-start-guided-receiver-tour-landing]').click();
    });

    console.log("Guided Sender/Receiver tours keep the optional-features link hidden.");
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
