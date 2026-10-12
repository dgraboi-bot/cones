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
    const cases = [390, 1280].flatMap(width => ["2", "3", "4", "1"].map(exercise => ({ width, exercise, senderExercise: exercise, first: "sender" })));
    for (const first of ["sender", "receiver"]) {
      cases.push({ width: 390, exercise: "3", senderExercise: "2", first });
      cases.push({ width: 390, exercise: "2", senderExercise: "4", first });
      cases.push({ width: 390, exercise: "2", senderExercise: "2", first });
    }
    for (const [caseIndex, { width, exercise, senderExercise, first }] of cases.entries()) {
      const devices = {};
      const automaticExerciseWrites = [];
      for (const role of ["receiver", "sender"]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
        await context.addInitScript(() => localStorage.setItem("cones-exercise-order-pair-initialization-v1", "1"));
        await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        const page = await context.newPage();
        await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => localStorage.getItem("cones-exercise-order-pair-initialization-v1") === null);
        const card = page.locator(`[data-role-card="${role}"]`);
        await card.locator(".role-card-toggle").click();
        const name = `${role} ${width} c${caseIndex}`;
        await card.locator(`[data-open-feature-setup="${role}"]`).click();
        await page.locator("[data-feature-setup-claim-action]").click();
        await page.locator("[data-handle-input]").fill(name);
        await page.locator("[data-submit-handle]").click();
        await page.locator("[data-handle-overlay]").waitFor({ state: "hidden", timeout: 15000 });
        const label = card.locator(`[data-pair-difficulty-label="${role}"]`);
        await label.waitFor({ state: "visible" });
        assert.equal(await label.innerText(), "Exercise 2");
        // Even a stale tab setting the old flag again must not alter the pair.
        await page.evaluate(() => localStorage.setItem("cones-exercise-order-pair-initialization-v1", "1"));
        page.on("request", request => {
          if (new URL(request.url()).pathname.endsWith("/api.php") && request.method() === "POST") {
            const payload = request.postDataJSON();
            if (payload?.action === "set_pair_difficulty") automaticExerciseWrites.push(payload);
          }
        });
        devices[role] = { context, page, card, name };
      }
      for (const role of ["receiver", "sender"]) {
        const { card } = devices[role];
        await card.locator('input[name="partnerName"]').fill(devices[role === "receiver" ? "sender" : "receiver"].name);
      }
      await devices.receiver.card.locator('input[name="partnerName"]').dispatchEvent("change");
      await devices.receiver.page.waitForTimeout(700);
      assert.equal(await devices.receiver.card.locator('[data-pair-difficulty-label="receiver"]').innerText(), "Exercise 2");
      assert.deepEqual(automaticExerciseWrites, [], "Pairing must not submit an automatic exercise change");
      const direction = exercise === "1" ? "down" : "up";
      for (let step = 0; step < Math.abs(Number(exercise) - 2); step += 1) {
        await devices.receiver.card.locator(`[data-role-difficulty-bump="receiver"][data-direction="${direction}"]`).click();
        await devices.receiver.page.waitForTimeout(700);
      }
      assert.equal(await devices.receiver.card.locator('[data-pair-difficulty-label="receiver"]').innerText(), `Exercise ${exercise}`);
      const senderDirection = senderExercise === "1" ? "down" : "up";
      for (let step = 0; step < Math.abs(Number(senderExercise) - 2); step += 1) {
        await devices.sender.card.locator(`[data-role-difficulty-bump="sender"][data-direction="${senderDirection}"]`).click();
        await devices.sender.page.waitForTimeout(700);
      }
      assert.equal(await devices.sender.card.locator('[data-pair-difficulty-label="sender"]').innerText(), `Exercise ${senderExercise}`);
      // Explicit arrow changes are allowed; only subsequent automatic writes are forbidden.
      automaticExerciseWrites.length = 0;
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
      const receiverNotices = [];
      const receiverMessages = [];
      await devices.receiver.page.exposeFunction("recordReceiverNotice", text => receiverMessages.push(text));
      await devices.receiver.page.evaluate(() => {
        new MutationObserver(() => {
          const text = document.body.innerText.match(/Receiver selected: Exercise \d/);
          if (text) window.recordReceiverNotice(text[0]);
        }).observe(document.body, { subtree: true, childList: true, characterData: true });
      });
      devices.receiver.page.on("request", request => {
        const url = new URL(request.url());
        if (request.isNavigationRequest() && url.pathname.endsWith("/receiver.html")) receiverNotices.push(url.searchParams.get("difficulty_level"));
      });
      await devices[first].card.locator('button[type="submit"]').click();
      await devices[first].page.locator('[data-exercise-agreement-overlay]').waitFor({ state: "visible" });
      await devices[first].page.waitForTimeout(1300);
      assert.deepEqual(previews, [], "No notice is allowed before both participants press GO");
      const pairCode = [devices.receiver.name, devices.sender.name].map(name => name.toLowerCase().replace(/[^a-z0-9]+/g, "")).sort().join("__");
      if (caseIndex === 0) {
        await devices[first].page.locator('[data-exercise-agreement-back]').click();
        await devices[first].page.locator('[data-exercise-agreement-overlay]').waitFor({ state: "hidden" });
        const unlocked = await apiContext.request.post(`${base}/api.php`, { data: {
          action: "get_pair_difficulty", session_code: pairCode,
          sender_name: devices.sender.name, receiver_name: devices.receiver.name
        } });
        assert.equal((await unlocked.json()).pair_difficulty_meta.exercise_locked, false);
        await devices[first].card.locator('button[type="submit"]').click();
        await devices[first].page.locator('[data-exercise-agreement-overlay]').waitFor({ state: "visible" });
        await devices[first].page.waitForTimeout(700);
        console.log("PASS UI: waiting-screen BACK cancels GO and releases the lock");
      }
      const lockedChange = await apiContext.request.post(`${base}/api.php`, { data: {
        action: "set_pair_difficulty", session_code: pairCode, difficulty_level: "1",
        sender_name: devices.sender.name, receiver_name: devices.receiver.name
      } });
      assert.equal(lockedChange.status(), 409, "First GO locks the exercise even without partner verification");
      await devices[first === "sender" ? "receiver" : "sender"].card.locator('button[type="submit"]').click();
      await devices.sender.page.waitForURL(url => url.pathname.endsWith("/sender.html"), { timeout: 25000 });
      console.log(`Observed ${width}px sender-first: preview=${previews.at(-1)}, launched exercise=${launchedExercise}`);
      assert.equal(launchedExercise, exercise);
      if (senderExercise === exercise) assert.deepEqual(previews, [], "Matching selections must never flash a notice");
      else assert(previews.includes(`Receiver selected: Exercise ${exercise}`));
      await devices.receiver.page.waitForURL(url => url.pathname.endsWith("/receiver.html"));
      assert.equal(receiverNotices.at(-1), exercise);
      assert.deepEqual(receiverMessages, [], "Receiver must never receive the Sender's mismatch notice");
      for (const role of ["sender", "receiver"]) {
        assert.equal(await devices[role].page.evaluate(roleName =>
          JSON.parse(localStorage.getItem("cones-beginner-launcher-v2")).roleDifficultyLevels[roleName], role), exercise);
      }
      assert.deepEqual(automaticExerciseWrites, [], "Pairing and GO must not submit an automatic exercise change");
      console.log(`PASS ${width}px ${first}-first: Receiver=${exercise}, Sender=${senderExercise}; both launch ${exercise}, ${senderExercise === exercise ? "no notice" : "Sender-only mismatch notice"}, GO lock enforced`);
      for (const device of Object.values(devices)) await device.context.close();
    }
    const call = async data => {
      const response = await apiContext.request.post(`${base}/api.php`, { data });
      assert.equal(response.status(), 200);
      return response.json();
    };
    const cancelPair = { session_code: "agreement-cancel-test", sender_name: "Cancel Sender", receiver_name: "Cancel Receiver" };
    for (const name of [cancelPair.sender_name, cancelPair.receiver_name]) {
      await call({ action: "claim_unique_handle", current_identifier: "", proposed_handle: name });
    }
    const go = { session_code: cancelPair.session_code, role: "sender", own_identifier: cancelPair.sender_name,
      partner_identifier: cancelPair.receiver_name, exercise: "2", attempt_id: "cancel-test" };
    await call({ action: "begin_exercise_agreement", ...go });
    await call({ action: "cancel_exercise_agreement", ...go });
    await call({ action: "set_pair_difficulty", ...cancelPair, difficulty_level: "3" });
    console.log("PASS backend: cancelling the sole GO unlocks exercise selection");
    await call({ action: "begin_exercise_agreement", ...go });
    await call({ action: "begin_exercise_agreement", ...go, role: "receiver", own_identifier: cancelPair.receiver_name,
      partner_identifier: cancelPair.sender_name, exercise: "4", attempt_id: "receiver-cancel-test" });
    await call({ action: "abort_to_home", session_code: cancelPair.session_code, role: "sender" });
    await call({ action: "clear_abort_notice", session_code: cancelPair.session_code, role: "receiver" });
    await call({ action: "set_pair_difficulty", ...cancelPair, difficulty_level: "2" });
    console.log("PASS backend: both participants leaving releases all exercise locks");
    await call({ action: "begin_exercise_agreement", ...go, attempt_id: "expired-go" });
    const expiredState = JSON.parse(await fs.readFile(statePath, "utf8"));
    expiredState.sessions[cancelPair.session_code].exercise_agreement.sender.expires_ms = 1;
    expiredState.sessions[cancelPair.session_code].sender.last_seen_ms = 0;
    await fs.writeFile(statePath, JSON.stringify(expiredState));
    await call({ action: "set_pair_difficulty", ...cancelPair, difficulty_level: "3" });
    console.log("PASS backend: an abandoned GO lease expires without leaving an exercise lock");
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
