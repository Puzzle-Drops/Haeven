// js/systems/Pathfinding.js
class Pathfinding {
    constructor(world) {
        this.world = world;
    }
    
    // Main pathfinding using Dijkstra's algorithm
    findPath(startX, startY, endX, endY) {
        // Check if start and end are valid
        if (!this.world.isInBounds(startX, startY) || 
            !this.world.isInBounds(endX, endY)) {
            return [];
        }
        
        // Check if destination is walkable
        if (!this.world.isWalkable(endX, endY)) {
            return [];
        }
        
        const dist = {};
        const prev = {};
        const unvisited = new Set();
        
        // Initialize
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                const key = `${x},${y}`;
                dist[key] = Infinity;
                prev[key] = null;
                if (this.world.isWalkable(x, y)) {
                    unvisited.add(key);
                }
            }
        }
        
        const startKey = `${startX},${startY}`;
        dist[startKey] = 0;
        
        while (unvisited.size > 0) {
            // Find minimum distance node
            let minDist = Infinity;
            let current = null;
            
            for (const node of unvisited) {
                if (dist[node] < minDist) {
                    minDist = dist[node];
                    current = node;
                }
            }
            
            if (current === null || minDist === Infinity) break;
            
            const [cx, cy] = current.split(',').map(Number);
            
            // Check if we reached the destination
            if (cx === endX && cy === endY) break;
            
            unvisited.delete(current);
            
            // Check all 8 neighbors
            const neighbors = this.getValidNeighbors(cx, cy);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const alt = dist[current] + neighbor.cost;
                
                if (alt < dist[neighborKey]) {
                    dist[neighborKey] = alt;
                    prev[neighborKey] = current;
                }
            }
        }
        
        // Reconstruct path
        return this.reconstructPath(prev, startX, startY, endX, endY);
    }
    
    // Get valid neighbors for pathfinding
    getValidNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: -1, dy: -1, cost: Math.sqrt(2) }, // NW
            { dx: 0, dy: -1, cost: 1 },              // N
            { dx: 1, dy: -1, cost: Math.sqrt(2) },   // NE
            { dx: -1, dy: 0, cost: 1 },              // W
            { dx: 1, dy: 0, cost: 1 },               // E
            { dx: -1, dy: 1, cost: Math.sqrt(2) },   // SW
            { dx: 0, dy: 1, cost: 1 },               // S
            { dx: 1, dy: 1, cost: Math.sqrt(2) }     // SE
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            // Check bounds and walkability
            if (!this.world.isWalkable(nx, ny)) continue;
            
            // For diagonal movement, check that we're not cutting corners
            if (dir.dx !== 0 && dir.dy !== 0) {
                if (!this.world.isWalkable(x + dir.dx, y) || 
                    !this.world.isWalkable(x, y + dir.dy)) {
                    continue;
                }
            }
            
            neighbors.push({ x: nx, y: ny, cost: dir.cost });
        }
        
        return neighbors;
    }
    
    // Reconstruct path from prev array
    reconstructPath(prev, startX, startY, endX, endY) {
        const path = [];
        let current = `${endX},${endY}`;
        const startKey = `${startX},${startY}`;
        
        if (prev[current] !== null || current === startKey) {
            while (current !== null) {
                const [x, y] = current.split(',').map(Number);
                path.unshift({ x, y });
                current = prev[current];
            }
        }
        
        return path;
    }
    
    // Get tiles along a line (for click fallback)
    getTilesOnLine(x0, y0, x1, y1, maxTiles = 5) {
        const tiles = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x1; // Start from end point
        let y = y1;
        
        while ((x !== x0 || y !== y0) && tiles.length < maxTiles) {
            // Add tile if it's within bounds
            if (this.world.isInBounds(x, y)) {
                tiles.push({ x, y });
            }
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x -= sx; // Move backwards toward start
            }
            if (e2 < dx) {
                err += dx;
                y -= sy; // Move backwards toward start
            }
        }
        
        return tiles;
    }
    
    // Find nearest walkable tile to a non-walkable target
    findNearestWalkable(targetX, targetY, playerX, playerY) {
        // First, check adjacent tiles
        const adjacentOffsets = [
            { dx: 0, dy: -1 }, // North
            { dx: 1, dy: 0 },  // East
            { dx: 0, dy: 1 },  // South
            { dx: -1, dy: 0 }  // West
        ];
        
        const walkableAdjacent = [];
        
        for (const offset of adjacentOffsets) {
            const adjX = targetX + offset.dx;
            const adjY = targetY + offset.dy;
            
            if (this.world.isWalkable(adjX, adjY)) {
                const dist = Math.sqrt(
                    Math.pow(adjX - playerX, 2) + 
                    Math.pow(adjY - playerY, 2)
                );
                walkableAdjacent.push({ x: adjX, y: adjY, distance: dist });
            }
        }
        
        // If we found walkable adjacent tiles, use the closest one
        if (walkableAdjacent.length > 0) {
            walkableAdjacent.sort((a, b) => a.distance - b.distance);
            return { x: walkableAdjacent[0].x, y: walkableAdjacent[0].y };
        }
        
        // No adjacent walkable tiles, check line to player
        const tilesOnLine = this.getTilesOnLine(
            playerX, playerY, targetX, targetY, 
            Constants.PATHFINDING_LINE_CHECK
        );
        
        for (const tile of tilesOnLine) {
            if (this.world.isWalkable(tile.x, tile.y)) {
                return tile;
            }
        }
        
        return null; // No walkable tile found
    }
}
