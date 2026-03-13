# Island Fighting Game

A browser-based 2D fighting game built with HTML5 Canvas and vanilla JavaScript.

## Project Structure

```
island-fighting-game/
├── index.html              # Main HTML file with Canvas and UI menus
├── test-canvas.html        # Canvas rendering verification test
├── styles/
│   └── main.css           # Styling for menus and UI elements
├── js/
│   ├── main.js            # Main entry point and initialization
│   └── engine/
│       └── GameEngine.js  # Core game loop and system coordinator
└── .kiro/
    └── specs/             # Game specifications and design documents
```

## Getting Started

1. Open `index.html` in a modern web browser
2. The game will initialize the Canvas and display the main menu
3. Use the menu buttons to navigate between different screens

## Canvas Verification

To verify Canvas rendering capability independently:
- Open `test-canvas.html` in a browser
- You should see colored squares and text confirming Canvas works

## Technology Stack

- **HTML5 Canvas** - For rendering game graphics
- **Vanilla JavaScript (ES6+)** - For game logic
- **CSS3** - For UI styling
- **ES6 Modules** - For code organization

## Features (In Development)

- Player character with movement and combat
- Enemy AI with wave-based spawning
- Ability system with purchasable powers
- Level progression with difficulty scaling
- Currency system for upgrades
- Pixelated art style

## Requirements

- Modern web browser with HTML5 Canvas support
- JavaScript enabled
- No installation required
