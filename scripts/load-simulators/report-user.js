const { ActorBase, randomInt } = require("./shared/actor-base");

class ReportUser extends ActorBase {
  constructor(options = {}) {
    super({
      ...options,
      actorId: `report-user-${options.ordinal}`,
      actorClass: "report"
    });
    this.settings = options.config?.actorSettings?.reports || {};
    this.reportPairs = [
      {
        receiver_name: "demo.level1.too-little.receiver",
        sender_name: "demo.level1.too-little.sender",
        source: "simulation",
        session_mode: "telepathy",
        session_level: "1"
      },
      {
        receiver_name: "demo.level1.not-telepathic.receiver",
        sender_name: "demo.level1.not-telepathic.sender",
        source: "simulation",
        session_mode: "telepathy",
        session_level: "1"
      },
      {
        receiver_name: "demo.level1.telepathic.receiver",
        sender_name: "demo.level1.telepathic.sender",
        source: "simulation",
        session_mode: "telepathy",
        session_level: "1"
      }
    ];
  }

  async execute() {
    await this.http.get(this.buildAppUrl({ open: "launcher" }), {
      endpointClass: "launcher",
      operation: "report_user_boot"
    });
    await this.http.get(this.buildAppUrl({ open: "performance-reports" }), {
      endpointClass: "report",
      operation: "report_shell_get"
    });
    await this.http.get(this.buildAppUrl({ open: "performance-reports" }).replace("telepathybeginner.html", "telepathybeginner-report-fragments.html"), {
      endpointClass: "report",
      operation: "report_deferred_fragment_get"
    });

    while (!this.isStopped()) {
      const list = await this.http.postJson(this.apiUrl, {
        action: "list_named_reports"
      }, {
        endpointClass: "report",
        operation: "list_named_reports"
      });

      const namedReports = Array.isArray(list.json?.named_reports) ? list.json.named_reports : [];

      await this.http.postJson(this.apiUrl, {
        action: "report_csv_data"
      }, {
        endpointClass: "report",
        operation: "report_csv_data"
      });

      const target = namedReports.length > 0
        ? namedReports[randomInt(0, namedReports.length - 1)]
        : this.reportPairs[randomInt(0, this.reportPairs.length - 1)];
      if (target) {
        try {
          await this.http.postJson(this.apiUrl, {
            action: "report_pair_csv_data",
            selected_pair: {
              receiver_name: String(target.receiver_name || target.receiverName || "").trim(),
              sender_name: String(target.sender_name || target.senderName || "").trim(),
              session_code: String(target.session_code || target.sessionCode || "").trim(),
              source: String(target.source || "").trim() || "real",
              session_mode: String(target.session_mode || "").trim(),
              remote_viewing_submode: String(target.remote_viewing_submode || "").trim(),
              session_level: String(target.session_level || "").trim()
            }
          }, {
            endpointClass: "report",
            operation: "report_pair_csv_data"
          });
        } catch (error) {
          this.metrics.recordFlowFailure({
            actorClass: this.actorClass,
            actorId: this.actorId,
            endpointClass: "report",
            reason: error instanceof Error ? error.message : String(error)
          });
        }
      }

      await this.sleepRandom(
        Number(this.settings.minThinkMs || 30000),
        Number(this.settings.maxThinkMs || 75000)
      );
    }
  }
}

module.exports = {
  ReportUser
};
