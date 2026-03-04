/**
 * Tests for KeyboardShortcuts component
 * Requirements: 12.3
 */

const KeyboardShortcuts = require('./keyboard.js');

describe('KeyboardShortcuts', () => {
  let keyboardShortcuts;

  beforeEach(() => {
    keyboardShortcuts = new KeyboardShortcuts();
  });

  afterEach(() => {
    keyboardShortcuts.clearAll();
  });

  describe('register', () => {
    test('should register a simple keyboard shortcut', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      expect(shortcuts.length).toBe(1);
      expect(shortcuts[0].key).toBe('k');
    });

    test('should register shortcut with Ctrl modifier', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { ctrl: true });
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      expect(shortcuts[0].key).toBe('ctrl+k');
    });

    test('should register shortcut with Shift modifier', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { shift: true });
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      expect(shortcuts[0].key).toBe('shift+k');
    });

    test('should register shortcut with Alt modifier', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { alt: true });
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      expect(shortcuts[0].key).toBe('alt+k');
    });

    test('should register shortcut with multiple modifiers', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { ctrl: true, shift: true });
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      expect(shortcuts[0].key).toBe('ctrl+shift+k');
    });

    test('should register shortcut with description', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('/', callback, { description: 'Focus search' });
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      expect(shortcuts[0].description).toBe('Focus search');
    });

    test('should handle invalid key gracefully', () => {
      const callback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      keyboardShortcuts.register('', callback);
      keyboardShortcuts.register(null, callback);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });

    test('should handle invalid callback gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      keyboardShortcuts.register('k', 'not a function');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('handleKeyPress', () => {
    test('should trigger callback for registered key', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalledWith(event);
    });

    test('should trigger callback for Escape key', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('escape', callback);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should trigger callback with Ctrl modifier', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { ctrl: true });
      
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should trigger callback with Cmd modifier (Mac)', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { ctrl: true });
      
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should trigger callback with Shift modifier', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { shift: true });
      
      const event = new KeyboardEvent('keydown', { key: 'k', shiftKey: true });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should trigger callback with Alt modifier', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { alt: true });
      
      const event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should not trigger callback without required modifiers', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { ctrl: true });
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should prevent default behavior by default', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('/', callback);
      
      const event = new KeyboardEvent('keydown', { key: '/' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should not prevent default when preventDefault is false', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { preventDefault: false });
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    test('should not trigger shortcuts in input fields', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      
      const input = document.createElement('input');
      document.body.appendChild(input);
      
      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
      
      document.body.removeChild(input);
    });

    test('should not trigger shortcuts in textarea fields', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      
      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
      
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
      
      document.body.removeChild(textarea);
    });

    test('should trigger Escape even in input fields', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('escape', callback);
      
      const input = document.createElement('input');
      document.body.appendChild(input);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
      
      document.body.removeChild(input);
    });

    test('should handle callback errors gracefully', () => {
      const callback = jest.fn(() => {
        throw new Error('Test error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      keyboardShortcuts.register('k', callback);
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should be case insensitive', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('K', callback);
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    test('should unregister a shortcut', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      
      expect(keyboardShortcuts.getShortcuts().length).toBe(1);
      
      keyboardShortcuts.unregister('k');
      
      expect(keyboardShortcuts.getShortcuts().length).toBe(0);
    });

    test('should unregister shortcut with modifiers', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback, { ctrl: true });
      
      keyboardShortcuts.unregister('k', { ctrl: true });
      
      expect(keyboardShortcuts.getShortcuts().length).toBe(0);
    });

    test('should not trigger callback after unregistering', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      keyboardShortcuts.unregister('k');
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('enable/disable', () => {
    test('should be enabled by default', () => {
      expect(keyboardShortcuts.isEnabled()).toBe(true);
    });

    test('should disable shortcuts', () => {
      keyboardShortcuts.disable();
      
      expect(keyboardShortcuts.isEnabled()).toBe(false);
    });

    test('should enable shortcuts', () => {
      keyboardShortcuts.disable();
      keyboardShortcuts.enable();
      
      expect(keyboardShortcuts.isEnabled()).toBe(true);
    });

    test('should not trigger callbacks when disabled', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      keyboardShortcuts.disable();
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should trigger callbacks after re-enabling', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      keyboardShortcuts.disable();
      keyboardShortcuts.enable();
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('getShortcuts', () => {
    test('should return empty array when no shortcuts registered', () => {
      const shortcuts = keyboardShortcuts.getShortcuts();
      
      expect(shortcuts).toEqual([]);
    });

    test('should return all registered shortcuts', () => {
      keyboardShortcuts.register('k', jest.fn(), { description: 'Search' });
      keyboardShortcuts.register('escape', jest.fn(), { description: 'Close' });
      
      const shortcuts = keyboardShortcuts.getShortcuts();
      
      expect(shortcuts.length).toBe(2);
      expect(shortcuts.some(s => s.key === 'k')).toBe(true);
      expect(shortcuts.some(s => s.key === 'escape')).toBe(true);
    });
  });

  describe('clearAll', () => {
    test('should clear all shortcuts', () => {
      keyboardShortcuts.register('k', jest.fn());
      keyboardShortcuts.register('/', jest.fn());
      keyboardShortcuts.register('escape', jest.fn());
      
      expect(keyboardShortcuts.getShortcuts().length).toBe(3);
      
      keyboardShortcuts.clearAll();
      
      expect(keyboardShortcuts.getShortcuts().length).toBe(0);
    });

    test('should not trigger callbacks after clearing', () => {
      const callback = jest.fn();
      keyboardShortcuts.register('k', callback);
      keyboardShortcuts.clearAll();
      
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createShortcutKey', () => {
    test('should create key without modifiers', () => {
      const key = keyboardShortcuts.createShortcutKey('k', {});
      expect(key).toBe('k');
    });

    test('should create key with ctrl modifier', () => {
      const key = keyboardShortcuts.createShortcutKey('k', { ctrl: true });
      expect(key).toBe('ctrl+k');
    });

    test('should create key with shift modifier', () => {
      const key = keyboardShortcuts.createShortcutKey('k', { shift: true });
      expect(key).toBe('shift+k');
    });

    test('should create key with alt modifier', () => {
      const key = keyboardShortcuts.createShortcutKey('k', { alt: true });
      expect(key).toBe('alt+k');
    });

    test('should create key with all modifiers in correct order', () => {
      const key = keyboardShortcuts.createShortcutKey('k', { 
        ctrl: true, 
        shift: true, 
        alt: true 
      });
      expect(key).toBe('ctrl+shift+alt+k');
    });

    test('should convert key to lowercase', () => {
      const key = keyboardShortcuts.createShortcutKey('K', {});
      expect(key).toBe('k');
    });
  });
});
