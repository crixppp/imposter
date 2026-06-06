function getRoleCard(player) {
  if (player.role === "player") {
    return {
      kind: "player",
      title: state.round.secretWord,
      detail: "Give a clue that proves you know it without giving it away."
    };
  }

  if (state.round.mode === "hinted") {
    return {
      kind: "imposter",
      title: state.round.hintWord,
      detail: "You are imposter. This single-word hint is related to the secret word."
    };
  }

  if (state.round.mode === "category") {
    return {
      kind: "imposter",
      title: "You are imposter",
      detail: `Category: ${state.round.categoryLabel}. Blend in and guess the word.`
    };
  }

  return {
    kind: "imposter",
    title: "You are imposter",
    detail: "Blend in, listen closely, and try to guess the word."
  };
}

function normalizedPlayers() {
  return state.names
    .slice(0, state.settings.playerCount)
    .map((name, index) => ({
      id: index + 1,
      name: name.trim() || `Player ${index + 1}`
    }));
}

function validatePlayers(players) {
  if (players.length < 4) {
    return "Use at least 4 players.";
  }

  const names = players.map((player) => player.name.toLowerCase());
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);

  if (duplicate) {
    return "Player names must be unique.";
  }

  return "";
}

function pickSecretWord(categoryKeys, difficulty) {
  const pool = getWordPool(categoryKeys, difficulty);
  let available = pool.filter((item) => !state.usedWordKeys.includes(item.key));

  if (!available.length) {
    const poolKeys = pool.map((item) => item.key);
    state.usedWordKeys = state.usedWordKeys.filter((key) => !poolKeys.includes(key));
    available = pool;
  }

  const picked = sample(available);
  state.usedWordKeys.push(picked.key);

  return {
    word: wordText(picked.entry),
    hint: wordHint(picked.entry),
    categoryKey: picked.categoryKey,
    categoryLabel: picked.category.label
  };
}

function getWordPool(categoryKeys, difficulty) {
  return categoryKeys.flatMap((categoryKey) => {
    const category = WORD_BANK[categoryKey];
    return category.words[difficulty].map((entry) => ({
      key: makeWordKey(categoryKey, difficulty, wordText(entry)),
      categoryKey,
      category,
      entry
    }));
  });
}

function makeWordKey(categoryKey, difficulty, word) {
  return `${categoryKey}:${difficulty}:${normalizeGuess(word)}`;
}

function balancedClueOrder(players) {
  const order = shuffle(players);
  const last = order[order.length - 1];

  if (last && last.role === "imposter" && order.length > 4) {
    const swapIndex = Math.floor(order.length / 2);
    order[order.length - 1] = order[swapIndex];
    order[swapIndex] = last;
  }

  return order;
}

function getVoteCandidates(voterId) {
  const allowedIds = state.round.voteCandidates;

  return state.round.players
    .filter((player) => player.id !== voterId)
    .filter((player) => !allowedIds || allowedIds.includes(player.id))
    .map((player) => ({
      ...player,
      displayIndex: state.round.players.findIndex((candidate) => candidate.id === player.id) + 1
    }));
}

function getVoteCounts() {
  const counts = {};
  const candidateIds = state.round.voteCandidates || state.round.players.map((player) => player.id);

  for (const id of candidateIds) {
    counts[id] = 0;
  }

  for (const accusedId of Object.values(state.round.votes)) {
    counts[accusedId] = (counts[accusedId] || 0) + 1;
  }

  return counts;
}

function getPlayer(id) {
  return state.round.players.find((player) => player.id === id);
}

function selectedCategoryKeys() {
  const categories = Array.isArray(state.settings.categories)
    ? state.settings.categories.filter((key) => WORD_BANK[key])
    : [];

  return categories.length ? unique(categories) : ["food"];
}

function selectedCategorySummary() {
  const categories = selectedCategoryKeys();

  if (categories.length === 1) {
    return WORD_BANK[categories[0]].label;
  }

  return categories.length;
}

function sampleWords(categoryKey) {
  const category = WORD_BANK[categoryKey];
  return category.words.medium.slice(0, 3).map(wordText).join(", ");
}

function wordText(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}

function wordHint(entry) {
  const hints = safeHints(entry);
  return hints.length ? sample(hints) : "Mystery";
}

function safeHints(entry) {
  const word = wordText(entry);
  const hints = Array.isArray(entry) && Array.isArray(entry[1]) ? entry[1] : [Array.isArray(entry) ? entry[1] : ""];

  return unique(hints)
    .map((hint) => String(hint || "").trim())
    .filter((hint) => isSafeHint(word, hint));
}

function isSafeHint(word, hint) {
  const normalizedWord = normalizeGuess(word).replaceAll(" ", "");
  const normalizedHint = normalizeGuess(hint).replaceAll(" ", "");
  return Boolean(
    hint &&
    !/\s/.test(hint) &&
    normalizedHint &&
    normalizedHint !== normalizedWord &&
    !normalizedWord.includes(normalizedHint) &&
    !normalizedHint.includes(normalizedWord)
  );
}

function maxImposters(playerCount) {
  if (playerCount >= 11) return 3;
  if (playerCount >= 7) return 2;
  return 1;
}

function toggleTimer() {
  if (state.discussionRunning) {
    clearTimer();
    state.discussionRunning = false;
    render();
    return;
  }

  state.discussionRunning = true;
  clearTimer();
  state.timerId = window.setInterval(() => {
    state.round.remainingSeconds = Math.max(0, state.round.remainingSeconds - 1);

    const timerValue = document.querySelector(".timer-value");
    if (timerValue) {
      timerValue.textContent = formatTime(state.round.remainingSeconds);
    }

    if (state.round.remainingSeconds === 0) {
      clearTimer();
      state.discussionRunning = false;
      render();
    }
  }, 1000);
  render();
}

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
  }
  state.timerId = null;
}

function getScore(name) {
  return state.scores[name.trim()] || 0;
}

function stateHasScores() {
  return Object.keys(state.scores).length > 0;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeGuess(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleCase(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function unique(items) {
  return Array.from(new Set(items));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
