const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const base = 'http://127.0.0.1:48906';

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-location-issues-'));
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48906', '-t', path.resolve(__dirname, '..')], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore' });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const api = (await browser.newContext()).request;
    for (let i = 0; ; i++) {
      try { await api.get(`${base}/api.php`); break; }
      catch (error) { if (i > 50) throw error; await new Promise(r => setTimeout(r, 100)); }
    }
    for (const width of [390, 1280]) for (const role of ['sender', 'receiver']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await context.addInitScript(() => {
        window.locationFailureCode = 2;
        const permission = { state: 'prompt', onchange: null };
        navigator.permissions.query = async () => permission;
        navigator.geolocation.getCurrentPosition = (success, failure) => {
          if (window.locationFailureCode) failure({ code: window.locationFailureCode });
          else { permission.state = 'granted'; success({ coords: { latitude: 37.5, longitude: -122.2, accuracy: 15 } }); }
        };
      });
      const page = await context.newPage();
      const alerts = [];
      page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
      await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
      await page.locator(`[data-role-card="${role}"] .role-card-toggle`).click();
      await page.locator(`[data-open-feature-setup="${role}"]`).click();
      const open = async () => {
        await page.locator('[data-feature-setup-location-action]').click();
        await page.waitForFunction(() => document.querySelector('[data-location-picker-status]')?.textContent !== 'Loading map...');
      };
      await open();
      const issues = page.locator('[data-location-picker-issues]');
      assert.equal(await issues.isVisible(), false, 'No warning without an observed problem');
      for (const code of [2, 3, 1]) {
        await page.evaluate(code => { window.locationFailureCode = code; }, code);
        await page.locator('[data-location-picker-use-browser]').click();
        assert.match(await issues.innerText(), code === 1 ? /Browser location could not be obtained/ : /automatic location estimate was unavailable/);
        assert.match(await issues.innerText(), /set your location manually on the map below/);
        assert.equal(alerts.length, 0, 'Failures use inline notices, not alerts');
      }
      await page.locator('[data-location-picker-cancel]').click();
      await open();
      assert.match(await issues.innerText(), /Browser location could not be obtained/, 'Unresolved condition survives reopening');
      await page.screenshot({ path: `C:/Users/dgrab/Documents/Codex/2026-05-01/to-start-with-i-want-to/playwright-ui-check/location-issues-${width}-${role}.png` });
      await page.locator('[data-location-picker-map]').click({ position: { x: 110, y: 110 } });
      await page.locator('[data-location-picker-save]').click();
      assert.equal(await issues.isVisible(), false, 'Manual save clears the local problem');
      await page.locator('[data-location-picker-cancel]').click();
      await open();
      assert.equal(await issues.isVisible(), false, 'Resolved condition stays cleared');
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('cones-beginner-launcher-v2'));
        state.deviceLocation = null;
        state.locationPermission = 'prompt';
        localStorage.setItem('cones-beginner-launcher-v2', JSON.stringify(state));
        window.locationFailureCode = 3;
      });
      await page.locator('[data-location-picker-refresh-browser]').click();
      assert.match(await issues.innerText(), /automatic location estimate was unavailable/);
      await page.evaluate(() => { window.locationFailureCode = 0; });
      await page.locator('[data-location-picker-use-browser]').click();
      assert.equal(await issues.isVisible(), false, 'Successful browser acquisition clears the problem');
      await page.locator('[data-location-picker-cancel]').click();

      const own = `Owner ${width} ${role}`;
      const partner = `Partner ${width} ${role}`;
      const code = [own, partner].map(n => n.toLowerCase().replace(/[^a-z0-9]+/g, '')).sort().join('__');
      await page.evaluate(({ role, own, partner }) => {
        const state = JSON.parse(localStorage.getItem('cones-beginner-launcher-v2'));
        state.recognizedIdentity = own;
        state.ownNames[role] = own;
        state.currentPartners[role] = partner;
        localStorage.setItem('cones-recognized-identity-v1', own);
        localStorage.setItem('cones-beginner-launcher-v2', JSON.stringify(state));
      }, { role, own, partner });
      const statePath = path.join(privateRoot, 'data', 'session-state.json');
      const writePartner = async (location, age = 0, pairedWith = own) => {
        const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
        state.sessions[code] = { updated_ms: Date.now(), [role === 'sender' ? 'receiver' : 'sender']: { last_seen_ms: Date.now() - age, profile: { own_email: partner, partner_email: pairedWith, location } } };
        await fs.writeFile(statePath, JSON.stringify(state));
      };
      await writePartner('');
      const direct = await api.post(`${base}/api.php`, { data: { action: 'get_pair_location_status', session_code: code, role, own_identifier: own, partner_identifier: partner } });
      assert.equal((await direct.json()).partner_location_available, false, 'Fixture must be a confirmed live missing-location partner');
      await open();
      await page.waitForFunction(() => document.querySelector('[data-location-picker-issues]')?.textContent.includes("Your partner's location is unavailable"));
      assert.doesNotMatch(await issues.innerText(), /set your location manually/, 'Own manual location cannot fix the partner');
      await page.locator('[data-location-picker-map]').click({ position: { x: 120, y: 120 } });
      await page.locator('[data-location-picker-save]').click();
      assert.match(await issues.innerText(), /Your partner's location is unavailable/, 'Saving own location must not clear the partner problem');
      await writePartner('{"latitude":20,"longitude":30}');
      await page.waitForFunction(() => document.querySelector('[data-location-picker-issues]')?.hidden);
      await writePartner('');
      await page.waitForFunction(() => !document.querySelector('[data-location-picker-issues]')?.hidden);
      await writePartner('', 60000);
      await page.waitForFunction(() => document.querySelector('[data-location-picker-issues]')?.hidden);
      await writePartner('', 0, 'Someone Else');
      const payload = { action: 'get_pair_location_status', session_code: code, role, own_identifier: own, partner_identifier: partner };
      assert.equal((await (await api.post(`${base}/api.php`, { data: payload })).json()).partner_location_available, null, 'Unrelated pair must not cause a warning');
      const before = await fs.readFile(statePath, 'utf8');
      const result = await (await api.post(`${base}/api.php`, { data: { ...payload, session_code: 'unknown_pair' } })).json();
      assert.deepEqual(result, { ok: true, partner_location_available: null });
      assert.equal(await fs.readFile(statePath, 'utf8'), before, 'Status requests must not modify server data');
      await page.locator('[data-location-picker-cancel]').click();
      await context.close();
      console.log(`PASS ${width}px ${role}: inline failure guidance, manual/browser resolution, live partner recovery, unknown/stale suppression, read-only API`);
    }
  } finally {
    await browser?.close(); php.kill();
    await new Promise(r => php.exitCode !== null ? r() : php.once('exit', r));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
