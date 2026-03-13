/**
 * Bot class represents enemy robots
 * Features level-scaled HP, size, AI movement, and combat
 */
class Bot {
  /**
   * Creates a new Bot instance
   * @param {number} x - Starting x position
   * @param {number} y - Starting y position
   * @param {number} level - Current level number (for scaling)
   */
  constructor(x, y, level) {
    // Position
    this.x = x;
    this.y = y;
    
    // Level-scaled stats
    this.hp = 50 + (level * 10);
    this.maxHp = this.hp;
    this.size = 40 + (level * 3); // Made bigger (was 24 + level * 2)
    this.width = this.size;
    this.height = this.size;
    
    // Combat stats
    this.speed = 2;
    this.contactDamage = 10; // Takes 15 hits to kill player (150 HP / 10 damage)
    this.coinReward = 10; // Fixed 10 coins per bot
    
    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.5;
    this.isGrounded = false;
  }
  
  /**
   * Updates bot state including AI movement and physics
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Object} playerPos - Player position {x, y}
   * @param {Island} island - The island platform
   */
  update(deltaTime, playerPos, island) {
    // AI: Move toward player
    const dx = playerPos.x - this.x;
    
    if (Math.abs(dx) > 5) {
      this.velocityX = dx > 0 ? this.speed : -this.speed;
    } else {
      this.velocityX = 0;
    }
    
    // Apply gravity
    this.velocityY += this.gravity;
    
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Ground collision
    const groundY = island.y - this.height;
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
    
    // Constrain to island boundaries
    const minX = island.x;
    const maxX = island.x + island.width - this.width;
    
    if (this.x < minX) {
      this.x = minX;
    } else if (this.x > maxX) {
      this.x = maxX;
    }
  }
  
  /**
   * Applies damage to the bot
   * @param {number} amount - Damage amount
   * @returns {boolean} True if bot was defeated
   */
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      return true; // Bot defeated
    }
    return false;
  }
  
  /**
   * Renders the bot to the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    
    // Draw bot body (red)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw eyes (yellow)
    ctx.fillStyle = '#FFD700';
    const eyeSize = Math.max(3, this.size / 8);
    ctx.fillRect(this.x + this.width * 0.25, this.y + this.height * 0.3, eyeSize, eyeSize);
    ctx.fillRect(this.x + this.width * 0.65, this.y + this.height * 0.3, eyeSize, eyeSize);
    
    // Draw HP bar
    const barWidth = this.width;
    const barHeight = 4;
    const barY = this.y - 8;
    
    // Background (red)
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(this.x, barY, barWidth, barHeight);
    
    // HP (green)
    const hpPercent = this.hp / this.maxHp;
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(this.x, barY, barWidth * hpPercent, barHeight);
  }
}

export { Bot };
