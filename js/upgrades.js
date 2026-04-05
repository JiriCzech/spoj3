// =====================================================
// NETRUNNER MATCH — upgrades.js (v2 COMPLETE REDESIGN)
// Balatro-style synergies + Vampire Survivors chaos
// =====================================================

window.UPGRADES_POOL = [
    // ================================================
    // COMMON (€€ 60–140) — Building blocks
    // ================================================
    {
        id: 'cyan_boost', name: '🔵 CYAN CHANNEL', description: 'Cyan tiles give +75% score.',
        cost: 80, rarity: 'common', repeatable: false, synergy: 'color',
        applyToScore: (s, t) => t.some(x => x.color === 'cyan') ? s * 1.75 : s
    },
    {
        id: 'purple_boost', name: '🟣 PHANTOM LINK', description: 'Purple tiles give +75% score.',
        cost: 80, rarity: 'common', repeatable: false, synergy: 'color',
        applyToScore: (s, t) => t.some(x => x.color === 'purple') ? s * 1.75 : s
    },
    {
        id: 'green_boost', name: '🟢 VIRAL PAYLOAD', description: 'Green tiles give +75% score.',
        cost: 80, rarity: 'common', repeatable: false, synergy: 'color',
        applyToScore: (s, t) => t.some(x => x.color === 'green') ? s * 1.75 : s
    },
    {
        id: 'red_boost', name: '🔴 BREACH CHARGE', description: 'Red tiles give +75% score.',
        cost: 80, rarity: 'common', repeatable: false, synergy: 'color',
        applyToScore: (s, t) => t.some(x => x.color === 'red') ? s * 1.75 : s
    },
    {
        id: 'yellow_boost', name: '🟡 GOLDEN PROTOCOL', description: 'Yellow tiles give +75% score.',
        cost: 80, rarity: 'common', repeatable: false, synergy: 'color',
        applyToScore: (s, t) => t.some(x => x.color === 'yellow') ? s * 1.75 : s
    },
    {
        id: 'orange_boost', name: '🟠 AMBER OVERDRIVE', description: 'Orange tiles give +75% score.',
        cost: 80, rarity: 'common', repeatable: false, synergy: 'color',
        applyToScore: (s, t) => t.some(x => x.color === 'orange') ? s * 1.75 : s
    },
    {
        id: 'efficient_runner', name: '💰 EFFICIENT RUNNER',
        description: 'Unused moves = +25€€ each (instead of +8).',
        cost: 110, rarity: 'common', repeatable: false,
        applyOnContractEnd: (s) => { s.upgradeFlags.efficientRunner = true; }
    },
    {
        id: 'extra_moves', name: '➕ WETWARE UPGRADE',
        description: '+4 moves per contract. (Stackable.)',
        cost: 120, rarity: 'common', repeatable: true,
        applyOnBuy: (s) => { s.upgradeFlags.extraMoves = (s.upgradeFlags.extraMoves || 0) + 4; }
    },
    {
        id: 'four_match_bonus', name: '⚡ OVERCLOCKED PARSER',
        description: 'Match-4+ = 2× score for that match.',
        cost: 120, rarity: 'common', repeatable: false,
        applyToScore: (s, t) => t.length >= 4 ? s * 2 : s
    },
    {
        id: 'extra_time_small', name: '⏱ CLOCK EXTENSION v1',
        description: '+15s per contract. (Stackable.)',
        cost: 90, rarity: 'common', repeatable: true,
        applyOnBuy: (s) => { s.upgradeFlags.extraTime = (s.upgradeFlags.extraTime || 0) + 15; }
    },
    {
        id: 'time_on_match4', name: '⏳ TEMPORAL EXPLOIT',
        description: 'Match-4+ adds +3s to timer.',
        cost: 110, rarity: 'common', repeatable: false,
        applyToScore: (base, tiles, state) => {
            if (tiles.length >= 4) {
                state.timeLeft = Math.min(state.timeLeft + 3, 99);
                if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
            }
            return base;
        }
    },
    {
        id: 'score_mult_small', name: '✖ MULTIPLIER CORE',
        description: 'All scores ×1.5. Stacks multiplicatively!',
        cost: 140, rarity: 'common', repeatable: false,
        applyOnBuy: (s) => { s.scoreMult = (s.scoreMult || 1) * 1.5; }
    },

    // ================================================
    // RARE (€€ 160–280) — Game changers
    // ================================================
    {
        id: 'combo_multiplier', name: '🔁 NEURAL FEEDBACK',
        description: 'Same color twice = 1.5×. Three times = 2×. Stacking!',
        cost: 200, rarity: 'rare', repeatable: false, synergy: 'combo',
        applyToScore: (base, tiles, state) => {
            let mult = 1;
            const mc = tiles[0]?.color;
            if (mc === state.lastMatchColor) {
                state.comboCount = (state.comboCount || 0) + 1;
                mult = state.comboCount >= 2 ? 2.0 : 1.5;
            } else {
                state.comboCount = 0;
                state.lastMatchColor = mc || null;
            }
            return base * mult;
        }
    },
    {
        id: 'cascade_amplifier', name: '🌊 DATA SIPHON',
        description: 'Each cascade level = +25% score (upgraded from 20%).',
        cost: 200, rarity: 'rare', repeatable: false, synergy: 'cascade',
        applyToScore: (s, t, st) => s * (1 + (st.currentCascadeDepth || 0) * 0.25)
    },
    {
        id: 'extra_shop_slot', name: '🛒 CORP ESPIONAGE',
        description: 'Shop shows 4 offers instead of 3.',
        cost: 230, rarity: 'rare', repeatable: false,
        applyOnBuy: (s) => { s.upgradeFlags.shopSlots = 4; }
    },
    {
        id: 'move_on_big_match', name: '🔗 REDUNDANT LINK',
        description: 'Match-5+ adds +1 move. Unlimited triggers!',
        cost: 180, rarity: 'rare', repeatable: false,
        applyToScore: (base, tiles) => {
            if (tiles.length >= 5) { window.STATE.moves += 1; if (window.updateHackBar) window.updateHackBar(); }
            return base;
        }
    },
    {
        id: 'overclock_first', name: '🥶 COLD BOOT',
        description: 'First 3 matches per contract = 2× score.',
        cost: 220, rarity: 'rare', repeatable: false,
        applyToScore: (base, tiles, state) => {
            state.upgradeFlags.coldBootCount = state.upgradeFlags.coldBootCount || 0;
            if (state.upgradeFlags.coldBootCount < 3) { state.upgradeFlags.coldBootCount++; return base * 2; }
            return base;
        }
    },
    {
        id: 'extra_time_large', name: '⏱ CLOCK EXTENSION v2',
        description: '+30s per contract.',
        cost: 210, rarity: 'rare', repeatable: false,
        applyOnBuy: (s) => { s.upgradeFlags.extraTime = (s.upgradeFlags.extraTime || 0) + 30; }
    },
    {
        id: 'time_to_moves', name: '🔄 CHRONOS CONVERT',
        description: 'End of contract: every 5s left = +1 move next contract.',
        cost: 200, rarity: 'rare', repeatable: false,
        applyOnContractEnd: (state) => {
            const bonus = Math.floor((state.timeLeft || 0) / 5);
            state.upgradeFlags.extraMoves = (state.upgradeFlags.extraMoves || 0) + bonus;
        }
    },
    {
        id: 'time_score_bonus', name: '🔥 DEADLINE PRESSURE',
        description: '≤15s left = 2× score on all matches.',
        cost: 190, rarity: 'rare', repeatable: false,
        applyToScore: (base, tiles, state) => state.timeLeft <= 15 ? base * 2 : base
    },
    {
        id: 'shuffle_board', name: '🔀 SHUFFLE PROTOCOL',
        description: 'Once per contract: tap any tile to reshuffle the entire board.',
        cost: 250, rarity: 'rare', repeatable: false
        // Handled as active ability
    },
    {
        id: 'critical_chance', name: '⚡ CRITICAL HACK',
        description: '10% chance per match to JACKPOT — 3× score!',
        cost: 260, rarity: 'rare', repeatable: false, synergy: 'crit',
        applyToScore: (base, tiles, state) => {
            if (Math.random() < 0.10) {
                state._lastJackpot = true;
                return base * 3;
            }
            state._lastJackpot = false;
            return base;
        }
    },
    {
        id: 'streak_bonus', name: '🏆 WINNING STREAK',
        description: 'Each consecutive contract won = +10% score (max +100%).',
        cost: 280, rarity: 'rare', repeatable: false, synergy: 'streak',
        applyToScore: (base, tiles, state) => {
            const bonus = Math.min(1 + (state.winStreak || 0) * 0.10, 2.0);
            return base * bonus;
        }
    },

    // ================================================
    // LEGENDARY (€€ 320–500) — Game breakers
    // ================================================
    {
        id: 'flatline_prevention', name: '🛡 FLATLINE PROTOCOL',
        description: 'Once per run: at 0 moves, get 6 extra.',
        cost: 380, rarity: 'legendary', repeatable: false
    },
    {
        id: 'market_crash', name: '📉 MARKET CRASH',
        description: 'All upgrades 40% cheaper.',
        cost: 350, rarity: 'legendary', repeatable: false,
        applyOnBuy: (s) => { s.upgradeFlags.marketCrash = true; }
    },
    {
        id: 'double_euros', name: '💵 CORPO BUYOUT',
        description: 'All contracts pay 2× €€.',
        cost: 420, rarity: 'legendary', repeatable: false,
        applyOnBuy: (s) => { s.upgradeFlags.doubleEuros = true; }
    },
    {
        id: 'blackout', name: '💥 BLACKOUT BURST',
        description: 'Active: once per contract, clear all tiles of the most common color.',
        cost: 370, rarity: 'legendary', repeatable: false
    },
    {
        id: 'perfect_swap', name: '🎯 NETRUNNER\'S EDGE',
        description: 'Match-5+ swaps cost zero moves.',
        cost: 360, rarity: 'legendary', repeatable: false
    },
    {
        id: 'ripperdoc', name: '🔩 RIPPERDOC SPECIAL',
        description: 'One random upgrade applies 2× its bonus.',
        cost: 450, rarity: 'legendary', repeatable: false,
        applyOnBuy: (s) => {
            const others = s.activeUpgrades.filter(u => u.id !== 'ripperdoc');
            if (others.length > 0) {
                const target = others[Math.floor(Math.random() * others.length)];
                s.upgradeFlags.ripperdocTarget = target.id;
            }
        },
        applyToScore: (base, tiles, state) => {
            if (state.upgradeFlags?.ripperdocTarget) {
                const t = window.UPGRADES_POOL.find(u => u.id === state.upgradeFlags.ripperdocTarget);
                if (t && typeof t.applyToScore === 'function') return base * 1.5;
            }
            return base;
        }
    },
    {
        id: 'time_freeze', name: '❄ TEMPORAL BLACKOUT',
        description: 'Active: freeze timer for 20s once per contract.',
        cost: 400, rarity: 'legendary', repeatable: false
    },
    {
        id: 'wildcard_spawn', name: '🃏 WILDCARD PROTOCOL',
        description: 'Every match spawns a random wildcard tile that matches ANY color.',
        cost: 480, rarity: 'legendary', repeatable: false
    },
    {
        id: 'data_harvest', name: '💎 DATA HARVEST',
        description: 'Each tile cleared by cascade gives +5€€ bonus.',
        cost: 340, rarity: 'legendary', repeatable: false, synergy: 'cascade',
        applyToScore: (base, tiles, state) => {
            const depth = state.currentCascadeDepth || 0;
            if (depth > 0) {
                const bonus = tiles.length * depth * 5;
                state.eurodollars += bonus;
            }
            return base;
        }
    },
    {
        id: 'ice_breaker', name: '🧨 ICE BREAKER',
        description: 'Boss contracts give +50% reward and have 20% lower target.',
        cost: 420, rarity: 'legendary', repeatable: false,
        applyOnContractEnd: (state) => {
            if (state.isBoss) {
                const bonus = Math.floor(state.contractReward * 0.5);
                state.eurodollars += bonus;
                state.totalEurodollars += bonus;
            }
        }
    },

    // ================================================
    // BOARD MANIPULATION UPGRADES (Rare+)
    // ================================================
    {
        id: 'color_shift', name: '🎨 COLOR SHIFT',
        description: 'Active: once per contract, convert all tiles of one color to another.',
        cost: 300, rarity: 'rare', repeatable: false
    },
    {
        id: 'lucky_charm', name: '🍀 LUCKY CHARM',
        description: '5% chance per tile that it respawns as your best color.',
        cost: 270, rarity: 'rare', repeatable: false,
        applyToScore: (base, tiles, state) => {
            // Find most boosted color
            let bestColor = null, bestMult = 1;
            const colorBoosts = { cyan: 1, purple: 1, green: 1, red: 1, yellow: 1, orange: 1 };
            state.activeUpgrades.forEach(u => {
                if (u.applyToScore && u.id.includes('_boost')) {
                    const c = u.id.replace('_boost', '');
                    colorBoosts[c] = 1.75;
                }
            });
            for (const c in colorBoosts) {
                if (colorBoosts[c] > bestMult) { bestMult = colorBoosts[c]; bestColor = c; }
            }
            // Apply lucky spawn during refill (handled in engine)
            return base;
        }
    },
    {
        id: 'jackpot_multiplier', name: '🎰 JACKPOT AMPLIFIER',
        description: 'Critical hits now do 5× instead of 3×. More flashy!',
        cost: 350, rarity: 'legendary', repeatable: false, synergy: 'crit'
    },
];

