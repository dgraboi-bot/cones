const { ActorBase, randomInt } = require("./shared/actor-base");

const layoutMap = new Map([
  [1, [{ x: 50, y: 50 }]],
  [2, [{ x: 36, y: 50 }, { x: 64, y: 50 }]],
  [3, [{ x: 38, y: 62 }, { x: 62, y: 38 }]],
  [4, [{ x: 50, y: 36 }, { x: 50, y: 64 }]],
  [5, [{ x: 38, y: 38 }, { x: 62, y: 62 }]],
  [6, [{ x: 24, y: 50 }, { x: 50, y: 50 }, { x: 76, y: 50 }]],
  [7, [{ x: 26, y: 70 }, { x: 50, y: 50 }, { x: 74, y: 30 }]],
  [8, [{ x: 50, y: 24 }, { x: 50, y: 50 }, { x: 50, y: 76 }]],
  [9, [{ x: 28, y: 28 }, { x: 50, y: 50 }, { x: 72, y: 72 }]]
]);

function normalizeIdentifierForSession(value) {
  return String(value || "").trim().toLowerCase();
}

function buildSessionCode(a, b) {
  return [normalizeIdentifierForSession(a), normalizeIdentifierForSession(b)]
    .filter(Boolean)
    .sort()
    .join("__");
}

function arrangementCode(layoutNumber) {
  const points = layoutMap.get(Number(layoutNumber)) || [];
  return points
    .map((point) => `${Math.round(point.x)}x${Math.round(point.y)}`)
    .sort()
    .join("_");
}

function guessLayoutsForLevel(level) {
  const normalized = String(level || "1").trim();
  if (normalized === "1") {
    return [Math.random() < 0.5 ? 1 : 6];
  }
  if (normalized === "2") {
    return [[1], [6], [7], [8], [9]][randomInt(0, 4)];
  }
  if (normalized === "3") {
    return [[1], [2], [3], [4], [5], [6], [7], [8], [9]][randomInt(0, 8)];
  }
  return [Math.random() < 0.5 ? 1 : 2];
}

class SessionParticipantClient {
  constructor(parent, role, ownEmail, partnerEmail) {
    this.parent = parent;
    this.role = role;
    this.ownEmail = ownEmail;
    this.partnerEmail = partnerEmail;
    this.clientId = `${role}-${Math.random().toString(36).slice(2, 10)}`;
    this.sessionCode = buildSessionCode(ownEmail, partnerEmail);
  }

  get profile() {
    return {
      own_email: this.ownEmail,
      partner_email: this.partnerEmail,
      name: this.ownEmail,
      location: ""
    };
  }

  async api(action, payload = {}, options = {}) {
    return this.parent.http.postJson(this.parent.apiUrl, {
      action,
      role: this.role,
      client_id: this.clientId,
      frontend_build_version: this.parent.version,
      session_code: this.sessionCode,
      profile: this.profile,
      sync_metrics: {
        offset_ms: 0,
        best_rtt_ms: null,
        uncertainty_worst_ms: null,
        uncertainty_est_ms: null,
        uncertainty_best_ms: 0
      },
      ...payload
    }, {
      endpointClass: options.endpointClass || "session",
      operation: options.operation || action
    }).then((result) => result.json || {});
  }
}

class TelepathySessionPairActor extends ActorBase {
  constructor(options = {}) {
    super({
      ...options,
      actorId: String(options.actorId || `telepathy-pair-${options.ordinal}`),
      actorClass: String(options.actorClass || "telepathy-session")
    });
    this.settings = options.config?.actorSettings?.telepathy || {};
    this.level = ["1", "1", "1", "2", "3", "3"][(options.ordinal - 1) % 6];
    this.receiver = new SessionParticipantClient(this, "receiver", `load-rx-${options.ordinal}`, `load-sx-${options.ordinal}`);
    this.sender = new SessionParticipantClient(this, "sender", `load-sx-${options.ordinal}`, `load-rx-${options.ordinal}`);
  }

