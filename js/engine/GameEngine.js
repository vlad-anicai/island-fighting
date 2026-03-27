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

        // No-cooldown cheat end time (0 = inactive)
        this.noCooldownEndTime = 0;

        // Island theme: 1 = normal, 2 = neon night, 3 = hellfire, 4 = space
        this.islandTheme = parseInt(localStorage.getItem('islandTheme') || '1', 10);

        // Magma puddles
        this.magmaPuddles = [];

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

        document.getElementById('nextIslandBtn').addEventListener('click', () => {
            if (this.islandTheme >= 4) return;
            const requirements = { 1: 'TORNADO', 2: 'MAGMA_ROCK', 3: 'FLY' };
            const req = requirements[this.islandTheme];
            if (req && !this.stateManager.hasAbility(req)) return;
            this.stateManager.resetForNextIsland();
            this.islandTheme++;
            localStorage.setItem('islandTheme', this.islandTheme);
            this.startGameplay(1);
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

        // Death screen buttons
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            this.showMenu('gameplay');
            this.initializeLevel(this.level);
        });
        document.getElementById('deathMenuBtn').addEventListener('click', () => {
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

        // Block button holds F key
        this._setupMobileButton('mobBlock', 'f', false);
        
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
        document.getElementById('deathScreen').classList.remove('active');

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
                // Update Next Island button state
                const nextBtn = document.getElementById('nextIslandBtn');
                if (this.islandTheme >= 4) {
                    nextBtn.disabled = true;
                    nextBtn.style.opacity = '0.4';
                    nextBtn.style.cursor = 'not-allowed';
                    nextBtn.textContent = 'Final Island Reached';
                    nextBtn.title = 'You are on the final island';
                } else {
                    const requirements = { 1: 'TORNADO', 2: 'MAGMA_ROCK', 3: 'FLY' };
                    const req = requirements[this.islandTheme];
                    const hasReq = req ? this.stateManager.hasAbility(req) : true;
                    nextBtn.disabled = !hasReq;
                    nextBtn.style.opacity = hasReq ? '1' : '0.4';
                    nextBtn.style.cursor = hasReq ? 'pointer' : 'not-allowed';
                    nextBtn.textContent = `Go to Next Island (${this.islandTheme + 1}/4)`;
                    nextBtn.title = hasReq ? '' : `Requires ${req ? req.replace('_', ' ') : ''} ability`;
                }
                break;
            case 'shop':
                this.abilityShop.classList.add('active');
                this.scene = 'menu';
                this.updateAbilityShop();
                break;
            case 'hpUpgrade':
                this.hpUpgrade.classList.add('active');
                this.scene = 'menu';
                this.updateHPUpgrade();
                break;
            case 'settings':
                this.abilitySettings.classList.add('active');
                this.scene = 'menu';
                this.updateAbilitySettings();
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
            case 'death':
                document.getElementById('deathScreen').classList.add('active');
                document.getElementById('deathLevel').textContent = `Reached Level ${this.level}`;
                this.scene = 'menu';
                break;
            case 'gameplay':
                this.hud.classList.add('active');
                if (this.mobileEnabled) document.getElementById('mobileControls').classList.remove('hidden');
                this.scene = 'gameplay';
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
            { type: 'BOMB', name: 'Bomb', cost: 900, description: 'Thrown grenade that arcs and explodes in a large radius' },
            { type: 'TORNADO', name: 'Tornado', cost: 1000, description: 'Area damage attack' },
            { type: 'JUMP_BOOTS', name: 'Jump Boots', cost: 800, description: 'Boost jump height for 10 seconds', unlocksAt: 4 },
            { type: 'IRON_GLOVES', name: 'Iron Gloves', cost: 900, description: 'Double punch and strong punch damage for 10 seconds', unlocksAt: 4 },
            { type: 'FROSTBITE', name: 'Frostbite', cost: 1000, description: 'Icy projectile that slows the first enemy hit', unlocksAt: 2 },
            { type: 'MAGMA_ROCK', name: 'Magma Rock', cost: 1100, description: 'Projectile that leaves a burning magma puddle on hit', unlocksAt: 2 },
            { type: 'THUNDER', name: 'Thunder Strike', cost: 1200, description: 'Lightning bolt at mouse position', unlocksAt: 3 },
            { type: 'CONTROLLED_FIRE_BALL', name: 'Controlled Fire Ball', cost: 1500, description: 'Homing fireball that follows your cursor', unlocksAt: 3 },
            { type: 'FLY', name: 'Fly', cost: 1800, description: 'Fly freely with W/S for 8 seconds', unlocksAt: 3 },
            { type: 'THRUSTER_HANDS', name: 'Thruster Hands', cost: 1600, description: 'Launch forward at high speed, damaging all in your path', unlocksAt: 4 },
            { type: 'REACTOR_EXPLOSION', name: 'Reactor Explosion', cost: 2200, description: 'Detonate your electronic chestplate in a massive explosion around you', unlocksAt: 4 },
            { type: 'SLOW_MOTION', name: 'Slow Motion', cost: 2000, description: 'Slows all enemies for 5 seconds', unlocksAt: 4 },
            { type: 'PLASMA_LASER', name: 'Plasma Laser', cost: 2500, description: 'Fast piercing beam that passes through all enemies', unlocksAt: 4 },
            { type: 'BLACK_FLASH', name: 'Black Flash', cost: 2750, description: 'Super punch with black sparks — massive damage', unlocksAt: 4 }
        ];
        
        // Get ability list container
        const abilityList = document.getElementById('abilityList');
        if (!abilityList) return;
        
        // Clear existing content
        abilityList.innerHTML = '';
        
        // Create ability items
        abilities.forEach(ability => {
            // Locked if ability has an unlocksAt island higher than current
            const locked = this.islandTheme < 4 && ability.unlocksAt && ability.unlocksAt > this.islandTheme;

            const isOwned = this.stateManager.hasAbility(ability.type);
            const canAfford = this.stateManager.getCoins() >= ability.cost;

            const abilityItem = document.createElement('div');
            abilityItem.className = `ability-item ${isOwned ? 'owned' : ''} ${locked ? 'locked' : ''}`;
            if (locked) abilityItem.style.opacity = '0.4';

            const lockDesc = ability.unlocksAt ? `🔒 Unlocks on Island ${ability.unlocksAt}` : '🔒 Locked';
            const abilityInfo = document.createElement('div');
            abilityInfo.innerHTML = `
                <div class="ability-name">${locked ? '🔒 ' : ''}${ability.name}</div>
                <div class="ability-description">${locked ? lockDesc : ability.description}</div>
            `;

            const abilityRight = document.createElement('div');
            abilityRight.style.display = 'flex';
            abilityRight.style.alignItems = 'center';
            abilityRight.style.gap = '10px';

            const costSpan = document.createElement('span');
            costSpan.className = 'ability-cost';
            costSpan.textContent = `${ability.cost} coins`;

            if (locked) {
                const lockedSpan = document.createElement('span');
                lockedSpan.style.color = '#888';
                lockedSpan.style.fontWeight = 'bold';
                lockedSpan.textContent = 'LOCKED';
                abilityRight.appendChild(lockedSpan);
            } else if (isOwned) {
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
                        if (this.player) {
                            this.player.abilities = { ...this.stateManager.getKeyBindings() };
                        }
                        this.updateAbilityShop();
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
            'SLOW_MOTION': 'Slow Motion',
            'PLASMA_LASER': 'Plasma Laser',
            'BOMB': 'Bomb',
            'BLACK_FLASH': 'Black Flash',
            'FROSTBITE': 'Frostbite',
            'MAGMA_ROCK': 'Magma Rock',
            'THRUSTER_HANDS': 'Thruster Hands',
            'REACTOR_EXPLOSION': 'Reactor Explosion',
            'JUMP_BOOTS': 'Jump Boots',
            'IRON_GLOVES': 'Iron Gloves'
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
        } else if (code === 'RIG15.ROT') {
            this.noCooldownEndTime = Date.now() + 5 * 60 * 1000; // 5 minutes
            this.showCodeMessage('No cooldowns for 5 minutes!', 'success');
            codeInput.value = '';
            console.log('Code redeemed: SIGMA.SUS - No cooldowns for 5 minutes');
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
        localStorage.removeItem('islandTheme');
        window.location.reload();
    }
    
    startGameplay(startLevel = 1) {
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
        
        // Initialize level
        this.initializeLevel(startLevel);
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
        this.magmaPuddles = [];

        // Set up waves: more waves per level as levels increase
        const baseWaves = Math.min(2 + Math.floor(this.level / 3), 8);
        this.totalWaves = this.islandTheme === 4 ? Math.min(baseWaves + 4, 12)
                        : this.islandTheme === 3 ? Math.min(baseWaves + 3, 11)
                        : this.islandTheme === 2 ? Math.min(baseWaves + 2, 10)
                        : baseWaves;
        this.currentWave = 1;
        this.waveAnnouncement = null;
        
        // Create island instance for this level
        this.island = new Island(this.level, this.islandTheme);
        
        // Create player instance at center of island
        const centerX = this.island.x + this.island.width / 2 - 16; // 16 = half of player width (32)
        const centerY = this.island.y - 48; // 48 = player height
        this.player = new Player(centerX, centerY);
        
        // Apply HP upgrades from state
        const maxHP = this.stateManager.getMaxHP();
        this.player.maxHp = maxHP;
        this.player.hp = maxHP;

        // Island damage multipliers: 1=1x, 2=1.5x, 3=2x, 4=2.5x
        const dmgMults = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 2.5 };
        this.player.damageMultiplier = dmgMults[this.islandTheme] || 1.0;
        
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
        const baseCount = Math.min(2 + this.currentWave + Math.floor(this.level / 2), 15);
        const botsThisWave = this.islandTheme === 4 ? Math.min(baseCount + 6, 22)
                           : this.islandTheme === 3 ? Math.min(baseCount + 4, 20)
                           : this.islandTheme === 2 ? Math.min(baseCount + 3, 18)
                           : baseCount;
        
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
            const bot = new Bot(sp.x, sp.y, this.level);
            bot.islandTheme = this.islandTheme;
            // Island difficulty scaling (no speed increase — only HP and damage)
            if (this.islandTheme === 2) {
                bot.hp = Math.floor(bot.hp * 1.8);
                bot.maxHp = bot.hp;
                bot.contactDamage = Math.floor(bot.contactDamage * 1.5);
            } else if (this.islandTheme === 3) {
                bot.hp = Math.floor(bot.hp * 2.5);
                bot.maxHp = bot.hp;
                bot.contactDamage = Math.floor(bot.contactDamage * 2.0);
            } else if (this.islandTheme === 4) {
                bot.hp = Math.floor(bot.hp * 3.5);
                bot.maxHp = bot.hp;
                bot.contactDamage = Math.floor(bot.contactDamage * 2.5);
            }
            this.bots.push(bot);
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
        document.getElementById('mobileControls').classList.add('hidden');
        this.showMenu('death');
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
            // Zero ability cooldowns while SIGMA.SUS is active
            if (this.noCooldownEndTime > 0 && this.player) {
                if (Date.now() < this.noCooldownEndTime) {
                    for (const key in this.player.abilityCooldowns) {
                        this.player.abilityCooldowns[key] = 0;
                    }
                } else {
                    this.noCooldownEndTime = 0;
                }
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
            
            // Thruster Hands: damage bots player passes through during dash
            if (this.player.dashing && this._thrusterDamage) {
                for (let i = this.bots.length - 1; i >= 0; i--) {
                    const bot = this.bots[i];
                    if (this.player.dashHitBots.has(i)) continue;
                    if (this.checkCollision(this.player, bot)) {
                        this.player.dashHitBots.add(i);
                        const defeated = bot.takeDamage(this.playerDmg(this._thrusterDamage));
                        const kbDir = bot.x + bot.width / 2 > this.player.x + this.player.width / 2 ? 1 : -1;
                        bot.applyKnockback(kbDir * 15, -8);
                        if (defeated) {
                            this.stateManager.addCoins(bot.coinReward);
                            this.bots.splice(i, 1);
                        }
                    }
                }
            }
            if (!this.player.dashing) this._thrusterDamage = null;
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
                                const defeated = bot.takeDamage(this.playerDmg(result.damage));
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
                                const defeated = bot.takeDamage(this.playerDmg(punchHitbox.damage));
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
                                    const defeated = bot.takeDamage(this.playerDmg(result.hitbox.damage));
                                    const kbDir = bot.x + bot.width / 2 > this.player.x + this.player.width / 2 ? 1 : -1;
                                    bot.applyKnockback(kbDir * 12, -6);
                                    // Black Flash hit effect on bot
                                    if (result.type === 'BLACK_FLASH') {
                                        bot.blackFlashEffect = { elapsed: 0, duration: 0.5 };
                                    }
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
                        } else if (result.type === 'THRUSTER_HANDS') {
                            // Store damage for per-frame collision during dash
                            this._thrusterDamage = result.damage;
                        } else if (result.type === 'EARTHQUAKE') {
                            // Earthquake - stun all bots
                            for (const bot of this.bots) {
                                bot.stun(result.stunDuration);                            }
                        } else if (result.type === 'SLOW_MOTION') {
                            this.timeScale = 0.2;
                            this.slowMotionEndTime = Date.now() + result.duration;
                        } else if (result.type === 'REACTOR_EXPLOSION') {
                            // Damage all bots within explosion radius
                            const ex = this.player.x + this.player.width / 2;
                            const ey = this.player.y + this.player.height / 2;
                            for (let i = this.bots.length - 1; i >= 0; i--) {
                                const bot = this.bots[i];
                                const bx = bot.x + bot.width / 2;
                                const by = bot.y + bot.height / 2;
                                const dist = Math.sqrt((bx - ex) ** 2 + (by - ey) ** 2);
                                if (dist <= result.radius) {
                                    const defeated = bot.takeDamage(this.playerDmg(result.damage));
                                    const kbDir = bx > ex ? 1 : -1;
                                    bot.applyKnockback(kbDir * 18, -10);
                                    if (defeated) {
                                        this.stateManager.addCoins(bot.coinReward);
                                        this.bots.splice(i, 1);
                                    }
                                }
                            }
                            // Store explosion effect for rendering
                            this.reactorExplosionEffect = {
                                x: ex, y: ey,
                                radius: result.radius,
                                elapsed: 0, duration: 0.6
                            };
                        } else if (result.type === 'THUNDER') {
                            // Thunder - damage all bots within radius of target
                            const tx = result.x, ty = result.y, r = result.radius;
                            for (let i = this.bots.length - 1; i >= 0; i--) {
                                const bot = this.bots[i];
                                const bx = bot.x + bot.width / 2;
                                const by = bot.y + bot.height / 2;
                                if (Math.abs(bx - tx) <= r) {
                                    const defeated = bot.takeDamage(this.playerDmg(result.damage));
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

            // Update black flash hit effect
            if (bot.blackFlashEffect) {
                bot.blackFlashEffect.elapsed += deltaTime;
                if (bot.blackFlashEffect.elapsed >= bot.blackFlashEffect.duration) {
                    bot.blackFlashEffect = null;
                }
            }
            
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

        // Update reactor explosion effect
        if (this.reactorExplosionEffect) {
            this.reactorExplosionEffect.elapsed += deltaTime;
            if (this.reactorExplosionEffect.elapsed >= this.reactorExplosionEffect.duration) {
                this.reactorExplosionEffect = null;
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

            // Bomb: explode when it hits the island ground
            if (proj.type === 'BOMB' && !proj.exploded && this.island) {
                const groundY = this.island.y - proj.height;
                if (proj.y >= groundY) {
                    proj.y = groundY;
                    proj.exploded = true;
                    proj.velocityX = 0;
                    proj.velocityY = 0;
                    // AoE damage to all bots within explosion radius
                    const cx = proj.x + proj.width / 2;
                    const cy = proj.y + proj.height / 2;
                    for (let j = this.bots.length - 1; j >= 0; j--) {
                        const bot = this.bots[j];
                        const bx = bot.x + bot.width / 2;
                        const by = bot.y + bot.height / 2;
                        const dist = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
                        if (dist <= proj.explosionRadius) {
                            const defeated = bot.takeDamage(this.playerDmg(proj.damage));
                            // Knockback away from explosion center
                            const kbDir = bx > cx ? 1 : -1;
                            bot.applyKnockback(kbDir * 10, -8);
                            if (defeated) {
                                this.stateManager.addCoins(bot.coinReward);
                                this.bots.splice(j, 1);
                            }
                        }
                    }
                }
            }

            proj.update(worldDelta);
            
            // Remove inactive projectiles
            if (!proj.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with bots (skip bomb — it uses AoE explosion on landing)
            if (proj.type === 'BOMB') continue;
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
                    // Plasma Laser pierces all — hits each bot only once
                    if (proj.type === 'PLASMA_LASER') {
                        if (!proj.hitBots) proj.hitBots = new Set();
                        if (proj.hitBots.has(j)) continue;
                        proj.hitBots.add(j);
                    }
                    const defeated = bot.takeDamage(this.playerDmg(proj.damage));
                    if (defeated) {
                        this.stateManager.addCoins(bot.coinReward);
                        this.bots.splice(j, 1);
                        if (proj.hitBots) proj.hitBots.delete(j);
                        if (proj.hitCooldowns) proj.hitCooldowns.delete(j);
                    }
                    // Fire Ball stops on hit; Tornado, Controlled Fire Ball, and Plasma Laser pass through
                    if (proj.type === 'FIRE_BALL') {
                        proj.active = false;
                    }
                    // Frostbite stops on first hit and slows the bot for 3 seconds
                    if (proj.type === 'FROSTBITE') {
                        bot.slow(3000, 0.3);
                        proj.active = false;
                    }
                    // Magma Rock stops on hit and spawns a magma puddle
                    if (proj.type === 'MAGMA_ROCK') {
                        this.magmaPuddles.push({
                            x: bot.x + bot.width / 2,
                            y: bot.y + bot.height,
                            radius: 55,
                            duration: 10,
                            elapsed: 0,
                            burnTimer: 0
                        });
                        proj.active = false;
                    }
                }
            }
        }
        
        // Update magma puddles
        for (let i = this.magmaPuddles.length - 1; i >= 0; i--) {
            const puddle = this.magmaPuddles[i];
            puddle.elapsed += deltaTime;
            if (puddle.elapsed >= puddle.duration) {
                this.magmaPuddles.splice(i, 1);
                continue;
            }
            // Apply burn to bots standing in the puddle every 1 second
            puddle.burnTimer = (puddle.burnTimer || 0) + deltaTime;
            if (puddle.burnTimer >= 1.0) {
                puddle.burnTimer -= 1.0;
                for (let j = this.bots.length - 1; j >= 0; j--) {
                    const bot = this.bots[j];
                    const bx = bot.x + bot.width / 2;
                    const by = bot.y + bot.height;
                    const dx = bx - puddle.x;
                    const dy = by - puddle.y;
                    if (Math.sqrt(dx*dx + dy*dy) <= puddle.radius) {
                        // Frostbite + Burn reaction: lose half HP, cancel both effects
                        if (bot.slowed) {
                            bot.hp = Math.max(1, Math.floor(bot.hp / 2));
                            bot.slowed = false;
                            bot.burning = false;
                            // Steam burst visual
                            bot.steamEffect = { elapsed: 0, duration: 0.6 };
                        } else {
                            // Apply burn status (5s)
                            bot.burning = true;
                            bot.burnEndTime = Date.now() + 5000;
                            bot.burnTickTimer = 0;
                        }
                    }
                }
            }
        }

        // Update bot burn damage (1 dmg/sec for 5 seconds)
        for (let i = this.bots.length - 1; i >= 0; i--) {
            const bot = this.bots[i];
            if (bot.burning) {
                if (Date.now() >= bot.burnEndTime) {
                    bot.burning = false;
                } else {
                    bot.burnTickTimer = (bot.burnTickTimer || 0) + deltaTime;
                    if (bot.burnTickTimer >= 1.0) {
                        bot.burnTickTimer -= 1.0;
                        const defeated = bot.takeDamage(8);
                        if (defeated) {
                            this.stateManager.addCoins(bot.coinReward);
                            this.bots.splice(i, 1);
                        }
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
     * Apply player damage multiplier
     */
    playerDmg(base) {
        return Math.floor(base * (this.player ? this.player.damageMultiplier || 1.0 : 1.0));
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
        if (this.islandTheme === 2) {
            // Half-frozen half-volcanic: stormy grey-purple
            gradient.addColorStop(0, '#2d1b4e');
            gradient.addColorStop(0.5, '#4a2060');
            gradient.addColorStop(1, '#1a0a0a');
        } else if (this.islandTheme === 3) {
            // Tropical beach: warm blue sky
            gradient.addColorStop(0, '#0288D1');
            gradient.addColorStop(0.6, '#29B6F6');
            gradient.addColorStop(1, '#B3E5FC');
        } else if (this.islandTheme === 4) {
            // Futuristic night city
            gradient.addColorStop(0, '#000005');
            gradient.addColorStop(0.6, '#0a0a1a');
            gradient.addColorStop(1, '#0d1b2a');
        } else {
            // Island 1: grassy ruins — bright day sky
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F6FF');
        }
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
        
        // Render magma puddles (under bots)
        for (const puddle of this.magmaPuddles) {
            this.renderMagmaPuddle(puddle);
        }

        // Render bots
        for (const bot of this.bots) {
            bot.render(this.ctx);
            // Black Flash hit effect
            if (bot.blackFlashEffect) {
                this.renderBlackFlashHit(bot);
            }
            // Steam burst (frostbite + burn reaction)
            if (bot.steamEffect) {
                bot.steamEffect.elapsed += (1/60);
                const sp = bot.steamEffect.elapsed / bot.steamEffect.duration;
                if (sp >= 1) {
                    bot.steamEffect = null;
                } else {
                    const sa = 1 - sp;
                    const cx = bot.x + bot.width / 2;
                    const cy = bot.y + bot.height / 2;
                    const sr = 40 * sp;
                    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
                    grad.addColorStop(0, `rgba(255,255,255,${sa * 0.9})`);
                    grad.addColorStop(0.5, `rgba(200,230,255,${sa * 0.6})`);
                    grad.addColorStop(1, `rgba(150,200,255,0)`);
                    this.ctx.fillStyle = grad;
                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, sr, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = `rgba(255,255,255,${sa * 0.7})`;
                    this.ctx.font = `bold 28px Courier New`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('COMBO!', cx, cy - sr - 4);
                }
            }
        }
        
        // Render projectiles
        for (const proj of this.projectiles) {
            proj.render(this.ctx);
        }

        // Render thunder effect
        if (this.thunderEffect) {
            this.renderThunder(this.thunderEffect);
        }

        // Render reactor explosion effect
        if (this.reactorExplosionEffect) {
            this.renderReactorExplosion(this.reactorExplosionEffect);
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
            'SLOW_MOTION': 'SlowMo',
            'PLASMA_LASER': 'Plasma',
            'BOMB': 'Bomb',
            'BLACK_FLASH': 'B.Flash',
            'FROSTBITE': 'Frost',
            'MAGMA_ROCK': 'Magma',
            'THRUSTER_HANDS': 'Thrust',
            'REACTOR_EXPLOSION': 'Reactor',
            'JUMP_BOOTS': 'J.Boot',
            'IRON_GLOVES': 'I.Glove'
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
            'SLOW_MOTION': '#AAAACC',
            'PLASMA_LASER': '#00FFEE',
            'BOMB': '#888800',
            'BLACK_FLASH': '#330000',
            'FROSTBITE': '#00AAFF',
            'MAGMA_ROCK': '#FF4400',
            'THRUSTER_HANDS': '#FF6D00',
            'REACTOR_EXPLOSION': '#00FFAA',
            'JUMP_BOOTS': '#FFDD00',
            'IRON_GLOVES': '#99BBCC'
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
     * Renders a magma puddle on the ground
     */
    renderMagmaPuddle(puddle) {
        const ctx = this.ctx;
        const remaining = 1 - puddle.elapsed / puddle.duration;
        const alpha = Math.min(1, remaining * 3); // fade out last third
        const t = puddle.elapsed;
        const r = puddle.radius;

        ctx.save();

        // Outer dark crust
        ctx.fillStyle = `rgba(80, 20, 0, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(puddle.x, puddle.y, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing lava core
        const lavaGrad = ctx.createRadialGradient(puddle.x, puddle.y, 0, puddle.x, puddle.y, r * 0.75);
        lavaGrad.addColorStop(0, `rgba(255, 240, 50, ${alpha * 0.95})`);
        lavaGrad.addColorStop(0.3, `rgba(255, 120, 0, ${alpha * 0.9})`);
        lavaGrad.addColorStop(0.7, `rgba(200, 40, 0, ${alpha * 0.7})`);
        lavaGrad.addColorStop(1, `rgba(80, 10, 0, 0)`);
        ctx.fillStyle = lavaGrad;
        ctx.beginPath();
        ctx.ellipse(puddle.x, puddle.y, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bubbling blobs
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + t * 1.5;
            const dist = r * 0.4 * (0.5 + Math.sin(t * 3 + i) * 0.3);
            const bx = puddle.x + Math.cos(angle) * dist;
            const by = puddle.y + Math.sin(angle) * dist * 0.35;
            const br = 4 + Math.sin(t * 4 + i * 1.3) * 2;
            ctx.fillStyle = `rgba(255, ${100 + Math.floor(Math.sin(t*3+i)*60)}, 0, ${alpha * 0.9})`;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rising heat particles
        for (let i = 0; i < 3; i++) {
            const px = puddle.x + Math.sin(t * 2 + i * 2.1) * r * 0.4;
            const py = puddle.y - ((t * 30 + i * 20) % 40);
            const pa = alpha * (1 - ((t * 30 + i * 20) % 40) / 40) * 0.5;
            ctx.fillStyle = `rgba(255, 80, 0, ${pa})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Renders Black Flash hit effect around a bot
     */
    renderBlackFlashHit(bot) {
        const ctx = this.ctx;
        const fx = bot.blackFlashEffect;
        const progress = fx.elapsed / fx.duration;
        const alpha = 1 - progress;
        const cx = bot.x + bot.width / 2;
        const cy = bot.y + bot.height / 2;

        ctx.save();
        ctx.lineCap = 'butt';

        // Slashes radiating around the bot center in all directions
        const slashes = [
            { angle: -0.3,  len: 70, halfW: 7 },
            { angle:  0.15, len: 85, halfW: 6 },
            { angle:  0.55, len: 60, halfW: 5 },
            { angle: -0.75, len: 55, halfW: 5 },
            { angle:  0.9,  len: 75, halfW: 6 },
            { angle: -1.2,  len: 50, halfW: 4 },
            { angle:  1.4,  len: 65, halfW: 5 },
            { angle: -1.8,  len: 58, halfW: 5 },
            { angle:  2.2,  len: 72, halfW: 6 },
            { angle: -2.6,  len: 48, halfW: 4 },
            { angle:  2.9,  len: 80, halfW: 7 },
            { angle: -3.0,  len: 55, halfW: 5 },
        ];

        slashes.forEach(s => {
            const len = s.len * (0.4 + progress * 0.6); // grow outward
            const startX = cx - Math.cos(s.angle) * len * 0.2;
            const startY = cy - Math.sin(s.angle) * len * 0.2;
            const endX   = cx + Math.cos(s.angle) * len * 0.8;
            const endY   = cy + Math.sin(s.angle) * len * 0.8;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const perpAngle = s.angle + Math.PI / 2;
            const hw = s.halfW * (1 - progress * 0.5);

            const px = Math.cos(perpAngle) * hw;
            const py = Math.sin(perpAngle) * hw;

            const drawLozenge = (scale) => {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(midX + px * scale, midY + py * scale);
                ctx.lineTo(endX, endY);
                ctx.lineTo(midX - px * scale, midY - py * scale);
                ctx.closePath();
            };

            // Black outer
            drawLozenge(1);
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.95})`;
            ctx.fill();

            // Red mid
            drawLozenge(0.65);
            ctx.fillStyle = `rgba(210, 0, 0, ${alpha * 0.85})`;
            ctx.fill();

            // White core
            drawLozenge(0.25);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.fill();
        });

        // Red radial glow around bot
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * (0.5 + progress * 0.5));
        glow.addColorStop(0, `rgba(180, 0, 0, ${alpha * 0.35})`);
        glow.addColorStop(1, `rgba(0, 0, 0, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 60 * (0.5 + progress * 0.5), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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
     * Renders the reactor explosion visual effect
     */
    renderReactorExplosion(effect) {
        const ctx = this.ctx;
        const progress = effect.elapsed / effect.duration;
        const alpha = progress < 0.2 ? progress / 0.2 : 1 - ((progress - 0.2) / 0.8);
        const { x, y, radius } = effect;
        const expandedR = radius * (0.3 + progress * 0.7);

        ctx.save();

        // Outer shockwave ring
        ctx.strokeStyle = `rgba(0, 255, 170, ${alpha * 0.6})`;
        ctx.lineWidth = 6 * (1 - progress);
        ctx.beginPath();
        ctx.arc(x, y, expandedR, 0, Math.PI * 2);
        ctx.stroke();

        // Mid electric ring
        ctx.strokeStyle = `rgba(100, 220, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, expandedR * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Core radial gradient
        const grad = ctx.createRadialGradient(x, y, 0, x, y, expandedR);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
        grad.addColorStop(0.2, `rgba(0, 255, 170, ${alpha * 0.7})`);
        grad.addColorStop(0.6, `rgba(0, 100, 255, ${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(0, 0, 100, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, expandedR, 0, Math.PI * 2);
        ctx.fill();

        // Electric sparks radiating outward
        const sparkCount = 12;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2 + progress * 2;
            const len = expandedR * (0.5 + Math.sin(i * 3.7 + progress * 10) * 0.3);
            ctx.strokeStyle = `rgba(180, 255, 220, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * expandedR * 0.2, y + Math.sin(angle) * expandedR * 0.2);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }

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
            'SLOW_MOTION': 25.0,
            'PLASMA_LASER': 15.0,
            'BOMB': 12.0,
            'BLACK_FLASH': 8.0,
            'FROSTBITE': 10.0,
            'MAGMA_ROCK': 14.0,
            'THRUSTER_HANDS': 12.0,
            'REACTOR_EXPLOSION': 20.0,
            'JUMP_BOOTS': 30.0,
            'IRON_GLOVES': 30.0
        };
        return cooldowns[abilityType] || 1.0;
    }
    
    stop() {
        this.running = false;
        console.log('Game engine stopped');
    }
}
