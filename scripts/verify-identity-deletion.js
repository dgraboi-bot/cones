const { mkdtemp, mkdir, writeFile, readFile, rm, access } = require("fs/promises");
const { spawn } = require("child_process");
const http = require("http");
const os = require("os");
const path = require("path");

const appRoot = path.resolve(__dirname, "..");
const handle = "Road Dog";
const owner = "road.dog@example.test";
const adminSecret = "x9Qm7L2v8T4p1Zadmin";
const adminClientId = "identity-deletion-test-client";

function waitForServer(port) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 10000;
    const tryConnect = () => http.get(`http://localhost:${port}/api.php`, (response) => {
      response.resume();
      resolve();
    }).on("error", () => {
      if (Date.now() >= deadline) reject(new Error("Timed out waiting for the isolated PHP server."));
      else setTimeout(tryConnect, 100);
    });
    tryConnect();
  });
}

function request(port, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = http.request({
      hostname: "localhost",
      port,
      path: "/api.php",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    }, (response) => {
      let text = "";
      response.on("data", (chunk) => { text += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, body: JSON.parse(text) }));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function mustNotExist(filePath, label) {
  try {
    await access(filePath);
    throw new Error(`${label} was not deleted.`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function main() {
  const privateRoot = await mkdtemp(path.join(os.tmpdir(), "espgym-identity-delete-test-"));
  const stateDir = path.join(privateRoot, "data");
  const pairsDir = path.join(privateRoot, "pairs");
  const questionnaireDir = path.join(privateRoot, "content", "questionnaires");
  await Promise.all([mkdir(stateDir, { recursive: true }), mkdir(pairsDir, { recursive: true }), mkdir(questionnaireDir, { recursive: true })]);
  const statePath = path.join(stateDir, "session-state.json");
  await writeFile(statePath, JSON.stringify({
    sessions: {}, session_registry: {}, pair_difficulties: {},
    unique_handles: { "road dog": { handle, canonical_handle: "road dog", owner_identifier: owner, created_ms: 1, updated_ms: 1 } },
    identifier_aliases: { [owner]: handle },
    handle_owners: { [owner]: { owner_identifier: owner, current_handle: handle, current_canonical_handle: "road dog", auth_email: owner } },
    user_types: { "road dog": "pro" }, user_preferences: { "road dog": { updated_ms: 1 } },
    launcher_profiles: {
      "road dog": { receiver: { own_email: handle, current_partner: "Big Bopper", partner_history: ["Big Bopper"], deleted_partners: [] } },
      "big bopper": { sender: { own_email: "Big Bopper", current_partner: handle, partner_history: [handle], deleted_partners: [handle] } }
    },
    passkey_credentials: { credential: { identifier: handle, source: {}, created_ms: 1 } },
    named_reports: [{ id: "report-1", title: "Road Dog report", selected_pair: { receiver_name: handle, sender_name: "Big Bopper" }, start_trial: 1, end_trial: 1, completed_trial_count: 1, created_ms: 1 }],
    partner_message_threads: { thread: { participants: [handle, "Big Bopper"], messages: [] } },
    partner_message_reads: {}, push_subscriptions: [], level_four_receiver_pools: { "road dog": { receiver_identifier: handle } },
    identifier_recovery_verifications: {}, unique_name_claim_verifications: {}, invitees: []
  }));
  const csv = path.join(pairsDir, "rx-road-dog__tx-big-bopper.csv");
  // The Admin list renders an unclaimed historical name with this suffix.
  // Deletion must recognize and remove it as Road Dog's data.
  await writeFile(csv, '"rx name","tx name","round_id"\n"Road Dog (guest)","Big Bopper","round-1"\n');
  await writeFile(path.join(questionnaireDir, "baseline__road-dog.json"), JSON.stringify({ identifier: handle, response: { note: "test" } }));

  const port = 48882;
  const php = spawn("php", ["-S", `localhost:${port}`, "-t", appRoot], { env: { ...process.env, ESPGYM_TEST_PRIVATE_ROOT: privateRoot } });
  try {
    await waitForServer(port);
    const lock = await request(port, { action: "claim_admin_lock", secret_candidate: adminSecret, admin_client_id: adminClientId });
    if (lock.status !== 200 || !lock.body.ok) throw new Error(`Admin test lock failed: ${JSON.stringify(lock.body)}`);
    const deleted = await request(port, { action: "delete_user_identity", user_identifier: handle, secret_candidate: adminSecret, admin_client_id: adminClientId });
    if (deleted.status !== 200 || !deleted.body.ok) throw new Error(`Identity deletion failed: ${JSON.stringify(deleted.body)}`);
    const status = await request(port, { action: "get_identifier_status", identifier: handle });
    if (status.body.formal_identity_exists || status.body.identifier_exists) throw new Error("Deleted identity is still recognized by the server.");
    await mustNotExist(csv, "Pair trial history");
    await mustNotExist(path.join(questionnaireDir, "baseline__road-dog.json"), "Questionnaire response");
    const state = JSON.parse(await readFile(statePath, "utf8"));
    if (state.unique_handles?.["road dog"] || state.passkey_credentials?.credential || state.named_reports?.length) throw new Error("Identity state artifacts remain after deletion.");
    const partnerProfile = state.launcher_profiles?.["big bopper"]?.sender || {};
    if (partnerProfile.current_partner || partnerProfile.partner_history?.length || partnerProfile.deleted_partners?.length) throw new Error("Partner profile still references the deleted identity.");

    // Simulate the historical bug: a claimed record was removed while an
    // already-formatted guest trial remained. Admin must offer and complete
    // the final residual cleanup without deleting any active identity.
    await writeFile(csv, '"rx name","tx name","round_id"\n"Road Dog (guest)","Big Bopper","round-2"\n');
    const residualStatus = await request(port, { action: "get_user_type", identifier: handle });
    if (!residualStatus.body.identifier_exists || !residualStatus.body.identity_deletion_eligible) {
      throw new Error("Orphaned guest identity was not eligible for controlled cleanup.");
    }
    const residualDelete = await request(port, { action: "delete_user_identity", user_identifier: handle, secret_candidate: adminSecret, admin_client_id: adminClientId });
    if (residualDelete.status !== 200 || !residualDelete.body.ok || !residualDelete.body.deleted_identity?.residual_cleanup) {
      throw new Error("Residual identity cleanup failed.");
    }
    const finalStatus = await request(port, { action: "get_user_type", identifier: handle });
    if (finalStatus.body.identifier_exists || finalStatus.body.identity_deletion_eligible) {
      throw new Error("Residual guest identity remains visible after cleanup.");
    }
    await mustNotExist(csv, "Residual guest trial history");
    console.log("PASS: controlled identity deletion removes server identity, passkeys, reports, questionnaires, pair history, and partner references.");
  } finally {
    php.kill();
    await rm(privateRoot, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(`FAIL: ${error.stack || error.message}`); process.exitCode = 1; });
