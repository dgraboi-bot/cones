const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-location-opt-in-'));
  const base = 'http://127.0.0.1:48902';
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48902', '-t', path.resolve(__dirname, '..')], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore'
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [390, 1280]) {
      for (const permission of ['granted', 'prompt', 'denied']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
        await context.addInitScript(permission => {
          const query = navigator.permissions.query.bind(navigator.permissions);
          navigator.permissions.query = descriptor => descriptor.name === 'geolocation'
            ? Promise.resolve({ state: permission, onchange: null }) : query(descriptor);
          navigator.geolocation.getCurrentPosition = (success, failure) => {
            sessionStorage.setItem('fixture-location-requests', String(Number(sessionStorage.getItem('fixture-location-requests') || 0) + 1));
            if (permission === 'denied') failure({ code: 1 });
            else success({ coords: { latitude: 37.5, longitude: -122.2, accuracy: 15 } });
          };
          navigator.geolocation.watchPosition = () => { throw new Error('Unexpected location watch'); };
        }, permission);
        await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        const page = await context.newPage();
        const alerts = [];
        page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
        const requests = () => page.evaluate(() => Number(sessionStorage.getItem('fixture-location-requests') || 0));
        await page.goto(`${base}/telepathybeginner.html?open=landing`);
        await page.waitForTimeout(1000);
        assert.equal(await requests(), 0, 'Landing Page must not request location');
        await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
        await page.waitForTimeout(1000);
        await page.locator('[data-open-options]').click();
        await page.locator('[data-open-messaging-setup]').click();
        await page.locator('[data-view="feature-setup"]').waitFor({ state: 'visible' });
        assert.equal(await requests(), 0, 'Opening Setup must not request location');
        assert.equal(await page.locator('[data-feature-setup-item="location"] .feature-setup-title').innerText(), 'Location');
        assert.equal(await page.locator('[data-feature-setup-item="location"] .feature-setup-text').innerText(), 'Your location is only used when you select telepathy with a partner. Setting your location allows the distance between you and your partner to be computed. Distance then shows up in reports and on the GLOBE page.');
        await page.waitForFunction(expected => document.querySelector('[data-feature-setup-location-status]')?.textContent === expected,
          'Location is not currently allowed.');
        const button = page.locator('[data-feature-setup-location-action]');
        assert.equal(await button.innerText(), 'LOCATION');
        assert.equal(await page.locator('[data-feature-setup-item="location"] button').count(), 1, 'Reuse the existing button, without adding another');
        await button.click();
        await page.locator('[data-location-picker-overlay]').waitFor({ state: 'visible' });
        await page.waitForFunction(() => document.querySelector('[data-location-picker-status]')?.textContent !== 'Loading map...');
        assert.equal(await requests(), 0, 'Opening LOCATION must let the user choose before requesting access');
        assert.ok(!alerts.some(text => text.includes('not allowed by the browser')), 'No blocking browser-settings alert');
        const layout = await page.evaluate(() => {
          const overlay = document.querySelector('[data-location-picker-overlay]');
          const dialog = overlay.querySelector('.location-picker-dialog');
          const back = overlay.querySelector('[data-location-picker-cancel]').getBoundingClientRect();
          const use = overlay.querySelector('[data-location-picker-use-browser]').getBoundingClientRect();
          return { outer: getComputedStyle(overlay).overflowY, body: getComputedStyle(document.body).overflowY,
            root: getComputedStyle(document.documentElement).overflowY, dialog: getComputedStyle(dialog).overflowY,
            outerFits: overlay.scrollHeight <= overlay.clientHeight + 1,
            dialogFits: dialog.getBoundingClientRect().bottom <= innerHeight,
            labelsFit: [...overlay.querySelectorAll('button')].every(button => button.scrollWidth <= button.clientWidth + 1),
            backAbove: back.bottom <= use.top, aligned: Math.abs(back.right - use.right) < 1 };
        });
        assert.equal(layout.outer, 'hidden', 'Remove the outer scrollbar');
        assert.equal(layout.body, 'hidden', 'Hide background document scrollbar');
        assert.equal(layout.root, 'hidden');
        assert.equal(layout.dialog, 'auto', 'Keep useful dialog scrolling');
        assert.ok(layout.outerFits && layout.dialogFits && layout.backAbove && layout.aligned && layout.labelsFit, JSON.stringify(layout));
        if (permission === 'prompt') await page.screenshot({ path: `C:/Users/dgrab/Documents/Codex/2026-05-01/to-start-with-i-want-to/playwright-ui-check/location-dialog-${width}.png` });
        if (permission === 'denied') {
          await page.locator('[data-location-picker-use-browser]').click();
          await page.waitForFunction(() => document.querySelector('[data-location-picker-status]')?.textContent.includes('Browser location is blocked'));
          assert.ok(!alerts.some(text => text.includes('not allowed by the browser')));
          await page.locator('[data-location-picker-map]').click({ position: { x: 100, y: 100 } });
          await page.locator('[data-location-picker-save]').click();
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).locationPermission), 'manual');
        } else {
          await page.locator('[data-location-picker-use-browser]').click();
          await page.waitForFunction(() => Number(sessionStorage.getItem('fixture-location-requests')) === 1);
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation.latitude), 37.5);
        }
        assert.equal(await page.evaluate(() => localStorage.getItem('cones-location-sharing-disabled-v1')), '0', 'Only explicit selection records app consent');
        await page.locator('[data-location-picker-cancel]').click();
        await page.waitForFunction(() => document.querySelector('[data-feature-setup-location-status]')?.textContent === 'Location is currently allowed.');
        const beforeConsentReload = await requests();
        await page.reload();
        await page.waitForTimeout(1000);
        await page.locator('[data-open-options]').click();
        await page.locator('[data-open-messaging-setup]').click();
        await page.waitForFunction(() => document.querySelector('[data-feature-setup-location-status]')?.textContent === 'Location is currently allowed.');
        assert.equal(await requests(), beforeConsentReload, 'Saved explicit consent must not trigger automatic acquisition');
        await page.locator('[data-feature-setup-location-action]').click();
        await page.waitForFunction(() => document.querySelector('[data-location-picker-status]')?.textContent !== 'Loading map...');
        await page.locator('[data-location-picker-disallow]').click();
        assert.equal(alerts.at(-1), 'Location has been set to not allowed.');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation), null);
        assert.equal(await page.evaluate(() => localStorage.getItem('cones-location-sharing-disabled-v1')), '1');
        await page.locator('[data-location-picker-cancel]').click();
        await page.waitForFunction(() => document.querySelector('[data-feature-setup-location-status]')?.textContent === 'Location is not currently allowed.');
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('location-picker-open')), false, 'BACK restores page scrolling');
        const beforeReload = await requests();
        await page.reload();
        await page.waitForTimeout(1000);
        assert.equal(await requests(), beforeReload, 'Reload must not reacquire location, even with existing permission');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).locationPermission), 'denied', 'App opt-out survives browser-granted permission and reload');
        if (permission === 'granted') {
          await page.locator('[data-open-options]').click();
          await page.locator('[data-open-messaging-setup]').click();
          await page.locator('[data-feature-setup-location-action]').click();
          await page.waitForFunction(() => document.querySelector('[data-location-picker-status]')?.textContent !== 'Loading map...');
          assert.equal(await requests(), beforeReload, 'Reopening an opted-out dialog must not request location');
          await page.locator('[data-location-picker-use-browser]').click();
          await page.waitForFunction(() => localStorage.getItem('cones-location-sharing-disabled-v1') === '0');
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation.latitude), 37.5, 'Explicit use can enable location again');
          await page.evaluate(() => { navigator.geolocation.getCurrentPosition = callback => { window.pendingLocationCallback = callback; }; });
          await page.locator('[data-location-picker-refresh-browser]').click();
          await page.locator('[data-location-picker-disallow]').click();
          await page.evaluate(() => window.pendingLocationCallback({ coords: { latitude: 1, longitude: 2, accuracy: 3 } }));
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation), null, 'Late browser callback must not undo opt-out');
        }
        await context.close();
        console.log(`PASS ${width}px ${permission}: explicit location only; startup, Setup and reload do not prompt`);
      }
    }
    const statePath = path.join(privateRoot, 'data', 'session-state.json');
    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    state.esp_pro_special_edition_enabled = true;
    await fs.writeFile(statePath, JSON.stringify(state));
    const devices = {};
    for (const role of ['sender', 'receiver']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: 'block' });
      await context.addInitScript(() => {
        navigator.geolocation.getCurrentPosition = (_success, failure) => {
          sessionStorage.setItem('unexpected-location', '1');
          failure?.({ code: 1 });
        };
      });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on('dialog', dialog => { console.log(`Human ${role} dialog: ${dialog.message()}`); return dialog.accept(); });
      await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
      await page.waitForTimeout(1000);
      const card = page.locator(`[data-role-card="${role}"]`);
      await card.locator('.role-card-toggle').click();
      await card.locator(`[data-open-feature-setup="${role}"]`).click();
      await page.locator('[data-feature-setup-claim-action]').click();
      const name = `No Location ${role}`;
      await page.locator('[data-handle-input]').fill(name);
      await page.locator('[data-submit-handle]').click();
      await page.locator('[data-handle-overlay]').waitFor({ state: 'hidden' });
      devices[role] = { context, page, card, name };
    }
    for (const role of ['sender', 'receiver']) {
      await devices[role].card.locator('input[name="partnerName"]').fill(devices[role === 'sender' ? 'receiver' : 'sender'].name);
    }
    await devices.sender.card.locator('button[type="submit"]').click();
    await devices.sender.page.locator('[data-exercise-agreement-overlay]').waitFor({ state: 'visible' });
    await devices.receiver.card.locator('button[type="submit"]').click();
    for (const role of ['sender', 'receiver']) await devices[role].page.waitForURL(url => url.pathname.endsWith(`/${role}.html`));
    await devices.receiver.page.waitForFunction(() => document.querySelector('#countdownNumber')?.textContent.includes('Press when ready'));
    await devices.receiver.page.locator('#countdownBox').click();
    await devices.sender.page.waitForFunction(() => document.querySelector('#countdownNumber')?.textContent.includes('Press'));
    await devices.sender.page.locator('#countdownBox').click();
    await devices.receiver.page.waitForFunction(() => document.querySelector('#countdownNumber')?.textContent.includes('done receiving'), { timeout: 25000 });
    await devices.receiver.page.locator('#countdownBox').click();
    await devices.receiver.page.locator('#receiverLevelFourChoiceGrid .image-choice-card').first().click();
    await devices.receiver.page.locator('#receiverLevelFourChoiceGrid .image-choice-card.actual').waitFor({ state: 'visible' });
    for (const { page, context } of Object.values(devices)) {
      assert.equal(await page.evaluate(() => sessionStorage.getItem('unexpected-location')), null, 'Human trial must not request location');
      await context.close();
    }
    console.log('PASS two real browsers: human Exercise 2 completed without location or permission requests');
  } finally {
    await browser?.close(); php.kill();
    await new Promise(resolve => php.exitCode !== null ? resolve() : php.once('exit', resolve));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
