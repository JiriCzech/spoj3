// =====================================================
// NETRUNNER MATCH — engine.js
// Core match-3 engine: grid, swap, match, cascade
// =====================================================

let isProcessing = false;
let listenersAttached = false;

// =====================================================
// HELPERS
// =====================================================
function randomColor() {
    return STATE.COLORS[Math.floor(Math.random() * STATE.COLORS.length)];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTileEl(row, col) {
    const grid = document.getElementById('game-grid');
    return grid ? grid.children[row * STATE.GRID_SIZE + col] || null : null;
}

// =====================================================
// GRID INIT
// =====================================================
function initGrid() {
    STATE.grid = [];
    for (let r = 0; r < STATE.GRID_SIZE; r++) {
        STATE.grid[r] = [];
        for (let c = 0; c < STATE.GRID_SIZE; c++) {
            let color, attempts = 0;
            do {
                color = randomColor();
                attempts++;
            } while (attempts < 100 && wouldCreateMatch(STATE.grid, r, c, color));
            STATE.grid[r][c] = { color, special: false };
        }
    }
}

function wouldCreateMatch(grid, row, col, color) {
    if (col >= 2 &&
        grid[row][col - 1]?.color === color &&
        grid[row][col - 2]?.color === color) return true;
    if (row >= 2 &&
        grid[row - 1]?.[col]?.color === color &&
        grid[row - 2]?.[col]?.color === color) return true;
    return false;
}

// =====================================================
// RENDER
// =====================================================
function createTileEl(r, c, tileData) {
    const el = document.createElement('div');
    el.className = `tile tile-${tileData.color}`;
    el.dataset.row = r;
    el.dataset.col = c;
    const icon = document.createElement('span');
    icon.className = 'tile-icon';
    icon.textContent = STATE.TILE_ICONS[tileData.color];
    el.appendChild(icon);
    return el;
}

function renderGrid() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let r = 0; r < STATE.GRID_SIZE; r++) {
        for (let c = 0; c < STATE.GRID_SIZE; c++) {
            grid.appendChild(createTileEl(r, c, STATE.grid[r][c]));
        }
    }
    attachTileListeners();
}

function syncGridDOM() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let r = 0; r < STATE.GRID_SIZE; r++) {
        for (let c = 0; c < STATE.GRID_SIZE; c++) {
            grid.appendChild(createTileEl(r, c, STATE.grid[r][c]));
        }
    }
}

function updateTileDOM(row, col) {
    const el = getTileEl(row, col);
    const td = STATE.grid[row][col];
    if (!el || !td) return;
    el.className = `tile tile-${td.color}`;
    el.dataset.row = row;
    el.dataset.col = col;
    let icon = el.querySelector('.tile-icon');
    if (!icon) { icon = document.createElement('span'); icon.className = 'tile-icon'; el.appendChild(icon); }
    icon.textContent = STATE.TILE_ICONS[td.color];
}

// =====================================================
// INPUT: EVENT DELEGATION (TAP + SWIPE)
// =====================================================
function attachTileListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    const grid = document.getElementById('game-grid');
    if (!grid) return;

    let txStart = 0, tyStart = 0, tTimeStart = 0, touchedTile = null;

    grid.addEventListener('touchstart', e => {
        const tile = e.target.closest('.tile');
        if (!tile) return;
        touchedTile = tile;
        txStart = e.touches[0].clientX;
        tyStart = e.touches[0].clientY;
        tTimeStart = Date.now();
    }, { passive: true });

    grid.addEventListener('touchend', e => {
        if (!touchedTile) return;
        const dx = e.changedTouches[0].clientX - txStart;
        const dy = e.changedTouches[0].clientY - tyStart;
        const dist = Math.hypot(dx, dy);
        const elapsed = Date.now() - tTimeStart;
        const r1 = parseInt(touchedTile.dataset.row);
        const c1 = parseInt(touchedTile.dataset.col);

        if (dist > 30 && elapsed < 400) {
            // SWIPE
            let r2 = r1, c2 = c1;
            if (Math.abs(dx) > Math.abs(dy)) {
                c2 = dx > 0 ? c1 + 1 : c1 - 1;
            } else {
                r2 = dy > 0 ? r1 + 1 : r1 - 1;
            }
            if (r2 >= 0 && r2 < STATE.GRID_SIZE && c2 >= 0 && c2 < STATE.GRID_SIZE) {
                STATE.selectedTile = null;
                removeAllSelected();
                trySwap(r1, c1, r2, c2);
            }
        } else if (dist < 10) {
            handleTap(r1, c1);
        }
        touchedTile = null;
    }, { passive: true });

    grid.addEventListener('click', e => {
        const tile = e.target.closest('.tile');
        if (!tile) return;
        handleTap(parseInt(tile.dataset.row), parseInt(tile.dataset.col));
    });
}

