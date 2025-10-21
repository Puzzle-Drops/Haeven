// js/utils/Constants.js
const Constants = {
    // Display settings
    RESOLUTION: {
        WIDTH: 2560,
        HEIGHT: 1440
    },
    
    // Tile and world settings
    TILE_SIZE: 128,
    WORLD_WIDTH: 40,
    WORLD_HEIGHT: 40,
    
    // Perspective settings (45-degree pitch with depth scaling)
    PERSPECTIVE: {
        Y_SCALE: 0.780, // Foreshortening factor for Y-axis
        STRENGTH: 1.00, // How much objects scale with depth (0 = flat, 1 = strong)
        PLAYER_HEIGHT: 100, // how tall the vertical player sprite appears
        PLAYER_Y_OFFSET: 10 // offset to position player correctly on tile (default 20)
    },
    
    // Timing settings
    TICK_RATE: 600, // ms per game tick
    TARGET_FPS: 144,
    FRAME_TIME: 1000 / 144,
    
    // Movement settings
    MAX_TILES_PER_MOVE: 2,
    WALK_TILES_PER_MOVE: 1,
    RUN_TILES_PER_MOVE: 2,
    PATHFINDING_LINE_CHECK: 5,
    
    // Visual settings
    COLORS: {
        GROUND_BASE: '#4a4a4a',
        WALL: '#1a1a1a',
        PLAYER: '#4169E1',
        PLAYER_OUTLINE: '#1E90FF',
        TILE_BORDER: '#2a2a2a',
        HOVER: 'rgba(255, 255, 255, 0.2)',
        CURRENT_TILE: '#FFD700',
        DESTINATION_TILE: '#FF0000'
    },
    
    // Player settings
    PLAYER_START: {
        X: 20,
        Y: 20
    }
};
