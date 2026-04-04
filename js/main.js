// =====================================================
// NETRUNNER MATCH — main.js
// Screen orchestration and UI controllers
// =====================================================

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =====================================================
// CORE: Screen Switcher
// =====================================================
function showScreen(screenId) {
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
// SCREEN: BOOT SEQUENCE
// =====================================================
const BOOT_LINES = [
    { text: '> INITIALIZING NETRUNNER_PROTOCOL v2.077...', type: 'dim' },
    { text: '> CONNECTING TO BLACKWALL NODE...', type: 'dim' },
    { text: '> SCANNING HOSTILE ICE LAYERS...', type: 'dim' },
    { text: '> BYPASSING ICE [████████░░] 78%...', type: 'normal' },
    { text: '> BYPASSING ICE [██████████] 100%...', type: 'ok' },
    { text: '> LOADING CONTRACTOR PROFILE...', type: 'dim' },
    { text: '> DECRYPTING RUN HISTORY...', type: 'dim' },
    { text: '> WELCOME BACK, NETRUNNER.', type: 'ok' },
];

function runBootSequence() {
    showScreen('boot');

    if (REDUCED_MOTION) {
        showScreen('menu');
        initMenuScreen();
        return;
    }

    const container = document.querySelector('.boot-container');
    const linesEl = document.getElementById('boot-lines');

    // Render boot lines with staggered delay
    function showLine(index) {
        if (index >= BOOT_LINES.length) {
            // All lines shown — trigger rain after 500ms
            setTimeout(showRain, 500);
            return;
        }

        const { text, type } = BOOT_LINES[index];
        const el = document.createElement('div');
        el.className = `boot-line ${type}`;
        el.textContent = text;
        linesEl.appendChild(el);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => el.classList.add('visible'));
        });

        setTimeout(() => showLine(index + 1), 320);
    }

    function showRain() {
        const rain = document.getElementById('data-rain');
        const CHARS = '01アイウエカキクサシスタチツ█▓░';
        const COLS = 14;

        for (let i = 0; i < COLS; i++) {
            const col = document.createElement('div');
            col.className = 'rain-col';
            col.style.left = `${Math.random() * 95}%`;

            const duration = 1.2 + Math.random() * 1.2;
            const delay = Math.random() * 1.5;
            col.style.animationDuration = `${duration}s`;
            col.style.animationDelay = `${delay}s`;

            let content = '';
            for (let j = 0; j < 18; j++) {
                content += CHARS[Math.floor(Math.random() * CHARS.length)];
                content += '\n';
            }
            col.textContent = content;
            rain.appendChild(col);
        }

        rain.style.opacity = '1';

        // After 1600ms — fade out boot container and go to menu
        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                showScreen('menu');
                initMenuScreen();
            }, 500);
        }, 1600);
    }

    showLine(0);
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

    // A2HS Prompt
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;
    if (!isStandalone && !localStorage.getItem('netrunner_install_dismissed')) {
        const a2hs = document.createElement('div');
        a2hs.style.cssText = 'position:fixed;bottom:0;width:100%;background:var(--panel-bg);border-top:1px solid var(--border);padding:10px 16px;font-size:11px;color:var(--text-dim);letter-spacing:1px;display:flex;justify-content:space-between;z-index:500';
        a2hs.innerHTML = '<span>Add to Home Screen for best experience</span><span style="padding:0 8px;cursor:pointer">✕</span>';
        a2hs.querySelector('span:last-child').onclick = () => {
            localStorage.setItem('netrunner_install_dismissed', '1');
            a2hs.remove();
        };
        document.body.appendChild(a2hs);
    }
}

function renderMenuStats() {
    const S = window.STATE;
    const el = document.getElementById('menu-stats');
    if (!el) return;
    el.innerHTML = `
        Best Level: LVL ${S.bestLevel || '--'}<br>
        Best Score: €€ ${S.bestScore || '--'}<br>
        Total Runs: ${S.totalRuns || 0}
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

    // Render active upgrades
    const upgradesEl = document.getElementById('contract-upgrades-list');
    upgradesEl.innerHTML = '';
    (S.activeUpgrades || []).forEach(upg => {
        const tag = document.createElement('span');
        tag.className = 'upgrade-tag';
        tag.textContent = upg.name || upg.id;
        upgradesEl.appendChild(tag);
    });

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
        hackFill.style.animation = 'bar-scan 0.6s ease forwards';
        setTimeout(() => { if (hackFill) hackFill.style.animation = ''; }, 600);
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
                for (let r=0; r<S.GRID_SIZE; r++) {
                    for (let c=0; c<S.GRID_SIZE; c++) {
                        if (S.grid[r][c] && S.grid[r][c].color === topColor) targets.push({row:r, col:c, color:topColor});
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
            
            const card = document.createElement('div');
            card.className = 'card shop-card rarity-' + upgrade.rarity;
            card.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="card-name" style="color:${rarityColors[upgrade.rarity]}">${upgrade.name}</span>
                <span style="font-size:9px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase">${upgrade.rarity}</span>
              </div>
              <p class="card-desc">${upgrade.description}</p>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
                <span class="card-cost">€€ ${cost}</span>
                <button class="btn btn-secondary" style="width:auto;padding:8px 16px;font-size:11px" 
                  ${canAfford ? '' : 'disabled style="opacity:0.3;cursor:not-allowed"'}
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

window.handleBuyUpgrade = function(upgradeId, buttonEl) {
    const success = window.buyUpgrade(upgradeId);
    if (success) {
        if (window.Audio) window.Audio.buy();
        const card = buttonEl.closest('.shop-card');
        card.classList.add('purchased');
        document.getElementById('shop-euros-display').textContent = '€€ ' + window.STATE.eurodollars;
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

window.toggleSound = function() {
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
        statsEl.innerHTML = `
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">Level Reached</span>
                <span class="gameover-stat-value">LVL ${S.level}</span>
            </div>
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">€€ This Run</span>
                <span class="gameover-stat-value">€€ ${S.runScore || 0}</span>
            </div>
            <div class="gameover-stat-row">
                <span class="gameover-stat-label">Total €€ Earned</span>
                <span class="gameover-stat-value">€€ ${S.totalEurodollars || 0}</span>
            </div>
        `;
    }

    // Best run indicator
    const bestEl = document.getElementById('gameover-best');
    if (bestEl) {
        bestEl.textContent = wasNewBest ? '◈ NEW BEST RUN ◈' : '';
        bestEl.className = wasNewBest ? 'gameover-best glow-yellow' : 'gameover-best';
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
    if (installBtn) installBtn.style.display = 'block';
});

async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        const installBtn = document.getElementById('pwa-install');
        if (installBtn) installBtn.style.display = 'none';
    }
    deferredPrompt = null;
}

// =====================================================
// ENTRY POINT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
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
