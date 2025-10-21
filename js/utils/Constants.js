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
    
    // Perspective settings (true 3D perspective projection)
    PERSPECTIVE: {
        Y_SCALE: 0.707, // cos(45°) - foreshortening factor for Y-axis
        PERSPECTIVE_STRENGTH: 0.0008, // How strong the perspective effect is (vanishing point distance)
        CAMERA_DISTANCE: 800, // Virtual camera distance from Y=0 plane
        PLAYER_HEIGHT: 100, // how tall the vertical player sprite appears
        PLAYER_Y_OFFSET: 20 // offset to position player correctly on tile
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
