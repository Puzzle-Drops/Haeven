// js/core/Game.js
class Game {
    constructor() {
        // Get canvas element
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Core systems
        this.scalingSystem = new ScalingSystem();
        this.world = null;
        this.player = null;
        this.camera = null;
        this.renderer = null;
        this.pathfinding = null;
        this.inputHandler = null;
        this.gameLoop = null;
        
        // Game state
        this.debugMode = false;
        this.paused = false;
        
        // Initialize all systems
        this.initialize();
    }
    
    initialize() {
        // Initialize scaling system
        this.scalingSystem.initialize();
        
        // Create world
        this.world = new World(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT);
        
        // Create player at start position
        this.player = new Player(Constants.PLAYER_START.X, Constants.PLAYER_START.Y);
        
        // Create camera
        this.camera = new Camera(
            Constants.RESOLUTION.WIDTH,
            Constants.RESOLUTION.HEIGHT
        );
        
        // Initialize perspective origin to player position
        const playerWorldPos = this.player.getWorldPosition();
        this.camera.setPerspectiveOrigin(playerWorldPos.x, playerWorldPos.y);
        
        // Immediately center camera on player (no smooth follow on init)
        const zoomedWidth = this.camera.viewportWidth / this.camera.zoom;
        const zoomedHeight = this.camera.viewportHeight / this.camera.zoom;
        this.camera.x = playerWorldPos.x - zoomedWidth / 2;
        this.camera.y = playerWorldPos.y - zoomedHeight / 2;
        
        // Create renderer
        this.renderer = new Renderer(this.canvas);
        
        // Create pathfinding system
        this.pathfinding = new Pathfinding(this.world);
        
        // Create input handler
        this.inputHandler = new InputHandler(
            this.canvas,
            this.camera,
            this.world,
            this.player,
            this.pathfinding,
            this.scalingSystem
        );
        
        // Create game loop
        this.gameLoop = new GameLoop();
        this.gameLoop.setCallbacks(
            this.tick.bind(this),
            this.update.bind(this),
            this.render.bind(this)
        );
        
        // Set up additional event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Debug mode toggle
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyD' && event.shiftKey) {
                this.debugMode = !this.debugMode;
                console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
            }
            
            // Pause toggle
            if (event.code === 'KeyP') {
                this.togglePause();
            }
            
