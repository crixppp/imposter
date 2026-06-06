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
        return !hint || /\\s/.test(hint) || !hintKey || hintKey === wordKey || wordKey.includes(hintKey) || hintKey.includes(wordKey);
      })
      .map((hint) => ({ word, hint }));
  });

  const shortHintEntries = entries.filter(({ hints }) => !Array.isArray(hints) || hints.length < 2);

  state.phase = "setup";
  state.rulesOpen = false;
  const setupHtml = renderSetup();
  handleClick({ target: { closest: () => ({ dataset: { action: "open-rules" } }) } });
  const rulesHtml = renderSetup();
  handleClick({ target: { closest: () => ({ dataset: { action: "close-rules" } }) } });
  state.names = ["Alex", "Blair", "Casey", "Drew", "Ellis"];
  state.scores = { Drew: 2, Alex: 1, Blair: 0, Casey: 0, Ellis: 0 };
  const scoredSetupHtml = renderSetup();
  const scoredPlayerRows = setupPlayerRows();
  const namesAfterScoreSort = state.names.slice();

  state.settings.categories = ["food"];
  state.settings.difficulty = "medium";
  state.usedWordKeys = [];
  const foodMediumCount = WORD_BANK.food.words.medium.length;
  const pickedWords = Array.from({ length: foodMediumCount }, () => pickSecretWord(selectedCategoryKeys(), state.settings.difficulty).word);
  const nextWordAfterReset = pickSecretWord(selectedCategoryKeys(), state.settings.difficulty).word;

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
  state.round.votes = { 1: 2, 2: 3, 3: 2, 4: 2, 5: 4 };
  state.round.accusedId = 2;
  state.round.tiedIds = [2];
  state.round.result = { winner: "imposters", reason: "Blair was not an imposter." };
  state.phase = "result";
  const resultHtml = renderResult();
  const voteBreakdownHtml = resultHtml.slice(resultHtml.indexOf("Votes received"));

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
    noRepeatCount: new Set(pickedWords).size,
    noRepeatTotal: pickedWords.length,
    foodMediumCount,
    nextWordAfterReset,
    usedWordsAfterReset: state.usedWordKeys.length,
    ballotUsesSelect: ballotHtml.includes('data-action="select-vote"') && !ballotHtml.includes('data-action="cast-vote"'),
    selectedShowsConfirm: selectedHtml.includes("Confirm vote"),
    votesBeforeConfirm,
    voteIndexAfterConfirm: state.round.voteIndex,
    recordedVote: state.round.votes[voter.id],
    candidateId: candidate.id,
    resultHasVoteBreakdown: voteBreakdownHtml.includes("Votes received") && voteBreakdownHtml.includes("Accused"),
    resultVoteBreakdownOrder: voteBreakdownHtml.indexOf("Blair") < voteBreakdownHtml.indexOf("Casey"),
    resultVoteBreakdownHasCounts: voteBreakdownHtml.includes('<span class="score-pill">3</span>') && voteBreakdownHtml.includes('<span class="score-pill">1</span>')
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
assert.equal(result.resultVoteBreakdownOrder, true);
assert.equal(result.resultVoteBreakdownHasCounts, true);

const indexHtml = fs.readFileSync("index.html", "utf8");
assert.match(indexHtml, /favicon\.png\?v=20260605/);
assert.doesNotMatch(indexHtml, /favicon-\d+\.png/);

const css = ["styles-1.css", "styles-2.css", "styles-3.css"]
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
assert.match(css, /:active/);
assert.match(css, /modal-backdrop/);

console.log("Smoke test passed");
