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

    // Thruster Hands dash state
    this.dashing = false;
    this.dashEndTime = 0;
    this.dashHitBots = new Set();

    // Jump Boots state
    this.jumpBootsActive = false;
    this.jumpBootsEndTime = 0;

    // Iron Gloves state
    this.ironGlovesActive = false;
    this.ironGlovesEndTime = 0;    this.blockMeter = 100;
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
    if (this.dashing) {
      // Maintain dash velocity — don't apply friction or override with movement input
    } else if (input.isKeyPressed('a')) {
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
      this.velocityY = this.jumpBootsActive ? this.jumpStrength * 1.7 : this.jumpStrength;
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
    
    // Check dash expiry
    if (this.dashing && Date.now() >= this.dashEndTime) {
      this.dashing = false;
      this.dashHitBots = new Set();
    }

    // Check jump boots expiry
    if (this.jumpBootsActive && Date.now() >= this.jumpBootsEndTime) {
      this.jumpBootsActive = false;
    }

    // Check iron gloves expiry
    if (this.ironGlovesActive && Date.now() >= this.ironGlovesEndTime) {
      this.ironGlovesActive = false;
    }

    // Handle block (F key)
    const wantsBlock = input.isKeyPressed('f');    if (wantsBlock && !this.blockBroken && this.blockMeter > 0) {
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

    if (this.dashing) {
      return; // Invincible during Thruster Hands dash
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
      damage: this.ironGlovesActive ? 20 : 10
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

      case 'BLACK_FLASH':
        result = this.activateBlackFlash();
        this.abilityCooldowns[key] = 8.0;
        break;

      case 'FROSTBITE':
        result = this.activateFrostbite();
        this.abilityCooldowns[key] = 10.0;
        break;

      case 'MAGMA_ROCK':
        result = this.activateMagmaRock();
        this.abilityCooldowns[key] = 14.0;
        break;

      case 'THRUSTER_HANDS':
        result = this.activateThrusterHands();
        this.abilityCooldowns[key] = 12.0;
        break;

      case 'REACTOR_EXPLOSION':
        result = this.activateReactorExplosion();
        this.abilityCooldowns[key] = 20.0;
        break;

      case 'JUMP_BOOTS':
        result = this.activateJumpBoots();
        this.abilityCooldowns[key] = 30.0;
        break;

      case 'IRON_GLOVES':
        result = this.activateIronGloves();
        this.abilityCooldowns[key] = 30.0;
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
      damage: this.ironGlovesActive ? 60 : 30
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
   * Activates Thruster Hands — launches player forward, damaging all in path
   */
  activateThrusterHands() {
    const speed = this.facingRight ? 22 : -22;
    this.velocityX = speed;
    this.velocityY = -4; // slight upward arc
    this.dashing = true;
    this.dashEndTime = Date.now() + 1200; // 1.2 seconds (doubled)
    this.dashHitBots = new Set(); // track already-hit bots
    return { type: 'THRUSTER_HANDS', damage: 45 };
  }

  /**
   * Activates Reactor Explosion — detonates the electronic chestplate in an AoE burst
   */
  activateReactorExplosion() {
    return { type: 'REACTOR_EXPLOSION', damage: 130, radius: 160 };
  }

  /**
   * Activates Jump Boots — boosts jump height for 10 seconds
   */
  activateJumpBoots() {
    this.jumpBootsActive = true;
    this.jumpBootsEndTime = Date.now() + 10000;
    return { type: 'JUMP_BOOTS' };
  }

  /**
   * Activates Iron Gloves — doubles punch and strong punch damage for 10 seconds
   */
  activateIronGloves() {
    this.ironGlovesActive = true;
    this.ironGlovesEndTime = Date.now() + 10000;
    return { type: 'IRON_GLOVES' };
  }

  /**
   * Activates Magma Rock — slow projectile that leaves a burning puddle on hit
   */
  activateMagmaRock() {
    const speed = this.facingRight ? 6 : -6;
    return {
      type: 'MAGMA_ROCK',
      projectile: {
        type: 'MAGMA_ROCK',
        x: this.facingRight ? this.x + this.width : this.x - 20,
        y: this.y + this.height / 2 - 10,
        velocityX: speed,
        velocityY: -3,
        damage: 25
      }
    };
  }

  /**
   * Activates Frostbite — icy projectile that slows the first enemy hit
   */
  activateFrostbite() {
    const speed = 9;
    return {
      type: 'FROSTBITE',
      projectile: {
        type: 'FROSTBITE',
        x: this.facingRight ? this.x + this.width : this.x - 18,
        y: this.y + this.height / 2 - 9,
        velocityX: this.facingRight ? speed : -speed,
        velocityY: 0,
        damage: 10
      }
    };
  }

  /**
   * Activates Black Flash — super punch with black spark / red outline visual
   */
  activateBlackFlash() {
    const range = 70;
    const hitbox = {
      x: this.facingRight ? this.x + this.width : this.x - range,
      y: this.y - 8,
      width: range,
      height: this.height + 16,
      damage: 150
    };

    this.punchEffect = {
      active: true,
      x: hitbox.x,
      y: hitbox.y,
      width: hitbox.width,
      height: hitbox.height,
      duration: 0.45,
      elapsed: 0,
      isStrong: true,
      isBlackFlash: true
    };

    return { type: 'BLACK_FLASH', hitbox };
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

    // --- ELECTRONIC CHESTPLATE (shown when REACTOR_EXPLOSION is equipped) ---
    const hasReactor = Object.values(this.abilities).includes('REACTOR_EXPLOSION');
    if (hasReactor) {
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 4) * 0.3 + 0.7;
      // Plate body
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(torsoX - 1, torsoY, torsoW + 2, torsoH);
      // Glowing reactor core (center circle)
      const coreX = cx;
      const coreY = torsoY + torsoH / 2;
      const coreGrad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, 4);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${pulse})`);
      coreGrad.addColorStop(0.4, `rgba(0, 255, 170, ${pulse * 0.9})`);
      coreGrad.addColorStop(1, `rgba(0, 100, 255, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Plate edge highlight
      ctx.strokeStyle = `rgba(0, 255, 170, ${pulse * 0.8})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(torsoX - 1, torsoY, torsoW + 2, torsoH);
    }

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

    // --- JUMP BOOTS (shown when JUMP_BOOTS is active) ---
    if (this.jumpBootsActive) {
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 6) * 0.3 + 0.7;
      // Boot body
      ctx.fillStyle = '#222244';
      ctx.fillRect(cx - 8, legY + legH - 5, 7, 5);
      ctx.fillRect(cx - 1, legY + legH - 5, 7, 5);
      // Yellow energy stripe
      ctx.fillStyle = `rgba(255, 220, 0, ${pulse})`;
      ctx.fillRect(cx - 8, legY + legH - 3, 7, 1);
      ctx.fillRect(cx - 1, legY + legH - 3, 7, 1);
      // Glow under boots
      ctx.fillStyle = `rgba(255, 220, 0, ${pulse * 0.3})`;
      ctx.fillRect(cx - 9, legY + legH, 8, 2);
      ctx.fillRect(cx - 1, legY + legH, 8, 2);
      // Timer bar above head
      const remaining = Math.max(0, (this.jumpBootsEndTime - Date.now()) / 10000);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(headX - 2, headY - 14, headW + 4, 4);
      ctx.fillStyle = `rgba(255, 220, 0, 0.9)`;
      ctx.fillRect(headX - 2, headY - 14, (headW + 4) * remaining, 4);
    }

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
      ? (this.punchEffect && this.punchEffect.isBlackFlash ? '#1a0000'
        : this.punchEffect && this.punchEffect.isFireBlast ? '#FF2200'
        : this.punchEffect && this.punchEffect.isFireBall ? '#FF6600'
        : this.punchEffect && this.punchEffect.isStrong ? '#FF4400' : '#FFD700')
      : (this.ironGlovesActive ? '#8899AA' : skinColor);
    ctx.fillStyle = fistColor;
    ctx.fillRect(frontArmX, armY + frontArmH, armW + 1, 4);

    // --- IRON GLOVES visual (metal overlay on both fists when active) ---
    if (this.ironGlovesActive) {
      const time = Date.now() / 1000;
      const pulse = Math.sin(time * 5) * 0.2 + 0.8;
      // Metal glove on back hand
      ctx.fillStyle = '#778899';
      ctx.fillRect(backArmX - 1, armY + armH - 1, armW + 2, 5);
      ctx.fillStyle = `rgba(180, 210, 230, ${pulse})`;
      ctx.fillRect(backArmX, armY + armH, armW, 1);
      // Metal glove on front hand (idle position only — punch anim overrides color above)
      if (punchProgress <= 0.1) {
        ctx.fillStyle = '#778899';
        ctx.fillRect(frontArmX - 1, armY + frontArmH - 1, armW + 2, 5);
        ctx.fillStyle = `rgba(180, 210, 230, ${pulse})`;
        ctx.fillRect(frontArmX, armY + frontArmH, armW, 1);
      }
      // Timer bar
      const remaining = Math.max(0, (this.ironGlovesEndTime - Date.now()) / 10000);
      const barOffset = this.jumpBootsActive ? -20 : -14;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(headX - 2, headY + barOffset, headW + 4, 4);
      ctx.fillStyle = `rgba(140, 180, 210, 0.9)`;
      ctx.fillRect(headX - 2, headY + barOffset, (headW + 4) * remaining, 4);
    }

    // --- PUNCH IMPACT EFFECT ---
    if (this.punchEffect && this.punchEffect.active) {
      const progress = this.punchEffect.elapsed / this.punchEffect.duration;
      const isStrong = this.punchEffect.isStrong;
      const isFireBall = this.punchEffect.isFireBall;
      const isFireBlast = this.punchEffect.isFireBlast;
      const isBlackFlash = this.punchEffect.isBlackFlash;

      // Alpha: black flash holds then fades; fire blast holds half then fades; others fade linearly
      const alpha = isBlackFlash
        ? (progress < 0.4 ? 1 : 1 - ((progress - 0.4) / 0.6))
        : isFireBlast
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
      } else if (isBlackFlash) {
        // Black Flash: sharp slash streaks from fist — red outlined, white core, no background
        ctx.save();
        ctx.lineCap = 'butt';

        const fistTipX = impactX;
        const fistTipY = impactY;
        const baseDir = this.facingRight ? 0 : Math.PI;
        const t = this.punchEffect.elapsed;

        // Define slash lines: each is a long thin streak at a slight angle from base direction
        // Angles are small offsets from facing direction (like speed lines / slashes)
        const slashes = [
          { angleOffset: -0.18, len: 90, delay: 0 },
          { angleOffset:  0.00, len: 110, delay: 0 },
          { angleOffset:  0.18, len: 85, delay: 0 },
          { angleOffset: -0.32, len: 65, delay: 0.02 },
          { angleOffset:  0.32, len: 70, delay: 0.02 },
          { angleOffset: -0.08, len: 130, delay: 0 },   // long center streak
          { angleOffset:  0.08, len: 120, delay: 0 },
          { angleOffset: -0.50, len: 45, delay: 0.04 },
          { angleOffset:  0.50, len: 48, delay: 0.04 },
        ];

        slashes.forEach(s => {
          const localProgress = Math.max(0, progress - s.delay / this.punchEffect.duration);
          if (localProgress <= 0) return;
          const a = 1 - localProgress;
          if (a <= 0) return;

          const angle = baseDir + s.angleOffset;
          const len = s.len * (1 - progress * 0.2);
          const perpAngle = angle + Math.PI / 2;

          const startX = fistTipX - Math.cos(angle) * len * 0.15;
          const startY = fistTipY - Math.sin(angle) * len * 0.15;
          const endX   = fistTipX + Math.cos(angle) * len * 0.85;
          const endY   = fistTipY + Math.sin(angle) * len * 0.85;

          // Draw a tapered lozenge: pointed at both ends, widest in the middle
          const drawLozenge = (halfW) => {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const px = Math.cos(perpAngle) * halfW;
            const py = Math.sin(perpAngle) * halfW;
            ctx.beginPath();
            ctx.moveTo(startX, startY);           // back point
            ctx.lineTo(midX + px, midY + py);     // top middle
            ctx.lineTo(endX, endY);               // front point
            ctx.lineTo(midX - px, midY - py);     // bottom middle
            ctx.closePath();
          };

          // Black outer
          drawLozenge(6);
          ctx.fillStyle = `rgba(0, 0, 0, ${a * 0.95})`;
          ctx.fill();

          // Red mid
          drawLozenge(4);
          ctx.fillStyle = `rgba(220, 0, 0, ${a * 0.8})`;
          ctx.fill();

          // White core
          drawLozenge(1.5);
          ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.95})`;
          ctx.fill();
        });

        // Bright white flash at fist origin on first hit
        if (progress < 0.25) {
          const coreA = (1 - progress / 0.25) * alpha;
          const grad = ctx.createRadialGradient(fistTipX, fistTipY, 0, fistTipX, fistTipY, 18);
          grad.addColorStop(0, `rgba(255, 255, 255, ${coreA})`);
          grad.addColorStop(0.5, `rgba(255, 100, 100, ${coreA * 0.6})`);
          grad.addColorStop(1, `rgba(200, 0, 0, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fistTipX, fistTipY, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
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

    // --- THRUSTER HANDS DASH EFFECT ---
    if (this.dashing) {
      const trailDir = this.facingRight ? -1 : 1;
      const time = Date.now() / 80;
      for (let i = 1; i <= 6; i++) {
        const tx = cx + trailDir * i * 12;
        const ty = by + this.height / 2 + Math.sin(time + i) * 4;
        const ta = 0.8 * (1 - i / 7);
        const r = (8 - i) * 1.2;
        // Outer orange
        ctx.fillStyle = `rgba(255, ${Math.floor(120 - i * 15)}, 0, ${ta * 0.7})`;
        ctx.beginPath();
        ctx.arc(tx, ty, r + 3, 0, Math.PI * 2);
        ctx.fill();
        // Cyan core
        ctx.fillStyle = `rgba(0, 229, 255, ${ta})`;
        ctx.beginPath();
        ctx.arc(tx, ty, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Glow on hands
      ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(frontArmX + (this.facingRight ? armW : 0), armY + frontArmH, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 150, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(frontArmX + (this.facingRight ? armW : 0), armY + frontArmH, 12, 0, Math.PI * 2);
      ctx.fill();
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
