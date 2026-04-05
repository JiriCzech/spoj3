// =====================================================
// NETRUNNER MATCH — engine.js
// Core match-3 engine: grid, swap, match, cascade
// =====================================================

let isProcessing = false;
let listenersAttached = false;
let specialTileId = 0; // auto-increment for special tile activation

// Special tile types
const SPECIAL_BOMB = 'bomb'; // from match-4, clears 3x3 area
const SPECIAL_COLOR_CLEAR = 'color_clear'; // from match-5+, clears all of one color

// Particle pool for match explosions
const COLOR_PARTICLES = {
    cyan: '#00fff9', purple: '#bf5af2', green: '#39ff14',
    red: '#ff2d55', yellow: '#ffd60a', orange: '#ff6b00'
};

// =====================================================
// HELPERS
// =====================================================
function randomColor() {
    return STATE.COLORS[Math.floor(Math.random() * STATE.COLORS.length)];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Spawn burst particles at a tile position
function spawnParticles(row, col, color, count) {
    const el = getTileEl(row, col);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colorHex = COLOR_PARTICLES[color] || '#00fff9';
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.5;
        const dist = 20 + Math.random() * 30;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const size = 3 + Math.random() * 4;

        p.style.cssText = `
            position:fixed; left:${cx}px; top:${cy}px;
            width:${size}px; height:${size}px;
            border-radius:50%;
            background:${colorHex};
            box-shadow:0 0 ${size + 2}px ${colorHex};
            pointer-events:none; z-index:500;
            --tx:${dx}px; --ty:${dy}px;
            animation: particle-fly 0.5s ease-out forwards;
        `;
        frag.appendChild(p);
    }

    document.body.appendChild(frag);
    setTimeout(() => {
        frag.querySelectorAll('div').forEach(el => el.remove());
    }, 550);
}
window.spawnParticles = spawnParticles;

function getTileEl(row, col) {
    return document.querySelector(`#game-grid .tile[data-row="${row}"][data-col="${col}"]`);
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

    // Special tile visual indicators
    if (tileData.special) {
        if (tileData.special === SPECIAL_BOMB) {
            el.classList.add('tile-special', 'tile-bomb');
            icon.textContent = '💥';
            el.title = 'BOMB — Tap to clear 3×3 area';
        } else if (tileData.special === SPECIAL_COLOR_CLEAR) {
            el.classList.add('tile-special', 'tile-color-clear');
            icon.textContent = '🌀';
            el.title = 'COLOR CLEAR — Tap to clear all ' + tileData.color + ' tiles';
        }
    }

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
    const tile = getTileEl(row, col);
    const data = STATE.grid[row][col];
    if (!tile || !data) return;
    // Remove old color classes
    STATE.COLORS.forEach(c => tile.classList.remove('tile-' + c));
    // Remove special classes
    tile.classList.remove('tile-special', 'tile-bomb', 'tile-color-clear');
    // Add new color class
    tile.classList.add('tile-' + data.color);
    // Update icon
    const icon = tile.querySelector('.tile-icon');
    if (icon) {
        if (data.special === SPECIAL_BOMB) {
            tile.classList.add('tile-special', 'tile-bomb');
            icon.textContent = '💥';
        } else if (data.special === SPECIAL_COLOR_CLEAR) {
            tile.classList.add('tile-special', 'tile-color-clear');
            icon.textContent = '🌀';
        } else {
            icon.textContent = STATE.TILE_ICONS[data.color];
        }
    }
    // Update data attributes
    tile.dataset.row = row;
    tile.dataset.col = col;
}

function attachTileListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    const grid = document.getElementById('game-grid');
    if (!grid) return;

    let lastTouchTime = 0;

    grid.addEventListener('touchstart', e => {
        lastTouchTime = Date.now();
    }, { passive: true });

    grid.addEventListener('touchend', e => {
        const tile = e.target.closest('.tile');
        if (!tile) return;

        // Prevent synthetic clicks but trigger tap immediately
        e.preventDefault();
        handleTap(parseInt(tile.dataset.row), parseInt(tile.dataset.col));
    }, { passive: false });

    grid.addEventListener('click', e => {
        // Only trigger if it wasn't already handled by touchend
        if (Date.now() - lastTouchTime < 500) return;

        const tile = e.target.closest('.tile');
        if (!tile) return;
        handleTap(parseInt(tile.dataset.row), parseInt(tile.dataset.col));
    });
}

function handleTap(row, col) {
    // Input validation
    if (row < 0 || row >= STATE.GRID_SIZE || col < 0 || col >= STATE.GRID_SIZE) return;
    if (isProcessing) return;

    const tile = STATE.grid[row]?.[col];
    if (!tile) return;

    // Special tile activation: bomb clears 3x3, color-clear clears all same color
    if (tile.special) {
        activateSpecialTile(row, col);
        return;
    }

    const sel = STATE.selectedTile;

    if (!sel) {
        STATE.selectedTile = { row, col };
        const el = getTileEl(row, col);
        if (el) {
            el.classList.add('selected');
            el.classList.add('tap-feedback');
            setTimeout(() => el.classList.remove('tap-feedback'), 260);
            if (window.Audio) window.Audio.select();
            const rip = document.createElement('div');
            rip.className = 'tile-ripple';
            el.appendChild(rip);
            setTimeout(() => { if (rip.parentNode) rip.remove(); }, 500);
        }
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
        if (el) {
            el.classList.add('selected');
            if (window.Audio) window.Audio.select();
            const rip = document.createElement('div');
            rip.className = 'tile-ripple';
            el.appendChild(rip);
            setTimeout(() => { if (rip.parentNode) rip.remove(); }, 500);
        }
    }
}

function removeAllSelected() {
    document.querySelectorAll('.tile.selected').forEach(el => el.classList.remove('selected'));
}

// =====================================================
// SPECIAL TILE ACTIVATION
// =====================================================
function activateSpecialTile(row, col) {
    const tile = STATE.grid[row]?.[col];
    if (!tile || !tile.special) return;

    isProcessing = true;
    STATE.moves = Math.max(0, STATE.moves - 1);
    updateHackBar();

    const targetType = tile.special;
    const targetColor = tile.color;

    // Remove the special tile itself
    STATE.grid[row][col] = null;

    const clearedTiles = [];

    if (targetType === SPECIAL_BOMB) {
        // Clear 3x3 area centered on the bomb
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < STATE.GRID_SIZE && nc >= 0 && nc < STATE.GRID_SIZE) {
                    if (STATE.grid[nr][nc] !== null) {
                        clearedTiles.push({ row: nr, col: nc, color: STATE.grid[nr][nc].color });
                        STATE.grid[nr][nc] = null;
                    }
                }
            }
        }
    } else if (targetType === SPECIAL_COLOR_CLEAR) {
        // Clear all tiles of the same color
        for (let r = 0; r < STATE.GRID_SIZE; r++) {
            for (let c = 0; c < STATE.GRID_SIZE; c++) {
                if (STATE.grid[r][c] !== null && STATE.grid[r][c].color === targetColor) {
                    clearedTiles.push({ row: r, col: c, color: targetColor });
                    STATE.grid[r][c] = null;
                }
            }
        }
    }

    // Animate cleared tiles BEFORE syncing DOM (elements still exist)
    clearedTiles.forEach(({ row: r, col: c }) => {
        const tileEl = getTileEl(r, c);
        if (tileEl) {
            tileEl.classList.add('tile-explode');
        }
    });

    // Also explode the special tile itself
    const selfEl = getTileEl(row, col);
    if (selfEl) selfEl.classList.add('tile-explode');

    // Apply gravity and refill FIRST, then sync DOM (no nulls)
    applyGravity();
    refillGrid();
    syncGridDOM();

    // Score for cleared tiles
    const scorePerTile = 30;
    const totalScore = clearedTiles.length * scorePerTile;
    STATE.hackProgress = Math.min(STATE.hackTarget, STATE.hackProgress + totalScore);

    showMatchScore(totalScore, clearedTiles.length > 0 ? clearedTiles : [{ row, col, color: targetColor }]);

    if (window.Audio) {
        if (clearedTiles.length >= 8) window.Audio.bigMatch();
        else window.Audio.match();
    }

    updateHackBar();

    // Spawn particles for cleared tiles
    clearedTiles.forEach(({ row: r, col: c, color }) => {
        spawnParticles(r, c, color, 4);
    });

    // Wait for explosion animation, then check cascades
    setTimeout(async () => {
        await sleep(200);

        // Check for cascading matches after special tile clears
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            STATE.currentCascadeDepth = (STATE.currentCascadeDepth || 0) + 1;
            await processMatches(newMatches, 1);
        }

        isProcessing = false;
        await checkContractState();
    }, 400);
}
window.activateSpecialTile = activateSpecialTile;

