# Implementation Plan: Island Fighting Game

## Overview

This implementation plan builds a browser-based 2D fighting game using HTML5 Canvas and vanilla JavaScript (ES6+). The game features player combat mechanics, bot AI, progressive difficulty scaling, four purchasable abilities, menu system, and LocalStorage persistence. The implementation follows a component-based architecture with clear separation between game state, rendering, input handling, and entity behaviors.

## Tasks

- [x] 1. Set up project structure and HTML5 Canvas foundation
  - Create index.html with Canvas element and basic page structure
  - Create main CSS file for styling menus and UI elements
  - Set up JavaScript module structure with main game entry point
  - Initialize Canvas context and verify rendering capability
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 2. Implement core game engine and state management
  - [x] 2.1 Create StateManager class with LocalStorage persistence
    - Implement coin balance loading, saving, and modification methods
    - Implement owned abilities loading, saving, and modification methods
    - Implement key bindings loading, saving, and modification methods
    - Handle JSON parsing errors and corrupted data with fallback defaults
    - _Requirements: 11.1, 11.3, 8.6, 14.5_
  
  - [ ]* 2.2 Write property test for StateManager persistence
    - **Property 34: Key bindings persist across sessions**
    - **Validates: Requirements 14.5**
  
  - [x] 2.3 Create GameEngine class with game loop
    - Implement 60 FPS game loop using requestAnimationFrame
    - Add scene management (menu vs gameplay states)
    - Integrate delta time calculation for frame-independent updates
    - Add methods for level initialization and transition
    - _Requirements: 12.2, 5.2, 5.3_
  
  - [x] 2.4 Create InputHandler class for keyboard and mouse events
    - Set up event listeners for keyboard (A, D, Space, Z, X, C, V)
    - Set up event listeners for mouse clicks and position tracking
    - Implement key state tracking and mouse click consumption
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 7.2, 16.3_

- [ ] 3. Implement Island platform and rendering
  - [x] 3.1 Create Island class with platform boundaries
    - Define island dimensions and position
    - Implement multiple island design variants (at least 3 visual styles)
    - Add design selection based on level number
    - Implement containsPoint method for boundary checking
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [x] 3.2 Implement Island rendering with pixelated art style
    - Draw island platform to Canvas context
    - Apply pixelated visual style (disable image smoothing)
    - _Requirements: 6.3, 16.2_
  
  - [ ]* 3.3 Write property test for island design variation
    - **Property 21: Consecutive levels have different island designs**
    - **Validates: Requirements 6.2**

- [ ] 4. Implement Player entity with movement and physics
  - [x] 4.1 Create Player class with position, HP, and velocity
    - Initialize player with starting position, HP (100), and dimensions
    - Implement gravity and ground collision detection
    - Implement horizontal movement (A/D keys) with velocity
    - Implement jump mechanic (Space key) with upward velocity
    - Constrain player position to island boundaries
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 6.4_
  
  - [ ]* 4.2 Write property tests for player movement
    - **Property 3: Player position updates with movement**
    - **Validates: Requirements 1.3, 1.4, 1.5**
    - **Property 4: Jump applies upward velocity**
    - **Validates: Requirements 1.6**
    - **Property 22: Player constrained to island boundaries**
    - **Validates: Requirements 6.4**
  
  - [x] 4.3 Implement Player rendering with pixelated sprite
    - Draw player character to Canvas context
    - Apply pixelated art style
    - _Requirements: 1.7, 16.2_
  
  - [x] 4.4 Implement takeDamage method with shield check
    - Reduce HP by damage amount unless shield is active
    - Clamp HP to minimum of 0
    - _Requirements: 1.1, 9.2_
  
  - [ ]* 4.5 Write property tests for player damage
    - **Property 1: Player damage reduces HP**
    - **Validates: Requirements 1.1**
    - **Property 2: Zero HP ends level**
    - **Validates: Requirements 1.2**

