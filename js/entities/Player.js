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

    // Fly ability
    this.flying = false;
    this.flyEndTime = 0;

    // Block mechanic
    this.blocking = false;
    this.blockMeter = 100;
    this.maxBlockMeter = 100;
    this.blockDrainRate = 25;   // meter drained per second while holding block
    this.blockRegenRate = 15;   // meter regained per second when not blocking
    this.blockBroken = false;   // true when meter hits 0 — must fully regen before blocking again
    
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

    // Check fly expiry
    if (this.flying && Date.now() >= this.flyEndTime) {
      this.flying = false;
    }

    // Apply gravity (suppressed while flying)
    if (this.flying) {
      // W = up, S = down
      if (input.isKeyPressed('w')) {
        this.velocityY = -5;
      } else if (input.isKeyPressed('s')) {
        this.velocityY = 5;
      } else {
        this.velocityY *= 0.7; // hover damping
      }
    } else {
      this.velocityY += this.gravity;
    }
    
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
    
    // Handle block (F key)
    const wantsBlock = input.isKeyPressed('f');
    if (wantsBlock && !this.blockBroken && this.blockMeter > 0) {
      this.blocking = true;
      this.blockMeter -= this.blockDrainRate * deltaTime;
      if (this.blockMeter <= 0) {
        this.blockMeter = 0;
        this.blocking = false;
        this.blockBroken = true; // guard break — must fully regen
      }
    } else {
      this.blocking = false;
      // Regen meter when not blocking
      if (this.blockMeter < this.maxBlockMeter) {
        this.blockMeter += this.blockRegenRate * deltaTime;
        if (this.blockMeter >= this.maxBlockMeter) {
          this.blockMeter = this.maxBlockMeter;
          this.blockBroken = false; // fully recharged, can block again
        }
      }
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

    if (this.blocking && this.blockMeter > 0) {
      // Block absorbs the hit — drain meter proportional to damage
      this.blockMeter = Math.max(0, this.blockMeter - amount * 0.5);
      if (this.blockMeter <= 0) {
        this.blockBroken = true;
        this.blocking = false;
      }
      return; // no HP damage while blocking
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

      case 'FIRE_BLAST':
        result = this.activateFireBlast();
        this.abilityCooldowns[key] = 6.0;
        break;

      case 'THUNDER':
        result = this.activateThunder();
        this.abilityCooldowns[key] = 10.0;
        break;

      case 'CONTROLLED_FIRE_BALL':
        result = this.activateControlledFireBall();
        this.abilityCooldowns[key] = 12.0;
        break;

      case 'FLY':
        result = this.activateFly();
        this.abilityCooldowns[key] = 20.0;
        break;

      case 'SLOW_MOTION':
        result = this.activateSlowMotion();
        this.abilityCooldowns[key] = 25.0;
        break;

      case 'PLASMA_LASER':
        result = this.activatePlasmaLaser();
        this.abilityCooldowns[key] = 15.0;
        break;

      case 'BOMB':
        result = this.activateBomb();
        this.abilityCooldowns[key] = 12.0;
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

    // Punch-style arm animation with fire coloring
    this.punchEffect = {
      active: true,
      x: this.facingRight ? this.x + this.width : this.x - 100,
      y: this.y,
      width: 100,
      height: this.height,
      duration: 0.25,
      elapsed: 0,
      isStrong: true,
      isFireBall: true
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
      damage: 50
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
   * Activates Thunder Strike — lightning bolt at mouse position
   */
  activateThunder() {
    // targetX/Y are set by GameEngine just before calling useAbility
    return { type: 'THUNDER', x: this.thunderTargetX || 0, y: this.thunderTargetY || 0, damage: 60, radius: 40 };
  }

  /**
   * Activates Fly — lets player fly with W/S for 8 seconds
   */
  activateFly() {
    this.flying = true;
    this.flyEndTime = Date.now() + 8000; // 8 seconds
    this.velocityY = -3; // initial lift
    return { type: 'FLY' };
  }

  /**
   * Activates Bomb — arcing grenade that explodes on landing
   */
  activateBomb() {
    const throwSpeed = this.facingRight ? 7 : -7;
    return {
      type: 'BOMB',
      projectile: {
        type: 'BOMB',
        x: this.facingRight ? this.x + this.width : this.x - 18,
        y: this.y + 4,
        velocityX: throwSpeed,
        velocityY: -10, // arc upward
        damage: 45
      }
    };
  }

  /**
   * Activates Plasma Laser — fast piercing beam in facing direction
   */
  activatePlasmaLaser() {
    const speed = 18;
    return {
      type: 'PLASMA_LASER',
      projectile: {
        type: 'PLASMA_LASER',
        x: this.facingRight ? this.x + this.width : this.x - 16,
        y: this.y + this.height / 2 - 8,
        velocityX: this.facingRight ? speed : -speed,
        velocityY: 0,
        damage: 120
      }
    };
  }

  /**
   * Activates Slow Motion — signals GameEngine to slow time for 5 seconds
   */
  activateSlowMotion() {
    return { type: 'SLOW_MOTION', duration: 5000 };
  }

  /**
   * Activates Controlled Fire Ball — homing fireball that follows the cursor
   */
  activateControlledFireBall() {
    return {
      type: 'CONTROLLED_FIRE_BALL',
      projectile: {
        type: 'CONTROLLED_FIRE_BALL',
        x: this.facingRight ? this.x + this.width : this.x - 32,
        y: this.y + this.height / 2 - 16,
        velocityX: this.facingRight ? 5 : -5,
        velocityY: 0,
        damage: 80
      }
    };
  }

  /**
   * Activates Fire Blast — close-range punch with fire particles
   */
  activateFireBlast() {
    const range = 80;
    const hitbox = {
      x: this.facingRight ? this.x + this.width : this.x - range,
      y: this.y - 10,
      width: range,
      height: this.height + 20,
      damage: 40
    };

    // Punch arm animation with fire blast coloring
    this.punchEffect = {
      active: true,
      x: hitbox.x,
      y: hitbox.y,
      width: hitbox.width,
      height: hitbox.height,
      duration: 0.6,
      elapsed: 0,
      isStrong: true,
      isFireBlast: true
    };

    return { type: 'FIRE_BLAST', hitbox };
  }
  
  /**
   * Renders the player as a pixel-art human with punch animation
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  render(ctx) {
    ctx.imageSmoothingEnabled = false;

    const isInvulnerable = this.damageCooldown && this.damageCooldown > 0;
    const flash = isInvulnerable && Math.floor(this.damageCooldown * 10) % 2 === 0;

    // Skin / shirt / pants colors (flash red when hit)
    const skinColor  = flash ? '#FF9999' : '#FDBCB4';
    const shirtColor = flash ? '#FF6B6B' : '#4169E1';
    const pantsColor = flash ? '#CC4444' : '#1a3a8a';
    const hairColor  = flash ? '#FF4444' : '#4a2800';
    const shoeColor  = flash ? '#AA2222' : '#222222';

    // Determine punch animation progress (0 = idle, 1 = fully extended)
    let punchProgress = 0;
    if (this.punchEffect && this.punchEffect.active) {
      const t = this.punchEffect.elapsed / this.punchEffect.duration;
      // Extend fast, retract slow: peak at t=0.3
      punchProgress = t < 0.3 ? t / 0.3 : 1 - ((t - 0.3) / 0.7);
    }

    const dir = this.facingRight ? 1 : -1;
    // cx = horizontal center of the body
    const cx = this.x + this.width / 2;
    // Body top
    const by = this.y;

    // --- HEAD ---
    // 10x10 head centered on cx, top 2px from body top
    const headW = 10, headH = 10;
    const headX = cx - headW / 2;
    const headY = by + 2;
    ctx.fillStyle = skinColor;
    ctx.fillRect(headX, headY, headW, headH);

    // Hair (3px strip on top)
    ctx.fillStyle = hairColor;
    ctx.fillRect(headX, headY, headW, 3);

    // Eyes
    ctx.fillStyle = '#000';
    if (this.facingRight) {
      ctx.fillRect(headX + 6, headY + 4, 2, 2);
    } else {
      ctx.fillRect(headX + 2, headY + 4, 2, 2);
    }

    // --- TORSO (shirt) ---
    const torsoX = cx - 6;
    const torsoY = headY + headH;
    const torsoW = 12, torsoH = 14;
    ctx.fillStyle = shirtColor;
    ctx.fillRect(torsoX, torsoY, torsoW, torsoH);

    // --- LEGS (pants) ---
    const legY = torsoY + torsoH;
    const legH = 14;
    ctx.fillStyle = pantsColor;
    // Left leg
    ctx.fillRect(cx - 6, legY, 5, legH);
    // Right leg
    ctx.fillRect(cx + 1, legY, 5, legH);

    // --- SHOES ---
    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 7, legY + legH - 3, 6, 3);
    ctx.fillRect(cx,     legY + legH - 3, 6, 3);

    // --- ARMS ---
    // Resting arm position: hanging at sides, elbow bent slightly
    // Punching arm: extends forward in facing direction
    const armY = torsoY + 2;
    const armW = 4, armH = 10;

    // Back arm (opposite to facing) — always resting
    const backArmX = this.facingRight ? cx - 6 - armW : cx + 6;
    ctx.fillStyle = shirtColor;
    ctx.fillRect(backArmX, armY, armW, armH);
    // Back hand
    ctx.fillStyle = skinColor;
    ctx.fillRect(backArmX, armY + armH, armW, 3);

    // Front arm — animates when punching
    // Idle: tucked at side. Punch: extends forward
    const frontArmIdleX = this.facingRight ? cx + 6 : cx - 6 - armW;
    // Extended position: arm reaches out in facing direction
    const extendAmount = punchProgress * 18;
    const frontArmX = frontArmIdleX + dir * extendAmount;
    // Arm shortens slightly as it extends (foreshortening feel)
    const frontArmH = armH - punchProgress * 3;

    ctx.fillStyle = shirtColor;
    ctx.fillRect(frontArmX, armY, armW, frontArmH);
    // Front fist
    const fistColor = punchProgress > 0.1
      ? (this.punchEffect && this.punchEffect.isFireBlast ? '#FF2200'
        : this.punchEffect && this.punchEffect.isFireBall ? '#FF6600'
        : this.punchEffect && this.punchEffect.isStrong ? '#FF4400' : '#FFD700')
      : skinColor;
    ctx.fillStyle = fistColor;
    ctx.fillRect(frontArmX, armY + frontArmH, armW + 1, 4);

    // --- PUNCH IMPACT EFFECT ---
    if (this.punchEffect && this.punchEffect.active) {
      const progress = this.punchEffect.elapsed / this.punchEffect.duration;
      const isStrong = this.punchEffect.isStrong;
      const isFireBall = this.punchEffect.isFireBall;
      const isFireBlast = this.punchEffect.isFireBlast;

      // Fire Blast: hold full opacity for first half, then fade out in second half
      const alpha = isFireBlast
        ? (progress < 0.5 ? 1 : 1 - ((progress - 0.5) / 0.5))
        : 1 - progress;

      // Impact flash at fist tip
      const impactX = this.facingRight
        ? frontArmX + armW + 1
        : frontArmX - 12;
      const impactY = armY + frontArmH - 4;
      const impactR = (isStrong ? 14 : 9) * (1 - progress * 0.5);

      if (isFireBlast) {
        // Flame tongues shooting forward from the fist
        const time = this.punchEffect.elapsed;
        const dir2 = this.facingRight ? 1 : -1;

        // Draw multiple flame tongues fanning out in the punch direction
        const flameCount = 7;
        for (let i = 0; i < flameCount; i++) {
          // Fan spread: center flame goes straight, outer ones angle up/down
          const spread = ((i - (flameCount - 1) / 2) / ((flameCount - 1) / 2)) * 0.6; // -0.6 to +0.6 radians
          const baseAngle = this.facingRight ? 0 : Math.PI;
          const angle = baseAngle + spread;

          // Flame length grows then shrinks with animation, with slight wobble per flame
          const wobble = Math.sin(time * 20 + i * 1.3) * 0.15;
          const maxLen = 70 + i % 3 * 20; // vary lengths
          const len = maxLen * Math.sin(progress * Math.PI) * (1 + wobble);
          const width = (14 - Math.abs(spread) * 6) * (1 - progress * 0.5);
          if (len <= 0 || width <= 0) continue;

          // Flame: goes straight forward 60px, then turns 90° upward
          const bendDist = 60; // px from fist where the turn happens
          const bendX = impactX + Math.cos(angle) * bendDist;
          const bendY = impactY + Math.sin(angle) * bendDist;
          const riseLen = Math.max(0, len - bendDist); // remaining length goes up
          const tipX = bendX;
          const tipY = bendY - riseLen;

          // Perpendicular for flame width (horizontal spread at base)
          const perpX = -Math.sin(angle);
          const perpY = Math.cos(angle);

          // Cubic bezier: cp1 keeps going forward (no rise), cp2 at bend starts going up
          const cp1X = impactX + Math.cos(angle) * bendDist * 0.8;
          const cp1Y = impactY + Math.sin(angle) * bendDist * 0.8;
          const cp2X = bendX;
          const cp2Y = bendY - riseLen * 0.2; // just starting to rise at bend

          const gradient = ctx.createLinearGradient(impactX, impactY, tipX, tipY);
          gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
          gradient.addColorStop(0.3, `rgba(255, 180, 0, ${alpha})`);
          gradient.addColorStop(0.7, `rgba(255, 60, 0, ${alpha * 0.8})`);
          gradient.addColorStop(1, `rgba(200, 0, 0, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(impactX + perpX * width, impactY + perpY * width);
          ctx.bezierCurveTo(
            cp1X + perpX * width * 0.5, cp1Y + perpY * width * 0.5,
            cp2X + width * 0.15,        cp2Y,
            tipX, tipY
          );
          ctx.bezierCurveTo(
            cp2X - width * 0.15,        cp2Y,
            cp1X - perpX * width * 0.5, cp1Y - perpY * width * 0.5,
            impactX - perpX * width, impactY - perpY * width
          );
          ctx.closePath();
          ctx.fill();
        }

        // Hot white core at fist
        const coreR = 10 * (1 - progress * 0.6);
        ctx.fillStyle = `rgba(255, 255, 220, ${alpha})`;
        ctx.beginPath();
        ctx.arc(impactX, impactY, coreR, 0, Math.PI * 2);
        ctx.fill();

      } else if (isFireBall) {
        // Fire burst: layered orange/yellow/white circles
        ctx.fillStyle = `rgba(255, 255, 180, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(impactX, impactY, impactR * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 140, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(impactX, impactY, impactR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(200, 50, 0, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(impactX, impactY, impactR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Flame spikes
        ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const len = impactR * 2 * (1 - progress * 0.3);
          ctx.beginPath();
          ctx.moveTo(impactX + Math.cos(angle) * impactR * 0.5,
                     impactY + Math.sin(angle) * impactR * 0.5);
          ctx.lineTo(impactX + Math.cos(angle) * len,
                     impactY + Math.sin(angle) * len);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = isStrong
          ? `rgba(255, 80, 0, ${alpha * 0.85})`
          : `rgba(255, 230, 0, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(impactX, impactY, impactR, 0, Math.PI * 2);
        ctx.fill();

        // Impact lines radiating outward
        const lineCount = isStrong ? 8 : 5;
        ctx.strokeStyle = isStrong
          ? `rgba(255, 150, 0, ${alpha})`
          : `rgba(255, 255, 100, ${alpha})`;
        ctx.lineWidth = isStrong ? 3 : 2;
        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * Math.PI * 2;
          const len = impactR * 1.6 * (1 - progress * 0.4);
          ctx.beginPath();
          ctx.moveTo(impactX + Math.cos(angle) * impactR * 0.4,
                     impactY + Math.sin(angle) * impactR * 0.4);
          ctx.lineTo(impactX + Math.cos(angle) * len,
                     impactY + Math.sin(angle) * len);
          ctx.stroke();
        }
      }
    }

    // --- FLY EFFECT ---
    if (this.flying) {
      const time = Date.now() / 1000;
      const flapAngle = Math.sin(time * 10) * 0.4; // flapping

      // Wings on each side
      for (const side of [-1, 1]) {
        const wingBaseX = cx + side * 6;
        const wingBaseY = torsoY + 4;
        const wingTipX = wingBaseX + side * (18 + Math.abs(Math.sin(time * 10)) * 8);
        const wingTipY = wingBaseY - 10 + Math.sin(time * 10 + (side > 0 ? 0 : Math.PI)) * 6;

        ctx.fillStyle = `rgba(100, 200, 255, 0.7)`;
        ctx.beginPath();
        ctx.moveTo(wingBaseX, wingBaseY);
        ctx.quadraticCurveTo(wingTipX, wingBaseY - 14, wingTipX, wingTipY);
        ctx.quadraticCurveTo(wingTipX, wingBaseY + 6, wingBaseX, wingBaseY + 8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(180, 240, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Remaining fly time indicator (small bar above head)
      const remaining = Math.max(0, (this.flyEndTime - Date.now()) / 8000);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(headX - 2, headY - 8, headW + 4, 4);
      ctx.fillStyle = `rgba(100, 200, 255, 0.9)`;
      ctx.fillRect(headX - 2, headY - 8, (headW + 4) * remaining, 4);
    }

    // --- BLOCK METER ---
    // Show whenever meter is not full or player is blocking
    if (this.blockMeter < this.maxBlockMeter || this.blocking) {
      const barW = 36;
      const barH = 5;
      const barX = cx - barW / 2;
      const barY = headY - 16;
      const pct = this.blockMeter / this.maxBlockMeter;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      // Fill — blue when healthy, red when broken/low
      const barColor = this.blockBroken
        ? '#FF3333'
        : pct > 0.4 ? '#3399FF' : '#FF8800';
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, barW * pct, barH);

      // Blocking indicator glow
      if (this.blocking) {
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
      }
    }

    // --- SHIELD EFFECT ---
    if (this.shieldActive) {
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 5) * 0.2 + 0.8;

      ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, by + this.height / 2, this.width * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(100, 255, 255, ${pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, by + this.height / 2, this.width * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const angle = (time * 2 + i * 60) * Math.PI / 180;
        const r = this.width * 1.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * r, by + this.height / 2 + Math.sin(angle) * r, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Export for use in other modules
export { Player };
