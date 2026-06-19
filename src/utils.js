/**
 * Shared utility functions for Bir Hamle Daha game.
 */

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function advanceProgress(item, amount) {
  return {
    ...item,
    progress: Math.min(item.target, item.progress + amount)
  };
}

export function updateQuests(quests, questId, amount) {
  return quests.map((quest) =>
    quest.id === questId ? advanceProgress(quest, amount) : quest
  );
}

export function decrementBooster(boosters, key) {
  return { ...boosters, [key]: Math.max(0, boosters[key] - 1) };
}

export function incrementBooster(boosters, key, amount = 1) {
  return { ...boosters, [key]: boosters[key] + amount };
}

export function isOutOfResources(state) {
  return state.movesRemaining === 0 || state.timeRemaining === 0;
}

export function makeLostState(state, message) {
  return {
    ...state,
    status: 'lost',
    message
  };
}

export function addContinueResources(state, moves = 5, seconds = 30) {
  return {
    ...state,
    status: 'playing',
    movesRemaining: state.movesRemaining + moves,
    timeRemaining: state.timeRemaining + seconds,
    invalidTiles: []
  };
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
