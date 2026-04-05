window.STATE = {
  // Run state (reset on new run)
  level: 1,
  eurodollars: 0,
  totalEurodollars: 0,
  activeUpgrades: [],
  runScore: 0,
  winStreak: 0,        // consecutive contracts won
  maxWinStreak: 0,      // best streak ever
  contractsWon: 0,      // total contracts completed this run
  wildcardOffer: false,  // wildcard (joker) available in shop

  // Contract state (reset each contract)
  moves: 25,
  timeLeft: 60,
  hackProgress: 0,
  hackTarget: 500,
  contractClient: '',
  contractFlavor: '',
  contractReward: 0,
  contractTime: 60,
  comboColor: null,
  comboCount: 0,
  isBoss: false,         // current contract is a boss
  bossType: null,        // type of boss if isBoss
  scoreMult: 1,          // global score multiplier (Balatro-style mult)

  // Grid
  grid: [], // 8x8 array of {color, special: false}

  // Best run (from localStorage on init)
  bestLevel: 0,
  bestScore: 0,
  bestWinStreak: 0,
  totalRuns: 0,

  // Constants
  GRID_SIZE: 8,
  COLORS: ['cyan', 'purple', 'green', 'red', 'yellow', 'orange'],
  TILE_ICONS: {
    cyan: '◆',
    purple: '●',
    green: '▲',
    red: '■',
    yellow: '★',
    orange: '⬡'
  },
  CONTRACT_CLIENTS: [
    'Arasaka Corp', 'Militech', 'Biotechnica',
    'Kang Tao', 'Trauma Team', 'NetWatch'
  ],
  CONTRACT_FLAVORS: [
    'Infiltrate corporate subnet. Extract financial records before ICE detects intrusion.',
    'Bypass Arasaka firewall. Plant surveillance daemon in executive comms.',
    'Reroute Militech payroll. Transfer funds to untraceable shell accounts.',
    'Crack Biotechnica biodata vault. Client wants genetic IP, no questions asked.',
    'Ghost into Trauma Team dispatch. Scramble their response grid for 48 hours.',
    'Penetrate NetWatch blacklist servers. Erase three flagged runner profiles.'
  ],
  // Boss contracts — every 5th level
  BOSS_TYPES: [
    { id: 'ice_fortress', name: 'ICE FORTRESS', desc: 'Random tiles are LOCKED — cannot be matched. Break through!', icon: '🧊' },
    { id: 'data_storm', name: 'DATA STORM', desc: 'Time runs 2× faster! Hack before the storm wipes you.', icon: '' },
    { id: 'black_ice', name: 'BLACK ICE', desc: 'Some matches cause BACKLASH — negative progress!', icon: '🖤' },
    { id: 'honeypot', name: 'HONEYPOT', desc: 'Wrong color matches drain your score. Stay focused!', icon: '🍯' },
    { id: 'firewall', name: 'FIREWALL', desc: 'Each move costs DOUBLE. Efficiency is key.', icon: '🔥' }
  ]
};

window.resetRun = function () {
  window.STATE.level = 1;
  window.STATE.eurodollars = 0;
  window.STATE.totalEurodollars = 0;
  window.STATE.activeUpgrades = [];
  window.STATE.runScore = 0;
  window.STATE.winStreak = 0;
  window.STATE.maxWinStreak = 0;
  window.STATE.contractsWon = 0;
  window.STATE.wildcardOffer = false;
  window.STATE.scoreMult = 1;
  window.loadBestRun();
};

window.resetContract = function () {
  const S = window.STATE;
  const flags = S.upgradeFlags || {};

  // Easier early game: more moves/time at low levels
  const levelBonus = Math.max(0, 5 - S.level); // +5 moves at level 1, decreasing
  S.moves = 25 + levelBonus + (flags.extraMoves || 0);
  S.timeLeft = 60 + (flags.extraTime || 0);
  S.contractTime = S.timeLeft;
  S.hackProgress = 0;
  S.isProcessing = false;
  S.hackTarget = window.hackTargetForLevel(S.level);
  S.contractReward = window.contractRewardForLevel(S.level);
  S.comboColor = null;
  S.comboCount = 0;
  S.scoreMult = 1;

  // Boss contract every 5 levels
  S.isBoss = (S.level % 5 === 0) && S.level > 0;
  S.bossType = null;
  if (S.isBoss) {
    const bossIdx = Math.floor((S.level / 5) - 1) % S.BOSS_TYPES.length;
    S.bossType = S.BOSS_TYPES[bossIdx];
  }

  S.currentCascadeDepth = 0;
  S.lastMatchColor = null;
  if (flags) {
    flags.coldBootCount = 0;
    flags.blackoutUsed = false;
    flags.flatlineUsed = false;
    if (flags.timerFrozen) flags.timerFrozen = false;
  }

  // Pick random client and flavor
  const charIdx = Math.floor(Math.random() * S.CONTRACT_CLIENTS.length);
  S.contractClient = S.CONTRACT_CLIENTS[charIdx];
  S.contractFlavor = S.CONTRACT_FLAVORS[charIdx];

  // Apply synergies at start of each contract
  if (window.applySynergies) window.applySynergies();
};

window.hackTargetForLevel = function (level) {
  // Gentler early game, scales up later
  if (level <= 3) return Math.floor(400 * Math.pow(1.35, level - 1));
  if (level <= 8) return Math.floor(600 * Math.pow(1.3, level - 3));
  return Math.floor(1500 * Math.pow(1.25, level - 8));
};

window.contractRewardForLevel = function (level) {
  // Better rewards to fuel the upgrade loop
  if (level <= 3) return Math.floor(100 + (level - 1) * 30);
  if (level <= 8) return Math.floor(190 + (level - 3) * 40);
  return Math.floor(390 + (level - 8) * 55);
};

window.saveBestRun = function () {
  if (window.STATE.runScore === 0 && window.STATE.eurodollars > 0) {
    window.STATE.runScore = window.STATE.eurodollars;
  }
  if (window.STATE.level > window.STATE.bestLevel) {
    window.STATE.bestLevel = window.STATE.level;
    localStorage.setItem('netrunner_best_level', window.STATE.level);
  }
  if (window.STATE.runScore > window.STATE.bestScore) {
    window.STATE.bestScore = window.STATE.runScore;
    localStorage.setItem('netrunner_best_score', window.STATE.runScore);
  }
  if (window.STATE.winStreak > window.STATE.bestWinStreak) {
    window.STATE.bestWinStreak = window.STATE.winStreak;
    localStorage.setItem('netrunner_best_streak', window.STATE.winStreak);
  }

  window.STATE.totalRuns++;
  localStorage.setItem('netrunner_total_runs', window.STATE.totalRuns);
};

window.loadBestRun = function () {
  window.STATE.bestLevel = parseInt(localStorage.getItem('netrunner_best_level')) || 0;
  window.STATE.bestScore = parseInt(localStorage.getItem('netrunner_best_score')) || 0;
  window.STATE.bestWinStreak = parseInt(localStorage.getItem('netrunner_best_streak')) || 0;
  window.STATE.totalRuns = parseInt(localStorage.getItem('netrunner_total_runs')) || 0;
};
