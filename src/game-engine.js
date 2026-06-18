export const SYMBOLS = [
  { id: 'leaf', icon: 'YA', label: 'Yaprak', color: 'green' },
  { id: 'sun', icon: 'GU', label: 'Gunes', color: 'yellow' },
  { id: 'moon', icon: 'AY', label: 'Ay', color: 'purple' },
  { id: 'drop', icon: 'SU', label: 'Damla', color: 'blue' },
  { id: 'flower', icon: 'CI', label: 'Cicek', color: 'pink' },
  { id: 'star', icon: 'YZ', label: 'Yildiz', color: 'orange' }
];

export const symbolById = new Map(SYMBOLS.map((symbol) => [symbol.id, symbol]));

export function createSeededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function createLevels(count = 150) {
  return Array.from({ length: count }, (_, index) => {
    const levelNumber = index + 1;
    const band = levelNumber <= 40 ? 'Kolay' : levelNumber <= 95 ? 'Orta' : 'Zor';
    const width = levelNumber <= 15 ? 5 : levelNumber <= 95 ? 6 : 7;
    const height = levelNumber <= 15 ? 6 : 7;
    const symbolCount = Math.min(3 + Math.floor(levelNumber / 18), SYMBOLS.length);
    const primary = SYMBOLS[index % symbolCount].id;
    const secondary = SYMBOLS[(index + 2) % symbolCount].id;
    const tertiary = SYMBOLS[(index + 4) % symbolCount].id;
    const hardLevel = levelNumber % 10 === 0;
    const moveLimit = Math.max(14, 22 + Math.floor(levelNumber / 10) - (hardLevel ? 2 : 0));
    const timeLimit = Math.max(70, 125 + Math.floor(levelNumber / 3) - (hardLevel ? 15 : 0));
    const goals = {
      [primary]: 10 + Math.floor(levelNumber * 1.05),
      [secondary]: 7 + Math.floor(levelNumber * 0.75)
    };

    if (levelNumber >= 45) {
      goals[tertiary] = 6 + Math.floor(levelNumber * 0.45);
    }

    return {
      id: levelNumber,
      band,
      width,
      height,
      seed: 7000 + levelNumber * 97,
      moveLimit,
      timeLimit,
      symbolIds: SYMBOLS.slice(0, symbolCount).map((symbol) => symbol.id),
      goals
    };
  });
}

export function cloneBoard(board) {
  return board.map((row) => row.map((tile) => ({ ...tile })));
}

export function cloneState(state) {
  return {
    ...state,
    board: cloneBoard(state.board),
    goals: { ...state.goals },
    boosters: { ...state.boosters },
    invalidTiles: [...(state.invalidTiles ?? [])],
    history: state.history.map((entry) => ({
      ...entry,
      board: cloneBoard(entry.board),
      goals: { ...entry.goals },
      boosters: { ...entry.boosters }
    }))
  };
}

function pickSymbol(symbolIds, random) {
  return symbolIds[Math.floor(random() * symbolIds.length)];
}

export function generateBoard(level, random = createSeededRandom(level.seed)) {
  return Array.from({ length: level.height }, (_, y) =>
    Array.from({ length: level.width }, (_, x) => ({
      id: `${x}-${y}`,
      symbol: pickSymbol(level.symbolIds, random),
      locked: level.id >= 9 && (x + y + level.id) % 13 === 0
    }))
  );
}

export function createInitialState(levels = createLevels()) {
  const firstLevel = levels[0];

  return {
    levels,
    levelIndex: 0,
    board: generateBoard(firstLevel),
    goals: { ...firstLevel.goals },
    movesRemaining: firstLevel.moveLimit,
    timeRemaining: firstLevel.timeLimit,
    score: 0,
    gold: 250,
    lives: 5,
    streak: 0,
    dailyClaimed: false,
    adWatches: 0,
    status: 'home',
    message: 'Ayni sembolden 2+ tas sec.',
    highlighted: [],
    invalidTiles: [],
    lastPenalty: null,
    lastStars: 0,
    boosters: {
      hint: 3,
      shuffle: 2,
      undo: 2
    },
    history: []
  };
}

export function getCurrentLevel(state) {
  return state.levels[state.levelIndex];
}

function isInside(board, x, y) {
  return y >= 0 && y < board.length && x >= 0 && x < board[0].length;
}

export function findGroup(board, startX, startY) {
  if (!isInside(board, startX, startY)) return [];
  const startTile = board[startY][startX];
  if (!startTile || startTile.locked) return [];

  const target = startTile.symbol;
  const stack = [[startX, startY]];
  const visited = new Set();
  const group = [];

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;
    if (visited.has(key) || !isInside(board, x, y)) continue;
    visited.add(key);

    const tile = board[y][x];
    if (!tile || tile.locked || tile.symbol !== target) continue;

    group.push({ x, y, tile });
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return group;
}

