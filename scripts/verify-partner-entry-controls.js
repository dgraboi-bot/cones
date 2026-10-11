const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const origin = "http://127.0.0.1:18765";
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1280, 390]) {
      for (const savedPartner of ["", "Saved Partner"]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
        await context.route("**/*", async (route) => {
          const url = new URL(route.request().url());
          if (url.origin !== origin) return route.abort();
          if (url.pathname.endsWith(".php")) {
            const payload = route.request().postDataJSON() || {};
            const name = payload.identifier || payload.own_email || "Test Owner";
            return route.fulfill({ json: {
            ok: true, user_type: "pro", identifier_exists: true, esp_pro_special_edition_enabled: true,
            identifier_status: { formal_identity_exists: true, preferred_identifier: name, preferred_handle: name, uses_handle: true },
            launcher_profile: { current_partner: "Robot", difficulty_level: "2", partner_history: savedPartner ? [savedPartner] : [], deleted_partners: [] }
          } });
          }
          const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
          if (!file.startsWith(root + path.sep)) return route.abort();
          try {
            return route.fulfill({ body: await fs.readFile(file), contentType: types[path.extname(file)] || "application/octet-stream" });
          } catch {
            return route.fulfill({ status: 404, body: "Not found" });
          }
        });
        await context.addInitScript((partner) => {
          localStorage.setItem("cones-beginner-launcher-v2", JSON.stringify({
            recognizedIdentity: "Test Owner", ownNames: { sender: "Test Owner", receiver: "Test Owner" },
            currentPartners: { sender: "Robot", receiver: "Robot" },
            partnerHistory: { sender: partner ? [partner] : [], receiver: partner ? [partner] : [] },
            roleDifficultyLevels: { sender: "2", receiver: "2" }
          }));
          localStorage.setItem("cones-exercise-order-defaults-v1", "1");
        }, savedPartner);
        const page = await context.newPage();
        await page.goto(`${origin}/telepathybeginner.html?open=launcher`, { waitUntil: "domcontentloaded" });
        for (const role of ["receiver", "sender"]) {
          const card = page.locator(`[data-role-card="${role}"]`);
          await card.locator(".role-card-toggle").click();
          await page.waitForTimeout(500);
          const input = card.locator('input[name="partnerName"]');
          assert.equal(await input.getAttribute("placeholder"), role === "sender" ? "Enter Receiver user name" : "Enter Sender user name");
          const select = card.locator('select[name="partnerHistory"]');
          assert.equal(await select.isVisible(), !!savedPartner);
          assert.equal(await card.locator(".role-partner-selector-note").innerText(), savedPartner ? 'Select "Robot" for simulation' : 'Enter "Robot" for simulation');
          await input.fill("Typed Partner");
          assert.equal(await input.inputValue(), "Typed Partner");
          if (savedPartner) {
            await select.selectOption(savedPartner);
            assert.equal(await input.inputValue(), savedPartner);
          }
          await page.locator(`[data-collapse-role-card="${role}"]`).click();
        }
        console.log(`PASS ${width}px: placeholders, typed entry, ${savedPartner ? "saved-partner dropdown and selection" : "Robot-only dropdown hidden with entry hint"}`);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
