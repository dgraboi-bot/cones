const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-warning-defaults-'));
  const base = 'http://127.0.0.1:48904';
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48904', '-t', path.resolve(__dirname, '..')], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore'
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const setup = await browser.newContext();
    await setup.request.post(`${base}/api.php`, { data: { action: 'claim_unique_handle', current_identifier: '', proposed_handle: 'Defaults Fixture Owner' } });
    const statePath = path.join(privateRoot, 'data', 'session-state.json');
    const serverState = JSON.parse(await fs.readFile(statePath, 'utf8'));
    serverState.esp_pro_special_edition_enabled = true;
    await fs.writeFile(statePath, JSON.stringify(serverState));
    await setup.close();
    const failures = [];
    for (const warn of [false, true]) {
      for (const saved of ['', '1', '2', '3', '4']) {
        const userAgent = warn
          ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';
        const context = await browser.newContext({ userAgent, viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
        await context.addInitScript(saved => {
          Object.defineProperty(navigator, 'userAgentData', { get: () => undefined });
          if (saved && !localStorage.getItem('fixture-seeded')) {
            localStorage.setItem('fixture-seeded', '1');
            localStorage.setItem('cones-beginner-launcher-v2', JSON.stringify({ entryMode: 'visitor', difficultyLevel: saved, roleDifficultyLevels: { sender: saved, receiver: saved } }));
            for (const role of ['sender', 'receiver']) localStorage.setItem(`cones-settings-v2-${role}`, JSON.stringify({ difficulty_level: saved }));
          }
        }, saved);
        await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        const page = await context.newPage();
        const dialogs = [];
        page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
        await page.goto(`${base}/telepathybeginner.html?open=landing`);
        await page.waitForTimeout(1000);
        await page.locator('[data-temporary-home-esp-pro-explore]').click();
        await page.locator('[data-view="options"]').waitFor({ state: 'visible' });
        await page.locator('[data-open-telepathy-practice]').click();
        for (const role of ['sender', 'receiver']) {
          const card = page.locator(`[data-role-card="${role}"]`);
          await card.locator('.role-card-toggle').click();
          await page.waitForTimeout(400);
          const actual = await card.locator(`[data-pair-difficulty-label="${role}"]`).innerText();
          const expected = `Exercise ${saved || '2'}`;
          console.log(`${warn ? 'Warned Firefox identity' : 'Tested Chrome identity'}, saved=${saved || 'none'}, ${role}: ${actual}`);
          if (actual !== expected) failures.push(`${warn ? 'warned' : 'tested'} saved=${saved || 'none'} ${role}: expected ${expected}, got ${actual}`);
          await card.locator('.role-card-inline-back').click();
        }
        assert.equal(dialogs.length, warn ? 1 : 0);
        await context.close();
      }
    }
    assert.deepEqual(failures, [], 'Warning must not change defaults or overwrite saved exercises');
  } finally {
    await browser?.close(); php.kill();
    await new Promise(resolve => php.exitCode !== null ? resolve() : php.once('exit', resolve));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
