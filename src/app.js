import {
  SYMBOLS,
  symbolById,
  applyMove,
  claimDailyReward,
  continueWithAd,
  continueWithGold,
  createInitialState,
  createLevels,
  findGroup,
  getCurrentLevel,
  nextLevel,
  quitLevel,
  startLevel,
  useHint,
  useShuffle,
  useUndo,
  watchLifeAd
} from './game-engine.js';

const elements = {
  homeScreen: document.querySelector('#home-screen'),
  gameScreen: document.querySelector('#game-screen'),
  homeLives: document.querySelector('#home-lives'),
  homeGold: document.querySelector('#home-gold'),
  homeStreak: document.querySelector('#home-streak'),
  dailyStreak: document.querySelector('#daily-streak'),
  claimDaily: document.querySelector('#claim-daily'),
  playButton: document.querySelector('#play-button'),
  watchLifeAd: document.querySelector('#watch-life-ad'),
  levelStrip: document.querySelector('#level-strip'),
  backHome: document.querySelector('#back-home'),
  levelLabel: document.querySelector('#level-label'),
  moveLabel: document.querySelector('#move-label'),
  goldLabel: document.querySelector('#gold-label'),
  goalList: document.querySelector('#goal-list'),
  scoreLabel: document.querySelector('#score-label'),
  message: document.querySelector('#message'),
  board: document.querySelector('#board'),
  hintButton: document.querySelector('#hint-button'),
  shuffleButton: document.querySelector('#shuffle-button'),
  undoButton: document.querySelector('#undo-button'),
  hintCount: document.querySelector('#hint-count'),
  shuffleCount: document.querySelector('#shuffle-count'),
  undoCount: document.querySelector('#undo-count'),
  modal: document.querySelector('#modal'),
  modalBadge: document.querySelector('#modal-badge'),
  modalTitle: document.querySelector('#modal-title'),
  modalCopy: document.querySelector('#modal-copy'),
  modalActions: document.querySelector('#modal-actions')
};

let state = createInitialState(createLevels(30));
let resolvingMove = false;

function setScreen(screen) {
  elements.homeScreen.classList.toggle('active', screen === 'home');
  elements.gameScreen.classList.toggle('active', screen === 'game');
}

function formatGoals(goals) {
  return Object.entries(goals).map(([symbolId, remaining]) => {
    const symbol = symbolById.get(symbolId);
    return `<span class="goal-token ${symbol.color}"><b>${symbol.icon}</b><small>${symbol.label}</small> ${Math.max(0, remaining)}</span>`;
  }).join('');
}

function renderLevelStrip() {
  elements.levelStrip.innerHTML = state.levels.slice(0, 12).map((level, index) => {
    const active = index === state.levelIndex ? 'active' : '';
    const done = index < state.levelIndex ? 'done' : '';
    return `<button class="level-node ${active} ${done}" data-level="${index}">${level.id}</button>`;
  }).join('');
}

function renderHome() {
  elements.homeLives.textContent = state.lives;
  elements.homeGold.textContent = state.gold;
  elements.homeStreak.textContent = state.streak;
  elements.dailyStreak.textContent = state.dailyClaimed ? 'Bugunku odul alindi' : '1. gun odulu hazir';
  elements.claimDaily.disabled = state.dailyClaimed;
  elements.playButton.disabled = state.lives <= 0;
  elements.watchLifeAd.disabled = state.lives >= 5;
  renderLevelStrip();
}

function renderBoard() {
  const level = getCurrentLevel(state);
  elements.board.style.setProperty('--cols', level.width);
  elements.board.innerHTML = state.board.flatMap((row, y) =>
    row.map((tile, x) => {
      const symbol = symbolById.get(tile.symbol) ?? SYMBOLS[0];
      const key = `${x},${y}`;
      const highlighted = state.highlighted.includes(key) ? 'highlighted' : '';
      const locked = tile.locked ? 'locked' : '';
      return `
        <button
          class="tile ${symbol.color} ${highlighted} ${locked}"
          data-x="${x}"
          data-y="${y}"
          aria-label="${symbol.label} tasi"
        >
          <span class="tile-code">${tile.locked ? 'K' : symbol.icon}</span>
          <small>${tile.locked ? 'Kilit' : symbol.label}</small>
        </button>
      `;
    })
  ).join('');
}

function renderGame() {
  const level = getCurrentLevel(state);
  elements.levelLabel.textContent = `Bolum ${level.id}`;
  elements.moveLabel.textContent = `Hamle: ${state.movesRemaining}`;
  elements.goldLabel.textContent = state.gold;
  elements.goalList.innerHTML = formatGoals(state.goals);
  elements.scoreLabel.textContent = state.score;
  elements.message.textContent = state.message;
  elements.hintCount.textContent = state.boosters.hint;
  elements.shuffleCount.textContent = state.boosters.shuffle;
  elements.undoCount.textContent = state.boosters.undo;
  elements.hintButton.disabled = state.boosters.hint <= 0 || state.status !== 'playing';
  elements.shuffleButton.disabled = state.boosters.shuffle <= 0 || state.status !== 'playing';
  elements.undoButton.disabled = state.boosters.undo <= 0 || state.history.length === 0 || state.status !== 'playing';
  renderBoard();
}

