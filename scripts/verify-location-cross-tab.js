const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-location-cross-tab-'));
  const base = 'http://127.0.0.1:48903';
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48903', '-t', root], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore'
  });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      context.on('page', page => page.on('dialog', dialog => dialog.accept()));
      await context.addInitScript(() => {
        const status = { state: 'granted', onchange: null };
        const query = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = descriptor => descriptor.name === 'geolocation' ? Promise.resolve(status) : query(descriptor);
        window.changeLocationPermission = state => { status.state = state; status.onchange?.(); };
        navigator.geolocation.getCurrentPosition = () => { throw new Error('No automatic geolocation is allowed'); };
      });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const control = await context.newPage();
      await control.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
      await control.waitForTimeout(1000);
      await control.evaluate(() => {
        localStorage.setItem('cones-location-sharing-disabled-v1', '0');
        const state = JSON.parse(localStorage.getItem('cones-beginner-launcher-v2'));
        state.locationPermission = 'manual';
        state.deviceLocation = { latitude: 37.5, longitude: -122.2, timestamp: Date.now(), source: 'manual-map' };
        localStorage.setItem('cones-beginner-launcher-v2', JSON.stringify(state));
      });
      await control.locator('[data-open-options]').click();
      await control.locator('[data-open-messaging-setup]').click();
      await control.locator('[data-feature-setup-location-action]').click();
      await control.waitForFunction(() => document.querySelector('[data-location-picker-status]')?.textContent !== 'Loading map...');

      const runtimes = {};
      for (const role of ['sender', 'receiver']) {
        const page = await context.newPage();
        const requests = [];
        const round = { id: `cross-tab-${width}`, start_server_ms: Date.now() - 8500, stimulus_kind: 'image_pair',
          difficulty_level: '2', image_sent_index: 1, guess_layout_number: null,
          image_sent: `${base}/imagepairs/1025.jpg`, image_choice_a: `${base}/imagepairs/1025.jpg`, image_choice_b: `${base}/imagepairs/1041.jpg` };
        await page.route('**/api.php', async route => {
          const request = route.request().postDataJSON();
          requests.push(request);
          if (request.action === 'submit_guess') { round.guess_layout_number = 1; round.completed_server_ms = Date.now(); }
          await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, pair_difficulty: '2', server_now_ms: Date.now(),
            trial_record_append: { appended: true }, state: { round: role === 'receiver' ? round : null,
              sender_online: true, receiver_online: true, receiver_ready: false,
              sender_profile: { name: 'Cross Sender', location: '{"latitude":37.5,"longitude":-122.2}' },
              receiver_profile: { name: 'Cross Receiver', location: '{"latitude":37.5,"longitude":-122.2}' },
              post_round: round.completed_server_ms ? { receiver_choice: null, sender_choice: null } : null }
          }) });
        });
        await page.goto(`${base}/${role}.html?prefill=1&own_email=Cross%20${role}&partner_email=Other&difficulty_level=2&loc_latitude=37.5&loc_longitude=-122.2`);
        await page.waitForFunction(role => JSON.parse(localStorage.getItem(`cones-settings-v2-${role}`)).device_location !== '', role);
        await page.waitForTimeout(250);
        assert.ok(requests.some(request => request.profile?.location), `${role}: fixture must begin with a cached location`);
        runtimes[role] = { page, requests };
      }

      const globe = await context.newPage();
      // Keep the real GLOBE controller, data parser, and UI. Replace only the
      // external WebGL renderer so this privacy test is offline and deterministic.
      await globe.route('https://unpkg.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `
        window.Globe = () => () => {
          const data = window.globeFixtureData = {};
          const controls = {};
          let viewer;
          viewer = new Proxy({}, { get: (_, key) => (...args) => {
            if (key === 'controls') return controls;
            if (!args.length) return data[key];
            data[key] = args[0]; return viewer;
          }});
          return viewer;
        };` }));
      await globe.route('**/api.php', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true,
        location_visualization: { available: true, pair: {}, summary: { connections: 1 }, connections: [
          { sender: { lat: 37.5, long: -122.2 }, receiver: { lat: 42, long: -70 }, distance_meters_mean: 1000000, color_class: 'green' }
        ] }
      }) }));
      await globe.goto(`${base}/globe/index.html?receiver_id=CrossReceiver&sender_id=CrossSender`);
      await globe.waitForFunction(() => window.globeFixtureData?.arcsData?.length === 1);
      await globe.evaluate(() => window.changeLocationPermission('denied'));
      await globe.waitForTimeout(500);
      assert.equal(await globe.evaluate(() => window.globeFixtureData.arcsData.length), 1, 'Browser denial must not hide manually allowed stored routes');

      const cutoffs = Object.fromEntries(Object.entries(runtimes).map(([role, runtime]) => [role, runtime.requests.length]));
      await control.locator('[data-location-picker-disallow]').click();
      await globe.waitForFunction(() => window.globeFixtureData.arcsData.length === 0);
      await globe.evaluate(() => window.changeLocationPermission('granted'));
      await globe.waitForTimeout(300);
      assert.equal(await globe.evaluate(() => window.globeFixtureData.arcsData.length), 0, 'Browser permission cannot override an app opt-out');
      await globe.locator('[data-globe-labels]').uncheck();
      await globe.locator('[data-globe-labels]').check();
      assert.equal(await globe.evaluate(() => window.globeFixtureData.labelsData.length), 0, 'Label toggle must not reveal hidden routes');
      for (const [role, runtime] of Object.entries(runtimes)) {
        await runtime.page.waitForFunction(role => JSON.parse(localStorage.getItem(`cones-settings-v2-${role}`)).device_location === '', role);
        await runtime.page.waitForTimeout(1300);
        const after = runtime.requests.slice(cutoffs[role]);
        assert.ok(after.some(request => request.action === 'heartbeat'), `${role}: immediate empty-profile update`);
        assert.ok(after.every(request => !request.profile?.location), `${role}: no cached coordinates in subsequent requests`);
      }
      const receiver = runtimes.receiver;
      await receiver.page.waitForFunction(() => document.querySelector('#countdownNumber')?.textContent.includes('done receiving'));
      await receiver.page.locator('#countdownBox').click();
      await receiver.page.locator('#receiverLevelFourChoiceGrid .image-choice-card').first().click();
      await receiver.page.waitForTimeout(1800);
      const record = receiver.requests.find(request => request.action === 'append_trial_record')?.trial_record;
      assert.ok(record, 'Fixture must record a completed trial');
      assert.equal(record['rx location'], '', 'Stale server profile must not put the opted-out location back in the trial');
      await control.evaluate(() => localStorage.setItem('cones-location-sharing-disabled-v1', '0'));
      await globe.waitForFunction(() => window.globeFixtureData.arcsData.length === 1);
      await globe.evaluate(() => window.changeLocationPermission('granted'));
      await globe.waitForTimeout(300);
      assert.equal(await globe.evaluate(() => window.globeFixtureData.arcsData.length), 1);
      await control.evaluate(() => localStorage.removeItem('cones-location-sharing-disabled-v1'));
      await globe.waitForFunction(() => window.globeFixtureData.arcsData.length === 0);
      await context.close();
      console.log(`PASS ${width}px: browser denial preserves manual routes; cross-tab opt-out hides GLOBE, clears both runtime caches, and strips future profiles/trials`);
    }
  } finally {
    await browser?.close(); php.kill();
    await new Promise(resolve => php.exitCode !== null ? resolve() : php.once('exit', resolve));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
