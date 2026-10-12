const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

(async () => {
  const root = path.resolve(__dirname, "..");
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "espgym-result-frame-"));
  const base = "http://127.0.0.1:48898";
  const php = spawn("C:\\xampp\\php\\php.exe", ["-S", "127.0.0.1:48898", "-t", root], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: "ignore"
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600, serviceWorkers: "block" });
      await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      let submitted = false;
      const round = { id: "frame-fixture", start_server_ms: Date.now() - 8500,
        stimulus_kind: "image_pair", difficulty_level: "2", image_sent_index: 1,
        image_sent: `${base}/imagepairs/1025.jpg`, image_choice_a: `${base}/imagepairs/1025.jpg`, image_choice_b: `${base}/imagepairs/1041.jpg` };
      await page.route("**/api.php", async route => {
        const request = route.request().postDataJSON();
        if (request.action === "submit_guess") { submitted = true; round.completed_server_ms = Date.now(); }
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({
          ok: true, pair_difficulty: "2", server_now_ms: Date.now(), round,
          state: { round, sender_online: true, receiver_online: true, receiver_ready: true,
            receiver_view: { phase: submitted ? "results" : "idle" }, post_round: submitted ? { receiver_choice: null, sender_choice: null } : null }
        }) });
      });
      await page.goto(`${base}/receiver.html?prefill=1&own_email=FrameReceiver&partner_email=FrameSender&difficulty_level=2&include_confidence=0`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.querySelector('#countdownNumber')?.textContent.includes('done receiving'));
      await page.locator('#countdownBox').click();
      const actual = page.locator('#receiverLevelFourChoiceGrid .image-choice-card[data-layout-number="1"]');
      await actual.waitFor({ state: "visible" });
      if (width < 600) await actual.tap(); else await actual.click();
      await page.waitForFunction(() => document.querySelector('#receiverLevelFourChoiceGrid .image-choice-card.actual'));
      await page.waitForTimeout(2200);
      assert.equal(await actual.evaluate(node => getComputedStyle(node).borderTopColor), 'rgb(47, 211, 107)', 'Correct frame must survive submission and heartbeat');
      // Model the sticky hover state retained by some touch browsers, even after
      // result controls become pointer-inert. Use the actual stylesheet rules.
      const css = await fs.readFile(path.join(root, 'telepathy.css'), 'utf8');
      await page.addStyleTag({ content: css.replaceAll(':hover', '.fixture-sticky-hover') });
      await actual.evaluate(node => node.classList.add('fixture-sticky-hover'));
      assert.equal(await actual.evaluate(node => getComputedStyle(node).borderTopColor), 'rgb(47, 211, 107)', 'Sticky hover must not erase correct feedback');
      assert.notEqual(await actual.evaluate(node => getComputedStyle(node).boxShadow), 'none', 'Correct feedback ring remains visible');
      console.log(`PASS ${width}px: tapped correct image stays green after heartbeat and sticky hover`);
      await context.close();
    }
  } finally {
    await browser?.close(); php.kill();
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
