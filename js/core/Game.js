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
            if (event.code === 'KeyR') {
                this.resetPlayer();
            }
        });
    }
    
    // Game tick (fixed timestep logic)
    tick(deltaTime) {
        if (this.paused) return;
        
        // Process player movement
        this.player.processTick();
        
        // Update world state (future: NPCs, time-based events)
        // this.world.update(deltaTime);
    }
    
    // Update (animation and interpolation)
    update(deltaTime) {
        if (this.paused) return;
        
        // Update player animation
        this.player.updateAnimation(deltaTime);
        
        // Update camera to follow player
        this.camera.followPlayer(this.player);
        
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
    
    // Draw FPS counter
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
        `FPS: ${this.gameLoop.getFPS()}`,
        this.canvas.width - 10,
        30
    );
    
    // Draw movement mode indicator
    ctx.textAlign = 'left';
    ctx.fillStyle = this.player.running ? '#00ff00' : '#ffff00';
    ctx.fillText(
        `Mode: ${this.player.running ? 'Running' : 'Walking'}`,
        10,
        30
    );
    
    // Draw controls help
    ctx.fillStyle = '#00ff00';
    ctx.fillText('Controls:', 10, this.canvas.height - 90);
    ctx.fillText('Click - Move (run)', 10, this.canvas.height - 70);
    ctx.fillText('Ctrl+Click - Move (walk)', 10, this.canvas.height - 50);
    ctx.fillText('S - Stop moving | R - Toggle run/walk', 10, this.canvas.height - 30);
    ctx.fillText('P - Pause | Shift+D - Debug', 10, this.canvas.height - 10);
}
    
    // Start the game
    start() {
        console.log('Starting Tile-Based RPG...');
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