- [ ] 5. Implement basic punch attack mechanic
  - [x] 5.1 Add punch method to Player class
    - Check punch cooldown before executing
    - Set cooldown to 0.2 seconds after punch
    - Define punch range (40-60 pixels)
    - Return punch hitbox for collision detection
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [x] 5.2 Integrate punch collision detection with bots
    - Check if any bot is within punch range
    - Apply damage to bots hit by punch
    - _Requirements: 2.3_
  
  - [ ]* 5.3 Write property tests for punch mechanics
    - **Property 5: Mouse click executes punch when off cooldown**
    - **Validates: Requirements 2.1, 2.4**
    - **Property 7: Cooldown prevents punch execution**
    - **Validates: Requirements 2.5**
  
  - [ ]* 5.4 Write unit test for punch range constraint
    - Verify punch range is between 40-60 pixels
    - _Requirements: 2.2_

- [ ] 6. Implement Bot entity with AI and spawning
  - [ ] 6.1 Create Bot class with level-scaled stats
    - Initialize bot with position, HP (50 + level * 10), and size (24 + level * 2)
    - Set contact damage (10) and coin reward (10 + level * 5)
    - Implement takeDamage method that returns true when defeated
    - _Requirements: 3.4, 3.5, 4.4, 4.5, 4.6_
  
  - [ ] 6.2 Implement Bot AI movement toward player
    - Calculate direction vector from bot to player
    - Move bot toward player at constant speed (2 pixels/frame)
    - Apply gravity and ground collision
    - _Requirements: 4.1_
  
  - [ ]* 6.3 Write property test for bot AI movement
    - **Property 12: Bots move toward player**
    - **Validates: Requirements 4.1**
  
  - [ ] 6.4 Implement Bot rendering with pixelated sprite
    - Draw bot to Canvas context with level-scaled size
    - Apply pixelated art style
    - _Requirements: 3.6, 16.2_
  
  - [ ] 6.5 Implement bot spawning algorithm in GameEngine
    - Spawn 3 + floor(level / 2) bots at level start
    - Place bots at random x positions within island boundaries
    - Spawn bots above platform (y = island.y - 50)
    - Cap maximum bot count at 20 to prevent performance issues
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 6.6 Write property tests for bot spawning
    - **Property 8: Level start spawns bots**
    - **Validates: Requirements 3.1**
    - **Property 9: Spawned bots are within island boundaries**
    - **Validates: Requirements 3.2**
    - **Property 10: Bot count does not increase during level**
    - **Validates: Requirements 3.3**
    - **Property 11: Higher levels spawn stronger bots**
    - **Validates: Requirements 3.4, 3.5**

- [ ] 7. Implement collision detection and combat interactions
  - [ ] 7.1 Create AABB collision detection utility function
    - Implement checkCollision function for rectangular entities
    - Handle edge cases (same position, overlapping entities)
    - _Requirements: 2.3, 4.2_
  
  - [ ] 7.2 Implement bot-player collision with damage
    - Detect collision between each bot and player
    - Apply bot contact damage to player (unless shielded)
    - _Requirements: 4.2, 4.3_
  
  - [ ]* 7.3 Write property test for bot collision damage
    - **Property 13: Bot collision damages player**
    - **Validates: Requirements 4.2, 4.3**
  
  - [ ] 7.4 Implement punch-bot collision detection
    - Check punch hitbox against all active bots
    - Apply punch damage to bots in range
    - _Requirements: 2.3_
  
  - [ ]* 7.5 Write property test for punch damage
    - **Property 6: Punch damages bots in range**
    - **Validates: Requirements 2.3**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement currency system and bot defeat rewards
  - [ ] 9.1 Add coin award logic to bot defeat handling
    - When bot HP reaches zero, add bot's coin reward to player balance
    - Save updated coin balance to LocalStorage
    - Remove defeated bot from active bots array
    - _Requirements: 4.5, 4.6, 11.2_
  
  - [ ]* 9.2 Write property tests for coin system
    - **Property 16: Bot defeat awards coins**
    - **Validates: Requirements 4.6**
    - **Property 30: Bot defeat increases coins**
    - **Validates: Requirements 11.2**
    - **Property 31: Coin balance persists across levels**
    - **Validates: Requirements 11.3**
  
  - [ ] 9.3 Add coin balance display to gameplay UI
    - Render current coin count on screen during gameplay
    - _Requirements: 11.4_

