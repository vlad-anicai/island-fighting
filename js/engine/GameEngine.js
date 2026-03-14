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

        // Time scale for slow motion (1.0 = normal, 0.2 = slow)
        this.timeScale = 1.0;
        this.slowMotionEndTime = 0;

        // Mobile controls state
        this.mobileEnabled = false;
        // Thunder targeting state (desktop: wait for click)
        this.thunderTargeting = null;
        // Wave state
        this.currentWave = 1;
        this.totalWaves = 1;
        this.waveAnnouncement = null;
        
        // Menu references
        this.mainMenu = document.getElementById('mainMenu');
        this.abilityShop = document.getElementById('abilityShop');
        this.hpUpgrade = document.getElementById('hpUpgrade');
        this.abilitySettings = document.getElementById('abilitySettings');
        this.codesMenu = document.getElementById('codesMenu');
        this.controlsMenu = document.getElementById('controlsMenu');
        this.hud = document.getElementById('hud');
        
        this.setupMenuListeners();

        // Forward canvas touch taps into InputHandler (for thunder targeting on mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.scene !== 'gameplay') return;
            e.preventDefault();
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width  / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.inputHandler.mouseX = (touch.clientX - rect.left) * scaleX;
            this.inputHandler.mouseY = (touch.clientY - rect.top)  * scaleY;
            this.inputHandler.mouseClicked = true;
        }, { passive: false });
        
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

        // Mobile controls toggle
        const mobileToggleBtn = document.getElementById('mobileToggleBtn');
        mobileToggleBtn.addEventListener('click', () => {
            const enabled = mobileToggleBtn.dataset.enabled === 'true';
            const next = !enabled;
            mobileToggleBtn.dataset.enabled = String(next);
            mobileToggleBtn.textContent = next ? 'ON' : 'OFF';
            this.mobileEnabled = next;
            // Show/hide overlay if currently in gameplay
            if (this.scene === 'gameplay') {
                const overlay = document.getElementById('mobileControls');
                if (next) overlay.classList.remove('hidden');
                else overlay.classList.add('hidden');
            }
        });
        // Wire mobile buttons to InputHandler
        this._setupMobileButton('mobLeft',  'a',  false);
        this._setupMobileButton('mobRight', 'd',  false);
        this._setupMobileButton('mobJump',  ' ',  false);
        this._setupMobileButton('mobZ',     'z',  false);
        this._setupMobileButton('mobX',     'x',  false);
        this._setupMobileButton('mobC',     'c',  false);
        this._setupMobileButton('mobV',     'v',  false);

        // Punch button fires a mouse click
        const mobPunch = document.getElementById('mobPunch');
        const firePunch = () => { this.inputHandler.mouseClicked = true; };
        mobPunch.addEventListener('touchstart', (e) => { e.preventDefault(); firePunch(); }, { passive: false });
        mobPunch.addEventListener('mousedown',  firePunch);
        
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
    
    /**
     * Wire a mobile button to simulate a key press/release in InputHandler
     */
    _setupMobileButton(id, key, _unused) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const press   = (e) => { e.preventDefault(); this.inputHandler.keys[key] = true; };
        const release = (e) => { e.preventDefault(); this.inputHandler.keys[key] = false; };
        btn.addEventListener('touchstart', press,   { passive: false });
        btn.addEventListener('touchend',   release, { passive: false });
        btn.addEventListener('touchcancel',release, { passive: false });
        btn.addEventListener('mousedown',  press);
        btn.addEventListener('mouseup',    release);
        btn.addEventListener('mouseleave', release);
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

        // Always hide mobile overlay when in a menu
        document.getElementById('mobileControls').classList.add('hidden');
        // Reset mobile ability buttons to default state
        ['Z','X','C','V'].forEach(k => {
            const btn = document.getElementById('mob' + k);
            if (btn) { btn.textContent = k; btn.style.background = ''; btn.style.borderColor = ''; btn.style.opacity = ''; }
        });
        
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
            { type: 'FIRE_BLAST', name: 'Fire Blast', cost: 600, description: 'Close-range fire particle punch' },
            { type: 'SHIELD', name: 'Shield', cost: 750, description: 'Temporary invincibility' },
            { type: 'EARTHQUAKE', name: 'Earthquake', cost: 850, description: 'Stuns all enemies for 3s' },
            { type: 'TORNADO', name: 'Tornado', cost: 1000, description: 'Area damage attack' },
            { type: 'THUNDER', name: 'Thunder Strike', cost: 1200, description: 'Lightning bolt at mouse position' },
            { type: 'CONTROLLED_FIRE_BALL', name: 'Controlled Fire Ball', cost: 1500, description: 'Homing fireball that follows your cursor' },
            { type: 'FLY', name: 'Fly', cost: 1800, description: 'Fly freely with W/S for 8 seconds' },
            { type: 'SLOW_MOTION', name: 'Slow Motion', cost: 2000, description: 'Slows all enemies for 5 seconds' }
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
            'FIRE_BLAST': 'Fire Blast',
            'SHIELD': 'Shield',
            'EARTHQUAKE': 'Earthquake',
            'TORNADO': 'Tornado',
            'THUNDER': 'Thunder Strike',
            'CONTROLLED_FIRE_BALL': 'Controlled Fire Ball',
            'FLY': 'Fly',
            'SLOW_MOTION': 'Slow Motion'
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

        // Show mobile overlay if enabled
        const overlay = document.getElementById('mobileControls');
        if (this.mobileEnabled) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
        
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

        // Set up waves: more waves per level as levels increase
        this.totalWaves = Math.min(2 + Math.floor(this.level / 3), 8);
        this.currentWave = 1;
        this.waveAnnouncement = null;
        
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
     * Spawns bots for the current wave
     */
    spawnBots() {
        // Wave sizing: each wave has more bots than the last
        const botsThisWave = Math.min(2 + this.currentWave + Math.floor(this.level / 2), 15);
        
        for (let i = 0; i < botsThisWave; i++) {
            // 5 spawn points: off-screen left/right + top-left/center/right above screen
            const spawnPoints = [
                { x: -50,                      y: this.island.y - 100 },  // off-screen left
                { x: this.canvas.width + 50,   y: this.island.y - 100 },  // off-screen right
                { x: 50,                        y: -50 },                  // top-left
                { x: this.canvas.width / 2,     y: -50 },                  // top-center
                { x: this.canvas.width - 50,    y: -50 },                  // top-right
            ];
            const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.bots.push(new Bot(sp.x, sp.y, this.level));
        }
        
        // Show wave announcement
        this.waveAnnouncement = {
            text: this.currentWave === this.totalWaves
                ? `WAVE ${this.currentWave} / ${this.totalWaves}  ★ FINAL WAVE ★`
                : `WAVE ${this.currentWave} / ${this.totalWaves}`,
            elapsed: 0,
            duration: 2.0
        };
        
        console.log(`Wave ${this.currentWave}/${this.totalWaves}: spawned ${botsThisWave} bots`);
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
        
        // Hide mobile overlay when returning to menu
        document.getElementById('mobileControls').classList.add('hidden');
        
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
            // Update slow motion timer
            if (this.timeScale < 1.0 && Date.now() >= this.slowMotionEndTime) {
                this.timeScale = 1.0;
            }
            this.updateGameplay(deltaTime);
            this.renderGameplay();
        }
        
        // Request next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    updateGameplay(deltaTime) {
        // Player moves at full speed; world (bots, projectiles) slowed during slow-mo
        const worldDelta = deltaTime * this.timeScale;

        // Update player
        if (this.player && this.island) {
            this.player.update(deltaTime, this.inputHandler, this.island);
            
            // Handle punch attack (or confirm thunder targeting on desktop)
            if (this.inputHandler.consumeMouseClick()) {
                if (this.thunderTargeting) {
                    // Fire thunder at clicked position
                    const { key } = this.thunderTargeting;
                    this.thunderTargeting = null;
                    const mouse = this.inputHandler.getMousePosition();
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = this.canvas.width  / rect.width;
                    const scaleY = this.canvas.height / rect.height;
                    this.player.thunderTargetX = (mouse.x - rect.left) * scaleX;
                    this.player.thunderTargetY = (mouse.y - rect.top)  * scaleY;
                    const result = this.player.useAbility(key);
                    if (result && result.type === 'THUNDER') {
                        const tx = result.x, ty = result.y, r = result.radius;
                        for (let i = this.bots.length - 1; i >= 0; i--) {
                            const bot = this.bots[i];
                            if (Math.abs((bot.x + bot.width / 2) - tx) <= r) {
                                const defeated = bot.takeDamage(result.damage);
                                if (defeated) {
                                    this.stateManager.addCoins(bot.coinReward);
                                    this.bots.splice(i, 1);
                                }
                            }
                        }
                        this.thunderEffect = { x: tx, elapsed: 0, duration: 0.5, canvasHeight: this.canvas.height };
                    }
                } else {
                    const punchHitbox = this.player.punch();
                    if (punchHitbox) {
                        // Check collision with bots
                        for (let i = this.bots.length - 1; i >= 0; i--) {
                            const bot = this.bots[i];
                            if (this.checkCollision(punchHitbox, bot)) {
                                const defeated = bot.takeDamage(punchHitbox.damage);
                                // Knockback bot away from player
                                const kbDir = bot.x + bot.width / 2 > this.player.x + this.player.width / 2 ? 1 : -1;
                                bot.applyKnockback(kbDir * 8, -4);
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
            }
            
            // Handle ability activation (Z, X, C, V keys)
            ['z', 'x', 'c', 'v'].forEach(key => {
                if (this.inputHandler.isKeyPressed(key)) {
                    // Thunder targeting mode (both desktop and mobile: wait for a tap/click)
                    if (this.player.abilities[key] === 'THUNDER') {
                        if (!this.thunderTargeting) {
                            this.thunderTargeting = { key };
                            return; // don't fire yet — wait for tap/click
                        } else if (this.thunderTargeting.key === key) {
                            // Press again to cancel
                            this.thunderTargeting = null;
                            return;
                        }
                    }
                    const result = this.player.useAbility(key);
                    if (result) {
                        console.log(`Activated ability: ${result.type}`);
                        
                        // Handle different ability types
                        if (result.hitbox) {
                            // Strong Punch / Fire Blast - check collision immediately
                            for (let i = this.bots.length - 1; i >= 0; i--) {
                                const bot = this.bots[i];
                                if (this.checkCollision(result.hitbox, bot)) {
                                    const defeated = bot.takeDamage(result.hitbox.damage);
                                    const kbDir = bot.x + bot.width / 2 > this.player.x + this.player.width / 2 ? 1 : -1;
                                    bot.applyKnockback(kbDir * 12, -6);
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
                        } else if (result.type === 'SLOW_MOTION') {
                            this.timeScale = 0.2;
                            this.slowMotionEndTime = Date.now() + result.duration;
                        } else if (result.type === 'THUNDER') {
                            // Thunder - damage all bots within radius of target
                            const tx = result.x, ty = result.y, r = result.radius;
                            for (let i = this.bots.length - 1; i >= 0; i--) {
                                const bot = this.bots[i];
                                const bx = bot.x + bot.width / 2;
                                const by = bot.y + bot.height / 2;
                                if (Math.abs(bx - tx) <= r) {
                                    const defeated = bot.takeDamage(result.damage);
                                    if (defeated) {
                                        this.stateManager.addCoins(bot.coinReward);
                                        this.bots.splice(i, 1);
                                    }
                                }
                            }
                            // Store thunder effect for rendering
                            this.thunderEffect = { x: tx, elapsed: 0, duration: 0.5, canvasHeight: this.canvas.height };
                            console.log(`Thunder Strike at (${tx.toFixed(0)}, ${ty.toFixed(0)})`);
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
            bot.update(worldDelta, { x: this.player.x, y: this.player.y }, this.island, this.timeScale);
            
            // Check bot-player collision (with cooldown to prevent instant death)
            if (this.checkCollision(bot, this.player)) {
                // Solid collision — push player out of bot
                const overlapLeft  = (bot.x + bot.width)  - this.player.x;
                const overlapRight = (this.player.x + this.player.width) - bot.x;
                const overlapTop   = (bot.y + bot.height)  - this.player.y;
                const overlapBottom= (this.player.y + this.player.height) - bot.y;
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft)       this.player.x = bot.x + bot.width;
                else if (minOverlap === overlapRight) this.player.x = bot.x - this.player.width;
                else if (minOverlap === overlapTop)   this.player.y = bot.y + bot.height;
                else                                  this.player.y = bot.y - this.player.height;

                // Stunned bots cannot deal contact damage
                if (!bot.stunned && (!this.player.damageCooldown || this.player.damageCooldown <= 0)) {
                    this.player.takeDamage(bot.contactDamage);
                    this.player.damageCooldown = 0.5;
                    // Knockback player away from bot
                    const kbDir = this.player.x + this.player.width / 2 > bot.x + bot.width / 2 ? 1 : -1;
                    this.player.velocityX += kbDir * 7;
                    this.player.velocityY = -5;
                }
            }
        }
        
        // Update player damage cooldown
        if (this.player.damageCooldown && this.player.damageCooldown > 0) {
            this.player.damageCooldown -= deltaTime;
        }

        // Bot-bot solid collision: push overlapping bots apart
        for (let i = 0; i < this.bots.length; i++) {
            for (let j = i + 1; j < this.bots.length; j++) {
                const a = this.bots[i];
                const b = this.bots[j];
                if (!this.checkCollision(a, b)) continue;
                const overlapLeft  = (a.x + a.width)  - b.x;
                const overlapRight = (b.x + b.width)  - a.x;
                const overlapTop   = (a.y + a.height) - b.y;
                const overlapBottom= (b.y + b.height) - a.y;
                const min = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                const half = min / 2;
                if (min === overlapLeft)       { a.x -= half; b.x += half; }
                else if (min === overlapRight) { a.x += half; b.x -= half; }
                else if (min === overlapTop)   { a.y -= half; b.y += half; }
                else                           { a.y += half; b.y -= half; }
            }
        }
        
        // Update thunder effect
        if (this.thunderEffect) {
            this.thunderEffect.elapsed += deltaTime;
            if (this.thunderEffect.elapsed >= this.thunderEffect.duration) {
                this.thunderEffect = null;
            }
        }

        // Update wave announcement timer
        if (this.waveAnnouncement) {
            this.waveAnnouncement.elapsed += deltaTime;
            if (this.waveAnnouncement.elapsed >= this.waveAnnouncement.duration) {
                this.waveAnnouncement = null;
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Feed mouse position to controlled fireball
            if (proj.type === 'CONTROLLED_FIRE_BALL') {
                const mouse = this.inputHandler.getMousePosition();
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width  / rect.width;
                const scaleY = this.canvas.height / rect.height;
                proj.targetX = (mouse.x - rect.left) * scaleX;
                proj.targetY = (mouse.y - rect.top)  * scaleY;
            }

            proj.update(worldDelta);
            
            // Remove inactive projectiles
            if (!proj.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with bots
            for (let j = this.bots.length - 1; j >= 0; j--) {
                const bot = this.bots[j];
                if (this.checkCollision(proj, bot)) {
                    // Tornado hits each enemy only once
                    if (proj.type === 'TORNADO') {
                        if (!proj.hitBots) proj.hitBots = new Set();
                        if (proj.hitBots.has(j)) continue;
                        proj.hitBots.add(j);
                    }
                    // Controlled Fire Ball hits each enemy with 0.5s cooldown
                    if (proj.type === 'CONTROLLED_FIRE_BALL') {
                        if (!proj.hitCooldowns) proj.hitCooldowns = new Map();
                        const lastHit = proj.hitCooldowns.get(j) || 0;
                        if (proj.elapsed - lastHit < 0.5) continue;
                        proj.hitCooldowns.set(j, proj.elapsed);
                    }
                    const defeated = bot.takeDamage(proj.damage);
                    if (defeated) {
                        this.stateManager.addCoins(bot.coinReward);
                        this.bots.splice(j, 1);
                        if (proj.hitBots) proj.hitBots.delete(j);
                        if (proj.hitCooldowns) proj.hitCooldowns.delete(j);
                    }
                    // Fire Ball stops on hit; Tornado and Controlled Fire Ball pass through
                    if (proj.type === 'FIRE_BALL') {
                        proj.active = false;
                    }
                }
            }
        }
        
        // Check wave / level completion
        if (this.bots.length === 0) {
            if (this.currentWave < this.totalWaves) {
                // Spawn next wave
                this.currentWave++;
                this.spawnBots();
            } else {
                // All waves cleared — level complete
                this.stateManager.addCoins(10);
                this.endLevel(true);
            }
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

        // Render thunder effect
        if (this.thunderEffect) {
            this.renderThunder(this.thunderEffect);
        }

        // Wave announcement banner
        if (this.waveAnnouncement) {
            const wa = this.waveAnnouncement;
            const progress = wa.elapsed / wa.duration;
            // Fade in for first 20%, hold, fade out last 30%
            let alpha = 1;
            if (progress < 0.2) alpha = progress / 0.2;
            else if (progress > 0.7) alpha = 1 - (progress - 0.7) / 0.3;
            const ctx = this.ctx;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 36px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(wa.text, this.canvas.width / 2, this.canvas.height / 2);
            ctx.restore();
        }

        // Slow motion gray overlay
        if (this.timeScale < 1.0) {
            const remaining = Math.max(0, (this.slowMotionEndTime - Date.now()) / 5000);
            const intensity = 0.35 * remaining;
            this.ctx.save();
            // Desaturate overlay
            this.ctx.fillStyle = `rgba(180, 180, 200, ${intensity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Vignette edge darkening
            const vignette = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.3,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.9
            );
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, `rgba(30,30,50,${intensity * 1.2})`);
            this.ctx.fillStyle = vignette;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // "SLOW MO" text
            this.ctx.fillStyle = `rgba(200, 220, 255, ${remaining * 0.9})`;
            this.ctx.font = 'bold 18px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SLOW MOTION', this.canvas.width / 2, 30);
            this.ctx.restore();
        }
        
        // Render thunder targeting crosshair (desktop targeting mode)
        if (this.thunderTargeting) {
            const mouse = this.inputHandler.getMousePosition();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width  / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mx = (mouse.x - rect.left) * scaleX;
            const my = (mouse.y - rect.top)  * scaleY;
            const ctx = this.ctx;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.9)';
            ctx.lineWidth = 2;
            const r = 20;
            ctx.beginPath();
            ctx.arc(mx, my, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(mx - r - 6, my); ctx.lineTo(mx + r + 6, my);
            ctx.moveTo(mx, my - r - 6); ctx.lineTo(mx, my + r + 6);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 100, 0.85)';
            ctx.font = 'bold 13px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK TO STRIKE', mx, my - r - 10);
            ctx.restore();
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
        document.getElementById('hudLevel').textContent = `Level: ${this.level}  Wave: ${this.currentWave}/${this.totalWaves}`;
    }
    
    /**
     * Renders ability cooldown indicators in the bottom-right corner
     */
    renderAbilityCooldowns() {
        if (!this.player) return;

        const keys = ['z', 'x', 'c', 'v'];
        const abilityNames = {
            'STRONG_PUNCH': 'Strong',
            'FIRE_BALL': 'Fire',
            'FIRE_BLAST': 'Blast',
            'SHIELD': 'Shield',
            'EARTHQUAKE': 'Quake',
            'TORNADO': 'Tornado',
            'THUNDER': 'Thunder',
            'CONTROLLED_FIRE_BALL': 'C.Fire',
            'FLY': 'Fly',
            'SLOW_MOTION': 'SlowMo'
        };
        const abilityColors = {
            'STRONG_PUNCH': '#FF0000',
            'FIRE_BALL': '#FF4500',
            'FIRE_BLAST': '#FF2200',
            'SHIELD': '#00FFFF',
            'EARTHQUAKE': '#8B4513',
            'TORNADO': '#C0C0C0',
            'THUNDER': '#FFFF00',
            'CONTROLLED_FIRE_BALL': '#FF8800',
            'FLY': '#64C8FF',
            'SLOW_MOTION': '#AAAACC'
        };

        if (this.mobileEnabled) {
            // Update mobile buttons to show cooldown state
            keys.forEach(key => {
                const btn = document.getElementById('mob' + key.toUpperCase());
                if (!btn) return;
                const abilityType = this.player.abilities[key];
                const cooldown = this.player.abilityCooldowns[key] || 0;

                if (abilityType) {
                    const color = abilityColors[abilityType] || '#4CAF50';
                    const name = abilityNames[abilityType] || key.toUpperCase();
                    if (cooldown > 0) {
                        const pct = cooldown / this.getAbilityMaxCooldown(abilityType);
                        btn.style.background = `linear-gradient(to top, ${color}88 ${Math.round((1 - pct) * 100)}%, rgba(0,0,0,0.7) ${Math.round((1 - pct) * 100)}%)`;
                        btn.style.borderColor = color;
                        btn.textContent = Math.ceil(cooldown);
                        btn.style.opacity = '0.6';
                    } else {
                        btn.style.background = color + 'AA';
                        btn.style.borderColor = color;
                        btn.textContent = name;
                        btn.style.opacity = '1';
                    }
                } else {
                    btn.style.background = 'rgba(76, 175, 80, 0.5)';
                    btn.style.borderColor = '#4CAF50';
                    btn.textContent = key.toUpperCase();
                    btn.style.opacity = '0.4';
                }
            });
            return; // skip canvas drawing
        }

        // Desktop: draw canvas cooldown boxes
        const ctx = this.ctx;
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

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y, boxSize, boxSize);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, boxSize, boxSize);

            if (abilityType) {
                ctx.fillStyle = abilityColors[abilityType] || '#888';
                ctx.fillRect(x + 4, y + 4, boxSize - 8, boxSize - 8);

                if (cooldown > 0) {
                    const cooldownPercent = cooldown / this.getAbilityMaxCooldown(abilityType);
                    const overlayHeight = (boxSize - 8) * cooldownPercent;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(x + 4, y + 4, boxSize - 8, overlayHeight);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Courier New';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(Math.ceil(cooldown).toString(), x + boxSize / 2, y + boxSize / 2);
                }

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(abilityNames[abilityType] || '', x + boxSize / 2, y + boxSize - 4);
            } else {
                ctx.fillStyle = '#444';
                ctx.fillRect(x + 4, y + 4, boxSize - 8, boxSize - 8);
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(key.toUpperCase(), x + boxSize / 2, y + 4);
        });
    }
    
    /**
     * Renders a jagged lightning bolt at the thunder strike position
     */
    renderThunder(effect) {
        const ctx = this.ctx;
        const progress = effect.elapsed / effect.duration;
        const alpha = progress < 0.3 ? 1 : 1 - ((progress - 0.3) / 0.7);
        const x = effect.x;
        const h = effect.canvasHeight;

        // Generate a seeded jagged bolt path from top to bottom
        // Use elapsed as seed so it flickers each frame
        const segments = 12;
        const points = [];
        points.push({ x, y: 0 });
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const jitter = (Math.sin(i * 7.3 + effect.elapsed * 40) * 28);
            points.push({ x: x + jitter, y: t * h });
        }
        points.push({ x, y: h });

        // Outer glow (wide, blue-white)
        ctx.save();
        ctx.strokeStyle = `rgba(180, 180, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 18;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        // Mid glow (yellow)
        ctx.strokeStyle = `rgba(255, 255, 100, ${alpha * 0.7})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        // Core bolt (white)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        // Impact flash circle at bottom
        const flashR = 30 * (1 - progress);
        const grad = ctx.createRadialGradient(x, h - 10, 0, x, h - 10, flashR);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.5, `rgba(200, 200, 255, ${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(100, 100, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, h - 10, flashR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Get max cooldown for an ability type
     */
    getAbilityMaxCooldown(abilityType) {
        const cooldowns = {
            'STRONG_PUNCH': 5.0,
            'FIRE_BALL': 8.0,
            'FIRE_BLAST': 6.0,
            'SHIELD': 18.0,
            'EARTHQUAKE': 15.0,
            'TORNADO': 20.0,
            'THUNDER': 10.0,
            'CONTROLLED_FIRE_BALL': 12.0,
            'FLY': 20.0,
            'SLOW_MOTION': 25.0
        };
        return cooldowns[abilityType] || 1.0;
    }
    
    stop() {
        this.running = false;
        console.log('Game engine stopped');
    }
}
