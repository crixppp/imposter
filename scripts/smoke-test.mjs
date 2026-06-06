import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const scriptFiles = [
  "words.js",
  "words-food.js",
  "words-animals.js",
  "words-places.js",
  "words-objects.js",
  "words-movies.js",
  "words-brands.js",
  "words-jobs.js",
  "words-moments.js",
  "script.js",
  "helpers.js",
  "actions.js",
  "round.js",
  "render-core.js",
  "view-setup.js",
  "view-play.js",
  "view-result.js",
  "boot.js"
];

const app = {
  innerHTML: "",
  addEventListener() {}
};

const topbarActions = {
  innerHTML: "",
  addEventListener() {}
};

const storage = new Map();
const sandbox = {
  console,
  document: {
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#topbar-actions") return topbarActions;
      return null;
    }
  },
  window: {
    localStorage: {
      getItem(key) {
        return storage.get(key) || null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      }
    },
    setInterval() {
      return 1;
    },
    clearInterval() {}
  }
};

const context = vm.createContext(sandbox);
for (const file of scriptFiles) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const result = vm.runInContext(`
(() => {
  const normalize = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  const entries = Object.entries(WORD_BANK).flatMap(([categoryKey, category]) =>
    Object.entries(category.words).flatMap(([difficulty, words]) =>
      words.map(([word, hints]) => ({ categoryKey, difficulty, word, hints }))
    )
  );

  const removedWords = [
    "Pangolin",
    "Okapi",
    "Tapir",
    "Atlassian",
    "Paella",
    "Bruschetta",
    "Cartographer",
    "Sommelier",
    "Mediator",
    "Archivist",
    "Parasite",
    "Casablanca",
    "Spirited Away",
    "Memento",
    "Arrival",
    "Moonlight",
    "The Prestige",
    "Amelie",
    "Monastery"
  ].map((word) => word.toLowerCase());

  const categorySizes = Object.fromEntries(Object.entries(WORD_BANK).map(([categoryKey, category]) => [
    categoryKey,
    Object.fromEntries(Object.entries(category.words).map(([difficulty, words]) => [difficulty, words.length]))
  ]));

  const removedEntries = entries.filter(({ word }) => removedWords.includes(word.toLowerCase()));

  const unsafeHints = entries.flatMap(({ word, hints }) => {
    const wordKey = normalize(word);
    return (Array.isArray(hints) ? hints : [hints])
      .map((hint) => String(hint || "").trim())
      .filter((hint) => {
        const hintKey = normalize(hint);
        return !hint || /\\s/.test(hint) || !hintKey || GENERIC_HINTS.has(hintKey) || hintKey === wordKey || wordKey.includes(hintKey) || hintKey.includes(wordKey);
      })
      .map((hint) => ({ word, hint }));
  });

  const shortHintEntries = entries.filter(({ hints }) => !Array.isArray(hints) || hints.length < 2);

  state.phase = "setup";
  state.rulesOpen = false;
  state.history = [];
  const setupHtml = renderSetup();
  handleClick({ target: { closest: () => ({ dataset: { action: "open-rules" } }) } });
  const rulesHtml = renderSetup();
  handleClick({ target: { closest: () => ({ dataset: { action: "close-rules" } }) } });
  state.names = ["Alex", "Blair", "Casey", "Drew", "Ellis"];
  state.scores = { Drew: 2, Alex: 1, Blair: 0, Casey: 0, Ellis: 0 };
  const scoredSetupHtml = renderSetup();
  const scoredPlayerRows = setupPlayerRows();
  const namesAfterScoreSort = state.names.slice();
  const setupHasLeaderClass = scoredSetupHtml.includes("player-row leader");
  const setupLeaderNames = leaderNames(state.names);

  state.settings.categories = ["food"];
  state.settings.difficulty = "medium";
  state.usedWordKeys = [];
  const foodMediumCount = WORD_BANK.food.words.medium.length;
  const pickedWords = Array.from({ length: foodMediumCount }, () => pickSecretWord(selectedCategoryKeys(), state.settings.difficulty).word);
  const nextWordAfterReset = pickSecretWord(selectedCategoryKeys(), state.settings.difficulty).word;
  const usedWordsAfterReset = state.usedWordKeys.length;

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
  state.scores = {};
  state.history = [];
  state.usedWordKeys = [];
  startRound();
  state.phase = "voting";
  state.round.voteOpen = true;
  state.round.voteIndex = 0;
  const voter = state.round.players[0];
  const candidate = getVoteCandidates(voter.id)[0];
  const ballotHtml = renderVoting();
  handleClick({ target: { closest: () => ({ dataset: { action: "select-vote", value: String(candidate.id) } }) } });
  const selectedHtml = renderVoting();
  const votesBeforeConfirm = Object.keys(state.round.votes).length;
  handleClick({ target: { closest: () => ({ dataset: { action: "confirm-vote" } }) } });
  const voteIndexAfterConfirm = state.round.voteIndex;
  const recordedVote = state.round.votes[voter.id];

  state.settings = {
    playerCount: 5,
    imposterCount: 1,
    roundCount: 3,
    categories: ["food"],
    difficulty: "medium",
    mode: "hinted",
    discussionSeconds: 120
  };
  state.names = DEFAULT_NAMES.slice(0, 5);
  state.scores = {};
  state.history = [];
  state.usedWordKeys = [];
  startRound();
  const wrongAccused = state.round.players.find((player) => player.role !== "imposter");
  for (const player of state.round.players) {
    state.round.votes[player.id] = wrongAccused.id;
  }
  state.round.accusedId = wrongAccused.id;
  state.round.tiedIds = [wrongAccused.id];
  finishRound("imposters", wrongAccused.name + " was not an imposter.");
  const resultHtml = renderResult();
  const voteBreakdownHtml = resultHtml.slice(resultHtml.indexOf("Votes received"));
  const historyBeforeSameGroup = state.history.length;
  const firstHistory = state.history[0];
  const scoreChanges = Object.fromEntries(firstHistory.scoreChanges.map((change) => [change.name, change.points]));
  const imposterNames = state.round.players.filter((player) => player.role === "imposter").map((player) => player.name);
  const resultHasLeaderClass = resultHtml.includes("score-row leader");
  handleClick({ target: { closest: () => ({ dataset: { action: "same-group" } }) } });
  const historyAfterSameGroup = state.history.length;
  const sameGroupSetupHtml = renderSetup();
  handleClick({ target: { closest: () => ({ dataset: { action: "new-game" } }) } });
  const historyAfterNewGame = state.history.length;

  return {
    entryCount: entries.length,
    categoryCount: Object.keys(WORD_BANK).length,
    categorySizes,
    removedEntries,
    unsafeHints,
    shortHintEntries,
    setupHasRulesButton: setupHtml.includes('data-action="open-rules"'),
    setupHasNoShuffleButton: !setupHtml.includes('data-action="randomize-names"') && !setupHtml.includes("Shuffle names"),
    rulesDialogVisible: state.rulesOpen === false && rulesHtml.includes('role="dialog"') && rulesHtml.includes("Caught imposters"),
    rulesHasScoringGuide: rulesHtml.includes("Scoring") && rulesHtml.includes("Players +1") && rulesHtml.includes("Imposters +2"),
    setupRemovesDuplicateScoreList: !scoredSetupHtml.includes("score-list"),
    scoredPlayerNames: scoredPlayerRows.map((player) => player.name),
    scoredPlayerIndexes: scoredPlayerRows.map((player) => player.index),
    namesAfterScoreSort,
    setupHasLeaderClass,
    setupLeaderNames,
    noRepeatCount: new Set(pickedWords).size,
    noRepeatTotal: pickedWords.length,
    foodMediumCount,
    nextWordAfterReset,
    usedWordsAfterReset,
    ballotUsesSelect: ballotHtml.includes('data-action="select-vote"') && !ballotHtml.includes('data-action="cast-vote"'),
    selectedShowsConfirm: selectedHtml.includes("Confirm vote"),
    votesBeforeConfirm,
    voteIndexAfterConfirm,
    recordedVote,
    candidateId: candidate.id,
    resultHasVoteBreakdown: voteBreakdownHtml.includes("Votes received") && voteBreakdownHtml.includes("Accused"),
    resultVoteBreakdownHasCounts: voteBreakdownHtml.includes('<span class="score-pill">5</span>') && voteBreakdownHtml.includes('<span class="score-pill">0</span>'),
    resultHasRoundHistory: resultHtml.includes("Round history") && resultHtml.includes("Round 1 complete"),
    resultHasBetterRecap: resultHtml.includes("Category:") && resultHtml.includes("Accused:") && resultHtml.includes("Next round"),
    resultHasScoreDelta: imposterNames.every((name) => resultHtml.includes("+2 " + name) && scoreChanges[name] === 2),
    resultHasLeaderClass,
    historyBeforeSameGroup,
    historyAfterSameGroup,
    historyAfterNewGame,
    sameGroupKeepsHistoryVisible: sameGroupSetupHtml.includes("player-list")
  };
})()
`, context);

