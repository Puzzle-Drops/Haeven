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
    
    // Render black background
    renderBackground() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        const overlap = Constants.TILE_OVERLAP;
        
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
    
    // Render tile highlights
    renderTileHighlights(player) {
        // Highlight current player tile
        this.renderTileHighlight(
            player.tileX,
            player.tileY,
            Constants.COLORS.CURRENT_TILE
        );
        
        // Highlight destination tile if different from current
        if (player.targetX !== player.tileX || player.targetY !== player.tileY) {
            this.renderTileHighlight(
                player.targetX,
                player.targetY,
                Constants.COLORS.DESTINATION_TILE
            );
        }
    }
    
    // Render a tile highlight border with perspective
    renderTileHighlight(tileX, tileY, color) {
        const tileSize = Constants.TILE_SIZE;
        
        // Get the four corners of the tile in world space
        const topLeft = { x: tileX * tileSize, y: tileY * tileSize };
        const topRight = { x: (tileX + 1) * tileSize, y: tileY * tileSize };
        const bottomLeft = { x: tileX * tileSize, y: (tileY + 1) * tileSize };
        const bottomRight = { x: (tileX + 1) * tileSize, y: (tileY + 1) * tileSize };
        
        // Convert to screen space
        const screenTL = this.camera.worldToScreen(topLeft.x, topLeft.y);
        const screenTR = this.camera.worldToScreen(topRight.x, topRight.y);
        const screenBL = this.camera.worldToScreen(bottomLeft.x, bottomLeft.y);
        const screenBR = this.camera.worldToScreen(bottomRight.x, bottomRight.y);
        
        // Draw highlight border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = Constants.MINIMAP.HIGHLIGHT_WIDTH;
        this.ctx.beginPath();
        this.ctx.moveTo(screenTL.x, screenTL.y);
        this.ctx.lineTo(screenTR.x, screenTR.y);
        this.ctx.lineTo(screenBR.x, screenBR.y);
        this.ctx.lineTo(screenBL.x, screenBL.y);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    // Render the player as a golden oval that scales with zoom
    renderPlayer(player) {
        const worldPos = player.getWorldPosition();
        const screenPos = this.camera.worldToScreen(worldPos.x, worldPos.y);
        
        // Scale player dot with effective zoom
        const effectiveZoom = this.camera.getEffectiveZoom();
        const scaledWidth = Constants.MINIMAP.PLAYER_WIDTH * effectiveZoom * 10;
        const scaledHeight = Constants.MINIMAP.PLAYER_HEIGHT * effectiveZoom * 10;
        
        // Draw golden oval (scales with zoom)
        this.ctx.fillStyle = Constants.MINIMAP.PLAYER_COLOR;
        this.ctx.beginPath();
        this.ctx.ellipse(
            screenPos.x,
            screenPos.y,
            scaledWidth,
            scaledHeight,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    // Render the path as white dashed line (remaining path only)
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
        this.renderBackground();
        this.renderWorld(world);
        this.renderTileHighlights(player);
        this.renderPath(player.path); // Changed from player.fullPath to player.path
        this.renderPlayer(player);
    }
}
