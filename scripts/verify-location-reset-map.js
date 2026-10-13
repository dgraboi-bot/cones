const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const origin = 'http://127.0.0.1:18766';
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1280]) for (const mode of ['success', 'unavailable', 'timeout', 'opt-out', 'close', 'manual', 'adjust']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', permissions: ['geolocation'], geolocation: { latitude: 37.5, longitude: -122.2, accuracy: 25 } });
      await context.addInitScript(() => {
        const acquire = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
        window.locationCalls = 0;
        navigator.geolocation.getCurrentPosition = (success, failure, options) => {
          window.locationCalls++;
          window.pendingEstimate = success;
          if (window.locationMode === 'unavailable') return failure({ code: 2 });
          if (['timeout', 'close', 'adjust'].includes(window.locationMode)) return;
          acquire(success, failure, options);
        };
      });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname.endsWith('.php')) return route.fulfill({ json: {} });
        const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (!file.startsWith(root + path.sep)) return route.abort();
        try {
          let body = await fs.readFile(file);
          if (url.pathname.endsWith('/vendor/leaflet/leaflet.js')) body = Buffer.concat([body, Buffer.from('\nL.Map.addInitHook(function() { window.fixtureMap = this; });')]);
          return route.fulfill({ body, contentType: types[path.extname(file)] || 'application/octet-stream' });
        } catch { return route.fulfill({ status: 404, body: 'Not found' }); }
      });
      const page = await context.newPage();
      page.on('dialog', dialog => dialog.accept());
      await page.goto(`${origin}/telepathybeginner.html?open=visitor-launcher`);
      await page.locator('[data-open-options]').click();
      await page.locator('[data-open-other-settings]').click();
      await page.locator('[data-reset-this-device]').click();
      await page.waitForURL(url => url.searchParams.get('open') === 'landing');
      await page.locator('[data-temporary-home-open-fresh]').click();
      await page.waitForURL(url => url.searchParams.get('open') === 'visitor-launcher');
      await page.locator('[data-open-options]').click();
      await page.locator('[data-open-messaging-setup]').click();
      await page.waitForFunction(() => document.querySelector('[data-feature-setup-location-status]')?.textContent === 'Location is currently allowed.');
      assert.equal(await page.evaluate(() => window.locationCalls), 0, 'RESET and Setup must not acquire coordinates');
      await page.evaluate(mode => {
        window.locationMode = mode;
        if (mode === 'opt-out') localStorage.setItem('cones-location-sharing-disabled-v1', '1');
        if (mode === 'manual') {
          const state = JSON.parse(localStorage.getItem('cones-beginner-launcher-v2'));
          state.locationPermission = 'manual';
          state.deviceLocation = { latitude: 10, longitude: 20, source: 'manual-map', timestamp: Date.now() };
          localStorage.setItem('cones-beginner-launcher-v2', JSON.stringify(state));
        }
      }, mode);
      await page.locator('[data-feature-setup-location-action]').click();
      if (mode === 'adjust') {
        await page.waitForFunction(() => window.locationCalls === 1);
        await page.locator('[data-location-picker-map]').click({ position: { x: 110, y: 110 } });
        await page.evaluate(() => window.pendingEstimate({ coords: { latitude: 37.5, longitude: -122.2, accuracy: 25 } }));
        await page.locator('[data-location-picker-save]').click();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation);
        assert.equal(saved.source, 'manual-map');
        assert.notEqual(saved.latitude, 37.5, 'An arriving estimate must not overwrite a manual adjustment');
      } else if (mode === 'close') {
        await page.waitForFunction(() => window.locationCalls === 1);
        await page.locator('[data-location-picker-cancel]').click();
        await page.evaluate(() => window.pendingEstimate({ coords: { latitude: 1, longitude: 2, accuracy: 10 } }));
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation), null, 'Closing must discard a late estimate');
        assert.equal(await page.locator('[data-location-picker-overlay]').isVisible(), false);
      } else {
        await page.waitForFunction(() => {
          const text = document.querySelector('[data-location-picker-status]')?.textContent;
          return text && text !== 'Loading map...' && !text.startsWith('Getting your browser');
        }, { timeout: 15000 });
        const result = await page.evaluate(() => ({ location: JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation, center: window.fixtureMap.getCenter(), zoom: window.fixtureMap.getZoom(), calls: window.locationCalls }));
        if (mode === 'success' || mode === 'manual') {
          const latitude = mode === 'manual' ? 10 : 37.5;
          const longitude = mode === 'manual' ? 20 : -122.2;
          assert.equal(result.location.latitude, latitude);
          assert.ok(Math.abs(result.center.lat - latitude) < 0.001 && Math.abs(result.center.lng - longitude) < 0.001);
          assert.ok(result.zoom >= 14, 'Map must show the saved/obtained area rather than the world');
          assert.equal(result.calls, mode === 'manual' ? 0 : 1);
          assert.doesNotMatch(await page.locator('[data-location-picker-status]').innerText(), /not set/);
          if (mode === 'success') await page.screenshot({ path: `C:/Users/dgrab/Documents/Codex/2026-05-01/to-start-with-i-want-to/playwright-ui-check/location-after-reset-${width}.png` });
        } else {
          assert.equal(result.location, null);
          assert.equal(result.calls, mode === 'opt-out' ? 0 : 1);
          if (mode !== 'opt-out') assert.match(await page.locator('[data-location-picker-issues]').innerText(), /automatic location estimate was unavailable/);
          if (mode === 'timeout') {
            await page.evaluate(() => window.pendingEstimate({ coords: { latitude: 1, longitude: 2, accuracy: 10 } }));
            assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).deviceLocation), null);
          }
        }
      }
      await context.close();
      console.log(`PASS ${width}px RESET ${mode}: correct acquisition, map center, privacy and late-callback behavior`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
