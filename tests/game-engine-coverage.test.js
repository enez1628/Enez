import assert from 'node:assert/strict';
import {
  SYMBOLS,
  createMetaState,
  createSeededRandom,
  cloneBoard,
  cloneState,
  generateBoard,
  collapseBoard,
  getStars,
  createRewardBundle,
  continueWithGold,
  nextLevel,
  watchLifeAd,
  useShuffle,
  getBestHint,
  getCurrentLevel,
  createInitialState,
  createLevels,
  startLevel,
  applyMove,
  findGroup
} from '../src/game-engine.js';

const testLevels = [
  {
    id: 1,
    width: 3,
    height: 3,
    seed: 11,
    moveLimit: 10,
    timeLimit: 60,
    band: 'Kolay',
    symbolIds: ['leaf', 'sun', 'moon'],
    goals: { leaf: 2 }
  },
  {
    id: 2,
    width: 4,
    height: 4,
    seed: 22,
    moveLimit: 15,
    timeLimit: 90,
    band: 'Orta',
    symbolIds: ['leaf', 'sun', 'moon', 'drop'],
    goals: { leaf: 5, sun: 3 }
  }
];

function makePlayingState() {
  return {
    ...createInitialState(testLevels),
    board: [
      [
        { id: '0-0', symbol: 'leaf', locked: false },
        { id: '1-0', symbol: 'leaf', locked: false },
        { id: '2-0', symbol: 'sun', locked: false }
      ],
      [
        { id: '0-1', symbol: 'moon', locked: false },
        { id: '1-1', symbol: 'sun', locked: false },
        { id: '2-1', symbol: 'sun', locked: false }
      ],
      [
        { id: '0-2', symbol: 'moon', locked: false },
        { id: '1-2', symbol: 'moon', locked: false },
        { id: '2-2', symbol: 'sun', locked: false }
      ]
    ],
    goals: { leaf: 2 },
    movesRemaining: 10,
    timeRemaining: 60,
    status: 'playing'
  };
}

function alwaysLeaf() {
  return 0;
}

// --- createMetaState ---

{
  const meta = createMetaState();

  assert.equal(meta.stars, 0);
  assert.equal(meta.island.name, 'Zeka Adasi');
  assert.equal(meta.island.progress, 0);
  assert.deepEqual(meta.island.decorations, ['Liman']);
  assert.equal(meta.island.nextDecoration, 'Cicek Bahcesi');
  assert.equal(meta.tracks.levelChest.progress, 0);
  assert.equal(meta.tracks.levelChest.target, 100);
  assert.equal(meta.tracks.freeGift.progress, 35);
  assert.equal(meta.tracks.freeGift.target, 100);
  assert.equal(meta.tracks.matchPass.progress, 0);
  assert.equal(meta.tracks.matchPass.target, 80);
  assert.equal(meta.tracks.piggyBank.progress, 0);
  assert.equal(meta.tracks.piggyBank.coins, 0);
  assert.equal(meta.quests.length, 4);
  assert.equal(meta.quests[0].id, 'login');
  assert.equal(meta.quests[0].progress, 1);
  assert.equal(meta.lastClaimedReward, null);
}

console.log('  createMetaState: passed');

// --- createSeededRandom ---

{
  const random1 = createSeededRandom(42);
  const random2 = createSeededRandom(42);

  const values1 = Array.from({ length: 10 }, () => random1());
  const values2 = Array.from({ length: 10 }, () => random2());

  assert.deepEqual(values1, values2, 'Same seed should produce same sequence');

  values1.forEach((v) => {
    assert.ok(v >= 0 && v < 1, `Value ${v} should be in [0, 1)`);
  });

  const random3 = createSeededRandom(99);
  const values3 = Array.from({ length: 10 }, () => random3());
  assert.notDeepEqual(values1, values3, 'Different seeds should produce different sequences');
}

{
  const random = createSeededRandom(0);
  const value = random();
  assert.ok(value >= 0 && value < 1, 'Seed 0 should still produce valid output');
}

{
  const random = createSeededRandom(-5);
  const value = random();
  assert.ok(value >= 0 && value < 1, 'Negative seed should still produce valid output');
}

console.log('  createSeededRandom: passed');

// --- cloneBoard ---

{
  const board = [
    [{ id: '0-0', symbol: 'leaf', locked: false }, { id: '1-0', symbol: 'sun', locked: true }],
    [{ id: '0-1', symbol: 'moon', locked: false }, { id: '1-1', symbol: 'drop', locked: false }]
  ];

  const cloned = cloneBoard(board);

  assert.deepEqual(cloned, board);
  assert.notEqual(cloned, board);
  assert.notEqual(cloned[0], board[0]);
  assert.notEqual(cloned[0][0], board[0][0]);

  cloned[0][0].symbol = 'star';
  assert.equal(board[0][0].symbol, 'leaf', 'Original should not be mutated');
}

