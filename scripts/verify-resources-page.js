const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname, "..");
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "espgym-resources-"));
  const base = "http://127.0.0.1:48895";
  const php = spawn("C:\\xampp\\php\\php.exe", ["-S", "127.0.0.1:48895", "-t", root], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: "ignore"
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
      await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      await page.goto(`${base}/telepathybeginner.html`, { waitUntil: "domcontentloaded" });
      await page.locator("[data-open-temporary-home-learning-center]").click();
      await page.locator('[data-learning-center-tab="index"]').click();
      await page.locator('[data-learning-center-action="readings-videos"]').click();
      const resources = page.locator('[data-view="readings-videos"]');
      await resources.waitFor({ state: "visible" });
      assert.deepEqual(await resources.locator("h2").allTextContents(), ["BOOKS", "YOUTUBES", "WEBSITES"]);
      const links = resources.locator('a[target="_blank"]');
      assert.equal(await links.count(), 11);
      assert.equal(await resources.getByRole("link", { name: "Third Eye Spies", exact: true }).getAttribute("href"), "https://www.youtube.com/watch?v=c-NGkRppgXo");
      assert.equal(await resources.getByRole("link", { name: "Institute of Noetic Sciences", exact: true }).getAttribute("href"), "https://noetic.org/");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "No horizontal overflow");
      await resources.getByRole("link", { name: "ESP Gym", exact: true }).click();
      await page.locator('[data-view="contact"]').waitFor({ state: "visible" });
      assert.equal(await resources.isVisible(), false);
      await page.locator("[data-close-contact]").click();
      await resources.waitFor({ state: "visible" });
      assert.equal(await page.locator('[data-view="contact"]').isVisible(), false);
      await resources.locator("[data-close-readings-videos]").click();
      await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
      console.log(`PASS ${width}px: grouped links, no overflow, contact and both BACK routes`);
      await context.close();
    }
  } finally {
    await browser?.close();
    php.kill();
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
