const fs = require("node:fs");

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: node measure-launcher-http.js <config.json>");
  process.exit(1);
}

const configRaw = fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, "");
const config = JSON.parse(configRaw);

function percentile(sortedValues, p) {
  if (!sortedValues.length) {
    return 0;
  }
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1)
  );
  return sortedValues[index];
}

async function timedFetch(url) {
  const started = performance.now();
  const response = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });
  const text = await response.text();
  const elapsedMs = performance.now() - started;
  return {
    ok: response.ok,
    status: response.status,
    elapsedMs,
    bytes: Buffer.byteLength(text, "utf8")
  };
}

async function runStage(url, concurrency, repetitions) {
  const stageSamples = [];
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    const results = await Promise.all(
      Array.from({ length: concurrency }, () => timedFetch(url))
    );
    stageSamples.push(...results);
  }

  const latencies = stageSamples.map((entry) => entry.elapsedMs).sort((a, b) => a - b);
  const byteCounts = stageSamples.map((entry) => entry.bytes).sort((a, b) => a - b);
  const failures = stageSamples.filter((entry) => !entry.ok).length;
  return {
    concurrency,
    repetitions,
    sample_count: stageSamples.length,
    failure_count: failures,
    avg_latency_ms: Number((latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length)).toFixed(1)),
    p50_latency_ms: Number(percentile(latencies, 50).toFixed(1)),
    p95_latency_ms: Number(percentile(latencies, 95).toFixed(1)),
    max_latency_ms: Number((latencies[latencies.length - 1] || 0).toFixed(1)),
    avg_bytes: Number((byteCounts.reduce((sum, value) => sum + value, 0) / Math.max(1, byteCounts.length)).toFixed(1)),
    status_counts: Object.fromEntries(
      stageSamples.reduce((map, entry) => {
        const key = String(entry.status || 0);
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map())
    )
  };
}

async function main() {
  const output = {
    label: config.label,
    url: config.url,
    stages: []
  };

  for (const stage of config.stages) {
    const summary = await runStage(config.url, Number(stage.concurrency), Number(stage.repetitions));
    output.stages.push(summary);
  }

  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
