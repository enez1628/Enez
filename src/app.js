import {
  SYMBOLS,
  symbolById,
  abandonLevel,
  applyMove,
  claimDailyReward,
  claimPendingReward,
  continueWithAd,
  continueWithGold,
  createInitialState,
  createLevels,
  findGroup,
  getCurrentLevel,
  getShopPackages,
  getGoldPackages,
  purchasePackage,
  purchaseBattlePass,
  buildVillageBuilding,
  spinDailyWheel,
  claimQuestReward,
  shouldShowInterstitial,
  watchAdForGold,
  nextLevel,
  quitLevel,
  startLevel,
  tickTimer,
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
  homeStars: document.querySelector('#home-stars'),
  livesTimer: document.querySelector('#lives-timer'),
  homeMainContent: document.querySelector('#home-main-content'),
  islandView: document.querySelector('#island-view'),
  xpFill: document.querySelector('#xp-fill'),
  xpLabel: document.querySelector('#xp-label'),
  eventTimerLabel: document.querySelector('#event-timer-label'),
  levelNumber: document.querySelector('#level-number'),
  playButton: document.querySelector('#play-button'),
  continueButton: document.querySelector('#continue-button'),
  metaPanel: document.querySelector('#meta-panel'),
  navTabs: document.querySelectorAll('.nav-tab'),
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
  modalActions: document.querySelector('#modal-actions'),
  overlayPanel: document.querySelector('#overlay-panel'),
  overlayBody: document.querySelector('#overlay-body'),
  overlayClose: document.querySelector('#overlay-close')
};

const STORAGE_KEY = 'bir-hamle-daha-save-v2';
const SOUND_KEY = 'bir-hamle-daha-music-enabled';
let state = loadSavedState() ?? createInitialState(createLevels(150));
let resolvingMove = false;
let audioContext = null;
let musicTimer = null;
let musicEnabled = localStorage.getItem(SOUND_KEY) === 'true' || state.musicEnabled === true;
let activeHomeTab = 'home';

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
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
      village: { ...base.meta.village, ...(saved.meta?.village ?? {}), buildings: saved.meta?.village?.buildings ?? base.meta.village.buildings },
      matchEvent: { ...base.meta.matchEvent, ...(saved.meta?.matchEvent ?? {}) },
      battlePass: { ...base.meta.battlePass, ...(saved.meta?.battlePass ?? {}) },
      dailySpin: { ...base.meta.dailySpin, ...(saved.meta?.dailySpin ?? {}) },
      treasureIsland: { ...base.meta.treasureIsland, ...(saved.meta?.treasureIsland ?? {}) },
      beeRace: { ...base.meta.beeRace, ...(saved.meta?.beeRace ?? {}) },
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

