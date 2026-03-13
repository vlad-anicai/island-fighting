/**
 * Unit tests for StateManager class
 * Tests coin balance, owned abilities, and key bindings with LocalStorage persistence
 */

import { StateManager } from './StateManager.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

describe('StateManager', () => {
    beforeEach(() => {
        localStorage.clear();
        // Suppress console warnings during tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    // ===== Coin Balance Tests =====
    
    describe('Coin Balance', () => {
        test('should initialize with 0 coins by default', () => {
            const state = new StateManager();
            expect(state.getCoins()).toBe(0);
        });
        
        test('should load coins from LocalStorage', () => {
            localStorage.setItem('island_fighting_coins', JSON.stringify(150));
            const state = new StateManager();
            expect(state.getCoins()).toBe(150);
        });
        
        test('should handle corrupted coin data with default', () => {
            localStorage.setItem('island_fighting_coins', 'invalid json');
            const state = new StateManager();
            expect(state.getCoins()).toBe(0);
        });
        
        test('should handle negative coin values with default', () => {
            localStorage.setItem('island_fighting_coins', JSON.stringify(-50));
            const state = new StateManager();
            expect(state.getCoins()).toBe(0);
        });
        
        test('should handle non-numeric coin values with default', () => {
            localStorage.setItem('island_fighting_coins', JSON.stringify('not a number'));
            const state = new StateManager();
            expect(state.getCoins()).toBe(0);
        });
        
        test('should add coins and save to LocalStorage', () => {
            const state = new StateManager();
            state.addCoins(100);
            expect(state.getCoins()).toBe(100);
            
            const stored = JSON.parse(localStorage.getItem('island_fighting_coins'));
            expect(stored).toBe(100);
        });
        
        test('should accumulate coins from multiple additions', () => {
            const state = new StateManager();
            state.addCoins(50);
            state.addCoins(75);
            state.addCoins(25);
            expect(state.getCoins()).toBe(150);
        });
        
        test('should not add negative coin amounts', () => {
            const state = new StateManager();
            state.addCoins(100);
            state.addCoins(-50);
            expect(state.getCoins()).toBe(100);
        });
        
        test('should spend coins if sufficient balance', () => {
            const state = new StateManager();
            state.addCoins(200);
            const result = state.spendCoins(150);
            expect(result).toBe(true);
            expect(state.getCoins()).toBe(50);
        });
        
        test('should not spend coins if insufficient balance', () => {
            const state = new StateManager();
            state.addCoins(100);
            const result = state.spendCoins(150);
            expect(result).toBe(false);
            expect(state.getCoins()).toBe(100);
        });
        
        test('should persist coins across StateManager instances', () => {
            const state1 = new StateManager();
            state1.addCoins(250);
            
            const state2 = new StateManager();
            expect(state2.getCoins()).toBe(250);
        });
    });
    
    // ===== Owned Abilities Tests =====
    
    describe('Owned Abilities', () => {
        test('should initialize with empty abilities array by default', () => {
            const state = new StateManager();
            expect(state.getOwnedAbilities()).toEqual([]);
        });
        
        test('should load abilities from LocalStorage', () => {
            localStorage.setItem('island_fighting_abilities', JSON.stringify(['STRONG_PUNCH', 'FIRE_BALL']));
            const state = new StateManager();
            expect(state.getOwnedAbilities()).toEqual(['STRONG_PUNCH', 'FIRE_BALL']);
        });
        
        test('should handle corrupted abilities data with default', () => {
            localStorage.setItem('island_fighting_abilities', 'invalid json');
            const state = new StateManager();
            expect(state.getOwnedAbilities()).toEqual([]);
        });
        
        test('should handle non-array abilities data with default', () => {
            localStorage.setItem('island_fighting_abilities', JSON.stringify({ invalid: 'object' }));
            const state = new StateManager();
            expect(state.getOwnedAbilities()).toEqual([]);
        });
        
        test('should filter out invalid ability types', () => {
            localStorage.setItem('island_fighting_abilities', JSON.stringify(['STRONG_PUNCH', 123, null, 'FIRE_BALL']));
            const state = new StateManager();
            expect(state.getOwnedAbilities()).toEqual(['STRONG_PUNCH', 'FIRE_BALL']);
        });
        
        test('should add ability and save to LocalStorage', () => {
            const state = new StateManager();
            const result = state.addAbility('STRONG_PUNCH');
            expect(result).toBe(true);
            expect(state.hasAbility('STRONG_PUNCH')).toBe(true);
            
            const stored = JSON.parse(localStorage.getItem('island_fighting_abilities'));
            expect(stored).toContain('STRONG_PUNCH');
        });
        
        test('should not add duplicate abilities', () => {
            const state = new StateManager();
            state.addAbility('STRONG_PUNCH');
            const result = state.addAbility('STRONG_PUNCH');
            expect(result).toBe(false);
            expect(state.getOwnedAbilities()).toEqual(['STRONG_PUNCH']);
        });
        
        test('should check if ability is owned', () => {
            const state = new StateManager();
            state.addAbility('FIRE_BALL');
            expect(state.hasAbility('FIRE_BALL')).toBe(true);
            expect(state.hasAbility('SHIELD')).toBe(false);
        });
        
        test('should persist abilities across StateManager instances', () => {
            const state1 = new StateManager();
            state1.addAbility('STRONG_PUNCH');
            state1.addAbility('FIRE_BALL');
            
            const state2 = new StateManager();
            expect(state2.getOwnedAbilities()).toEqual(['STRONG_PUNCH', 'FIRE_BALL']);
        });
    });
    
    // ===== Key Bindings Tests =====
    
    describe('Key Bindings', () => {
        test('should initialize with null bindings by default', () => {
            const state = new StateManager();
            const bindings = state.getKeyBindings();
            expect(bindings).toEqual({
                z: null,
                x: null,
                c: null,
                v: null
            });
        });
        
        test('should load key bindings from LocalStorage', () => {
            const savedBindings = {
                z: 'STRONG_PUNCH',
                x: 'FIRE_BALL',
                c: null,
                v: null
            };
            localStorage.setItem('island_fighting_bindings', JSON.stringify(savedBindings));
            const state = new StateManager();
            expect(state.getKeyBindings()).toEqual(savedBindings);
        });
        
        test('should handle corrupted bindings data with default', () => {
            localStorage.setItem('island_fighting_bindings', 'invalid json');
            const state = new StateManager();
            expect(state.getKeyBindings()).toEqual({
                z: null,
                x: null,
                c: null,
                v: null
            });
        });
        
        test('should handle non-object bindings data with default', () => {
            localStorage.setItem('island_fighting_bindings', JSON.stringify(['invalid', 'array']));
            const state = new StateManager();
            expect(state.getKeyBindings()).toEqual({
                z: null,
                x: null,
                c: null,
                v: null
            });
        });
        
        test('should filter out invalid binding values', () => {
            const invalidBindings = {
                z: 'STRONG_PUNCH',
                x: 123, // invalid
                c: { invalid: 'object' }, // invalid
                v: null
            };
            localStorage.setItem('island_fighting_bindings', JSON.stringify(invalidBindings));
            const state = new StateManager();
            expect(state.getKeyBindings()).toEqual({
                z: 'STRONG_PUNCH',
                x: null,
                c: null,
                v: null
            });
        });
        
        test('should assign ability to key and save to LocalStorage', () => {
            const state = new StateManager();
            const result = state.assignAbility('z', 'STRONG_PUNCH');
            expect(result).toBe(true);
            expect(state.getBinding('z')).toBe('STRONG_PUNCH');
            
            const stored = JSON.parse(localStorage.getItem('island_fighting_bindings'));
            expect(stored.z).toBe('STRONG_PUNCH');
        });
        
        test('should reassign ability to same key', () => {
            const state = new StateManager();
            state.assignAbility('z', 'STRONG_PUNCH');
            state.assignAbility('z', 'FIRE_BALL');
            expect(state.getBinding('z')).toBe('FIRE_BALL');
        });
        
        test('should clear binding by assigning null', () => {
            const state = new StateManager();
            state.assignAbility('z', 'STRONG_PUNCH');
            state.assignAbility('z', null);
            expect(state.getBinding('z')).toBe(null);
        });
        
        test('should reject invalid key names', () => {
            const state = new StateManager();
            const result = state.assignAbility('invalid', 'STRONG_PUNCH');
            expect(result).toBe(false);
        });
        
        test('should persist key bindings across StateManager instances', () => {
            const state1 = new StateManager();
            state1.assignAbility('z', 'STRONG_PUNCH');
            state1.assignAbility('x', 'FIRE_BALL');
            
            const state2 = new StateManager();
            expect(state2.getBinding('z')).toBe('STRONG_PUNCH');
            expect(state2.getBinding('x')).toBe('FIRE_BALL');
        });
    });
    
    // ===== Purchase Ability Tests =====
    
    describe('Purchase Ability', () => {
        test('should purchase ability with sufficient coins', () => {
            const state = new StateManager();
            state.addCoins(200);
            const result = state.purchaseAbility('STRONG_PUNCH', 100);
            expect(result).toBe(true);
            expect(state.getCoins()).toBe(100);
            expect(state.hasAbility('STRONG_PUNCH')).toBe(true);
        });
        
        test('should not purchase ability with insufficient coins', () => {
            const state = new StateManager();
            state.addCoins(50);
            const result = state.purchaseAbility('STRONG_PUNCH', 100);
            expect(result).toBe(false);
            expect(state.getCoins()).toBe(50);
            expect(state.hasAbility('STRONG_PUNCH')).toBe(false);
        });
        
        test('should not purchase already owned ability', () => {
            const state = new StateManager();
            state.addCoins(200);
            state.purchaseAbility('STRONG_PUNCH', 100);
            const result = state.purchaseAbility('STRONG_PUNCH', 100);
            expect(result).toBe(false);
            expect(state.getCoins()).toBe(100); // Coins not deducted
        });
        
        test('should handle atomic transaction (all or nothing)', () => {
            const state = new StateManager();
            state.addCoins(100);
            
            // This should succeed
            const result1 = state.purchaseAbility('STRONG_PUNCH', 100);
            expect(result1).toBe(true);
            expect(state.getCoins()).toBe(0);
            expect(state.hasAbility('STRONG_PUNCH')).toBe(true);
            
            // This should fail (insufficient coins)
            const result2 = state.purchaseAbility('FIRE_BALL', 400);
            expect(result2).toBe(false);
            expect(state.getCoins()).toBe(0);
            expect(state.hasAbility('FIRE_BALL')).toBe(false);
        });
    });
    
    // ===== LocalStorage Error Handling Tests =====
    
    describe('LocalStorage Error Handling', () => {
        test('should handle quota exceeded error gracefully', () => {
            const state = new StateManager();
            
            // Mock localStorage.setItem to throw QuotaExceededError
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = jest.fn(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            
            // Should not throw, just log error
            expect(() => state.addCoins(100)).not.toThrow();
            expect(state.getCoins()).toBe(100); // State updated in memory
            
            localStorage.setItem = originalSetItem;
        });
        
        test('should handle security error gracefully', () => {
            const state = new StateManager();
            
            // Mock localStorage.setItem to throw SecurityError
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = jest.fn(() => {
                const error = new Error('SecurityError');
                error.name = 'SecurityError';
                throw error;
            });
            
            // Should not throw, just log error
            expect(() => state.assignAbility('z', 'STRONG_PUNCH')).not.toThrow();
            expect(state.getBinding('z')).toBe('STRONG_PUNCH'); // State updated in memory
            
            localStorage.setItem = originalSetItem;
        });
    });
});
