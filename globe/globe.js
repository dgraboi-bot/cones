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
  const fallbackHomeUrl = `../telepathybeginner.html?v=${encodeURIComponent(query.version || "20260710b")}&open=launcher`;
  let globe = null;
  let renderedConnections = [];
  let renderedPoints = [];
  let renderedLabels = [];
  let lastPayload = null;
  let globeLocationPermissionHandle = null;
  let currentLocationDisabled = !!query.locationDisabled;
  const CLOSE_CONNECTION_DISTANCE_METERS = 1000;
  const CLOSE_CONNECTION_PLOTTED_DISTANCE_METERS = 250;
  const CLOSE_CONNECTION_RENDER_OFFSET_METERS = 18000;
  const CLOSE_CONNECTION_LABEL_OFFSET_METERS = 5500;

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
    if (connection?.isCloseDisplay) {
      return 0.16;
    }
    if (!Number.isFinite(meters) || meters <= 0) {
      return 0.08;
    }
    return Math.max(0.11, Math.min(0.32, meters / 30000000));
  }

  function wrapLongitude(longitude) {
    let value = Number(longitude) || 0;
    while (value > 180) {
      value -= 360;
    }
    while (value < -180) {
      value += 360;
    }
    return value;
  }

  function offsetPointMeters(lat, lng, northMeters, eastMeters) {
    const latitude = Number(lat) || 0;
    const longitude = Number(lng) || 0;
    const deltaLat = northMeters / 111320;
    const cosLat = Math.max(0.2, Math.cos((latitude * Math.PI) / 180));
    const deltaLng = eastMeters / (111320 * cosLat);
    return {
      lat: latitude + deltaLat,
      lng: wrapLongitude(longitude + deltaLng)
    };
  }

  function haversineMeters(latA, lngA, latB, lngB) {
    const earthRadiusMeters = 6371000;
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const lat1 = toRadians(Number(latA) || 0);
    const lat2 = toRadians(Number(latB) || 0);
    const deltaLat = toRadians((Number(latB) || 0) - (Number(latA) || 0));
    const deltaLng = toRadians((Number(lngB) || 0) - (Number(lngA) || 0));
    const sinLat = Math.sin(deltaLat / 2);
    const sinLng = Math.sin(deltaLng / 2);
    const chord = (sinLat * sinLat) + (Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng);
    const arc = 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(Math.max(0, 1 - chord)));
    return earthRadiusMeters * arc;
  }

  function buildDisplayGeometry(connection) {
    const senderLat = Number(connection.sender?.lat || 0);
    const senderLng = Number(connection.sender?.long || 0);
    const receiverLat = Number(connection.receiver?.lat || 0);
    const receiverLng = Number(connection.receiver?.long || 0);
    const distanceMeters = Number(connection.distance_meters_mean || 0);
    const midLat = (senderLat + receiverLat) / 2;
    const midLng = wrapLongitude((senderLng + receiverLng) / 2);
    const eastDeltaMeters = (receiverLng - senderLng) * 111320 * Math.max(0.2, Math.cos((midLat * Math.PI) / 180));
    const northDeltaMeters = (receiverLat - senderLat) * 111320;
    const vectorLength = Math.hypot(eastDeltaMeters, northDeltaMeters);
    const plottedDistanceMeters = haversineMeters(senderLat, senderLng, receiverLat, receiverLng);
    const isCloseDisplay =
      (Number.isFinite(distanceMeters) && distanceMeters > 0 && distanceMeters < CLOSE_CONNECTION_DISTANCE_METERS)
      || (Number.isFinite(plottedDistanceMeters) && plottedDistanceMeters < CLOSE_CONNECTION_PLOTTED_DISTANCE_METERS);

    if (!isCloseDisplay) {
      return {
        startLat: senderLat,
        startLng: senderLng,
        endLat: receiverLat,
        endLng: receiverLng,
        pointRows: [
          {
            id: "sender",
            lat: senderLat,
            lng: senderLng,
            color: "#65d8ff",
            radius: 0.24
          },
          {
            id: "receiver",
            lat: receiverLat,
            lng: receiverLng,
            color: "#ffd166",
            radius: 0.24
          }
        ],
        labelRows: [
          {
            id: "sender-label",
            lat: senderLat,
            lng: senderLng,
            text: "S",
            color: "#ffffff",
            size: 1.1
          },
          {
            id: "receiver-label",
            lat: receiverLat,
            lng: receiverLng,
            text: "R",
            color: "#ffffff",
            size: 1.1
          }
        ],
        isCloseDisplay: false
      };
    }

    const eastUnit = vectorLength > 1 ? (-northDeltaMeters / vectorLength) : 0.72;
    const northUnit = vectorLength > 1 ? (eastDeltaMeters / vectorLength) : 0.69;
    const startPoint = offsetPointMeters(midLat, midLng, -northUnit * CLOSE_CONNECTION_RENDER_OFFSET_METERS, -eastUnit * CLOSE_CONNECTION_RENDER_OFFSET_METERS);
    const endPoint = offsetPointMeters(midLat, midLng, northUnit * CLOSE_CONNECTION_RENDER_OFFSET_METERS, eastUnit * CLOSE_CONNECTION_RENDER_OFFSET_METERS);
    const senderLabelPoint = offsetPointMeters(
      startPoint.lat,
      startPoint.lng,
      -northUnit * CLOSE_CONNECTION_LABEL_OFFSET_METERS,
      -eastUnit * CLOSE_CONNECTION_LABEL_OFFSET_METERS
    );
    const receiverLabelPoint = offsetPointMeters(
      endPoint.lat,
      endPoint.lng,
      northUnit * CLOSE_CONNECTION_LABEL_OFFSET_METERS,
      eastUnit * CLOSE_CONNECTION_LABEL_OFFSET_METERS
    );

    return {
      startLat: startPoint.lat,
      startLng: startPoint.lng,
      endLat: endPoint.lat,
      endLng: endPoint.lng,
      pointRows: [
        {
          id: "sender",
          lat: startPoint.lat,
          lng: startPoint.lng,
          color: "#65d8ff",
          radius: 0.34
        },
        {
          id: "receiver",
          lat: endPoint.lat,
          lng: endPoint.lng,
          color: "#ffd166",
          radius: 0.34
        }
      ],
      labelRows: [
        {
          id: "sender-label",
          lat: senderLabelPoint.lat,
          lng: senderLabelPoint.lng,
          text: "S",
          color: "#ffffff",
          size: 1.3
        },
        {
          id: "receiver-label",
          lat: receiverLabelPoint.lat,
          lng: receiverLabelPoint.lng,
          text: "R",
          color: "#ffffff",
          size: 1.3
        }
      ],
      isCloseDisplay: true
    };
  }

  function buildConnectionRows(payload) {
    return (Array.isArray(payload?.connections) ? payload.connections : []).map((connection, index) => {
      const geometry = buildDisplayGeometry(connection);
      const row = {
        ...connection,
        id: `connection-${index}`,
        startLat: geometry.startLat,
        startLng: geometry.startLng,
        endLat: geometry.endLat,
        endLng: geometry.endLng,
        pointRows: geometry.pointRows.map((pointRow) => ({ ...pointRow, id: `${pointRow.id}-${index}` })),
        labelRows: geometry.labelRows.map((labelRow) => ({ ...labelRow, id: `${labelRow.id}-${index}` })),
        isCloseDisplay: geometry.isCloseDisplay,
        strokeColor: getStrokeColor(connection.color_class)
      };
      row.altitude = buildArcAltitude(row);
      return row;
    });
  }

  function buildPoints(connections) {
    return connections.flatMap((connection) => Array.isArray(connection.pointRows) ? connection.pointRows : []);
  }

  function buildLabels(connections) {
    return connections.flatMap((connection) => Array.isArray(connection.labelRows) ? connection.labelRows : []);
  }

  function buildMeanViewpoint(connections) {
    if (!connections.length) {
      return { lat: 16, lng: 0, altitude: 2.35 };
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
    const altitude = Math.max(1.25, Math.min(3.8, 1.18 + (spread / 95)));

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
    renderedPoints = buildPoints(renderedConnections);
    renderedLabels = buildLabels(renderedConnections);

    globe
      .arcsData(renderedConnections)
      .arcStartLat((row) => row.startLat)
      .arcStartLng((row) => row.startLng)
      .arcEndLat((row) => row.endLat)
      .arcEndLng((row) => row.endLng)
      .arcColor((row) => row.strokeColor)
      .arcAltitude((row) => row.altitude)
      .arcStroke((row) => row?.isCloseDisplay ? 0.95 : 0.55)
      .arcDashLength(() => 1)
      .arcDashGap(() => 0)
      .arcDashAnimateTime(() => 0)
      .arcsTransitionDuration(0)
      .pointsData(renderedPoints)
      .pointLat((row) => row.lat)
      .pointLng((row) => row.lng)
      .pointColor((row) => row.color)
      .pointAltitude(() => 0.012)
      .pointRadius((row) => Number(row?.radius || 0.24))
      .pointResolution(12)
      .labelsData(renderedLabels)
      .labelLat((row) => row.lat)
      .labelLng((row) => row.lng)
      .labelText((row) => row.text)
      .labelColor((row) => row?.color || "#ffffff")
      .labelAltitude(() => 0.03)
      .labelSize((row) => Number(row?.size || 1.1))
      .labelResolution(4)
        .labelDotRadius(() => 0);
  }

  function applyLocationDisabledState(locationDisabled, payload = lastPayload) {
    if (!globe) {
      return;
    }
    if (locationDisabled) {
      ui.setStatusMessage("Location is disabled in the browser for this device, so worldwide ESP connections cannot be displayed.");
      ui.setOverlayMessage("Enable location for ESP GYM to view worldwide ESP connections.");
      globe.arcsData([]);
      globe.pointsData([]);
      globe.labelsData([]);
      return;
    }
    ui.setStatusMessage(payload?.available
      ? `${payload.summary?.connections || 0} route${Number(payload.summary?.connections || 0) === 1 ? "" : "s"} are shown on the globe.`
      : (payload?.message || "No usable location records were found for this pair."));
    ui.setOverlayMessage(payload?.available ? "Drag to rotate or pan, zoom, or click a glowing route to inspect that connection." : "");
    if (payload?.available) {
      renderConnections(payload);
      fitViewerToConnections();
      applyLabelsVisible(document.querySelector("[data-globe-labels]")?.checked !== false);
    } else {
      globe.arcsData([]);
      globe.pointsData([]);
      globe.labelsData([]);
    }
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
    globe.pointOfView({ lat: 16, lng: 0, altitude: 2.35 }, 1600);
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

    globe.controls().enablePan = true;
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

  async function detectBrowserLocationDisabled() {
    try {
      if (!navigator?.permissions?.query) {
        return null;
      }
      const status = await navigator.permissions.query({ name: "geolocation" });
      const state = String(status?.state || "").trim().toLowerCase();
      if (state === "denied") {
        return true;
      }
      if (state === "granted") {
        return false;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async function setupLocationPermissionWatcher() {
    try {
      if (!navigator?.permissions?.query) {
        return;
      }
      const status = await navigator.permissions.query({ name: "geolocation" });
      globeLocationPermissionHandle = status;
      status.onchange = () => {
        window.setTimeout(() => {
          void detectBrowserLocationDisabled().then((detected) => {
            if (detected !== null) {
              currentLocationDisabled = !!detected;
              applyLocationDisabledState(currentLocationDisabled, lastPayload);
            }
          });
        }, 250);
      };
    } catch (error) {
      // Ignore permission watcher setup failures.
    }
  }

  function warmupGlobeLocationIndicator() {
    try {
      if (!navigator?.geolocation) {
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => {
          // Keep the browser location-state icon visible while the globe page is open.
        },
        () => {
          // Denied or unavailable is expected in some cases.
        },
        {
          enableHighAccuracy: false,
          maximumAge: 300000,
          timeout: 5000
        }
      );
    } catch (error) {
      // Ignore non-fatal warmup failures.
    }
  }

  try {
    if (!query.receiverId || !query.senderId) {
      throw new Error("A receiver-sender pair was not provided to the globe module.");
    }
    initializeViewer();
    warmupGlobeLocationIndicator();
    const payload = await dataApi.fetchLocationVisualizationData(query);
    ui.renderPairLabel(payload.pair);
    ui.renderSummary(payload, dataApi.formatDateOnlyUtc);
    ui.renderLegend(payload.legend);
    await setupLocationPermissionWatcher();
    applyLocationDisabledState(currentLocationDisabled, payload);
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








