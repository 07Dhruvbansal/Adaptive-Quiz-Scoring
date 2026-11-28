(function (global) {
  const LEARNING_RATE = 0.45;
  const MIN_ABILITY = -3;
  const MAX_ABILITY = 3;
  const BANDS = {
    Easy: { min: -3, max: -0.45 },
    Medium: { min: -0.45, max: 0.55 },
    Hard: { min: 0.55, max: 3 }
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function probabilityCorrect(ability, b) {
    return 1 / (1 + Math.exp(-(ability - b)));
  }

  function difficultyBand(ability) {
    if (ability < BANDS.Easy.max) {
      return "Easy";
    }
    if (ability < BANDS.Hard.min) {
      return "Medium";
    }
    return "Hard";
  }

  function initialAbilityForDifficulty(difficulty) {
    if (difficulty === "Easy") {
      return -1;
    }
    if (difficulty === "Hard") {
      return 1;
    }
    return 0;
  }

  function neighbouringBands(target) {
    if (target === "Easy") {
      return ["Medium", "Hard"];
    }
    if (target === "Hard") {
      return ["Medium", "Easy"];
    }
    return ["Easy", "Hard"];
  }

  function updateAbility(ability, b, isCorrect) {
    const p = probabilityCorrect(ability, b);
    const actual = isCorrect ? 1 : 0;
    const next = ability + LEARNING_RATE * (actual - p);
    return clamp(next, MIN_ABILITY, MAX_ABILITY);
  }

  function selectNextQuestion(bank, usedIds, ability) {
    const unused = bank.filter((q) => !usedIds.has(q.id));
    if (unused.length === 0) {
      return null;
    }

    const target = difficultyBand(ability);
    const order = [target, ...neighbouringBands(target)];

    for (const band of order) {
      const pool = unused.filter((q) => q.difficulty === band);
      if (pool.length > 0) {
        return closestToAbility(pool, ability);
      }
    }

    return closestToAbility(unused, ability);
  }

  function closestToAbility(pool, ability) {
    let closestDistance = Infinity;
    for (const question of pool) {
      closestDistance = Math.min(closestDistance, Math.abs(question.b - ability));
    }
    const closestQuestions = pool.filter((question) => Math.abs(question.b - ability) === closestDistance);
    return closestQuestions[Math.floor(Math.random() * closestQuestions.length)];
  }

  function filterBank(bank, topic) {
    if (!topic || topic === "All topics") {
      return bank.slice();
    }
    return bank.filter((q) => q.topic === topic);
  }

  function calculateAbilityHistory(items, startingAbility) {
    let ability = clamp(startingAbility, MIN_ABILITY, MAX_ABILITY);
    const history = [ability];

    items.forEach((item) => {
      item.abilityBefore = ability;
      if (item.status === "answered") {
        ability = updateAbility(ability, item.question.b, item.isCorrect);
      }
      item.abilityAfter = ability;
      history.push(ability);
    });

    return { ability, history };
  }

  global.AdaptiveEngine = {
    LEARNING_RATE,
    MIN_ABILITY,
    MAX_ABILITY,
    probabilityCorrect,
    difficultyBand,
    initialAbilityForDifficulty,
    updateAbility,
    calculateAbilityHistory,
    selectNextQuestion,
    filterBank
  };
})(window);
