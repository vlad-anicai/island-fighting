/**
 * Unit tests for InputHandler
 */

import { InputHandler } from './InputHandler.js';

describe('InputHandler', () => {
    let inputHandler;
    
    beforeEach(() => {
        inputHandler = new InputHandler();
    });
    
    afterEach(() => {
        inputHandler.destroy();
    });
    
    // ===== Initialization Tests =====
    
    test('initializes with all keys unpressed', () => {
        expect(inputHandler.isKeyPressed('a')).toBe(false);
        expect(inputHandler.isKeyPressed('d')).toBe(false);
        expect(inputHandler.isKeyPressed('space')).toBe(false);
        expect(inputHandler.isKeyPressed('z')).toBe(false);
        expect(inputHandler.isKeyPressed('x')).toBe(false);
        expect(inputHandler.isKeyPressed('c')).toBe(false);
        expect(inputHandler.isKeyPressed('v')).toBe(false);
    });
    
    test('initializes with mouse not pressed', () => {
        expect(inputHandler.isMouseDown()).toBe(false);
    });
    
    test('initializes with mouse position at 0,0', () => {
        const pos = inputHandler.getMousePosition();
        expect(pos.x).toBe(0);
        expect(pos.y).toBe(0);
    });
    
    // ===== Keyboard Event Tests =====
    
    test('tracks A key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('a')).toBe(true);
    });
    
    test('tracks D key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'd' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('d')).toBe(true);
    });
    
    test('tracks Space key press', () => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('space')).toBe(true);
        expect(inputHandler.isKeyPressed(' ')).toBe(true);
    });
    
    test('tracks Z key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'z' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('z')).toBe(true);
    });
    
    test('tracks X key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'x' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('x')).toBe(true);
    });
    
    test('tracks C key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'C' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('c')).toBe(true);
    });
    
    test('tracks V key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'V' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('v')).toBe(true);
    });
    
    test('tracks key release', () => {
        const downEvent = new KeyboardEvent('keydown', { key: 'a' });
        window.dispatchEvent(downEvent);
        expect(inputHandler.isKeyPressed('a')).toBe(true);
        
        const upEvent = new KeyboardEvent('keyup', { key: 'a' });
        window.dispatchEvent(upEvent);
        expect(inputHandler.isKeyPressed('a')).toBe(false);
    });
    
    test('handles uppercase keys', () => {
        const event = new KeyboardEvent('keydown', { key: 'A' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('a')).toBe(true);
        expect(inputHandler.isKeyPressed('A')).toBe(true);
    });
    
    test('ignores non-game keys', () => {
        const event = new KeyboardEvent('keydown', { key: 'q' });
        window.dispatchEvent(event);
        
        expect(inputHandler.isKeyPressed('q')).toBe(false);
    });
    
    test('tracks multiple keys simultaneously', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        
        expect(inputHandler.isKeyPressed('a')).toBe(true);
        expect(inputHandler.isKeyPressed('d')).toBe(true);
        expect(inputHandler.isKeyPressed('space')).toBe(true);
    });
    
    // ===== Mouse Event Tests =====
    
    test('tracks mouse button press', () => {
        const event = new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 200 });
        window.dispatchEvent(event);
        
        expect(inputHandler.isMouseDown()).toBe(true);
    });
    
    test('isMousePressed is an alias for isMouseDown', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        window.dispatchEvent(event);
        
        expect(inputHandler.isMousePressed()).toBe(true);
        expect(inputHandler.isMousePressed()).toBe(inputHandler.isMouseDown());
    });
    
    test('tracks mouse button release', () => {
        window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
        expect(inputHandler.isMouseDown()).toBe(true);
        
        window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
        expect(inputHandler.isMouseDown()).toBe(false);
    });
    
    test('tracks mouse position on click', () => {
        const event = new MouseEvent('mousedown', { button: 0, clientX: 150, clientY: 250 });
        window.dispatchEvent(event);
        
        const pos = inputHandler.getMousePosition();
        expect(pos.x).toBe(150);
        expect(pos.y).toBe(250);
    });
    
    test('tracks mouse position on move', () => {
        const event = new MouseEvent('mousemove', { clientX: 300, clientY: 400 });
        window.dispatchEvent(event);
        
        const pos = inputHandler.getMousePosition();
        expect(pos.x).toBe(300);
        expect(pos.y).toBe(400);
    });
    
    test('ignores right mouse button', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        window.dispatchEvent(event);
        
        expect(inputHandler.isMouseDown()).toBe(false);
    });
    
    test('ignores middle mouse button', () => {
        const event = new MouseEvent('mousedown', { button: 1 });
        window.dispatchEvent(event);
        
        expect(inputHandler.isMouseDown()).toBe(false);
    });
    
    // ===== Mouse Click Consumption Tests =====
    
    test('consumeMouseClick returns true on first call after click', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        window.dispatchEvent(event);
        
        expect(inputHandler.consumeMouseClick()).toBe(true);
    });
    
    test('consumeMouseClick returns false on second call', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        window.dispatchEvent(event);
        
        inputHandler.consumeMouseClick(); // First consumption
        expect(inputHandler.consumeMouseClick()).toBe(false);
    });
    
    test('consumeMouseClick returns false when no click occurred', () => {
        expect(inputHandler.consumeMouseClick()).toBe(false);
    });
    
    test('consumeMouseClick resets after each click', () => {
        // First click
        window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
        expect(inputHandler.consumeMouseClick()).toBe(true);
        expect(inputHandler.consumeMouseClick()).toBe(false);
        
        // Second click
        window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
        expect(inputHandler.consumeMouseClick()).toBe(true);
        expect(inputHandler.consumeMouseClick()).toBe(false);
    });
    
    test('isMouseDown remains true after consumeMouseClick', () => {
        window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
        
        expect(inputHandler.isMouseDown()).toBe(true);
        inputHandler.consumeMouseClick();
        expect(inputHandler.isMouseDown()).toBe(true);
    });
    
    // ===== Edge Cases =====
    
    test('handles rapid key presses', () => {
        for (let i = 0; i < 10; i++) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
        }
        
        expect(inputHandler.isKeyPressed('a')).toBe(false);
    });
    
    test('handles rapid mouse clicks', () => {
        for (let i = 0; i < 5; i++) {
            window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
            window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
        }
        
        // Should only consume the last click
        expect(inputHandler.consumeMouseClick()).toBe(true);
        expect(inputHandler.consumeMouseClick()).toBe(false);
    });
});
