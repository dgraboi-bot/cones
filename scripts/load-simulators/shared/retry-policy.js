function classifyRetryableError(error) {
  const message = error instanceof Error ? String(error.message || "").trim() : String(error || "").trim();
  if (/timed out|aborted|abort/i.test(message)) {
    return { kind: "timeout", message };
  }
  return { kind: "generic", message };
}

function shouldRetryRequest(input) {
  const attempt = Number(input.attempt || 1);
  const maxAttempts = Number(input.maxAttempts || 1);
  if (attempt >= maxAttempts) {
    return false;
  }

  const status = Number(input.status || 0);
  if (status >= 500) {
    return true;
  }
  if (status === 0) {
    return ["launcher", "report", "course", "generic"].includes(String(input.endpointClass || ""));
  }
  return false;
}

module.exports = {
  classifyRetryableError,
  shouldRetryRequest
};