// ================================================
// SYNERGY SYSTEM — bonus for owning related upgrades
// ================================================
const SYNERGY_RULES = [
    {
        name: 'SYNCHRONIZED CHANNELS',
        description: 'Own 3+ color boosts → all color boosts +50% more',
        check: (active) => active.filter(u => u.id.endsWith('_boost')).length >= 3,
        bonus: 1.5
    },
    {
        name: 'CASCADE MASTER',
        description: 'Own cascade_amplifier + data_harvest → cascade ×3 instead of ×1.25',
        check: (active) => active.some(u => u.id === 'cascade_amplifier') && active.some(u => u.id === 'data_harvest'),
        bonus: 2.0
    },
    {
        name: 'TIME LORD',
        description: 'Own 2+ time upgrades → all time effects ×1.5',
        check: (active) => active.filter(u => u.id.includes('time') || u.id.includes('clock')).length >= 2,
        bonus: 1.5
    },
    {
        name: 'CRITICAL MASS',
        description: 'Own critical_chance + jackpot_multiplier → 20% crit chance, 8× crit!',
        check: (active) => active.some(u => u.id === 'critical_chance') && active.some(u => u.id === 'jackpot_multiplier'),
        bonus: 1.0
    },
    {
        name: 'COMBO BREAKER',
        description: 'Own combo_multiplier + streak_bonus → combo counts double',
        check: (active) => active.some(u => u.id === 'combo_multiplier') && active.some(u => u.id === 'streak_bonus'),
        bonus: 1.0
    }
];