- [ ] 10. Implement level progression and transitions
  - [ ] 10.1 Add level completion detection
    - Check if all bots are defeated (bots.length === 0)
    - Check if player HP is zero or below
    - Trigger appropriate level end condition
    - _Requirements: 1.2, 5.1_
  
  - [ ]* 10.2 Write property tests for level completion
    - **Property 2: Zero HP ends level**
    - **Validates: Requirements 1.2**
    - **Property 17: Zero bots ends level**
    - **Validates: Requirements 5.1**
  
  - [ ] 10.3 Implement level transition logic
    - Increment level number on successful completion
    - Create new island instance for next level
    - Spawn new bots for next level
    - Reset player position to center of new island
    - Clear all projectiles and effects
    - Cap level number at 999 to prevent overflow
    - _Requirements: 5.2, 5.3, 5.4, 6.1_
  
  - [ ]* 10.4 Write property tests for level transitions
    - **Property 18: Level completion increments counter**
    - **Validates: Requirements 5.2, 5.4**
    - **Property 19: New level creates new island**
    - **Validates: Requirements 5.3**
    - **Property 20: Each level has an island**
    - **Validates: Requirements 6.1**

- [ ] 11. Implement ability system foundation
  - [ ] 11.1 Create Ability class and ABILITY_DATA configuration
    - Define ability types: STRONG_PUNCH, FIRE_BALL, SHIELD, TORNADO
    - Set ability costs: 100, 400, 750, 1000 respectively
    - Set ability cooldowns: 1.0, 3.0, 15.0, 20.0 seconds respectively
    - Set ability damage values: 30, 50, 0 (shield), 100 respectively
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 11.2 Write unit tests for ability data
    - Verify Strong Punch costs 100 coins
    - Verify Fire Ball costs 400 coins
    - Verify Shield costs 750 coins
    - Verify Tornado costs 1000 coins
    - Verify cooldown ordering: Strong Punch < Fire Ball < Shield < Tornado
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 11.3 Add ability slots and cooldown tracking to Player
    - Add abilities object with z, x, c, v keys
    - Add abilityCooldowns object with z, x, c, v keys
    - Initialize all slots to null and cooldowns to 0
    - _Requirements: 7.1_
  
  - [ ] 11.4 Implement useAbility method in Player class
    - Check if ability is owned (not null in slot)
    - Check if cooldown has expired (cooldown <= 0)
    - Activate ability if conditions met
    - Set cooldown timer to ability's cooldown duration
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [ ]* 11.5 Write property tests for ability activation
    - **Property 23: Ability activation with valid conditions**
    - **Validates: Requirements 7.2**
    - **Property 24: Ability activation starts cooldown**
    - **Validates: Requirements 7.3, 7.4**
    - **Property 29: Ability cooldown expiration enables reuse**
    - **Validates: Requirements 10.5**

- [ ] 12. Implement Projectile entity for ranged abilities
  - [ ] 12.1 Create Projectile class
    - Initialize with position, velocity, damage, and type
    - Set lifetime to 5 seconds
    - Implement update method to move projectile and decrease lifetime
    - Implement checkCollision method for bot collision
    - Mark projectile as inactive when lifetime expires or collision occurs
    - _Requirements: 7.5_
  
  - [ ] 12.2 Implement Projectile rendering with pixelated sprite
    - Draw projectile to Canvas context based on type
    - Apply pixelated art style
    - _Requirements: 7.6, 16.2_
  
  - [ ] 12.3 Integrate projectile-bot collision detection
    - Check each active projectile against all bots
    - Apply projectile damage to bot on collision
    - Deactivate projectile after collision
    - _Requirements: 7.5_
  
  - [ ]* 12.4 Write property test for projectile damage
    - **Property 25: Ability damages bots on contact**
    - **Validates: Requirements 7.5**

