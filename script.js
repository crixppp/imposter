const STORAGE_KEY = "imposter-scores-v1";

const DEFAULT_NAMES = [
  "Alex",
  "Blair",
  "Casey",
  "Drew",
  "Ellis",
  "Frankie",
  "Gray",
  "Harper",
  "Indie",
  "Jules",
  "Kai",
  "Logan"
];

const WORD_BANK = {
  food: {
    label: "Food",
    words: {
      easy: ["Pizza", "Burger", "Banana", "Pancakes", "Cereal", "Ice cream", "Popcorn", "Hot chips"],
      medium: ["Sushi", "Ramen", "Tacos", "Curry", "Dumplings", "Pasta", "Smoothie", "Lasagne"],
      hard: ["Tiramisu", "Risotto", "Bao", "Kombucha", "Falafel", "Croissant", "Miso soup", "Gnocchi"]
    }
  },
  animals: {
    label: "Animals",
    words: {
      easy: ["Dog", "Cat", "Shark", "Penguin", "Kangaroo", "Horse", "Snake", "Rabbit"],
      medium: ["Octopus", "Wombat", "Flamingo", "Chameleon", "Meerkat", "Gorilla", "Jellyfish", "Koala"],
      hard: ["Axolotl", "Narwhal", "Capybara", "Platypus", "Lemur", "Mantis", "Alpaca", "Pangolin"]
    }
  },
  places: {
    label: "Places",
    words: {
      easy: ["Beach", "School", "Cinema", "Airport", "Hospital", "Park", "Zoo", "Library"],
      medium: ["Supermarket", "Campsite", "Museum", "Dentist", "Stadium", "Bakery", "Gym", "Train station"],
      hard: ["Embassy", "Observatory", "Courtroom", "Vineyard", "Cathedral", "Arcade", "Harbour", "Gallery"]
    }
  },
  objects: {
    label: "Objects",
    words: {
      easy: ["Phone", "Chair", "Umbrella", "Backpack", "Candle", "Mirror", "Keys", "Toothbrush"],
      medium: ["Suitcase", "Blender", "Headphones", "Skateboard", "Passport", "Remote", "Blanket", "Laptop"],
      hard: ["Compass", "Typewriter", "Telescope", "Incense", "Record player", "Projector", "Thermos", "Tripod"]
    }
  },
  movies: {
    label: "Movies",
    words: {
      easy: ["Shrek", "Titanic", "Barbie", "Frozen", "Avatar", "Jaws", "Toy Story", "The Lion King"],
      medium: ["Spider-Man", "Inception", "Jumanji", "The Matrix", "Jurassic Park", "Mean Girls", "La La Land", "Finding Nemo"],
      hard: ["Parasite", "Interstellar", "Whiplash", "Casablanca", "Spirited Away", "Memento", "Nope", "Dune"]
    }
  },
  brands: {
    label: "Brands",
    words: {
      easy: ["Nike", "Apple", "McDonald's", "Kmart", "Lego", "Coca-Cola", "YouTube", "Google"],
      medium: ["Netflix", "Spotify", "Nintendo", "IKEA", "Tesla", "Uber", "Adidas", "PlayStation"],
      hard: ["Patagonia", "Duolingo", "Supreme", "Rolex", "Airbnb", "Canva", "Red Bull", "Starbucks"]
    }
  },
  jobs: {
    label: "Jobs",
    words: {
      easy: ["Doctor", "Teacher", "Chef", "Firefighter", "Pilot", "Nurse", "Builder", "Singer"],
      medium: ["Dentist", "Architect", "Journalist", "Mechanic", "Florist", "Designer", "Lawyer", "Librarian"],
      hard: ["Archaeologist", "Paramedic", "Barista", "Diplomat", "Tailor", "Magician", "Translator", "Producer"]
    }
  },
  moments: {
    label: "Moments",
    words: {
      easy: ["Birthday", "Holiday", "Picnic", "Bedtime", "Party", "Dinner", "Rainy day", "Sleepover"],
      medium: ["First date", "Road trip", "Exam day", "House move", "Wedding", "Camping", "Job interview", "Concert"],
      hard: ["Nostalgia", "Reunion", "Deadline", "Confession", "Awkward silence", "Inside joke", "Plot twist", "Bad haircut"]
    }
  }
};

