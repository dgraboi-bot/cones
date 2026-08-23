const { ActorBase } = require("./shared/actor-base");

class LightNavigationUser extends ActorBase {
  constructor(options = {}) {
    super({
      ...options,
      actorId: `light-navigation-${options.ordinal}`,
      actorClass: "light-navigation"
    });
    this.settings = options.config?.actorSettings?.lightNavigation || {};
  }

  async execute() {
    await this.http.get(this.buildAppUrl({ open: "landing" }), {
      endpointClass: "launcher",
      operation: "landing_page_get"
    });

    while (!this.isStopped()) {
      await this.http.get(this.buildAppUrl({ open: "launcher" }), {
        endpointClass: "launcher",
        operation: "launcher_get"
      });

      await this.http.postJson(this.apiUrl, {
        action: "get_public_trial_mode"
      }, {
        endpointClass: "launcher",
        operation: "get_public_trial_mode"
      });

      await this.sleepRandom(
        Number(this.settings.minThinkMs || 15000),
        Number(this.settings.maxThinkMs || 45000)
      );
    }
  }
}

module.exports = {
  LightNavigationUser
};
