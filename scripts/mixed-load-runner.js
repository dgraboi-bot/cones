const fs = require("node:fs");
const path = require("node:path");

const { MetricsStore } = require("./load-simulators/shared/metrics");
const { writeRunArtifacts } = require("./load-simulators/shared/report-writer");
const { LightNavigationUser } = require("./load-simulators/light-navigation-user");
const { TelepathySessionPairActor } = require("./load-simulators/telepathy-session-user");
const { RemoteViewSessionActor } = require("./load-simulators/remote-view-user");
const { ReportUser } = require("./load-simulators/report-user");
const { CourseUser } = require("./load-simulators/course-user");

function parseArgs(argv) {
  const result = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key || !key.startsWith("--") || typeof value === "undefined") {
      throw new Error(`Invalid argument sequence near ${key || "<end>"}`);
    }
    result[key.slice(2)] = value;
  }
  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function buildAbsoluteUrl(domain, relativePath) {
  return new URL(relativePath, domain.endsWith("/") ? domain : `${domain}/`).toString();
}

function allocateRoles(config) {
  const roles = [];
  for (let index = 0; index < Number(config.userMix.light_navigation || 0); index += 1) {
    roles.push({ kind: "light_navigation", index: index + 1, simulatedUsers: 1 });
  }
  const telepathyPairs = Math.floor(Number(config.userMix.telepathy_session_users || 0) / 2);
  for (let index = 0; index < telepathyPairs; index += 1) {
    roles.push({ kind: "telepathy_pair", index: index + 1, simulatedUsers: 2 });
  }
  for (let index = 0; index < Number(config.userMix.remote_viewing_users || 0); index += 1) {
    roles.push({ kind: "remote_viewing", index: index + 1, simulatedUsers: 1 });
  }
  for (let index = 0; index < Number(config.userMix.report_users || 0); index += 1) {
    roles.push({ kind: "report", index: index + 1, simulatedUsers: 1 });
  }
  for (let index = 0; index < Number(config.userMix.course_users || 0); index += 1) {
    roles.push({ kind: "course", index: index + 1, simulatedUsers: 1 });
  }
  return roles;
}

function buildLaunchSchedule(config, roles) {
  const phases = Array.isArray(config.phases) ? config.phases : [];
  const totalDurationMs = phases.reduce((sum, phase) => sum + (Number(phase.durationSec || 0) * 1000), 0);
  const schedule = [];
  let roleOffset = 0;
  let elapsedMs = 0;

  for (const phase of phases) {
    const usersThisPhase = Number(phase.users || 0);
    const phaseDurationMs = Number(phase.durationSec || 0) * 1000;
    const phaseRoles = roles.slice(roleOffset, roleOffset + usersThisPhase);
    roleOffset += phaseRoles.length;
    const intervalMs = phaseRoles.length > 0 ? phaseDurationMs / phaseRoles.length : phaseDurationMs;
    phaseRoles.forEach((role, index) => {
      schedule.push({
        ...role,
        launchAtMs: elapsedMs + Math.round(intervalMs * index)
      });
    });
    elapsedMs += phaseDurationMs;
  }

  if (roleOffset < roles.length) {
    const remaining = roles.slice(roleOffset);
    const intervalMs = remaining.length > 0 ? Math.max(1000, Math.round(totalDurationMs / Math.max(1, roles.length))) : 0;
    remaining.forEach((role, index) => {
      schedule.push({
        ...role,
        launchAtMs: elapsedMs + (intervalMs * index)
      });
    });
  }

  return schedule.sort((a, b) => a.launchAtMs - b.launchAtMs);
}

function makeActor(entry, sharedContext) {
  switch (entry.kind) {
    case "light_navigation":
      return new LightNavigationUser({ ...sharedContext, ordinal: entry.index });
    case "telepathy_pair":
      return new TelepathySessionPairActor({
        ...sharedContext,
        ordinal: entry.index,
        actorId: `telepathy-pair-${entry.index}`,
        actorClass: "telepathy-session"
      });
    case "remote_viewing":
      return new RemoteViewSessionActor({
        ...sharedContext,
        ordinal: entry.index,
        actorId: `remote-view-${entry.index}`,
        actorClass: "remote-viewing"
      });
    case "report":
      return new ReportUser({ ...sharedContext, ordinal: entry.index });
    case "course":
      return new CourseUser({ ...sharedContext, ordinal: entry.index });
    default:
      throw new Error(`Unsupported actor kind: ${entry.kind}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const configPath = args.config;
  const runRoot = args["run-root"];
  const domain = args.domain;
  const versionOverride = String(args.version || "").trim();

  if (!configPath || !runRoot || !domain) {
    throw new Error("Usage: node mixed-load-runner.js --config <path> --run-root <path> --domain <url> [--version <build>]");
  }

  const config = readJson(configPath);
  if (versionOverride) {
    config.version = versionOverride;
  }

  const targetBase = String(config?.target?.baseUrl || domain).trim() || domain;
  const appUrl = buildAbsoluteUrl(domain, config?.target?.appPath || "/telepathybeginner.html");
  const apiUrl = buildAbsoluteUrl(domain, config?.target?.apiPath || "/api.php");
  const metrics = new MetricsStore({
    abortThresholds: config.abortThresholds || {}
  });

  const roles = allocateRoles(config);
  const launchSchedule = buildLaunchSchedule(config, roles);
  const holdDurationMs = Number(config.holdDurationSec || 0) * 1000;
  const rampDurationMs = launchSchedule.reduce((max, entry) => Math.max(max, entry.launchAtMs), 0);
  const stopAtMs = Date.now() + rampDurationMs + holdDurationMs;
  const sharedContext = {
    config,
    appUrl,
    apiUrl,
    baseUrl: targetBase,
    metrics,
    stopAtMs,
    version: String(config.version || "").trim()
  };

  fs.mkdirSync(runRoot, { recursive: true });
  const launchedActors = [];
  const startedAtMs = Date.now();

  for (const entry of launchSchedule) {
    const delayMs = startedAtMs + entry.launchAtMs - Date.now();
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    const actor = makeActor(entry, sharedContext);
    launchedActors.push(actor);
    actor.run().catch((error) => {
      metrics.recordFlowFailure({
        actorClass: actor.actorClass,
        actorId: actor.actorId,
        endpointClass: "runner",
        reason: error instanceof Error ? error.message : String(error)
      });
    });
  }

  const remainingHoldMs = stopAtMs - Date.now();
  if (remainingHoldMs > 0) {
    await sleep(remainingHoldMs);
  }

  await Promise.allSettled(launchedActors.map((actor) => actor.stopAndDrain()));

  const summary = metrics.buildSummary({
    label: String(config.label || "mixed-load").trim(),
    version: String(config.version || "").trim(),
    domain,
    actorCount: launchedActors.length,
    simulatedUsers: roles.reduce((sum, role) => sum + Number(role.simulatedUsers || 0), 0),
    holdDurationMs,
    rampDurationMs
  });

  await writeRunArtifacts(runRoot, config, metrics, summary);
  process.stdout.write(`${path.join(runRoot, "summary.md")}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
