/**
 * StateManager - Manages persistent game state using LocalStorage
 * Handles coins, owned abilities, and key bindings with error handling
 */

export class StateManager {
    constructor() {
        // LocalStorage keys
        this.STORAGE_KEYS = {
            COINS: 'island_fighting_coins',
            ABILITIES: 'island_fighting_abilities',
            BINDINGS: 'island_fighting_bindings',
            HP_UPGRADES: 'island_fighting_hp_upgrades'
        };
        
        // Default values
        this.DEFAULT_COINS = 0;
        this.DEFAULT_ABILITIES = [];
        this.DEFAULT_BINDINGS = {
            z: null,
            x: null,
            c: null,
            v: null
        };
        this.DEFAULT_HP_UPGRADES = 0;
        
        // Load state from LocalStorage
        this.coins = this.loadCoins();
        this.ownedAbilities = this.loadOwnedAbilities();
        this.keyBindings = this.loadKeyBindings();
        this.hpUpgrades = this.loadHPUpgrades();
        
        console.log('StateManager initialized:', {
            coins: this.coins,
            ownedAbilities: this.ownedAbilities,
            keyBindings: this.keyBindings,
            hpUpgrades: this.hpUpgrades
        });
    }
    
    // ===== Coin Balance Methods =====
    
    /**
     * Load coin balance from LocalStorage
     * @returns {number} Coin balance (defaults to 0 if invalid)
     */
    loadCoins() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.COINS);
            
            if (stored === null) {
                return this.DEFAULT_COINS;
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate: must be a non-negative number
            if (typeof parsed === 'number' && parsed >= 0 && !isNaN(parsed)) {
                return parsed;
            }
            
            console.warn('Invalid coin balance in storage, using default:', parsed);
            return this.DEFAULT_COINS;
            
        } catch (error) {
            console.error('Error loading coins from LocalStorage:', error);
            return this.DEFAULT_COINS;
        }
    }
    
    /**
     * Save coin balance to LocalStorage
     */
    saveCoins() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.COINS, JSON.stringify(this.coins));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded, cannot save coins');
            } else if (error.name === 'SecurityError') {
                console.error('LocalStorage access denied (private browsing?), cannot save coins');
            } else {
                console.error('Error saving coins to LocalStorage:', error);
            }
        }
    }
    
    /**
     * Add coins to the player's balance
     * @param {number} amount - Amount of coins to add (must be positive)
     */
    addCoins(amount) {
        if (typeof amount !== 'number' || amount < 0 || isNaN(amount)) {
            console.error('Invalid coin amount to add:', amount);
            return;
        }
        
        this.coins += amount;
        this.saveCoins();
    }
    
    /**
     * Spend coins from the player's balance
     * @param {number} amount - Amount of coins to spend
     * @returns {boolean} True if successful, false if insufficient coins
     */
    spendCoins(amount) {
        if (typeof amount !== 'number' || amount < 0 || isNaN(amount)) {
            console.error('Invalid coin amount to spend:', amount);
            return false;
        }
        
        if (this.coins < amount) {
            return false;
        }
        
        this.coins -= amount;
        this.saveCoins();
        return true;
    }
    
    /**
     * Get current coin balance
     * @returns {number} Current coin balance
     */
    getCoins() {
        return this.coins;
    }
    
    // ===== Owned Abilities Methods =====
    
    /**
     * Load owned abilities from LocalStorage
     * @returns {Array<string>} Array of owned ability type strings
     */
    loadOwnedAbilities() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.ABILITIES);
            
            if (stored === null) {
                return [...this.DEFAULT_ABILITIES];
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate: must be an array
            if (!Array.isArray(parsed)) {
                console.warn('Invalid abilities format in storage, using default:', parsed);
                return [...this.DEFAULT_ABILITIES];
            }
            
            // Filter out invalid ability types (must be strings)
            const validAbilities = parsed.filter(ability => typeof ability === 'string');
            
            if (validAbilities.length !== parsed.length) {
                console.warn('Some invalid abilities filtered out:', parsed);
            }
            
            return validAbilities;
            
        } catch (error) {
            console.error('Error loading abilities from LocalStorage:', error);
            return [...this.DEFAULT_ABILITIES];
        }
    }
    
    /**
     * Save owned abilities to LocalStorage
     */
    saveOwnedAbilities() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.ABILITIES, JSON.stringify(this.ownedAbilities));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded, cannot save abilities');
            } else if (error.name === 'SecurityError') {
                console.error('LocalStorage access denied (private browsing?), cannot save abilities');
            } else {
                console.error('Error saving abilities to LocalStorage:', error);
            }
        }
    }
    
    /**
     * Add an ability to owned abilities
     * @param {string} abilityType - The ability type to add
     * @returns {boolean} True if added, false if already owned
     */
    addAbility(abilityType) {
        if (typeof abilityType !== 'string') {
            console.error('Invalid ability type:', abilityType);
            return false;
        }
        
        if (this.ownedAbilities.includes(abilityType)) {
            return false; // Already owned
        }
        
        this.ownedAbilities.push(abilityType);
        this.saveOwnedAbilities();
        return true;
    }
    
    /**
     * Check if an ability is owned
     * @param {string} abilityType - The ability type to check
     * @returns {boolean} True if owned
     */
    hasAbility(abilityType) {
        return this.ownedAbilities.includes(abilityType);
    }
    
    /**
     * Get all owned abilities
     * @returns {Array<string>} Array of owned ability types
     */
    getOwnedAbilities() {
        return [...this.ownedAbilities];
    }
    
    // ===== Key Bindings Methods =====
    
    /**
     * Load key bindings from LocalStorage
     * @returns {Object} Key bindings object {z, x, c, v}
     */
    loadKeyBindings() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.BINDINGS);
            
            if (stored === null) {
                return { ...this.DEFAULT_BINDINGS };
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate: must be an object
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                console.warn('Invalid bindings format in storage, using default:', parsed);
                return { ...this.DEFAULT_BINDINGS };
            }
            
            // Validate keys and values
            const validKeys = ['z', 'x', 'c', 'v'];
            const validatedBindings = { ...this.DEFAULT_BINDINGS };
            
            for (const key of validKeys) {
                if (key in parsed) {
                    const value = parsed[key];
                    // Value must be null or a string
                    if (value === null || typeof value === 'string') {
                        validatedBindings[key] = value;
                    } else {
                        console.warn(`Invalid binding value for key ${key}:`, value);
                    }
                }
            }
            
            return validatedBindings;
            
        } catch (error) {
            console.error('Error loading key bindings from LocalStorage:', error);
            return { ...this.DEFAULT_BINDINGS };
        }
    }
    
    /**
     * Save key bindings to LocalStorage
     */
    saveKeyBindings() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.BINDINGS, JSON.stringify(this.keyBindings));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded, cannot save key bindings');
            } else if (error.name === 'SecurityError') {
                console.error('LocalStorage access denied (private browsing?), cannot save key bindings');
            } else {
                console.error('Error saving key bindings to LocalStorage:', error);
            }
        }
    }
    
    /**
     * Assign an ability to a key slot
     * @param {string} key - The key slot (z, x, c, or v)
     * @param {string|null} abilityType - The ability type to assign, or null to clear
     * @returns {boolean} True if successful
     */
    assignAbility(key, abilityType) {
        const validKeys = ['z', 'x', 'c', 'v'];
        
        if (!validKeys.includes(key)) {
            console.error('Invalid key for ability assignment:', key);
            return false;
        }
        
        if (abilityType !== null && typeof abilityType !== 'string') {
            console.error('Invalid ability type for assignment:', abilityType);
            return false;
        }
        
        this.keyBindings[key] = abilityType;
        this.saveKeyBindings();
        return true;
    }
    
    /**
     * Get the ability assigned to a key
     * @param {string} key - The key slot (z, x, c, or v)
     * @returns {string|null} The assigned ability type, or null if none
     */
    getBinding(key) {
        return this.keyBindings[key] || null;
    }
    
    /**
     * Get all key bindings
     * @returns {Object} Copy of key bindings object
     */
    getKeyBindings() {
        return { ...this.keyBindings };
    }
    
    /**
     * Purchase an ability (combines coin spending and ability adding)
     * @param {string} abilityType - The ability type to purchase
     * @param {number} cost - The cost of the ability
     * @returns {boolean} True if purchase successful
     */
    purchaseAbility(abilityType, cost) {
        // Check if already owned
        if (this.hasAbility(abilityType)) {
            console.warn('Ability already owned:', abilityType);
            return false;
        }
        
        // Check if sufficient coins
        if (!this.spendCoins(cost)) {
            console.warn('Insufficient coins to purchase ability:', abilityType);
            return false;
        }
        
        // Add ability
        if (!this.addAbility(abilityType)) {
            // Refund coins if ability add failed
            this.addCoins(cost);
            console.error('Failed to add ability after spending coins:', abilityType);
            return false;
        }

        // Auto-assign to first free slot (z → x → c → v)
        const slots = ['z', 'x', 'c', 'v'];
        for (const slot of slots) {
            if (!this.keyBindings[slot]) {
                this.assignAbility(slot, abilityType);
                console.log(`Auto-assigned ${abilityType} to slot ${slot.toUpperCase()}`);
                break;
            }
        }
        
        return true;
    }
    
    // ===== HP Upgrades Methods =====
    
    /**
     * Load HP upgrades count from LocalStorage
     * @returns {number} Number of HP upgrades purchased
     */
    loadHPUpgrades() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.HP_UPGRADES);
            
            if (stored === null) {
                return this.DEFAULT_HP_UPGRADES;
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate: must be a non-negative integer
            if (typeof parsed === 'number' && parsed >= 0 && Number.isInteger(parsed)) {
                return parsed;
            }
            
            console.warn('Invalid HP upgrades in storage, using default:', parsed);
            return this.DEFAULT_HP_UPGRADES;
            
        } catch (error) {
            console.error('Error loading HP upgrades from LocalStorage:', error);
            return this.DEFAULT_HP_UPGRADES;
        }
    }
    
    /**
     * Save HP upgrades to LocalStorage
     */
    saveHPUpgrades() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.HP_UPGRADES, JSON.stringify(this.hpUpgrades));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded, cannot save HP upgrades');
            } else if (error.name === 'SecurityError') {
                console.error('LocalStorage access denied (private browsing?), cannot save HP upgrades');
            } else {
                console.error('Error saving HP upgrades to LocalStorage:', error);
            }
        }
    }
    
    /**
     * Purchase an HP upgrade
     * @param {number} cost - The cost of the upgrade
     * @returns {boolean} True if purchase successful
     */
    purchaseHPUpgrade(cost) {
        // Check if sufficient coins
        if (!this.spendCoins(cost)) {
            console.warn('Insufficient coins to purchase HP upgrade');
            return false;
        }
        
        this.hpUpgrades++;
        this.saveHPUpgrades();
        return true;
    }
    
    /**
     * Reset all game progress
     */
    resetAll() {
        this.coins = this.DEFAULT_COINS;
        this.ownedAbilities = [...this.DEFAULT_ABILITIES];
        this.keyBindings = { ...this.DEFAULT_BINDINGS };
        this.hpUpgrades = this.DEFAULT_HP_UPGRADES;
        
        try {
            localStorage.removeItem(this.STORAGE_KEYS.COINS);
            localStorage.removeItem(this.STORAGE_KEYS.ABILITIES);
            localStorage.removeItem(this.STORAGE_KEYS.BINDINGS);
            localStorage.removeItem(this.STORAGE_KEYS.HP_UPGRADES);
        } catch (error) {
            console.error('Error clearing LocalStorage:', error);
        }
        
        console.log('All progress reset');
    }
    
    /**
     * Calculate HP upgrade cost based on current upgrades
     * @returns {number} Cost for next upgrade (increases with each purchase)
     */
    getHPUpgradeCost() {
        // Cost increases: 50, 75, 100, 125, 150, etc. (+25 each time)
        return 50 + (this.hpUpgrades * 25);
    }
    
    /**
     * Get number of HP upgrades purchased
     * @returns {number} Number of HP upgrades
     */
    getHPUpgrades() {
        return this.hpUpgrades;
    }
    
    /**
     * Calculate max HP based on upgrades
     * @returns {number} Max HP (100 base + 10 per upgrade)
     */
    getMaxHP() {
        return 100 + (this.hpUpgrades * 10);
    }
}