function formatCountdown(ms) {
  if (ms <= 0) return '0s';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}g ${String(hours).padStart(2, '0')}s`;
  if (hours > 0) return `${hours}s ${String(minutes).padStart(2, '0')}d`;
  return `${minutes}d`;
}

function setScreen(screen) {
  elements.homeScreen.classList.toggle('active', screen === 'home');
  elements.gameScreen.classList.toggle('active', screen === 'game');
}

function renderSymbolIcon(symbolId) {
  return `<span class="symbol-icon icon-${symbolId}" aria-hidden="true"></span>`;
}

function renderProgressBar(progress, target = 100) {
  const percent = Math.min(100, Math.round((progress / target) * 100));
  return `<div class="progress-bar"><span style="width:${percent}%"></span><strong>${percent}%</strong></div>`;
}

function renderRewardIcon(type) {
  const icons = {
    gold: 'coin', stars: 'star', lives: 'heart', heart: 'heart',
    hint: 'hint', shuffle: 'bomb', undo: 'undo', chest: 'chest',
    gift: 'gift', piggy: 'piggy', dice: 'bomb'
  };
  return `<span class="reward-icon reward-${icons[type] ?? type}"></span>`;
}

function formatGoals(goals) {
  return Object.entries(goals).map(([symbolId, remaining]) => {
    const symbol = symbolById.get(symbolId);
    return `
      <span class="goal-token ${symbol.color}">
        ${renderSymbolIcon(symbolId)}
        <small>${symbol.label}</small>
        <strong>${Math.max(0, remaining)}</strong>
      </span>
    `;
  }).join('');
}

function renderHome() {
  elements.homeLives.textContent = state.lives;
  elements.homeGold.textContent = state.gold;
  elements.homeStars.textContent = state.meta.stars;

  const level = getCurrentLevel(state);
  elements.levelNumber.textContent = level.id;

  elements.playButton.disabled = state.lives <= 0;
  elements.continueButton.classList.toggle('hidden', state.status !== 'playing');

  // XP bar
  const xpProgress = state.meta.matchEvent.progress;
  const xpTarget = state.meta.matchEvent.target;
  const xpPercent = Math.min(100, Math.round((xpProgress / xpTarget) * 100));
  elements.xpFill.style.width = `${xpPercent}%`;
  elements.xpLabel.textContent = `${xpProgress}/${xpTarget}`;

  // Event timer
  const remaining = state.meta.matchEvent.expiresAt - Date.now();
  elements.eventTimerLabel.textContent = formatCountdown(remaining);

  // Show island view or meta panel based on tab
  const showIsland = activeHomeTab === 'home';
  elements.islandView.classList.toggle('hidden', !showIsland);
  elements.metaPanel.classList.toggle('hidden', showIsland);

  elements.navTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === activeHomeTab);
  });

  if (!showIsland) renderMetaPanel();
}

function renderMetaPanel() {
  if (activeHomeTab === 'shop') {
    renderShop();
    return;
  }

  if (activeHomeTab === 'events') {
    renderEvents();
    return;
  }

  if (activeHomeTab === 'rewards') {
    renderRewardHub();
    return;
  }

  if (activeHomeTab === 'gifts') {
    renderGifts();
    return;
  }
}

function renderShop() {
  const packages = getShopPackages();
  const goldPackages = getGoldPackages();
  const alreadyRemovedAds = state.adsRemoved;

  elements.metaPanel.innerHTML = `
    <div class="meta-header">
      <span class="label">MAGAZA</span>
      <strong>Ozel Paketler</strong>
    </div>
    <div class="shop-list">
      ${packages.map((pkg) => {
        const purchased = pkg.removeAds && alreadyRemovedAds;
        return `
        <article class="shop-card ${pkg.featured ? 'featured' : ''} ${purchased ? 'purchased' : ''}">
          ${pkg.badge ? `<span class="shop-card-badge">${pkg.badge}</span>` : ''}
          <div class="shop-card-header">
            <strong>${pkg.name}</strong>
          </div>
          <div class="shop-card-items">
            ${pkg.gold ? `<span class="shop-item">${renderRewardIcon('gold')} ${pkg.gold.toLocaleString()}</span>` : ''}
            ${pkg.livesMinutes ? `<span class="shop-item">${renderRewardIcon('heart')} ${pkg.livesMinutes}m</span>` : ''}
            ${Object.entries(pkg.boosters).map(([key, val]) =>
              val ? `<span class="shop-item">${renderRewardIcon(key)} x${val}</span>` : ''
            ).join('')}
            ${pkg.removeAds ? `<span class="shop-item" style="color:#4CAF50;font-weight:800">Reklam yok!</span>` : ''}
          </div>
          <button class="price-button" data-package="${pkg.id}" ${purchased ? 'disabled' : ''}>${purchased ? 'Satin Alindi' : pkg.price}</button>
        </article>
        `;
      }).join('')}
    </div>

    <div class="meta-header" style="margin-top:16px">
      <span class="label">ALTIN</span>
      <strong>Altin Paketleri</strong>
    </div>
    <div class="shop-list">
      ${goldPackages.map((pkg) => `
        <article class="shop-card ${pkg.badge ? 'featured' : ''}">
          ${pkg.badge ? `<span class="shop-card-badge">${pkg.badge}</span>` : ''}
          <div class="shop-card-header">
            <strong>${renderRewardIcon('gold')} ${pkg.gold.toLocaleString()} Altin</strong>
          </div>
          <button class="price-button" data-gold-package="${pkg.id}">${pkg.price}</button>
        </article>
      `).join('')}
    </div>

    <div class="meta-header" style="margin-top:16px">
      <span class="label">UCRETSIZ</span>
      <strong>Reklam Izle</strong>
    </div>
    <div class="shop-ad-section">
      <button class="ad-reward-btn" id="ad-gold-btn">
        <span class="ad-icon">▶</span>
        <span>Reklam Izle</span>
        <strong>+50 Altin</strong>
      </button>
      <button class="ad-reward-btn" id="ad-life-btn" ${state.lives >= 5 ? 'disabled' : ''}>
        <span class="ad-icon">▶</span>
        <span>Reklam Izle</span>
        <strong>+1 Can</strong>
      </button>
    </div>

    <button class="shop-restore-btn">Geri Yukle</button>
  `;

  elements.metaPanel.querySelectorAll('[data-package]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.package;
      showPurchaseConfirm(pkgId, 'package');
    });
  });

  elements.metaPanel.querySelectorAll('[data-gold-package]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.goldPackage;
      showPurchaseConfirm(pkgId, 'gold');
    });
  });

  const adGoldBtn = elements.metaPanel.querySelector('#ad-gold-btn');
  if (adGoldBtn) {
    adGoldBtn.addEventListener('click', () => simulateRewardedAd(() => {
      state = watchAdForGold(state);
      render();
    }));
  }

  const adLifeBtn = elements.metaPanel.querySelector('#ad-life-btn');
  if (adLifeBtn) {
    adLifeBtn.addEventListener('click', () => simulateRewardedAd(() => {
      state = watchLifeAd(state);
      render();
    }));
  }
}

function simulateRewardedAd(onComplete) {
  showModal({
    badge: 'Reklam',
    title: 'Reklam Izleniyor...',
    copy: 'Lutfen bekleyin... 3',
    actions: []
  });

  let count = 2;
  const timer = window.setInterval(() => {
    if (count === 0) {
      window.clearInterval(timer);
      hideModal();
      onComplete();
      return;
    }
    elements.modalCopy.textContent = `Lutfen bekleyin... ${count}`;
    count -= 1;
  }, 800);
}

function simulateInterstitialAd(onComplete) {
  if (state.adsRemoved) {
    onComplete();
    return;
  }

  showModal({
    badge: 'Reklam',
    title: 'Ara Reklam',
    copy: '3 saniye sonra kapanacak...',
    actions: []
  });

  let count = 2;
  const timer = window.setInterval(() => {
    if (count === 0) {
      window.clearInterval(timer);
      hideModal();
      onComplete();
      return;
    }
    elements.modalCopy.textContent = `${count} saniye sonra kapanacak...`;
    count -= 1;
  }, 1000);
}

function showPurchaseConfirm(pkgId, type) {
  let pkg;
  if (type === 'package') {
    pkg = getShopPackages().find((p) => p.id === pkgId);
  } else {
    pkg = getGoldPackages().find((p) => p.id === pkgId);
  }
  if (!pkg) return;

  showModal({
    badge: 'Satin Al',
    title: pkg.name ?? `${pkg.gold.toLocaleString()} Altin`,
    copy: `${pkg.price} odeyerek satin almak istiyor musunuz?`,
    actions: [
      {
        label: `Satin Al (${pkg.price})`,
        onClick: () => {
          if (type === 'package') {
            state = purchasePackage(state, pkgId);
          } else {
            state = { ...state, gold: state.gold + pkg.gold, message: `${pkg.gold} altin satin alindi!` };
          }
          hideModal();
          render();
        }
      },
      {
        label: 'Vazgec',
        variant: 'ghost-button',
        onClick: () => hideModal()
      }
    ]
  });
}

function renderEvents() {
  const quests = state.meta.quests;
  const questsDone = quests.filter((q) => q.progress >= q.target).length;
  const questsTotal = quests.length;
  const matchEvent = state.meta.matchEvent;
  const matchRemaining = matchEvent.expiresAt - Date.now();

  elements.metaPanel.innerHTML = `
    <div class="quest-panel">
      <!-- Daily Quests -->
      <div class="quest-header">
        <h3>Gunluk Gorev</h3>
        <div class="quest-timer">\u23F1 ${formatCountdown(state.meta.dailySpin.expiresAt - Date.now())}</div>
      </div>
      <div class="quest-progress-bar">
        <div class="xp-bar">
          <span style="width:${Math.round((questsDone / questsTotal) * 100)}%"></span>
          <strong>${questsDone} / ${questsTotal}</strong>
        </div>
        ${renderRewardIcon('gift')}
      </div>
      <div class="quest-list">
        ${quests.map((quest) => {
          const done = quest.progress >= quest.target;
          const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
          return `
            <article class="quest-card ${done ? 'complete' : ''}">
              <div class="quest-icon" style="font-size:1.2rem">${quest.id === 'login' ? '\uD83D\uDCC5' : quest.id === 'stars' ? '\u2B50' : quest.id === 'dice' ? '\uD83C\uDFB2' : '\uD83C\uDFAF'}</div>
              <div class="quest-info">
                <strong>${quest.label}</strong>
                <div class="quest-progress">
                  <span style="width:${percent}%"></span>
                  <strong>${quest.progress}/${quest.target}</strong>
                </div>
              </div>
              <div class="quest-reward">
                <button class="quest-reward-check ${done ? '' : 'locked'}" data-quest="${quest.id}" ${done ? '' : 'disabled'}>
                  ${done ? '\u2713' : '\uD83D\uDD12'}
                </button>
                <small style="font-size:0.6rem;font-weight:800;color:#6c7a80">${quest.reward}</small>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <!-- Matching Event -->
      <div class="event-header" style="margin-top:12px">
        <h3>Eslestirme Gorevi</h3>
        <div class="quest-timer">\u23F1 ${formatCountdown(matchRemaining)}</div>
      </div>
      <div class="quest-progress-bar">
        <div class="xp-bar">
          <span style="width:${Math.round((matchEvent.progress / matchEvent.target) * 100)}%"></span>
          <strong>${matchEvent.progress}/${matchEvent.target}</strong>
        </div>
        ${renderRewardIcon('gift')}
      </div>
      <div class="event-track">
        <div class="event-track-line"></div>
        ${matchEvent.rewards.map((reward) => `
          <div class="event-reward-item">
            <span class="event-tier-badge ${reward.claimed ? 'earned' : 'locked'}">${reward.tier}</span>
            <div class="event-reward-card ${reward.claimed ? '' : 'locked'}">
              ${renderRewardIcon(reward.icon)}
              <strong style="flex:1;text-align:left;margin-left:8px">${reward.label}</strong>
              ${reward.claimed ? '' : '<span class="lock-badge">\uD83D\uDD12</span>'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  elements.metaPanel.querySelectorAll('[data-quest]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state = claimQuestReward(state, btn.dataset.quest);
      render();
    });
  });
}

