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
        
        // ===== NEW ANIMATION SYSTEM =====
        // Continuous animation waypoints (like SDK's path buffer)
        this.animationWaypoints = [];
        
        // Current animation segment
        this.currentAnimationStart = { x: startX, y: startY };
        this.currentAnimationTarget = null;
        this.segmentProgress = 0;
        
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
        this.animationWaypoints = []; // Clear animation buffer
        this.currentAnimationTarget = null; // Stop current animation
        this.targetX = this.tileX;
        this.targetY = this.tileY;
    }
    
    // Convert tile path to waypoints (corners only)
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
    
    // Process movement for this game tick
    processTick() {
        if (this.path.length === 0) {
            return false; // No movement
        }
        
        // Determine how many tiles to move this tick (1 or 2)
        const tilesToMove = Math.min(Constants.MAX_TILES_PER_MOVE, this.path.length);
        
        // Collect tiles for this tick
        const tickTiles = [];
        for (let i = 0; i < tilesToMove; i++) {
            const nextTile = this.path.shift();
            tickTiles.push({ x: nextTile.x, y: nextTile.y });
        }
        
        // Convert to waypoints and ADD to animation buffer (don't replace!)
        const newWaypoints = this.preprocessPathToWaypoints(tickTiles);
        
        // Add new waypoints to the animation buffer
        this.animationWaypoints.push(...newWaypoints);
        
        // Update logical position immediately (game state)
        if (tickTiles.length > 0) {
            const lastTile = tickTiles[tickTiles.length - 1];
            this.tileX = lastTile.x;
            this.tileY = lastTile.y;
        }
        
        // Update target if path is complete
        if (this.path.length === 0) {
            this.targetX = this.tileX;
            this.targetY = this.tileY;
        }
        
        return true; // Movement occurred
    }
    
    // Update animation state (continuous smooth movement with dynamic speed)
    updateAnimation(deltaTime) {
        // If no waypoints, ensure we're at the correct position
        if (this.animationWaypoints.length === 0) {
            this.animX = this.tileX;
            this.animY = this.tileY;
            this.currentAnimationTarget = null;
            return;
        }
        
        // Start new segment if we don't have a target
        if (!this.currentAnimationTarget) {
            this.currentAnimationStart = { x: this.animX, y: this.animY };
            this.currentAnimationTarget = this.animationWaypoints[0];
            this.segmentProgress = 0;
        }
        
        // Calculate distance for this segment
        const dx = this.currentAnimationTarget.x - this.currentAnimationStart.x;
        const dy = this.currentAnimationTarget.y - this.currentAnimationStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // ===== SDK-STYLE DYNAMIC SPEED =====
        // Base speed should match input rate: 2 tiles per 600ms = 3.33 tiles/second
        // But we need to account for diagonal distance
        const tilesPerTick = 2;
        const ticksPerSecond = 1000 / Constants.TICK_RATE;
        const baseSpeed = tilesPerTick * ticksPerSecond; // 3.33 tiles/second
        
        // Dynamic speed adjustment based on buffer size (like SDK)
        let speedMultiplier = 1;
        const bufferSize = this.animationWaypoints.length;
        
        if (bufferSize >= 4) {
            // Way behind - catch up fast (SDK: path.length > 3)
            speedMultiplier = 2;
        } else if (bufferSize >= 3) {
            // Falling behind - speed up (SDK: path.length === 3)
            speedMultiplier = 1.5;
        } else if (bufferSize === 0 && this.segmentProgress > 0) {
            // Last segment - slow down slightly for smooth arrival
            speedMultiplier = 0.9;
        }
        
        // Calculate actual speed
        // For diagonal movement, we need to move at sqrt(2) speed to cover the distance
        // in the same time as orthogonal movement
        const isOrthogonal = (dx === 0 || dy === 0);
        const distanceAdjustment = isOrthogonal ? 1 : Math.sqrt(2);
        const actualSpeed = baseSpeed * speedMultiplier * distanceAdjustment;
        
        // Update segment progress based on speed and time
        if (distance > 0) {
            // Progress is speed * time / distance
            this.segmentProgress += (actualSpeed * deltaTime) / 1000 / distance;
        } else {
            this.segmentProgress = 1;
        }
        
        // Interpolate position
        if (this.segmentProgress >= 1) {
            // Reached waypoint
            this.animX = this.currentAnimationTarget.x;
            this.animY = this.currentAnimationTarget.y;
            
            // Remove completed waypoint
            this.animationWaypoints.shift();
            
            // Start next segment immediately if available
            if (this.animationWaypoints.length > 0) {
                this.currentAnimationStart = { x: this.animX, y: this.animY };
                this.currentAnimationTarget = this.animationWaypoints[0];
                this.segmentProgress = 0;
            } else {
                this.currentAnimationTarget = null;
            }
        } else {
            // Still animating - smooth interpolation
            this.animX = this.currentAnimationStart.x + dx * this.segmentProgress;
            this.animY = this.currentAnimationStart.y + dy * this.segmentProgress;
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
        return this.path.length > 0 || this.animationWaypoints.length > 0;
    }
    
    // Check if player has reached destination
    hasReachedDestination() {
        return this.tileX === this.targetX && 
               this.tileY === this.targetY && 
               !this.isMoving();
    }
}
