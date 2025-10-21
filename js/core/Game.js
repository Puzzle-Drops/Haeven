// In the renderDebugOverlay method, update the controls text:
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
