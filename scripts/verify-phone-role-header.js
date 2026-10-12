const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname, "..");
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "espgym-phone-header-"));
  const base = "http://127.0.0.1:48896";
  // Compare with the deployed layout before this horizontal-only adjustment.
  const oldCss = execFileSync("git", ["show", "50b1103bc389ac92bad560e9221ec16f29fd3f0b:telepathybeginner.css"], { cwd: root, encoding: "utf8" });
  const newCss = await fs.readFile(path.join(root, "telepathybeginner.css"), "utf8");
  const php = spawn("C:\\xampp\\php\\php.exe", ["-S", "127.0.0.1:48896", "-t", root], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: "ignore"
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [320, 360, 375, 390, 414, 768, 1280]) {
      for (const role of ["receiver", "sender"]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
        await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        await context.route("**/telepathybeginner.css*", route => route.fulfill({ contentType: "text/css", body: oldCss }));
        const page = await context.newPage();
        await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
        const card = page.locator(`[data-role-card="${role}"]`);
        await card.locator(".role-card-toggle").click();
        await page.waitForTimeout(600);
        const boxes = () => card.evaluate(c => Object.fromEntries([".role-card-title", ".role-card-inline-back", ".role-card-level-stack", ".role-card-level", ".role-level-bump-down", ".role-course-launch", ".role-messaging-launch", ".role-card-tagline", ".role-card-body"].map(s => {
          const r = c.querySelector(s).getBoundingClientRect();
          return [s, { x: r.x, y: r.y, right: r.right, bottom: r.bottom }];
        })));
        const before = await boxes();
        await page.addStyleTag({ content: newCss });
        const after = await boxes();
        const exercise = after[".role-card-level-stack"];
        const back = after[".role-card-inline-back"];
        const title = after[".role-card-title"];
        const course = after[".role-course-launch"];
        assert.ok(back.x >= title.right, `${width} ${role}: BACK must clear title`);
        assert.ok(back.right <= exercise.x, `${width} ${role}: BACK must clear Exercise`);
        for (const selector of [".role-level-bump-down"]) {
          const control = after[selector];
          assert.ok(course.x >= control.right || course.right <= control.x || course.y >= control.bottom || course.bottom <= control.y, `${width} ${role}: Learning Center must clear ${selector}`);
        }
        assert.deepEqual(course, before[".role-course-launch"], "Learning Center position and size must not change");
        assert.deepEqual(after[".role-messaging-launch"], before[".role-messaging-launch"], "Messages position and size must not change");
        if (width <= 760) assert.ok(after[".role-card-level"].x > before[".role-card-level"].x, "Exercise must move right");
        if (width <= 360) assert.ok(back.x > before[".role-card-inline-back"].x, "Narrow-phone BACK must move right");
        for (const selector of Object.keys(before)) {
          assert.equal(after[selector].y, before[selector].y, `${width} ${role}: ${selector} vertical position must not change`);
          assert.equal(after[selector].bottom, before[selector].bottom, `${width} ${role}: ${selector} height must not change`);
        }
        if (width >= 375) assert.equal(back.x, before[".role-card-inline-back"].x, "Wider-phone BACK must not move");
        if (width > 760) assert.deepEqual(after, before, "Tablet/desktop header must not change");
        const screenshot = path.join(os.tmpdir(), `espgym-header-${role}-${width}.png`);
        if ([360, 390].includes(width)) await card.screenshot({ path: screenshot });
        console.log(`PASS ${width}px ${role}: clear title, BACK, Exercise and Learning Center`);
        await card.locator("[data-collapse-role-card]").click();
        assert.equal(await card.locator(".role-card-toggle").getAttribute("aria-expanded"), "false");
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    php.kill();
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
