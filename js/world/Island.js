/**
 * Island class - 4 themed islands with backgrounds and platforms
 */
class Island {
  constructor(levelNumber, islandTheme = 1) {
    const widths = { 1: 800, 2: 950, 3: 1100, 4: 1300 };
    this.width = widths[islandTheme] || 800;
    this.height = 100;
    this.x = Math.max(0, (1000 - this.width) / 2);
    this.y = 500;
    this.islandTheme = islandTheme;
  }

  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }

  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    switch (this.islandTheme) {
      case 1: this.renderIsland1(ctx); break;
      case 2: this.renderIsland2(ctx); break;
      case 3: this.renderIsland3(ctx); break;
      case 4: this.renderIsland4(ctx); break;
      default: this.renderIsland1(ctx);
    }
  }

  // ── ISLAND 1: Grassy with ancient ruins ──────────────────────────────────
  renderIsland1(ctx) {
    const { x, y, width, height } = this;

    // Dirt/earth body
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x, y + 18, width, height - 18);

    // Grass top
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x, y, width, 18);
    // Grass tufts
    ctx.fillStyle = '#388E3C';
    for (let i = 0; i < Math.floor(width / 60); i++) {
      ctx.fillRect(x + i * 60 + 8, y, 12, 8);
      ctx.fillRect(x + i * 60 + 24, y, 8, 6);
    }

    // Ancient ruins: stone pillars
    ctx.fillStyle = '#9E9E9E';
    const pillarPositions = [0.1, 0.25, 0.5, 0.72, 0.88];
    pillarPositions.forEach(p => {
      const px = x + width * p;
      // Pillar base
      ctx.fillRect(px - 10, y - 40, 20, 40);
      // Pillar cap
      ctx.fillStyle = '#757575';
      ctx.fillRect(px - 13, y - 44, 26, 6);
      // Cracks
      ctx.fillStyle = '#616161';
      ctx.fillRect(px - 2, y - 35, 2, 20);
      ctx.fillStyle = '#9E9E9E';
    });

    // Mossy stone blocks scattered
    ctx.fillStyle = '#6D8B74';
    for (let i = 0; i < Math.floor(width / 120); i++) {
      ctx.fillRect(x + i * 120 + 40, y - 12, 28, 12);
      ctx.fillStyle = '#4E6B55';
      ctx.fillRect(x + i * 120 + 44, y - 10, 8, 4);
      ctx.fillStyle = '#6D8B74';
    }

    // Bottom edge
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x, y + height - 10, width, 10);
  }

  // ── ISLAND 2: Half frozen / half volcanic ────────────────────────────────
  renderIsland2(ctx) {
    const { x, y, width, height } = this;
    const mid = x + width / 2;

    // Left half: frozen (ice blue)
    ctx.fillStyle = '#B3E5FC';
    ctx.fillRect(x, y, width / 2, height);

    // Right half: volcanic (dark rock)
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(mid, y, width / 2, height);

    // Frozen top surface — ice
    ctx.fillStyle = '#E1F5FE';
    ctx.fillRect(x, y, width / 2, 16);
    // Ice cracks
    ctx.strokeStyle = '#81D4FA';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const ix = x + i * (width / 12);
      ctx.beginPath();
      ctx.moveTo(ix, y);
      ctx.lineTo(ix + 10, y + 10);
      ctx.lineTo(ix + 6, y + 16);
      ctx.stroke();
    }
    // Ice spikes
    ctx.fillStyle = '#B3E5FC';
    for (let i = 0; i < 8; i++) {
      const sx = x + i * (width / 16) + 4;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + 5, y - 14);
      ctx.lineTo(sx + 10, y);
      ctx.closePath();
      ctx.fill();
    }

    // Volcanic top surface — lava cracks
    const lavaGrad = ctx.createLinearGradient(0, y, 0, y + 16);
    lavaGrad.addColorStop(0, '#FF5722');
    lavaGrad.addColorStop(1, '#BF360C');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(mid, y, width / 2, 16);
    // Lava crack lines
    ctx.strokeStyle = '#FF8F00';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const lx = mid + i * (width / 10) + 10;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx + 8, y + 8);
      ctx.lineTo(lx + 4, y + 16);
      ctx.stroke();
    }

    // Dividing line (glowing seam)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mid, y);
    ctx.lineTo(mid, y + height);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,220,255,0.5)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Bottom edge
    ctx.fillStyle = '#1A237E';
    ctx.fillRect(x, y + height - 10, width / 2, 10);
    ctx.fillStyle = '#1B0000';
    ctx.fillRect(mid, y + height - 10, width / 2, 10);
  }

  // ── ISLAND 3: Sandy beach with palm trees ────────────────────────────────
  renderIsland3(ctx) {
    const { x, y, width, height } = this;

    // Sandy body
    ctx.fillStyle = '#C2A05A';
    ctx.fillRect(x, y, width, height);

    // Lighter sand top
    ctx.fillStyle = '#E8C97A';
    ctx.fillRect(x, y, width, 20);

    // Sand ripple texture
    ctx.strokeStyle = '#D4B060';
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.floor(width / 40); i++) {
      ctx.beginPath();
      ctx.arc(x + i * 40 + 20, y + 10, 14, 0, Math.PI);
      ctx.stroke();
    }

    // Palm trees
    const palmPositions = [0.08, 0.28, 0.52, 0.74, 0.92];
    palmPositions.forEach(p => {
      const px = x + width * p;
      // Trunk
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(px - 4, y - 55, 8, 55);
      // Trunk curve detail
      ctx.fillStyle = '#795548';
      for (let s = 0; s < 5; s++) {
        ctx.fillRect(px - 4, y - 10 - s * 10, 8, 3);
      }
      // Leaves (5 fronds)
      ctx.fillStyle = '#388E3C';
      const fronds = [
        [-30, -20], [-20, -35], [0, -40], [20, -35], [30, -20]
      ];
      fronds.forEach(([fx, fy]) => {
        ctx.beginPath();
        ctx.moveTo(px, y - 55);
        ctx.quadraticCurveTo(px + fx * 0.5, y - 55 + fy * 0.5, px + fx, y - 55 + fy);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#2E7D32';
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#43A047';
        ctx.stroke();
      });
      // Coconuts
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(px - 5, y - 52, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 5, y - 50, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Seashells on sand
    ctx.fillStyle = '#FFCCBC';
    for (let i = 0; i < Math.floor(width / 80); i++) {
      const sx = x + i * 80 + 30;
      ctx.beginPath();
      ctx.arc(sx, y + 8, 5, Math.PI, 0);
      ctx.fill();
    }

    // Bottom edge (wet sand)
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(x, y + height - 10, width, 10);
  }

  // ── ISLAND 4: Futuristic with buildings in background ────────────────────
  renderIsland4(ctx) {
    const { x, y, width, height } = this;

    // Background buildings (drawn behind platform)
    this._drawFuturisticBuildings(ctx, x, y, width);

    // Platform base — dark metal
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(x, y, width, height);

    // Metal panel lines
    ctx.strokeStyle = '#16213E';
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.floor(width / 80); i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 80, y);
      ctx.lineTo(x + i * 80, y + height);
      ctx.stroke();
    }

    // Glowing top surface
    const techGrad = ctx.createLinearGradient(0, y, 0, y + 20);
    techGrad.addColorStop(0, '#00E5FF');
    techGrad.addColorStop(0.5, '#0288D1');
    techGrad.addColorStop(1, '#01579B');
    ctx.fillStyle = techGrad;
    ctx.fillRect(x, y, width, 16);

    // Energy grid on top
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.floor(width / 40); i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 40, y);
      ctx.lineTo(x + i * 40, y + 16);
      ctx.stroke();
    }

    // Glowing edge lights
    ctx.fillStyle = '#00E5FF';
    for (let i = 0; i < Math.floor(width / 50); i++) {
      ctx.fillRect(x + i * 50 + 2, y + 2, 6, 6);
    }

    // Bottom edge
    ctx.fillStyle = '#0D0D1A';
    ctx.fillRect(x, y + height - 10, width, 10);
    ctx.strokeStyle = '#00B0FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height - 10);
    ctx.lineTo(x + width, y + height - 10);
    ctx.stroke();
  }

  _drawFuturisticBuildings(ctx, islandX, islandY, islandWidth) {
    const buildings = [
      { rx: 0.02, w: 60, h: 180, color: '#0D1B2A', accent: '#00E5FF' },
      { rx: 0.10, w: 45, h: 220, color: '#1B2838', accent: '#7C4DFF' },
      { rx: 0.18, w: 80, h: 150, color: '#0A1628', accent: '#00E5FF' },
      { rx: 0.30, w: 50, h: 260, color: '#162032', accent: '#FF6D00' },
      { rx: 0.40, w: 70, h: 190, color: '#0D1B2A', accent: '#00E5FF' },
      { rx: 0.52, w: 55, h: 240, color: '#1A1A2E', accent: '#7C4DFF' },
      { rx: 0.62, w: 90, h: 170, color: '#0A1628', accent: '#00E5FF' },
      { rx: 0.74, w: 48, h: 210, color: '#162032', accent: '#FF6D00' },
      { rx: 0.84, w: 65, h: 195, color: '#0D1B2A', accent: '#00E5FF' },
      { rx: 0.93, w: 55, h: 230, color: '#1B2838', accent: '#7C4DFF' },
    ];

    buildings.forEach(b => {
      const bx = islandX + islandWidth * b.rx;
      const by = islandY - b.h;

      // Building body
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, b.w, b.h);

      // Window grid
      ctx.fillStyle = b.accent;
      const cols = Math.floor(b.w / 14);
      const rows = Math.floor(b.h / 18);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.35) {
            ctx.globalAlpha = 0.4 + Math.random() * 0.4;
            ctx.fillRect(bx + c * 14 + 3, by + r * 18 + 4, 8, 10);
          }
        }
      }
      ctx.globalAlpha = 1;

      // Antenna / spire on top
      ctx.fillStyle = b.accent;
      ctx.fillRect(bx + b.w / 2 - 2, by - 20, 4, 20);
      ctx.beginPath();
      ctx.arc(bx + b.w / 2, by - 20, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

export { Island };
