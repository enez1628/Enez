import {
  SYMBOLS,
  symbolById,
  applyMove,
  claimDailyReward,
  claimPendingReward,
  continueWithAd,
  continueWithGold,
  createInitialState,
  createLevels,
  findGroup,
  getCurrentLevel,
  nextLevel,
  quitLevel,
  startLevel,
  tickTimer,
  useHint,
  useShuffle,
  useUndo,
  watchLifeAd
} from './game-engine.js';

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const elements = {
  homeScreen: document.querySelector('#home-screen'),
  gameScreen: document.querySelector('#game-screen'),
  homeLives: document.querySelector('#home-lives'),
  homeGold: document.querySelector('#home-gold'),
  homeStreak: document.querySelector('#home-streak'),
  dailyStreak: document.querySelector('#daily-streak'),
  claimDaily: document.querySelector('#claim-daily'),
  playButton: document.querySelector('#play-button'),
  continueButton: document.querySelector('#continue-button'),
  watchLifeAd: document.querySelector('#watch-life-ad'),
  levelStrip: document.querySelector('#level-strip'),
  levelCard: document.querySelector('#level-card'),
  metaPanel: document.querySelector('#meta-panel'),
  homeNavButtons: document.querySelectorAll('.home-nav-button'),
  backHome: document.querySelector('#back-home'),
  levelLabel: document.querySelector('#level-label'),
  moveLabel: document.querySelector('#move-label'),
  timerLabel: document.querySelector('#timer-label'),
  goldLabel: document.querySelector('#gold-label'),
  difficultyLabel: document.querySelector('#difficulty-label'),
  goalList: document.querySelector('#goal-list'),
  scoreLabel: document.querySelector('#score-label'),
  message: document.querySelector('#message'),
  board: document.querySelector('#board'),
  hintButton: document.querySelector('#hint-button'),
  shuffleButton: document.querySelector('#shuffle-button'),
  undoButton: document.querySelector('#undo-button'),
  soundButton: document.querySelector('#sound-button'),
  hintCount: document.querySelector('#hint-count'),
  shuffleCount: document.querySelector('#shuffle-count'),
  undoCount: document.querySelector('#undo-count'),
  soundLabel: document.querySelector('#sound-label'),
  modal: document.querySelector('#modal'),
  modalBadge: document.querySelector('#modal-badge'),
  modalTitle: document.querySelector('#modal-title'),
  modalCopy: document.querySelector('#modal-copy'),
  modalActions: document.querySelector('#modal-actions')
};

const STORAGE_KEY = 'bir-hamle-daha-save-v2';
const SOUND_KEY = 'bir-hamle-daha-music-enabled';
let state = loadSavedState() ?? createInitialState(createLevels(150));
let resolvingMove = false;
let audioContext = null;
let musicTimer = null;
let musicEnabled = localStorage.getItem(SOUND_KEY) === 'true' || state.musicEnabled === true;
let activeHomeTab = 'home';

const VALID_SYMBOL_IDS = new Set(SYMBOLS.map((s) => s.id));

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null) return null;
    if (saved.board && Array.isArray(saved.board)) {
      for (const row of saved.board) {
        if (!Array.isArray(row)) { localStorage.removeItem(STORAGE_KEY); return null; }
        for (const tile of row) {
          if (tile && typeof tile.symbol === 'string' && !VALID_SYMBOL_IDS.has(tile.symbol)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
          }
        }
      }
    }
    const levels = createLevels(150);
    const level = levels[saved.levelIndex] ?? levels[0];
    const base = createInitialState(levels);
    const meta = {
      ...base.meta,
      ...(saved.meta ?? {}),
      island: { ...base.meta.island, ...(saved.meta?.island ?? {}) },
      tracks: {
        levelChest: { ...base.meta.tracks.levelChest, ...(saved.meta?.tracks?.levelChest ?? {}) },
        freeGift: { ...base.meta.tracks.freeGift, ...(saved.meta?.tracks?.freeGift ?? {}) },
        matchPass: { ...base.meta.tracks.matchPass, ...(saved.meta?.tracks?.matchPass ?? {}) },
        piggyBank: { ...base.meta.tracks.piggyBank, ...(saved.meta?.tracks?.piggyBank ?? {}) }
      },
      quests: saved.meta?.quests ?? base.meta.quests
    };

    return {
      ...base,
      ...saved,
      levels,
      meta,
      goals: saved.goals ?? { ...level.goals },
      board: saved.board ?? base.board,
      movesRemaining: Number.isFinite(saved.movesRemaining) ? saved.movesRemaining : level.moveLimit,
      timeRemaining: Number.isFinite(saved.timeRemaining) ? saved.timeRemaining : level.timeLimit,
      boosters: { hint: 3, shuffle: 2, undo: 2, ...(saved.boosters ?? {}) },
      highlighted: [],
      invalidTiles: [],
      history: Array.isArray(saved.history) ? saved.history : []
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    savedAt: Date.now(),
    musicEnabled,
    highlighted: [],
    invalidTiles: []
  }));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setScreen(screen) {
  elements.homeScreen.classList.toggle('active', screen === 'home');
  elements.gameScreen.classList.toggle('active', screen === 'game');
}

