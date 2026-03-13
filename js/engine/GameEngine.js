/**
 * GameEngine - Core game loop and system coordinator
 * Manages game state, scene transitions, and orchestrates all game systems
 */

import { StateManager } from '../state/StateManager.js';
import { Island } from '../world/Island.js';
import { Player } from '../entities/Player.js';
import { InputHandler } from '../input/InputHandler.js';
import { Bot } from '../entities/Bot.js';
import { Projectile } from '../entities/Projectile.js';

export class GameEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Initialize state manager
        this.stateManager = new StateManager();
        
        // Initialize input handler
        this.inputHandler = new InputHandler();
        
        // Game state
        this.scene = 'menu'; // 'menu' or 'gameplay'
        this.running = false;
        this.lastFrameTime = 0;
        this.level = 1;
        
        // Gameplay entities (initialized when level starts)
        this.player = null;
        this.bots = [];
        this.projectiles = [];
        this.island = null;
        
        // Menu references
        this.mainMenu = document.getElementById('mainMenu');
        this.abilityShop = document.getElementById('abilityShop');
        this.hpUpgrade = document.getElementById('hpUpgrade');
        this.abilitySettings = document.getElementById('abilitySettings');
        this.codesMenu = document.getElementById('codesMenu');
        this.controlsMenu = document.getElementById('controlsMenu');
        this.hud = document.getElementById('hud');
        
        this.setupMenuListeners();
        
        console.log('GameEngine constructed');
    }
    
    setupMenuListeners() {
        // Main menu buttons
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startGameplay();
        });
        
        document.getElementById('shopBtn').addEventListener('click', () => {
            this.showMenu('shop');
        });
        
        document.getElementById('hpUpgradeBtn').addEventListener('click', () => {
            this.showMenu('hpUpgrade');
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showMenu('settings');
        });
        
        document.getElementById('secretCodeBtn').addEventListener('click', () => {
            this.showMenu('codes');
        });
        
        document.getElementById('controlsBtn').addEventListener('click', () => {
            this.showMenu('controls');
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            const btn = document.getElementById('resetBtn');
            if (btn.dataset.confirming === 'true') {
                this.resetProgress();
            } else {
                btn.dataset.confirming = 'true';
                btn.textContent = 'Click again to confirm!';
                btn.style.background = '#f44336';
                btn.style.borderColor = '#c62828';
                // Auto-cancel after 3 seconds
                setTimeout(() => {
                    btn.dataset.confirming = 'false';
                    btn.textContent = 'Reset Progress';
                    btn.style.background = '';
                    btn.style.borderColor = '';
                }, 3000);
            }
        });
        
        // Back buttons
        document.getElementById('shopBackBtn').addEventListener('click', () => {
            this.showMenu('main');
        });
        
        document.getElementById('hpUpgradeBackBtn').addEventListener('click', () => {
            this.showMenu('main');
        });
        
        document.getElementById('settingsBackBtn').addEventListener('click', () => {
            this.showMenu('main');
        });
        
        document.getElementById('codesBackBtn').addEventListener('click', () => {
            this.showMenu('main');
        });
        
        document.getElementById('controlsBackBtn').addEventListener('click', () => {
            this.showMenu('main');
        });
        
        // HP Upgrade buy button
        document.getElementById('buyHPBtn').addEventListener('click', () => {
            this.purchaseHPUpgrade();
        });
        
        // Code redemption
        document.getElementById('redeemBtn').addEventListener('click', () => {
            this.redeemCode();
        });
        
        document.getElementById('codeInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.redeemCode();
        });
    }
    
    showMenu(menuType) {
        // Hide all menus
        this.mainMenu.classList.remove('active');
        this.abilityShop.classList.remove('active');
        this.hpUpgrade.classList.remove('active');
        this.abilitySettings.classList.remove('active');
        this.codesMenu.classList.remove('active');
        this.controlsMenu.classList.remove('active');
        this.hud.classList.remove('active');
        
        // Show requested menu
        switch (menuType) {
            case 'main':
                this.mainMenu.classList.add('active');
                this.scene = 'menu';
                break;
            case 'shop':
                this.abilityShop.classList.add('active');
                this.scene = 'menu';
                this.updateAbilityShop(); // Update shop display
                break;
            case 'hpUpgrade':
                this.hpUpgrade.classList.add('active');
                this.scene = 'menu';
                this.updateHPUpgrade(); // Update HP upgrade display
                break;
            case 'settings':
                this.abilitySettings.classList.add('active');
                this.scene = 'menu';
                this.updateAbilitySettings(); // Update settings display
                break;
            case 'codes':
                this.codesMenu.classList.add('active');
                this.scene = 'menu';
                this.clearCodeMessage();
                break;
            case 'controls':
                this.controlsMenu.classList.add('active');
                this.scene = 'menu';
                break;
        }
    }
    
    /**
     * Updates the Ability Shop display
     */
    updateAbilityShop() {
        // Update coin display
        const coinDisplay = document.getElementById('coinDisplay');
        if (coinDisplay) {
            coinDisplay.textContent = `Coins: ${this.stateManager.getCoins()}`;
        }
        
        // Define abilities
        const abilities = [
            { type: 'STRONG_PUNCH', name: 'Strong Punch', cost: 100, description: 'Powerful melee attack' },
            { type: 'FIRE_BALL', name: 'Fire Ball', cost: 400, description: 'Ranged projectile attack' },
            { type: 'SHIELD', name: 'Shield', cost: 750, description: 'Temporary invincibility' },
            { type: 'EARTHQUAKE', name: 'Earthquake', cost: 850, description: 'Stuns all enemies for 3s' },
            { type: 'TORNADO', name: 'Tornado', cost: 1000, description: 'Area damage attack' }
        ];
        
        // Get ability list container
        const abilityList = document.getElementById('abilityList');
        if (!abilityList) return;
        
        // Clear existing content
        abilityList.innerHTML = '';
        
        // Create ability items
        abilities.forEach(ability => {
            const isOwned = this.stateManager.hasAbility(ability.type);
            const canAfford = this.stateManager.getCoins() >= ability.cost;
            
            const abilityItem = document.createElement('div');
            abilityItem.className = `ability-item ${isOwned ? 'owned' : ''}`;
            
            const abilityInfo = document.createElement('div');
            abilityInfo.innerHTML = `
                <div class="ability-name">${ability.name}</div>
                <div class="ability-description">${ability.description}</div>
            `;
            
            const abilityRight = document.createElement('div');
            abilityRight.style.display = 'flex';
            abilityRight.style.alignItems = 'center';
            abilityRight.style.gap = '10px';
            
            const costSpan = document.createElement('span');
            costSpan.className = 'ability-cost';
            costSpan.textContent = `${ability.cost} coins`;
            
            if (isOwned) {
                const ownedSpan = document.createElement('span');
                ownedSpan.style.color = '#4CAF50';
                ownedSpan.style.fontWeight = 'bold';
                ownedSpan.textContent = 'OWNED';
                abilityRight.appendChild(ownedSpan);
            } else {
                const buyBtn = document.createElement('button');
                buyBtn.className = 'menu-btn';
                buyBtn.textContent = 'Buy';
                buyBtn.style.minWidth = '80px';
                buyBtn.style.padding = '8px 16px';
                buyBtn.style.fontSize = '14px';
                buyBtn.disabled = !canAfford;
                buyBtn.style.opacity = canAfford ? '1' : '0.5';
                buyBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
                
                buyBtn.addEventListener('click', () => {
                    if (this.stateManager.purchaseAbility(ability.type, ability.cost)) {
                        console.log(`Purchased ${ability.name}!`);
                        this.updateAbilityShop(); // Refresh display
                    }
                });
                
                abilityRight.appendChild(costSpan);
                abilityRight.appendChild(buyBtn);
            }
            
            abilityItem.appendChild(abilityInfo);
            abilityItem.appendChild(abilityRight);
            abilityList.appendChild(abilityItem);
        });
    }
    
    /**
     * Updates the Ability Settings display
     */
    updateAbilitySettings() {
        const keyBindings = document.getElementById('keyBindings');
        if (!keyBindings) return;
        
        keyBindings.innerHTML = '';
        
        const keys = ['z', 'x', 'c', 'v'];
        const ownedAbilities = this.stateManager.getOwnedAbilities();
        const currentBindings = this.stateManager.getKeyBindings();
        
        const abilityNames = {
            'STRONG_PUNCH': 'Strong Punch',
            'FIRE_BALL': 'Fire Ball',
            'SHIELD': 'Shield',
            'EARTHQUAKE': 'Earthquake',
            'TORNADO': 'Tornado'
        };
        
        keys.forEach(key => {
            const bindingSlot = document.createElement('div');
            bindingSlot.className = 'binding-slot';
            
            const keyLabel = document.createElement('div');
            keyLabel.className = 'binding-key';
            keyLabel.textContent = key.toUpperCase();
            
            const selectContainer = document.createElement('div');
            selectContainer.style.display = 'flex';
            selectContainer.style.alignItems = 'center';
            selectContainer.style.gap = '10px';
            
            const select = document.createElement('select');
            select.style.fontFamily = "'Courier New', monospace";
            select.style.fontSize = '16px';
            select.style.padding = '8px 12px';
            select.style.background = '#333';
            select.style.color = '#fff';
            select.style.border = '2px solid #fff';
            select.style.cursor = 'pointer';
            select.style.minWidth = '200px';
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- None --';
            select.appendChild(emptyOption);
            
            // Add owned abilities (filter out already assigned ones)
            const assignedAbilities = Object.values(currentBindings).filter(v => v !== null);
            
            ownedAbilities.forEach(abilityType => {
                // Skip if this ability is already assigned to another slot
                if (assignedAbilities.includes(abilityType) && currentBindings[key] !== abilityType) {
                    return;
                }
                
                const option = document.createElement('option');
                option.value = abilityType;
                option.textContent = abilityNames[abilityType] || abilityType;
                select.appendChild(option);
            });
            
            // Set current binding
            select.value = currentBindings[key] || '';
            
            // Handle selection change
            select.addEventListener('change', (e) => {
                const selectedAbility = e.target.value || null;
                this.stateManager.assignAbility(key, selectedAbility);
                
                // Update player abilities
                if (this.player) {
                    this.player.abilities[key] = selectedAbility;
                }
                
                console.log(`Assigned ${selectedAbility || 'nothing'} to key ${key.toUpperCase()}`);
                this.updateAbilitySettings(); // Refresh display
            });
            
            selectContainer.appendChild(select);
            
            bindingSlot.appendChild(keyLabel);
            bindingSlot.appendChild(selectContainer);
            keyBindings.appendChild(bindingSlot);
        });
    }
    
    /**
     * Updates the HP Upgrade display
     */
    updateHPUpgrade() {
        const hpCoinDisplay = document.getElementById('hpCoinDisplay');
        const currentMaxHP = document.getElementById('currentMaxHP');
        const upgradeCost = document.getElementById('upgradeCost');
        const buyHPBtn = document.getElementById('buyHPBtn');
        
        if (hpCoinDisplay) {
            hpCoinDisplay.textContent = `Coins: ${this.stateManager.getCoins()}`;
        }
        
        if (currentMaxHP) {
            currentMaxHP.textContent = this.stateManager.getMaxHP();
        }
        
        const cost = this.stateManager.getHPUpgradeCost();
        if (upgradeCost) {
            upgradeCost.textContent = cost;
        }
        
        if (buyHPBtn) {
            const canAfford = this.stateManager.getCoins() >= cost;
            buyHPBtn.disabled = !canAfford;
            buyHPBtn.style.opacity = canAfford ? '1' : '0.5';
            buyHPBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        }
    }
    
    /**
     * Purchase an HP upgrade
     */
    purchaseHPUpgrade() {
        const cost = this.stateManager.getHPUpgradeCost();
        if (this.stateManager.purchaseHPUpgrade(cost)) {
            console.log('HP Upgrade purchased! New max HP:', this.stateManager.getMaxHP());
            this.updateHPUpgrade(); // Refresh display
        } else {
            console.log('Cannot purchase HP upgrade - insufficient coins');
        }
    }
    
    /**
     * Redeem a code for rewards
     */
    redeemCode() {
        const codeInput = document.getElementById('codeInput');
        const code = codeInput.value.trim().toUpperCase();
        
        if (!code) {
            this.showCodeMessage('Please enter a code', 'error');
            return;
        }
        
        // Valid codes
        const codes = {
            '1MYEN.ROT': 100000
        };
        
        if (codes[code]) {
            const reward = codes[code];
            this.stateManager.addCoins(reward);
            this.showCodeMessage(`Success! +${reward.toLocaleString()} coins!`, 'success');
            codeInput.value = '';
            console.log(`Code redeemed: ${code} - Awarded ${reward} coins`);
        } else {
            this.showCodeMessage('Invalid code', 'error');
        }
    }
    
    /**
     * Show code redemption message
     */
    showCodeMessage(message, type) {
        const messageEl = document.getElementById('codeMessage');
        messageEl.textContent = message;
        messageEl.className = `code-message ${type}`;
    }
    
    /**
     * Clear code message
     */
    clearCodeMessage() {
        const messageEl = document.getElementById('codeMessage');
        const codeInput = document.getElementById('codeInput');
        messageEl.textContent = '';
        messageEl.className = 'code-message';
        codeInput.value = '';
    }
    
    /**
     * Reset all game progress
     */
    resetProgress() {
        this.stateManager.resetAll();
        // Reload the page to reinitialize everything cleanly
        window.location.reload();
    }
    
    startGameplay() {
        console.log('Starting gameplay...');
        
        // Hide all menus
        this.mainMenu.classList.remove('active');
        this.abilityShop.classList.remove('active');
        this.abilitySettings.classList.remove('active');
        this.controlsMenu.classList.remove('active');
        
        // Show HUD
        this.hud.classList.add('active');
        
        // Set scene to gameplay
        this.scene = 'gameplay';
        
        // Initialize first level
        this.initializeLevel(1);
    }
    
    /**
     * Initialize a new level with island, player, and bots
     * @param {number} levelNumber - The level number to initialize
     */
    initializeLevel(levelNumber) {
        console.log(`Initializing level ${levelNumber}...`);
        
        // Cap level number at 999 to prevent overflow
        this.level = Math.min(levelNumber, 999);
        
        // Clear existing entities
        this.bots = [];
        this.projectiles = [];
        
        // Create island instance for this level
        this.island = new Island(this.level);
        
        // Create player instance at center of island
        const centerX = this.island.x + this.island.width / 2 - 16; // 16 = half of player width (32)
        const centerY = this.island.y - 48; // 48 = player height
        this.player = new Player(centerX, centerY);
        
        // Apply HP upgrades from state
        const maxHP = this.stateManager.getMaxHP();
        this.player.maxHp = maxHP;
        this.player.hp = maxHP;
        
        // Load player abilities from state
        const bindings = this.stateManager.getKeyBindings();
        this.player.abilities = { ...bindings };
        
        // Spawn bots for this level
        this.spawnBots();
    }
    
    /**
     * Spawns bots for the current level
     */
    spawnBots() {
        // Bot count increases by 1 every 2 levels: 3 + floor(level / 2)
        const botCount = Math.min(3 + Math.floor(this.level / 2), 20);
        
        for (let i = 0; i < botCount; i++) {
            // Spawn from sides of screen (left or right)
            const spawnFromLeft = Math.random() < 0.5;
            const x = spawnFromLeft ? -50 : this.canvas.width + 50;
            const y = this.island.y - 100; // Spawn above the island
            
            const bot = new Bot(x, y, this.level);
            this.bots.push(bot);
        }
        
        console.log(`Spawned ${botCount} bots for level ${this.level}`);
    }
    
    /**
     * Transition to the next level
     * Increments level counter and initializes new level
     */
    transitionToNextLevel() {
        console.log(`Transitioning from level ${this.level} to level ${this.level + 1}...`);
        
        // Increment level number
        const nextLevel = this.level + 1;
        
        // Initialize the next level
        this.initializeLevel(nextLevel);
    }
    
    /**
     * End the current level (either success or failure)
     * @param {boolean} success - Whether the level was completed successfully
     */
    endLevel(success) {
        console.log(`Level ${this.level} ended. Success: ${success}`);
        
        if (success) {
            // Level completed successfully - transition to next level
            this.transitionToNextLevel();
        } else {
            // Level failed (player died) - return to main menu
            this.showGameOver();
        }
    }
    
    /**
     * Show game over screen and return to main menu
     */
    showGameOver() {
        console.log('Game Over');
        
        // TODO: Display game over screen with stats (Task 23.3)
        // For now, just return to main menu
        this.showMenu('main');
    }
    
    start() {
        console.log('Game engine starting...');
        this.running = true;
        this.lastFrameTime = performance.now();
        this.gameLoop(this.lastFrameTime);
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Update and render based on current scene
        if (this.scene === 'gameplay') {
            this.updateGameplay(deltaTime);
            this.renderGameplay();
        }
        
        // Request next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    updateGameplay(deltaTime) {
        // Update player
        if (this.player && this.island) {
            this.player.update(deltaTime, this.inputHandler, this.island);
            
            // Handle punch attack
            if (this.inputHandler.consumeMouseClick()) {
                const punchHitbox = this.player.punch();
                if (punchHitbox) {
                    // Check collision with bots
                    for (let i = this.bots.length - 1; i >= 0; i--) {
                        const bot = this.bots[i];
                        if (this.checkCollision(punchHitbox, bot)) {
                            const defeated = bot.takeDamage(punchHitbox.damage);
                            if (defeated) {
                                // Award coins
                                this.stateManager.addCoins(bot.coinReward);
                                // Remove bot
                                this.bots.splice(i, 1);
                                console.log(`Bot defeated! +${bot.coinReward} coins`);
                            }
                        }
                    }
                }
            }
            
            // Handle ability activation (Z, X, C, V keys)
            ['z', 'x', 'c', 'v'].forEach(key => {
                if (this.inputHandler.isKeyPressed(key)) {
                    const result = this.player.useAbility(key);
                    if (result) {
                        console.log(`Activated ability: ${result.type}`);
                        
                        // Handle different ability types
                        if (result.hitbox) {
                            // Strong Punch - check collision immediately
                            for (let i = this.bots.length - 1; i >= 0; i--) {
                                const bot = this.bots[i];
                                if (this.checkCollision(result.hitbox, bot)) {
                                    const defeated = bot.takeDamage(result.hitbox.damage);
                                    if (defeated) {
                                        this.stateManager.addCoins(bot.coinReward);
                                        this.bots.splice(i, 1);
                                    }
                                }
                            }
                        } else if (result.projectile) {
                            // Fire Ball or Tornado - create projectile
                            const proj = new Projectile(
                                result.projectile.x,
                                result.projectile.y,
                                result.projectile.velocityX,
                                result.projectile.velocityY,
                                result.projectile.damage,
                                result.projectile.type,
                                'player'
                            );
                            this.projectiles.push(proj);
                        } else if (result.type === 'EARTHQUAKE') {
                            // Earthquake - stun all bots
                            for (const bot of this.bots) {
                                bot.stun(result.stunDuration);
                            }
                            console.log(`Earthquake! Stunned ${this.bots.length} bots for ${result.stunDuration / 1000}s`);
                        }
                    }
                }
            });
            
            // Check if player died
            if (this.player.hp <= 0) {
                this.endLevel(false);
            }
        }
        
        // Update bots
        for (let i = this.bots.length - 1; i >= 0; i--) {
            const bot = this.bots[i];
            bot.update(deltaTime, { x: this.player.x, y: this.player.y }, this.island);
            
            // Check bot-player collision (with cooldown to prevent instant death)
            if (this.checkCollision(bot, this.player)) {
                // Add damage cooldown to prevent multiple hits per frame
                if (!this.player.damageCooldown || this.player.damageCooldown <= 0) {
                    this.player.takeDamage(bot.contactDamage);
                    this.player.damageCooldown = 0.5; // 0.5 second invulnerability after hit
                    console.log(`Player hit! HP: ${this.player.hp}`);
                }
            }
        }
        
        // Update player damage cooldown
        if (this.player.damageCooldown && this.player.damageCooldown > 0) {
            this.player.damageCooldown -= deltaTime;
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(deltaTime);
            
            // Remove inactive projectiles
            if (!proj.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with bots
            for (let j = this.bots.length - 1; j >= 0; j--) {
                const bot = this.bots[j];
                if (this.checkCollision(proj, bot)) {
                    const defeated = bot.takeDamage(proj.damage);
                    if (defeated) {
                        this.stateManager.addCoins(bot.coinReward);
                        this.bots.splice(j, 1);
                    }
                    // Tornado continues through enemies, Fire Ball stops
                    if (proj.type === 'FIRE_BALL') {
                        proj.active = false;
                    }
                }
            }
        }
        
        // Check level completion
        if (this.bots.length === 0) {
            console.log('All bots defeated! Level complete!');
            // No bonus coins for level completion
            this.endLevel(true);
        }
    }
    
    /**
     * Simple AABB collision detection
     */
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    renderGameplay() {
        // Clear canvas with sky background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render island if it exists
        if (this.island) {
            this.island.render(this.ctx);
        }
        
        // Render player if it exists
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render bots
        for (const bot of this.bots) {
            bot.render(this.ctx);
        }
        
        // Render projectiles
        for (const proj of this.projectiles) {
            proj.render(this.ctx);
        }
        
        // Update HUD
        this.updateHUD();
        
        // Render ability cooldown indicators
        this.renderAbilityCooldowns();
        
        // TODO: Render effects
        // Will be implemented in future tasks
    }
    
    /**
     * Updates the HUD display
     */
    updateHUD() {
        if (this.player) {
            document.getElementById('hudHP').textContent = `HP: ${this.player.hp}`;
        }
        document.getElementById('hudCoins').textContent = `Coins: ${this.stateManager.getCoins()}`;
        document.getElementById('hudLevel').textContent = `Level: ${this.level}`;
    }
    
    /**
     * Renders ability cooldown indicators in the bottom-right corner
     */
    renderAbilityCooldowns() {
        if (!this.player) return;
        
        const ctx = this.ctx;
        const keys = ['z', 'x', 'c', 'v'];
        const abilityNames = {
            'STRONG_PUNCH': 'Strong',
            'FIRE_BALL': 'Fire',
            'SHIELD': 'Shield',
            'EARTHQUAKE': 'Quake',
            'TORNADO': 'Tornado'
        };
        
        const abilityColors = {
            'STRONG_PUNCH': '#FF0000',
            'FIRE_BALL': '#FF4500',
            'SHIELD': '#00FFFF',
            'EARTHQUAKE': '#8B4513',
            'TORNADO': '#C0C0C0'
        };
        
        const boxSize = 60;
        const gap = 10;
        const startX = this.canvas.width - (boxSize + gap);
        const startY = this.canvas.height - (boxSize * 4 + gap * 5);
        
        ctx.imageSmoothingEnabled = false;
        
        keys.forEach((key, index) => {
            const abilityType = this.player.abilities[key];
            const cooldown = this.player.abilityCooldowns[key];
            
            const x = startX;
            const y = startY + (index * (boxSize + gap));
            
            // Draw box background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y, boxSize, boxSize);
            
            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, boxSize, boxSize);
            
            if (abilityType) {
                // Draw ability color indicator
                ctx.fillStyle = abilityColors[abilityType] || '#888';
                ctx.fillRect(x + 4, y + 4, boxSize - 8, boxSize - 8);
                
                // Draw cooldown overlay if on cooldown
                if (cooldown > 0) {
                    const cooldownPercent = cooldown / this.getAbilityMaxCooldown(abilityType);
                    const overlayHeight = (boxSize - 8) * cooldownPercent;
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(x + 4, y + 4, boxSize - 8, overlayHeight);
                    
                    // Draw cooldown text
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Courier New';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(Math.ceil(cooldown).toString(), x + boxSize / 2, y + boxSize / 2);
                }
                
                // Draw ability name
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(abilityNames[abilityType] || '', x + boxSize / 2, y + boxSize - 4);
            } else {
                // Empty slot
                ctx.fillStyle = '#444';
                ctx.fillRect(x + 4, y + 4, boxSize - 8, boxSize - 8);
            }
            
            // Draw key label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(key.toUpperCase(), x + boxSize / 2, y + 4);
        });
    }
    
    /**
     * Get max cooldown for an ability type
     */
    getAbilityMaxCooldown(abilityType) {
        const cooldowns = {
            'STRONG_PUNCH': 5.0,
            'FIRE_BALL': 8.0,
            'SHIELD': 18.0,
            'EARTHQUAKE': 15.0,
            'TORNADO': 20.0
        };
        return cooldowns[abilityType] || 1.0;
    }
    
    stop() {
        this.running = false;
        console.log('Game engine stopped');
    }
}
