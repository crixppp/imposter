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
