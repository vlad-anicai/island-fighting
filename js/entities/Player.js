/**
 * Player class represents the player-controlled character
 * Features HP, position, velocity, movement, jumping, and gravity
 */
class Player {
  /**
   * Creates a new Player instance
   * @param {number} x - Starting x position
   * @param {number} y - Starting y position
   */
  constructor(x, y) {
    // Position
    this.x = x;
    this.y = y;
    
    // HP
    this.hp = 100;
    this.maxHp = 100;
    
    // Velocity
    this.velocityX = 0;
    this.velocityY = 0;
    
    // Dimensions (as per design doc)
    this.width = 32;
    this.height = 48;
    
    // Physics constants
    this.gravity = 0.5;
    this.jumpStrength = -12;
    this.moveSpeed = 5;
    this.friction = 0.8;
    
    // State
    this.isGrounded = false;
    this.facingRight = true;
    
    // Combat
    this.punchCooldown = 0;
    this.shieldActive = false;
    this.shieldEndTime = 0;
    this.punchEffect = null;
    this.damageCooldown = 0; // Invulnerability after taking damage
    
    // Abilities
    this.abilities = {
      z: null,
      x: null,
      c: null,
      v: null
    };
    this.abilityCooldowns = {
      z: 0,
      x: 0,
      c: 0,
      v: 0
    };
  }
  
  /**
   * Updates player state including movement, gravity, and collision
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {InputHandler} input - The input handler instance
   * @param {Island} island - The island platform for collision detection
   */
  update(deltaTime, input, island) {
    // Handle horizontal movement (A/D keys)
    if (input.isKeyPressed('a')) {
      this.velocityX = -this.moveSpeed;
      this.facingRight = false;
    } else if (input.isKeyPressed('d')) {
      this.velocityX = this.moveSpeed;
      this.facingRight = true;
    } else {
      // Apply friction when no input
      this.velocityX *= this.friction;
      
      // Stop completely if velocity is very small
      if (Math.abs(this.velocityX) < 0.1) {
        this.velocityX = 0;
      }
    }
    
    // Handle jumping (Space key)
    if (input.isKeyPressed('space') && this.isGrounded) {
      this.velocityY = this.jumpStrength;
      this.isGrounded = false;
    }
    
    // Apply gravity
    this.velocityY += this.gravity;
    
    // Update position based on velocity
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Ground collision detection
    const groundY = island.y - this.height;
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
    
    // Constrain player position to island boundaries
    const minX = island.x;
    const maxX = island.x + island.width - this.width;
    
    if (this.x < minX) {
      this.x = minX;
      this.velocityX = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.velocityX = 0;
    }
    
    // Update cooldowns
    if (this.punchCooldown > 0) {
      this.punchCooldown -= deltaTime;
      if (this.punchCooldown < 0) {
        this.punchCooldown = 0;
      }
    }
    
    // Update ability cooldowns
    for (const key in this.abilityCooldowns) {
      if (this.abilityCooldowns[key] > 0) {
        this.abilityCooldowns[key] -= deltaTime;
        if (this.abilityCooldowns[key] < 0) {
          this.abilityCooldowns[key] = 0;
        }
      }
    }
    
    // Update shield duration
    if (this.shieldActive && Date.now() >= this.shieldEndTime) {
      this.shieldActive = false;
    }
    
    // Update punch effect
    if (this.punchEffect && this.punchEffect.active) {
      this.punchEffect.elapsed += deltaTime;
      if (this.punchEffect.elapsed >= this.punchEffect.duration) {
        this.punchEffect = null;
      }
    }
  }
  
  /**
   * Reduces player HP by damage amount (unless shielded)
   * @param {number} amount - The amount of damage to apply
   */
  takeDamage(amount) {
    if (this.shieldActive) {
      return; // Shield blocks all damage
    }
    
    this.hp = Math.max(0, this.hp - amount);
  }
  
  /**
   * Executes a punch attack if cooldown is ready
   * @returns {Object|null} Punch hitbox object or null if on cooldown
   */
  punch() {
    if (this.punchCooldown > 0) {
      return null; // Cooldown active
    }
    
    // Set cooldown
    this.punchCooldown = 0.2;
    
    // Create punch hitbox
    const punchRange = 50;
    const hitbox = {
      x: this.facingRight ? this.x + this.width : this.x - punchRange,
      y: this.y,
      width: punchRange,
      height: this.height,
      damage: 10
    };
    
    // Store punch effect data for rendering
    this.punchEffect = {
      active: true,
      x: hitbox.x,
      y: hitbox.y,
      width: hitbox.width,
      height: hitbox.height,
      duration: 0.15, // Show effect for 0.15 seconds
      elapsed: 0
    };
    
    return hitbox;
  }
  
  /**
   * Activates an ability if owned and off cooldown
   * @param {string} key - The ability key (z, x, c, v)
   * @returns {Object|null} Ability result object or null if failed
   */
  useAbility(key) {
    const abilityType = this.abilities[key];
    
    // Check if ability is owned
    if (!abilityType) {
      return null;
    }
    
    // Check if cooldown has expired
    if (this.abilityCooldowns[key] > 0) {
      return null;
    }
    
    // Activate ability based on type and set cooldown
    let result = null;
    
    switch (abilityType) {
      case 'STRONG_PUNCH':
        result = this.activateStrongPunch();
        this.abilityCooldowns[key] = 5.0;
        break;
        
      case 'FIRE_BALL':
        result = this.activateFireBall();
        this.abilityCooldowns[key] = 8.0;
        break;
        
      case 'SHIELD':
        result = this.activateShield();
        this.abilityCooldowns[key] = 18.0;
        break;
        
      case 'TORNADO':
        result = this.activateTornado();
        this.abilityCooldowns[key] = 20.0;
        break;
        
      case 'EARTHQUAKE':
        result = this.activateEarthquake();
        this.abilityCooldowns[key] = 15.0;
        break;
    }
    
    return result;
  }
  
