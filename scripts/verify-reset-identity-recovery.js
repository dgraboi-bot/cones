const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const base = 'http://127.0.0.1:48908';
const recoveryKey = 'cones-reset-identity-recovery-v1';
const authorizationKey = 'cones-browser-identity-authorizations-v1';
const confirmation = 'Are you sure? This removes all ESP GYM information stored with this browser on this device, except a tiny recovery record. Your unique name, saved reports, and other server data will not be deleted.';

(async () => {
  const privateRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'espgym-reset-recovery-'));
  const php = spawn('C:\\xampp\\php\\php.exe', ['-S', '127.0.0.1:48908', '-t', path.resolve(__dirname, '..')], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot }, stdio: 'ignore' });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const api = (await browser.newContext()).request;
    for (let i = 0; ; i++) {
      try { await api.get(`${base}/api.php`); break; }
      catch (error) { if (i > 50) throw error; await new Promise(r => setTimeout(r, 100)); }
    }
    await api.post(`${base}/api.php`, { data: { action: 'claim_unique_handle', current_identifier: '', proposed_handle: 'Other Owner' } });
    const statePath = path.join(privateRoot, 'data', 'session-state.json');
    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    state.esp_pro_special_edition_enabled = true;
    await fs.writeFile(statePath, JSON.stringify(state));
    const recover = (identifier, token) => api.post(`${base}/api.php`, { data: { action: 'recover_reset_identity', identifier, owner_authorization_token: token } });
    let lastRecord;
    for (const width of [390, 1280]) for (const role of ['sender', 'receiver']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      const dialogs = [];
      page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
      await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
      const name = `Reset ${width} ${role}`;
      const card = page.locator(`[data-role-card="${role}"]`);
      const pick = async name => {
        await card.locator('.role-card-toggle').click();
        await card.locator(`[data-open-feature-setup="${role}"]`).click();
        await page.locator('[data-feature-setup-claim-action]').click();
        await page.locator('[data-handle-input]').fill(name);
        await page.locator('[data-submit-handle]').click();
        await page.locator('[data-handle-overlay]').waitFor({ state: 'hidden', timeout: 15000 });
      };
      const reset = async () => {
        await page.locator('[data-open-options]').click();
        await page.locator('[data-open-other-settings]').click();
        await page.locator('[data-reset-this-device]').click();
        await page.waitForURL(url => url.searchParams.get('open') === 'landing');
        assert.equal(dialogs.at(-1), confirmation);
        await page.locator('[data-temporary-home-open-fresh]').click();
        await page.waitForURL(url => url.searchParams.get('open') === 'visitor-launcher');
      };
      await pick(name);
      const before = await page.evaluate(({ key, name }) => ({ token: JSON.parse(localStorage.getItem(key))[name.toLowerCase()], state: JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')) }), { key: authorizationKey, name });
      assert.match(before.token, /^[a-f0-9]{64}$/);
      const status = await (await api.post(`${base}/api.php`, { data: { action: 'get_identifier_status', identifier: name } })).json();
      assert.equal(status.auth_email_on_file, false, 'Test identity must have no recovery email');
      const originalOwner = status.identifier_status.owner_identifier;
      const pairFile = path.join(privateRoot, 'pairs', `recovery-${width}-${role}.csv`);
      await fs.writeFile(pairFile, '"rx name","tx name","round_id"\n"Saved Receiver","Saved Sender","keep-this-trial"\n');
      await page.evaluate(() => localStorage.setItem('reset-test-private-data', 'must disappear'));
      await reset();
      const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), recoveryKey);
      assert.deepEqual(record, { identifier: name, token: before.token });
      assert.equal(await page.evaluate(key => localStorage.getItem(key), authorizationKey), null, 'Normal browser authorization must be cleared');
      assert.equal(await page.evaluate(() => localStorage.getItem('reset-test-private-data')), null);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).recognizedIdentity), '');
      await reset();
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), recoveryKey), record, 'Repeated anonymous RESET must not destroy recovery');
      await card.locator('.role-card-toggle').click();
      await card.locator(`[data-role-difficulty-bump="${role}"][data-direction="up"]`).click();
      await card.locator(`[data-open-feature-setup="${role}"]`).click();
      await page.locator('[data-feature-setup-claim-action]').click();
      await page.locator('[data-handle-input]').fill(name.toUpperCase());
      await page.locator('[data-submit-handle]').click();
      await page.locator('[data-handle-overlay]').waitFor({ state: 'hidden', timeout: 15000 });
      assert.equal(await card.locator('input[name="ownName"]').inputValue(), name);
      assert.equal(await card.locator(`[data-pair-difficulty-label="${role}"]`).innerText(), 'Exercise 3');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), recoveryKey), null);
      assert.equal(await page.evaluate(({ key, name }) => JSON.parse(localStorage.getItem(key))[name.toLowerCase()], { key: authorizationKey, name }), before.token);
      const recovered = await (await api.post(`${base}/api.php`, { data: { action: 'get_identifier_status', identifier: name } })).json();
      assert.equal(recovered.identifier_status.owner_identifier, originalOwner, 'Recovery must not reassign ownership');
      assert.equal(await fs.readFile(pairFile, 'utf8'), '"rx name","tx name","round_id"\n"Saved Receiver","Saved Sender","keep-this-trial"\n');
      assert.equal((await recover('Other Owner', before.token)).status(), 403, 'Token must not restore another identity');
      assert.equal((await recover(name, 'a'.repeat(64))).status(), 403, 'A forged token must be rejected');
      assert.equal((await recover(name, '')).status(), 403, 'Knowing a name alone must not establish ownership');
      assert.equal(dialogs.some(text => /first set up email authentication/i.test(text)), false);
      console.log(`PASS ${width}px ${role}: RESET stays anonymous; same-name recovery restores identity and Exercise 3 without email; token forgery/cross-name attacks rejected; reports unchanged`);
      if (width === 1280 && role === 'receiver') {
        await reset();
        lastRecord = record;
        await page.locator('[data-open-options]').click();
        await page.locator('[data-open-report]').click();
        await page.locator('[data-open-advanced]').click();
        await page.locator('[data-settings-import-filename]').fill('x9Qm7L2v8T4p1Zadmin');
        await page.locator('[data-download-settings-csv]').click();
        await page.locator('[data-view="admin"]').waitFor({ state: 'visible' });
        for (const category of ['users', 'invitees', 'pairs', 'simulation-pairs', 'questionnaires', 'messaging-history', 'analytics-counters']) await page.locator(`[data-admin-fresh-start-preserve-${category}]`).uncheck();
        await page.locator('[data-admin-fresh-start]').click();
        try { await page.waitForFunction(key => localStorage.getItem(key) === null, recoveryKey); }
        catch (error) { console.log('Fresh Start diagnostics', await page.locator('[data-admin-status]').innerText()); throw error; }
        assert.equal((await recover(name, before.token)).status(), 403, 'Fresh Start invalidates records in all other browsers too');
        const cleared = JSON.parse(await fs.readFile(statePath, 'utf8'));
        assert.deepEqual(cleared.browser_identity_authorizations, []);
        const fresh = await (await api.post(`${base}/api.php`, { data: { action: 'claim_unique_handle', current_identifier: '', proposed_handle: name } })).json();
        assert.equal(fresh.ok, true);
        assert.notEqual(fresh.browser_identity_authorization.token, before.token);
        assert.equal((await recover(name, before.token)).status(), 403, 'Old credential must remain invalid even if the name is registered again');
        console.log('PASS real ADMIN Fresh Start UI: recovery record removed locally; all server credentials invalidated; re-created name cannot be recovered by an old token');
      }
      await context.close();
    }
    assert.ok(lastRecord);
    for (const record of [null, { identifier: lastRecord.identifier }, { identifier: lastRecord.identifier, token: 'a'.repeat(64) }, lastRecord]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on('dialog', dialog => dialog.accept());
      await page.goto(`${base}/telepathybeginner.html?open=visitor-launcher`);
      if (record) await page.evaluate(({ key, record }) => localStorage.setItem(key, JSON.stringify(record)), { key: recoveryKey, record });
      await page.locator('[data-role-card="receiver"] .role-card-toggle').click();
      await page.locator('[data-open-feature-setup="receiver"]').click();
      await page.locator('[data-feature-setup-claim-action]').click();
      await page.locator('[data-handle-input]').fill(lastRecord.identifier);
      await page.locator('[data-submit-handle]').click();
      await page.waitForFunction(() => document.querySelector('[data-handle-status]')?.textContent.includes('first set up email authentication'));
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cones-beginner-launcher-v2')).recognizedIdentity), '');
      if (record?.token) assert.equal(await page.evaluate(key => localStorage.getItem(key), recoveryKey), null, 'Rejected record must be discarded in the browser');
      await context.close();
    }
    console.log('PASS browser UI: fresh browser, name-only record, forged token, and stale pre-Fresh-Start token cannot take over the re-created identity');
  } finally {
    await browser?.close(); php.kill();
    await new Promise(r => php.exitCode !== null ? r() : php.once('exit', r));
    await fs.rm(privateRoot, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
