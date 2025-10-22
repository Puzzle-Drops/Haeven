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
        this.path = path;
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
                    run: this.shouldRun()
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
    
    // SDK-STYLE SPEED CALCULATION
    // Base: 1 tile should take 1 game tick (600ms) when walking
    //       1 tile should take 0.5 game tick (300ms) when running
    const ticksToComplete = this.currentAnimationTarget.run ? 0.5 : 1.0;
    const timeToComplete = ticksToComplete * Constants.TICK_RATE; // milliseconds
    
    // Dynamic speed adjustment based on buffer size (SDK style)
    let speedMultiplier = 1;
    const bufferSize = this.animationWaypoints.length;
    
    if (bufferSize >= 4) {
        speedMultiplier = 2; // Catch up fast
    } else if (bufferSize >= 3) {
        speedMultiplier = 1.5; // Catch up medium
    } else if (bufferSize === 0 && this.segmentProgress > 0) {
        speedMultiplier = 0.9; // Slow down on last segment
    }
    
    // Calculate progress per millisecond
    // distance / timeToComplete gives us tiles per ms we need to travel
    // Then multiply by deltaTime to get progress this frame
    // Then divide by distance to normalize to 0-1 range
    const adjustedTime = timeToComplete / speedMultiplier;
    
    if (distance > 0) {
        // Progress = (distance we should cover) / (total distance)
        const distanceThisFrame = (distance / adjustedTime) * deltaTime;
        this.segmentProgress += distanceThisFrame / distance;
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
