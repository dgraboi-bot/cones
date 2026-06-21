(function () {
  const pairLabel = document.querySelector("[data-globe-pair-label]");
  const summary = document.querySelector("[data-globe-summary]");
  const status = document.querySelector("[data-globe-status]");
  const legend = document.querySelector("[data-globe-legend]");
  const details = document.querySelector("[data-globe-details]");
  const overlayStatus = document.querySelector("[data-globe-overlay-status]");
  const backButton = document.querySelector("[data-globe-back]");
  const flyButton = document.querySelector("[data-globe-fly]");
  const resetButton = document.querySelector("[data-globe-reset]");
  const labelsCheckbox = document.querySelector("[data-globe-labels]");

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderPairLabel(pair) {
    if (!pairLabel) {
      return;
    }
    const receiver = String(pair?.receiver_label || pair?.receiver_id || "unknown").trim() || "unknown";
    const sender = String(pair?.sender_label || pair?.sender_id || "unknown").trim() || "unknown";
    pairLabel.textContent = `Receiver-sender pair: ${receiver} - ${sender}.`;
  }

  function renderSummary(payload, formatDate) {
    if (!summary) {
      return;
    }
    const summaryData = payload?.summary || {};
    const entries = [
      `<p class="globe-summary-item"><strong>Completed trials:</strong> ${Number(summaryData.completed_trials || 0)}</p>`,
      `<p class="globe-summary-item"><strong>Connections:</strong> ${Number(summaryData.connections || 0)}</p>`,
      `<p class="globe-summary-item"><strong>First trial:</strong> ${escapeHtml(formatDate(summaryData.first_trial_utc))}</p>`,
      `<p class="globe-summary-item"><strong>Last trial:</strong> ${escapeHtml(formatDate(summaryData.last_trial_utc))}</p>`
    ];
    summary.innerHTML = entries.join("");
  }

  function renderLegend(legendPayload) {
    if (!legend) {
      return;
    }
    const entries = [
      { color: "var(--globe-gray)", text: `Gray: ${legendPayload?.gray || "Below chance or insufficient evidence"}` },
      { color: "var(--globe-green)", text: `Green: ${legendPayload?.green || "Above chance"}` },
      { color: "var(--globe-purple)", text: `Purple: ${legendPayload?.purple || "Very much above chance"}` }
    ];
    legend.innerHTML = entries.map((entry) => `
      <p class="globe-legend-item">
        <span class="globe-legend-swatch" style="background:${entry.color}"></span>
        <span>${escapeHtml(entry.text)}</span>
      </p>
    `).join("");
  }

  function setStatusMessage(message) {
    if (!status) {
      return;
    }
    status.textContent = String(message || "");
  }

  function setOverlayMessage(message) {
    if (!overlayStatus) {
      return;
    }
    const text = String(message || "").trim();
    overlayStatus.textContent = text;
    overlayStatus.hidden = !text;
  }

  function renderConnectionDetails(connection, helpers) {
    if (!details) {
      return;
    }
    if (!connection) {
      details.textContent = "Click a connection line to inspect that route.";
      return;
    }

    const levels = Array.isArray(connection.levels_used) && connection.levels_used.length
      ? connection.levels_used.join(", ")
      : "unknown";
    details.innerHTML = `
      <p class="globe-details-row"><strong>Completed trials:</strong> ${escapeHtml(connection.trial_count_completed)}</p>
      <p class="globe-details-row"><strong>All grouped trials:</strong> ${escapeHtml(connection.trial_count_all)}</p>
      <p class="globe-details-row"><strong>Distance:</strong> ${escapeHtml(helpers.formatDistance(connection.distance_meters_mean))}</p>
      <p class="globe-details-row"><strong>Levels used:</strong> ${escapeHtml(levels)}</p>
      <p class="globe-details-row"><strong>Your score:</strong> ${escapeHtml(connection.score_total)}</p>
      <p class="globe-details-row"><strong>Chance score:</strong> ${escapeHtml(connection.chance_total)}</p>
      <p class="globe-details-row"><strong>Telepathic significance, P:</strong> ${escapeHtml(helpers.formatPValue(connection.p_value))}</p>
      <p class="globe-details-row"><strong>Average confidence:</strong> ${connection.average_confidence ?? "unknown"}</p>
      <p class="globe-details-row"><strong>Average time:</strong> ${connection.average_time_seconds ?? "unknown"} seconds</p>
    `;
  }

  function bindControls(handlers) {
    backButton?.addEventListener("click", handlers.onBack);
    flyButton?.addEventListener("click", handlers.onFlyToFit);
    resetButton?.addEventListener("click", handlers.onReset);
    labelsCheckbox?.addEventListener("change", () => {
      handlers.onLabelsToggle?.(!!labelsCheckbox.checked);
    });
  }

  window.ConesGlobeUI = {
    renderPairLabel,
    renderSummary,
    renderLegend,
    setStatusMessage,
    setOverlayMessage,
    renderConnectionDetails,
    bindControls
  };
})();
