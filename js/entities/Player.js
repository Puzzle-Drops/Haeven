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
        this.fullPath = []; // NEW: Store complete path for reference
        
        // Movement state
        this.running = true; // NEW: Running state (default true like SDK)
        this.forceWalk = false; // NEW: Temporary walk override
        
        // Animation system (SDK-style)
        this.animationWaypoints = [];
        this.currentAnimationStart = { x: startX, y: startY };
        this.currentAnimationTarget = null;
        this.segmentProgress = 0;
        
        // Visual properties
        this.color = Constants.COLORS.PLAYER;
        this.outlineColor = Constants.COLORS.PLAYER_OUTLINE;
        this.radius = Constants.TILE_SIZE / 3;
    }
    
    // Set a new path for the player to follow
    setPath(path, forceWalk = false) {
        // Store the complete path
        this.fullPath = [...path];
        this.path = path;
        this.forceWalk = forceWalk;
        
        if (path.length > 0) {
            const lastTile = path[path.length - 1];
            this.targetX = lastTile.x;
            this.targetY = lastTile.y;
        }
    }
    
    // Clear current path and animation
    clearPath() {
        this.path = [];
        this.fullPath = [];
        this.animationWaypoints = [];
        this.currentAnimationTarget = null;
        this.targetX = this.tileX;
        this.targetY = this.tileY;
        this.forceWalk = false;
    }
    
    // Convert tile path to waypoints (corners only) - SDK style
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
                waypoints.push({
                    x: tiles[i].x,
                    y: tiles[i].y,
                    run: this.shouldRun() // Store run state with waypoint
                });
            }
            
            lastDirection = currentDirection;
        }
        
        return waypoints;
    }
    
    // Determine if we should run or walk
    shouldRun() {
        return this.running && !this.forceWalk;
    }
    
    // Process movement for this game tick (SDK style)
    processTick() {
        if (this.path.length === 0) {
            return false;
        }
        
        // Determine movement speed based on run/walk state
        const speed = this.shouldRun() ? Constants.RUN_TILES_PER_MOVE : Constants.WALK_TILES_PER_MOVE;
        const tilesToMove = Math.min(speed, this.path.length);
        
        // Collect tiles for this tick
        const tickTiles = [];
        for (let i = 0; i < tilesToMove; i++) {
            const nextTile = this.path.shift();
            tickTiles.push({ x: nextTile.x, y: nextTile.y });
        }
        
        // Convert to waypoints (corner compression)
        const newWaypoints = this.preprocessPathToWaypoints(tickTiles);
        
        // ADD to animation buffer (SDK style - don't replace!)
        this.animationWaypoints.push(...newWaypoints);
        
        // Update logical position immediately
        if (tickTiles.length > 0) {
            const lastTile = tickTiles[tickTiles.length - 1];
            this.tileX = lastTile.x;
            this.tileY = lastTile.y;
        }
        
        // Update target if path is complete
        if (this.path.length === 0) {
            this.targetX = this.tileX;
            this.targetY = this.tileY;
            this.forceWalk = false; // Reset walk override when path complete
        }
        
        return true;
    }
    
    // Update animation state (SDK-style with dynamic speed)
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
        
        // SDK-STYLE DYNAMIC SPEED
        const tilesPerTick = this.currentAnimationTarget.run ? 2 : 1;
        const ticksPerSecond = 1000 / Constants.TICK_RATE;
        const baseSpeed = tilesPerTick * ticksPerSecond;
        
        // Dynamic speed adjustment based on buffer size (SDK style)
        let speedMultiplier = 1;
        const bufferSize = this.animationWaypoints.length;
        
        if (bufferSize >= 4) {
            // Way behind - catch up fast
            speedMultiplier = 2;
        } else if (bufferSize >= 3) {
            // Falling behind - speed up
            speedMultiplier = 1.5;
        } else if (bufferSize === 0 && this.segmentProgress > 0) {
            // Last segment - slow down slightly for smooth arrival
            speedMultiplier = 0.9;
        }
        
        // Account for diagonal movement
        const isOrthogonal = (dx === 0 || dy === 0);
        const distanceAdjustment = isOrthogonal ? 1 : Math.sqrt(2);
        const actualSpeed = baseSpeed * speedMultiplier * distanceAdjustment;
        
        // Update segment progress
        if (distance > 0) {
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
    
    // Toggle running state
    toggleRun() {
        this.running = !this.running;
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
