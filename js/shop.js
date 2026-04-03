// =====================================================
// NETRUNNER MATCH — shop.js
// Shop logic and upgrade purchasing
// =====================================================

function getShopOffers() {
    const owned = STATE.activeUpgrades.map(u => u.id);
    
    // Filter: exclude already owned non-repeatable upgrades
    const available = UPGRADES_POOL.filter(u => {
        if (!u.repeatable && owned.includes(u.id)) return false;
        return true;
    });
    
    if (available.length === 0) return [];
    
    // Weighted random by rarity: common=60, rare=30, legendary=10
    const weights = { common: 60, rare: 30, legendary: 10 };
    
    // Weighted shuffle
    function weightedPick(pool) {
        const totalWeight = pool.reduce((sum, u) => sum + weights[u.rarity], 0);
        let rand = Math.random() * totalWeight;
        for (const u of pool) {
            rand -= weights[u.rarity];
            if (rand <= 0) return u;
        }
        return pool[pool.length - 1];
    }
    
    const slotCount = STATE.upgradeFlags?.shopSlots || 3;
    const offers = [];
    // Deep copy to prevent mutating the pool with splicing, maybe shallow copy is enough
    const remaining = [...available];
    
    for (let i = 0; i < slotCount && remaining.length > 0; i++) {
        const pick = weightedPick(remaining);
        offers.push(pick);
        // Remove picked offer to prevent duplicates in current shop
        remaining.splice(remaining.indexOf(pick), 1);
    }
    
    return offers;
}

window.getShopOffers = getShopOffers;

function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES_POOL.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    
    const cost = getUpgradeCost(upgradeId);
    
    if (STATE.eurodollars < cost) return false;
    
    STATE.eurodollars -= cost;
    STATE.activeUpgrades.push(upgrade);
    
    // Apply immediate effect
    if (typeof upgrade.applyOnBuy === 'function') {
        upgrade.applyOnBuy(STATE);
    }
    
    return true;
}

window.buyUpgrade = buyUpgrade;

function getUpgradeCost(upgradeId) {
    const upgrade = UPGRADES_POOL.find(u => u.id === upgradeId);
    if (!upgrade) return 0;
    
    let cost = upgrade.cost;
    // Apply market crash discount
    if (STATE.upgradeFlags?.marketCrash) {
        cost = Math.floor(cost * 0.6);
    }
    return cost;
}

window.getUpgradeCost = getUpgradeCost;
