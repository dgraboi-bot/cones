const { classifyRetryableError, shouldRetryRequest } = require("./retry-policy");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

class HttpClient {
  constructor(options) {
    this.baseUrl = String(options.baseUrl || "").trim();
    this.metrics = options.metrics;
    this.actorId = String(options.actorId || "").trim();
    this.actorClass = String(options.actorClass || "").trim();
    this.defaultTimeoutMs = Number(options.defaultTimeoutMs || 15000);
  }

  async get(url, options = {}) {
    return this.#request("GET", url, null, options);
  }

  async postJson(url, body, options = {}) {
    return this.#request("POST", url, body, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  }

  async #request(method, url, body, options) {
    const endpointClass = String(options.endpointClass || "generic").trim() || "generic";
    const operation = String(options.operation || endpointClass).trim();
    const fullUrl = new URL(url, this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`).toString();
    const maxAttempts = Number(options.maxAttempts || 2);
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt += 1;
      const startedAt = Date.now();
      try {
        const response = await fetch(fullUrl, {
          method,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            ...(options.headers || {})
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(Number(options.timeoutMs || this.defaultTimeoutMs))
        });
        const text = await response.text();
        const elapsedMs = Date.now() - startedAt;
        const recovered = attempt > 1;

        this.metrics.recordRequest({
          actorId: this.actorId,
          actorClass: this.actorClass,
          endpointClass,
          operation,
          method,
          url: fullUrl,
          status: response.status,
          ok: response.ok,
          recovered,
          latencyMs: elapsedMs,
          bytes: Buffer.byteLength(text, "utf8")
        });

        if (!response.ok) {
          const retryable = shouldRetryRequest({
            method,
            status: response.status,
            attempt,
            maxAttempts,
            endpointClass
          });
          if (retryable) {
            await sleep(100 + (attempt * 150));
            continue;
          }
          throw new Error(`${operation} failed with status ${response.status}`);
        }

        const contentType = String(response.headers.get("content-type") || "").toLowerCase();
        return {
          status: response.status,
          ok: response.ok,
          text,
          json: contentType.includes("application/json") ? JSON.parse(text) : null
        };
      } catch (error) {
        const elapsedMs = Date.now() - startedAt;
        const classified = classifyRetryableError(error);
        this.metrics.recordRequest({
          actorId: this.actorId,
          actorClass: this.actorClass,
          endpointClass,
          operation,
          method,
          url: fullUrl,
          status: 0,
          ok: false,
          recovered: false,
          latencyMs: elapsedMs,
          bytes: 0,
          error: classified.message
        });

        const retryable = shouldRetryRequest({
          method,
          status: 0,
          attempt,
          maxAttempts,
          endpointClass,
          errorKind: classified.kind
        });
        if (retryable) {
          await sleep(100 + (attempt * 150));
          continue;
        }
        throw error;
      }
    }

    throw new Error(`${operation} exhausted retry policy`);
  }
}

module.exports = {
  HttpClient
};
