import assert from 'node:assert/strict';
import {
  applyMove,
  claimDailyReward,
  continueWithAd,
  createInitialState,
  createLevels,
  findGroup,
  isLevelComplete,
  quitLevel,
  startLevel,
  useHint,
  useUndo
} from '../src/game-engine.js';

const testLevels = [
  {
    id: 1,
    width: 3,
    height: 3,
    seed: 11,
    moveLimit: 2,
    symbolIds: ['leaf', 'sun', 'moon'],
    goals: { leaf: 2 }
  }
];

function makeState() {
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
    movesRemaining: 2
  };
}

function alwaysLeaf() {
  return 0;
}

{
  const state = makeState();
  const group = findGroup(state.board, 0, 0);

  assert.equal(group.length, 2);
  assert.deepEqual(group.map(({ x, y }) => `${x},${y}`).sort(), ['0,0', '1,0']);
}

{
  const state = applyMove(makeState(), 0, 0, alwaysLeaf);

  assert.equal(state.status, 'won');
  assert.equal(state.goals.leaf, 0);
  assert.equal(state.movesRemaining, 1);
  assert.ok(state.score > 0);
  assert.ok(state.gold > 250);
  assert.equal(isLevelComplete(state.goals), true);
}

{
  const state = applyMove(makeState(), 1, 1, alwaysLeaf);

  assert.deepEqual(Object.keys(state.goals), ['leaf']);
  assert.equal(state.goals.leaf, 2);
  assert.equal(state.status, 'playing');
}

{
  let state = makeState();
  state = { ...state, goals: { leaf: 99 }, movesRemaining: 1 };
  state = applyMove(state, 0, 0, alwaysLeaf);

  assert.equal(state.status, 'lost');
  assert.equal(state.movesRemaining, 0);

  state = continueWithAd(state);

  assert.equal(state.status, 'playing');
  assert.equal(state.movesRemaining, 5);
  assert.equal(state.adWatches, 1);
}

{
  let state = makeState();
  state = { ...state, goals: { leaf: 99 }, movesRemaining: 1 };
  state = applyMove(state, 0, 0, alwaysLeaf);
  state = quitLevel(state);

  assert.equal(state.status, 'home');
  assert.equal(state.lives, 4);
  assert.equal(state.streak, 0);
}

{
  let state = makeState();
  state = useHint(state);

  assert.equal(state.boosters.hint, 2);
  assert.ok(state.highlighted.length >= 2);
}

{
  let state = makeState();
  state = applyMove(state, 0, 0, alwaysLeaf);
  state = { ...state, status: 'playing' };
  state = useUndo(state);

  assert.equal(state.movesRemaining, 2);
  assert.equal(state.score, 0);
  assert.equal(state.boosters.undo, 1);
}

{
  const state = claimDailyReward(makeState());

  assert.equal(state.dailyClaimed, true);
  assert.equal(state.gold, 325);
  assert.equal(state.boosters.hint, 4);
}

{
  let state = startLevel(createInitialState(createLevels(30)), 11);
  const targetGroup = state.board
    .flatMap((row, y) => row.map((tile, x) => ({ tile, x, y })))
    .map(({ x, y }) => findGroup(state.board, x, y))
    .find((group) => group.length >= 2 && Object.hasOwn(state.goals, group[0].tile.symbol));

  assert.ok(targetGroup);

  const symbol = targetGroup[0].tile.symbol;
  const before = state.goals[symbol];
  state = applyMove(state, targetGroup[0].x, targetGroup[0].y, alwaysLeaf);

  assert.equal(state.goals[symbol], before - targetGroup.length);
}

console.log('game-engine tests passed');
