// =====================================================
// NETRUNNER MATCH — upgrades.js
// Upgrade pool and score hooks
// =====================================================

window.UPGRADES_POOL = [
    // --- COMMON ---
    {
        id: 'cyan_boost',
        name: 'CYAN CHANNEL OVERRIDE',
        description: 'Cyan data packets carry 75% more payload. ICE never sees them coming.',
        cost: 60,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'cyan') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'purple_boost',
        name: 'PHANTOM PROTOCOL',
        description: 'Purple ghost packets bypass firewall logging. +75% score on purple matches.',
        cost: 60,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'purple') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'green_boost',
        name: 'VIRAL PAYLOAD',
        description: 'Green virus strands self-replicate. +75% score on green matches.',
        cost: 60,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'green') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'red_boost',
        name: 'BREACH CHARGE',
        description: 'Red ICE breakers hit harder. +75% score on red matches.',
        cost: 60,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.some(t => t.color === 'red') ? baseScore * 1.75 : baseScore
    },
    {
        id: 'efficient_runner',
        name: 'EFFICIENT RUNNER',
        description: 'Every unused move at contract end earns +25€€ instead of +15€€.',
        cost: 80,
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
        name: 'WETWARE UPGRADE',
        description: 'Neural implant optimizes pathfinding. +4 moves at start of each new contract.',
        cost: 100,
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
        name: 'OVERCLOCKED PARSER',
        description: 'Matching 4 tiles triggers an overclock burst. 4-tile matches give 2× hack progress.',
        cost: 90,
        rarity: 'common',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles) => matchedTiles.length >= 4 ? baseScore * 2 : baseScore
    },
    {
        id: 'extra_time_small',
        name: 'CLOCK EXTENSION v1',
        description: 'Renegotiated the contract deadline. +15 seconds per contract.',
        cost: 70, rarity: 'common', repeatable: true,
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
        name: 'TEMPORAL EXPLOIT',
        description: 'Every 4-tile match recovers 3 seconds. Efficient hacking buys time.',
        cost: 90, rarity: 'common', repeatable: false,
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
        name: 'NEURAL FEEDBACK LOOP',
        description: 'Consecutive matches of the same color build a feedback loop. Same color twice=1.5×, three+=2×.',
        cost: 150,
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
        name: 'DATA SIPHON',
        description: 'Each cascade level amplifies extraction. Every auto-chain adds +20% to match score.',
        cost: 140,
        rarity: 'rare',
        repeatable: false,
        applyToScore: (baseScore, matchedTiles, state) => baseScore * (1 + (state.currentCascadeDepth || 0) * 0.20)
    },
    {
        id: 'extra_shop_slot',
        name: 'CORPORATE ESPIONAGE',
        description: 'Hacked the upgrade vendor. Shop now shows 4 offers instead of 3.',
        cost: 160,
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
        name: 'REDUNDANT LINK',
        description: 'Big data packets open new attack vectors. Matching 5+ tiles grants +1 move.',
        cost: 130,
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
        name: 'COLD BOOT PROTOCOL',
        description: 'First 3 matches each contract run at double clock speed. 2× hack progress.',
        cost: 170,
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
        name: 'CLOCK EXTENSION v2',
        description: 'Deep system exploit grants extra processing time. +30 seconds per contract.',
        cost: 160, rarity: 'rare', repeatable: false,
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
        name: 'CHRONOS CONVERTER',
        description: 'At contract end, every 5 remaining seconds converts to 1 bonus move for next contract.',
        cost: 150, rarity: 'rare', repeatable: false,
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
        name: 'DEADLINE PRESSURE',
        description: 'When under 15 seconds, all matches score 2× hack progress. Panic is power.',
        cost: 140, rarity: 'rare', repeatable: false,
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
        name: 'FLATLINE PROTOCOL',
        description: 'One-time emergency buffer. When you hit 0 moves, refill to 6. Once per run.',
        cost: 280,
        rarity: 'legendary',
        repeatable: false
        // Handled in checkContractState
    },
    {
        id: 'market_crash',
        name: 'MARKET CRASH',
        description: "Crashed the vendor's pricing algorithm. All upgrade costs reduced by 40%.",
        cost: 260,
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
        name: 'CORPO BUYOUT',
        description: 'Sold corporate secrets to the highest bidder. Earn 2× €€ from all contracts.',
        cost: 300,
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
        name: 'BLACKOUT BURST',
        description: 'Once per contract: detonate all tiles of the most common color on the grid.',
        cost: 270,
        rarity: 'legendary',
        repeatable: false
        // Handled as active ability
    },
    {
        id: 'perfect_swap',
        name: "NETRUNNER'S EDGE",
        description: 'Perfect plays are free. A swap that immediately creates a 5+ match costs 0 moves.',
        cost: 260,
        rarity: 'legendary',
        repeatable: false
        // Handled in trySwap
    },
    {
        id: 'ripperdoc',
        name: 'RIPPERDOC SPECIAL',
        description: 'Chrome upgrade activates your best installed chip twice. One random owned upgrade applies its score bonus twice this contract.',
        cost: 320,
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
        name: 'TEMPORAL BLACKOUT',
        description: 'Once per contract: freeze the timer for 20 seconds. ICE cannot track what does not move.',
        cost: 290, rarity: 'legendary', repeatable: false,
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
