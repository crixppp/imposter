/* app.js — Imposter (UK English)
   Flow: splash -> menu -> reveal (N players) -> "Tap to start" -> splash
   Requires words.js (v3 in our thread) exposing window.ImposterWords
*/

const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

// Views
const views = {
  splash: qs('#splash'),
  menu: qs('#menu'),
  reveal: qs('#reveal'),
};

// Menu controls
const form = qs('#setupForm');
const playersInput = qs('#players');
const categoriesSelect = qs('#categories');
const btnSelectAll = qs('#btnSelectAll');

// Reveal screen nodes
const revealView = qs('#reveal');
const revealMain = qs('#reveal .reveal-card');
const revealPrompt = qs('#revealPrompt');
const revealWord = qs('#revealWord');
const revealRole = qs('#revealRole');
const revealHelp = qs('#revealHelp');
const REVEAL_HELP_BASE = 'Hand the device around. Each player reveals in turn.';

// App state
let state = {
  players: 6,
  pool: [],
  roundWord: null,
  imposterIndex: null,
  currentIndex: 0,       // 0-based, whose turn it is to reveal
  onceNextTap: false,    // flag used on reveal card to jump back to start
};

// ---------- Utilities ----------
function showView(name) {
  Object.entries(views).forEach(([key, node]) => {
    const active = key === name;
    node.classList.toggle('view--active', active);
    node.setAttribute('aria-hidden', String(!active));
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPool(selectedCats) {
  const packs = window.WORD_PACKS || {};
  const pool = [];
  selectedCats.forEach(cat => {
    const list = packs[cat] || [];
    pool.push(...list);
  });
  state.pool = shuffle(pool);
}

// ---------- Splash ----------
function startSplash() {
  showView('splash');
  // Short, sleek fake load then drop to menu
  setTimeout(() => {
    showView('menu');
    playersInput?.focus?.({ preventScroll: true });
  }, 1200);
}

// ---------- Menu ----------
function populateCategories() {
  const packs = window.WORD_PACKS || {};
  const cats = Object.keys(packs);
  categoriesSelect.innerHTML = '';
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${cat} (${packs[cat].length})`;
    categoriesSelect.appendChild(opt);
  });
  // Default: select all
  qsa('option', categoriesSelect).forEach(o => (o.selected = true));
}

btnSelectAll?.addEventListener('click', () => {
  const all = qsa('option', categoriesSelect);
  const anyUnselected = all.some(o => !o.selected);
  all.forEach(o => (o.selected = anyUnselected));
  categoriesSelect.dispatchEvent(new Event('change'));
});

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const players = Number(playersInput.value);
  if (Number.isNaN(players) || players < 3 || players > 12) {
    alert('Please choose between 3 and 12 players.');
    return;
  }
  const selectedCats = qsa('option:checked', categoriesSelect).map(o => o.value);
  if (selectedCats.length === 0) {
    alert('Choose at least one category.');
    return;
  }
  state.players = players;
  buildPool(selectedCats);
  beginRound();
});

// ---------- Round / Reveal ----------
function beginRound() {
  // Pick a word via anti-repeat logic from words.js
  try {
    state.roundWord = window.ImposterWords.nextWord(state.pool);
  } catch (err) {
    console.error(err);
    alert('No words available. Please choose categories again.');
    showView('menu');
    return;
  }

  // Randomly choose the imposter index
  state.imposterIndex = Math.floor(Math.random() * state.players);
  state.currentIndex = 0;
  state.onceNextTap = false;

  // Prepare reveal UI
  resetRevealCardToBlank();
  showView('reveal');
}

function resetRevealCardToBlank() {
  revealPrompt.textContent = 'Press to reveal';
  revealWord.textContent = '—';
  revealRole.textContent = '—';
  revealHelp.textContent = REVEAL_HELP_BASE;
  revealMain.classList.remove('anim-in', 'anim-out');
}

function doRevealForCurrent() {
  const index = state.currentIndex;
  const isImposter = index === state.imposterIndex;

  revealPrompt.textContent = `Player ${index + 1}`;

  if (isImposter) {
    // Imposter sees IMPOSER, no hint
    revealWord.textContent = 'IMPOSTER';
    revealRole.textContent = 'You are the imposter';
    revealHelp.textContent = REVEAL_HELP_BASE;
  } else {
    // Civilian sees the round word (upper for drama) and a subtle hint
    const word = (state.roundWord || '').toUpperCase();
    revealWord.textContent = word;
    revealRole.textContent = 'You are not the imposter';

    // Optional hint (close-but-different) — appended to help line
    const hint = window.ImposterWords.getHint(state.roundWord);
    if (hint) {
      revealHelp.textContent = `${REVEAL_HELP_BASE}  Hint: ${hint}`;
    } else {
      revealHelp.textContent = REVEAL_HELP_BASE;
    }
  }
}

function advanceOrFinish() {
  state.currentIndex++;
  if (state.currentIndex < state.players) {
    // Next player — reset to blank prompt
    resetRevealCardToBlank();
  } else {
    // All players have revealed
    revealPrompt.textContent = 'Round ready';
    revealWord.textContent = '—';
    revealRole.textContent = 'Tap to start';
    revealHelp.textContent = 'Start a new round.';
    state.onceNextTap = true;
  }
}

// Smooth tap/keyboard handling
function handleRevealTap() {
  // If ready to start a new round, go back to splash -> menu
  if (state.onceNextTap) {
    state.onceNextTap = false;
    startSplash();
    return;
  }

  const currentlyBlank = revealWord.textContent === '—';
  if (currentlyBlank) {
    // Animate in the reveal
    revealMain.classList.remove('anim-out');
    revealMain.classList.add('anim-in');
    doRevealForCurrent();
  } else {
    // Animate out, then advance to next player / finish
    revealMain.classList.remove('anim-in');
    revealMain.classList.add('anim-out');
    setTimeout(() => {
      revealMain.classList.remove('anim-out');
      advanceOrFinish();
    }, 220);
  }
}

// Click + keyboard
revealMain?.addEventListener('click', handleRevealTap);
revealMain?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleRevealTap();
  }
});

// ---------- Boot ----------
window.addEventListener('DOMContentLoaded', () => {
  // Populate categories from words.js packs
  populateCategories();
  // Kick off the splash → menu sequence
  startSplash();
});
