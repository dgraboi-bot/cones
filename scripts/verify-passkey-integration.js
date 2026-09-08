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

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.addInitScript(() => {
      localStorage.setItem("cones-beginner-launcher-v2", JSON.stringify({
        recognizedIdentity: "Deleted Test Identity",
        ownNames: { sender: "Deleted Test Identity", receiver: "Deleted Test Identity", "remote-viewer": "Deleted Test Identity" },
        entryMode: "",
        resolvedMainUserType: "pro"
      }));
    });
    await visitorPage.goto(`http://localhost:${port}/telepathybeginner.html?open=landing`, { waitUntil: "domcontentloaded" });
    await visitorPage.locator("[data-temporary-home-continue]").click();
    await visitorPage.locator('[data-view="launcher"]:not(.beginner-view-hidden)').waitFor({ timeout: 5000 });
    await visitorContext.close();

    console.log("PASS: registration retry safety, replay protection, assertion validation, and server identity restoration completed in isolated state.");
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
