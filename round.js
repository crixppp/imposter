function startRound() {
  const players = normalizedPlayers();
  const error = validatePlayers(players);

  if (error) {
    state.error = error;
    render();
    return;
  }

  const secret = pickSecretWord(selectedCategoryKeys(), state.settings.difficulty);
  const imposterIds = shuffle(players.map((player) => player.id)).slice(0, state.settings.imposterCount);
  const assignedPlayers = players.map((player) => ({
    ...player,
    role: imposterIds.includes(player.id) ? "imposter" : "player",
    vote: null
  }));

  state.round = {
    players: assignedPlayers,
    secretWord: secret.word,
    hintWord: secret.hint,
    categoryKey: secret.categoryKey,
    categoryLabel: secret.categoryLabel,
    difficulty: state.settings.difficulty,
    mode: state.settings.mode,
    currentClueRound: 1,
    totalClueRounds: state.settings.roundCount,
    currentRevealIndex: 0,
    revealOpen: false,
    clueOrder: balancedClueOrder(assignedPlayers),
    clueIndex: 0,
    voteIndex: 0,
    voteOpen: false,
    pendingVoteId: null,
    voteCandidates: null,
    votes: {},
    tiedIds: [],
    tieRound: 0,
    accusedId: null,
    accusationRevealed: false,
    finalGuess: "",
    remainingSeconds: state.settings.discussionSeconds,
    result: null,
    scoreApplied: false
  };

  state.error = "";
  state.phase = "reveal";
  render();
}

function beginVoting(candidateIds) {
  clearTimer();
  state.round.voteIndex = 0;
  state.round.voteOpen = false;
  state.round.pendingVoteId = null;
  state.round.votes = {};
  state.round.voteCandidates = Array.isArray(candidateIds) && candidateIds.length ? candidateIds : null;
  state.round.tieRound = state.round.voteCandidates ? state.round.tieRound + 1 : 0;
  state.phase = "voting";
  render();
}

function castVote(accusedId) {
  const voter = state.round.players[state.round.voteIndex];
  state.round.votes[voter.id] = accusedId;
  state.round.voteOpen = false;
  state.round.pendingVoteId = null;
  state.round.voteIndex += 1;

  if (state.round.voteIndex >= state.round.players.length) {
    resolveVotes();
  } else {
    render();
  }
}

function resolveVotes() {
  const counts = getVoteCounts();
  const highScore = Math.max(...Object.values(counts));
  const tiedIds = Object.entries(counts)
    .filter((entry) => entry[1] === highScore)
    .map((entry) => Number(entry[0]));

  state.round.tiedIds = tiedIds;

  if (tiedIds.length === 1) {
    state.round.accusedId = tiedIds[0];
    state.phase = "accusation";
  } else {
    state.phase = "tie";
  }

  render();
}

function resolveFinalGuess() {
  const guess = normalizeGuess(state.round.finalGuess);
  const answer = normalizeGuess(state.round.secretWord);

  if (!guess) {
    state.error = "Enter the imposter's final guess.";
    render();
    return;
  }

  const winner = guess === answer ? "imposters" : "players";
  const reason = guess === answer
    ? "The imposter guessed the word."
    : "The imposter missed the word.";

  finishRound(winner, reason);
}

function finishRound(winner, reason) {
  state.round.result = { winner, reason };
  state.phase = "result";
  applyScore();
  saveScores();
  render();
}

function applyScore() {
  if (state.round.scoreApplied) return;

  const winner = state.round.result.winner;
  const accused = getPlayer(state.round.accusedId);
  const accusedWrong = accused && accused.role !== "imposter";

  for (const player of state.round.players) {
    if (!state.scores[player.name]) {
      state.scores[player.name] = 0;
    }

    if (winner === "players" && player.role === "player") {
      state.scores[player.name] += 1;
    }

    if (winner === "imposters" && player.role === "imposter") {
      state.scores[player.name] += accusedWrong ? 2 : 1;
    }
  }

  state.round.scoreApplied = true;
}
