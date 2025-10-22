// js/systems/MinimapCamera.js
class MinimapCamera extends Camera {
    constructor(viewportWidth, viewportHeight) {
        super(viewportWidth, viewportHeight);
        
        // Minimap always centers on player animation position
        // No smoothing - instant following for responsiveness
        this.smoothing = false;
        
        // Use same default zoom as main camera
        this.zoom = 0.8;
    }
    
    // Override followPlayer to center exactly on player animation position
    followPlayer(player) {
        const worldPos = player.getWorldPosition();
        
        // Update perspective origin to player position (no smoothing)
        this.setPerspectiveOrigin(worldPos.x, worldPos.y);
        
        // Center camera exactly on player (no smoothing)
        const perspPos = this.worldToPerspective(worldPos.x, worldPos.y);
        const zoomedWidth = this.viewportWidth / this.zoom;
        const zoomedHeight = this.viewportHeight / this.zoom;
        
        this.x = perspPos.x - zoomedWidth / 2;
        this.y = perspPos.y - zoomedHeight / 2;
    }
}