function renderRewardHub() {
  const tracks = state.meta.tracks;
  const village = state.meta.village;
  const matchEvent = state.meta.matchEvent;
  const battlePass = state.meta.battlePass;
  const dailySpin = state.meta.dailySpin;
  const treasureIsland = state.meta.treasureIsland;
  const piggyBank = tracks.piggyBank;
  const beeRace = state.meta.beeRace;

  elements.metaPanel.innerHTML = `
    <div class="reward-hub">
      <div class="meta-header">
        <span class="label">Odul</span>
        <strong>Odul Merkezi</strong>
      </div>

      <div class="reward-grid">
        <article class="reward-hub-card" data-overlay="levelChest">
          ${renderRewardIcon('chest')}
          <strong>Seviye Kutusu</strong>
          <div class="reward-hub-progress"><span style="width:${Math.round((tracks.levelChest.progress / tracks.levelChest.target) * 100)}%"></span><small>${Math.round((tracks.levelChest.progress / tracks.levelChest.target) * 100)}%</small></div>
        </article>
        <article class="reward-hub-card" data-overlay="freeGift">
          ${renderRewardIcon('gift')}
          <strong>Ucretsiz Oduller</strong>
          <span class="reward-hub-timer">\u23F1 ${formatCountdown(dailySpin.expiresAt - Date.now())}</span>
        </article>
        <article class="reward-hub-card" data-overlay="matchEvent">
          ${renderRewardIcon('star')}
          <strong>Eslestirme Gorevi</strong>
          <div class="reward-hub-progress"><span style="width:${Math.round((matchEvent.progress / matchEvent.target) * 100)}%"></span><small>${Math.round((matchEvent.progress / matchEvent.target) * 100)}%</small></div>
        </article>

        <article class="reward-hub-card" data-overlay="dailySpin">
          ${renderRewardIcon('gold')}
          <strong>Gunluk Donus</strong>
          <span class="reward-hub-timer">\u23F1 ${formatCountdown(dailySpin.expiresAt - Date.now())}</span>
        </article>
        <article class="reward-hub-card" data-overlay="treasureIsland">
          ${renderRewardIcon('chest')}
          <strong>Hazine Adasi</strong>
          <div class="reward-hub-progress"><span style="width:${Math.round((treasureIsland.progress / treasureIsland.target) * 100)}%"></span><small>${Math.round((treasureIsland.progress / treasureIsland.target) * 100)}%</small></div>
        </article>
        <article class="reward-hub-card" data-overlay="piggyBank">
          ${renderRewardIcon('piggy')}
          <strong>Kumbara</strong>
          <div class="reward-hub-progress"><span style="width:${Math.round((piggyBank.progress / piggyBank.target) * 100)}%"></span><small>${piggyBank.coins} altin</small></div>
        </article>

        <article class="reward-hub-card" data-overlay="battlePass">
          ${renderRewardIcon('star')}
          <strong>Eslestirme Pas</strong>
          <div class="reward-hub-progress"><span style="width:${Math.round((battlePass.progress / battlePass.target) * 100)}%"></span><small>${Math.round((battlePass.progress / battlePass.target) * 100)}%</small></div>
        </article>
        <article class="reward-hub-card" data-overlay="quests">
          ${renderRewardIcon('hint')}
          <strong>Gunluk Gorev</strong>
          <span class="reward-hub-timer">\u23F1 ${formatCountdown(dailySpin.expiresAt - Date.now())}</span>
        </article>
        <article class="reward-hub-card" data-overlay="beeRace">
          ${renderRewardIcon('gold')}
          <strong>Ari Yarisi</strong>
          <div class="reward-hub-progress"><span style="width:${Math.round((beeRace.progress / beeRace.target) * 100)}%"></span><small>${Math.round((beeRace.progress / beeRace.target) * 100)}%</small></div>
        </article>
      </div>

      <div class="reward-buttons">
        <button class="reward-btn-edit">DUZENLE</button>
        <button class="reward-btn-next" id="reward-next-btn">SONRAKI</button>
      </div>
    </div>
  `;

  elements.metaPanel.querySelectorAll('[data-overlay]').forEach((card) => {
    card.addEventListener('click', () => {
      openOverlay(card.dataset.overlay);
    });
  });
}