// Apply synergy bonuses to STATE
window.applySynergies = function () {
    const active = window.STATE.activeUpgrades || [];
    const flags = window.STATE.upgradeFlags || {};
    flags.synergies = [];

    SYNERGY_RULES.forEach(rule => {
        if (rule.check(active)) {
            flags.synergies.push(rule);
        }
    });

    return flags;
};

// ================================================
// HAS UPGRADE CHECK
// ================================================
window.hasUpgrade = function (id) {
    return (window.STATE.activeUpgrades || []).some(u => u.id === id);
};

// ================================================
// SCORE APPLICATION — with synergies and jackpot
// ================================================
window.applyMatchScore = function (baseScore, matchedTiles) {
    let score = baseScore;
    const S = window.STATE;
    S._lastJackpot = false;

    // Apply each upgrade's score hook
    for (const upgrade of S.activeUpgrades) {
        if (typeof upgrade.applyToScore === 'function') {
            score = upgrade.applyToScore(score, matchedTiles, S);
        }
    }

    // Apply synergy bonuses
    const flags = S.upgradeFlags || {};
    if (flags.synergies) {
        flags.synergies.forEach(syn => {
            if (syn.bonus) score *= syn.bonus;
        });
    }

    // Apply global score multiplier (Balatro-style)
    score = Math.round(score * (S.scoreMult || 1));

    return Math.max(score, 1);
};
