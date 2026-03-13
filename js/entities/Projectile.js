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
    }
  }
  
  update(deltaTime) {
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
}

export { Projectile };