            // Reset player position
            if (event.code === 'KeyR' && event.shiftKey) {
                this.resetPlayer();
            }
        });
    }
    
    // Game tick (fixed timestep logic)
    tick(deltaTime) {
        if (this.paused) return;
        
        // Check if player destination has changed - if so, recalculate path
        if (this.player.hasDestinationChanged()) {
            this.recalculatePlayerPath();
        }
        
        // Process player movement
        this.player.processTick();
        
        // Update world state (future: NPCs, time-based events)
        // this.world.update(deltaTime);
    }
    
    // Recalculate path when destination changes
    recalculatePlayerPath() {
        const targetX = this.player.targetX;
        const targetY = this.player.targetY;
        
        // Find path from current LOGICAL position to target
        const path = this.pathfinding.findPath(
            this.player.tileX,
            this.player.tileY,
            targetX,
            targetY
        );
        
        // Set the new path
        if (path.length > 1) {
            path.shift(); // Remove first element (current position)
            this.player.setPathFromPathfinding(path, this.player.forceWalk);
        } else {
            // No valid path or already at destination
            this.player.lastProcessedTargetX = this.player.tileX;
            this.player.lastProcessedTargetY = this.player.tileY;
        }
    }
    
    // Update (animation and interpolation)
    update(deltaTime) {
        if (this.paused) return;
        
        // Update player animation
        this.player.updateAnimation(deltaTime);
        
        // Update camera to follow player
        this.camera.followPlayer(this.player);
        
        // Recalculate hover tile based on current camera/zoom (every frame)
        this.inputHandler.updateHoverTile();
        
        // Update tile effects (future)
        // this.world.updateEffects(deltaTime);
    }
    
    // Render the game
    render() {
        // Get hovered tile from input handler
        const hoveredTile = this.inputHandler.getHoveredTile();
        
        // Render everything
        this.renderer.render(
            this.world,
            this.player,
            this.camera,
            hoveredTile,
            this.debugMode
        );
        
        // Render additional debug info if enabled
        if (this.debugMode) {
            this.renderDebugOverlay();
        }
    }
    
    renderDebugOverlay() {
        const ctx = this.renderer.ctx;
        
        // Set up text rendering
        ctx.font = '16px monospace';
        const lineHeight = 20;
        let yPos = 20;
        
        // Draw FPS counter (top right)
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'right';
        ctx.fillText(
            `FPS: ${this.gameLoop.getFPS()}`,
            this.canvas.width - 10,
            yPos
        );
        
        // Switch to left-aligned for rest of debug info
        ctx.textAlign = 'left';
        
        // Draw movement mode indicator
        ctx.fillStyle = this.player.running ? '#00ff00' : '#ffff00';
        ctx.fillText(
            `Mode: ${this.player.running ? 'RUNNING' : 'WALKING'}`,
            10,
            yPos
        );
        yPos += lineHeight;
        
        // Draw position info
        ctx.fillStyle = '#00ff00';
        ctx.fillText(
            `Logical: ${this.player.tileX}, ${this.player.tileY} | Anim: ${this.player.animX.toFixed(2)}, ${this.player.animY.toFixed(2)}`,
            10,
            yPos
        );
        yPos += lineHeight;
        
        // Draw path info
        if (this.player.isMoving()) {
            ctx.fillText(
                `Path: ${this.player.path.length} tiles | Anim: ${this.player.animationWaypoints.length} waypoints`,
                10,
                yPos
            );
            yPos += lineHeight;
            ctx.fillText(
                `Pending: ${this.player.pendingWaypoints.length} waypoints`,
                10,
                yPos
            );
            yPos += lineHeight;
        }
        
        // Draw perspective origin info
        ctx.fillText(
            `Persp Origin: ${this.camera.perspectiveOriginX.toFixed(1)}, ${this.camera.perspectiveOriginY.toFixed(1)}`,
            10,
            yPos
        );
        yPos += lineHeight;
        
        // Draw zoom info
        ctx.fillText(
            `Zoom: ${(this.camera.zoom * 100).toFixed(0)}%`,
            10,
            yPos
        );
        
        // Draw controls help (bottom left)
        yPos = this.canvas.height - 110;
        ctx.fillText('Controls:', 10, yPos);
        yPos += lineHeight;
        ctx.fillText('Left Click - Move (run mode)', 10, yPos);
        yPos += lineHeight;
        ctx.fillText('Ctrl+Click - Move (force walk)', 10, yPos);
        yPos += lineHeight;
        ctx.fillText('S - Stop moving', 10, yPos);
        yPos += lineHeight;
        ctx.fillText('R - Toggle run/walk mode', 10, yPos);
        yPos += lineHeight;
        ctx.fillText('P - Pause | Shift+R - Reset | Shift+D - Debug', 10, yPos);
    }
    
    // Start the game
    start() {
        console.log('Starting Tile-Based RPG...');
        console.log('Movement mode: RUNNING (press R to toggle)');
        this.gameLoop.start();
    }
    
    // Stop the game
    stop() {
        console.log('Stopping game...');
        this.gameLoop.stop();
    }
    
    // Toggle pause
    togglePause() {
        this.paused = !this.paused;
        console.log(`Game ${this.paused ? 'paused' : 'resumed'}`);
        
        if (this.paused) {
            this.gameLoop.pause();
        } else {
            this.gameLoop.resume();
        }
    }
    
    // Reset player position
    resetPlayer() {
        this.player.clearPath();
        this.player.tileX = Constants.PLAYER_START.X;
        this.player.tileY = Constants.PLAYER_START.Y;
        this.player.animX = Constants.PLAYER_START.X;
        this.player.animY = Constants.PLAYER_START.Y;
        this.player.targetX = Constants.PLAYER_START.X;
        this.player.targetY = Constants.PLAYER_START.Y;
        this.player.lastProcessedTargetX = Constants.PLAYER_START.X;
        this.player.lastProcessedTargetY = Constants.PLAYER_START.Y;
        
        // Reset perspective origin to player position
        const playerWorldPos = this.player.getWorldPosition();
        this.camera.setPerspectiveOrigin(playerWorldPos.x, playerWorldPos.y);
        
        console.log('Player position reset');
    }
    
    // Clean up and destroy game
    destroy() {
        this.gameLoop.stop();
        this.inputHandler.destroy();
        this.scalingSystem.destroy();
        console.log('Game destroyed');
    }
}