function handleTap(row, col) {
    if (isProcessing) return;
    const sel = STATE.selectedTile;

    if (!sel) {
        STATE.selectedTile = { row, col };
        const el = getTileEl(row, col);
        if (el) el.classList.add('selected');
        return;
    }

    if (sel.row === row && sel.col === col) {
        STATE.selectedTile = null;
        removeAllSelected();
        return;
    }

    const dr = Math.abs(sel.row - row);
    const dc = Math.abs(sel.col - col);
    const r1 = sel.row, c1 = sel.col;
    STATE.selectedTile = null;
    removeAllSelected();

    if (dr + dc === 1) {
        trySwap(r1, c1, row, col);
    } else {
        STATE.selectedTile = { row, col };
        const el = getTileEl(row, col);
        if (el) el.classList.add('selected');
    }
}

function removeAllSelected() {
    document.querySelectorAll('.tile.selected').forEach(el => el.classList.remove('selected'));
}

// =====================================================
// SWAP
// =====================================================
async function trySwap(r1, c1, r2, c2) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
        if (dr + dc !== 1) {
            playInvalid(r1, c1);
            playInvalid(r2, c2);
            return;
        }

        // Deduct move
        STATE.moves--;
        updateHackBar();

        // Animate swap visually
        await animateSwap(r1, c1, r2, c2);

        // Swap data
        const tmp = STATE.grid[r1][c1];
        STATE.grid[r1][c1] = STATE.grid[r2][c2];
        STATE.grid[r2][c2] = tmp;
        updateTileDOM(r1, c1);
        updateTileDOM(r2, c2);

        const matches = findMatches();

        if (matches.length > 0) {
            await processMatches(matches);
        } else {
            // Swap back
            await animateSwap(r1, c1, r2, c2);
            const tmp2 = STATE.grid[r1][c1];
            STATE.grid[r1][c1] = STATE.grid[r2][c2];
            STATE.grid[r2][c2] = tmp2;
            updateTileDOM(r1, c1);
            updateTileDOM(r2, c2);
            STATE.moves++;
            updateHackBar();
            playInvalid(r1, c1);
            playInvalid(r2, c2);
        }

        await checkContractState();

    } finally {
        isProcessing = false;
    }
}

async function animateSwap(r1, c1, r2, c2) {
    const el1 = getTileEl(r1, c1);
    const el2 = getTileEl(r2, c2);
    if (!el1 || !el2) return;
    const dx = (c2 - c1) * 100;
    const dy = (r2 - r1) * 100;
    el1.style.transition = 'transform 0.12s ease';
    el2.style.transition = 'transform 0.12s ease';
    el1.style.transform = `translate(${dx}%, ${dy}%)`;
    el2.style.transform = `translate(${-dx}%, ${-dy}%)`;
    await sleep(130);
    el1.style.transition = '';
    el2.style.transition = '';
    el1.style.transform = '';
    el2.style.transform = '';
}

function playInvalid(row, col) {
    const el = getTileEl(row, col);
    if (!el) return;
    el.classList.add('invalid');
    setTimeout(() => el.classList.remove('invalid'), 400);
}