function unlockAdjacent(board, group) {
  const unlocked = [];

  group.forEach(({ x, y }) => {
    [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nextX, nextY]) => {
      if (!isInside(board, nextX, nextY)) return;
      const tile = board[nextY][nextX];
      if (tile?.locked) {
        tile.locked = false;
        unlocked.push({ x: nextX, y: nextY });
      }
    });
  });

  return unlocked;
}

export function collapseBoard(board, level, random = Math.random) {
  const height = board.length;
  const width = board[0].length;
  const nextBoard = Array.from({ length: height }, () => Array(width).fill(null));

  for (let x = 0; x < width; x += 1) {
    const column = [];

    for (let y = height - 1; y >= 0; y -= 1) {
      if (board[y][x]) column.push(board[y][x]);
    }

    for (let y = height - 1; y >= 0; y -= 1) {
      const tile = column.shift();
      nextBoard[y][x] = tile
        ? { ...tile, id: `${x}-${y}` }
        : { id: `${x}-${y}`, symbol: pickSymbol(level.symbolIds, random), locked: false };
    }
  }

  return nextBoard;
}

export function isLevelComplete(goals) {
  return Object.values(goals).every((remaining) => remaining <= 0);
}

export function getStars(state) {
  const level = getCurrentLevel(state);
  const moveRatio = state.movesRemaining / level.moveLimit;
  const timeRatio = state.timeRemaining / level.timeLimit;
  const ratio = (moveRatio + timeRatio) / 2;

  if (ratio >= 0.35) return 3;
  if (ratio >= 0.15) return 2;
  return 1;
}

function pushHistory(nextState) {
  const snapshot = {
    board: cloneBoard(nextState.board),
    goals: { ...nextState.goals },
    movesRemaining: nextState.movesRemaining,
    timeRemaining: nextState.timeRemaining,
    score: nextState.score,
    boosters: { ...nextState.boosters },
    message: nextState.message
  };

  return {
    ...nextState,
    history: [...nextState.history.slice(-4), snapshot]
  };
}

export function applyMove(state, x, y, random = Math.random) {
  if (state.status !== 'playing') return state;

  const group = findGroup(state.board, x, y);
  if (group.length < 2) {
    const nextState = {
      ...state,
      highlighted: [],
      invalidTiles: [`${x},${y}`],
      lastPenalty: { moves: 1, seconds: 5, score: 25 },
      movesRemaining: Math.max(0, state.movesRemaining - 1),
      timeRemaining: Math.max(0, state.timeRemaining - 5),
      score: Math.max(0, state.score - 25),
      message: 'Yanlis hamle! -1 hamle, -5 sn, -25 puan.'
    };

    if (nextState.movesRemaining === 0 || nextState.timeRemaining === 0) {
      return {
        ...nextState,
        status: 'lost',
        message: 'Yanlis hamle pahaliya patladi. Reklam izleyip devam edebilirsin.'
      };
    }

    return nextState;
  }

  const level = getCurrentLevel(state);
  let nextState = pushHistory(cloneState(state));
  const nextBoard = cloneBoard(nextState.board);
  const goals = { ...nextState.goals };
  const symbol = group[0].tile.symbol;
  const symbolMeta = symbolById.get(symbol);
  let targetMessage = `${group.length} ${symbolMeta.label} tasi temizlendi.`;

  group.forEach(({ x: tileX, y: tileY }) => {
    nextBoard[tileY][tileX] = null;
  });

  const unlocked = unlockAdjacent(nextBoard, group);
  const comboBonus = group.length >= 5 ? 100 : group.length >= 4 ? 50 : 0;
  if (Object.hasOwn(goals, symbol)) {
    const beforeGoal = goals[symbol];
    goals[symbol] = Math.max(0, goals[symbol] - group.length);
    targetMessage = `${symbolMeta.label} hedefi: ${beforeGoal} -> ${goals[symbol]}.`;
  } else {
    targetMessage = `${symbolMeta.label} hedef degil; hedefler degismedi.`;
  }

  nextState = {
    ...nextState,
    board: collapseBoard(nextBoard, level, random),
    goals,
    movesRemaining: Math.max(0, nextState.movesRemaining - 1),
    timeRemaining: nextState.timeRemaining,
    score: nextState.score + group.length * group.length * 10 + comboBonus + unlocked.length * 25,
    highlighted: [],
    invalidTiles: [],
    lastPenalty: null,
    message: group.length >= 4 ? `Kombo! ${targetMessage}` : targetMessage
  };

  if (isLevelComplete(nextState.goals)) {
    const stars = getStars(nextState);
    return {
      ...nextState,
      status: 'won',
      streak: nextState.streak + 1,
      gold: nextState.gold + 35 + stars * 20,
      lastStars: stars,
      message: `Bolum bitti! ${stars} yildiz kazandin.`
    };
  }

  if (nextState.movesRemaining === 0 || nextState.timeRemaining === 0) {
    return {
      ...nextState,
      status: 'lost',
      message: nextState.timeRemaining === 0
        ? 'Sure bitti! Reklam izleyip devam edebilirsin.'
        : 'Cok az kaldi! Reklam izleyip +5 hamle alabilirsin.'
    };
  }

  return nextState;
}

