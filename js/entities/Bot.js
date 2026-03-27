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
    this.speed = 1.75;
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

    // Visual type based on island theme
    this.islandTheme = 1; // set by GameEngine after construction
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

    // Check if slow has expired
    if (this.slowed && Date.now() >= this.slowEndTime) {
      this.slowed = false;
    }

    const scaledSpeed = this.speed * timeScale * (this.slowed ? this.slowFactor : 1);

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
   * Slows the bot for a duration (reduces speed to a fraction)
   */
  slow(duration, factor = 0.35) {
    this.slowed = true;
    this.slowFactor = factor;
    this.slowEndTime = Date.now() + duration;
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

    if (this.islandTheme === 2) {
      // Island 2: ice golem (left half) or lava golem (right half) — random
      if (!this._enemyVariant) this._enemyVariant = Math.random() < 0.5 ? 'ice' : 'lava';
      this._drawGolem(ctx, x, y, s, stunned, walk, this._enemyVariant);
    } else if (this.islandTheme === 3) {
      this._drawCrab(ctx, x, y, s, stunned, facing, walk);
    } else if (this.islandTheme === 4) {
      this._drawFuturisticRobot(ctx, x, y, s, stunned, facing, walk);
    } else {
      // Island 1: moss golem
      this._drawGolem(ctx, x, y, s, stunned, walk, 'moss');
    }
    // Burn overlay when on fire
    if (this.burning && Date.now() < this.burnEndTime) {
      const time = Date.now() / 100;
      const flicker = Math.sin(time) * 0.2 + 0.6;
      ctx.fillStyle = `rgba(255, 80, 0, ${flicker * 0.4})`;
      ctx.fillRect(x, y, s, s);
      // Flame particles rising
      for (let i = 0; i < 4; i++) {
        const fx = x + (i / 3) * s;
        const fy = y - ((time * 15 + i * 12) % 24);
        const fa = 0.8 * (1 - ((time * 15 + i * 12) % 24) / 24);
        ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.sin(time+i)*80)}, 0, ${fa})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Frost overlay when slowed
    if (this.slowed) {      const remaining = Math.max(0, (this.slowEndTime - Date.now()) / 3000);
      ctx.fillStyle = `rgba(100, 200, 255, ${0.35 * remaining})`;
      ctx.fillRect(x, y, s, s);
      // Ice crystal sparkles
      const time = Date.now() / 400;
      ctx.fillStyle = `rgba(200, 240, 255, ${0.8 * remaining})`;
      for (let i = 0; i < 4; i++) {
        const angle = time + i * Math.PI / 2;
        const sx = x + s / 2 + Math.cos(angle) * s * 0.4;
        const sy = y + s / 2 + Math.sin(angle) * s * 0.4;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
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

  _drawGolem(ctx, x, y, s, stunned, walk, variant) {
    const u = s / 10;
    let stone, dark, moss, eye;
    if (variant === 'moss') {
      stone = stunned ? '#888' : '#6B7B5E';
      dark  = stunned ? '#555' : '#3E4A35';
      moss  = stunned ? '#aaa' : '#4CAF50';
      eye   = stunned ? '#fff' : '#AAFF44';
    } else if (variant === 'ice') {
      stone = stunned ? '#aaa' : '#B3E5FC';
      dark  = stunned ? '#777' : '#4FC3F7';
      moss  = stunned ? '#ccc' : '#E1F5FE';
      eye   = stunned ? '#fff' : '#00E5FF';
    } else { // lava
      stone = stunned ? '#888' : '#4E342E';
      dark  = stunned ? '#555' : '#1A0000';
      moss  = stunned ? '#aaa' : '#FF5722';
      eye   = stunned ? '#fff' : '#FF6D00';
    }

    // Legs (chunky stone blocks)
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*1.5, y + u*7 + walk,  u*3, u*3);
    ctx.fillRect(x + u*5.5, y + u*7 - walk,  u*3, u*3);
    // Feet
    ctx.fillStyle = stone;
    ctx.fillRect(x + u*1,   y + u*9.5 + walk, u*4, u*1);
    ctx.fillRect(x + u*5,   y + u*9.5 - walk, u*4, u*1);

    // Body (big boulder torso)
    ctx.fillStyle = stone;
    ctx.fillRect(x + u*1, y + u*3, u*8, u*5);
    // Stone texture cracks
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*3, y + u*3.5, u*1, u*3);
    ctx.fillRect(x + u*6, y + u*4,   u*1, u*2);

    // Moss/ice/lava patches on body
    ctx.fillStyle = moss;
    ctx.fillRect(x + u*1.5, y + u*3,   u*2, u*1.5);
    ctx.fillRect(x + u*6,   y + u*6,   u*2, u*1.5);
    ctx.fillRect(x + u*4,   y + u*3.5, u*1.5, u*1);

    // Arms
    ctx.fillStyle = stone;
    ctx.fillRect(x - u*0.5, y + u*3.5 - walk*0.3, u*2, u*4);
    ctx.fillRect(x + u*8.5, y + u*3.5 + walk*0.3, u*2, u*4);
    // Fists (big boulders)
    ctx.fillStyle = dark;
    ctx.fillRect(x - u*1,   y + u*7 - walk*0.3, u*3, u*2.5);
    ctx.fillRect(x + u*8,   y + u*7 + walk*0.3, u*3, u*2.5);

    // Head (round boulder)
    ctx.fillStyle = stone;
    ctx.fillRect(x + u*2, y - u*0.5, u*6, u*4);
    // Brow ridge
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*2, y + u*1.5, u*6, u*1);
    // Eyes (glowing)
    ctx.fillStyle = eye;
    ctx.fillRect(x + u*2.5, y + u*0.5, u*2, u*1.5);
    ctx.fillRect(x + u*5.5, y + u*0.5, u*2, u*1.5);
    // Moss/ice on head
    ctx.fillStyle = moss;
    ctx.fillRect(x + u*2, y - u*0.5, u*3, u*0.8);
    ctx.fillRect(x + u*6, y - u*0.5, u*2, u*0.8);

    // Lava variant: glowing cracks
    if (variant === 'lava') {
      ctx.fillStyle = '#FF8F00';
      ctx.fillRect(x + u*3, y + u*3.5, u*0.5, u*3);
      ctx.fillRect(x + u*6, y + u*4,   u*0.5, u*2);
      ctx.fillRect(x + u*2.5, y + u*0.5, u*2, u*0.5);
      ctx.fillRect(x + u*5.5, y + u*0.5, u*2, u*0.5);
    }
    // Ice variant: sparkle highlights
    if (variant === 'ice') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(x + u*2, y + u*3, u*1, u*0.5);
      ctx.fillRect(x + u*7, y + u*5, u*1, u*0.5);
      ctx.fillRect(x + u*4, y - u*0.5, u*1, u*0.5);
    }
  }

  _drawCrab(ctx, x, y, s, stunned, facing, walk) {
    const u = s / 10;
    const shell = stunned ? '#888' : '#E53935';
    const dark  = stunned ? '#555' : '#B71C1C';
    const belly = stunned ? '#aaa' : '#FFCDD2';
    const eye   = stunned ? '#fff' : '#FFEB3B';

    // Back legs (4 pairs, animated)
    ctx.fillStyle = dark;
    for (let i = 0; i < 4; i++) {
      const lx = x + u * (1.5 + i * 2);
      const legWalk = Math.sin(this.walkFrame + i * 0.8) * 4;
      // Upper leg
      ctx.fillRect(lx, y + u*6, u*1.2, u*2.5 + legWalk);
      // Lower leg (angled out)
      ctx.save();
      ctx.translate(lx + u*0.6, y + u*8.5 + legWalk);
      ctx.rotate(i % 2 === 0 ? 0.3 : -0.3);
      ctx.fillRect(-u*0.6, 0, u*1.2, u*2);
      ctx.restore();
    }

    // Shell body (oval)
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(x + u*5, y + u*5, u*4.5, u*3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shell pattern
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(x + u*5, y + u*5, u*3, u*2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(x + u*5, y + u*5, u*2, u*1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = belly;
    ctx.fillRect(x + u*2, y + u*6, u*6, u*2);

    // Claws (big pincers)
    const clawDir = facing > 0 ? 1 : -1;
    // Left claw
    ctx.fillStyle = shell;
    ctx.fillRect(x - u*1.5, y + u*3 - walk*0.3, u*2.5, u*2);
    ctx.fillStyle = dark;
    ctx.fillRect(x - u*2,   y + u*2 - walk*0.3, u*1.5, u*1.5);
    ctx.fillRect(x - u*1,   y + u*4 - walk*0.3, u*1.5, u*1.5);
    // Right claw
    ctx.fillStyle = shell;
    ctx.fillRect(x + u*9,   y + u*3 + walk*0.3, u*2.5, u*2);
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*10,  y + u*2 + walk*0.3, u*1.5, u*1.5);
    ctx.fillRect(x + u*9,   y + u*4 + walk*0.3, u*1.5, u*1.5);

    // Eyes on stalks
    ctx.fillStyle = dark;
    ctx.fillRect(x + u*3, y + u*1.5, u*1, u*2);
    ctx.fillRect(x + u*6, y + u*1.5, u*1, u*2);
    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(x + u*3.5, y + u*1.5, u*1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + u*6.5, y + u*1.5, u*1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + u*3.5, y + u*1.5, u*0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + u*6.5, y + u*1.5, u*0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFuturisticRobot(ctx, x, y, s, stunned, facing, walk) {
    const u = s / 10;
    const metal  = stunned ? '#888' : '#37474F';
    const light  = stunned ? '#bbb' : '#78909C';
    const accent = stunned ? '#aaa' : '#00E5FF';
    const hot    = stunned ? '#fff' : '#FF1744';

    // Legs (sleek hydraulic)
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*2,   y + u*7 + walk,  u*2.5, u*3);
    ctx.fillRect(x + u*5.5, y + u*7 - walk,  u*2.5, u*3);
    // Knee joints
    ctx.fillStyle = accent;
    ctx.fillRect(x + u*2,   y + u*8 + walk,  u*2.5, u*0.8);
    ctx.fillRect(x + u*5.5, y + u*8 - walk,  u*2.5, u*0.8);
    // Feet (hover pads)
    ctx.fillStyle = light;
    ctx.fillRect(x + u*1.5, y + u*9.8 + walk, u*3.5, u*0.8);
    ctx.fillRect(x + u*5,   y + u*9.8 - walk, u*3.5, u*0.8);
    // Thruster glow under feet
    ctx.fillStyle = `rgba(0,229,255,0.5)`;
    ctx.fillRect(x + u*2,   y + u*10.2 + walk, u*2.5, u*0.5);
    ctx.fillRect(x + u*5.5, y + u*10.2 - walk, u*2.5, u*0.5);

    // Torso (angular armour)
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*1.5, y + u*3.5, u*7, u*4);
    // Chest armour plates
    ctx.fillStyle = light;
    ctx.fillRect(x + u*2,   y + u*4,   u*2.5, u*3);
    ctx.fillRect(x + u*5.5, y + u*4,   u*2.5, u*3);
    // Core reactor
    ctx.fillStyle = accent;
    ctx.fillRect(x + u*4,   y + u*4.5, u*2, u*2);
    ctx.fillStyle = 'rgba(0,229,255,0.6)';
    ctx.fillRect(x + u*4.2, y + u*4.7, u*1.6, u*1.6);

    // Arms (articulated)
    ctx.fillStyle = metal;
    ctx.fillRect(x - u*0.5, y + u*3.5 - walk*0.4, u*2, u*3.5);
    ctx.fillRect(x + u*8.5, y + u*3.5 + walk*0.4, u*2, u*3.5);
    // Elbow joints
    ctx.fillStyle = accent;
    ctx.fillRect(x - u*0.5, y + u*5.5 - walk*0.4, u*2, u*0.6);
    ctx.fillRect(x + u*8.5, y + u*5.5 + walk*0.4, u*2, u*0.6);
    // Hands (cannon-like)
    ctx.fillStyle = light;
    ctx.fillRect(x - u*1,   y + u*6.5 - walk*0.4, u*3, u*2);
    ctx.fillRect(x + u*8,   y + u*6.5 + walk*0.4, u*3, u*2);
    ctx.fillStyle = hot;
    ctx.fillRect(x - u*1.2, y + u*7.2 - walk*0.4, u*1, u*0.8);
    ctx.fillRect(x + u*10.2,y + u*7.2 + walk*0.4, u*1, u*0.8);

    // Head (sleek helmet)
    ctx.fillStyle = metal;
    ctx.fillRect(x + u*2, y - u*0.5, u*6, u*4);
    // Visor (wide glowing)
    ctx.fillStyle = accent;
    ctx.fillRect(x + u*2.5, y + u*0.5, u*5, u*2);
    ctx.fillStyle = 'rgba(0,229,255,0.4)';
    ctx.fillRect(x + u*2.5, y + u*0.5, u*5, u*2);
    // Visor scan line
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + u*2.5, y + u*1.3, u*5, u*0.4);
    // Side vents
    ctx.fillStyle = light;
    ctx.fillRect(x + u*2,   y + u*1, u*0.5, u*2);
    ctx.fillRect(x + u*7.5, y + u*1, u*0.5, u*2);
    // Top fin
    ctx.fillStyle = accent;
    ctx.fillRect(x + u*4.5, y - u*1.5, u*1, u*1.5);
  }
}

export { Bot };