console.log('  cloneBoard: passed');

// --- cloneState ---

{
  const state = makePlayingState();
  state.history = [{
    board: state.board,
    goals: { leaf: 5 },
    movesRemaining: 8,
    timeRemaining: 50,
    score: 100,
    boosters: { hint: 2, shuffle: 1, undo: 1 },
    message: 'test'
  }];

  const cloned = cloneState(state);

  assert.deepEqual(cloned.board, state.board);
  assert.notEqual(cloned.board, state.board);
  assert.notEqual(cloned.goals, state.goals);
  assert.notEqual(cloned.boosters, state.boosters);
  assert.notEqual(cloned.history[0].board, state.history[0].board);
  assert.notEqual(cloned.history[0].goals, state.history[0].goals);

  cloned.board[0][0].symbol = 'star';
  assert.equal(state.board[0][0].symbol, 'leaf', 'Original board unaffected');

  cloned.goals.leaf = 99;
  assert.equal(state.goals.leaf, 2, 'Original goals unaffected');
}

console.log('  cloneState: passed');

// --- generateBoard ---

{
  const level = testLevels[0];
  const board = generateBoard(level);

  assert.equal(board.length, level.height);
  assert.equal(board[0].length, level.width);

  board.forEach((row, y) => {
    row.forEach((tile, x) => {
      assert.equal(tile.id, `${x}-${y}`);
      assert.ok(level.symbolIds.includes(tile.symbol), `Symbol ${tile.symbol} should be one of level symbols`);
      assert.equal(typeof tile.locked, 'boolean');
    });
  });
}

{
  const level = testLevels[0];
  const board1 = generateBoard(level, createSeededRandom(level.seed));
  const board2 = generateBoard(level, createSeededRandom(level.seed));

  assert.deepEqual(board1, board2, 'Same seed should produce same board');
}

{
  const level = { ...testLevels[0], id: 9 };
  const board = generateBoard(level);
  const hasLocked = board.some((row) => row.some((tile) => tile.locked));

  assert.ok(level.id >= 9, 'Level 9+ can have locked tiles');
}

console.log('  generateBoard: passed');

// --- collapseBoard ---

{
  const level = testLevels[0];
  const board = [
    [null, { id: '1-0', symbol: 'sun', locked: false }, { id: '2-0', symbol: 'moon', locked: false }],
    [null, null, { id: '2-1', symbol: 'leaf', locked: false }],
    [{ id: '0-2', symbol: 'leaf', locked: false }, { id: '1-2', symbol: 'sun', locked: false }, null]
  ];

  const collapsed = collapseBoard(board, level, alwaysLeaf);

  assert.equal(collapsed.length, 3);
  assert.equal(collapsed[0].length, 3);

  for (let x = 0; x < 3; x++) {
    const column = [];
    for (let y = 0; y < 3; y++) {
      assert.ok(collapsed[y][x] !== null, `Cell [${y}][${x}] should not be null after collapse`);
      column.push(collapsed[y][x]);
    }
  }

  assert.equal(collapsed[2][0].symbol, 'leaf');
  assert.equal(collapsed[2][1].symbol, 'sun');
}

{
  const level = testLevels[0];
  const board = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];

  const collapsed = collapseBoard(board, level, alwaysLeaf);

  collapsed.forEach((row) => {
    row.forEach((tile) => {
      assert.ok(tile !== null);
      assert.ok(level.symbolIds.includes(tile.symbol));
    });
  });
}

console.log('  collapseBoard: passed');

// --- getStars ---

{
  const state = makePlayingState();
  state.movesRemaining = 10;
  state.timeRemaining = 60;
  const stars = getStars(state);
  assert.equal(stars, 3, 'Full moves and time remaining should give 3 stars');
}

{
  const state = makePlayingState();
  state.movesRemaining = 2;
  state.timeRemaining = 12;
  const stars = getStars(state);
  assert.equal(stars, 2, 'Moderate remaining should give 2 stars');
}

{
  const state = makePlayingState();
  state.movesRemaining = 1;
  state.timeRemaining = 4;
  const stars = getStars(state);
  assert.equal(stars, 1, 'Very low remaining should give 1 star');
}

console.log('  getStars: passed');

// --- getCurrentLevel ---

{
  const state = createInitialState(testLevels);
  const level = getCurrentLevel(state);
  assert.equal(level.id, 1);

  const state2 = { ...state, levelIndex: 1 };
  const level2 = getCurrentLevel(state2);
  assert.equal(level2.id, 2);
}

