document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    if (window.loadBestRun) {
        window.loadBestRun();
    }

    // Initial Screen
    if (window.showScreen) {
        window.showScreen('boot');
    } else {
        // Fallback if showScreen not yet defined globally
        showScreen('boot');
    }

    console.log('NETRUNNER MATCH Initialized');
});

/**
 * Switch between game screens
 * @param {string} screenId - ID of the screen without 'screen-' prefix
 */
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
        target.classList.add('active');
    } else {
        console.warn(`Screen ${screenId} not found`);
    }
}

// Export to window for global access
window.showScreen = showScreen;
