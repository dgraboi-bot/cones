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

class MetricsStore {
  constructor(options = {}) {
    this.events = [];
    this.flowFailures = [];
    this.abortThresholds = options.abortThresholds || {};
  }

  recordRequest(event) {
    this.events.push({
      kind: "request",
      timeMs: Date.now(),
      ...event
    });
  }

  recordFlowFailure(event) {
    this.flowFailures.push({
      timeMs: Date.now(),
      ...event
    });
  }

  buildSummary(meta = {}) {
    const requestEvents = this.events.slice();
    const okCount = requestEvents.filter((event) => event.ok).length;
    const failureCount = requestEvents.length - okCount;
    const latencies = requestEvents
      .map((event) => Number(event.latencyMs || 0))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    const endpointGroups = this.#summarizeBy((event) => event.endpointClass || "generic");
    const actorGroups = this.#summarizeBy((event) => event.actorClass || "generic");

    return {
      ...meta,
      requestCount: requestEvents.length,
      okCount,
      failureCount,
      rawRequestErrorRate: requestEvents.length ? failureCount / requestEvents.length : 0,
      flowFailureCount: this.flowFailures.length,
      avgLatencyMs: latencies.length ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(1)) : 0,
      p50LatencyMs: Number(percentile(latencies, 50).toFixed(1)),
      p95LatencyMs: Number(percentile(latencies, 95).toFixed(1)),
      p99LatencyMs: Number(percentile(latencies, 99).toFixed(1)),
      endpointGroups,
      actorGroups
    };
  }

  #summarizeBy(keySelector) {
    const groups = new Map();
    for (const event of this.events) {
      const key = String(keySelector(event) || "generic");
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(event);
    }

    return Object.fromEntries(
      Array.from(groups.entries()).map(([key, entries]) => {
        const latencies = entries
          .map((event) => Number(event.latencyMs || 0))
          .filter((value) => Number.isFinite(value))
          .sort((a, b) => a - b);
        const failures = entries.filter((event) => !event.ok).length;
        return [key, {
          requestCount: entries.length,
          failureCount: failures,
          errorRate: entries.length ? failures / entries.length : 0,
          avgLatencyMs: latencies.length ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(1)) : 0,
          p95LatencyMs: Number(percentile(latencies, 95).toFixed(1))
        }];
      })
    );
  }
}

module.exports = {
  MetricsStore
};
