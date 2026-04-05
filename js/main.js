// =====================================================
// NETRUNNER MATCH — main.js
// Screen orchestration and UI controllers
// =====================================================

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =====================================================
// CORE: Screen Switcher
// =====================================================
function showScreen(screenId) {
    // Clean up floating DOM elements from previous screen
    if (window.cleanupFloatingElements) window.cleanupFloatingElements();

    const active = document.querySelector('.screen.active');
    const target = document.getElementById(`screen-${screenId}`);

    if (active && active !== target) {
        active.classList.add('screen-exit');
        setTimeout(() => {
            active.classList.remove('active', 'screen-exit');
            if (target) {
                target.classList.add('active', 'screen-enter');
                setTimeout(() => target.classList.remove('screen-enter'), 250);
            }
        }, 200);
    } else if (target) {
        target.classList.add('active', 'screen-enter');
        setTimeout(() => target.classList.remove('screen-enter'), 250);
    } else {
        console.warn(`[NETRUNNER] Screen not found: ${screenId}`);
    }
}
window.showScreen = showScreen;

// =====================================================
// SCREEN: BOOT SEQUENCE — dramatic cyberpunk intro
// =====================================================
const BOOT_LINES = [
    { text: '> CONNECTING TO BLACKWALL...', delay: 200 },
    { text: '> BYPASSING ICE... ', delay: 300, ok: true },
    { text: '> DECRYPTING RUNNER PROFILE...', delay: 250 },
    { text: '> SYSTEM READY.', delay: 200, ok: true },
];

function runBootSequence() {
    showScreen('boot');

    if (REDUCED_MOTION) {
        showScreen('menu');
        initMenuScreen();
        return;
    }

    const titleEl = document.getElementById('boot-title');
    const lineEl = document.getElementById('boot-line');
    const flashEl = document.getElementById('boot-flash');

    // Phase 1: Title slams in with glitch
    setTimeout(() => {
        titleEl.textContent = 'NETRUNNER';
        titleEl.classList.add('visible', 'glitch');
        flashEl.classList.add('active');
        if (window.Audio) {
            window.Audio.select();
        }
    }, 100);

    // Phase 2: Flash fades, lines appear one by one
    setTimeout(() => {
        flashEl.classList.remove('active');
        titleEl.classList.remove('glitch');

        let idx = 0;
        function showLine() {
            if (idx >= BOOT_LINES.length) {
                // Phase 3: Quick rain burst then to menu
                setTimeout(() => {
                    showRainBurst();
                }, 200);
                return;
            }

            const { text, delay, ok } = BOOT_LINES[idx];
            lineEl.innerHTML = ok
                ? `${text}<span class="ok"> [OK]</span>`
                : text;
            lineEl.classList.add('visible');

            if (ok && window.Audio) window.Audio.select();

            setTimeout(() => {
                lineEl.classList.remove('visible');
                idx++;
                setTimeout(showLine, 80);
            }, delay);
        }

        showLine();
    }, 900);

    function showRainBurst() {
        const rain = document.getElementById('data-rain');
        const CHARS = '01アイウエカキクサシス';
        const COLS = 12;

        for (let i = 0; i < COLS; i++) {
            const col = document.createElement('div');
            col.className = 'rain-col';
            col.style.left = `${5 + (i / COLS) * 90}%`;
            const duration = 0.8 + Math.random() * 0.6;
            const delay = Math.random() * 0.5;
            col.style.animationDuration = `${duration}s`;
            col.style.animationDelay = `${delay}s`;
            col.style.opacity = '0.7';
            let content = '';
            for (let j = 0; j < 12; j++) {
                content += CHARS[Math.floor(Math.random() * CHARS.length)] + '\n';
            }
            col.textContent = content;
            rain.appendChild(col);
        }

        rain.style.opacity = '1';

        // Fade out and transition to menu
        setTimeout(() => {
            const container = document.getElementById('boot-screen');
            container.style.opacity = '0';
            setTimeout(() => {
                showScreen('menu');
                initMenuScreen();
            }, 400);
        }, 600);
    }
}