// =====================================================
// SWAP
// =====================================================
async function trySwap(r1, c1, r2, c2) {
    try {
        if (isProcessing) return;

        // Check adjacency
        const dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
        if (dr + dc !== 1) return;

        isProcessing = true;

        // Firewall boss: double move cost
        const moveCost = STATE.bossType?.id === 'firewall' ? 2 : 1;
        STATE.moves -= moveCost;
        updateHackBar();

        const tile1 = getTileEl(r1, c1);
        const tile2 = getTileEl(r2, c2);

        if (!tile1 || !tile2) { isProcessing = false; return; }

        // Calculate pixel offset between tiles
        const rect1 = tile1.getBoundingClientRect();
        const rect2 = tile2.getBoundingClientRect();
        const dx = rect2.left - rect1.left;
        const dy = rect2.top - rect1.top;

        // Apply CSS transition + translate to VISUALLY move tiles
        tile1.style.transition = 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1)';
        tile2.style.transition = 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1)';
        tile1.style.transform = `translate(${dx}px, ${dy}px)`;
        tile2.style.transform = `translate(${-dx}px, ${-dy}px)`;

        // Wait for visual animation
        await sleep(230);

        // Reset transforms
        tile1.style.transition = '';
        tile2.style.transition = '';
        tile1.style.transform = '';
        tile2.style.transform = '';

        // NOW swap data
        const temp = STATE.grid[r1][c1];
        STATE.grid[r1][c1] = STATE.grid[r2][c2];
        STATE.grid[r2][c2] = temp;

        // Sync DOM to new data (updates color/icon without moving position)
        updateTileDOM(r1, c1);
        updateTileDOM(r2, c2);

        // Check matches
        const matches = findMatches();

        if (matches.length === 0) {
            // REVERT: visual slide back (refund the move cost)
            STATE.moves += moveCost;
            updateHackBar();

            // Swap data back first
            const temp2 = STATE.grid[r1][c1];
            STATE.grid[r1][c1] = STATE.grid[r2][c2];
            STATE.grid[r2][c2] = temp2;

            await sleep(60);

            // Slide back animation
            tile1.style.transition = 'transform 0.18s ease-in';
            tile2.style.transition = 'transform 0.18s ease-in';
            tile1.style.transform = `translate(${dx}px, ${dy}px)`;
            tile2.style.transform = `translate(${-dx}px, ${-dy}px)`;

            await sleep(60);

            tile1.style.transition = 'transform 0.18s ease-out';
            tile2.style.transition = 'transform 0.18s ease-out';
            tile1.style.transform = '';
            tile2.style.transform = '';

            await sleep(180);

            // Sync DOM back
            updateTileDOM(r1, c1);
            updateTileDOM(r2, c2);

            // Shake feedback
            tile1.classList.add('invalid');
            tile2.classList.add('invalid');
            setTimeout(() => {
                tile1.classList.remove('invalid');
                tile2.classList.remove('invalid');
            }, 400);

            if (window.Audio) window.Audio.invalid();
            isProcessing = false;
            return;
        }

        // Valid match — process cascade
        if (window.hasUpgrade && window.hasUpgrade('perfect_swap') && matches.length >= 5) {
            STATE.moves += moveCost; // Refund the full move cost
            updateHackBar();
        }
        await processMatches(matches);
        removeAllSelected();
        await checkContractState();
        isProcessing = false;
    } catch (e) {
        console.error('[ENGINE] trySwap failed:', e);
        isProcessing = false;
        throw e;
    }
}