export function continueWithAd(state) {
  if (state.status !== 'lost') return state;

  return {
    ...state,
    status: 'playing',
    movesRemaining: state.movesRemaining + 5,
    timeRemaining: state.timeRemaining + 30,
    adWatches: state.adWatches + 1,
    invalidTiles: [],
    message: 'Reklam odulu geldi: +5 hamle ve +30 sn.'
  };
}

export function continueWithGold(state, cost = 120) {
  if (state.status !== 'lost' || state.gold < cost) return state;

  return {
    ...state,
    status: 'playing',
    movesRemaining: state.movesRemaining + 5,
    timeRemaining: state.timeRemaining + 30,
    gold: state.gold - cost,
    invalidTiles: [],
    message: 'Altin ile +5 hamle ve +30 sn alindi.'
  };
}

export function quitLevel(state) {
  if (state.status !== 'lost') return state;

  return {
    ...state,
    status: 'home',
    lives: Math.max(0, state.lives - 1),
    streak: 0,
    message: 'Can kaybettin. Tekrar deneyebilirsin.'
  };
}

export function startLevel(state, levelIndex = state.levelIndex) {
  const level = state.levels[levelIndex];
  const random = createSeededRandom(level.seed + state.adWatches + state.streak);

  return {
    ...state,
    levelIndex,
    board: generateBoard(level, random),
    goals: { ...level.goals },
    movesRemaining: level.moveLimit,
    timeRemaining: level.timeLimit,
    score: 0,
    status: 'playing',
    highlighted: [],
    invalidTiles: [],
    lastPenalty: null,
    message: 'Ayni sembolden 2+ tas sec.',
    history: []
  };
}

export function nextLevel(state) {
  const nextIndex = Math.min(state.levelIndex + 1, state.levels.length - 1);
  return startLevel({ ...state, status: 'playing' }, nextIndex);
}

export function claimDailyReward(state) {
  if (state.dailyClaimed) return state;

  return {
    ...state,
    dailyClaimed: true,
    gold: state.gold + 75,
    boosters: {
      ...state.boosters,
      hint: state.boosters.hint + 1
    },
    message: 'Gunluk odul: 75 altin ve 1 ipucu.'
  };
}

export function watchLifeAd(state) {
  return {
    ...state,
    lives: Math.min(5, state.lives + 1),
    adWatches: state.adWatches + 1,
    message: 'Reklam odulu geldi: +1 can.'
  };
}

export function getBestHint(state) {
  let best = [];

  for (let y = 0; y < state.board.length; y += 1) {
    for (let x = 0; x < state.board[y].length; x += 1) {
      const group = findGroup(state.board, x, y);
      if (group.length > best.length) best = group;
    }
  }

  return best;
}

export function useHint(state) {
  if (state.boosters.hint <= 0 || state.status !== 'playing') return state;
  const best = getBestHint(state);

  return {
    ...state,
    boosters: { ...state.boosters, hint: state.boosters.hint - 1 },
    highlighted: best.map((item) => `${item.x},${item.y}`),
    message: best.length > 0 ? `${best.length} taslik iyi hamle isaretlendi.` : 'Uygun hamle bulunamadi.'
  };
}

export function useShuffle(state, random = Math.random) {
  if (state.boosters.shuffle <= 0 || state.status !== 'playing') return state;
  const level = getCurrentLevel(state);

  return {
    ...pushHistory(cloneState(state)),
    boosters: { ...state.boosters, shuffle: state.boosters.shuffle - 1 },
    board: generateBoard(level, random),
    highlighted: [],
    message: 'Tahta karistirildi.'
  };
}

export function useUndo(state) {
  if (state.boosters.undo <= 0 || state.status !== 'playing' || state.history.length === 0) return state;
  const previous = state.history[state.history.length - 1];

  return {
    ...state,
    board: cloneBoard(previous.board),
    goals: { ...previous.goals },
    movesRemaining: previous.movesRemaining,
    timeRemaining: previous.timeRemaining,
    score: previous.score,
    boosters: { ...state.boosters, undo: state.boosters.undo - 1 },
    highlighted: [],
    invalidTiles: [],
    history: state.history.slice(0, -1),
    message: 'Son hamle geri alindi.'
  };
}

export function tickTimer(state, seconds = 1) {
  if (state.status !== 'playing') return state;

  const timeRemaining = Math.max(0, state.timeRemaining - seconds);
  const nextState = {
    ...state,
    timeRemaining,
    invalidTiles: []
  };

  if (timeRemaining === 0) {
    return {
      ...nextState,
      status: 'lost',
      message: 'Sure bitti! Reklam izleyip +5 hamle ve +30 sn alabilirsin.'
    };
  }

  return nextState;
}