  /**
   * Activates Strong Punch ability
   */
  activateStrongPunch() {
    const punchRange = 100;
    const hitbox = {
      x: this.facingRight ? this.x + this.width : this.x - punchRange,
      y: this.y,
      width: punchRange,
      height: this.height,
      damage: 30
    };
    
    // Create visual effect
    this.punchEffect = {
      active: true,
      x: hitbox.x,
      y: hitbox.y,
      width: hitbox.width,
      height: hitbox.height,
      duration: 0.2,
      elapsed: 0,
      isStrong: true
    };
    
    return { type: 'STRONG_PUNCH', hitbox };
  }
  
  /**
   * Activates Fire Ball ability
   */
  activateFireBall() {
    const speed = 8;
    const projectile = {
      type: 'FIRE_BALL',
      x: this.facingRight ? this.x + this.width : this.x - 20,
      y: this.y + this.height / 2 - 10,
      velocityX: this.facingRight ? speed : -speed,
      velocityY: 0,
      damage: 30
    };
    
    return { type: 'FIRE_BALL', projectile };
  }
  
  /**
   * Activates Shield ability
   */
  activateShield() {
    this.shieldActive = true;
    this.shieldEndTime = Date.now() + 10000; // 10 seconds
    
    return { type: 'SHIELD' };
  }
  
  /**
   * Activates Tornado ability
   */
  activateTornado() {
    const speed = 5;
    const projectile = {
      type: 'TORNADO',
      x: this.facingRight ? this.x + this.width : this.x - 60,
      y: this.y - 15,
      velocityX: this.facingRight ? speed : -speed,
      velocityY: 0,
      damage: 100
    };
    
    return { type: 'TORNADO', projectile };
  }
  
  /**
   * Activates Earthquake ability
   */
  activateEarthquake() {
    return { type: 'EARTHQUAKE', stunDuration: 3000 }; // 3 seconds stun
  }
  
  /**
   * Renders the player to the canvas context
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  render(ctx) {
    // Disable image smoothing for pixelated art style
    ctx.imageSmoothingEnabled = false;
    
    // Flash red when taking damage
    const isInvulnerable = this.damageCooldown && this.damageCooldown > 0;
    const flashEffect = isInvulnerable && Math.floor(this.damageCooldown * 10) % 2 === 0;
    
    // Draw player body
    ctx.fillStyle = flashEffect ? '#FF6B6B' : '#4169E1'; // Flash red when hit
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw head
    ctx.fillStyle = flashEffect ? '#FFB6B6' : '#FFD700';
    ctx.fillRect(this.x + 8, this.y + 4, 16, 16);
    
    // Draw eyes (facing direction indicator)
    ctx.fillStyle = '#000000';
    if (this.facingRight) {
      ctx.fillRect(this.x + 18, this.y + 10, 4, 4);
    } else {
      ctx.fillRect(this.x + 10, this.y + 10, 4, 4);
    }
    
    // Draw punch effect if active
    if (this.punchEffect && this.punchEffect.active) {
      const progress = this.punchEffect.elapsed / this.punchEffect.duration;
      const alpha = 1 - progress; // Fade out
      const isStrong = this.punchEffect.isStrong;
      
      // Draw punch impact effect
      const color = isStrong ? 'rgba(255, 0, 0, ' : 'rgba(255, 255, 0, ';
      ctx.fillStyle = color + (alpha * 0.6) + ')';
      ctx.fillRect(
        this.punchEffect.x,
        this.punchEffect.y,
        this.punchEffect.width,
        this.punchEffect.height
      );
      
      // Draw punch outline
      const outlineColor = isStrong ? 'rgba(200, 0, 0, ' : 'rgba(255, 165, 0, ';
      ctx.strokeStyle = outlineColor + alpha + ')';
      ctx.lineWidth = isStrong ? 5 : 3;
      ctx.strokeRect(
        this.punchEffect.x,
        this.punchEffect.y,
        this.punchEffect.width,
        this.punchEffect.height
      );
      
      // Draw impact stars
      const starCount = isStrong ? 5 : 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      for (let i = 0; i < starCount; i++) {
        const starX = this.punchEffect.x + (i + 1) * (this.punchEffect.width / (starCount + 1));
        const starY = this.punchEffect.y + this.punchEffect.height / 2;
        const starSize = (isStrong ? 8 : 6) * (1 - progress);
        
        // Draw star shape
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
          const radius = j % 2 === 0 ? starSize : starSize / 2;
          const x = starX + Math.cos(angle) * radius;
          const y = starY + Math.sin(angle) * radius;
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    
    // Draw shield effect if active
    if (this.shieldActive) {
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 5) * 0.2 + 0.8; // Pulsing effect
      
      // Draw shield bubble
      ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width * 1.5,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      
      // Inner shield layer
      ctx.strokeStyle = `rgba(100, 255, 255, ${pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width * 1.3,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      
      // Shield sparkles
      for (let i = 0; i < 6; i++) {
        const angle = (time * 2 + i * 60) * Math.PI / 180;
        const radius = this.width * 1.5;
        const sx = this.x + this.width / 2 + Math.cos(angle) * radius;
        const sy = this.y + this.height / 2 + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Export for use in other modules
export { Player };
