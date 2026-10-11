const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = 48893;
const base = `http://127.0.0.1:${port}`;
let request;

async function api(payload) {
  const response = await request.post(`${base}/api.php`, { data: payload });
  const body = await response.json();
  assert.equal(response.status(), 200, JSON.stringify(body));
  assert.equal(body.ok, true, JSON.stringify(body));
  return body;
}

async function setupPage(browser, width, owner = "") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
  await context.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  if (owner) {
    await context.addInitScript((name) => {
      localStorage.setItem("cones-beginner-launcher-v2", JSON.stringify({ recognizedIdentity: name, ownNames: { sender: name, receiver: name }, roleDifficultyLevels: { sender: "1", receiver: "1" }, locationPermission: "denied" }));
      localStorage.setItem("cones-exercise-order-defaults-v1", "1");
    }, owner);
  }
  const page = await context.newPage();
  await page.goto(`${base}/telepathybeginner.html?open=${owner ? "launcher" : "visitor-launcher"}`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
  return { page, context };
}

async function openSetup(page) {
  await page.locator('[data-role-card="receiver"] .role-card-toggle').click();
  await page.locator('[data-open-online-course-direct="receiver"]').click();
  await page.locator('[data-learning-center-tab="start-here"]').click();
  await page.locator('[data-learning-center-action="setup-features"]:visible').click();
}