- [ ] 13. Implement Strong Punch and Fire Ball abilities
  - [ ] 13.1 Implement Strong Punch ability activation
    - Create enhanced punch with 50 pixel range
    - Apply 30 damage to bots in range
    - Set 1.0 second cooldown
    - _Requirements: 8.1_
  
  - [ ] 13.2 Implement Fire Ball ability activation
    - Spawn Projectile entity moving in player's facing direction
    - Set projectile speed to 8 pixels/frame
    - Set projectile damage to 50
    - Set 3.0 second cooldown
    - _Requirements: 8.2_

- [ ] 14. Implement Shield ability
  - [ ] 14.1 Implement Shield ability activation
    - Set player.shieldActive to true
    - Set player.shieldEndTime to current time + 10 seconds
    - Set 15.0 second cooldown
    - _Requirements: 8.3, 9.1, 9.4_
  
  - [ ] 14.2 Implement shield duration and deactivation
    - Check if current time exceeds shieldEndTime in player update
    - Deactivate shield when duration expires
    - _Requirements: 9.3_
  
  - [ ] 14.3 Integrate shield protection in takeDamage
    - Skip HP reduction if shieldActive is true
    - _Requirements: 9.2_
  
  - [ ]* 14.4 Write property test for shield protection
    - **Property 28: Shield protects for duration**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  
  - [ ] 14.5 Add visual indicator for active shield
    - Render shield effect around player when active
    - _Requirements: 9.1_

- [ ] 15. Implement Tornado ability
  - [ ] 15.1 Implement Tornado ability activation
    - Create area-of-effect damage with 150 pixel radius
    - Apply 100 damage to all bots within radius
    - Set 20.0 second cooldown
    - _Requirements: 8.4_
  
  - [ ] 15.2 Add visual effect for Tornado
    - Render tornado animation at player position
    - _Requirements: 8.4_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement Main Menu UI
  - [ ] 17.1 Create Main Menu HTML structure
    - Add four buttons: Play, Ability Shop, Ability Settings, Controls
    - Style buttons with CSS for pixelated aesthetic
    - _Requirements: 12.1_
  
  - [ ] 17.2 Implement Main Menu navigation logic
    - Wire Play button to start gameplay (scene = 'gameplay', level = 1)
    - Wire Ability Shop button to show shop UI
    - Wire Ability Settings button to show settings UI
    - Wire Controls button to show controls UI
    - _Requirements: 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 17.3 Write unit tests for menu navigation
    - Verify Play button starts level
    - Verify each button navigates to correct scene
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

- [ ] 18. Implement Ability Shop UI
  - [ ] 18.1 Create Ability Shop HTML structure
    - Display all four abilities with names and costs
    - Display current coin balance
    - Add purchase buttons for each ability
    - Add visual indicator for already owned abilities
    - Add back button to return to main menu
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.7, 13.8_
  
  - [ ] 18.2 Implement ability purchase logic
    - Check if player has sufficient coins
    - Deduct ability cost from coin balance
    - Add ability to ownedAbilities array
    - Save updated state to LocalStorage
    - Prevent double-purchase of same ability
    - _Requirements: 8.5, 8.6, 8.7, 13.6_
  
  - [ ]* 18.3 Write property tests for ability purchasing
    - **Property 26: Ability purchase deducts coins**
    - **Validates: Requirements 8.5, 8.6**
    - **Property 27: Insufficient coins prevents purchase**
    - **Validates: Requirements 8.7**
  
  - [ ]* 18.4 Write unit tests for shop display
    - Verify shop displays all 4 abilities with correct costs
    - Verify owned abilities are indicated
    - _Requirements: 13.1, 13.8_

