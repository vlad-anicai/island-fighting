/**
 * Unit tests for Island class
 */

import { Island } from './Island.js';

describe('Island', () => {
  describe('constructor', () => {
    test('should initialize with correct dimensions', () => {
      const island = new Island(1);
      
      expect(island.width).toBe(800);
      expect(island.height).toBe(100);
      expect(island.x).toBe(100);
      expect(island.y).toBe(500);
    });
    
    test('should select design based on level number', () => {
      const island1 = new Island(1);
      const island2 = new Island(2);
      const island3 = new Island(3);
      
      expect(island1.design).toBe('tropical');
      expect(island2.design).toBe('volcanic');
      expect(island3.design).toBe('crystal');
    });
  });
  
  describe('selectDesign', () => {
    test('should cycle through 3 design variants', () => {
      const island = new Island(1);
      
      expect(island.selectDesign(1)).toBe('tropical');
      expect(island.selectDesign(2)).toBe('volcanic');
      expect(island.selectDesign(3)).toBe('crystal');
      expect(island.selectDesign(4)).toBe('tropical'); // Cycles back
      expect(island.selectDesign(5)).toBe('volcanic');
      expect(island.selectDesign(6)).toBe('crystal');
    });
    
    test('should handle level 0 correctly', () => {
      const island = new Island(1);
      // Level 0 would give index -1, which should wrap to last design
      expect(island.selectDesign(0)).toBe('crystal');
    });
  });
  
  describe('containsPoint', () => {
    let island;
    
    beforeEach(() => {
      island = new Island(1);
      // Island bounds: x: 100-900, y: 500-600
    });
    
    test('should return true for point inside island boundaries', () => {
      expect(island.containsPoint(500, 550)).toBe(true);
      expect(island.containsPoint(100, 500)).toBe(true); // Left-top corner
      expect(island.containsPoint(900, 600)).toBe(true); // Right-bottom corner
    });
    
    test('should return false for point outside island boundaries', () => {
      expect(island.containsPoint(50, 550)).toBe(false); // Left of island
      expect(island.containsPoint(950, 550)).toBe(false); // Right of island
      expect(island.containsPoint(500, 450)).toBe(false); // Above island
      expect(island.containsPoint(500, 650)).toBe(false); // Below island
    });
    
    test('should return false for point at exact boundary edges (exclusive)', () => {
      expect(island.containsPoint(99, 550)).toBe(false); // Just left
      expect(island.containsPoint(901, 550)).toBe(false); // Just right
      expect(island.containsPoint(500, 499)).toBe(false); // Just above
      expect(island.containsPoint(500, 601)).toBe(false); // Just below
    });
    
    test('should handle edge coordinates correctly', () => {
      // Test inclusive boundaries
      expect(island.containsPoint(100, 550)).toBe(true); // Left edge
      expect(island.containsPoint(900, 550)).toBe(true); // Right edge
      expect(island.containsPoint(500, 500)).toBe(true); // Top edge
      expect(island.containsPoint(500, 600)).toBe(true); // Bottom edge
    });
  });
  
  describe('render', () => {
    let island;
    let mockCtx;
    
    beforeEach(() => {
      mockCtx = {
        fillStyle: '',
        imageSmoothingEnabled: true,
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn()
      };
    });
    
    test('should disable image smoothing for pixelated style (Requirement 6.3, 16.2)', () => {
      island = new Island(1);
      island.render(mockCtx);
      
      expect(mockCtx.imageSmoothingEnabled).toBe(false);
    });
    
    test('should render tropical design for level 1 (Requirement 6.3)', () => {
      island = new Island(1);
      island.render(mockCtx);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
      // Verify main platform is drawn
      expect(mockCtx.fillRect).toHaveBeenCalledWith(100, 500, 800, 100);
    });
    
    test('should render volcanic design for level 2', () => {
      island = new Island(2);
      island.render(mockCtx);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
      // Verify main platform is drawn
      expect(mockCtx.fillRect).toHaveBeenCalledWith(100, 500, 800, 100);
    });
    
    test('should render crystal design for level 3', () => {
      island = new Island(3);
      island.render(mockCtx);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      // Crystal design uses path drawing for triangular crystals
    });
    
    test('should default to tropical design for unknown design type', () => {
      island = new Island(1);
      island.design = 'unknown';
      island.render(mockCtx);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });
  
  describe('design variants', () => {
    test('should have exactly 3 different design variants', () => {
      const designs = new Set();
      
      for (let level = 1; level <= 10; level++) {
        const island = new Island(level);
        designs.add(island.design);
      }
      
      expect(designs.size).toBe(3);
      expect(designs.has('tropical')).toBe(true);
      expect(designs.has('volcanic')).toBe(true);
      expect(designs.has('crystal')).toBe(true);
    });
    
    test('consecutive levels should have different designs', () => {
      const island1 = new Island(1);
      const island2 = new Island(2);
      const island3 = new Island(3);
      
      expect(island1.design).not.toBe(island2.design);
      expect(island2.design).not.toBe(island3.design);
      expect(island3.design).not.toBe(island1.design);
    });
  });
});
