const { ActorBase, randomInt } = require("./shared/actor-base");

class CourseUser extends ActorBase {
  constructor(options = {}) {
    super({
      ...options,
      actorId: `course-user-${options.ordinal}`,
      actorClass: "course"
    });
    this.settings = options.config?.actorSettings?.course || {};
  }

  async execute() {
    const lessonIdentifier = `course-user-${this.ordinal}`;
    const appUrl = this.buildAppUrl({ open: "launcher" });

    await this.http.get(this.buildAppUrl({ open: "landing" }), {
      endpointClass: "launcher",
      operation: "course_user_landing"
    });
    await this.http.get(appUrl, {
      endpointClass: "course",
      operation: "course_shell_get"
    });
    await this.http.get(appUrl.replace("telepathybeginner.html", "telepathybeginner-learning-info-fragments.html"), {
      endpointClass: "course",
      operation: "course_deferred_fragment_get"
    });

    while (!this.isStopped()) {
      await this.http.get(appUrl, {
        endpointClass: "course",
        operation: "course_launcher_get"
      });

      await this.http.postJson(this.apiUrl, {
        action: "get_esp_lesson_state",
        identifier: lessonIdentifier,
        lesson_ids: ["lesson-1", "lesson-2", "lesson-3", "lesson-4", "lesson-5"]
      }, {
        endpointClass: "course",
        operation: "get_esp_lesson_state"
      });

      await this.http.postJson(this.apiUrl, {
        action: "get_learn_more_content",
        content_key: "main",
        lesson_domain: "legacy"
      }, {
        endpointClass: "course",
        operation: "get_learn_more_content"
      });

      await this.http.postJson(this.apiUrl, {
        action: "advance_esp_lesson_state",
        identifier: lessonIdentifier,
        lesson_ids: ["lesson-1", "lesson-2", "lesson-3", "lesson-4", "lesson-5"],
        command: Math.random() < 0.5 ? "next" : "dismiss",
        current_lesson_id: `lesson-${randomInt(1, 5)}`
      }, {
        endpointClass: "course",
        operation: "advance_esp_lesson_state"
      });

      await this.http.postJson(this.apiUrl, {
        action: "get_launcher_profile",
        launcher_role: "receiver",
        own_email: lessonIdentifier
      }, {
        endpointClass: "course",
        operation: "get_launcher_profile"
      });

      await this.sleepRandom(
        Number(this.settings.minThinkMs || 15000),
        Number(this.settings.maxThinkMs || 40000)
      );
    }
  }
}

module.exports = {
  CourseUser
};
