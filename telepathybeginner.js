(() => {
  const launcherKey = "cones-beginner-launcher";
  const roleCards = Array.from(document.querySelectorAll("[data-role-card]"));
  const rolePanels = document.querySelector(".role-panels");
  const launcherView = document.querySelector('[data-view="launcher"]');
  const optionsView = document.querySelector('[data-view="options"]');
  const reportDefinitionView = document.querySelector('[data-view="report-definition"]');
  const reportView = document.querySelector('[data-view="report"]');
  const difficultyView = document.querySelector('[data-view="difficulty"]');
  const settingsView = document.querySelector('[data-view="settings"]');
  const adminView = document.querySelector('[data-view="admin"]');
  const beginnerPanel = document.querySelector(".beginner-panel");
  const reportViewPanHandle = document.querySelector("[data-report-view-pan-handle]");
  const openOptionsButton = document.querySelector("[data-open-options]");
  const closeOptionsButton = document.querySelector("[data-close-options]");
  const openReportButton = document.querySelector("[data-open-report]");
  const closeReportDefinitionButton = document.querySelector("[data-close-report-definition]");
  const closeReportButton = document.querySelector("[data-close-report]");
  const reportDefinitionStatus = document.querySelector("[data-report-definition-status]");
  const reportPairPicker = document.querySelector("[data-report-pair-picker]");
  const reportPairTrigger = document.querySelector("[data-report-pair-trigger]");
  const reportPairTriggerText = document.querySelector("[data-report-pair-trigger-text]");
  const reportPairMenu = document.querySelector("[data-report-pair-menu]");
  const reportPairOptions = document.querySelector("[data-report-pair-options]");
  const reportGoButton = document.querySelector("[data-report-go]");
  const reportDefinitionDebug = document.querySelector("[data-report-definition-debug]");
  const openDifficultyButton = document.querySelector("[data-open-difficulty]");
  const closeDifficultyButton = document.querySelector("[data-close-difficulty]");
  const openSettingsButton = document.querySelector("[data-open-settings]");
  const closeSettingsButton = document.querySelector("[data-close-settings]");
  const closeAdminButton = document.querySelector("[data-close-admin]");
  const installAppButton = document.querySelector("[data-install-app]");
  const reportSummary = document.querySelector("[data-report-summary]");
  const reportStatus = document.querySelector("[data-report-status]");
  const reportTableWrap = document.querySelector("[data-report-table-wrap]");
  const reportTable = document.querySelector("[data-report-table]");
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
  const saveSettingsButton = document.querySelector("[data-save-settings]");
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
  const difficultyStopPercents = [17, 50, 84];
  const difficultyCopy = {
    1: "In Level 1, you simply have to decide whether the sender is sending 1 cone or many cones (3 cones). You simply decide whether there is 1 cone or many cones.",
    2: "In Level 2 when there are many cones, try also to decide whether they are arranged horizontally, vertically, or diagonally running up or down from left to right.",
    3: "In Level 3 there are 1, 2 or 3 cones are sent in 9 different possible arrangements. Try to decide exactly which arrangement is being sent."
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
        difficultyLevel: "1"
      };
    }
  }

  function writeLauncherState(state) {
    localStorage.setItem(launcherKey, JSON.stringify(state));
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

  function readRoleSettings(role) {
    try {
      const raw = localStorage.getItem(`cones-settings-${role}`);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ownName: buildDisplayName(parsed?.first_name, parsed?.last_name),
        partnerName: buildDisplayName(parsed?.partner_first_name, parsed?.partner_last_name)
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
      const raw = localStorage.getItem(`cones-settings-${role}`);
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
    localStorage.setItem(`cones-settings-${role}`, JSON.stringify(next));
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
    const partnerName =
      formValues.partnerName ||
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
                : "Enter or save your name first so the report generator can find receiver-sender pairs associated with you."
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
      return `${(distanceMeters / 1609.344).toFixed(3)} miles`;
    }

    return `${distanceMeters.toFixed(3)} meters`;
  }

  function renderReportSummary(pairInfo, records) {
    if (!reportSummary || !reportStatus) {
      return;
    }

    reportSummary.replaceChildren();

    const firstRecord = records[0] || null;
    const firstLocalDate = firstRecord ? String(firstRecord["local date"] || "").trim() : "unknown";
    const firstLocalTime = firstRecord ? String(firstRecord["local time"] || "").trim() : "unknown";

    const firstLine = document.createElement("p");
    firstLine.className = "report-summary-line";
    firstLine.textContent =
      `Receiver-sender pair: ${pairInfo.receiverName || "unknown"} - ${pairInfo.senderName || "unknown"} ` +
      `First trial: Local ${firstLocalDate} ${firstLocalTime}`;

    reportSummary.append(firstLine);
    reportStatus.textContent = `${records.length} trial record${records.length === 1 ? "" : "s"} found on the server for this pair.`;
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

  function getLevelOneReportScore(record) {
    const difficultyLevel = String(record?.["difficulty level"] ?? "").trim();
    if (difficultyLevel !== "1") {
      return "";
    }

    const sentLayout = Number(String(record?.["sent layout"] ?? "").trim());
    const choiceOne = Number(String(record?.["rx choice1"] ?? "").trim());
    const sentIsOneCone = sentLayout === 1;
    const choiceIndicatesOneCone = choiceOne === 1;
    const choiceIndicatesManyCones = Number.isInteger(choiceOne) && choiceOne > 1;

    if (sentIsOneCone && choiceIndicatesOneCone) {
      return "1";
    }

    if (!sentIsOneCone && choiceIndicatesManyCones) {
      return "1";
    }

    return "0";
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
      "rx choice2",
      "score",
      "confidence",
      "difficulty level",
      "dist",
      "rx done rt",
      "sync est",
      "sync best",
      "sync worst",
      "completed",
      "round_id",
      "utc time",
      "rx location",
      "tx location"
    ];
    const headingMap = {
      "local date": "Local date",
      "local time": "Local time",
      "sent layout": "Sent",
      "rx choice1": "Choice 1",
      "rx choice2": "Choice 2",
      "score": "Score",
      "confidence": "Conf",
      "difficulty level": "Level",
      "dist": "Distance",
      "rx done rt": "Time",
      "utc time": "UTC time",
      "rx location": "Rx location",
      "tx location": "Tx location",
      "sync est": "Sync est",
      "sync best": "Sync best",
      "sync worst": "Sync worst",
      "completed": "Completed",
      "round_id": "Round ID"
    };
    const colgroup = document.createElement("colgroup");
    [
      "110px",
      "132px",
      "114px",
      "114px",
      "114px",
      "72px",
      "68px",
      "84px",
      "140px",
      "78px",
      "68px",
      "68px",
      "68px",
      "92px",
      "190px",
      "210px",
      "340px",
      "340px"
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
    let levelOneTotalTrials = 0;
    let levelOneTotalCorrect = 0;
    records.forEach((record) => {
      const row = document.createElement("tr");
      const receiverLocation = parseLocationValue(record?.["rx location"] ?? "");
      const senderLocation = parseLocationValue(record?.["tx location"] ?? "");
      const trialAborted = String(record?.["trial aborted"] ?? "").trim().toLowerCase() === "yes";
      const trialTimedOut = String(record?.["trial timed out"] ?? "").trim().toLowerCase() === "yes";
      const scoreValue = getLevelOneReportScore(record);
      if (String(record?.["difficulty level"] ?? "").trim() === "1") {
        levelOneTotalTrials += 1;
        if (scoreValue === "1") {
          levelOneTotalCorrect += 1;
        }
      }
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
        } else if (header === "rx location" || header === "tx location") {
          const content = document.createElement("div");
          content.className = "report-cell-clamp";
          content.textContent = formatLocationLabel(
            header === "rx location" ? receiverLocation : senderLocation,
            {}
          );
          td.appendChild(content);
        } else if (header === "utc time") {
          const content = document.createElement("div");
          content.className = "report-cell-clamp";
          content.textContent = String(record?.[header] ?? "");
          td.appendChild(content);
        } else if (header === "completed") {
          td.textContent = trialAborted || trialTimedOut ? "no" : "yes";
        } else if (header === "score") {
          td.textContent = scoreValue;
        } else if (header === "rx choice1" && String(record?.["difficulty level"] ?? "").trim() === "1") {
          td.textContent = getLevelOneChoiceLabel(record?.[header] ?? "");
        } else if (header === "sent layout" || header === "rx choice1" || header === "rx choice2") {
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
    const levelOnePercent = levelOneTotalTrials > 0
      ? ((levelOneTotalCorrect / levelOneTotalTrials) * 100).toFixed(1)
      : "0.0";
    summaryCell.textContent =
      `Summary - Level 1: Total trials = ${levelOneTotalTrials}, Total correct = ${levelOneTotalCorrect} = ${levelOnePercent} %`;
    summaryRow.appendChild(summaryCell);
    tfoot.appendChild(summaryRow);

    reportTable.append(colgroup, thead, tbody, tfoot);
    reportTableWrap.hidden = false;
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
      records: reportCsvRecordsCache
    };
    try {
      csvResult = await fetchReportCsvData();
    } catch (error) {
      csvResult = {
        available: false,
        message: "Unable to load the server trial history right now.",
        records: reportCsvRecordsCache
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
        ? "No server-side trial records were found for this receiver-sender pair."
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
    params.set("own_name", ownName);
    params.set("partner_name", exactPartnerName);
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

  function getPartnerHistory(role, state = readLauncherState()) {
    const partnerKey = partnerRole(role);
    const roleSettings = readRoleSettings(role);
    const deleted = new Set(
      Array.isArray(state.deletedPartners?.[partnerKey]) ? state.deletedPartners[partnerKey] : []
    );
    return uniqueNames([
      ...(Array.isArray(state.partnerHistory?.[partnerKey]) ? state.partnerHistory[partnerKey] : []),
      roleSettings.partnerName || ""
    ]).filter((name) => !deleted.has(name));
  }

  function applyPartnerHistory(role, form, state = readLauncherState()) {
    const select = form.querySelector('select[name="partnerHistory"]');
    const partnerInput = form.querySelector('input[name="partnerName"]');
    const manageButton = form.querySelector('button[name="managePartnerNames"]');
    const emptyOptionLabel = role === "sender" ? "Select receiver" : "Select sender";
    const history = getPartnerHistory(role, state);

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

  function saveManagedName(role, originalName, updatedName, isAddMode, form) {
    const cleaned = String(updatedName || "").trim();
    if (!cleaned) {
      return false;
    }

    const latest = readLauncherState();
    const partnerKey = partnerRole(role);
    const history = getPartnerHistory(role, latest).filter((name) => name !== originalName);
    latest.partnerHistory = latest.partnerHistory || {};
    latest.currentPartners = latest.currentPartners || {};
    latest.deletedPartners = latest.deletedPartners || {};
    latest.deletedPartners[partnerKey] = (Array.isArray(latest.deletedPartners[partnerKey]) ? latest.deletedPartners[partnerKey] : [])
      .filter((name) => name !== cleaned);
    latest.partnerHistory[partnerKey] = uniqueNames([...history, cleaned]);

    const partnerInput = form.querySelector('input[name="partnerName"]');
    if (isAddMode || (partnerInput && partnerInput.value.trim() === originalName)) {
      partnerInput.value = cleaned;
      latest.currentPartners[role] = cleaned;
    } else if (!latest.currentPartners[role] && partnerInput?.value.trim()) {
      latest.currentPartners[role] = partnerInput.value.trim();
    }

    writeLauncherState(latest);
    applyPartnerHistory(role, form, latest);
    return true;
  }

  function deleteManagedName(role, nameToDelete, form) {
    const latest = readLauncherState();
    const partnerKey = partnerRole(role);
    const history = getPartnerHistory(role, latest).filter((name) => name !== nameToDelete);
    latest.partnerHistory = latest.partnerHistory || {};
    latest.currentPartners = latest.currentPartners || {};
    latest.deletedPartners = latest.deletedPartners || {};
    latest.deletedPartners[partnerKey] = uniqueNames([
      ...(Array.isArray(latest.deletedPartners[partnerKey]) ? latest.deletedPartners[partnerKey] : []),
      nameToDelete
    ]);
    latest.partnerHistory[partnerKey] = history;

    const partnerInput = form.querySelector('input[name="partnerName"]');
    if (partnerInput && partnerInput.value.trim() === nameToDelete) {
      partnerInput.value = "";
    }
    if (latest.currentPartners[role] === nameToDelete) {
      latest.currentPartners[role] = "";
    }

    writeLauncherState(latest);
    applyPartnerHistory(role, form, latest);
  }

  function openNameEditor(role, form, options) {
    const isAddMode = !!options.isAddMode;
    const originalName = options.name || "";
    const panel = activeNameManagerOverlay?.querySelector(".name-manager-panel");

    if (!panel) {
      return;
    }

    panel.innerHTML = `
      <h2 class="name-manager-title">${isAddMode ? "Add name" : "Edit name"}</h2>
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

    const partnerTypeLabel = role === "sender" ? "receivers" : "senders";
    const history = getPartnerHistory(role);
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
            <button class="name-manager-item-button name-manager-item-add" type="button" data-add-name>Add a name.</button>
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
    const partnerKey = partnerRole(role);
    const roleSettings = readRoleSettings(role);
    const savedOwn = String(state.ownNames?.[role] || "").trim() || roleSettings.ownName || "";
    const savedPartner = String(state.currentPartners?.[role] || "").trim() || roleSettings.partnerName || "";
    const history = getPartnerHistory(role, state);

    ownInput.value = savedOwn;
    partnerInput.value = savedPartner;
    applyPartnerHistory(role, form, state);

    select.addEventListener("change", () => {
      if (select.value) {
        partnerInput.value = select.value;
        window.setTimeout(() => {
          select.value = "";
        }, 0);
        void refreshDifficultyLabels();
      }
    });

    manageButton?.addEventListener("click", () => {
      openNameManager(role, form);
    });

    ownInput.addEventListener("input", () => {
      setRoleDifficultyLabel(role, "1");
    });

    partnerInput.addEventListener("input", () => {
      setRoleDifficultyLabel(role, "1");
    });

    form.addEventListener("submit", (event) => {
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
      latest.currentPartners = latest.currentPartners || {};
      latest.partnerHistory = latest.partnerHistory || {};
      latest.ownNames[role] = ownName;
      latest.currentPartners[role] = exactPartnerName;
      latest.partnerHistory[partnerKey] = uniqueNames([
        ...(Array.isArray(latest.partnerHistory[partnerKey]) ? latest.partnerHistory[partnerKey] : []),
        exactPartnerName
      ]);
      writeLauncherState(latest);

      window.location.href = buildTargetUrl(role, ownName, exactPartnerName);
    });
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

  function showLauncherView() {
    clearReportPanelOffset();
    launcherView?.classList.remove("beginner-view-hidden");
    optionsView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
  }

  function showOptionsView() {
    clearReportPanelOffset();
    optionsView?.classList.remove("beginner-view-hidden");
    launcherView?.classList.add("beginner-view-hidden");
    reportDefinitionView?.classList.add("beginner-view-hidden");
    reportView?.classList.add("beginner-view-hidden");
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
    reportView?.classList.add("beginner-view-hidden");
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
    difficultyView?.classList.add("beginner-view-hidden");
    settingsView?.classList.add("beginner-view-hidden");
    adminView?.classList.add("beginner-view-hidden");
    closeReportPairMenu();
    void renderPerformanceReport(pairInfo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDifficultyState(levelOverride = null) {
    const state = readLauncherState();
    const level = normalizeDifficultyLevel(levelOverride ?? state.difficultyLevel);
    if (difficultySlider) {
      difficultySlider.setAttribute("aria-valuenow", level);
    }
    if (difficultyCurrent) {
      difficultyCurrent.textContent = `Level ${level}`;
    }
    if (difficultyDescription) {
      difficultyDescription.textContent = difficultyCopy[level];
    }
    positionDifficultyThumb(Number(level));
  }

  function rememberDifficultyLevel(level) {
    const latest = readLauncherState();
    latest.difficultyLevel = normalizeDifficultyLevel(level);
    writeLauncherState(latest);
    renderDifficultyState(latest.difficultyLevel);
    return latest.difficultyLevel;
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
    difficultySlider.classList.add("is-dragging");
    if (event.pointerId !== undefined) {
      difficultySlider.setPointerCapture?.(event.pointerId);
    }
    const level = nearestDifficultyLevel(event.clientX);
    rememberDifficultyLevel(level);
  }

  function continueDifficultyDrag(event) {
    if (!difficultyDragging) {
      return;
    }
    const level = nearestDifficultyLevel(event.clientX);
    rememberDifficultyLevel(level);
  }

  function endDifficultyDrag(event) {
    if (!difficultyDragging || !difficultySlider) {
      return;
    }
    difficultyDragging = false;
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
      const countWidth = Math.max("Trials".length, ...items.map((row) => String(row?.trial_count ?? "").length));
      const pad = (value, width) => String(value ?? "").padEnd(width, " ");

      const lines = [
        `${pad("User", userWidth)}  ${pad("Role", roleWidth)}  ${pad("Partner", partnerWidth)}  ${String("Trials").padStart(countWidth, " ")}`,
        `${"-".repeat(userWidth)}  ${"-".repeat(roleWidth)}  ${"-".repeat(partnerWidth)}  ${"-".repeat(countWidth)}`
      ];

      items.forEach((row) => {
        lines.push(
          `${pad(row?.user_name || "", userWidth)}  ${pad(row?.role || "", roleWidth)}  ${pad(row?.partner_name || "", partnerWidth)}  ${String(row?.trial_count ?? 0).padStart(countWidth, " ")}`
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

  function encodeCsvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, "\"\"").replace(/\r?\n/g, " ")}"`;
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
    if (settingsStatus) {
      settingsStatus.textContent = "Preparing CSV download...";
      settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
    }

    try {
      const csvResult = await fetchReportCsvData();
      let records = Array.isArray(csvResult.records) ? csvResult.records : [];
      if (!records.length) {
        if (settingsStatus) {
          settingsStatus.textContent = "No CSV records are available to download right now.";
          settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
        }
        return;
      }

      const desiredName = String(settingsImportFilenameInput?.value || "").trim();
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

  async function saveLauncherSettingsView() {
    const receiverContext = getPairContextForRole("receiver");
    const allowSecondChoice = settingsSecondChoiceCheckbox?.checked === true;
    const importFilename = String(settingsImportFilenameInput?.value || "").trim();
    const currentLevel = normalizeDifficultyLevel(readLauncherState().difficultyLevel);
    const singleChoiceOnly = currentLevel === "1" || currentLevel === "2";
    let statusMessage = receiverContext
      ? "Receiver-side settings saved for this device."
      : "Settings saved for the receiver role on this device.";

    if (settingsStatus) {
      settingsStatus.textContent = "Saving settings...";
      settingsStatus.dataset.persistedMessage = "";
    }

    let matchedAdminSecret = false;
    if (importFilename) {
      try {
        matchedAdminSecret = await checkAdminSecret(importFilename);
      } catch (error) {
        if (settingsStatus) {
          settingsStatus.textContent = "Unable to verify admin access right now, but other settings were saved.";
          settingsStatus.dataset.persistedMessage = settingsStatus.textContent;
        }
      }
    }

    writeRuntimeSettings("receiver", {
      allow_second_choice: singleChoiceOnly ? false : allowSecondChoice,
      import_csv_filename: matchedAdminSecret ? "" : importFilename
    });

    if (matchedAdminSecret) {
      launcherAdminSecret = importFilename;
    } else if (!importFilename) {
      launcherAdminSecret = "";
    }

    if (settingsStatus) {
      settingsStatus.textContent = statusMessage;
      settingsStatus.dataset.persistedMessage = statusMessage;
    }

    renderSettingsView();

    if (matchedAdminSecret) {
      showAdminView();
    }
  }

  function showInstallFallback() {
    window.alert(
      "If your device supports app installation, use the browser's install or Add to Home Screen option to install Telepathy Beginner."
    );
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

  retryLocationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      requestDeviceLocationIfNeeded(true);
    });
  });

  openOptionsButton?.addEventListener("click", showOptionsView);
  closeOptionsButton?.addEventListener("click", showLauncherView);
  openReportButton?.addEventListener("click", showReportDefinitionView);
  closeReportDefinitionButton?.addEventListener("click", showOptionsView);
  closeReportButton?.addEventListener("click", showReportDefinitionView);
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
  openDifficultyButton?.addEventListener("click", showDifficultyView);
  closeDifficultyButton?.addEventListener("click", showOptionsView);
  openSettingsButton?.addEventListener("click", showSettingsView);
  closeSettingsButton?.addEventListener("click", showOptionsView);
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
  downloadSettingsCsvButton?.addEventListener("click", () => {
    void downloadSettingsCsvData();
  });
  saveSettingsButton?.addEventListener("click", saveLauncherSettingsView);
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
  renderLocationStatus();
  renderDifficultyState();
  void refreshDifficultyLabels();
  applyLauncherOpenRequest();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  document.addEventListener("click", (event) => {
    if (!reportPairPicker?.contains(event.target)) {
      closeReportPairMenu();
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./telepathybeginner-sw.js")
        .catch(() => {
          // Ignore service worker registration failures and fall back to browser guidance.
        });
    });
  }
})();
