// js/entities/Player.js
class Player {
    constructor(startX, startY) {
        // Tile position (logical position in the grid)
        this.tileX = startX;
        this.tileY = startY;
        
        // Animation position (visual position for smooth movement)
        this.animX = startX;
        this.animY = startY;
        
        // Target destination
        this.targetX = startX;
        this.targetY = startY;
        
        // Pathfinding
        this.path = [];
        
        // Animation state
        this.animationProgress = 0;
        this.lastPosition = { x: startX, y: startY };
        this.animationPath = []; // Tiles to animate through this tick
        
        // Visual properties
        this.color = Constants.COLORS.PLAYER;
        this.outlineColor = Constants.COLORS.PLAYER_OUTLINE;
        this.radius = Constants.TILE_SIZE / 3;
    }

    preprocessPathToWaypoints(tiles) {
    if (tiles.length <= 1) return tiles;
    
    const waypoints = [];
    let lastDirection = null;
    
    for (let i = 0; i < tiles.length; i++) {
        let currentDirection;
        
        if (i === 0) {
            // First tile - calculate direction from current position
            const dx = tiles[i].x - this.tileX;
            const dy = tiles[i].y - this.tileY;
            currentDirection = `${Math.sign(dx)},${Math.sign(dy)}`;
        } else {
            // Calculate direction from previous tile
            const dx = tiles[i].x - tiles[i-1].x;
            const dy = tiles[i].y - tiles[i-1].y;
            currentDirection = `${Math.sign(dx)},${Math.sign(dy)}`;
        }
        
        // Add waypoint if direction changed or it's the last tile
        if (currentDirection !== lastDirection || i === tiles.length - 1) {
            waypoints.push(tiles[i]);
        }
        
        lastDirection = currentDirection;
    }
    
    return waypoints;
}
    
    // Set a new path for the player to follow
    setPath(path) {
        this.path = path;
        if (path.length > 0) {
            const lastTile = path[path.length - 1];
            this.targetX = lastTile.x;
            this.targetY = lastTile.y;
        }
    }
    
    // Clear current path and animation
    clearPath() {
        this.path = [];
        this.animationPath = [];
        this.targetX = this.tileX;
        this.targetY = this.tileY;
    }
    
    // Process movement for this game tick
    processTick() {
    if (this.path.length === 0) {
        return false; // No movement
    }
    
    // Store last position for animation
    this.lastPosition = { x: this.tileX, y: this.tileY };
    
    // Determine how many tiles to move (1 or 2)
    const tilesToMove = Math.min(Constants.MAX_TILES_PER_MOVE, this.path.length);
    
    // Collect the tiles we'll move through
    const tilePath = [];
    let finalX = this.tileX;
    let finalY = this.tileY;
    
    for (let i = 0; i < tilesToMove; i++) {
        const nextTile = this.path.shift();
        tilePath.push({ x: nextTile.x, y: nextTile.y });
        finalX = nextTile.x;
        finalY = nextTile.y;
    }
    
    // Convert to waypoints (corners only) for animation
    this.animationPath = this.preprocessPathToWaypoints(tilePath);
    
    // Jump directly to the final tile position
    this.tileX = finalX;
    this.tileY = finalY;
    
    // Reset animation progress
    this.animationProgress = 0;
    
    // Update target if path is complete
    if (this.path.length === 0) {
        this.targetX = this.tileX;
        this.targetY = this.tileY;
    }
    
    return true; // Movement occurred
}
    
    // Update animation state
    updateAnimation(deltaTime) {
    if (this.animationPath.length === 0) {
        this.animX = this.tileX;
        this.animY = this.tileY;
        return;
    }
    
    // Speed up animation for diagonal/longer moves
    const targetWaypoint = this.animationPath[this.animationPath.length - 1];
    const dx = targetWaypoint.x - this.lastPosition.x;
    const dy = targetWaypoint.y - this.lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust speed based on distance (similar to SDK's path.length checks)
    let speedMultiplier = 1;
    if (distance >= 2) {
        speedMultiplier = 1.5; // 50% faster for diagonal/long moves
    }
    
    // Calculate animation progress with speed multiplier
    this.animationProgress = Math.min(1, 
        this.animationProgress + (deltaTime / Constants.TICK_RATE) * speedMultiplier
    );
    
    // Smooth interpolation from last position to target
    this.animX = this.lastPosition.x + 
        (targetWaypoint.x - this.lastPosition.x) * this.animationProgress;
    this.animY = this.lastPosition.y + 
        (targetWaypoint.y - this.lastPosition.y) * this.animationProgress;
    
    // Clear animation path when complete
    if (this.animationProgress >= 1) {
        this.animationPath = [];
        this.animX = this.tileX;
        this.animY = this.tileY;
    }
}
    
    // Get world position in pixels
    getWorldPosition() {
        return {
            x: this.animX * Constants.TILE_SIZE + Constants.TILE_SIZE / 2,
            y: this.animY * Constants.TILE_SIZE + Constants.TILE_SIZE / 2
        };
    }
    
    // Check if player is currently moving
    isMoving() {
        return this.path.length > 0 || this.animationPath.length > 0;
    }
    
    // Check if player has reached destination
    hasReachedDestination() {
        return this.tileX === this.targetX && this.tileY === this.targetY && !this.isMoving();
    }
}