// =====================================================
// MATCH DETECTION
// =====================================================
function findMatches() {
    const matched = new Set();
    const results = [];

    function addRun(coords) {
        coords.forEach(({ row, col, color }) => {
            const key = `${row},${col}`;
            if (!matched.has(key)) {
                matched.add(key);
                results.push({ row, col, color });
            }
        });
    }

    // Horizontal
    for (let r = 0; r < STATE.GRID_SIZE; r++) {
        let runStart = 0, runColor = STATE.grid[r][0]?.color || null, runLen = 1;
        for (let c = 1; c <= STATE.GRID_SIZE; c++) {
            const tile = c < STATE.GRID_SIZE ? STATE.grid[r][c] : null;
            const color = tile?.color || null;
            if (color === runColor && runColor !== null) {
                runLen++;
            } else {
                if (runLen >= 3 && runColor !== null) {
                    const run = [];
                    for (let i = 0; i < runLen; i++) run.push({ row: r, col: runStart + i, color: runColor });
                    addRun(run);
                }
                runStart = c; runColor = color; runLen = 1;
            }
        }
    }

    // Vertical
    for (let c = 0; c < STATE.GRID_SIZE; c++) {
        let runStart = 0, runColor = STATE.grid[0][c]?.color || null, runLen = 1;
        for (let r = 1; r <= STATE.GRID_SIZE; r++) {
            const tile = r < STATE.GRID_SIZE ? STATE.grid[r][c] : null;
            const color = tile?.color || null;
            if (color === runColor && runColor !== null) {
                runLen++;
            } else {
                if (runLen >= 3 && runColor !== null) {
                    const run = [];
                    for (let i = 0; i < runLen; i++) run.push({ row: runStart + i, col: c, color: runColor });
                    addRun(run);
                }
                runStart = r; runColor = color; runLen = 1;
            }
        }
    }

    return results;
}

// =====================================================
// SCORE CALCULATION
// =====================================================
function calculateMatchScore(matchedTiles) {
    const visited = new Set();
    let total = 0;

    matchedTiles.forEach(tile => {
        const key = `${tile.row},${tile.col}`;
        if (visited.has(key)) return;

        // BFS to find connected same-color group
        const group = [];
        const queue = [tile];
        visited.add(key);

        while (queue.length > 0) {
            const cur = queue.shift();
            group.push(cur);
            const neighbors = [
                { row: cur.row - 1, col: cur.col },
                { row: cur.row + 1, col: cur.col },
                { row: cur.row, col: cur.col - 1 },
                { row: cur.row, col: cur.col + 1 },
            ];
            neighbors.forEach(n => {
                const nKey = `${n.row},${n.col}`;
                if (!visited.has(nKey)) {
                    const found = matchedTiles.find(t => t.row === n.row && t.col === n.col && t.color === cur.color);
                    if (found) { visited.add(nKey); queue.push(found); }
                }
            });
        }

        const len = group.length;
        if (len === 3) total += 50;
        else if (len === 4) total += 100;
        else total += 200 + Math.max(0, len - 5) * 40;
    });

    return Math.max(total, 50);
}

// =====================================================
// CASCADE PROCESSOR
// =====================================================
async function processMatches(matchedTiles, depth = 0) {
    if (depth > 20) return;

    // Step 1: Flash
    matchedTiles.forEach(({ row, col }) => {
        const el = getTileEl(row, col);
        if (el) el.classList.add('matched');
    });
    await sleep(350);

    // Step 2: Score
    const base = calculateMatchScore(matchedTiles);
    const final = window.applyMatchScore ? window.applyMatchScore(base, matchedTiles) : base;
    STATE.hackProgress = Math.min(STATE.hackTarget, STATE.hackProgress + final);
    updateHackBar();

    // Step 3: Remove from data
    matchedTiles.forEach(({ row, col }) => { STATE.grid[row][col] = null; });

    // Step 4: Gravity
    applyGravity();

    // Track null positions before refill (for falling animation)
    const newSlots = [];
    for (let r = 0; r < STATE.GRID_SIZE; r++)
        for (let c = 0; c < STATE.GRID_SIZE; c++)
            if (STATE.grid[r][c] === null) newSlots.push({ r, c });

    // Step 5: Refill
    refillGrid();

    // Step 6: Sync DOM
    syncGridDOM();

    // Animate new tiles
    newSlots.forEach(({ r, c }) => {
        const el = getTileEl(r, c);
        if (el) {
            el.classList.add('falling');
            setTimeout(() => el.classList.remove('falling'), 350);
        }
    });

    await sleep(350);

    // Step 7: Cascade check
    const newMatches = findMatches();
    if (newMatches.length > 0) await processMatches(newMatches, depth + 1);
}

