// =====================================================
// NETRUNNER MATCH — main.js
// Screen orchestration and UI controllers
// =====================================================

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =====================================================
// CORE: Screen Switcher
// =====================================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
        target.classList.add('active');
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

    const lvlEl = document.getElementById('hud-level');
    const clientEl = document.getElementById('hud-client');
    const eurosEl = document.getElementById('hud-euros');
    const fillEl = document.getElementById('hack-bar-fill');
    const movesEl = document.getElementById('hack-bar-moves');

    if (lvlEl) lvlEl.textContent = `LVL ${String(S.level).padStart(2, '0')}`;
    if (clientEl) clientEl.textContent = S.contractClient || '---';
    if (eurosEl) eurosEl.textContent = S.eurodollars;
    if (fillEl) fillEl.style.width = '0%';
    if (movesEl) movesEl.textContent = `MOVES: ${S.moves}`;

    // Delegate to game engine
    if (typeof window.startGame === 'function') {
        window.startGame();
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
    const startVal = S.eurodollars;
    const endVal = startVal + earnedAmount;
    S.eurodollars = endVal;
    S.totalEurodollars = (S.totalEurodollars || 0) + earnedAmount;
    S.runScore = (S.runScore || 0) + earnedAmount;

    if (earnedAmount > 0 && !REDUCED_MOTION) {
        const startTime = performance.now();
        const duration = 800;
        function tick(now) {
            const t = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(startVal + (endVal - startVal) * t);
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
        bannerText.textContent = `ACCESS GRANTED — CONTRACT COMPLETE — LVL ${S.level} CLEARED`;
        banner.classList.add('visible');
    }

    // Render shop offers
    const offersEl = document.getElementById('shop-offers');
    offersEl.innerHTML = '';
    const offers = typeof window.getShopOffers === 'function' ? window.getShopOffers() : [];

    if (offers.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'shop-offline-msg';
        msg.textContent = '// NO UPGRADES AVAILABLE — TERMINAL OFFLINE //';
        offersEl.appendChild(msg);
    } else {
        offers.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = `shop-card rarity-${upgrade.rarity || 'common'}`;
            card.dataset.id = upgrade.id;
            card.innerHTML = `
                <div class="card-name">${upgrade.name}</div>
                <div class="card-desc">${upgrade.description}</div>
                <div class="card-cost">€€ ${upgrade.cost}</div>
                <button class="btn btn-secondary">▶ INSTALL</button>
            `;
            card.querySelector('button').onclick = () => {
                if (typeof window.buyUpgrade === 'function') {
                    const success = window.buyUpgrade(upgrade.id);
                    if (success) {
                        card.classList.add('purchased');
                        if (display) display.textContent = `€€ ${S.eurodollars}`;
                    }
                }
            };
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

// =====================================================
// SCREEN: GAME OVER
// =====================================================
function showGameOver(reason) {
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
// ENTRY POINT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.loadBestRun) window.loadBestRun();
    console.log('[NETRUNNER] System online.');
    runBootSequence();
});