function renderGifts() {
  const village = state.meta.village;
  const builtCount = village.buildings.filter((b) => b.built).length;
  const totalCount = village.buildings.length;
  const progress = totalCount > 0 ? Math.round((builtCount / totalCount) * 100) : 0;

  elements.metaPanel.innerHTML = `
    <div class="village-panel">
      <div class="village-header">
        <h3>${village.name}</h3>
      </div>
      <div class="village-reward-bar">
        <span>Odul</span>
        <div class="progress-bar" style="flex:1"><span style="width:${progress}%"></span><strong>${progress}%</strong></div>
        ${renderRewardIcon('gift')}
      </div>
      <div class="village-buildings">
        ${village.buildings.map((building) => {
          const canBuild = !building.built && state.meta.stars >= building.cost;
          const buildingIcons = { shop: '\uD83C\uDF81', house: '\uD83C\uDFE0', tree: '\uD83C\uDF84', park: '\u26F8', fountain: '\u26F2' };
          return `
            <article class="village-building">
              <div class="building-icon">${buildingIcons[building.id] ?? '\uD83C\uDFD7'}</div>
              <div class="building-info">
                <strong>${building.name}</strong>
              </div>
              <button class="building-btn ${building.built ? 'built' : canBuild ? 'can-build' : 'cannot-build'}" 
                      data-building="${building.id}" ${building.built || !canBuild ? 'disabled' : ''}>
                ${building.built ? '\u2713 Yapildi' : `Yap \u2605 ${building.cost}`}
              </button>
            </article>
          `;
        }).join('')}
      </div>

      <!-- Daily Reward -->
      <div class="village-reward-bar" style="margin-top:12px">
        <div style="flex:1">
          <span class="label" style="color:var(--ink)">Gunluk Seri</span>
          <strong id="daily-streak" style="display:block;margin-top:4px;font-size:0.85rem;color:var(--ink)">${state.dailyClaimedDate === new Date().toDateString() ? 'Bugunku odul alindi' : '1. gun odulu hazir'}</strong>
        </div>
        <button id="claim-daily" class="building-btn can-build" ${state.dailyClaimedDate === new Date().toDateString() ? 'disabled' : ''}>Odul Al</button>
      </div>

      <!-- Watch Ad for Life -->
      <button id="watch-life-ad" class="shop-restore-btn" ${state.lives >= 5 ? 'disabled' : ''}>Reklam Izle +1 Can</button>
    </div>
  `;

  elements.metaPanel.querySelectorAll('[data-building]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state = buildVillageBuilding(state, btn.dataset.building);
      render();
    });
  });

  const claimDailyBtn = elements.metaPanel.querySelector('#claim-daily');
  if (claimDailyBtn) {
    claimDailyBtn.addEventListener('click', () => {
      state = claimDailyReward(state);
      render();
    });
  }

  const watchLifeBtn = elements.metaPanel.querySelector('#watch-life-ad');
  if (watchLifeBtn) {
    watchLifeBtn.addEventListener('click', () => {
      state = watchLifeAd(state);
      render();
    });
  }
}