function render() {
  renderHome();
  renderGame();
}

function hideModal() {
  elements.modal.classList.add('hidden');
  elements.modalActions.innerHTML = '';
}

function showModal({ badge, title, copy, actions }) {
  elements.modalBadge.textContent = badge;
  elements.modalTitle.textContent = title;
  elements.modalCopy.textContent = copy;
  elements.modalActions.innerHTML = '';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.textContent = action.label;
    button.className = action.variant ?? 'primary-button';
    button.disabled = Boolean(action.disabled);
    button.addEventListener('click', action.onClick);
    elements.modalActions.append(button);
  });

  elements.modal.classList.remove('hidden');
}

function openLostModal() {
  const totalRemaining = Object.values(state.goals).reduce((sum, value) => sum + Math.max(0, value), 0);
  const closeCopy = totalRemaining <= 8
    ? 'Gercekten cok az kaldi. 5 hamle ile bolumu bitirebilirsin.'
    : 'Stratejini degistir veya 5 hamle daha alarak devam et.';

  showModal({
    badge: 'Son Hamle Analizi',
    title: totalRemaining <= 8 ? 'Cok az kaldi!' : 'Bir deneme daha!',
    copy: closeCopy,
    actions: [
      {
        label: 'Reklam Izle +5 Hamle',
        onClick: () => {
          elements.modalCopy.textContent = 'Reklam simule ediliyor... 3';
          let count = 2;
          const timer = window.setInterval(() => {
            if (count === 0) {
              window.clearInterval(timer);
              state = continueWithAd(state);
              hideModal();
              render();
              return;
            }
            elements.modalCopy.textContent = `Reklam simule ediliyor... ${count}`;
            count -= 1;
          }, 600);
        }
      },
      {
        label: '120 Altin Harca',
        variant: 'secondary-button',
        disabled: state.gold < 120,
        onClick: () => {
          state = continueWithGold(state);
          hideModal();
          render();
        }
      },
      {
        label: 'Vazgec',
        variant: 'ghost-button',
        onClick: () => {
          state = quitLevel(state);
          hideModal();
          setScreen('home');
          render();
        }
      }
    ]
  });
}

function openWinModal() {
  const stars = '★'.repeat(state.lastStars);

  showModal({
    badge: 'Bolum Tamamlandi',
    title: `${stars} Tebrikler!`,
    copy: `Puan: ${state.score}. Altin ve seri odulu kazandin.`,
    actions: [
      {
        label: 'Sonraki Bolum',
        onClick: () => {
          state = nextLevel(state);
          hideModal();
          render();
        }
      },
      {
        label: 'Ana Menu',
        variant: 'secondary-button',
        onClick: () => {
          hideModal();
          setScreen('home');
          render();
        }
      }
    ]
  });
}

elements.playButton.addEventListener('click', () => {
  if (state.lives <= 0) return;
  state = startLevel(state, state.levelIndex);
  setScreen('game');
  hideModal();
  render();
});

elements.backHome.addEventListener('click', () => {
  state = { ...state, status: 'home' };
  hideModal();
  setScreen('home');
  render();
});

elements.claimDaily.addEventListener('click', () => {
  state = claimDailyReward(state);
  render();
});

elements.watchLifeAd.addEventListener('click', () => {
  state = watchLifeAd(state);
  render();
});

elements.levelStrip.addEventListener('click', (event) => {
  const button = event.target.closest('[data-level]');
  if (!button) return;
  state = startLevel(state, Number(button.dataset.level));
  setScreen('game');
  hideModal();
  render();
});

elements.board.addEventListener('click', (event) => {
  if (resolvingMove) return;
  const button = event.target.closest('[data-x]');
  if (!button) return;

  const x = Number(button.dataset.x);
  const y = Number(button.dataset.y);
  const group = findGroup(state.board, x, y);

  if (group.length >= 2) {
    resolvingMove = true;
    state = {
      ...state,
      highlighted: group.map((item) => `${item.x},${item.y}`),
      message: `${group.length} tas secildi...`
    };
    render();

    window.setTimeout(() => {
      state = applyMove(state, x, y);
      resolvingMove = false;
      render();

      if (state.status === 'lost') openLostModal();
      if (state.status === 'won') openWinModal();
    }, 320);
    return;
  }

  state = applyMove(state, x, y);
  render();
});

elements.hintButton.addEventListener('click', () => {
  state = useHint(state);
  render();
});

elements.shuffleButton.addEventListener('click', () => {
  state = useShuffle(state);
  render();
});

elements.undoButton.addEventListener('click', () => {
  state = useUndo(state);
  render();
});

render();