function playInvalid(row, col) {
    const el = getTileEl(row, col);
    if (!el) return;
    el.classList.add('invalid');
    if (window.Audio) window.Audio.invalid();
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
    try {
        if (depth > 20) return;

        // Step 1: Flash
        matchedTiles.forEach(({ row, col, color }) => {
            const el = getTileEl(row, col);
            if (el) el.classList.add('matched', 'tile-explode');
            // Spawn particles for each matched tile
            spawnParticles(row, col, color, matchedTiles.length >= 5 ? 8 : 5);
        });
        await sleep(350);

        // Step 2: Score
        const base = calculateMatchScore(matchedTiles);
        const final = window.applyMatchScore ? window.applyMatchScore(base, matchedTiles) : base;
        STATE.hackProgress = Math.min(STATE.hackTarget, STATE.hackProgress + final);

        // Screen flash for big matches
        if (matchedTiles.length >= 5) {
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;inset:0;z-index:400;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%);animation:fadeInOut 0.4s ease forwards;';
            document.body.appendChild(flash);
            setTimeout(() => { if (flash.parentNode) flash.remove(); }, 450);
        }

        if (window.Audio) {
            if (matchedTiles.length >= 5) window.Audio.bigMatch();
            else window.Audio.match();
        }

        showMatchScore(final, matchedTiles);

        // Jackpot / Critical hit visual feedback
        if (STATE._lastJackpot) {
            const jackpotEl = document.createElement('div');
            jackpotEl.textContent = '⚡ JACKPOT! ⚡';
            jackpotEl.style.cssText = `
                position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);
                font-size:28px;font-weight:700;font-family:var(--font);
                color:var(--neon-yellow);letter-spacing:4px;z-index:500;
                text-shadow:0 0 20px var(--neon-yellow),0 0 40px rgba(255,214,10,0.5);
                pointer-events:none;white-space:nowrap;
                animation: jackpot-pop 0.8s ease forwards;
            `;
            document.body.appendChild(jackpotEl);
            setTimeout(() => { if (jackpotEl.parentNode) jackpotEl.remove(); }, 850);

            // Extra screen shake for jackpot
            const grid = document.getElementById('game-grid');
            if (grid) {
                grid.style.animation = 'shake 0.15s steps(1) 4';
                setTimeout(() => { if (grid) grid.style.animation = ''; }, 600);
            }
        }

        if (STATE.comboCount >= 1 && window.hasUpgrade('combo_multiplier')) {
            showComboIndicator(STATE.comboCount + 1);
            if (window.Audio) window.Audio.combo();
        }

        updateHackBar();

        // Step 3: Detect and create special tiles before removing
        // Find connected components within the matched tiles to determine match sizes
        const visitedForSpecial = new Set();
        const specialPlacements = []; // {row, col, color, special}

        matchedTiles.forEach(tile => {
            const key = `${tile.row},${tile.col}`;
            if (visitedForSpecial.has(key)) return;

            // BFS to find connected same-color group
            const group = [];
            const queue = [tile];
            visitedForSpecial.add(key);

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
                    if (!visitedForSpecial.has(nKey)) {
                        const found = matchedTiles.find(t => t.row === n.row && t.col === n.col && t.color === cur.color);
                        if (found) { visitedForSpecial.add(nKey); queue.push(found); }
                    }
                });
            }

            // Match-4 creates a bomb, match-5+ creates a color-clear tile
            if (group.length >= 4) {
                const centerIdx = Math.floor(group.length / 2);
                const centerTile = group[centerIdx];
                const specialType = group.length >= 5 ? SPECIAL_COLOR_CLEAR : SPECIAL_BOMB;
                specialPlacements.push({ row: centerTile.row, col: centerTile.col, color: centerTile.color, special: specialType });
            }
        });

        // Now remove matched tiles (but keep special tile positions)
        matchedTiles.forEach(({ row, col }) => {
            // Don't remove if a special tile will be placed here
            const isSpecialSpot = specialPlacements.some(s => s.row === row && s.col === col);
            if (!isSpecialSpot) {
                STATE.grid[row][col] = null;
            }
        });

        // Place special tiles
        specialPlacements.forEach(({ row, col, color, special }) => {
            STATE.grid[row][col] = { color, special };
        });

        if (specialPlacements.length > 0) {
            showFloatingText(`+${specialPlacements.length} SPECIAL TILE${specialPlacements.length > 1 ? 'S' : ''}!`, 'var(--neon-yellow)');
        }

        // Track data before gravity for falling animation
        const oldGrid = STATE.grid.map(row => [...row]);

        // Step 4: Gravity
        applyGravity();

        // Determine which tiles fell by comparing object references
        const fellSlots = [];
        for (let r = 0; r < STATE.GRID_SIZE; r++) {
            for (let c = 0; c < STATE.GRID_SIZE; c++) {
                if (STATE.grid[r][c] !== null && oldGrid[r][c] !== STATE.grid[r][c]) {
                    fellSlots.push({ r, c });
                }
            }
        }

        // Track null positions before refill (for dropping new tiles)
        const newSlots = [];
        for (let r = 0; r < STATE.GRID_SIZE; r++)
            for (let c = 0; c < STATE.GRID_SIZE; c++)
                if (STATE.grid[r][c] === null) newSlots.push({ r, c });

        // Step 5: Refill
        refillGrid();

        // Step 6: Sync DOM
        syncGridDOM();

        // Animate new tiles and falling tiles
        newSlots.forEach(({ r, c }) => {
            const el = getTileEl(r, c);
            if (el) {
                el.classList.add('tile-drop');
                setTimeout(() => { if (el) el.classList.remove('tile-drop'); }, 350);
            }
        });

        fellSlots.forEach(({ r, c }) => {
            const el = getTileEl(r, c);
            if (el) {
                el.classList.add('tile-fall');
                setTimeout(() => { if (el) el.classList.remove('tile-fall'); }, 280);
            }
        });

        await sleep(350);

        // Step 7: Cascade check
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            STATE.currentCascadeDepth = (STATE.currentCascadeDepth || 0) + 1;
            if (window.Audio) window.Audio.cascade();

            const gridEl = document.getElementById('game-grid');
            if (gridEl) {
                const rect = gridEl.getBoundingClientRect();
                const textEl = document.createElement('div');
                textEl.textContent = `CASCADE ×${STATE.currentCascadeDepth}`;
                textEl.style.position = 'fixed';
                textEl.style.left = '50%';
                textEl.style.top = `${rect.top + rect.height * 0.3}px`;
                textEl.style.transform = 'translate(-50%, -50%)';
                textEl.style.fontSize = `${14 + STATE.currentCascadeDepth * 2}px`;
                textEl.style.color = 'var(--neon-orange)';
                textEl.style.letterSpacing = '3px';
                textEl.style.fontWeight = '700';
                textEl.style.fontFamily = 'var(--font)';
                textEl.style.textShadow = '0 0 12px var(--neon-orange), 0 0 24px rgba(255,107,0,0.4)';
                textEl.style.zIndex = '300';
                textEl.style.animation = 'cascade-pop 0.8s ease forwards';
                textEl.style.pointerEvents = 'none';
                textEl.style.whiteSpace = 'nowrap';
                document.body.appendChild(textEl);
                setTimeout(() => { if (textEl.parentNode) textEl.remove(); }, 850);
            }

            await processMatches(newMatches, depth + 1);
        }
    } catch (e) {
        console.error('[ENGINE] processMatches failed (depth=' + depth + '):', e);
        isProcessing = false;
        throw e;
    }
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

