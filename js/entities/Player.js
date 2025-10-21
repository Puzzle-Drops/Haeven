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
        this.lastMovementDirection = null; // Track last movement direction across ticks
        
        // Movement state
        this.running = true; // Running state (default true like SDK)
        this.forceWalk = false; // Temporary walk override for current path
        
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
        this.path = path;
        this.forceWalk = forceWalk;
        this.lastMovementDirection = null; // Reset direction tracking for new path
        
        if (path.length > 0) {
            const lastTile = path[path.length - 1];
            this.targetX = lastTile.x;
            this.targetY = lastTile.y;
        }
    }
    
    // Clear current path and animation
    clearPath() {
        this.path = [];
        this.animationWaypoints = [];
        this.currentAnimationTarget = null;
        this.targetX = this.tileX;
        this.targetY = this.tileY;
        this.forceWalk = false;
        this.lastMovementDirection = null;
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
        
        // Store position before movement
        const startX = this.tileX;
        const startY = this.tileY;
        
        // Determine movement speed
        const speed = this.shouldRun() ? Constants.RUN_TILES_PER_MOVE : Constants.WALK_TILES_PER_MOVE;
        const tilesToMove = Math.min(speed, this.path.length);
        
        // Build the movement for this tick
        const tickMovement = [];
        for (let i = 0; i < tilesToMove; i++) {
            const nextTile = this.path.shift();
            tickMovement.push(nextTile);
        }
        
        // Calculate waypoints from the movement
        if (tickMovement.length > 0) {
            // Always add the final position of this tick's movement
            const finalTile = tickMovement[tickMovement.length - 1];
            
            // Calculate direction of overall movement this tick
            const dx = finalTile.x - startX;
            const dy = finalTile.y - startY;
            const currentDirection = `${Math.sign(dx)},${Math.sign(dy)}`;
            
            // Add waypoint if:
            // 1. Direction changed from last tick
            // 2. We have no waypoints (starting movement)
            // 3. It's the final destination
            const isLastMove = this.path.length === 0;
            const directionChanged = this.lastMovementDirection !== null && 
                                    this.lastMovementDirection !== currentDirection;
            const needsWaypoint = this.animationWaypoints.length === 0 || 
                                 directionChanged || 
                                 isLastMove;
            
            if (needsWaypoint) {
                this.animationWaypoints.push({
                    x: finalTile.x,
                    y: finalTile.y,
                    run: this.shouldRun()
                });
            }
            
            this.lastMovementDirection = currentDirection;
            
            // Update logical position to final tile
            this.tileX = finalTile.x;
            this.tileY = finalTile.y;
        }
        
        // Reset if path is complete
        if (this.path.length === 0) {
            this.targetX = this.tileX;
            this.targetY = this.tileY;
            this.forceWalk = false;
            this.lastMovementDirection = null;
            
            // Ensure final position is in waypoints
            if (this.animationWaypoints.length === 0 || 
                this.animationWaypoints[this.animationWaypoints.length - 1].x !== this.tileX ||
                this.animationWaypoints[this.animationWaypoints.length - 1].y !== this.tileY) {
                this.animationWaypoints.push({
                    x: this.tileX,
                    y: this.tileY,
                    run: false
                });
            }
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
        // Base speed calculation - tiles per second
        const tilesPerTick = this.currentAnimationTarget.run ? 2 : 1;
        const ticksPerSecond = 1000 / Constants.TICK_RATE; // 1.67 ticks/second
        const baseSpeed = (tilesPerTick * ticksPerSecond) - 0.33; // 3.33 or 1.67 tiles/second
        
        // Dynamic speed adjustment based on buffer size (SDK style)
        let speedMultiplier = 1;
        const bufferSize = this.animationWaypoints.length;
        
        if (bufferSize >= 4) {
            // Way behind - catch up fast (double speed)
            speedMultiplier = 2;
        } else if (bufferSize >= 3) {
            // Falling behind - speed up
            speedMultiplier = 1.5;
        } else if (bufferSize === 0 && this.segmentProgress > 0) {
            // Last segment - slow down slightly for smooth arrival
            speedMultiplier = 0.9;
        }
        
        // For diagonal movement, adjust for distance
        const isOrthogonal = (dx === 0 || dy === 0);
        const distanceAdjustment = isOrthogonal ? 1 : Math.sqrt(2);
        
        // Calculate actual speed in tiles per second
        const actualSpeed = baseSpeed * speedMultiplier * distanceAdjustment;
        
        // Update segment progress based on speed and time
        if (distance > 0) {
            this.segmentProgress += (actualSpeed * deltaTime / 1000) / distance;
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
