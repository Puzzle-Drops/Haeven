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
        this.zoom = 0.8;
        this.minZoom = 0.4;
        this.maxZoom = 1.4;
        this.zoomSpeed = 0.001;
        
        // World dimensions
        this.worldWidth = Constants.WORLD_WIDTH * Constants.TILE_SIZE;
        this.worldHeight = Constants.WORLD_HEIGHT * Constants.TILE_SIZE;
    }
    
    // Apply perspective projection to world coordinates (CAMERA-RELATIVE)
    applyPerspective(worldX, worldY) {
        // First apply Y-axis foreshortening
        const perspY = worldY * Constants.PERSPECTIVE.Y_SCALE;
        
        // Then apply perspective scaling based on Y position
        // Higher Y = closer to camera = larger scale
        // Lower Y = farther from camera = smaller scale
        const normalizedY = worldY / this.worldHeight;
        const scale = 1 + (normalizedY * Constants.PERSPECTIVE.STRENGTH);
        
        // NEW: Camera-relative perspective center
        // Calculate the center of the current viewport in world space
        const cameraCenterX = this.x + (this.viewportWidth / this.zoom) / 2;
        
        // Apply perspective scaling from the camera's viewpoint
        const offsetX = (worldX - cameraCenterX) * scale;
        
        return {
            x: cameraCenterX + offsetX,
            y: perspY,
            scale: scale // Return scale for use in rendering
        };
    }
    
    // Convert world coordinates to perspective screen coordinates
    worldToPerspective(worldX, worldY) {
        return this.applyPerspective(worldX, worldY);
    }
    
    // Convert perspective coordinates back to world coordinates
    perspectiveToWorld(perspX, perspY) {
        // Inverse of Y-axis foreshortening
        const worldY = perspY / Constants.PERSPECTIVE.Y_SCALE;
        
        // Inverse of perspective scaling
        const normalizedY = worldY / this.worldHeight;
        const scale = 1 + (normalizedY * Constants.PERSPECTIVE.STRENGTH);
        
        // NEW: Camera-relative center
        const cameraCenterX = this.x + (this.viewportWidth / this.zoom) / 2;
        const offsetX = perspX - cameraCenterX;
        const worldX = cameraCenterX + (offsetX / scale);
        
        return {
            x: worldX,
            y: worldY
        };
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
        const perspPos = this.worldToPerspective(worldPos.x, worldPos.y);
        this.centerOn(perspPos.x, perspPos.y);
    }
    
    // Get visible tile range
    getVisibleTiles() {
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        
        // Convert screen corners to world space
        const topLeft = this.screenToWorld(0, 0);
        const topRight = this.screenToWorld(zoomedWidth, 0);
        const bottomLeft = this.screenToWorld(0, zoomedHeight);
        const bottomRight = this.screenToWorld(zoomedWidth, zoomedHeight);
        
        // Find the bounding box in tile coordinates (add padding for safety)
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
    
    // Convert world coordinates to screen coordinates (with perspective projection)
    worldToScreen(worldX, worldY) {
        const persp = this.worldToPerspective(worldX, worldY);
        return {
            x: (persp.x - this.x) * this.zoom,
            y: (persp.y - this.y) * this.zoom,
            scale: persp.scale // Pass scale through for rendering
        };
    }
    
    // Convert screen coordinates to world coordinates (with inverse perspective projection)
    screenToWorld(screenX, screenY) {
        const perspX = screenX / this.zoom + this.x;
        const perspY = screenY / this.zoom + this.y;
        return this.perspectiveToWorld(perspX, perspY);
    }
    
    // Check if a world position is visible
    isVisible(worldX, worldY, margin = 0) {
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        const persp = this.worldToPerspective(worldX, worldY);
        
        return persp.x >= this.x - margin &&
               persp.x <= this.x + zoomedWidth + margin &&
               persp.y >= this.y - margin &&
               persp.y <= this.y + zoomedHeight + margin;
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
        
        // Get the current center point in world coordinates BEFORE zoom changes
        const centerScreenX = this.viewportWidth / 2;
        const centerScreenY = this.viewportHeight / 2;
        const centerWorld = this.screenToWorld(centerScreenX, centerScreenY);
        
        // Apply zoom change
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
        
        if (this.zoom !== oldZoom) {
            // After zoom changes, recalculate perspective with NEW zoom
            // This ensures the perspective center is correct for the new zoom level
            const centerPersp = this.worldToPerspective(centerWorld.x, centerWorld.y);
            const zoomedWidth = this.viewportWidth / this.zoom;
            const zoomedHeight = this.viewportHeight / this.zoom;
            
            // Reposition camera so that the world point stays at screen center
            this.x = centerPersp.x - zoomedWidth / 2;
            this.y = centerPersp.y - zoomedHeight / 2;
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