// Shuffle the entire board (for shuffle_board upgrade)
function shuffleBoard() {
    // Collect all tiles
    const tiles = [];
    for (let r = 0; r < STATE.GRID_SIZE; r++) {
        for (let c = 0; c < STATE.GRID_SIZE; c++) {
            if (STATE.grid[r][c] !== null) {
                tiles.push({ ...STATE.grid[r][c] });
            }
        }
    }
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    // Place back
    let idx = 0;
    for (let r = 0; r < STATE.GRID_SIZE; r++) {
        for (let c = 0; c < STATE.GRID_SIZE; c++) {
            if (STATE.grid[r][c] !== null && idx < tiles.length) {
                STATE.grid[r][c] = tiles[idx++];
            }
        }
    }
    syncGridDOM();

    // Check for matches after shuffle
    setTimeout(async () => {
        const matches = findMatches();
        if (matches.length > 0) {
            await processMatches(matches);
        }
    }, 300);
}
window.shuffleBoard = shuffleBoard;

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
        fill.classList.toggle('bar-complete', pct >= 100);

        if (pct - (STATE._lastHackPercent || 0) > 15) {
            if (fill.animate) {
                fill.animate([{ filter: 'brightness(2)' }, { filter: 'brightness(1)' }], { duration: 400 });
            }
        }
    }
    STATE._lastHackPercent = pct;

    const label = document.getElementById('hack-bar-label');
    if (label) label.textContent = `HACK PROGRESS: ${Math.floor(pct)}%`;

    const movesEl = document.getElementById('hack-bar-moves');
    if (movesEl) {
        movesEl.textContent = `MOVES: ${S.moves}`;
        movesEl.classList.toggle('moves-danger', S.moves <= 5);
        if (S.moves <= 3 && !movesEl.classList.contains('shake')) {
            movesEl.classList.add('shake');
            setTimeout(() => movesEl.classList.remove('shake'), 400);
        }
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

        const hackBarFill = document.getElementById('hack-bar-fill');
        if (hackBarFill) hackBarFill.style.width = '100%';

        await sleep(800);
        if (flash.parentNode) flash.remove();
        if (window.Audio) window.Audio.hackComplete();

        const moveBonus = S.upgradeFlags?.efficientRunner ? 14 : 8;
        const unusedMovesBonus = S.moves * moveBonus;

        clearInterval(STATE.timerInterval);
        STATE.timerInterval = null;

        for (let i = 0; i < (S.activeUpgrades || []).length; i++) {
            const upgrade = S.activeUpgrades[i];
            if (typeof upgrade.applyOnContractEnd === 'function') {
                upgrade.applyOnContractEnd(STATE);
            }
        }

        let earned = S.contractReward + unusedMovesBonus;
        if (S.upgradeFlags?.doubleEuros) earned *= 2;

        // Boss contract bonus
        if (S.isBoss) {
            const bossBonus = Math.floor(earned * 0.5);
            earned += bossBonus;
            showFloatingText('BOSS BONUS +€€' + bossBonus, 'var(--neon-red)');
        }

        S.eurodollars += earned;
        S.totalEurodollars += earned;

        // Track win streak
        S.winStreak = (S.winStreak || 0) + 1;
        S.contractsWon = (S.contractsWon || 0) + 1;
        if (S.winStreak > S.maxWinStreak) S.maxWinStreak = S.winStreak;

        // Streak bonus display
        if (S.winStreak >= 3) {
            showFloatingText(`🔥 ${S.winStreak} WIN STREAK!`, 'var(--neon-yellow)');
        }

        isProcessing = false;
        window.showScreen('shop');
        if (window.initShopScreen) window.initShopScreen(earned);
        return;
    }

    if (S.moves <= 0) {
        if (window.hasUpgrade && window.hasUpgrade('flatline_prevention') && !S.upgradeFlags?.flatlineUsed) {
            S.moves = 6;
            S.upgradeFlags = S.upgradeFlags || {};
            S.upgradeFlags.flatlineUsed = true;
            updateHackBar();
            showFloatingText('FLATLINE PROTOCOL ACTIVATED', 'var(--neon-red)');
            return;
        }

        // Reset win streak on loss
        S.winStreak = 0;

        const gameGrid = document.getElementById('game-grid');
        if (gameGrid) {
            gameGrid.classList.add('grid-glitch');
            setTimeout(() => gameGrid.classList.remove('grid-glitch'), 800);
        }
        await sleep(800);
        if (window.showGameOver) window.showGameOver('OUT OF MOVES');
    }

    // Time out also resets streak
    if (S.timeLeft <= 0 && S.hackProgress < S.hackTarget) {
        S.winStreak = 0;
    }
}

