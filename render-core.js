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
    <button class="secondary" data-action="new-game">New game</button>
  `;
}