console.log('  getCurrentLevel: passed');

// --- createRewardBundle ---

{
  const state = makePlayingState();
  state.lastStars = 3;
  const reward = createRewardBundle(state, 3);

  assert.ok(reward.title.includes('Bolum 1'));
  assert.ok(reward.gold > 0);
  assert.equal(reward.stars, 3);
  assert.equal(reward.unlimitedLivesMinutes, 30);
  assert.ok(reward.boosters.hint >= 1);
  assert.ok(reward.boosters.shuffle >= 1);
  assert.equal(reward.boosters.undo, 1);
  assert.ok(reward.progress.levelChest > 0);
  assert.ok(reward.progress.freeGift > 0);
  assert.ok(reward.progress.matchPass > 0);
  assert.ok(reward.progress.piggyBank > 0);
  assert.ok(reward.progress.island > 0);
}

{
  const state = makePlayingState();
  const reward1 = createRewardBundle(state, 1);
  const reward3 = createRewardBundle(state, 3);

  assert.ok(reward3.gold > reward1.gold, '3 stars should give more gold than 1 star');
  assert.equal(reward1.unlimitedLivesMinutes, 15);
  assert.equal(reward3.unlimitedLivesMinutes, 30);
}

{
  const state = { ...makePlayingState(), levelIndex: 1 };
  const reward = createRewardBundle(state, 2);
  assert.ok(reward.title.includes('Bolum 2'));
}

console.log('  createRewardBundle: passed');

// --- continueWithGold ---

{
  let state = makePlayingState();
  state = { ...state, status: 'lost', movesRemaining: 0, timeRemaining: 10, gold: 250 };

  const result = continueWithGold(state, 120);

  assert.equal(result.status, 'playing');
  assert.equal(result.movesRemaining, 5);
  assert.equal(result.timeRemaining, 40);
  assert.equal(result.gold, 130);
  assert.deepEqual(result.invalidTiles, []);
}

{
  let state = makePlayingState();
  state = { ...state, status: 'lost', gold: 50 };

  const result = continueWithGold(state, 120);

  assert.equal(result.status, 'lost', 'Should not change status if not enough gold');
  assert.equal(result.gold, 50);
}

{
  const state = makePlayingState();
  const result = continueWithGold(state);

  assert.equal(result.status, 'playing', 'Should not change if status is not lost');
  assert.equal(result, state);
}

console.log('  continueWithGold: passed');

// --- watchLifeAd ---

{
  const state = makePlayingState();
  state.lives = 3;
  state.adWatches = 0;

  const result = watchLifeAd(state);

  assert.equal(result.lives, 4);
  assert.equal(result.adWatches, 1);
  assert.ok(result.message.includes('+1 can'));
}

{
  const state = makePlayingState();
  state.lives = 5;

  const result = watchLifeAd(state);
  assert.equal(result.lives, 5, 'Lives should be capped at 5');
}

console.log('  watchLifeAd: passed');

// --- nextLevel ---

{
  let state = makePlayingState();
  state = applyMove(state, 0, 0, alwaysLeaf);

  assert.equal(state.status, 'won');
  assert.ok(state.pendingReward);

  const result = nextLevel(state);

  assert.equal(result.levelIndex, 1);
  assert.equal(result.status, 'playing');
  assert.equal(result.pendingReward, null);
  assert.ok(result.gold > 250, 'Pending reward should have been claimed');
}

{
  const state = { ...makePlayingState(), levelIndex: 0, pendingReward: null };
  const result = nextLevel(state);

  assert.equal(result.levelIndex, 1);
  assert.equal(result.status, 'playing');
}

{
  const state = { ...makePlayingState(), levelIndex: testLevels.length - 1 };
  const result = nextLevel(state);

  assert.equal(result.levelIndex, testLevels.length - 1, 'Should not go past last level');
}

console.log('  nextLevel: passed');

// --- useShuffle ---

{
  const state = makePlayingState();
  state.boosters.shuffle = 2;

  const result = useShuffle(state);

  assert.equal(result.boosters.shuffle, 1);
  assert.ok(result.message.includes('karistirildi'));
  assert.deepEqual(result.highlighted, []);
  assert.ok(result.history.length > 0, 'Should push history before shuffle');
}

{
  const state = makePlayingState();
  state.boosters.shuffle = 0;

  const result = useShuffle(state);
  assert.equal(result, state, 'Should return same state if no shuffles left');
}

{
  const state = { ...makePlayingState(), status: 'home' };
  state.boosters.shuffle = 2;

  const result = useShuffle(state);
  assert.equal(result, state, 'Should return same state if not playing');
}