function showFloatingText(text, color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.color = color;
    el.style.fontSize = '16px';
    el.style.letterSpacing = '3px';
    el.style.fontFamily = 'var(--font)';
    el.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
    el.style.zIndex = '2000';
    el.style.animation = 'float-up 1.2s forwards';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1200);
}

function showMatchScore(score, tiles) {
    if (!tiles || tiles.length === 0) return;
    const centerTile = tiles[Math.floor(tiles.length / 2)];
    const el = getTileEl(centerTile.row, centerTile.col);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const floatEl = document.createElement('div');

    let text = `+${score}`;
    let color = 'var(--neon-cyan)';
    let size = '14px';

    if (score > 150) text = `⚡ +${score}`;
    if (score > 300) { color = 'var(--neon-yellow)'; size = '17px'; }
    if (score > 600) { color = 'var(--neon-green)'; size = '20px'; text = `🔥 +${score}`; }

    floatEl.textContent = text;
    floatEl.style.position = 'fixed';
    floatEl.style.left = `${rect.left + rect.width / 2}px`;
    floatEl.style.top = `${rect.top + rect.height / 2}px`;
    floatEl.style.transform = 'translate(-50%, -50%)';
    floatEl.style.color = color;
    floatEl.style.fontSize = size;
    floatEl.style.fontWeight = '700';
    floatEl.style.letterSpacing = '2px';
    floatEl.style.fontFamily = 'var(--font)';
    floatEl.style.textShadow = `0 0 10px ${color}`;
    floatEl.style.zIndex = '200';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.whiteSpace = 'nowrap';
    floatEl.style.animation = 'float-up 1s ease forwards';

    document.body.appendChild(floatEl);
    setTimeout(() => { if (floatEl.parentNode) floatEl.remove(); }, 1000);
}

