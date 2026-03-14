/**
 * InputHandler - Captures and tracks keyboard and mouse input
 * Handles event listeners for player movement, attacks, and abilities
 */

export class InputHandler {
    constructor() {
        // Track keyboard state for all relevant keys
        this.keys = {
            'a': false,
            'd': false,
            'w': false,
            's': false,
            ' ': false,  // Space key
            'z': false,
            'x': false,
            'c': false,
            'v': false,
            'f': false
        };
        
        // Track mouse state
        this.mouseDown = false;
        this.mouseClicked = false;  // For one-time click consumption
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Set up event listeners
        this.setupListeners();
        
        console.log('InputHandler initialized');
    }
    
    /**
     * Set up keyboard and mouse event listeners
     */
    setupListeners() {
        // Bind event handlers to maintain 'this' context
        this.boundKeyDown = (e) => this.handleKeyDown(e);
        this.boundKeyUp = (e) => this.handleKeyUp(e);
        this.boundMouseDown = (e) => this.handleMouseDown(e);
        this.boundMouseUp = (e) => this.handleMouseUp(e);
        this.boundMouseMove = (e) => this.handleMouseMove(e);
        
        // Keyboard event listeners
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        
        // Mouse event listeners
        window.addEventListener('mousedown', this.boundMouseDown);
        window.addEventListener('mouseup', this.boundMouseUp);
        window.addEventListener('mousemove', this.boundMouseMove);
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        
        if (key in this.keys) {
            this.keys[key] = true;
            
            // Prevent default behavior for game keys
            event.preventDefault();
        }
    }
    
    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        if (key in this.keys) {
            this.keys[key] = false;
            
            // Prevent default behavior for game keys
            event.preventDefault();
        }
    }
    
    /**
     * Handle mousedown events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseDown(event) {
        // Only track left mouse button (button 0)
        if (event.button === 0) {
            this.mouseDown = true;
            this.mouseClicked = true;  // Set click flag for consumption
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        }
    }
    
    /**
     * Handle mouseup events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseUp(event) {
        if (event.button === 0) {
            this.mouseDown = false;
        }
    }
    
    /**
     * Handle mousemove events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseMove(event) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    /**
     * Check if a specific key is currently pressed
     * @param {string} key - The key to check (a, d, space, z, x, c, v)
     * @returns {boolean} True if the key is pressed
     */
    isKeyPressed(key) {
        const normalizedKey = key.toLowerCase();
        
        // Handle 'space' as an alias for ' '
        if (normalizedKey === 'space') {
            return this.keys[' '] || false;
        }
        
        return this.keys[normalizedKey] || false;
    }
    
    /**
     * Check if the mouse button is currently down
     * @returns {boolean} True if mouse button is down
     */
    isMouseDown() {
        return this.mouseDown;
    }
    
    /**
     * Alias for isMouseDown() - matches design document naming
     * @returns {boolean} True if mouse button is down
     */
    isMousePressed() {
        return this.isMouseDown();
    }
    
    /**
     * Get the current mouse position
     * @returns {{x: number, y: number}} Mouse coordinates
     */
    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY
        };
    }
    
    /**
     * Consume a mouse click (one-time use)
     * Returns true once per click, then resets the flag
     * @returns {boolean} True if a click occurred since last consumption
     */
    consumeMouseClick() {
        if (this.mouseClicked) {
            this.mouseClicked = false;
            return true;
        }
        return false;
    }
    
    /**
     * Clean up event listeners (call when destroying the handler)
     */
    destroy() {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        window.removeEventListener('mousedown', this.boundMouseDown);
        window.removeEventListener('mouseup', this.boundMouseUp);
        window.removeEventListener('mousemove', this.boundMouseMove);
    }
}