// =====================================================
// SCREEN: MAIN MENU
// =====================================================
function initMenuScreen() {
    renderMenuStats();

    document.getElementById('btn-new-run').onclick = () => {
        if (window.resetRun) window.resetRun();
        if (window.resetContract) window.resetContract();
        showScreen('contract');
        initContractScreen();
    };

    document.getElementById('btn-best-run').onclick = () => {
        const stats = document.getElementById('menu-stats');
        stats.classList.add('flash');
        setTimeout(() => stats.classList.remove('flash'), 600);
        renderMenuStats();
    };

    // Remove A2HS banner — not needed, we have the install button
}

function renderMenuStats() {
    const S = window.STATE;
    const el = document.getElementById('menu-stats');
    if (!el) return;
    const streakLine = S.bestWinStreak > 1 ? `<br>Best Streak: 🔥 ${S.bestWinStreak}` : '';
    el.innerHTML = `
        Best Level: LVL ${S.bestLevel || '--'}<br>
        Best Score: €€ ${S.bestScore || '--'}<br>
        Total Runs: ${S.totalRuns || 0}${streakLine}
    `;
}
window.renderMenuStats = renderMenuStats;

// =====================================================
// SCREEN: CONTRACT
// =====================================================
function initContractScreen() {
    const S = window.STATE;

    // Pick random client and flavor pairing
    const idx = Math.floor(Math.random() * S.CONTRACT_CLIENTS.length);
    S.contractClient = S.CONTRACT_CLIENTS[idx];
    S.contractFlavor = S.CONTRACT_FLAVORS[idx];
    S.contractReward = window.contractRewardForLevel(S.level);

    // Populate elements
    document.getElementById('contract-level-display').textContent = `LVL ${String(S.level).padStart(2, '0')}`;
    document.getElementById('contract-client').textContent = S.contractClient;
    document.getElementById('contract-flavor').textContent = S.contractFlavor;
    document.getElementById('contract-target').textContent = S.hackTarget.toLocaleString();
    document.getElementById('contract-reward').textContent = `€€ ${S.contractReward}`;
    document.getElementById('contract-moves').textContent = S.moves;

    // Time display
    const timeRow = document.getElementById('contract-time-row');
    const timeEl = document.getElementById('contract-time');
    if (timeRow && timeEl) {
        timeRow.style.display = 'flex';
        const mins = Math.floor(S.timeLeft / 60);
        const secs = S.timeLeft % 60;
        timeEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    // Boss contract display
    const bossRow = document.getElementById('boss-row');
    const bossEl = document.getElementById('contract-boss');
    if (bossRow && bossEl) {
        if (S.isBoss && S.bossType) {
            bossRow.style.display = 'flex';
            bossEl.textContent = `${S.bossType.icon} ${S.bossType.name}`;
            bossEl.title = S.bossType.desc;
        } else {
            bossRow.style.display = 'none';
        }
    }

    // Render active upgrades
    const upgradesEl = document.getElementById('contract-upgrades-list');
    upgradesEl.innerHTML = '';
    (S.activeUpgrades || []).forEach(upg => {
        const tag = document.createElement('span');
        tag.className = 'upgrade-tag';
        tag.textContent = upg.name || upg.id;
        upgradesEl.appendChild(tag);
    });

    // Show synergy bonuses
    const flags = S.upgradeFlags || {};
    if (flags.synergies && flags.synergies.length > 0) {
        const synHeader = document.createElement('div');
        synHeader.style.cssText = 'font-size:9px;letter-spacing:2px;color:var(--neon-yellow);margin-bottom:4px;text-transform:uppercase;';
        synHeader.textContent = '◈ SYNERGIES';
        upgradesEl.appendChild(synHeader);
        flags.synergies.forEach(syn => {
            const tag = document.createElement('span');
            tag.className = 'upgrade-tag';
            tag.style.borderColor = 'rgba(255,214,10,0.4)';
            tag.style.color = 'var(--neon-yellow)';
            tag.textContent = syn.name;
            upgradesEl.appendChild(tag);
        });
    }

    // Show win streak
    if (S.winStreak > 0) {
        const streakEl = document.createElement('div');
        streakEl.style.cssText = 'font-size:11px;color:var(--neon-yellow);letter-spacing:2px;text-align:center;margin-top:6px;';
        streakEl.textContent = `🔥 ${S.winStreak} WIN STREAK`;
        upgradesEl.appendChild(streakEl);
    }

    // Entrance animation
    const container = document.querySelector('.contract-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        });
    });

    const hackFill = document.querySelector('.contract-details .hack-bar-fill');
    if (hackFill) {
        hackFill.style.transition = 'width 0.6s ease';
        hackFill.style.opacity = '0.6';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                hackFill.style.width = '100%';
            });
        });
    }

    document.getElementById('btn-execute').onclick = () => {
        showScreen('game');
        initGameScreen();
    };
}
window.initContractScreen = initContractScreen;