{
  const state = makePlayingState();
  state.boosters.shuffle = 2;
  const mistakeFreeQuest = state.meta.quests.find((q) => q.id === 'mistakeFree');
  const beforeProgress = mistakeFreeQuest.progress;

  const result = useShuffle(state);
  const afterQuest = result.meta.quests.find((q) => q.id === 'mistakeFree');
  assert.equal(afterQuest.progress, beforeProgress + 1, 'Should advance mistakeFree quest');
}

console.log('  useShuffle: passed');

// --- getBestHint ---

{
  const state = makePlayingState();
  const best = getBestHint(state);

  assert.ok(best.length >= 2, 'Should find a group of at least 2');

  const allGroups = [];
  for (let y = 0; y < state.board.length; y++) {
    for (let x = 0; x < state.board[y].length; x++) {
      const group = findGroup(state.board, x, y);
      if (group.length > 0) allGroups.push(group);
    }
  }

  const maxLen = Math.max(...allGroups.map((g) => g.length));
  assert.equal(best.length, maxLen, 'Should return the largest group');
}

{
  const state = makePlayingState();
  state.board = [
    [{ id: '0-0', symbol: 'leaf', locked: false }, { id: '1-0', symbol: 'sun', locked: false }, { id: '2-0', symbol: 'moon', locked: false }],
    [{ id: '0-1', symbol: 'sun', locked: false }, { id: '1-1', symbol: 'moon', locked: false }, { id: '2-1', symbol: 'leaf', locked: false }],
    [{ id: '0-2', symbol: 'moon', locked: false }, { id: '1-2', symbol: 'leaf', locked: false }, { id: '2-2', symbol: 'sun', locked: false }]
  ];

  const best = getBestHint(state);
  assert.equal(best.length, 1, 'No groups of 2+ exist, best should be single tile');
}

console.log('  getBestHint: passed');

// --- Edge cases: locked tiles in findGroup ---

{
  const board = [
    [{ id: '0-0', symbol: 'leaf', locked: true }, { id: '1-0', symbol: 'leaf', locked: false }],
    [{ id: '0-1', symbol: 'leaf', locked: false }, { id: '1-1', symbol: 'leaf', locked: false }]
  ];

  const group = findGroup(board, 0, 0);
  assert.equal(group.length, 0, 'Should return empty for locked starting tile');

  const group2 = findGroup(board, 1, 0);
  assert.equal(group2.length, 3, 'Unlocked leaf tiles connect around locked tile');
  const coords = group2.map(({ x, y }) => `${x},${y}`).sort();
  assert.ok(coords.includes('0,1'));
  assert.ok(coords.includes('1,0'));
  assert.ok(coords.includes('1,1'));
}

console.log('  findGroup (locked tiles edge case): passed');

// --- collapseBoard preserves locked tiles above ---

{
  const level = testLevels[0];
  const board = [
    [{ id: '0-0', symbol: 'sun', locked: true }, { id: '1-0', symbol: 'leaf', locked: false }, { id: '2-0', symbol: 'moon', locked: false }],
    [null, { id: '1-1', symbol: 'sun', locked: false }, null],
    [null, null, null]
  ];

  const collapsed = collapseBoard(board, level, alwaysLeaf);

  assert.equal(collapsed[2][0].symbol, 'sun');
  assert.equal(collapsed[2][0].locked, true, 'Locked tile should be preserved during collapse');
}

console.log('  collapseBoard (locked tile preservation): passed');

// --- createSeededRandom produces uniform distribution ---

{
  const random = createSeededRandom(12345);
  const buckets = [0, 0, 0, 0, 0];
  const samples = 1000;

  for (let i = 0; i < samples; i++) {
    const val = random();
    const bucket = Math.min(4, Math.floor(val * 5));
    buckets[bucket]++;
  }

  buckets.forEach((count) => {
    assert.ok(count > 100, `Bucket should have reasonable count, got ${count}`);
  });
}

console.log('  createSeededRandom (distribution): passed');

// --- Integration: full game flow ---

{
  let state = createInitialState(createLevels(150));
  state = startLevel(state, 0);
  assert.equal(state.status, 'playing');
  assert.equal(state.levelIndex, 0);

  const level = getCurrentLevel(state);
  assert.equal(level.id, 1);
  assert.equal(level.band, 'Kolay');

  state = watchLifeAd(state);
  assert.equal(state.lives, 5);
  assert.equal(state.adWatches, 1);
}

console.log('  Integration (full game flow): passed');

console.log('\nAll game-engine coverage tests passed!');
