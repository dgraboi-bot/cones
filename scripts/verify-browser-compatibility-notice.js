const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const message = 'ESP GYM has been tested with Chrome and Microsoft Edge on Windows PCs, Safari on iPhones and iPads, and Chrome on Android devices. Please use one of these tested browser/device combinations if available. Other combinations may not fully support all advanced features.';
const safari = 'AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const chrome = 'AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';
const cases = [
  ['iPhone Google app (observed request)', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/176.0.394746740 Mobile/15E148 Safari/604.1', 'iPhone', 'Apple Computer, Inc.', 5, true],
  ['Desktop-mode iPhone Chrome', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140 Version/18.0 Safari/605.1.15', 'MacIntel', 'Apple Computer, Inc.', 5, true],
  ['Windows Chrome', `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${chrome}`, 'Win32', 'Google Inc.', 0, false],
  ['Windows Edge', `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${chrome} Edg/140.0`, 'Win32', 'Google Inc.', 0, false],
  ['iPhone Safari', `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ${safari}`, 'iPhone', 'Apple Computer, Inc.', 5, false],
  ['iPad Safari', `Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) ${safari}`, 'iPad', 'Apple Computer, Inc.', 5, false],
  ['Desktop-mode iPad Safari', `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) ${safari}`, 'MacIntel', 'Apple Computer, Inc.', 5, false],
  ['Android Chrome', `Mozilla/5.0 (Linux; Android 15) ${chrome}`, 'Linux armv8l', 'Google Inc.', 5, false],
  ['Windows Firefox', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', 'Win32', '', 0, true],
  ['iPhone Chrome', `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1`, 'iPhone', 'Apple Computer, Inc.', 5, true],
  ['iPhone Firefox', `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ${safari} FxiOS/140.0`, 'iPhone', 'Apple Computer, Inc.', 5, true],
  ['Android Samsung', `Mozilla/5.0 (Linux; Android 15) ${chrome} SamsungBrowser/28.0`, 'Linux armv8l', 'Google Inc.', 5, true],
  ['Windows Opera', `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${chrome} OPR/120.0`, 'Win32', 'Google Inc.', 0, true],
  ['Mac Safari', `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) ${safari}`, 'MacIntel', 'Apple Computer, Inc.', 0, true],
  ['Linux Chrome', `Mozilla/5.0 (X11; Linux x86_64) ${chrome}`, 'Linux x86_64', 'Google Inc.', 0, true]
];

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-browser-notice-'));
  const base = 'http://127.0.0.1:48901';
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48901', '-t', path.resolve(__dirname, '..')], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore'
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const [label, userAgent, platform, vendor, touch, warn] of cases) {
      const context = await browser.newContext({ userAgent, viewport: { width: touch ? 390 : 1280, height: 900 }, serviceWorkers: 'block' });
      await context.addInitScript(({ platform, vendor, touch }) => {
        Object.defineProperties(navigator, {
          platform: { get: () => platform }, vendor: { get: () => vendor },
          maxTouchPoints: { get: () => touch }, userAgentData: { get: () => undefined }
        });
      }, { platform, vendor, touch });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      const dialogs = [];
      page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
      await page.goto(`${base}/telepathybeginner.html?open=landing`);
      await page.waitForTimeout(1000);
      const landing = page.locator('[data-view="temporary-home-page"]');
      await landing.waitFor({ state: 'visible' });
      assert.equal(dialogs.length, 0, `${label}: no warning on Landing Page`);
      await page.locator('[data-footer-open-help]').click();
      await page.locator('[data-view="help"]').waitFor({ state: 'visible' });
      assert.deepEqual(dialogs, warn ? [message] : [], `${label}: exact notice on entry`);
      await page.locator('[data-close-help]').click();
      await landing.waitFor({ state: 'visible' });
      await page.locator('[data-footer-open-help]').click();
      await page.locator('[data-view="help"]').waitFor({ state: 'visible' });
      assert.equal(dialogs.length, warn ? 1 : 0, `${label}: no repeated warning`);
      await page.reload();
      await page.waitForTimeout(1000);
      await page.locator('[data-footer-open-help]').click();
      await page.locator('[data-view="help"]').waitFor({ state: 'visible' });
      assert.equal(dialogs.length, warn ? 1 : 0, `${label}: acknowledgment survives reload`);
      if (label === 'Windows Firefox') {
        for (const [selector, destination] of [
          ['[data-temporary-home-esp-pro-explore]', '[data-view="options"]'],
          ['[data-temporary-home-clairvoyance-tour]', '[data-view="clairvoyance-viewing"]']
        ]) {
          await page.evaluate(() => sessionStorage.removeItem('cones-browser-compatibility-notice-v1'));
          await page.goto(`${base}/telepathybeginner.html?open=landing`);
          await page.waitForTimeout(1000);
          const before = dialogs.length;
          await page.locator(selector).click();
          await page.locator(destination).waitFor({ state: 'visible' });
          assert.equal(dialogs.length, before + 1, `Entry ${selector} must show the advisory`);
          assert.equal(dialogs.at(-1), message);
        }
        console.log('PASS untested browser: main-menu and guided-tour entry both continue after OK');
      }
      await context.close();
      console.log(`PASS ${label}: ${warn ? 'one exact advisory' : 'no advisory'}, navigation continues`);
    }
  } finally {
    await browser?.close();
    php.kill();
    await new Promise(resolve => php.exitCode !== null ? resolve() : php.once('exit', resolve));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
