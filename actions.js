function handleInput(event) {
  const target = event.target;

  if (target.matches("[data-player-name]")) {
    const index = Number(target.dataset.playerName);
    state.names[index] = target.value;
    state.error = "";
  }

  if (target.matches("[data-final-guess]")) {
    state.round.finalGuess = target.value;
  }
}

function handleSubmit(event) {
  event.preventDefault();
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const value = button.dataset.value;
  const numericValue = Number(value);

  if (action === "change-count") {
    setPlayerCount(state.settings.playerCount + numericValue);
  }

  if (action === "change-imposters") {
    setImposterCount(state.settings.imposterCount + numericValue);
  }

  if (action === "change-timer") {
    state.settings.discussionSeconds = clamp(
      state.settings.discussionSeconds + numericValue,
      60,
      480
    );
    render();
  }

  if (action === "change-rounds") {
    state.settings.roundCount = clamp(state.settings.roundCount + numericValue, 1, 6);
    render();
  }

  if (action === "toggle-category") {
    toggleCategory(value);
    render();
  }

  if (action === "set-difficulty") {
    state.settings.difficulty = value;
    render();
  }

  if (action === "set-mode") {
    state.settings.mode = value;
    render();
  }

  if (action === "open-rules") {
    state.rulesOpen = true;
    render();
  }

  if (action === "close-rules") {
    state.rulesOpen = false;
    render();
  }

  if (action === "start-round") {
    state.rulesOpen = false;
    startRound();
  }

  if (action === "reveal-role") {
    state.round.revealOpen = true;
    render();
  }

  if (action === "hide-role") {
    state.round.revealOpen = false;
    state.round.currentRevealIndex += 1;
    if (state.round.currentRevealIndex >= state.round.players.length) {
      state.phase = "clues";
    }
    render();
  }

  if (action === "prev-speaker") {
    if (state.round.clueIndex > 0) {
      state.round.clueIndex -= 1;
    } else if (state.round.currentClueRound > 1) {
      state.round.currentClueRound -= 1;
      state.round.clueIndex = state.round.clueOrder.length - 1;
    }
    render();
  }

  if (action === "next-speaker") {
    const isLastSpeaker = state.round.clueIndex === state.round.clueOrder.length - 1;
    const hasAnotherClueRound = state.round.currentClueRound < state.round.totalClueRounds;

    if (isLastSpeaker && hasAnotherClueRound) {
      state.round.currentClueRound += 1;
      state.round.clueIndex = 0;
    } else {
      state.round.clueIndex = Math.min(
        state.round.clueOrder.length - 1,
        state.round.clueIndex + 1
      );
    }
    render();
  }

  if (action === "discussion") {
    state.phase = "discussion";
    state.round.remainingSeconds = state.settings.discussionSeconds;
    state.discussionRunning = false;
    clearTimer();
    render();
  }

  if (action === "toggle-timer") {
    toggleTimer();
  }

  if (action === "reset-timer") {
    clearTimer();
    state.discussionRunning = false;
    state.round.remainingSeconds = state.settings.discussionSeconds;
    render();
  }

  if (action === "voting") {
    clearTimer();
    beginVoting(null);
  }

  if (action === "show-vote") {
    state.round.voteOpen = true;
    state.round.pendingVoteId = null;
    render();
  }

  if (action === "select-vote") {
    state.round.pendingVoteId = Number(value);
    render();
  }

  if (action === "clear-vote") {
    state.round.pendingVoteId = null;
    render();
  }

  if (action === "confirm-vote") {
    if (state.round.pendingVoteId) {
      castVote(state.round.pendingVoteId);
    }
  }

  if (action === "revote") {
    const tiedIds = state.round.tiedIds || [];
    beginVoting(tiedIds);
  }

  if (action === "imposter-tie-win") {
    finishRound("imposters", "The vote stayed tied.");
  }

  if (action === "set-accused") {
    state.round.accusedId = Number(value);
    state.phase = "accusation";
    render();
  }

  if (action === "reveal-accused") {
    state.round.accusationRevealed = true;
    const accused = getPlayer(state.round.accusedId);
    if (accused.role !== "imposter") {
      finishRound("imposters", `${accused.name} was not an imposter.`);
    } else {
      render();
    }
  }

  if (action === "final-guess") {
    state.phase = "finalGuess";
    render();
  }

  if (action === "submit-final-guess") {
    resolveFinalGuess();
  }

  if (action === "same-group") {
    state.phase = "setup";
    state.error = "";
    state.rulesOpen = false;
    state.round = null;
    render();
  }

  if (action === "new-game") {
    clearTimer();
    state.phase = "setup";
    state.round = null;
    state.error = "";
    state.rulesOpen = false;
    state.settings = {
      playerCount: 5,
      imposterCount: 1,
      roundCount: 3,
      categories: ["food"],
      difficulty: "medium",
      mode: "classic",
      discussionSeconds: 120
    };
    state.names = DEFAULT_NAMES.slice(0, 5);
    state.history = [];
    state.usedWordKeys = [];
    saveHistory();
    render();
  }

  if (action === "reset-scores") {
    state.scores = {};
    saveScores();
    render();
  }
}

function setPlayerCount(count) {
  const nextCount = clamp(count, 4, DEFAULT_NAMES.length);
  state.settings.playerCount = nextCount;

  while (state.names.length < nextCount) {
    state.names.push(DEFAULT_NAMES[state.names.length] || `Player ${state.names.length + 1}`);
  }

  state.names = state.names.slice(0, nextCount);
  state.settings.imposterCount = Math.min(state.settings.imposterCount, maxImposters(nextCount));
  state.error = "";
  render();
}

function setImposterCount(count) {
  state.settings.imposterCount = clamp(count, 1, maxImposters(state.settings.playerCount));
  render();
}

function toggleCategory(categoryKey) {
  const categories = selectedCategoryKeys();

  if (!WORD_BANK[categoryKey]) return;

  if (categories.includes(categoryKey)) {
    state.settings.categories = categories.length === 1
      ? categories
      : categories.filter((key) => key !== categoryKey);
    return;
  }

  state.settings.categories = [...categories, categoryKey];
}
