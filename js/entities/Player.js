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
        this.fullPath = [];
        
        // Movement state
        this.running = true;
        this.forceWalk = false;
        
        // Animation system (SDK-style with pre-filled buffer)
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
        this.path = [...path]; // Keep a copy for processTick
        this.forceWalk = forceWalk;
        
        if (path.length > 0) {
            const lastTile = path[path.length - 1];
            this.targetX = lastTile.x;
            this.targetY = lastTile.y;
            
            // PRE-PROCESS THE ENTIRE PATH INTO WAYPOINTS UPFRONT (SDK style)
            const allWaypoints = this.preprocessPathToWaypoints(
                path,
                this.tileX,
                this.tileY
            );
            
            // ADD ALL WAYPOINTS TO ANIMATION BUFFER IMMEDIATELY
            this.animationWaypoints.push(...allWaypoints);
        } else {
            this.animationWaypoints = [];
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
    preprocessPathToWaypoints(tiles, fromX, fromY) {
        if (tiles.length === 0) return [];
        
        const waypoints = [];
        
        // Calculate directions for the entire path
        const directions = [];
        let prevX = fromX;
        let prevY = fromY;
        
        for (let i = 0; i < tiles.length; i++) {
            const dx = tiles[i].x - prevX;
            const dy = tiles[i].y - prevY;
            directions.push({ dx: Math.sign(dx), dy: Math.sign(dy) });
            prevX = tiles[i].x;
            prevY = tiles[i].y;
        }
        
        // Now find corners by looking ahead
        for (let i = 0; i < tiles.length; i++) {
            const isLastTile = i === tiles.length - 1;
            const isCorner = !isLastTile && 
                            (directions[i].dx !== directions[i + 1].dx || 
                             directions[i].dy !== directions[i + 1].dy);
            
            // Add waypoint if it's a corner OR the last tile
            if (isCorner || isLastTile) {
                waypoints.push({
                    x: tiles[i].x,
                    y: tiles[i].y,
                    run: this.shouldRun()
                });
            }
        }
        
        return waypoints;
    }
    
    // Determine if we should run or walk
    shouldRun() {
        return this.running && !this.forceWalk;
    }
    
    // Process movement for this game tick
    processTick() {
        if (this.path.length === 0) {
            return false;
        }
        
        // Determine movement speed based on run/walk state
        const speed = this.shouldRun() ? Constants.RUN_TILES_PER_MOVE : Constants.WALK_TILES_PER_MOVE;
        const tilesToMove = Math.min(speed, this.path.length);
        
        // Just consume tiles from path (update logical position only)
        for (let i = 0; i < tilesToMove; i++) {
            const nextTile = this.path.shift();
            this.tileX = nextTile.x;
            this.tileY = nextTile.y;
        }
        
        // Update target if path is complete
        if (this.path.length === 0) {
            this.targetX = this.tileX;
            this.targetY = this.tileY;
            this.forceWalk = false;
        }
        
        return true;
    }
    
    // Update animation state (SDK-style with correct speed)
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
        
        // SDK-STYLE SPEED CALCULATION
        // SDK: Walking = 1 tile per 600ms, Running = 2 tiles per 600ms
        // Which equals: Walking = 1.667 tiles/sec, Running = 3.333 tiles/sec
        const tilesPerSecond = this.currentAnimationTarget.run ? 3.333 : 1.667;
        
        // Dynamic speed adjustment based on buffer size (SDK style)
        let speedMultiplier = 1;
        const bufferSize = this.animationWaypoints.length;
        
        if (bufferSize >= 4) {
            // Way behind - warp speed (SDK uses 2x)
            speedMultiplier = 2;
        } else if (bufferSize >= 3) {
            // Falling behind - speed up (SDK uses 1.5x)
            speedMultiplier = 1.5;
        } else if (bufferSize === 1 && this.segmentProgress > 0) {
            // Last segment - slow down slightly for smooth arrival
            speedMultiplier = 0.9;
        }
        
        // Calculate actual movement speed with multiplier
        const actualSpeed = tilesPerSecond * speedMultiplier;
        
        // Update segment progress
        // actualSpeed is tiles/second, deltaTime is milliseconds
        // So: (actualSpeed * deltaTime / 1000) gives us tiles moved this frame
        // Divide by distance to normalize to 0-1 progress
        if (distance > 0) {
            const tilesMovedThisFrame = actualSpeed * (deltaTime / 1000);
            this.segmentProgress += tilesMovedThisFrame / distance;
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
