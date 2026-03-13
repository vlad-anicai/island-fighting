# Requirements Document

## Introduction

Island Fighting is a pixelated web-based fighting game where players battle waves of robot enemies on floating island platforms. The game features progressive difficulty scaling, an ability upgrade system with purchasable powers, and level-based progression similar to platform fighters. Players earn coins by defeating enemies and use them to unlock powerful abilities that can be customized to different control keys.

## Glossary

- **Game_Engine**: The core system managing game state, rendering, and coordination
- **Player**: The player-controlled character with HP, position, and abilities
- **Bot**: An enemy robot that spawns, moves toward the player, and can be defeated
- **Island**: A floating platform level where combat takes place
- **Ability**: A purchasable combat power with cooldown and damage properties
- **Ability_Shop**: The menu interface for purchasing abilities with coins
- **Ability_Settings**: The menu interface for assigning abilities to control keys
- **Controls_Menu**: The menu interface displaying the control scheme
- **Main_Menu**: The primary navigation interface with Play, Shop, Settings, and Controls options
- **Level**: A gameplay session on a specific island with a wave of bots
- **Coin**: Currency earned by defeating bots and used to purchase abilities
- **HP**: Health points representing player or bot vitality
- **Cooldown**: Time period after using an ability before it can be used again

## Requirements

### Requirement 1: Player Character

**User Story:** As a player, I want to control a character with health and movement, so that I can navigate the island and survive combat.

#### Acceptance Criteria

1. THE Player SHALL have an HP value that decreases when damaged
2. WHEN the Player HP reaches zero, THE Game_Engine SHALL end the current level
3. THE Player SHALL have a position on the Island that can be modified by movement
4. WHEN the A key is pressed, THE Player SHALL move left
5. WHEN the D key is pressed, THE Player SHALL move right
6. WHEN the Space key is pressed, THE Player SHALL jump
7. THE Player SHALL be rendered in pixelated art style

### Requirement 2: Basic Combat

**User Story:** As a player, I want to punch enemies with a melee attack, so that I can defeat bots without using abilities.

#### Acceptance Criteria

1. WHEN the left mouse button is clicked, THE Player SHALL execute a punch attack
2. THE punch attack SHALL have a short distance range
3. WHEN a punch attack contacts a Bot within range, THE Bot SHALL take damage
4. THE punch attack SHALL have a cooldown period of 0.2 seconds
5. WHILE the punch cooldown is active, THE Player SHALL NOT be able to execute another punch attack

### Requirement 3: Bot Spawning

**User Story:** As a player, I want enemies to spawn on the island, so that I have opponents to fight.

#### Acceptance Criteria

1. WHEN a Level starts, THE Game_Engine SHALL spawn a random number of Bots on the Island
2. THE Game_Engine SHALL spawn each Bot at a random position on the Island
3. WHILE a Level is active, THE Game_Engine SHALL NOT spawn additional Bots after the initial wave
4. WHEN the current Level number increases, THE Game_Engine SHALL spawn Bots with increased HP values
5. WHEN the current Level number increases, THE Game_Engine SHALL spawn Bots with larger visual size
6. THE Bot SHALL be rendered in pixelated art style

### Requirement 4: Bot Behavior

**User Story:** As a player, I want bots to move toward me and attack, so that the game provides challenge.

#### Acceptance Criteria

1. WHILE a Bot is active, THE Bot SHALL move toward the Player position
2. WHEN a Bot contacts the Player, THE Player SHALL take damage
3. WHEN a Bot contacts the Player, THE Player HP SHALL decrease
4. THE Bot SHALL have an HP value that decreases when damaged
5. WHEN a Bot HP reaches zero, THE Game_Engine SHALL remove the Bot from the Level
6. WHEN a Bot is defeated, THE Game_Engine SHALL award Coins to the Player

### Requirement 5: Level Progression

**User Story:** As a player, I want levels to end when I defeat all enemies, so that I can progress through the game.

#### Acceptance Criteria

1. WHEN all Bots in a Level are defeated, THE Game_Engine SHALL end the current Level
2. WHEN a Level ends successfully, THE Game_Engine SHALL increment the Level number
3. WHEN a Level ends successfully, THE Game_Engine SHALL start the next Level with a new Island
4. THE Game_Engine SHALL maintain a Level counter that persists across levels

### Requirement 6: Island Levels

**User Story:** As a player, I want each level to have a different island, so that the game has visual variety.

#### Acceptance Criteria

1. THE Game_Engine SHALL render a floating Island platform for each Level
2. WHEN a new Level starts, THE Game_Engine SHALL display a different Island design
3. THE Island SHALL be rendered in pixelated art style
4. THE Player SHALL be constrained to the Island boundaries

### Requirement 7: Ability System

**User Story:** As a player, I want to use special abilities with cooldowns, so that I can employ different combat strategies.

#### Acceptance Criteria

1. THE Player SHALL have four ability slots mapped to Z, X, C, and V keys
2. WHEN an ability key is pressed AND the assigned Ability is owned AND the Cooldown has expired, THE Player SHALL activate the Ability
3. WHEN an Ability is activated, THE Game_Engine SHALL start the Cooldown timer for that Ability
4. WHILE an Ability Cooldown is active, THE Player SHALL NOT be able to activate that Ability
5. WHEN an Ability contacts a Bot, THE Bot SHALL take damage based on the Ability damage value
6. THE Ability SHALL be rendered in pixelated art style

