/**
 * Canvas Verification Utility
 * Tests Canvas rendering capabilities and pixelated rendering support
 */

export class CanvasVerification {
    static verify(canvas, ctx) {
        const results = {
            contextAvailable: false,
            pixelatedSupport: false,
            renderingWorks: false,
            dimensions: { width: 0, height: 0 },
            errors: []
        };

        try {
            // Check if context is available
            if (!ctx) {
                results.errors.push('Canvas 2D context is not available');
                return results;
            }
            results.contextAvailable = true;

            // Check dimensions
            results.dimensions.width = canvas.width;
            results.dimensions.height = canvas.height;

            if (canvas.width === 0 || canvas.height === 0) {
                results.errors.push('Canvas has invalid dimensions');
                return results;
            }

            // Test pixelated rendering support
            ctx.imageSmoothingEnabled = false;
            results.pixelatedSupport = !ctx.imageSmoothingEnabled;

            // Test basic rendering
            try {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 1, 1);
                results.renderingWorks = true;
            } catch (error) {
                results.errors.push(`Rendering test failed: ${error.message}`);
            }

        } catch (error) {
            results.errors.push(`Verification failed: ${error.message}`);
        }

        return results;
    }

    static logResults(results) {
        console.log('=== Canvas Verification Results ===');
        console.log('Context Available:', results.contextAvailable);
        console.log('Pixelated Support:', results.pixelatedSupport);
        console.log('Rendering Works:', results.renderingWorks);
        console.log('Dimensions:', `${results.dimensions.width}x${results.dimensions.height}`);
        
        if (results.errors.length > 0) {
            console.error('Errors:', results.errors);
        } else {
            console.log('✓ All checks passed');
        }
        console.log('===================================');

        return results.contextAvailable && results.renderingWorks;
    }

    static drawTestPattern(ctx, width, height) {
        // Clear canvas
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, width, height);

        // Draw colored squares
        const colors = ['#2ecc71', '#e74c3c', '#3498db', '#f39c12'];
        const squareSize = 40;
        const spacing = 60;
        const startX = 50;
        const startY = 50;

        colors.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.fillRect(startX + (index * spacing), startY, squareSize, squareSize);
        });

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 20px "Courier New"';
        const text = 'Canvas Rendering: OK';
        const textX = startX;
        const textY = startY + squareSize + 40;
        
        ctx.strokeText(text, textX, textY);
        ctx.fillText(text, textX, textY);

        // Draw pixel grid to demonstrate pixelated rendering
        ctx.fillStyle = '#fff';
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillRect(startX + x * 4, startY + squareSize + 60 + y * 4, 4, 4);
                }
            }
        }

        ctx.fillStyle = '#fff';
        ctx.font = '12px "Courier New"';
        ctx.fillText('Pixelated Grid Test', startX, startY + squareSize + 130);
    }
}