function openOverlay(type) {
  elements.overlayPanel.classList.remove('hidden');

  if (type === 'dailySpin') {
    const today = new Date().toDateString();
    const alreadySpun = state.meta.dailySpin.lastSpinDate === today;
    elements.overlayBody.innerHTML = `
      <div class="spin-panel">
        <div class="spin-header">
          <h3>Gunluk Donus</h3>
          <div class="quest-timer">\u23F1 ${formatCountdown(state.meta.dailySpin.expiresAt - Date.now())}</div>
        </div>
        <div class="spin-wheel">
          <div class="spin-center">CEVIR</div>
        </div>
        <button class="spin-btn" id="spin-btn" ${alreadySpun ? 'disabled' : ''}>${alreadySpun ? 'Yarin tekrar gel!' : 'Carki Cevir!'}</button>
      </div>
    `;
    const spinBtn = document.querySelector('#spin-btn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        state = spinDailyWheel(state);
        closeOverlay();
        render();
      });
    }
    return;
  }

  if (type === 'battlePass') {
    const bp = state.meta.battlePass;
    elements.overlayBody.innerHTML = `
      <div class="pass-panel">
        <div class="pass-header">
          <h3>Eslestirme Pas</h3>
          <div class="quest-timer">\u23F1 ${formatCountdown(bp.expiresAt - Date.now())}</div>
          <div style="margin-top:8px">
            <span style="font-size:0.8rem;opacity:0.8">${bp.progress}/${bp.target}</span>
            <div class="xp-bar" style="margin-top:4px">
              <span style="width:${Math.round((bp.progress / bp.target) * 100)}%"></span>
              <strong>${bp.progress}/${bp.target}</strong>
            </div>
          </div>
          ${!bp.active ? `<button class="pass-activate-btn" id="activate-pass" style="margin-top:8px">\u20ba39.99 - Etkinlestir</button>` : '<span class="pass-active-badge">Aktif</span>'}
        </div>
        <div style="display:grid;gap:8px">
          ${bp.freeTier.map((item, i) => `
            <div class="pass-track">
              <div class="pass-free ${item.claimed ? 'earned' : ''}">
                ${renderRewardIcon(item.icon)}
                <small style="display:block;font-size:0.65rem;font-weight:800;margin-top:2px">${item.label}</small>
                ${item.claimed ? '<span style="color:var(--green);">\u2713</span>' : ''}
              </div>
              <div class="pass-connector">
                <span class="pass-star ${i < bp.progress ? 'earned' : 'locked'}">${i + 1}</span>
                ${i < bp.freeTier.length - 1 ? '<div class="pass-line"></div>' : ''}
              </div>
              <div class="pass-premium ${bp.premiumTier[i].locked ? 'locked' : ''}">
                ${renderRewardIcon(bp.premiumTier[i].icon)}
                <small style="display:block;font-size:0.65rem;font-weight:800;margin-top:2px">${bp.premiumTier[i].label}</small>
                ${bp.premiumTier[i].locked ? '<span class="lock-badge" style="margin:4px auto 0">\uD83D\uDD12</span>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const activateBtn = document.querySelector('#activate-pass');
    if (activateBtn) {
      activateBtn.addEventListener('click', () => {
        showModal({
          badge: 'Battle Pass',
          title: 'Eslestirme Pas',
          copy: '\u20ba39.99 odeyerek premium oduller acilacak. Satin almak istiyor musunuz?',
          actions: [
            {
              label: 'Satin Al (\u20ba39.99)',
              onClick: () => {
                state = purchaseBattlePass(state);
                hideModal();
                closeOverlay();
                render();
              }
            },
            {
              label: 'Vazgec',
              variant: 'ghost-button',
              onClick: () => hideModal()
            }
          ]
        });
      });
    }
    return;
  }

  if (type === 'matchEvent') {
    activeHomeTab = 'events';
    closeOverlay();
    render();
    return;
  }

  if (type === 'quests') {
    activeHomeTab = 'events';
    closeOverlay();
    render();
    return;
  }

  // Generic overlay for other types
  const labels = {
    levelChest: 'Seviye Kutusu',
    freeGift: 'Ucretsiz Oduller',
    treasureIsland: 'Hazine Adasi',
    piggyBank: 'Kumbara',
    beeRace: 'Ari Yarisi'
  };

  elements.overlayBody.innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <h3 style="color:#fff;font-size:1.3rem;margin-bottom:12px">${labels[type] ?? type}</h3>
      <p style="color:rgba(255,255,255,0.7);font-size:0.9rem">Yakinda geliyor!</p>
      ${renderRewardIcon('gift')}
    </div>
  `;
}

function closeOverlay() {
  elements.overlayPanel.classList.add('hidden');
  elements.overlayBody.innerHTML = '';
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
          class="tile ${symbol.color} ${highlighted} ${invalid} ${locked}"
          data-x="${x}"
          data-y="${y}"
          aria-label="${symbol.label} tasi"
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
        label: '120 Altin Harca +5 Hamle +30 sn',
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
  const stars = '\u2605'.repeat(state.lastStars);
  const reward = state.pendingReward;

  if (!reward) {
    state = nextLevel(state);
    render();
    return;
  }

  // Show interstitial ad every 3 levels (if ads not removed)
  if (shouldShowInterstitial(state)) {
    simulateInterstitialAd(() => showWinRewardModal(stars, reward));
    return;
  }

  showWinRewardModal(stars, reward);
}

function showWinRewardModal(stars, reward) {

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

// ===== EVENT LISTENERS =====

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
  if (state.status === 'playing') {
    state = abandonLevel(state);
  }
  hideModal();
  setScreen('home');
  render();
});

elements.overlayClose.addEventListener('click', closeOverlay);

elements.overlayPanel.addEventListener('click', (event) => {
  if (event.target === elements.overlayPanel) closeOverlay();
});

elements.navTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activeHomeTab = tab.dataset.tab;
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
