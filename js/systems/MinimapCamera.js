// js/systems/MinimapCamera.js
class MinimapCamera extends Camera {
    constructor(viewportWidth, viewportHeight) {
        super(viewportWidth, viewportHeight);
        
        // Minimap always centers on player animation position
        // No smoothing - instant following for responsiveness
        this.smoothing = false;
        
        // Use minimap default zoom (user-facing value)
        this.zoom = Constants.MINIMAP.DEFAULT_ZOOM;
        
        // Store the zoom multiplier for internal calculations
        this.zoomMultiplier = Constants.MINIMAP.ZOOM_MULTIPLIER;
    }
    
    // Get the effective zoom level used for rendering
    getEffectiveZoom() {
        return this.zoom * this.zoomMultiplier;
    }
    
    // Override getVisibleTiles to use effective zoom
    getVisibleTiles() {
        const effectiveZoom = this.getEffectiveZoom();
        const zoomedWidth = this.viewportWidth / effectiveZoom;
        const zoomedHeight = this.viewportHeight / effectiveZoom;
        
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
    
    // Override worldToScreen to use effective zoom
    worldToScreen(worldX, worldY) {
        const effectiveZoom = this.getEffectiveZoom();
        const persp = this.worldToPerspective(worldX, worldY);
        return {
            x: (persp.x - this.x) * effectiveZoom,
            y: (persp.y - this.y) * effectiveZoom,
            scale: persp.scale
        };
    }
    
    // Override screenToWorld to use effective zoom
    screenToWorld(screenX, screenY) {
        const effectiveZoom = this.getEffectiveZoom();
        const perspX = screenX / effectiveZoom + this.x;
        const perspY = screenY / effectiveZoom + this.y;
        return this.perspectiveToWorld(perspX, perspY);
    }
    
    // Override followPlayer to use effective zoom
    followPlayer(player) {
        const worldPos = player.getWorldPosition();
        
        // Update perspective origin to player position (no smoothing)
        this.setPerspectiveOrigin(worldPos.x, worldPos.y);
        
        // Center camera exactly on player (no smoothing)
        const perspPos = this.worldToPerspective(worldPos.x, worldPos.y);
        const effectiveZoom = this.getEffectiveZoom();
        const zoomedWidth = this.viewportWidth / effectiveZoom;
        const zoomedHeight = this.viewportHeight / effectiveZoom;
        
        this.x = perspPos.x - zoomedWidth / 2;
        this.y = perspPos.y - zoomedHeight / 2;
    }
    
    // Override adjustZoom to use effective zoom
    adjustZoom(delta) {
        const oldZoom = this.zoom;
        
        // Get the current center point in world coordinates BEFORE zoom changes
        const centerScreenX = this.viewportWidth / 2;
        const centerScreenY = this.viewportHeight / 2;
        const centerWorld = this.screenToWorld(centerScreenX, centerScreenY);
        
        // Apply zoom change (user-facing zoom stays in 0.4-1.4 range)
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + delta));
        
        if (this.zoom !== oldZoom) {
            const effectiveZoom = this.getEffectiveZoom();
            
            // Calculate new viewport dimensions with new zoom
            const zoomedWidth = this.viewportWidth / effectiveZoom;
            const zoomedHeight = this.viewportHeight / effectiveZoom;
            
            // Apply perspective using the STABLE origin
            const centerPersp = this.applyPerspective(centerWorld.x, centerWorld.y);
            
            // Reposition camera so that centerWorld stays at screen center
            this.x = centerPersp.x - zoomedWidth / 2;
            this.y = centerPersp.y - zoomedHeight / 2;
        }
    }
    
    // Override isVisible to use effective zoom
    isVisible(worldX, worldY, margin = 0) {
        const effectiveZoom = this.getEffectiveZoom();
        const zoomedWidth = this.viewportWidth / effectiveZoom;
        const zoomedHeight = this.viewportHeight / effectiveZoom;
        const persp = this.worldToPerspective(worldX, worldY);
        
        return persp.x >= this.x - margin &&
               persp.x <= this.x + zoomedWidth + margin &&
               persp.y >= this.y - margin &&
               persp.y <= this.y + zoomedHeight + margin;
    }
    
    // Override getEffectiveTileSize to use effective zoom
    getEffectiveTileSize() {
        return Constants.TILE_SIZE * this.getEffectiveZoom();
    }
}
