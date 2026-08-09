const fs = require("fs");
const path = require("path");
const targetSelection = require("../target-selection.js");

const repoRoot = path.resolve(__dirname, "..");
const privatePairsRoot = "C:\\xampp\\telepathyexperiment_private\\cones\\pairs";
const validationReportsRoot = path.join(repoRoot, "validation-reports");

const projectionSignificancePThreshold = 0.01;
const highlyPersuasivePThreshold = 0.001;
const highlyPersuasiveMinimumTrials = 25;
const twentyTrialCheckpointCount = 20;
const highlyPersuasiveProjectionCeiling = 500;
const practiceTrendSameLevelMinimumTrials = 20;
const practiceTrendMixedLevelMinimumTrials = 30;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (ch === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (ch === "\"") {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === "\"") {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift() || [];
  return rows
    .filter((candidate) => candidate.length && candidate.some((value) => value !== ""))
    .map((candidate) => Object.fromEntries(headers.map((header, headerIndex) => [header, candidate[headerIndex] ?? ""])));
}

function loadCsvRecords(csvPath) {
  return parseCsv(fs.readFileSync(csvPath, "utf8"));
}

function formatProbabilityValue(value) {
  if (!Number.isFinite(value)) {
    return "unknown";
  }
  if (value === 0) {
    return "< .000000000001";
  }
  if (value < 1) {
    const decimalText = value.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
    if (decimalText && decimalText !== "0") {
      return decimalText.replace(/^0\./, ".");
    }
  }
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function formatProbabilityValueSignificant(value, significantFigures = 3) {
  if (!Number.isFinite(value)) {
    return "unknown";
  }
  if (value === 0) {
    return "< .000000000001";
  }
  if (value < 1) {
    const precision = Math.max(1, Number(significantFigures || 3));
    const exponential = value.toExponential(precision - 1);
    const [mantissaText, exponentText] = exponential.split("e");
    const exponent = Number(exponentText);
    if (Number.isFinite(exponent) && exponent < 0) {
      const digits = mantissaText.replace(".", "");
      const zeroCount = Math.max(0, Math.abs(exponent) - 1);
      const neededDigits = Math.max(precision, digits.length);
      return `.${"0".repeat(zeroCount)}${digits.padEnd(neededDigits, "0")}`;
    }
  }
  return Number(value).toPrecision(Math.max(1, Number(significantFigures || 3))).replace(/0+$/, "").replace(/\.$/, "");
}

function formatScoreValue(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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

function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7
  ];
  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }
  let x = 0.9999999999998099;
  const adjusted = value - 1;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (adjusted + index + 1);
  });
  const t = adjusted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(t) - t + Math.log(x);
}

function evaluateIncompleteBetaContinuedFraction(x, a, b) {
  const maxIterations = 200;
  const epsilon = 3e-14;
  const tiny = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) {
    d = tiny;
  }
  d = 1 / d;
  let h = d;
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const evenStep = iteration * 2;
    let aa = (iteration * (b - iteration) * x) / ((qam + evenStep) * (a + evenStep));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) {
      d = tiny;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) {
      c = tiny;
    }
    d = 1 / d;
    h *= d * c;

    aa = (-(a + iteration) * (qab + iteration) * x) / ((a + evenStep) * (qap + evenStep));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) {
      d = tiny;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) {
      c = tiny;
    }
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) {
      break;
    }
  }
  return h;
}

function regularizedIncompleteBeta(x, a, b) {
  if (!Number.isFinite(x) || !Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return Number.NaN;
  }
  if (x <= 0) {
    return 0;
  }
  if (x >= 1) {
    return 1;
  }
  const logBetaTerm = logGamma(a + b) - logGamma(a) - logGamma(b) + (a * Math.log(x)) + (b * Math.log(1 - x));
  const betaFactor = Math.exp(logBetaTerm);
  if (x < (a + 1) / (a + b + 2)) {
    return (betaFactor * evaluateIncompleteBetaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (betaFactor * evaluateIncompleteBetaContinuedFraction(1 - x, b, a)) / b;
}

function getStudentTUpperTailPValue(tStatistic, degreesFreedom) {
  const t = Number(tStatistic);
  const df = Number(degreesFreedom);
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) {
    return Number.NaN;
  }
  if (t === 0) {
    return 0.5;
  }
  if (!Number.isFinite(t)) {
    return t > 0 ? 0 : 1;
  }
  const x = df / (df + (t * t));
  const betaValue = regularizedIncompleteBeta(x, df / 2, 0.5);
  if (!Number.isFinite(betaValue)) {
    return Number.NaN;
  }
  if (t > 0) {
    return Math.max(0, Math.min(1, 0.5 * betaValue));
  }
  return Math.max(0, Math.min(1, 1 - (0.5 * betaValue)));
}

function getExactBinomialRightTailPValue(successes, trials, chanceProbability) {
  const n = Number(trials);
  const k = Number(successes);
  const p = Number(chanceProbability);
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n || !(p >= 0 && p <= 1)) {
    return Number.NaN;
  }
  if (n === 0) {
    return Number.NaN;
  }
  if (p === 0) {
    return k <= 0 ? 1 : 0;
  }
  if (p === 1) {
    return k <= n ? 1 : 0;
  }
  const q = 1 - p;
  let pmf = q ** n;
  let tail = k === 0 ? pmf : 0;
  for (let i = 0; i < n; i += 1) {
    pmf *= ((n - i) / (i + 1)) * (p / q);
    if ((i + 1) >= k) {
      tail += pmf;
    }
  }
  return Math.max(0, Math.min(1, tail));
}

