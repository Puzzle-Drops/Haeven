// js/world/Tile.js
class Tile {
    constructor(x, y, walkable = true, color = null) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        
        // Set color based on walkability if not provided
        if (color) {
            this.color = color;
        } else {
            this.color = walkable ? Constants.COLORS.GROUND_BASE : Constants.COLORS.WALL;
        }
        
        // Additional properties for future expansion
        this.items = [];
        this.entity = null;
        this.effects = [];
    }
    
    // Check if tile blocks movement
    isBlocked() {
        return !this.walkable || this.entity !== null;
    }
    
    // Get display color (can be modified by effects)
    getDisplayColor() {
        // Could be modified by lighting, fog of war, etc.
        return this.color;
    }
    
    // Add an item to this tile
    addItem(item) {
        this.items.push(item);
    }
    
    // Remove an item from this tile
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }
    
    // Set entity occupying this tile
    setEntity(entity) {
        this.entity = entity;
    }
    
    // Clear entity from this tile
    clearEntity() {
        this.entity = null;
    }
    
    // Add visual effect
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    // Clear expired effects
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.duration -= deltaTime;
            return effect.duration > 0;
        });
    }
}
