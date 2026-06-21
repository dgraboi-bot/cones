(function () {
  function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      version: String(params.get("v") || "").trim(),
      pairKey: String(params.get("pair_key") || "").trim(),
      receiverId: String(params.get("receiver_id") || "").trim(),
      senderId: String(params.get("sender_id") || "").trim(),
      sessionCode: String(params.get("session_code") || "").trim(),
      returnUrl: String(params.get("return_url") || "").trim(),
      level: String(params.get("level") || "all").trim() || "all",
      minTrials: Number.isFinite(Number(params.get("min_trials"))) ? Math.max(1, Number(params.get("min_trials"))) : 1,
      includeIncomplete: params.get("include_incomplete") === "1",
      groupBy: String(params.get("group_by") || "rounded").trim() || "rounded",
      roundingDecimals: Number.isFinite(Number(params.get("rounding_decimals"))) ? Math.max(0, Math.min(6, Number(params.get("rounding_decimals")))) : 3,
      dateFrom: String(params.get("date_from") || "").trim(),
      dateTo: String(params.get("date_to") || "").trim()
    };
  }

  function buildSelectedPairPayload(query) {
    return {
      receiver_name: query.receiverId,
      sender_name: query.senderId,
      session_code: query.sessionCode
    };
  }

  async function fetchLocationVisualizationData(query) {
    const response = await fetch("../api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "get_location_visualization",
        selected_pair: buildSelectedPairPayload(query),
        level: query.level,
        date_from: query.dateFrom || "",
        date_to: query.dateTo || "",
        min_trials: query.minTrials,
        include_incomplete: query.includeIncomplete,
        group_by: query.groupBy,
        rounding_decimals: query.roundingDecimals
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("The globe data request returned invalid JSON.");
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(String(data?.error || `Globe data request failed with status ${response.status}`));
    }

    return normalizeLocationVisualizationResponse(data?.location_visualization || null);
  }

  function normalizeLocationVisualizationResponse(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    return {
      available: !!source.available,
      message: String(source.message || ""),
      pair: source.pair && typeof source.pair === "object" ? source.pair : {},
      filters: source.filters && typeof source.filters === "object" ? source.filters : {},
      summary: source.summary && typeof source.summary === "object" ? source.summary : {},
      connections: Array.isArray(source.connections) ? source.connections : [],
      legend: source.legend && typeof source.legend === "object" ? source.legend : {}
    };
  }

  function formatDistance(value) {
    const meters = Number(value);
    if (!Number.isFinite(meters)) {
      return "unknown";
    }
    if (meters >= 1609.344) {
      return `${(meters / 1609.344).toFixed(1)} miles`;
    }
    return `${meters.toFixed(1)} meters`;
  }

  function formatPValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "unknown";
    }
    if (numeric === 0) {
      return "< 0.000000000001";
    }
    return numeric.toFixed(12).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  }

  function formatDate(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "unknown";
    }
    const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/);
    if (isoMatch) {
      return `${isoMatch[1]} ${isoMatch[2]} UTC`;
    }
    return text.replace("T", " ").replace(/(?:\.\d+)?Z$/, " UTC");
  }

  function formatDateOnlyUtc(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "unknown";
    }
    const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoMatch) {
      return `${isoMatch[1]} UTC`;
    }
    const plainMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (plainMatch) {
      return `${plainMatch[1]} UTC`;
    }
    return text.replace("T", " ").replace(/(?:\.\d+)?Z$/, " UTC");
  }

  window.ConesGlobeData = {
    parseQueryParams,
    fetchLocationVisualizationData,
    formatDistance,
    formatPValue,
    formatDate,
    formatDateOnlyUtc
  };
})();
