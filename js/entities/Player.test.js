/**
 * Unit tests for Player class
 */

import { Player } from './Player.js';

// Mock InputHandler for testing
class MockInputHandler {
  constructor() {
    this.keys = {};
  }
  
  isKeyPressed(key) {
    return this.keys[key] || false;
  }
  
  setKey(key, pressed) {
    this.keys[key] = pressed;
  }
}

// Mock Island for testing
class MockIsland {
  constructor() {
    this.x = 100;
    this.y = 500;
    this.width = 800;
    this.height = 100;
  }
}

describe('Player', () => {
  describe('Constructor', () => {
    test('initializes with correct starting values', () => {
      const player = new Player(400, 400);
      
      expect(player.x).toBe(400);
      expect(player.y).toBe(400);
      expect(player.hp).toBe(100);
      expect(player.maxHp).toBe(100);
      expect(player.velocityX).toBe(0);
      expect(player.velocityY).toBe(0);
      expect(player.width).toBe(32);
      expect(player.height).toBe(48);
      expect(player.isGrounded).toBe(false);
      expect(player.punchCooldown).toBe(0);
      expect(player.shieldActive).toBe(false);
    });
    
    test('initializes ability slots as null', () => {
      const player = new Player(400, 400);
      
      expect(player.abilities.z).toBeNull();
      expect(player.abilities.x).toBeNull();
      expect(player.abilities.c).toBeNull();
      expect(player.abilities.v).toBeNull();
    });
    
    test('initializes ability cooldowns to zero', () => {
      const player = new Player(400, 400);
      
      expect(player.abilityCooldowns.z).toBe(0);
      expect(player.abilityCooldowns.x).toBe(0);
      expect(player.abilityCooldowns.c).toBe(0);
      expect(player.abilityCooldowns.v).toBe(0);
    });
  });
  
  describe('Horizontal Movement', () => {
    test('moves left when A key is pressed', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      input.setKey('a', true);
      const initialX = player.x;
      
      player.update(1/60, input, island);
      
      expect(player.x).toBeLessThan(initialX);
      expect(player.facingRight).toBe(false);
    });
    
    test('moves right when D key is pressed', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      input.setKey('d', true);
      const initialX = player.x;
      
      player.update(1/60, input, island);
      
      expect(player.x).toBeGreaterThan(initialX);
      expect(player.facingRight).toBe(true);
    });
    
    test('applies friction when no movement keys pressed', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      // Give player some velocity
      player.velocityX = 5;
      
      // Update without pressing keys
      player.update(1/60, input, island);
      
      // Velocity should be reduced by friction
      expect(Math.abs(player.velocityX)).toBeLessThan(5);
    });
  });
  
  describe('Jumping', () => {
    test('applies upward velocity when Space is pressed and grounded', () => {
      const player = new Player(400, 452);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      // Make sure player is grounded
      player.isGrounded = true;
      player.velocityY = 0;
      
      input.setKey('space', true);
      
      player.update(1/60, input, island);
      
      expect(player.velocityY).toBeLessThan(0); // Negative = upward
      expect(player.isGrounded).toBe(false);
    });
    
    test('does not jump when not grounded', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.isGrounded = false;
      player.velocityY = 2;
      
      input.setKey('space', true);
      
      player.update(1/60, input, island);
      
      // Velocity should only change due to gravity, not jumping
      expect(player.velocityY).not.toBe(player.jumpStrength);
    });
  });
  
  describe('Gravity and Ground Collision', () => {
    test('applies gravity when in air', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.velocityY = 0;
      player.isGrounded = false;
      
      player.update(1/60, input, island);
      
      expect(player.velocityY).toBeGreaterThan(0); // Positive = downward
    });
    
    test('stops falling when reaching ground', () => {
      const player = new Player(400, 500);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.velocityY = 10;
      
      player.update(1/60, input, island);
      
      expect(player.isGrounded).toBe(true);
      expect(player.velocityY).toBe(0);
      expect(player.y).toBe(island.y - player.height);
    });
  });
  
  describe('Island Boundary Constraints', () => {
    test('constrains player to left boundary', () => {
      const player = new Player(50, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      input.setKey('a', true);
      
      // Update multiple times to try to move past boundary
      for (let i = 0; i < 20; i++) {
        player.update(1/60, input, island);
      }
      
      expect(player.x).toBeGreaterThanOrEqual(island.x);
    });
    
    test('constrains player to right boundary', () => {
      const player = new Player(850, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      input.setKey('d', true);
      
      // Update multiple times to try to move past boundary
      for (let i = 0; i < 20; i++) {
        player.update(1/60, input, island);
      }
      
      expect(player.x).toBeLessThanOrEqual(island.x + island.width - player.width);
    });
  });
  
  describe('takeDamage', () => {
    test('reduces HP by damage amount', () => {
      const player = new Player(400, 400);
      
      player.takeDamage(30);
      
      expect(player.hp).toBe(70);
    });
    
    test('does not reduce HP below zero', () => {
      const player = new Player(400, 400);
      
      player.takeDamage(150);
      
      expect(player.hp).toBe(0);
    });
    
    test('does not take damage when shield is active', () => {
      const player = new Player(400, 400);
      player.shieldActive = true;
      
      player.takeDamage(50);
      
      expect(player.hp).toBe(100);
    });
  });
  
  describe('punch', () => {
    test('returns hitbox when cooldown is ready', () => {
      const player = new Player(400, 400);
      player.punchCooldown = 0;
      
      const hitbox = player.punch();
      
      expect(hitbox).not.toBeNull();
      expect(hitbox.damage).toBe(10);
      expect(hitbox.width).toBe(50);
    });
    
    test('sets cooldown after punching', () => {
      const player = new Player(400, 400);
      player.punchCooldown = 0;
      
      player.punch();
      
      expect(player.punchCooldown).toBe(0.2);
    });
    
    test('returns null when cooldown is active', () => {
      const player = new Player(400, 400);
      player.punchCooldown = 0.1;
      
      const hitbox = player.punch();
      
      expect(hitbox).toBeNull();
    });
    
    test('creates hitbox in front of player when facing right', () => {
      const player = new Player(400, 400);
      player.facingRight = true;
      
      const hitbox = player.punch();
      
      expect(hitbox.x).toBe(player.x + player.width);
    });
    
    test('creates hitbox in front of player when facing left', () => {
      const player = new Player(400, 400);
      player.facingRight = false;
      
      const hitbox = player.punch();
      
      expect(hitbox.x).toBe(player.x - 50);
    });
    
    // Req 2.2: Punch range must be a short distance (40-60 pixels)
    test('punch range is between 40 and 60 pixels', () => {
      const player = new Player(400, 400);
      
      const hitbox = player.punch();
      
      expect(hitbox.width).toBeGreaterThanOrEqual(40);
      expect(hitbox.width).toBeLessThanOrEqual(60);
    });
    
    test('punch hitbox has correct height matching player height', () => {
      const player = new Player(400, 400);
      
      const hitbox = player.punch();
      
      expect(hitbox.height).toBe(player.height);
    });
    
    test('punch hitbox y position matches player y position', () => {
      const player = new Player(400, 400);
      
      const hitbox = player.punch();
      
      expect(hitbox.y).toBe(player.y);
    });
  });
  
  describe('Cooldown Updates', () => {
    test('decreases punch cooldown over time', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.punchCooldown = 0.2;
      
      player.update(0.1, input, island);
      
      expect(player.punchCooldown).toBeCloseTo(0.1, 5);
    });
    
    test('clamps punch cooldown to zero', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.punchCooldown = 0.05;
      
      player.update(0.1, input, island);
      
      expect(player.punchCooldown).toBe(0);
    });
    
    test('decreases ability cooldowns over time', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.abilityCooldowns.z = 1.0;
      player.abilityCooldowns.x = 3.0;
      
      player.update(0.5, input, island);
      
      expect(player.abilityCooldowns.z).toBeCloseTo(0.5, 5);
      expect(player.abilityCooldowns.x).toBeCloseTo(2.5, 5);
    });
  });
  
  describe('Shield Duration', () => {
    test('deactivates shield when duration expires', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.shieldActive = true;
      player.shieldEndTime = Date.now() - 1000; // Expired 1 second ago
      
      player.update(1/60, input, island);
      
      expect(player.shieldActive).toBe(false);
    });
    
    test('keeps shield active when duration not expired', () => {
      const player = new Player(400, 400);
      const input = new MockInputHandler();
      const island = new MockIsland();
      
      player.shieldActive = true;
      player.shieldEndTime = Date.now() + 5000; // Expires in 5 seconds
      
      player.update(1/60, input, island);
      
      expect(player.shieldActive).toBe(true);
    });
  });
  
  describe('useAbility', () => {
    test('returns false when ability is not owned', () => {
      const player = new Player(400, 400);
      player.abilities.z = null;
      
      const result = player.useAbility('z');
      
      expect(result).toBe(false);
    });
    
    test('returns false when cooldown is active', () => {
      const player = new Player(400, 400);
      player.abilities.z = 'STRONG_PUNCH';
      player.abilityCooldowns.z = 0.5;
      
      const result = player.useAbility('z');
      
      expect(result).toBe(false);
    });
    
    test('returns true when ability is owned and off cooldown', () => {
      const player = new Player(400, 400);
      player.abilities.z = 'STRONG_PUNCH';
      player.abilityCooldowns.z = 0;
      
      const result = player.useAbility('z');
      
      expect(result).toBe(true);
    });
  });
  
  describe('render', () => {
    // Mock canvas context for rendering tests
    let mockCtx;
    
    beforeEach(() => {
      mockCtx = {
        imageSmoothingEnabled: true,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        stroke: jest.fn()
      };
    });
    
    test('disables image smoothing for pixelated art style', () => {
      const player = new Player(400, 400);
      
      player.render(mockCtx);
      
      expect(mockCtx.imageSmoothingEnabled).toBe(false);
    });
    
    test('draws player body to canvas', () => {
      const player = new Player(400, 400);
      
      player.render(mockCtx);
      
      // Should call fillRect for body
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        player.x,
        player.y,
        player.width,
        player.height
      );
    });
    
    test('draws player head to canvas', () => {
      const player = new Player(400, 400);
      
      player.render(mockCtx);
      
      // Should call fillRect for head (offset from body)
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        player.x + 8,
        player.y + 4,
        16,
        16
      );
    });
    
    test('draws eyes based on facing direction', () => {
      const player = new Player(400, 400);
      
      // Test facing right
      player.facingRight = true;
      player.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        player.x + 18,
        player.y + 10,
        4,
        4
      );
      
      // Reset mock
      mockCtx.fillRect.mockClear();
      
      // Test facing left
      player.facingRight = false;
      player.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        player.x + 10,
        player.y + 10,
        4,
        4
      );
    });
    
    test('draws shield effect when shield is active', () => {
      const player = new Player(400, 400);
      player.shieldActive = true;
      
      player.render(mockCtx);
      
      // Should draw shield arc
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalledWith(
        player.x + player.width / 2,
        player.y + player.height / 2,
        player.width,
        0,
        Math.PI * 2
      );
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
    
    test('does not draw shield effect when shield is inactive', () => {
      const player = new Player(400, 400);
      player.shieldActive = false;
      
      player.render(mockCtx);
      
      // Should not draw shield arc
      const arcCalls = mockCtx.arc.mock.calls.length;
      expect(arcCalls).toBe(0);
    });
  });
});