// =====================================================
// SCREEN: GAME (HUD placeholder)
// =====================================================
function initGameScreen() {
    const S = window.STATE;

    S.isProcessing = false;
    S.currentCascadeDepth = 0;

    const lvlEl = document.getElementById('hud-level');
    const clientEl = document.getElementById('hud-client');
    const eurosEl = document.getElementById('hud-euros');
    const fillEl = document.getElementById('hack-bar-fill');
    const movesEl = document.getElementById('hack-bar-moves');

    if (lvlEl) lvlEl.textContent = `LVL ${String(S.level).padStart(2, '0')}`;
    if (clientEl) clientEl.textContent = S.contractClient || '---';
    if (eurosEl) eurosEl.textContent = S.eurodollars;
    if (fillEl) {
        fillEl.style.width = '0%';
        fillEl.classList.remove('bar-hot', 'bar-complete');
    }
    if (movesEl) movesEl.textContent = `MOVES: ${S.moves}`;

    const oldGrid = document.getElementById('game-grid');
    if (oldGrid) {
        const newGrid = oldGrid.cloneNode(true);
        newGrid.innerHTML = '';
        oldGrid.replaceWith(newGrid);
    }

    // Delegate to game engine
    if (typeof window.startGame === 'function') {
        window.startGame();
    }

    if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
    if (typeof window.startContractTimer === 'function') window.startContractTimer();

    // Blackout Button
    const oldBtn = document.getElementById('blackout-btn');
    if (oldBtn) oldBtn.remove();

    if (window.hasUpgrade && window.hasUpgrade('blackout') && !(S.upgradeFlags && S.upgradeFlags.blackoutUsed)) {
        const btn = document.createElement('button');
        btn.id = 'blackout-btn';
        btn.className = 'btn';
        btn.textContent = '⚡ BLACKOUT';
        btn.style.cssText = 'width:auto;margin-top:8px;padding:10px 24px;color:var(--neon-red);border-color:var(--neon-red);font-size:12px;letter-spacing:3px;box-shadow:0 0 12px rgba(255,45,85,0.3)';

        btn.onclick = () => {
            if (!S.grid) return;
            // Count colors
            const counts = {};
            S.grid.forEach(row => row.forEach(tile => {
                if (tile && tile.color) counts[tile.color] = (counts[tile.color] || 0) + 1;
            }));
            let topColor = null, max = 0;
            for (const c in counts) {
                if (counts[c] > max) { max = counts[c]; topColor = c; }
            }
            if (topColor) {
                btn.disabled = true;
                btn.style.opacity = '0.3';
                btn.style.pointerEvents = 'none';
                if (!S.upgradeFlags) S.upgradeFlags = {};
                S.upgradeFlags.blackoutUsed = true;

                const targets = [];
                for (let r = 0; r < S.GRID_SIZE; r++) {
                    for (let c = 0; c < S.GRID_SIZE; c++) {
                        if (S.grid[r][c] && S.grid[r][c].color === topColor) targets.push({ row: r, col: c, color: topColor });
                    }
                }
                if (targets.length > 0 && typeof processMatches === 'function') processMatches(targets);
            }
        };
        const wrapper = document.querySelector('.grid-wrapper');
        if (wrapper) wrapper.appendChild(btn);
    }

    const oldFreezeBtn = document.getElementById('freeze-btn');
    if (oldFreezeBtn) oldFreezeBtn.remove();

    if (window.hasUpgrade && window.hasUpgrade('time_freeze') && !(S.upgradeFlags && S.upgradeFlags.timeFreezeUsed)) {
        const freezeBtn = document.createElement('button');
        freezeBtn.id = 'freeze-btn';
        freezeBtn.className = 'btn';
        freezeBtn.textContent = '❄ FREEZE TIMER';
        freezeBtn.style.cssText = 'width:auto;margin-top:6px;padding:10px 24px;color:var(--neon-cyan);border-color:var(--neon-cyan);font-size:12px;letter-spacing:3px;box-shadow:0 0 12px rgba(0,255,249,0.3)';
        freezeBtn.onclick = () => {
            if (!S.upgradeFlags) S.upgradeFlags = {};
            S.upgradeFlags.timeFreezeUsed = true;
            S.upgradeFlags.timerFrozen = true;
            freezeBtn.disabled = true;
            freezeBtn.textContent = '❄ TIMER FROZEN';
            freezeBtn.style.opacity = '0.5';
            if (typeof window.showFloatingText === 'function') {
                window.showFloatingText('TIMER FROZEN — 20s', 'cyan');
            }
            setTimeout(() => {
                if (S.upgradeFlags) S.upgradeFlags.timerFrozen = false;
            }, 20000);
        };
        const wrapper = document.querySelector('.grid-wrapper');
        if (wrapper) wrapper.appendChild(freezeBtn);
    }

    // Shuffle Board Button
    const oldShuffleBtn = document.getElementById('shuffle-btn');
    if (oldShuffleBtn) oldShuffleBtn.remove();

    if (window.hasUpgrade && window.hasUpgrade('shuffle_board') && !(S.upgradeFlags && S.upgradeFlags.shuffleUsed)) {
        const shuffleBtn = document.createElement('button');
        shuffleBtn.id = 'shuffle-btn';
        shuffleBtn.className = 'btn';
        shuffleBtn.textContent = '🔀 SHUFFLE';
        shuffleBtn.style.cssText = 'width:auto;margin-top:6px;padding:10px 24px;color:var(--neon-purple);border-color:var(--neon-purple);font-size:12px;letter-spacing:3px;box-shadow:0 0 12px rgba(191,90,242,0.3)';
        shuffleBtn.onclick = () => {
            if (!S.grid) return;
            shuffleBtn.disabled = true;
            shuffleBtn.textContent = '🔀 SHUFFLED';
            shuffleBtn.style.opacity = '0.4';
            if (!S.upgradeFlags) S.upgradeFlags = {};
            S.upgradeFlags.shuffleUsed = true;
            if (typeof window.shuffleBoard === 'function') window.shuffleBoard();
        };
        const wrapper = document.querySelector('.grid-wrapper');
        if (wrapper) wrapper.appendChild(shuffleBtn);
    }
}
window.initGameScreen = initGameScreen;