function showComboIndicator(count) {
    const el = document.createElement('div');
    el.textContent = `COMBO ×${count}`;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '35%';
    el.style.transform = 'translate(-50%, -50%)';
    const size = Math.min(20 + count * 2, 30);
    el.style.color = count >= 3 ? 'var(--neon-yellow)' : 'var(--neon-purple)';
    el.style.fontSize = `${size}px`;
    el.style.fontWeight = '700';
    el.style.letterSpacing = '4px';
    el.style.fontFamily = 'var(--font)';
    el.style.textShadow = count >= 3
        ? '0 0 16px var(--neon-yellow), 0 0 32px rgba(255,214,10,0.4)'
        : '0 0 16px var(--neon-purple), 0 0 32px rgba(191,90,242,0.3)';
    el.style.zIndex = '300';
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'nowrap';
    el.style.animation = 'combo-pop 0.85s ease forwards';

    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 850);
}

// =====================================================
// TIMER
// =====================================================
function startContractTimer() {
    if (typeof STATE.timeLeft !== 'number' || isNaN(STATE.timeLeft)) {
        STATE.timeLeft = 60;
    }
    if (STATE.timerInterval) clearInterval(STATE.timerInterval);
    STATE._timerPausedByVisibility = false;

    STATE.timerInterval = setInterval(() => {
        // Pause during cascade processing
        if (isProcessing) return;
        // Pause when tab is hidden (page visibility API)
        if (document.hidden) {
            if (!STATE._timerPausedByVisibility) {
                STATE._timerPausedByVisibility = true;
            }
            return;
        }
        if (STATE._timerPausedByVisibility && !document.hidden) {
            STATE._timerPausedByVisibility = false;
        }
        // Don't tick if upgrade has frozen timer
        if (STATE.upgradeFlags?.timerFrozen) return;

        // Data Storm boss: 2× timer speed
        const ticks = STATE.bossType?.id === 'data_storm' ? 2 : 1;
        STATE.timeLeft -= ticks;
        updateTimerDisplay();
        if (STATE.timeLeft <= 0) {
            clearInterval(STATE.timerInterval);
            STATE.timerInterval = null;
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (typeof STATE.timeLeft !== 'number' || isNaN(STATE.timeLeft)) {
        STATE.timeLeft = 60;
    }
    const el = document.getElementById('hud-timer');
    if (!el) return;
    const mins = Math.floor(STATE.timeLeft / 60);
    const secs = STATE.timeLeft % 60;
    el.textContent = mins + ':' + String(secs).padStart(2, '0');
    el.classList.remove('danger', 'timer-warning');
    if (STATE.timeLeft <= 10) {
        el.classList.add('danger');
        if (STATE.timeLeft <= 10 && STATE.timeLeft % 2 === 0) {
            el.classList.add('timer-warning');
        }
    } else if (STATE.timeLeft <= 20) {
        el.classList.add('timer-warning');
    }
}

function handleTimeOut() {
    if (window.Audio) window.Audio.gameOver();
    // Brief screen flash
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,45,85,0.15);z-index:100;pointer-events:none;animation:fadeInOut 0.6s ease forwards';
    document.body.appendChild(flash);
    setTimeout(() => { if (flash.parentNode) flash.remove(); }, 600);
    setTimeout(() => { if (window.showGameOver) window.showGameOver('CONNECTION TIMED OUT'); }, 650);
}

window.startContractTimer = startContractTimer;
window.handleTimeOut = handleTimeOut;

// =====================================================
// FLOATING ELEMENT CLEANUP (prevents memory leaks)
// =====================================================
function cleanupFloatingElements() {
    // Remove all dynamically created floating elements
    // These are created by showMatchScore, showComboIndicator, showFloatingText, cascade text
    document.querySelectorAll('[style*="pointer-events: none"]').forEach(el => {
        // Only remove elements we created (float-up animation, cascade text, floating text)
        const anim = el.style.animation || '';
        if (anim.includes('float-up') || anim.includes('combo-pop')) {
            el.remove();
        }
    });
    // Also clean up cascade text elements
    document.querySelectorAll('.cascade-text').forEach(el => el.remove());
    // Clear any pending setTimeout callbacks by removing orphaned elements
    document.querySelectorAll('[style*="z-index: 200"], [style*="z-index: 300"]').forEach(el => {
        if (el.textContent && (el.textContent.includes('CASCADE') || el.textContent.includes('COMBO') || el.textContent.includes('+'))) {
            el.remove();
        }
    });
}
window.cleanupFloatingElements = cleanupFloatingElements;

// =====================================================
// START (called from main.js initGameScreen)
// =====================================================
function startGame() {
    try {
        isProcessing = false;
        listenersAttached = false;
        STATE.selectedTile = null;

        const grid = document.getElementById('game-grid');
        if (grid) grid.innerHTML = '';

        initGrid();
        renderGrid();
        updateHackBar();
    } catch (e) {
        console.error('[ENGINE] startGame failed:', e);
        throw e; // Let global error handler show recovery UI
    }
}
window.startGame = startGame;

// Upgrade hook — overridden by upgrades.js later
window.applyMatchScore = function (baseScore) { return baseScore; };
