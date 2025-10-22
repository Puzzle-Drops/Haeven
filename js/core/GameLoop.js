// js/core/GameLoop.js
class GameLoop {
    constructor(tickRate = Constants.TICK_RATE, targetFPS = Constants.TARGET_FPS) {
        this.tickRate = tickRate;
        this.targetFPS = targetFPS;
        this.frameTime = 1000 / targetFPS;
        
        // Timing variables
        this.lastTime = 0;
        this.tickAccumulator = 0;
        this.frameAccumulator = 0;
        
        // Tick counter
        this.currentTick = 0;
        
        // Callbacks
        this.onTick = null;
        this.onUpdate = null;
        this.onRender = null;
        
        // Performance tracking
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // Loop state
        this.running = false;
        this.animationId = null;
        
        // Bind the loop function
        this.loop = this.loop.bind(this);
    }
    
    // Set callback functions
    setCallbacks(onTick, onUpdate, onRender) {
        this.onTick = onTick;
        this.onUpdate = onUpdate;
        this.onRender = onRender;
    }
    
    // Start the game loop
    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.fpsUpdateTime = this.lastTime;
        this.currentTick = 0;
        this.animationId = requestAnimationFrame(this.loop);
    }
    
    // Stop the game loop
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // Main loop function
    loop(currentTime) {
        if (!this.running) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Fixed timestep for game logic (ticks)
        this.tickAccumulator += deltaTime;
        while (this.tickAccumulator >= this.tickRate) {
            if (this.onTick) {
                this.onTick(this.tickRate);
            }
            this.tickAccumulator -= this.tickRate;
            this.currentTick++;
        }
        
        // Frame rate limiting for rendering
        this.frameAccumulator += deltaTime;
        if (this.frameAccumulator >= this.frameTime) {
            // Calculate tick progress (0-1 within current tick)
            const tickProgress = this.getTickProgress();
            
            // Update animations and other frame-dependent logic
            if (this.onUpdate) {
                this.onUpdate(this.frameAccumulator, tickProgress);
            }
            
            // Render
            if (this.onRender) {
                this.onRender();
            }
            
            // Update FPS counter
            this.frameCount++;
            
            // Reset frame accumulator
            this.frameAccumulator = this.frameAccumulator % this.frameTime;
        }
        
        // Update FPS display every second
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
        
        // Continue loop
        this.animationId = requestAnimationFrame(this.loop);
    }
    
    // Get current FPS
    getFPS() {
        return this.fps;
    }
    
    // Get current tick number
    getCurrentTick() {
        return this.currentTick;
    }
    
    // Get tick progress (0-1)
    getTickProgress() {
        return this.tickAccumulator / this.tickRate;
    }
    
    // Get frame progress (0-1)
    getFrameProgress() {
        return this.frameAccumulator / this.frameTime;
    }
    
    // Check if running
    isRunning() {
        return this.running;
    }
    
    // Pause the game loop
    pause() {
        this.running = false;
    }
    
    // Resume the game loop
    resume() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame(this.loop);
        }
    }
    
    // Reset timing accumulators
    reset() {
        this.tickAccumulator = 0;
        this.frameAccumulator = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.currentTick = 0;
    }
}