// =====================================================
// GRAVITY & REFILL
// =====================================================
function applyGravity() {
    for (let c = 0; c < STATE.GRID_SIZE; c++) {
        const column = [];
        for (let r = 0; r < STATE.GRID_SIZE; r++) {
            if (STATE.grid[r][c] !== null) column.push(STATE.grid[r][c]);
        }
        for (let r = STATE.GRID_SIZE - 1; r >= 0; r--) {
            STATE.grid[r][c] = column.length > 0 ? column.pop() : null;
        }
    }
}

function refillGrid() {
    for (let r = 0; r < STATE.GRID_SIZE; r++)
        for (let c = 0; c < STATE.GRID_SIZE; c++)
            if (STATE.grid[r][c] === null)
                STATE.grid[r][c] = { color: randomColor(), special: false };
}

// =====================================================
// HUD
// =====================================================
function updateHackBar() {
    const S = STATE;
    const pct = Math.min(100, (S.hackProgress / S.hackTarget) * 100);

    const fill = document.getElementById('hack-bar-fill');
    if (fill) {
        fill.style.width = pct + '%';
        fill.classList.toggle('bar-hot', pct >= 80);
    }

    const label = document.getElementById('hack-bar-label');
    if (label) label.textContent = `HACK PROGRESS: ${Math.floor(pct)}%`;

    const movesEl = document.getElementById('hack-bar-moves');
    if (movesEl) {
        movesEl.textContent = `MOVES: ${S.moves}`;
        movesEl.classList.toggle('danger', S.moves <= 5);
    }

    const eurosEl = document.getElementById('hud-euros');
    if (eurosEl) eurosEl.textContent = S.eurodollars;
}
window.updateHackBar = updateHackBar;

// =====================================================
// WIN / LOSE
// =====================================================
async function checkContractState() {
    const S = STATE;

    if (S.hackProgress >= S.hackTarget) {
        const flash = document.createElement('div');
        flash.className = 'access-granted-flash';
        flash.textContent = 'ACCESS GRANTED';
        document.body.appendChild(flash);
        await sleep(800);
        if (flash.parentNode) flash.remove();

        const bonus = S.moves * 15;
        const earned = S.contractReward + bonus;

        window.showScreen('shop');
        if (window.initShopScreen) window.initShopScreen(earned);
        return;
    }

    if (S.moves <= 0) {
        const gameGrid = document.getElementById('game-grid');
        if (gameGrid) {
            gameGrid.classList.add('grid-glitch');
            setTimeout(() => gameGrid.classList.remove('grid-glitch'), 800);
        }
        await sleep(800);
        if (window.showGameOver) window.showGameOver('OUT OF MOVES');
    }
}

// =====================================================
// START (called from main.js initGameScreen)
// =====================================================
function startGame() {
    isProcessing = false;
    listenersAttached = false;
    STATE.selectedTile = null;

    const grid = document.getElementById('game-grid');
    if (grid) grid.innerHTML = '';

    initGrid();
    renderGrid();
    updateHackBar();
}
window.startGame = startGame;

// Upgrade hook — overridden by upgrades.js later
window.applyMatchScore = function(baseScore) { return baseScore; };