function normalizeLevelFourImageIdentity(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  const sanitized = decodeURIComponent(raw.split(/[?#]/, 1)[0] || raw);
  const normalizedPath = sanitized.replace(/\\/g, "/");
  const lastSegment = normalizedPath.split("/").filter(Boolean).pop() || normalizedPath;
  return lastSegment.toLowerCase().trim();
}

function getTrialScoreModel(record) {
  const trialAborted = String(record?.["trial aborted"] ?? "").trim().toLowerCase() === "yes";
  const trialTimedOut = String(record?.["trial timed out"] ?? "").trim().toLowerCase() === "yes";
  if (trialAborted || trialTimedOut) {
    return { observed: Number.NaN, expected: Number.NaN, variance: Number.NaN, level: 0 };
  }
  const difficultyLevel = String(record?.["difficulty level"] ?? "").trim();
  if (difficultyLevel === "4") {
    const sentImageIdentity = normalizeLevelFourImageIdentity(record?.["sent image"] ?? "");
    const chosenImageIdentity = normalizeLevelFourImageIdentity(record?.["rx image choice"] ?? "");
    if (!sentImageIdentity || !chosenImageIdentity) {
      return { observed: Number.NaN, expected: Number.NaN, variance: Number.NaN, level: 0 };
    }
    return { observed: sentImageIdentity === chosenImageIdentity ? 1 : 0, expected: 0.5, variance: 0.25, level: 4 };
  }
  const sentLayout = Number(String(record?.["sent layout"] ?? "").trim());
  const choiceOneRaw = String(record?.["rx choice1"] ?? "").trim();
  if (!choiceOneRaw) {
    return { observed: Number.NaN, expected: Number.NaN, variance: Number.NaN, level: 0 };
  }
  const choiceOne = Number(choiceOneRaw);
  if (!Number.isFinite(sentLayout) || !Number.isFinite(choiceOne)) {
    return { observed: Number.NaN, expected: Number.NaN, variance: Number.NaN, level: 0 };
  }
  const exactMatch = sentLayout === choiceOne;
  const difficultyLevelNumber = Number(difficultyLevel);
  const exactCorrectProbability = Number(targetSelection.getExactCorrectProbability(difficultyLevelNumber));
  if (difficultyLevel === "1") {
    const sentToken = String(targetSelection.getLevelResponseToken(1, sentLayout) || "").trim();
    const chosenToken = String(targetSelection.getLevelResponseToken(1, choiceOne) || "").trim();
    return {
      observed: sentToken && chosenToken && sentToken === chosenToken ? 1 : 0,
      expected: Number.isFinite(exactCorrectProbability) ? exactCorrectProbability : 0.5,
      variance: Number.isFinite(exactCorrectProbability) ? exactCorrectProbability * (1 - exactCorrectProbability) : 0.25,
      level: 1
    };
  }
  if (difficultyLevel === "2" || difficultyLevel === "3") {
    const fallbackP = difficultyLevel === "2" ? 0.2 : (1 / 9);
    const p = Number.isFinite(exactCorrectProbability) ? exactCorrectProbability : fallbackP;
    return {
      observed: exactMatch ? 1 : 0,
      expected: p,
      variance: p * (1 - p),
      level: difficultyLevelNumber
    };
  }
  return { observed: Number.NaN, expected: Number.NaN, variance: Number.NaN, level: 0 };
}

function getScoredRecords(records) {
  return (Array.isArray(records) ? records : []).filter((record) => {
    const model = getTrialScoreModel(record);
    return Number.isFinite(model.observed) && Number.isFinite(model.expected) && Number.isFinite(model.variance);
  });
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

function getLevelSpecificSignificanceMethod(targetLevel) {
  if (targetLevel === 1 || targetLevel === 4) {
    return "exact-binomial";
  }
  if (targetLevel === 2 || targetLevel === 3) {
    return "exact-enumeration";
  }
  return "unknown";
}

function convolveScorePmfs(pmfA, pmfB) {
  const result = new Map();
  pmfA.forEach((probabilityA, scoreA) => {
    pmfB.forEach((probabilityB, scoreB) => {
      const combinedScore = Number(scoreA) + Number(scoreB);
      const combinedProbability = Number(probabilityA) * Number(probabilityB);
      result.set(combinedScore, (result.get(combinedScore) || 0) + combinedProbability);
    });
  });
  return result;
}

function getExactNullPmfForTrial(record) {
  const model = getTrialScoreModel(record);
  if (!Number.isFinite(model.observed) || !Number.isFinite(model.expected) || !Number.isFinite(model.variance)) {
    return null;
  }
  const level = Number(model.level);
  if (level !== 2 && level !== 3) {
    return null;
  }
  const pmf = targetSelection.getBernoulliNullPmf(level);
  if (!(pmf instanceof Map) || !pmf.size) {
    return null;
  }
  return { level, observed: model.observed, pmf };
}

function buildExactScoreDistribution(records, targetLevel) {
  let pmf = new Map([[0, 1]]);
  let completedTrials = 0;
  let observedScore = 0;
  (Array.isArray(records) ? records : []).forEach((record) => {
    const exactTrial = getExactNullPmfForTrial(record);
    if (!exactTrial || Number(exactTrial.level) !== Number(targetLevel)) {
      return;
    }
    pmf = convolveScorePmfs(pmf, exactTrial.pmf);
    completedTrials += 1;
    observedScore += Number(exactTrial.observed);
  });
  return { completedTrials, observedScore, pmf };
}

function getExactRightTailPValueFromPmf(pmf, observedScore) {
  if (!(pmf instanceof Map) || !pmf.size || !Number.isFinite(observedScore)) {
    return Number.NaN;
  }
  let tail = 0;
  pmf.forEach((probability, score) => {
    if (Number(score) >= observedScore) {
      tail += Number(probability);
    }
  });
  return Math.max(0, Math.min(1, tail));
}

function getExactEnumeratedLevelPValue(records, targetLevel) {
  const distribution = buildExactScoreDistribution(records, targetLevel);
  if (distribution.completedTrials < 1) {
    return { pValue: Number.NaN, completedTrials: 0, observedScore: 0 };
  }
  return {
    ...distribution,
    pValue: getExactRightTailPValueFromPmf(distribution.pmf, distribution.observedScore)
  };
}

function getLevelOneExactPValue(records) {
  const levelOneRecords = (Array.isArray(records) ? records : []).filter((record) => Number(getTrialScoreModel(record).level) === 1);
  const completedTrials = levelOneRecords.length;
  if (completedTrials < 1) {
    return { pValue: Number.NaN, completedTrials: 0, successes: 0 };
  }
  const successes = levelOneRecords.reduce((total, record) => total + (Number(getTrialScoreModel(record).observed) === 1 ? 1 : 0), 0);
  return {
    pValue: getExactBinomialRightTailPValue(successes, completedTrials, 0.5),
    completedTrials,
    successes
  };
}

function getLevelFourExactPValue(records) {
  const levelFourRecords = (Array.isArray(records) ? records : []).filter((record) => Number(getTrialScoreModel(record).level) === 4);
  const completedTrials = levelFourRecords.length;
  if (completedTrials < 1) {
    return { pValue: Number.NaN, completedTrials: 0, successes: 0 };
  }
  const successes = levelFourRecords.reduce((total, record) => total + (Number(getTrialScoreModel(record).observed) === 1 ? 1 : 0), 0);
  return {
    pValue: getExactBinomialRightTailPValue(successes, completedTrials, 0.5),
    completedTrials,
    successes
  };
}

function getLevelSpecificPValue(records, targetLevel) {
  if (targetLevel === 1) {
    return getLevelOneExactPValue(records).pValue;
  }
  if (targetLevel === 2 || targetLevel === 3) {
    return getExactEnumeratedLevelPValue(records, targetLevel).pValue;
  }
  if (targetLevel === 4) {
    return getLevelFourExactPValue(records).pValue;
  }
  return Number.NaN;
}

function buildLevelBreakdown(records) {
  const buckets = new Map();
  getScoredRecords(records).forEach((record) => {
    const model = getTrialScoreModel(record);
    const level = Number(model.level);
    if (!buckets.has(level)) {
      buckets.set(level, {
        level,
        completed_trials: 0,
        chance_score: 0,
        your_score: 0,
        total_variance: 0
      });
    }
    const entry = buckets.get(level);
    entry.completed_trials += 1;
    entry.chance_score += Number(model.expected);
    entry.your_score += Number(model.observed);
    entry.total_variance += Number(model.variance);
  });
  const levels = [...buckets.values()].sort((a, b) => a.level - b.level).map((entry) => ({
    ...entry,
    p_value: getLevelSpecificPValue(records, entry.level),
    significance_method: getLevelSpecificSignificanceMethod(entry.level)
  }));
  return { levels };
}

function getLevelStatsList(levelBreakdown) {
  return Array.isArray(levelBreakdown?.levels) ? levelBreakdown.levels : [];
}

function getOverallSignificanceContext(summaryStats, levelBreakdown = null) {
  const totalTrials = Number(summaryStats?.totalTrials || 0);
  if (totalTrials < 1) {
    return { pValue: Number.NaN, method: "unknown", dominantLevel: null };
  }
  const levelStats = getLevelStatsList(levelBreakdown);
  const activeLevels = levelStats.filter((entry) => Number(entry.completed_trials || 0) > 0);
  if (activeLevels.length === 1) {
    return {
      pValue: Number(activeLevels[0].p_value),
      method: activeLevels[0].significance_method || getLevelSpecificSignificanceMethod(Number(activeLevels[0].level)),
      dominantLevel: Number(activeLevels[0].level)
    };
  }
  return {
    pValue: getTelepathicSignificancePValue(summaryStats),
    method: "combined-standardized",
    dominantLevel: null
  };
}

function getProjectionPerTrialAverages(summaryStats) {
  const totalTrials = Number(summaryStats?.totalTrials || 0);
  const yourScore = Number(summaryStats?.yourScore || 0);
  const chanceScore = Number(summaryStats?.chanceScore || 0);
  const totalVariance = Number(summaryStats?.totalVariance || 0);
  if (totalTrials < 1 || !Number.isFinite(yourScore) || !Number.isFinite(chanceScore) || !Number.isFinite(totalVariance) || totalVariance <= 0) {
    return null;
  }
  return {
    observedPerTrial: yourScore / totalTrials,
    expectedPerTrial: chanceScore / totalTrials,
    variancePerTrial: totalVariance / totalTrials
  };
}

function getProjectedSummaryStats(summaryStats, projectedTrials) {
  const averages = getProjectionPerTrialAverages(summaryStats);
  const trialCount = Number(projectedTrials || 0);
  if (!averages || trialCount < 1) {
    return null;
  }
  return {
    totalTrials: trialCount,
    yourScore: averages.observedPerTrial * trialCount,
    chanceScore: averages.expectedPerTrial * trialCount,
    totalVariance: averages.variancePerTrial * trialCount
  };
}

function getProjectedThresholdResult(summaryStats, thresholdPValue, minimumTrials = 1) {
  const totalTrials = Number(summaryStats?.totalTrials || 0);
  if (!getProjectionPerTrialAverages(summaryStats) || totalTrials < 1) {
    return null;
  }
  for (let projectedTrials = Math.max(totalTrials, Number(minimumTrials || 1), 1); projectedTrials <= highlyPersuasiveProjectionCeiling; projectedTrials += 1) {
    const projectedSummary = getProjectedSummaryStats(summaryStats, projectedTrials);
    const projectedPValue = getTelepathicSignificancePValue(projectedSummary);
    if (Number.isFinite(projectedPValue) && projectedPValue < Number(thresholdPValue)) {
      return { trialCount: projectedTrials, pValue: projectedPValue, summaryStats: projectedSummary };
    }
  }
  return null;
}

function buildPracticeTrendTrialSeries(records) {
  return getScoredRecords(Array.isArray(records) ? records : []).map((record, index) => {
    const model = getTrialScoreModel(record);
    const variance = Number(model.variance);
    const chanceAdjusted = Number(model.observed) - Number(model.expected);
    return {
      index: index + 1,
      observed: Number(model.observed),
      expected: Number(model.expected),
      excess: chanceAdjusted,
      standardizedExcess: Number.isFinite(variance) && variance > 0 ? chanceAdjusted / Math.sqrt(variance) : Number.NaN,
      level: Number(model.level),
      record
    };
  });
}

function computePracticeTrendRegression(points) {
  const cleanPoints = (Array.isArray(points) ? points : [])
    .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const n = cleanPoints.length;
  if (n < 2) {
    return null;
  }
  const meanX = cleanPoints.reduce((total, point) => total + point.x, 0) / n;
  const meanY = cleanPoints.reduce((total, point) => total + point.y, 0) / n;
  const sxx = cleanPoints.reduce((total, point) => total + ((point.x - meanX) ** 2), 0);
  const syy = cleanPoints.reduce((total, point) => total + ((point.y - meanY) ** 2), 0);
  if (!(sxx > 0)) {
    return null;
  }
  const sxy = cleanPoints.reduce((total, point) => total + ((point.x - meanX) * (point.y - meanY)), 0);
  const slope = sxy / sxx;
  const intercept = meanY - (slope * meanX);
  const residuals = cleanPoints.map((point) => {
    const fitted = intercept + (slope * point.x);
    return { x: point.x, y: point.y, fitted, residual: point.y - fitted };
  });
  const residualSumSquares = residuals.reduce((total, point) => total + (point.residual ** 2), 0);
  const totalSumSquares = cleanPoints.reduce((total, point) => total + ((point.y - meanY) ** 2), 0);
  const degreesFreedom = n - 2;
  const residualStandardError = degreesFreedom > 0 ? Math.sqrt(residualSumSquares / degreesFreedom) : Number.NaN;
  const slopeStandardError = degreesFreedom > 0 && sxx > 0
    ? Math.sqrt((residualSumSquares / degreesFreedom) / sxx)
    : Number.NaN;
  const tStatistic = Number.isFinite(slopeStandardError) && slopeStandardError > 0
    ? slope / slopeStandardError
    : (Math.abs(slope) < 1e-12 ? 0 : (slope > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY));
  const pValue = getStudentTUpperTailPValue(tStatistic, degreesFreedom);
  const rSquared = totalSumSquares > 0 ? Math.max(0, Math.min(1, 1 - (residualSumSquares / totalSumSquares))) : 0;
  return { n, slope, intercept, pValue, rSquared, degreesFreedom, residualStandardError, slopeStandardError, tStatistic, residuals, sxx, sxy, syy };
}

function getPracticeTrendDetail(records, levelBreakdown = null) {
  const scoredRecords = getScoredRecords(Array.isArray(records) ? records : []);
  const breakdown = levelBreakdown || buildLevelBreakdown(scoredRecords);
  const activeLevels = getLevelStatsList(breakdown).filter((entry) => Number(entry.completed_trials || 0) > 0);
  const mode = activeLevels.length === 1 ? "same-level" : "mixed-level";
  const minimumTrials = mode === "same-level" ? practiceTrendSameLevelMinimumTrials : practiceTrendMixedLevelMinimumTrials;
  if (scoredRecords.length < minimumTrials) {
    return {
      eligible: false,
      mode,
      minimumTrials,
      trialCount: scoredRecords.length,
      line: mode === "same-level"
        ? "Practice trend: more trials are needed before a meaningful practice trend can be estimated."
        : "Practice trend across mixed levels: more trials are needed before a meaningful practice trend can be estimated."
    };
  }
  const trialSeries = buildPracticeTrendTrialSeries(scoredRecords);
  const activeLevel = activeLevels.length === 1 ? Number(activeLevels[0].level) : null;
  const regressionPoints = trialSeries.map((point) => ({
    x: point.index,
    y: mode === "same-level" ? point.excess : point.standardizedExcess
  }));
  const regression = computePracticeTrendRegression(regressionPoints);
  return {
    eligible: Boolean(regression),
    mode,
    activeLevel,
    minimumTrials,
    trialCount: regression ? regression.n : scoredRecords.length,
    regression,
    regressionPoints
  };
}

function summarizeRecords(records) {
  const summaryStats = getReportSummaryStats(records);
  const levelBreakdown = buildLevelBreakdown(records);
  const significance = getOverallSignificanceContext(summaryStats, levelBreakdown);
  const firstTwentyProjection = summaryStats.totalTrials >= twentyTrialCheckpointCount
    ? getOverallSignificanceContext(
        getReportSummaryStats(getScoredRecords(records).slice(0, twentyTrialCheckpointCount)),
        buildLevelBreakdown(getScoredRecords(records).slice(0, twentyTrialCheckpointCount))
      ).pValue
    : getTelepathicSignificancePValue(getProjectedSummaryStats(summaryStats, twentyTrialCheckpointCount));
  const significanceProjection = getProjectedThresholdResult(summaryStats, projectionSignificancePThreshold, 1);
  const highlyPersuasiveProjection = getProjectedThresholdResult(summaryStats, highlyPersuasivePThreshold, highlyPersuasiveMinimumTrials);
  const practiceTrend = getPracticeTrendDetail(records, levelBreakdown);
  return {
    summaryStats,
    levelBreakdown,
    overallSignificance: significance,
    twentyTrialCheckpoint: firstTwentyProjection,
    significanceProjection,
    highlyPersuasiveProjection,
    practiceTrend
  };
}

function chooseRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function buildChanceResponse(level, targetLayout) {
  const options = targetSelection.getResponseOptions(level);
  if (level === 1) {
    return chooseRandom([1, 3]);
  }
  if (level === 2 || level === 3) {
    const responseToken = chooseRandom(options);
    const candidates = targetSelection.getAllowedTargetLayoutNumbers(level).filter((layoutNumber) => targetSelection.getLevelResponseToken(level, layoutNumber) === responseToken);
    return chooseRandom(candidates);
  }
  if (level === 4) {
    return Math.random() < 0.5 ? 1 : 2;
  }
  return null;
}

function buildBiasedResponse(level, targetLayout, exactHitProbability) {
  if (Math.random() < exactHitProbability) {
    return targetLayout;
  }
  if (level === 1) {
    return targetSelection.getLevelResponseToken(1, targetLayout) === "one" ? 3 : 1;
  }
  if (level === 2 || level === 3) {
    const candidates = targetSelection.getAllowedTargetLayoutNumbers(level).filter((layoutNumber) => Number(layoutNumber) !== Number(targetLayout));
    return chooseRandom(candidates);
  }
  if (level === 4) {
    return targetLayout === 1 ? 2 : 1;
  }
  return null;
}

function createSyntheticRecord(level, targetLayout, responseValue, index) {
  const utcTime = new Date(Date.UTC(2026, 0, 1, 12, 0, 0 + index)).toISOString();
  return {
    "trial aborted": "no",
    "trial timed out": "no",
    "difficulty level": String(level),
    "sent layout": level === 4 ? "" : String(targetLayout),
    "rx choice1": level === 4 ? String(responseValue) : String(responseValue),
    "rx choice2": "",
    "sent image": level === 4 ? (targetLayout === 1 ? "image-a.jpg" : "image-b.jpg") : "",
    "rx image choice": level === 4 ? (responseValue === 1 ? "image-a.jpg" : "image-b.jpg") : "",
    "utc time": utcTime
  };
}

function simulateLevelFrequency(level, trials) {
  const counts = new Map();
  let oneVsMany = { one: 0, many: 0 };
  for (let index = 0; index < trials; index += 1) {
    const targetLayout = targetSelection.pickTargetLayoutNumber(level);
    counts.set(targetLayout, (counts.get(targetLayout) || 0) + 1);
    const token = targetSelection.getLevelResponseToken(level, targetLayout);
    if (token === "one") {
      oneVsMany.one += 1;
    } else {
      oneVsMany.many += 1;
    }
  }
  return {
    level,
    trials,
    oneVsMany,
    perLayout: Object.fromEntries([...counts.entries()].sort((a, b) => Number(a[0]) - Number(b[0])))
  };
}

function simulateSyntheticSession(level, trials, mode, exactHitProbability = null) {
  const records = [];
  for (let index = 0; index < trials; index += 1) {
    const targetLayout = level === 4 ? (Math.random() < 0.5 ? 1 : 2) : targetSelection.pickTargetLayoutNumber(level);
    let responseValue;
    if (mode === "chance") {
      responseValue = buildChanceResponse(level, targetLayout);
    } else if (mode === "biased") {
      responseValue = buildBiasedResponse(level, targetLayout, exactHitProbability);
    } else if (mode === "perfect") {
      responseValue = targetLayout;
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
    records.push(createSyntheticRecord(level, targetLayout, responseValue, index));
  }
  return {
    level,
    trials,
    mode,
    exactHitProbability,
    records,
    analysis: summarizeRecords(records)
  };
}

function simulateMixedSession(levelSequence, modeByLevel) {
  const records = [];
  levelSequence.forEach((level, index) => {
    const targetLayout = targetSelection.pickTargetLayoutNumber(level);
    const modeConfig = modeByLevel[level] || { mode: "chance" };
    const responseValue = modeConfig.mode === "perfect"
      ? targetLayout
      : (modeConfig.mode === "biased"
          ? buildBiasedResponse(level, targetLayout, Number(modeConfig.exactHitProbability))
          : buildChanceResponse(level, targetLayout));
    records.push(createSyntheticRecord(level, targetLayout, responseValue, index));
  });
  return {
    levelSequence,
    modeByLevel,
    records,
    analysis: summarizeRecords(records)
  };
}

function summarizeForDisplay(result) {
  const summary = result.analysis.summaryStats;
  const overall = result.analysis.overallSignificance;
  const levelLines = getLevelStatsList(result.analysis.levelBreakdown).map((entry) => ({
    level: entry.level,
    completedTrials: entry.completed_trials,
    yourScore: formatScoreValue(entry.your_score),
    chanceScore: formatScoreValue(entry.chance_score),
    pValue: formatProbabilityValueSignificant(entry.p_value, 3),
    method: entry.significance_method
  }));
  return {
    mode: result.mode || "mixed",
    level: result.level || null,
    trials: summary.totalTrials,
    yourScore: formatScoreValue(summary.yourScore),
    chanceScore: formatScoreValue(summary.chanceScore),
    overallP: formatProbabilityValueSignificant(overall.pValue, 3),
    overallMethod: overall.method,
    levelLines,
    twentyTrialCheckpoint: formatProbabilityValueSignificant(result.analysis.twentyTrialCheckpoint, 3),
    significanceProjection: result.analysis.significanceProjection
      ? {
          trialCount: result.analysis.significanceProjection.trialCount,
          pValue: formatProbabilityValueSignificant(result.analysis.significanceProjection.pValue, 3)
        }
      : null,
    highlyPersuasiveProjection: result.analysis.highlyPersuasiveProjection
      ? {
          trialCount: result.analysis.highlyPersuasiveProjection.trialCount,
          pValue: formatProbabilityValueSignificant(result.analysis.highlyPersuasiveProjection.pValue, 3)
        }
      : null,
    practiceTrend: result.analysis.practiceTrend.regression
      ? {
          eligible: result.analysis.practiceTrend.eligible,
          mode: result.analysis.practiceTrend.mode,
          trialCount: result.analysis.practiceTrend.trialCount,
          slope: Number(result.analysis.practiceTrend.regression.slope.toPrecision(6)),
          pValue: formatProbabilityValueSignificant(result.analysis.practiceTrend.regression.pValue, 3),
          rSquared: Number(result.analysis.practiceTrend.regression.rSquared.toFixed(3))
        }
      : {
          eligible: result.analysis.practiceTrend.eligible,
          mode: result.analysis.practiceTrend.mode,
          trialCount: result.analysis.practiceTrend.trialCount,
          minimumTrials: result.analysis.practiceTrend.minimumTrials
        }
  };
}

function padTwo(value) {
  return String(value).padStart(2, "0");
}

function buildTimestampSlug(date = new Date()) {
  return [
    date.getFullYear(),
    padTwo(date.getMonth() + 1),
    padTwo(date.getDate()),
    "-",
    padTwo(date.getHours()),
    padTwo(date.getMinutes()),
    padTwo(date.getSeconds())
  ].join("");
}

function ensureValidationReportsRoot() {
  fs.mkdirSync(validationReportsRoot, { recursive: true });
}

function buildMarkdownReport(report) {
  const lines = [];
  lines.push("# Target Policy Validation Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Build version: ${report.buildVersion}`);
  lines.push("");
  lines.push("## Frequency Checks");
  lines.push("");
  report.frequencyChecks.forEach((entry) => {
    lines.push(`### Level ${entry.level}`);
    lines.push(`- Trials: ${entry.trials}`);
    lines.push(`- One count: ${entry.oneVsMany.one}`);
    lines.push(`- Many count: ${entry.oneVsMany.many}`);
    lines.push(`- Per-layout counts: ${Object.entries(entry.perLayout).map(([layout, count]) => `${layout}=${count}`).join(", ")}`);
    lines.push("");
  });
  lines.push("## Current CSV Validation");
  lines.push("");
  report.currentCsvValidation.forEach((entry) => {
    lines.push(`### ${entry.file}`);
    lines.push(`- Trials: ${entry.summary.trials}`);
    lines.push(`- Overall P: ${entry.summary.overallP}`);
    entry.summary.levels.forEach((level) => {
      lines.push(`- Level ${level.level}: score ${level.yourScore} vs chance ${level.chanceScore}, P = ${level.pValue}`);
    });
    lines.push("");
  });
  lines.push("## Synthetic Validation");
  lines.push("");
  report.syntheticValidation.forEach((entry) => {
    lines.push(`### ${entry.mode} | Level ${entry.level} | ${entry.trials} trials`);
    lines.push(`- Score: ${entry.yourScore} vs chance ${entry.chanceScore}`);
    lines.push(`- Overall P: ${entry.overallP} (${entry.overallMethod})`);
    lines.push(`- 20-trial checkpoint: ${entry.twentyTrialCheckpoint}`);
    if (entry.significanceProjection) {
      lines.push(`- Projection to P < .01: ${entry.significanceProjection.trialCount} trials, projected P = ${entry.significanceProjection.pValue}`);
    } else {
      lines.push("- Projection to P < .01: not reached within current ceiling");
    }
    if (entry.highlyPersuasiveProjection) {
      lines.push(`- Projection to highly persuasive: ${entry.highlyPersuasiveProjection.trialCount} trials, projected P = ${entry.highlyPersuasiveProjection.pValue}`);
    } else {
      lines.push("- Projection to highly persuasive: not reached within current ceiling");
    }
    if (entry.practiceTrend && entry.practiceTrend.eligible) {
      lines.push(`- Practice trend: slope ${entry.practiceTrend.slope}, one-tailed P = ${entry.practiceTrend.pValue}, R^2 = ${entry.practiceTrend.rSquared}`);
    } else if (entry.practiceTrend) {
      lines.push(`- Practice trend: needs ${entry.practiceTrend.minimumTrials} trials`);
    }
    lines.push("");
  });
  lines.push("## Special Scenarios");
  lines.push("");
  lines.push("### Improving Scenario");
  lines.push(`- Trials: ${report.improvingScenario.summary.trials}`);
  lines.push(`- Overall P: ${report.improvingScenario.summary.overallP}`);
  if (report.improvingScenario.summary.practiceTrend?.eligible) {
    lines.push(`- Practice trend: slope ${report.improvingScenario.summary.practiceTrend.slope}, one-tailed P = ${report.improvingScenario.summary.practiceTrend.pValue}, R^2 = ${report.improvingScenario.summary.practiceTrend.rSquared}`);
  }
  lines.push("");
  lines.push("### Mixed Scenario");
  lines.push(`- Trials: ${report.mixedScenario.summary.trials}`);
  lines.push(`- Overall P: ${report.mixedScenario.summary.overallP}`);
  if (report.mixedScenario.summary.practiceTrend?.eligible) {
    lines.push(`- Practice trend: slope ${report.mixedScenario.summary.practiceTrend.slope}, one-tailed P = ${report.mixedScenario.summary.practiceTrend.pValue}, R^2 = ${report.mixedScenario.summary.practiceTrend.rSquared}`);
  }
  lines.push("");
  return lines.join("\n");
}

function writeValidationReportFiles(report) {
  ensureValidationReportsRoot();
  const stamp = buildTimestampSlug();
  const jsonPath = path.join(validationReportsRoot, `target-policy-${stamp}.json`);
  const markdownPath = path.join(validationReportsRoot, `target-policy-${stamp}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, `${buildMarkdownReport(report)}\n`, "utf8");
  return { jsonPath, markdownPath };
}

function validateCurrentCsvs() {
  const files = [
    "rx-demo-level1-too-little-receiver__tx-demo-level1-too-little-sender.csv",
    "rx-demo-level1-promising-receiver__tx-demo-level1-promising-sender.csv",
    "rx-demo-level1-not-telepathic-receiver__tx-demo-level1-not-telepathic-sender.csv",
    "rx-demo-level1-telepathic-receiver__tx-demo-level1-telepathic-sender.csv",
    "rx-demo-mixed-level123-receiver__tx-demo-mixed-level123-sender.csv",
    "rx-sea-gypsy__tx-big-bopper.csv",
    "rx-big-bopper__tx-sea-gypsy.csv"
  ];
  return files
    .map((file) => {
      const fullPath = path.join(privatePairsRoot, file);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      const records = loadCsvRecords(fullPath);
      return {
        file,
        analysis: summarizeRecords(records)
      };
    })
    .filter(Boolean)
    .map((entry) => ({
      file: entry.file,
      summary: {
        trials: entry.analysis.summaryStats.totalTrials,
        overallP: formatProbabilityValueSignificant(entry.analysis.overallSignificance.pValue, 3),
        levels: getLevelStatsList(entry.analysis.levelBreakdown).map((level) => ({
          level: level.level,
          completedTrials: level.completed_trials,
          yourScore: formatScoreValue(level.your_score),
          chanceScore: formatScoreValue(level.chance_score),
          pValue: formatProbabilityValueSignificant(level.p_value, 3)
        }))
      }
    }));
}

function main() {
  const frequencyChecks = [
    simulateLevelFrequency(1, 200000),
    simulateLevelFrequency(2, 200000),
    simulateLevelFrequency(3, 200000)
  ];

  const syntheticSessions = [
    simulateSyntheticSession(1, 20, "chance"),
    simulateSyntheticSession(1, 20, "biased", 0.7),
    simulateSyntheticSession(1, 25, "perfect"),
    simulateSyntheticSession(2, 40, "chance"),
    simulateSyntheticSession(2, 40, "biased", 0.32),
    simulateSyntheticSession(3, 40, "chance"),
    simulateSyntheticSession(3, 40, "biased", 0.22),
    simulateSyntheticSession(4, 40, "chance")
  ];

  const improvingLevelOne = [];
  for (let block = 0; block < 5; block += 1) {
    const p = 0.45 + (block * 0.1);
    for (let trial = 0; trial < 8; trial += 1) {
      const targetLayout = targetSelection.pickTargetLayoutNumber(1);
      const responseValue = buildBiasedResponse(1, targetLayout, Math.min(p, 0.95));
      improvingLevelOne.push(createSyntheticRecord(1, targetLayout, responseValue, improvingLevelOne.length));
    }
  }
  const improvingScenario = {
    label: "level1-improving-blocks",
    analysis: summarizeRecords(improvingLevelOne)
  };

  const mixedScenario = simulateMixedSession(
    [1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,1,1,2,2,3,3],
    {
      1: { mode: "biased", exactHitProbability: 0.68 },
      2: { mode: "biased", exactHitProbability: 0.24 },
      3: { mode: "biased", exactHitProbability: 0.18 }
    }
  );

  const report = {
    buildVersion: targetSelection.buildVersion,
    policySnapshot: {
      level1: targetSelection.getPolicy(1),
      level2: targetSelection.getPolicy(2),
      level3: targetSelection.getPolicy(3),
      level4: targetSelection.getPolicy(4)
    },
    frequencyChecks,
    currentCsvValidation: validateCurrentCsvs(),
    syntheticValidation: syntheticSessions.map(summarizeForDisplay),
    improvingScenario: {
      label: improvingScenario.label,
      summary: summarizeForDisplay({ mode: improvingScenario.label, level: 1, analysis: improvingScenario.analysis })
    },
    mixedScenario: {
      summary: summarizeForDisplay({ mode: "mixed", analysis: mixedScenario.analysis })
    }
  };

  const written = writeValidationReportFiles(report);
  report.outputFiles = written;
  console.log(JSON.stringify(report, null, 2));
}

main();
