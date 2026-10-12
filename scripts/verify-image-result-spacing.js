const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

(async () => {
  const root = path.resolve(__dirname, "..");
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "espgym-image-result-"));
  const base = "http://127.0.0.1:48897";
  const oldCss = execFileSync("git", ["show", "50b1103bc389ac92bad560e9221ec16f29fd3f0b:telepathy.css"], { cwd: root, encoding: "utf8" });
  const newCss = await fs.readFile(path.join(root, "telepathy.css"), "utf8");
  const php = spawn("C:\\xampp\\php\\php.exe", ["-S", "127.0.0.1:48897", "-t", root], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: "ignore"
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const [width, height] of [[320, 568], [375, 667], [390, 844], [412, 915], [568, 320], [768, 1024], [1280, 900]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 600, hasTouch: width <= 600, serviceWorkers: "block" });
      await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await context.route("**/telepathy.css*", route => route.fulfill({ contentType: "text/css", body: oldCss }));
      const page = await context.newPage();
      await page.route("**/api.php", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({
        ok: true, server_now_ms: Date.now(), pair_difficulty: "2", state: {
          sender_online: true, receiver_online: true, receiver_ready: true,
          receiver_view: { phase: "results", selected_layout_numbers: [2] },
          post_round: { receiver_choice: "another", sender_choice: null, resolved: null },
          round: { id: "spacing-fixture", stimulus_kind: "image_pair", difficulty_level: "2", completed_server_ms: Date.now(),
            image_sent: `${base}/imagepairs/1025.jpg`, image_choice_a: `${base}/imagepairs/1025.jpg`, image_choice_b: `${base}/imagepairs/1041.jpg` }
        }
      }) }));
      await page.goto(`${base}/sender.html?prefill=1&own_email=FixtureSender&partner_email=FixtureReceiver&difficulty_level=2`, { waitUntil: "domcontentloaded" });
      const panel = page.locator('#senderMessagePanel.post-round-result');
      await panel.waitFor({ state: "visible" });
      await page.waitForFunction(() => [...document.querySelectorAll('#senderLevelFourChoiceGrid img')].every(img => img.complete && img.naturalWidth > 0));
      const geometry = () => page.evaluate(() => {
        const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
        return { images: box('#senderLevelFourChoiceGrid'), panel: box('#senderMessagePanel'), text: box('#senderMessagePanel .message-text') };
      });
      const before = await geometry();
      await page.addStyleTag({ content: newCss });
      const after = await geometry();
      if (width <= 600 && height > width) {
        assert.ok(after.panel.y >= after.images.bottom + 20, "Card clears photo result rings");
        assert.ok(after.text.y > after.images.bottom + 8, "Continuation text is unobscured");
        assert.deepEqual(after.images, before.images, "Photo positions and sizes stay unchanged");
        if (width === 375) console.log(`Reproduced original 375px gap: ${before.text.y - before.images.bottom}px; fixed: ${after.text.y - after.images.bottom}px`);
      } else {
        assert.deepEqual(after, before, "Wider and landscape layouts remain unchanged");
      }
      assert.equal(await panel.getByRole('button').count(), 2);
      for (const button of await panel.getByRole('button').all()) await button.click({ trial: true });
      if (width === 375) await page.screenshot({ path: path.join(os.tmpdir(), "espgym-image-result-375.png"), fullPage: true });
      console.log(`PASS ${width}x${height}: result spacing and both buttons reachable`);
      await context.close();
    }
  } finally {
    await browser?.close();
    php.kill();
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
