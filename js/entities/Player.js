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
        this.fullPath = []; // Store complete path for reference
        this.plannedWaypoints = []; // Pre-processed waypoints for the full path
        this.waypointIndex = 0; // Current index in plannedWaypoints
        
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
        // Store the complete path
        this.fullPath = [...path];
        this.path = path;
        this.forceWalk = forceWalk;
        
        if (path.length > 0) {
            const lastTile = path[path.length - 1];
            this.targetX = lastTile.x;
            this.targetY = lastTile.y;
            
            // Process the ENTIRE path into waypoints upfront (SDK style)
            // This creates waypoints only at corners for the whole path
            const allWaypoints = this.preprocessFullPath(path);
            // Don't add them to animation buffer yet - that happens during processTick
            this.plannedWaypoints = allWaypoints;
        } else {
            this.plannedWaypoints = [];
        }
    }
    
    // Clear current path and animation
    clearPath() {
        this.path = [];
        this.fullPath = [];
        this.plannedWaypoints = [];
        this.waypointIndex = 0;
        this.animationWaypoints = [];
        this.currentAnimationTarget = null;
        this.targetX = this.tileX;
        this.targetY = this.tileY;
        this.forceWalk = false;
    }
    
    // Process the full path into waypoints (corners only)
    preprocessFullPath(path) {
        if (path.length === 0) return [];
        
        const waypoints = [];
        let lastDirection = null;
        
        // Start from current position
        let prevX = this.tileX;
        let prevY = this.tileY;
        
        for (let i = 0; i < path.length; i++) {
            // Calculate direction from previous position
            const dx = path[i].x - prevX;
            const dy = path[i].y - prevY;
            const currentDirection = `${Math.sign(dx)},${Math.sign(dy)}`;
            
            // Add waypoint if direction changed or it's the last tile
            if (currentDirection !== lastDirection || i === path.length - 1) {
                waypoints.push({
                    x: path[i].x,
                    y: path[i].y,
                    tileIndex: i, // Track which tile in the path this represents
                    run: this.shouldRun() // Store run state
                });
                lastDirection = currentDirection;
            }
            
            prevX = path[i].x;
            prevY = path[i].y;
        }
        
        return waypoints;
    }
    
    // Convert tile path to waypoints (corners only) - SDK style
    preprocessPathToWaypoints(tiles, fromX, fromY) {
        if (tiles.length === 0) return [];
        
        const waypoints = [];
        let lastDirection = null;
        
        // Start from the position we're actually moving from
        let prevX = fromX;
        let prevY = fromY;
        
        for (let i = 0; i < tiles.length; i++) {
            // Calculate direction from previous position
            const dx = tiles[i].x - prevX;
            const dy = tiles[i].y - prevY;
            const currentDirection = `${Math.sign(dx)},${Math.sign(dy)}`;
            
            // Add waypoint if direction changed or it's the last tile
            if (currentDirection !== lastDirection || i === tiles.length - 1) {
                waypoints.push({
                    x: tiles[i].x,
                    y: tiles[i].y,
                    run: this.shouldRun() // Store run state with waypoint
                });
            }
            
            lastDirection = currentDirection;
            prevX = tiles[i].x;
            prevY = tiles[i].y;
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
        
        // Move through tiles
        for (let i = 0; i < tilesToMove; i++) {
            const nextTile = this.path.shift();
            this.tileX = nextTile.x;
            this.tileY = nextTile.y;
        }
        
        // Check if we've reached or passed any waypoints
        // Add them to the animation buffer as we reach them
        while (this.waypointIndex < this.plannedWaypoints.length) {
            const nextWaypoint = this.plannedWaypoints[this.waypointIndex];
            
            // Check if we've reached this waypoint's position
            const tilesProcessed = this.fullPath.length - this.path.length;
            if (tilesProcessed > nextWaypoint.tileIndex) {
                // We've passed this waypoint, add it to animation buffer
                this.animationWaypoints.push({
                    x: nextWaypoint.x,
                    y: nextWaypoint.y,
                    run: nextWaypoint.run
                });
                this.waypointIndex++;
            } else {
                // Haven't reached this waypoint yet
                break;
            }
        }
        
        // Update target if path is complete
        if (this.path.length === 0) {
            this.targetX = this.tileX;
            this.targetY = this.tileY;
            this.forceWalk = false; // Reset walk override when path complete
            
            // Make sure the final waypoint is added
            if (this.waypointIndex < this.plannedWaypoints.length) {
                const finalWaypoint = this.plannedWaypoints[this.plannedWaypoints.length - 1];
                this.animationWaypoints.push({
                    x: finalWaypoint.x,
                    y: finalWaypoint.y,
                    run: finalWaypoint.run
                });
                this.waypointIndex = this.plannedWaypoints.length;
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
        // Base speed calculation - this should be tiles per SECOND, not per tick!
        // Running: 2 tiles per 600ms = 3.33 tiles/second
        // Walking: 1 tile per 600ms = 1.67 tiles/second
        const tilesPerTick = this.currentAnimationTarget.run ? 2 : 1;
        const ticksPerSecond = 1000 / Constants.TICK_RATE; // 1.67 ticks/second
        const baseSpeed = tilesPerTick * ticksPerSecond; // 3.33 or 1.67 tiles/second
        
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
        
        // For diagonal movement, we need to move at sqrt(2) speed to cover the distance
        // in the same time as orthogonal movement
        const isOrthogonal = (dx === 0 || dy === 0);
        const distanceAdjustment = isOrthogonal ? 1 : Math.sqrt(2);
        
        // Calculate actual speed in tiles per second
        const actualSpeed = baseSpeed * speedMultiplier * distanceAdjustment;
        
        // Update segment progress based on speed and time
        // Progress is the fraction of the segment completed this frame
        if (distance > 0) {
            // actualSpeed is in tiles/second, deltaTime is in milliseconds
            // distance is in tiles, so (actualSpeed * deltaTime / 1000) / distance gives us the fraction
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