- [ ] 19. Implement Ability Settings UI
  - [ ] 19.1 Create Ability Settings HTML structure
    - Display four slots labeled Z, X, C, V
    - Display list of owned abilities available for assignment
    - Add assign buttons for each slot-ability combination
    - Add back button to return to main menu
    - _Requirements: 14.1, 14.2_
  
  - [ ] 19.2 Implement ability assignment logic
    - Update player.abilities[key] with selected ability type
    - Update StateManager key bindings
    - Save updated bindings to LocalStorage
    - Allow reassignment of abilities to different slots
    - _Requirements: 14.3, 14.4, 14.5_
  
  - [ ]* 19.3 Write property tests for ability assignment
    - **Property 32: Ability assignment updates key binding**
    - **Validates: Requirements 14.3**
    - **Property 33: Ability reassignment changes binding**
    - **Validates: Requirements 14.4**
  
  - [ ]* 19.4 Write unit tests for settings display
    - Verify settings has 4 slots (Z, X, C, V)
    - Verify owned abilities are displayed
    - _Requirements: 14.1, 14.2_

- [ ] 20. Implement Controls Menu UI
  - [ ] 20.1 Create Controls Menu HTML structure
    - Display control scheme information
    - Show: A = move left, D = move right, Space = jump
    - Show: Left Click = punch
    - Show: Z, X, C, V = activate assigned abilities
    - Add back button to return to main menu
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 20.2 Write unit test for controls display
    - Verify all control mappings are displayed correctly
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 21. Implement cooldown visual indicators
  - [ ] 21.1 Add cooldown display for punch attack
    - Render cooldown bar or timer on screen
    - Update display based on punch cooldown value
    - _Requirements: 2.4_
  
  - [ ] 21.2 Add cooldown displays for all four ability slots
    - Render cooldown bars or timers for Z, X, C, V abilities
    - Update displays based on ability cooldown values
    - Show ability icons or names in each slot
    - _Requirements: 7.3, 7.4_

- [ ] 22. Implement HP display and visual feedback
  - [ ] 22.1 Add HP bar for player
    - Render HP bar showing current/max HP
    - Update bar when player takes damage
    - _Requirements: 1.1_
  
  - [ ] 22.2 Add HP bars for bots
    - Render HP bar above each bot
    - Update bars when bots take damage
    - _Requirements: 4.4_

- [ ] 23. Polish and error handling
  - [ ] 23.1 Implement Canvas context error handling
    - Check for null context before rendering
    - Attempt to re-acquire context if lost
    - Display error message if canvas unavailable
    - _Requirements: 16.1_
  
  - [ ] 23.2 Implement LocalStorage error handling
    - Wrap all JSON.parse calls in try-catch blocks
    - Handle quota exceeded errors gracefully
    - Handle access denied errors (private browsing)
    - Fall back to in-memory state if storage unavailable
    - _Requirements: 11.3, 14.5_
  
  - [ ] 23.3 Add game over screen
    - Display game over message when player HP reaches zero
    - Show final level reached and total coins earned
    - Add button to return to main menu
    - _Requirements: 1.2_
  
  - [ ] 23.4 Add level display
    - Render current level number on screen during gameplay
    - _Requirements: 5.4_

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Integration and final wiring
  - [ ] 25.1 Wire all components together in main game loop
    - Connect InputHandler to Player controls
    - Connect StateManager to Player abilities and coin balance
    - Connect EntityManager to collision detection and rendering
    - Ensure all menu transitions work correctly
    - _Requirements: All requirements_
  
  - [ ]* 25.2 Write integration tests for complete game flows
    - Test complete level progression flow (spawn → defeat → level up)
    - Test ability purchase and usage flow
    - Test persistence round-trip (save → reload → verify)
    - _Requirements: All requirements_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and UI content
- The game uses vanilla JavaScript (ES6+) as specified in the design document
- All visual elements use pixelated art style with image smoothing disabled
- LocalStorage persistence ensures coins, abilities, and key bindings survive page reloads