assert.equal(result.categoryCount, 8);
assert.equal(result.entryCount, 384);
assert.equal(Object.values(result.categorySizes).every((sizes) => Object.values(sizes).every((count) => count === 16)), true);
assert.equal(result.removedEntries.length, 0);
assert.equal(result.unsafeHints.length, 0);
assert.equal(result.shortHintEntries.length, 0);
assert.equal(result.setupHasRulesButton, true);
assert.equal(result.setupHasNoShuffleButton, true);
assert.equal(result.rulesDialogVisible, true);
assert.equal(result.rulesHasScoringGuide, true);
assert.equal(result.setupRemovesDuplicateScoreList, true);
assert.equal(JSON.stringify(result.scoredPlayerNames.slice(0, 2)), JSON.stringify(["Drew", "Alex"]));
assert.equal(JSON.stringify(result.scoredPlayerIndexes.slice(0, 2)), JSON.stringify([3, 0]));
assert.equal(JSON.stringify(result.namesAfterScoreSort), JSON.stringify(["Alex", "Blair", "Casey", "Drew", "Ellis"]));
assert.equal(result.setupHasLeaderClass, true);
assert.equal(JSON.stringify(result.setupLeaderNames), JSON.stringify(["Drew"]));
assert.equal(result.noRepeatCount, result.foodMediumCount);
assert.equal(result.noRepeatTotal, result.foodMediumCount);
assert.equal(typeof result.nextWordAfterReset, "string");
assert.equal(result.usedWordsAfterReset, 1);
assert.equal(result.ballotUsesSelect, true);
assert.equal(result.selectedShowsConfirm, true);
assert.equal(result.votesBeforeConfirm, 0);
assert.equal(result.voteIndexAfterConfirm, 1);
assert.equal(result.recordedVote, result.candidateId);
assert.equal(result.resultHasVoteBreakdown, true);
assert.equal(result.resultVoteBreakdownHasCounts, true);
assert.equal(result.resultHasRoundHistory, true);
assert.equal(result.resultHasBetterRecap, true);
assert.equal(result.resultHasScoreDelta, true);
assert.equal(result.resultHasLeaderClass, true);
assert.equal(result.historyBeforeSameGroup, 1);
assert.equal(result.historyAfterSameGroup, 1);
assert.equal(result.historyAfterNewGame, 0);
assert.equal(result.sameGroupKeepsHistoryVisible, true);

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.match(indexHtml, /favicon\.png\?v=20260605/);
assert.doesNotMatch(indexHtml, /favicon-\d+\.png/);
assert.match(indexHtml, /manifest\.webmanifest/);
assert.match(indexHtml, /apple-touch-icon\.png\?v=20260606/);

const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
assert.equal(manifest.icons.some((icon) => icon.src === "icon-192.png" && icon.sizes === "192x192"), true);
assert.equal(manifest.icons.some((icon) => icon.src === "icon-512.png" && icon.sizes === "512x512"), true);

const serviceWorker = fs.readFileSync("service-worker.js", "utf8");
assert.match(serviceWorker, /CACHE_NAME/);
assert.match(serviceWorker, /manifest\.webmanifest/);
assert.match(serviceWorker, /icon-512\.png/);
assert.equal(fs.existsSync("apple-touch-icon.png"), true);
assert.equal(fs.existsSync("icon-192.png"), true);
assert.equal(fs.existsSync("icon-512.png"), true);

const css = ["styles-1.css", "styles-2.css", "styles-3.css"]
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
assert.match(css, /:active/);
assert.match(css, /modal-backdrop/);
assert.match(css, /player-row\.leader/);
assert.match(css, /history-card/);

console.log("Smoke test passed");
