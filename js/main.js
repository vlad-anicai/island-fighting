/**
 * Main entry point for Island Fighting Game
 * Initializes the game engine and starts the application
 */

import { GameEngine } from './engine/GameEngine.js';
import { CanvasVerification } from './utils/CanvasVerification.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Verify Canvas context is available
    if (!ctx) {
        console.error('Failed to get Canvas 2D context');
        alert('Your browser does not support HTML5 Canvas. Please use a modern browser.');
        return;
    }

    // Configure canvas for pixelated rendering
    ctx.imageSmoothingEnabled = false;
    
    // Run comprehensive Canvas verification
    const verificationResults = CanvasVerification.verify(canvas, ctx);
    const verificationPassed = CanvasVerification.logResults(verificationResults);
    
    if (!verificationPassed) {
        alert('Canvas verification failed. Please check console for details.');
        return;
    }
    
    // Draw test pattern to visually verify rendering
    CanvasVerification.drawTestPattern(ctx, canvas.width, canvas.height);
    
    console.log('Canvas rendering test completed successfully');

    // Initialize game engine
    try {
        const game = new GameEngine(canvas, ctx);
        console.log('Game engine initialized');
        
        // Start the game
        game.start();
    } catch (error) {
        console.error('Failed to initialize game engine:', error);
        alert('Failed to start the game. Check console for details.');
    }
});
