const { chromium } = require("playwright");
const { createHash, randomBytes } = require("crypto");
const { mkdtemp, mkdir, writeFile, readFile, rm } = require("fs/promises");
const { spawn } = require("child_process");
const http = require("http");
const os = require("os");
const path = require("path");

const appRoot = path.resolve(__dirname, "..");
const testHandle = "Passkey Local Test";

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function grantKey(grant) {
  return createHash("sha256").update(grant).digest("hex");
}

function waitForServer(port) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 10000;
    const attempt = () => {
      const request = http.get(`http://localhost:${port}/api.php`, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error("Timed out waiting for the disposable PHP test server."));
          return;
        }
        setTimeout(attempt, 100);
      });
    };
    attempt();
  });
}

async function api(page, action) {
  return page.evaluate(async (payload) => {
    const response = await fetch("/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { status: response.status, body: await response.json() };
  }, action);
}

async function main() {
  const privateRoot = await mkdtemp(path.join(os.tmpdir(), "espgym-passkey-test-"));
  const stateDir = path.join(privateRoot, "data");
  await mkdir(stateDir, { recursive: true });
  const grant = base64Url(randomBytes(32));
  await writeFile(path.join(stateDir, "session-state.json"), JSON.stringify({
    sessions: {},
    session_registry: {},
    user_types: { [testHandle.toLowerCase()]: "pro" },
    unique_handles: {
      [testHandle.toLowerCase()]: {
        handle: testHandle,
        canonical_handle: testHandle.toLowerCase(),
        owner_identifier: testHandle,
        created_ms: Date.now(),
        updated_ms: Date.now()
      }
    },
    handle_owners: {},
    identifier_aliases: {},
    passkey_credentials: {},
    passkey_ceremonies: {},
    passkey_enrollment_grants: {
      [grantKey(grant)]: { identifier: testHandle, expires_ms: Date.now() + 600000 }
    }
  }));

  const port = 48881;
  const php = spawn("php", ["-S", `localhost:${port}`, "-t", appRoot], {
    env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let phpError = "";
  php.stderr.on("data", (chunk) => { phpError += chunk.toString(); });

  let browser;
  try {
    await waitForServer(port);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}/telepathybeginner.html`, { waitUntil: "domcontentloaded" });
    if (await page.locator("[data-explore-pro-code-field]").count() !== 1 || !await page.locator("[data-explore-pro-code-field]").isHidden()) {
      throw new Error("The verification-code field must be hidden until a verification code is sent.");
    }
    if (await page.locator("[data-explore-pro-verify-actions]").count() !== 1 || !await page.locator("[data-explore-pro-verify-actions]").isHidden()) {
      throw new Error("The unique-name claim action must be hidden until a verification code is sent.");
    }
    const cdp = await context.newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true
      }
    });

    const noCredential = await api(page, { action: "begin_passkey_authentication" });
    if (noCredential.status !== 400) throw new Error(`Expected no-credential rejection, got ${noCredential.status}.`);

    const beforeRegistrationStatus = await api(page, { action: "get_identifier_status", identifier: testHandle });
    if (beforeRegistrationStatus.body.passkey_registered) throw new Error("A passkey was reported before registration.");

    const registration = await api(page, { action: "begin_passkey_registration", enrollment_grant: grant });
    if (!registration.body.ok) throw new Error(`Registration begin failed: ${registration.body.error || "unknown error"}`);

    const retryRegistration = await api(page, { action: "begin_passkey_registration", enrollment_grant: grant });
    if (!retryRegistration.body.ok) throw new Error(`Verified enrollment grant was not reusable before completion: ${retryRegistration.body.error || "unknown error"}`);

    const credential = await page.evaluate(async (options) => {
      const decode = (value) => {
        const padded = `${String(value).replace(/-/g, "+").replace(/_/g, "/")}==`.slice(0, Math.ceil(String(value).length / 4) * 4);
        const binary = atob(padded);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
      };
      const publicKey = structuredClone(options);
      publicKey.challenge = decode(publicKey.challenge);
      publicKey.user.id = decode(publicKey.user.id);
      (publicKey.excludeCredentials || []).forEach((item) => { item.id = decode(item.id); });
      const created = await navigator.credentials.create({ publicKey });
      const response = created.response;
      const encode = (value) => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return {
        id: created.id,
        rawId: encode(created.rawId),
        type: created.type,
        response: { clientDataJSON: encode(response.clientDataJSON), attestationObject: encode(response.attestationObject) },
        clientExtensionResults: created.getClientExtensionResults()
      };
    }, registration.body.public_key);

    const registrationFinish = await api(page, { action: "finish_passkey_registration", ceremony_id: registration.body.ceremony_id, credential });
    if (!registrationFinish.body.ok || registrationFinish.body.identifier !== testHandle) {
      throw new Error(`Registration finish failed: ${registrationFinish.body.error || "unexpected identity"}`);
    }

    const afterRegistrationStatus = await api(page, { action: "get_identifier_status", identifier: testHandle });
    if (!afterRegistrationStatus.body.passkey_registered) throw new Error("The registered passkey was not reported by identifier status.");

    const replayGrant = await api(page, { action: "begin_passkey_registration", enrollment_grant: grant });
    if (replayGrant.status !== 400) throw new Error("A consumed enrollment grant was unexpectedly accepted.");

    const authentication = await api(page, { action: "begin_passkey_authentication" });
    if (!authentication.body.ok) throw new Error(`Authentication begin failed: ${authentication.body.error || "unknown error"}`);
    const assertion = await page.evaluate(async (options) => {
      const decode = (value) => {
        const padded = `${String(value).replace(/-/g, "+").replace(/_/g, "/")}==`.slice(0, Math.ceil(String(value).length / 4) * 4);
        const binary = atob(padded);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
      };
      const publicKey = structuredClone(options);
      publicKey.challenge = decode(publicKey.challenge);
      (publicKey.allowCredentials || []).forEach((item) => { item.id = decode(item.id); });
      const selected = await navigator.credentials.get({ publicKey });
      const response = selected.response;
      const encode = (value) => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return {
        id: selected.id,
        rawId: encode(selected.rawId),
        type: selected.type,
        response: { clientDataJSON: encode(response.clientDataJSON), authenticatorData: encode(response.authenticatorData), signature: encode(response.signature), userHandle: response.userHandle ? encode(response.userHandle) : undefined },
        clientExtensionResults: selected.getClientExtensionResults()
      };
    }, authentication.body.public_key);
    const authenticationFinish = await api(page, { action: "finish_passkey_authentication", ceremony_id: authentication.body.ceremony_id, credential: assertion });
    if (!authenticationFinish.body.ok || authenticationFinish.body.identifier !== testHandle) {
      throw new Error(`Authentication finish failed: ${authenticationFinish.body.error || JSON.stringify(authenticationFinish.body)}`);
    }

    const state = JSON.parse(await readFile(path.join(stateDir, "session-state.json"), "utf8"));
    if (Object.keys(state.passkey_credentials || {}).length !== 1) throw new Error("Expected exactly one stored passkey credential.");

    // Use the page that registered the virtual platform credential. A real
    // installed PWA uses the device's same-site passkey.
    const installedPage = page;
    await installedPage.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", { configurable: true, get: () => "Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1" });
      Object.defineProperty(navigator, "vendor", { configurable: true, get: () => "Apple Computer, Inc." });
      Object.defineProperty(navigator, "platform", { configurable: true, get: () => "iPad" });
      Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, get: () => 5 });
      const nativeMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const result = nativeMatchMedia(query);
        if (query === "(display-mode: standalone)") {
          Object.defineProperty(result, "matches", { configurable: true, get: () => true });
        }
        return result;
      };
    });
    await installedPage.goto(`http://localhost:${port}/telepathybeginner.html?open=launcher`, { waitUntil: "domcontentloaded" });
    const finishInstallButton = installedPage.locator("[data-temporary-home-continue]").filter({ hasText: "FINISH APP INSTALLATION" });
    await finishInstallButton.waitFor({ timeout: 5000 });
    if (await finishInstallButton.isDisabled()) throw new Error("The prepared iPad restore action remained disabled.");
    await finishInstallButton.click();
    try {
      await installedPage.locator('[data-view="launcher"]:not(.beginner-view-hidden)').waitFor({ timeout: 5000 });
    } catch (_) {
      const failureStatus = String(await installedPage.locator("[data-temporary-home-invitation-status]").textContent() || "").trim();
      throw new Error(`The installed iPad flow did not reach the launcher: ${failureStatus || "no restoration status was shown"}`);
    }
    const restoredIdentity = await installedPage.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}");
      return String(state.recognizedIdentity || "").trim();
    });
    if (restoredIdentity !== testHandle) throw new Error("The installed iPad flow did not restore its recognized identity.");

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.addInitScript(() => {
      localStorage.setItem("cones-beginner-launcher-v2", JSON.stringify({
        recognizedIdentity: "Deleted Test Identity",
        ownNames: { sender: "Deleted Test Identity", receiver: "Deleted Test Identity", "remote-viewer": "Deleted Test Identity" },
        entryMode: "",
        resolvedMainUserType: "pro"
      }));
      localStorage.setItem("cones-apple-passkey-enrollment-identity-v1", "Deleted Test Identity");
    });
    await visitorPage.goto(`http://localhost:${port}/telepathybeginner.html?open=landing`, { waitUntil: "domcontentloaded" });
    await visitorPage.locator("[data-temporary-home-continue]").click();
    await visitorPage.locator('[data-view="launcher"]:not(.beginner-view-hidden)').waitFor({ timeout: 5000 });
    const staleIdentity = await visitorPage.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("cones-beginner-launcher-v2") || "{}");
      return String(state.recognizedIdentity || "").trim();
    });
    if (staleIdentity) throw new Error("Deleted identity was not cleared before entering as a visitor.");
    await visitorContext.close();

    // A slow or stalled identity lookup must never leave a normal browser
    // landing page with its only entry action disabled forever.
    const stalledContext = await browser.newContext();
    const stalledPage = await stalledContext.newPage();
    await stalledPage.addInitScript(() => {
      localStorage.setItem("cones-beginner-launcher-v2", JSON.stringify({
        recognizedIdentity: "Stalled Test Identity",
        ownNames: { sender: "Stalled Test Identity", receiver: "Stalled Test Identity", "remote-viewer": "Stalled Test Identity" },
        entryMode: "",
        resolvedMainUserType: "pro"
      }));
    });
    await stalledPage.route("**/api.php", async (route) => {
      const body = route.request().postData() || "";
      if (body.includes('"action":"get_identifier_status"')) {
        await new Promise((resolve) => setTimeout(resolve, 5500));
      }
      await route.continue();
    });
    await stalledPage.goto(`http://localhost:${port}/telepathybeginner.html?open=landing`, { waitUntil: "domcontentloaded" });
    const stalledContinueButton = stalledPage.locator("[data-temporary-home-continue]");
    await stalledContinueButton.waitFor({ timeout: 3000 });
    if (await stalledContinueButton.isDisabled()) throw new Error("Normal-browser Continue remained disabled during startup work.");
    await stalledContinueButton.click();
    await stalledPage.locator('[data-view="launcher"]:not(.beginner-view-hidden)').waitFor({ timeout: 6500 });
    await stalledContext.close();

    console.log("PASS: passkey restoration, staged claim UI, and normal-browser stalled-identity recovery completed in isolated state.");
  } finally {
    if (browser) await browser.close();
    php.kill();
    await rm(privateRoot, { recursive: true, force: true });
    if (phpError.trim()) console.error(phpError.trim());
  }
}

main().catch((error) => {
  console.error(`FAIL: ${error.stack || error.message}`);
  process.exitCode = 1;
});
