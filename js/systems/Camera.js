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
    
    // Convert world coordinates to perspective screen coordinates with scaling
    worldToPerspective(worldX, worldY) {
        // Calculate perspective scale based on Y distance
        // Objects further away (smaller Y in world) appear smaller
        // Objects closer (larger Y in world) appear larger
        const depth = Constants.PERSPECTIVE.CAMERA_DISTANCE + worldY;
        const scale = Constants.PERSPECTIVE.CAMERA_DISTANCE / depth;
        
        // Apply perspective scaling and Y-axis foreshortening
        return {
            x: worldX * scale,
            y: worldY * Constants.PERSPECTIVE.Y_SCALE * scale,
            scale: scale // Return scale for use in rendering
        };
    }
    
    // Convert perspective coordinates back to world coordinates
    perspectiveToWorld(perspX, perspY) {
        // This is an approximation for mouse picking
        // We need to solve for worldY first, then worldX
        
        // For mouse picking, we'll use an iterative approach
        // Start with a guess based on screen position
        let worldY = perspY / Constants.PERSPECTIVE.Y_SCALE;
        
        // Refine with a few iterations
        for (let i = 0; i < 5; i++) {
            const depth = Constants.PERSPECTIVE.CAMERA_DISTANCE + worldY;
            const scale = Constants.PERSPECTIVE.CAMERA_DISTANCE / depth;
            worldY = perspY / (Constants.PERSPECTIVE.Y_SCALE * scale);
        }
        
        // Calculate worldX using the final scale
        const depth = Constants.PERSPECTIVE.CAMERA_DISTANCE + worldY;
        const scale = Constants.PERSPECTIVE.CAMERA_DISTANCE / depth;
        const worldX = perspX / scale;
        
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
            y: (persp.y - this.y) * this.zoom
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
        
        const centerScreenX = this.viewportWidth / 2;
        const centerScreenY = this.viewportHeight / 2;
        const centerWorld = this.screenToWorld(centerScreenX, centerScreenY);
        
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
        
        if (this.zoom !== oldZoom) {
            const centerPersp = this.worldToPerspective(centerWorld.x, centerWorld.y);
            const zoomedWidth = this.viewportWidth / this.zoom;
            const zoomedHeight = this.viewportHeight / this.zoom;
            
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
