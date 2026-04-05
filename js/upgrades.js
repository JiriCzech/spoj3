// =====================================================
// NETRUNNER MATCH — upgrades.js
// Upgrade pool and score hooks
// =====================================================

window.UPGRADES_POOL = [
    // --- COMMON ---
    {
        id: 'cyan_boost',
        name: '🔵 CYAN CHANNEL',
        description: 'Cyan dlaždice dávají +75% hack progress.',
        cost: 80,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'cyan') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'purple_boost',
        name: '🟣 PHANTOM LINK',
        description: 'Purple dlaždice dávají +75% hack progress.',
        cost: 80,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'purple') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'green_boost',
        name: '🟢 VIRAL PAYLOAD',
        description: 'Zelené dlaždice dávají +75% hack progress.',
        cost: 80,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'green') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'red_boost',
        name: '🔴 BREACH CHARGE',
        description: 'Červené dlaždice dávají +75% hack progress.',
        cost: 80,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'red') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'efficient_runner',
        name: '💰 EFFICIENT RUNNER',
        description: 'Každý nevyužitý tah na konci kontraktu = +25€€ (místo +8€€).',
        cost: 100,
        rarity: 'common',
        repeatable: false,
        applyOnContractEnd: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.efficientRunner = true;
            return state;
        }
    },
    {
        id: 'extra_moves',
        name: '➕ WETWARE UPGRADE',
        description: '+4 tahy na začátku každého nového kontraktu. (Kupitelné opakovaně.)',
        cost: 130,
        rarity: 'common',
        repeatable: true,
        applyOnBuy: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.extraMoves = (state.upgradeFlags.extraMoves || 0) + 4;
            return state;
        }
    },
    {
        id: 'four_match_bonus',
        name: '⚡ OVERCLOCKED PARSER',
        description: 'Match-4 nebo více = 2× hack progress za ten match.',
        cost: 110,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.length >= 4 ? baseScore * 2 : baseScore
    },
    {
        id: 'extra_time_small',
        name: '⏱ CLOCK EXTENSION v1',
        description: '+15 sekund na každý kontrakt. (Kupitelné opakovaně.)',
        cost: 90, rarity: 'common', repeatable: true,
        applyOnBuy: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.extraTime = (state.upgradeFlags.extraTime || 0) + 15;
            return state;
        },
        applyToScore: (s) => s,
        applyOnContractEnd: (s) => s
    },
    {
        id: 'time_on_match4',
        name: '⏳ TEMPORAL EXPLOIT',
        description: 'Každý match-4+ vrací +3 sekundy na časomíře.',
        cost: 110, rarity: 'common', repeatable: false,
        applyToScore: (baseScore, matchedTiles, state) => {
            if (matchedTiles.length >= 4) {
                state.timeLeft = Math.min(state.timeLeft + 3, 99);
                if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
            }
            return baseScore;
        },
        applyOnBuy: (s) => s,
        applyOnContractEnd: (s) => s
    },
    
    // --- RARE ---
    {
        id: 'combo_multiplier',
        name: '🔁 NEURAL FEEDBACK',
        description: 'Stejná barva dvakrát za sebou = 1.5× score. Třikrát+ = 2× score.',
        cost: 200,
        rarity: 'rare',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles, state) => {
            let multiplier = 1;
            const matchColor = matchedTiles[0]?.color;
            
            const allSame = matchedTiles.every(t => t.color === matchColor);
            
            if (allSame && matchColor === state.lastMatchColor) {
                state.comboCount = (state.comboCount || 0) + 1;
                multiplier = state.comboCount >= 2 ? 2.0 : 1.5;
            } else {
                state.comboCount = 0;
                state.lastMatchColor = matchColor || null;
            }
            return baseScore * multiplier;
        }
    },
    {
        id: 'cascade_amplifier',
        name: '🌊 DATA SIPHON',
        description: 'Každá úroveň cascade přidává +20% k hack progress toho matche.',
        cost: 190,
        rarity: 'rare',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles, state) => baseScore * (1 + (state.currentCascadeDepth || 0) * 0.20)
    },
    {
        id: 'extra_shop_slot',
        name: '🛒 CORP ESPIONAGE',
        description: 'Shop zobrazuje 4 upgrady místo 3.',
        cost: 220,
        rarity: 'rare',
        repeatable: false,
        applyOnBuy: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.shopSlots = 4;
            return state;
        }
    },
    {
        id: 'move_on_big_match',
        name: '🔗 REDUNDANT LINK',
        description: 'Match-5+ přidá +1 tah.',
        cost: 180,
        rarity: 'rare',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => {
            if (matchedTiles.length >= 5) {
                window.STATE.moves += 1;
                if (window.updateHackBar) window.updateHackBar();
            }
            return baseScore;
        }
    },
    {
        id: 'overclock_first',
        name: '🥶 COLD BOOT',
        description: 'První 3 matche každého kontraktu mají 2× hack progress.',
        cost: 230,
        rarity: 'rare',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles, state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.coldBootCount = state.upgradeFlags.coldBootCount || 0;
            if (state.upgradeFlags.coldBootCount < 3) {
                state.upgradeFlags.coldBootCount++;
                return baseScore * 2;
            }
            return baseScore;
        }
    },
    {
        id: 'extra_time_large',
        name: '⏱ CLOCK EXTENSION v2',
        description: '+30 sekund na každý kontrakt.',
        cost: 210, rarity: 'rare', repeatable: false,
        applyOnBuy: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.extraTime = (state.upgradeFlags.extraTime || 0) + 30;
            return state;
        },
        applyToScore: (s) => s,
        applyOnContractEnd: (s) => s
    },
    {
        id: 'time_to_moves',
        name: '🔄 CHRONOS CONVERT',
        description: 'Na konci kontraktu: každých 5 zbývajících sekund = +1 tah pro příští kontrakt.',
        cost: 200, rarity: 'rare', repeatable: false,
        applyToScore: (s) => s,
        applyOnBuy: (s) => s,
        applyOnContractEnd: (state) => {
            const bonusMoves = Math.floor((state.timeLeft || 0) / 5);
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.extraMoves = (state.upgradeFlags.extraMoves || 0) + bonusMoves;
            return state;
        }
    },
    {
        id: 'time_score_bonus',
        name: '🔥 DEADLINE PRESSURE',
        description: 'Když zbývá ≤15 sekund: všechny matche dávají 2× hack progress.',
        cost: 190, rarity: 'rare', repeatable: false,
        applyToScore: (baseScore, matchedTiles, state) => {
            if (state.timeLeft <= 15) return baseScore * 2;
            return baseScore;
        },
        applyOnBuy: (s) => s,
        applyOnContractEnd: (s) => s
    },
    
    // --- LEGENDARY ---
    {
        id: 'flatline_prevention',
        name: '🛡 FLATLINE PROTOCOL',
        description: 'Jednou za run: při 0 tazích dostaneš 6 tahů navíc.',
        cost: 380,
        rarity: 'legendary',
        repeatable: false
        // Handled in checkContractState
    },
    {
        id: 'market_crash',
        name: '📉 MARKET CRASH',
        description: 'Všechny upgrady jsou o 40% levnější.',
        cost: 350,
        rarity: 'legendary',
        repeatable: false,
        applyOnBuy: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.marketCrash = true;
            return state;
        }
    },
    {
        id: 'double_euros',
        name: '💵 CORPO BUYOUT',
        description: 'Všechny kontrakty vyplácejí 2× €€.',
        cost: 420,
        rarity: 'legendary',
        repeatable: false,
        applyOnBuy: (state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            state.upgradeFlags.doubleEuros = true;
            return state;
        }
    },
    {
        id: 'blackout',
        name: '💥 BLACKOUT BURST',
        description: 'Aktivní schopnost: jednou za kontrakt vymaž všechny dlaždice nejčastější barvy.',
        cost: 370,
        rarity: 'legendary',
        repeatable: false
        // Handled as active ability
    },
    {
        id: 'perfect_swap',
        name: "🎯 NETRUNNER'S EDGE",
        description: 'Swap vedoucí k match-5+ nestojí žádný tah.',
        cost: 360,
        rarity: 'legendary',
        repeatable: false
        // Handled in trySwap
    },
    {
        id: 'ripperdoc',
        name: '🔩 RIPPERDOC SPECIAL',
        description: 'Jeden nainstalovaný upgrade aplikuje svůj score bonus 2× po celý kontrakt.',
        cost: 450,
        rarity: 'legendary',
        repeatable: false,
        applyOnBuy: (state) => {
            const others = state.activeUpgrades.filter(u => u.id !== 'ripperdoc');
            if (others.length > 0) {
                const target = others[Math.floor(Math.random() * others.length)];
                state.upgradeFlags = state.upgradeFlags || {};
                state.upgradeFlags.ripperdocTarget = target.id;
            }
            return state;
        },
        applyToScore: (baseScore, matchedTiles, state) => {
            state.upgradeFlags = state.upgradeFlags || {};
            if (state.upgradeFlags.ripperdocTarget) {
                const targetUpgrade = window.UPGRADES_POOL.find(u => u.id === state.upgradeFlags.ripperdocTarget);
                if (targetUpgrade && typeof targetUpgrade.applyToScore === 'function') {
                    return baseScore * 1.5;
                }
            }
            return baseScore;
        }
    },
    {
        id: 'time_freeze',
        name: '❄ TEMPORAL BLACKOUT',
        description: 'Aktivní schopnost: jednou za kontrakt zmraz časomíru na 20 sekund.',
        cost: 400, rarity: 'legendary', repeatable: false,
        applyToScore: (s) => s,
        applyOnBuy: (s) => s,
        applyOnContractEnd: (s) => s
    }
];

window.hasUpgrade = function(id) {
    return window.STATE.activeUpgrades.some(u => u.id === id);
};

window.applyMatchScore = function(baseScore, matchedTiles) {
    let score = baseScore;
    for (const upgrade of window.STATE.activeUpgrades) {
        if (typeof upgrade.applyToScore === 'function') {
            score = upgrade.applyToScore(score, matchedTiles, window.STATE);
        }
    }
    return Math.round(score);
};