// =====================================================
// SCREEN: SHOP
// =====================================================
function initShopScreen(earnedAmount) {
    const S = window.STATE;
    earnedAmount = earnedAmount || 0;

    // Animate euro counter
    const display = document.getElementById('shop-euros-display');
    const endVal = S.eurodollars;
    const startDisplay = endVal - earnedAmount;

    if (earnedAmount > 0 && !REDUCED_MOTION) {
        const startTime = performance.now();
        const duration = 800;
        function tick(now) {
            const t = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(startDisplay + (endVal - startDisplay) * t);
            if (display) display.textContent = `€€ ${current}`;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    } else {
        if (display) display.textContent = `€€ ${endVal}`;
    }

    // Show banner
    const banner = document.getElementById('shop-banner');
    const bannerText = document.getElementById('shop-banner-text');
    if (banner && bannerText) {
        bannerText.textContent = `ACCESS GRANTED — LVL ${S.level - 1} CLEARED | +€€${earnedAmount}`;
        banner.classList.add('visible');
    }

    // Render shop offers
    const offersEl = document.getElementById('shop-offers');
    offersEl.innerHTML = '';
    const offers = typeof window.getShopOffers === 'function' ? window.getShopOffers() : [];

    if (offers.length === 0) {
        offersEl.innerHTML = '<p style="color:var(--text-dim);text-align:center;font-size:12px;letter-spacing:2px">// NO UPGRADES AVAILABLE — TERMINAL OFFLINE //</p>';
    } else {
        offers.forEach(upgrade => {
            const cost = window.getUpgradeCost(upgrade.id);
            const canAfford = S.eurodollars >= cost;
            const rarityColors = { common: 'var(--neon-cyan)', rare: 'var(--neon-purple)', legendary: 'var(--neon-yellow)' };

            // Check if this upgrade would unlock a synergy
            const wouldUnlock = [];
            if (upgrade.synergy) {
                const synCount = S.activeUpgrades.filter(u => u.synergy === upgrade.synergy).length;
                if (synCount >= 2) wouldUnlock.push('SYNERGY!');
            }
            const synergyTag = wouldUnlock.length > 0
                ? `<span style="font-size:8px;color:var(--neon-yellow);letter-spacing:1px;border:1px solid rgba(255,214,10,0.3);padding:1px 5px;border-radius:2px">◈ ${wouldUnlock.join(' + ')}</span>`
                : '';

            const card = document.createElement('div');
            card.className = 'card shop-card rarity-' + upgrade.rarity;
            const btnStyle = canAfford
                ? 'width:auto;padding:8px 16px;font-size:11px'
                : 'width:auto;padding:8px 16px;font-size:11px;opacity:0.3;cursor:not-allowed';
            card.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                <span class="card-name" style="color:${rarityColors[upgrade.rarity]}">${upgrade.name}</span>
                <span style="font-size:9px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;white-space:nowrap">${upgrade.rarity}</span>
              </div>
              <p class="card-desc">${upgrade.description}</p>
              ${synergyTag ? `<div style="margin-top:-2px">${synergyTag}</div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
                <span class="card-cost">€€ ${cost}</span>
                <button class="btn btn-secondary" style="${btnStyle}"
                  ${canAfford ? '' : 'disabled'}
                  onclick="window.handleBuyUpgrade('${upgrade.id}', this)">
                  ${canAfford ? 'BUY' : 'INSUFFICIENT €€'}
                </button>
              </div>
            `;
            offersEl.appendChild(card);
        });
    }

    // Next contract button
    document.getElementById('btn-next-contract').onclick = () => {
        S.level++;
        if (window.resetContract) window.resetContract();
        showScreen('contract');
        initContractScreen();
    };
}
window.initShopScreen = initShopScreen;

window.handleBuyUpgrade = function (upgradeId, buttonEl) {
    const success = window.buyUpgrade(upgradeId);
    if (success) {
        if (window.Audio) window.Audio.buy();
        const card = buttonEl.closest('.shop-card');
        card.classList.add('purchased');
        document.getElementById('shop-euros-display').textContent = '€€ ' + window.STATE.eurodollars;

        // Apply synergies after purchase
        if (window.applySynergies) window.applySynergies();

        // Refresh all buy buttons (some might now be unaffordable)
        document.querySelectorAll('.shop-card:not(.purchased) button').forEach(btn => {
            const match = btn.getAttribute('onclick').match(/'([^']+)'/);
            if (match) {
                const id = match[1];
                const cost = window.getUpgradeCost(id);
                if (window.STATE.eurodollars < cost) {
                    btn.disabled = true;
                    btn.textContent = 'INSUFFICIENT €€';
                    btn.style.opacity = '0.3';
                    btn.style.cursor = 'not-allowed';
                }
            }
        });
    }
}

window.toggleSound = function () {
    if (window.Audio) {
        const on = window.Audio.toggle();
        const btn = document.getElementById('sound-toggle');
        if (btn) btn.textContent = on ? '🔊' : '🔇';
    }
}

// =====================================================
// SCREEN: GAME OVER
// =====================================================
function showGameOver(reason) {
    if (window.STATE && window.STATE.timerInterval) {
        clearInterval(window.STATE.timerInterval);
        window.STATE.timerInterval = null;
    }
    if (window.Audio) window.Audio.gameOver();
    reason = reason || 'OUT OF MOVES';

    // Set runScore to total eurodollars earned this run
    if (window.STATE) {
        window.STATE.runScore = window.STATE.eurodollars;
    }

    if (window.saveBestRun) window.saveBestRun();

    const S = window.STATE;
    const wasNewBest = S.runScore > 0 && S.runScore >= S.bestScore;

    showScreen('gameover');

    // Trigger glitch animation
    const title = document.getElementById('gameover-title');
    if (title) {
        title.classList.remove('animate');
        void title.offsetWidth; // reflow to restart animation
        title.classList.add('animate');
    }

    // Reason
    const reasonEl = document.getElementById('gameover-reason');
    if (reasonEl) reasonEl.textContent = `// ${reason} //`;

    // Stats table
    const statsEl = document.getElementById('gameover-stats');
    if (statsEl) {
        const streakHtml = S.winStreak > 0
            ? `<div class="gameover-stat-row"><span class="gameover-stat-label">🔥 Win Streak</span><span class="gameover-stat-value" style="color:var(--neon-yellow)">${S.winStreak}</span></div>`
            : '';
        const contractsHtml = S.contractsWon > 0
            ? `<div class="gameover-stat-row"><span class="gameover-stat-label">Contracts Won</span><span class="gameover-stat-value">${S.contractsWon}</span></div>`
            : '';
        statsEl.innerHTML = `
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">Level Reached</span>
                <span class="gameover-stat-value">LVL ${S.level}</span>
            </div>
            ${contractsHtml}
            ${streakHtml}
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">€€ This Run</span>
                <span class="gameover-stat-value">€€ ${S.runScore || 0}</span>
            </div>
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">Total €€ Earned</span>
                <span class="gameover-stat-value">€€ ${S.totalEurodollars || 0}</span>
            </div>
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">Upgrades Owned</span>
                <span class="gameover-stat-value">${(S.activeUpgrades || []).length}</span>
            </div>
        `;
    }

    // Best run indicator
    const bestEl = document.getElementById('gameover-best');
    if (bestEl) {
        if (wasNewBest) {
            bestEl.textContent = '◈ NEW BEST RUN ◈';
            bestEl.className = 'gameover-best glow-yellow';
        } else if (S.bestWinStreak > 1) {
            bestEl.textContent = `Best Streak: ${S.bestWinStreak} wins`;
            bestEl.className = 'gameover-best';
        } else {
            bestEl.textContent = '';
            bestEl.className = 'gameover-best';
        }
    }

    // Retry button
    document.getElementById('btn-retry').onclick = () => {
        if (window.resetRun) window.resetRun();
        showScreen('menu');
        initMenuScreen();
    };
}
window.showGameOver = showGameOver;

// =====================================================
// PWA INSTALLATION LOGIC
// =====================================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('pwa-install');
    if (installBtn) installBtn.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install');
    if (installBtn) installBtn.classList.add('hidden');
});

