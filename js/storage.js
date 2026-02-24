/**
 * StorageManager - Abstraction layer for localStorage operations
 * Handles serialization/deserialization and provides a clean interface
 * for data persistence operations.
 */
class StorageManager {
  /**
   * Save data to localStorage with automatic serialization
   * @param {string} key - Storage key
   * @param {any} data - Data to store (will be serialized to JSON)
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving data to localStorage for key "${key}":`, error);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  /**
   * Load data from localStorage with automatic deserialization
   * @param {string} key - Storage key
   * @returns {any} Deserialized data or null if not found
   */
  load(key) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized);
    } catch (error) {
      console.error(`Error loading data from localStorage for key "${key}":`, error);
      throw new Error(`Failed to load data: ${error.message}`);
    }
  }

  /**
   * Remove a specific item from localStorage
   * @param {string} key - Storage key to remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data from localStorage for key "${key}":`, error);
      throw new Error(`Failed to remove data: ${error.message}`);
    }
  }

  /**
   * Clear all data from localStorage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw new Error(`Failed to clear storage: ${error.message}`);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
