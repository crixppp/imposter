function renderSetup() {
  const errorClass = state.error ? " visible" : "";

  return `
    <section class="screen split">
      <div>
        <div class="setup-band" aria-label="Round setup">
          ${renderMetric("Players", state.settings.playerCount)}
          ${renderMetric("Imposters", state.settings.imposterCount)}
          ${renderMetric("Rounds", state.settings.roundCount)}
          ${renderMetric("Categories", selectedCategorySummary())}
          ${renderMetric("Timer", formatTime(state.settings.discussionSeconds))}
        </div>

        <form class="panel" autocomplete="off">
          <div class="panel-head">
            <div>
              <p class="subcopy setup-copy">Pass the phone, hide the word, catch the fake.</p>
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

              <label class="field">
                <span class="field-label">Rounds</span>
                ${renderStepper("change-rounds", state.settings.roundCount, 1, 6)}
              </label>

              <div class="field">
                <span class="field-label">Difficulty</span>
                <div class="segmented">
                  ${["easy", "medium", "hard"].map((difficulty) => renderChoice("set-difficulty", difficulty, titleCase(difficulty), "", state.settings.difficulty === difficulty)).join("")}
                </div>
              </div>

              <div class="field-wide">
                <span class="field-label">Categories</span>
                <div class="option-grid">
                  ${Object.entries(WORD_BANK).map(([key, item]) => renderChoice("toggle-category", key, item.label, sampleWords(key), selectedCategoryKeys().includes(key))).join("")}
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
              <button class="secondary" type="button" data-action="open-rules">Rules</button>
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
    ${state.rulesOpen ? renderRulesModal() : ""}
  `;
}

function renderRulesModal() {
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="panel rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <div class="panel-head">
          <h2 id="rules-title">Rules</h2>
          <button class="icon-button" type="button" data-action="close-rules" aria-label="Close rules">x</button>
        </div>
        <div class="panel-body">
          <div class="rules-list">
            ${[
              "Read your role privately.",
              "Take turns giving one clue.",
              "Do not spell, rhyme, translate, or say the word.",
              "Discuss, vote, then reveal the accused.",
              "Caught imposters get one final guess."
            ].map((rule, index) => `
              <div class="order-row">
                <span class="index-pill">${index + 1}</span>
                <strong>${escapeHtml(rule)}</strong>
                <span></span>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    </div>
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
