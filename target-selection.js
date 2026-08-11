((rootFactory) => {
  const root = typeof globalThis !== "undefined"
    ? globalThis
    : (typeof window !== "undefined" ? window : this);
  const api = rootFactory(root);
  root.EspGymTargetSelection = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})((root) => {
  const layouts = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 36, y: 50 }, { x: 64, y: 50 }],
    3: [{ x: 38, y: 62 }, { x: 62, y: 38 }],
    4: [{ x: 50, y: 36 }, { x: 50, y: 64 }],
    5: [{ x: 38, y: 38 }, { x: 62, y: 62 }],
    6: [{ x: 24, y: 50 }, { x: 50, y: 50 }, { x: 76, y: 50 }],
    7: [{ x: 26, y: 70 }, { x: 50, y: 50 }, { x: 74, y: 30 }],
    8: [{ x: 50, y: 24 }, { x: 50, y: 50 }, { x: 50, y: 76 }],
    9: [{ x: 28, y: 28 }, { x: 50, y: 50 }, { x: 72, y: 72 }]
  };

  const levelPolicies = {
    1: {
      level: 1,
      manyProbability: 0.5,
      exactLayoutNumbers: [1, 6, 7, 8, 9],
      oneLayoutNumbers: [1],
      manyLayoutNumbers: [6, 7, 8, 9],
      responseOptions: ["one", "many"],
      exactCorrectProbability: 0.5
    },
    2: {
      level: 2,
      manyProbability: 0.5,
      exactLayoutNumbers: [1, 6, 7, 8, 9],
      oneLayoutNumbers: [1],
      manyLayoutNumbers: [6, 7, 8, 9],
      responseOptions: [
        "one",
        "many horizontal",
        "many vertical",
        "many diagonal up",
        "many diagonal down"
      ],
      exactCorrectProbability: 1 / 5
    },
    3: {
      level: 3,
      manyProbability: 0.5,
      exactLayoutNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      oneLayoutNumbers: [1],
      manyLayoutNumbers: [2, 3, 4, 5, 6, 7, 8, 9],
      responseOptions: [
        "one",
        "many horizontal 2",
        "many vertical 2",
        "many diagonal 2 up",
        "many diagonal 2 down",
        "many horizontal 3",
        "many vertical 3",
        "many diagonal 3 up",
        "many diagonal 3 down"
      ],
      exactCorrectProbability: 1 / 9
    },
    4: {
      level: 4,
      withoutReplacementPerCycle: true,
      exactCorrectProbability: 0.5
    }
  };

  function cloneArray(values) {
    return Array.isArray(values) ? values.slice() : [];
  }

  function normalizeLevel(level) {
    const numericLevel = Number(level);
    return numericLevel >= 1 && numericLevel <= 4 ? numericLevel : 1;
  }

  function getPolicy(level) {
    return levelPolicies[normalizeLevel(level)] || levelPolicies[1];
  }

  function getLayoutConeCount(layoutNumber) {
    const layout = layouts[Number(layoutNumber)];
    return Array.isArray(layout) ? layout.length : 0;
  }

  function getLayoutOrientation(layoutNumber) {
    switch (Number(layoutNumber)) {
      case 2:
      case 6:
        return "horizontal";
      case 4:
      case 8:
        return "vertical";
      case 3:
      case 7:
        return "diagonal-up";
      case 5:
      case 9:
        return "diagonal-down";
      default:
        return "";
    }
  }

  function getLevelOneCountChoiceFromLayoutNumber(layoutNumber) {
    return getLayoutConeCount(layoutNumber) === 1 ? 1 : (getLayoutConeCount(layoutNumber) === 3 ? 3 : null);
  }

  function getLevelResponseToken(level, layoutNumber) {
    const normalizedLevel = normalizeLevel(level);
    const coneCount = getLayoutConeCount(layoutNumber);
    if (coneCount < 1) {
      return "";
    }
    if (coneCount === 1) {
      return "one";
    }
    const orientation = getLayoutOrientation(layoutNumber);
    if (!orientation) {
      return "";
    }
    if (normalizedLevel === 1) {
      return "many";
    }
    if (normalizedLevel === 2) {
      return `many ${orientation.replace("-", " ")}`;
    }
    if (normalizedLevel === 3) {
      if (orientation === "diagonal-up") {
        return `many diagonal ${coneCount} up`;
      }
      if (orientation === "diagonal-down") {
        return `many diagonal ${coneCount} down`;
      }
      return `many ${orientation} ${coneCount}`;
    }
    return "";
  }

  function getAllowedTargetLayoutNumbers(level) {
    const policy = getPolicy(level);
    return cloneArray(policy.exactLayoutNumbers);
  }

  function getManyTargetLayoutNumbers(level) {
    const policy = getPolicy(level);
    return cloneArray(policy.manyLayoutNumbers);
  }

  function getResponseOptions(level) {
    const policy = getPolicy(level);
    return cloneArray(policy.responseOptions);
  }

  function getExactCorrectProbability(level) {
    return Number(getPolicy(level).exactCorrectProbability || 0);
  }

  function getBernoulliNullPmf(level) {
    const exactProbability = getExactCorrectProbability(level);
    if (!(exactProbability >= 0 && exactProbability <= 1)) {
      return null;
    }
    return new Map([
      [0, 1 - exactProbability],
      [1, exactProbability]
    ]);
  }

  function randomInt(min, max) {
    if (root.crypto && typeof root.crypto.getRandomValues === "function") {
      const values = new Uint32Array(1);
      root.crypto.getRandomValues(values);
      return min + (values[0] % (max - min + 1));
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function chooseUniform(values) {
    if (!Array.isArray(values) || values.length < 1) {
      return null;
    }
    return values[randomInt(0, values.length - 1)];
  }

  function pickTargetLayoutNumber(level) {
    const normalizedLevel = normalizeLevel(level);
    const policy = getPolicy(normalizedLevel);
    if (normalizedLevel === 4) {
      return null;
    }
    const useMany = randomInt(0, 1) === 1;
    if (useMany) {
      return chooseUniform(policy.manyLayoutNumbers);
    }
    return chooseUniform(policy.oneLayoutNumbers);
  }

  return {
    buildVersion: "20260811a",
    layouts,
    normalizeLevel,
    getPolicy,
    getLayoutConeCount,
    getLayoutOrientation,
    getLevelOneCountChoiceFromLayoutNumber,
    getLevelResponseToken,
    getAllowedTargetLayoutNumbers,
    getManyTargetLayoutNumbers,
    getResponseOptions,
    getExactCorrectProbability,
    getBernoulliNullPmf,
    pickTargetLayoutNumber
  };
});