### Requirement 8: Purchasable Abilities

**User Story:** As a player, I want to buy abilities with coins I earn, so that I can unlock more powerful attacks.

#### Acceptance Criteria

1. THE Game_Engine SHALL provide a Strong_Punch Ability purchasable for 100 Coins
2. THE Game_Engine SHALL provide a Fire_Ball Ability purchasable for 400 Coins
3. THE Game_Engine SHALL provide a Shield Ability purchasable for 750 Coins
4. THE Game_Engine SHALL provide a Tornado Ability purchasable for 1000 Coins
5. WHEN the Player purchases an Ability, THE Game_Engine SHALL deduct the cost from the Player Coin balance
6. WHEN the Player purchases an Ability, THE Ability SHALL become available for assignment in Ability_Settings
7. THE Player SHALL NOT be able to purchase an Ability if the Coin balance is insufficient

### Requirement 9: Shield Ability

**User Story:** As a player, I want a shield ability that protects me temporarily, so that I can survive dangerous situations.

#### Acceptance Criteria

1. WHEN the Shield Ability is activated, THE Player SHALL be protected from damage for 10 seconds
2. WHILE the Shield is active, Bot contact SHALL NOT reduce Player HP
3. WHEN 10 seconds elapse after Shield activation, THE Shield SHALL deactivate
4. THE Shield SHALL have a Cooldown period after deactivation

### Requirement 10: Ability Cooldowns

**User Story:** As a player, I want abilities to have cooldowns based on their power, so that the game remains balanced.

#### Acceptance Criteria

1. THE Strong_Punch Ability SHALL have a shorter Cooldown than Fire_Ball
2. THE Fire_Ball Ability SHALL have a shorter Cooldown than Shield
3. THE Shield Ability SHALL have a shorter Cooldown than Tornado
4. THE Tornado Ability SHALL have the longest Cooldown period
5. WHEN an Ability Cooldown expires, THE Player SHALL be able to activate that Ability again

### Requirement 11: Currency System

**User Story:** As a player, I want to earn and spend coins, so that I can purchase abilities.

#### Acceptance Criteria

1. THE Player SHALL have a Coin balance that starts at zero
2. WHEN a Bot is defeated, THE Game_Engine SHALL increase the Player Coin balance
3. THE Game_Engine SHALL persist the Coin balance across levels
4. THE Game_Engine SHALL display the current Coin balance to the Player

### Requirement 12: Main Menu

**User Story:** As a player, I want a main menu to navigate the game, so that I can access different features.

#### Acceptance Criteria

1. THE Main_Menu SHALL display four buttons: Play, Ability Shop, Ability Settings, and Controls
2. WHEN the Play button is clicked, THE Game_Engine SHALL start a new Level
3. WHEN the Ability Shop button is clicked, THE Game_Engine SHALL display the Ability_Shop
4. WHEN the Ability Settings button is clicked, THE Game_Engine SHALL display the Ability_Settings
5. WHEN the Controls button is clicked, THE Game_Engine SHALL display the Controls_Menu

### Requirement 13: Ability Shop Interface

**User Story:** As a player, I want to view and purchase abilities, so that I can expand my combat options.

#### Acceptance Criteria

1. THE Ability_Shop SHALL display all available abilities with their Coin costs
2. THE Ability_Shop SHALL display Strong_Punch costing 100 Coins
3. THE Ability_Shop SHALL display Fire_Ball costing 400 Coins
4. THE Ability_Shop SHALL display Shield costing 750 Coins
5. THE Ability_Shop SHALL display Tornado costing 1000 Coins
6. WHEN an Ability is clicked AND the Player has sufficient Coins, THE Game_Engine SHALL complete the purchase
7. THE Ability_Shop SHALL display the current Coin balance
8. THE Ability_Shop SHALL indicate which abilities are already owned

### Requirement 14: Ability Settings Interface

**User Story:** As a player, I want to assign abilities to specific keys, so that I can customize my control scheme.

#### Acceptance Criteria

1. THE Ability_Settings SHALL display four slots corresponding to Z, X, C, and V keys
2. THE Ability_Settings SHALL display all owned abilities available for assignment
3. WHEN an owned Ability is selected AND a slot is chosen, THE Game_Engine SHALL assign the Ability to that key
4. THE Ability_Settings SHALL allow reassignment of abilities to different slots
5. THE Ability_Settings SHALL persist ability assignments across game sessions

### Requirement 15: Controls Menu Interface

**User Story:** As a player, I want to view the control scheme, so that I know how to play the game.

#### Acceptance Criteria

1. THE Controls_Menu SHALL display that A moves the Player left
2. THE Controls_Menu SHALL display that D moves the Player right
3. THE Controls_Menu SHALL display that Space makes the Player jump
4. THE Controls_Menu SHALL display that left click executes a punch attack
5. THE Controls_Menu SHALL display that Z, X, C, and V activate assigned abilities

### Requirement 16: Web-Based Rendering

**User Story:** As a player, I want to play the game in a web browser, so that I can access it easily without installation.

#### Acceptance Criteria

1. THE Game_Engine SHALL render all game elements in a web browser
2. THE Game_Engine SHALL use pixelated art style for all visual elements
3. THE Game_Engine SHALL respond to keyboard and mouse input from the browser
4. THE Game_Engine SHALL run without requiring software installation
