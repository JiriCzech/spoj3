window.STATE = {
  // Run state (reset on new run)
  level: 1,
  eurodollars: 0,
  totalEurodollars: 0,
  activeUpgrades: [],
  runScore: 0,

  // Contract state (reset each contract)
  moves: 25,
  hackProgress: 0,
  hackTarget: 500,
  contractClient: '',
  contractFlavor: '',
  contractReward: 0,
  comboColor: null,
  comboCount: 0,

  // Grid
  grid: [], // 8x8 array of {color, special: false}

  // Best run (from localStorage on init)
  bestLevel: 0,
  bestScore: 0,
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
  ]
};

window.resetRun = function() {
  window.STATE.level = 1;
  window.STATE.eurodollars = 0;
  window.STATE.totalEurodollars = 0;
  window.STATE.activeUpgrades = [];
  window.STATE.runScore = 0;
  window.loadBestRun();
};

window.resetContract = function() {
  window.STATE.moves = 25 + (window.STATE.upgradeFlags?.extraMoves || 0);
  window.STATE.hackProgress = 0;
  window.STATE.hackTarget = window.hackTargetForLevel(window.STATE.level);
  window.STATE.contractReward = window.contractRewardForLevel(window.STATE.level);
  window.STATE.comboColor = null;
  window.STATE.comboCount = 0;
  
  window.STATE.currentCascadeDepth = 0;
  window.STATE.lastMatchColor = null;
  if (window.STATE.upgradeFlags) {
    window.STATE.upgradeFlags.coldBootCount = 0;
    window.STATE.upgradeFlags.blackoutUsed = false;
    window.STATE.upgradeFlags.flatlineUsed = false;
  }
  
  // Pick random client and flavor
  const charIdx = Math.floor(Math.random() * window.STATE.CONTRACT_CLIENTS.length);
  window.STATE.contractClient = window.STATE.CONTRACT_CLIENTS[charIdx];
  window.STATE.contractFlavor = window.STATE.CONTRACT_FLAVORS[charIdx];
};

window.hackTargetForLevel = function(level) {
  return Math.floor(500 * Math.pow(1.45, level - 1));
};

window.contractRewardForLevel = function(level) {
  return level * 80;
};

window.saveBestRun = function() {
  if (window.STATE.level > window.STATE.bestLevel) {
    window.STATE.bestLevel = window.STATE.level;
    localStorage.setItem('netrunner_best_level', window.STATE.level);
  }
  if (window.STATE.runScore > window.STATE.bestScore) {
    window.STATE.bestScore = window.STATE.runScore;
    localStorage.setItem('netrunner_best_score', window.STATE.runScore);
  }
  
  window.STATE.totalRuns++;
  localStorage.setItem('netrunner_total_runs', window.STATE.totalRuns);
};

window.loadBestRun = function() {
  window.STATE.bestLevel = parseInt(localStorage.getItem('netrunner_best_level')) || 0;
  window.STATE.bestScore = parseInt(localStorage.getItem('netrunner_best_score')) || 0;
  window.STATE.totalRuns = parseInt(localStorage.getItem('netrunner_total_runs')) || 0;
};
