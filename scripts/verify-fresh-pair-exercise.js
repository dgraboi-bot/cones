const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const base = "http://127.0.0.1:48894";

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "espgym-fresh-pair-"));
  const php = spawn("C:\\xampp\\php\\php.exe", ["-S", "127.0.0.1:48894", "-t", root], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: "ignore" });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const apiContext = await browser.newContext();
    for (let attempt = 0; ; attempt += 1) {
      try { await apiContext.request.post(`${base}/api.php`, { data: { action: "get_public_trial_mode" } }); break; }
      catch (error) { if (attempt > 50) throw error; await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    await apiContext.request.post(`${base}/api.php`, { data: { action: "claim_unique_handle", current_identifier: "", proposed_handle: "Fixture Owner" } });
    const statePath = path.join(privateRoot, "data", "session-state.json");
    const state = JSON.parse(await fs.readFile(statePath, "utf8"));
    state.esp_pro_special_edition_enabled = true;
    await fs.writeFile(statePath, JSON.stringify(state));
    for (const width of [390, 1280]) {
      const devices = {};
      for (const role of ["receiver", "sender"]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
        await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        const page = await context.newPage();
        await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
        const card = page.locator(`[data-role-card="${role}"]`);
        await card.locator(".role-card-toggle").click();
        const name = `${role} ${width}`;
        await card.locator(`[data-open-feature-setup="${role}"]`).click();
        await page.locator("[data-feature-setup-claim-action]").click();
        await page.locator("[data-handle-input]").fill(name);
        await page.locator("[data-submit-handle]").click();
        await page.locator("[data-handle-overlay]").waitFor({ state: "hidden", timeout: 15000 });
        const label = card.locator(`[data-pair-difficulty-label="${role}"]`);
        await label.waitFor({ state: "visible" });
        assert.equal(await label.innerText(), "Exercise 2");
        devices[role] = { context, page, card, name };
      }
      for (const role of ["receiver", "sender"]) {
        const { card } = devices[role];
        await card.locator('input[name="partnerName"]').fill(devices[role === "receiver" ? "sender" : "receiver"].name);
      }
      let launchedExercise = "";
      const previews = [];
      devices.sender.page.on("request", request => {
        const url = new URL(request.url());
        if (request.isNavigationRequest() && url.pathname.endsWith("/sender.html")) launchedExercise = url.searchParams.get("difficulty_level");
      });
      await devices.sender.page.exposeFunction("recordPreview", text => previews.push(text));
      await devices.sender.page.evaluate(() => {
        new MutationObserver(() => {
          const text = document.body.innerText.match(/Receiver selected: Exercise \d/);
          if (text) window.recordPreview(text[0]);
        }).observe(document.body, { subtree: true, childList: true, characterData: true });
      });
      await devices.sender.card.locator('button[type="submit"]').click();
      await devices.sender.page.waitForURL(url => url.pathname.endsWith("/sender.html"), { timeout: 25000 });
      console.log(`Observed ${width}px sender-first: preview=${previews.at(-1)}, launched exercise=${launchedExercise}`);
      assert.equal(launchedExercise, "2");
      assert(previews.includes("Receiver selected: Exercise 2"));
      let receiverExercise = "";
      devices.receiver.page.on("request", request => {
        const url = new URL(request.url());
        if (request.isNavigationRequest() && url.pathname.endsWith("/receiver.html")) receiverExercise = url.searchParams.get("difficulty_level");
      });
      await devices.receiver.card.locator('button[type="submit"]').click();
      await devices.receiver.page.waitForURL(url => url.pathname.endsWith("/receiver.html"));
      assert.equal(receiverExercise, "2");
      console.log(`PASS ${width}px: Receiver GO also launches Exercise 2`);
      for (const device of Object.values(devices)) await device.context.close();
    }
    const call = async data => {
      const response = await apiContext.request.post(`${base}/api.php`, { data });
      assert.equal(response.status(), 200);
      return response.json();
    };
    for (const exercise of ["1", "3", "4"]) {
      const sender = `Saved Sender ${exercise}`, receiver = `Saved Receiver ${exercise}`;
      for (const name of [sender, receiver]) await call({ action: "claim_unique_handle", current_identifier: "", proposed_handle: name });
      await call({ action: "save_launcher_profile", launcher_role: "receiver", own_email: receiver,
        launcher_profile: { current_partner: sender, difficulty_level: exercise, partner_history: [sender], deleted_partners: [] } });
      const pair = { session_code: `saved-pair-${exercise}`, sender_name: sender, receiver_name: receiver };
      const initial = await call({ action: "get_pair_difficulty", ...pair });
      assert.equal(initial.pair_difficulty, exercise);
      await call({ action: "set_pair_difficulty", ...pair, difficulty_level: "2" });
      const existing = await call({ action: "get_pair_difficulty", ...pair });
      assert.equal(existing.pair_difficulty, "2");
      console.log(`PASS backend: new pair inherits Receiver Exercise ${exercise}; established pair keeps its explicit Exercise 2`);
    }
  } finally {
    await browser?.close();
    php.kill();
    await new Promise(resolve => php.exitCode !== null ? resolve() : php.once("exit", resolve));
    if (path.dirname(privateRoot) === os.tmpdir() && path.basename(privateRoot).startsWith("espgym-fresh-pair-")) await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
