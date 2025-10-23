// js/world/World.js
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.loaded = false;
    }
    
    async loadFromJSON(jsonPath = 'world.json') {
        try {
            console.log('Loading world from JSON...');
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load world data: ${response.statusText}`);
            }
            
            const worldData = await response.json();
            
            // Validate world data
            if (!worldData.metadata || !worldData.tileTypes || !worldData.terrain) {
                throw new Error('Invalid world data format');
            }
            
            // Set dimensions from metadata
            this.width = worldData.metadata.width;
            this.height = worldData.metadata.height;
            
            // Store tile type definitions
            this.tileTypes = worldData.tileTypes;
            
            // Generate world from terrain data
            this.generateFromData(worldData.terrain);
            
            this.loaded = true;
            console.log(`World loaded: ${this.width}x${this.height} tiles`);
            
            return worldData.metadata;
        } catch (error) {
            console.error('Error loading world:', error);
            throw error;
        }
    }
    
    generateFromData(terrainData) {
        // Initialize tile array
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Get tile type from data (or default to grass)
                const tileTypeName = terrainData[y] && terrainData[y][x] !== '...' ? terrainData[y][x] : 'grass';
                const tileType = this.tileTypes[tileTypeName] || this.tileTypes['grass'];
                
                // Create tile with type properties
                this.tiles[y][x] = new Tile(x, y, tileType.walkable, tileType.color);
            }
        }
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
