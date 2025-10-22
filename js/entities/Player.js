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
        this.lastProcessedTargetX = startX;
        this.lastProcessedTargetY = startY;
        
        // Pathfinding
        this.path = [];
        this.fullPath = [];
        
        // Movement state
        this.running = true;
        this.forceWalk = false;
        
        // Animation system
        this.pendingWaypoints = []; // Waypoints waiting for activation
        this.animationWaypoints = []; // Active waypoints being animated
        this.currentAnimationStart = { x: startX, y: startY };
        this.currentAnimationTarget = null;
        
        // Visual properties
        this.color = Constants.COLORS.PLAYER;
        this.outlineColor = Constants.COLORS.PLAYER_OUTLINE;
        this.radius = Constants.TILE_SIZE / 3;
    }
    
    // Set a new destination (called on click)
    setDestination(targetX, targetY, forceWalk = false) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.forceWalk = forceWalk;
    }
    
    // Set a path with full pathfinding info (called internally)
    setPathFromPathfinding(path, forceWalk = false, currentTick) {
        this.fullPath = [...path];
        this.path = path;
        this.forceWalk = forceWalk;
        
        if (path.length > 0) {
            const lastTile = path[path.length - 1];
            this.targetX = lastTile.x;
            this.targetY = lastTile.y;
            this.lastProcessedTargetX = lastTile.x;
            this.lastProcessedTargetY = lastTile.y;
            
            // Calculate waypoints starting from LOGICAL position
            this.pendingWaypoints = this.calculateAnimationWaypoints(path, currentTick);
        } else {
            this.pendingWaypoints = [];
        }
    }
    
    // Clear current path and animation
    clearPath() {
        this.path = [];
        this.fullPath = [];
        this.pendingWaypoints = [];
        this.animationWaypoints = [];
        this.currentAnimationTarget = null;
        this.targetX = this.tileX;
        this.targetY = this.tileY;
        this.lastProcessedTargetX = this.tileX;
        this.lastProcessedTargetY = this.tileY;
        this.forceWalk = false;
    }
    
    // Calculate animation waypoints from the full path (corners only)
    calculateAnimationWaypoints(path, currentTick) {
        if (path.length === 0) return [];
        
        const waypoints = [];
        let lastDirection = null;
        let previousTile = { x: this.tileX, y: this.tileY };
        
        // Calculate tiles per tick based on run/walk
        const tilesPerTick = this.shouldRun() ? Constants.RUN_TILES_PER_MOVE : Constants.WALK_TILES_PER_MOVE;
        
        // Track which tick we're on for waypoint timing
        let tickOffset = 1; // Start at next tick (movement happens on tick after click)
        let tilesProcessed = 0;
        
        // Always start with current LOGICAL position
        waypoints.push({
            x: this.tileX,
            y: this.tileY,
            run: this.shouldRun(),
            startTick: currentTick,
            endTick: currentTick // Start point has no duration
        });
        
        for (let i = 0; i < path.length; i++) {
            const currentTile = path[i];
            
            // Calculate direction from previous tile to current tile
            const dx = currentTile.x - previousTile.x;
            const dy = currentTile.y - previousTile.y;
            const currentDirection = `${Math.sign(dx)},${Math.sign(dy)}`;
            
            // Check if this is the last tile
            const isLastTile = (i === path.length - 1);
            
            // Track tiles processed for tick calculation
            tilesProcessed++;
            
            // If direction changed OR it's the last tile, we need a waypoint
            if (currentDirection !== lastDirection) {
                // Direction changed - add the previous tile as a corner waypoint
                // (unless it's the very first tile, which we already added)
                if (lastDirection !== null) {
                    const waypointStartTick = currentTick + Math.floor((tilesProcessed - 1) / tilesPerTick);
                    const waypointEndTick = currentTick + Math.ceil(tilesProcessed / tilesPerTick);
                    
                    waypoints.push({
                        x: previousTile.x,
                        y: previousTile.y,
                        run: this.shouldRun(),
                        startTick: waypointStartTick,
                        endTick: waypointEndTick
                    });
                }
                lastDirection = currentDirection;
            }
            
            // Always add the final destination
            if (isLastTile) {
                const waypointStartTick = waypoints[waypoints.length - 1].endTick;
                const waypointEndTick = currentTick + Math.ceil((i + 1) / tilesPerTick);
                
                waypoints.push({
                    x: currentTile.x,
                    y: currentTile.y,
                    run: this.shouldRun(),
                    startTick: waypointStartTick,
                    endTick: waypointEndTick
                });
            }
            
            previousTile = currentTile;
        }
        
        return waypoints;
    }
    
    // Determine if we should run or walk
    shouldRun() {
        return this.running && !this.forceWalk;
    }
    
    // Check if destination has changed
    hasDestinationChanged() {
        return this.targetX !== this.lastProcessedTargetX || 
               this.targetY !== this.lastProcessedTargetY;
    }
    
    // Process movement for this game tick
    processTick(currentTick) {
        // Check if destination has changed - if so, need new path
        // This is handled externally by Game.js calling setPathFromPathfinding
        // Here we just process existing path
        
        // If no path, nothing to do
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
        
        // Activate pending waypoints AFTER moving
        if (this.pendingWaypoints.length > 0) {
            // Clear existing animation and set new waypoints
            this.animationWaypoints = [...this.pendingWaypoints];
            this.pendingWaypoints = [];
            this.currentAnimationTarget = null;
        }
        
        // Update target if path is complete
        if (this.path.length === 0) {
            this.lastProcessedTargetX = this.tileX;
            this.lastProcessedTargetY = this.tileY;
            this.forceWalk = false;
        }
        
        return true;
    }
    
    // Update animation state with tick-based timing
    updateAnimation(currentTick, tickProgress) {
        // If no waypoints, stay at current animation position
        if (this.animationWaypoints.length === 0) {
            this.currentAnimationTarget = null;
            return;
        }
        
        // Start new segment if we don't have a target
        if (!this.currentAnimationTarget) {
            this.currentAnimationStart = { x: this.animX, y: this.animY };
            this.currentAnimationTarget = this.animationWaypoints[0];
        }
        
        // Calculate segment progress using tick-based timing
        const currentAnimTime = currentTick + tickProgress;
        const tickDuration = this.currentAnimationTarget.endTick - this.currentAnimationTarget.startTick;
        
        let segmentProgress = 0;
        if (tickDuration > 0) {
            const ticksElapsed = currentAnimTime - this.currentAnimationTarget.startTick;
            segmentProgress = ticksElapsed / tickDuration;
        } else {
            // Instant waypoint (start point)
            segmentProgress = 1;
        }
        
        // Calculate interpolated position
        const dx = this.currentAnimationTarget.x - this.currentAnimationStart.x;
        const dy = this.currentAnimationTarget.y - this.currentAnimationStart.y;
        
        // Check if segment is complete
        if (segmentProgress >= 1) {
            // Reached waypoint
            this.animX = this.currentAnimationTarget.x;
            this.animY = this.currentAnimationTarget.y;
            
            // Remove completed waypoint
            this.animationWaypoints.shift();
            
            // Start next segment immediately if available
            if (this.animationWaypoints.length > 0) {
                this.currentAnimationStart = { x: this.animX, y: this.animY };
                this.currentAnimationTarget = this.animationWaypoints[0];
            } else {
                this.currentAnimationTarget = null;
            }
        } else {
            // Still animating - smooth interpolation
            this.animX = this.currentAnimationStart.x + dx * segmentProgress;
            this.animY = this.currentAnimationStart.y + dy * segmentProgress;
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
        return this.path.length > 0 || this.animationWaypoints.length > 0 || this.pendingWaypoints.length > 0;
    }
    
    // Check if player has reached destination
    hasReachedDestination() {
        return this.tileX === this.targetX && 
               this.tileY === this.targetY && 
               !this.isMoving();
    }
}
