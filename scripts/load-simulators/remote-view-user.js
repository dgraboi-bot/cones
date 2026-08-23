const { TelepathySessionPairActor } = require("./telepathy-session-user");
const { randomInt } = require("./shared/actor-base");

function buildCoveredScreenTrialRecord(options = {}) {
  const nowMs = Date.now();
  const localCompleted = new Date(nowMs);
  const localDate = localCompleted.toLocaleDateString();
  const localTime = localCompleted.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  const sessionId = String(options.sessionId || "").trim();
  const roundId = String(options.roundId || "").trim();
  const level = String(options.level || "1").trim();
  const imagePairMode = level === "4";
  const correctChoice = Math.random() < 0.5 ? 1 : 2;
  const chosenChoice = Math.random() < 0.55 ? correctChoice : (correctChoice === 1 ? 2 : 1);
  const imageChoiceA = imagePairMode ? "imagepairs/sample-a.jpg" : "";
  const imageChoiceB = imagePairMode ? "imagepairs/sample-b.jpg" : "";
  const imageSent = correctChoice === 1 ? imageChoiceA : imageChoiceB;
  return {
    "export schema/version": "cones-trials-v6",
    trial_id: `${sessionId}-${roundId}`,
    session_id: sessionId,
    session_mode: "remote_viewing",
    remote_viewing_submode: "covered_screen",
    session_level: level,
    session_number: Number(options.sessionNumber || 1),
    trial_utc_ms: nowMs,
    round_id: roundId,
    "rx name": String(options.viewerName || "").trim(),
    "tx name": String(options.displayName || "").trim(),
    "local date": localDate,
    "local time": localTime,
    "sent layout": imagePairMode ? "" : (Math.random() < 0.5 ? "1" : "6"),
    "difficulty level": level,
    "trial aborted": "no",
    "trial timed out": "no",
    "rx choice1": String(chosenChoice),
    "rx choice2": "",
    confidence: 5,
    "rx done rt": randomInt(700, 2200),
    "utc time": new Date(nowMs).toISOString(),
    "rx location": "",
    "tx location": "",
    "sync est": "",
    "sync best": "",
    "sync worst": "",
    "image pair id": imagePairMode ? `covered-${sessionId}-${roundId}` : "",
    "sent image": imageSent,
    "image choice a": imageChoiceA,
    "image choice b": imageChoiceB,
    "rx image choice": imagePairMode ? (chosenChoice === 1 ? imageChoiceA : imageChoiceB) : ""
  };
}

class RemoteViewSessionActor extends TelepathySessionPairActor {
  constructor(options = {}) {
    super({
      ...options,
      actorId: String(options.actorId || `remote-view-${options.ordinal}`),
      actorClass: String(options.actorClass || "remote-viewing")
    });
    this.settings = options.config?.actorSettings?.remoteViewing || {};
    this.level = options.ordinal % 2 === 0 ? "4" : "1";
    this.submode = options.ordinal % 2 === 0 ? "remote_screen" : "covered_screen";
    this.viewerName = `rv-viewer-${options.ordinal}`;
    this.displayName = this.submode === "covered_screen" ? "Covered Screen" : `rv-screen-${options.ordinal}`;
    this.receiver.ownEmail = this.viewerName;
    this.receiver.partnerEmail = this.displayName;
    this.receiver.sessionCode = `${this.displayName.toLowerCase()}__${this.viewerName.toLowerCase()}`;
    this.sender.ownEmail = this.displayName;
    this.sender.partnerEmail = this.viewerName;
    this.sender.sessionCode = this.receiver.sessionCode;
  }

  async #resolveAllowedRemoteScreenLevel() {
    const response = await this.http.postJson(this.apiUrl, {
      action: "get_pair_difficulty",
      session_code: this.sender.sessionCode,
      frontend_build_version: this.version,
      sender_name: this.sender.ownEmail,
      receiver_name: this.receiver.ownEmail
    }, {
      endpointClass: "remote-view",
      operation: "get_pair_difficulty_remote_screen"
    });

    const json = response.json || {};
    const allowedMax = String(json?.pair_difficulty_meta?.max_allowed_difficulty_level || "").trim();
    const normalizedMax = ["1", "2", "3", "4"].includes(allowedMax) ? allowedMax : "1";
    const desired = Number(this.level || "1");
    const capped = Math.min(desired, Number(normalizedMax || "1"));
    return String(Math.max(1, capped));
  }

  async execute() {
    await this.http.get(this.buildAppUrl({ open: "launcher" }), {
      endpointClass: "launcher",
      operation: `remote_view_${this.submode}_boot`
    });

    if (this.submode === "remote_screen") {
      const allowedLevel = await this.#resolveAllowedRemoteScreenLevel();
      this.level = allowedLevel;
      try {
        await this.http.postJson(this.apiUrl, {
          action: "set_pair_difficulty",
          session_code: this.sender.sessionCode,
          frontend_build_version: this.version,
          difficulty_level: this.level,
          sender_name: this.sender.ownEmail,
          receiver_name: this.receiver.ownEmail
        }, {
          endpointClass: "remote-view",
          operation: "set_pair_difficulty_remote_screen"
        });
      } catch (error) {
        this.metrics.recordFlowFailure({
          actorClass: this.actorClass,
          actorId: this.actorId,
          endpointClass: "remote-view",
          reason: error instanceof Error ? error.message : String(error)
        });
        this.level = "1";
      }
      return super.execute();
    }

    const trials = randomInt(
      Number(this.settings.minTrialsPerSession || 3),
      Number(this.settings.maxTrialsPerSession || 6)
    );
    const sessionId = `covered-${this.ordinal}-${Date.now()}`;
    const sessionNumber = 1;

    for (let index = 0; index < trials && !this.isStopped(); index += 1) {
      const roundId = `covered-round-${Date.now()}-${index + 1}`;
      const trialRecord = buildCoveredScreenTrialRecord({
        sessionId,
        roundId,
        sessionNumber,
        viewerName: this.viewerName,
        displayName: this.displayName,
        level: this.level
      });

      await this.receiver.api("append_trial_record", {
        trial_record: trialRecord,
        simulation_mode: ""
      }, {
        endpointClass: "remote-view",
        operation: `append_trial_record_covered_${index + 1}`
      });

      await this.sleepRandom(
        Number(this.settings.minPostTrialPauseMs || 1200),
        Number(this.settings.maxPostTrialPauseMs || 3200)
      );
    }
  }
}

module.exports = {
  RemoteViewSessionActor
};
