// js/systems/InputHandler.js
class InputHandler {
    constructor(canvas, camera, world, player, pathfinding, scalingSystem) {
        this.canvas = canvas;
        this.camera = camera;
        this.world = world;
        this.player = player;
        this.pathfinding = pathfinding;
        this.scalingSystem = scalingSystem;
        
        // Mouse state
        this.mouse = {
            worldX: 0,
            worldY: 0,
            tileX: 0,
            tileY: 0,
            isDown: false,
            button: -1
        };
        
        // Keyboard state
        this.keys = {};
        
        // Touch support
        this.touch = {
            active: false,
            startX: 0,
            startY: 0
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Prevent right-click context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleMouseMove(event) {
        const screenCoords = { x: event.clientX, y: event.clientY };
        this.updateMousePosition(screenCoords);
    }
    
    updateMousePosition(screenCoords) {
        // Convert screen coordinates to game space
        const gameCoords = this.scalingSystem.screenToGame(screenCoords.x, screenCoords.y);
        
        // Convert to world coordinates
        const worldCoords = this.camera.screenToWorld(gameCoords.x, gameCoords.y);
        
        this.mouse.worldX = worldCoords.x;
        this.mouse.worldY = worldCoords.y;
        this.mouse.tileX = Math.floor(worldCoords.x / Constants.TILE_SIZE);
        this.mouse.tileY = Math.floor(worldCoords.y / Constants.TILE_SIZE);
    }
    
    handleMouseDown(event) {
        this.mouse.isDown = true;
        this.mouse.button = event.button;
        
        // Process click on mouse down (left button only)
        if (event.button === 0) {
            const screenCoords = { x: event.clientX, y: event.clientY };
            // Check if Ctrl is held for walking
            const forceWalk = event.ctrlKey;
            this.processClick(screenCoords, forceWalk);
        }
    }
    
    handleMouseUp(event) {
        this.mouse.isDown = false;
        this.mouse.button = -1;
    }
    
    processClick(screenCoords, forceWalk = false) {
        // Update mouse position
        this.updateMousePosition(screenCoords);
        
        let targetX = this.mouse.tileX;
        let targetY = this.mouse.tileY;
        
        // Check if clicked tile is within bounds
        if (!this.world.isInBounds(targetX, targetY)) {
            return;
        }
        
        // If clicked on non-walkable tile, find nearest walkable
        if (!this.world.isWalkable(targetX, targetY)) {
            const nearestWalkable = this.pathfinding.findNearestWalkable(
                targetX, targetY, 
                this.player.tileX, this.player.tileY
            );
            
            if (!nearestWalkable) {
                return; // No walkable tile found
            }
            
            targetX = nearestWalkable.x;
            targetY = nearestWalkable.y;
        }
        
        // Find path to target
        const path = this.pathfinding.findPath(
            this.player.tileX, this.player.tileY,
            targetX, targetY
        );
        
        // Set player path with walk override if Ctrl is held
        if (path.length > 1) {
            path.shift(); // Remove first element (current position)
            this.player.setPath(path, forceWalk);
        }
    }
    
    handleContextMenu(event) {
        event.preventDefault();
    }
    
    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // Handle specific key actions
        switch(event.code) {
            case 'Space':
            case 'KeyS':
                // Stop movement
                this.player.clearPath();
                break;
            case 'KeyR':
                // Toggle run/walk
                this.player.toggleRun();
                console.log(`Movement mode: ${this.player.running ? 'Running' : 'Walking'}`);
                break;
        }
    }
    
    handleKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    // Touch support for mobile
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.touch.active = true;
        this.touch.startX = touch.clientX;
        this.touch.startY = touch.clientY;
        
        this.updateMousePosition({ x: touch.clientX, y: touch.clientY });
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        if (!this.touch.active) return;
        
        const touch = event.touches[0];
        this.updateMousePosition({ x: touch.clientX, y: touch.clientY });
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        if (!this.touch.active) return;
        
        this.touch.active = false;
        
        // Process as a click (default to running on mobile)
        const touch = event.changedTouches[0];
        this.processClick({ x: touch.clientX, y: touch.clientY }, false);
    }
    
    // Check if a key is currently pressed
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    // Get current hovered tile
    getHoveredTile() {
        if (this.world.isInBounds(this.mouse.tileX, this.mouse.tileY)) {
            return { x: this.mouse.tileX, y: this.mouse.tileY };
        }
        return null;
    }
    
    // Clean up event listeners
    destroy() {
        // Remove all event listeners
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
        
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
}