  async execute() {
    await this.http.get(this.buildAppUrl({ open: "launcher" }), {
      endpointClass: "launcher",
      operation: "telepathy_pair_boot_launcher"
    });

    try {
      await this.http.postJson(this.apiUrl, {
        action: "set_pair_difficulty",
        session_code: this.sender.sessionCode,
        frontend_build_version: this.version,
        difficulty_level: this.level,
        sender_name: this.sender.ownEmail,
        receiver_name: this.receiver.ownEmail
      }, {
        endpointClass: "session",
        operation: "set_pair_difficulty"
      });
    } catch (error) {
      this.metrics.recordFlowFailure({
        actorClass: this.actorClass,
        actorId: this.actorId,
        endpointClass: "session",
        reason: error instanceof Error ? error.message : String(error)
      });
      this.level = "1";
    }

    const trials = randomInt(
      Number(this.settings.minTrialsPerSession || 4),
      Number(this.settings.maxTrialsPerSession || 8)
    );

    for (let index = 0; index < trials && !this.isStopped(); index += 1) {
      await this.#runSingleTrial(index + 1);
      await this.sleepRandom(
        Number(this.settings.minPostTrialPauseMs || 1200),
        Number(this.settings.maxPostTrialPauseMs || 3200)
      );
    }
  }

  async #runSingleTrial(trialNumber) {
    await this.receiver.api("heartbeat", {
      receiver_ready: true
    }, {
      endpointClass: "session-critical",
      operation: `receiver_ready_${trialNumber}`
    });

    const senderStart = await this.sender.api("start_round", {
      start_server_ms: Date.now()
    }, {
      endpointClass: "session-critical",
      operation: `start_round_${trialNumber}`
    });

    let round = senderStart?.round || null;
    if (!round?.id) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await this.sleep(500);
        const receiverHeartbeat = await this.receiver.api("heartbeat", {
          receiver_ready: true
        }, {
          endpointClass: "session-critical",
          operation: `receiver_wait_round_${trialNumber}`
        });
        round = receiverHeartbeat?.state?.round || round;
        if (round?.id) {
          break;
        }
      }
    }

    if (!round?.id) {
      this.metrics.recordFlowFailure({
        actorClass: this.actorClass,
        actorId: this.actorId,
        endpointClass: "session-critical",
        reason: `round_not_created_trial_${trialNumber}`
      });
      return;
    }

    await this.sleepRandom(
      Number(this.settings.minReceiveWaitMs || 8500),
      Number(this.settings.maxReceiveWaitMs || 11000)
    );

    const guesses = guessLayoutsForLevel(this.level);
    const firstGuess = guesses[0];
    const secondGuess = guesses[1] || null;

    await this.receiver.api("submit_guess", {
      round_id: round.id,
      guess_layout_number: firstGuess,
      guess_arrangement_code: arrangementCode(firstGuess),
      second_guess_layout_number: secondGuess,
      second_guess_arrangement_code: secondGuess ? arrangementCode(secondGuess) : "",
      difficulty_level: this.level,
      confidence: 5,
      done_reaction_ms: randomInt(700, 2200)
    }, {
      endpointClass: "session-critical",
      operation: `submit_guess_${trialNumber}`
    });

    await this.receiver.api("post_round_choice", {
      round_id: round.id,
      choice: trialNumber < 999 ? "another" : "enough"
    }, {
      endpointClass: "session",
      operation: `receiver_post_round_${trialNumber}`
    });

    await this.sender.api("post_round_choice", {
      round_id: round.id,
      choice: trialNumber < 999 ? "another" : "enough"
    }, {
      endpointClass: "session",
      operation: `sender_post_round_${trialNumber}`
    });

    await this.sender.api("clear_post_round", {
      round_id: round.id,
      mode: "continue"
    }, {
      endpointClass: "session",
      operation: `clear_post_round_${trialNumber}`
    });
  }
}

module.exports = {
  TelepathySessionPairActor
};
