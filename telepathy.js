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
  const guidedTourOverlay = document.getElementById("guidedTourOverlay");
  const guidedTourBalloon = document.getElementById("guidedTourBalloon");
  const guidedTourCopy = document.getElementById("guidedTourCopy");
  const guidedTourHint = document.getElementById("guidedTourHint");
  const guidedTourNextButton = document.getElementById("guidedTourNextButton");
  const guidedTourProbeButton = document.getElementById("guidedTourProbeButton");
  const guidedTourProbeScreen = document.getElementById("guidedTourProbeScreen");
  const guidedTourProbeBackButton = document.getElementById("guidedTourProbeBackButton");
  const guidedTourProbeBody = guidedTourProbeScreen?.querySelector(".guided-tour-probe-body") || null;
  const coneSrc = "cone-lowglow-transparent.png";
  const arrangementNodes = new Map();
  const choiceNodes = new Map();
  const senderChoiceNodes = new Map();
  const levelOneChoiceNodes = new Map();
  const senderLevelOneChoiceNodes = new Map();
  const levelTwoChoiceNodes = new Map();
  const senderLevelTwoChoiceNodes = new Map();
  const levelFourChoiceNodes = new Map();
  const senderLevelFourChoiceNodes = new Map();
  const levelOneFeedbackNodes = new Map();
  const senderLevelOneFeedbackNodes = new Map();
  const heartbeatMs = 1000;
  const staleMs = 5000;
  const roundLifetimeMs = 300000;
  const receiverSkipInstructionKey = "cones-receiver-skip-two-choice-instructions";
  const settingsStorageKey = `cones-settings-v2-${role}`;
  const launcherStorageKey = "cones-beginner-launcher-v2";
  const arrangementHistoryKey = "conesArrangementHistory-v2";
  const exportSchemaVersion = "cones-trials-v5";
  const runtimeBuildVersion = "20260711b";
  const runtimePageInstanceId = `runtime-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const runtimeQuery = (() => {
    try {
      return new URLSearchParams(window.location.search);
    } catch (error) {
      return new URLSearchParams();
    }
  })();
  const runtimeMode = String(runtimeQuery.get("runtime_mode") || "").trim().toLowerCase();
  const guidedTourMode = String(runtimeQuery.get("guided_tour") || "").trim().toLowerCase();
  const launchedVisitorDisplayName = String(runtimeQuery.get("visitor_display_name") || "").trim();
  const guidedReceiverTourReturnSnapshotKey = "cones-guided-receiver-tour-return-v1";
  const guidedSenderTourReturnSnapshotKey = "cones-guided-sender-tour-return-v1";
  const learningCenterLessonReturnKey = "cones-learning-center-lesson-return-v1";
  const requestedRuntimeDifficultyLevel = normalizeDifficultyLevel(runtimeQuery.get("difficulty_level") || "1");
  const requestedIncludeConfidence = runtimeQuery.has("include_confidence")
    ? String(runtimeQuery.get("include_confidence") || "").trim() === "1"
    : null;
  const requestedIncludePositiveReinforcement = runtimeQuery.has("include_positive_reinforcement")
    ? String(runtimeQuery.get("include_positive_reinforcement") || "").trim() === "1"
    : null;
  const launchedFromLauncher = runtimeQuery.get("prefill") === "1";
  let runtimePrefillSettingsOverride = null;
  const isRemoteViewerMode = runtimeMode === "remote-viewer";
  const isRemoteDisplayMode = runtimeMode === "remote-display";
  const isRobotSenderMode = runtimeMode === "robot-sender";
  const isRobotReceiverMode = runtimeMode === "robot-receiver";
  const isRobotSimulationMode = isRobotSenderMode || isRobotReceiverMode;
  const isGuidedReceiverTour = role === "receiver" && guidedTourMode === "receiver-experience";
  const isGuidedSenderTour = role === "sender" && guidedTourMode === "sender-experience";
  const isGuidedExperienceTour = isGuidedReceiverTour || isGuidedSenderTour;
  const robotSimulationIdentifier = "Robot";
  const guidedReturnTraceKey = "cones-guided-return-trace-v1";
  const launcherBuildVersion = "20260711b";
  const suspiciousProbeTextFragments = [
    String.fromCharCode(0x00C3),
    String.fromCharCode(0x00E2, 0x20AC, 0x2122),
    String.fromCharCode(0x00E2, 0x20AC, 0x201C),
    String.fromCharCode(0x00E2, 0x20AC, 0x0153),
    String.fromCharCode(0x00E2, 0x20AC),
    String.fromCharCode(0x00C2),
    String.fromCharCode(0x00E2, 0x20AC, 0x00A6)
  ];
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
  let reinforcementAudioBuffer = null;
  let reinforcementAudioElement = null;
  let reinforcementAudioLoadPromise = null;
  let doneTimeoutHandle = null;
  let senderHoldingResult = false;
  let preloadedConeImage = null;
  const preloadedRuntimeImages = new Map();
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
  let receiverLevelOneFeedbackPanel = null;
  let receiverLevelOneFeedbackActualWrap = null;
  let receiverLevelOneFeedbackResponseText = null;
  let receiverLevelOneFeedbackLeftLabel = null;
  let receiverLevelOneFeedbackRightLabel = null;
  let senderLevelOneFeedbackPanel = null;
  let senderLevelOneFeedbackActualWrap = null;
  let senderLevelOneFeedbackResponseText = null;
  let senderLevelOneFeedbackLeftLabel = null;
  let senderLevelOneFeedbackRightLabel = null;
  let imageDisplayPanel = null;
  let imageDisplayElement = null;
  let imageDisplayCaption = null;
  let imageBlinkTimeoutHandle = null;
  let imageBlinkVisible = true;
  let lastPositiveReinforcementRoundId = "";
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
  let currentPairDifficultyLevel = requestedRuntimeDifficultyLevel;
  let adminStorageInfo = null;
  let adminDiskUsageAnalysis = null;
  let pendingLoggedRoundId = "";
  let settingsDraftSnapshot = "";
  let settingsConfirmDialog = null;
  let returningToLauncher = false;
  let robotSimulationState = null;
  let robotSimulationBootstrapped = false;
  let robotSimulationRoundCounter = 0;
  let robotSimulationRoundStarterHandle = null;
  const robotSimulationTimerHandles = new Set();
  const minimumWaitingOnlineDisplayMs = 3000;
  let currentUiModeEnteredAtMs = 0;
  let robotLevelFourPairsPromise = null;
  let senderTrialBackSuppressed = false;
  let guidedReceiverTourState = null;
  const guidedReceiverTourProbeMarkup = `
    <p>This is the crux of telepathic reception: learning to recognize more clearly the visual information that appears telepathically in the mind's eye. Below are key ideas to help you understand and strengthen this skill.</p>

    <div class="guided-tour-probe-nav" aria-label="Probe Deeper sections">
      <a class="guided-tour-probe-chip" href="#probe-peaceful-environment">Calm Environment</a>
      <a class="guided-tour-probe-chip" href="#probe-vague-bits">Vague Bits</a>
      <a class="guided-tour-probe-chip" href="#probe-detached-state">Detached State</a>
      <a class="guided-tour-probe-chip" href="#probe-belief">Belief</a>
      <a class="guided-tour-probe-chip" href="#probe-objects-locations">Objects and Locations</a>
    </div>

    <h3 id="probe-peaceful-environment">A Peaceful Environment</h3>
    <p>One factor is the state of mind of the receiver. In order to be calm, the environment should not be noisy or otherwise distracting. It should be quiet and peaceful.</p>

    <h3 id="probe-vague-bits">Bits And Pieces Of Vague Impressionistic Visual Information</h3>
    <p>Ingo Swann, a noted psychic [1991/2017, p. 33] mentioned, "... what I was perceiving were bits of shapes, forms, and colors which in themselves were not clear." Hubbard &amp; Langford (1986, pp. 6-7) mention, "Accomplished viewers appear to agree that correct [remote viewing] data is perceived as impressionistic and generally vague. ... correct visual impressions are largely indistinct in outline." "By subjective report, the 'data access window' is approximately 0.5 to 1 second in duration" (Hubbard &amp; Langford, 1986, p. 5). Swann noted that psi visual data is "soft" (1991/2017, p. 134). "Soft" can be interpreted as "low contrast, low intensity and low resolution." Otto Reimann, a recognized Czech psychometrist mentioned that his "... information about the target did not come to him, he said, as one piece altogether, like a photograph. Instead, as metaphors of the process he preferred those of slowly building a mosaic from tiny pieces of stone or painting a portrait by repeated applications of pigment to a canvas" [Schmidt, 1930, as cited in Barrington et al., 2005, p. 157].</p>

    <h3 id="probe-detached-state">Be Detached And Disinterested</h3>
    <p>Swann mentioned, "[When you can achieve] a detached poise, a sort of disinterest ... the core ESP processes will work their best. (Swann, 1991/2017, p.124)." This essentially means: don't care about how you are performing. Get over it.</p>
    <p>If you care a lot about how well you will do when you do it, it will tend not to work. The evidence indicates that it works better when you are in a more playful mood and you don't care a lot. In the beginning, you will care a lot and may find more than one or a few trials exhausting. Later, when you get more used to the whole thing, when and how to check the contents of your mind's eye, what types of things you fleetingly see, it will become routine and you won't care as much, and won't mind doing more than very few trials in one sitting.</p>

    <h3>State Of Mind And How Much You Care</h3>
    <p>A receiver must be able to not be thinking about their own thoughts but rather to be open to whatever pops into their mind's eye when the countdown ends and an image is displayed to the sender. At the receiver, shreds of visual evidence that can fade quickly are what must be perceived as best possible quickly and remembered. Remember just what the shreds look like. Don't try to name anything unless an obvious name pops out, like fence.</p>

    <h3 id="probe-belief">A Certainty That Telepathy Is Real - And Real For Me</h3>
    <p>A receiver needs to fully believe that telepathy exists and fully trust that the right information is present in their mind's eye right after the countdown. It has been shown that those who don't believe that telepathy exists are very less likely to experience it. However, it has also been shown that a sender does not have to believe in telepathy in order to competently send telepathic information.</p>
    <p>If you are the receiver, you must know in your heart that telepathy is real as strongly as you believe there is a real sun in the sky. If you don't believe in it, it still might happen to you spontaneously, but it is not likely that you will show consistently good results. A sender can be skeptical and still produce decent results for a receiver.</p>

    <h3>Don't Worry How This Works</h3>
    <p>How it is possible that out of the millions of people in the world, just by wanting to receive what one person you may not even know well is looking at it is possible to tune into that one person? How this can happen is not important. The fact is that this is what does happen and it happens effortlessly, without conscious intention.</p>

    <h3 id="probe-objects-locations">Objects Have Locations In The Visual Field - Remember What And Where</h3>
    <p>The receiver has a visual field. That field has a left side and a right side. What appears will appear at different locations in the visual field. The receiver should try to remember what was where in the visual field. Some features of what pops in may have color. Remember the color and where it is noticed. Was it on the right side? The left side? After seconds, the whole image, not just part of it, may fade. Then it's time to consolidate in memory whatever shreds or pieces you saw. Then, when the choice of images are shown to you, you will easily be able to decide which image was the actual target image.</p>

    <h3>Lack Of Fusion</h3>
    <p>American psychic Ingo Swann suggested, referring to the visual perception of psi-encoded data: "a great deal of distortion and misrepresentation can and does take place while the mind seeks to translate the basic images into words" [Swann, 1991/2017, p. 73]. Swann called this difficulty in grouping local elements into recognized objects lack of fusion: "All parts are correctly perceived, but will not connect to form a whole" [Swann, 1991/2017, p. 229].</p>

    <h3>Don't Try To Name It - Describe Don't Identify</h3>
    <p>In training remote viewing, a form of psi perception without a telepathic sender, Lori Williams, a longtime teacher of remote viewing emphasizes "the biggest mistake psychics and remote viewers make is naming things with nouns." "Our biggest mantra is, describe don't identify" [Williams, 2020].</p>
    <p>Using cognitive effort in an attempt to put a name to fragmentary and unstable, poorly remembered fragments of visual evidence discovered tends to bring the receiver's biases and experience to bear. This interferes with the perception of the features actually present. By assuming the presence of features that aren't there and intentionally disregarding features actually present which do not make sense with current high-level cognitive assumptions about the target, the perception becomes colored by the receiver's experience.</p>
  `;

  const folderHandleDbName = "cones-folder-handles";
  const folderHandleStoreName = "handles";
  const folderHandleKey = `data-folder-${role}`;
  const localTrialRecordsKey = `cones-local-trials-v2-${role}`;
  const levelOneTargetLayoutNumbers = [1, 6, 7, 8, 9];
  const levelOneManyLayoutNumbers = [6, 7, 8, 9];

  function isInternalVisitorIdentifier(name) {
    return /^visitor [a-z0-9]{4}$/i.test(String(name || "").trim());
  }

  function getGuidedTourReturnSnapshotKey() {
    return isGuidedSenderTour
      ? guidedSenderTourReturnSnapshotKey
      : guidedReceiverTourReturnSnapshotKey;
  }

  function initializeGuidedReceiverTourProbeBody() {
    if (!guidedTourProbeBody || role !== "receiver") {
      return;
    }
    if (guidedTourProbeBody.dataset.probeHydrated === "1") {
      return;
    }
    guidedTourProbeBody.innerHTML = guidedReceiverTourProbeMarkup.trim();
    guidedTourProbeBody.dataset.probeHydrated = "1";
    const hydratedProbeText = String(guidedTourProbeBody.textContent || "");
    if (suspiciousProbeTextFragments.some((fragment) => fragment && hydratedProbeText.includes(fragment))) {
      void logDebugEvent("guided_tour_probe_mojibake_detected", {
        textPreview: hydratedProbeText.slice(0, 240)
      });
    }
  }

  initializeGuidedReceiverTourProbeBody();

  function readGuidedReceiverTourReturnSnapshot() {
    try {
      const raw = localStorage.getItem(getGuidedTourReturnSnapshotKey());
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function clearGuidedReceiverTourReturnSnapshot() {
    try {
      localStorage.removeItem(getGuidedTourReturnSnapshotKey());
    } catch (_error) {
      // Ignore cleanup failures.
    }
  }

  function clearGuidedReceiverTourTargetClasses() {
    document.querySelectorAll(".guided-tour-runtime-target, .guided-tour-runtime-muted").forEach((node) => {
      node.classList.remove("guided-tour-runtime-target");
      node.classList.remove("guided-tour-runtime-muted");
    });
  }

  function setGuidedReceiverTourProbeVisible(visible) {
    if (!guidedTourProbeButton) {
      return;
    }
    guidedTourProbeButton.hidden = !visible;
    guidedTourProbeButton.style.display = visible ? "" : "none";
    guidedTourProbeButton.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function closeGuidedTourProbeScreen() {
    guidedTourProbeScreen?.classList.add("hidden");
    if (guidedReceiverTourState) {
      guidedReceiverTourState.probeScreenOpen = false;
    }
  }

  function openGuidedTourProbeScreen() {
    if (!guidedReceiverTourState || guidedReceiverTourState.step?.id !== "receiving-observe" || !guidedTourProbeScreen) {
      return;
    }
    guidedReceiverTourState.probeScreenOpen = true;
    guidedTourProbeScreen.classList.remove("hidden");
  }

  function setGuidedReceiverTourHint(message) {
    if (!guidedTourHint) {
      return;
    }
    const text = String(message || "").trim();
    guidedTourHint.textContent = text;
    guidedTourHint.hidden = !text;
  }

  function getGuidedReceiverTourCorrectChoiceNodes() {
    if (!activeRound) {
      return [];
    }
    if (isLevelOneDifficulty()) {
      const actualLayoutNumber = Number(activeRound.layout_number);
      const count = Array.isArray(layouts[actualLayoutNumber]) ? layouts[actualLayoutNumber].length : 0;
      if (count <= 1) {
        return [levelOneChoiceNodes.get("count-1")].filter(Boolean);
      }
      return [levelOneChoiceNodes.get("count-3")].filter(Boolean);
    }
    return Array.from(getActiveSelectionNodesMap().values()).filter(Boolean);
  }

  function setGuidedReceiverTourChromeHidden(hidden) {
    if (!isGuidedExperienceTour) {
      return;
    }
    if (hidden) {
      homeLink?.classList.add("hidden");
      settingsGear?.classList.add("hidden");
      waitingBackButton?.classList.add("hidden");
      if (homeLink) {
        homeLink.style.display = "none";
      }
      if (settingsGear) {
        settingsGear.style.display = "none";
      }
      if (waitingBackButton) {
        waitingBackButton.style.display = "none";
      }
      return;
    }
    homeLink?.classList.remove("hidden");
    if (homeLink) {
      homeLink.style.display = "";
    }
    if (settingsGear) {
      settingsGear.style.display = "";
    }
    if (waitingBackButton) {
      waitingBackButton.style.display = "";
    }
    updateSettingsGearVisibility();
  }

  function getGuidedReceiverTourAllowedNodes(step) {
    if (!step) {
      return [];
    }
    if (typeof step.allowed === "function") {
      return (step.allowed() || []).filter(Boolean);
    }
    return Array.isArray(step.allowed) ? step.allowed.filter(Boolean) : [];
  }

  function positionGuidedReceiverTourBalloon(step) {
    if (!guidedTourBalloon) {
      return;
    }
    if (guidedReceiverTourState?.manualBalloonPosition?.stepId === step?.id) {
      const manual = guidedReceiverTourState.manualBalloonPosition;
      guidedTourBalloon.style.width = `${manual.width || guidedTourBalloon.offsetWidth || 320}px`;
      guidedTourBalloon.style.left = `${manual.left}px`;
      guidedTourBalloon.style.top = `${manual.top}px`;
      guidedTourBalloon.style.right = "auto";
      guidedTourBalloon.style.bottom = "auto";
      return;
    }

    const viewportWidth = stage?.closest(".screen")?.clientWidth || window.innerWidth || 1280;
    const viewportHeight = stage?.closest(".screen")?.clientHeight || window.innerHeight || 720;
    const stageRect = stage?.getBoundingClientRect();
    const countdownRect = countdownBox?.getBoundingClientRect();

    let width = 320;
    let left = 20;
    let top = 20;

    switch (step?.placement) {
      case "top-center":
        width = Math.min(Math.max(Math.round(viewportWidth * 0.42), 260), 420);
        left = Math.max(16, Math.round((viewportWidth - width) / 2));
        top = 20;
        break;
      case "top-center-wide":
        width = Math.min(Math.max(Math.round(viewportWidth * 0.68), 460), 780);
        left = Math.max(16, Math.round((viewportWidth - width) / 2));
        top = 20;
        break;
      case "top-right":
        width = Math.min(Math.max(Math.round(viewportWidth * 0.34), 240), 380);
        left = Math.max(16, viewportWidth - width - 20);
        top = 20;
        break;
      case "stage-top-center":
        width = Math.min(Math.max(Math.round((stageRect?.width || viewportWidth) * 0.5), 320), 500);
        left = Math.max(16, Math.round(((stageRect?.left || 0) + ((stageRect?.width || viewportWidth) - width) / 2)));
        top = Math.max(16, Math.round((stageRect?.top || 0) + 8));
        break;
      case "result-right-inline":
        width = Math.min(Math.max(Math.round((stageRect?.width || viewportWidth) * 0.3), 220), 360);
        left = Math.max(16, Math.round((stageRect?.left || 0) + ((stageRect?.width || viewportWidth) * 0.56) - 60));
        top = Math.max(16, Math.round((stageRect?.top || 0) + ((stageRect?.height || viewportHeight) * 0.22)));
        break;
      case "stage-top-left":
      case "result-top-left":
        width = Math.min(Math.max(Math.round((stageRect?.width || viewportWidth) * 0.38), 250), 360);
        left = Math.max(16, Math.round((stageRect?.left || 0) + 8));
        top = Math.max(16, Math.round((stageRect?.top || 0) + 8));
        break;
      default:
        width = Math.min(Math.max(Math.round((countdownRect?.width || viewportWidth) * 0.7), 250), 380);
        left = Math.max(16, Math.round((countdownRect?.left || 16) + (((countdownRect?.width || width) - width) / 2)));
        top = Math.max(16, Math.round((countdownRect?.top || 16) + 12));
        break;
    }

    guidedTourBalloon.style.width = `${width}px`;
    guidedTourBalloon.style.left = `${Math.min(Math.max(16, left), Math.max(16, viewportWidth - width - 16))}px`;
    guidedTourBalloon.style.top = `${Math.min(Math.max(16, top), Math.max(16, viewportHeight - 140))}px`;
    guidedTourBalloon.style.right = "auto";
    guidedTourBalloon.style.bottom = "auto";
  }

  function renderGuidedReceiverTourStep(step) {
    if (!isGuidedExperienceTour || !guidedTourOverlay || !guidedTourCopy || !guidedTourNextButton) {
      return;
    }

    if (!step?.showProbeDeeper) {
      closeGuidedTourProbeScreen();
    }

    setGuidedReceiverTourChromeHidden(true);
    clearGuidedReceiverTourTargetClasses();
    guidedTourOverlay.classList.remove("hidden");
    guidedTourCopy.textContent = String(step?.text || "");
    setGuidedReceiverTourHint(String(step?.hint || ""));
    guidedTourNextButton.hidden = !step?.showNext;
    guidedTourNextButton.style.display = step?.showNext ? "" : "none";
    guidedTourNextButton.setAttribute("aria-hidden", step?.showNext ? "false" : "true");
    guidedTourNextButton.textContent = String(step?.nextLabel || "NEXT");
    setGuidedReceiverTourProbeVisible(!!step?.showProbeDeeper);

    const allowedNodes = new Set(getGuidedReceiverTourAllowedNodes(step));
    if (step?.target instanceof HTMLElement) {
      step.target.classList.add("guided-tour-runtime-target");
      if (allowedNodes.size === 0 && step.allowTargetByDefault !== false) {
        allowedNodes.add(step.target);
      }
    }

    const interactiveNodes = [countdownBox, settingsGear, waitingBackButton, homeLink, enoughButton, anotherButton]
      .filter(Boolean);
    getActiveSelectionNodesMap().forEach((node) => {
      if (node) {
        interactiveNodes.push(node);
      }
    });
    interactiveNodes.forEach((node) => {
      if (step?.keepTargetBright && step.target instanceof HTMLElement && node === step.target) {
        return;
      }
      if (!allowedNodes.has(node)) {
        node.classList.add("guided-tour-runtime-muted");
      }
    });
    positionGuidedReceiverTourBalloon(step);
  }

  function setGuidedReceiverTourStep(step) {
    if (!guidedReceiverTourState) {
      return;
    }
    guidedReceiverTourState.step = step;
    renderGuidedReceiverTourStep(step);
  }

  function beginGuidedReceiverTour() {
    if (!isGuidedExperienceTour) {
      return;
    }
    document.body.setAttribute("data-guided-tour-active", "1");
    guidedReceiverTourState = {
      phase: "waiting-online",
      pendingPhase: null,
      step: null,
      waitingOnlineAcknowledged: false,
      probeScreenOpen: false,
      manualBalloonPosition: null,
      pauseTimer: null
    };
    setGuidedReceiverTourChromeHidden(true);
    if (currentUiMode === "receiver-waiting-online" || currentUiMode === "sender-waiting-online") {
      notifyGuidedReceiverTourPhase("waiting-online");
    } else if (currentUiMode === "receiver-ready" || currentUiMode === "sender-ready") {
      notifyGuidedReceiverTourPhase("ready");
    }
  }

  function clearGuidedReceiverTour() {
    document.body.removeAttribute("data-guided-tour-active");
    if (guidedReceiverTourState?.pauseTimer) {
      window.clearTimeout(guidedReceiverTourState.pauseTimer);
    }
    guidedReceiverTourState = null;
    clearGuidedReceiverTourTargetClasses();
    setGuidedReceiverTourHint("");
    setGuidedReceiverTourProbeVisible(false);
    closeGuidedTourProbeScreen();
    guidedTourOverlay?.classList.add("hidden");
    setGuidedReceiverTourChromeHidden(false);
  }

  function dismissGuidedReceiverTourLiveStep(stepId) {
    if (!guidedReceiverTourState || guidedReceiverTourState.step?.id !== stepId) {
      return;
    }
    guidedReceiverTourState.step = null;
    guidedTourOverlay?.classList.add("hidden");
    setGuidedReceiverTourHint("");
  }

  function notifyGuidedReceiverTourPhase(phase) {
    if (!guidedReceiverTourState) {
      return;
    }

    guidedReceiverTourState.phase = phase;
    if (isGuidedSenderTour) {
      if (phase === "waiting-online") {
        if (guidedReceiverTourState.waitingOnlineAcknowledged) {
          return;
        }
        setGuidedReceiverTourStep({
          id: "waiting-online",
          text: "This message at the beginning means that the Receiver has not yet pressed GO button to start the session.",
          target: countdownBox,
          keepTargetBright: true,
          showNext: true,
          nextLabel: "NEXT",
          allowed: [],
          placement: "top-center"
        });
        return;
      }
      if (phase === "ready") {
        if (
          guidedReceiverTourState.step?.id === "waiting-online" &&
          !guidedReceiverTourState.waitingOnlineAcknowledged
        ) {
          guidedReceiverTourState.pendingPhase = "ready";
          return;
        }
        setGuidedReceiverTourStep({
          id: "ready",
          text: "When the receiver is ready, this prompt appears. Tap it when you are ready to begin sending.",
          target: countdownBox,
          keepTargetBright: true,
          showNext: false,
          allowed: [countdownBox],
          placement: "top-center"
        });
        return;
      }
      if (phase === "sending") {
        setGuidedReceiverTourStep({
          id: "sending-intro",
          text: "At the end of the countdown, the target image appears before you. Your task as sender is to focus all your attention on it and not on anything else. Your unconscious knows who your partner is, and your partner's unconscious knows that you are the sender. A telepathic connection exists between the two partners.",
          target: stage,
          keepTargetBright: true,
          showNext: true,
          nextLabel: "NEXT",
          allowed: [],
          placement: "top-center-wide"
        });
        return;
      }
      if (phase === "result") {
        setGuidedReceiverTourStep({
          id: "sender-result",
          text: "This is the sender's result screen. It shows what you send and what choice the receiver picked. Since the receiver has selected, 'Another?' you can choose 'OK' and continue, or you can let the receiver know that you have had enough for now.",
          target: messagePanel || stage,
          showNext: false,
          allowed: () => Array.from(messageActions?.querySelectorAll("button") || []).filter(Boolean),
          allowTargetByDefault: false,
          placement: "result-right-inline"
        });
      }
      return;
    }

    if (phase === "waiting-online") {
      if (guidedReceiverTourState.waitingOnlineAcknowledged) {
        return;
      }
      setGuidedReceiverTourStep({
        id: "waiting-online",
        text: "This message at the beginning means that the Sender has not yet pressed his GO button to start the session.",
        target: countdownBox,
        keepTargetBright: true,
        showNext: true,
        nextLabel: "NEXT",
        allowed: [],
        placement: "top-center"
      });
      return;
    }
    if (phase === "ready") {
      if (
        guidedReceiverTourState.step?.id === "waiting-online" &&
        !guidedReceiverTourState.waitingOnlineAcknowledged
      ) {
        guidedReceiverTourState.pendingPhase = "ready";
        return;
      }
      setGuidedReceiverTourStep({
        id: "ready",
        text: "When the sender is ready, this prompt appears. Tap it when you are ready to begin receiving.",
        target: countdownBox,
        keepTargetBright: true,
        showNext: false,
        allowed: [countdownBox],
        placement: "top-center"
      });
      return;
    }

    if (phase === "receiving") {
      setGuidedReceiverTourStep({
        id: "receiving-intro",
        text: "At the end of the countdown, a short beep marks the start of the receiving interval. Your eyes could be closed and you should inspect what appears in your mind's eye at this time. The beep marks the time that an image appears before the sender's eyes. When a person views a change in their visual field, a flurry of brain activity occurs as they grasp what new information appears before them. You, the receiver, know exactly when this is happening for the sender, and so, the fast traveling information will be new for you, too. This is the best time to try to observe new visual information in your mind's eye.",
        target: countdownBox,
        keepTargetBright: true,
        showNext: true,
        nextLabel: "NEXT",
        allowed: [],
        placement: "top-center-wide"
      });
      return;
    }

    if (phase === "done") {
      setGuidedReceiverTourStep({
        id: "done",
        text: "After you have had a few seconds to inspect and remember the contents of your mind's eye, tap here to say you are done receiving.",
        target: countdownBox,
        keepTargetBright: true,
        showNext: false,
        allowed: [countdownBox],
        placement: "top-center"
      });
      return;
    }

    if (phase === "choices") {
      setGuidedReceiverTourStep({
        id: "choices",
        text: "For this tour, tap the highlighted correct answer so you can experience the instant positive reinforcement sound. Positive reinforcement has been proven to enhance learning.",
        target: getGuidedReceiverTourCorrectChoiceNodes()[0] || stage,
        showNext: false,
        allowed: () => getGuidedReceiverTourCorrectChoiceNodes(),
        allowTargetByDefault: false,
        placement: "stage-top-center"
      });
      return;
    }

    if (phase === "result") {
      setGuidedReceiverTourStep({
        id: "result",
        text: "This is the last screen of a trial. To do another trial, you would tap the word, \"Another?\" below. The sender will then decide whether the sender is also ready for another trial. (Robot is always ready.)",
        target: decisionPanel || messagePanel || stage,
        showNext: false,
        allowed: [enoughButton, anotherButton].filter(Boolean),
        allowTargetByDefault: false,
        placement: "result-right-inline"
      });
    }
  }

  let lastGuidedReceiverTourNextActionMs = 0;

  function handleGuidedReceiverTourNextAction() {
    const now = Date.now();
    if (now - lastGuidedReceiverTourNextActionMs < 120) {
      return;
    }
    lastGuidedReceiverTourNextActionMs = now;
    if (!guidedReceiverTourState) {
      return;
    }
    const currentStep = guidedReceiverTourState.step;
    if (isGuidedSenderTour) {
      if (currentStep?.id === "waiting-online") {
        guidedReceiverTourState.waitingOnlineAcknowledged = true;
        guidedReceiverTourState.manualBalloonPosition = null;
        if (guidedReceiverTourState.pendingPhase) {
          const pendingPhase = guidedReceiverTourState.pendingPhase;
          guidedReceiverTourState.pendingPhase = null;
          if (pendingPhase === "ready") {
            const prompt = getSenderReadyPrompt();
            setPrompt(prompt, !isRemoteDisplayMode, prompt);
            updateSettingsGearVisibility();
          }
          notifyGuidedReceiverTourPhase(pendingPhase);
        } else if (currentUiMode === "sender-ready") {
          const prompt = getSenderReadyPrompt();
          setPrompt(prompt, !isRemoteDisplayMode, prompt);
          updateSettingsGearVisibility();
          notifyGuidedReceiverTourPhase("ready");
        } else {
          guidedReceiverTourState.step = null;
          guidedTourOverlay.classList.add("hidden");
          setGuidedReceiverTourHint("");
        }
        return;
      }
      if (currentStep?.id === "sending-intro") {
        guidedReceiverTourState.manualBalloonPosition = null;
        guidedReceiverTourState.step = null;
        guidedTourOverlay.classList.add("hidden");
        setGuidedReceiverTourHint("");
        if (typeof guidedReceiverTourState.resumeAfterStep === "function") {
          const resume = guidedReceiverTourState.resumeAfterStep;
          guidedReceiverTourState.resumeAfterStep = null;
          resume();
        }
        return;
      }
      if (currentStep?.id === "sender-result") {
        return;
      }
    }
    if (currentStep?.id === "waiting-online") {
      guidedReceiverTourState.waitingOnlineAcknowledged = true;
      guidedReceiverTourState.manualBalloonPosition = null;
      if (guidedReceiverTourState.pendingPhase) {
        const pendingPhase = guidedReceiverTourState.pendingPhase;
        guidedReceiverTourState.pendingPhase = null;
        if (pendingPhase === "ready") {
          const prompt = getReceiverPressReadyPrompt();
          setPrompt(prompt, true, prompt);
          updateSettingsGearVisibility();
        }
        notifyGuidedReceiverTourPhase(pendingPhase);
      } else if (currentUiMode === "receiver-ready") {
        const prompt = getReceiverPressReadyPrompt();
        setPrompt(prompt, true, prompt);
        updateSettingsGearVisibility();
        notifyGuidedReceiverTourPhase("ready");
      } else {
        guidedReceiverTourState.step = null;
        guidedTourOverlay.classList.add("hidden");
        setGuidedReceiverTourHint("");
      }
      return;
    }
    if (currentStep?.id === "receiving-intro") {
      guidedReceiverTourState.manualBalloonPosition = null;
      setGuidedReceiverTourStep({
        id: "receiving-observe",
        text: "Look carefully. Do you see a single dim, blurry, blob, perhaps with some color, or can you make out more than one blurry blob? After just a few seconds, the impression may fade, so use these first few seconds to inspect - and also remember - whatever manifested in your mind's eye about the time that the beep occurred. This is your task.",
        target: countdownBox,
        keepTargetBright: true,
        showNext: true,
        showProbeDeeper: true,
        nextLabel: "NEXT",
        allowed: [],
        placement: "top-center-wide"
      });
      return;
    }
    if (currentStep?.id === "receiving-observe") {
      guidedReceiverTourState.manualBalloonPosition = null;
      guidedReceiverTourState.step = null;
      guidedTourOverlay.classList.add("hidden");
      setGuidedReceiverTourHint("");
      if (guidedReceiverTourState.pauseTimer) {
        window.clearTimeout(guidedReceiverTourState.pauseTimer);
      }
      guidedReceiverTourState.pauseTimer = window.setTimeout(() => {
        if (!guidedReceiverTourState) {
          return;
        }
        guidedReceiverTourState.pauseTimer = null;
        showReceiverDoneButton();
      }, 2000);
      return;
    }
    if (currentStep?.id === "result") {
      return;
    }
  }

  guidedTourNextButton?.addEventListener("click", handleGuidedReceiverTourNextAction);
  guidedTourProbeButton?.addEventListener("click", () => {
    openGuidedTourProbeScreen();
  });
  guidedTourProbeBackButton?.addEventListener("click", () => {
    closeGuidedTourProbeScreen();
    if (guidedReceiverTourState?.step) {
      renderGuidedReceiverTourStep(guidedReceiverTourState.step);
    }
  });

  let guidedReceiverTourBalloonDrag = null;

  guidedTourBalloon?.addEventListener("pointerdown", (event) => {
    if (!guidedReceiverTourState) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("button, input, select, textarea, a, label")) {
      return;
    }
    const rect = guidedTourBalloon.getBoundingClientRect();
    guidedReceiverTourBalloonDrag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    guidedTourBalloon.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  guidedTourBalloon?.addEventListener("pointermove", (event) => {
    if (!guidedReceiverTourBalloonDrag || !guidedReceiverTourState || guidedReceiverTourBalloonDrag.pointerId !== event.pointerId) {
      return;
    }
    const rect = guidedTourBalloon.getBoundingClientRect();
    const viewportWidth = stage?.closest(".screen")?.clientWidth || window.innerWidth || 1280;
    const viewportHeight = stage?.closest(".screen")?.clientHeight || window.innerHeight || 720;
    const minVisibleX = 96;
    const minVisibleY = 56;
    const left = Math.min(
      Math.max(minVisibleX - rect.width, event.clientX - guidedReceiverTourBalloonDrag.offsetX),
      Math.max(minVisibleX, viewportWidth - minVisibleX)
    );
    const top = Math.min(
      Math.max(minVisibleY - rect.height, event.clientY - guidedReceiverTourBalloonDrag.offsetY),
      Math.max(minVisibleY, viewportHeight - minVisibleY)
    );
    guidedReceiverTourState.manualBalloonPosition = {
      stepId: guidedReceiverTourState.step?.id || "",
      left,
      top,
      width: rect.width
    };
    guidedTourBalloon.style.left = `${left}px`;
    guidedTourBalloon.style.top = `${top}px`;
    guidedTourBalloon.style.right = "auto";
    guidedTourBalloon.style.bottom = "auto";
  });

  const clearGuidedReceiverTourBalloonDrag = () => {
    guidedReceiverTourBalloonDrag = null;
  };

  guidedTourBalloon?.addEventListener("pointerup", clearGuidedReceiverTourBalloonDrag);
  guidedTourBalloon?.addEventListener("pointercancel", clearGuidedReceiverTourBalloonDrag);
  document.addEventListener("click", (event) => {
    if (!guidedReceiverTourState) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (guidedTourProbeScreen?.contains(target)) {
      return;
    }
    if (guidedTourOverlay?.contains(target)) {
      return;
    }

    const currentStep = guidedReceiverTourState.step;
    const allowedNodes = getGuidedReceiverTourAllowedNodes(currentStep);
    const isAllowed = allowedNodes.some((node) => node === target || node.contains(target));

    if (isAllowed) {
      if (currentStep?.id === "ready") {
        guidedReceiverTourState.step = null;
        guidedTourOverlay?.classList.add("hidden");
        clearGuidedReceiverTourTargetClasses();
        setGuidedReceiverTourHint("");
      } else if (currentStep?.id === "done") {
        guidedReceiverTourState.step = null;
        guidedTourOverlay?.classList.add("hidden");
        clearGuidedReceiverTourTargetClasses();
        setGuidedReceiverTourHint("");
      } else if (currentStep?.id === "choices") {
        guidedReceiverTourState.step = null;
        guidedTourOverlay?.classList.add("hidden");
        clearGuidedReceiverTourTargetClasses();
        setGuidedReceiverTourHint("");
      } else if (currentStep?.id === "result" || currentStep?.id === "sender-result") {
        guidedReceiverTourState.step = null;
        guidedTourOverlay?.classList.add("hidden");
        clearGuidedReceiverTourTargetClasses();
        setGuidedReceiverTourHint("");
      }
      return;
    }

    if (target.closest("button, [role=\"button\"], a, input, select, textarea")) {
      event.preventDefault();
      event.stopPropagation();
      setGuidedReceiverTourHint('Please press "NEXT" to continue.');
    }
  }, true);

  function readLauncherVisitorDisplayName(preferredRole = role) {
    try {
      const raw = localStorage.getItem(launcherStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const visitorDisplayNames = parsed && typeof parsed.visitorDisplayNames === "object" && parsed.visitorDisplayNames
        ? parsed.visitorDisplayNames
        : {};
      const candidates = [
        String(parsed?.visitorLockedName || "").trim(),
        String(visitorDisplayNames?.[preferredRole] || "").trim(),
        String(visitorDisplayNames?.sender || "").trim(),
        String(visitorDisplayNames?.receiver || "").trim()
      ];
      return candidates.find((candidate) => candidate && !isInternalVisitorIdentifier(candidate)) || "";
    } catch (_) {
      return "";
    }
  }

  function getPreferredVisitorDisplayName(preferredRole = role) {
    if (launchedVisitorDisplayName && !isInternalVisitorIdentifier(launchedVisitorDisplayName)) {
      return launchedVisitorDisplayName;
    }
    const settings = readSettings();
    const settingsName = String(settings.visitor_display_name || "").trim();
    if (settingsName && !isInternalVisitorIdentifier(settingsName)) {
      return settingsName;
    }
    const launcherName = readLauncherVisitorDisplayName(preferredRole);
    if (launcherName) {
      return launcherName;
    }
    return settingsName || String(settings.own_email || "").trim();
  }

  function buildLauncherRobotDifficultyKey(roleName, identifier) {
    const normalizedRole = String(roleName || "").trim() === "sender" ? "sender" : "receiver";
    const normalizedIdentifier = normalizeIdentifierForSession(identifier);
    return normalizedIdentifier ? `${normalizedRole}::${normalizedIdentifier}::robot` : `${normalizedRole}::::robot`;
  }

  async function syncLauncherReturnStateFromRuntime(reason = "", guidedReturnSnapshot = null) {
    try {
      appendGuidedReturnTrace("runtime_sync_launcher_return_state_start", {
        page_instance_id: runtimePageInstanceId,
        reason,
        hasGuidedSnapshot: !!guidedReturnSnapshot
      });
      if (guidedReturnSnapshot && typeof guidedReturnSnapshot === "object") {
        if (guidedReturnSnapshot.launcherState && typeof guidedReturnSnapshot.launcherState === "object") {
          localStorage.setItem(launcherStorageKey, JSON.stringify(guidedReturnSnapshot.launcherState));
        }
        const snapshotRuntimeSettings = guidedReturnSnapshot.runtimeSettings && typeof guidedReturnSnapshot.runtimeSettings === "object"
          ? guidedReturnSnapshot.runtimeSettings
          : {};
        ["sender", "receiver", "remote-viewer"].forEach((snapshotRole) => {
          if (snapshotRuntimeSettings[snapshotRole] && typeof snapshotRuntimeSettings[snapshotRole] === "object") {
            localStorage.setItem(`cones-settings-v2-${snapshotRole}`, JSON.stringify(snapshotRuntimeSettings[snapshotRole]));
          }
        });
        if (typeof logDebugEvent === "function") {
          await logDebugEvent("launcher_return_state_restored_from_guided_snapshot", {
            reason,
            role,
            page_instance_id: runtimePageInstanceId
          });
        }
        appendGuidedReturnTrace("runtime_sync_launcher_return_state_guided_snapshot_restored", {
          page_instance_id: runtimePageInstanceId,
          reason,
          role
        });
        return;
      }

      const settings = readSettings();
      const raw = localStorage.getItem(launcherStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const returnRole = role === "sender" ? "sender" : "receiver";
      const visitorDisplayName = getPreferredVisitorDisplayName(returnRole);
      const internalIdentifier = String(settings.own_email || "").trim();
      const shouldReturnAsVisitor = !!visitorDisplayName && isInternalVisitorIdentifier(internalIdentifier);
      const returnDifficulty = normalizeDifficultyLevel(currentPairDifficultyLevel || settings.difficulty_level || "1");

      parsed.roleDifficultyLevels = parsed && typeof parsed.roleDifficultyLevels === "object" && parsed.roleDifficultyLevels
        ? parsed.roleDifficultyLevels
        : {};
      parsed.currentPartners = parsed && typeof parsed.currentPartners === "object" && parsed.currentPartners
        ? parsed.currentPartners
        : {};
      parsed.visitorDisplayNames = parsed && typeof parsed.visitorDisplayNames === "object" && parsed.visitorDisplayNames
        ? parsed.visitorDisplayNames
        : {};
      parsed.robotSimulationDifficultyLevels = parsed && typeof parsed.robotSimulationDifficultyLevels === "object" && parsed.robotSimulationDifficultyLevels
        ? parsed.robotSimulationDifficultyLevels
        : {};

      parsed.difficultyLevel = returnDifficulty;
      parsed.roleDifficultyLevels[returnRole] = returnDifficulty;

      if (isRobotSimulationMode) {
        parsed.currentPartners[returnRole] = robotSimulationIdentifier;
      }

      if (shouldReturnAsVisitor) {
        parsed.entryMode = "visitor";
        parsed.visitorLockedName = visitorDisplayName;
        parsed.visitorDisplayNames[returnRole] = visitorDisplayName;
        if (!parsed.visitorDisplayNames.sender) {
          parsed.visitorDisplayNames.sender = visitorDisplayName;
        }
        if (!parsed.visitorDisplayNames.receiver) {
          parsed.visitorDisplayNames.receiver = visitorDisplayName;
        }

        if (isRobotSimulationMode) {
          parsed.robotSimulationDifficultyLevels[buildLauncherRobotDifficultyKey(returnRole, visitorDisplayName)] = returnDifficulty;
        }
      } else if (internalIdentifier) {
        parsed.entryMode = "";
        parsed.visitorLockedName = "";
      }

      if (isRobotSimulationMode && internalIdentifier) {
        parsed.robotSimulationDifficultyLevels[buildLauncherRobotDifficultyKey(returnRole, internalIdentifier)] = returnDifficulty;
      }

      localStorage.setItem(launcherStorageKey, JSON.stringify(parsed));

      if (typeof logDebugEvent === "function") {
        await logDebugEvent("launcher_return_state_synced", {
          reason,
          role: returnRole,
          page_instance_id: runtimePageInstanceId,
          runtime_own_email: internalIdentifier,
          visitor_display_name: visitorDisplayName,
          difficulty_level: returnDifficulty,
          robot_mode: isRobotSimulationMode
        });
      }
      appendGuidedReturnTrace("runtime_sync_launcher_return_state_saved", {
        page_instance_id: runtimePageInstanceId,
        reason,
        role: returnRole,
        returnDifficulty,
        visitorDisplayName,
        robotMode: !!isRobotSimulationMode
      });
    } catch (error) {
      appendGuidedReturnTrace("runtime_sync_launcher_return_state_error", {
        page_instance_id: runtimePageInstanceId,
        reason,
        message: String(error?.message || error || "").trim()
      });
      // Ignore launcher sync failures so the runtime can still return home.
    }
  }

  function lockVisitorLauncherName(name) {
    const lockedName = String(name || "").trim();
    if (!lockedName) {
      return;
    }
    try {
      const raw = localStorage.getItem(launcherStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const visitorDisplayNames = parsed && typeof parsed.visitorDisplayNames === "object" && parsed.visitorDisplayNames
        ? parsed.visitorDisplayNames
        : {};
      parsed.visitorLockedName = lockedName;
      parsed.visitorDisplayNames = {
        ...visitorDisplayNames,
        sender: lockedName,
        receiver: lockedName
      };
      localStorage.setItem(launcherStorageKey, JSON.stringify(parsed));
    } catch (error) {
      // Ignore launcher-state sync failures in the runtime page.
    }
  }

  function isLevelFourDifficulty() {
    return normalizeDifficultyLevel(currentPairDifficultyLevel) === "4" && !isRemoteViewerMode && !isRemoteDisplayMode;
  }

  function getLevelFourChoiceUrls(roundLike = activeRound) {
    if (!roundLike || String(roundLike?.stimulus_kind || "") !== "image_pair") {
      return null;
    }

    const choiceA = String(roundLike.image_choice_a || "").trim();
    const choiceB = String(roundLike.image_choice_b || "").trim();
    if (!choiceA || !choiceB) {
      return null;
    }

    return {
      1: choiceA,
      2: choiceB
    };
  }

  function getLevelFourSentImageUrl(roundLike = activeRound) {
    if (!roundLike || String(roundLike?.stimulus_kind || "") !== "image_pair") {
      return "";
    }
    return String(roundLike.image_sent || "").trim();
  }

  async function preloadRuntimeImage(imageUrl) {
    const normalizedUrl = String(imageUrl || "").trim();
    if (!normalizedUrl) {
      return null;
    }

    const existing = preloadedRuntimeImages.get(normalizedUrl);
    if (existing) {
      return existing;
    }

    const loadPromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.loading = "eager";
      image.decoding = "sync";
      image.onload = async () => {
        try {
          if (typeof image.decode === "function") {
            await image.decode();
          }
        } catch (error) {
          // Ignore decode failures after a successful load.
        }
        resolve(image);
      };
      image.onerror = () => {
        preloadedRuntimeImages.delete(normalizedUrl);
        reject(new Error(`Unable to preload image asset: ${normalizedUrl}`));
      };
      image.src = normalizedUrl;
    });

    preloadedRuntimeImages.set(normalizedUrl, loadPromise);
    return loadPromise;
  }

  async function preloadLevelFourRoundAssets(roundLike = activeRound) {
    const imageUrls = [
      getLevelFourSentImageUrl(roundLike),
      ...Object.values(getLevelFourChoiceUrls(roundLike) || {})
    ].filter(Boolean);

    if (imageUrls.length === 0) {
      return;
    }

    await Promise.allSettled(imageUrls.map((imageUrl) => preloadRuntimeImage(imageUrl)));
  }

  function getWaitingOnlinePrompt() {
    if (role === "sender") {
      return isRemoteDisplayMode
        ? "Waiting for remote viewer to be online..."
        : "Waiting for receiver to be online...";
    }

    return isRemoteViewerMode
      ? "Waiting for remote viewer display to be online..."
      : "Waiting for sender to be online...";
  }

  function getWaitingReadyPrompt() {
    return isRemoteDisplayMode
      ? "Waiting for remote viewer to be ready..."
      : "Waiting for the receiver to be ready...";
  }

  function getSenderReadyPrompt() {
    return isRemoteDisplayMode
      ? "Remote viewer ready. Display begins shortly..."
      : "Receiver ready. Press when ready to send.";
  }

  function getReceiverPressReadyPrompt() {
    return isRemoteViewerMode
      ? "Press when ready to remote view."
      : "Press when ready to receive.";
  }

  function getReceiverWaitingStartPrompt() {
    return isRemoteViewerMode
      ? "Waiting for remote viewer display to begin..."
      : "Waiting for sender to begin...";
  }

  function getReceiverDonePrompt() {
    return isRemoteViewerMode
      ? "Press here when done remote viewing."
      : "Press here when done receiving.";
  }

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
    const senderReadyBackAllowed = !(currentUiMode === "sender-ready" && senderTrialBackSuppressed);
    const shouldShowWaitingBack = [
      "sender-waiting-online",
      "receiver-waiting-online",
      "sender-waiting-ready",
      "receiver-ready"
    ].includes(currentUiMode);
    const finalShouldShowWaitingBack = (
      shouldShowWaitingBack &&
      !(role === "sender" && senderTrialBackSuppressed)
    ) || (currentUiMode === "sender-ready" && senderReadyBackAllowed);

    settingsGear?.classList.toggle("hidden", !shouldShow);
    homeLink?.classList.toggle("hidden", !shouldShow);
    waitingBackButton?.classList.toggle("hidden", !finalShouldShowWaitingBack);
    if (guidedReceiverTourState) {
      setGuidedReceiverTourChromeHidden(true);
    }
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(settingsStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const settings = {
        own_email: typeof parsed?.own_email === "string" ? parsed.own_email : "",
        partner_email: typeof parsed?.partner_email === "string" ? parsed.partner_email : "",
        visitor_display_name: typeof parsed?.visitor_display_name === "string" ? parsed.visitor_display_name : "",
        allow_second_choice: typeof parsed?.allow_second_choice === "boolean" ? parsed.allow_second_choice : false,
        export_email: typeof parsed?.export_email === "string" ? parsed.export_email : "",
        device_location: typeof parsed?.device_location === "string" ? parsed.device_location : "",
        data_folder_label: typeof parsed?.data_folder_label === "string" ? parsed.data_folder_label : "",
        last_logged_round_id: typeof parsed?.last_logged_round_id === "string" ? parsed.last_logged_round_id : "",
        blink_sender_image: typeof parsed?.blink_sender_image === "boolean" ? parsed.blink_sender_image : false,
        blink_image_on_seconds: typeof parsed?.blink_image_on_seconds === "string" ? parsed.blink_image_on_seconds : "0.35",
        blink_image_off_seconds: typeof parsed?.blink_image_off_seconds === "string" ? parsed.blink_image_off_seconds : "0.8",
        include_confidence: typeof parsed?.include_confidence === "boolean" ? parsed.include_confidence : false,
        include_positive_reinforcement: typeof parsed?.include_positive_reinforcement === "boolean" ? parsed.include_positive_reinforcement : true,
        difficulty_level: normalizeDifficultyLevel(parsed?.difficulty_level || "1")
      };
      if (runtimePrefillSettingsOverride) {
        settings.own_email = String(runtimePrefillSettingsOverride.own_email || settings.own_email || "").trim();
        settings.partner_email = String(runtimePrefillSettingsOverride.partner_email || settings.partner_email || "").trim();
        settings.visitor_display_name = String(runtimePrefillSettingsOverride.visitor_display_name || settings.visitor_display_name || "").trim();
        settings.device_location = typeof runtimePrefillSettingsOverride.device_location === "string"
          ? runtimePrefillSettingsOverride.device_location
          : settings.device_location;
        if (typeof runtimePrefillSettingsOverride.blink_sender_image === "boolean") {
          settings.blink_sender_image = runtimePrefillSettingsOverride.blink_sender_image;
        }
        if (typeof runtimePrefillSettingsOverride.blink_image_on_seconds === "string" && runtimePrefillSettingsOverride.blink_image_on_seconds) {
          settings.blink_image_on_seconds = runtimePrefillSettingsOverride.blink_image_on_seconds;
        }
        if (typeof runtimePrefillSettingsOverride.blink_image_off_seconds === "string" && runtimePrefillSettingsOverride.blink_image_off_seconds) {
          settings.blink_image_off_seconds = runtimePrefillSettingsOverride.blink_image_off_seconds;
        }
        if (typeof runtimePrefillSettingsOverride.include_confidence === "boolean") {
          settings.include_confidence = runtimePrefillSettingsOverride.include_confidence;
        }
        if (typeof runtimePrefillSettingsOverride.include_positive_reinforcement === "boolean") {
          settings.include_positive_reinforcement = runtimePrefillSettingsOverride.include_positive_reinforcement;
        }
        if (typeof runtimePrefillSettingsOverride.difficulty_level === "string" && runtimePrefillSettingsOverride.difficulty_level) {
          settings.difficulty_level = normalizeDifficultyLevel(runtimePrefillSettingsOverride.difficulty_level);
        }
      }
      return settings;
    } catch (error) {
      const fallback = {
        own_email: "",
        partner_email: "",
        visitor_display_name: "",
        allow_second_choice: false,
        export_email: "",
        device_location: "",
        data_folder_label: "",
        last_logged_round_id: "",
        blink_sender_image: false,
        blink_image_on_seconds: "0.35",
        blink_image_off_seconds: "0.8",
        include_confidence: false,
        include_positive_reinforcement: true,
        difficulty_level: "1"
      };
      if (runtimePrefillSettingsOverride) {
        fallback.own_email = String(runtimePrefillSettingsOverride.own_email || "").trim();
        fallback.partner_email = String(runtimePrefillSettingsOverride.partner_email || "").trim();
        fallback.visitor_display_name = String(runtimePrefillSettingsOverride.visitor_display_name || "").trim();
        fallback.device_location = typeof runtimePrefillSettingsOverride.device_location === "string"
          ? runtimePrefillSettingsOverride.device_location
          : "";
        if (typeof runtimePrefillSettingsOverride.blink_sender_image === "boolean") {
          fallback.blink_sender_image = runtimePrefillSettingsOverride.blink_sender_image;
        }
        if (typeof runtimePrefillSettingsOverride.blink_image_on_seconds === "string" && runtimePrefillSettingsOverride.blink_image_on_seconds) {
          fallback.blink_image_on_seconds = runtimePrefillSettingsOverride.blink_image_on_seconds;
        }
        if (typeof runtimePrefillSettingsOverride.blink_image_off_seconds === "string" && runtimePrefillSettingsOverride.blink_image_off_seconds) {
          fallback.blink_image_off_seconds = runtimePrefillSettingsOverride.blink_image_off_seconds;
        }
        if (typeof runtimePrefillSettingsOverride.include_confidence === "boolean") {
          fallback.include_confidence = runtimePrefillSettingsOverride.include_confidence;
        }
        if (typeof runtimePrefillSettingsOverride.include_positive_reinforcement === "boolean") {
          fallback.include_positive_reinforcement = runtimePrefillSettingsOverride.include_positive_reinforcement;
        }
        if (typeof runtimePrefillSettingsOverride.difficulty_level === "string" && runtimePrefillSettingsOverride.difficulty_level) {
          fallback.difficulty_level = normalizeDifficultyLevel(runtimePrefillSettingsOverride.difficulty_level);
        }
      }
      return fallback;
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
    const baseCode = buildSessionCodeFromValues(
      settings.own_email || "",
      settings.partner_email || ""
    );
    return baseCode;
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

  function clearRobotSimulationTimers() {
    robotSimulationTimerHandles.forEach((handle) => {
      window.clearTimeout(handle);
    });
    robotSimulationTimerHandles.clear();
    if (robotSimulationRoundStarterHandle !== null) {
      window.clearTimeout(robotSimulationRoundStarterHandle);
      robotSimulationRoundStarterHandle = null;
    }
  }

  function scheduleRobotSimulationStep(callback, delayMs) {
    const handle = window.setTimeout(() => {
      robotSimulationTimerHandles.delete(handle);
      callback();
    }, Math.max(0, delayMs));
    robotSimulationTimerHandles.add(handle);
    return handle;
  }

  function getRequestedDifficultyLevel() {
    return normalizeDifficultyLevel(requestedRuntimeDifficultyLevel || currentPairDifficultyLevel || "1");
  }

  function getRobotSimulationProbabilityForLevel(level = currentPairDifficultyLevel) {
    switch (normalizeDifficultyLevel(level)) {
      case "1":
        return 0.68;
      case "2":
        return 0.5;
      case "3":
        return 0.38;
      case "4":
        return 0.62;
      default:
        return 0.5;
    }
  }

  function buildRobotSyncMetrics() {
    return {
      offset_ms: 0,
      best_rtt_ms: 18,
      uncertainty_best_ms: 0,
      uncertainty_est_ms: 9,
      uncertainty_worst_ms: 18
    };
  }

  function buildRobotParticipantProfiles() {
    const settings = readSettings();
    const ownName = getPreferredVisitorDisplayName(role);
    const partnerLocation = "";
    const ownProfile = {
      name: ownName,
      location: settings.device_location || ""
    };
    const robotProfile = {
      name: robotSimulationIdentifier,
      location: partnerLocation
    };

    return role === "sender"
      ? {
          sender_profile: ownProfile,
          receiver_profile: robotProfile
        }
      : {
          sender_profile: robotProfile,
          receiver_profile: ownProfile
        };
  }

  function ensureRobotSimulationState() {
    if (robotSimulationState) {
      return robotSimulationState;
    }
    const participantProfiles = buildRobotParticipantProfiles();
    robotSimulationState = {
      sender_online: false,
      receiver_online: false,
      receiver_ready: false,
      round: null,
      post_round: null,
      receiver_view: {
        phase: "idle",
        confidence_value: 5,
        selection_limit: 1,
        selected_arrangement_codes: [],
        selected_layout_numbers: [],
        confidence_locked_at_ms: null,
        done_reaction_ms: null
      },
      sender_profile: participantProfiles.sender_profile,
      receiver_profile: participantProfiles.receiver_profile,
      sender_sync: buildRobotSyncMetrics(),
      receiver_sync: buildRobotSyncMetrics()
    };
    return robotSimulationState;
  }

  function buildRobotSimulationPayload() {
    const state = ensureRobotSimulationState();
    const difficultyLevel = getRequestedDifficultyLevel();
    if (isRobotSenderMode) {
      state.sender_online = true;
    }
    if (isRobotReceiverMode) {
      state.receiver_online = true;
    }
    return {
      ok: true,
      is_admin: false,
      debug_enabled: debugEnabled,
      pair_difficulty: difficultyLevel,
      state,
      server_now_ms: estimatedServerNowMs()
    };
  }

  function bootstrapRobotSimulation() {
    if (!isRobotSimulationMode || robotSimulationBootstrapped) {
      return;
    }
    robotSimulationBootstrapped = true;
    const state = ensureRobotSimulationState();
    currentPairDifficultyLevel = getRequestedDifficultyLevel();

    scheduleRobotSimulationStep(() => {
      if (isRobotSenderMode) {
        state.sender_online = true;
      } else {
        state.receiver_online = true;
      }
    }, randomInt(700, 1500));

    if (isRobotReceiverMode) {
      scheduleRobotSimulationStep(() => {
        state.receiver_online = true;
      }, randomInt(1400, 2600));
      scheduleRobotSimulationStep(() => {
        state.receiver_ready = true;
      }, randomInt(2400, 3800));
    }
  }

  function resolveRobotRuntimeImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    if (/^(https?:|data:)/i.test(raw)) {
      return raw;
    }
    const normalized = raw.replace(/\\/g, "/").trim();
    if (/^imagepairs\//i.test(normalized)) {
      return normalized;
    }
    const lastSegment = normalized.split("/").filter(Boolean).pop() || "";
    return lastSegment ? `imagepairs/${encodeURIComponent(lastSegment)}` : "";
  }

  async function loadRobotLevelFourPairs() {
    if (robotLevelFourPairsPromise) {
      return robotLevelFourPairsPromise;
    }
    robotLevelFourPairsPromise = (async () => {
      try {
        const response = await fetch(`./imagepairs/pairs.json?v=${runtimeBuildVersion}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Image-pair manifest request failed with status ${response.status}`);
        }
        const parsed = await response.json();
        return Array.isArray(parsed?.pairs)
          ? parsed.pairs
              .map((pair) => {
                const id = String(pair?.id || "").trim();
                const images = Array.isArray(pair?.images) ? pair.images.map((item) => resolveRobotRuntimeImageUrl(item)).filter(Boolean) : [];
                return id && images.length === 2 ? { id, images } : null;
              })
              .filter(Boolean)
          : [];
      } catch (error) {
        return [];
      }
    })();
    return robotLevelFourPairsPromise;
  }

  async function createRobotRound(startServerMs) {
    const difficultyLevel = getRequestedDifficultyLevel();
    const roundId = `robot-${Date.now().toString(36)}-${String(++robotSimulationRoundCounter).padStart(3, "0")}`;
    const senderClientId = isRobotReceiverMode ? clientId : robotSimulationIdentifier;
    const receiverClientId = isRobotSenderMode ? clientId : robotSimulationIdentifier;
    const round = {
      id: roundId,
      sender_client_id: senderClientId,
      receiver_client_id: receiverClientId,
      start_server_ms: startServerMs,
      last_activity_ms: startServerMs,
      layout_number: null,
      arrangement_code: "",
      completed_server_ms: null,
      guess_submitted_ms: null,
      guess_layout_number: null,
      second_guess_layout_number: null,
      guess_confidence: "",
      done_reaction_ms: "",
      stimulus_kind: "layout",
      image_pair_id: "",
      image_choice_a: "",
      image_choice_b: "",
      image_sent_index: null,
      image_sent: ""
    };

    if (difficultyLevel === "4") {
      const pairs = await loadRobotLevelFourPairs();
      if (pairs.length) {
        const pair = pairs[randomInt(0, pairs.length - 1)];
        const sentIndex = randomInt(1, 2);
        round.stimulus_kind = "image_pair";
        round.image_pair_id = pair.id;
        round.image_choice_a = pair.images[0];
        round.image_choice_b = pair.images[1];
        round.image_sent_index = sentIndex;
        round.image_sent = pair.images[sentIndex - 1];
        return round;
      }
    }

    round.layout_number = pickArrangementNumber();
    round.arrangement_code = getArrangementCode(round.layout_number);
    return round;
  }

  function chooseRobotGuessForRound(round) {
    const difficultyLevel = getRequestedDifficultyLevel();
    const probability = getRobotSimulationProbabilityForLevel(difficultyLevel);
    const isCorrect = Math.random() < probability;

    if (String(round?.stimulus_kind || "") === "image_pair") {
      const actualIndex = Number(round?.image_sent_index || 1) === 2 ? 2 : 1;
      return {
        guessLayoutNumber: isCorrect ? actualIndex : (actualIndex === 1 ? 2 : 1),
        secondGuessLayoutNumber: null,
        confidence: isCorrect ? randomInt(6, 9) : randomInt(2, 6)
      };
    }

    const actualLayoutNumber = Number(round?.layout_number || 1) || 1;
    if (difficultyLevel === "1") {
      const actualCountChoice = getLevelOneCountChoiceFromLayoutNumber(actualLayoutNumber);
      const guessLayoutNumber = isCorrect ? actualCountChoice : (actualCountChoice === 1 ? 3 : 1);
      return {
        guessLayoutNumber,
        secondGuessLayoutNumber: null,
        confidence: isCorrect ? randomInt(6, 9) : randomInt(2, 6)
      };
    }

    if (difficultyLevel === "2") {
      const candidateChoices = [1, 6, 7, 8, 9];
      const incorrectChoices = candidateChoices.filter((value) => value !== actualLayoutNumber);
      return {
        guessLayoutNumber: isCorrect ? actualLayoutNumber : incorrectChoices[randomInt(0, incorrectChoices.length - 1)],
        secondGuessLayoutNumber: null,
        confidence: isCorrect ? randomInt(6, 9) : randomInt(2, 6)
      };
    }

    const candidateChoices = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const incorrectChoices = candidateChoices.filter((value) => value !== actualLayoutNumber);
    return {
      guessLayoutNumber: isCorrect ? actualLayoutNumber : incorrectChoices[randomInt(0, incorrectChoices.length - 1)],
      secondGuessLayoutNumber: null,
      confidence: isCorrect ? randomInt(6, 9) : randomInt(2, 6)
    };
  }

  function resetRobotSimulationRoundState() {
    if (!isRobotSimulationMode) {
      return;
    }
    const state = ensureRobotSimulationState();
    state.round = null;
    state.post_round = null;
    state.receiver_view = {
      phase: "idle",
      confidence_value: 5,
      selection_limit: 1,
      selected_arrangement_codes: [],
      selected_layout_numbers: [],
      confidence_locked_at_ms: null,
      done_reaction_ms: null
    };
    if (isRobotReceiverMode) {
      state.receiver_ready = true;
    }
  }

  async function scheduleRobotSenderRoundStart() {
    if (!isRobotSenderMode || localRoundRunning || roundScheduled || robotSimulationRoundStarterHandle !== null) {
      return;
    }
    robotSimulationRoundStarterHandle = window.setTimeout(async () => {
      robotSimulationRoundStarterHandle = null;
      if (!receiverReady || localRoundRunning || roundScheduled) {
        return;
      }
      const state = ensureRobotSimulationState();
      const startServerMs = estimatedServerNowMs();
      const round = await createRobotRound(startServerMs);
      state.round = round;
      state.post_round = null;
      state.receiver_view.phase = "idle";
      scheduleSynchronizedRound(round);
      applyRemoteState(buildRobotSimulationPayload());
    }, randomInt(2900, 3700));
  }

  function runRobotReceiverSimulationAfterRound() {
    if (!isRobotReceiverMode || !activeRound?.id) {
      return;
    }
    const state = ensureRobotSimulationState();
    const round = activeRound;
    const guess = chooseRobotGuessForRound(round);
    const includeConfidence = false;
    const selectedArrangementCodes = String(round?.stimulus_kind || "") === "image_pair"
      ? []
      : [getArrangementCode(guess.guessLayoutNumber)];
    const guidedSenderDelayProfile = isGuidedSenderTour
      ? {
          choicesDelay: randomInt(900, 1300),
          resultsDelay: randomInt(2200, 3200),
          postRoundDelay: randomInt(3600, 4600)
        }
      : null;

    const startSimulation = () => {
      state.receiver_view = {
        phase: includeConfidence ? "confidence" : "idle",
        confidence_value: guess.confidence,
        selection_limit: 1,
        selected_arrangement_codes: [],
        selected_layout_numbers: [],
        confidence_locked_at_ms: null,
        done_reaction_ms: null
      };
      state.post_round = null;
      applyRemoteState(buildRobotSimulationPayload());

      scheduleRobotSimulationStep(() => {
        state.receiver_view = {
          phase: "choices",
          confidence_value: guess.confidence,
          selection_limit: 1,
          selected_arrangement_codes: includeConfidence ? selectedArrangementCodes : [],
          selected_layout_numbers: includeConfidence ? [guess.guessLayoutNumber] : [],
          confidence_locked_at_ms: null,
          done_reaction_ms: null
        };
        applyRemoteState(buildRobotSimulationPayload());
      }, guidedSenderDelayProfile ? guidedSenderDelayProfile.choicesDelay : randomInt(3600, 5600));

      scheduleRobotSimulationStep(() => {
        round.guess_layout_number = guess.guessLayoutNumber;
        round.second_guess_layout_number = guess.secondGuessLayoutNumber;
        round.guess_confidence = guess.confidence;
        round.done_reaction_ms = randomInt(700, 2200);
        round.guess_submitted_ms = estimatedServerNowMs();
        round.completed_server_ms = round.guess_submitted_ms;
        round.last_activity_ms = round.guess_submitted_ms;
        state.round = round;
        state.receiver_view = {
          phase: "results",
          confidence_value: guess.confidence,
          selection_limit: 1,
          selected_arrangement_codes: selectedArrangementCodes,
          selected_layout_numbers: [guess.guessLayoutNumber],
          confidence_locked_at_ms: estimatedServerNowMs(),
          done_reaction_ms: round.done_reaction_ms
        };
        void appendTrialServerRecord(buildRobotSimulationPayload().state);
        applyRemoteState(buildRobotSimulationPayload());
      }, guidedSenderDelayProfile ? guidedSenderDelayProfile.resultsDelay : randomInt(13500, 19000));

      scheduleRobotSimulationStep(() => {
        const continueSession = robotSimulationRoundCounter < 2 ? true : Math.random() < 0.65;
        state.post_round = {
          receiver_choice: continueSession ? "another" : "enough",
          sender_choice: null,
          resolved: null,
          updated_ms: estimatedServerNowMs()
        };
        applyRemoteState(buildRobotSimulationPayload());
      }, guidedSenderDelayProfile ? guidedSenderDelayProfile.postRoundDelay : randomInt(20500, 27000));
    };

    if (isGuidedSenderTour && guidedReceiverTourState) {
      guidedReceiverTourState.resumeAfterStep = startSimulation;
      return;
    }

    startSimulation();
  }

  function usesBrowserStorageMode() {
    return platformInfo.family === "iphone" || platformInfo.family === "android";
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeBlinkSecondsValue(value, fallbackSeconds) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackSeconds;
    }
    return clamp(numeric, 0.05, 30);
  }

  function getSenderBlinkSettings() {
    const settings = readSettings();
    return {
      enabled: role === "sender" && !!settings.blink_sender_image,
      onSeconds: normalizeBlinkSecondsValue(settings.blink_image_on_seconds, 0.35),
      offSeconds: normalizeBlinkSecondsValue(settings.blink_image_off_seconds, 0.8)
    };
  }

  function getIncludeConfidenceEnabled() {
    if (typeof requestedIncludeConfidence === "boolean") {
      return requestedIncludeConfidence;
    }
    return readSettings().include_confidence !== false;
  }

  function getPositiveReinforcementEnabled() {
    if (typeof requestedIncludePositiveReinforcement === "boolean") {
      return requestedIncludePositiveReinforcement;
    }
    return readSettings().include_positive_reinforcement === true;
  }

  function clearImageBlinkCycle({ keepVisible = true } = {}) {
    if (imageBlinkTimeoutHandle) {
      window.clearTimeout(imageBlinkTimeoutHandle);
      imageBlinkTimeoutHandle = null;
    }
    imageBlinkVisible = true;
    if (imageDisplayElement) {
      imageDisplayElement.style.visibility = keepVisible ? "visible" : "hidden";
    }
  }

  function scheduleImageBlinkToggle(nextVisible, delayMs, settings) {
    if (!imageDisplayElement) {
      return;
    }
    imageBlinkTimeoutHandle = window.setTimeout(() => {
      if (!imageDisplayElement || !imageDisplayPanel?.classList.contains("visible")) {
        clearImageBlinkCycle();
        return;
      }
      imageBlinkVisible = nextVisible;
      imageDisplayElement.style.visibility = nextVisible ? "visible" : "hidden";
      scheduleImageBlinkToggle(!nextVisible, (nextVisible ? settings.onSeconds : settings.offSeconds) * 1000, settings);
    }, delayMs);
  }

  function startImageBlinkCycle() {
    const settings = getSenderBlinkSettings();
    clearImageBlinkCycle();
    if (!settings.enabled || !imageDisplayElement) {
      return;
    }
    imageDisplayElement.style.visibility = "visible";
    imageBlinkVisible = true;
    scheduleImageBlinkToggle(false, settings.onSeconds * 1000, settings);
  }

  function applyLauncherPrefillFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("prefill") !== "1") {
        return;
      }

      const ownEmail = params.get("own_email") || "";
      const partnerEmail = params.get("partner_email") || "";
      const visitorDisplayName = params.get("visitor_display_name") || "";
      const latitude = Number(params.get("loc_latitude"));
      const longitude = Number(params.get("loc_longitude"));
      const accuracy = Number(params.get("loc_accuracy"));
      const timestamp = Number(params.get("loc_timestamp"));
      const blinkSenderImage = String(params.get("blink_sender_image") || "").trim();
      const blinkOnSeconds = String(params.get("blink_image_on_seconds") || "").trim();
      const blinkOffSeconds = String(params.get("blink_image_off_seconds") || "").trim();
      const includeConfidence = String(params.get("include_confidence") || "").trim();
      const includePositiveReinforcement = String(params.get("include_positive_reinforcement") || "").trim();
      const difficultyLevel = normalizeDifficultyLevel(params.get("difficulty_level") || currentPairDifficultyLevel || "1");

      if (!ownEmail && !partnerEmail) {
        return;
      }

      const settings = readSettings();
      settings.own_email = ownEmail || settings.own_email || "";
      settings.partner_email = partnerEmail || settings.partner_email || "";
      settings.visitor_display_name = visitorDisplayName || "";
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        settings.device_location = JSON.stringify({
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now()
        });
      }
      if (blinkSenderImage) {
        settings.blink_sender_image = blinkSenderImage === "1";
      }
      if (blinkOnSeconds) {
        settings.blink_image_on_seconds = String(normalizeBlinkSecondsValue(blinkOnSeconds, 0.35));
      }
      if (blinkOffSeconds) {
        settings.blink_image_off_seconds = String(normalizeBlinkSecondsValue(blinkOffSeconds, 0.8));
      }
      if (includeConfidence) {
        settings.include_confidence = includeConfidence === "1";
      }
      if (includePositiveReinforcement) {
        settings.include_positive_reinforcement = includePositiveReinforcement === "1";
      }
      settings.difficulty_level = difficultyLevel;
      runtimePrefillSettingsOverride = {
        own_email: settings.own_email,
        partner_email: settings.partner_email,
        visitor_display_name: settings.visitor_display_name,
        device_location: settings.device_location,
        blink_sender_image: settings.blink_sender_image,
        blink_image_on_seconds: settings.blink_image_on_seconds,
        blink_image_off_seconds: settings.blink_image_off_seconds,
        include_confidence: settings.include_confidence,
        include_positive_reinforcement: settings.include_positive_reinforcement,
        difficulty_level: settings.difficulty_level
      };
      writeSettings(settings);
      currentPairDifficultyLevel = difficultyLevel;

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
    window.location.href = buildLauncherReturnUrl({ open: "settings" });
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
    restartControl.innerHTML = 'Restart <span class="settings-restart-icon">&#8635;</span>';
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

  function getLauncherReturnRole() {
    if (isRemoteViewerMode || isRemoteDisplayMode) {
      return "remote-viewer";
    }
    return role === "sender" ? "sender" : "receiver";
  }

  function buildLauncherReturnUrl(options = {}) {
    const params = new URLSearchParams();
    params.set("v", runtimeBuildVersion);
    const requestedOpen = String(options.open || getLauncherReturnRole()).trim().toLowerCase();
    if (requestedOpen) {
      params.set("open", requestedOpen);
    }
    const shouldDirectOpen = options.directOpen === true || (
      options.directOpen !== false &&
      ["sender", "receiver", "remote-viewer"].includes(requestedOpen)
    );
    if (shouldDirectOpen) {
      params.set("direct_open", "1");
    }

    const settings = readSettings();
    const ownIdentifier = String((options.ownIdentifier ?? settings.own_email) || "").trim();
    const partnerIdentifier = String((options.partnerIdentifier ?? settings.partner_email) || "").trim();
    const internalIdentifier = ownIdentifier;
    if (ownIdentifier || partnerIdentifier) {
      params.set("prefill", "1");
      if (ownIdentifier) {
        params.set("own_email", ownIdentifier);
      }
      if (partnerIdentifier) {
        params.set("partner_email", partnerIdentifier);
      }
    }
    const visitorDisplayName = String(
      options.visitorDisplayName ?? (
        isInternalVisitorIdentifier(internalIdentifier)
          ? settings.visitor_display_name || getPreferredVisitorDisplayName(getLauncherReturnRole()) || ""
          : ""
      )
    ).trim();
    if (visitorDisplayName) {
      params.set("visitor_display_name", visitorDisplayName);
    }
    params.set("difficulty_level", normalizeDifficultyLevel(options.difficultyLevel || currentPairDifficultyLevel || settings.difficulty_level || "1"));
    params.set("v", launcherBuildVersion);

    return `telepathybeginner.html?${params.toString()}`;
  }

  function navigateToBeginnerFrontPage(options = {}) {
    const returnUrl = buildLauncherReturnUrl(options);
    appendGuidedReturnTrace("runtime_before_launcher_nav", {
      page_instance_id: runtimePageInstanceId,
      href: String(window.location.href || "").trim(),
      returnUrl,
      difficulty_level: normalizeDifficultyLevel(currentPairDifficultyLevel || readSettings().difficulty_level || "1")
    });
    void logDebugEvent("runtime_return_to_launcher", {
      role,
      page_instance_id: runtimePageInstanceId,
      open: String(options.open || getLauncherReturnRole()).trim().toLowerCase(),
      runtime_mode: runtimeMode,
      visitor_display_name: getPreferredVisitorDisplayName(getLauncherReturnRole()),
      difficulty_level: normalizeDifficultyLevel(currentPairDifficultyLevel || readSettings().difficulty_level || "1"),
      return_url: returnUrl
    });
    window.location.href = returnUrl;
  }

  function hasPendingLearningCenterLessonReturnTarget() {
    try {
      const raw = window.sessionStorage?.getItem(learningCenterLessonReturnKey);
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw);
      return !!(parsed && typeof parsed === "object" && String(parsed.lessonId || "").trim());
    } catch (error) {
      return false;
    }
  }

  function restorePendingLearningCenterLessonReturnTargetFromSnapshot(snapshot = null) {
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }
    const target = snapshot.lessonReturnTarget;
    const lessonId = String(target?.lessonId || "").trim();
    if (!lessonId) {
      return false;
    }
    try {
      window.sessionStorage?.setItem(learningCenterLessonReturnKey, JSON.stringify(target));
      return true;
    } catch (error) {
      return false;
    }
  }

  function appendGuidedReturnTrace(label, details = {}) {
    try {
      const raw = localStorage.getItem(guidedReturnTraceKey);
      const entries = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : [];
      entries.push({
        label: String(label || "").trim(),
        timestamp: new Date().toISOString(),
        pageInstanceId: runtimePageInstanceId,
        href: String(window.location.href || "").trim(),
        details: details && typeof details === "object" ? details : {}
      });
      while (entries.length > 40) {
        entries.shift();
      }
      localStorage.setItem(guidedReturnTraceKey, JSON.stringify(entries));
    } catch (error) {
      // Ignore local trace write failures.
    }
  }

  function buildGuidedReturnDifficultyDebugPayload(guidedReturnSnapshot = null) {
    const settings = readSettings();
    let launcherState = {};
    try {
      launcherState = JSON.parse(localStorage.getItem(launcherStorageKey) || "{}") || {};
    } catch (error) {
      launcherState = {};
    }

    let receiverSettings = {};
    let senderSettings = {};
    try {
      receiverSettings = JSON.parse(localStorage.getItem("cones-settings-v2-receiver") || "{}") || {};
    } catch (error) {
      receiverSettings = {};
    }
    try {
      senderSettings = JSON.parse(localStorage.getItem("cones-settings-v2-sender") || "{}") || {};
    } catch (error) {
      senderSettings = {};
    }

    const guidedReturnView = guidedReturnSnapshot?.returnView && typeof guidedReturnSnapshot.returnView === "object"
      ? guidedReturnSnapshot.returnView
      : {};
    const ownDisplayName = String(guidedReturnView.ownDisplayName || "").trim();
    const receiverRobotKey = ownDisplayName ? `receiver::${ownDisplayName.toLowerCase()}::robot` : "";
    const senderRobotKey = ownDisplayName ? `sender::${ownDisplayName.toLowerCase()}::robot` : "";
    const robotLevels = launcherState && typeof launcherState.robotSimulationDifficultyLevels === "object"
      ? launcherState.robotSimulationDifficultyLevels
      : {};

    return {
      runtimeRole: role,
      currentPairDifficultyLevel: normalizeDifficultyLevel(currentPairDifficultyLevel || "1"),
      runtimeSettingsDifficulty: normalizeDifficultyLevel(settings.difficulty_level || "1"),
      returnViewDifficulty: normalizeDifficultyLevel(guidedReturnView.difficultyLevel || "1"),
      returnViewOwnDisplayName: ownDisplayName,
      launcherDifficultyLevel: normalizeDifficultyLevel(launcherState?.difficultyLevel || "1"),
      launcherRoleDifficultySender: normalizeDifficultyLevel(launcherState?.roleDifficultyLevels?.sender || "1"),
      launcherRoleDifficultyReceiver: normalizeDifficultyLevel(launcherState?.roleDifficultyLevels?.receiver || "1"),
      launcherRobotDifficultyReceiver: receiverRobotKey ? normalizeDifficultyLevel(robotLevels?.[receiverRobotKey] || "") : "",
      launcherRobotDifficultySender: senderRobotKey ? normalizeDifficultyLevel(robotLevels?.[senderRobotKey] || "") : "",
      receiverSettingsDifficulty: normalizeDifficultyLevel(receiverSettings?.difficulty_level || "1"),
      senderSettingsDifficulty: normalizeDifficultyLevel(senderSettings?.difficulty_level || "1"),
      receiverRobotKey,
      senderRobotKey
    };
  }

  function showExitedState() {
    const guidedReturnSnapshot = isGuidedExperienceTour ? readGuidedReceiverTourReturnSnapshot() : null;
    clearGuidedReceiverTour();
    appExited = true;
    currentUiMode = "exited";
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
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
    void syncLauncherReturnStateFromRuntime("showExitedState", guidedReturnSnapshot).finally(() => {
      const guidedReturnView = guidedReturnSnapshot?.returnView && typeof guidedReturnSnapshot.returnView === "object"
        ? guidedReturnSnapshot.returnView
        : null;
      const restoredLessonReturnTarget = restorePendingLearningCenterLessonReturnTargetFromSnapshot(guidedReturnSnapshot);
      if (guidedReturnSnapshot) {
        const difficultyDebugPayload = buildGuidedReturnDifficultyDebugPayload(guidedReturnSnapshot);
        appendGuidedReturnTrace("runtime_guided_return_exit", difficultyDebugPayload);
        void logDebugEvent("guided_return_difficulty_debug", difficultyDebugPayload);
      }
      const shouldResumeLesson = !!guidedReturnSnapshot && (restoredLessonReturnTarget || hasPendingLearningCenterLessonReturnTarget());
      navigateToBeginnerFrontPage(shouldResumeLesson
        ? { open: "lesson-return" }
        : guidedReturnView
        ? {
            open: String(guidedReturnView.role || "receiver").trim().toLowerCase() || "receiver",
            directOpen: true,
            ownIdentifier: String(guidedReturnView.ownDisplayName || "").trim(),
            partnerIdentifier: String(guidedReturnView.partnerDisplayName || "").trim(),
            visitorDisplayName: String(guidedReturnView.visitorDisplayName || "").trim(),
            difficultyLevel: normalizeDifficultyLevel(guidedReturnView.difficultyLevel || "1")
          }
        : {});
      clearGuidedReceiverTourReturnSnapshot();
    });
  }

  function showTimeoutState(message) {
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
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
    senderTrialBackSuppressed = false;
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

  function showSessionLimitState(message) {
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    localRoundRunning = false;
    roundScheduled = false;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    receiverMirrorPhase = "idle";
    currentUiMode = "session-limit";
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    setPrompt(
      message || "This session has reached its image-pair limit. Press here to end the session.",
      true,
      "This session has reached its image-pair limit. Press here to end the session."
    );
    updateSettingsGearVisibility();
  }

  function showAuthorizationEndState(message) {
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    localRoundRunning = false;
    roundScheduled = false;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    receiverMirrorPhase = "idle";
    currentUiMode = "authorization-ended";
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    setPrompt(
      message || "This session is no longer authorized for the current difficulty. Press here to return to the home screen.",
      true,
      "This session is no longer authorized for the current difficulty. Press here to return to the home screen."
    );
    updateSettingsGearVisibility();
  }

  function showPartnerDisconnectState(message) {
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
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

  function showPartnerFinishedState(message) {
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
    receiverReady = false;
    awaitingReceiverDone = false;
    receiverChoiceOpen = false;
    localRoundRunning = false;
    roundScheduled = false;
    confidenceScreenOpen = false;
    instructionScreenOpen = false;
    receiverMirrorPhase = "idle";
    currentUiMode = "partner-finished";
    hideStage();
    hideChoiceGrid();
    hideConfidencePanel();
    hideInstructionPanel();
    hideDecisionPanel();
    hideMessagePanel();
    setPrompt(
      message || "The receiver has had enough. Press here to return.",
      true,
      "The receiver has had enough. Press here to return."
    );
    updateSettingsGearVisibility();
  }

  function handleAuthorizationFailure(message) {
    showAuthorizationEndState(message);
  }

  function showRoleConflictState(message) {
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
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
    if (returningToLauncher) {
      return;
    }
    returningToLauncher = true;
    senderHoldingResult = false;
    senderTrialBackSuppressed = false;
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
    currentUiMode = "returning-home";
    setPrompt("Returning to the Telepathy Beginner home screen...", false);
    countdownNumber.classList.add("settings-required-text");
    countdownNumber.style.fontSize = "clamp(1.25rem, 2.6vw, 2rem)";
    countdownNumber.style.lineHeight = "1.22";
    updateSettingsGearVisibility();
    window.setTimeout(() => {
      void syncLauncherReturnStateFromRuntime("showSettingsRequiredState").finally(() => {
        navigateToBeginnerFrontPage({
          open: getLauncherReturnRole(),
          directOpen: true
        });
      });
    }, 25);
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
    clearImageBlinkCycle();
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
    clearImageBlinkCycle();
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
    lastPositiveReinforcementRoundId = "";
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

  async function abortTrialAndReturnHome(options = {}) {
    clearRobotSimulationTimers();
    try {
      if (!isRobotSimulationMode) {
        const response = await api("abort_to_home");
        await appendTrialServerRecord(response?.state || {}, { aborted: true });
      } else if (activeRound?.id) {
        await appendTrialServerRecord(buildRobotSimulationPayload().state, { aborted: true });
      }
    } catch (error) {
      // Ignore abort sync failures and still return home locally.
    } finally {
      navigateToBeginnerFrontPage(options);
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

  function getLevelOneResultWord(layoutNumber) {
    const countChoice = getLevelOneCountChoiceFromLayoutNumber(layoutNumber);
    return countChoice === 1 ? "ONE" : "MANY";
  }

  function buildLevelOneFeedbackSummaryPanel(options = {}) {
    const {
      panelId,
      leftTitle,
      rightTitle,
      isReadOnly = false
    } = options;

    const panel = document.createElement("section");
    panel.className = `level-one-result-panel arrangement${isReadOnly ? " read-only" : ""}`;
    panel.id = panelId;

    const leftGroup = document.createElement("div");
    leftGroup.className = "level-one-result-group level-one-result-group-left";

    const leftLabel = document.createElement("p");
    leftLabel.className = "level-one-result-label";
    leftLabel.textContent = leftTitle;

    const actualWrap = document.createElement("div");
    actualWrap.className = "level-one-result-actual-wrap";

    leftGroup.append(leftLabel, actualWrap);

    const rightGroup = document.createElement("div");
    rightGroup.className = "level-one-result-group level-one-result-group-right";

    const rightLabel = document.createElement("p");
    rightLabel.className = "level-one-result-label";
    rightLabel.textContent = rightTitle;

    const responseText = document.createElement("div");
    responseText.className = "level-one-result-response";

    rightGroup.append(rightLabel, responseText);
    panel.append(leftGroup, rightGroup);

    return {
      panel,
      leftLabel,
      rightLabel,
      actualWrap,
      responseText
    };
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

  function applyLevelTwoChoiceSlot(card, layoutNumber) {
    const slotMap = {
      1: "center",
      6: "top-left",
      7: "top-right",
      8: "bottom-left",
      9: "bottom-right"
    };
    const slot = slotMap[layoutNumber] || "center";
    card.dataset.levelTwoSlot = slot;
    card.style.gridArea = slot;
  }

  function buildReceiverLevelOneFeedbackGrid() {
    if (role !== "receiver") {
      return;
    }

    const summary = buildLevelOneFeedbackSummaryPanel({
      panelId: "receiverLevelOneFeedbackGrid",
      leftTitle: "The Sender Sent:",
      rightTitle: "You Said:"
    });

    receiverLevelOneFeedbackPanel = summary.panel;
    receiverLevelOneFeedbackLeftLabel = summary.leftLabel;
    receiverLevelOneFeedbackRightLabel = summary.rightLabel;
    receiverLevelOneFeedbackActualWrap = summary.actualWrap;
    receiverLevelOneFeedbackResponseText = summary.responseText;
    arrangementNodes.set("receiver-level-one-feedback-grid", summary.panel);
    stage.appendChild(summary.panel);
  }

  function buildSenderLevelOneFeedbackGrid() {
    if (role !== "sender") {
      return;
    }

    const summary = buildLevelOneFeedbackSummaryPanel({
      panelId: "senderLevelOneFeedbackGrid",
      leftTitle: "The Sender Sent:",
      rightTitle: "The Receiver Said:",
      isReadOnly: true
    });

    senderLevelOneFeedbackPanel = summary.panel;
    senderLevelOneFeedbackLeftLabel = summary.leftLabel;
    senderLevelOneFeedbackRightLabel = summary.rightLabel;
    senderLevelOneFeedbackActualWrap = summary.actualWrap;
    senderLevelOneFeedbackResponseText = summary.responseText;
    arrangementNodes.set("sender-level-one-feedback-grid", summary.panel);
    stage.appendChild(summary.panel);
  }

  function buildReceiverLevelTwoChoiceGrid() {
    if (role !== "receiver") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "choice-grid level-two-choice-grid arrangement";
    grid.id = "receiverLevelTwoChoiceGrid";

    levelOneTargetLayoutNumbers.forEach((layoutNumber) => {
      const card = buildLevelSubsetChoiceCard(layoutNumber);
      applyLevelTwoChoiceSlot(card, layoutNumber);
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
    grid.className = "choice-grid level-two-choice-grid arrangement read-only";
    grid.id = "senderLevelTwoChoiceGrid";

    levelOneTargetLayoutNumbers.forEach((layoutNumber) => {
      const card = buildLevelSubsetChoiceCard(layoutNumber, true);
      applyLevelTwoChoiceSlot(card, layoutNumber);
      senderLevelTwoChoiceNodes.set(getArrangementCode(layoutNumber), card);
      grid.appendChild(card);
    });

    arrangementNodes.set("sender-level-two-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildLevelFourChoiceCard(choiceIndex, readOnly = false) {
    const card = document.createElement("button");
    card.className = "image-choice-card";
    card.type = "button";
    card.setAttribute("data-layout-number", String(choiceIndex));
    card.setAttribute("data-arrangement-code", `image-choice-${choiceIndex}`);
    card.setAttribute("aria-label", `Choose image ${choiceIndex}`);
    if (readOnly) {
      card.disabled = true;
    }

    const image = document.createElement("img");
    image.className = "image-choice-thumb";
    image.alt = "";
    image.loading = "eager";
    image.decoding = "sync";

    card.appendChild(image);
    return card;
  }

  function setLevelFourChoiceImages(nodesMap, choiceUrls) {
    nodesMap.forEach((node, choiceIndex) => {
      const image = node.querySelector(".image-choice-thumb");
      if (!(image instanceof HTMLImageElement)) {
        return;
      }
      const nextUrl = String(choiceUrls?.[choiceIndex] || "").trim();
      image.src = nextUrl;
      image.alt = nextUrl ? `Image choice ${choiceIndex}` : "";
    });
  }

  function buildReceiverLevelFourChoiceGrid() {
    if (role !== "receiver") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "image-pair-grid arrangement";
    grid.id = "receiverLevelFourChoiceGrid";

    [1, 2].forEach((choiceIndex) => {
      const card = buildLevelFourChoiceCard(choiceIndex);
      card.addEventListener("click", () => {
        void handleReceiverChoice(choiceIndex);
      });
      levelFourChoiceNodes.set(choiceIndex, card);
      grid.appendChild(card);
    });

    arrangementNodes.set("receiver-level-four-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildSenderLevelFourChoiceGrid() {
    if (role !== "sender") {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "image-pair-grid arrangement read-only";
    grid.id = "senderLevelFourChoiceGrid";

    [1, 2].forEach((choiceIndex) => {
      const card = buildLevelFourChoiceCard(choiceIndex, true);
      senderLevelFourChoiceNodes.set(choiceIndex, card);
      grid.appendChild(card);
    });

    arrangementNodes.set("sender-level-four-choice-grid", grid);
    stage.appendChild(grid);
  }

  function buildImageDisplayPanel() {
    const panel = document.createElement("section");
    panel.className = "image-display-panel arrangement";
    panel.id = `${role}ImageDisplayPanel`;

    const image = document.createElement("img");
    image.className = "image-display-asset";
    image.alt = "Target image";
    image.loading = "eager";
    image.decoding = "async";

    const caption = document.createElement("p");
    caption.className = "image-display-caption";
    caption.textContent = "";

    panel.append(image, caption);
    imageDisplayPanel = panel;
    imageDisplayElement = image;
    imageDisplayCaption = caption;
    arrangementNodes.set(`${role}-image-display-panel`, panel);
    stage.appendChild(panel);
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

  function showImageDisplay(imageUrl, captionText = "") {
    if (!imageDisplayPanel || !imageDisplayElement || !imageDisplayCaption) {
      return;
    }

    arrangementNodes.forEach((node) => {
      node.classList.remove("visible");
    });
    imageDisplayElement.src = String(imageUrl || "").trim();
    imageDisplayElement.style.visibility = "visible";
    imageDisplayCaption.textContent = captionText;
    imageDisplayPanel.classList.add("visible");
    startImageBlinkCycle();
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

    if (isLevelFourDifficulty()) {
      return role === "receiver" ? "receiver-level-four-choice-grid" : "sender-level-four-choice-grid";
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

    if (isLevelFourDifficulty()) {
      return role === "receiver" ? levelFourChoiceNodes : senderLevelFourChoiceNodes;
    }

    return role === "receiver" ? choiceNodes : senderChoiceNodes;
  }

  function showChoiceGrid() {
    const grid = arrangementNodes.get(getChoiceGridKey());

    if (!grid) {
      return;
    }

    if (isLevelFourDifficulty()) {
      const choiceUrls = getLevelFourChoiceUrls();
      setLevelFourChoiceImages(getActiveSelectionNodesMap(), choiceUrls);
    }

    receiverChoiceOpen = true;
    updateChoiceGridLayout();
    showStage();
    grid.classList.add("visible");
    updateSettingsGearVisibility();
    if (receiverMirrorPhase === "choices") {
      notifyGuidedReceiverTourPhase("choices");
    }
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

  function setFeedbackSummaryResponse(responseNode, options = {}) {
    if (!responseNode) {
      return;
    }

    const mode = options.mode === "card" ? "card" : "word";
    const text = mode === "word" ? String(options.text || "") : "";
    responseNode.classList.toggle("visual-response", mode === "card");

    if (mode === "card") {
      const layoutNumber = Number(options.layoutNumber);
      const card = buildLevelOneFeedbackCard(layoutNumber);
      responseNode.replaceChildren(card);
      return;
    }

    responseNode.replaceChildren();
    responseNode.textContent = text;
  }

  function renderArrangementFeedbackSummary(actualLayoutNumber, selectedLayoutNumbers, isSenderMirror = false, options = {}) {
    const leftLabel = isSenderMirror ? senderLevelOneFeedbackLeftLabel : receiverLevelOneFeedbackLeftLabel;
    const rightLabel = isSenderMirror ? senderLevelOneFeedbackRightLabel : receiverLevelOneFeedbackRightLabel;
    const actualWrap = isSenderMirror ? senderLevelOneFeedbackActualWrap : receiverLevelOneFeedbackActualWrap;
    const responseText = isSenderMirror ? senderLevelOneFeedbackResponseText : receiverLevelOneFeedbackResponseText;

    if (!actualWrap || !responseText || !leftLabel || !rightLabel) {
      return;
    }

    if (isSenderMirror) {
      leftLabel.textContent = "The Sender Sent:";
      rightLabel.textContent = isRobotReceiverMode ? "The Robot Receiver Said:" : "The Receiver Said:";
    } else {
      leftLabel.textContent = isRobotSenderMode ? "The Robot Sender Sent:" : "The Sender Sent:";
      rightLabel.textContent = "You Said:";
    }

    const actualCard = buildLevelOneFeedbackCard(actualLayoutNumber);
    actualCard.classList.add("actual");
    actualWrap.replaceChildren(actualCard);

    const selectedLayoutNumber = Array.isArray(selectedLayoutNumbers) && selectedLayoutNumbers.length
      ? Number(selectedLayoutNumbers[0])
      : actualLayoutNumber;

    if (options.responseMode === "card") {
      setFeedbackSummaryResponse(responseText, {
        mode: "card",
        layoutNumber: selectedLayoutNumber
      });
      return;
    }

    setFeedbackSummaryResponse(responseText, {
      mode: "word",
      text: getLevelOneResultWord(selectedLayoutNumber)
    });
  }

  function renderLevelOneFeedbackSummary(actualLayoutNumber, selectedLayoutNumbers, isSenderMirror = false) {
    renderArrangementFeedbackSummary(actualLayoutNumber, selectedLayoutNumbers, isSenderMirror, {
      responseMode: "word"
    });
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
    clearStageVisibility();
    hideChoiceGrid();
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
    messagePanel.classList.toggle(
      "post-round-result",
      /can receive another image|has had enough/i.test(String(text || ""))
    );

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
    messagePanel.classList.remove("post-round-result");
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
      "receiver-level-four-choice-grid",
      "sender-level-four-choice-grid"
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

    const levelFourGrid = arrangementNodes.get("receiver-level-four-choice-grid");
    levelFourGrid?.classList.remove("results-locked");
    levelFourChoiceNodes.forEach((node) => {
      node.disabled = false;
      node.style.pointerEvents = "";
      node.removeAttribute("tabindex");
    });
    resetChoiceNodes(levelFourChoiceNodes);
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
    if (String(round?.stimulus_kind || "") === "image_pair") {
      return round?.guess_layout_number !== null;
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
    const isImagePairRound = String(round?.stimulus_kind || "") === "image_pair";
    const sentImage = isImagePairRound ? String(round?.image_sent || "").trim() : "";
    const imageChoiceA = isImagePairRound ? String(round?.image_choice_a || "").trim() : "";
    const imageChoiceB = isImagePairRound ? String(round?.image_choice_b || "").trim() : "";
    const imageChoiceIndex = Number(round?.guess_layout_number);
    const receiverImageChoice =
      isImagePairRound && Number.isInteger(imageChoiceIndex)
        ? (imageChoiceIndex === 1 ? imageChoiceA : (imageChoiceIndex === 2 ? imageChoiceB : ""))
        : "";

    return [
      exportSchemaVersion,
      round?.id || "",
      receiverProfile.name || "",
      senderProfile.name || "",
      localDate,
      localTime,
      isImagePairRound ? "" : (round?.layout_number ?? ""),
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
      syncWorst,
      isImagePairRound ? (round?.image_pair_id ?? "") : "",
      sentImage,
      imageChoiceA,
      imageChoiceB,
      receiverImageChoice
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
      "sync worst",
      "image pair id",
      "sent image",
      "image choice a",
      "image choice b",
      "rx image choice"
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
    if (role !== "receiver" && !(isRobotReceiverMode && role === "sender")) {
      return;
    }

    if (isGuidedReceiverTour) {
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
        trial_record: trialRecord,
        simulation_mode: isRobotSimulationMode ? "robot" : ""
      });
      const appendResult = response?.trial_record_append || null;

      if (appendResult?.appended || appendResult?.duplicate) {
        if (isRobotSimulationMode) {
          const visitorDisplayName = getPreferredVisitorDisplayName(role);
          if (visitorDisplayName) {
            lockVisitorLauncherName(visitorDisplayName);
          }
        }
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
    return ["1", "2", "3", "4", "5"].includes(String(level || "")) ? String(level) : "1";
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
    setPrompt(getReceiverWaitingStartPrompt(), false);
    updateSettingsGearVisibility();
  }

  async function completeRound(layoutNumber, arrangementCode) {
    if (isRobotReceiverMode) {
      if (activeRound) {
        activeRound.layout_number = layoutNumber;
        activeRound.arrangement_code = arrangementCode;
        activeRound.last_activity_ms = estimatedServerNowMs();
      }
      runRobotReceiverSimulationAfterRound();
      return;
    }

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

  async function ensureReinforcementAudioLoaded() {
    if (reinforcementAudioBuffer || reinforcementAudioLoadPromise) {
      return reinforcementAudioLoadPromise || reinforcementAudioBuffer;
    }

    if (!audioContext) {
      return null;
    }

    reinforcementAudioLoadPromise = (async () => {
      try {
        const response = await fetch(`tada.wav?v=${encodeURIComponent(runtimeBuildVersion)}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Unable to load reinforcement audio (${response.status}).`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        reinforcementAudioBuffer = decoded;
        return decoded;
      } catch (_error) {
        reinforcementAudioBuffer = null;
        return null;
      } finally {
        reinforcementAudioLoadPromise = null;
      }
    })();

    return reinforcementAudioLoadPromise;
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

  async function playPositiveReinforcementSound() {
    if (!getPositiveReinforcementEnabled()) {
      return;
    }

    try {
      await ensureReceiverAudioUnlocked();
      if (audioContext) {
        const buffer = reinforcementAudioBuffer || await ensureReinforcementAudioLoaded();
        if (buffer) {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start();
          return;
        }
      }
    } catch (_error) {
      // Fall through to audio element fallback.
    }

    try {
      if (!reinforcementAudioElement) {
        reinforcementAudioElement = new Audio(`tada.wav?v=${encodeURIComponent(runtimeBuildVersion)}`);
        reinforcementAudioElement.preload = "auto";
      }
      reinforcementAudioElement.currentTime = 0;
      await reinforcementAudioElement.play();
    } catch (_error) {
      // Ignore reinforcement playback failures.
    }
  }

  function showReceiverDoneButton() {
    awaitingReceiverDone = true;
    currentUiMode = "receiver-done";
    receiverPressedDoneEarly = false;
    const prompt = getReceiverDonePrompt();
    setPrompt(prompt, true, prompt);
    updateSettingsGearVisibility();
    notifyGuidedReceiverTourPhase("done");
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
    countdownBox.setAttribute("aria-label", getReceiverDonePrompt());
    receiverPressedDoneEarly = false;
    playReceiverBeep();
    updateSettingsGearVisibility();

    if (doneTimeoutHandle !== null) {
      window.clearTimeout(doneTimeoutHandle);
    }

    notifyGuidedReceiverTourPhase("receiving");
    if (
      isGuidedReceiverTour &&
      (guidedReceiverTourState?.step?.id === "receiving-intro" ||
       guidedReceiverTourState?.step?.id === "receiving-observe")
    ) {
      doneTimeoutHandle = null;
      return;
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

  function hideSenderConfidenceMirror() {
    senderConfidencePanel?.classList.remove("visible");
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

    if (isLevelFourDifficulty()) {
      const actualLayoutNumber = revealActual
        ? (Number(activeRound?.image_sent_index ?? 0) || null)
        : null;
      const choiceUrls = getLevelFourChoiceUrls(activeRound) || getLevelFourChoiceUrls();
      setLevelFourChoiceImages(senderLevelFourChoiceNodes, choiceUrls);
      renderChoiceSelection(senderLevelFourChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
      clearStageVisibility();
      showStage();
      arrangementNodes.get("sender-level-four-choice-grid")?.classList.add("visible");
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
    renderLevelOneFeedbackSummary(actualLayoutNumber, selectedLayoutNumbers, true);
    showLevelOneFeedbackGrid(true);
  }

  function showSenderArrangementFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers) {
    renderArrangementFeedbackSummary(actualLayoutNumber, selectedLayoutNumbers, true, {
      responseMode: "card"
    });
    showLevelOneFeedbackGrid(true);
  }

  function renderSenderPostRoundResult(remoteState) {
    if (role !== "sender") {
      return;
    }

    const receiverView = remoteState.receiver_view || {};
    const selectedLayoutNumbers = Array.isArray(receiverView.selected_layout_numbers)
      ? receiverView.selected_layout_numbers.filter((value) => Number.isInteger(Number(value))).map(Number)
      : [];
    const actualArrangementCode =
      getResolvedActualArrangementCode(remoteState.round) ||
      getResolvedActualArrangementCode(activeRound);

    if (!selectedLayoutNumbers.length || !actualArrangementCode) {
      return;
    }

    if (isLevelOneDifficulty()) {
      const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
      showSenderLevelOneFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers);
      return;
    }

    if (isLevelFourDifficulty()) {
      const actualLayoutNumber = Number(remoteState.round?.image_sent_index ?? activeRound?.image_sent_index ?? 0) || null;
      setLevelFourChoiceImages(senderLevelFourChoiceNodes, getLevelFourChoiceUrls(remoteState.round) || getLevelFourChoiceUrls(activeRound));
      renderChoiceSelection(senderLevelFourChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
      clearStageVisibility();
      showStage();
      arrangementNodes.get("sender-level-four-choice-grid")?.classList.add("visible");
      return;
    }

    const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
    showSenderArrangementFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers);
  }

  function getActualReceiverResultLayoutNumber(actualArrangementCode) {
    if (isLevelFourDifficulty()) {
      return Number(activeRound?.image_sent_index ?? 0) || null;
    }
    if (isLevelOneDifficulty()) {
      return getLevelOneCountChoiceFromLayoutNumber(getLayoutNumberFromArrangementCode(actualArrangementCode));
    }
    return getLayoutNumberFromArrangementCode(actualArrangementCode);
  }

  function maybePlayPositiveReinforcement(actualArrangementCode, selectedLayoutNumbers) {
    if (role !== "receiver" || !getPositiveReinforcementEnabled()) {
      return;
    }

    const roundId = String(activeRound?.id || "").trim();
    if (roundId && roundId === lastPositiveReinforcementRoundId) {
      return;
    }

    const actualLayoutNumber = getActualReceiverResultLayoutNumber(actualArrangementCode);
    if (!Number.isInteger(Number(actualLayoutNumber))) {
      return;
    }

    const normalizedSelected = Array.isArray(selectedLayoutNumbers)
      ? selectedLayoutNumbers.filter((value) => Number.isInteger(Number(value))).map(Number)
      : [];
    if (!normalizedSelected.includes(Number(actualLayoutNumber))) {
      return;
    }

    if (roundId) {
      lastPositiveReinforcementRoundId = roundId;
    }
    void playPositiveReinforcementSound();
  }

  function maybePlayPositiveReinforcementAtSelection(selectedLayoutNumbers) {
    if (getIncludeConfidenceEnabled()) {
      return;
    }

    const actualArrangementCode = getResolvedActualArrangementCode(activeRound);
    maybePlayPositiveReinforcement(actualArrangementCode, selectedLayoutNumbers);
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
    const holdConfidence = lockedAt > 0 && (serverNowMs - lockedAt) < 50;
    const includeConfidence = getIncludeConfidenceEnabled();

    if (includeConfidence && (phase === "confidence" || holdConfidence)) {
      showSenderConfidenceMirror(confidenceValueNumber);
      return true;
    }

    hideSenderConfidenceMirror();

    if (phase === "choices") {
      if (isLevelFourDifficulty()) {
        const actualLayoutNumber = Number(remoteState.round?.image_sent_index ?? activeRound?.image_sent_index ?? 0) || null;
        setLevelFourChoiceImages(senderLevelFourChoiceNodes, getLevelFourChoiceUrls(remoteState.round) || getLevelFourChoiceUrls(activeRound));
        renderChoiceSelection(senderLevelFourChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
        clearStageVisibility();
        showStage();
        arrangementNodes.get("sender-level-four-choice-grid")?.classList.add("visible");
        if (selectedLayoutNumbers.length === 0) {
          showMessagePanel("The receiver is deciding the best pick.", []);
        } else {
          hideMessagePanel();
        }
        return true;
      }
      showSenderChoiceMirror(actualArrangementCode, selectedLayoutNumbers, true);
      showMessagePanel("The receiver is deciding the best pick.", []);
      return true;
    }

    if (phase === "results" || phase === "confidence-final") {
      if (isLevelFourDifficulty()) {
        const actualLayoutNumber = Number(remoteState.round?.image_sent_index ?? activeRound?.image_sent_index ?? 0) || null;
        setLevelFourChoiceImages(senderLevelFourChoiceNodes, getLevelFourChoiceUrls(remoteState.round) || getLevelFourChoiceUrls(activeRound));
        renderChoiceSelection(senderLevelFourChoiceNodes, selectedLayoutNumbers, actualLayoutNumber);
        clearStageVisibility();
        showStage();
        arrangementNodes.get("sender-level-four-choice-grid")?.classList.add("visible");
        hideMessagePanel();
        return true;
      }
      if (isLevelOneDifficulty()) {
        const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
        showSenderLevelOneFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers);
        hideMessagePanel();
        return true;
      }

      const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
      showSenderArrangementFeedbackMirror(actualLayoutNumber, selectedLayoutNumbers);
      hideMessagePanel();
      return true;
    }

    return false;
  }

  function markReceiverResult(actualArrangementCode, selectedArrangementCodes) {
    maybePlayPositiveReinforcement(actualArrangementCode, pendingGuessLayoutNumbers);

    if (isLevelFourDifficulty()) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      showChoiceGrid();
      const grid = arrangementNodes.get("receiver-level-four-choice-grid");
      grid?.classList.add("results-locked");
      levelFourChoiceNodes.forEach((node) => {
        node.disabled = true;
        node.style.pointerEvents = "none";
        node.setAttribute("tabindex", "-1");
        node.blur();
      });
      const actualLayoutNumber = Number(activeRound?.image_sent_index ?? 0) || null;
      setLevelFourChoiceImages(levelFourChoiceNodes, getLevelFourChoiceUrls(activeRound));
      renderChoiceSelection(levelFourChoiceNodes, pendingGuessLayoutNumbers, actualLayoutNumber);
      if (!postRoundChoiceSubmitted) {
        showDecisionPanel();
      }
      notifyGuidedReceiverTourPhase("result");
      return;
    }

    if (isLevelOneDifficulty()) {
      const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
      renderLevelOneFeedbackSummary(actualLayoutNumber, pendingGuessLayoutNumbers, false);
      showLevelOneFeedbackGrid(false);
      if (!postRoundChoiceSubmitted) {
        showDecisionPanel();
      }
      notifyGuidedReceiverTourPhase("result");
      return;
    }

    if (isLevelTwoDifficulty()) {
      const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
      renderArrangementFeedbackSummary(actualLayoutNumber, pendingGuessLayoutNumbers, false, {
        responseMode: "card"
      });
      showLevelOneFeedbackGrid(false);
      if (!postRoundChoiceSubmitted) {
        showDecisionPanel();
      }
      notifyGuidedReceiverTourPhase("result");
      return;
    }

    const actualLayoutNumber = getLayoutNumberFromArrangementCode(actualArrangementCode);
    renderArrangementFeedbackSummary(actualLayoutNumber, pendingGuessLayoutNumbers, false, {
      responseMode: "card"
    });
    showLevelOneFeedbackGrid(false);
    if (!postRoundChoiceSubmitted) {
      showDecisionPanel();
    }
    notifyGuidedReceiverTourPhase("result");
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
    if (guidedReceiverTourState?.step?.id === "result") {
      if (choice === "another") {
        clearGuidedReceiverTourTargetClasses();
        guidedReceiverTourState.step = null;
        guidedReceiverTourState.pendingPhase = null;
        guidedReceiverTourState.phase = "waiting-online";
        guidedReceiverTourState.waitingOnlineAcknowledged = false;
        guidedReceiverTourState.manualBalloonPosition = null;
        guidedTourOverlay?.classList.add("hidden");
        setGuidedReceiverTourHint("");
      } else {
        clearGuidedReceiverTour();
      }
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

    if (isRobotSimulationMode) {
      const state = ensureRobotSimulationState();
      const automatedSenderChoice = role === "receiver" && isRobotSenderMode
        ? choice
        : String(state.post_round?.sender_choice || "");
      state.post_round = {
        receiver_choice: role === "receiver" ? choice : String(state.post_round?.receiver_choice || ""),
        sender_choice: role === "sender" ? choice : automatedSenderChoice,
        resolved: null,
        updated_ms: estimatedServerNowMs()
      };
      scheduleRobotSimulationStep(() => {
        state.post_round = {
          ...state.post_round,
          resolved: choice === "another" ? "continue" : "end",
          updated_ms: estimatedServerNowMs()
        };
        applyRemoteState(buildRobotSimulationPayload());
      }, randomInt(450, 1100));
      applyRemoteState(buildRobotSimulationPayload());
      return;
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
    if (mode === "continue") {
      senderTrialBackSuppressed = false;
    }

    if (isRobotSimulationMode) {
      currentPairDifficultyLevel = getRequestedDifficultyLevel();
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
      currentUiMode = "";
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
      resetRobotSimulationRoundState();
      activeRound = null;
      if (mode === "continue") {
        if (isRobotSenderMode) {
          receiverReady = true;
          showReceiverReadyState();
          void scheduleRobotSenderRoundStart();
        } else {
          applyRemoteState(buildRobotSimulationPayload());
        }
      }
      return;
    }

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
      currentUiMode = "";
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
        if (isGuidedReceiverTour) {
          void clearPostRound("continue");
          return true;
        }
        schedulePostRoundClear("continue");
      } else if (postRound.resolved === "end") {
        void clearPostRound("end", { preserveExited: true })
          .catch(() => null)
          .finally(() => {
            showExitedState();
          });
      }
      return true;
    }

    hideDecisionPanel();
    renderSenderPostRoundResult(remoteState);

    if (!postRound.receiver_choice) {
      hideMessagePanel();
      return false;
    }

    if (isGuidedSenderTour) {
      notifyGuidedReceiverTourPhase("result");
    }

    if (postRound.receiver_choice === "enough") {
      if (isRemoteDisplayMode && !postRound.sender_choice) {
        void submitPostRoundChoice("enough");
      }
      if (postRound.resolved === "end") {
        showPartnerFinishedState("The receiver has had enough. Press here to return.");
        return true;
      }

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
      return true;
    }

    if (isRemoteDisplayMode && !postRound.sender_choice) {
      void submitPostRoundChoice("another");
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
    receiverSelectionLimit = (isLevelOneDifficulty() || isLevelFourDifficulty()) ? 1 : selectionLimit;
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
    dismissGuidedReceiverTourLiveStep("choices");

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
    maybePlayPositiveReinforcementAtSelection(pendingGuessLayoutNumbers);
    receiverTransitioningScreen = true;
    const transitionDelayMs = receiverSelectionLimit <= 1
      ? (isLevelOneDifficulty() ? 2000 : 3500)
      : 1000;
    window.setTimeout(() => {
      hideChoiceGrid();
      hideMessagePanel();
      if (getIncludeConfidenceEnabled()) {
        showConfidencePanel();
      } else {
        pendingConfidenceValue = null;
        receiverConfidenceLockedAtMs = 0;
        hideConfidencePanel();
        hideInstructionPanel();
        void submitReceiverGuessAndReveal();
      }
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

      if (isRobotSenderMode) {
        activeRound.guess_layout_number = guessLayoutNumber;
        activeRound.second_guess_layout_number = secondGuessLayoutNumber;
        activeRound.guess_confidence = confidence;
        activeRound.done_reaction_ms = doneReactionMs;
        activeRound.guess_submitted_ms = estimatedServerNowMs();
        activeRound.completed_server_ms = activeRound.guess_submitted_ms;
        activeRound.last_activity_ms = activeRound.guess_submitted_ms;
        const actualArrangementCode = getResolvedActualArrangementCode(activeRound);
        const isImagePairRound = String(activeRound?.stimulus_kind || "") === "image_pair";
        hideConfidencePanel();
        hideInstructionPanel();
        receiverMirrorPhase = "results";
        postRoundChoiceSubmitted = false;
        markReceiverResult(actualArrangementCode, selectedArrangementCodes);
        void appendTrialServerRecord(buildRobotSimulationPayload().state);
        void pushReceiverViewState();
        void triggerImmediateSync();
        return;
      }

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
      const isImagePairRound = String(response?.round?.stimulus_kind || activeRound?.stimulus_kind || "") === "image_pair";
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

      if (actualArrangementCode || isImagePairRound) {
        void logDebugEvent("receiver_resolved_actual", {
          round_id: activeRound?.id ?? "",
          actual_arrangement_code: actualArrangementCode,
          actual_layout_number: activeRound?.layout_number ?? "",
          actual_image_sent_index: activeRound?.image_sent_index ?? "",
          actual_image_sent: activeRound?.image_sent ?? "",
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
    if (String(round?.stimulus_kind || "") === "image_pair") {
      void preloadLevelFourRoundAssets(round);
    }
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

        hideCountdown();
        showStage();
        senderHoldingResult = true;
        updateSettingsGearVisibility();

        if (isLevelFourDifficulty() && String(round?.stimulus_kind || "") === "image_pair") {
          const imageUrl = getLevelFourSentImageUrl(round);
          void logDebugEvent("sender_picked_level_four_target", {
            round_id: activeRound?.id ?? "",
            image_pair_id: round?.image_pair_id ?? "",
            image_sent_index: round?.image_sent_index ?? "",
            image_sent: imageUrl
          });
          void preloadLevelFourRoundAssets(round).finally(() => {
            showImageDisplay(imageUrl);
            if (isGuidedSenderTour) {
              notifyGuidedReceiverTourPhase("sending");
            }
          });
          if (activeRound) {
            activeRound.stimulus_kind = "image_pair";
            activeRound.image_pair_id = round.image_pair_id;
            activeRound.image_choice_a = round.image_choice_a;
            activeRound.image_choice_b = round.image_choice_b;
            activeRound.image_sent_index = round.image_sent_index;
            activeRound.image_sent = round.image_sent;
          }
          completeRound(null, "");
        } else {
          const layoutNumber = pickArrangementNumber();
          const arrangementCode = getArrangementCode(layoutNumber);
          void logDebugEvent("sender_picked_target", {
            round_id: activeRound?.id ?? "",
            layout_number: layoutNumber,
            arrangement_code: arrangementCode
          });
          showArrangement(layoutNumber);
          if (isGuidedSenderTour) {
            notifyGuidedReceiverTourPhase("sending");
          }
          if (activeRound) {
            activeRound.layout_number = layoutNumber;
            activeRound.arrangement_code = arrangementCode;
          }
          completeRound(layoutNumber, arrangementCode);
        }
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
    senderTrialBackSuppressed = true;
    senderHoldingResult = false;
    countdownBox.classList.remove("interactive");
    countdownNumber.textContent = "";
    countdownNumber.classList.remove("prompt");
    updateSettingsGearVisibility();

    const startServerMs = estimatedServerNowMs();

    if (isRobotReceiverMode) {
      try {
        const state = ensureRobotSimulationState();
        const round = await createRobotRound(startServerMs);
        state.round = round;
        state.post_round = null;
        state.receiver_view.phase = "idle";
        scheduleSynchronizedRound(round);
      } catch (error) {
        localRoundRunning = false;
        const prompt = "Unable to start robot simulation right now. Please try again.";
        setPrompt(prompt, true, "Press when ready to send");
        currentUiMode = "sender-ready";
      }
      return;
    }

    try {
      const response = await api("start_round", {
        start_server_ms: startServerMs
      });

      if (response.round) {
        scheduleSynchronizedRound(response.round);
      } else {
        applyRemoteState(response);
      }
    } catch (error) {
      localRoundRunning = false;
      const prompt = isRemoteDisplayMode ? "Unable to start display. Please try again." : "Unable to start. Please try again.";
      setPrompt(prompt, !isRemoteDisplayMode, isRemoteDisplayMode ? prompt : "Press when ready to send");
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

    if (currentUiMode === "session-limit") {
      void api("abort_to_home", { abort_reason: "session-limit" })
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

    if (currentUiMode === "partner-finished") {
      void api("clear_partner_finished_notice")
        .catch(() => null)
        .finally(() => {
          navigateToBeginnerFrontPage();
        });
      return;
    }

    if (currentUiMode === "authorization-ended") {
      navigateToBeginnerFrontPage();
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
      dismissGuidedReceiverTourLiveStep("ready");
      receiverReady = true;
      showReceiverReadyState();
      void ensureReceiverAudioUnlocked();
      if (isRobotSenderMode) {
        void scheduleRobotSenderRoundStart();
      }
      return;
    }

    if (
      role === "receiver" &&
      awaitingReceiverDone &&
      (currentUiMode === "receiver-done" || currentUiMode === "receiver-reveal")
    ) {
      dismissGuidedReceiverTourLiveStep("done");
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
    currentUiModeEnteredAtMs = Date.now();
    hideStage();

    if (mode === "sender-waiting-online") {
      setPrompt(getWaitingOnlinePrompt(), false);
      updateSettingsGearVisibility();
      if (isGuidedSenderTour) {
        notifyGuidedReceiverTourPhase("waiting-online");
      }
      return;
    }

    if (mode === "sender-waiting-ready") {
      setPrompt(getWaitingReadyPrompt(), false);
      updateSettingsGearVisibility();
      return;
    }

    if (mode === "sender-ready") {
      const prompt = getSenderReadyPrompt();
      setPrompt(prompt, !isRemoteDisplayMode, prompt);
      updateSettingsGearVisibility();
      if (isGuidedSenderTour) {
        notifyGuidedReceiverTourPhase("ready");
      }
      return;
    }

    if (mode === "receiver-waiting-online") {
      setPrompt(getWaitingOnlinePrompt(), false);
      updateSettingsGearVisibility();
      notifyGuidedReceiverTourPhase("waiting-online");
      return;
    }

    if (mode === "receiver-ready") {
      if (isGuidedReceiverTour && guidedReceiverTourState && !guidedReceiverTourState.waitingOnlineAcknowledged) {
        setPrompt(getWaitingOnlinePrompt(), false);
        updateSettingsGearVisibility();
        notifyGuidedReceiverTourPhase("ready");
        return;
      }
      const prompt = getReceiverPressReadyPrompt();
      setPrompt(prompt, true, prompt);
      updateSettingsGearVisibility();
      notifyGuidedReceiverTourPhase("ready");
      return;
    }

    if (mode === "receiver-done") {
      showReceiverDoneButton();
    }
  }

  function shouldHoldWaitingOnlinePrompt() {
    if (currentUiMode !== "sender-waiting-online" && currentUiMode !== "receiver-waiting-online") {
      return false;
    }

    return (Date.now() - currentUiModeEnteredAtMs) < minimumWaitingOnlineDisplayMs;
  }

  function normalizeRound(round, serverNowMs) {
    if (!round || !round.id) {
      return null;
    }

    if (round.completed_server_ms) {
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
    if (isRobotSenderMode) {
      remoteState.sender_online = true;
    }
    if (isRobotReceiverMode) {
      remoteState.receiver_online = true;
    }

    if (remoteState.authorization_notice) {
      void logDebugEvent("authorization_notice_seen", {
        role,
        current_ui_mode: currentUiMode,
        message: remoteState.authorization_notice.message || ""
      });
      handleAuthorizationFailure(remoteState.authorization_notice.message);
      return;
    }

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

    const partnerFinishedNotice = remoteState.partner_finished_notice || null;
    if (
      partnerFinishedNotice &&
      (!partnerFinishedNotice.target_role || String(partnerFinishedNotice.target_role) === role)
    ) {
      showPartnerFinishedState(partnerFinishedNotice.message);
      return;
    }

    if (remoteState.session_limit_notice) {
      showSessionLimitState(remoteState.session_limit_notice.message);
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

    if (currentUiMode === "partner-finished") {
      return;
    }

    const serverNowMs = payload.server_now_ms || estimatedServerNowMs();
    const normalizedRound = normalizeRound(remoteState.round, serverNowMs);

    if (remoteState.round && remoteState.round.id) {
      activeRound = remoteState.round;
      if (String(remoteState.round?.stimulus_kind || "") === "image_pair") {
        void preloadLevelFourRoundAssets(remoteState.round);
      }
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
        if (!isRobotSimulationMode && wasRunInProgress(remoteState)) {
          void appendTrialServerRecord(remoteState, { aborted: true });
          showPartnerDisconnectState("Receiver disconnect - run over");
          return;
        }
        setUiMode("sender-waiting-online");
        return;
      }

      if (shouldHoldWaitingOnlinePrompt()) {
        return;
      }

      if (!remoteState.receiver_ready) {
        setUiMode("sender-waiting-ready");
        return;
      }

      setUiMode("sender-ready");
      if (isRemoteDisplayMode && !localRoundRunning && !roundScheduled && !senderHoldingResult) {
        void startSenderRound();
      }
      return;
    }

    if (!remoteState.sender_online) {
      if (!isRobotSimulationMode && wasRunInProgress(remoteState)) {
        void appendTrialServerRecord(remoteState, { aborted: true });
        showPartnerDisconnectState("Sender disconnect - run over");
        return;
      }
      receiverReady = false;
      setUiMode("receiver-waiting-online");
      return;
    }

    if (shouldHoldWaitingOnlinePrompt()) {
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
    if (isRobotSimulationMode) {
      bootstrapRobotSimulation();
      applyRemoteState(buildRobotSimulationPayload());
      return;
    }
    try {
      const payload = await api("heartbeat", {
        receiver_ready: role === "receiver" ? receiverReady : false,
        stale_ms: staleMs,
        receiver_view: role === "receiver" ? buildReceiverViewState() : undefined
      });
      applyRemoteState(payload);
    } catch (error) {
      if (!localRoundRunning && !roundScheduled) {
        setPrompt(getWaitingOnlinePrompt(), false);
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

  async function clearEntryNoticesOnBoot() {
    if (!launchedFromLauncher) {
      return;
    }
    try {
      await api("clear_entry_notices_on_boot", {
        receiver_ready: false,
        stale_ms: staleMs,
        frontend_build_version: runtimeBuildVersion
      });
    } catch (error) {
      // Ignore startup cleanup failures.
    }
  }

    async function boot() {
      applyLauncherPrefillFromQuery();
      void traceClientEvent("boot_client", {
        role,
        page: role === "sender" ? "sender.html" : "receiver.html",
        runtime_mode: runtimeMode
      });
      if (isRemoteDisplayMode) {
        document.title = "Cones Remote Viewing Display";
      } else if (isRemoteViewerMode) {
        document.title = "Cones Remote Viewer";
      }
    countdownBox.addEventListener("click", handleActionPress);
    countdownBox.addEventListener("keydown", handleActionKeydown);
    settingsGear?.addEventListener("click", openSettings);
    waitingBackButton?.addEventListener("click", () => {
      noteUserInteraction();
      void abortTrialAndReturnHome({
        open: getLauncherReturnRole()
      });
    });
    homeLink?.addEventListener("click", (event) => {
      event.preventDefault();
      noteUserInteraction();
      void abortTrialAndReturnHome();
    });
    window.addEventListener("pointerdown", noteUserInteraction, { passive: true });
    window.addEventListener("keydown", noteUserInteraction);

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
      buildImageDisplayPanel();
      buildSenderConfidencePanel();
      buildSenderChoiceGrid();
      buildSenderLevelOneChoiceGrid();
      buildSenderLevelTwoChoiceGrid();
      buildSenderLevelFourChoiceGrid();
      buildSenderLevelOneFeedbackGrid();
      buildDecisionPanel();
      buildMessagePanel();
      updateChoiceGridLayout();
      if (!settingsOpen && hasRequiredSettings()) {
        setUiMode("sender-waiting-online");
      }
    } else {
      buildImageDisplayPanel();
      buildChoiceGrid();
      buildReceiverLevelOneChoiceGrid();
      buildReceiverLevelTwoChoiceGrid();
      buildReceiverLevelFourChoiceGrid();
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

    if (isGuidedExperienceTour && !settingsOpen && hasRequiredSettings()) {
      beginGuidedReceiverTour();
    }

    window.addEventListener("resize", updateChoiceGridLayout);
    if (!settingsOpen && hasRequiredSettings()) {
      await clearEntryNoticesOnBoot();
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
















































