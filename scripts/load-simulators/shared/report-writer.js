const fs = require("node:fs");
const path = require("node:path");

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

async function writeRunArtifacts(runRoot, config, metrics, summary) {
  fs.mkdirSync(runRoot, { recursive: true });
  fs.writeFileSync(path.join(runRoot, "config-used.json"), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(runRoot, "events.json"), JSON.stringify(metrics.events, null, 2));
  fs.writeFileSync(path.join(runRoot, "failures.json"), JSON.stringify(metrics.flowFailures, null, 2));
  fs.writeFileSync(path.join(runRoot, "summary.json"), JSON.stringify(summary, null, 2));

  const lines = [
    "# Mixed Load Test Summary",
    "",
    `- Label: ${summary.label}`,
    `- Version: ${summary.version || "unspecified"}`,
    `- Domain: ${summary.domain}`,
    `- Actors launched: ${summary.actorCount}`,
    `- Simulated users: ${summary.simulatedUsers}`,
    `- Ramp duration: ${Math.round((summary.rampDurationMs || 0) / 1000)}s`,
    `- Hold duration: ${Math.round((summary.holdDurationMs || 0) / 1000)}s`,
    "",
    "## Overall",
    "",
    `- Requests: ${summary.requestCount}`,
    `- Request failures: ${summary.failureCount}`,
    `- Raw request error rate: ${formatPercent(summary.rawRequestErrorRate)}`,
    `- Flow failures: ${summary.flowFailureCount}`,
    `- Avg latency: ${summary.avgLatencyMs} ms`,
    `- p50 latency: ${summary.p50LatencyMs} ms`,
    `- p95 latency: ${summary.p95LatencyMs} ms`,
    `- p99 latency: ${summary.p99LatencyMs} ms`,
    "",
    "## By Endpoint Class",
    ""
  ];

  Object.entries(summary.endpointGroups || {}).forEach(([key, value]) => {
    lines.push(`- ${key}: ${value.requestCount} req, ${value.failureCount} fail, p95 ${value.p95LatencyMs} ms, error ${formatPercent(value.errorRate)}`);
  });

  lines.push("", "## By Actor Class", "");
  Object.entries(summary.actorGroups || {}).forEach(([key, value]) => {
    lines.push(`- ${key}: ${value.requestCount} req, ${value.failureCount} fail, p95 ${value.p95LatencyMs} ms, error ${formatPercent(value.errorRate)}`);
  });

  fs.writeFileSync(path.join(runRoot, "summary.md"), `${lines.join("\n")}\n`);
}

module.exports = {
  writeRunArtifacts
};