function renderSymbolIcon(symbolId) {
  const safeId = escapeHTML(symbolId).replace(/[^a-z0-9-]/g, '');
  return `<span class="symbol-icon icon-${safeId}" aria-hidden="true"></span>`;
}

function renderProgressBar(progress, target = 100) {
  const percent = Math.min(100, Math.round((progress / target) * 100));
  return `<div class="progress-bar"><span style="width:${percent}%"></span><strong>${percent}%</strong></div>`;
}

function renderRewardIcon(type) {
  const icons = {
    gold: 'coin',
    stars: 'star',
    lives: 'heart',
    hint: 'hint',
    shuffle: 'bomb',
    undo: 'undo',
    chest: 'chest',
    gift: 'gift',
    piggy: 'piggy'
  };
  const safeClass = escapeHTML(icons[type] ?? 'gift').replace(/[^a-z0-9-]/g, '');
  return `<span class="reward-icon reward-${safeClass}"></span>`;
}

function formatGoals(goals) {
  return Object.entries(goals).map(([symbolId, remaining]) => {
    const symbol = symbolById.get(symbolId);
    if (!symbol) return '';
    return `
      <span class="goal-token ${escapeHTML(symbol.color)}">
        ${renderSymbolIcon(symbolId)}
        <small>${escapeHTML(symbol.label)}</small>
        <strong>${Math.max(0, Number(remaining) || 0)}</strong>
      </span>
    `;
  }).join('');
}

function renderLevelStrip() {
  elements.levelStrip.innerHTML = state.levels.slice(0, 24).map((level, index) => {
    const active = index === state.levelIndex ? 'active' : '';
    const done = index < state.levelIndex ? 'done' : '';
    return `<button class="level-node ${active} ${done}" data-level="${index}"><span>${level.id}</span><small>${level.band}</small></button>`;
  }).join('');
}

function renderHome() {
  elements.homeLives.textContent = state.lives;
  elements.homeGold.textContent = state.gold;
  elements.homeStreak.textContent = state.streak;
  elements.dailyStreak.textContent = state.dailyClaimed ? 'Bugunku odul alindi' : '1. gun odulu hazir';
  elements.claimDaily.disabled = state.dailyClaimed;
  elements.playButton.disabled = state.lives <= 0;
  elements.continueButton.classList.toggle('hidden', state.status !== 'playing');
  elements.watchLifeAd.disabled = state.lives >= 5;
  elements.levelCard.classList.toggle('hidden', activeHomeTab !== 'home');
  elements.metaPanel.classList.toggle('hidden', activeHomeTab === 'home');
  elements.homeNavButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === activeHomeTab);
  });
  renderMetaPanel();
  renderLevelStrip();
}

