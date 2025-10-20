// js/world/World.js
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        
        this.generateWorld();
    }
    
    generateWorld() {
        // Initialize tile array
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Generate terrain
                const isWall = this.shouldBeWall(x, y);
                const color = this.getTileColor(x, y, isWall);
                this.tiles[y][x] = new Tile(x, y, !isWall, color);
            }
        }
    }
    
    shouldBeWall(x, y) {
        // Don't place walls at player start position
        if (x === Constants.PLAYER_START.X && y === Constants.PLAYER_START.Y) {
            return false;
        }
        
        // Random wall generation with 20% chance
        return Math.random() < 0.2;
    }
    
    getTileColor(x, y, isWall) {
        if (isWall) {
            return Constants.COLORS.WALL;
        }
        
        // Vary ground colors slightly for visual interest
        const hue = 120; // Green
        const saturation = 20;
        const lightness = 35 + Math.random() * 10;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    getTile(x, y) {
        if (this.isInBounds(x, y)) {
            return this.tiles[y][x];
        }
        return null;
    }
    
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile && tile.walkable;
    }
    
    isBlocked(x, y) {
        const tile = this.getTile(x, y);
        return !tile || tile.isBlocked();
    }
    
    // Get all tiles in a rectangular area
    getTilesInArea(startX, startY, endX, endY) {
        const tiles = [];
        for (let y = startY; y <= endY && y < this.height; y++) {
            for (let x = startX; x <= endX && x < this.width; x++) {
                if (this.isInBounds(x, y)) {
                    tiles.push(this.tiles[y][x]);
                }
            }
        }
        return tiles;
    }
    
    // Get adjacent tiles (orthogonal only)
    getAdjacentTiles(x, y) {
        const adjacent = [];
        const offsets = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }  // West
        ];
        
        for (const offset of offsets) {
            const adjX = x + offset.x;
            const adjY = y + offset.y;
            const tile = this.getTile(adjX, adjY);
            if (tile) {
                adjacent.push(tile);
            }
        }
        
        return adjacent;
    }
    
    // Get all neighbors including diagonals
    getAllNeighbors(x, y) {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const tile = this.getTile(x + dx, y + dy);
                if (tile) {
                    neighbors.push(tile);
                }
            }
        }
        return neighbors;
    }
}