async function main() {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "espgym-optional-verification-"));
  const php = spawn("C:\\xampp\\php\\php.exe", ["-S", `127.0.0.1:${port}`, "-t", root], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: "ignore" });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
    request = await browser.newContext();
    request = request.request;
    for (let attempt = 0; ; attempt += 1) {
      try { await request.get(`${base}/api.php`); break; } catch (error) {
        if (attempt > 50) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    for (const width of [1280, 390]) {
      const { page, context } = await setupPage(browser, width);
      await openSetup(page);
      const card = page.locator('[data-feature-setup-item="partner-confirmation"]');
      assert.equal(await card.locator("h2").innerText(), "Add Partner Verification Method");
      assert.equal(await card.locator("button").innerText(), "ADD PARTNER\nVERIFICATION");
      await page.locator("[data-feature-setup-claim-action]").click();
      const name = `Demo User ${width}`;
      await page.locator("[data-handle-input]").fill(name);
      await page.locator("[data-submit-handle]").click();
      await page.waitForFunction((owner) => JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}").recognizedIdentity === owner, name);
      await page.locator("[data-handle-overlay]").waitFor({ state: "hidden", timeout: 15000 });
      await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
      assert.equal(await page.locator("[data-partner-confirmation-method-overlay]").isVisible(), false);
      const status = await api({ action: "get_identifier_status", identifier: name });
      assert.equal(status.identifier_status.partner_confirmation_configured, false);
      console.log(`PASS ${width}px: new name accepted without verification prompt; setup labels correct`);
      await context.close();
      const optional = await setupPage(browser, width, name);
      await openSetup(optional.page);
      await optional.page.locator("[data-feature-setup-partner-confirmation-action]").click();
      await optional.page.locator('[data-partner-confirmation-method="camera"]').click();
      await optional.page.locator("[data-partner-confirmation-method-overlay]").waitFor({ state: "hidden" });
      const configured = await api({ action: "get_identifier_status", identifier: name });
      assert.equal(configured.identifier_status.partner_confirmation_configured, true);
      console.log(`PASS ${width}px: ADD PARTNER VERIFICATION enables snapshots through the UI`);
      await optional.context.close();
    }
    for (const width of [1280, 390]) {
      for (const role of ["receiver", "sender"]) {
        for (const [ownEnabled, partnerEnabled] of [[false, false], [true, false], [false, true], [true, true]]) {
          const suffix = `${width}${role === "sender" ? "s" : "r"}${Number(ownEnabled)}${Number(partnerEnabled)}`;
          const own = `Owner ${suffix}`, partner = `Partner ${suffix}`;
          for (const name of [own, partner]) await api({ action: "claim_unique_handle", current_identifier: "", proposed_handle: name });
          if (ownEnabled) await api({ action: "set_partner_confirmation_preference", identifier: own, method: "camera" });
          if (partnerEnabled) await api({ action: "set_partner_confirmation_preference", identifier: partner, method: "camera" });
          const { page, context } = await setupPage(browser, width, own);
          await page.locator(`[data-role-card="${role}"] .role-card-toggle`).click();
          const form = page.locator(`[data-role-form="${role}"]`);
          await form.locator('input[name="partnerName"]').fill(partner);
          await form.locator('button[type="submit"]').click();
          if (ownEnabled && partnerEnabled) {
            await page.locator("[data-partner-confirmation-overlay]").waitFor({ state: "visible" });
            assert.equal(await page.locator("[data-partner-confirmation-method-overlay]").isVisible(), false);
            console.log(`PASS ${width}px ${role}: both opted in, snapshot verification retained`);
          } else {
            await page.waitForURL((url) => url.pathname.endsWith(`/${role}.html`));
            const ownStatus = await api({ action: "get_identifier_status", identifier: own });
            const partnerStatus = await api({ action: "get_identifier_status", identifier: partner });
            assert.equal(ownStatus.identifier_status.partner_confirmation_configured, ownEnabled);
            assert.equal(partnerStatus.identifier_status.partner_confirmation_configured, partnerEnabled);
            console.log(`PASS ${width}px ${role}: own=${ownEnabled} partner=${partnerEnabled}, session opens without verification`);
          }
          await context.close();
        }
      }
    }
    // The endpoint uses stored preferences, not the client's suggested method.
    for (const [name, email] of [["Email Alpha", "alpha@example.test"], ["Email Beta", "beta@example.test"]]) {
      await api({ action: "claim_unique_handle", current_identifier: email, proposed_handle: name });
      await api({ action: "set_partner_confirmation_preference", identifier: name, method: "verified" });
    }
    const first = await api({ action: "begin_partner_confirmation", session_code: "email-opt-in-test", role: "sender", own_identifier: "Email Alpha", partner_identifier: "Email Beta", method: "camera" });
    assert.equal(first.partner_confirmation.email_verified_pair, true);
    const second = await api({ action: "begin_partner_confirmation", session_code: "email-opt-in-test", role: "receiver", own_identifier: "Email Beta", partner_identifier: "Email Alpha", method: "camera" });
    assert.equal(second.partner_confirmation.ready, true);
    console.log("PASS backend: both email-verified preferences preserved despite stale client method");
    const recovery = await setupPage(browser, 390);
    await openSetup(recovery.page);
    await recovery.page.locator("[data-feature-setup-claim-action]").click();
    await recovery.page.locator("[data-handle-input]").fill("Owner 390r00");
    await recovery.page.locator("[data-submit-handle]").click();
    await recovery.page.waitForFunction(() => document.querySelector("[data-handle-status]")?.textContent.includes("first set up email authentication"));
    assert.equal(await recovery.page.evaluate(() => JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}").recognizedIdentity), "");
    await recovery.page.locator("[data-handle-input]").fill("Email Alpha");
    await recovery.page.locator("[data-submit-handle]").click();
    await recovery.page.locator("[data-explore-pro-overlay]").waitFor({ state: "visible" });
    assert.equal(await recovery.page.evaluate(() => JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}").recognizedIdentity), "");
    console.log("PASS recovery: unverified existing name blocked; email-backed existing name requires email authentication");
    await recovery.context.close();

    for (const name of ["Camera Alpha", "Camera Beta"]) {
      await api({ action: "claim_unique_handle", current_identifier: "", proposed_handle: name });
      await api({ action: "set_partner_confirmation_preference", identifier: name, method: "camera" });
    }
    const cameraSender = { session_code: "camera-opt-in-test", role: "sender", own_identifier: "Camera Alpha", partner_identifier: "Camera Beta", method: "verified" };
    const cameraReceiver = { ...cameraSender, role: "receiver", own_identifier: "Camera Beta", partner_identifier: "Camera Alpha" };
    for (const payload of [cameraSender, cameraReceiver]) {
      const data = await api({ action: "begin_partner_confirmation", ...payload });
      assert.equal(data.partner_confirmation.own.method, "camera");
      assert.equal(data.partner_confirmation.ready, false);
    }
    const premature = await request.post(`${base}/api.php`, { data: { action: "approve_partner_confirmation", ...cameraSender } });
    assert.equal(premature.status(), 400, "Camera verification must reject approval without snapshots");
    const photoPage = await browser.newPage({ viewport: { width: 64, height: 64 } });
    const snapshot = `data:image/jpeg;base64,${(await photoPage.screenshot({ type: "jpeg" })).toString("base64")}`;
    await photoPage.close();
    for (const payload of [cameraSender, cameraReceiver]) await api({ action: "submit_partner_confirmation_snapshot", ...payload, snapshot });
    await api({ action: "approve_partner_confirmation", ...cameraSender });
    const complete = await api({ action: "approve_partner_confirmation", ...cameraReceiver });
    assert.equal(complete.partner_confirmation.ready, true);
    console.log("PASS backend: camera verification still requires snapshots and both approvals");
  } finally {
    await browser?.close();
    php.kill();
    await new Promise((resolve) => php.exitCode !== null ? resolve() : php.once("exit", resolve));
    if (path.dirname(privateRoot) === os.tmpdir() && path.basename(privateRoot).startsWith("espgym-optional-verification-")) await fs.rm(privateRoot, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
