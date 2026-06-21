(async function () {
  const viewerElement = document.getElementById("globeViewer");
  const dataApi = window.ConesGlobeData;
  const ui = window.ConesGlobeUI;

  const missingDependencies = [];
  if (!viewerElement) {
    missingDependencies.push("viewerElement");
  }
  if (typeof window.Globe !== "function") {
    missingDependencies.push("Globe");
  }
  if (!dataApi) {
    missingDependencies.push("ConesGlobeData");
  }
  if (!ui) {
    missingDependencies.push("ConesGlobeUI");
  }

  if (missingDependencies.length) {
    const status = document.querySelector("[data-globe-status]");
    const overlay = document.querySelector("[data-globe-overlay-status]");
    const message = `Globe dependencies missing: ${missingDependencies.join(", ")}.`;
    if (status) {
      status.textContent = message;
    }
    if (overlay) {
      overlay.hidden = false;
      overlay.textContent = message;
    }
    return;
  }

  const query = dataApi.parseQueryParams();
  const fallbackHomeUrl = `../telepathybeginner.html?v=${encodeURIComponent(query.version || "20260619t")}`;
  let globe = null;
  let renderedConnections = [];
  let renderedLabels = [];
  let lastPayload = null;

  function getStrokeColor(colorClass) {
    switch (String(colorClass || "").trim()) {
      case "green":
        return "#4de18d";
      case "purple":
        return "#be8fff";
      default:
        return "#9ca6bc";
    }
  }

  function buildArcAltitude(connection) {
    const meters = Number(connection?.distance_meters_mean || 0);
    if (!Number.isFinite(meters) || meters <= 0) {
      return 0.08;
    }
    return Math.max(0.11, Math.min(0.32, meters / 30000000));
  }

  function buildConnectionRows(payload) {
    return (Array.isArray(payload?.connections) ? payload.connections : []).map((connection, index) => ({
      ...connection,
      id: `connection-${index}`,
      startLat: Number(connection.sender?.lat || 0),
      startLng: Number(connection.sender?.long || 0),
      endLat: Number(connection.receiver?.lat || 0),
      endLng: Number(connection.receiver?.long || 0),
      strokeColor: getStrokeColor(connection.color_class),
      altitude: buildArcAltitude(connection)
    }));
  }

  function buildLabels(connections) {
    return connections.flatMap((connection, index) => ([
      {
        id: `sender-label-${index}`,
        lat: connection.startLat,
        lng: connection.startLng,
        text: "S",
        color: "#65d8ff"
      },
      {
        id: `receiver-label-${index}`,
        lat: connection.endLat,
        lng: connection.endLng,
        text: "R",
        color: "#ffd166"
      }
    ]));
  }

  function buildMeanViewpoint(connections) {
    if (!connections.length) {
      return { lat: 16, lng: 0, altitude: 12 };
    }

    const endpoints = connections.flatMap((connection) => ([
      { lat: connection.startLat, lng: connection.startLng },
      { lat: connection.endLat, lng: connection.endLng }
    ]));

    const meanLat = endpoints.reduce((sum, point) => sum + point.lat, 0) / endpoints.length;
    const lngVectors = endpoints.reduce((accumulator, point) => {
      const radians = (point.lng * Math.PI) / 180;
      return {
        x: accumulator.x + Math.cos(radians),
        y: accumulator.y + Math.sin(radians)
      };
    }, { x: 0, y: 0 });
    const meanLng = (Math.atan2(lngVectors.y, lngVectors.x) * 180) / Math.PI;
    const latSpread = Math.max(...endpoints.map((point) => point.lat)) - Math.min(...endpoints.map((point) => point.lat));
    const lngSpread = Math.max(...endpoints.map((point) => point.lng)) - Math.min(...endpoints.map((point) => point.lng));
    const spread = Math.max(latSpread, Math.min(lngSpread, 360 - lngSpread));
    const altitude = Math.max(1.5, Math.min(12, 1.35 + (spread / 55)));

    return { lat: meanLat, lng: meanLng, altitude };
  }

  function applyLabelsVisible(visible) {
    if (!globe) {
      return;
    }
    globe.labelsData(visible ? renderedLabels : []);
  }

  function renderConnections(payload) {
    lastPayload = payload;
    renderedConnections = buildConnectionRows(payload);
    renderedLabels = buildLabels(renderedConnections);

    globe
      .arcsData(renderedConnections)
      .arcStartLat((row) => row.startLat)
      .arcStartLng((row) => row.startLng)
      .arcEndLat((row) => row.endLat)
      .arcEndLng((row) => row.endLng)
      .arcColor((row) => row.strokeColor)
      .arcAltitude((row) => row.altitude)
      .arcStroke(() => 0.55)
      .arcDashLength(() => 1)
      .arcDashGap(() => 0)
      .arcDashAnimateTime(() => 0)
      .arcsTransitionDuration(0)
      .pointsData(renderedLabels)
      .pointLat((row) => row.lat)
      .pointLng((row) => row.lng)
      .pointColor((row) => row.color)
      .pointAltitude(() => 0.012)
      .pointRadius(() => 0.24)
      .pointResolution(12)
      .labelsData(renderedLabels)
      .labelLat((row) => row.lat)
      .labelLng((row) => row.lng)
      .labelText((row) => row.text)
      .labelColor(() => "#ffffff")
      .labelAltitude(() => 0.03)
      .labelSize(() => 1.1)
      .labelResolution(4)
      .labelDotRadius(() => 0);
  }

  function fitViewerToConnections() {
    if (!globe) {
      return;
    }
    globe.pointOfView(buildMeanViewpoint(renderedConnections), 1800);
  }

  function resetViewer() {
    if (!globe) {
      return;
    }
    globe.pointOfView({ lat: 16, lng: 0, altitude: 18 }, 1600);
  }

  function goBack() {
    if (query.returnUrl) {
      window.location.href = query.returnUrl;
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = fallbackHomeUrl;
  }

  function bindGlobeEvents() {
    globe.onArcClick((connection) => {
      ui.renderConnectionDetails(connection, dataApi);
      if (connection) {
        ui.setOverlayMessage(`${connection.trial_count_completed} completed trial${connection.trial_count_completed === 1 ? "" : "s"} on this route. P = ${dataApi.formatPValue(connection.p_value)}.`);
      }
    });
  }

  function initializeViewer() {
    globe = window.Globe()(viewerElement)
      .width(viewerElement.clientWidth || 900)
      .height(viewerElement.clientHeight || 620)
      .backgroundColor("rgba(0,0,0,0)")
      .globeImageUrl("./assets/earth-blue-marble-2048.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundImageUrl("https://unpkg.com/three-globe/example/img/night-sky.png")
      .showAtmosphere(true)
      .atmosphereColor("#75b7ff")
      .atmosphereAltitude(0.18);

    globe.controls().enablePan = false;
    globe.controls().minDistance = 90;
    globe.controls().maxDistance = 12000;
    globe.controls().autoRotate = false;

    window.__conesGlobeViewer = globe;
    bindGlobeEvents();
    resetViewer();

    window.addEventListener("resize", () => {
      if (!globe || !viewerElement) {
        return;
      }
      globe.width(viewerElement.clientWidth || 900);
      globe.height(viewerElement.clientHeight || 620);
    });
  }

  ui.bindControls({
    onBack: goBack,
    onFlyToFit: () => fitViewerToConnections(),
    onReset: () => resetViewer(),
    onLabelsToggle: (visible) => applyLabelsVisible(visible)
  });

  try {
    if (!query.receiverId || !query.senderId) {
      throw new Error("A receiver-sender pair was not provided to the globe module.");
    }
    initializeViewer();
    const payload = await dataApi.fetchLocationVisualizationData(query);
    ui.renderPairLabel(payload.pair);
    ui.renderSummary(payload, dataApi.formatDateOnlyUtc);
    ui.renderLegend(payload.legend);
    ui.setStatusMessage(payload.available
      ? `${payload.summary?.connections || 0} route${Number(payload.summary?.connections || 0) === 1 ? "" : "s"} are shown on the globe.`
      : (payload.message || "No usable location records were found for this pair."));
    ui.setOverlayMessage(payload.available ? "Drag, zoom, or click a glowing route to inspect that connection." : "");
    if (payload.available) {
      renderConnections(payload);
      fitViewerToConnections();
      applyLabelsVisible(document.querySelector("[data-globe-labels]")?.checked !== false);
    } else {
      globe.arcsData([]);
      globe.pointsData([]);
      globe.labelsData([]);
    }
  } catch (error) {
    ui.renderPairLabel({
      receiver_label: query.receiverId || "unknown",
      sender_label: query.senderId || "unknown"
    });
    ui.renderSummary({ summary: { completed_trials: 0, connections: 0, first_trial_utc: null, last_trial_utc: null } }, dataApi.formatDateOnlyUtc);
    ui.renderLegend({});
    ui.setStatusMessage(String(error?.message || "Unable to load location visualization data."));
    ui.setOverlayMessage("");
    ui.renderConnectionDetails(null, dataApi);
  }
})();
