const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const http = require('node:http');
const zlib = require('node:zlib');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const slash = value => value.replaceAll('\\', '/');

function request(base, file, encoding, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(new URL(file, base), { method, headers: { 'Accept-Encoding': encoding } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(10000, () => req.destroy(new Error('HTTP test timeout')));
    req.on('error', reject); req.end();
  });
}

(async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-compression-'));
  const port = 18910;
  const base = `http://127.0.0.1:${port}/`;
  let server, php, browser;
  try {
    const modules = ['authz_core', 'authz_host', 'dir', 'mime', 'rewrite', 'headers', 'filter', 'deflate', 'proxy', 'proxy_http'];
    const config = [
      'ServerRoot "C:/xampp/apache"', `Listen 127.0.0.1:${port}`, 'ServerName localhost',
      `PidFile "${slash(path.join(temp, 'httpd.pid'))}"`, `ErrorLog "${slash(path.join(temp, 'error.log'))}"`, 'LogLevel warn',
      ...modules.map(name => `LoadModule ${name}_module modules/mod_${name}.so`),
      'ProxyPassMatch "^/(.*\\.php)$" "http://127.0.0.1:48909/$1"',
      'TypesConfig "C:/xampp/apache/conf/mime.types"', 'DirectoryIndex index.html',
      '<Directory />', 'AllowOverride None', 'Require all denied', '</Directory>',
      `DocumentRoot "${slash(root)}"`, `<Directory "${slash(root)}">`, 'AllowOverride All', 'Require all granted',
      '</Directory>'
    ].join('\n');
    const configPath = path.join(temp, 'httpd.conf');
    await fs.writeFile(configPath, config);
    await fs.mkdir(path.join(temp, 'private'), { recursive: true });
    // Only the CLI test server accepts the isolated private-state override.
    php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48909', '-t', root], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: path.join(temp, 'private') }, stdio: 'ignore', windowsHide: true });
    for (let i = 0; ; i++) {
      try { await request('http://127.0.0.1:48909/', 'api.php?action=get_public_trial_mode', 'identity'); break; }
      catch (error) { if (i > 60 || php.exitCode !== null) throw error; await new Promise(r => setTimeout(r, 100)); }
    }
    const start = async () => {
      server = spawn('C:\\xampp\\apache\\bin\\httpd.exe', ['-X', '-f', configPath], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: path.join(temp, 'private') }, stdio: 'ignore', windowsHide: true });
      for (let i = 0; ; i++) {
        try { await request(base, 'telepathybeginner.html', 'identity'); break; }
        catch (error) {
          if (i > 60 || server.exitCode !== null) throw new Error(`${error.message}\n${await fs.readFile(path.join(temp, 'error.log'), 'utf8').catch(() => '')}`);
          await new Promise(r => setTimeout(r, 100));
        }
      }
    };
    const stop = async () => { if (server?.exitCode === null && server.signalCode === null) { server.kill(); await new Promise(r => server.once('exit', r)); } };
    await start();
    for (const file of ['telepathybeginner.html', 'telepathybeginner.js', 'telepathybeginner.css', 'telepathy.js', 'telepathy.css', 'telepathybeginner-sw.js', 'telepathybeginner.webmanifest', 'target-selection.js', 'globe/globe.js']) {
      const plain = await request(base, file, 'identity');
      const compressed = await request(base, file, 'gzip');
      assert.equal(plain.status, 200, file);
      assert.equal(compressed.headers['content-encoding'], 'gzip', file);
      assert.match(compressed.headers.vary, /Accept-Encoding/i, file);
      assert.deepEqual(zlib.gunzipSync(compressed.body), plain.body, `${file}: decoded bytes must be identical`);
      assert.deepEqual(plain.body, await fs.readFile(path.join(root, file)), `${file}: plain bytes unchanged`);
      assert.ok(compressed.body.length < plain.body.length * 0.5, `${file}: meaningful size reduction`);
      if (['telepathybeginner.html', 'telepathybeginner-sw.js'].includes(file)) assert.match(compressed.headers['cache-control'], /no-store/);
      console.log(`PASS HTTP ${file}: ${plain.body.length} -> ${compressed.body.length} bytes (${Math.round(100 * (1 - compressed.body.length / plain.body.length))}% smaller), identical decoded bytes, Vary/cache rules preserved`);
    }
    for (const file of ['api.php?action=get_public_trial_mode', 'tb-test-icon-1.png']) {
      const response = await request(base, file, 'gzip');
      assert.equal(response.status, 200, file);
      assert.equal(response.headers['content-encoding'], undefined, `${file}: outside compression scope`);
    }
    const rejected = await request(base, 'telepathybeginner.js', 'gzip;q=0, identity');
    assert.equal(rejected.headers['content-encoding'], undefined, 'Do not gzip for a client that refuses it');
    const head = await request(base, 'telepathybeginner.js', 'gzip', 'HEAD');
    assert.equal(head.status, 200); assert.equal(head.body.length, 0);
    browser = await chromium.launch({ headless: true });
    const version = (await fs.readFile(path.join(root, 'telepathybeginner-sw.js'), 'utf8')).match(/const APP_VERSION = "([^"]+)"/)[1];
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.accept());
      const publicMode = page.waitForResponse(response => {
        try { return response.request().postDataJSON()?.action === 'get_public_trial_mode'; } catch { return false; }
      });
      const response = await page.goto(`${base}telepathybeginner.html?v=${version}&open=landing`);
      assert.equal(response.headers()['content-encoding'], 'gzip');
      await publicMode;
      await page.waitForTimeout(500);
      await page.locator('[data-temporary-home-open-fresh]').click();
      await page.waitForURL(url => url.searchParams.get('open') === 'visitor-launcher');
      for (const role of ['receiver', 'sender']) {
        const card = page.locator(`[data-role-card="${role}"]`);
        await card.locator('.role-card-toggle').click();
        assert.equal(await card.locator(`[data-pair-difficulty-label="${role}"]`).innerText(), 'Exercise 2');
        await card.locator(`[data-open-feature-setup="${role}"]`).click();
        await page.locator('[data-feature-setup-claim-action]').click();
        assert.equal(await page.locator('#handleDialogTitle').innerText(), 'Pick a User Name to Use with ESP GYM');
        await page.locator('[data-close-handle]').click();
        await page.locator('[data-close-feature-setup]').click();
        await page.locator(`[data-collapse-role-card="${role}"]`).click();
      }
      await page.reload();
      await page.locator('[data-view="launcher"]').waitFor({ state: 'visible' });
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      const cachedScript = await page.evaluate(async version => {
        const response = await caches.match(`./telepathybeginner.js?v=${version}`);
        return response ? await response.text() : null;
      }, version);
      assert.equal(cachedScript, await fs.readFile(path.join(root, 'telepathybeginner.js'), 'utf8'), 'Service-worker cache preserves decoded JavaScript');
      assert.deepEqual(errors, [], 'No JavaScript errors under gzip');
      await context.close();
      console.log(`PASS Playwright ${width}px: compressed Landing Page, Sender/Receiver Exercise 2, Pick User Name, BACK/Cancel and reload`);
      const trialContext = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      await trialContext.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
      const trial = await trialContext.newPage();
      const trialErrors = [];
      trial.on('pageerror', error => trialErrors.push(error.message));
      let submitted = false;
      const round = { id: 'compression-trial', start_server_ms: Date.now() - 8500, stimulus_kind: 'image_pair', difficulty_level: '2', image_sent_index: 1,
        image_sent: `${base}imagepairs/1025.jpg`, image_choice_a: `${base}imagepairs/1025.jpg`, image_choice_b: `${base}imagepairs/1041.jpg` };
      // A deterministic round fixture tests the real compressed trial UI without creating user records.
      await trial.route('**/api.php', async route => {
        if (route.request().postDataJSON()?.action === 'submit_guess') { submitted = true; round.completed_server_ms = Date.now(); }
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, pair_difficulty: '2', server_now_ms: Date.now(), round,
          state: { round, sender_online: true, receiver_online: true, receiver_ready: true, receiver_view: { phase: submitted ? 'results' : 'idle' }, post_round: submitted ? { receiver_choice: null, sender_choice: null } : null } }) });
      });
      await trial.goto(`${base}receiver.html?prefill=1&own_email=CompressionReceiver&partner_email=CompressionSender&difficulty_level=2&include_confidence=0`);
      await trial.waitForFunction(() => document.querySelector('#countdownNumber')?.textContent.includes('done receiving'));
      await trial.locator('#countdownBox').click();
      const correct = trial.locator('#receiverLevelFourChoiceGrid .image-choice-card[data-layout-number="1"]');
      await correct.click();
      await trial.waitForFunction(() => document.querySelector('#receiverLevelFourChoiceGrid .image-choice-card.actual'));
      await trial.waitForTimeout(2200);
      assert.equal(await correct.evaluate(node => getComputedStyle(node).borderTopColor), 'rgb(47, 211, 107)');
      assert.deepEqual(trialErrors, []);
      await trialContext.close();
      console.log(`PASS Playwright ${width}px: compressed Exercise 2 trial assets, image choice, submission and persistent green result frame (fixture round)`);
    }
    await browser.close(); browser = null;
    await stop();
    await fs.writeFile(configPath, config.replace('LoadModule deflate_module modules/mod_deflate.so\n', ''));
    await start();
    assert.equal((await request(base, 'telepathybeginner.js', 'gzip')).headers['content-encoding'], undefined, 'Missing optional module must fall back safely');
    console.log('PASS module-unavailable fallback: app assets still return normally, without compression');
    await stop();
  } catch (error) {
    console.error(await fs.readFile(path.join(temp, 'error.log'), 'utf8').catch(() => 'No Apache error log'));
    throw error;
  } finally {
    await browser?.close();
    if (server?.exitCode === null && server.signalCode === null) { server.kill(); await new Promise(r => server.once('exit', r)); }
    if (php?.exitCode === null && php.signalCode === null) { php.kill(); await new Promise(r => php.once('exit', r)); }
    await fs.rm(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