function renderMetaPanel() {
  if (activeHomeTab === 'home') {
    elements.metaPanel.innerHTML = '';
    return;
  }

  if (activeHomeTab === 'rewards') {
    const tracks = state.meta.tracks;
    const claimed = state.meta.lastClaimedReward;
    elements.metaPanel.innerHTML = `
      <div class="meta-header"><span class="label">Odul Merkezi</span><strong>Bir bolum daha, bir odul daha</strong></div>
      ${claimed ? `
        <div class="claim-banner">
          ${renderRewardIcon('gold')}
          <div><strong>Yeni odul alindi</strong><span>+${claimed.gold} altin, +${claimed.stars} yildiz</span></div>
        </div>
      ` : ''}
      <div class="reward-grid">
        ${renderTrackCard('Seviye Kutusu', 'chest', tracks.levelChest)}
        ${renderTrackCard('Ucretsiz Odul', 'gift', tracks.freeGift)}
        ${renderTrackCard('Eslesme Pasi', 'star', tracks.matchPass)}
        ${renderTrackCard('Kumbara', 'piggy', tracks.piggyBank, `${tracks.piggyBank.coins} altin`)}
      </div>
      <div class="island-card">
        <div>
          <span class="label">${state.meta.island.name}</span>
          <strong>${state.meta.island.nextDecoration}</strong>
          ${renderProgressBar(state.meta.island.progress)}
        </div>
        <div class="island-preview"><span></span><span></span><span></span></div>
      </div>
    `;
    return;
  }

  if (activeHomeTab === 'quests') {
    elements.metaPanel.innerHTML = `
      <div class="meta-header"><span class="label">Gunluk Gorev</span><strong>Bugunku hedefleri tamamla</strong></div>
      <div class="quest-list">
        ${state.meta.quests.map((quest) => `
          <article class="quest-card ${quest.progress >= quest.target ? 'complete' : ''}">
            <div>
              <strong>${quest.label}</strong>
              ${renderProgressBar(quest.progress, quest.target)}
            </div>
            <span>${quest.progress}/${quest.target}</span>
            <small>${quest.reward}</small>
          </article>
        `).join('')}
      </div>
    `;
    return;
  }

  elements.metaPanel.innerHTML = `
    <div class="meta-header"><span class="label">Magaza</span><strong>Test paketleri</strong></div>
    <div class="shop-list">
      ${renderShopCard('Baslangic Paketi', '+900 altin, +1 ipucu, +1 karistir', '$0.00')}
      ${renderShopCard('Eslesme Paketi', '+3500 altin, 3 guclendirici', '$0.00')}
      ${renderShopCard('Reklamsiz Paket', 'Gecis reklamlarini kaldir', '$0.00')}
    </div>
  `;
}

function renderTrackCard(title, icon, track, note = 'Odul hazirlaniyor') {
  return `
    <article class="track-card">
      ${renderRewardIcon(icon)}
      <strong>${title}</strong>
      <small>${note}</small>
      ${renderProgressBar(track.progress, track.target)}
    </article>
  `;
}

function renderShopCard(title, copy, price) {
  return `
    <article class="shop-card">
      <div>${renderRewardIcon('gift')}<strong>${title}</strong><small>${copy}</small></div>
      <button class="price-button">${price}</button>
    </article>
  `;
}

function renderBoard() {
  const level = getCurrentLevel(state);
  elements.board.style.setProperty('--cols', level.width);
  elements.board.innerHTML = state.board.flatMap((row, y) =>
    row.map((tile, x) => {
      const symbol = symbolById.get(tile.symbol) ?? SYMBOLS[0];
      const key = `${x},${y}`;
      const highlighted = state.highlighted.includes(key) ? 'highlighted' : '';
      const invalid = state.invalidTiles?.includes(key) ? 'invalid' : '';
      const locked = tile.locked ? 'locked' : '';
      return `
        <button
          class="tile ${escapeHTML(symbol.color)} ${highlighted} ${invalid} ${locked}"
          data-x="${Number(x)}"
          data-y="${Number(y)}"
          aria-label="${escapeHTML(symbol.label)} tasi"
        >
          ${tile.locked ? '<span class="lock-icon" aria-hidden="true"></span>' : renderSymbolIcon(tile.symbol)}
        </button>
      `;
    })
  ).join('');
}

function renderGame() {
  const level = getCurrentLevel(state);
  elements.levelLabel.textContent = `Bolum ${level.id}`;
  elements.moveLabel.textContent = `Hamle: ${state.movesRemaining}`;
  elements.timerLabel.textContent = formatTime(state.timeRemaining);
  elements.timerLabel.parentElement.classList.toggle('urgent', state.timeRemaining <= 20);
  elements.difficultyLabel.textContent = level.band;
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
  elements.soundLabel.textContent = musicEnabled ? 'Acik' : 'Kapali';
  renderBoard();
}

function render() {
  renderHome();
  renderGame();
  saveState();
}

function hideModal() {
  elements.modal.classList.add('hidden');
  elements.modalActions.innerHTML = '';
}

