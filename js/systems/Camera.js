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
        this.smoothingSpeed = 0.1;
        
        // Zoom controls
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;
        this.zoomSpeed = 0.001;
        
        // World dimensions
        this.worldWidth = Constants.WORLD_WIDTH * Constants.TILE_SIZE;
        this.worldHeight = Constants.WORLD_HEIGHT * Constants.TILE_SIZE;
    }
    
    // Convert world coordinates to isometric screen coordinates
    worldToIsometric(worldX, worldY) {
        // Standard isometric projection
        const isoX = (worldX - worldY);
        const isoY = (worldX + worldY) * 0.5;
        return { x: isoX, y: isoY };
    }
    
    // Convert isometric coordinates back to world coordinates
    isometricToWorld(isoX, isoY) {
        // Inverse isometric projection
        const worldX = (isoX + 2 * isoY) * 0.5;
        const worldY = (2 * isoY - isoX) * 0.5;
        return { x: worldX, y: worldY };
    }
    
    // Center camera on a target position
    centerOn(targetX, targetY) {
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        
        const newX = targetX - zoomedWidth / 2;
        const newY = targetY - zoomedHeight / 2;
        
        this.x = this.x + (newX - this.x) * this.smoothingSpeed;
        this.y = this.y + (newY - this.y) * this.smoothingSpeed;
    }
    
    // Follow a player entity
    followPlayer(player) {
        const worldPos = player.getWorldPosition();
        const isoPos = this.worldToIsometric(worldPos.x, worldPos.y);
        this.centerOn(isoPos.x, isoPos.y);
    }
    
    // Get visible tile range (rough estimate for isometric view)
    getVisibleTiles() {
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        
        // Convert screen corners to world space
        const topLeft = this.screenToWorld(0, 0);
        const topRight = this.screenToWorld(zoomedWidth, 0);
        const bottomLeft = this.screenToWorld(0, zoomedHeight);
        const bottomRight = this.screenToWorld(zoomedWidth, zoomedHeight);
        
        // Find the bounding box in tile coordinates
        const minTileX = Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x) / Constants.TILE_SIZE) - 2;
        const maxTileX = Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x) / Constants.TILE_SIZE) + 2;
        const minTileY = Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y) / Constants.TILE_SIZE) - 2;
        const maxTileY = Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y) / Constants.TILE_SIZE) + 2;
        
        return {
            startX: Math.max(0, minTileX),
            startY: Math.max(0, minTileY),
            endX: Math.min(Constants.WORLD_WIDTH, maxTileX),
            endY: Math.min(Constants.WORLD_HEIGHT, maxTileY)
        };
    }
    
    // Convert world coordinates to screen coordinates (with isometric projection)
    worldToScreen(worldX, worldY) {
        const iso = this.worldToIsometric(worldX, worldY);
        return {
            x: (iso.x - this.x) * this.zoom,
            y: (iso.y - this.y) * this.zoom
        };
    }
    
    // Convert screen coordinates to world coordinates (with inverse isometric projection)
    screenToWorld(screenX, screenY) {
        const isoX = screenX / this.zoom + this.x;
        const isoY = screenY / this.zoom + this.y;
        return this.isometricToWorld(isoX, isoY);
    }
    
    // Check if a world position is visible
    isVisible(worldX, worldY, margin = 0) {
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        const iso = this.worldToIsometric(worldX, worldY);
        
        return iso.x >= this.x - margin &&
               iso.x <= this.x + zoomedWidth + margin &&
               iso.y >= this.y - margin &&
               iso.y <= this.y + zoomedHeight + margin;
    }
    
    // Set camera bounds
    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }
    
    // Enable or disable smooth camera following
    setSmoothingEnabled(enabled, speed = 0.1) {
        this.smoothing = enabled;
        this.smoothingSpeed = speed;
    }
    
    // Adjust zoom level
    adjustZoom(delta) {
        const oldZoom = this.zoom;
        
        const centerScreenX = this.viewportWidth / 2;
        const centerScreenY = this.viewportHeight / 2;
        const centerWorld = this.screenToWorld(centerScreenX, centerScreenY);
        
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
        
        if (this.zoom !== oldZoom) {
            const centerIso = this.worldToIsometric(centerWorld.x, centerWorld.y);
            const zoomedWidth = this.viewportWidth / this.zoom;
            const zoomedHeight = this.viewportHeight / this.zoom;
            
            this.x = centerIso.x - zoomedWidth / 2;
            this.y = centerIso.y - zoomedHeight / 2;
        }
    }
    
    // Get current zoom level
    getZoom() {
        return this.zoom;
    }
    
    // Get the effective tile size based on zoom
    getEffectiveTileSize() {
        return Constants.TILE_SIZE * this.zoom;
    }
}
