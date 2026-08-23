const { HttpClient } = require("./http-client");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function randomInt(min, max) {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return lower + Math.floor(Math.random() * ((upper - lower) + 1));
}

class ActorBase {
  constructor(options = {}) {
    this.actorId = String(options.actorId || "").trim();
    this.actorClass = String(options.actorClass || "").trim();
    this.ordinal = Number(options.ordinal || 0);
    this.config = options.config || {};
    this.metrics = options.metrics;
    this.appUrl = String(options.appUrl || "").trim();
    this.apiUrl = String(options.apiUrl || "").trim();
    this.baseUrl = String(options.baseUrl || "").trim();
    this.version = String(options.version || "").trim();
    this.stopAtMs = Number(options.stopAtMs || 0);
    this.stopped = false;
    this.pendingTasks = new Set();
    this.http = new HttpClient({
      baseUrl: this.baseUrl,
      metrics: this.metrics,
      actorId: this.actorId,
      actorClass: this.actorClass
    });
  }

  isStopped() {
    return this.stopped || (this.stopAtMs > 0 && Date.now() >= this.stopAtMs);
  }

  async sleep(ms) {
    if (this.isStopped()) {
      return;
    }
    await sleep(ms);
  }

  async sleepRandom(minMs, maxMs) {
    await this.sleep(randomInt(minMs, maxMs));
  }

  buildAppUrl(params = {}) {
    const url = new URL(this.appUrl);
    if (this.version) {
      url.searchParams.set("v", this.version);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value === null || typeof value === "undefined" || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  track(promise) {
    this.pendingTasks.add(promise);
    promise.finally(() => {
      this.pendingTasks.delete(promise);
    });
    return promise;
  }

  async run() {
    return this.track(this.execute());
  }

  async stopAndDrain() {
    this.stopped = true;
    await Promise.allSettled(Array.from(this.pendingTasks));
  }

  async execute() {
    throw new Error("ActorBase.execute() must be implemented.");
  }
}

module.exports = {
  ActorBase,
  randomInt
};
