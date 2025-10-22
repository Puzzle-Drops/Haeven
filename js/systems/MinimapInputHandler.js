// js/systems/MinimapInputHandler.js
class MinimapInputHandler {
    constructor(canvas, minimapCamera, world, player, pathfinding, scalingSystem) {
        this.canvas = canvas;
        this.camera = minimapCamera;
        this.world = world;
        this.player = player;
        this.pathfinding = pathfinding;
        this.scalingSystem = scalingSystem;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Mouse down for click and right-click reset
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }
    
    handleWheel(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Adjust minimap zoom
        const zoomDelta = -event.deltaY * this.camera.zoomSpeed;
        this.camera.adjustZoom(zoomDelta);
    }
    
    handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Right mouse button (button 2) - reset zoom
        if (event.button === 2) {
            this.camera.zoom = Constants.MINIMAP.DEFAULT_ZOOM;
            console.log(`Minimap zoom reset to ${Constants.MINIMAP.DEFAULT_ZOOM} (${this.camera.getEffectiveZoom()} effective)`);
            return;
        }
        
        // Left mouse button (button 0) - move player
        if (event.button === 0) {
            this.handleClick(event);
        }
    }
    
    handleClick(event) {
        // Get click position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // Convert to game space (account for scaling)
        const gameCoords = this.scalingSystem.screenToGame(event.clientX, event.clientY);
        
        // Adjust for minimap position within game space
        const minimapX = gameCoords.x - (Constants.RESOLUTION.WIDTH - Constants.MINIMAP.WIDTH);
        const minimapY = gameCoords.y;
        
        // Convert to world coordinates
        const worldCoords = this.camera.screenToWorld(minimapX, minimapY);
        
        // Convert to tile coordinates
        const tileX = Math.floor(worldCoords.x / Constants.TILE_SIZE);
        const tileY = Math.floor(worldCoords.y / Constants.TILE_SIZE);
        
        // Check if clicked tile is within bounds
        if (!this.world.isInBounds(tileX, tileY)) {
            return;
        }
        
        let targetX = tileX;
        let targetY = tileY;
        
        // If clicked on non-walkable tile, find nearest walkable
        if (!this.world.isWalkable(targetX, targetY)) {
            const nearestWalkable = this.pathfinding.findNearestWalkable(
                targetX, targetY,
                this.player.tileX, this.player.tileY
            );
            
            if (!nearestWalkable) {
                return;
            }
            
            targetX = nearestWalkable.x;
            targetY = nearestWalkable.y;
        }
        
        // Set player destination
        this.player.setDestination(targetX, targetY, false);
        console.log(`Minimap click: moving to (${targetX}, ${targetY})`);
    }
    
    handleContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    destroy() {
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    }
}
