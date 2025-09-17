/* State machine for: splash -> menu -> reveal -> (cycle) */

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

const views = {
  splash: qs('#splash'),
  menu: qs('#menu'),
  reveal: qs('#reveal'),
};

const form = qs('#setupForm');
const playersInput = qs('#players');
const categoriesSelect = qs('#categories');
const btnSelectAll = qs('#btnSelectAll');

const revealCard = qs('#reveal');
const revealMain = qs('#reveal .reveal-card');
const revealPrompt = qs('#revealPrompt');
const revealWord = qs('#revealWord');
const revealRole = qs('#revealRole');

let state = {
  players: 6,
  roundWord: null,
  imposterIndex: null,
  currentIndex: 0,           // which player is revealing right now (0-based)
  usedWords: new Set(),      // avoid repeats across sessions until pool exhausted
  pool: [],                  // active word pool for selected categories
};

/* ---------- Utilities ---------- */

function showView(name){
  Object.entries(views).forEach(([key, node]) => {
    const active = key === name;
    node.classList.toggle('view--active', active);
    node.setAttribute('aria-hidden', String(!active));
  });
}

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickWord(){
  if(state.pool.length === 0){
    console.warn('Empty pool; using all packs.');
    buildPool(Object.keys(window.WORD_PACKS));
  }
  // Filter out used words if possible; if all used, clear memory
  const fresh = state.pool.filter(w => !state.usedWords.has(w));
  const source = fresh.length ? fresh : state.pool;
  const word = source[Math.floor(Math.random() * source.length)];
  if (fresh.length) state.usedWords.add(word);
  return word;
}

function buildPool(selectedCats){
  const pool = [];
  selectedCats.forEach(cat => {
    const list = window.WORD_PACKS[cat] || [];
    pool.push(...list);
  });
  state.pool = shuffle(pool);
}

/* ---------- Init ---------- */

function populateCategories(){
  const packs = window.WORD_PACKS;
  const cats = Object.keys(packs);
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${cat} (${packs[cat].length})`;
    categoriesSelect.appendChild(opt);
  });
  // Default: select all
  qsa('option', categoriesSelect).forEach(o => o.selected = true);
}

function startSplash(){
  showView('splash');
  // Simulated short load, then menu
  setTimeout(() => {
    showView('menu');
    // Ensure focus lands sensibly
    playersInput.focus({preventScroll:true});
  }, 1200);
}

/* ---------- Menu handlers ---------- */

btnSelectAll.addEventListener('click', () => {
  const all = qsa('option', categoriesSelect);
  const anyUnselected = all.some(o => !o.selected);
  all.forEach(o => o.selected = anyUnselected); // toggle to "all" if any missing, otherwise deselect all
  categoriesSelect.dispatchEvent(new Event('change'));
});

categoriesSelect.addEventListener('change', () => {
  // Nothing required; left for future UI badges, etc.
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const players = Number(playersInput.value);
  if(Number.isNaN(players) || players < 3 || players > 12){
    alert('Please choose between 3 and 12 players.');
    return;
  }
  const selectedCats = qsa('option:checked', categoriesSelect).map(o => o.value);
  if(selectedCats.length === 0){
    alert('Choose at least one category.');
    return;
  }
  state.players = players;
  buildPool(selectedCats);
  beginRound();
});

/* ---------- Round / Reveal flow ---------- */

function beginRound(){
  // Pick word + imposter
  state.roundWord = pickWord();
  state.imposterIndex = Math.floor(Math.random() * state.players);
  state.currentIndex = 0;
  prepareRevealCardIntro();
  showView('reveal');
}

function prepareRevealCardIntro(){
  revealPrompt.textContent = 'Press to reveal';
  revealWord.textContent = '—';
  revealRole.textContent = '—';
  // Reset aria politely
  revealWord.setAttribute('aria-live','polite');
}

function doRevealForCurrent(){
  const isImposter = state.currentIndex === state.imposterIndex;
  revealPrompt.textContent = `Player ${state.currentIndex + 1}`;
  if(isImposter){
    revealWord.textContent = 'IMPOSTER';
    revealRole.textContent = 'You are the imposter';
  }else{
    revealWord.textContent = state.roundWord.toUpperCase();
    revealRole.textContent = 'You are not the imposter';
  }
}

function advanceOrFinish(){
  state.currentIndex++;
  if(state.currentIndex < state.players){
    // reset to prompt for next person
    prepareRevealCardIntro();
  }else{
    // Last person has seen theirs; prompt to start again
    revealPrompt.textContent = 'Round ready';
    revealWord.textContent = '—';
    revealRole.textContent = 'Tap to start';
    // Next tap goes back to splash -> menu loop
    revealMain.onceNextTap = true;
  }
}

/* Smooth “tap anywhere” interactions */
function handleRevealTap(){
  if(revealMain.onceNextTap){
    revealMain.onceNextTap = false;
    // Return to splash (short), then menu
    startSplash();
    return;
  }

  const currentlyBlank = revealWord.textContent === '—';
  if(currentlyBlank){
    // Animate in the word
    revealMain.classList.remove('anim-out');
    revealMain.classList.add('anim-in');
    doRevealForCurrent();
  }else{
    // Animate out and move to next
    revealMain.classList.remove('anim-in');
    revealMain.classList.add('anim-out');
    setTimeout(() => {
      revealMain.classList.remove('anim-out');
      advanceOrFinish();
    }, 220);
  }
}

/* Keyboard support */
revealMain.addEventListener('click', handleRevealTap);
revealMain.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault(); handleRevealTap();
  }
});

/* Small animation helper via class hooks */
(function attachAnimStyles(){
  const style = document.createElement('style');
  style.textContent = `
  .reveal-card.anim-in .reveal-word{
    animation: wordIn 240ms cubic-bezier(.2,.9,.2,1) both;
  }
  .reveal-card.anim-in .reveal-role{
    animation: roleIn 280ms cubic-bezier(.2,.9,.2,1) both 40ms;
  }
  .reveal-card.anim-out .reveal-word,
  .reveal-card.anim-out .reveal-role{
    animation: fadeDown 200ms ease both;
  }
  @keyframes wordIn{
    from{opacity:0; transform:translateY(8px) scale(.98)}
    to{opacity:1; transform:translateY(0) scale(1)}
  }
  @keyframes roleIn{
    from{opacity:0; transform:translateY(6px)}
    to{opacity:1; transform:translateY(0)}
  }
  @keyframes fadeDown{
    to{opacity:0; transform:translateY(6px)}
  }`;
  document.head.appendChild(style);
})();

/* Startup */
window.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  startSplash();
});
