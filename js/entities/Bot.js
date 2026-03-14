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
    this.size = 40 + (level * 3);
    this.width = this.size;
    this.height = this.size;
    
    // Combat stats
    this.speed = 2;
    this.contactDamage = 10;
    this.coinReward = 5;
    
    // Status effects
    this.stunned = false;
    this.stunEndTime = 0;
    
    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.5;
    this.isGrounded = false;

    // Visual type: 'robot' or 'dog' (random)
    this.botType = Math.random() < 0.5 ? 'robot' : 'dog';
    // Walk animation
    this.walkFrame = 0;
  }
  
  /**
   * Updates bot state including AI movement and physics
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Object} playerPos - Player position {x, y}
   * @param {Island} island - The island platform
   */
  update(deltaTime, playerPos, island, timeScale = 1.0) {
    // Advance walk animation
    if (!this.stunned && Math.abs(this.velocityX) > 0.1) {
      this.walkFrame += 0.15;
    }

    // Check if stun has expired
    if (this.stunned && Date.now() >= this.stunEndTime) {
      this.stunned = false;
    }

    const scaledSpeed = this.speed * timeScale;

    // AI: Move toward player (only if not stunned)
    if (!this.stunned) {
      const dx = playerPos.x - this.x;
      // Only apply AI movement if not being knocked back
      if (Math.abs(this.velocityX) < scaledSpeed * 1.5) {
        if (Math.abs(dx) > 5) {
          this.velocityX = dx > 0 ? scaledSpeed : -scaledSpeed;
        } else {
          this.velocityX = 0;
        }
      }
    } else {
      // Stunned - let knockback decay
      if (Math.abs(this.velocityX) > 0.1) {
        this.velocityX *= 0.85;
      } else {
        this.velocityX = 0;
      }
    }

    // Decay knockback velocity when grounded
    if (this.isGrounded && Math.abs(this.velocityX) > scaledSpeed) {
      this.velocityX *= 0.8;
    }
    
    // Apply gravity (scaled)
    this.velocityY += this.gravity * timeScale;
    
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
   * Stuns the bot for a duration
   * @param {number} duration - Stun duration in milliseconds
   */
  stun(duration) {
    this.stunned = true;
    this.stunEndTime = Date.now() + duration;
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
      return true;
    }
    return false;
  }

  applyKnockback(forceX, forceY) {
    this.velocityX += forceX;
    this.velocityY += forceY;
  }
  
  /**
   * Renders the bot to the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.save();

    const s = this.size;
    const x = this.x;
    const y = this.y;
    const stunned = this.stunned;
    const facing = this.velocityX >= 0 ? 1 : -1; // 1=right, -1=left
    const walk = Math.sin(this.walkFrame) * 3; // leg swing

    if (this.botType === 'robot') {
      this._drawRobot(ctx, x, y, s, stunned, facing, walk);
    } else {
      this._drawDog(ctx, x, y, s, stunned, facing, walk);
    }

    // Stun stars
    if (stunned) {
      const time = Date.now() / 200;
      for (let i = 0; i < 3; i++) {
        const angle = (time + i * 120) * Math.PI / 180;
        const sx = x + s / 2 + Math.cos(angle) * s * 0.55;
        const sy = y - 10 + Math.sin(angle) * 8;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = j % 2 === 0 ? 5 : 2.5;
          j === 0 ? ctx.moveTo(sx + Math.cos(a)*r, sy + Math.sin(a)*r)
                  : ctx.lineTo(sx + Math.cos(a)*r, sy + Math.sin(a)*r);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // HP bar
    const barY = y - 8;
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x, barY, s, 4);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(x, barY, s * (this.hp / this.maxHp), 4);

    ctx.restore();
  }

  _drawRobot(ctx, x, y, s, stunned, facing, walk) {
    const metal  = stunned ? '#888' : '#4488CC';
    const dark   = stunned ? '#555' : '#224466';
    const accent = stunned ? '#aaa' : '#88DDFF';
    const eye    = stunned ? '#fff' : '#FF4400';

    const u = s / 10; // unit

    // Legs (animated)
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*2,           y + u*7 + walk,  u*2, u*3);
    ctx.fillRect(x + u*6,           y + u*7 - walk,  u*2, u*3);
    // Feet
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*1.5,         y + u*9.5 + walk, u*3, u*1);
    ctx.fillRect(x + u*5.5,         y + u*9.5 - walk, u*3, u*1);

    // Torso
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*1.5, y + u*3.5, u*7, u*4);
    // Chest panel
    ctx.fillStyle = accent;
    ctx.fillRect(x + u*3,   y + u*4.5, u*4, u*2);
    // Chest light
    ctx.fillStyle = stunned ? '#aaa' : '#FF0000';
    ctx.fillRect(x + u*4.5, y + u*5,   u*1, u*1);

    // Arms (animated opposite to legs)
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*0,   y + u*4 - walk*0.5, u*1.5, u*3);
    ctx.fillRect(x + u*8.5, y + u*4 + walk*0.5, u*1.5, u*3);
    // Fists
    ctx.fillStyle = metal;
    ctx.fillRect(x - u*0.5, y + u*6.5 - walk*0.5, u*2, u*1.5);
    ctx.fillRect(x + u*8.5, y + u*6.5 + walk*0.5, u*2, u*1.5);

    // Head
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*2, y + u*0.5, u*6, u*3.5);
    // Visor
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*2.5, y + u*1,  u*5, u*1.5);
    // Eyes
    ctx.fillStyle = eye;
    ctx.fillRect(x + u*3,   y + u*1.2, u*1.5, u*1);
    ctx.fillRect(x + u*5.5, y + u*1.2, u*1.5, u*1);
    // Antenna
    ctx.fillStyle = accent;
    ctx.fillRect(x + u*4.5, y - u*1,   u*1, u*1.5);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(x + u*4.5, y - u*1.5, u*1, u*0.8);
  }

  _drawDog(ctx, x, y, s, stunned, facing, walk) {
    const fur    = stunned ? '#888' : '#CC6622';
    const dark   = stunned ? '#555' : '#883300';
    const metal  = stunned ? '#aaa' : '#AAAACC';
    const eye    = stunned ? '#fff' : '#FF4400';

    const u = s / 10;

    // Tail (wags with walk)
    ctx.fillStyle = fur;
    ctx.save();
    ctx.translate(facing > 0 ? x + u*1 : x + u*9, y + u*3);
    ctx.rotate(Math.sin(this.walkFrame) * 0.5);
    ctx.fillRect(facing > 0 ? -u*3 : 0, -u*1, u*3, u*1.5);
    ctx.restore();

    // Body
    ctx.fillStyle = fur;
    ctx.fillRect(x + u*1.5, y + u*3, u*7, u*4);
    // Belly plate (metal)
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*2.5, y + u*5, u*5, u*2);

    // Legs (4 legs, animated)
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*2,   y + u*6.5 + walk,  u*1.5, u*3);
    ctx.fillRect(x + u*4,   y + u*6.5 - walk,  u*1.5, u*3);
    ctx.fillRect(x + u*6,   y + u*6.5 + walk,  u*1.5, u*3);
    ctx.fillRect(x + u*7.5, y + u*6.5 - walk,  u*1.5, u*3);
    // Paws
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*1.5, y + u*9,  u*2.5, u*1);
    ctx.fillRect(x + u*3.5, y + u*9,  u*2.5, u*1);
    ctx.fillRect(x + u*5.5, y + u*9,  u*2.5, u*1);
    ctx.fillRect(x + u*7,   y + u*9,  u*2.5, u*1);

    // Neck
    ctx.fillStyle = fur;
    ctx.fillRect(x + u*6.5, y + u*2, u*2, u*2);

    // Head
    ctx.fillStyle = fur;
    ctx.fillRect(x + u*6.5, y - u*0.5, u*3.5, u*3);
    // Snout
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*8.5, y + u*1,   u*2, u*1.5);
    // Nose
    ctx.fillStyle = '#111';
    ctx.fillRect(x + u*9.8, y + u*1,   u*0.8, u*0.8);
    // Eye
    ctx.fillStyle = eye;
    ctx.fillRect(x + u*7,   y + u*0.2, u*1.2, u*1.2);
    // Ear
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*6.5, y - u*1.5, u*1.5, u*2);

    // Collar
    ctx.fillStyle = '#FF2200';
    ctx.fillRect(x + u*6.5, y + u*2, u*2, u*0.8);
  }
}

export { Bot };
