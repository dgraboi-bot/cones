(() => {
  const launcherKey = "cones-beginner-launcher-v2";
  const roleCards = Array.from(document.querySelectorAll("[data-role-card]"));
  const proOnlyRoleCards = Array.from(document.querySelectorAll("[data-pro-only-card]"));
  const rolePanels = document.querySelector(".role-panels");
  const launcherView = document.querySelector('[data-view="launcher"]');
  const beginnerMainTitle = document.querySelector("[data-beginner-main-title]");
  const launcherSubtitle = document.querySelector("[data-launcher-subtitle]");
  const launcherCopy = document.querySelector("[data-launcher-copy]");
  const proHeroFrame = document.querySelector("[data-pro-hero-frame]");
  const optionsView = document.querySelector('[data-view="options"]');
  const helpView = document.querySelector('[data-view="help"]');
  const toolsView = document.querySelector('[data-view="tools"]');
  const goProView = document.querySelector('[data-view="go-pro"]');
  const otherSettingsView = document.querySelector('[data-view="other-settings"]');
  const colorSchemeView = document.querySelector('[data-view="color-scheme"]');
  const userTypeAdminView = document.querySelector('[data-view="user-type-admin"]');
  const adminUserListView = document.querySelector('[data-view="admin-user-list"]');
  const contactView = document.querySelector('[data-view="contact"]');
  const aboutView = document.querySelector('[data-view="about"]');
  const reportDefinitionView = document.querySelector('[data-view="report-definition"]');
  const reportView = document.querySelector('[data-view="report"]');
  const visualizationView = document.querySelector('[data-view="visualization"]');
  const analyzerView = document.querySelector('[data-view="analyzer"]');
  const difficultyView = document.querySelector('[data-view="difficulty"]');
  const settingsView = document.querySelector('[data-view="settings"]');
  const adminView = document.querySelector('[data-view="admin"]');
  const beginnerPanel = document.querySelector(".beginner-panel");
  const reportViewPanHandle = document.querySelector("[data-report-view-pan-handle]");
  const openOptionsButton = document.querySelector("[data-open-options]");
  const closeOptionsButton = document.querySelector("[data-close-options]");
  const openHelpButton = document.querySelector("[data-open-help]");
  const openToolsButtons = Array.from(document.querySelectorAll("[data-open-tools]"));
  const openGoProButton = document.querySelector("[data-open-go-pro]");
  const openOtherSettingsButton = document.querySelector("[data-open-other-settings]");
  const openColorSchemeButton = document.querySelector("[data-open-color-scheme]");
  const openUserTypeAdminButton = document.querySelector("[data-open-user-type-admin]");
  const closeHelpButton = document.querySelector("[data-close-help]");
  const closeToolsButton = document.querySelector("[data-close-tools]");
  const closeGoProButton = document.querySelector("[data-close-go-pro]");
  const closeOtherSettingsButton = document.querySelector("[data-close-other-settings]");
  const closeColorSchemeButton = document.querySelector("[data-close-color-scheme]");
  const closeUserTypeAdminButton = document.querySelector("[data-close-user-type-admin]");
  const closeAdminUserListButton = document.querySelector("[data-close-admin-user-list]");
  const openContactButton = document.querySelector("[data-open-contact]");
  const closeContactButton = document.querySelector("[data-close-contact]");
  const openAboutButton = document.querySelector("[data-open-about]");
  const closeAboutButton = document.querySelector("[data-close-about]");
  const openReportButton = document.querySelector("[data-open-report]");
  const closeReportDefinitionButton = document.querySelector("[data-close-report-definition]");
  const closeReportButton = document.querySelector("[data-close-report]");
  const closeVisualizationButton = document.querySelector("[data-close-visualization]");
  const closeAnalyzerButton = document.querySelector("[data-close-analyzer]");
  const reportDefinitionStatus = document.querySelector("[data-report-definition-status]");
  const reportPairPicker = document.querySelector("[data-report-pair-picker]");
  const reportPairTrigger = document.querySelector("[data-report-pair-trigger]");
  const reportPairTriggerText = document.querySelector("[data-report-pair-trigger-text]");
  const reportPairMenu = document.querySelector("[data-report-pair-menu]");
  const reportPairOptions = document.querySelector("[data-report-pair-options]");
  const reportGoButton = document.querySelector("[data-report-go]");
  const reportVisualizeButton = document.querySelector("[data-report-visualize]");
  const reportAnalyzeButton = document.querySelector("[data-report-analyze]");
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
  const analyzerSummary = document.querySelector("[data-analyzer-summary]");
  const analyzerStatus = document.querySelector("[data-analyzer-status]");
  const analyzerOutput = document.querySelector("[data-analyzer-output]");
  const analyzerText = document.querySelector("[data-analyzer-text]");
  const analyzerRefreshButton = document.querySelector("[data-analyzer-refresh]");
  const analyzerCopyButton = document.querySelector("[data-analyzer-copy]");
  const reportPanel = document.querySelector(".report-panel");
  const reportResizeHandles = Array.from(document.querySelectorAll("[data-report-resize]"));
  const handleOverlay = document.querySelector("[data-handle-overlay]");
  const handleInput = document.querySelector("[data-handle-input]");
  const handleStatus = document.querySelector("[data-handle-status]");
  const submitHandleButton = document.querySelector("[data-submit-handle]");
  const closeHandleButton = document.querySelector("[data-close-handle]");
  const openHandleButtons = Array.from(document.querySelectorAll("[data-open-handle-control]"));
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
  const userTypeHandleInput = document.querySelector("[data-user-type-handle]");
  const userTypeStatus = document.querySelector("[data-user-type-status]");
  const userTypeOptionsWrap = document.querySelector("[data-user-type-options-wrap]");
  const userTypeChoiceButtons = Array.from(document.querySelectorAll("[data-user-type-choice-button]"));
  const userTypeSaveButton = document.querySelector("[data-user-type-save]");
  const userTypeClearButton = document.querySelector("[data-user-type-clear]");
  const adminStorageInfo = document.querySelector("[data-admin-storage-info]");
  const adminStatus = document.querySelector("[data-admin-status]");
  const adminClearDebugLogButton = document.querySelector("[data-admin-clear-debug-log]");
  const adminListUsersButton = document.querySelector("[data-admin-list-users]");
  const adminAnalyzeDiskButton = document.querySelector("[data-admin-analyze-disk]");
  const adminDiskUsage = document.querySelector("[data-admin-disk-usage]");
  const adminUserListSummary = document.querySelector("[data-admin-user-list-summary]");
  const adminUserListStatus = document.querySelector("[data-admin-user-list-status]");
  const adminUserListOutput = document.querySelector("[data-admin-user-list-output]");
  const locationStatusBlocks = Array.from(document.querySelectorAll("[data-location-status]"));
  const retryLocationButtons = Array.from(document.querySelectorAll("[data-retry-location]"));
  const remoteViewerForm = document.querySelector("[data-remote-viewer-form]");
  const remoteViewerOwnInput = document.querySelector("[data-remote-viewer-own]");
  const remoteViewerPartnerInput = document.querySelector("[data-remote-viewer-partner]");
  const remoteViewerGoButton = document.querySelector("[data-remote-viewer-go]");
  const remoteViewerOwnLabel = document.querySelector("[data-remote-viewer-own-label]");
  const remoteViewerPartnerLabel = document.querySelector("[data-remote-viewer-partner-label]");
  const remoteViewerDisplayDeviceCheckbox = document.querySelector("[data-remote-viewer-display-device]");
  let deferredInstallPrompt = null;
  let activeNameManagerOverlay = null;
  let activeToolsRole = "";
  let locationRequestInFlight = false;
  let lastLocationAttemptAt = 0;
  let difficultyDragging = false;
  let difficultyDragPointerId = null;
  let difficultyDragLockedLevel = null;
  let difficultyDragReleasedLevel = null;
  let activePairDifficultyCode = "";
  let activeHandleRole = "";
  let difficultyLoadToken = 0;
  let difficultyLabelToken = 0;
  let selectedReportPair = null;
  let availableReportPairs = [];
  let reportCsvRecordsCache = [];
  let reportCsvPathCache = "";
  const analysisStorageKey = "cones-results-analyzer-v1";
  let activeReportResize = null;
  let activeReportViewPan = null;
  let launcherAdminSecret = "";
  let resolvedMainUserType = "standard";
  let pendingUserTypeLookupToken = 0;
  let currentUserTypeAdminHandle = "";
  let userTypeLookupTimer = null;
  let pendingUserTypeSelection = "standard";
  let launcherAdminState = {
      debug_enabled: false,
      storage: null,
      debug_log: null,
      user_trial_summary: null,
      user_trial_summary_meta: null,
      disk_usage_analysis: null
    };
  const launcherBuildVersion = "20260617n";
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
        identifierStatusMap: typeof parsed?.identifierStatusMap === "object" && parsed.identifierStatusMap ? parsed.identifierStatusMap : {},
        themeColor: typeof parsed?.themeColor === "string" ? parsed.themeColor : defaultThemeColor,
        difficultyLevel: ["1", "2", "3"].includes(String(parsed?.difficultyLevel || "")) ? String(parsed.difficultyLevel) : "1",
        remoteViewerDisplayDevice: !!parsed?.remoteViewerDisplayDevice
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
        identifierStatusMap: {},
        themeColor: defaultThemeColor,
        difficultyLevel: "1",
        remoteViewerDisplayDevice: false
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
    const selectedPair = sanitizePairInfoForServer(pairInfo);
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "report_pair_csv_data",
        selected_pair: selectedPair,
        secret_candidate: launcherAdminSecret || ""
      })
    });

    const data = await parseApiResponse(response, `Pair report CSV request failed with status ${response.status}`);
    const reportCsv = data?.report_csv || {};
    return {
      available: !!reportCsv?.available,
      message: String(reportCsv?.message || ""),
      path: String(reportCsv?.path || ""),
      records: Array.isArray(reportCsv?.records) ? reportCsv.records : []
    };
  }

  async function fetchLauncherProfile(role, ownEmail) {
    const payload = sanitizeLauncherProfileForServer(role, ownEmail, {
      currentPartner: "",
      partnerHistory: [],
      deletedPartners: []
    });
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "get_launcher_profile",
        launcher_role: payload.launcher_role,
        own_email: payload.own_email
      })
    });

    const data = await parseApiResponse(response, `Launcher profile request failed with status ${response.status}`);
    return data?.launcher_profile || null;
  }

  async function fetchIdentifierStatus(identifier) {
    const cleanIdentifier = assertValidParticipantIdentifier(identifier, "identifier");
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "get_identifier_status",
        identifier: cleanIdentifier
      })
    });

    const data = await parseApiResponse(response, `Identifier lookup failed with status ${response.status}`);
    return data?.identifier_status || null;
  }

  async function fetchUserType(identifier) {
    const cleanIdentifier = assertValidParticipantIdentifier(identifier, "identifier");
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "get_user_type",
        identifier: cleanIdentifier
      })
    });

    const data = await parseApiResponse(response, `User-type lookup failed with status ${response.status}`);
    if (data?.identifier_status) {
      rememberIdentifierStatus(cleanIdentifier, data.identifier_status);
    }
    return String(data?.user_type || "standard").trim().toLowerCase() === "pro" ? "pro" : "standard";
  }

  async function assignUserType(userHandle, userType) {
    const cleanHandle = String(userHandle || "").trim();
    if (!isValidUniqueHandle(cleanHandle)) {
      throw new Error("User handle is invalid.");
    }
    const normalizedType = String(userType || "").trim().toLowerCase() === "pro" ? "pro" : "standard";
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "set_user_type",
        user_handle: cleanHandle,
        user_type: normalizedType,
        secret_candidate: launcherAdminSecret
      })
    });

    const data = await parseApiResponse(response, `User-type update failed with status ${response.status}`);
    if (data?.identifier_status) {
      rememberIdentifierStatus(cleanHandle, data.identifier_status);
    }
    return String(data?.user_type || normalizedType).trim().toLowerCase() === "pro" ? "pro" : "standard";
  }

  async function claimUniqueHandle(currentIdentifier, proposedHandle) {
    const cleanCurrentIdentifier = assertValidParticipantIdentifier(currentIdentifier, "current identifier", { required: false });
    const cleanHandle = String(proposedHandle || "").trim();
    if (!isValidUniqueHandle(cleanHandle)) {
      throw new Error("Unique handle must be 3 to 24 characters long and use only letters, numbers, period, underscore, or hyphen.");
    }

    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "claim_unique_handle",
        current_identifier: cleanCurrentIdentifier,
        proposed_handle: cleanHandle
      })
    });

    const data = await parseApiResponse(response, `Unique handle request failed with status ${response.status}`);
    return {
      claim: data?.unique_handle || null,
      status: data?.identifier_status || null
    };
  }

  async function saveLauncherProfile(role, ownEmail, profileState) {
    const payload = sanitizeLauncherProfileForServer(role, ownEmail, profileState);
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "save_launcher_profile",
        launcher_role: payload.launcher_role,
        own_email: payload.own_email,
        launcher_profile: payload.launcher_profile
      })
    });

    const data = await parseApiResponse(response, `Launcher profile save failed with status ${response.status}`);
    return data?.launcher_profile || null;
  }

  function uniqueNames(names) {
    const cleaned = names
      .map((name) => String(name || "").trim())
      .filter(Boolean);
    return [...new Set(cleaned)];
  }

  function isValidEmailAddress(value) {
    const text = String(value || "").trim();
    if (!text || text.length > 254) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  function isValidUniqueHandle(value) {
    const text = String(value || "").trim();
    return /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,22}[A-Za-z0-9])?$/.test(text);
  }

  function assertValidEmailIdentifier(value, fieldName, options = {}) {
    const required = options.required !== false;
    const text = String(value || "").trim();
    if (!text) {
      if (required) {
        throw new Error(`${fieldName} is required.`);
      }
      return "";
    }
    if (!isValidEmailAddress(text)) {
      throw new Error(`${fieldName} must be a valid email address.`);
    }
    return text;
  }

  function assertValidParticipantIdentifier(value, fieldName, options = {}) {
    const required = options.required !== false;
    const text = String(value || "").trim();
    if (!text) {
      if (required) {
        throw new Error(`${fieldName} is required.`);
      }
      return "";
    }
    if (text.length > 254) {
      throw new Error(`${fieldName} is too long.`);
    }
    if (!isValidEmailAddress(text) && !isValidUniqueHandle(text)) {
      throw new Error(`${fieldName} must be a valid email address or unique handle.`);
    }
    return text;
  }

  function assertValidSessionCode(value, fieldName = "session_code") {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    if (text.length > 200) {
      throw new Error(`${fieldName} is too long.`);
    }
    if (!/^[A-Za-z0-9_-]+$/.test(text)) {
      throw new Error(`${fieldName} contains invalid characters.`);
    }
    return text;
  }

  function sanitizePairInfoForServer(pairInfo, fieldName = "selected pair") {
    return {
      receiver_name: assertValidParticipantIdentifier(pairInfo?.receiverName, `${fieldName} receiver identifier`),
      sender_name: assertValidParticipantIdentifier(pairInfo?.senderName, `${fieldName} sender identifier`),
      session_code: assertValidSessionCode(pairInfo?.sessionCode, `${fieldName} session code`)
    };
  }

  function sanitizeLauncherProfileForServer(role, ownEmail, profileState) {
    const launcherRole = role === "sender" ? "sender" : role === "receiver" ? "receiver" : "";
    if (!launcherRole) {
      throw new Error("launcher_role must be sender or receiver.");
    }
    return {
      launcher_role: launcherRole,
      own_email: assertValidParticipantIdentifier(ownEmail, "own_email"),
      launcher_profile: {
        current_partner: assertValidParticipantIdentifier(profileState?.currentPartner, "launcher_profile.current_partner", { required: false }),
        partner_history: uniqueNames(Array.isArray(profileState?.partnerHistory) ? profileState.partnerHistory : []).map((item) =>
          assertValidParticipantIdentifier(item, "launcher_profile.partner_history item")
        ),
        deleted_partners: uniqueNames(Array.isArray(profileState?.deletedPartners) ? profileState.deletedPartners : []).map((item) =>
          assertValidParticipantIdentifier(item, "launcher_profile.deleted_partners item")
        )
      }
    };
  }

  async function parseApiResponse(response, fallbackMessage) {
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new Error(fallbackMessage || `Request failed with status ${response.status}`);
      }
      throw new Error("The server returned invalid JSON.");
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(String(data?.error || fallbackMessage || `Request failed with status ${response.status}`));
    }

    return data;
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

  function rememberIdentifierStatus(inputIdentifier, status, sourceState = null) {
    const normalizedInput = normalizeIdentifierForStorage(inputIdentifier);
    if (!normalizedInput || !status || typeof status !== "object") {
      return sourceState || readLauncherState();
    }

    const state = sourceState || readLauncherState();
    state.identifierStatusMap = typeof state.identifierStatusMap === "object" && state.identifierStatusMap
      ? state.identifierStatusMap
      : {};

    const normalizedStatus = {
      input_identifier: String(status.input_identifier || inputIdentifier || "").trim(),
      preferred_identifier: String(status.preferred_identifier || "").trim(),
      preferred_handle: String(status.preferred_handle || "").trim(),
      owner_identifier: String(status.owner_identifier || "").trim(),
      uses_handle: !!status.uses_handle,
      is_handle: !!status.is_handle,
      updated_at: Date.now()
    };

    const keys = uniqueNames([
      normalizedInput,
      normalizeIdentifierForStorage(normalizedStatus.input_identifier),
      normalizeIdentifierForStorage(normalizedStatus.preferred_identifier),
      normalizeIdentifierForStorage(normalizedStatus.preferred_handle),
      normalizeIdentifierForStorage(normalizedStatus.owner_identifier)
    ]);

    keys.forEach((key) => {
      if (key) {
        state.identifierStatusMap[key] = normalizedStatus;
      }
    });

    writeLauncherState(state);
    return state;
  }

  function getCachedIdentifierStatus(identifier, sourceState = null) {
    const key = normalizeIdentifierForStorage(identifier);
    if (!key) {
      return null;
    }
    const state = sourceState || readLauncherState();
    const map = typeof state.identifierStatusMap === "object" && state.identifierStatusMap
      ? state.identifierStatusMap
      : {};
    return map[key] || null;
  }

  function getPreferredIdentifier(identifier, sourceState = null) {
    const raw = String(identifier || "").trim();
    if (!raw) {
      return "";
    }
    const cached = getCachedIdentifierStatus(raw, sourceState);
    const preferred = String(cached?.preferred_identifier || "").trim();
    return preferred || raw;
  }

  function usesHandlePresentation(identifier, status = null) {
    const raw = String(identifier || "").trim();
    if (!raw) {
      return false;
    }

    if (isValidUniqueHandle(raw) && !isValidEmailAddress(raw)) {
      return true;
    }

    return !!status?.is_handle;
  }

  function getRoleIdentifierStatusElement(role) {
    return document.querySelector(`[data-role-identifier-status="${role}"]`);
  }

  function clearRoleIdentifierStatus(role) {
    const element = getRoleIdentifierStatusElement(role);
    if (!element) {
      return;
    }
    element.textContent = "";
    element.hidden = true;
  }

  function showRoleIdentifierStatus(role, message) {
    const element = getRoleIdentifierStatusElement(role);
    if (!element) {
      return;
    }
    element.textContent = String(message || "").trim();
    element.hidden = !element.textContent;
  }

  function replaceIdentifierValue(value, previousIdentifier, nextIdentifier) {
    const current = String(value || "").trim();
    if (!current) {
      return current;
    }
    return normalizeIdentifierForStorage(current) === normalizeIdentifierForStorage(previousIdentifier)
      ? nextIdentifier
      : current;
  }

  function replaceIdentifierList(items, previousIdentifier, nextIdentifier) {
    return uniqueNames(
      (Array.isArray(items) ? items : []).map((item) => replaceIdentifierValue(item, previousIdentifier, nextIdentifier))
    );
  }

  function propagateClaimedHandle(previousIdentifier, acceptedHandle) {
    const prior = String(previousIdentifier || "").trim();
    const next = String(acceptedHandle || "").trim();
    if (!prior || !next) {
      return;
    }

    migrateRuntimeSettingsIdentifier(prior, next);
    const state = readLauncherState();
    state.ownNames = state.ownNames || {};
    state.currentPartners = state.currentPartners || {};
    state.partnerHistory = state.partnerHistory || {};
    state.deletedPartners = state.deletedPartners || {};
    state.launcherProfiles = state.launcherProfiles || {};

    ["sender", "receiver"].forEach((role) => {
      state.ownNames[role] = replaceIdentifierValue(state.ownNames[role], prior, next);
      state.currentPartners[role] = replaceIdentifierValue(state.currentPartners[role], prior, next);
    });

    Object.keys(state.partnerHistory).forEach((key) => {
      state.partnerHistory[key] = replaceIdentifierList(state.partnerHistory[key], prior, next);
    });

    Object.keys(state.deletedPartners).forEach((key) => {
      state.deletedPartners[key] = uniqueNames([
        ...replaceIdentifierList(state.deletedPartners[key], prior, next),
        prior
      ]);
    });

    Object.keys(state.launcherProfiles).forEach((key) => {
      const profile = state.launcherProfiles[key];
      if (!profile || typeof profile !== "object") {
        return;
      }
      profile.currentPartner = replaceIdentifierValue(profile.currentPartner, prior, next);
      profile.partnerHistory = replaceIdentifierList(profile.partnerHistory, prior, next);
      profile.deletedPartners = uniqueNames([
        ...replaceIdentifierList(profile.deletedPartners, prior, next),
        prior
      ]);
    });

    writeLauncherState(state);

    roleCards.forEach((card) => {
      const form = card.querySelector("[data-role-form]");
      if (!form) {
        return;
      }
      const ownInput = form.querySelector('input[name="ownName"]');
      const partnerInput = form.querySelector('input[name="partnerName"]');
      if (ownInput && normalizeIdentifierForStorage(ownInput.value) === normalizeIdentifierForStorage(prior)) {
        ownInput.value = next;
      }
      if (partnerInput && normalizeIdentifierForStorage(partnerInput.value) === normalizeIdentifierForStorage(prior)) {
        partnerInput.value = next;
      }
      applyPartnerHistory(String(card.dataset.roleCard || ""), form, readLauncherState(), String(ownInput?.value || "").trim());
      void syncRoleIdentifierPresentation(String(card.dataset.roleCard || ""), form);
      void persistLauncherProfileForForm(String(card.dataset.roleCard || ""), form, readLauncherState());
    });
  }

  function propagatePartnerIdentifierMigration(previousIdentifier, nextIdentifier) {
    const prior = String(previousIdentifier || "").trim();
    const next = String(nextIdentifier || "").trim();
    if (!prior || !next) {
      return;
    }

    migrateRuntimeSettingsIdentifier(prior, next);
    const state = readLauncherState();
    state.currentPartners = state.currentPartners || {};
    state.partnerHistory = state.partnerHistory || {};
    state.deletedPartners = state.deletedPartners || {};
    state.launcherProfiles = state.launcherProfiles || {};

    ["sender", "receiver"].forEach((role) => {
      state.currentPartners[role] = replaceIdentifierValue(state.currentPartners[role], prior, next);
    });

    Object.keys(state.partnerHistory).forEach((key) => {
      state.partnerHistory[key] = replaceIdentifierList(state.partnerHistory[key], prior, next);
    });

    Object.keys(state.deletedPartners).forEach((key) => {
      state.deletedPartners[key] = uniqueNames([
        ...replaceIdentifierList(state.deletedPartners[key], prior, next),
        prior
      ]);
    });

    Object.keys(state.launcherProfiles).forEach((key) => {
      const profile = state.launcherProfiles[key];
      if (!profile || typeof profile !== "object") {
        return;
      }
      profile.currentPartner = replaceIdentifierValue(profile.currentPartner, prior, next);
      profile.partnerHistory = replaceIdentifierList(profile.partnerHistory, prior, next);
      profile.deletedPartners = uniqueNames([
        ...replaceIdentifierList(profile.deletedPartners, prior, next),
        prior
      ]);
    });

    writeLauncherState(state);

    roleCards.forEach((card) => {
      const role = String(card.dataset.roleCard || "");
      const form = card.querySelector("[data-role-form]");
      if (!role || !form) {
        return;
      }
      const ownInput = form.querySelector('input[name="ownName"]');
      const partnerInput = form.querySelector('input[name="partnerName"]');
      if (partnerInput && normalizeIdentifierForStorage(partnerInput.value) === normalizeIdentifierForStorage(prior)) {
        partnerInput.value = next;
      }
      applyPartnerHistory(role, form, readLauncherState(), String(ownInput?.value || "").trim());
      void syncRoleIdentifierPresentation(role, form);
      void persistLauncherProfileForForm(role, form, readLauncherState());
    });

    return readLauncherState();
  }

  function normalizeNameForSession(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function buildSessionCodeFromNames(ownName, partnerName) {
    const state = readLauncherState();
    const pair = [
      normalizeNameForSession(getPreferredIdentifier(ownName, state)),
      normalizeNameForSession(getPreferredIdentifier(partnerName, state))
    ]
      .filter(Boolean)
      .sort();
    return pair.length === 2 ? `${pair[0]}__${pair[1]}` : "";
  }

  function buildLauncherProfileKey(role, ownIdentifier) {
    const normalizedRole = role === "sender" ? "sender" : "receiver";
    const normalizedIdentifier = normalizeIdentifierForStorage(getPreferredIdentifier(ownIdentifier));
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

  function migrateRuntimeSettingsIdentifier(previousIdentifier, nextIdentifier) {
    const prior = String(previousIdentifier || "").trim();
    const next = String(nextIdentifier || "").trim();
    if (!prior || !next) {
      return;
    }

    ["sender", "receiver"].forEach((role) => {
      const current = readRuntimeSettings(role);
      const updates = {};
      let changed = false;

      if (normalizeIdentifierForStorage(current.own_email) === normalizeIdentifierForStorage(prior)) {
        updates.own_email = next;
        changed = true;
      }
      if (normalizeIdentifierForStorage(current.partner_email) === normalizeIdentifierForStorage(prior)) {
        updates.partner_email = next;
        changed = true;
      }

      if (changed) {
        writeRuntimeSettings(role, updates);
      }
    });
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

  function snapshotUserTypeAdminState() {
    return {
      input_value: String(userTypeHandleInput?.value || "").trim(),
      current_handle: currentUserTypeAdminHandle,
      pending_selection: pendingUserTypeSelection,
      status_text: String(userTypeStatus?.textContent || "").trim(),
      wrap_hidden: !!userTypeOptionsWrap?.hidden,
      save_hidden: !!userTypeSaveButton?.hidden,
      choices: userTypeChoiceButtons.map((button) => ({
        value: String(button.dataset.userTypeChoiceButton || ""),
        selected: button.classList.contains("is-selected"),
        aria_pressed: button.getAttribute("aria-pressed"),
        disabled: !!button.disabled
      }))
    };
  }

  function logUserTypeAdminDebug(label, extraDetails = []) {
    if (!launcherAdminSecret) {
      return;
    }
    const details = Array.isArray(extraDetails) ? extraDetails.slice(0) : [];
    details.unshift(snapshotUserTypeAdminState());
    void launcherAdminApi("log_debug", {
      label: `user_type_admin:${label}`,
      details
    }).catch(() => {
      // Ignore debug logging failures.
    });
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

  function getRoleLabelElements(role) {
    const form = document.querySelector(`[data-role-form="${role}"]`);
    return {
      form,
      ownLabel: document.querySelector(`[data-own-identifier-label="${role}"]`),
      partnerLabel: document.querySelector(`[data-partner-identifier-label="${role}"]`),
      note: document.querySelector(`[data-role-identifier-note="${role}"]`)
    };
  }

  function applyRoleIdentifierPresentation(role, options = {}) {
    const { ownUsesHandle = false, partnerUsesHandle = false } = options;
    const { ownLabel, partnerLabel, note } = getRoleLabelElements(role);
    if (ownLabel) {
      ownLabel.textContent = ownUsesHandle ? "Your unique handle:" : "Your email:";
    }
    if (partnerLabel) {
      if (partnerUsesHandle) {
        partnerLabel.textContent = role === "sender" ? "Unique Receiver's handle:" : "Unique Sender's handle:";
      } else {
        partnerLabel.textContent = role === "sender" ? "Receiver's email:" : "Sender's email:";
      }
    }
    if (note) {
      note.textContent = ownUsesHandle || partnerUsesHandle
        ? "These unique handles are used to uniquely identify participants. The app can connect only if both participants enter the same spellings. Please verify both Sender and Receiver unique identifiers carefully."
        : "No emails are sent. These email addresses are used only to uniquely identify participants. The app can connect only if both participants enter the same spellings. Please verify the email addresses carefully.";
    }
  }

  async function syncRoleIdentifierPresentation(role, form, options = {}) {
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    let migratedPartnerIdentifier = null;
    let ownUsesHandle = false;
    let partnerUsesHandle = false;

    const ownValue = String(ownInput?.value || "").trim();
    if (ownValue) {
      try {
        const ownStatus = await fetchIdentifierStatus(ownValue);
        rememberIdentifierStatus(ownValue, ownStatus);
        ownUsesHandle = usesHandlePresentation(ownValue, ownStatus);
      } catch (error) {
        ownUsesHandle = isValidUniqueHandle(ownValue) && !isValidEmailAddress(ownValue);
      }
    }

    const partnerValue = String(partnerInput?.value || "").trim();
    if (partnerValue) {
      try {
        const partnerStatus = await fetchIdentifierStatus(partnerValue);
        rememberIdentifierStatus(partnerValue, partnerStatus);
        const preferredPartner = String(partnerStatus?.preferred_identifier || "").trim();
        if (preferredPartner && normalizeIdentifierForStorage(preferredPartner) !== normalizeIdentifierForStorage(partnerValue)) {
          migratedPartnerIdentifier = {
            previous: partnerValue,
            next: preferredPartner
          };
          if (partnerInput) {
            partnerInput.value = preferredPartner;
          }
          propagatePartnerIdentifierMigration(partnerValue, preferredPartner);
        }
        partnerUsesHandle = usesHandlePresentation(preferredPartner || partnerValue, partnerStatus);
      } catch (error) {
        partnerUsesHandle = isValidUniqueHandle(partnerValue) && !isValidEmailAddress(partnerValue);
      }
    }

    applyRoleIdentifierPresentation(role, { ownUsesHandle, partnerUsesHandle, ...options });

    if (migratedPartnerIdentifier) {
      showRoleIdentifierStatus(role, `Your partner now uses unique handle: ${migratedPartnerIdentifier.next}.`);
      void persistLauncherProfileForForm(role, form);
    } else {
      clearRoleIdentifierStatus(role);
    }
  }

  function openHandleOverlay(role) {
    activeHandleRole = role === "sender" || role === "receiver" ? role : "";
    if (!activeHandleRole) {
      return;
    }
    if (handleStatus) {
      handleStatus.textContent = "";
    }
    if (handleInput) {
      handleInput.value = "";
    }
    handleOverlay?.classList.remove("beginner-view-hidden");
    handleInput?.focus();
  }

  function closeHandleOverlay() {
    activeHandleRole = "";
    handleOverlay?.classList.add("beginner-view-hidden");
    if (handleStatus) {
      handleStatus.textContent = "";
    }
  }

  async function submitUniqueHandle() {
    if (!activeHandleRole) {
      closeHandleOverlay();
      return;
    }
    const form = document.querySelector(`[data-role-form="${activeHandleRole}"]`);
    if (!form) {
      closeHandleOverlay();
      return;
    }
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const currentIdentifier = String(ownInput?.value || "").trim();
    const proposedHandle = String(handleInput?.value || "").trim();

    if (handleStatus) {
      handleStatus.textContent = "Checking unique handle...";
    }

    try {
      const result = await claimUniqueHandle(currentIdentifier, proposedHandle);
      const acceptedHandle = String(result?.claim?.handle || proposedHandle).trim();
      if (result?.status) {
        rememberIdentifierStatus(currentIdentifier || acceptedHandle, result.status);
      }
      if (currentIdentifier && acceptedHandle) {
        propagateClaimedHandle(currentIdentifier, acceptedHandle);
      }
      if (ownInput && acceptedHandle) {
        ownInput.value = acceptedHandle;
      }
      await syncRoleIdentifierPresentation(activeHandleRole, form);
      if (partnerInput?.value.trim()) {
        await syncRoleIdentifierPresentation(activeHandleRole, form);
      }
      void persistLauncherProfileForForm(activeHandleRole, form);
      void refreshMainUserType();
      closeHandleOverlay();
    } catch (error) {
      if (handleStatus) {
        handleStatus.textContent = error instanceof Error ? error.message : "Unable to accept that unique handle right now.";
      }
    }
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

  function renderMainTitle(userType = resolvedMainUserType) {
    if (!beginnerMainTitle) {
      return;
    }
    resolvedMainUserType = userType === "pro" ? "pro" : "standard";
    beginnerMainTitle.textContent = resolvedMainUserType === "pro" ? "Telepathy Beginner PRO" : "Telepathy Beginner";
    if (proHeroFrame) {
      proHeroFrame.hidden = resolvedMainUserType !== "pro";
    }
    renderLauncherIntroCopy();
    renderProOnlyLauncherCards();
  }

  function renderLauncherIntroCopy() {
    if (launcherSubtitle) {
      launcherSubtitle.textContent = resolvedMainUserType === "pro"
        ? "A training app for psi sensitivity development."
        : "A sender-receiver training app for telepathic development.";
    }
    if (launcherCopy) {
      launcherCopy.textContent = resolvedMainUserType === "pro"
        ? "Choose whether you will be sender, receiver, or remote viewer for this session."
        : "Choose whether you will act as the sender or the receiver for this session.";
    }
  }

  function renderProOnlyLauncherCards() {
    const showProCards = resolvedMainUserType === "pro";
    proOnlyRoleCards.forEach((card) => {
      card.hidden = !showProCards;
      if (!showProCards) {
        card.classList.remove("active", "role-card-hidden");
        const toggle = card.querySelector(".role-card-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      }
    });
    if (!showProCards) {
      rolePanels?.classList.remove("role-panels-single");
    }
  }

  function getFallbackOwnIdentifierForRemoteViewer() {
    const state = readLauncherState();
    return uniqueNames([
      String(state.ownNames?.["remote-viewer"] || "").trim(),
      String(state.ownNames?.sender || "").trim(),
      String(state.ownNames?.receiver || "").trim(),
      readRoleFormValues("sender").ownName,
      readRoleFormValues("receiver").ownName,
      readRoleSettings("sender").ownName,
      readRoleSettings("receiver").ownName
    ])[0] || "";
  }

  function renderRemoteViewerCard() {
    if (!remoteViewerOwnInput || !remoteViewerPartnerInput) {
      return;
    }
    const state = readLauncherState();
    remoteViewerOwnInput.value = String(state.ownNames?.["remote-viewer"] || "").trim() || getFallbackOwnIdentifierForRemoteViewer();
    remoteViewerPartnerInput.value = String(state.currentPartners?.["remote-viewer"] || "").trim() || readRoleSettings("remote-viewer").partnerName || "";
    if (remoteViewerDisplayDeviceCheckbox) {
      remoteViewerDisplayDeviceCheckbox.checked = !!state.remoteViewerDisplayDevice;
    }
    renderRemoteViewerLabels(!!state.remoteViewerDisplayDevice);
  }

  function persistRemoteViewerCardState() {
    if (!remoteViewerOwnInput || !remoteViewerPartnerInput) {
      return;
    }
    const latest = readLauncherState();
    latest.ownNames = latest.ownNames || {};
    latest.currentPartners = latest.currentPartners || {};
    latest.ownNames["remote-viewer"] = String(remoteViewerOwnInput.value || "").trim();
    latest.currentPartners["remote-viewer"] = String(remoteViewerPartnerInput.value || "").trim();
    latest.remoteViewerDisplayDevice = !!remoteViewerDisplayDeviceCheckbox?.checked;
    writeLauncherState(latest);
  }

  function renderRemoteViewerLabels(isDisplayDevice = false) {
    if (remoteViewerOwnLabel) {
      remoteViewerOwnLabel.textContent = isDisplayDevice ? "This unique device handle:" : "Your unique handle:";
    }
    if (remoteViewerPartnerLabel) {
      remoteViewerPartnerLabel.textContent = isDisplayDevice ? "Unique remote viewer handle:" : "Unique Remote Device handle:";
    }
  }

  async function refreshMainUserType() {
    const lookupToken = ++pendingUserTypeLookupToken;
    const candidates = uniqueNames([
      readRoleFormValues("sender").ownName,
      readRoleFormValues("receiver").ownName,
      readRoleSettings("sender").ownName,
      readRoleSettings("receiver").ownName,
      String(readLauncherState().ownNames?.sender || "").trim(),
      String(readLauncherState().ownNames?.receiver || "").trim()
    ]);

    if (!candidates.length) {
      renderMainTitle("standard");
      return;
    }

    for (const identifier of candidates) {
      if (!identifier) {
        continue;
      }
      try {
        const userType = await fetchUserType(identifier);
        if (lookupToken !== pendingUserTypeLookupToken) {
          return;
        }
        if (userType === "pro") {
          renderMainTitle("pro");
          return;
        }
      } catch (error) {
        // Ignore lookup errors and continue trying other identifiers.
      }
    }

    if (lookupToken === pendingUserTypeLookupToken) {
      renderMainTitle("standard");
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
    const rawNames = [
      readRoleFormValues("sender").ownName,
      readRoleFormValues("receiver").ownName,
      readRoleSettings("sender").ownName,
      readRoleSettings("receiver").ownName,
      String(state.ownNames?.sender || "").trim(),
      String(state.ownNames?.receiver || "").trim()
    ];

    return uniqueNames([
      ...rawNames,
      ...rawNames.map((name) => getPreferredIdentifier(name, state))
    ]);
  }

  function collectReportCandidatePairs() {
    const candidates = [];
    const seen = new Set();
    const state = readLauncherState();

    const addCandidate = (receiverName, senderName) => {
      const receiver = getPreferredIdentifier(String(receiverName || "").trim(), state);
      const sender = getPreferredIdentifier(String(senderName || "").trim(), state);
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
    if (reportAnalyzeButton) {
      reportAnalyzeButton.hidden = !selectedReportPair;
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
    const scoredTrials = getReportSummaryStats(records).totalTrials;
    reportStatus.textContent = `${scoredTrials} trial record${scoredTrials === 1 ? "" : "s"} found for this pair.`;
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

  function formatProbabilityPercent(value) {
    if (!Number.isFinite(value)) {
      return "unknown";
    }
    const percentValue = value * 100;
    if (percentValue < 0.01) {
      return "< 0.01%";
    }
    return `${percentValue.toFixed(2)}%`;
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
    const trialAborted = String(record?.["trial aborted"] ?? "").trim().toLowerCase() === "yes";
    const trialTimedOut = String(record?.["trial timed out"] ?? "").trim().toLowerCase() === "yes";
    if (trialAborted || trialTimedOut) {
      return {
        observed: Number.NaN,
        expected: Number.NaN,
        variance: Number.NaN,
        level: 0
      };
    }

    const difficultyLevel = String(record?.["difficulty level"] ?? "").trim();
    const sentLayout = Number(String(record?.["sent layout"] ?? "").trim());
    const choiceOneRaw = String(record?.["rx choice1"] ?? "").trim();
    if (!choiceOneRaw) {
      return {
        observed: Number.NaN,
        expected: Number.NaN,
        variance: Number.NaN,
        level: 0
      };
    }
    const choiceOne = Number(choiceOneRaw);
    const sentConeCount = getLayoutConeCount(sentLayout);
    const chosenConeCount = getLayoutConeCount(choiceOne);
    const exactMatch = sentLayout === choiceOne;
    const countMatch = sentConeCount > 0 && sentConeCount === chosenConeCount;

    if (difficultyLevel === "1") {
      const choseOne = choiceOneRaw === "1";
      const choseMany = choiceOneRaw === "3";
      const observed =
        (sentConeCount === 1 && choseOne) ||
        (sentConeCount === 3 && choseMany)
          ? 1
          : 0;
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

  function buildReportSummaryLines(summaryStats) {
    const telepathicSignificance = getTelepathicSignificancePValue(summaryStats);
    return [
      `Summary: Total trials = ${summaryStats.totalTrials}, Chance score = ${formatScoreValue(summaryStats.chanceScore)}, Your score = ${formatScoreValue(summaryStats.yourScore)}, Telepathic significance, P = ${formatProbabilityValue(telepathicSignificance)}.`,
      `The probability that you would get this high a score by chance alone is ${formatProbabilityPercent(telepathicSignificance)}.`
    ];
  }

  function readSavedAnalyses() {
    try {
      const raw = localStorage.getItem(analysisStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeSavedAnalyses(next) {
    localStorage.setItem(analysisStorageKey, JSON.stringify(next));
  }

  function saveAnalysisLocally(pairInfo, analysis) {
    if (!pairInfo?.key) {
      return;
    }
    const saved = readSavedAnalyses();
    saved[pairInfo.key] = analysis;
    writeSavedAnalyses(saved);
  }

  async function saveAnalysisToServer(pairInfo, analysis) {
    const selectedPair = sanitizePairInfoForServer(pairInfo);
    if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) {
      throw new Error("analysis must be an object.");
    }
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "save_pair_analysis",
        selected_pair: selectedPair,
        analysis
      })
    });

    const data = await parseApiResponse(response, `Save analysis request failed with status ${response.status}`);
    return data?.pair_analysis || null;
  }

  function computePearsonCorrelation(items) {
    const pairs = items
      .map((item) => [Number(item?.x), Number(item?.y)])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

    if (pairs.length < 3) {
      return Number.NaN;
    }

    const n = pairs.length;
    const sumX = pairs.reduce((total, [x]) => total + x, 0);
    const sumY = pairs.reduce((total, [, y]) => total + y, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = pairs.reduce((total, [x, y]) => total + ((x - meanX) * (y - meanY)), 0);
    const varianceX = pairs.reduce((total, [x]) => total + ((x - meanX) ** 2), 0);
    const varianceY = pairs.reduce((total, [, y]) => total + ((y - meanY) ** 2), 0);
    const denominator = Math.sqrt(varianceX * varianceY);
    return denominator > 0 ? numerator / denominator : Number.NaN;
  }

  function summarizeCorrelation(value, positiveMeaning, negativeMeaning) {
    if (!Number.isFinite(value)) {
      return "not enough data";
    }
    if (value >= 0.4) {
      return positiveMeaning;
    }
    if (value <= -0.4) {
      return negativeMeaning;
    }
    return "no strong relationship";
  }

  function computeLocationSpreadMeters(locations) {
    const valid = locations.filter(Boolean);
    if (valid.length < 2) {
      return 0;
    }
    const centroid = {
      latitude: valid.reduce((total, item) => total + item.latitude, 0) / valid.length,
      longitude: valid.reduce((total, item) => total + item.longitude, 0) / valid.length
    };
    return valid.reduce((max, item) => Math.max(max, haversineDistanceMeters(centroid, item)), 0);
  }

  function getScoredRecords(records) {
    return records.filter((record) => {
      const model = getTrialScoreModel(record);
      return Number.isFinite(model.observed) && Number.isFinite(model.expected) && Number.isFinite(model.variance);
    });
  }

  function buildLevelBreakdown(records) {
    const levels = new Map([
      [1, { completed_trials: 0, score: 0, chance_score: 0 }],
      [2, { completed_trials: 0, score: 0, chance_score: 0 }],
      [3, { completed_trials: 0, score: 0, chance_score: 0 }]
    ]);

    records.forEach((record) => {
      const model = getTrialScoreModel(record);
      if (!Number.isFinite(model.observed) || !Number.isFinite(model.expected) || !levels.has(model.level)) {
        return;
      }
      const entry = levels.get(model.level);
      entry.completed_trials += 1;
      entry.score += model.observed;
      entry.chance_score += model.expected;
    });

    return Object.fromEntries(
      [...levels.entries()].map(([level, entry]) => [
        `level_${level}`,
        {
          completed_trials: entry.completed_trials,
          score: Number(entry.score.toFixed(3)),
          chance_score: Number(entry.chance_score.toFixed(3)),
          excess_over_chance: Number((entry.score - entry.chance_score).toFixed(3))
        }
      ])
    );
  }

  function getInterpretationHeadline(summaryStats) {
    const pValue = getTelepathicSignificancePValue(summaryStats);
    const totalTrials = Number(summaryStats?.totalTrials || 0);
    if (!Number.isFinite(pValue) || totalTrials < 1) {
      return "Not enough completed trials are available for interpretation.";
    }
    if (pValue < 0.01 && totalTrials >= 20) {
      return "This pair shows a statistically strong and potentially convincing above-chance result.";
    }
    if (pValue < 0.01) {
      return "This pair shows a statistically strong result, but the completed trial count is still low.";
    }
    if (pValue < 0.05) {
      return "This pair shows a suggestive result, but not yet a convincing one.";
    }
    return "This pair does not currently show evidence beyond what could easily occur by chance.";
  }

  function getInterpretationRecommendation(summaryStats) {
    const pValue = getTelepathicSignificancePValue(summaryStats);
    const totalTrials = Number(summaryStats?.totalTrials || 0);
    if (!Number.isFinite(pValue) || totalTrials < 1) {
      return "Collect more completed trials before drawing a conclusion.";
    }
    if (pValue < 0.01 && totalTrials >= 20) {
      return "Maintain similar test conditions and continue collecting completed trials to see whether the effect replicates across additional sessions.";
    }
    if (pValue < 0.01) {
      return "A result stronger than P = 0.01 over at least 20 completed trials would generally be considered convincing.";
    }
    return "Continue collecting completed trials and look for stable performance over a larger block.";
  }

  function buildResultsAnalysis(pairInfo, records, sourcePath = "") {
    const rawTrialCount = records.length;
    const scoredRecords = getScoredRecords(records);
    const summaryStats = getReportSummaryStats(records);
    const pValue = getTelepathicSignificancePValue(summaryStats);
    const abortedTrials = records.filter((record) => String(record?.["trial aborted"] ?? "").trim().toLowerCase() === "yes").length;
    const timedOutTrials = records.filter((record) => String(record?.["trial timed out"] ?? "").trim().toLowerCase() === "yes").length;
    const completedTrials = summaryStats.totalTrials;
    const confidenceValues = scoredRecords
      .map((record) => Number(String(record?.confidence ?? "").trim()))
      .filter((value) => Number.isFinite(value));
    const averageConfidence = confidenceValues.length
      ? confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length
      : Number.NaN;
    const scoredModels = scoredRecords.map((record) => ({ record, model: getTrialScoreModel(record) }));
    const confidenceCorrelation = computePearsonCorrelation(
      scoredModels.map(({ record, model }) => ({
        x: Number(String(record?.confidence ?? "").trim()),
        y: model.observed - model.expected
      }))
    );
    const reactionTimesMs = scoredRecords
      .map((record) => Number(String(record?.["rx done rt"] ?? "").trim()))
      .filter((value) => Number.isFinite(value));
    const averageReactionMs = reactionTimesMs.length
      ? reactionTimesMs.reduce((total, value) => total + value, 0) / reactionTimesMs.length
      : Number.NaN;
    const timeCorrelation = computePearsonCorrelation(
      scoredModels.map(({ record, model }) => ({
        x: Number(String(record?.["rx done rt"] ?? "").trim()),
        y: model.observed - model.expected
      }))
    );
    const distanceSamples = scoredRecords
      .map((record) => {
        const rx = parseLocationValue(record?.["rx location"] ?? "");
        const tx = parseLocationValue(record?.["tx location"] ?? "");
        return rx && tx ? haversineDistanceMeters(rx, tx) : Number.NaN;
      })
      .filter((value) => Number.isFinite(value));
    const averageDistanceMeters = distanceSamples.length
      ? distanceSamples.reduce((total, value) => total + value, 0) / distanceSamples.length
      : Number.NaN;
    const receiverLocations = scoredRecords.map((record) => parseLocationValue(record?.["rx location"] ?? "")).filter(Boolean);
    const senderLocations = scoredRecords.map((record) => parseLocationValue(record?.["tx location"] ?? "")).filter(Boolean);
    const receiverSpreadMeters = computeLocationSpreadMeters(receiverLocations);
    const senderSpreadMeters = computeLocationSpreadMeters(senderLocations);
    const firstHalfRecords = scoredRecords.slice(0, Math.ceil(scoredRecords.length / 2));
    const secondHalfRecords = scoredRecords.slice(Math.ceil(scoredRecords.length / 2));
    const firstHalfStats = getReportSummaryStats(firstHalfRecords);
    const secondHalfStats = getReportSummaryStats(secondHalfRecords);
    const firstHalfExcess = firstHalfStats.yourScore - firstHalfStats.chanceScore;
    const secondHalfExcess = secondHalfStats.yourScore - secondHalfStats.chanceScore;

    const analysis = {
      analysis_version: "1",
      app_version: launcherBuildVersion,
      generated_at_utc: new Date().toISOString(),
      pair: {
        receiver_name: String(pairInfo?.receiverName || ""),
        sender_name: String(pairInfo?.senderName || ""),
        session_code: String(pairInfo?.sessionCode || "")
      },
      source_csv_path: sourcePath,
      metrics: {
        raw_trial_count: rawTrialCount,
        completed_trial_count: completedTrials,
        aborted_trial_count: abortedTrials,
        timed_out_trial_count: timedOutTrials,
        score_total: Number(summaryStats.yourScore.toFixed(3)),
        chance_score: Number(summaryStats.chanceScore.toFixed(3)),
        excess_over_chance: Number((summaryStats.yourScore - summaryStats.chanceScore).toFixed(3)),
        telepathic_significance_p: Number.isFinite(pValue) ? Number(pValue.toPrecision(6)) : null,
        average_confidence: Number.isFinite(averageConfidence) ? Number(averageConfidence.toFixed(2)) : null,
        confidence_vs_score_correlation: Number.isFinite(confidenceCorrelation) ? Number(confidenceCorrelation.toFixed(3)) : null,
        average_reaction_time_seconds: Number.isFinite(averageReactionMs) ? Number((averageReactionMs / 1000).toFixed(2)) : null,
        reaction_time_vs_score_correlation: Number.isFinite(timeCorrelation) ? Number(timeCorrelation.toFixed(3)) : null,
        average_distance_meters: Number.isFinite(averageDistanceMeters) ? Number(averageDistanceMeters.toFixed(1)) : null,
        receiver_location_spread_meters: Number(receiverSpreadMeters.toFixed(1)),
        sender_location_spread_meters: Number(senderSpreadMeters.toFixed(1)),
        first_half_excess_over_chance: Number(firstHalfExcess.toFixed(3)),
        second_half_excess_over_chance: Number(secondHalfExcess.toFixed(3)),
        level_breakdown: buildLevelBreakdown(scoredRecords)
      },
      messages: {
        headline: getInterpretationHeadline(summaryStats),
        recommendation: getInterpretationRecommendation(summaryStats),
        confidence_relationship: summarizeCorrelation(
          confidenceCorrelation,
          "higher confidence tends to accompany better-than-chance scoring",
          "higher confidence tends to accompany weaker scoring"
        ),
        time_relationship: summarizeCorrelation(
          timeCorrelation,
          "longer response times tend to accompany better-than-chance scoring",
          "faster response times tend to accompany better-than-chance scoring"
        ),
        location_note:
          receiverSpreadMeters > 50 || senderSpreadMeters > 50
            ? "testing locations varied across the completed trials"
            : "testing locations appear fairly stable across the completed trials"
      }
    };

    const continuityLines = [
      "RESULTS ANALYZER CONTINUITY TEXT",
      `App version: ${launcherBuildVersion}`,
      `Generated at UTC: ${analysis.generated_at_utc}`,
      `Receiver-sender pair: ${analysis.pair.receiver_name} - ${analysis.pair.sender_name}`,
      `Session code: ${analysis.pair.session_code}`,
      sourcePath ? `Source CSV path: ${sourcePath}` : "Source CSV path: unknown",
      "",
      "DATASET SUMMARY",
      `Raw trial records: ${rawTrialCount}`,
      `Completed scored trials: ${completedTrials}`,
      `Aborted trials: ${abortedTrials}`,
      `Timed-out trials: ${timedOutTrials}`,
      "",
      "STATISTICAL RESULTS",
      `Chance score: ${formatScoreValue(summaryStats.chanceScore)}`,
      `Your score: ${formatScoreValue(summaryStats.yourScore)}`,
      `Excess over chance: ${formatScoreValue(summaryStats.yourScore - summaryStats.chanceScore)}`,
      `Telepathic significance P: ${formatProbabilityValue(pValue)}`,
      "",
      "LEVEL BREAKDOWN",
      ...Object.entries(analysis.metrics.level_breakdown).map(([level, entry]) =>
        `${level}: completed trials = ${entry.completed_trials}, score = ${formatScoreValue(entry.score)}, chance score = ${formatScoreValue(entry.chance_score)}, excess = ${formatScoreValue(entry.excess_over_chance)}`
      ),
      "",
      "ADDITIONAL METRICS",
      `Average confidence: ${Number.isFinite(averageConfidence) ? averageConfidence.toFixed(2) : "unknown"}`,
      `Confidence relationship: ${analysis.messages.confidence_relationship}`,
      `Average response time: ${Number.isFinite(averageReactionMs) ? `${(averageReactionMs / 1000).toFixed(2)} seconds` : "unknown"}`,
      `Reaction-time relationship: ${analysis.messages.time_relationship}`,
      `Average sender-receiver distance: ${Number.isFinite(averageDistanceMeters) ? formatDistanceWithUnit(averageDistanceMeters, averageDistanceMeters >= 1609.344 ? "miles" : "meters") : "unknown"}`,
      `Receiver location spread: ${formatDistanceWithUnit(receiverSpreadMeters || 0, receiverSpreadMeters >= 1609.344 ? "miles" : "meters")}`,
      `Sender location spread: ${formatDistanceWithUnit(senderSpreadMeters || 0, senderSpreadMeters >= 1609.344 ? "miles" : "meters")}`,
      `Location note: ${analysis.messages.location_note}`,
      `First-half excess over chance: ${formatScoreValue(firstHalfExcess)}`,
      `Second-half excess over chance: ${formatScoreValue(secondHalfExcess)}`,
      "",
      "STATIC INTERPRETATION",
      analysis.messages.headline,
      analysis.messages.recommendation,
      "",
      "REQUEST TO AI",
      "Please analyze this receiver-sender pair using the structured information above. Pay attention to score, chance score, telepathic significance P, confidence, time-to-respond, distance, location stability, first-half versus second-half performance, and whether the result appears stable or bursty."
    ];

    return {
      ...analysis,
      continuity_text: continuityLines.join("\n")
    };
  }

  function formatAnalysisDisplay(analysis) {
    const metrics = analysis?.metrics || {};
    const messages = analysis?.messages || {};
    return [
      `Headline: ${messages.headline || "unknown"}`,
      `Recommendation: ${messages.recommendation || "unknown"}`,
      "",
      `Raw trials: ${metrics.raw_trial_count ?? 0}`,
      `Completed scored trials: ${metrics.completed_trial_count ?? 0}`,
      `Aborted trials: ${metrics.aborted_trial_count ?? 0}`,
      `Timed-out trials: ${metrics.timed_out_trial_count ?? 0}`,
      "",
      `Chance score: ${formatScoreValue(metrics.chance_score)}`,
      `Your score: ${formatScoreValue(metrics.score_total)}`,
      `Excess over chance: ${formatScoreValue(metrics.excess_over_chance)}`,
      `Telepathic significance, P: ${formatProbabilityValue(metrics.telepathic_significance_p)}`,
      "",
      `Average confidence: ${metrics.average_confidence ?? "unknown"}`,
      `Confidence relationship: ${messages.confidence_relationship || "unknown"}`,
      `Average response time (seconds): ${metrics.average_reaction_time_seconds ?? "unknown"}`,
      `Reaction-time relationship: ${messages.time_relationship || "unknown"}`,
      `Average sender-receiver distance: ${Number.isFinite(metrics.average_distance_meters) ? formatDistanceWithUnit(metrics.average_distance_meters, metrics.average_distance_meters >= 1609.344 ? "miles" : "meters") : "unknown"}`,
      `Receiver location spread: ${Number.isFinite(metrics.receiver_location_spread_meters) ? formatDistanceWithUnit(metrics.receiver_location_spread_meters, metrics.receiver_location_spread_meters >= 1609.344 ? "miles" : "meters") : "unknown"}`,
      `Sender location spread: ${Number.isFinite(metrics.sender_location_spread_meters) ? formatDistanceWithUnit(metrics.sender_location_spread_meters, metrics.sender_location_spread_meters >= 1609.344 ? "miles" : "meters") : "unknown"}`,
      `Location note: ${messages.location_note || "unknown"}`,
      `First-half excess over chance: ${formatScoreValue(metrics.first_half_excess_over_chance)}`,
      `Second-half excess over chance: ${formatScoreValue(metrics.second_half_excess_over_chance)}`
    ].join("\n");
  }

  function buildAiInterpretation(summaryStats) {
    const pValue = getTelepathicSignificancePValue(summaryStats);
    const totalTrials = Number(summaryStats?.totalTrials || 0);
    if (!Number.isFinite(pValue) || totalTrials < 1) {
      return "AI Interpretation: There are not enough completed scored trials yet to interpret these results.";
    }

    if (pValue < 0.01 && totalTrials >= 20) {
      return "AI Interpretation: This is a statistically significant result and, because it is based on at least 20 completed trials, it would generally be considered convincing.";
    }

    if (pValue < 0.01 && totalTrials < 20) {
      return "AI Interpretation: This is a very significant result, but the number of completed trials is still low, so it is not yet very convincing. A score better than P = 0.01 over at least 20 completed trials would generally be considered convincing.";
    }

    if (pValue < 0.05) {
      return "AI Interpretation: This is a suggestive result, but it is not yet strong enough to be considered convincing. More completed trials would be needed.";
    }

    return "AI Interpretation: At present, these results are within the range that could easily occur by chance alone. More completed trials would be needed before drawing a strong conclusion.";
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
    const [summaryText, probabilityText] = buildReportSummaryLines(summaryStats);
    summaryCell.textContent = summaryText;
    summaryRow.appendChild(summaryCell);
    tfoot.appendChild(summaryRow);

    const probabilityRow = document.createElement("tr");
    const probabilityCell = document.createElement("td");
    probabilityCell.colSpan = headers.length;
    probabilityCell.className = "report-table-summary-cell";
    probabilityCell.textContent = probabilityText;
    probabilityRow.appendChild(probabilityCell);
    tfoot.appendChild(probabilityRow);

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

    if (!series.length) {
      visualizationStatus.textContent = "No scoreable trials are available for visualization.";
      return;
    }

    const summaryStats = getReportSummaryStats(records);
    const [summaryText, probabilityText] = buildReportSummaryLines(summaryStats);
    const summaryLine = document.createElement("p");
    summaryLine.className = "report-summary-line";
    summaryLine.textContent = summaryText;
    visualizationSummary.append(summaryLine);

    const probabilityLine = document.createElement("p");
    probabilityLine.className = "report-summary-line";
    probabilityLine.textContent = probabilityText;
    visualizationSummary.append(probabilityLine);

    const interpretationLine = document.createElement("p");
    interpretationLine.className = "report-summary-line";
    interpretationLine.textContent = buildAiInterpretation(summaryStats);
    visualizationSummary.append(interpretationLine);

    visualizationStatus.textContent = `${series.length} completed trial record${series.length === 1 ? "" : "s"} found.`;
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

  async function renderResultsAnalysis(pairInfo = selectedReportPair) {
    if (!analyzerSummary || !analyzerStatus || !analyzerOutput || !analyzerText) {
      return;
    }

    analyzerSummary.replaceChildren();
    analyzerStatus.textContent = "";
    analyzerOutput.textContent = "";
    analyzerText.value = "";

    if (!pairInfo?.sessionCode) {
      analyzerStatus.textContent = "Choose a receiver-sender pair in Performance Report first, then open Analyze Results again.";
      return;
    }

    let csvResult = {
      available: false,
      message: "",
      path: "",
      records: []
    };

    try {
      csvResult = await fetchSelectedPairReportCsvData(pairInfo);
    } catch (error) {
      analyzerStatus.textContent = "Unable to load the server trial history right now.";
      return;
    }

    const records = getRecordsForReportPair(csvResult.records || [], pairInfo);
    if (!records.length) {
      analyzerStatus.textContent = csvResult.available
        ? "No trial records found for the current receiver-sender selection."
        : (csvResult.message || "No server-side trial history is available right now.");
      return;
    }

    const analysis = buildResultsAnalysis(pairInfo, records, csvResult.path || reportCsvPathCache || "");
    saveAnalysisLocally(pairInfo, analysis);

    const titleLine = document.createElement("p");
    titleLine.className = "report-summary-line";
    titleLine.textContent = `Receiver-sender pair: ${pairInfo.receiverName || "unknown"} - ${pairInfo.senderName || "unknown"}.`;
    analyzerSummary.append(titleLine);

    const headlineLine = document.createElement("p");
    headlineLine.className = "report-summary-line";
    headlineLine.textContent = analysis.messages.headline;
    analyzerSummary.append(headlineLine);

    analyzerStatus.textContent = `${analysis.metrics.completed_trial_count} completed trial record${analysis.metrics.completed_trial_count === 1 ? "" : "s"} analyzed.`;
    analyzerOutput.textContent = formatAnalysisDisplay(analysis);
    analyzerText.value = analysis.continuity_text;

    try {
      const saveResult = await saveAnalysisToServer(pairInfo, analysis);
      if (saveResult?.saved) {
        analyzerStatus.textContent += ` Analysis JSON saved locally and on the server.`;
      } else if (saveResult?.message) {
        analyzerStatus.textContent += ` ${saveResult.message}`;
      }
    } catch (error) {
      analyzerStatus.textContent += " Analysis JSON saved locally, but the server copy could not be updated right now.";
    }
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
    const runtimeVersion = launcherBuildVersion;
    const target = role === "sender" ? "sender.html" : "receiver.html";
    const params = new URLSearchParams();
    const state = readLauncherState();
    const canonicalOwnName = getPreferredIdentifier(ownName, state);
    const canonicalPartnerName = getPreferredIdentifier(exactPartnerName, state);
    params.set("v", runtimeVersion);
    params.set("prefill", "1");
    params.set("own_email", canonicalOwnName);
    params.set("partner_email", canonicalPartnerName);
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
      return {
        text: `Device location: confirmed | Accuracy: about ${accuracy || "?"} meters`,
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
    ].map((name) => getPreferredIdentifier(name, state)))
      .filter((name) => !deleted.has(normalizeIdentifierForStorage(name)));
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
    const ownIdentifierRaw = String(ownInput?.value || "").trim();
    if (!ownIdentifierRaw) {
      return;
    }

    const ownIdentifier = getPreferredIdentifier(ownIdentifierRaw, overrideState || readLauncherState());

    const sourceState = overrideState || readLauncherState();
    const profileState = readLauncherProfileState(role, ownIdentifier, sourceState);
    const currentPartnerRaw = String(partnerInput?.value || profileState.currentPartner || "").trim();
    const currentPartner = getPreferredIdentifier(currentPartnerRaw, sourceState);
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

    if (fetchedProfile?.own_email) {
      rememberIdentifierStatus(requestedIdentifier, {
        input_identifier: requestedIdentifier,
        preferred_identifier: String(fetchedProfile.own_email || "").trim(),
        preferred_handle: String(fetchedProfile?.preferred_handle || "").trim(),
        owner_identifier: String(fetchedProfile?.owner_identifier || requestedIdentifier).trim(),
        uses_handle: !!fetchedProfile?.preferred_handle,
        is_handle: normalizeIdentifierForStorage(requestedIdentifier) === normalizeIdentifierForStorage(String(fetchedProfile?.preferred_handle || ""))
      });
    }

    const latest = writeLauncherProfileState(role, getPreferredIdentifier(requestedIdentifier), {
      currentPartner: String(fetchedProfile?.current_partner || "").trim(),
      partnerHistory: Array.isArray(fetchedProfile?.partner_history) ? fetchedProfile.partner_history : [],
      deletedPartners: Array.isArray(fetchedProfile?.deleted_partners) ? fetchedProfile.deleted_partners : []
    });
    const profileState = readLauncherProfileState(role, getPreferredIdentifier(requestedIdentifier, latest), latest);
    if (!String(partnerInput?.value || "").trim() && profileState.currentPartner) {
      partnerInput.value = profileState.currentPartner;
    }
    applyPartnerHistory(role, form, latest, getPreferredIdentifier(requestedIdentifier, latest));
    void refreshPartnerAliasHistory(role, form);
    void refreshDifficultyLabels();
  }

  async function refreshPartnerAliasHistory(role, form) {
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const ownIdentifier = String(ownInput?.value || "").trim();
    const originalPartnerInputValue = String(partnerInput?.value || "").trim();
    if (!ownIdentifier) {
      return;
    }

    const state = readLauncherState();
    const roleSettings = readRoleSettings(role);
    const profileState = readLauncherProfileState(role, ownIdentifier, state);
    const candidates = uniqueNames([
      ...profileState.partnerHistory,
      profileState.currentPartner || "",
      roleSettings.partnerName || "",
      String(partnerInput?.value || "").trim()
    ]);

    const remaps = [];
    const canonicalHistory = [];
    let canonicalCurrentPartner = String(partnerInput?.value || profileState.currentPartner || "").trim();

    for (const identifier of candidates) {
      if (!identifier) {
        continue;
      }

      let preferred = identifier;
      try {
        const status = await fetchIdentifierStatus(identifier);
        rememberIdentifierStatus(identifier, status);
        preferred = String(status?.preferred_identifier || "").trim() || identifier;
      } catch (error) {
        preferred = identifier;
      }

      if (normalizeIdentifierForStorage(preferred) !== normalizeIdentifierForStorage(identifier)) {
        remaps.push({ previous: identifier, next: preferred });
      }

      canonicalHistory.push(preferred);

      if (normalizeIdentifierForStorage(canonicalCurrentPartner) === normalizeIdentifierForStorage(identifier)) {
        canonicalCurrentPartner = preferred;
      }
    }

    remaps.forEach(({ previous, next }) => {
      migrateRuntimeSettingsIdentifier(previous, next);
    });

    const latest = writeLauncherProfileState(role, ownIdentifier, {
      currentPartner: canonicalCurrentPartner,
      partnerHistory: uniqueNames(canonicalHistory),
      deletedPartners: uniqueNames([
        ...profileState.deletedPartners,
        ...remaps.map((item) => item.previous)
      ])
    });

    if (partnerInput && canonicalCurrentPartner) {
      partnerInput.value = canonicalCurrentPartner;
    }

    applyPartnerHistory(role, form, latest, ownIdentifier);
    await persistLauncherProfileForForm(role, form, latest);

    const currentRemap = remaps.find((item) => normalizeIdentifierForStorage(item.previous) === normalizeIdentifierForStorage(originalPartnerInputValue));
    if (currentRemap) {
      showRoleIdentifierStatus(role, `Your partner now uses unique handle: ${currentRemap.next}.`);
    }
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
    if (!form) {
      return;
    }
    const ownInput = form.querySelector('input[name="ownName"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    if (!ownInput || !partnerInput) {
      return;
    }
    const select = form.querySelector('select[name="partnerHistory"]');
    const manageButton = form.querySelector('button[name="managePartnerNames"]');
    const roleSettings = readRoleSettings(role);
    const savedOwn = String(state.ownNames?.[role] || "").trim() || roleSettings.ownName || "";
    const profileState = readLauncherProfileState(role, savedOwn, state);
    const savedPartner = profileState.currentPartner || String(state.currentPartners?.[role] || "").trim() || roleSettings.partnerName || "";

    ownInput.value = savedOwn;
    partnerInput.value = savedPartner;
    applyPartnerHistory(role, form, state, savedOwn);
    applyRoleIdentifierPresentation(role, {
      ownUsesHandle: isValidUniqueHandle(savedOwn) && !isValidEmailAddress(savedOwn),
      partnerUsesHandle: isValidUniqueHandle(savedPartner) && !isValidEmailAddress(savedPartner)
    });

    select?.addEventListener("change", () => {
      if (select.value) {
        partnerInput.value = select.value;
        window.setTimeout(() => {
          select.value = "";
        }, 0);
        void persistLauncherProfileForForm(role, form);
        void refreshDifficultyLabels();
        void syncRoleIdentifierPresentation(role, form);
      }
    });

    const refreshPartnerChoices = () => {
      void refreshPartnerAliasHistory(role, form);
    };
    select?.addEventListener("focus", refreshPartnerChoices);
    select?.addEventListener("pointerdown", refreshPartnerChoices);

    manageButton?.addEventListener("click", () => {
      void refreshPartnerAliasHistory(role, form).finally(() => {
        openNameManager(role, form);
      });
    });

    ownInput.addEventListener("input", () => {
      setRoleDifficultyLabel(role, "1");
      applyPartnerHistory(role, form, readLauncherState(), ownInput.value.trim());
      applyRoleIdentifierPresentation(role, {
        ownUsesHandle: isValidUniqueHandle(ownInput.value.trim()) && !isValidEmailAddress(ownInput.value.trim()),
        partnerUsesHandle: isValidUniqueHandle(partnerInput.value.trim()) && !isValidEmailAddress(partnerInput.value.trim())
      });
    });
    ownInput.addEventListener("change", () => {
      void hydrateLauncherProfileForForm(role, form);
      void syncRoleIdentifierPresentation(role, form);
      void refreshMainUserType();
    });
    ownInput.addEventListener("blur", () => {
      void hydrateLauncherProfileForForm(role, form);
      void syncRoleIdentifierPresentation(role, form);
      void refreshMainUserType();
    });

    partnerInput.addEventListener("input", () => {
      setRoleDifficultyLabel(role, "1");
      applyRoleIdentifierPresentation(role, {
        ownUsesHandle: isValidUniqueHandle(ownInput.value.trim()) && !isValidEmailAddress(ownInput.value.trim()),
        partnerUsesHandle: isValidUniqueHandle(partnerInput.value.trim()) && !isValidEmailAddress(partnerInput.value.trim())
      });
    });
    partnerInput.addEventListener("change", () => {
      void persistLauncherProfileForForm(role, form);
      void syncRoleIdentifierPresentation(role, form);
    });
    partnerInput.addEventListener("blur", () => {
      void syncRoleIdentifierPresentation(role, form);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      let ownName = ownInput.value.trim();
      let exactPartnerName = partnerInput.value.trim();

      if (!ownName || !exactPartnerName) {
        if (!ownName) {
          ownInput.focus();
        } else {
          partnerInput.focus();
        }
        return;
      }

      try {
        ownName = assertValidParticipantIdentifier(ownName, "Your identifier");
        exactPartnerName = assertValidParticipantIdentifier(exactPartnerName, role === "sender" ? "Receiver identifier" : "Sender identifier");
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        }
        return;
      }

      let ownStatus = null;
      let partnerStatus = null;
      try {
        [ownStatus, partnerStatus] = await Promise.all([
          fetchIdentifierStatus(ownName),
          fetchIdentifierStatus(exactPartnerName)
        ]);
      } catch (error) {
        // If lookup fails, continue with the identifiers as typed.
      }

      let latest = readLauncherState();
      if (ownStatus) {
        latest = rememberIdentifierStatus(ownName, ownStatus, latest);
      }
      if (partnerStatus) {
        latest = rememberIdentifierStatus(exactPartnerName, partnerStatus, latest);
      }

      const canonicalOwnName = getPreferredIdentifier(ownName, latest);
      const canonicalPartnerName = getPreferredIdentifier(exactPartnerName, latest);

      latest.ownNames = latest.ownNames || {};
      latest.ownNames[role] = ownName;
      writeLauncherState(latest);
      const existingProfile = readLauncherProfileState(role, canonicalOwnName, latest);
      const nextState = writeLauncherProfileState(role, ownName, {
        currentPartner: canonicalPartnerName,
        partnerHistory: uniqueNames([...existingProfile.partnerHistory, canonicalPartnerName]),
        deletedPartners: existingProfile.deletedPartners.filter((name) => normalizeIdentifierForStorage(name) !== normalizeIdentifierForStorage(canonicalPartnerName))
      });
      try {
        await persistLauncherProfileForForm(role, form, nextState);
      } catch (error) {
        // Keep local progress even if the server save momentarily fails.
      }

      window.location.href = buildTargetUrl(role, canonicalOwnName, canonicalPartnerName);
    });

    if (savedOwn) {
      void hydrateLauncherProfileForForm(role, form);
    }
    void syncRoleIdentifierPresentation(role, form);
    void refreshMainUserType();
  }

  function activateCard(card) {
    const shouldActivate = !card.classList.contains("active");

    roleCards.forEach((item) => {
      item.classList.remove("active");
      item.classList.remove("role-card-hidden");
      const toggle = item.querySelector(".role-card-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    if (shouldActivate) {
      requestDeviceLocationIfNeeded();
      card.classList.add("active");
      void refreshDifficultyLabels();
      const toggle = card.querySelector(".role-card-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
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
      const activeForm = card.querySelector("[data-role-form]");
      if (activeForm) {
        void refreshPartnerAliasHistory(String(card.dataset.roleCard || ""), activeForm);
      }
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
      const toggle = item.querySelector(".role-card-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    if (changed) {
      rolePanels?.classList.remove("role-panels-single");
    }
  }

  function isLauncherInteractiveTarget(target) {
    return target instanceof Element &&
      !!target.closest("button, input, select, textarea, a, label, [data-open-tools], [data-open-handle-control], [name='managePartnerNames']");
  }

  function showLauncherView() {
    clearReportPanelOffset();
    launcherView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    adminUserListView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
  }

  function showOptionsView() {
    clearReportPanelOffset();
    optionsView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    adminUserListView?.classList.add("beginner-view-hidden");
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
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    adminUserListView?.classList.add("beginner-view-hidden");
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
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
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
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    void renderPerformanceVisualization(pairInfo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showAnalyzerView(pairInfo = selectedReportPair) {
    clearReportPanelOffset();
    analyzerView?.classList.remove("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    void renderResultsAnalysis(pairInfo);
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
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToolsView(role = "") {
    clearReportPanelOffset();
    activeToolsRole = role === "sender" || role === "receiver" ? role : "";
    toolsView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showContactView() {
    clearReportPanelOffset();
    contactView?.classList.remove("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
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
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
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
    toolsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    adminUserListView?.classList.add("beginner-view-hidden");
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
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    adminUserListView?.classList.add("beginner-view-hidden");
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
      const statusWidth = Math.max("Status".length, ...items.map((row) => String(row?.status || "").length));
      const roleWidth = Math.max("Role".length, ...items.map((row) => String(row?.role || "").length));
      const partnerWidth = Math.max("Partner".length, ...items.map((row) => String(row?.partner_name || "").length));
      const firstDateWidth = Math.max("First Date".length, ...items.map((row) => String(row?.first_date || "").length));
      const lastDateWidth = Math.max("Last Date".length, ...items.map((row) => String(row?.last_date || "").length));
      const countWidth = Math.max("Trials".length, ...items.map((row) => String(row?.trial_count ?? "").length));
      const pad = (value, width) => String(value ?? "").padEnd(width, " ");

      const lines = [
        `${pad("User", userWidth)}  ${pad("Status", statusWidth)}  ${pad("Role", roleWidth)}  ${pad("Partner", partnerWidth)}  ${pad("First Date", firstDateWidth)}  ${pad("Last Date", lastDateWidth)}  ${String("Trials").padStart(countWidth, " ")}`,
        `${"-".repeat(userWidth)}  ${"-".repeat(statusWidth)}  ${"-".repeat(roleWidth)}  ${"-".repeat(partnerWidth)}  ${"-".repeat(firstDateWidth)}  ${"-".repeat(lastDateWidth)}  ${"-".repeat(countWidth)}`
      ];

      items.forEach((row) => {
        lines.push(
          `${pad(row?.user_name || "", userWidth)}  ${pad(row?.status || "", statusWidth)}  ${pad(row?.role || "", roleWidth)}  ${pad(row?.partner_name || "", partnerWidth)}  ${pad(row?.first_date || "", firstDateWidth)}  ${pad(row?.last_date || "", lastDateWidth)}  ${String(row?.trial_count ?? 0).padStart(countWidth, " ")}`
        );
      });

      return lines.join("\n");
    }

    function renderAdminUserListView() {
      const userSummary = Array.isArray(launcherAdminState.user_trial_summary) ? launcherAdminState.user_trial_summary : [];
      const meta = launcherAdminState.user_trial_summary_meta || {};
      const reportDate = String(meta.report_date || "").trim() || "unknown";
      const totalUsers = Number.isFinite(Number(meta.total_users)) ? Number(meta.total_users) : userSummary.length;

      if (adminUserListSummary) {
        adminUserListSummary.textContent = `Report Date: ${reportDate}   Total Users: ${totalUsers}`;
      }
      if (adminUserListStatus) {
        adminUserListStatus.textContent = userSummary.length ? "" : "No server-side user summary is available right now.";
      }
      if (adminUserListOutput) {
        if (userSummary.length) {
          adminUserListOutput.hidden = false;
          adminUserListOutput.textContent = formatAdminUserTrialSummary(userSummary);
        } else {
          adminUserListOutput.hidden = true;
          adminUserListOutput.textContent = "";
        }
      }
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
          user_trial_summary_meta: data?.user_trial_summary_meta || null,
          disk_usage_analysis: data?.disk_usage_analysis || null
        };
      if (adminStatus) {
        adminStatus.textContent = "Admin access active.";
      }
      renderAdminView();
      if (!adminUserListView?.classList.contains("beginner-view-hidden")) {
        renderAdminUserListView();
      }
    } catch (error) {
      if (adminStatus) {
        adminStatus.textContent = "Unable to load admin data right now.";
      }
    }
  }

  function showAdminView() {
    adminView?.classList.remove("beginner-view-hidden");
    adminUserListView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
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

  function showAdminUserListView() {
    adminUserListView?.classList.remove("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    renderAdminUserListView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderUserTypeAdminState(options = {}) {
    const statusText = String(options.statusText || "").trim();
    const showChoices = !!options.showChoices;
    const currentType = String(options.currentType || "standard").trim().toLowerCase() === "pro" ? "pro" : "standard";
    pendingUserTypeSelection = currentType;

    if (userTypeStatus) {
      userTypeStatus.textContent = statusText;
    }
    if (userTypeOptionsWrap) {
      userTypeOptionsWrap.classList.toggle("beginner-view-hidden", !showChoices);
      userTypeOptionsWrap.hidden = !showChoices;
    }
    if (userTypeSaveButton) {
      userTypeSaveButton.classList.toggle("beginner-view-hidden", !showChoices);
      userTypeSaveButton.hidden = !showChoices;
    }
    userTypeChoiceButtons.forEach((button) => {
      const isSelected = String(button.dataset.userTypeChoiceButton || "").trim().toLowerCase() === currentType;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
    logUserTypeAdminDebug("render_state", [{
      requested_show_choices: showChoices,
      requested_current_type: currentType,
      requested_status_text: statusText
    }]);
  }

  function applyPendingUserTypeSelection(selection) {
    const normalizedSelection = String(selection || "").trim().toLowerCase() === "pro" ? "pro" : "standard";
    pendingUserTypeSelection = normalizedSelection;
    userTypeChoiceButtons.forEach((button) => {
      const isSelected = String(button.dataset.userTypeChoiceButton || "").trim().toLowerCase() === normalizedSelection;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
    logUserTypeAdminDebug("apply_selection", [{ selected_value: normalizedSelection }]);
  }

  function resetUserTypeAdminView() {
    if (userTypeLookupTimer) {
      clearTimeout(userTypeLookupTimer);
      userTypeLookupTimer = null;
    }
    pendingUserTypeLookupToken += 1;
    currentUserTypeAdminHandle = "";
    if (userTypeHandleInput) {
      userTypeHandleInput.value = "";
    }
    renderUserTypeAdminState({
      statusText: "",
      showChoices: false,
      currentType: "standard"
    });
    logUserTypeAdminDebug("reset_view");
  }

  async function lookupUserTypeForAdminHandle() {
    if (userTypeLookupTimer) {
      clearTimeout(userTypeLookupTimer);
      userTypeLookupTimer = null;
    }
    const handle = String(userTypeHandleInput?.value || "").trim();
    const lookupToken = pendingUserTypeLookupToken + 1;
    pendingUserTypeLookupToken = lookupToken;
    currentUserTypeAdminHandle = "";

    if (!handle) {
      renderUserTypeAdminState({
        statusText: "",
        showChoices: false,
        currentType: "standard"
      });
      logUserTypeAdminDebug("lookup_empty");
      return;
    }

    if (!isValidUniqueHandle(handle)) {
      renderUserTypeAdminState({
        statusText: "That handle is invalid.",
        showChoices: false,
        currentType: "standard"
      });
      logUserTypeAdminDebug("lookup_invalid_handle", [{ attempted_handle: handle }]);
      return;
    }

    logUserTypeAdminDebug("lookup_start", [{ attempted_handle: handle, lookup_token: lookupToken }]);
    renderUserTypeAdminState({
      statusText: "Checking user handle...",
      showChoices: false,
      currentType: "standard"
    });

    try {
      const response = await fetch("api.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "get_user_type",
          identifier: handle
        })
      });

      const data = await parseApiResponse(response, `User-type lookup failed with status ${response.status}`);
      if (lookupToken !== pendingUserTypeLookupToken) {
        logUserTypeAdminDebug("lookup_stale_ignored", [{ attempted_handle: handle, lookup_token: lookupToken }]);
        return;
      }
      const identifierStatus = data?.identifier_status || null;
      if (!identifierStatus?.is_handle) {
        renderUserTypeAdminState({
          statusText: "That user handle does not exist.",
          showChoices: false,
          currentType: "standard"
        });
        logUserTypeAdminDebug("lookup_not_handle", [{ attempted_handle: handle }]);
        return;
      }

      currentUserTypeAdminHandle = handle;
      renderUserTypeAdminState({
        statusText: `Current status for ${handle}: ${String(data?.user_type || "standard").toUpperCase()}`,
        showChoices: true,
        currentType: String(data?.user_type || "standard")
      });
      logUserTypeAdminDebug("lookup_success", [{
        attempted_handle: handle,
        returned_user_type: String(data?.user_type || "standard"),
        identifier_status: {
          input_identifier: identifierStatus?.input_identifier || "",
          preferred_identifier: identifierStatus?.preferred_identifier || "",
          preferred_handle: identifierStatus?.preferred_handle || "",
          owner_identifier: identifierStatus?.owner_identifier || "",
          uses_handle: !!identifierStatus?.uses_handle,
          is_handle: !!identifierStatus?.is_handle
        }
      }]);
    } catch (error) {
      if (lookupToken !== pendingUserTypeLookupToken) {
        logUserTypeAdminDebug("lookup_error_stale_ignored", [{ attempted_handle: handle, lookup_token: lookupToken }]);
        return;
      }
      renderUserTypeAdminState({
        statusText: error instanceof Error ? error.message : "Unable to look up that user right now.",
        showChoices: false,
        currentType: "standard"
      });
      logUserTypeAdminDebug("lookup_error", [{
        attempted_handle: handle,
        error: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  function scheduleUserTypeLookup(delayMs = 350) {
    if (userTypeLookupTimer) {
      clearTimeout(userTypeLookupTimer);
      userTypeLookupTimer = null;
    }

    const handle = String(userTypeHandleInput?.value || "").trim();
    currentUserTypeAdminHandle = "";

    if (!handle) {
      renderUserTypeAdminState({
        statusText: "",
        showChoices: false,
        currentType: "standard"
      });
      logUserTypeAdminDebug("schedule_empty");
      return;
    }

    if (!isValidUniqueHandle(handle)) {
      renderUserTypeAdminState({
        statusText: "That handle is invalid.",
        showChoices: false,
        currentType: "standard"
      });
      logUserTypeAdminDebug("schedule_invalid_handle", [{ attempted_handle: handle }]);
      return;
    }

    renderUserTypeAdminState({
      statusText: "",
      showChoices: false,
      currentType: "standard"
    });
    logUserTypeAdminDebug("schedule_lookup", [{ attempted_handle: handle, delay_ms: delayMs }]);

    userTypeLookupTimer = setTimeout(() => {
      userTypeLookupTimer = null;
      void lookupUserTypeForAdminHandle();
    }, delayMs);
  }

  async function saveUserTypeAssignment() {
    const selectedType = pendingUserTypeSelection || "standard";
    const handle = currentUserTypeAdminHandle || String(userTypeHandleInput?.value || "").trim();
    logUserTypeAdminDebug("save_start", [{ attempted_handle: handle, selected_type: selectedType }]);

    if (!isValidUniqueHandle(handle)) {
      renderUserTypeAdminState({
        statusText: "That handle is invalid.",
        showChoices: false,
        currentType: "standard"
      });
      logUserTypeAdminDebug("save_invalid_handle", [{ attempted_handle: handle, selected_type: selectedType }]);
      return;
    }

    renderUserTypeAdminState({
      statusText: "Saving user status...",
      showChoices: true,
      currentType: selectedType
    });

    try {
      const savedType = await assignUserType(handle, selectedType);
      currentUserTypeAdminHandle = handle;
      renderUserTypeAdminState({
        statusText: `Current status for ${handle}: ${savedType.toUpperCase()}.`,
        showChoices: true,
        currentType: savedType
      });
      logUserTypeAdminDebug("save_success", [{ attempted_handle: handle, saved_type: savedType }]);
      void refreshMainUserType();
    } catch (error) {
      renderUserTypeAdminState({
        statusText: error instanceof Error ? error.message : "Unable to save that user status right now.",
        showChoices: true,
        currentType: selectedType
      });
      logUserTypeAdminDebug("save_error", [{
        attempted_handle: handle,
        selected_type: selectedType,
        error: error instanceof Error ? error.message : String(error)
      }]);
    }
  }

  function showUserTypeAdminView() {
    clearReportPanelOffset();
    userTypeAdminView?.classList.remove("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    resetUserTypeAdminView();
    adminUserListView?.classList.add("beginner-view-hidden");
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
    otherSettingsView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    renderColorSchemeView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showGoProView() {
    clearReportPanelOffset();
    goProView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    otherSettingsView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showOtherSettingsView() {
    clearReportPanelOffset();
    otherSettingsView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    helpView?.classList.add("beginner-view-hidden");
    toolsView?.classList.add("beginner-view-hidden");
    goProView?.classList.add("beginner-view-hidden");
    colorSchemeView?.classList.add("beginner-view-hidden");
    contactView?.classList.add("beginner-view-hidden");
    aboutView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    visualizationView?.classList.add("beginner-view-hidden");
    analyzerView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    userTypeAdminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
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
    const cleanSenderEmail = assertValidEmailIdentifier(senderEmail, "Your email");
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
          sender_email: cleanSenderEmail,
          own_names: meta.ownNames,
          pair: meta.pair,
          location: meta.location
        }
      })
    });

    return parseApiResponse(response, `Contact request failed with status ${response.status}`);
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
    const toggle = card.querySelector(".role-card-toggle");
    toggle?.addEventListener("click", () => {
      activateCard(card);
    });
    header?.addEventListener("click", (event) => {
      if (isLauncherInteractiveTarget(event.target)) {
        return;
      }
      activateCard(card);
    });
  });

  document.querySelectorAll(".role-email-note").forEach((note) => {
    note.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("[data-open-handle-control]")) {
        return;
      }
      collapseActiveLauncherCard();
    });
  });

  retryLocationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      requestDeviceLocationIfNeeded(true);
    });
  });
  renderRemoteViewerCard();
  remoteViewerOwnInput?.addEventListener("input", persistRemoteViewerCardState);
  remoteViewerOwnInput?.addEventListener("change", persistRemoteViewerCardState);
  remoteViewerPartnerInput?.addEventListener("input", persistRemoteViewerCardState);
  remoteViewerPartnerInput?.addEventListener("change", persistRemoteViewerCardState);
  remoteViewerDisplayDeviceCheckbox?.addEventListener("change", () => {
    renderRemoteViewerLabels(!!remoteViewerDisplayDeviceCheckbox.checked);
    persistRemoteViewerCardState();
  });
  remoteViewerGoButton?.addEventListener("click", () => {
    persistRemoteViewerCardState();
    window.alert("Remote Viewer runtime flow is not wired up yet.");
  });

  openOptionsButton?.addEventListener("click", showOptionsView);
  closeOptionsButton?.addEventListener("click", showLauncherView);
  openHelpButton?.addEventListener("click", showHelpView);
  openGoProButton?.addEventListener("click", showGoProView);
  openOtherSettingsButton?.addEventListener("click", showOtherSettingsView);
  openUserTypeAdminButton?.addEventListener("click", showUserTypeAdminView);
  openHandleButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openHandleOverlay(String(button.dataset.openHandleControl || ""));
    });
  });
  openToolsButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      showToolsView(String(button.dataset.openTools || ""));
    });
  });
  openColorSchemeButton?.addEventListener("click", showColorSchemeView);
  closeHelpButton?.addEventListener("click", showOptionsView);
  closeGoProButton?.addEventListener("click", showOptionsView);
  closeOtherSettingsButton?.addEventListener("click", showOptionsView);
  closeUserTypeAdminButton?.addEventListener("click", showAdminView);
  closeAdminUserListButton?.addEventListener("click", showAdminView);
  closeHandleButton?.addEventListener("click", closeHandleOverlay);
  submitHandleButton?.addEventListener("click", () => {
    void submitUniqueHandle();
  });
  closeToolsButton?.addEventListener("click", () => {
    showLauncherView();
    if (activeToolsRole) {
      const matchingCard = roleCards.find((card) => card.dataset.roleCard === activeToolsRole);
      if (matchingCard) {
        activateCard(matchingCard);
      }
    }
  });
  closeColorSchemeButton?.addEventListener("click", showOtherSettingsView);
  userTypeHandleInput?.addEventListener("input", () => {
    pendingUserTypeLookupToken += 1;
    logUserTypeAdminDebug("input_event", [{ next_value: String(userTypeHandleInput?.value || "").trim() }]);
    scheduleUserTypeLookup(350);
  });
  userTypeHandleInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      pendingUserTypeLookupToken += 1;
      logUserTypeAdminDebug("enter_key_lookup", [{ current_value: String(userTypeHandleInput?.value || "").trim() }]);
      void lookupUserTypeForAdminHandle();
    }
  });
  userTypeSaveButton?.addEventListener("click", () => {
    logUserTypeAdminDebug("save_button_click");
    void saveUserTypeAssignment();
  });
  userTypeChoiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = String(button.dataset.userTypeChoiceButton || "").trim().toLowerCase() === "pro" ? "pro" : "standard";
      logUserTypeAdminDebug("choice_button_click", [{ clicked_value: value }]);
      applyPendingUserTypeSelection(value);
    });
  });
  userTypeClearButton?.addEventListener("click", () => {
    logUserTypeAdminDebug("clear_click");
    resetUserTypeAdminView();
    userTypeHandleInput?.focus();
  });
  openContactButton?.addEventListener("click", showContactView);
  closeContactButton?.addEventListener("click", showHelpView);
  openAboutButton?.addEventListener("click", showAboutView);
  closeAboutButton?.addEventListener("click", showHelpView);
  openReportButton?.addEventListener("click", showReportDefinitionView);
  closeReportDefinitionButton?.addEventListener("click", showOptionsView);
  closeReportButton?.addEventListener("click", showReportDefinitionView);
  closeVisualizationButton?.addEventListener("click", showReportDefinitionView);
  closeAnalyzerButton?.addEventListener("click", showReportDefinitionView);
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
  reportAnalyzeButton?.addEventListener("click", () => {
    if (selectedReportPair) {
      showAnalyzerView(selectedReportPair);
    }
  });
  analyzerRefreshButton?.addEventListener("click", () => {
    if (selectedReportPair) {
      void renderResultsAnalysis(selectedReportPair);
    }
  });
  analyzerCopyButton?.addEventListener("click", async () => {
    const text = analyzerText?.value || "";
    if (!text) {
      if (analyzerStatus) {
        analyzerStatus.textContent = "No continuity text is available to copy yet.";
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      if (analyzerStatus) {
        analyzerStatus.textContent = "Continuity text copied to the clipboard.";
      }
    } catch (error) {
      if (analyzerStatus) {
        analyzerStatus.textContent = "Unable to copy automatically. Please select and copy the text manually.";
      }
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
  handleOverlay?.addEventListener("click", (event) => {
    if (event.target === handleOverlay) {
      closeHandleOverlay();
    }
  });
  handleInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitUniqueHandle();
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
        launcherAdminState.user_trial_summary_meta = data?.user_trial_summary_meta || null;
        if (adminStatus) {
          const count = launcherAdminState.user_trial_summary.length;
          adminStatus.textContent = `User summary updated. ${count} line item${count === 1 ? "" : "s"} found.`;
        }
        renderAdminView();
        renderAdminUserListView();
        showAdminUserListView();
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
  renderMainTitle("standard");
  void refreshMainUserType();
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




























