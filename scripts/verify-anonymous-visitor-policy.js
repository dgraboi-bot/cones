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
    await assertTelepathyVisitorCard(page, "receiver");

    await page.locator('[data-inline-start-receiver-tour]').evaluate((button) => button.click());
    await page.waitForTimeout(100);
    const guidedTourOwn = page.locator('[data-role-form="receiver"] input[name="ownName"]');
    assertEqual(await guidedTourOwn.inputValue(), "Anonymous Visitor", "guided receiver tour name");
    assertEqual(await guidedTourOwn.evaluate((input) => input.readOnly), true, "guided receiver tour name lock");

    await loadVisitorLauncher(page);
    await assertTelepathyVisitorCard(page, "receiver");
    await page.locator('[data-inline-open-handle="receiver"]').evaluate((button) => button.click());
    assertEqual(await page.locator('[data-handle-overlay]').evaluate((overlay) => !overlay.classList.contains("beginner-view-hidden")), true, "visitor claim flow opens");
    assertEqual(await page.locator('#handleDialogTitle').textContent(), "Choose Unique Name For Use With This Browser", "claim dialog title");
    assertEqual(
      (await page.locator('[data-handle-intro]').textContent()).replace(/\s+/g, " ").trim(),
      "Choose a unique name between 3 and 24 characters long using letters, numbers, spaces, period, underscore, or hyphen. With this unique name, you become a recognized user and can use the Practice Telepathy tools with any other recognized user of ESP PRO. Being recognized allows your data to be saved along with performance reporting. Using email for confirmation is optional and is never sold or shared (see privacy policy).",
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
