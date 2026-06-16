(() => {
  const launcherKey = "cones-beginner-launcher-v2";
  const roleCards = Array.from(document.querySelectorAll("[data-role-card]"));
  const rolePanels = document.querySelector(".role-panels");
  const launcherView = document.querySelector('[data-view="launcher"]');
  const optionsView = document.querySelector('[data-view="options"]');
  const helpView = document.querySelector('[data-view="help"]');
  const colorSchemeView = document.querySelector('[data-view="color-scheme"]');
  const contactView = document.querySelector('[data-view="contact"]');
  const aboutView = document.querySelector('[data-view="about"]');
  const reportDefinitionView = document.querySelector('[data-view="report-definition"]');
  const reportView = document.querySelector('[data-view="report"]');
  const visualizationView = document.querySelector('[data-view="visualization"]');
  const difficultyView = document.querySelector('[data-view="difficulty"]');
  const settingsView = document.querySelector('[data-view="settings"]');
  const adminView = document.querySelector('[data-view="admin"]');
  const beginnerPanel = document.querySelector(".beginner-panel");
  const reportViewPanHandle = document.querySelector("[data-report-view-pan-handle]");
  const openOptionsButton = document.querySelector("[data-open-options]");
  const closeOptionsButton = document.querySelector("[data-close-options]");
  const openHelpButton = document.querySelector("[data-open-help]");
  const openColorSchemeButton = document.querySelector("[data-open-color-scheme]");
  const closeHelpButton = document.querySelector("[data-close-help]");
  const closeColorSchemeButton = document.querySelector("[data-close-color-scheme]");
  const openContactButton = document.querySelector("[data-open-contact]");
  const closeContactButton = document.querySelector("[data-close-contact]");
  const openAboutButton = document.querySelector("[data-open-about]");
  const closeAboutButton = document.querySelector("[data-close-about]");
  const openReportButton = document.querySelector("[data-open-report]");
  const closeReportDefinitionButton = document.querySelector("[data-close-report-definition]");
  const closeReportButton = document.querySelector("[data-close-report]");
  const closeVisualizationButton = document.querySelector("[data-close-visualization]");
  const reportDefinitionStatus = document.querySelector("[data-report-definition-status]");
  const reportPairPicker = document.querySelector("[data-report-pair-picker]");
  const reportPairTrigger = document.querySelector("[data-report-pair-trigger]");
  const reportPairTriggerText = document.querySelector("[data-report-pair-trigger-text]");
  const reportPairMenu = document.querySelector("[data-report-pair-menu]");
  const reportPairOptions = document.querySelector("[data-report-pair-options]");
  const reportGoButton = document.querySelector("[data-report-go]");
  const reportVisualizeButton = document.querySelector("[data-report-visualize]");
  const reportDefinitionDebug = document.querySelector("[data-report-definition-debug]");
  const openDifficultyButton = document.querySelector("[data-open-difficulty]");
  const openAdvancedButton = document.querySelector("[data-open-advanced]");
  const closeDifficultyButton = document.querySelector("[data-close-difficulty]");
  const closeSettingsButton = document.querySelector("[data-close-settings]");
  const closeAdminButton = document.querySelector("[data-close-admin]");
  const installAppButton = document.querySelector("[data-install-app]");
  const reportSummary = document.querySelector("[data-report-summary]");
  const reportStatus = document.querySelector("[data-report-status]");
  const reportTableWrap = document.querySelector("[data-report-table-wrap]");
  const reportTable = document.querySelector("[data-report-table]");
  const visualizationSummary = document.querySelector("[data-visualization-summary]");
  const visualizationStatus = document.querySelector("[data-visualization-status]");
  const visualizationChartWrap = document.querySelector("[data-visualization-chart-wrap]");
  const visualizationChart = document.querySelector("[data-visualization-chart]");
  const reportPanel = document.querySelector(".report-panel");
  const reportResizeHandles = Array.from(document.querySelectorAll("[data-report-resize]"));
  const difficultySlider = document.querySelector("[data-difficulty-slider]");
  const difficultyFill = document.querySelector("[data-difficulty-fill]");
  const difficultyThumb = document.querySelector("[data-difficulty-thumb]");
  const difficultyCurrent = document.querySelector("[data-difficulty-current]");
  const difficultyDescription = document.querySelector("[data-difficulty-description]");
  const difficultyLabels = Array.from(document.querySelectorAll("[data-pair-difficulty-label]"));
  const settingsCurrentPair = document.querySelector("[data-settings-current-pair]");
  const settingsSecondChoiceCheckbox = document.querySelector("[data-settings-second-choice]");
  const settingsImportFilenameInput = document.querySelector("[data-settings-import-filename]");
  const settingsStatus = document.querySelector("[data-settings-status]");
  const downloadSettingsCsvButton = document.querySelector("[data-download-settings-csv]");
  const contactMessageInput = document.querySelector("[data-contact-message]");
  const contactWordCount = document.querySelector("[data-contact-word-count]");
  const contactEmailInput = document.querySelector("[data-contact-email]");
  const colorSchemeInput = document.querySelector("[data-color-scheme-input]");
  const colorSchemeHexInput = document.querySelector("[data-color-scheme-hex]");
  const colorSchemeStatus = document.querySelector("[data-color-scheme-status]");
  const saveColorSchemeButton = document.querySelector("[data-save-color-scheme]");
  const resetColorSchemeButton = document.querySelector("[data-reset-color-scheme]");
  const contactStatus = document.querySelector("[data-contact-status]");
  const contactSendButton = document.querySelector("[data-contact-send]");
  const contactCancelButton = document.querySelector("[data-contact-cancel]");
  const adminDebugEnabledCheckbox = document.querySelector("[data-admin-debug-enabled]");
  const adminStorageInfo = document.querySelector("[data-admin-storage-info]");
    const adminStatus = document.querySelector("[data-admin-status]");
    const adminClearDebugLogButton = document.querySelector("[data-admin-clear-debug-log]");
      const adminListUsersButton = document.querySelector("[data-admin-list-users]");
    const adminUserList = document.querySelector("[data-admin-user-list]");
    const adminAnalyzeDiskButton = document.querySelector("[data-admin-analyze-disk]");
      const adminDiskUsage = document.querySelector("[data-admin-disk-usage]");
  const locationStatusBlocks = Array.from(document.querySelectorAll("[data-location-status]"));
  const retryLocationButtons = Array.from(document.querySelectorAll("[data-retry-location]"));
  let deferredInstallPrompt = null;
  let activeNameManagerOverlay = null;
  let locationRequestInFlight = false;
  let lastLocationAttemptAt = 0;
  let difficultyDragging = false;
  let difficultyDragPointerId = null;
  let difficultyDragLockedLevel = null;
  let difficultyDragReleasedLevel = null;
  let activePairDifficultyCode = "";
  let difficultyLoadToken = 0;
  let difficultyLabelToken = 0;
  let selectedReportPair = null;
  let availableReportPairs = [];
  let reportCsvRecordsCache = [];
  let reportCsvPathCache = "";
  let activeReportResize = null;
  let activeReportViewPan = null;
  let launcherAdminSecret = "";
  let launcherAdminState = {
      debug_enabled: false,
      storage: null,
      debug_log: null,
      user_trial_summary: null,
      disk_usage_analysis: null
    };
  const launcherBuildVersion = "20260616l";
  const defaultThemeColor = "#3160b0";
  const difficultyStopPercents = [17, 50, 84];
  const difficultyCopy = {
    1: 'In Level 1, you simply have to decide whether the sender is sending one cone or "many" (three) cones.',
    2: 'In Level 2 when there are "many" (three) cones, try also to specify whether they are arranged horizontally, vertically, or diagonally running up or down from left to right.',
    3: "In Level 3, one, two or three cones are sent. Try to specify exactly how many cones are sent and in what arrangement those cones are sent."
  };
  const coneThumbnailSrc = "cone-lowglow-transparent.png";
  const reportLayouts = {
    1: [
      { x: 50, y: 50 }
    ],
    2: [
      { x: 36, y: 50 },
      { x: 64, y: 50 }
    ],
    3: [
      { x: 38, y: 62 },
      { x: 62, y: 38 }
    ],
    4: [
      { x: 50, y: 36 },
      { x: 50, y: 64 }
    ],
    5: [
      { x: 38, y: 38 },
      { x: 62, y: 62 }
    ],
    6: [
      { x: 24, y: 50 },
      { x: 50, y: 50 },
      { x: 76, y: 50 }
    ],
    7: [
      { x: 26, y: 70 },
      { x: 50, y: 50 },
      { x: 74, y: 30 }
    ],
    8: [
      { x: 50, y: 24 },
      { x: 50, y: 50 },
      { x: 50, y: 76 }
    ],
    9: [
      { x: 28, y: 28 },
      { x: 50, y: 50 },
      { x: 72, y: 72 }
    ]
  };

  function readLauncherState() {
    try {
      const raw = localStorage.getItem(launcherKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ownNames: typeof parsed?.ownNames === "object" && parsed.ownNames ? parsed.ownNames : {},
        currentPartners: typeof parsed?.currentPartners === "object" && parsed.currentPartners ? parsed.currentPartners : {},
        deletedPartners: typeof parsed?.deletedPartners === "object" && parsed.deletedPartners ? parsed.deletedPartners : {},
        deviceLocation: typeof parsed?.deviceLocation === "object" && parsed.deviceLocation ? parsed.deviceLocation : null,
        locationPermission: typeof parsed?.locationPermission === "string" ? parsed.locationPermission : "",
        partnerHistory: typeof parsed?.partnerHistory === "object" && parsed.partnerHistory ? parsed.partnerHistory : {},
        launcherProfiles: typeof parsed?.launcherProfiles === "object" && parsed.launcherProfiles ? parsed.launcherProfiles : {},
        themeColor: typeof parsed?.themeColor === "string" ? parsed.themeColor : defaultThemeColor,
        difficultyLevel: ["1", "2", "3"].includes(String(parsed?.difficultyLevel || "")) ? String(parsed.difficultyLevel) : "1"
      };
    } catch (error) {
      return {
        ownNames: {},
        currentPartners: {},
        deletedPartners: {},
        deviceLocation: null,
        locationPermission: "",
        partnerHistory: {},
        launcherProfiles: {},
        themeColor: defaultThemeColor,
        difficultyLevel: "1"
      };
    }
  }

  function writeLauncherState(state) {
    localStorage.setItem(launcherKey, JSON.stringify(state));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeThemeHex(value) {
    const match = String(value || "").trim().match(/^#?([0-9a-f]{6})$/i);
    return match ? `#${match[1].toLowerCase()}` : defaultThemeColor;
  }

  function hexToRgb(hex) {
    const normalized = normalizeThemeHex(hex).slice(1);
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
  }

  function rgbToHsl(r, g, b) {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    let h;
    let s;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case red:
          h = (green - blue) / d + (green < blue ? 6 : 0);
          break;
        case green:
          h = (blue - red) / d + 2;
          break;
        default:
          h = (red - green) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    if (s === 0) {
      const gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }

    const hue2rgb = (p, q, t) => {
      let next = t;
      if (next < 0) next += 1;
      if (next > 1) next -= 1;
      if (next < 1 / 6) return p + (q - p) * 6 * next;
      if (next < 1 / 2) return q;
      if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    };
  }

  function adjustThemeColor(hex, { hueShift = 0, saturationScale = 1, lightnessDelta = 0, alpha = 1 } = {}) {
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    const shiftedHue = (hsl.h + hueShift + 1) % 1;
    const scaledSaturation = clamp(hsl.s * saturationScale, 0, 1);
    const shiftedLightness = clamp(hsl.l + lightnessDelta, 0, 1);
    const rgb = hslToRgb(shiftedHue, scaledSaturation, shiftedLightness);
    return alpha >= 1
      ? rgbToHex(rgb.r, rgb.g, rgb.b)
      : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function applyThemeColor(themeHex) {
    const rootStyle = document.documentElement.style;
    const color = normalizeThemeHex(themeHex);
    rootStyle.setProperty("--brand-base", color);
    rootStyle.setProperty("--brand-top", adjustThemeColor(color, { lightnessDelta: 0.1 }));
    rootStyle.setProperty("--brand-bottom", adjustThemeColor(color, { lightnessDelta: -0.06 }));
    rootStyle.setProperty("--brand-top-hover", adjustThemeColor(color, { lightnessDelta: 0.16 }));
    rootStyle.setProperty("--brand-bottom-hover", adjustThemeColor(color, { lightnessDelta: -0.01 }));
    rootStyle.setProperty("--brand-border", adjustThemeColor(color, { lightnessDelta: 0.18, alpha: 0.72 }));
    rootStyle.setProperty("--brand-shadow", adjustThemeColor(color, { lightnessDelta: -0.22, alpha: 0.28 }));
    rootStyle.setProperty("--brand-surface-border", adjustThemeColor(color, { lightnessDelta: 0.12, alpha: 0.82 }));
    rootStyle.setProperty("--brand-surface-top", adjustThemeColor(color, { lightnessDelta: -0.01, alpha: 0.9 }));
    rootStyle.setProperty("--brand-surface-bottom", adjustThemeColor(color, { lightnessDelta: -0.17, alpha: 0.92 }));
    rootStyle.setProperty("--brand-surface-base", adjustThemeColor(color, { lightnessDelta: -0.24, alpha: 0.9 }));
    rootStyle.setProperty("--brand-surface-shadow", adjustThemeColor(color, { lightnessDelta: -0.08, alpha: 0.16 }));
    rootStyle.setProperty("--brand-soft", adjustThemeColor(color, { lightnessDelta: 0.05, alpha: 0.22 }));
    rootStyle.setProperty("--brand-ambient", adjustThemeColor(color, { lightnessDelta: 0.18, alpha: 0.11 }));
    rootStyle.setProperty("--brand-track-top", adjustThemeColor(color, { lightnessDelta: 0.22 }));
    rootStyle.setProperty("--brand-track-bottom", adjustThemeColor(color, { lightnessDelta: 0.05 }));
    rootStyle.setProperty("--brand-thumb", adjustThemeColor(color, { lightnessDelta: 0.2 }));
    rootStyle.setProperty("--brand-focus", adjustThemeColor(color, { lightnessDelta: 0.22, alpha: 0.28 }));
  }

  function persistThemeColor(themeHex) {
    const latest = readLauncherState();
    latest.themeColor = normalizeThemeHex(themeHex);
    writeLauncherState(latest);
    applyThemeColor(latest.themeColor);
    return latest.themeColor;
  }

  function buildReportRequestPayload() {
    const payload = {
      action: "report_csv_data"
    };

    if (launcherAdminSecret) {
      payload.secret_candidate = launcherAdminSecret;
      payload.include_all = true;
      return payload;
    }

    payload.candidate_pairs = collectReportCandidatePairs().map((pair) => ({
      receiver_name: pair.receiverName,
      sender_name: pair.senderName,
      session_code: pair.sessionCode
    }));
    payload.associated_names = collectReportOwnNames();
    return payload;
  }

  async function fetchReportCsvData() {
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildReportRequestPayload())
    });

    if (!response.ok) {
      throw new Error(`Report CSV request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reportCsv = data?.report_csv || {};
    reportCsvPathCache = String(reportCsv?.path || "");
    reportCsvRecordsCache = Array.isArray(reportCsv?.records) ? reportCsv.records : [];
    return {
      available: !!reportCsv?.available,
      message: String(reportCsv?.message || ""),
      path: reportCsvPathCache,
      records: reportCsvRecordsCache
    };
  }

  async function fetchSelectedPairReportCsvData(pairInfo) {
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "report_pair_csv_data",
        selected_pair: {
          receiver_name: String(pairInfo?.receiverName || ""),
          sender_name: String(pairInfo?.senderName || ""),
          session_code: String(pairInfo?.sessionCode || "")
        },
        secret_candidate: launcherAdminSecret || ""
      })
    });

    if (!response.ok) {
      throw new Error(`Pair report CSV request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reportCsv = data?.report_csv || {};
    return {
      available: !!reportCsv?.available,
      message: String(reportCsv?.message || ""),
      path: String(reportCsv?.path || ""),
      records: Array.isArray(reportCsv?.records) ? reportCsv.records : []
    };
  }

  async function fetchLauncherProfile(role, ownEmail) {
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "get_launcher_profile",
        launcher_role: role,
        own_email: String(ownEmail || "").trim()
      })
    });

    if (!response.ok) {
      throw new Error(`Launcher profile request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.launcher_profile || null;
  }

  async function saveLauncherProfile(role, ownEmail, profileState) {
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "save_launcher_profile",
        launcher_role: role,
        own_email: String(ownEmail || "").trim(),
        launcher_profile: {
          current_partner: String(profileState?.currentPartner || "").trim(),
          partner_history: uniqueNames(Array.isArray(profileState?.partnerHistory) ? profileState.partnerHistory : []),
          deleted_partners: uniqueNames(Array.isArray(profileState?.deletedPartners) ? profileState.deletedPartners : [])
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Launcher profile save failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.launcher_profile || null;
  }

  function uniqueNames(names) {
    const cleaned = names
      .map((name) => String(name || "").trim())
      .filter(Boolean);
    return [...new Set(cleaned)];
  }

  function normalizePersonNameForPairMatch(name) {
    return String(name || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function buildPairMatchKey(receiverName, senderName) {
    return `${normalizePersonNameForPairMatch(receiverName)}|||${normalizePersonNameForPairMatch(senderName)}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function partnerRole(role) {
    return role === "sender" ? "receiver" : "sender";
  }

  function buildDisplayName(firstName, lastName) {
    return [String(firstName || "").trim(), String(lastName || "").trim()].filter(Boolean).join(" ").trim();
  }

  function normalizeDifficultyLevel(level) {
    return ["1", "2", "3"].includes(String(level || "")) ? String(level) : "1";
  }

  function normalizeIdentifierForStorage(name) {
    return String(name || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeNameForSession(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function buildSessionCodeFromNames(ownName, partnerName) {
    const pair = [normalizeNameForSession(ownName), normalizeNameForSession(partnerName)]
      .filter(Boolean)
      .sort();
    return pair.length === 2 ? `${pair[0]}__${pair[1]}` : "";
  }

  function buildLauncherProfileKey(role, ownIdentifier) {
    const normalizedRole = role === "sender" ? "sender" : "receiver";
    const normalizedIdentifier = normalizeIdentifierForStorage(ownIdentifier);
    return normalizedIdentifier ? `${normalizedRole}::${normalizedIdentifier}` : `${normalizedRole}::`;
  }

  function readLauncherProfileState(role, ownIdentifier, state = readLauncherState()) {
    const profileKey = buildLauncherProfileKey(role, ownIdentifier);
    const launcherProfiles = typeof state.launcherProfiles === "object" && state.launcherProfiles
      ? state.launcherProfiles
      : {};
    const scoped = launcherProfiles[profileKey];
    const legacyPartnerKey = partnerRole(role);
    return {
      currentPartner: String(scoped?.currentPartner || state.currentPartners?.[role] || "").trim(),
      partnerHistory: uniqueNames([
        ...(Array.isArray(scoped?.partnerHistory) ? scoped.partnerHistory : []),
        ...(Array.isArray(state.partnerHistory?.[legacyPartnerKey]) ? state.partnerHistory[legacyPartnerKey] : [])
      ]),
      deletedPartners: uniqueNames([
        ...(Array.isArray(scoped?.deletedPartners) ? scoped.deletedPartners : []),
        ...(Array.isArray(state.deletedPartners?.[legacyPartnerKey]) ? state.deletedPartners[legacyPartnerKey] : [])
      ])
    };
  }

  function writeLauncherProfileState(role, ownIdentifier, profileState) {
    const latest = readLauncherState();
    latest.launcherProfiles = latest.launcherProfiles || {};
    latest.currentPartners = latest.currentPartners || {};
    latest.partnerHistory = latest.partnerHistory || {};
    latest.deletedPartners = latest.deletedPartners || {};
    latest.launcherProfiles[buildLauncherProfileKey(role, ownIdentifier)] = {
      currentPartner: String(profileState?.currentPartner || "").trim(),
      partnerHistory: uniqueNames(Array.isArray(profileState?.partnerHistory) ? profileState.partnerHistory : []),
      deletedPartners: uniqueNames(Array.isArray(profileState?.deletedPartners) ? profileState.deletedPartners : [])
    };
    latest.currentPartners[role] = String(profileState?.currentPartner || "").trim();
    latest.partnerHistory[partnerRole(role)] = uniqueNames(Array.isArray(profileState?.partnerHistory) ? profileState.partnerHistory : []);
    latest.deletedPartners[partnerRole(role)] = uniqueNames(Array.isArray(profileState?.deletedPartners) ? profileState.deletedPartners : []);
    if (ownIdentifier) {
      latest.ownNames = latest.ownNames || {};
      latest.ownNames[role] = ownIdentifier;
    }
    writeLauncherState(latest);
    return latest;
  }

  function readRoleSettings(role) {
    try {
      const raw = localStorage.getItem(`cones-settings-v2-${role}`);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ownName: String(parsed?.own_email || "").trim(),
        partnerName: String(parsed?.partner_email || "").trim()
      };
    } catch (error) {
      return {
        ownName: "",
        partnerName: ""
      };
    }
  }

  function readRuntimeSettings(role) {
    try {
      const raw = localStorage.getItem(`cones-settings-v2-${role}`);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ...parsed,
        allow_second_choice: typeof parsed?.allow_second_choice === "boolean" ? parsed.allow_second_choice : false,
        import_csv_filename: typeof parsed?.import_csv_filename === "string" ? parsed.import_csv_filename : ""
      };
    } catch (error) {
      return {
        allow_second_choice: false,
        import_csv_filename: ""
      };
    }
  }

  function writeRuntimeSettings(role, updates) {
    const next = {
      ...readRuntimeSettings(role),
      ...updates
    };
    localStorage.setItem(`cones-settings-v2-${role}`, JSON.stringify(next));
    return next;
  }

  async function checkAdminSecret(secretCandidate) {
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "check_admin_secret",
        secret_candidate: String(secretCandidate || "")
      })
    });

    if (!response.ok) {
      throw new Error(`Admin secret check failed with status ${response.status}`);
    }

    const data = await response.json();
    return !!data?.admin_secret_match;
  }

  async function launcherAdminApi(action, payload = {}) {
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action,
        secret_candidate: launcherAdminSecret,
        ...payload
      })
    });

    if (!response.ok) {
      throw new Error(`Admin request failed with status ${response.status}`);
    }

    return response.json();
  }

  function readRoleFormValues(role) {
    const form = document.querySelector(`[data-role-form="${role}"]`);
    if (!form) {
      return {
        ownName: "",
        partnerName: ""
      };
    }

    return {
      ownName: String(form.elements.ownName?.value || "").trim(),
      partnerName: String(form.elements.partnerName?.value || "").trim()
    };
  }

  function setRoleDifficultyLabel(role, level) {
    const label = difficultyLabels.find((item) => item.dataset.pairDifficultyLabel === role);
    if (label) {
      if (!label.dataset.placeholder) {
        label.dataset.placeholder = String(label.textContent || "Level 1").trim() || "Level 1";
      }
      if (level === "" || level === null) {
        label.textContent = label.dataset.placeholder;
        label.classList.add("role-card-level-hidden");
        return;
      }
      const nextText = `Level ${normalizeDifficultyLevel(level)}`;
      label.dataset.placeholder = nextText;
      label.textContent = nextText;
      label.classList.remove("role-card-level-hidden");
    }
  }

  function getPairContextForRole(role) {
    const state = readLauncherState();
    const formValues = readRoleFormValues(role);
    const roleSettings = readRoleSettings(role);
    const ownName =
      formValues.ownName ||
      String(state.ownNames?.[role] || "").trim() ||
      roleSettings.ownName;
    const launcherProfile = readLauncherProfileState(role, ownName, state);
    const partnerName =
      formValues.partnerName ||
      launcherProfile.currentPartner ||
      String(state.currentPartners?.[role] || "").trim() ||
      roleSettings.partnerName;
    const sessionCode = buildSessionCodeFromNames(ownName, partnerName);

    if (!sessionCode) {
      return null;
    }

    return {
      role,
      ownName,
      partnerName,
      sessionCode
    };
  }

  function getCurrentPairContext() {
    const activeCard = roleCards.find((card) => card.classList.contains("active"));
    const activeRole = activeCard?.dataset.roleCard || "";
    const activeContext = activeRole ? getPairContextForRole(activeRole) : null;
    if (activeContext) {
      return activeContext;
    }

    const senderContext = getPairContextForRole("sender");
    const receiverContext = getPairContextForRole("receiver");

    if (senderContext && receiverContext && senderContext.sessionCode === receiverContext.sessionCode) {
      return senderContext;
    }

    return senderContext || receiverContext || null;
  }

  function getReceiverDifficultyContext() {
    return getPairContextForRole("receiver");
  }

  function getCurrentPairParticipants() {
    const senderContext = getPairContextForRole("sender");
    const receiverContext = getPairContextForRole("receiver");

    if (
      senderContext &&
      receiverContext &&
      senderContext.sessionCode === receiverContext.sessionCode
    ) {
      return {
        sessionCode: senderContext.sessionCode,
        senderName: senderContext.ownName,
        receiverName: receiverContext.ownName
      };
    }

    const activeContext = getCurrentPairContext();
    if (!activeContext) {
      return null;
    }

    return activeContext.role === "sender"
      ? {
          sessionCode: activeContext.sessionCode,
          senderName: activeContext.ownName,
          receiverName: activeContext.partnerName
        }
      : {
          sessionCode: activeContext.sessionCode,
          senderName: activeContext.partnerName,
          receiverName: activeContext.ownName
        };
  }

  function collectReportOwnNames() {
    const state = readLauncherState();
    return uniqueNames([
      readRoleFormValues("sender").ownName,
      readRoleFormValues("receiver").ownName,
      readRoleSettings("sender").ownName,
      readRoleSettings("receiver").ownName,
      String(state.ownNames?.sender || "").trim(),
      String(state.ownNames?.receiver || "").trim()
    ]);
  }

  function collectReportCandidatePairs() {
    const candidates = [];
    const seen = new Set();

    const addCandidate = (receiverName, senderName) => {
      const receiver = String(receiverName || "").trim();
      const sender = String(senderName || "").trim();
      if (!receiver || !sender) {
        return;
      }
      if (receiver.toLowerCase() === sender.toLowerCase()) {
        return;
      }
      const key = buildPairMatchKey(receiver, sender);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      candidates.push({
        key,
        receiverName: receiver,
        senderName: sender,
        sessionCode: getRecordSessionCode({
          "rx name": receiver,
          "tx name": sender
        })
      });
    };

    const receiverForm = readRoleFormValues("receiver");
    addCandidate(receiverForm.ownName, receiverForm.partnerName);

    const senderForm = readRoleFormValues("sender");
    addCandidate(senderForm.partnerName, senderForm.ownName);

    const receiverSettings = readRoleSettings("receiver");
    addCandidate(receiverSettings.ownName, receiverSettings.partnerName);

    const senderSettings = readRoleSettings("sender");
    addCandidate(senderSettings.partnerName, senderSettings.ownName);

    const currentParticipants = getCurrentPairParticipants();
    if (currentParticipants) {
      addCandidate(currentParticipants.receiverName, currentParticipants.senderName);
    }

    return candidates;
  }

  function syncCurrentLauncherNamesToState() {
    const latest = readLauncherState();
    latest.ownNames = latest.ownNames || {};

    const senderOwnName = readRoleFormValues("sender").ownName;
    const receiverOwnName = readRoleFormValues("receiver").ownName;

    if (senderOwnName) {
      latest.ownNames.sender = senderOwnName;
    }
    if (receiverOwnName) {
      latest.ownNames.receiver = receiverOwnName;
    }

    writeLauncherState(latest);
  }

  function getAvailableReportPairs(records = reportCsvRecordsCache) {
    const includeAllPairs = !!launcherAdminSecret;
    const ownNames = new Set(collectReportOwnNames().map((name) => normalizePersonNameForPairMatch(name)));
    const candidatePairs = collectReportCandidatePairs();
    const candidateKeys = new Set(candidatePairs.map((pair) => pair.key));
    const latestByPair = new Map();

    if (!includeAllPairs) {
      candidatePairs.forEach((pairInfo) => {
        latestByPair.set(pairInfo.key, {
          key: pairInfo.key,
          receiverName: pairInfo.receiverName,
          senderName: pairInfo.senderName,
          sessionCode: pairInfo.sessionCode,
          latestUtcMillis: Number.NEGATIVE_INFINITY,
          recordCount: 0
        });
      });
    }

    records.forEach((record) => {
      const receiverName = String(record?.["rx name"] || "").trim();
      const senderName = String(record?.["tx name"] || "").trim();
      if (!receiverName || !senderName) {
        return;
      }

      const pairKey = buildPairMatchKey(receiverName, senderName);

      if (!includeAllPairs) {
        const candidateMatch = candidateKeys.size ? candidateKeys.has(pairKey) : false;
        const associatedMatch = ownNames.size
          ? (
              ownNames.has(normalizePersonNameForPairMatch(receiverName)) ||
              ownNames.has(normalizePersonNameForPairMatch(senderName))
            )
          : false;

        if ((candidateKeys.size || ownNames.size) && !candidateMatch && !associatedMatch) {
          return;
        }
      }

      const currentMillis = parseUtcMillis(record);
      const existing = latestByPair.get(pairKey);

      if (!existing || currentMillis > existing.latestUtcMillis) {
        latestByPair.set(pairKey, {
          key: pairKey,
          receiverName,
          senderName,
          sessionCode: getRecordSessionCode(record),
          latestUtcMillis: currentMillis,
          recordCount: (existing?.recordCount || 0) + 1
        });
      } else if (existing) {
        existing.recordCount += 1;
      }
    });

    return [...latestByPair.values()].sort((left, right) => {
      const leftHasData = Number.isFinite(left.latestUtcMillis);
      const rightHasData = Number.isFinite(right.latestUtcMillis);
      if (leftHasData !== rightHasData) {
        return leftHasData ? -1 : 1;
      }
      return right.latestUtcMillis - left.latestUtcMillis;
    });
  }

  function closeReportPairMenu() {
    if (reportPairMenu) {
      reportPairMenu.hidden = true;
    }
    if (reportPairTrigger) {
      reportPairTrigger.setAttribute("aria-expanded", "false");
    }
  }

  function openReportPairMenu() {
    if (!reportPairMenu || !reportPairTrigger || !availableReportPairs.length) {
      return;
    }
    reportPairMenu.hidden = false;
    reportPairTrigger.setAttribute("aria-expanded", "true");
  }

  function setSelectedReportPair(pairInfo) {
    selectedReportPair = pairInfo || null;
    if (reportPairTriggerText) {
      reportPairTriggerText.innerHTML = selectedReportPair
        ? `${escapeHtml(selectedReportPair.receiverName)}&nbsp;&nbsp;${escapeHtml(selectedReportPair.senderName)}`
        : "Select receiver and sender";
    }
    if (reportGoButton) {
      reportGoButton.hidden = !selectedReportPair;
    }
    if (reportVisualizeButton) {
      reportVisualizeButton.hidden = !selectedReportPair;
    }
    renderReportPairOptions();
  }

  function renderReportPairOptions() {
    if (!reportPairOptions) {
      return;
    }

    reportPairOptions.replaceChildren();

    availableReportPairs.forEach((pairInfo) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "report-pair-option";
      if (selectedReportPair?.key === pairInfo.key) {
        optionButton.classList.add("is-selected");
      }
      optionButton.innerHTML = `
        <span class="report-pair-option-value">${escapeHtml(pairInfo.receiverName)}</span>
        <span class="report-pair-option-value">${escapeHtml(pairInfo.senderName)}</span>
        <span class="report-pair-option-value">${escapeHtml(String(pairInfo.recordCount || 0))}</span>
      `;
      optionButton.addEventListener("click", () => {
        setSelectedReportPair(pairInfo);
        closeReportPairMenu();
      });
      reportPairOptions.appendChild(optionButton);
    });
  }

  async function renderReportDefinition() {
    let csvResult = {
      available: false,
      message: "",
      path: "",
      records: []
    };
    try {
      csvResult = await fetchReportCsvData();
    } catch (error) {
      csvResult = {
        available: false,
        message: "Unable to load the server trial history right now.",
        path: "",
        records: []
      };
    }

    availableReportPairs = getAvailableReportPairs(csvResult.records);
    const ownNames = collectReportOwnNames();
    const candidatePairs = collectReportCandidatePairs();
    if (reportPairTrigger) {
      reportPairTrigger.disabled = !availableReportPairs.length;
    }

    if (reportDefinitionDebug) {
      reportDefinitionDebug.textContent = "";
      reportDefinitionDebug.hidden = true;
    }

    if (!availableReportPairs.length) {
      setSelectedReportPair(null);
      closeReportPairMenu();
      if (reportDefinitionStatus) {
        reportDefinitionStatus.textContent = csvResult.available
          ? (
              ownNames.length
                ? `No receiver-sender pairs were found in the server trial history for ${ownNames.join(" / ")}.`
                : "Enter or save your email first so the report generator can find receiver-sender pairs associated with you."
            )
          : (csvResult.message || "No server-side trial history is available right now.");
      }
      return;
    }

    if (!selectedReportPair || !availableReportPairs.some((pairInfo) => pairInfo.key === selectedReportPair?.key)) {
      setSelectedReportPair(null);
    } else {
      renderReportPairOptions();
    }

    if (reportDefinitionStatus) {
      reportDefinitionStatus.textContent = "";
    }
  }

  function parseUtcMillis(record) {
    const utcText = String(record?.["utc time"] || "").trim();
    const millis = utcText ? Date.parse(utcText) : NaN;
    return Number.isFinite(millis) ? millis : Number.POSITIVE_INFINITY;
  }

  function getRecordsForReportPair(records, pairInfo) {
    if (!pairInfo?.receiverName || !pairInfo?.senderName) {
      return [];
    }

    const targetKey = buildPairMatchKey(pairInfo.receiverName, pairInfo.senderName);
    return (Array.isArray(records) ? records : [])
      .filter((record) => {
        const receiverName = String(record?.["rx name"] || "").trim();
        const senderName = String(record?.["tx name"] || "").trim();
        return buildPairMatchKey(receiverName, senderName) === targetKey;
      })
      .sort((left, right) => parseUtcMillis(left) - parseUtcMillis(right));
  }

  function getRecordSessionCode(record) {
    return buildSessionCodeFromNames(
      String(record?.["rx name"] || "").trim(),
      String(record?.["tx name"] || "").trim()
    );
  }

  function parseLocationValue(rawValue) {
    const text = String(rawValue || "").trim();
    if (!text) {
      return null;
    }

    try {
      const parsed = JSON.parse(text);
      const latitude = Number(parsed?.latitude);
      const longitude = Number(parsed?.longitude);
      const accuracy = Number(parsed?.accuracy);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return {
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          timestamp: Number.isFinite(Number(parsed?.timestamp)) ? Number(parsed.timestamp) : null
        };
      }
    } catch (error) {
      // Fall through to loose parsing.
    }

    const latitudeMatch = text.match(/latitude["=: ]+(-?\d+(?:\.\d+)?)/i) || text.match(/lat["=: ]+(-?\d+(?:\.\d+)?)/i);
    const longitudeMatch = text.match(/longitude["=: ]+(-?\d+(?:\.\d+)?)/i) || text.match(/lon["=: ]+(-?\d+(?:\.\d+)?)/i);
    const accuracyMatch = text.match(/accuracy["=: ]+(-?\d+(?:\.\d+)?)/i);

    if (latitudeMatch && longitudeMatch) {
      const latitude = Number(latitudeMatch[1]);
      const longitude = Number(longitudeMatch[1]);
      const accuracy = accuracyMatch ? Number(accuracyMatch[1]) : null;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return {
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          timestamp: null
        };
      }
    }

    return null;
  }

  function formatLocationLabel(location, options = {}) {
    const includeTimestampError = !!options.includeTimestampError;
    const utcMillis = Number.isFinite(options.utcMillis) ? options.utcMillis : null;

    if (!location) {
      return "unknown";
    }

    const parts = [
      `lat ${location.latitude.toFixed(6)}`,
      `long ${location.longitude.toFixed(6)}`
    ];
    if (Number.isFinite(location.accuracy)) {
      parts.push(`+/- ${location.accuracy.toFixed(1)} m`);
    }

    if (includeTimestampError) {
      const locationTimestamp = Number(location.timestamp);
      const hasTimestampError =
        Number.isFinite(locationTimestamp) &&
        Number.isFinite(utcMillis) &&
        Math.abs(locationTimestamp - utcMillis) > 3600000;
      parts.push(`ts err ${hasTimestampError ? "yes" : "no"}`);
    }

    return parts.join(", ");
  }

  function haversineDistanceMeters(a, b) {
    const earthRadiusMeters = 6371000;
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const deltaLat = toRadians(b.latitude - a.latitude);
    const deltaLon = toRadians(b.longitude - a.longitude);

    const sinLat = Math.sin(deltaLat / 2);
    const sinLon = Math.sin(deltaLon / 2);
    const chord =
      sinLat * sinLat +
      Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

    const arc = 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
    return earthRadiusMeters * arc;
  }

  function formatDistanceWithUnit(distanceMeters, preferredUnit = "") {
    if (!Number.isFinite(distanceMeters)) {
      return "unknown";
    }

    const useMiles = preferredUnit === "miles" || (!preferredUnit && distanceMeters >= 1609.344);
    if (useMiles) {
      return `${(distanceMeters / 1609.344).toFixed(1)} miles`;
    }

    return `${distanceMeters.toFixed(1)} meters`;
  }

  function formatReactionTimeTenths(value) {
    const milliseconds = Number(String(value ?? "").trim());
    if (!Number.isFinite(milliseconds)) {
      return String(value ?? "");
    }
    return (milliseconds / 1000).toFixed(1);
  }

  function formatUtcDisplay(value) {
    const text = String(value ?? "").trim();
    if (!text) {
      return "";
    }

    const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/);
    if (isoMatch) {
      return `${isoMatch[1]} ${isoMatch[2]}`;
    }

    return text.replace("T", " ");
  }

  function renderReportSummary(pairInfo, records) {
    if (!reportSummary || !reportStatus) {
      return;
    }

    reportSummary.replaceChildren();

    const firstLine = document.createElement("p");
    firstLine.className = "report-summary-line";
    firstLine.textContent = `Receiver-sender pair: ${pairInfo.receiverName || "unknown"} - ${pairInfo.senderName || "unknown"}.`;

    reportSummary.append(firstLine);
    reportStatus.textContent = `${records.length} trial record${records.length === 1 ? "" : "s"} found for this pair.`;
  }

  function createReportLayoutThumbnailCell(value) {
    const layoutNumber = Number(String(value ?? "").trim());
    const layout = reportLayouts[layoutNumber];
    if (!layout) {
      return document.createTextNode(String(value ?? ""));
    }

    const thumb = document.createElement("div");
    thumb.className = "report-layout-thumb";
    thumb.setAttribute("aria-label", `Layout ${layoutNumber}`);
    thumb.title = `Layout ${layoutNumber}`;

    layout.forEach((point, index) => {
      const cone = document.createElement("img");
      cone.className = "report-layout-cone";
      cone.src = coneThumbnailSrc;
      cone.alt = "";
      cone.setAttribute("aria-hidden", "true");
      cone.style.left = `${point.x}%`;
      cone.style.top = `${point.y}%`;
      cone.style.zIndex = String(index + 1);
      thumb.appendChild(cone);
    });

    return thumb;
  }

  function getLayoutArrangementCategory(layoutNumber) {
    switch (layoutNumber) {
      case 6:
        return "horizontal";
      case 7:
        return "diagonal-up";
      case 8:
        return "vertical";
      case 9:
        return "diagonal-down";
      default:
        return "";
    }
  }

  function getLayoutConeCount(layoutNumber) {
    const layout = reportLayouts[Number(layoutNumber)];
    return Array.isArray(layout) ? layout.length : 0;
  }

  function formatScoreValue(value) {
    if (!Number.isFinite(value)) {
      return "";
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function formatProbabilityValue(value) {
    if (!Number.isFinite(value)) {
      return "unknown";
    }
    if (value === 0) {
      return "< 1e-12";
    }
    if (value < 0.001) {
      return value.toExponential(2);
    }
    return value.toFixed(4);
  }

  function approximateErf(x) {
    const sign = x < 0 ? -1 : 1;
    const absoluteX = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * absoluteX);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absoluteX * absoluteX);
    return sign * y;
  }

  function normalCdf(value) {
    return 0.5 * (1 + approximateErf(value / Math.SQRT2));
  }

  function getLevelThreeCountWeight(targetConeCount) {
    if (targetConeCount === 1) {
      return 1;
    }
    if (targetConeCount === 2 || targetConeCount === 3) {
      return 1.5;
    }
    return 0;
  }

  function getTrialScoreModel(record) {
    const difficultyLevel = String(record?.["difficulty level"] ?? "").trim();
    const sentLayout = Number(String(record?.["sent layout"] ?? "").trim());
    const choiceOne = Number(String(record?.["rx choice1"] ?? "").trim());
    const sentConeCount = getLayoutConeCount(sentLayout);
    const chosenConeCount = getLayoutConeCount(choiceOne);
    const exactMatch = sentLayout === choiceOne;
    const countMatch = sentConeCount > 0 && sentConeCount === chosenConeCount;

    if (difficultyLevel === "1") {
      const observed = exactMatch || (sentConeCount === 3 && chosenConeCount === 3) ? 1 : 0;
      return {
        observed,
        expected: 0.5,
        variance: 0.25,
        level: 1
      };
    }

    if (difficultyLevel === "2") {
      if (sentConeCount === 1) {
        const observed = exactMatch ? 1 : 0;
        return {
          observed,
          expected: 0.2,
          variance: 0.16,
          level: 2
        };
      }

      const observed = exactMatch ? 2 : (countMatch ? 1 : 0);
      return {
        observed,
        expected: 1,
        variance: 0.4,
        level: 2
      };
    }

    if (difficultyLevel === "3") {
      const countWeight = getLevelThreeCountWeight(sentConeCount);
      const arrangementBonus = exactMatch ? 1 : 0;
      const observed = countMatch ? countWeight + arrangementBonus : 0;

      if (sentConeCount === 1) {
        return {
          observed,
          expected: 2 / 9,
          variance: 32 / 81,
          level: 3
        };
      }

      if (sentConeCount === 2 || sentConeCount === 3) {
        return {
          observed,
          expected: 7 / 9,
          variance: 68 / 81,
          level: 3
        };
      }
    }

    return {
      observed: Number.NaN,
      expected: Number.NaN,
      variance: Number.NaN,
      level: 0
    };
  }

  function getReportScore(record) {
    const model = getTrialScoreModel(record);
    return formatScoreValue(model.observed);
  }

  function getReportResponseLabel(record) {
    const difficultyLevel = String(record?.["difficulty level"] ?? "").trim();
    const rawValue = String(record?.["rx choice1"] ?? "").trim();
    if (!rawValue) {
      return "none";
    }
    if (difficultyLevel === "1") {
      return getLevelOneChoiceLabel(rawValue);
    }
    return null;
  }

  function getReportSummaryStats(records) {
    return records.reduce((summary, record) => {
      const model = getTrialScoreModel(record);
      if (!Number.isFinite(model.observed) || !Number.isFinite(model.expected) || !Number.isFinite(model.variance)) {
        return summary;
      }

      summary.totalTrials += 1;
      summary.chanceScore += model.expected;
      summary.yourScore += model.observed;
      summary.totalVariance += model.variance;
      return summary;
    }, {
      totalTrials: 0,
      chanceScore: 0,
      yourScore: 0,
      totalVariance: 0
    });
  }

  function getTelepathicSignificancePValue(summaryStats) {
    if (!summaryStats || summaryStats.totalTrials < 1 || summaryStats.totalVariance <= 0) {
      return Number.NaN;
    }
    const zScore = (summaryStats.yourScore - summaryStats.chanceScore) / Math.sqrt(summaryStats.totalVariance);
    return 1 - normalCdf(zScore);
  }

  function getLevelOneReportScore(record) {
    const difficultyLevel = String(record?.["difficulty level"] ?? "").trim();
    if (difficultyLevel !== "1") {
      return "";
    }

    return getReportScore(record);
  }

  function buildVisualizationSeries(records) {
    const series = [];
    let cumulativeExcess = 0;
    let cumulativeVariance = 0;

    records.forEach((record) => {
      const model = getTrialScoreModel(record);
      if (!Number.isFinite(model.observed) || !Number.isFinite(model.expected) || !Number.isFinite(model.variance)) {
        return;
      }

      const excess = model.observed - model.expected;
      cumulativeExcess += excess;
      cumulativeVariance += model.variance;
      const sigma = Math.sqrt(cumulativeVariance);

      series.push({
        trialNumber: series.length + 1,
        level: model.level,
        observed: model.observed,
        excess,
        cumulativeExcess,
        upperBand: 1.96 * sigma,
        lowerBand: -1.96 * sigma,
        scoreLabel: formatScoreValue(model.observed)
      });
    });

    return series;
  }

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    return element;
  }

  function getVisualizationLevelColor(level) {
    if (level === 1) {
      return "#ffd166";
    }
    if (level === 2) {
      return "#66d9ef";
    }
    if (level === 3) {
      return "#ff8c69";
    }
    return "#f6f3ef";
  }

  function getLevelOneChoiceLabel(value) {
    const layoutNumber = Number(String(value ?? "").trim());
    if (layoutNumber === 1) {
      return "One";
    }
    if (Number.isInteger(layoutNumber) && layoutNumber > 1) {
      return "Many";
    }
    return String(value ?? "");
  }

  function renderReportTable(records) {
    if (!reportTable || !reportTableWrap) {
      return;
    }

    reportTable.replaceChildren();

    if (!records.length) {
      reportTableWrap.hidden = true;
      return;
    }

    const headers = [
      "local date",
      "local time",
      "sent layout",
      "rx choice1",
      "score",
      "confidence",
      "difficulty level",
      "dist",
      "rx done rt"
    ];
    const headingMap = {
      "local date": "Local date",
      "local time": "Local time",
      "sent layout": "Sent",
      "rx choice1": "Response",
      "score": "Score",
      "confidence": "Conf",
      "difficulty level": "Level",
      "dist": "Distance",
      "rx done rt": "Time"
    };
    const colgroup = document.createElement("colgroup");
    [
      "92px",
      "108px",
      "90px",
      "90px",
      "58px",
      "54px",
      "66px",
      "94px",
      "58px"
    ].forEach((width) => {
      const col = document.createElement("col");
      col.style.width = width;
      colgroup.appendChild(col);
    });
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = headingMap[header] || header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    const summaryStats = getReportSummaryStats(records);
    records.forEach((record) => {
      const row = document.createElement("tr");
      const receiverLocation = parseLocationValue(record?.["rx location"] ?? "");
      const senderLocation = parseLocationValue(record?.["tx location"] ?? "");
      const scoreValue = getReportScore(record);
      const distanceMeters =
        receiverLocation && senderLocation
          ? haversineDistanceMeters(senderLocation, receiverLocation)
          : NaN;
      headers.forEach((header) => {
        const td = document.createElement("td");
        if (header === "dist") {
          const content = document.createElement("div");
          content.className = "report-cell-clamp";
          content.textContent =
            receiverLocation && senderLocation
              ? formatDistanceWithUnit(distanceMeters, distanceMeters >= 1609.344 ? "miles" : "meters")
              : "unknown";
          td.appendChild(content);
        } else if (header === "rx done rt") {
          td.textContent = formatReactionTimeTenths(record?.[header] ?? "");
        } else if (header === "score") {
          td.textContent = scoreValue;
        } else if (header === "rx choice1") {
          const responseLabel = getReportResponseLabel(record);
          if (responseLabel !== null) {
            td.textContent = responseLabel;
          } else {
            td.classList.add("report-layout-cell");
            td.appendChild(createReportLayoutThumbnailCell(record?.[header] ?? ""));
          }
        } else if (header === "sent layout") {
          td.classList.add("report-layout-cell");
          td.appendChild(createReportLayoutThumbnailCell(record?.[header] ?? ""));
        } else {
          td.textContent = String(record?.[header] ?? "");
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });

    const tfoot = document.createElement("tfoot");
    const summaryRow = document.createElement("tr");
    const summaryCell = document.createElement("td");
    summaryCell.colSpan = headers.length;
    summaryCell.className = "report-table-summary-cell";
    const telepathicSignificance = getTelepathicSignificancePValue(summaryStats);
    summaryCell.textContent =
      `Summary: Total trials = ${summaryStats.totalTrials}, Chance score = ${formatScoreValue(summaryStats.chanceScore)}, Your score = ${formatScoreValue(summaryStats.yourScore)}, Telepathic significance, P = ${formatProbabilityValue(telepathicSignificance)}.`;
    summaryRow.appendChild(summaryCell);
    tfoot.appendChild(summaryRow);

    reportTable.append(colgroup, thead, tbody, tfoot);
    reportTableWrap.hidden = false;
  }

  function renderVisualizationSummary(pairInfo, records, series) {
    if (!visualizationSummary || !visualizationStatus) {
      return;
    }

    visualizationSummary.replaceChildren();

    const firstLine = document.createElement("p");
    firstLine.className = "report-summary-line";
    firstLine.textContent = `Receiver-sender pair: ${pairInfo.receiverName || "unknown"} - ${pairInfo.senderName || "unknown"}.`;
    visualizationSummary.append(firstLine);

    const levelCounts = new Map([[1, 0], [2, 0], [3, 0]]);
    series.forEach((point) => {
      levelCounts.set(point.level, (levelCounts.get(point.level) || 0) + 1);
    });
    const latest = series.at(-1);
    visualizationStatus.textContent = latest
      ? `${records.length} trial record${records.length === 1 ? "" : "s"} found. Current cumulative excess over chance = ${latest.cumulativeExcess.toFixed(2)}. Level 1: ${levelCounts.get(1)}, Level 2: ${levelCounts.get(2)}, Level 3: ${levelCounts.get(3)}.`
      : "No scoreable trials are available for visualization.";
  }

  function renderVisualizationChart(series) {
    if (!visualizationChart || !visualizationChartWrap) {
      return;
    }

    visualizationChart.replaceChildren();

    if (!series.length) {
      visualizationChartWrap.hidden = true;
      return;
    }

    const width = 900;
    const height = 520;
    const margin = { top: 30, right: 34, bottom: 54, left: 74 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxX = Math.max(series.length, 1);
    const allYValues = [0];
    series.forEach((point) => {
      allYValues.push(point.cumulativeExcess, point.upperBand, point.lowerBand);
    });
    const yMinRaw = Math.min(...allYValues);
    const yMaxRaw = Math.max(...allYValues);
    const yPadding = Math.max(1, (yMaxRaw - yMinRaw) * 0.08);
    const yMin = yMinRaw - yPadding;
    const yMax = yMaxRaw + yPadding;
    const xToPx = (value) => margin.left + ((value - 1) / Math.max(maxX - 1, 1)) * plotWidth;
    const yToPx = (value) => margin.top + ((yMax - value) / Math.max(yMax - yMin, 0.0001)) * plotHeight;

    const bandPathParts = [];
    series.forEach((point, index) => {
      const x = xToPx(point.trialNumber);
      const y = yToPx(point.upperBand);
      bandPathParts.push(`${index === 0 ? "M" : "L"} ${x} ${y}`);
    });
    for (let index = series.length - 1; index >= 0; index -= 1) {
      const point = series[index];
      bandPathParts.push(`L ${xToPx(point.trialNumber)} ${yToPx(point.lowerBand)}`);
    }
    bandPathParts.push("Z");
    visualizationChart.appendChild(createSvgElement("path", {
      d: bandPathParts.join(" "),
      fill: "rgba(255,255,255,0.12)",
      stroke: "none"
    }));

    const yTicks = 5;
    for (let tick = 0; tick <= yTicks; tick += 1) {
      const value = yMin + ((yMax - yMin) * tick) / yTicks;
      const y = yToPx(value);
      visualizationChart.appendChild(createSvgElement("line", {
        x1: margin.left,
        y1: y,
        x2: width - margin.right,
        y2: y,
        stroke: "rgba(255,255,255,0.08)",
        "stroke-width": 1
      }));
      const label = createSvgElement("text", {
        x: margin.left - 12,
        y: y + 4,
        fill: "rgba(255,255,255,0.72)",
        "font-size": 12,
        "text-anchor": "end"
      });
      label.textContent = value.toFixed(1);
      visualizationChart.appendChild(label);
    }

    const xTickValues = (() => {
      if (series.length <= 12) {
        return Array.from({ length: series.length }, (_, index) => index + 1);
      }

      const targetCount = 10;
      const values = new Set([1, series.length]);
      for (let tick = 1; tick < targetCount - 1; tick += 1) {
        values.add(Math.round(1 + (tick * (series.length - 1)) / (targetCount - 1)));
      }
      return [...values].sort((left, right) => left - right);
    })();

    xTickValues.forEach((trialValue) => {
      const x = xToPx(trialValue);
      visualizationChart.appendChild(createSvgElement("line", {
        x1: x,
        y1: margin.top,
        x2: x,
        y2: height - margin.bottom,
        stroke: "rgba(255,255,255,0.08)",
        "stroke-width": 1
      }));
      const label = createSvgElement("text", {
        x,
        y: height - margin.bottom + 24,
        fill: "rgba(255,255,255,0.72)",
        "font-size": 12,
        "text-anchor": "middle"
      });
      label.textContent = String(trialValue);
      visualizationChart.appendChild(label);
    });

    visualizationChart.appendChild(createSvgElement("line", {
      x1: margin.left,
      y1: yToPx(0),
      x2: width - margin.right,
      y2: yToPx(0),
      stroke: "rgba(255,255,255,0.42)",
      "stroke-width": 1.5
    }));

    for (let index = 1; index < series.length; index += 1) {
      const previous = series[index - 1];
      const current = series[index];
      visualizationChart.appendChild(createSvgElement("line", {
        x1: xToPx(previous.trialNumber),
        y1: yToPx(previous.cumulativeExcess),
        x2: xToPx(current.trialNumber),
        y2: yToPx(current.cumulativeExcess),
        stroke: getVisualizationLevelColor(current.level),
        "stroke-width": 3,
        "stroke-linecap": "round"
      }));
    }

    series.forEach((point) => {
      const circle = createSvgElement("circle", {
        cx: xToPx(point.trialNumber),
        cy: yToPx(point.cumulativeExcess),
        r: 4.5,
        fill: getVisualizationLevelColor(point.level),
        stroke: "rgba(5,5,5,0.85)",
        "stroke-width": 1.5
      });
      const title = createSvgElement("title");
      title.textContent = `Trial ${point.trialNumber} | Level ${point.level} | Score ${point.scoreLabel} | Excess ${point.excess.toFixed(2)} | Cumulative ${point.cumulativeExcess.toFixed(2)}`;
      circle.appendChild(title);
      visualizationChart.appendChild(circle);
    });

    visualizationChart.appendChild(createSvgElement("rect", {
      x: margin.left,
      y: margin.top,
      width: plotWidth,
      height: plotHeight,
      fill: "none",
      stroke: "rgba(255,255,255,0.18)",
      "stroke-width": 1.2
    }));

    const xLabel = createSvgElement("text", {
      x: margin.left + plotWidth / 2,
      y: height - 10,
      fill: "rgba(255,255,255,0.82)",
      "font-size": 13,
      "text-anchor": "middle"
    });
    xLabel.textContent = "Trial number";
    visualizationChart.appendChild(xLabel);

    const yLabel = createSvgElement("text", {
      x: 18,
      y: margin.top + plotHeight / 2,
      fill: "rgba(255,255,255,0.82)",
      "font-size": 13,
      transform: `rotate(-90 18 ${margin.top + plotHeight / 2})`,
      "text-anchor": "middle"
    });
    yLabel.textContent = "Cumulative excess over chance";
    visualizationChart.appendChild(yLabel);

    visualizationChartWrap.hidden = false;
  }

  function beginReportResize(event) {
    if (!reportPanel) {
      return;
    }
    const mode = String(event.currentTarget?.dataset?.reportResize || "");
    const rect = reportPanel.getBoundingClientRect();
    activeReportResize = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", continueReportResize);
    window.addEventListener("pointerup", endReportResize);
    window.addEventListener("pointercancel", endReportResize);
  }

  function continueReportResize(event) {
    if (!activeReportResize || !reportPanel) {
      return;
    }
    const deltaX = event.clientX - activeReportResize.startX;
    const deltaY = event.clientY - activeReportResize.startY;
    if (activeReportResize.mode === "east" || activeReportResize.mode === "corner") {
      const nextWidth = Math.max(960, activeReportResize.startWidth + deltaX);
      reportPanel.style.width = `${nextWidth}px`;
    }
    if (activeReportResize.mode === "south" || activeReportResize.mode === "corner") {
      const nextHeight = Math.max(560, activeReportResize.startHeight + deltaY);
      reportPanel.style.height = `${nextHeight}px`;
    }
  }

  function endReportResize() {
    activeReportResize = null;
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", continueReportResize);
    window.removeEventListener("pointerup", endReportResize);
    window.removeEventListener("pointercancel", endReportResize);
  }

  function setReportPanelOffset(offsetX = 0) {
    if (!beginnerPanel) {
      return;
    }
    beginnerPanel.style.transform = offsetX ? `translateX(${offsetX}px)` : "";
  }

  function clearReportPanelOffset() {
    if (!beginnerPanel) {
      return;
    }
    beginnerPanel.classList.remove("report-pannable", "is-report-panning");
    beginnerPanel.style.transform = "";
  }

  function beginReportViewPan(event) {
    if (!beginnerPanel || !reportPanel || activeReportResize) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest("button, a")) {
      return;
    }
    const panelStyle = window.getComputedStyle(beginnerPanel);
    const matrix = new DOMMatrixReadOnly(panelStyle.transform === "none" ? undefined : panelStyle.transform);
    const currentOffset = matrix.m41 || 0;
    const cardRect = reportPanel.getBoundingClientRect();
    const viewRect = reportView?.getBoundingClientRect();
    const viewportPadding = 20;
    const visibleLeft = viewRect ? Math.max(viewRect.left, viewportPadding) : viewportPadding;
    const visibleRight = viewRect ? Math.min(viewRect.right, window.innerWidth - viewportPadding) : (window.innerWidth - viewportPadding);
    const overflowRight = Math.max(cardRect.right - visibleRight, 0);
    const overflowLeft = Math.max(visibleLeft - cardRect.left, 0);
    activeReportViewPan = {
      startX: event.clientX,
      startOffset: currentOffset,
      minOffset: currentOffset - overflowRight,
      maxOffset: currentOffset + overflowLeft
    };
    beginnerPanel.classList.add("report-pannable", "is-report-panning");
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", continueReportViewPan);
    window.addEventListener("pointerup", endReportViewPan);
    window.addEventListener("pointercancel", endReportViewPan);
  }

  function continueReportViewPan(event) {
    if (!activeReportViewPan) {
      return;
    }
    const deltaX = event.clientX - activeReportViewPan.startX;
    const nextOffset = Math.min(
      activeReportViewPan.maxOffset,
      Math.max(activeReportViewPan.minOffset, activeReportViewPan.startOffset + deltaX)
    );
    setReportPanelOffset(nextOffset);
  }

  function endReportViewPan() {
    activeReportViewPan = null;
    beginnerPanel?.classList.remove("is-report-panning");
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", continueReportViewPan);
    window.removeEventListener("pointerup", endReportViewPan);
    window.removeEventListener("pointercancel", endReportViewPan);
  }

  async function renderPerformanceReport(pairInfo = selectedReportPair) {
    let csvResult = {
      available: false,
      message: "",
      records: []
    };
    try {
      csvResult = await fetchSelectedPairReportCsvData(pairInfo);
    } catch (error) {
      csvResult = {
        available: false,
        message: "Unable to load the server trial history right now.",
        records: []
      };
    }

    if (!reportSummary || !reportStatus) {
      return;
    }

    if (!pairInfo?.sessionCode) {
      reportSummary.replaceChildren();
      reportStatus.textContent = "Choose a receiver-sender pair in Report Definition first, then open this report again.";
      if (reportTableWrap) {
        reportTableWrap.hidden = true;
      }
      if (reportTable) {
        reportTable.replaceChildren();
      }
      return;
    }

    const records = getRecordsForReportPair(csvResult.records || [], pairInfo);

    if (!records.length) {
      reportSummary.replaceChildren();
      const line = document.createElement("p");
      line.className = "report-summary-line";
      line.textContent = `Receiver-sender pair: ${pairInfo.receiverName || "unknown"} - ${pairInfo.senderName || "unknown"} First trial: Local unknown`;
      reportSummary.append(line);
      reportStatus.textContent = csvResult.available
        ? "No trial records found for the current receiver-sender selection."
        : (csvResult.message || "No server-side trial history is available right now.");
      if (reportTableWrap) {
        reportTableWrap.hidden = true;
      }
      if (reportTable) {
        reportTable.replaceChildren();
      }
      return;
    }

    renderReportSummary(pairInfo, records);
    renderReportTable(records);
  }

  async function renderPerformanceVisualization(pairInfo = selectedReportPair) {
    let csvResult = {
      available: false,
      message: "",
      records: []
    };
    try {
      csvResult = await fetchSelectedPairReportCsvData(pairInfo);
    } catch (error) {
      csvResult = {
        available: false,
        message: "Unable to load the server trial history right now.",
        records: []
      };
    }

    if (!visualizationSummary || !visualizationStatus || !visualizationChartWrap || !visualizationChart) {
      return;
    }

    if (!pairInfo?.sessionCode) {
      visualizationSummary.replaceChildren();
      visualizationStatus.textContent = "Choose a receiver-sender pair in Performance Report first, then open the visualization again.";
      visualizationChart.replaceChildren();
      visualizationChartWrap.hidden = true;
      return;
    }

    const records = getRecordsForReportPair(csvResult.records || [], pairInfo);
    const series = buildVisualizationSeries(records);

    if (!records.length) {
      visualizationSummary.replaceChildren();
      visualizationStatus.textContent = csvResult.available
        ? "No trial records found for the current receiver-sender selection."
        : (csvResult.message || "No server-side trial history is available right now.");
      visualizationChart.replaceChildren();
      visualizationChartWrap.hidden = true;
      return;
    }

    renderVisualizationSummary(pairInfo, records, series);
    renderVisualizationChart(series);
  }

  async function refreshDifficultyLabels() {
    const token = ++difficultyLabelToken;
    const fallbackLevel = "1";
    const contexts = ["sender", "receiver"].map((role) => ({
      role,
      context: getPairContextForRole(role)
    }));
    const cache = new Map();

    for (const { role, context } of contexts) {
      if (!context) {
        setRoleDifficultyLabel(role, fallbackLevel);
        continue;
      }

        if (!cache.has(context.sessionCode)) {
          try {
            const data = await fetchPairDifficulty(context.sessionCode);
            if (token !== difficultyLabelToken) {
              return;
            }
            cache.set(context.sessionCode, normalizeDifficultyLevel(data?.pair_difficulty));
          } catch (error) {
            cache.set(context.sessionCode, "1");
          }
        }

      if (token !== difficultyLabelToken) {
        return;
      }
      setRoleDifficultyLabel(role, cache.get(context.sessionCode) || fallbackLevel);
    }
  }

  async function fetchPairDifficulty(sessionCode, requestedLevel = null) {
    const payload = {
      action: requestedLevel === null ? "get_pair_difficulty" : "set_pair_difficulty",
      session_code: sessionCode
    };

    if (requestedLevel !== null) {
      payload.difficulty_level = normalizeDifficultyLevel(requestedLevel);
    }

    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Difficulty request failed with status ${response.status}`);
    }

    return response.json();
  }

  function buildTargetUrl(role, ownName, exactPartnerName) {
    const target = role === "sender" ? "sender.html" : "receiver.html";
    const params = new URLSearchParams();
    params.set("prefill", "1");
    params.set("own_email", ownName);
    params.set("partner_email", exactPartnerName);
    const state = readLauncherState();
    const deviceLocation = state?.deviceLocation;
    if (
      deviceLocation &&
      Number.isFinite(Number(deviceLocation.latitude)) &&
      Number.isFinite(Number(deviceLocation.longitude))
    ) {
      params.set("loc_latitude", String(deviceLocation.latitude));
      params.set("loc_longitude", String(deviceLocation.longitude));
      if (Number.isFinite(Number(deviceLocation.accuracy))) {
        params.set("loc_accuracy", String(deviceLocation.accuracy));
      }
      if (Number.isFinite(Number(deviceLocation.timestamp))) {
        params.set("loc_timestamp", String(deviceLocation.timestamp));
      }
    }
    return `${target}?${params.toString()}`;
  }

  function shouldRequestLocation(state = readLauncherState()) {
    if (!navigator.geolocation || locationRequestInFlight) {
      return false;
    }

    if (state.locationPermission === "denied") {
      return false;
    }

    const timestamp = Number(state?.deviceLocation?.timestamp || 0);
    if (!timestamp) {
      return true;
    }

    const ageMs = Date.now() - timestamp;
    return ageMs > 6 * 60 * 60 * 1000;
  }

  function getLocationPresentation(state = readLauncherState()) {
    if (locationRequestInFlight) {
      return {
        text: "Device location: checking...",
        showRetry: false
      };
    }

    if (state?.deviceLocation?.latitude && state?.deviceLocation?.longitude) {
      const accuracy = Math.round(Number(state.deviceLocation.accuracy || 0));
      let precision = "coarse";
      if (accuracy > 0 && accuracy < 30) {
        precision = "high";
      } else if (accuracy >= 30 && accuracy <= 150) {
        precision = "medium";
      }

      return {
        text: `Device location: confirmed | Accuracy: about ${accuracy || "?"} meters | Precision: ${precision}`,
        showRetry: false
      };
    }

    if (state.locationPermission === "denied") {
      return {
        text: "Device location: permission denied. Enable location in device/browser settings, then retry.",
        showRetry: true
      };
    }

    if (state.locationPermission === "error" && lastLocationAttemptAt) {
      return {
        text: "Device location: unavailable right now. Please try again.",
        showRetry: true
      };
    }

    return {
      text: "Device location: unknown",
      showRetry: true
    };
  }

  function renderLocationStatus() {
    const state = readLauncherState();
    const presentation = getLocationPresentation(state);

    locationStatusBlocks.forEach((block) => {
      const textNode = block.querySelector(".role-location-text");
      const retryButton = block.querySelector(".role-location-retry");
      if (textNode) {
        textNode.textContent = presentation.text;
      }
      if (retryButton) {
        retryButton.hidden = !presentation.showRetry;
        retryButton.disabled = locationRequestInFlight;
      }
    });
  }

  function requestDeviceLocationIfNeeded(force = false) {
    const state = readLauncherState();
    if (!force && !shouldRequestLocation(state)) {
      return;
    }

    lastLocationAttemptAt = Date.now();
    locationRequestInFlight = true;
    renderLocationStatus();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latest = readLauncherState();
        latest.deviceLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        latest.locationPermission = "granted";
        writeLauncherState(latest);
        locationRequestInFlight = false;
        renderLocationStatus();
      },
      (error) => {
        const latest = readLauncherState();
        latest.locationPermission = error?.code === 1 ? "denied" : "error";
        writeLauncherState(latest);
        locationRequestInFlight = false;
        renderLocationStatus();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 12000
      }
    );
  }

  function getPartnerHistory(role, state = readLauncherState(), ownIdentifier = "") {
    const roleSettings = readRoleSettings(role);
    const resolvedOwnIdentifier =
      String(ownIdentifier || "").trim() ||
      String(state.ownNames?.[role] || "").trim() ||
      roleSettings.ownName;
    const profileState = readLauncherProfileState(role, resolvedOwnIdentifier, state);
    const deleted = new Set(profileState.deletedPartners.map((name) => normalizeIdentifierForStorage(name)));
    return uniqueNames([
      ...profileState.partnerHistory,
      profileState.currentPartner || "",
      roleSettings.partnerName || ""
    ]).filter((name) => !deleted.has(normalizeIdentifierForStorage(name)));
  }

  function applyPartnerHistory(role, form, state = readLauncherState(), ownIdentifier = "") {
    const select = form.querySelector('select[name="partnerHistory"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const manageButton = form.querySelector('button[name="managePartnerNames"]');
    const emptyOptionLabel = role === "sender" ? "Select receiver email" : "Select sender email";
    const history = getPartnerHistory(role, state, ownIdentifier);

    if (!select || !partnerInput) {
      return history;
    }

    select.innerHTML = `<option value="">${emptyOptionLabel}</option>`;
    history.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    select.hidden = history.length === 0;
    if (manageButton) {
      manageButton.hidden = history.length === 0;
    }
    select.value = "";

    return history;
  }

  function closeNameManager() {
    if (!activeNameManagerOverlay) {
      return;
    }

    activeNameManagerOverlay.remove();
    activeNameManagerOverlay = null;
  }

  async function persistLauncherProfileForForm(role, form, overrideState = null) {
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const ownIdentifier = String(ownInput?.value || "").trim();
    if (!ownIdentifier) {
      return;
    }

    const sourceState = overrideState || readLauncherState();
    const profileState = readLauncherProfileState(role, ownIdentifier, sourceState);
    const currentPartner = String(partnerInput?.value || profileState.currentPartner || "").trim();
    const storedProfile = await saveLauncherProfile(role, ownIdentifier, {
      currentPartner,
      partnerHistory: uniqueNames([
        ...profileState.partnerHistory,
        currentPartner
      ]),
      deletedPartners: profileState.deletedPartners
    });

    if (storedProfile) {
      writeLauncherProfileState(role, ownIdentifier, {
        currentPartner: storedProfile.current_partner || currentPartner,
        partnerHistory: Array.isArray(storedProfile.partner_history) ? storedProfile.partner_history : profileState.partnerHistory,
        deletedPartners: Array.isArray(storedProfile.deleted_partners) ? storedProfile.deleted_partners : profileState.deletedPartners
      });
    }
  }

  async function hydrateLauncherProfileForForm(role, form) {
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const ownIdentifier = String(ownInput?.value || "").trim();
    if (!ownIdentifier) {
      applyPartnerHistory(role, form, readLauncherState(), "");
      return;
    }

    const requestedIdentifier = ownIdentifier;
    const fetchedProfile = await fetchLauncherProfile(role, requestedIdentifier);
    if (String(ownInput?.value || "").trim() !== requestedIdentifier) {
      return;
    }

    const latest = writeLauncherProfileState(role, requestedIdentifier, {
      currentPartner: String(fetchedProfile?.current_partner || "").trim(),
      partnerHistory: Array.isArray(fetchedProfile?.partner_history) ? fetchedProfile.partner_history : [],
      deletedPartners: Array.isArray(fetchedProfile?.deleted_partners) ? fetchedProfile.deleted_partners : []
    });
    const profileState = readLauncherProfileState(role, requestedIdentifier, latest);
    if (!String(partnerInput?.value || "").trim() && profileState.currentPartner) {
      partnerInput.value = profileState.currentPartner;
    }
    applyPartnerHistory(role, form, latest, requestedIdentifier);
    void refreshDifficultyLabels();
  }

  function saveManagedName(role, originalName, updatedName, isAddMode, form) {
    const cleaned = String(updatedName || "").trim();
    if (!cleaned) {
      return false;
    }

    const latest = readLauncherState();
    const ownIdentifier = String(form.querySelector('input[name="ownName"]')?.value || "").trim();
    const profileState = readLauncherProfileState(role, ownIdentifier, latest);
    const history = getPartnerHistory(role, latest, ownIdentifier).filter((name) => name !== originalName);
    const partnerInput = form.querySelector('input[name="partnerName"]');
    if (isAddMode || (partnerInput && partnerInput.value.trim() === originalName)) {
      partnerInput.value = cleaned;
    }
    const nextState = writeLauncherProfileState(role, ownIdentifier, {
      currentPartner: String(partnerInput?.value || profileState.currentPartner || "").trim(),
      partnerHistory: uniqueNames([...history, cleaned]),
      deletedPartners: profileState.deletedPartners.filter((name) => normalizeIdentifierForStorage(name) !== normalizeIdentifierForStorage(cleaned))
    });
    applyPartnerHistory(role, form, nextState, ownIdentifier);
    void persistLauncherProfileForForm(role, form, nextState);
    return true;
  }

  function deleteManagedName(role, nameToDelete, form) {
    const latest = readLauncherState();
    const ownIdentifier = String(form.querySelector('input[name="ownName"]')?.value || "").trim();
    const profileState = readLauncherProfileState(role, ownIdentifier, latest);
    const history = getPartnerHistory(role, latest, ownIdentifier).filter((name) => name !== nameToDelete);
    const partnerInput = form.querySelector('input[name="partnerName"]');
    if (partnerInput && partnerInput.value.trim() === nameToDelete) {
      partnerInput.value = "";
    }
    const nextState = writeLauncherProfileState(role, ownIdentifier, {
      currentPartner: String(partnerInput?.value || "").trim(),
      partnerHistory: history,
      deletedPartners: uniqueNames([...profileState.deletedPartners, nameToDelete])
    });
    applyPartnerHistory(role, form, nextState, ownIdentifier);
    void persistLauncherProfileForForm(role, form, nextState);
  }

  function openNameEditor(role, form, options) {
    const isAddMode = !!options.isAddMode;
    const originalName = options.name || "";
    const panel = activeNameManagerOverlay?.querySelector(".name-manager-panel");

    if (!panel) {
      return;
    }

    panel.innerHTML = `
      <h2 class="name-manager-title">${isAddMode ? "Add email" : "Edit email"}</h2>
      <div class="name-manager-editor">
        <input
          class="name-manager-input"
          type="text"
          value="${escapeHtml(originalName)}"
          readonly
        >
        <div class="name-manager-actions">
          <button class="name-manager-action" type="button" data-delete-item>Delete item</button>
          <button class="name-manager-action" type="button" data-edit-item>Edit item</button>
          <button class="name-manager-action" type="button" data-cancel-item>Cancel</button>
        </div>
      </div>
    `;

    const input = panel.querySelector(".name-manager-input");
    const deleteButton = panel.querySelector("[data-delete-item]");
    const editButton = panel.querySelector("[data-edit-item]");
    const cancelButton = panel.querySelector("[data-cancel-item]");
    let editing = false;

    if (isAddMode) {
      deleteButton.disabled = true;
      deleteButton.style.opacity = "0.45";
      window.setTimeout(() => {
        beginEditing();
      }, 0);
    }

    function beginEditing() {
      editing = true;
      input.readOnly = false;
      editButton.textContent = "Save item";
      window.setTimeout(() => {
        input.focus();
        input.setSelectionRange(0, 0);
      }, 0);
    }

    function saveCurrent() {
      const saved = saveManagedName(role, originalName, input.value, isAddMode, form);
      if (saved) {
        closeNameManager();
      } else {
        input.focus();
      }
    }

    deleteButton?.addEventListener("click", () => {
      if (isAddMode) {
        return;
      }
      deleteManagedName(role, originalName, form);
      closeNameManager();
    });

    editButton?.addEventListener("click", () => {
      if (!editing) {
        beginEditing();
        return;
      }
      saveCurrent();
    });

    cancelButton?.addEventListener("click", closeNameManager);

    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && editing) {
        event.preventDefault();
        saveCurrent();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeNameManager();
      }
    });
  }

  function openNameManager(role, form) {
    closeNameManager();

    const partnerTypeLabel = role === "sender" ? "receiver emails" : "sender emails";
    const ownIdentifier = String(form.querySelector('input[name="ownName"]')?.value || "").trim();
    const history = getPartnerHistory(role, readLauncherState(), ownIdentifier);
    const overlay = document.createElement("div");
    overlay.className = "name-manager-overlay";
    overlay.innerHTML = `
      <div class="name-manager-panel" role="dialog" aria-modal="true" aria-labelledby="nameManagerTitle">
        <h2 class="name-manager-title" id="nameManagerTitle">Manage ${partnerTypeLabel}</h2>
        <p class="name-manager-copy">Click on a list item to edit it.</p>
        <ul class="name-manager-list">
          ${history.map((name, index) => `
            <li>
              <button class="name-manager-item-button" type="button" data-name-index="${index}">${escapeHtml(name)}</button>
            </li>
          `).join("")}
          <li>
            <button class="name-manager-item-button name-manager-item-add" type="button" data-add-name>Add an email.</button>
          </li>
        </ul>
      </div>
    `;

    document.body.appendChild(overlay);
    activeNameManagerOverlay = overlay;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeNameManager();
      }
    });

    overlay.querySelectorAll("[data-name-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-name-index"));
        openNameEditor(role, form, {
          name: history[index] || "",
          isAddMode: false
        });
      });
    });

    overlay.querySelector("[data-add-name]")?.addEventListener("click", () => {
      openNameEditor(role, form, {
        name: "",
        isAddMode: true
      });
    });
  }

  function populateCard(card) {
    const role = card.dataset.roleCard;
    const state = readLauncherState();
    const form = card.querySelector("[data-role-form]");
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const select = form.querySelector('select[name="partnerHistory"]');
    const manageButton = form.querySelector('button[name="managePartnerNames"]');
    const roleSettings = readRoleSettings(role);
    const savedOwn = String(state.ownNames?.[role] || "").trim() || roleSettings.ownName || "";
    const profileState = readLauncherProfileState(role, savedOwn, state);
    const savedPartner = profileState.currentPartner || String(state.currentPartners?.[role] || "").trim() || roleSettings.partnerName || "";

    ownInput.value = savedOwn;
    partnerInput.value = savedPartner;
    applyPartnerHistory(role, form, state, savedOwn);

    select.addEventListener("change", () => {
      if (select.value) {
        partnerInput.value = select.value;
        window.setTimeout(() => {
          select.value = "";
        }, 0);
        void persistLauncherProfileForForm(role, form);
        void refreshDifficultyLabels();
      }
    });

    manageButton?.addEventListener("click", () => {
      openNameManager(role, form);
    });

    ownInput.addEventListener("input", () => {
      setRoleDifficultyLabel(role, "1");
      applyPartnerHistory(role, form, readLauncherState(), ownInput.value.trim());
    });
    ownInput.addEventListener("change", () => {
      void hydrateLauncherProfileForForm(role, form);
    });
    ownInput.addEventListener("blur", () => {
      void hydrateLauncherProfileForForm(role, form);
    });

    partnerInput.addEventListener("input", () => {
      setRoleDifficultyLabel(role, "1");
    });
    partnerInput.addEventListener("change", () => {
      void persistLauncherProfileForForm(role, form);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const ownName = ownInput.value.trim();
      const exactPartnerName = partnerInput.value.trim();

      if (!ownName || !exactPartnerName) {
        if (!ownName) {
          ownInput.focus();
        } else {
          partnerInput.focus();
        }
        return;
      }

      const latest = readLauncherState();
      latest.ownNames = latest.ownNames || {};
      latest.ownNames[role] = ownName;
      const existingProfile = readLauncherProfileState(role, ownName, latest);
      const nextState = writeLauncherProfileState(role, ownName, {
        currentPartner: exactPartnerName,
        partnerHistory: uniqueNames([...existingProfile.partnerHistory, exactPartnerName]),
        deletedPartners: existingProfile.deletedPartners.filter((name) => normalizeIdentifierForStorage(name) !== normalizeIdentifierForStorage(exactPartnerName))
      });
      try {
        await persistLauncherProfileForForm(role, form, nextState);
      } catch (error) {
        // Keep local progress even if the server save momentarily fails.
      }

      window.location.href = buildTargetUrl(role, ownName, exactPartnerName);
    });

    if (savedOwn) {
      void hydrateLauncherProfileForForm(role, form);
    }
  }

  function activateCard(card) {
    const shouldActivate = !card.classList.contains("active");

    roleCards.forEach((item) => {
      item.classList.remove("active");
      item.classList.remove("role-card-hidden");
      const header = item.querySelector(".role-card-header");
      if (header) {
        header.setAttribute("aria-expanded", "false");
      }
    });

    if (shouldActivate) {
      requestDeviceLocationIfNeeded();
      card.classList.add("active");
      void refreshDifficultyLabels();
      const header = card.querySelector(".role-card-header");
      if (header) {
        header.setAttribute("aria-expanded", "true");
      }

      roleCards.forEach((item) => {
        if (item !== card) {
          item.classList.add("role-card-hidden");
        }
      });

      rolePanels?.classList.add("role-panels-single");
      window.setTimeout(() => {
        card.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
      }, 40);
      return;
    }

    rolePanels?.classList.remove("role-panels-single");
  }

  function collapseActiveLauncherCard() {
    let changed = false;
    roleCards.forEach((item) => {
      if (item.classList.contains("active") || item.classList.contains("role-card-hidden")) {
        changed = true;
      }
      item.classList.remove("active");
      item.classList.remove("role-card-hidden");
      const header = item.querySelector(".role-card-header");
      if (header) {
        header.setAttribute("aria-expanded", "false");
      }
    });
    if (changed) {
      rolePanels?.classList.remove("role-panels-single");
    }
  }

  function showLauncherView() {
    clearReportPanelOffset();
    launcherView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
  }

  function showOptionsView() {
    clearReportPanelOffset();
    optionsView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showReportDefinitionView() {
    clearReportPanelOffset();
    syncCurrentLauncherNamesToState();
    reportDefinitionView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    void renderReportDefinition();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showReportView(pairInfo = selectedReportPair) {
    beginnerPanel?.classList.add("report-pannable");
    reportView?.classList.remove("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    void renderPerformanceReport(pairInfo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showVisualizationView(pairInfo = selectedReportPair) {
    clearReportPanelOffset();
    visualizationView?.classList.remove("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    void renderPerformanceVisualization(pairInfo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDifficultyState(levelOverride = null) {
    const state = readLauncherState();
    const level = normalizeDifficultyLevel(levelOverride ?? state.difficultyLevel);
    updateDifficultyDisplay(level);
    positionDifficultyThumb(Number(level));
  }

  function rememberDifficultyLevel(level) {
    const latest = readLauncherState();
    latest.difficultyLevel = normalizeDifficultyLevel(level);
    writeLauncherState(latest);
    renderDifficultyState(latest.difficultyLevel);
    return latest.difficultyLevel;
  }

  function showHelpView() {
    clearReportPanelOffset();
    helpView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showContactView() {
    clearReportPanelOffset();
    contactView?.classList.remove("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    resetContactView({ clearMessage: false, clearStatus: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showAboutView() {
    clearReportPanelOffset();
    aboutView?.classList.remove("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function commitDifficultyLevel(level) {
    const normalizedLevel = rememberDifficultyLevel(level);
    const pairContext = getReceiverDifficultyContext();
    void refreshDifficultyLabels();

    if (!pairContext) {
      activePairDifficultyCode = "";
      return;
    }

    activePairDifficultyCode = pairContext.sessionCode;

    try {
      const data = await fetchPairDifficulty(pairContext.sessionCode, normalizedLevel);
      const confirmedLevel = normalizeDifficultyLevel(data?.pair_difficulty);
      rememberDifficultyLevel(confirmedLevel);
      void refreshDifficultyLabels();
    } catch (error) {
      renderDifficultyState(normalizedLevel);
    }
  }

  async function syncDifficultyFromPair() {
    const pairContext = getReceiverDifficultyContext();
    const loadToken = ++difficultyLoadToken;

    if (!pairContext) {
      activePairDifficultyCode = "";
      rememberDifficultyLevel("1");
      return;
    }

    activePairDifficultyCode = pairContext.sessionCode;
    rememberDifficultyLevel("1");

    try {
      const data = await fetchPairDifficulty(pairContext.sessionCode);
      if (loadToken !== difficultyLoadToken || activePairDifficultyCode !== pairContext.sessionCode) {
        return;
      }
      rememberDifficultyLevel(normalizeDifficultyLevel(data?.pair_difficulty));
      void refreshDifficultyLabels();
    } catch (error) {
      if (loadToken !== difficultyLoadToken || activePairDifficultyCode !== pairContext.sessionCode) {
        return;
      }
      rememberDifficultyLevel("1");
      void refreshDifficultyLabels();
    }
  }

  function difficultyPositions(slider = difficultySlider) {
    const width = Math.max(slider?.clientWidth || 0, 1);
    return difficultyStopPercents.map((percent) => width * (percent / 100));
  }

  function positionDifficultyThumb(level) {
    if (!difficultySlider || !difficultyThumb) {
      return;
    }
    const positions = difficultyPositions(difficultySlider);
    const index = Math.max(1, Math.min(3, Number(level || 3))) - 1;
    const left = positions[index];
    difficultyThumb.style.left = `${left}px`;
    if (difficultyFill) {
      const fillLeft = 10;
      difficultyFill.style.width = `${Math.max(left - fillLeft, 0)}px`;
    }
  }

  function updateDifficultyDisplay(level) {
    const normalizedLevel = normalizeDifficultyLevel(level);
    if (difficultySlider) {
      difficultySlider.setAttribute("aria-valuenow", normalizedLevel);
    }
    if (difficultyCurrent) {
      difficultyCurrent.textContent = `Level ${normalizedLevel}`;
    }
    if (difficultyDescription) {
      difficultyDescription.textContent = difficultyCopy[normalizedLevel];
    }
  }

  function clampDifficultyOffset(offsetX) {
    if (!difficultySlider) {
      return 0;
    }
    const minOffset = 10;
    const maxOffset = Math.max((difficultySlider.clientWidth || 0) - 10, minOffset);
    return Math.max(minOffset, Math.min(maxOffset, offsetX));
  }

  function resolveDifficultyDragPosition(clientX, options = {}) {
    if (!difficultySlider) {
      return {
        level: 1,
        thumbLeft: 10
      };
    }

    const rect = difficultySlider.getBoundingClientRect();
    const positions = difficultyPositions(difficultySlider);
    const rawOffset = clampDifficultyOffset(clientX - rect.left);
    const snapThreshold = Math.max((difficultySlider.clientWidth || 0) * 0.08, 18);
    const ignoredLevel = options?.ignoredLevel ? normalizeDifficultyLevel(options.ignoredLevel) : "";
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    let nearestSnappableIndex = -1;
    let nearestSnappableDistance = Infinity;

    positions.forEach((position, index) => {
      const distance = Math.abs(position - rawOffset);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
      if (String(index + 1) !== ignoredLevel && distance < nearestSnappableDistance) {
        nearestSnappableDistance = distance;
        nearestSnappableIndex = index;
      }
    });

    const snapIndex = nearestSnappableIndex >= 0 ? nearestSnappableIndex : nearestIndex;
    const snapDistance = nearestSnappableIndex >= 0 ? nearestSnappableDistance : nearestDistance;

    return {
      level: nearestIndex + 1,
      thumbLeft: snapDistance <= snapThreshold ? positions[snapIndex] : rawOffset
    };
  }

  function levelPosition(level) {
    const positions = difficultyPositions(difficultySlider);
    const index = Math.max(1, Math.min(3, Number(level || 1))) - 1;
    return positions[index] ?? positions[0] ?? 10;
  }

  function positionDifficultyThumbAt(thumbLeft) {
    if (!difficultyThumb || !difficultySlider) {
      return;
    }
    const clampedLeft = clampDifficultyOffset(thumbLeft);
    difficultyThumb.style.left = `${clampedLeft}px`;
    if (difficultyFill) {
      const fillLeft = 10;
      difficultyFill.style.width = `${Math.max(clampedLeft - fillLeft, 0)}px`;
    }
  }

  function previewDifficultyDrag(clientX) {
    const preview = resolveDifficultyDragPosition(clientX, {
      ignoredLevel: difficultyDragReleasedLevel
    });
    updateDifficultyDisplay(preview.level);
    positionDifficultyThumbAt(preview.thumbLeft);
    return preview.level;
  }

  function previewDifficultyDragFromLockedLevel(clientX) {
    if (!difficultySlider) {
      return 1;
    }

    const rect = difficultySlider.getBoundingClientRect();
    const rawOffset = clampDifficultyOffset(clientX - rect.left);
    const lockedLevel = normalizeDifficultyLevel(difficultyDragLockedLevel || readLauncherState().difficultyLevel);
    const lockedPosition = levelPosition(lockedLevel);
    const releaseThreshold = Math.max((difficultySlider.clientWidth || 0) * 0.025, 8);

    if (Math.abs(rawOffset - lockedPosition) <= releaseThreshold) {
      updateDifficultyDisplay(lockedLevel);
      positionDifficultyThumbAt(lockedPosition);
      return Number(lockedLevel);
    }

    difficultyDragReleasedLevel = lockedLevel;
    difficultyDragLockedLevel = null;
    return previewDifficultyDrag(clientX);
  }

  function nearestDifficultyLevel(clientX) {
    if (!difficultySlider) {
      return 3;
    }
    const rect = difficultySlider.getBoundingClientRect();
    const positions = difficultyPositions(difficultySlider);
    const offsetX = clientX - rect.left;
    let bestIndex = 0;
    let bestDistance = Infinity;
    positions.forEach((position, index) => {
      const distance = Math.abs(position - offsetX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex + 1;
  }

  function beginDifficultyDrag(event) {
    if (!difficultySlider) {
      return;
    }
    difficultyDragging = true;
    difficultyDragPointerId = event.pointerId ?? null;
    difficultyDragLockedLevel = normalizeDifficultyLevel(readLauncherState().difficultyLevel);
    difficultyDragReleasedLevel = null;
    difficultySlider.classList.add("is-dragging");
    if (event.pointerId !== undefined) {
      difficultySlider.setPointerCapture?.(event.pointerId);
    }
    previewDifficultyDragFromLockedLevel(event.clientX);
  }

  function continueDifficultyDrag(event) {
    if (!difficultyDragging || (difficultyDragPointerId !== null && event.pointerId !== difficultyDragPointerId)) {
      return;
    }
    if (difficultyDragLockedLevel) {
      previewDifficultyDragFromLockedLevel(event.clientX);
      return;
    }
    previewDifficultyDrag(event.clientX);
  }

  function endDifficultyDrag(event) {
    if (!difficultyDragging || !difficultySlider) {
      return;
    }
    difficultyDragging = false;
    difficultyDragPointerId = null;
    difficultyDragLockedLevel = null;
    difficultyDragReleasedLevel = null;
    difficultySlider.classList.remove("is-dragging");
    if (event?.pointerId !== undefined) {
      difficultySlider.releasePointerCapture?.(event.pointerId);
    }
    const level = nearestDifficultyLevel(event?.clientX ?? difficultySlider.getBoundingClientRect().left);
    void commitDifficultyLevel(level);
  }

  function showDifficultyView() {
    difficultyView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    void syncDifficultyFromPair();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderSettingsView() {
    const receiverContext = getPairContextForRole("receiver");
    const currentSettings = readRuntimeSettings("receiver");
    const currentLevel = receiverContext
      ? normalizeDifficultyLevel(readLauncherState().difficultyLevel)
      : "1";
    const singleChoiceOnly = currentLevel === "1" || currentLevel === "2";

    if (settingsCurrentPair) {
      settingsCurrentPair.textContent = receiverContext
        ? `Receiver-side settings for: ${receiverContext.ownName}  ->  ${receiverContext.partnerName}`
        : "Receiver-side settings will apply after a valid receiver/sender pair is entered.";
    }

    if (settingsSecondChoiceCheckbox) {
      settingsSecondChoiceCheckbox.checked = singleChoiceOnly ? false : (currentSettings.allow_second_choice !== false);
      settingsSecondChoiceCheckbox.disabled = singleChoiceOnly;
      settingsSecondChoiceCheckbox.title = singleChoiceOnly
        ? "Level 1 and Level 2 use one choice only."
        : "";
    }

    if (settingsImportFilenameInput) {
      settingsImportFilenameInput.value = currentSettings.import_csv_filename || "";
    }

    if (settingsStatus) {
      settingsStatus.textContent = settingsStatus.dataset.persistedMessage || "";
    }
  }

  function showSettingsView() {
    settingsView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    renderSettingsView();
    void syncDifficultyFromPair().then(() => {
      if (!settingsView?.classList.contains("beginner-view-hidden")) {
        renderSettingsView();
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatAdminDiskUsageAnalysis(analysis) {
      if (!analysis) {
        return "";
    }

    if (!analysis.available) {
      return String(analysis.message || "Disk-usage analysis is not available right now.");
    }

    const sections = analysis.sections || {};
    const chunks = [];

    if (sections.filesystem) {
      chunks.push(`Filesystem\n${String(sections.filesystem).trim()}`);
    }
    if (sections.top_level) {
      chunks.push(`Largest top-level directories\n${String(sections.top_level).trim()}`);
    }
    if (sections.var_www) {
      chunks.push(`/var/www breakdown\n${String(sections.var_www).trim()}`);
    }

      return chunks.filter(Boolean).join("\n\n");
    }

    function formatAdminUserTrialSummary(rows) {
      const items = Array.isArray(rows) ? rows : [];
      if (!items.length) {
        return "No server-side user summary is available right now.";
      }

      const userWidth = Math.max("User".length, ...items.map((row) => String(row?.user_name || "").length));
      const roleWidth = Math.max("Role".length, ...items.map((row) => String(row?.role || "").length));
      const partnerWidth = Math.max("Partner".length, ...items.map((row) => String(row?.partner_name || "").length));
      const lastDateWidth = Math.max("Last Date".length, ...items.map((row) => String(row?.last_date || "").length));
      const countWidth = Math.max("Trials".length, ...items.map((row) => String(row?.trial_count ?? "").length));
      const pad = (value, width) => String(value ?? "").padEnd(width, " ");

      const lines = [
        `${pad("User", userWidth)}  ${pad("Role", roleWidth)}  ${pad("Partner", partnerWidth)}  ${pad("Last Date", lastDateWidth)}  ${String("Trials").padStart(countWidth, " ")}`,
        `${"-".repeat(userWidth)}  ${"-".repeat(roleWidth)}  ${"-".repeat(partnerWidth)}  ${"-".repeat(lastDateWidth)}  ${"-".repeat(countWidth)}`
      ];

      items.forEach((row) => {
        lines.push(
          `${pad(row?.user_name || "", userWidth)}  ${pad(row?.role || "", roleWidth)}  ${pad(row?.partner_name || "", partnerWidth)}  ${pad(row?.last_date || "", lastDateWidth)}  ${String(row?.trial_count ?? 0).padStart(countWidth, " ")}`
        );
      });

      return lines.join("\n");
    }

    function renderAdminView() {
      if (adminDebugEnabledCheckbox) {
        adminDebugEnabledCheckbox.checked = !!launcherAdminState.debug_enabled;
      }
      if (adminClearDebugLogButton) {
        const debugLog = launcherAdminState.debug_log;
        const sizeLabel = debugLog?.size_formatted ? debugLog.size_formatted : "0 B";
        adminClearDebugLogButton.innerHTML = `Clear debug log<span class="admin-button-subline">Current size: ${escapeHtml(sizeLabel)}</span>`;
      }
      if (adminStorageInfo) {
        const storage = launcherAdminState.storage;
        adminStorageInfo.innerHTML = storage?.available
        ? `Storage path: ${escapeHtml(storage.path)}<br>Free space: ${escapeHtml(storage.free_formatted)}&nbsp;&nbsp;&nbsp;Used space: ${escapeHtml(storage.used_formatted)}&nbsp;&nbsp;&nbsp;Total space: ${escapeHtml(storage.total_formatted)}`
          : "Storage information is not available right now.";
      }
      if (adminUserList) {
        const userSummary = launcherAdminState.user_trial_summary;
        if (Array.isArray(userSummary) && userSummary.length) {
          adminUserList.hidden = false;
          adminUserList.textContent = formatAdminUserTrialSummary(userSummary);
        } else {
          adminUserList.hidden = true;
          adminUserList.textContent = "";
        }
      }
      if (adminDiskUsage) {
        const diskUsage = launcherAdminState.disk_usage_analysis;
      if (diskUsage) {
        adminDiskUsage.hidden = false;
        adminDiskUsage.textContent = formatAdminDiskUsageAnalysis(diskUsage);
      } else {
        adminDiskUsage.hidden = true;
        adminDiskUsage.textContent = "";
      }
    }
  }

  async function refreshAdminView() {
    if (!launcherAdminSecret) {
      if (adminStatus) {
        adminStatus.textContent = "Admin access is not active.";
      }
      return;
    }
    if (adminStatus) {
      adminStatus.textContent = "Loading admin data...";
    }
    try {
      const data = await launcherAdminApi("heartbeat");
        launcherAdminState = {
          debug_enabled: !!data?.debug_enabled,
          storage: data?.storage || null,
          debug_log: data?.debug_log || null,
          user_trial_summary: data?.user_trial_summary || null,
          disk_usage_analysis: data?.disk_usage_analysis || null
        };
      if (adminStatus) {
        adminStatus.textContent = "Admin access active.";
      }
      renderAdminView();
    } catch (error) {
      if (adminStatus) {
        adminStatus.textContent = "Unable to load admin data right now.";
      }
    }
  }

  function showAdminView() {
    adminView?.classList.remove("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    renderAdminView();
    void refreshAdminView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyLauncherOpenRequest() {
    try {
      const params = new URLSearchParams(window.location.search);
      const requestedView = String(params.get("open") || "").trim().toLowerCase();
      if (requestedView === "settings") {
        showSettingsView();
      }
    } catch (error) {
      // Ignore malformed launcher open requests.
    }
  }

  function renderColorSchemeView() {
    const currentColor = normalizeThemeHex(readLauncherState().themeColor || defaultThemeColor);
    if (colorSchemeInput) {
      colorSchemeInput.value = currentColor;
    }
    if (colorSchemeHexInput) {
      colorSchemeHexInput.value = currentColor;
    }
    if (colorSchemeStatus) {
      colorSchemeStatus.textContent = "This picker previews colors live. Save stores the current blue only on this browser/device.";
    }
  }

  function showColorSchemeView() {
    colorSchemeView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    renderColorSchemeView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function encodeCsvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, "\"\"").replace(/\r?\n/g, " ")}"`;
  }

  function countWords(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  function buildContactMessageMeta() {
    const pair = getCurrentPairParticipants();
    const ownNames = collectReportOwnNames();
    const location = readLauncherState().deviceLocation;
    return {
      pair,
      ownNames,
      location
    };
  }

  async function sendContactMessage(messageText, senderEmail) {
    const meta = buildContactMessageMeta();
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "send_contact_message",
        message: String(messageText || ""),
        metadata: {
          app: "Telepathy Beginner",
          build_version: launcherBuildVersion,
          sender_email: String(senderEmail || "").trim(),
          own_names: meta.ownNames,
          pair: meta.pair,
          location: meta.location
        }
      })
    });

    if (!response.ok) {
      let message = `Contact request failed with status ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) {
          message = String(data.error);
        }
      } catch (error) {
        // Keep the HTTP status fallback message.
      }
      throw new Error(message);
    }

    return response.json();
  }

  function renderContactWordCount() {
    if (!contactWordCount) {
      return;
    }
    const words = countWords(contactMessageInput?.value || "");
    contactWordCount.textContent = `${words} / 300 words`;
    contactWordCount.classList.toggle("is-over-limit", words > 300);
  }

  function resetContactView(options = {}) {
    const clearMessage = options.clearMessage !== false;
    const clearEmail = options.clearEmail !== false;
    const clearStatus = options.clearStatus !== false;
    if (clearMessage && contactMessageInput) {
      contactMessageInput.value = "";
    }
    if (clearEmail && contactEmailInput) {
      contactEmailInput.value = "";
    }
    if (clearStatus && contactStatus) {
      contactStatus.textContent = "";
    }
    if (contactSendButton) {
      contactSendButton.disabled = false;
    }
    renderContactWordCount();
  }

  function getStoredReceiverTrialRecords() {
    try {
      const raw = localStorage.getItem("cones-local-trials-receiver");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  async function downloadSettingsCsvData() {
    try {
      const desiredName = String(settingsImportFilenameInput?.value || "").trim();
      if (desiredName) {
        const matchedAdminSecret = await checkAdminSecret(desiredName);
        if (matchedAdminSecret) {
          launcherAdminSecret = desiredName;
          writeRuntimeSettings("receiver", {
            import_csv_filename: ""
          });
          if (settingsImportFilenameInput) {
            settingsImportFilenameInput.value = "";
          }
          if (settingsStatus) {
            settingsStatus.textContent = "";
            settingsStatus.dataset.persistedMessage = "";
          }
          showAdminView();
          return;
        }
      }

      if (settingsStatus) {
        settingsStatus.textContent = "Preparing CSV download...";
        settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
      }

      const csvResult = await fetchReportCsvData();
      const records = Array.isArray(csvResult.records) ? csvResult.records : [];
      if (!records.length) {
        if (settingsStatus) {
          settingsStatus.textContent = "No CSV records are available to download right now.";
          settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
        }
        return;
      }

      if (!desiredName) {
        if (settingsStatus) {
          settingsStatus.textContent = "Please provide a CSV data filename.";
          settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
        }
        settingsImportFilenameInput?.focus();
        return;
      }

      const header = Object.keys(records[0]);
      const lines = [
        header.map(encodeCsvCell).join(","),
        ...records.map((record) => header.map((key) => encodeCsvCell(record[key])).join(","))
      ];
      const csv = `${lines.join("\n")}\n`;
      const fileName = desiredName
        ? (desiredName.toLowerCase().endsWith(".csv") ? desiredName : `${desiredName}.csv`)
        : "cones-trials-download.csv";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      writeRuntimeSettings("receiver", {
        import_csv_filename: desiredName
      });

      if (settingsStatus) {
        settingsStatus.textContent = `CSV download started as ${fileName}.`;
        settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
      }
    } catch (error) {
      if (settingsStatus) {
        settingsStatus.textContent = "Unable to prepare the CSV download right now.";
        settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
      }
    }
  }

  async function handleContactSend() {
    const messageText = String(contactMessageInput?.value || "").trim();
    const senderEmail = String(contactEmailInput?.value || "").trim();
    const wordCount = countWords(messageText);

    if (contactStatus) {
      contactStatus.textContent = "";
    }

    if (!messageText) {
      if (contactStatus) {
        contactStatus.textContent = "Please write a message before sending.";
      }
      contactMessageInput?.focus();
      return;
    }

    if (!senderEmail) {
      if (contactStatus) {
        contactStatus.textContent = "Please provide your email address.";
      }
      contactEmailInput?.focus();
      return;
    }

    if (wordCount > 300) {
      if (contactStatus) {
        contactStatus.textContent = "Please reduce your message to 300 words or fewer.";
      }
      contactMessageInput?.focus();
      return;
    }

    if (contactSendButton) {
      contactSendButton.disabled = true;
    }
    if (contactStatus) {
      contactStatus.textContent = "Sending your message...";
    }

    try {
      await sendContactMessage(messageText, senderEmail);
      if (contactStatus) {
        contactStatus.textContent = "Thank you. Your messages was sent to ESP Gym, and a copy sent to you for your records.";
      }
      if (contactMessageInput) {
        contactMessageInput.value = "";
      }
      if (contactEmailInput) {
        contactEmailInput.value = "";
      }
      renderContactWordCount();
    } catch (error) {
      if (contactStatus) {
        contactStatus.textContent = error instanceof Error
          ? error.message
          : "Unable to send your message right now.";
      }
    } finally {
      if (contactSendButton) {
        contactSendButton.disabled = false;
      }
    }
  }

  function showInstallFallback() {
    window.alert(
      "If your device supports app installation, use the browser's install or Add to Home Screen option to install Telepathy Beginner."
    );
  }

  function isRunningAsInstalledApp() {
    return !!(
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function updateInstallButtonLabel() {
    if (!installAppButton) {
      return;
    }

    if (isRunningAsInstalledApp()) {
      installAppButton.textContent = "Uninstall Telepathy Beginner as an app on this device";
      installAppButton.title = "Telepathy Beginner appears to be installed on this device.";
      return;
    }

    installAppButton.textContent = "Install Telepathy Beginner as an app on this device";
    installAppButton.title = "As an app, it does not work inside a browser tab, but acts just like a regular app with its own icon.";
  }

  function detectMobileBrowser() {
    const ua = navigator.userAgent || "";
    const vendor = navigator.vendor || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isChromeIOS = /CriOS/i.test(ua);
    const isSafariIOS = isIOS && /Safari/i.test(ua) && /Apple/i.test(vendor) && !isChromeIOS;

    return {
      isIOS,
      isChromeIOS,
      isSafariIOS
    };
  }

  async function handleInstallRequest() {
    const browser = detectMobileBrowser();

    if (browser.isSafariIOS) {
      window.alert(
        "On iPhone Safari, use Share and then Add to Home Screen to install Telepathy Beginner."
      );
      return;
    }

    if (browser.isChromeIOS) {
      window.alert(
        "Chrome on iPhone may not show Add to Home Screen reliably. If it is missing, open this page in Safari and use Share -> Add to Home Screen."
      );
      return;
    }

    if (!deferredInstallPrompt) {
      showInstallFallback();
      return;
    }

    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      // Ignore prompt rejection and leave fallback to the browser UI.
    }
    deferredInstallPrompt = null;
  }

  roleCards.forEach((card) => {
    populateCard(card);
    const header = card.querySelector(".role-card-header");
    header?.addEventListener("click", () => {
      activateCard(card);
    });
  });

  document.querySelectorAll(".role-email-note").forEach((note) => {
    note.addEventListener("click", () => {
      collapseActiveLauncherCard();
    });
  });

  retryLocationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      requestDeviceLocationIfNeeded(true);
    });
  });

  openOptionsButton?.addEventListener("click", showOptionsView);
  closeOptionsButton?.addEventListener("click", showLauncherView);
  openHelpButton?.addEventListener("click", showHelpView);
  openColorSchemeButton?.addEventListener("click", showColorSchemeView);
  closeHelpButton?.addEventListener("click", showOptionsView);
  closeColorSchemeButton?.addEventListener("click", showOptionsView);
  openContactButton?.addEventListener("click", showContactView);
  closeContactButton?.addEventListener("click", showHelpView);
  openAboutButton?.addEventListener("click", showAboutView);
  closeAboutButton?.addEventListener("click", showHelpView);
  openReportButton?.addEventListener("click", showReportDefinitionView);
  closeReportDefinitionButton?.addEventListener("click", showOptionsView);
  closeReportButton?.addEventListener("click", showReportDefinitionView);
  closeVisualizationButton?.addEventListener("click", showReportDefinitionView);
  reportPairTrigger?.addEventListener("click", () => {
    if (!availableReportPairs.length) {
      return;
    }
    if (reportPairMenu?.hidden) {
      openReportPairMenu();
    } else {
      closeReportPairMenu();
    }
  });
  reportGoButton?.addEventListener("click", () => {
    if (selectedReportPair) {
      showReportView(selectedReportPair);
    }
  });
  reportVisualizeButton?.addEventListener("click", () => {
    if (selectedReportPair) {
      showVisualizationView(selectedReportPair);
    }
  });
  openDifficultyButton?.addEventListener("click", showDifficultyView);
  openAdvancedButton?.addEventListener("click", showSettingsView);
  closeDifficultyButton?.addEventListener("click", showOptionsView);
  closeSettingsButton?.addEventListener("click", showDifficultyView);
  closeAdminButton?.addEventListener("click", showSettingsView);
  settingsSecondChoiceCheckbox?.addEventListener("change", () => {
    if (settingsStatus) {
      settingsStatus.textContent = "";
    }
  });
  settingsImportFilenameInput?.addEventListener("input", () => {
    if (settingsStatus) {
      settingsStatus.textContent = "";
    }
  });
  contactMessageInput?.addEventListener("input", () => {
    if (contactStatus) {
      contactStatus.textContent = "";
    }
    renderContactWordCount();
  });
  contactEmailInput?.addEventListener("input", () => {
    if (contactStatus) {
      contactStatus.textContent = "";
    }
  });
  contactSendButton?.addEventListener("click", () => {
    void handleContactSend();
  });
  contactCancelButton?.addEventListener("click", () => {
    resetContactView();
    showHelpView();
  });
  downloadSettingsCsvButton?.addEventListener("click", () => {
    void downloadSettingsCsvData();
  });
  colorSchemeInput?.addEventListener("input", () => {
    const nextColor = normalizeThemeHex(colorSchemeInput.value || defaultThemeColor);
    applyThemeColor(nextColor);
    if (colorSchemeHexInput) {
      colorSchemeHexInput.value = nextColor;
    }
    if (colorSchemeStatus) {
      colorSchemeStatus.textContent = `Previewing base blue: ${nextColor}`;
    }
  });
  colorSchemeHexInput?.addEventListener("input", () => {
    const rawValue = String(colorSchemeHexInput.value || "").trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(rawValue)) {
      if (colorSchemeStatus) {
        colorSchemeStatus.textContent = "Enter a 6-digit hex color such as #3160b0 to preview it.";
      }
      return;
    }
    const nextColor = normalizeThemeHex(rawValue);
    if (colorSchemeInput) {
      colorSchemeInput.value = nextColor;
    }
    applyThemeColor(nextColor);
    if (colorSchemeStatus) {
      colorSchemeStatus.textContent = `Previewing base blue: ${nextColor}`;
    }
  });
  saveColorSchemeButton?.addEventListener("click", () => {
    const savedColor = persistThemeColor(colorSchemeInput?.value || defaultThemeColor);
    if (colorSchemeHexInput) {
      colorSchemeHexInput.value = savedColor;
    }
    if (colorSchemeStatus) {
      colorSchemeStatus.textContent = `Saved base blue on this browser/device: ${savedColor}`;
    }
  });
  resetColorSchemeButton?.addEventListener("click", () => {
    const resetColor = persistThemeColor(defaultThemeColor);
    if (colorSchemeInput) {
      colorSchemeInput.value = resetColor;
    }
    if (colorSchemeHexInput) {
      colorSchemeHexInput.value = resetColor;
    }
    if (colorSchemeStatus) {
      colorSchemeStatus.textContent = `Reset base blue to default: ${resetColor}`;
    }
  });
  installAppButton?.addEventListener("click", handleInstallRequest);
  adminDebugEnabledCheckbox?.addEventListener("change", async () => {
    if (!launcherAdminSecret) {
      return;
    }
    if (adminStatus) {
      adminStatus.textContent = "Saving debug setting...";
    }
    try {
        const data = await launcherAdminApi("set_debug_enabled", { enabled: adminDebugEnabledCheckbox.checked });
        launcherAdminState.debug_enabled = !!data?.debug_enabled;
        launcherAdminState.storage = data?.storage || launcherAdminState.storage;
        launcherAdminState.debug_log = data?.debug_log || launcherAdminState.debug_log;
        if (adminStatus) {
          adminStatus.textContent = launcherAdminState.debug_enabled ? "Debugging is currently enabled." : "Debugging is currently disabled.";
        }
      renderAdminView();
    } catch (error) {
      if (adminStatus) {
        adminStatus.textContent = "Unable to save debugging setting right now.";
      }
    }
  });
  adminClearDebugLogButton?.addEventListener("click", async () => {
    if (!launcherAdminSecret) {
      return;
    }
    if (adminStatus) {
      adminStatus.textContent = "Clearing debug log...";
    }
    try {
        const data = await launcherAdminApi("clear_debug_log");
        launcherAdminState.storage = data?.storage || launcherAdminState.storage;
        launcherAdminState.debug_log = data?.debug_log || launcherAdminState.debug_log;
        if (adminStatus) {
          adminStatus.textContent = "Debug log cleared.";
        }
      renderAdminView();
    } catch (error) {
      if (adminStatus) {
        adminStatus.textContent = "Unable to clear the debug log right now.";
      }
    }
  });
      adminListUsersButton?.addEventListener("click", async () => {
        if (!launcherAdminSecret) {
          return;
      }
      if (adminStatus) {
        adminStatus.textContent = "Building user summary...";
      }
      try {
        const data = await launcherAdminApi("list_all_users");
        launcherAdminState.storage = data?.storage || launcherAdminState.storage;
        launcherAdminState.debug_log = data?.debug_log || launcherAdminState.debug_log;
        launcherAdminState.user_trial_summary = Array.isArray(data?.user_trial_summary)
          ? data.user_trial_summary
          : [];
        if (adminStatus) {
          const count = launcherAdminState.user_trial_summary.length;
          adminStatus.textContent = `User summary updated. ${count} line item${count === 1 ? "" : "s"} found.`;
        }
        renderAdminView();
      } catch (error) {
        if (adminStatus) {
          adminStatus.textContent = "Unable to build the user summary right now.";
        }
      }
    });
    adminAnalyzeDiskButton?.addEventListener("click", async () => {
      if (!launcherAdminSecret) {
        return;
    }
    if (adminStatus) {
      adminStatus.textContent = "Analyzing disk usage...";
    }
    try {
        const data = await launcherAdminApi("analyze_disk_usage");
        launcherAdminState.storage = data?.storage || launcherAdminState.storage;
        launcherAdminState.debug_log = data?.debug_log || launcherAdminState.debug_log;
        launcherAdminState.disk_usage_analysis = data?.disk_usage_analysis || null;
        if (adminStatus) {
          adminStatus.textContent = "Disk usage analysis updated.";
      }
      renderAdminView();
    } catch (error) {
      if (adminStatus) {
        adminStatus.textContent = "Unable to analyze disk usage right now.";
      }
    }
  });
  reportViewPanHandle?.addEventListener("pointerdown", beginReportViewPan);
  reportResizeHandles.forEach((handle) => {
    handle.addEventListener("pointerdown", beginReportResize);
  });
  difficultySlider?.addEventListener("pointerdown", beginDifficultyDrag);
  difficultySlider?.addEventListener("pointermove", continueDifficultyDrag);
  difficultySlider?.addEventListener("pointerup", endDifficultyDrag);
  difficultySlider?.addEventListener("pointercancel", endDifficultyDrag);
  difficultySlider?.addEventListener("keydown", (event) => {
    const current = Number(normalizeDifficultyLevel(readLauncherState().difficultyLevel));
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      void commitDifficultyLevel(Math.max(1, current - 1));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      void commitDifficultyLevel(Math.min(3, current + 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      void commitDifficultyLevel(1);
    } else if (event.key === "End") {
      event.preventDefault();
      void commitDifficultyLevel(3);
    }
  });
  window.addEventListener("resize", () => {
    renderDifficultyState();
  });
  applyThemeColor(readLauncherState().themeColor || defaultThemeColor);
  renderLocationStatus();
  renderDifficultyState();
  renderContactWordCount();
  updateInstallButtonLabel();
  void refreshDifficultyLabels();
  applyLauncherOpenRequest();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButtonLabel();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallButtonLabel();
  });

  document.addEventListener("click", (event) => {
    if (!reportPairPicker?.contains(event.target)) {
      closeReportPairMenu();
    }

    const launcherVisible = launcherView && !launcherView.classList.contains("beginner-view-hidden");
    const activeCard = roleCards.find((card) => card.classList.contains("active"));
    if (
      launcherVisible &&
      activeCard &&
      !activeCard.contains(event.target) &&
      !openOptionsButton?.contains(event.target)
    ) {
      collapseActiveLauncherCard();
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`./telepathybeginner-sw.js?v=${launcherBuildVersion}`)
        .catch(() => {
          // Ignore service worker registration failures and fall back to browser guidance.
        });
    });
  }
})();
