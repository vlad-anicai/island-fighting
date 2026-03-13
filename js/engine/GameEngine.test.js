/**
 * Unit tests for GameEngine class
 * Tests game loop, scene management, and level transitions
 */

import { GameEngine } from './GameEngine.js';

// Mock DOM elements
const createMockElement = () => ({
    classList: {
        add: jest.fn(),
        remove: jest.fn()
    }
});

const createMockButton = () => ({
    addEventListener: jest.fn()
});

describe('GameEngine', () => {
    let canvas, ctx, game;
    
    beforeEach(() => {
        // Mock canvas and context
        canvas = {
            width: 1000,
            height: 600,
            getContext: jest.fn()
        };
        
        ctx = {
            fillStyle: '',
            fillRect: jest.fn(),
            fillText: jest.fn(),
            imageSmoothingEnabled: false,
            font: ''
        };
        
        // Mock DOM elements
        document.getElementById = jest.fn((id) => {
            const mockElements = {
                'mainMenu': createMockElement(),
                'abilityShop': createMockElement(),
                'abilitySettings': createMockElement(),
                'controlsMenu': createMockElement(),
                'hud': createMockElement(),
                'playBtn': createMockButton(),
                'shopBtn': createMockButton(),
                'settingsBtn': createMockButton(),
                'controlsBtn': createMockButton(),
                'shopBackBtn': createMockButton(),
                'settingsBackBtn': createMockButton(),
                'controlsBackBtn': createMockButton()
            };
            return mockElements[id];
        });
        
        // Mock requestAnimationFrame
        global.requestAnimationFrame = jest.fn((callback) => {
            setTimeout(() => callback(performance.now()), 16);
            return 1;
        });
        
        // Mock performance.now()
        global.performance = {
            now: jest.fn(() => 0)
        };
        
        game = new GameEngine(canvas, ctx);
    });
    
    afterEach(() => {
        if (game.running) {
            game.stop();
        }
    });
    
    describe('Constructor', () => {
        test('initializes with menu scene', () => {
            expect(game.scene).toBe('menu');
        });
        
        test('initializes with level 1', () => {
            expect(game.level).toBe(1);
        });
        
        test('initializes with empty entity arrays', () => {
            expect(game.bots).toEqual([]);
            expect(game.projectiles).toEqual([]);
        });
        
        test('initializes with null player and island', () => {
            expect(game.player).toBeNull();
            expect(game.island).toBeNull();
        });
        
        test('initializes with running false', () => {
            expect(game.running).toBe(false);
        });
    });
    
    describe('Scene Management', () => {
        test('showMenu switches to main menu', () => {
            game.showMenu('main');
            expect(game.scene).toBe('menu');
            expect(game.mainMenu.classList.add).toHaveBeenCalledWith('active');
        });
        
        test('showMenu switches to shop', () => {
            game.showMenu('shop');
            expect(game.scene).toBe('menu');
            expect(game.abilityShop.classList.add).toHaveBeenCalledWith('active');
        });
        
        test('showMenu switches to settings', () => {
            game.showMenu('settings');
            expect(game.scene).toBe('menu');
            expect(game.abilitySettings.classList.add).toHaveBeenCalledWith('active');
        });
        
        test('showMenu switches to controls', () => {
            game.showMenu('controls');
            expect(game.scene).toBe('menu');
            expect(game.controlsMenu.classList.add).toHaveBeenCalledWith('active');
        });
        
        test('showMenu hides all other menus', () => {
            game.showMenu('shop');
            expect(game.mainMenu.classList.remove).toHaveBeenCalledWith('active');
            expect(game.abilitySettings.classList.remove).toHaveBeenCalledWith('active');
            expect(game.controlsMenu.classList.remove).toHaveBeenCalledWith('active');
        });
    });
    
    describe('Level Initialization', () => {
        test('initializeLevel sets level number', () => {
            game.initializeLevel(5);
            expect(game.level).toBe(5);
        });
        
        test('initializeLevel caps level at 999', () => {
            game.initializeLevel(1500);
            expect(game.level).toBe(999);
        });
        
        test('initializeLevel clears bots array', () => {
            game.bots = [{ id: 1 }, { id: 2 }];
            game.initializeLevel(2);
            expect(game.bots).toEqual([]);
        });
        
        test('initializeLevel clears projectiles array', () => {
            game.projectiles = [{ id: 1 }];
            game.initializeLevel(2);
            expect(game.projectiles).toEqual([]);
        });
        
        test('initializeLevel creates island instance (Requirement 6.1)', () => {
            game.initializeLevel(3);
            expect(game.island).not.toBeNull();
            expect(game.island.constructor.name).toBe('Island');
        });
    });
    
    describe('Level Transitions', () => {
        test('transitionToNextLevel increments level', () => {
            game.level = 5;
            game.transitionToNextLevel();
            expect(game.level).toBe(6);
        });
        
        test('transitionToNextLevel calls initializeLevel', () => {
            game.level = 3;
            const spy = jest.spyOn(game, 'initializeLevel');
            game.transitionToNextLevel();
            expect(spy).toHaveBeenCalledWith(4);
        });
        
        test('endLevel with success transitions to next level', () => {
            game.level = 2;
            const spy = jest.spyOn(game, 'transitionToNextLevel');
            game.endLevel(true);
            expect(spy).toHaveBeenCalled();
        });
        
        test('endLevel with failure shows game over', () => {
            const spy = jest.spyOn(game, 'showGameOver');
            game.endLevel(false);
            expect(spy).toHaveBeenCalled();
        });
        
        test('showGameOver returns to main menu', () => {
            const spy = jest.spyOn(game, 'showMenu');
            game.showGameOver();
            expect(spy).toHaveBeenCalledWith('main');
        });
    });
    
    describe('Game Loop', () => {
        test('start sets running to true', () => {
            game.start();
            expect(game.running).toBe(true);
        });
        
        test('start calls requestAnimationFrame', () => {
            game.start();
            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });
        
        test('stop sets running to false', () => {
            game.start();
            game.stop();
            expect(game.running).toBe(false);
        });
        
        test('gameLoop calculates delta time', () => {
            let callCount = 0;
            global.performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 16.67; // ~60 FPS
            });
            
            game.running = true;
            game.lastFrameTime = 0;
            game.gameLoop(16.67);
            
            // Delta time should be approximately 0.01667 seconds (16.67ms)
            expect(game.lastFrameTime).toBe(16.67);
        });
        
        test('gameLoop does not run when stopped', () => {
            game.running = false;
            const updateSpy = jest.spyOn(game, 'updateGameplay');
            const renderSpy = jest.spyOn(game, 'renderGameplay');
            
            game.gameLoop(16.67);
            
            expect(updateSpy).not.toHaveBeenCalled();
            expect(renderSpy).not.toHaveBeenCalled();
        });
        
        test('gameLoop calls update and render in gameplay scene', () => {
            game.running = true;
            game.scene = 'gameplay';
            game.lastFrameTime = 0;
            
            const updateSpy = jest.spyOn(game, 'updateGameplay');
            const renderSpy = jest.spyOn(game, 'renderGameplay');
            
            game.gameLoop(16.67);
            
            expect(updateSpy).toHaveBeenCalled();
            expect(renderSpy).toHaveBeenCalled();
        });
        
        test('gameLoop does not call update/render in menu scene', () => {
            game.running = true;
            game.scene = 'menu';
            game.lastFrameTime = 0;
            
            const updateSpy = jest.spyOn(game, 'updateGameplay');
            const renderSpy = jest.spyOn(game, 'renderGameplay');
            
            game.gameLoop(16.67);
            
            expect(updateSpy).not.toHaveBeenCalled();
            expect(renderSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('Gameplay Start', () => {
        test('startGameplay sets scene to gameplay', () => {
            game.startGameplay();
            expect(game.scene).toBe('gameplay');
        });
        
        test('startGameplay hides all menus', () => {
            game.startGameplay();
            expect(game.mainMenu.classList.remove).toHaveBeenCalledWith('active');
            expect(game.abilityShop.classList.remove).toHaveBeenCalledWith('active');
            expect(game.abilitySettings.classList.remove).toHaveBeenCalledWith('active');
            expect(game.controlsMenu.classList.remove).toHaveBeenCalledWith('active');
        });
        
        test('startGameplay shows HUD', () => {
            game.startGameplay();
            expect(game.hud.classList.add).toHaveBeenCalledWith('active');
        });
        
        test('startGameplay initializes level 1', () => {
            const spy = jest.spyOn(game, 'initializeLevel');
            game.startGameplay();
            expect(spy).toHaveBeenCalledWith(1);
        });
    });
    
    describe('Delta Time Calculation', () => {
        test('calculates correct delta time for 60 FPS', () => {
            game.running = true;
            game.scene = 'gameplay';
            game.lastFrameTime = 0;
            
            let capturedDeltaTime;
            game.updateGameplay = jest.fn((dt) => {
                capturedDeltaTime = dt;
            });
            
            game.gameLoop(16.67); // 16.67ms = ~60 FPS
            
            // Delta time should be approximately 0.01667 seconds
            expect(capturedDeltaTime).toBeCloseTo(0.01667, 4);
        });
        
        test('calculates correct delta time for 30 FPS', () => {
            game.running = true;
            game.scene = 'gameplay';
            game.lastFrameTime = 0;
            
            let capturedDeltaTime;
            game.updateGameplay = jest.fn((dt) => {
                capturedDeltaTime = dt;
            });
            
            game.gameLoop(33.33); // 33.33ms = ~30 FPS
            
            // Delta time should be approximately 0.03333 seconds
            expect(capturedDeltaTime).toBeCloseTo(0.03333, 4);
        });
    });
    
    describe('Island Rendering', () => {
        test('renderGameplay calls island.render when island exists (Requirement 6.3, 16.2)', () => {
            // Initialize level to create island
            game.initializeLevel(1);
            
            // Mock the island's render method
            game.island.render = jest.fn();
            
            // Call renderGameplay
            game.renderGameplay();
            
            // Verify island.render was called with context
            expect(game.island.render).toHaveBeenCalledWith(ctx);
        });
        
        test('renderGameplay does not crash when island is null', () => {
            game.island = null;
            
            // Should not throw
            expect(() => game.renderGameplay()).not.toThrow();
        });
        
        test('renderGameplay clears canvas with sky gradient', () => {
            // Mock createLinearGradient
            const mockGradient = {
                addColorStop: jest.fn()
            };
            ctx.createLinearGradient = jest.fn(() => mockGradient);
            
            game.renderGameplay();
            
            // Verify gradient is created
            expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, canvas.height);
            expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, '#87CEEB');
            expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, '#E0F6FF');
            
            // Verify canvas is cleared
            expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
        });
    });
    
    describe('Player Rendering Integration (Task 4.3)', () => {
        test('initializeLevel creates player instance (Requirement 1.7)', () => {
            game.initializeLevel(1);
            
            expect(game.player).not.toBeNull();
            expect(game.player.constructor.name).toBe('Player');
        });
        
        test('player is positioned at center of island', () => {
            game.initializeLevel(1);
            
            const expectedX = game.island.x + game.island.width / 2 - 16;
            const expectedY = game.island.y - 48;
            
            expect(game.player.x).toBe(expectedX);
            expect(game.player.y).toBe(expectedY);
        });
        
        test('renderGameplay calls player.render when player exists (Requirement 1.7, 16.2)', () => {
            // Initialize level to create player
            game.initializeLevel(1);
            
            // Mock the player's render method
            game.player.render = jest.fn();
            
            // Call renderGameplay
            game.renderGameplay();
            
            // Verify player.render was called with context
            expect(game.player.render).toHaveBeenCalledWith(ctx);
        });
        
        test('renderGameplay does not crash when player is null', () => {
            game.player = null;
            
            // Should not throw
            expect(() => game.renderGameplay()).not.toThrow();
        });
        
        test('renderGameplay renders player with pixelated art style (Requirement 16.2)', () => {
            // Initialize level to create player
            game.initializeLevel(1);
            
            // Track imageSmoothingEnabled state
            let imageSmoothingState = null;
            game.player.render = jest.fn((ctx) => {
                imageSmoothingState = ctx.imageSmoothingEnabled;
            });
            
            // Call renderGameplay
            game.renderGameplay();
            
            // Verify player.render was called
            expect(game.player.render).toHaveBeenCalled();
        });
        
        test('player persists across multiple render calls', () => {
            game.initializeLevel(1);
            const player = game.player;
            
            game.renderGameplay();
            game.renderGameplay();
            game.renderGameplay();
            
            // Player should be the same instance
            expect(game.player).toBe(player);
        });
        
        test('new player is created when level transitions', () => {
            game.initializeLevel(1);
            const firstPlayer = game.player;
            
            game.transitionToNextLevel();
            const secondPlayer = game.player;
            
            // Should be a new player instance
            expect(secondPlayer).not.toBe(firstPlayer);
            expect(secondPlayer).not.toBeNull();
        });
    });
});