async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install');
    if (installBtn) installBtn.classList.add('hidden');
}

// =====================================================
// ENTRY POINT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Global error boundary — catch unhandled errors and show fallback UI
    window.addEventListener('error', (e) => {
        console.error('[NETRUNNER] Uncaught error:', e.message, e.filename, e.lineno);
        showErrorRecovery(e.message);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('[NETRUNNER] Unhandled promise rejection:', e.reason);
        showErrorRecovery('Async error: ' + (e.reason?.message || 'Unknown'));
    });

    function showErrorRecovery(message) {
        // Prevent duplicate error overlays
        if (document.getElementById('netrunner-error')) return;

        const overlay = document.createElement('div');
        overlay.id = 'netrunner-error';
        overlay.style.cssText = `
            position:fixed; inset:0; z-index:99999;
            background:rgba(5,10,14,0.95);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:16px; padding:24px; text-align:center;
        `;
        overlay.innerHTML = `
            <div style="color:#ff2d55;font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace;letter-spacing:3px;text-shadow:0 0 12px #ff2d55">
                ⚠ SYSTEM ERROR
            </div>
            <div style="color:#4a7a9b;font-size:11px;font-family:'JetBrains Mono',monospace;max-width:300px;word-break:break-all">
                ${message || 'Unknown error'}
            </div>
            <button onclick="location.reload()" style="
                background:transparent; border:1px solid #00fff9; color:#00fff9;
                padding:10px 24px; font-size:12px; letter-spacing:2px; cursor:pointer;
                font-family:'JetBrains Mono',monospace; margin-top:8px;
            ">↺ REBOOT SYSTEM</button>
        `;
        document.body.appendChild(overlay);
    }

    function fixVh() {
        document.documentElement.style.setProperty('--real-vh', window.innerHeight * 0.01 + 'px');
    }
    fixVh();
    window.addEventListener('resize', fixVh);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('[PWA] ServiceWorker registered', reg.scope))
            .catch(err => console.warn('[PWA] ServiceWorker failed', err));
    }

    const installBtn = document.getElementById('pwa-install');
    if (installBtn) installBtn.onclick = handleInstallClick;

    if (window.loadBestRun) window.loadBestRun();
    runBootSequence();
});