function showModal({ badge, title, copy, html, actions }) {
  elements.modalBadge.textContent = badge;
  elements.modalTitle.textContent = title;
  if (html) {
    elements.modalCopy.innerHTML = html;
  } else {
    elements.modalCopy.textContent = copy;
  }
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
    ? 'Gercekten cok az kaldi. 5 hamle ve 30 saniye ile bitirebilirsin.'
    : 'Stratejini degistir veya 5 hamle + 30 saniye daha alarak devam et.';

  showModal({
    badge: 'Son Hamle Analizi',
    title: totalRemaining <= 8 ? 'Cok az kaldi!' : 'Bir deneme daha!',
    copy: closeCopy,
    actions: [
      {
        label: 'Reklam Izle +5 Hamle +30 sn',
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
        label: '120 Altin Harca +5 Hamle',
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
  const reward = state.pendingReward;

  if (!reward) {
    state = nextLevel(state);
    render();
    return;
  }

  showModal({
    badge: 'Odul',
    title: `${stars} Kazandin!`,
    html: `
      <div class="reward-modal">
        <div class="reward-items">
          <article>${renderRewardIcon('gold')}<strong>+${reward.gold}</strong><span>Altin</span></article>
          <article>${renderRewardIcon('stars')}<strong>+${reward.stars}</strong><span>Yildiz</span></article>
          <article>${renderRewardIcon('lives')}<strong>${reward.unlimitedLivesMinutes}m</strong><span>Can</span></article>
          <article>${renderRewardIcon('hint')}<strong>+${reward.boosters.hint}</strong><span>Ipucu</span></article>
          <article>${renderRewardIcon('shuffle')}<strong>+${reward.boosters.shuffle}</strong><span>Karistir</span></article>
          <article>${renderRewardIcon('undo')}<strong>+${reward.boosters.undo}</strong><span>Geri Al</span></article>
        </div>
        <div class="reward-progress">
          <strong>Zeka Adasi</strong>
          ${renderProgressBar(state.meta.island.progress + reward.progress.island)}
        </div>
      </div>
    `,
    actions: [
      {
        label: 'Talep Et',
        onClick: () => {
          state = claimPendingReward(state);
          hideModal();
          setScreen('home');
          activeHomeTab = 'rewards';
          render();
        }
      },
      {
        label: '2x Reklamla Al',
        variant: 'secondary-button',
        onClick: () => {
          state = claimPendingReward(state, 2);
          hideModal();
          setScreen('home');
          activeHomeTab = 'rewards';
          render();
        }
      },
      {
        label: 'Sonraki Bolum',
        variant: 'ghost-button',
        onClick: () => {
          state = nextLevel(state);
          hideModal();
          render();
        }
      }
    ]
  });
}

function playTone(frequency, startAt, duration) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.045, startAt + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function scheduleMusicLoop() {
  if (!musicEnabled || !audioContext) return;

  const now = audioContext.currentTime;
  const notes = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
  notes.forEach((note, index) => playTone(note, now + index * 0.36, 0.28));
  musicTimer = window.setTimeout(scheduleMusicLoop, 3000);
}

function toggleMusic() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  musicEnabled = !musicEnabled;
  localStorage.setItem(SOUND_KEY, String(musicEnabled));
  window.clearTimeout(musicTimer);

  if (musicEnabled) {
    scheduleMusicLoop();
  }

  render();
}

function startSavedMusicOnInteraction() {
  if (!musicEnabled || audioContext) return;
  audioContext = new AudioContext();
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  scheduleMusicLoop();
  render();
}

elements.playButton.addEventListener('click', () => {
  if (state.lives <= 0) return;
  state = startLevel(state, state.levelIndex);
  setScreen('game');
  hideModal();
  render();
});

elements.continueButton.addEventListener('click', () => {
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

elements.homeNavButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeHomeTab = button.dataset.tab;
    render();
  });
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

  if (state.invalidTiles?.length > 0) {
    window.setTimeout(() => {
      state = { ...state, invalidTiles: [] };
      render();
    }, 520);
  }

  if (state.status === 'lost') openLostModal();
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

elements.soundButton.addEventListener('click', () => {
  toggleMusic();
});

document.addEventListener('pointerdown', startSavedMusicOnInteraction);

window.setInterval(() => {
  const gameVisible = elements.gameScreen.classList.contains('active');
  if (!gameVisible || resolvingMove || state.status !== 'playing') return;

  state = tickTimer(state);
  render();

  if (state.status === 'lost') {
    openLostModal();
  }
}, 1000);

render();
