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
  const isLastSpeaker = state.round.clueIndex === state.round.clueOrder.length - 1;
  const isFinalClueRound = state.round.currentClueRound === state.round.totalClueRounds;
  const isComplete = isLastSpeaker && isFinalClueRound;
  const canGoBack = state.round.clueIndex > 0 || state.round.currentClueRound > 1;
  const roundLabel = `Round ${state.round.currentClueRound} of ${state.round.totalClueRounds}`;

  return `
    <section class="screen phase-grid">
      <div class="phase-lead yellow">
        <span class="focus-kicker">Clue phase - ${escapeHtml(roundLabel)}</span>
        <h2>${escapeHtml(current.name)} speaks now</h2>
        <p class="subcopy">One clue each. No spelling, rhymes, translations, or saying the word.</p>
        <div class="reveal-strip">
          <span class="rule-chip">${escapeHtml(roundLabel)}</span>
          <span class="rule-chip">Category: ${escapeHtml(state.round.categoryLabel)}</span>
          <span class="rule-chip">${escapeHtml(MODE_COPY[state.round.mode].label)}</span>
          <span class="rule-chip">${titleCase(state.round.difficulty)}</span>
        </div>
        <div class="actions">
          <button class="secondary" data-action="prev-speaker" ${canGoBack ? "" : "disabled"}>Back</button>
          <button class="secondary" data-action="next-speaker" ${isComplete ? "disabled" : ""}>Next speaker</button>
          <button class="primary" data-action="discussion">Discussion</button>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-head">
          <h2>Order</h2>
          <span class="tag blue">${state.round.currentClueRound}/${state.round.totalClueRounds} - ${state.round.clueIndex + 1}/${state.round.clueOrder.length}</span>
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
  const pendingVote = state.round.pendingVoteId ? getPlayer(state.round.pendingVoteId) : null;

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
              <button class="vote-choice${state.round.pendingVoteId === candidate.id ? " selected" : ""}" data-action="select-vote" data-value="${candidate.id}">
                <span class="index-pill">${candidate.displayIndex}</span>
                <strong>${escapeHtml(candidate.name)}</strong>
              </button>
            `).join("")}
          </div>
          ${pendingVote ? `
            <div class="vote-confirm">
              <p class="small-note">Vote for <strong>${escapeHtml(pendingVote.name)}</strong>?</p>
              <div class="actions">
                <button class="primary" data-action="confirm-vote">Confirm vote</button>
                <button class="secondary" data-action="clear-vote">Change</button>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    </section>
  `;
}
