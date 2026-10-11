const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const origin = "http://127.0.0.1:18765";
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1280, 390]) {
      for (const saved of [null, "1", "3"]) {
        const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: "block" });
        // Serve the actual working files without depending on Apache or changing server data.
        await context.route("**/*", async (route) => {
          const url = new URL(route.request().url());
          if (url.origin !== origin) return route.abort();
          if (url.pathname.endsWith(".php")) return route.fulfill({ json: {} });
          const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
          if (!file.startsWith(root + path.sep)) return route.abort();
          try {
            await route.fulfill({ body: await fs.readFile(file), contentType: types[path.extname(file)] || "application/octet-stream" });
          } catch {
            await route.fulfill({ status: 404, body: "Not found" });
          }
        });
        if (saved) {
          await context.addInitScript((level) => {
            localStorage.setItem("cones-exercise-order-defaults-v1", "1");
            for (const role of ["receiver", "sender"]) {
              localStorage.setItem(`cones-settings-v2-${role}`, JSON.stringify({ difficulty_level: level }));
            }
          }, saved);
        }
        const page = await context.newPage();
        await page.goto(`${origin}/telepathybeginner.html?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
        await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
        for (const role of ["receiver", "sender"]) {
          const card = page.locator(`[data-role-card="${role}"]`);
          await card.locator(".role-card-toggle").click();
          assert.equal(await card.locator(`[data-pair-difficulty-label="${role}"]`).innerText(), `Exercise ${saved || "2"}`);
          assert.equal(await card.locator('input[name="ownName"]').inputValue(), "Anonymous Visitor");
          assert.equal(await card.locator('input[name="partnerName"]').inputValue(), "Robot");
          const setupLink = card.locator(`[data-open-feature-setup="${role}"]`);
          assert.equal(await setupLink.innerText(), "Click here to pick a user name needed to practice telepathy with others");
          await setupLink.click();
          await page.locator("[data-feature-setup-claim-action]").waitFor({ state: "visible" });
          await page.locator("[data-close-feature-setup]").click();
          await card.waitFor({ state: "visible" });
          await page.locator(`[data-collapse-role-card="${role}"]`).click();
        }
        console.log(`PASS ${width}px: Receiver and Sender ${saved ? `retain saved Exercise ${saved}` : "default to Exercise 2"}`);
        if (!saved) {
          await page.locator('[data-role-card="receiver"] .role-card-toggle').click();
          await page.locator('[data-open-online-course-direct="receiver"]').click();
          await page.locator('[data-learning-center-tab="start-here"]').click();
          await page.locator('[data-learning-center-action="setup-features"]:visible').click();
          await page.locator("[data-feature-setup-claim-action]").click();
          assert.equal(await page.locator("#handleDialogTitle").innerText(), "Pick a User Name to Use with ESP GYM");
          assert.equal(await page.locator("[data-handle-intro]").innerText(), "Pick a name between 3 and 24 characters long using letters, numbers, spaces, period, underscore, apostrophe, or hyphen. With this unique name, you become a recognized user and can use ESP GYM tools with any other recognized user and save performance data for viewing customized reports.");
          assert.equal(await page.locator("[data-handle-input]").getAttribute("placeholder"), "Proposed user name");
          await page.locator("[data-close-handle]").click();
          console.log(`PASS ${width}px: PICK USER NAME heading, exact copy, placeholder, and Cancel`);
          await page.evaluate(() => {
            const key = "cones-beginner-launcher-v2";
            const state = JSON.parse(localStorage.getItem(key) || "{}");
            state.roleDifficultyLevels = { receiver: "3", sender: "3" };
            state.robotSimulationDifficultyLevels = {};
            localStorage.setItem(key, JSON.stringify(state));
            localStorage.setItem("cones-settings-v2-receiver", JSON.stringify({ difficulty_level: "3" }));
            localStorage.setItem("cones-settings-v2-sender", JSON.stringify({ difficulty_level: "3" }));
            localStorage.setItem("reset-test-marker", "remove-me");
            localStorage.setItem("cones-exercise-order-defaults-v1", "1");
          });
          await page.goto(`${origin}/telepathybeginner.html?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
          await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
          await page.locator('[data-role-card="receiver"] .role-card-toggle').click();
          for (let step = 0; step < 2; step += 1) {
            if (await page.locator('[data-pair-difficulty-label="receiver"]').innerText() === "Exercise 3") break;
            await page.locator('[data-role-difficulty-bump="receiver"][data-direction="up"]').click();
          }
          assert.equal(await page.locator('[data-pair-difficulty-label="receiver"]').innerText(), "Exercise 3");
          await page.locator('[data-collapse-role-card="receiver"]').click();
          await page.locator("[data-open-options]").click();
          await page.locator("[data-open-other-settings]").click();
          const reset = page.locator("[data-reset-this-device]");
          assert.equal(await reset.innerText(), "Reset ESP GYM on This Device");
          page.once("dialog", (dialog) => dialog.accept());
          await reset.click();
          await page.waitForURL((url) => url.searchParams.get("open") === "landing");
          await page.locator('[data-view="temporary-home-page"]').waitFor({ state: "visible" });
          assert.equal(await page.evaluate(() => localStorage.getItem("reset-test-marker")), null);
          await page.locator("[data-temporary-home-open-fresh]").click();
          await page.waitForURL((url) => url.searchParams.get("open") === "visitor-launcher");
          await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
          await page.waitForFunction(() => {
            const input = document.querySelector('[data-role-form="receiver"] input[name="ownName"]');
            return input?.value === "Anonymous Visitor" && input.readOnly;
          });
          for (const role of ["receiver", "sender"]) {
            const card = page.locator(`[data-role-card="${role}"]`);
            await card.locator(".role-card-toggle").click();
            assert.equal(await card.locator(`[data-pair-difficulty-label="${role}"]`).innerText(), "Exercise 2");
            await page.locator(`[data-collapse-role-card="${role}"]`).click();
          }
          console.log(`PASS ${width}px: actual reset clears old selections and both roles return to Exercise 2`);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
