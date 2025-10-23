// js/main.js
// Application entry point

// Global game instance
let game = null;

// Wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Tile-Based RPG...');
    
    try {
        // Create game instance
        game = new Game();
        
        // Initialize game (loads world from JSON)
        await game.initialize();
        
        // Start the game loop
        await game.start();
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.destroy();
    }
});

// Prevent default drag behavior on canvas
document.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'CANVAS') {
        event.preventDefault();
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
});

// Export game instance for debugging
window.gameInstance = () => game;
