// js/systems/MinimapRenderer.js
class MinimapRenderer {
    constructor(canvas, minimapCamera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = minimapCamera;
        
        // Set canvas size
        this.canvas.width = Constants.MINIMAP.WIDTH;
        this.canvas.height = Constants.MINIMAP.HEIGHT;
        
        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Render the minimap world (same as main renderer but on minimap canvas)
    renderWorld(world) {
        const visible = this.camera.getVisibleTiles();
        
        // Collect all tiles that need rendering
        const tilesToRender = [];
        for (let y = visible.startY; y < visible.endY; y++) {
            for (let x = visible.startX; x < visible.endX; x++) {
                const tile = world.getTile(x, y);
                if (tile) {
                    tilesToRender.push(tile);
                }
            }
        }
        
        // Sort tiles for proper depth (back to front)
        tilesToRender.sort((a, b) => a.y - b.y);
        
        // Render sorted tiles
        for (const tile of tilesToRender) {
            this.renderTile(tile);
        }
    }
    
    // Render a single tile with perspective projection
    renderTile(tile) {
        const tileSize = Constants.TILE_SIZE;
        const overlap = 0.5;
        
        // Get the four corners of the tile in world space with overlap
        const topLeft = { x: tile.x * tileSize - overlap, y: tile.y * tileSize - overlap };
        const topRight = { x: (tile.x + 1) * tileSize + overlap, y: tile.y * tileSize - overlap };
        const bottomLeft = { x: tile.x * tileSize - overlap, y: (tile.y + 1) * tileSize + overlap };
        const bottomRight = { x: (tile.x + 1) * tileSize + overlap, y: (tile.y + 1) * tileSize + overlap };
        
        // Convert to screen space (with perspective scaling)
        const screenTL = this.camera.worldToScreen(topLeft.x, topLeft.y);
        const screenTR = this.camera.worldToScreen(topRight.x, topRight.y);
        const screenBL = this.camera.worldToScreen(bottomLeft.x, bottomLeft.y);
        const screenBR = this.camera.worldToScreen(bottomRight.x, bottomRight.y);
        
        // Draw tile as a trapezoid
        this.ctx.fillStyle = tile.getDisplayColor();
        this.ctx.beginPath();
        this.ctx.moveTo(screenTL.x, screenTL.y);
        this.ctx.lineTo(screenTR.x, screenTR.y);
        this.ctx.lineTo(screenBR.x, screenBR.y);
        this.ctx.lineTo(screenBL.x, screenBL.y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // Render the player as a golden oval in the center
    renderPlayer(player) {
        const worldPos = player.getWorldPosition();
        const screenPos = this.camera.worldToScreen(worldPos.x, worldPos.y);
        
        // Draw golden oval (2px wide x 4px tall)
        this.ctx.fillStyle = Constants.MINIMAP.PLAYER_COLOR;
        this.ctx.beginPath();
        this.ctx.ellipse(
            screenPos.x,
            screenPos.y,
            2, // width radius
            4, // height radius
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    // Render the path as white dashed line
    renderPath(path) {
        if (!path || path.length === 0) return;
        
        this.ctx.strokeStyle = Constants.MINIMAP.PATH_COLOR;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const worldX = path[i].x * Constants.TILE_SIZE + Constants.TILE_SIZE / 2;
            const worldY = path[i].y * Constants.TILE_SIZE + Constants.TILE_SIZE / 2;
            const screenPos = this.camera.worldToScreen(worldX, worldY);
            
            if (i === 0) {
                this.ctx.moveTo(screenPos.x, screenPos.y);
            } else {
                this.ctx.lineTo(screenPos.x, screenPos.y);
            }
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Main render method
    render(world, player) {
        this.clear();
        this.renderWorld(world);
        this.renderPath(player.fullPath);
        this.renderPlayer(player);
    }
}
