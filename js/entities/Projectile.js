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
    }
  }

  update(deltaTime) {
    if (this.type === 'CONTROLLED_FIRE_BALL') {
      // Steer toward target (mouse position)
      const dx = this.targetX - (this.x + this.width / 2);
      const dy = this.targetY - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        this.velocityX += (dx / dist) * 1.2; // gradual steering
        this.velocityY += (dy / dist) * 1.2;
        // Cap speed
        const spd = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (spd > this.speed) {
          this.velocityX = (this.velocityX / spd) * this.speed;
          this.velocityY = (this.velocityY / spd) * this.speed;
        }
      }
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
  renderControlledFireBall(ctx) {
    const cx = this.x + this.width / 2;
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