const MODE_COPY = {
  classic: {
    label: "Classic",
    note: "Imposters know they are imposters."
  },
  dark: {
    label: "In the Dark",
    note: "Imposters receive a decoy word."
  },
  category: {
    label: "Category Only",
    note: "Imposters see only the category."
  }
};

const state = {
  phase: "setup",
  settings: {
    playerCount: 5,
    imposterCount: 1,
    category: "food",
    difficulty: "medium",
    mode: "classic",
    discussionSeconds: 120
  },
  names: DEFAULT_NAMES.slice(0, 5),
  scores: loadScores(),
  error: "",
  round: null,
  timerId: null,
  discussionRunning: false
};

const app = document.querySelector("#app");
const topbarActions = document.querySelector("#topbar-actions");

app.addEventListener("click", handleClick);
app.addEventListener("input", handleInput);
app.addEventListener("submit", handleSubmit);
topbarActions.addEventListener("click", handleClick);

render();

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

  if (action === "set-category") {
    state.settings.category = value;
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

  if (action === "randomize-names") {
    state.names = shuffle(DEFAULT_NAMES).slice(0, state.settings.playerCount);
    render();
  }

  if (action === "start-round") {
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
    state.round.clueIndex = Math.max(0, state.round.clueIndex - 1);
    render();
  }

  if (action === "next-speaker") {
    state.round.clueIndex = Math.min(
      state.round.clueOrder.length - 1,
      state.round.clueIndex + 1
    );
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
    render();
  }

  if (action === "cast-vote") {
    castVote(Number(value));
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
    state.round = null;
    render();
  }

  if (action === "new-game") {
    clearTimer();
    state.phase = "setup";
    state.round = null;
    state.error = "";
    state.settings = {
      playerCount: 5,
      imposterCount: 1,
      category: "food",
      difficulty: "medium",
      mode: "classic",
      discussionSeconds: 120
    };
    state.names = DEFAULT_NAMES.slice(0, 5);
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

function startRound() {
  const players = normalizedPlayers();
  const error = validatePlayers(players);

  if (error) {
    state.error = error;
    render();
    return;
  }

  const category = WORD_BANK[state.settings.category];
  const word = pickWord(state.settings.category, state.settings.difficulty);
  const decoyWord = pickDecoyWord(state.settings.category, state.settings.difficulty, word);
  const imposterIds = shuffle(players.map((player) => player.id)).slice(0, state.settings.imposterCount);
  const assignedPlayers = players.map((player) => ({
    ...player,
    role: imposterIds.includes(player.id) ? "imposter" : "player",
    vote: null
  }));

  state.round = {
    players: assignedPlayers,
    secretWord: word,
    decoyWord,
    categoryKey: state.settings.category,
    categoryLabel: category.label,
    difficulty: state.settings.difficulty,
    mode: state.settings.mode,
    currentRevealIndex: 0,
    revealOpen: false,
    clueOrder: balancedClueOrder(assignedPlayers),
    clueIndex: 0,
    voteIndex: 0,
    voteOpen: false,
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

function render() {
  renderTopbar();

  if (state.phase === "setup") {
    app.innerHTML = renderSetup();
  }

  if (state.phase === "reveal") {
    app.innerHTML = renderReveal();
  }

  if (state.phase === "clues") {
    app.innerHTML = renderClues();
  }

  if (state.phase === "discussion") {
    app.innerHTML = renderDiscussion();
  }

  if (state.phase === "voting") {
    app.innerHTML = renderVoting();
  }

  if (state.phase === "tie") {
    app.innerHTML = renderTie();
  }

  if (state.phase === "accusation") {
    app.innerHTML = renderAccusation();
  }

  if (state.phase === "finalGuess") {
    app.innerHTML = renderFinalGuess();
  }

  if (state.phase === "result") {
    app.innerHTML = renderResult();
  }
}

function renderTopbar() {
  if (state.phase === "setup") {
    topbarActions.innerHTML = `
      <button class="primary" data-action="start-round">Start round</button>
      ${stateHasScores() ? `<button class="icon-button" data-action="reset-scores" title="Reset scores" aria-label="Reset scores">x</button>` : ""}
    `;
    return;
  }

  topbarActions.innerHTML = `
    <button class="secondary" data-action="same-group">Setup</button>
    <button class="secondary" data-action="new-game">New game</button>
  `;
}

function renderSetup() {
  const category = WORD_BANK[state.settings.category];
  const errorClass = state.error ? " visible" : "";

  return `
    <section class="screen split">
      <div>
        <div class="setup-band" aria-label="Round setup">
          ${renderMetric("Players", state.settings.playerCount)}
          ${renderMetric("Imposters", state.settings.imposterCount)}
          ${renderMetric("Category", category.label)}
          ${renderMetric("Timer", formatTime(state.settings.discussionSeconds))}
        </div>

        <form class="panel" autocomplete="off">
          <div class="panel-head">
            <div>
              <h1>imposter</h1>
              <p class="subcopy">Pass the phone, hide the word, catch the fake.</p>
            </div>
            <span class="tag mint">${MODE_COPY[state.settings.mode].label}</span>
          </div>
          <div class="panel-body">
            <div class="field-grid">
              <label class="field">
                <span class="field-label">Players</span>
                ${renderStepper("change-count", state.settings.playerCount, 4, DEFAULT_NAMES.length)}
              </label>

              <label class="field">
                <span class="field-label">Imposters</span>
                ${renderStepper("change-imposters", state.settings.imposterCount, 1, maxImposters(state.settings.playerCount))}
              </label>

              <label class="field">
                <span class="field-label">Discussion</span>
                ${renderStepper("change-timer", `${Math.round(state.settings.discussionSeconds / 60)} min`, 1, 8, 60)}
              </label>

              <div class="field">
                <span class="field-label">Difficulty</span>
                <div class="segmented">
                  ${["easy", "medium", "hard"].map((difficulty) => renderChoice("set-difficulty", difficulty, titleCase(difficulty), "", state.settings.difficulty === difficulty)).join("")}
                </div>
              </div>

              <div class="field-wide">
                <span class="field-label">Category</span>
                <div class="option-grid">
                  ${Object.entries(WORD_BANK).map(([key, item]) => renderChoice("set-category", key, item.label, sampleWords(key), state.settings.category === key)).join("")}
                </div>
              </div>

              <div class="field-wide">
                <span class="field-label">Mode</span>
                <div class="segmented">
                  ${Object.entries(MODE_COPY).map(([key, item]) => renderChoice("set-mode", key, item.label, item.note, state.settings.mode === key)).join("")}
                </div>
              </div>
            </div>

            <div class="error${errorClass}">${escapeHtml(state.error)}</div>

            <div class="actions">
              <button class="primary" type="button" data-action="start-round">Start round</button>
              <button class="secondary" type="button" data-action="randomize-names">Shuffle names</button>
            </div>
          </div>
        </form>
      </div>

      <aside class="panel">
        <div class="panel-head">
          <h2>Players</h2>
          <span class="tag yellow">${state.settings.playerCount} seats</span>
        </div>
        <div class="panel-body">
          <div class="player-list">
            ${state.names.map((name, index) => `
              <label class="player-row">
                <span class="index-pill">${index + 1}</span>
                <input data-player-name="${index}" value="${escapeAttr(name)}" aria-label="Player ${index + 1} name" maxlength="18">
                <span class="score-pill">${getScore(name)}</span>
              </label>
            `).join("")}
          </div>
          ${renderScoreList()}
        </div>
      </aside>
    </section>
  `;
}

function renderReveal() {
  const round = state.round;
  const player = round.players[round.currentRevealIndex];

  if (!round.revealOpen) {
    return `
      <section class="stage">
        <div class="focus-panel dark">
          <span class="focus-kicker">Player ${round.currentRevealIndex + 1} of ${round.players.length}</span>
          <div class="giant-name">${escapeHtml(player.name)}</div>
          <p class="subcopy">Take the phone where only you can see it.</p>
          <button class="primary" data-action="reveal-role">Reveal role</button>
        </div>
      </section>
    `;
  }

  const roleCard = getRoleCard(player);
  const roleClass = roleCard.kind === "player" ? "secret-word" : "imposter-card";

  return `
    <section class="stage">
      <div class="focus-panel ${roleClass}">
        <span class="focus-kicker">${escapeHtml(player.name)}</span>
        <div class="giant-word">${escapeHtml(roleCard.title)}</div>
        <p class="subcopy">${escapeHtml(roleCard.detail)}</p>
        <button class="primary" data-action="hide-role">${round.currentRevealIndex === round.players.length - 1 ? "Finish reveals" : "Hide and pass"}</button>
      </div>
    </section>
  `;
}

function renderClues() {
  const current = state.round.clueOrder[state.round.clueIndex];
  const isLast = state.round.clueIndex === state.round.clueOrder.length - 1;

  return `
    <section class="screen phase-grid">
      <div class="phase-lead yellow">
        <span class="focus-kicker">Clue phase</span>
        <h2>${escapeHtml(current.name)} speaks now</h2>
        <p class="subcopy">One clue each. No spelling, rhymes, translations, or saying the word.</p>
        <div class="reveal-strip">
          <span class="rule-chip">Category: ${escapeHtml(state.round.categoryLabel)}</span>
          <span class="rule-chip">${escapeHtml(MODE_COPY[state.round.mode].label)}</span>
          <span class="rule-chip">${titleCase(state.round.difficulty)}</span>
        </div>
        <div class="actions">
          <button class="secondary" data-action="prev-speaker" ${state.round.clueIndex === 0 ? "disabled" : ""}>Back</button>
          <button class="secondary" data-action="next-speaker" ${isLast ? "disabled" : ""}>Next speaker</button>
          <button class="primary" data-action="discussion">Discussion</button>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-head">
          <h2>Order</h2>
          <span class="tag blue">${state.round.clueIndex + 1}/${state.round.clueOrder.length}</span>
        </div>
        <div class="panel-body">
          <div class="order-list">
            ${state.round.clueOrder.map((player, index) => {
              const rowClass = index === state.round.clueIndex ? " current" : index < state.round.clueIndex ? " done" : "";
              return `
                <div class="order-row${rowClass}">
                  <span class="index-pill">${index + 1}</span>
                  <strong>${escapeHtml(player.name)}</strong>
                  <span class="tag">${index < state.round.clueIndex ? "Done" : index === state.round.clueIndex ? "Now" : "Ready"}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDiscussion() {
  const runningLabel = state.discussionRunning ? "Pause" : "Start";

  return `
    <section class="screen phase-grid">
      <div class="phase-lead blue">
        <span class="focus-kicker">Discussion</span>
        <div class="timer">
          <div class="timer-value">${formatTime(state.round.remainingSeconds)}</div>
          <p class="subcopy">Ask questions, defend clues, then vote.</p>
        </div>
        <div class="actions">
          <button class="primary" data-action="toggle-timer">${runningLabel}</button>
          <button class="secondary" data-action="reset-timer">Reset</button>
          <button class="secondary" data-action="voting">Vote</button>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-head">
          <h2>Pressure points</h2>
          <span class="tag coral">No word leaks</span>
        </div>
        <div class="panel-body">
          <div class="rules-list">
            ${[
              "Very vague clue",
              "Copied someone else",
              "Wrong category energy",
              "Too quiet",
              "Too confident",
              "Helped the imposter too much"
            ].map((item, index) => `
              <div class="order-row">
                <span class="index-pill">${index + 1}</span>
                <strong>${escapeHtml(item)}</strong>
                <span></span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderVoting() {
  const voter = state.round.players[state.round.voteIndex];
  const candidates = getVoteCandidates(voter.id);

  if (!state.round.voteOpen) {
    return `
      <section class="stage">
        <div class="focus-panel dark">
          <span class="focus-kicker">Vote ${state.round.voteIndex + 1} of ${state.round.players.length}</span>
          <div class="giant-name">${escapeHtml(voter.name)}</div>
          <p class="subcopy">Choose privately, then hand it back face down.</p>
          <button class="primary" data-action="show-vote">Open ballot</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="screen phase-grid">
      <div class="phase-lead coral">
        <span class="focus-kicker">${escapeHtml(voter.name)} votes</span>
        <h2>Who is the imposter?</h2>
        <p class="subcopy">${state.round.voteCandidates ? "Revote is limited to the tied players." : "Pick one player. Your vote is hidden after tapping."}</p>
      </div>

      <div class="panel list-panel">
        <div class="panel-head">
          <h2>Ballot</h2>
          <span class="tag yellow">${state.round.voteIndex + 1}/${state.round.players.length}</span>
        </div>
        <div class="panel-body">
          <div class="vote-list">
            ${candidates.map((candidate) => `
              <button class="vote-choice" data-action="cast-vote" data-value="${candidate.id}">
                <span class="index-pill">${candidate.displayIndex}</span>
                <strong>${escapeHtml(candidate.name)}</strong>
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTie() {
  const counts = getVoteCounts();

  return `
    <section class="screen phase-grid">
      <div class="phase-lead yellow">
        <span class="focus-kicker">Tie vote</span>
        <h2>No clear accusation</h2>
        <p class="subcopy">Tied players give one more clue, then everyone votes between them.</p>
        <div class="actions">
          <button class="primary" data-action="revote">Revote tied players</button>
          <button class="secondary" data-action="imposter-tie-win">No accusation</button>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-head">
          <h2>Tally</h2>
          <span class="tag coral">${state.round.tieRound + 1} vote</span>
        </div>
        <div class="panel-body">
          <div class="tally-list">
            ${renderTallyRows(counts)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAccusation() {
  const accused = getPlayer(state.round.accusedId);

  if (!state.round.accusationRevealed) {
    return `
      <section class="stage">
        <div class="focus-panel dark">
          <span class="focus-kicker">Accused</span>
          <div class="giant-name">${escapeHtml(accused.name)}</div>
          <p class="subcopy">Lock it in before the reveal.</p>
          <button class="primary" data-action="reveal-accused">Reveal role</button>
        </div>
      </section>
    `;
  }

  const isImposter = accused.role === "imposter";

  if (!isImposter) {
    return "";
  }

  return `
    <section class="stage">
      <div class="focus-panel imposter-card">
        <span class="focus-kicker">Caught</span>
        <div class="giant-word">${escapeHtml(accused.name)} was imposter</div>
        <p class="subcopy">They get one final guess for the word.</p>
        <button class="primary" data-action="final-guess">Final guess</button>
      </div>
    </section>
  `;
}

function renderFinalGuess() {
  const accused = getPlayer(state.round.accusedId);
  const errorClass = state.error ? " visible" : "";

  return `
    <section class="screen phase-grid">
      <div class="phase-lead dark">
        <span class="focus-kicker">Final guess</span>
        <h2>${escapeHtml(accused.name)}, steal the round</h2>
        <p class="subcopy">One exact guess. Case does not matter.</p>
      </div>

      <form class="panel list-panel" autocomplete="off">
        <div class="panel-head">
          <h2>Guess</h2>
          <span class="tag yellow">${escapeHtml(state.round.categoryLabel)}</span>
        </div>
        <div class="panel-body">
          <label class="input-shell">
            <span class="field-label">Secret word</span>
            <input class="text-input" data-final-guess value="${escapeAttr(state.round.finalGuess || "")}" placeholder="Type the guess">
          </label>
          <div class="error${errorClass}">${escapeHtml(state.error)}</div>
          <div class="actions">
            <button class="primary" type="button" data-action="submit-final-guess">Submit guess</button>
          </div>
        </div>
      </form>
    </section>
  `;
}

function renderResult() {
  const result = state.round.result;
  const imposters = state.round.players.filter((player) => player.role === "imposter");
  const winnerLabel = result.winner === "players" ? "Players win" : "Imposter wins";
  const panelClass = result.winner === "players" ? "players" : "imposters";

  return `
    <section class="result-grid">
      <div class="winner-panel ${panelClass}">
        <span class="focus-kicker">Result</span>
        <div class="winner-title">${winnerLabel}</div>
        <p class="subcopy">${escapeHtml(result.reason)}</p>
        <div class="reveal-strip">
          <span class="rule-chip">Word: ${escapeHtml(state.round.secretWord)}</span>
          <span class="rule-chip">Imposter: ${imposters.map((player) => escapeHtml(player.name)).join(", ")}</span>
        </div>
        <div class="actions">
          <button class="primary" data-action="same-group">Play again</button>
          <button class="secondary" data-action="new-game">New group</button>
        </div>
      </div>

      <aside class="panel">
        <div class="panel-head">
          <h2>Scores</h2>
          <span class="tag yellow">Saved</span>
        </div>
        <div class="panel-body">
          ${renderCurrentScores()}
        </div>
      </aside>
    </section>
  `;
}

function renderMetric(label, value) {
  return `
    <div class="metric">
      <span class="metric-label">${escapeHtml(label)}</span>
      <span class="metric-value">${escapeHtml(String(value))}</span>
    </div>
  `;
}

function renderStepper(action, value, min, max, step = 1) {
  const numericValue = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return `
    <div class="stepper">
      <button type="button" data-action="${action}" data-value="${-step}" title="Decrease" aria-label="Decrease" ${numericValue <= min ? "disabled" : ""}>-</button>
      <output>${escapeHtml(String(value))}</output>
      <button type="button" data-action="${action}" data-value="${step}" title="Increase" aria-label="Increase" ${numericValue >= max ? "disabled" : ""}>+</button>
    </div>
  `;
}

function renderChoice(action, value, label, note, active) {
  return `
    <button class="choice${active ? " active" : ""}" type="button" data-action="${action}" data-value="${escapeAttr(value)}">
      ${escapeHtml(label)}
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </button>
  `;
}

function renderScoreList() {
  if (!stateHasScores()) {
    return `<p class="small-note" style="margin-top: 14px;">Scores appear after the first round.</p>`;
  }

  return `
    <div class="score-list" style="margin-top: 14px;">
      ${Object.entries(state.scores)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([name, score]) => `
          <div class="score-row">
            <span class="score-pill">${score}</span>
            <strong>${escapeHtml(name)}</strong>
            <span></span>
          </div>
        `).join("")}
    </div>
  `;
}

function renderCurrentScores() {
  return `
    <div class="score-list">
      ${state.round.players
        .slice()
        .sort((a, b) => getScore(b.name) - getScore(a.name) || a.name.localeCompare(b.name))
        .map((player) => `
          <div class="score-row">
            <span class="score-pill">${getScore(player.name)}</span>
            <strong>${escapeHtml(player.name)}</strong>
            <span class="tag ${player.role === "imposter" ? "coral" : "mint"}">${player.role === "imposter" ? "Imposter" : "Player"}</span>
          </div>
        `).join("")}
    </div>
  `;
}

function renderTallyRows(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const player = getPlayer(Number(id));
      const tied = state.round.tiedIds.includes(Number(id));
      return `
        <div class="tally-row ${tied ? "current" : ""}">
          <span class="score-pill">${count}</span>
          <strong>${escapeHtml(player.name)}</strong>
          <span class="tag ${tied ? "coral" : ""}">${tied ? "Tied" : "Votes"}</span>
        </div>
      `;
    }).join("");
}

function getRoleCard(player) {
  if (player.role === "player") {
    return {
      kind: "player",
      title: state.round.secretWord,
      detail: "Give a clue that proves you know it without giving it away."
    };
  }

  if (state.round.mode === "dark") {
    return {
      kind: "player",
      title: state.round.decoyWord,
      detail: "Give a clue for this word."
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

function pickWord(categoryKey, difficulty) {
  const words = WORD_BANK[categoryKey].words[difficulty];
  return sample(words);
}

function pickDecoyWord(categoryKey, difficulty, secretWord) {
  const category = WORD_BANK[categoryKey];
  const pool = [
    ...category.words[difficulty],
    ...category.words.easy,
    ...category.words.medium,
    ...category.words.hard
  ].filter((word) => normalizeGuess(word) !== normalizeGuess(secretWord));

  return sample(unique(pool));
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

function sampleWords(categoryKey) {
  const category = WORD_BANK[categoryKey];
  return category.words.medium.slice(0, 3).join(", ");
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

function loadScores() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveScores() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scores));
  } catch {
    // localStorage may be unavailable in private browsing.
  }
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
