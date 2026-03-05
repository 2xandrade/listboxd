/**
 * KeyboardShortcuts Component
 * Manages keyboard shortcuts throughout the application
 * Supports key combinations with modifiers (Ctrl, Shift, Alt)
 * Requirements: 12.3
 */
class KeyboardShortcuts {
    /**
     * Create a KeyboardShortcuts instance
     */
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }
    
    /**
     * Initialize keyboard event listener
     */
    init() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    /**
     * Register a keyboard shortcut
     * @param {string} key - Key to listen for (e.g., 'escape', '/', 'k')
     * @param {Function} callback - Callback function to execute
     * @param {Object} options - Options object
     * @param {boolean} options.ctrl - Require Ctrl/Cmd key
     * @param {boolean} options.shift - Require Shift key
     * @param {boolean} options.alt - Require Alt key
     * @param {string} options.description - Description of the shortcut
     * @param {boolean} options.preventDefault - Whether to prevent default behavior (default: true)
     * Requirements: 12.3
     */
    register(key, callback, options = {}) {
        if (!key || typeof key !== 'string') {
            console.error('KeyboardShortcuts: Key must be a non-empty string');
            return;
        }
        
        if (typeof callback !== 'function') {
            console.error('KeyboardShortcuts: Callback must be a function');
            return;
        }
        
        const shortcutKey = this.createShortcutKey(key, options);
        
        this.shortcuts.set(shortcutKey, {
            callback,
            description: options.description || '',
            preventDefault: options.preventDefault !== false
        });
    }
    
    /**
     * Unregister a keyboard shortcut
     * @param {string} key - Key to unregister
     * @param {Object} options - Options object (same as register)
     */
    unregister(key, options = {}) {
        const shortcutKey = this.createShortcutKey(key, options);
        this.shortcuts.delete(shortcutKey);
    }
    
    /**
     * Create a unique shortcut key string from key and modifiers
     * @param {string} key - Key name
     * @param {Object} options - Options with modifier flags
     * @returns {string} Shortcut key string
     */
    createShortcutKey(key, options) {
        const parts = [];
        if (options.ctrl) parts.push('ctrl');
        if (options.shift) parts.push('shift');
        if (options.alt) parts.push('alt');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }
    
    /**
     * Handle keypress events
     * @param {KeyboardEvent} e - Keyboard event
     * Requirements: 12.3
     */
    handleKeyPress(e) {
        if (!this.enabled) {
            return;
        }
        
        // Don't trigger shortcuts when typing in input fields (except for specific keys like Escape)
        const isInputField = e.target.tagName === 'INPUT' || 
                            e.target.tagName === 'TEXTAREA' || 
                            e.target.isContentEditable;
        
        const key = e.key.toLowerCase();
        
        // Allow Escape key even in input fields
        if (isInputField && key !== 'escape') {
            return;
        }
        
        // Create shortcut key from current event
        const shortcutKey = this.createShortcutKey(key, {
            ctrl: e.ctrlKey || e.metaKey, // Support both Ctrl and Cmd (Mac)
            shift: e.shiftKey,
            alt: e.altKey
        });
        
        const shortcut = this.shortcuts.get(shortcutKey);
        
        if (shortcut) {
            if (shortcut.preventDefault) {
                e.preventDefault();
            }
            
            try {
                shortcut.callback(e);
            } catch (error) {
                console.error('Error executing keyboard shortcut:', error.message);
            }
        }
    }
    
    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.enabled = false;
    }
    
    /**
     * Check if shortcuts are enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Get all registered shortcuts
     * @returns {Array} Array of shortcut objects with key and description
     */
    getShortcuts() {
        const shortcuts = [];
        
        this.shortcuts.forEach((value, key) => {
            shortcuts.push({
                key: key,
                description: value.description
            });
        });
        
        return shortcuts;
    }
    
    /**
     * Clear all registered shortcuts
     */
    clearAll() {
        this.shortcuts.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardShortcuts;
}
