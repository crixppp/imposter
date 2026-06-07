const STORAGE_KEY = "imposter-scores-v1";
const HISTORY_STORAGE_KEY = "imposter-history-v1";
const MAX_HISTORY = 12;
const MIN_PLAYERS = 3;

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

const WORD_BANK = window.IMPOSTER_WORD_BANK;

const GENERIC_HINTS = new Set([
  "animal",
  "brand",
  "creature",
  "dish",
  "event",
  "film",
  "food",
  "job",
  "location",
  "logo",
  "meal",
  "moment",
  "movie",
  "object",
  "person",
  "place",
  "thing",
  "work"
]);

const MODE_COPY = {
  classic: {
    label: "Classic",
    note: "Imposters know they are imposters."
  },
  hinted: {
    label: "Hinted Imposter Mode",
    note: "Imposters receive one related hint."
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
    roundCount: 3,
    categories: ["food"],
    difficulty: "medium",
    mode: "classic",
    discussionSeconds: 120
  },
  names: DEFAULT_NAMES.slice(0, 5),
  scores: loadScores(),
  history: loadHistory(),
  usedWordKeys: [],
  rulesOpen: false,
  error: "",
  round: null,
  timerId: null,
  discussionRunning: false
};

const app = document.querySelector("#app");
const topbarActions = document.querySelector("#topbar-actions");

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

function loadHistory() {
  try {
    const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.history));
  } catch {
    // localStorage may be unavailable in private browsing.
  }
}
