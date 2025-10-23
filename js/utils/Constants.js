// js/utils/Constants.js
const Constants = {
    // Display settings
    RESOLUTION: {
        WIDTH: 2560,
        HEIGHT: 1440
    },
    
    // Tile and world settings
    TILE_SIZE: 164,
    WORLD_WIDTH: 500,
    WORLD_HEIGHT: 500,
    TILE_OVERLAP: 2, // Overlap to prevent gaps between tiles
    
    // Perspective settings (45-degree pitch with depth scaling)
    PERSPECTIVE: {
        Y_SCALE: 0.80,
        STRENGTH: 1.00,
        PLAYER_HEIGHT: 100,
        PLAYER_Y_OFFSET: 10
    },
    
    // Minimap settings
    MINIMAP: {
        WIDTH: 512,
        HEIGHT: 288,
        ZOOM_MULTIPLIER: 0.125,      // Makes minimap 8x more zoomed out
        DEFAULT_ZOOM: 0.8,            // User-facing default zoom
        PLAYER_WIDTH: 2,              // Player dot width radius at default zoom
        PLAYER_HEIGHT: 4,             // Player dot height radius at default zoom
        HIGHLIGHT_WIDTH: 2,           // Tile highlight border thickness
        PLAYER_COLOR: '#FFD700',
        PATH_COLOR: 'rgba(255, 255, 255, 0.8)',
        FRAME_COLOR: '#FFD700',
        FRAME_WIDTH: 2
    },
    
    // Timing settings
    TICK_RATE: 600,
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
        X: 250,
        Y: 450
    }
};
