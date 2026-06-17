(() => {
  const role = document.body.dataset.role;
  const clientId = (() => {
    const storageKey = `cones-client-id-${role}`;
    const existing = window.sessionStorage.getItem(storageKey);

    if (existing) {
      return existing;
    }

    const created = `${role}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(storageKey, created);
    return created;
  })();
  const countdownBox = document.getElementById("countdownBox");
  const countdownNumber = document.getElementById("countdownNumber");
  const stage = document.getElementById("stage");
  const homeLink = document.querySelector(".home-link");
  const waitingBackButton = document.getElementById("waitingBackButton");
  const settingsGear = document.getElementById("settingsGear");
  const settingsScreen = document.getElementById("settingsScreen");
  const coneSrc = "cone-lowglow-transparent.png";
  const arrangementNodes = new Map();
  const choiceNodes = new Map();
  const senderChoiceNodes = new Map();
  const levelOneChoiceNodes = new Map();
  const senderLevelOneChoiceNodes = new Map();
  const levelTwoChoiceNodes = new Map();
  const senderLevelTwoChoiceNodes = new Map();
  const levelOneFeedbackNodes = new Map();
  const senderLevelOneFeedbackNodes = new Map();
  const heartbeatMs = 1000;
  const staleMs = 5000;
  const roundLifetimeMs = 300000;
  const receiverSkipInstructionKey = "cones-receiver-skip-two-choice-instructions";
  const settingsStorageKey = `cones-settings-v2-${role}`;
  const arrangementHistoryKey = "conesArrangementHistory-v2";
  const exportSchemaVersion = "cones-trials-v4";
  const runtimeBuildVersion = "20260617n";
  const layouts = {
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

  let serverOffsetMs = 0;
  let bestOffsetRttMs = Number.POSITIVE_INFINITY;
  let lastSeenRoundId = null;
  let currentUiMode = "";
  let roundScheduled = false;
  let localRoundRunning = false;
  let receiverReady = false;
  let awaitingReceiverDone = false;
  let receiverChoiceOpen = false;
  let activeRound = null;
  let audioContext = null;
  let activeOscillator = null;
  let activeGain = null;
  let doneTimeoutHandle = null;
  let senderHoldingResult = false;
  let preloadedConeImage = null;
  let receiverPressedDoneEarly = false;
  let receiverRevealStartedMs = 0;
  let receiverBeepEndPerformanceMs = 0;
  let receiverDoneReactionMs = null;
  let confidencePanel = null;
  let confidenceSlider = null;
  let confidenceValue = null;
  let confidenceDescription = null;
  let confidenceButton = null;
  let twoChoiceButton = null;
  let instructionPanel = null;
  let pendingGuessLayoutNumbers = [];
  let pendingGuessArrangementCodes = [];
  let pendingConfidenceValue = 5;
  let receiverSelectionLimit = 1;
  let confidenceScreenOpen = false;
  let instructionScreenOpen = false;
  let receiverMirrorPhase = "idle";
  let receiverConfidenceLockedAtMs = 0;
  let receiverSkipInstructions = false;
  let skipInstructionsCheckbox = null;
  let senderConfidencePanel = null;
  let senderConfidenceValue = null;
  let senderConfidenceDescription = null;
  let decisionPanel = null;
  let enoughButton = null;
  let anotherButton = null;
  let messagePanel = null;
  let messageText = null;
  let messageActions = null;
  let postRoundChoiceSubmitted = false;
  let postRoundClearPending = false;
  let postRoundAutoClearHandle = null;
  let appExited = false;
  let settingsOpen = false;
  let settingsOwnEmailInput = null;
  let settingsPartnerEmailInput = null;
  let settingsAllowSecondChoiceCheckbox = null;
  let settingsExportEmailInput = null;
  let settingsFolderStatus = null;
  let settingsFolderInput = null;
  let selectedDataFolderHandle = null;
  let selectedDataFolderName = "";
  let selectedDataFolderLabel = "";
  let lastLoggedRoundId = "";
  let pendingInteractionMark = false;
  let choiceInstructionShown = false;
  let receiverTransitioningScreen = false;
  let adminAuthorized = false;
  let debugEnabled = false;
  let currentPairDifficultyLevel = "1";
  let adminStorageInfo = null;
  let adminDiskUsageAnalysis = null;
  let pendingLoggedRoundId = "";
  let settingsDraftSnapshot = "";
  let settingsConfirmDialog = null;

  const folderHandleDbName = "cones-folder-handles";
  const folderHandleStoreName = "handles";
  const folderHandleKey = `data-folder-${role}`;
  const localTrialRecordsKey = `cones-local-trials-v2-${role}`;
  const levelOneTargetLayoutNumbers = [1, 6, 7, 8, 9];
  const levelOneManyLayoutNumbers = [6, 7, 8, 9];

  function detectRuntimePlatform() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
    const isIOS = isIPhone || isIPad;
    const isAndroid = /Android/i.test(ua);
    const isWindows = /Windows/i.test(ua) || /Win32|Win64|Windows/i.test(platform);

    if (isIOS) {
      return {
        family: "iphone",
        label: isIPad ? "iPad / iOS" : "iPhone / iOS"
      };
    }

    if (isAndroid) {
      return {
        family: "android",
        label: "Android"
      };
    }

    if (isWindows) {
      return {
        family: "windows",
        label: "Windows PC"
      };
    }

    return {
      family: "other",
      label: "Other device"
    };
  }

  const platformInfo = detectRuntimePlatform();

  function isStartupMode(mode) {
    return [
      "sender-waiting-online",
      "sender-waiting-ready",
      "sender-ready",
      "receiver-waiting-online",
      "receiver-ready",
      "settings-required"
    ].includes(mode);
  }

  function updateSettingsGearVisibility() {
    if (!settingsGear && !homeLink) {
      return;
    }

    const shouldShow = false;
    const shouldShowWaitingBack = [
      "sender-waiting-online",
      "receiver-waiting-online",
      "sender-waiting-ready",
      "receiver-ready"
    ].includes(currentUiMode);

    settingsGear?.classList.toggle("hidden", !shouldShow);
    homeLink?.classList.toggle("hidden", !shouldShow);
    waitingBackButton?.classList.toggle("hidden", !shouldShowWaitingBack);
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(settingsStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};

      return {
        own_email: typeof parsed?.own_email === "string" ? parsed.own_email : "",
        partner_email: typeof parsed?.partner_email === "string" ? parsed.partner_email : "",
        allow_second_choice: typeof parsed?.allow_second_choice === "boolean" ? parsed.allow_second_choice : false,
        export_email: typeof parsed?.export_email === "string" ? parsed.export_email : "",
        device_location: typeof parsed?.device_location === "string" ? parsed.device_location : "",
        data_folder_label: typeof parsed?.data_folder_label === "string" ? parsed.data_folder_label : "",
        last_logged_round_id: typeof parsed?.last_logged_round_id === "string" ? parsed.last_logged_round_id : ""
      };
    } catch (error) {
      return {
        own_email: "",
        partner_email: "",
        allow_second_choice: false,
        export_email: "",
        device_location: "",
        data_folder_label: "",
        last_logged_round_id: ""
      };
    }
  }

  function writeSettings(settings) {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function buildDisplayName(firstName, lastName) {
    return [firstName, lastName].filter(Boolean).join(" ").trim();
  }

  function normalizeIdentifierForSession(identifier) {
    return String(identifier || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function isLevelOneDifficulty() {
    return normalizeDifficultyLevel(currentPairDifficultyLevel) === "1";
  }

  function isLevelTwoDifficulty() {
    return normalizeDifficultyLevel(currentPairDifficultyLevel) === "2";
  }

  function isSingleChoiceDifficulty() {
    return isLevelOneDifficulty() || isLevelTwoDifficulty();
  }

  function getLevelOneCountChoiceFromLayoutNumber(layoutNumber) {
    if (Number(layoutNumber) === 1) {
      return 1;
    }

    return levelOneManyLayoutNumbers.includes(Number(layoutNumber)) ? 3 : null;
  }

  function getLevelOneFeedbackSelectedLayoutNumbers(selectedLayoutNumbers, actualLayoutNumber) {
    const firstSelection = Array.isArray(selectedLayoutNumbers) ? Number(selectedLayoutNumbers[0]) : null;

    if (firstSelection === 1) {
      return [1];
    }

    if (firstSelection === 3) {
      return [...levelOneManyLayoutNumbers];
    }

    return [];
  }

  function buildSessionCodeFromValues(ownEmail, partnerEmail) {
    const ownName = normalizeIdentifierForSession(ownEmail);
    const partnerName = normalizeIdentifierForSession(partnerEmail);

    if (!ownName || !partnerName) {
      return "";
    }

    return [ownName, partnerName].sort().join("__");
  }

  function getCurrentSessionCode() {
    const settings = readSettings();
    return buildSessionCodeFromValues(
      settings.own_email || "",
      settings.partner_email || ""
    );
  }

  function populateSettingsForm() {
    if (
      !settingsOwnEmailInput ||
      !settingsPartnerEmailInput
    ) {
      return;
    }

    const settings = readSettings();
    settingsOwnEmailInput.value = settings.own_email || "";
    settingsPartnerEmailInput.value = settings.partner_email || "";
    if (settingsAllowSecondChoiceCheckbox) {
      settingsAllowSecondChoiceCheckbox.checked = settings.allow_second_choice !== false;
      updateSecondChoiceSettingsControl(settings.allow_second_choice !== false);
    }
    if (settingsExportEmailInput) {
      settingsExportEmailInput.value = settings.export_email || "";
    }
    selectedDataFolderLabel = settings.data_folder_label || "";
    lastLoggedRoundId = settings.last_logged_round_id || "";

    if (usesBrowserStorageMode()) {
      updateFolderFieldValue("Server storage");
      updateFolderStatus("Completed trial data is stored on the server.");
      return;
    }

    const visibleFolderLabel = selectedDataFolderLabel || selectedDataFolderName || "";
    updateFolderFieldValue(visibleFolderLabel);
    updateFolderStatus(
      visibleFolderLabel
        ? "Completed trial data is stored on the server. This local folder setting is optional."
        : "Completed trial data is stored on the server."
    );
  }

  function getAllowSecondChoiceEnabled() {
    if (isSingleChoiceDifficulty()) {
      return false;
    }
    const settings = readSettings();
    return settings.allow_second_choice !== false;
  }

  function updateSecondChoiceSettingsControl(preferredChecked = null) {
    if (!settingsAllowSecondChoiceCheckbox) {
      return;
    }
    const lockedSingleChoice = role === "receiver" && isSingleChoiceDifficulty();
    const checkboxLabel = settingsAllowSecondChoiceCheckbox.closest(".settings-checkbox");
    const checkboxText = checkboxLabel?.querySelector("span");
    const effectiveChecked = preferredChecked === null
      ? (readSettings().allow_second_choice !== false)
      : !!preferredChecked;

    settingsAllowSecondChoiceCheckbox.checked = lockedSingleChoice ? false : effectiveChecked;
    settingsAllowSecondChoiceCheckbox.disabled = lockedSingleChoice;
    settingsAllowSecondChoiceCheckbox.title = lockedSingleChoice
      ? "Level 1 and Level 2 use one choice only."
      : "";
    if (checkboxLabel) {
      checkboxLabel.style.opacity = lockedSingleChoice ? "0.62" : "";
    }
      if (checkboxText) {
        checkboxText.textContent = lockedSingleChoice
          ? "Level 1 and Level 2 use one choice only."
          : "Allow a second choice as well as a first choice (applies only to Level 3).";
      }
  }

  function getCurrentProfile() {
    const settings = readSettings();
    return {
      own_email: settings.own_email || "",
      partner_email: settings.partner_email || "",
      name: String(settings.own_email || "").trim(),
      location: settings.device_location || ""
    };
  }

  function usesBrowserStorageMode() {
    return platformInfo.family === "iphone" || platformInfo.family === "android";
  }

  function applyLauncherPrefillFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("prefill") !== "1") {
        return;
      }

      const ownEmail = params.get("own_email") || "";
      const partnerEmail = params.get("partner_email") || "";
      const latitude = Number(params.get("loc_latitude"));
      const longitude = Number(params.get("loc_longitude"));
      const accuracy = Number(params.get("loc_accuracy"));
      const timestamp = Number(params.get("loc_timestamp"));

      if (!ownEmail && !partnerEmail) {
        return;
      }

      const settings = readSettings();
      settings.own_email = ownEmail || settings.own_email || "";
      settings.partner_email = partnerEmail || settings.partner_email || "";
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        settings.device_location = JSON.stringify({
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now()
        });
      }
      writeSettings(settings);

      const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (error) {
      // Ignore malformed prefill parameters.
    }
  }

  function hasRequiredSettings() {
    const settings = readSettings();
    const profile = getCurrentProfile();
    const sessionCode = buildSessionCodeFromValues(
      settings.own_email || "",
      settings.partner_email || ""
    );

    if (
      !profile.own_email ||
      !settings.partner_email ||
      !sessionCode
    ) {
      return false;
    }

    return true;
  }

  function noteUserInteraction() {
    if (settingsOpen || appExited) {
      return;
    }

    pendingInteractionMark = true;
  }

  function activateStartupStateAfterSettings() {
    if (settingsOpen) {
      return;
    }

    if (!hasRequiredSettings()) {
      showSettingsRequiredState();
      return;
    }

    if (role === "sender") {
      setUiMode("sender-waiting-online");
    } else {
      setUiMode("receiver-waiting-online");
    }

    void syncState();
  }

  function persistLastLoggedRoundId(roundId) {
    const settings = readSettings();
    settings.last_logged_round_id = roundId || "";
    writeSettings(settings);
    lastLoggedRoundId = settings.last_logged_round_id;
  }

  function persistDataFolderLabel(label) {
    const settings = readSettings();
    settings.data_folder_label = label || "";
    writeSettings(settings);
    selectedDataFolderLabel = settings.data_folder_label;
  }

  function collectSettingsDraft() {
    const existingSettings = readSettings();
    const allowSecondChoice = isSingleChoiceDifficulty()
      ? false
      : (settingsAllowSecondChoiceCheckbox
        ? settingsAllowSecondChoiceCheckbox.checked
        : (existingSettings.allow_second_choice !== false));
    return {
      own_email: settingsOwnEmailInput ? settingsOwnEmailInput.value.trim() : "",
      partner_email: settingsPartnerEmailInput ? settingsPartnerEmailInput.value.trim() : "",
      allow_second_choice: allowSecondChoice,
      export_email: settingsExportEmailInput ? settingsExportEmailInput.value.trim() : (existingSettings.export_email || ""),
      data_folder_label: selectedDataFolderLabel,
      last_logged_round_id: lastLoggedRoundId
    };
  }

  function serializeSettingsDraft(draft) {
    return JSON.stringify(draft);
  }

  function captureSettingsDraftSnapshot() {
    settingsDraftSnapshot = serializeSettingsDraft(collectSettingsDraft());
  }

  function hasUnsavedSettingsChanges() {
    return serializeSettingsDraft(collectSettingsDraft()) !== settingsDraftSnapshot;
  }

  function showSettingsConfirm(messageText, okLabel = "OK", cancelLabel = "CANCEL") {
    if (!settingsScreen) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "settings-confirm-overlay";

      const panel = document.createElement("div");
      panel.className = "settings-confirm-panel";

      const message = document.createElement("p");
      message.className = "settings-confirm-message";
      message.textContent = messageText;

      const actions = document.createElement("div");
      actions.className = "settings-confirm-actions";

      const okButton = document.createElement("button");
      okButton.className = "confidence-button";
      okButton.type = "button";
      okButton.textContent = okLabel;

      const cancelButton = document.createElement("button");
      cancelButton.className = "confidence-button confidence-button-secondary";
      cancelButton.type = "button";
      cancelButton.textContent = cancelLabel;

      const cleanup = (result) => {
        settingsConfirmDialog = null;
        overlay.remove();
        resolve(result);
      };

      okButton.addEventListener("click", () => cleanup(true));
      cancelButton.addEventListener("click", () => cleanup(false));

      actions.append(okButton, cancelButton);
      panel.append(message, actions);
      overlay.appendChild(panel);
      settingsScreen.appendChild(overlay);
      settingsConfirmDialog = overlay;
    });
  }

  function openFolderHandleDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(folderHandleDbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(folderHandleStoreName)) {
          db.createObjectStore(folderHandleStoreName);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error("Unable to open folder handle database."));
      };
    });
  }

  async function loadStoredFolderHandle() {
    if (!("indexedDB" in window)) {
      return null;
    }

    const db = await openFolderHandleDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(folderHandleStoreName, "readonly");
      const store = transaction.objectStore(folderHandleStoreName);
      const request = store.get(folderHandleKey);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };

      request.onerror = () => {
        reject(request.error || new Error("Unable to read stored folder handle."));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async function saveStoredFolderHandle(handle) {
    if (!("indexedDB" in window)) {
      return;
    }

    const db = await openFolderHandleDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(folderHandleStoreName, "readwrite");
      const store = transaction.objectStore(folderHandleStoreName);
      const request = store.put(handle, folderHandleKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error("Unable to save folder handle."));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  async function clearStoredFolderHandle() {
    if (!("indexedDB" in window)) {
      return;
    }

    const db = await openFolderHandleDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(folderHandleStoreName, "readwrite");
      const store = transaction.objectStore(folderHandleStoreName);
      const request = store.delete(folderHandleKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error("Unable to clear folder handle."));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  function updateFolderStatus(message) {
    if (!settingsFolderStatus) {
      return;
    }

    settingsFolderStatus.textContent = message;
  }

  function updateFolderFieldValue(value) {
    if (!settingsFolderInput) {
      return;
    }

    settingsFolderInput.value = value || "";
  }

  async function chooseDataFolder() {
    if (typeof window.showDirectoryPicker !== "function") {
      updateFolderStatus("This browser does not support folder selection here.");
      return;
    }

    try {
      let directoryHandle = await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents"
      });
      let folderLabel = directoryHandle.name;

      selectedDataFolderHandle = directoryHandle;
      selectedDataFolderName = directoryHandle.name;
      selectedDataFolderLabel = folderLabel;
      await saveStoredFolderHandle(directoryHandle);
      persistDataFolderLabel(folderLabel);
      updateFolderFieldValue(folderLabel);
      updateFolderStatus("Data folder selected.");
    } catch (error) {
      if (error?.name === "AbortError") {
        updateFolderStatus("Folder selection cancelled.");
        return;
      }

      if (error?.name === "SecurityError") {
        updateFolderStatus("Please choose a normal subfolder such as Documents\\Cones, not a protected root folder like Documents itself.");
        return;
      }

      updateFolderStatus("Unable to use the selected folder.");
    }
  }

  async function restoreDataFolderHandle() {
    if (usesBrowserStorageMode()) {
      selectedDataFolderHandle = null;
      selectedDataFolderName = "";
      selectedDataFolderLabel = "";
      updateFolderFieldValue("Server storage");
      updateFolderStatus("Completed trial data is stored on the server.");
      return;
    }

    try {
      const handle = await loadStoredFolderHandle();

      if (handle && typeof handle.kind === "string") {
        selectedDataFolderHandle = handle;
        selectedDataFolderName = handle.name || "";
        const savedLabel = readSettings().data_folder_label || selectedDataFolderName;
        selectedDataFolderLabel = savedLabel;
        updateFolderStatus(
          selectedDataFolderName
            ? "Data folder selected."
            : "A data folder is stored for this browser."
        );
        updateFolderFieldValue(savedLabel);
        return;
      }
    } catch (error) {
      // Ignore restore failures.
    }

    selectedDataFolderHandle = null;
    selectedDataFolderName = "";
    selectedDataFolderLabel = "";
    updateFolderFieldValue("");
    updateFolderStatus("No data folder selected yet.");
  }

  async function refreshAdminState() {
    try {
      const payload = await api("heartbeat", {
        receiver_ready: role === "receiver" ? receiverReady : false,
        stale_ms: staleMs,
        receiver_view: role === "receiver" ? buildReceiverViewState() : undefined
      });
      adminAuthorized = !!payload.is_admin;
      debugEnabled = !!payload.debug_enabled;
      adminStorageInfo = payload.storage || null;
      adminDiskUsageAnalysis = payload.disk_usage_analysis || null;
      return payload;
    } catch (error) {
      adminAuthorized = false;
      adminStorageInfo = null;
      adminDiskUsageAnalysis = null;
      return null;
    }
  }

  async function saveSettings() {
    if (
      !settingsOwnEmailInput ||
      !settingsPartnerEmailInput
    ) {
      return false;
    }

    const {
      ownEmail,
      partnerEmail
    } = persistSettingsDraftFromForm();

    if (!ownEmail || !partnerEmail) {
      updateFolderStatus("Please fill in all required (*) fields.");
      if (!ownEmail) {
        settingsOwnEmailInput.focus();
      } else {
        settingsPartnerEmailInput.focus();
      }
      return false;
    }

    await refreshAdminState();
    if (settingsOpen) {
      buildSettingsScreen();
      settingsScreen?.classList.add("visible");
    }
    updateFolderStatus("Settings saved.");
    captureSettingsDraftSnapshot();
    if (adminAuthorized) {
      openAdminScreen();
      return true;
    }
    if (hasRequiredSettings()) {
      settingsOpen = false;
      settingsScreen?.classList.remove("visible");
      activateStartupStateAfterSettings();
    }
    return true;
  }

  function persistSettingsDraftFromForm() {
    const draft = collectSettingsDraft();

    writeSettings(draft);

    return {
      ownEmail: draft.own_email,
      partnerEmail: draft.partner_email
    };
  }

  async function openSettings() {
    window.location.href = "telepathybeginner.html?open=settings";
  }

  async function closeSettings() {
    if (!settingsScreen) {
      return;
    }

    if (hasUnsavedSettingsChanges()) {
      const shouldExit = await showSettingsConfirm("Are you sure you want to exit Settings without saving your settings?");
      if (!shouldExit) {
        return;
      }
    }

    settingsOpen = false;
    settingsScreen.classList.remove("visible");
    activateStartupStateAfterSettings();
  }

  function buildSettingsScreen() {
    if (!settingsScreen) {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const header = document.createElement("div");
    header.className = "settings-header";

    const title = document.createElement("h2");
    title.className = "settings-title";
    title.textContent = "Settings";

    const closeControl = document.createElement("button");
    closeControl.className = "settings-close";
    closeControl.type = "button";
    closeControl.setAttribute("aria-label", "Close settings");
    closeControl.textContent = "Close: X";
    closeControl.addEventListener("click", () => {
      void closeSettings();
    });

    const restartControl = document.createElement("button");
    restartControl.className = "settings-restart";
    restartControl.type = "button";
    restartControl.setAttribute("aria-label", "Restart app");
    restartControl.innerHTML = 'Restart <span class="settings-restart-icon">↻</span>';
    restartControl.addEventListener("click", () => {
      window.location.reload();
    });

    const headerActions = document.createElement("div");
    headerActions.className = "settings-header-actions";
    headerActions.append(closeControl, restartControl);

    const form = document.createElement("form");
    form.className = "settings-form";
    form.noValidate = true;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveSettings();
    });

    const nameFieldGroup = document.createElement("label");
    nameFieldGroup.className = "settings-field";
    const nameLabel = document.createElement("span");
    nameLabel.className = "settings-label";
    nameLabel.innerHTML = 'Your email: <span class="settings-required">*</span>';
    const ownEmailInput = document.createElement("input");
    ownEmailInput.className = "settings-input";
    ownEmailInput.type = "email";
    ownEmailInput.required = true;
    ownEmailInput.autocomplete = "email";
    ownEmailInput.placeholder = "name@example.com";
    ownEmailInput.spellcheck = false;
    nameFieldGroup.append(nameLabel, ownEmailInput);

    const partnerFieldGroup = document.createElement("label");
    partnerFieldGroup.className = "settings-field";
    const partnerLabel = document.createElement("span");
    partnerLabel.className = "settings-label";
    partnerLabel.innerHTML = `${role === "sender" ? "Receiver's email" : "Sender's email"}: <span class="settings-required">*</span>`;
    const partnerEmailInput = document.createElement("input");
    partnerEmailInput.className = "settings-input";
    partnerEmailInput.type = "email";
    partnerEmailInput.required = true;
    partnerEmailInput.autocomplete = "off";
    partnerEmailInput.placeholder = "name@example.com";
    partnerEmailInput.spellcheck = false;
    partnerFieldGroup.append(partnerLabel, partnerEmailInput);

    let exportEmailField = null;
    let exportEmailInput = null;
    let exportEmailButton = null;
    let exportDataButton = null;
    if (usesBrowserStorageMode()) {
      exportEmailField = document.createElement("label");
      exportEmailField.className = "settings-field";

      const exportEmailLabel = document.createElement("span");
      exportEmailLabel.className = "settings-label";
      exportEmailLabel.textContent = "Email address for exported data";

      exportEmailInput = document.createElement("input");
      exportEmailInput.className = "settings-input";
      exportEmailInput.type = "email";
      exportEmailInput.autocomplete = "email";
      exportEmailInput.placeholder = "name@example.com";
      exportEmailField.append(exportEmailLabel, exportEmailInput);

      exportEmailButton = document.createElement("button");
      exportEmailButton.className = "confidence-button confidence-button-secondary";
      exportEmailButton.type = "button";
      exportEmailButton.textContent = "Email address for exported data";
      exportEmailButton.addEventListener("click", () => {
        const emailValue = exportEmailInput?.value.trim() || "";
        if (emailValue && exportEmailInput && !exportEmailInput.checkValidity()) {
          updateFolderStatus("Please enter a valid email address.");
          exportEmailInput.focus();
          return;
        }
        const settings = readSettings();
        settings.export_email = emailValue;
        writeSettings(settings);
        captureSettingsDraftSnapshot();
        updateFolderStatus(emailValue ? "Export email address saved." : "Export email address cleared.");
      });

      exportDataButton = document.createElement("button");
      exportDataButton.className = "confidence-button confidence-button-secondary";
      exportDataButton.type = "button";
      exportDataButton.textContent = "Export data";
      exportDataButton.addEventListener("click", () => {
        void exportMobileData();
      });
    }

    let secondChoiceField = null;
    let secondChoiceCheckbox = null;
    if (role === "receiver") {
      secondChoiceField = document.createElement("label");
      secondChoiceField.className = "settings-checkbox";
      secondChoiceCheckbox = document.createElement("input");
      secondChoiceCheckbox.type = "checkbox";
        secondChoiceCheckbox.checked = false;
      secondChoiceCheckbox.addEventListener("change", () => {
        updateSecondChoiceSettingsControl(secondChoiceCheckbox.checked);
      });
      const secondChoiceText = document.createElement("span");
      secondChoiceText.textContent = "Allow a second choice as well as a first choice (applies only to Level 3).";
      secondChoiceField.append(secondChoiceCheckbox, secondChoiceText);
    }

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const saveButton = document.createElement("button");
    saveButton.className = "confidence-button";
    saveButton.type = "submit";
    saveButton.textContent = "Save settings";

    let folderButton = null;
    if (!usesBrowserStorageMode()) {
      folderButton = document.createElement("button");
      folderButton.className = "confidence-button confidence-button-secondary";
      folderButton.type = "button";
        folderButton.textContent = "Choose optional data folder";
        folderButton.addEventListener("click", () => {
          void chooseDataFolder();
        });
    }

    let adminButton = null;
    if (adminAuthorized) {
      adminButton = document.createElement("button");
      adminButton.className = "confidence-button confidence-button-secondary";
      adminButton.type = "button";
      adminButton.textContent = "Admin";
      adminButton.addEventListener("click", () => {
        void openAdminScreen();
      });
    }

    const folderHelp = document.createElement("p");
    folderHelp.className = "settings-help";
    folderHelp.textContent = usesBrowserStorageMode()
      ? `${platformInfo.label} stores completed trial data on the server. A desktop-style chosen data folder is not required on this device.`
      : 'Completed trial data is stored on the server. A local data folder is optional and is no longer required for normal operation.';

    let folderFieldRow = null;
    let folderFieldLabel = null;
    let folderField = null;

    if (!usesBrowserStorageMode()) {
      folderFieldRow = document.createElement("label");
      folderFieldRow.className = "settings-folder-row";

        folderFieldLabel = document.createElement("span");
        folderFieldLabel.className = "settings-label settings-folder-label";
        folderFieldLabel.textContent = "Optional data folder:";

      folderField = document.createElement("input");
        folderField.className = "settings-input settings-input-readonly settings-folder-input";
        folderField.type = "text";
        folderField.readOnly = true;
        folderField.placeholder = "No optional data folder selected";
        folderFieldRow.append(folderFieldLabel, folderField);
      }

      const folderStatus = document.createElement("div");
      folderStatus.className = "settings-folder-status";
      folderStatus.textContent = "No optional data folder selected.";

    if (folderButton) {
      actions.append(folderButton);
    }
    actions.append(saveButton);
    if (exportEmailButton) {
      actions.append(exportEmailButton);
    }
    if (exportDataButton) {
      actions.append(exportDataButton);
    }
    if (adminButton) {
      actions.append(adminButton);
    }

    header.append(title, headerActions);
    form.append(nameFieldGroup, partnerFieldGroup);
    if (exportEmailField) {
      form.append(exportEmailField);
    }
    if (secondChoiceField) {
      form.append(secondChoiceField);
    }
    form.append(actions, folderHelp);
    if (folderFieldRow) {
      form.append(folderFieldRow);
    }
    form.append(folderStatus);
    panel.append(header, form);
    settingsScreen.replaceChildren(panel);

    settingsOwnEmailInput = ownEmailInput;
    settingsPartnerEmailInput = partnerEmailInput;
    settingsAllowSecondChoiceCheckbox = secondChoiceCheckbox;
    settingsExportEmailInput = exportEmailInput;
    settingsFolderStatus = folderStatus;
    settingsFolderInput = folderField;
    populateSettingsForm();
    updateSecondChoiceSettingsControl();
    if (usesBrowserStorageMode()) {
      updateFolderStatus("Completed trial data is stored on the server.");
    }
  }

  async function setDebugEnabled(enabled) {
    const response = await api("set_debug_enabled", {
      enabled
    });
    adminAuthorized = !!response.is_admin;
    debugEnabled = !!response.debug_enabled;
    adminStorageInfo = response.storage || adminStorageInfo;
    return response;
  }

  async function clearDebugLogFile() {
    const response = await api("clear_debug_log");
    adminAuthorized = !!response.is_admin;
    debugEnabled = !!response.debug_enabled;
    adminStorageInfo = response.storage || adminStorageInfo;
    return response;
  }

  async function clearServerUserData() {
    const response = await api("clear_user_data");
    adminAuthorized = !!response.is_admin;
    debugEnabled = !!response.debug_enabled;
    adminStorageInfo = response.storage || adminStorageInfo;
    return response;
  }

  async function analyzeServerDiskUsage() {
    const response = await api("analyze_disk_usage");
    adminAuthorized = !!response.is_admin;
    debugEnabled = !!response.debug_enabled;
    adminStorageInfo = response.storage || adminStorageInfo;
    adminDiskUsageAnalysis = response.disk_usage_analysis || null;
    return response;
  }

  function getStoredBrowserTrialRecords() {
    try {
      const raw = localStorage.getItem(localTrialRecordsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function buildCsvFromTrialRecords(records) {
    const header = [
      "export schema/version",
      "round_id",
      "rx name",
      "tx name",
      "local date",
      "local time",
      "sent layout",
      "rx choice1",
      "rx choice2",
      "confidence",
      "rx done rt",
      "utc time",
      "rx location",
      "tx location",
      "sync est",
      "sync best",
      "sync worst"
    ];
    const rows = [header.map(csvCell).join(",")];

    records.forEach((record) => {
      rows.push(header.map((key) => csvCell(record?.[key] ?? "")).join(","));
    });

    return `${rows.join("\n")}\n`;
  }

  async function exportMobileData() {
    const records = getStoredBrowserTrialRecords();
    if (!records.length) {
      updateFolderStatus("No browser-stored trial data is available to export.");
      return;
    }

    const csv = buildCsvFromTrialRecords(records);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const file = new File([blob], "cones-trials.csv", { type: "text/csv" });
    const exportEmail = (settingsExportEmailInput?.value || readSettings().export_email || "").trim();
    const shareText = exportEmail
      ? `Exported Cones data. Intended email recipient: ${exportEmail}`
      : "Exported Cones data.";

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Cones trial data",
          text: shareText,
          files: [file]
        });
        updateFolderStatus("Data export opened with your device's share options.");
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        updateFolderStatus("Data export was cancelled.");
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cones-trials.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    updateFolderStatus("Data export download started for this device.");
  }

  async function openAdminScreen() {
    if (!settingsScreen || !adminAuthorized) {
      return;
    }

    const panel = document.createElement("div");
    panel.className = "settings-panel";

    const header = document.createElement("div");
    header.className = "settings-header";

    const title = document.createElement("h2");
    title.className = "settings-title";
    title.textContent = "Admin";

    const closeControl = document.createElement("button");
    closeControl.className = "settings-close";
    closeControl.type = "button";
    closeControl.setAttribute("aria-label", "Back to settings");
    closeControl.textContent = "Back";
    closeControl.addEventListener("click", buildSettingsScreen);

    const body = document.createElement("div");
    body.className = "settings-form";

    const debugField = document.createElement("label");
    debugField.className = "settings-checkbox";
    const debugCheckbox = document.createElement("input");
    debugCheckbox.type = "checkbox";
    debugCheckbox.checked = debugEnabled;
    const debugText = document.createElement("span");
    debugText.textContent = "Enable debugging";
    debugField.append(debugCheckbox, debugText);

    const status = document.createElement("div");
    status.className = "settings-folder-status";
    status.textContent = debugEnabled ? "Debugging is currently enabled." : "Debugging is currently disabled.";

    const storageInfo = document.createElement("div");
    storageInfo.className = "settings-folder-status";
    if (adminStorageInfo?.available) {
      storageInfo.innerHTML =
        `Storage path: ${adminStorageInfo.path}<br>` +
        `Free space: ${adminStorageInfo.free_formatted}<br>` +
        `Used space: ${adminStorageInfo.used_formatted}<br>` +
        `Total space: ${adminStorageInfo.total_formatted}`;
    } else {
      storageInfo.textContent = "Storage information is not available right now.";
    }

    const clearButton = document.createElement("button");
    clearButton.className = "confidence-button confidence-button-secondary";
    clearButton.type = "button";
    clearButton.textContent = "Clear debugging file";

    const clearUserDataButton = document.createElement("button");
    clearUserDataButton.className = "confidence-button confidence-button-secondary";
    clearUserDataButton.type = "button";
    clearUserDataButton.textContent = "Clear user data";

    const analyzeDiskUsageButton = document.createElement("button");
    analyzeDiskUsageButton.className = "confidence-button confidence-button-secondary";
    analyzeDiskUsageButton.type = "button";
    analyzeDiskUsageButton.textContent = "Analyze disk usage";

    const diskUsageInfo = document.createElement("div");
    diskUsageInfo.className = "settings-folder-status";
    diskUsageInfo.style.whiteSpace = "pre-wrap";
    if (adminDiskUsageAnalysis?.available) {
      const sections = adminDiskUsageAnalysis.sections || {};
      diskUsageInfo.textContent =
        `Filesystem:\n${sections.filesystem || "(no output)"}\n\n` +
        `Largest top-level directories:\n${sections.top_level || "(no output)"}\n\n` +
        `/var/www breakdown:\n${sections.var_www || "(no output)"}`;
    } else if (adminDiskUsageAnalysis?.message) {
      diskUsageInfo.textContent = adminDiskUsageAnalysis.message;
    } else {
      diskUsageInfo.textContent = "Disk-usage analysis has not been run yet.";
    }

    debugCheckbox.addEventListener("change", async () => {
      status.textContent = "Saving admin setting...";
      try {
        await setDebugEnabled(debugCheckbox.checked);
        status.textContent = debugEnabled ? "Debugging is currently enabled." : "Debugging is currently disabled.";
      } catch (error) {
        debugCheckbox.checked = !debugCheckbox.checked;
        status.textContent = "Unable to save debugging setting right now.";
      }
    });

    clearButton.addEventListener("click", async () => {
      status.textContent = "Clearing debugging file...";
      try {
        await clearDebugLogFile();
        status.textContent = "Debugging file cleared.";
      } catch (error) {
        status.textContent = "Unable to clear debugging file right now.";
      }
    });

    clearUserDataButton.addEventListener("click", async () => {
      const confirmed = await showSettingsConfirm("Are you sure you want to delete all user data?", "YES", "CANCEL");
      if (!confirmed) {
        return;
      }
      status.textContent = "Clearing user data...";
      try {
        await clearServerUserData();
        status.textContent = "Server-side user data cleared.";
      } catch (error) {
        status.textContent = "Unable to clear user data right now.";
      }
    });

    analyzeDiskUsageButton.addEventListener("click", async () => {
      status.textContent = "Analyzing disk usage...";
      try {
        await analyzeServerDiskUsage();
        const sections = adminDiskUsageAnalysis?.sections || {};
        if (adminDiskUsageAnalysis?.available) {
          diskUsageInfo.textContent =
            `Filesystem:\n${sections.filesystem || "(no output)"}\n\n` +
            `Largest top-level directories:\n${sections.top_level || "(no output)"}\n\n` +
            `/var/www breakdown:\n${sections.var_www || "(no output)"}`;
          status.textContent = "Disk-usage analysis complete.";
        } else {
          diskUsageInfo.textContent = adminDiskUsageAnalysis?.message || "Disk-usage analysis is not available right now.";
          status.textContent = "Disk-usage analysis is not available right now.";
        }
      } catch (error) {
        status.textContent = "Unable to analyze disk usage right now.";
      }
    });

    header.append(title, closeControl);
    body.append(debugField, clearButton, clearUserDataButton, analyzeDiskUsageButton, storageInfo, diskUsageInfo, status);
    panel.append(header, body);
    settingsScreen.replaceChildren(panel);
    settingsScreen.classList.add("visible");
  }

  function getArrangementCode(layoutNumber) {
    const layout = layouts[layoutNumber];

    if (!Array.isArray(layout)) {
      return `arrangement-${layoutNumber}`;
    }

    return layout
      .map((point) => `${Math.round(point.x)}x${Math.round(point.y)}`)
      .sort()
      .join("_");
  }

  function getLayoutNumberFromArrangementCode(arrangementCode) {
    if (!arrangementCode) {
      return null;
    }

    for (let layoutNumber = 1; layoutNumber <= 9; layoutNumber += 1) {
      if (getArrangementCode(layoutNumber) === arrangementCode) {
        return layoutNumber;
      }
    }

    return null;
  }

  function isControllingSenderRound(round) {
    if (role !== "sender") {
      return false;
    }

    return round?.sender_client_id === clientId;
  }

  function setPrompt(text, interactive = false, ariaLabel = "") {
    countdownNumber.textContent = text;
    countdownNumber.classList.remove("settings-required-text");
    countdownNumber.classList.remove("compact");
    countdownNumber.style.fontSize = "";
    countdownNumber.style.lineHeight = "";
    countdownNumber.classList.add("prompt");
    if ((text || "").length > 55) {
      countdownNumber.classList.add("compact");
    }
    countdownBox.classList.remove("hidden");
    countdownBox.classList.toggle("interactive", interactive);

    if (interactive) {
      countdownBox.setAttribute("role", "button");
      countdownBox.setAttribute("tabindex", "0");
      countdownBox.setAttribute("aria-label", ariaLabel || text);
    } else {
      countdownBox.removeAttribute("role");
      countdownBox.removeAttribute("tabindex");
      countdownBox.removeAttribute("aria-label");
    }
  }

  function showCountdownValue(value) {
    countdownNumber.textContent = value;
    countdownNumber.classList.remove("prompt");
    countdownNumber.classList.remove("compact");
  }

  function hideCountdown() {
    countdownBox.classList.add("hidden");
  }

  function navigateToBeginnerFrontPage() {
    window.location.href = "telepathybeginner.html";
  }

  function showExitedState() {
    appExited = true;
    currentUiMode = "exited";
    senderHoldingResult = false;
    receiverReady = false;
    receiverMirrorPhase = "idle";
    localRoundRunning = false;
    roundScheduled = false;
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    updateSettingsGearVisibility();
    navigateToBeginnerFrontPage();
  }

  function showTimeoutState(message) {
    senderHoldingResult = false;
    receiverReady = false;
    receiverMirrorPhase = "idle";
    localRoundRunning = false;
    roundScheduled = false;
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    currentUiMode = "timeout-notice";
    setPrompt(message || "A timeout has occurred. Press to exit.", true, "A timeout has occurred. Press to exit.");
    updateSettingsGearVisibility();
  }

  function showPartnerAbortState(message) {
    senderHoldingResult = false;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    localRoundRunning = false;
    roundScheduled = false;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    receiverMirrorPhase = "idle";
    currentUiMode = "partner-abort";
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    setPrompt(
      message || "Your partner has quit this trial and returned to the home screen. Press here to return to the home screen.",
      true,
      "Your partner has quit this trial and returned to the home screen. Press here to return to the home screen."
    );
    updateSettingsGearVisibility();
  }

  function showPartnerDisconnectState(message) {
    senderHoldingResult = false;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    localRoundRunning = false;
    roundScheduled = false;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    receiverMirrorPhase = "idle";
    currentUiMode = "partner-disconnect";
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    setPrompt(
      message || "Partner disconnect - run over",
      true,
      "Partner disconnect - run over"
    );
    updateSettingsGearVisibility();
  }

  function showRoleConflictState(message) {
    senderHoldingResult = false;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    localRoundRunning = false;
    roundScheduled = false;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    receiverMirrorPhase = "idle";
    currentUiMode = "role-conflict";
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    setPrompt(
      message || "This sender-receiver pair already has an active participant in this role. Press here to return to the home screen.",
      true,
      "This sender-receiver pair already has an active participant in this role. Press here to return to the home screen."
    );
    updateSettingsGearVisibility();
  }

  function wasRunInProgress(remoteState = {}) {
    return !!(
      localRoundRunning ||
      roundScheduled ||
      awaitingReceiverDone ||
      receiverChoiceOpen ||
      confidenceScreenOpen ||
      instructionScreenOpen ||
      senderHoldingResult ||
      activeRound?.id ||
      remoteState.round?.id ||
      remoteState.post_round
    );
  }

  function showSettingsRequiredState() {
    senderHoldingResult = false;
    receiverReady = false;
    receiverMirrorPhase = "idle";
    localRoundRunning = false;
    roundScheduled = false;
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    currentUiMode = "settings-required";
    setPrompt("Settings are managed from the Telepathy Beginner home screen. Click the gear icon at the upper right to return there.", false);
    countdownNumber.classList.add("settings-required-text");
    countdownNumber.style.fontSize = "clamp(1.25rem, 2.6vw, 2rem)";
    countdownNumber.style.lineHeight = "1.22";
    updateSettingsGearVisibility();
  }

  function showStage() {
    stage.classList.add("visible");
  }

  function hideStage() {
    if (role === "sender" && senderHoldingResult) {
      return;
    }

    stage.classList.remove("visible");
  }

  function clearStageVisibility() {
    arrangementNodes.forEach((node) => {
      node.classList.remove("visible");
    });
  }

  function getConfidenceDescription(value) {
    const descriptions = {
      0: "Not the slightest idea.",
      1: "Almost no idea at all.",
      2: "I think I got just the slightest clue",
      3: "I got the slightest clue.",
      4: "I got a clue.",
      5: "I think this may be right or close.",
      6: "I think this is more likely than not.",
      7: "I think this is probably it.",
      8: "I'm somewhat sure this is it.",
      9: "I'm quite sure this is it.",
      10: "I'm sure this is it!"
    };

    return descriptions[value] || "";
  }

  function resetVisualState() {
    senderHoldingResult = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    choiceInstructionShown = false;
    receiverTransitioningScreen = false;
    localRoundRunning = false;
    roundScheduled = false;
    currentUiMode = "";
    receiverBeepEndPerformanceMs = 0;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    pendingGuessLayoutNumbers = [];
    pendingGuessArrangementCodes = [];
    pendingConfidenceValue = 5;
    receiverSelectionLimit = 1;
    receiverRevealStartedMs = 0;
    receiverDoneReactionMs = null;
    receiverMirrorPhase = "idle";
    receiverConfidenceLockedAtMs = 0;
    postRoundChoiceSubmitted = false;
    postRoundClearPending = false;
    appExited = false;
    if (postRoundAutoClearHandle !== null) {
      window.clearTimeout(postRoundAutoClearHandle);
      postRoundAutoClearHandle = null;
    }
    clearStageVisibility();
    stage.classList.remove("visible");
    countdownBox.classList.remove("hidden");
    countdownBox.classList.remove("interactive");
    countdownNumber.classList.remove("prompt");
    countdownNumber.textContent = "";
    if (confidencePanel) {
      confidencePanel.classList.remove("visible");
    }
    if (instructionPanel) {
      instructionPanel.classList.remove("visible");
    }
    if (decisionPanel) {
      decisionPanel.classList.remove("visible");
    }
    if (messagePanel) {
      messagePanel.classList.remove("visible");
    }
    if (settingsScreen) {
      settingsScreen.classList.remove("visible");
    }
    settingsOpen = false;
    updateSettingsGearVisibility();
  }

  function updateOffset(serverNowMs, requestStartedMs, requestFinishedMs) {
    const rttMs = requestFinishedMs - requestStartedMs;
    const midpointMs = requestStartedMs + rttMs / 2;
    const estimateMs = serverNowMs - midpointMs;

    if (rttMs <= bestOffsetRttMs) {
      bestOffsetRttMs = rttMs;
      serverOffsetMs = estimateMs;
    }
  }

  function estimatedServerNowMs() {
    return Date.now() + serverOffsetMs;
  }

  function getSyncMetrics() {
    const safeBestRttMs = Number.isFinite(bestOffsetRttMs) ? bestOffsetRttMs : null;
    const perClientWorstMs = safeBestRttMs === null ? null : safeBestRttMs / 2;

    return {
      offset_ms: Number.isFinite(serverOffsetMs) ? Math.round(serverOffsetMs) : 0,
      best_rtt_ms: safeBestRttMs === null ? null : Math.round(safeBestRttMs),
      uncertainty_worst_ms: perClientWorstMs === null ? null : Math.round(perClientWorstMs),
      uncertainty_est_ms: perClientWorstMs === null ? null : Math.round(perClientWorstMs / 2),
      uncertainty_best_ms: 0
    };
  }

  async function api(action, payload = {}) {
    const requestStartedMs = Date.now();
    const shouldMarkInteraction = pendingInteractionMark;
    const response = await fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
        body: JSON.stringify({
          action,
          role,
          client_id: clientId,
          frontend_build_version: runtimeBuildVersion,
          session_code: getCurrentSessionCode(),
          profile: getCurrentProfile(),
        sync_metrics: getSyncMetrics(),
        mark_interaction: shouldMarkInteraction,
        ...payload
      })
    });
    const requestFinishedMs = Date.now();
    const data = await response.json();

    if (shouldMarkInteraction) {
      pendingInteractionMark = false;
    }

    if (Number.isFinite(data.server_now_ms)) {
      updateOffset(data.server_now_ms, requestStartedMs, requestFinishedMs);
    }

    return data;
  }

  async function abortTrialAndReturnHome() {
    try {
      const response = await api("abort_to_home");
      await appendTrialServerRecord(response?.state || {}, { aborted: true });
    } catch (error) {
      // Ignore abort sync failures and still return home locally.
    } finally {
      navigateToBeginnerFrontPage();
    }
  }

  function readReceiverSkipInstructions() {
    try {
      return localStorage.getItem(receiverSkipInstructionKey) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeReceiverSkipInstructions(value) {
    try {
      localStorage.setItem(receiverSkipInstructionKey, value ? "1" : "0");
    } catch (error) {
      // Ignore storage failures.
    }
  }

  async function logDebugEvent(label, details = {}) {
    try {
      await api("log_debug", {
        label,
        details
      });
    } catch (error) {
      // Ignore debug logging failures.
    }
  }

  async function traceClientEvent(label, details = {}) {
    try {
      await api("trace_client", {
        label,
        details: {
          ...details,
          runtime_build_version: runtimeBuildVersion
        }
      });
    } catch (error) {
      // Ignore trace failures.
    }
  }

  function buildConfidencePanel() {
    if (role !== "receiver") {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "confidence-panel arrangement";
    panel.id = "confidencePanel";

    const label = document.createElement("p");
    label.className = "confidence-label";
    label.textContent = "CONFIDENCE";

    const value = document.createElement("p");
    value.className = "confidence-value";
    value.textContent = "5";

    const slider = document.createElement("input");
    slider.className = "confidence-slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "10";
    slider.step = "1";
    slider.value = "5";

    const ticks = document.createElement("div");
    ticks.className = "confidence-ticks";
    for (let tick = 0; tick <= 10; tick += 1) {
      const tickLabel = document.createElement("span");
      tickLabel.textContent = String(tick);
      ticks.appendChild(tickLabel);
    }

    const description = document.createElement("p");
    description.className = "confidence-description";
    description.textContent = getConfidenceDescription(5);

    const button = document.createElement("button");
    button.className = "confidence-button";
    button.type = "button";
    button.textContent = "Reveal Target";

    slider.addEventListener("input", () => {
      const sliderValue = Number(slider.value);
      pendingConfidenceValue = sliderValue;
      value.textContent = String(sliderValue);
      description.textContent = getConfidenceDescription(sliderValue);
      void pushReceiverViewState();
      void triggerImmediateSync();
    });

    button.addEventListener("click", () => {
      pendingConfidenceValue = Number(slider.value);
      receiverConfidenceLockedAtMs = estimatedServerNowMs();
      receiverMirrorPhase = "confidence-final";
      void pushReceiverViewState();
      void triggerImmediateSync();
      void submitReceiverGuessAndReveal();
      button.disabled = true;
      if (twoChoiceButton) {
        twoChoiceButton.disabled = true;
      }
    });

    panel.append(label, value, slider, ticks, description, button);
    confidencePanel = panel;
    confidenceSlider = slider;
    confidenceValue = value;
    confidenceDescription = description;
    confidenceButton = button;
    twoChoiceButton = null;
    arrangementNodes.set("receiver-confidence-panel", panel);
    stage.appendChild(panel);
  }

  function buildInstructionPanel() {
    if (role !== "receiver") {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "instruction-panel arrangement";
    panel.id = "instructionPanel";

    const message = document.createElement("p");
    message.className = "instruction-message";
    message.textContent = "On the next screen, first select your first choice for the target, then select your second choice.";

    const checkboxLabel = document.createElement("label");
    checkboxLabel.className = "instruction-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = receiverSkipInstructions;
    checkbox.addEventListener("change", () => {
      receiverSkipInstructions = checkbox.checked;
      writeReceiverSkipInstructions(receiverSkipInstructions);
    });

    const checkboxText = document.createElement("span");
    checkboxText.textContent = "Don't show me this again.";
    checkboxLabel.append(checkbox, checkboxText);

    const button = document.createElement("button");
    button.className = "confidence-button";
    button.type = "button";
    button.textContent = "CONTINUE";
    button.addEventListener("click", () => {
      receiverSkipInstructions = checkbox.checked;
      writeReceiverSkipInstructions(receiverSkipInstructions);
      beginReceiverSelection(getAllowSecondChoiceEnabled() ? 2 : 1);
    });

    panel.append(message, checkboxLabel, button);
    instructionPanel = panel;
    skipInstructionsCheckbox = checkbox;
    arrangementNodes.set("receiver-instruction-panel", panel);
    stage.appendChild(panel);
  }

  function buildSenderConfidencePanel() {
    if (role !== "sender") {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "confidence-panel arrangement";
    panel.id = "senderConfidencePanel";

    const label = document.createElement("p");
    label.className = "confidence-label";
    label.textContent = "CONFIDENCE";

    const value = document.createElement("p");
    value.className = "confidence-value";
    value.textContent = "5";

    const slider = document.createElement("input");
    slider.className = "confidence-slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "10";
    slider.step = "1";
    slider.value = "5";
    slider.disabled = true;

    const ticks = document.createElement("div");
    ticks.className = "confidence-ticks";
    for (let tick = 0; tick <= 10; tick += 1) {
      const tickLabel = document.createElement("span");
      tickLabel.textContent = String(tick);
      ticks.appendChild(tickLabel);
    }

    const description = document.createElement("p");
    description.className = "confidence-description";
    description.textContent = getConfidenceDescription(5);

    panel.append(label, value, slider, ticks, description);
    senderConfidencePanel = panel;
    senderConfidenceValue = value;
    senderConfidenceDescription = description;
    arrangementNodes.set("sender-confidence-panel", panel);
    stage.appendChild(panel);
  }

  function buildSenderChoiceGrid() {
    if (role !== "sender") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "choice-grid arrangement read-only";
    grid.id = "senderChoiceGrid";

    for (let layoutNumber = 1; layoutNumber <= 9; layoutNumber += 1) {
      const card = document.createElement("button");
      card.className = "choice-card";
      card.type = "button";
      card.disabled = true;
      card.setAttribute("data-layout-number", String(layoutNumber));
      card.setAttribute("data-arrangement-code", getArrangementCode(layoutNumber));
      card.setAttribute("aria-label", `Arrangement ${layoutNumber}`);

      const miniArrangement = document.createElement("canvas");
      miniArrangement.className = "choice-canvas";
      renderChoiceCanvas(miniArrangement, layoutNumber);

      card.appendChild(miniArrangement);
      senderChoiceNodes.set(getArrangementCode(layoutNumber), card);
      grid.appendChild(card);
    }

    arrangementNodes.set("sender-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildLevelOneChoiceCard(choiceValue, labelTop, labelBottom, readOnly = false) {
    const card = document.createElement("button");
    card.className = "level-one-choice-card";
    card.type = "button";
    card.setAttribute("data-layout-number", String(choiceValue));
    card.setAttribute("data-arrangement-code", `count-${choiceValue}`);
    card.setAttribute("aria-label", `${labelTop} ${labelBottom}`);
    if (readOnly) {
      card.disabled = true;
    }

    const text = document.createElement("span");
    text.className = "level-one-choice-text";

    const top = document.createElement("span");
    top.textContent = labelTop;

    const bottom = document.createElement("span");
    bottom.textContent = labelBottom;

    text.append(top, bottom);
    card.appendChild(text);
    return card;
  }

  function buildReceiverLevelOneChoiceGrid() {
    if (role !== "receiver") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "level-one-choice-grid arrangement";
    grid.id = "receiverLevelOneChoiceGrid";

    const oneCard = buildLevelOneChoiceCard(1, "One", "cone");
    const manyCard = buildLevelOneChoiceCard(3, "Many", "cones");

    oneCard.addEventListener("click", () => {
      void handleReceiverChoice(1);
    });
    manyCard.addEventListener("click", () => {
      void handleReceiverChoice(3);
    });

    levelOneChoiceNodes.set("count-1", oneCard);
    levelOneChoiceNodes.set("count-3", manyCard);
    grid.append(oneCard, manyCard);
    arrangementNodes.set("receiver-level-one-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildSenderLevelOneChoiceGrid() {
    if (role !== "sender") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "level-one-choice-grid arrangement read-only";
    grid.id = "senderLevelOneChoiceGrid";

    const oneCard = buildLevelOneChoiceCard(1, "One", "cone", true);
    const manyCard = buildLevelOneChoiceCard(3, "Many", "cones", true);

    senderLevelOneChoiceNodes.set("count-1", oneCard);
    senderLevelOneChoiceNodes.set("count-3", manyCard);
    grid.append(oneCard, manyCard);
    arrangementNodes.set("sender-level-one-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildLevelOneFeedbackCard(layoutNumber) {
    const card = document.createElement("div");
    card.className = "choice-card level-one-feedback-card";
    card.setAttribute("data-layout-number", String(layoutNumber));
    card.setAttribute("data-arrangement-code", getArrangementCode(layoutNumber));
    card.setAttribute("data-level-one-slot", String(layoutNumber));

    const miniArrangement = document.createElement("canvas");
    miniArrangement.className = "choice-canvas";
    renderChoiceCanvas(miniArrangement, layoutNumber);
    card.appendChild(miniArrangement);
    return card;
  }

  function buildLevelSubsetChoiceCard(layoutNumber, readOnly = false) {
    const card = document.createElement("button");
    card.className = "choice-card level-one-feedback-card";
    card.type = "button";
    card.setAttribute("data-layout-number", String(layoutNumber));
    card.setAttribute("data-arrangement-code", getArrangementCode(layoutNumber));
    card.setAttribute("data-level-one-slot", String(layoutNumber));
    card.setAttribute("aria-label", `Choose arrangement ${layoutNumber}`);

    if (readOnly) {
      card.disabled = true;
    }

    const miniArrangement = document.createElement("canvas");
    miniArrangement.className = "choice-canvas";
    renderChoiceCanvas(miniArrangement, layoutNumber);
    card.appendChild(miniArrangement);
    return card;
  }

  function buildReceiverLevelOneFeedbackGrid() {
    if (role !== "receiver") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "level-one-feedback-grid arrangement";
    grid.id = "receiverLevelOneFeedbackGrid";

    levelOneTargetLayoutNumbers.forEach((layoutNumber) => {
      const card = buildLevelOneFeedbackCard(layoutNumber);
      levelOneFeedbackNodes.set(getArrangementCode(layoutNumber), card);
      grid.appendChild(card);
    });

    arrangementNodes.set("receiver-level-one-feedback-grid", grid);
    stage.appendChild(grid);
  }

  function buildSenderLevelOneFeedbackGrid() {
    if (role !== "sender") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "level-one-feedback-grid arrangement read-only";
    grid.id = "senderLevelOneFeedbackGrid";

    levelOneTargetLayoutNumbers.forEach((layoutNumber) => {
      const card = buildLevelOneFeedbackCard(layoutNumber);
      senderLevelOneFeedbackNodes.set(getArrangementCode(layoutNumber), card);
      grid.appendChild(card);
    });

    arrangementNodes.set("sender-level-one-feedback-grid", grid);
    stage.appendChild(grid);
  }

  function buildReceiverLevelTwoChoiceGrid() {
    if (role !== "receiver") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "level-one-feedback-grid arrangement";
    grid.id = "receiverLevelTwoChoiceGrid";

    levelOneTargetLayoutNumbers.forEach((layoutNumber) => {
      const card = buildLevelSubsetChoiceCard(layoutNumber);
      card.addEventListener("click", () => {
        void handleReceiverChoice(layoutNumber);
      });
      levelTwoChoiceNodes.set(getArrangementCode(layoutNumber), card);
      grid.appendChild(card);
    });

    arrangementNodes.set("receiver-level-two-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildSenderLevelTwoChoiceGrid() {
    if (role !== "sender") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "level-one-feedback-grid arrangement read-only";
    grid.id = "senderLevelTwoChoiceGrid";

    levelOneTargetLayoutNumbers.forEach((layoutNumber) => {
      const card = buildLevelSubsetChoiceCard(layoutNumber, true);
      senderLevelTwoChoiceNodes.set(getArrangementCode(layoutNumber), card);
      grid.appendChild(card);
    });

    arrangementNodes.set("sender-level-two-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildDecisionPanel() {
    const panel = document.createElement("section");
    panel.className = "decision-panel arrangement";
    panel.id = `${role}DecisionPanel`;

    const enough = document.createElement("button");
    enough.className = "confidence-button decision-button";
    enough.type = "button";
    enough.textContent = "Thanks! I've had enough for now.";
    enough.addEventListener("click", () => {
      void submitPostRoundChoice("enough");
    });

    const another = document.createElement("button");
    another.className = "confidence-button decision-button";
    another.type = "button";
    another.textContent = "Another?";
    another.addEventListener("click", () => {
      void submitPostRoundChoice("another");
    });

    panel.append(enough, another);
    decisionPanel = panel;
    enoughButton = enough;
    anotherButton = another;
    arrangementNodes.set(`${role}-decision-panel`, panel);
    stage.appendChild(panel);
  }

  function buildMessagePanel() {
    const panel = document.createElement("section");
    panel.className = "message-panel arrangement";
    panel.id = `${role}MessagePanel`;

    const text = document.createElement("p");
    text.className = "message-text";

    const actions = document.createElement("div");
    actions.className = "message-actions";

    panel.append(text, actions);
    messagePanel = panel;
    messageText = text;
    messageActions = actions;
    arrangementNodes.set(`${role}-message-panel`, panel);
    stage.appendChild(panel);
  }

  async function preloadConeAsset() {
    return new Promise((resolve, reject) => {
      const preloadImage = new Image();

      preloadImage.onload = async () => {
        try {
          if (typeof preloadImage.decode === "function") {
            await preloadImage.decode();
          }
        } catch (error) {
          // Ignore decode failures after a successful load.
        }

        preloadedConeImage = preloadImage;
        resolve(preloadImage);
      };

      preloadImage.onerror = () => {
        reject(new Error(`Unable to preload cone asset: ${coneSrc}`));
      };

      preloadImage.src = coneSrc;
    });
  }

  function renderChoiceCanvas(canvas, layoutNumber) {
    if (!preloadedConeImage) {
      return;
    }

    const context = canvas.getContext("2d");
    const canvasSize = 300;
    const coneWidth = 82;
    const coneHeight = coneWidth * (preloadedConeImage.naturalHeight / preloadedConeImage.naturalWidth);

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    context.clearRect(0, 0, canvasSize, canvasSize);
    context.imageSmoothingEnabled = true;

    layouts[layoutNumber].forEach((point) => {
      const x = canvasSize * (point.x / 100) - coneWidth / 2;
      const y = canvasSize * (point.y / 100) - coneHeight / 2;
      context.drawImage(preloadedConeImage, x, y, coneWidth, coneHeight);
    });
  }

  function buildArrangement(layoutNumber) {
    const arrangement = document.createElement("div");
    arrangement.className = "arrangement";
    arrangement.setAttribute("data-arrangement", String(layoutNumber));
    arrangement.setAttribute("data-arrangement-code", getArrangementCode(layoutNumber));

    layouts[layoutNumber].forEach((point, index) => {
      const cone = document.createElement("img");
      cone.className = "cone";
      cone.src = coneSrc;
      cone.alt = "Orange traffic cone";
      cone.loading = "eager";
      cone.decoding = "async";
      cone.style.left = `${point.x}%`;
      cone.style.top = `${point.y}%`;
      cone.style.zIndex = String(index + 1);
      arrangement.appendChild(cone);
    });

    arrangementNodes.set(layoutNumber, arrangement);
    stage.appendChild(arrangement);
  }

  function buildAllArrangements() {
    for (let layoutNumber = 1; layoutNumber <= 9; layoutNumber += 1) {
      buildArrangement(layoutNumber);
    }
  }

  function showArrangement(layoutNumber) {
    arrangementNodes.forEach((node) => {
      node.classList.remove("visible");
    });

    const targetArrangement = arrangementNodes.get(layoutNumber);

    if (targetArrangement) {
      targetArrangement.classList.add("visible");
    }
  }

  function buildChoiceGrid() {
    if (role !== "receiver") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "choice-grid arrangement";
    grid.id = "receiverChoiceGrid";

    for (let layoutNumber = 1; layoutNumber <= 9; layoutNumber += 1) {
        const card = document.createElement("button");
        card.className = "choice-card";
        card.type = "button";
        card.setAttribute("data-layout-number", String(layoutNumber));
        card.setAttribute("data-arrangement-code", getArrangementCode(layoutNumber));
        card.setAttribute("aria-label", `Choose arrangement ${layoutNumber}`);

        const miniArrangement = document.createElement("canvas");
        miniArrangement.className = "choice-canvas";
        renderChoiceCanvas(miniArrangement, layoutNumber);

        card.appendChild(miniArrangement);
        card.addEventListener("click", () => {
          void handleReceiverChoice(layoutNumber);
        });
        choiceNodes.set(getArrangementCode(layoutNumber), card);
        grid.appendChild(card);
      }

    arrangementNodes.set("receiver-choice-grid", grid);
    stage.appendChild(grid);
  }

  function getChoiceGridKey() {
    if (isLevelOneDifficulty()) {
      return role === "receiver" ? "receiver-level-one-choice-grid" : "sender-level-one-choice-grid";
    }

    if (isLevelTwoDifficulty()) {
      return role === "receiver" ? "receiver-level-two-choice-grid" : "sender-level-two-choice-grid";
    }

    return role === "receiver" ? "receiver-choice-grid" : "sender-choice-grid";
  }

  function getActiveSelectionNodesMap() {
    if (isLevelOneDifficulty()) {
      return role === "receiver" ? levelOneChoiceNodes : senderLevelOneChoiceNodes;
    }

    if (isLevelTwoDifficulty()) {
      return role === "receiver" ? levelTwoChoiceNodes : senderLevelTwoChoiceNodes;
    }

    return role === "receiver" ? choiceNodes : senderChoiceNodes;
  }

  function showChoiceGrid() {
    const grid = arrangementNodes.get(getChoiceGridKey());

    if (!grid) {
      return;
    }

    receiverChoiceOpen = true;
    updateChoiceGridLayout();
    showStage();
    grid.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function hideChoiceGrid() {
    const grid = arrangementNodes.get(getChoiceGridKey());

    if (!grid) {
      return;
    }

    grid.classList.remove("visible");
    receiverChoiceOpen = false;
    updateSettingsGearVisibility();
  }

  function showLevelOneFeedbackGrid(isSenderMirror = false) {
    const key = isSenderMirror ? "sender-level-one-feedback-grid" : "receiver-level-one-feedback-grid";
    const grid = arrangementNodes.get(key);

    if (!grid) {
      return;
    }

    if (!isSenderMirror) {
      receiverChoiceOpen = true;
      currentUiMode = "receiver-results";
    }

    clearStageVisibility();
    showStage();
    grid.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function showConfidencePanel() {
    if (
      !confidencePanel ||
      !confidenceSlider ||
      !confidenceValue ||
      !confidenceDescription ||
      !confidenceButton
    ) {
      return;
    }

    confidenceScreenOpen = true;
    confidenceSlider.value = "5";
    pendingConfidenceValue = 5;
    confidenceValue.textContent = "5";
    confidenceDescription.textContent = getConfidenceDescription(5);
    confidenceButton.disabled = false;
    receiverMirrorPhase = "confidence";
    showStage();
    confidencePanel.classList.add("visible");
    updateSettingsGearVisibility();
    void pushReceiverViewState();
  }

  function hideConfidencePanel() {
    if (!confidencePanel) {
      return;
    }

    confidencePanel.classList.remove("visible");
    confidenceScreenOpen = false;
    updateSettingsGearVisibility();
  }

  function showInstructionPanel() {
    if (!instructionPanel) {
      return;
    }

    hideConfidencePanel();
    instructionScreenOpen = true;
    showStage();
    instructionPanel.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function hideInstructionPanel() {
    if (!instructionPanel) {
      return;
    }

    instructionPanel.classList.remove("visible");
    instructionScreenOpen = false;
    updateSettingsGearVisibility();
  }

  function showDecisionPanel() {
    if (!decisionPanel || !enoughButton || !anotherButton) {
      return;
    }

    enoughButton.disabled = false;
    anotherButton.disabled = false;
    enoughButton.classList.remove("decision-button-selected");
    anotherButton.classList.remove("decision-button-selected");
    decisionPanel.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function hideDecisionPanel() {
    if (!decisionPanel) {
      return;
    }

    decisionPanel.classList.remove("visible");
    updateSettingsGearVisibility();
  }

  function setDecisionSelection(choice) {
    if (!enoughButton || !anotherButton) {
      return;
    }

    enoughButton.classList.toggle("decision-button-selected", choice === "enough");
    anotherButton.classList.toggle("decision-button-selected", choice === "another");
    enoughButton.disabled = true;
    anotherButton.disabled = true;
  }

  function schedulePostRoundClear(mode, delayMs = 1200) {
    if (postRoundClearPending || postRoundAutoClearHandle !== null) {
      return;
    }

    postRoundAutoClearHandle = window.setTimeout(() => {
      postRoundAutoClearHandle = null;
      void clearPostRound(mode);
    }, delayMs);
  }

  function showMessagePanel(text, actions) {
    if (!messagePanel || !messageText || !messageActions) {
      return;
    }

    messageText.textContent = text;
    messageActions.replaceChildren();
    messagePanel.classList.toggle("compact", actions.length === 0);

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "confidence-button decision-button";
      if (action.selected) {
        button.classList.add("decision-button-selected");
      }
      button.type = "button";
      button.textContent = action.label;
      if (typeof action.onClick === "function") {
        button.addEventListener("click", action.onClick);
      } else {
        button.disabled = true;
      }
      if (action.disabled) {
        button.disabled = true;
      }
      messageActions.appendChild(button);
    });

    messagePanel.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function hideMessagePanel() {
    if (!messagePanel) {
      return;
    }

    messagePanel.classList.remove("compact");
    messagePanel.classList.remove("visible");
    updateSettingsGearVisibility();
  }

  function updateChoiceGridLayout() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gridSize = Math.min(viewportWidth * 0.84, viewportHeight * 0.84, 820);
    const gap = Math.max(8, Math.min(gridSize * 0.022, 14));
    const padding = Math.max(6, Math.min(gridSize * 0.014, 10));
    const cellSize = (gridSize - gap * 2) / 3;
    const coneSize = Math.max(24, Math.min(cellSize * 0.33, 62));

    const grids = [
      "receiver-choice-grid",
      "sender-choice-grid",
      "receiver-level-two-choice-grid",
      "sender-level-two-choice-grid",
      "receiver-level-one-feedback-grid",
      "sender-level-one-feedback-grid"
    ];

    for (const key of grids) {
      const grid = arrangementNodes.get(key);

      if (!grid) {
        continue;
      }

      grid.style.width = `${gridSize}px`;
      grid.style.setProperty("--choice-gap", `${gap}px`);
      grid.style.setProperty("--choice-padding", `${padding}px`);
      grid.style.setProperty("--choice-cone-size", `${coneSize}px`);
    }
  }

  function resetChoiceNodes(nodesMap) {
    nodesMap.forEach((node) => {
      node.removeAttribute("data-choice-order");
      node.classList.remove("pending");
      node.classList.remove("selected");
      node.classList.remove("actual");
    });
  }

  function renderChoiceSelection(nodesMap, selectedLayoutNumbers, actualLayoutNumber = null) {
    const shouldShowChoiceOrder = !isLevelOneDifficulty() && selectedLayoutNumbers.length > 1;

    nodesMap.forEach((node) => {
      const layoutNumber = Number(node.dataset.layoutNumber);
      const choiceOrders = [];

      selectedLayoutNumbers.forEach((selectedLayoutNumber, index) => {
        if (selectedLayoutNumber === layoutNumber) {
          choiceOrders.push(String(index + 1));
        }
      });

      const isSelected = choiceOrders.length > 0;
      node.classList.toggle("pending", isSelected);
      node.classList.toggle("selected", isSelected);
      node.classList.toggle("actual", actualLayoutNumber === layoutNumber);

      if (isSelected && shouldShowChoiceOrder) {
        node.setAttribute("data-choice-order", choiceOrders.join(","));
      } else {
        node.removeAttribute("data-choice-order");
      }
    });
  }

  function resetReceiverChoices() {
    const choiceGrid = arrangementNodes.get("receiver-choice-grid");
    choiceGrid?.classList.remove("results-locked");
    choiceNodes.forEach((node) => {
      node.disabled = false;
      node.style.pointerEvents = "";
      node.removeAttribute("tabindex");
    });
    resetChoiceNodes(choiceNodes);

    const levelOneGrid = arrangementNodes.get("receiver-level-one-choice-grid");
    levelOneGrid?.classList.remove("results-locked");
    levelOneChoiceNodes.forEach((node) => {
      node.disabled = false;
      node.style.pointerEvents = "";
      node.removeAttribute("tabindex");
    });
    resetChoiceNodes(levelOneChoiceNodes);

    resetChoiceNodes(levelOneFeedbackNodes);

    const levelTwoGrid = arrangementNodes.get("receiver-level-two-choice-grid");
    levelTwoGrid?.classList.remove("results-locked");
    levelTwoChoiceNodes.forEach((node) => {
      node.disabled = false;
      node.style.pointerEvents = "";
      node.removeAttribute("tabindex");
    });
    resetChoiceNodes(levelTwoChoiceNodes);
  }

  function markPendingChoices(selectedLayoutNumbers) {
    renderChoiceSelection(getActiveSelectionNodesMap(), selectedLayoutNumbers, null);
  }

  function buildReceiverViewState() {
    return {
      phase: receiverMirrorPhase,
      confidence_value: pendingConfidenceValue,
      selection_limit: receiverSelectionLimit,
      selected_arrangement_codes: [...pendingGuessArrangementCodes],
      selected_layout_numbers: [...pendingGuessLayoutNumbers],
      confidence_locked_at_ms: receiverConfidenceLockedAtMs || null,
      done_reaction_ms: receiverDoneReactionMs
    };
  }

  async function pushReceiverViewState() {
    if (role !== "receiver") {
      return;
    }

    try {
      const payload = await api("heartbeat", {
        receiver_ready: receiverReady,
        stale_ms: staleMs,
        receiver_view: buildReceiverViewState()
      });
      applyRemoteState(payload);
    } catch (error) {
      // Ignore transient sync failures.
    }
  }

  async function triggerImmediateSync() {
    try {
      await syncState();
    } catch (error) {
      // Ignore transient sync failures.
    }
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem("conesArrangementHistory");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
    } catch (error) {
      return [];
    }
  }

  function writeHistory(history) {
    try {
      localStorage.setItem(arrangementHistoryKey, JSON.stringify(history.slice(-12)));
    } catch (error) {
      // Ignore storage failures and continue.
    }
  }

  async function ensureFolderWritePermission(handle) {
    if (!handle) {
      return false;
    }

    try {
      if (typeof handle.queryPermission === "function") {
        const current = await handle.queryPermission({ mode: "readwrite" });
        if (current === "granted") {
          return true;
        }
      }

      if (typeof handle.requestPermission === "function") {
        const requested = await handle.requestPermission({ mode: "readwrite" });
        return requested === "granted";
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  function csvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, "\"\"").replace(/\r?\n/g, " ")}"`;
  }

  function getAbortRoundSnapshot(remoteState) {
    const snapshot = remoteState?.abort_notice?.round_snapshot;
    return snapshot && typeof snapshot === "object" ? snapshot : null;
  }

  function getTimeoutRoundSnapshot(remoteState) {
    const snapshot = remoteState?.timeout_notice?.round_snapshot;
    return snapshot && typeof snapshot === "object" ? snapshot : null;
  }

  function shouldLogTrialRound(round, options = {}) {
    const aborted = options.aborted === true;
    const timedOut = options.timedOut === true;
    if (!round?.id) {
      return false;
    }
    if (aborted || timedOut) {
      return true;
    }
    return !!round?.layout_number && round?.guess_layout_number !== null;
  }

  function buildTrialFieldValues(round, remoteState, options = {}) {
    const aborted = options.aborted === true;
    const timedOut = options.timedOut === true;
    const senderProfile = remoteState.sender_profile || {};
    const receiverProfile = remoteState.receiver_profile || {};
    const senderSync = remoteState.sender_sync || {};
    const receiverSync = remoteState.receiver_sync || {};
    const recordedServerMs = Number(
      options.recordedServerMs
      || round?.beep_end_server_ms
      || round?.guess_submitted_ms
      || round?.last_activity_ms
      || round?.start_server_ms
      || Date.now()
    );
    const beepEndServerMs = Number.isFinite(recordedServerMs) ? recordedServerMs : Date.now();
    const localBeepEndMs = beepEndServerMs - serverOffsetMs;
    const localCompleted = new Date(localBeepEndMs);
    const localDate = localCompleted.toLocaleDateString();
    const localTime = localCompleted.toLocaleTimeString();
    const utcTime = new Date(beepEndServerMs).toISOString();
    const senderWorst = Number(senderSync.uncertainty_worst_ms ?? NaN);
    const receiverWorst = Number(receiverSync.uncertainty_worst_ms ?? NaN);
    const syncWorst = Number.isFinite(senderWorst) && Number.isFinite(receiverWorst)
      ? Math.round(senderWorst + receiverWorst)
      : "";
    const syncEst = syncWorst === "" ? "" : Math.round(syncWorst / 2);
    const syncBest = syncWorst === "" ? "" : 0;

    return [
      exportSchemaVersion,
      round?.id || "",
      receiverProfile.name || "",
      senderProfile.name || "",
      localDate,
      localTime,
      round?.layout_number ?? "",
      normalizeDifficultyLevel(currentPairDifficultyLevel),
      aborted ? "yes" : "no",
      timedOut ? "yes" : "no",
      round?.guess_layout_number ?? "",
      round?.second_guess_layout_number ?? "",
      round?.guess_confidence ?? "",
      round?.done_reaction_ms ?? "",
      utcTime,
      receiverProfile.location || "",
      senderProfile.location || "",
      syncEst,
      syncBest,
      syncWorst
    ];
  }

  function buildTrialCsvRow(round, remoteState, options = {}) {
    const values = buildTrialFieldValues(round, remoteState, options);

    return `${values.map(csvCell).join(",")}\n`;
  }

  function buildTrialRecord(round, remoteState, options = {}) {
    const values = buildTrialFieldValues(round, remoteState, options);
    const keys = [
      "export schema/version",
      "round_id",
      "rx name",
      "tx name",
      "local date",
      "local time",
      "sent layout",
      "difficulty level",
      "trial aborted",
      "trial timed out",
      "rx choice1",
      "rx choice2",
      "confidence",
      "rx done rt",
      "utc time",
      "rx location",
      "tx location",
      "sync est",
      "sync best",
      "sync worst"
    ];

    return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
  }

  function appendTrialToBrowserStorage(remoteState, options = {}) {
    if (role !== "receiver") {
      return;
    }

    const aborted = options.aborted === true;
    const timedOut = options.timedOut === true;
    const round = aborted
      ? getAbortRoundSnapshot(remoteState)
      : (timedOut ? getTimeoutRoundSnapshot(remoteState) : remoteState?.round);

    if (!shouldLogTrialRound(round, { aborted, timedOut })) {
      return;
    }

    if (round.id === lastLoggedRoundId || round.id === pendingLoggedRoundId) {
      return;
    }

    try {
      pendingLoggedRoundId = round.id;
      const raw = localStorage.getItem(localTrialRecordsKey);
      const records = raw ? JSON.parse(raw) : [];
      const safeRecords = Array.isArray(records) ? records : [];
      safeRecords.push(buildTrialRecord(round, remoteState, {
        aborted,
        timedOut,
        recordedServerMs: remoteState?.abort_notice?.created_ms
          || remoteState?.timeout_notice?.created_ms
      }));
      localStorage.setItem(localTrialRecordsKey, JSON.stringify(safeRecords));
      persistLastLoggedRoundId(round.id);
      updateFolderStatus(
        aborted
          ? `${platformInfo.label} saved aborted trial data in browser storage.`
          : (timedOut
              ? `${platformInfo.label} saved timed-out trial data in browser storage.`
              : `${platformInfo.label} saved trial data in browser storage.`)
      );
    } catch (error) {
      updateFolderStatus("Unable to store trial data in browser storage on this device.");
    } finally {
      if (pendingLoggedRoundId === round.id) {
        pendingLoggedRoundId = "";
      }
    }
  }

  async function appendTrialServerRecord(remoteState, options = {}) {
    if (role !== "receiver") {
      return;
    }

    const aborted = options.aborted === true;
    const timedOut = options.timedOut === true;

    const round = aborted
      ? getAbortRoundSnapshot(remoteState)
      : (timedOut ? getTimeoutRoundSnapshot(remoteState) : remoteState?.round);

    if (!shouldLogTrialRound(round, { aborted, timedOut })) {
      return;
    }

    if (round.id === lastLoggedRoundId || round.id === pendingLoggedRoundId) {
      return;
    }

    try {
      pendingLoggedRoundId = round.id;
      const trialRecord = buildTrialRecord(round, remoteState, {
        aborted,
        timedOut,
        recordedServerMs: remoteState?.abort_notice?.created_ms
          || remoteState?.timeout_notice?.created_ms
      });
      const response = await api("append_trial_record", {
        trial_record: trialRecord
      });
      const appendResult = response?.trial_record_append || null;

      if (appendResult?.appended || appendResult?.duplicate) {
        persistLastLoggedRoundId(round.id);
      }

      if (settingsOpen) {
        updateFolderStatus(
          appendResult?.appended
            ? (
                aborted
                  ? "Aborted trial data saved to the server."
                  : (timedOut
                      ? "Timed-out trial data saved to the server."
                      : "Trial data saved to the server.")
              )
            : (
                appendResult?.duplicate
                  ? "This trial record was already stored on the server."
                  : "Unable to confirm server-side trial storage right now."
              )
        );
      }
    } catch (error) {
      if (settingsOpen) {
        updateFolderStatus("Unable to store trial data on the server right now.");
      }
    } finally {
      if (pendingLoggedRoundId === round.id) {
        pendingLoggedRoundId = "";
      }
    }
  }

  function randomInt(min, max) {
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return min + (values[0] % (max - min + 1));
    }

    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function normalizeDifficultyLevel(level) {
    return ["1", "2", "3"].includes(String(level || "")) ? String(level) : "1";
  }

  function getTargetCandidateLayoutNumbers() {
    const difficultyLevel = normalizeDifficultyLevel(currentPairDifficultyLevel);

    if (difficultyLevel === "1" || difficultyLevel === "2") {
      return [...levelOneTargetLayoutNumbers];
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  function getBlockedLevelOneCountChoice(history) {
    const recentCountChoices = history
      .map((layoutNumber) => getLevelOneCountChoiceFromLayoutNumber(layoutNumber))
      .filter((value) => value === 1 || value === 3);

    if (recentCountChoices.length < 3) {
      return null;
    }

    const lastThree = recentCountChoices.slice(-3);
    return lastThree.every((value) => value === lastThree[0]) ? lastThree[0] : null;
  }

  function pickArrangementNumber() {
    const history = readHistory();

    if (isLevelOneDifficulty()) {
      const blockedCountChoice = getBlockedLevelOneCountChoice(history);
      let nextCountChoice;

      if (blockedCountChoice === 1) {
        nextCountChoice = 3;
      } else if (blockedCountChoice === 3) {
        nextCountChoice = 1;
      } else {
        nextCountChoice = randomInt(0, 1) === 0 ? 1 : 3;
      }

      const choice = nextCountChoice === 1
        ? 1
        : levelOneManyLayoutNumbers[randomInt(0, levelOneManyLayoutNumbers.length - 1)];

      history.push(choice);
      writeHistory(history);
      return choice;
    }

    const last = history[history.length - 1];
    const previous = history[history.length - 2];
    const blocked = last === previous ? last : null;

    const candidateChoices = getTargetCandidateLayoutNumbers();
    let allowedChoices = blocked !== null
      ? candidateChoices.filter((value) => value !== blocked)
      : [...candidateChoices];

    if (allowedChoices.length === 0) {
      allowedChoices = [...candidateChoices];
    }

    const choice = allowedChoices[randomInt(0, allowedChoices.length - 1)];

    history.push(choice);
    writeHistory(history);
    return choice;
  }

  function showReceiverReadyState() {
    if (currentUiMode === "receiver-waiting-start" || localRoundRunning || roundScheduled) {
      return;
    }

    currentUiMode = "receiver-waiting-start";
    hideStage();
    setPrompt("Waiting for sender to begin...", false);
    updateSettingsGearVisibility();
  }

  async function completeRound(layoutNumber, arrangementCode) {
    try {
      void logDebugEvent("sender_complete_round", {
        round_id: activeRound?.id ?? "",
        layout_number: layoutNumber,
        arrangement_code: arrangementCode
      });
      const response = await api("complete_round", {
        layout_number: layoutNumber,
        arrangement_code: arrangementCode
      });
      if (response.round) {
        activeRound = response.round;
      }
    } catch (error) {
      // Keep the local UI usable even if completion reporting fails.
    }
  }

  async function ensureReceiverAudioUnlocked() {
    if (role !== "receiver") {
      return;
    }

    if (!audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextCtor) {
        return;
      }

      audioContext = new AudioContextCtor();
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  function stopBeep() {
    if (activeOscillator) {
      try {
        activeOscillator.stop();
      } catch (error) {
        // Ignore duplicate stop calls.
      }
      activeOscillator.disconnect();
      activeOscillator = null;
    }

    if (activeGain) {
      activeGain.disconnect();
      activeGain = null;
    }
  }

  function playReceiverBeep() {
    if (!audioContext) {
      return;
    }

    stopBeep();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.setValueAtTime(0.18, now + 0.12);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.15);

    activeOscillator = oscillator;
    activeGain = gain;

    oscillator.onended = () => {
      stopBeep();
    };
  }

  function showReceiverDoneButton() {
    awaitingReceiverDone = true;
    currentUiMode = "receiver-done";
    receiverPressedDoneEarly = false;
    setPrompt("Press here when done receiving.", true, "Press here when done receiving.");
    updateSettingsGearVisibility();
  }

  function showReceiverRevealState() {
    awaitingReceiverDone = true;
    localRoundRunning = false;
    currentUiMode = "receiver-reveal";
    receiverRevealStartedMs = performance.now();
    receiverBeepEndPerformanceMs = receiverRevealStartedMs + 150;
    receiverDoneReactionMs = null;
    countdownNumber.textContent = "";
    countdownNumber.classList.remove("prompt");
    countdownBox.classList.remove("hidden");
    countdownBox.classList.add("interactive");
    countdownBox.setAttribute("role", "button");
    countdownBox.setAttribute("tabindex", "0");
    countdownBox.setAttribute("aria-label", "Press here when done receiving.");
    receiverPressedDoneEarly = false;
    playReceiverBeep();
    updateSettingsGearVisibility();

    if (doneTimeoutHandle !== null) {
      window.clearTimeout(doneTimeoutHandle);
    }

    doneTimeoutHandle = window.setTimeout(() => {
      if (!receiverPressedDoneEarly) {
        showReceiverDoneButton();
      }
    }, 2500);
  }

  function updateSenderConfidenceMirror(confidenceValueNumber) {
    if (!senderConfidencePanel || !senderConfidenceValue || !senderConfidenceDescription) {
      return;
    }

    const numericValue = Number.isFinite(confidenceValueNumber) ? confidenceValueNumber : 5;
    const slider = senderConfidencePanel.querySelector(".confidence-slider");

    senderConfidenceValue.textContent = String(numericValue);
    senderConfidenceDescription.textContent = getConfidenceDescription(numericValue);
    if (slider) {
      slider.value = String(numericValue);
    }
  }

  function showSenderConfidenceMirror(confidenceValueNumber) {
    updateSenderConfidenceMirror(confidenceValueNumber);
    clearStageVisibility();
    showStage();
    senderConfidencePanel?.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function showSenderChoiceMirror(actualArrangementCode, selectedLayoutNumbers, revealActual = false) {
    if (isLevelOneDifficulty()) {
      const actualLayoutNumber = revealActual
        ? getLevelOneCountChoiceFromLayoutNumber(getLayoutNumberFromArrangementCode(actualArrangementCode))
        : null;
      renderChoiceSelection(senderLevelOneChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
      clearStageVisibility();
      showStage();
      arrangementNodes.get("sender-level-one-choice-grid")?.classList.add("visible");
      updateSettingsGearVisibility();
      return;
    }

    if (isLevelTwoDifficulty()) {
      const actualLayoutNumber = revealActual ? getLayoutNumberFromArrangementCode(actualArrangementCode) : null;
      renderChoiceSelection(senderLevelTwoChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
      clearStageVisibility();
      showStage();
      arrangementNodes.get("sender-level-two-choice-grid")?.classList.add("visible");
      updateSettingsGearVisibility();
      return;
    }

    const actualLayoutNumber = revealActual ? getLayoutNumberFromArrangementCode(actualArrangementCode) : null;
    renderChoiceSelection(senderChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
    clearStageVisibility();
    showStage();
    arrangementNodes.get("sender-choice-grid")?.classList.add("visible");
    updateSettingsGearVisibility();
  }

  function showSenderLevelOneFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers) {
    const highlightedLayoutNumbers = getLevelOneFeedbackSelectedLayoutNumbers(selectedLayoutNumbers, actualLayoutNumber);
    renderChoiceSelection(senderLevelOneFeedbackNodes, highlightedLayoutNumbers, actualLayoutNumber);
    showLevelOneFeedbackGrid(true);
  }

  function renderSenderMirror(remoteState, serverNowMs) {
    if (role !== "sender" || !senderHoldingResult) {
      return false;
    }

    const receiverView = remoteState.receiver_view || {};
    const phase = receiverView.phase || "idle";

    if (phase === "idle") {
      return false;
    }

    const confidenceValueNumber = Number.isFinite(Number(receiverView.confidence_value))
      ? Number(receiverView.confidence_value)
      : 5;
    const selectedLayoutNumbers = Array.isArray(receiverView.selected_layout_numbers)
      ? receiverView.selected_layout_numbers.filter((value) => Number.isInteger(Number(value))).map(Number)
      : [];
    const actualArrangementCode =
      getResolvedActualArrangementCode(remoteState.round) ||
      getResolvedActualArrangementCode(activeRound);
    const lockedAt = Number(receiverView.confidence_locked_at_ms) || 0;
    const holdConfidence = lockedAt > 0 && (serverNowMs - lockedAt) < 3000;

    if (phase === "confidence" || holdConfidence) {
      showSenderConfidenceMirror(confidenceValueNumber);
      return true;
    }

    if (phase === "choices") {
      showSenderChoiceMirror(actualArrangementCode, selectedLayoutNumbers, true);
      return true;
    }

    if (phase === "results" || phase === "confidence-final") {
      if (isLevelOneDifficulty()) {
        const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
        showSenderLevelOneFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers);
        return true;
      }

      showSenderChoiceMirror(actualArrangementCode, selectedLayoutNumbers, true);
      return true;
    }

    return false;
  }

  function markReceiverResult(actualArrangementCode, selectedArrangementCodes) {
    if (isLevelOneDifficulty()) {
      const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
      const highlightedLayoutNumbers = getLevelOneFeedbackSelectedLayoutNumbers(pendingGuessLayoutNumbers, actualLayoutNumber);
      renderChoiceSelection(levelOneFeedbackNodes, highlightedLayoutNumbers, actualLayoutNumber);
      showLevelOneFeedbackGrid(false);
      if (!postRoundChoiceSubmitted) {
        showDecisionPanel();
      }
      return;
    }

    if (isLevelTwoDifficulty()) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      showChoiceGrid();
      const grid = arrangementNodes.get("receiver-level-two-choice-grid");
      grid?.classList.add("results-locked");

      levelTwoChoiceNodes.forEach((node) => {
        node.disabled = true;
        node.style.pointerEvents = "none";
        node.setAttribute("tabindex", "-1");
        node.blur();
      });
      const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
      renderChoiceSelection(levelTwoChoiceNodes, pendingGuessLayoutNumbers, actualLayoutNumber);
      if (!postRoundChoiceSubmitted) {
        showDecisionPanel();
      }
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    showChoiceGrid();
    const grid = arrangementNodes.get("receiver-choice-grid");
    grid?.classList.add("results-locked");

    choiceNodes.forEach((node) => {
      node.disabled = true;
      node.style.pointerEvents = "none";
      node.setAttribute("tabindex", "-1");
      node.blur();
    });
    const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
    renderChoiceSelection(choiceNodes, pendingGuessLayoutNumbers, actualLayoutNumber);
    if (!postRoundChoiceSubmitted) {
      showDecisionPanel();
    }
  }

  function getResolvedActualArrangementCode(roundLike) {
    const arrangementCode = typeof roundLike?.arrangement_code === "string"
      ? roundLike.arrangement_code
      : "";

    if (arrangementCode) {
      return arrangementCode;
    }

    const layoutNumber = Number(roundLike?.layout_number);

    if (Number.isInteger(layoutNumber) && layoutNumber >= 1 && layoutNumber <= 9) {
      return getArrangementCode(layoutNumber);
    }

    return "";
  }

  async function waitForRoundArrangementCode(roundId, attempts = 20, delayMs = 250) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const payload = await api("heartbeat", {
          receiver_ready: role === "receiver" ? receiverReady : false,
          stale_ms: staleMs
        });
        const round = payload.state?.round;

        if (round?.id === roundId) {
          activeRound = round;
          const actualArrangementCode = getResolvedActualArrangementCode(round);

          if (actualArrangementCode) {
            return actualArrangementCode;
          }
        }
      } catch (error) {
        // Ignore transient polling failures while waiting for sender completion.
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, delayMs);
      });
    }

    return null;
  }

  async function submitPostRoundChoice(choice) {
    if (!activeRound?.id || postRoundChoiceSubmitted) {
      return;
    }

    void logDebugEvent("post_round_choice_submit", {
      round_id: activeRound.id,
      role,
      choice
    });
    postRoundChoiceSubmitted = true;
    if (role === "receiver") {
      showDecisionPanel();
      setDecisionSelection(choice);
    }

    try {
      const response = await api("post_round_choice", {
        round_id: activeRound.id,
        choice
      });
      applyRemoteState(response);
    } catch (error) {
      postRoundChoiceSubmitted = false;
      if (role === "receiver") {
        showDecisionPanel();
      }
    }
  }

  async function clearPostRound(mode, options = {}) {
    if (postRoundClearPending) {
      return;
    }

    void logDebugEvent("post_round_clear_call", {
      role,
      mode,
      round_id: activeRound?.id ?? ""
    });
    postRoundClearPending = true;

    try {
      const response = await api("clear_post_round", {
        mode
      });
      if (postRoundAutoClearHandle !== null) {
        window.clearTimeout(postRoundAutoClearHandle);
        postRoundAutoClearHandle = null;
      }
      if (options.preserveExited) {
        postRoundClearPending = false;
        return;
      }
      senderHoldingResult = false;
      receiverReady = false;
      awaitingReceiverDone = false;
      receiverChoiceOpen = false;
      localRoundRunning = false;
      roundScheduled = false;
      confidenceScreenOpen = false;
      instructionScreenOpen = false;
      receiverMirrorPhase = "idle";
      postRoundChoiceSubmitted = false;
      postRoundClearPending = false;
      pendingGuessLayoutNumbers = [];
      pendingGuessArrangementCodes = [];
      clearStageVisibility();
      hideStage();
      hideChoiceGrid();
      hideConfidencePanel();
      hideInstructionPanel();
      hideDecisionPanel();
      hideMessagePanel();
      if (response.round) {
        activeRound = response.round;
      } else {
        activeRound = null;
      }
      applyRemoteState(response);
    } catch (error) {
      postRoundClearPending = false;
    }
  }

  function renderPostRoundState(remoteState) {
    if (appExited) {
      return true;
    }

    const postRound = remoteState.post_round;

    void logDebugEvent("post_round_render", {
      role,
      round_id: remoteState.round?.id ?? activeRound?.id ?? "",
      post_round: postRound
    });

    if (!postRound) {
      if (role === "sender") {
        hideDecisionPanel();
        hideMessagePanel();
      } else if (!(receiverChoiceOpen && choiceInstructionShown && pendingGuessLayoutNumbers.length === 1)) {
        hideMessagePanel();
      }
      return false;
    }

    showStage();

    if (role === "receiver") {
      hideMessagePanel();
      if (postRound.receiver_choice) {
        showDecisionPanel();
        setDecisionSelection(postRound.receiver_choice);
      }

      if (postRound.resolved === "continue" && postRound.sender_choice === "another") {
        schedulePostRoundClear("continue");
      } else if (postRound.resolved === "end" && postRound.sender_choice === "enough") {
        void clearPostRound("end", { preserveExited: true })
          .catch(() => null)
          .finally(() => {
            showExitedState();
          });
      }
      return true;
    }

    hideDecisionPanel();

    if (!postRound.receiver_choice) {
      hideMessagePanel();
      return false;
    }

    if (postRound.receiver_choice === "enough") {
      showMessagePanel("The receiver has had enough.", [
        {
          label: "CONTINUE",
          selected: postRound.sender_choice === "enough",
          disabled: postRound.sender_choice === "enough",
          onClick: postRound.sender_choice
            ? undefined
            : () => {
                void submitPostRoundChoice("enough");
              }
        }
      ]);

      if (postRound.resolved === "end" && postRound.sender_choice === "enough") {
        void clearPostRound("end", { preserveExited: true })
          .catch(() => null)
          .finally(() => {
            showExitedState();
          });
      }
      return true;
    }

    showMessagePanel("The receiver can receive another image.", [
      {
        label: "OK",
        selected: postRound.sender_choice === "another",
        disabled: !!postRound.sender_choice,
        onClick: postRound.sender_choice
          ? undefined
          : () => {
              void submitPostRoundChoice("another");
            }
      },
      {
        label: "No thanks! I've had enough for now.",
        selected: postRound.sender_choice === "enough",
        disabled: !!postRound.sender_choice,
        onClick: postRound.sender_choice
          ? undefined
          : () => {
              void submitPostRoundChoice("enough");
            }
      }
    ]);

    if (postRound.resolved === "continue" && postRound.sender_choice === "another") {
      schedulePostRoundClear("continue");
    } else if (postRound.resolved === "end" && postRound.sender_choice === "enough") {
      void clearPostRound("end", { preserveExited: true })
        .catch(() => null)
        .finally(() => {
          showExitedState();
        });
    }

    return true;
  }

  function beginReceiverSelection(selectionLimit) {
    receiverSelectionLimit = isLevelOneDifficulty() ? 1 : selectionLimit;
    pendingGuessLayoutNumbers = [];
    pendingGuessArrangementCodes = [];
    choiceInstructionShown = false;
    receiverMirrorPhase = "choices";
    hideInstructionPanel();
    hideConfidencePanel();
    hideDecisionPanel();
    hideMessagePanel();
    resetReceiverChoices();
    showChoiceGrid();
    void pushReceiverViewState();
  }

  async function handleReceiverChoice(layoutNumber) {
    if (!activeRound || !activeRound.id || !receiverChoiceOpen) {
      return;
    }

    const arrangementCode = getArrangementCode(layoutNumber);

    pendingGuessLayoutNumbers.push(layoutNumber);
    pendingGuessArrangementCodes.push(arrangementCode);
    markPendingChoices(pendingGuessLayoutNumbers);
    void pushReceiverViewState();
    void triggerImmediateSync();

    if (receiverSelectionLimit <= 1) {
      await finalizeReceiverSelection();
      return;
    }

    if (pendingGuessLayoutNumbers.length === 1) {
      choiceInstructionShown = true;
      showMessagePanel("If you are sure, select the same arrangement again - otherwise now select your 2nd choice.", []);
      return;
    }

    if (pendingGuessLayoutNumbers.length >= receiverSelectionLimit) {
      await finalizeReceiverSelection();
    }
  }

  async function finalizeReceiverSelection() {
    if (
      !activeRound ||
      !activeRound.id ||
      pendingGuessLayoutNumbers.length === 0 ||
      pendingGuessArrangementCodes.length === 0
    ) {
      return;
    }

    getActiveSelectionNodesMap().forEach((node) => {
      node.disabled = true;
    });
    choiceInstructionShown = false;
    receiverTransitioningScreen = true;
    const transitionDelayMs = receiverSelectionLimit <= 1
      ? (isLevelOneDifficulty() ? 2000 : 3500)
      : 1000;
    window.setTimeout(() => {
      hideChoiceGrid();
      hideMessagePanel();
      showConfidencePanel();
      receiverTransitioningScreen = false;
      void triggerImmediateSync();
    }, transitionDelayMs);
  }

  async function submitReceiverGuessAndReveal() {
    if (
      !activeRound ||
      !activeRound.id ||
      pendingGuessLayoutNumbers.length < 1 ||
      pendingGuessArrangementCodes.length < 1
    ) {
      return;
    }

    try {
      const guessLayoutNumber = pendingGuessLayoutNumbers[0];
      const selectedArrangementCodes = [...pendingGuessArrangementCodes];
      const selectedArrangementCode = selectedArrangementCodes[0];
      const secondGuessLayoutNumber = pendingGuessLayoutNumbers[1] ?? null;
      const secondGuessArrangementCode = selectedArrangementCodes[1] ?? "";
      const confidence = pendingConfidenceValue;
      const doneReactionMs = receiverDoneReactionMs;
      void logDebugEvent("receiver_submit_guess", {
        round_id: activeRound.id,
        guess_layout_number: guessLayoutNumber,
        guess_arrangement_code: selectedArrangementCode,
        second_guess_layout_number: secondGuessLayoutNumber,
        second_guess_arrangement_code: secondGuessArrangementCode,
        difficulty_level: normalizeDifficultyLevel(currentPairDifficultyLevel),
        confidence,
        done_reaction_ms: doneReactionMs
      });
      const response = await api("submit_guess", {
        round_id: activeRound.id,
        guess_layout_number: guessLayoutNumber,
        guess_arrangement_code: selectedArrangementCode,
        second_guess_layout_number: secondGuessLayoutNumber,
        second_guess_arrangement_code: secondGuessArrangementCode,
        difficulty_level: normalizeDifficultyLevel(currentPairDifficultyLevel),
        confidence,
        done_reaction_ms: doneReactionMs
      });
      let actualArrangementCode = getResolvedActualArrangementCode({
        arrangement_code: response.actual_arrangement_code,
        layout_number: response.actual_layout_number
      });

      if (response.round) {
        activeRound = response.round;
      }

      if (!actualArrangementCode) {
        actualArrangementCode =
          getResolvedActualArrangementCode(response.round) ||
          getResolvedActualArrangementCode(activeRound) ||
          await waitForRoundArrangementCode(activeRound.id);
      }

      if (actualArrangementCode) {
        void logDebugEvent("receiver_resolved_actual", {
          round_id: activeRound?.id ?? "",
          actual_arrangement_code: actualArrangementCode,
          actual_layout_number: activeRound?.layout_number ?? "",
          selected_arrangement_codes: selectedArrangementCodes,
          confidence,
          done_reaction_ms: doneReactionMs
        });
        hideConfidencePanel();
        hideInstructionPanel();
        receiverMirrorPhase = "results";
        postRoundChoiceSubmitted = false;
        markReceiverResult(actualArrangementCode, selectedArrangementCodes);
        void pushReceiverViewState();
        void triggerImmediateSync();
      } else {
        if (confidenceButton) {
          confidenceButton.disabled = false;
        }
      }
    } catch (error) {
      if (confidenceButton) {
        confidenceButton.disabled = false;
      }
    }
  }

  function scheduleSynchronizedRound(round) {
    if (!round || !round.id) {
      return;
    }

    if (lastSeenRoundId === round.id || roundScheduled) {
      return;
    }

    roundScheduled = true;
    localRoundRunning = true;
    lastSeenRoundId = round.id;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    activeRound = round;
    resetReceiverChoices();
    updateSettingsGearVisibility();

    const syncStartLocalMs = round.start_server_ms - serverOffsetMs;
    const checkpoints = [
      { delayMs: 2000, value: "3" },
      { delayMs: 4000, value: "2" },
      { delayMs: 6000, value: "1" }
    ];

    hideChoiceGrid();
    clearStageVisibility();
    hideStage();
    countdownBox.classList.remove("interactive");
    countdownNumber.textContent = "";
    countdownNumber.classList.remove("prompt");

    checkpoints.forEach((checkpoint) => {
      const timeoutMs = Math.max(0, syncStartLocalMs + checkpoint.delayMs - Date.now());
      setTimeout(() => {
        showCountdownValue(checkpoint.value);
      }, timeoutMs);
    });

    const finishDelayMs = Math.max(0, syncStartLocalMs + 8000 - Date.now());
    setTimeout(() => {
      if (role === "sender") {
        if (!isControllingSenderRound(round)) {
          localRoundRunning = false;
          roundScheduled = false;
          updateSettingsGearVisibility();
          return;
        }

        const layoutNumber = pickArrangementNumber();
        const arrangementCode = getArrangementCode(layoutNumber);
        void logDebugEvent("sender_picked_target", {
          round_id: activeRound?.id ?? "",
          layout_number: layoutNumber,
          arrangement_code: arrangementCode
        });
        hideCountdown();
        showStage();
        showArrangement(layoutNumber);
        senderHoldingResult = true;
        updateSettingsGearVisibility();
        if (activeRound) {
          activeRound.layout_number = layoutNumber;
          activeRound.arrangement_code = arrangementCode;
        }
        completeRound(layoutNumber, arrangementCode);
        localRoundRunning = false;
      } else {
        showReceiverRevealState();
      }

      roundScheduled = false;
      updateSettingsGearVisibility();
    }, finishDelayMs);
  }

  async function startSenderRound() {
    if (localRoundRunning || roundScheduled) {
      return;
    }

    localRoundRunning = true;
    senderHoldingResult = false;
    countdownBox.classList.remove("interactive");
    countdownNumber.textContent = "";
    countdownNumber.classList.remove("prompt");
    updateSettingsGearVisibility();

    const startServerMs = estimatedServerNowMs();

    try {
      const response = await api("start_round", {
        start_server_ms: startServerMs
      });

      if (response.round) {
        scheduleSynchronizedRound(response.round);
      }
    } catch (error) {
      localRoundRunning = false;
      setPrompt("Unable to start. Please try again.", true, "Press when ready to send");
      currentUiMode = "sender-ready";
    }
  }

  function handleActionPress() {
    noteUserInteraction();

      if (appExited) {
        navigateToBeginnerFrontPage();
        return;
      }

      if (currentUiMode === "timeout-notice") {
        void logDebugEvent("timeout_notice_pressed", {
          role,
          current_ui_mode: currentUiMode,
          round_id: activeRound?.id ?? ""
        });
        void traceClientEvent("timeout_notice_pressed_client", {
          role,
          current_ui_mode: currentUiMode,
          round_id: activeRound?.id ?? ""
        });
        void api("abort_to_home", { abort_reason: "timeout" })
          .catch(() => null)
          .finally(() => {
            navigateToBeginnerFrontPage();
          });
        return;
      }

    if (currentUiMode === "partner-abort") {
      void api("clear_abort_notice")
        .catch(() => null)
        .finally(() => {
          navigateToBeginnerFrontPage();
        });
      return;
    }

    if (currentUiMode === "partner-disconnect") {
      void api("abort_to_home", { abort_reason: "disconnect" })
        .catch(() => null)
        .finally(() => {
          navigateToBeginnerFrontPage();
        });
      return;
    }

    if (currentUiMode === "role-conflict") {
      navigateToBeginnerFrontPage();
      return;
    }

    if (role === "sender" && currentUiMode === "sender-ready") {
      void startSenderRound();
      return;
    }

    if (role === "receiver" && currentUiMode === "receiver-ready") {
      receiverReady = true;
      showReceiverReadyState();
      void ensureReceiverAudioUnlocked();
      return;
    }

    if (
      role === "receiver" &&
      awaitingReceiverDone &&
      (currentUiMode === "receiver-done" || currentUiMode === "receiver-reveal")
    ) {
      receiverPressedDoneEarly = currentUiMode === "receiver-reveal";
      if (doneTimeoutHandle !== null) {
        window.clearTimeout(doneTimeoutHandle);
        doneTimeoutHandle = null;
      }
      if (receiverBeepEndPerformanceMs > 0 && receiverDoneReactionMs === null) {
        receiverDoneReactionMs = Math.max(0, Math.round(performance.now() - receiverBeepEndPerformanceMs));
      }
      awaitingReceiverDone = false;
      hideCountdown();
      beginReceiverSelection(getAllowSecondChoiceEnabled() ? 2 : 1);
    }
  }

  function handleActionKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActionPress();
    }
  }

  function setUiMode(mode) {
    if (localRoundRunning || roundScheduled) {
      return;
    }

    if (role === "sender" && senderHoldingResult) {
      return;
    }

    if (currentUiMode === mode) {
      return;
    }

    currentUiMode = mode;
    hideStage();

    if (mode === "sender-waiting-online") {
      setPrompt("Waiting for receiver to be online...", false);
      updateSettingsGearVisibility();
      return;
    }

    if (mode === "sender-waiting-ready") {
      setPrompt("Waiting for the receiver to be ready...", false);
      updateSettingsGearVisibility();
      return;
    }

    if (mode === "sender-ready") {
      setPrompt("Receiver ready. Press when ready to send.", true, "Receiver ready. Press when ready to send.");
      updateSettingsGearVisibility();
      return;
    }

    if (mode === "receiver-waiting-online") {
      setPrompt("Waiting for sender to be online...", false);
      updateSettingsGearVisibility();
      return;
    }

    if (mode === "receiver-ready") {
      setPrompt("Press when ready to receive.", true, "Press when ready to receive");
      updateSettingsGearVisibility();
      return;
    }

    if (mode === "receiver-done") {
      showReceiverDoneButton();
    }
  }

  function normalizeRound(round, serverNowMs) {
    if (!round || !round.id) {
      return null;
    }

    if (round.layout_number !== null || round.arrangement_code) {
      return null;
    }

    if (serverNowMs - round.start_server_ms > roundLifetimeMs) {
      return null;
    }

    return round;
  }

  function applyRemoteState(payload) {
    adminAuthorized = !!payload.is_admin;
    debugEnabled = !!payload.debug_enabled;
    currentPairDifficultyLevel = normalizeDifficultyLevel(payload.pair_difficulty);
    if (settingsOpen && settingsAllowSecondChoiceCheckbox) {
      updateSecondChoiceSettingsControl(settingsAllowSecondChoiceCheckbox.checked);
    }

    if (settingsOpen) {
      return;
    }

    if (!hasRequiredSettings()) {
      showSettingsRequiredState();
      return;
    }

    if (appExited) {
      return;
    }

    if (payload.role_conflict) {
      showRoleConflictState(payload.role_conflict.message);
      return;
    }

    const remoteState = payload.state || {};

    if (remoteState.timeout_exit) {
      void logDebugEvent("timeout_exit_seen", {
        role,
        current_ui_mode: currentUiMode
      });
      showExitedState();
      return;
    }

    if (remoteState.abort_notice) {
      void logDebugEvent("abort_notice_seen", {
        role,
        current_ui_mode: currentUiMode,
        message: remoteState.abort_notice.message || "",
        by_role: remoteState.abort_notice.by_role || ""
      });
      void appendTrialServerRecord(remoteState, { aborted: true });
      showPartnerAbortState(remoteState.abort_notice.message);
      return;
    }

    if (remoteState.timeout_notice) {
      void logDebugEvent("timeout_notice_seen", {
        role,
        current_ui_mode: currentUiMode,
        message: remoteState.timeout_notice.message || "",
        round_id: remoteState.timeout_notice.round_snapshot?.id || remoteState.round?.id || ""
      });
      void appendTrialServerRecord(remoteState, { timedOut: true });
      showTimeoutState(remoteState.timeout_notice.message);
      return;
    }

    const serverNowMs = payload.server_now_ms || estimatedServerNowMs();
    const normalizedRound = normalizeRound(remoteState.round, serverNowMs);

    if (remoteState.round && remoteState.round.id) {
      activeRound = remoteState.round;
    }

    void appendTrialServerRecord(remoteState);

    if (normalizedRound) {
      scheduleSynchronizedRound(normalizedRound);
      return;
    }

    if (renderPostRoundState(remoteState)) {
      return;
    }

    if (role === "sender") {
      if (renderSenderMirror(remoteState, serverNowMs)) {
        return;
      }

      if (!remoteState.receiver_online) {
        if (wasRunInProgress(remoteState)) {
          void appendTrialServerRecord(remoteState, { aborted: true });
          showPartnerDisconnectState("Receiver disconnect - run over");
          return;
        }
        setUiMode("sender-waiting-online");
        return;
      }

      if (!remoteState.receiver_ready) {
        setUiMode("sender-waiting-ready");
        return;
      }

      setUiMode("sender-ready");
      return;
    }

    if (!remoteState.sender_online) {
      if (wasRunInProgress(remoteState)) {
        void appendTrialServerRecord(remoteState, { aborted: true });
        showPartnerDisconnectState("Sender disconnect - run over");
        return;
      }
      receiverReady = false;
      setUiMode("receiver-waiting-online");
      return;
    }

    if (receiverTransitioningScreen) {
      return;
    }

    if (awaitingReceiverDone || receiverChoiceOpen) {
      return;
    }

    if (confidenceScreenOpen || instructionScreenOpen) {
      return;
    }

    if (receiverReady) {
      showReceiverReadyState();
      return;
    }

    setUiMode("receiver-ready");
  }

  async function syncState() {
    try {
      const payload = await api("heartbeat", {
        receiver_ready: role === "receiver" ? receiverReady : false,
        stale_ms: staleMs,
        receiver_view: role === "receiver" ? buildReceiverViewState() : undefined
      });
      applyRemoteState(payload);
    } catch (error) {
      if (!localRoundRunning && !roundScheduled) {
        if (role === "sender") {
          setPrompt("Waiting for receiver to be online...", false);
        } else {
          setPrompt("Waiting for sender to be online...", false);
        }
      }
    }
  }

  async function clearTimeoutExitOnBoot() {
    try {
      await api("clear_timeout_exit", {
        receiver_ready: false,
        stale_ms: staleMs
      });
    } catch (error) {
      // Ignore startup cleanup failures.
    }
  }

  async function clearAbortNoticeOnBoot() {
    try {
      await api("clear_abort_notice", {
        receiver_ready: false,
        stale_ms: staleMs
      });
    } catch (error) {
      // Ignore startup cleanup failures.
    }
  }

    async function boot() {
      void traceClientEvent("boot_client", {
        role,
        page: role === "sender" ? "sender.html" : "receiver.html"
      });
      countdownBox.addEventListener("click", handleActionPress);
    countdownBox.addEventListener("keydown", handleActionKeydown);
    settingsGear?.addEventListener("click", openSettings);
    waitingBackButton?.addEventListener("click", () => {
      navigateToBeginnerFrontPage();
    });
    homeLink?.addEventListener("click", (event) => {
      event.preventDefault();
      noteUserInteraction();
      void abortTrialAndReturnHome();
    });
    window.addEventListener("pointerdown", noteUserInteraction, { passive: true });
    window.addEventListener("keydown", noteUserInteraction);

    applyLauncherPrefillFromQuery();
    await preloadConeAsset().catch(() => null);
    receiverSkipInstructions = readReceiverSkipInstructions();
    resetVisualState();
    buildSettingsScreen();
    await restoreDataFolderHandle();

    if (!hasRequiredSettings()) {
      showSettingsRequiredState();
    }

    if (role === "sender") {
      buildAllArrangements();
      buildSenderConfidencePanel();
      buildSenderChoiceGrid();
      buildSenderLevelOneChoiceGrid();
      buildSenderLevelTwoChoiceGrid();
      buildSenderLevelOneFeedbackGrid();
      buildDecisionPanel();
      buildMessagePanel();
      updateChoiceGridLayout();
      if (!settingsOpen && hasRequiredSettings()) {
        setUiMode("sender-waiting-online");
      }
    } else {
      buildChoiceGrid();
      buildReceiverLevelOneChoiceGrid();
      buildReceiverLevelTwoChoiceGrid();
      buildReceiverLevelOneFeedbackGrid();
      buildConfidencePanel();
      buildInstructionPanel();
      buildDecisionPanel();
      buildMessagePanel();
      updateChoiceGridLayout();
      if (!settingsOpen && hasRequiredSettings()) {
        setUiMode("receiver-waiting-online");
      }
    }

    window.addEventListener("resize", updateChoiceGridLayout);
    if (!settingsOpen && hasRequiredSettings()) {
      await clearAbortNoticeOnBoot();
      await clearTimeoutExitOnBoot();
      await syncState();
    }
    window.setInterval(() => {
      if (!settingsOpen && hasRequiredSettings()) {
        void syncState();
      }
    }, heartbeatMs);
  }

  void boot();
})();




























