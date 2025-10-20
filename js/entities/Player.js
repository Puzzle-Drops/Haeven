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
        
        // Store the animation path for this tick
        this.animationPath = [];
        
        // Move through the tiles
        for (let i = 0; i < tilesToMove; i++) {
            const nextTile = this.path.shift();
            this.animationPath.push({ x: nextTile.x, y: nextTile.y });
            this.tileX = nextTile.x;
            this.tileY = nextTile.y;
        }
        
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
        
        // Calculate animation progress
        this.animationProgress = Math.min(1, 
            this.animationProgress + deltaTime / Constants.TICK_RATE
        );
        
        // Determine which segment we're animating
        const segments = this.animationPath.length;
        const segmentDuration = 1 / segments;
        const targetSegment = Math.min(segments - 1, 
            Math.floor(this.animationProgress / segmentDuration)
        );
        const localProgress = (this.animationProgress - targetSegment * segmentDuration) / segmentDuration;
        
        // Get positions for interpolation
        let fromPos, toPos;
        if (targetSegment === 0) {
            fromPos = this.lastPosition;
            toPos = this.animationPath[0];
        } else {
            fromPos = this.animationPath[targetSegment - 1];
            toPos = this.animationPath[targetSegment];
        }
        
        // Interpolate position
        this.animX = fromPos.x + (toPos.x - fromPos.x) * localProgress;
        this.animY = fromPos.y + (toPos.y - fromPos.y) * localProgress;
        
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
