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
        
        // World dimensions (kept for reference but not used for clamping)
        this.worldWidth = Constants.WORLD_WIDTH * Constants.TILE_SIZE;
        this.worldHeight = Constants.WORLD_HEIGHT * Constants.TILE_SIZE;
    }
    
    // Center camera on a target position
    centerOn(targetX, targetY) {
        const newX = targetX - this.viewportWidth / 2;
        const newY = targetY - this.viewportHeight / 2;
        
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
        const startTileX = Math.floor(this.x / Constants.TILE_SIZE);
        const startTileY = Math.floor(this.y / Constants.TILE_SIZE);
        const endTileX = Math.ceil((this.x + this.viewportWidth) / Constants.TILE_SIZE);
        const endTileY = Math.ceil((this.y + this.viewportHeight) / Constants.TILE_SIZE);
        
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
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
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
}
