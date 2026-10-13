const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = `http://127.0.0.1:${process.env.ESPGYM_LOCATION_TEST_PORT || '48904'}`;
const consentKey = 'cones-location-sharing-disabled-v1';
const noticeKey = 'cones-human-location-notice-v1';

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-human-location-'));
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', new URL(base).host, '-t', root], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore'
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const api = (await browser.newContext()).request;
    for (let i = 0; ; i++) {
      try { await api.get(`${base}/api.php`); break; }
      catch (error) { if (i > 50) throw error; await new Promise(r => setTimeout(r, 100)); }
    }
    await api.post(`${base}/api.php`, { data: { action: 'claim_unique_handle', current_identifier: '', proposed_handle: 'Location Partner' } });
    const statePath = path.join(privateRoot, 'data', 'session-state.json');
    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    state.esp_pro_special_edition_enabled = true;
    await fs.writeFile(statePath, JSON.stringify(state));
    let sequence = 0;
    for (const width of [390, 1280]) for (const role of ['sender', 'receiver']) {
      const modes = process.env.ESPGYM_LOCATION_CASES ? process.env.ESPGYM_LOCATION_CASES.split(',') : ['without', 'with', 'denied', 'late', 'timeout', 'escape', 'enabled', 'browser-granted', 'changed', 'app-off', 'unsupported', 'grant-error', 'grant-timeout', 'grant-opt-out', 'grant-invalid', 'manual'];
      for (const mode of modes) {
        const name = `Location User ${++sequence}`;
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', permissions: mode === 'browser-granted' ? ['geolocation'] : [] });
        await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        await context.addInitScript(mode => {
          window.fixturePermission = { state: mode === 'app-off' || mode.startsWith('grant-') || mode === 'manual' ? 'granted' : 'prompt', onchange: null };
          const query = navigator.permissions.query.bind(navigator.permissions);
          if (mode !== 'browser-granted') navigator.permissions.query = descriptor => {
            if (descriptor.name !== 'geolocation') return query(descriptor);
            if (mode === 'unsupported') return Promise.reject(new Error('Permission query unavailable'));
            return Promise.resolve(window.fixturePermission);
          };
          window.locationCalls = 0;
          navigator.geolocation.getCurrentPosition = (success, failure) => {
            window.locationCalls++;
            window.locationSuccess = success;
            window.locationFailure = failure;
            if (mode === 'browser-granted' || mode === 'changed' || (mode === 'with' && window.fixturePermission.state === 'granted')) success({ coords: { latitude: 37.5, longitude: -122.2, accuracy: 50 } });
            if (mode === 'grant-error') failure({ code: 2 });
            if (mode === 'grant-invalid') success({ coords: { latitude: null, longitude: 2, accuracy: 1 } });
          };
        }, mode);
        const page = await context.newPage();
        page.on('dialog', dialog => dialog.accept());
        await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
        const card = page.locator(`[data-role-card="${role}"]`);
        await card.locator('.role-card-toggle').click();
        await card.locator(`[data-open-feature-setup="${role}"]`).click();
        await page.locator('[data-feature-setup-claim-action]').click();
        await page.locator('[data-handle-input]').fill(name);
        await page.locator('[data-submit-handle]').click();
        await page.locator('[data-handle-overlay]').waitFor({ state: 'hidden' });
        await card.locator('input[name="partnerName"]').fill('Location Partner');
        await card.locator('input[name="partnerName"]').dispatchEvent('change');
        await page.waitForTimeout(800);
        await card.locator(`[data-role-difficulty-bump="${role}"][data-direction="up"]`).click();
        await page.waitForTimeout(800);
        if (mode === 'enabled') await page.evaluate(key => localStorage.setItem(key, '0'), consentKey);
        if (mode === 'app-off') await page.evaluate(key => localStorage.setItem(key, '1'), consentKey);
        if (mode === 'changed') await page.evaluate(() => { window.fixturePermission.state = 'granted'; window.fixturePermission.onchange?.(); });
        if (mode === 'manual') await page.evaluate(() => {
          const state = JSON.parse(localStorage.getItem('cones-beginner-launcher-v2'));
          state.locationPermission = 'manual';
          state.deviceLocation = { latitude: 10, longitude: 20, source: 'manual-map', timestamp: Date.now() };
          localStorage.setItem('cones-beginner-launcher-v2', JSON.stringify(state));
          localStorage.setItem('cones-location-sharing-disabled-v1', '0');
        });
        assert.equal(await page.evaluate(() => window.locationCalls), 0);
        await card.locator('button[type="submit"]').click();
        const modal = page.locator('[data-human-location-notice]');
        const skipsNotice = ['enabled', 'browser-granted', 'changed', 'manual'].includes(mode) || mode.startsWith('grant-');
        if (mode === 'grant-opt-out') {
          await page.waitForFunction(() => window.locationCalls === 1);
          await page.evaluate(() => {
            localStorage.setItem('cones-location-sharing-disabled-v1', '1');
            window.dispatchEvent(new StorageEvent('storage', { key: 'cones-location-sharing-disabled-v1' }));
            window.locationSuccess({ coords: { latitude: 1, longitude: 2, accuracy: 3 } });
          });
        }
        if (!skipsNotice) {
          await modal.waitFor({ state: 'visible' });
          if (role === 'sender' && mode === 'without') await page.screenshot({ path: `C:/Users/dgrab/Documents/Codex/2026-05-01/to-start-with-i-want-to/playwright-ui-check/human-location-${width}.png` });
          assert.equal(await page.evaluate(() => window.locationCalls), 0, 'Opening notice must not request location');
          assert.equal(await modal.locator('button').first().innerText(), 'CONTINUE WITH LOCATION');
          assert.equal(await modal.locator('button').last().innerText(), 'CONTINUE WITHOUT LOCATION');
          if (mode === 'escape') {
            await page.keyboard.press('Escape');
            await modal.waitFor({ state: 'detached' });
            assert.equal(await card.locator('input[name="partnerName"]').inputValue(), 'Location Partner');
            assert.equal(await card.locator(`[data-pair-difficulty-label="${role}"]`).innerText(), 'Exercise 3');
            assert.equal(await page.locator('[data-exercise-agreement-overlay]').isVisible(), false);
            await card.locator('button[type="submit"]').click();
          }
          if (['with', 'denied', 'late', 'timeout'].includes(mode)) {
            await page.locator('[data-human-location-with]').click();
            assert.equal(await page.evaluate(() => window.locationCalls), 1);
            if (mode === 'with') await page.evaluate(() => {
              window.fixturePermission.state = 'granted';
              window.locationSuccess({ coords: { latitude: 37.5, longitude: -122.2, accuracy: 50 } });
            });
            if (mode === 'denied') {
              await page.evaluate(() => window.locationFailure({ code: 1 }));
              assert.match(await page.locator('[data-human-location-status]').innerText(), /could not be obtained/);
              await page.locator('[data-human-location-without]').click();
            }
            if (mode === 'timeout') {
              await page.waitForFunction(() => document.querySelector('[data-human-location-status]')?.textContent.includes('could not be obtained'), { timeout: 20000 });
              assert.equal(await page.locator('[data-human-location-with]').isEnabled(), true);
            }
            if (mode === 'late' || mode === 'timeout') {
              await page.locator('[data-human-location-without]').click();
              await page.evaluate(() => window.locationSuccess({ coords: { latitude: 1, longitude: 2, accuracy: 3 } }));
            }
          } else await page.locator('[data-human-location-without]').click();
        }
        await page.locator('[data-exercise-agreement-overlay]').waitFor({ state: 'visible' });
        const saved = await page.evaluate(() => ({ state: JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')), consent: localStorage.getItem('cones-location-sharing-disabled-v1'), notice: localStorage.getItem('cones-human-location-notice-v1'), calls: window.locationCalls }));
        assert.equal(saved.state.roleDifficultyLevels[role], '3');
        if (mode === 'with') {
          assert.equal(saved.consent, '0');
          assert.equal(saved.state.deviceLocation.latitude, 37.5);
        } else if (!skipsNotice) {
          assert.notEqual(saved.consent, '0');
          assert.equal(saved.state.deviceLocation, null);
        }
        if (!skipsNotice) assert.equal(saved.notice, '1');
        if (mode === 'browser-granted' || mode === 'changed') assert.equal(saved.consent, '0');
        if (mode === 'browser-granted' || mode === 'changed') {
          assert.equal(saved.calls, 1, 'Existing permission acquires an estimate on human GO');
          assert.equal(saved.state.deviceLocation.latitude, 37.5);
        }
        if (mode === 'manual') {
          assert.equal(saved.calls, 0);
          assert.equal(saved.state.deviceLocation.latitude, 10, 'Manual coordinates must not be overwritten');
        }
        if (mode.startsWith('grant-')) {
          assert.equal(saved.calls, 1);
          assert.equal(saved.state.deviceLocation, null, 'Failed, invalid, or opted-out estimate must not be saved');
          if (mode !== 'grant-opt-out') assert.equal(await page.evaluate(() => localStorage.getItem('cones-location-acquisition-issue-v1')), 'unavailable', 'GO failure must be remembered for the Location page');
          if (mode === 'grant-opt-out') await page.evaluate(() => {
            window.locationSuccess({ coords: { latitude: 1, longitude: 2, accuracy: 3 } });
            localStorage.setItem('cones-human-location-notice-v1', '1');
          });
        }
        const pairCode = [name, 'Location Partner'].map(n => n.toLowerCase().replace(/[^a-z0-9]+/g, '')).sort().join('__');
        await page.locator('[data-exercise-agreement-back]').click();
        await page.locator('[data-exercise-agreement-overlay]').waitFor({ state: 'hidden' });
        await card.locator('button[type="submit"]').click();
        await page.locator('[data-exercise-agreement-overlay]').waitFor({ state: 'visible' });
        if (mode === 'grant-timeout') {
          await page.evaluate(() => window.locationSuccess({ coords: { latitude: 1, longitude: 2, accuracy: 3 } }));
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation), null, 'Late estimate after timeout must be discarded');
        }
        assert.equal(await modal.count(), 0, 'The notice must not repeat on the next GO');
        let navigation;
        page.on('request', request => {
          const url = new URL(request.url());
          if (request.isNavigationRequest() && url.pathname.endsWith(`/${role}.html`)) navigation = url;
        });
        await api.post(`${base}/api.php`, { data: {
          action: 'begin_exercise_agreement', session_code: pairCode,
          role: role === 'sender' ? 'receiver' : 'sender', own_identifier: 'Location Partner', partner_identifier: name,
          exercise: '3', attempt_id: `location-${sequence}`
        } });
        await page.waitForURL(url => url.pathname.endsWith(`/${role}.html`), { timeout: 25000 });
        assert.equal(navigation.searchParams.get('difficulty_level'), '3');
        assert.equal(navigation.searchParams.get('partner_email'), 'Location Partner');
        if (['browser-granted', 'changed', 'manual'].includes(mode)) {
          const runtimeLocation = await page.evaluate(role => JSON.parse(localStorage.getItem(`cones-settings-v2-${role}`)).device_location, role);
          assert.match(runtimeLocation, mode === 'manual' ? /10.*20/ : /37\.5.*-122\.2/, 'Coordinates must reach the actual telepathy runtime');
        }
        await page.goto(`${base}/telepathybeginner.html?open=launcher`);
        if (!skipsNotice) assert.equal(await page.evaluate(() => localStorage.getItem('cones-human-location-notice-v1')), '1', 'Acknowledgment survives reload');
        assert.equal(await page.evaluate(() => window.locationCalls), 0, 'Reload must not reacquire location');
        await context.close();
        console.log(`PASS ${width}px ${role} ${mode}: preserved partner and Exercise 3, no map, one-time choice`);
      }
    }
  } finally {
    await browser?.close();
    php.kill();
    await new Promise(r => php.exitCode !== null ? r() : php.once('exit', r));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
