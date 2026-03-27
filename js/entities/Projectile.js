/**
 * Projectile class for ranged abilities (Fire Ball, Tornado)
 */
class Projectile {
  constructor(x, y, velocityX, velocityY, damage, type, owner) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.damage = damage;
    this.type = type; // 'FIRE_BALL' or 'TORNADO'
    this.owner = owner; // 'player' or 'bot'
    this.active = true;
    this.lifetime = 5.0; // seconds
    this.elapsed = 0;
    
    // Size based on type
    if (type === 'FIRE_BALL') {
      this.width = 20;
      this.height = 20;
    } else if (type === 'TORNADO') {
      this.width = 60;
      this.height = 80;
    } else if (type === 'CONTROLLED_FIRE_BALL') {
      this.width = 32;
      this.height = 32;
      this.speed = 7;       // homing speed
      this.targetX = x;     // updated each frame by GameEngine
      this.targetY = y;
    } else if (type === 'PLASMA_LASER') {
      this.width = 16;
      this.height = 16;
      this.lifetime = 2.0;
    } else if (type === 'BOMB') {
      this.width = 18;
      this.height = 18;
      this.gravity = 0.4;
      this.exploded = false;
      this.explosionRadius = 100;
      this.explosionElapsed = 0;
      this.explosionDuration = 0.5;
      this.lifetime = 4.0;
    } else if (type === 'FROSTBITE') {
      this.width = 18;
      this.height = 18;
      this.lifetime = 3.0;
    } else if (type === 'MAGMA_ROCK') {
      this.width = 22;
      this.height = 22;
      this.gravity = 0.25;
      this.lifetime = 3.0;
    }
  }

  update(deltaTime) {
    if (this.type === 'CONTROLLED_FIRE_BALL') {
      // Steer toward target (mouse position)
      const dx = this.targetX - (this.x + this.width / 2);
      const dy = this.targetY - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        this.velocityX += (dx / dist) * 1.2;
        this.velocityY += (dy / dist) * 1.2;
        const spd = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (spd > this.speed) {
          this.velocityX = (this.velocityX / spd) * this.speed;
          this.velocityY = (this.velocityY / spd) * this.speed;
        }
      }
    }

    if (this.type === 'BOMB') {
      if (this.exploded) {        // Animate explosion, then deactivate
        this.explosionElapsed += deltaTime;
        if (this.explosionElapsed >= this.explosionDuration) {
          this.active = false;
        }
        return; // don't move while exploding
      }
      // Apply gravity so it arcs
      this.velocityY += this.gravity;
    }

    if (this.type === 'MAGMA_ROCK') {
      this.velocityY += this.gravity;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;
    this.elapsed += deltaTime;

    if (this.elapsed >= this.lifetime) {
      this.active = false;
    }
  }
  
  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    
    if (this.type === 'FIRE_BALL') {
      this.renderFireBall(ctx);
    } else if (this.type === 'TORNADO') {
      this.renderTornado(ctx);
    } else if (this.type === 'CONTROLLED_FIRE_BALL') {
      this.renderControlledFireBall(ctx);
    } else if (this.type === 'PLASMA_LASER') {
      this.renderPlasmaLaser(ctx);
    } else if (this.type === 'BOMB') {
      this.renderBomb(ctx);
    } else if (this.type === 'FROSTBITE') {
      this.renderFrostbite(ctx);
    } else if (this.type === 'MAGMA_ROCK') {
      this.renderMagmaRock(ctx);
    }
  }
  
  renderFireBall(ctx) {
    // Draw fire ball
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Outer glow
    ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Main fire ball
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width / 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  renderTornado(ctx) {
    const spin = this.elapsed * 10; // Rotation speed
    
    // Draw tornado as spinning spiral
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 5; i++) {
      const offset = (spin + i * 72) % 360;
      const angle = (offset * Math.PI) / 180;
      const radius = 20 + i * 5;
      
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        radius,
        angle,
        angle + Math.PI
      );
      ctx.stroke();
    }
    
    // Draw debris particles
    ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
    for (let i = 0; i < 8; i++) {
      const angle = (spin * 2 + i * 45) * Math.PI / 180;
      const radius = 25;
      const px = this.x + this.width / 2 + Math.cos(angle) * radius;
      const py = this.y + this.height / 2 + Math.sin(angle) * radius;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }
  }
  renderMagmaRock(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const t = this.elapsed;
    const spin = t * 4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);

    // Rocky outer shape (irregular polygon)
    ctx.fillStyle = '#5a2200';
    ctx.beginPath();
    const pts = 8;
    for (let i = 0; i < pts; i++) {
      const angle = (i / pts) * Math.PI * 2;
      const r = 10 + Math.sin(i * 2.3) * 3;
      i === 0 ? ctx.moveTo(Math.cos(angle)*r, Math.sin(angle)*r)
              : ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
    }
    ctx.closePath();
    ctx.fill();

    // Glowing lava cracks
    const crackGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
    crackGrad.addColorStop(0, `rgba(255, 220, 50, 0.95)`);
    crackGrad.addColorStop(0.4, `rgba(255, 80, 0, 0.8)`);
    crackGrad.addColorStop(1, `rgba(150, 20, 0, 0)`);
    ctx.fillStyle = crackGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ember sparks trailing behind
    ctx.restore();
    const trailAngle = Math.atan2(-this.velocityY, -this.velocityX);
    for (let i = 1; i <= 4; i++) {
      const tx = cx + Math.cos(trailAngle) * i * 6;
      const ty = cy + Math.sin(trailAngle) * i * 6;
      const ta = 0.7 * (1 - i / 5);
      ctx.fillStyle = `rgba(255, ${Math.floor(120 - i*20)}, 0, ${ta})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 4 - i * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderFrostbite(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = Math.sin(this.elapsed * 18) * 0.2 + 1;
    const r = 9 * pulse;

    // Outer icy glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.3, 'rgba(100, 210, 255, 0.8)');
    grad.addColorStop(0.7, 'rgba(0, 120, 220, 0.4)');
    grad.addColorStop(1, 'rgba(0, 60, 180, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.fill();

    // Ice crystal spikes (6-pointed)
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.9)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.elapsed * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r * 1.4, cy + Math.sin(angle) * r * 1.4);
      ctx.stroke();
      // Side branches
      const bAngle1 = angle + 0.4;
      const bAngle2 = angle - 0.4;
      const bLen = r * 0.6;
      const bx = cx + Math.cos(angle) * r * 0.7;
      const by = cy + Math.sin(angle) * r * 0.7;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle1) * bLen, by + Math.sin(bAngle1) * bLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle2) * bLen, by + Math.sin(bAngle2) * bLen);
      ctx.stroke();
    }

    // Core
    ctx.fillStyle = 'rgba(220, 245, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderBomb(ctx) {    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    if (this.exploded) {
      // Explosion animation
      const progress = this.explosionElapsed / this.explosionDuration;
      const alpha = 1 - progress;
      const r = this.explosionRadius * (0.3 + progress * 0.7);

      // Outer shockwave ring
      ctx.save();
      ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.6})`;
      ctx.lineWidth = 6 * (1 - progress);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Fireball
      const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.7);
      fireGrad.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
      fireGrad.addColorStop(0.3, `rgba(255, 180, 0, ${alpha * 0.9})`);
      fireGrad.addColorStop(0.7, `rgba(255, 60, 0, ${alpha * 0.6})`);
      fireGrad.addColorStop(1, `rgba(100, 0, 0, 0)`);
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Debris sparks
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + progress * 3;
        const dist = r * 0.8 * progress;
        ctx.fillStyle = `rgba(255, ${150 + i * 10}, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 4 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Fuse flicker
    const fuseAlpha = Math.sin(this.elapsed * 20) * 0.5 + 0.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bomb body
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Fuse
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 9);
    ctx.quadraticCurveTo(cx + 8, cy - 18, cx + 4, cy - 22);
    ctx.stroke();

    // Fuse spark
    ctx.fillStyle = `rgba(255, 220, 50, ${fuseAlpha})`;
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 22, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 100, 0, ${fuseAlpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 22, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  renderPlasmaLaser(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const t = this.elapsed;
    const pulse = Math.sin(t * 30) * 0.3 + 1;

    // Direction of travel
    const angle = Math.atan2(this.velocityY, this.velocityX);
    const trailLen = 60;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Outer glow trail
    const outerGrad = ctx.createLinearGradient(-trailLen, 0, 16, 0);
    outerGrad.addColorStop(0, 'rgba(180, 0, 255, 0)');
    outerGrad.addColorStop(0.5, 'rgba(180, 0, 255, 0.4)');
    outerGrad.addColorStop(1, 'rgba(0, 255, 255, 0.6)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(-trailLen, -10 * pulse, trailLen + 16, 20 * pulse);

    // Core beam trail
    const coreGrad = ctx.createLinearGradient(-trailLen, 0, 16, 0);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    coreGrad.addColorStop(0.6, 'rgba(0, 255, 255, 0.9)');
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(-trailLen, -4, trailLen + 16, 8);

    // Bright tip
    const tipGrad = ctx.createRadialGradient(8, 0, 0, 8, 0, 14 * pulse);
    tipGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    tipGrad.addColorStop(0.4, 'rgba(0, 255, 255, 0.9)');
    tipGrad.addColorStop(1, 'rgba(180, 0, 255, 0)');
    ctx.fillStyle = tipGrad;
    ctx.beginPath();
    ctx.arc(8, 0, 14 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderControlledFireBall(ctx) {    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = Math.sin(this.elapsed * 15) * 0.15 + 1;
    const r = (this.width / 2) * pulse;

    // Outer halo
    ctx.fillStyle = 'rgba(255, 60, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.fill();

    // Main ball
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.25, '#FFFF00');
    grad.addColorStop(0.6, '#FF6600');
    grad.addColorStop(1, '#CC0000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Trailing fire particles
    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    if (speed > 0.5) {
      const trailAngle = Math.atan2(-this.velocityY, -this.velocityX);
      for (let i = 1; i <= 5; i++) {
        const tx = cx + Math.cos(trailAngle) * i * 7;
        const ty = cy + Math.sin(trailAngle) * i * 7;
        const tr = (r * 0.7) * (1 - i / 6);
        const ta = 0.6 * (1 - i / 6);
        ctx.fillStyle = `rgba(255, ${Math.floor(100 - i * 15)}, 0, ${ta})`;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export { Projectile };
