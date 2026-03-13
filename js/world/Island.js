/**
 * Island class represents the floating platform where combat takes place.
 * Features multiple visual designs that cycle based on level number.
 */
class Island {
  /**
   * Creates a new Island instance
   * @param {number} levelNumber - The current level number (used to select design)
   */
  constructor(levelNumber) {
    // Island dimensions and position
    this.width = 800;
    this.height = 100;
    this.x = 100;
    this.y = 500;
    
    // Select design variant based on level number
    this.design = this.selectDesign(levelNumber);
  }
  
  /**
   * Selects a visual design variant based on the level number
   * Cycles through 3 different design styles
   * @param {number} level - The current level number
   * @returns {string} The design variant identifier
   */
  selectDesign(level) {
    const designs = ['tropical', 'volcanic', 'crystal'];
    const index = (level - 1) % designs.length;
    return designs[index];
  }
  
  /**
   * Checks if a point is within the island's boundaries
   * @param {number} x - The x coordinate to check
   * @param {number} y - The y coordinate to check
   * @returns {boolean} True if the point is on the platform
   */
  containsPoint(x, y) {
    return x >= this.x && 
           x <= this.x + this.width && 
           y >= this.y && 
           y <= this.y + this.height;
  }
  
  /**
   * Renders the island to the canvas context
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  render(ctx) {
    // Disable image smoothing for pixelated art style
    ctx.imageSmoothingEnabled = false;
    
    // Draw island platform based on design variant
    switch (this.design) {
      case 'tropical':
        this.renderTropical(ctx);
        break;
      case 'volcanic':
        this.renderVolcanic(ctx);
        break;
      case 'crystal':
        this.renderCrystal(ctx);
        break;
      default:
        this.renderTropical(ctx);
    }
  }
  
  /**
   * Renders the tropical island design
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  renderTropical(ctx) {
    // Main platform - sandy color
    ctx.fillStyle = '#F4A460';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Grass layer on top
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(this.x, this.y, this.width, 20);
    
    // Add some texture with darker patches
    ctx.fillStyle = '#7CCD7C';
    for (let i = 0; i < 10; i++) {
      const patchX = this.x + (i * 80) + 10;
      ctx.fillRect(patchX, this.y + 5, 30, 10);
    }
    
    // Platform edge shadow
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(this.x, this.y + this.height - 10, this.width, 10);
  }
  
  /**
   * Renders the volcanic island design
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  renderVolcanic(ctx) {
    // Main platform - dark volcanic rock
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Lava cracks on top
    ctx.fillStyle = '#FF4500';
    for (let i = 0; i < 8; i++) {
      const crackX = this.x + (i * 100) + 20;
      ctx.fillRect(crackX, this.y + 5, 40, 4);
      ctx.fillRect(crackX + 10, this.y + 12, 20, 4);
    }
    
    // Glowing lava layer
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(this.x, this.y, this.width, 15);
    
    // Platform edge - darker rock
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(this.x, this.y + this.height - 10, this.width, 10);
  }
  
  /**
   * Renders the crystal island design
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  renderCrystal(ctx) {
    // Main platform - light blue crystal
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Crystal formations on top
    ctx.fillStyle = '#00CED1';
    for (let i = 0; i < 12; i++) {
      const crystalX = this.x + (i * 70) + 15;
      // Draw triangular crystal shapes
      ctx.beginPath();
      ctx.moveTo(crystalX, this.y + 20);
      ctx.lineTo(crystalX + 10, this.y);
      ctx.lineTo(crystalX + 20, this.y + 20);
      ctx.closePath();
      ctx.fill();
    }
    
    // Shimmering highlights
    ctx.fillStyle = '#E0FFFF';
    for (let i = 0; i < 15; i++) {
      const highlightX = this.x + (i * 55) + 5;
      ctx.fillRect(highlightX, this.y + 10, 8, 8);
    }
    
    // Platform edge - darker crystal
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(this.x, this.y + this.height - 10, this.width, 10);
  }
}

// Export for use in other modules
export { Island };
