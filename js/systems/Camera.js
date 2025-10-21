// js/systems/Camera.js
class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        
        // Camera position (top-left corner in world coordinates)
        this.x = 0;
        this.y = 0;
        
        // Smooth following
        this.smoothing = true;
        this.smoothingSpeed = 0.1; // lerp factor
        
        // Zoom controls
        this.zoom = 1.0; // Default zoom level (1.0 = normal)
        this.minZoom = 0.5; // Maximum zoom out (see more of the world)
        this.maxZoom = 2.0; // Maximum zoom in (closer view)
        this.zoomSpeed = 0.001; // How fast zoom responds to scroll
        
        // World dimensions (kept for reference but not used for clamping)
        this.worldWidth = Constants.WORLD_WIDTH * Constants.TILE_SIZE;
        this.worldHeight = Constants.WORLD_HEIGHT * Constants.TILE_SIZE;
    }
    
    // Center camera on a target position
    centerOn(targetX, targetY) {
        // Account for zoom when centering
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        
        const newX = targetX - zoomedWidth / 2;
        const newY = targetY - zoomedHeight / 2;
        
        // Always use smooth camera movement
        this.x = this.x + (newX - this.x) * this.smoothingSpeed;
        this.y = this.y + (newY - this.y) * this.smoothingSpeed;
        
        // No clamping - camera can go beyond world bounds to keep player centered
    }
    
    // Follow a player entity
    followPlayer(player) {
        const worldPos = player.getWorldPosition();
        this.centerOn(worldPos.x, worldPos.y);
    }
    
    // Get visible tile range
    getVisibleTiles() {
        // Account for zoom when calculating visible tiles
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        
        const startTileX = Math.floor(this.x / Constants.TILE_SIZE);
        const startTileY = Math.floor(this.y / Constants.TILE_SIZE);
        const endTileX = Math.ceil((this.x + zoomedWidth) / Constants.TILE_SIZE);
        const endTileY = Math.ceil((this.y + zoomedHeight) / Constants.TILE_SIZE);
        
        // Still clamp the tile range for rendering efficiency
        // But camera position itself is not clamped
        return {
            startX: Math.max(0, startTileX),
            startY: Math.max(0, startTileY),
            endX: Math.min(Constants.WORLD_WIDTH, endTileX),
            endY: Math.min(Constants.WORLD_HEIGHT, endTileY)
        };
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
    
    // Check if a world position is visible
    isVisible(worldX, worldY, margin = 0) {
        return worldX >= this.x - margin &&
               worldX <= this.x + this.viewportWidth + margin &&
               worldY >= this.y - margin &&
               worldY <= this.y + this.viewportHeight + margin;
    }
    
    // Set camera bounds (kept for API compatibility but doesn't clamp)
    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        // No clamping
    }
    
    // Enable or disable smooth camera following
    // Kept for compatibility, but smoothing is now always on by default
    setSmoothingEnabled(enabled, speed = 0.1) {
        this.smoothing = enabled;
        this.smoothingSpeed = speed;
    }
    
    // Adjust zoom level
    adjustZoom(delta) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
    }
    
    // Get current zoom level
    getZoom() {
        return this.zoom;
    }
}
