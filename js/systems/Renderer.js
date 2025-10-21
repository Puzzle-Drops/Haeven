// js/systems/Renderer.js
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size to fixed resolution
        this.canvas.width = Constants.RESOLUTION.WIDTH;
        this.canvas.height = Constants.RESOLUTION.HEIGHT;
        
        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Render layers
        this.layers = {
            background: 0,
            terrain: 1,
            items: 2,
            entities: 3,
            effects: 4,
            ui: 5
        };
    }
    
    // Clear the entire canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Render the game world with isometric projection
    renderWorld(world, camera, hoveredTile = null) {
        const visible = camera.getVisibleTiles();
        
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
        
        // Sort tiles for proper isometric drawing order (back to front)
        // In isometric, tiles with smaller (x + y) are further back
        tilesToRender.sort((a, b) => {
            const sumA = a.x + a.y;
            const sumB = b.x + b.y;
            return sumA - sumB;
        });
        
        // Render sorted tiles
        for (const tile of tilesToRender) {
            this.renderTile(tile, camera, hoveredTile);
        }
    }
    
    // Render a single tile in isometric projection
    renderTile(tile, camera, hoveredTile) {
        const tileSize = Constants.TILE_SIZE;
        const tileHeight = Constants.ISOMETRIC.TILE_HEIGHT;
        
        // Get the four corners of the tile in world space
        const topLeft = { x: tile.x * tileSize, y: tile.y * tileSize };
        const topRight = { x: (tile.x + 1) * tileSize, y: tile.y * tileSize };
        const bottomLeft = { x: tile.x * tileSize, y: (tile.y + 1) * tileSize };
        const bottomRight = { x: (tile.x + 1) * tileSize, y: (tile.y + 1) * tileSize };
        
        // Convert to screen space
        const screenTL = camera.worldToScreen(topLeft.x, topLeft.y);
        const screenTR = camera.worldToScreen(topRight.x, topRight.y);
        const screenBL = camera.worldToScreen(bottomLeft.x, bottomLeft.y);
        const screenBR = camera.worldToScreen(bottomRight.x, bottomRight.y);
        
        // Draw isometric tile as a parallelogram
        this.ctx.fillStyle = tile.getDisplayColor();
        this.ctx.beginPath();
        this.ctx.moveTo(screenTL.x, screenTL.y);
        this.ctx.lineTo(screenTR.x, screenTR.y);
        this.ctx.lineTo(screenBR.x, screenBR.y);
        this.ctx.lineTo(screenBL.x, screenBL.y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw tile border
        this.ctx.strokeStyle = Constants.COLORS.TILE_BORDER;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw hover effect
        if (hoveredTile && tile.x === hoveredTile.x && tile.y === hoveredTile.y && tile.walkable) {
            this.ctx.fillStyle = Constants.COLORS.HOVER;
            this.ctx.beginPath();
            this.ctx.moveTo(screenTL.x, screenTL.y);
            this.ctx.lineTo(screenTR.x, screenTR.y);
            this.ctx.lineTo(screenBR.x, screenBR.y);
            this.ctx.lineTo(screenBL.x, screenBL.y);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    // Render tile highlights
    renderTileHighlights(player, camera) {
        // Highlight current player tile
        this.renderTileHighlight(
            player.tileX, 
            player.tileY, 
            Constants.COLORS.CURRENT_TILE, 
            camera
        );
        
        // Highlight destination tile if different from current
        if (player.targetX !== player.tileX || player.targetY !== player.tileY) {
            this.renderTileHighlight(
                player.targetX, 
                player.targetY, 
                Constants.COLORS.DESTINATION_TILE, 
                camera
            );
        }
    }
    
    // Render a tile highlight border in isometric
    renderTileHighlight(tileX, tileY, color, camera) {
        const tileSize = Constants.TILE_SIZE;
        
        // Get the four corners of the tile in world space
        const topLeft = { x: tileX * tileSize, y: tileY * tileSize };
        const topRight = { x: (tileX + 1) * tileSize, y: tileY * tileSize };
        const bottomLeft = { x: tileX * tileSize, y: (tileY + 1) * tileSize };
        const bottomRight = { x: (tileX + 1) * tileSize, y: (tileY + 1) * tileSize };
        
        // Convert to screen space
        const screenTL = camera.worldToScreen(topLeft.x, topLeft.y);
        const screenTR = camera.worldToScreen(topRight.x, topRight.y);
        const screenBL = camera.worldToScreen(bottomLeft.x, bottomLeft.y);
        const screenBR = camera.worldToScreen(bottomRight.x, bottomRight.y);
        
        // Draw highlight border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(screenTL.x, screenTL.y);
        this.ctx.lineTo(screenTR.x, screenTR.y);
        this.ctx.lineTo(screenBR.x, screenBR.y);
        this.ctx.lineTo(screenBL.x, screenBL.y);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    // Render the player as a vertical circle (Paper Mario style)
    renderPlayer(player, camera) {
        const worldPos = player.getWorldPosition();
        
        // Get the base position on the ground
        const baseScreen = camera.worldToScreen(worldPos.x, worldPos.y);
        
        // Offset upward to make player appear vertical/standing
        const playerHeight = Constants.ISOMETRIC.PLAYER_HEIGHT * camera.zoom;
        const yOffset = Constants.ISOMETRIC.PLAYER_Y_OFFSET * camera.zoom;
        
        const playerScreen = {
            x: baseScreen.x,
            y: baseScreen.y - playerHeight + yOffset
        };
        
        const radius = player.radius * camera.zoom;
        
        // Draw player circle (vertical/standing)
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(
            playerScreen.x, 
            playerScreen.y, 
            radius, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw player outline
        this.ctx.strokeStyle = player.outlineColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw a simple shadow on the ground for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            baseScreen.x,
            baseScreen.y,
            radius * 0.8,
            radius * 0.4,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    // Render the path (for debugging)
    renderPath(path, camera) {
        if (!path || path.length === 0) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const worldX = path[i].x * Constants.TILE_SIZE + Constants.TILE_SIZE / 2;
            const worldY = path[i].y * Constants.TILE_SIZE + Constants.TILE_SIZE / 2;
            const screenPos = camera.worldToScreen(worldX, worldY);
            
            if (i === 0) {
                this.ctx.moveTo(screenPos.x, screenPos.y);
            } else {
                this.ctx.lineTo(screenPos.x, screenPos.y);
            }
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Render debug info
    renderDebugInfo(info) {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        for (const [key, value] of Object.entries(info)) {
            this.ctx.fillText(`${key}: ${value}`, 10, y);
            y += 15;
        }
    }
    
    // Main render method
    render(world, player, camera, hoveredTile = null, debug = false) {
        // Clear canvas
        this.clear();
        
        // Render layers
        this.renderWorld(world, camera, hoveredTile);
        this.renderTileHighlights(player, camera);
        this.renderPlayer(player, camera);
        
        // Optional debug rendering
        if (debug) {
            this.renderPath(player.path, camera);
            this.renderDebugInfo({
                'Player Pos': `${player.tileX}, ${player.tileY}`,
                'Animation': `${player.animX.toFixed(2)}, ${player.animY.toFixed(2)}`,
                'Path Length': player.path.length,
                'Target': `${player.targetX}, ${player.targetY}`,
                'Zoom': `${(camera.zoom * 100).toFixed(0)}%`
            });
        }
    }
}
