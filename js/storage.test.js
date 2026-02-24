/**
 * Unit tests for StorageManager
 * Tests basic CRUD operations and complex object serialization
 * Requirements: 7.5
 */

const StorageManager = require('./storage.js');

describe('StorageManager', () => {
  let storageManager;

  beforeEach(() => {
    // Create a fresh instance before each test
    storageManager = new StorageManager();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('CRUD Operations', () => {
    describe('save()', () => {
      it('should save a string value to localStorage', () => {
        const key = 'testKey';
        const value = 'testValue';
        
        storageManager.save(key, value);
        
        const stored = localStorage.getItem(key);
        expect(stored).toBe(JSON.stringify(value));
      });

      it('should save a number value to localStorage', () => {
        const key = 'numberKey';
        const value = 42;
        
        storageManager.save(key, value);
        
        const stored = localStorage.getItem(key);
        expect(stored).toBe(JSON.stringify(value));
      });

      it('should save a boolean value to localStorage', () => {
        const key = 'boolKey';
        const value = true;
        
        storageManager.save(key, value);
        
        const stored = localStorage.getItem(key);
        expect(stored).toBe(JSON.stringify(value));
      });

      it('should overwrite existing value when saving with same key', () => {
        const key = 'overwriteKey';
        
        storageManager.save(key, 'first');
        storageManager.save(key, 'second');
        
        const result = storageManager.load(key);
        expect(result).toBe('second');
      });
    });

    describe('load()', () => {
      it('should load and deserialize a saved value', () => {
        const key = 'loadKey';
        const value = 'loadValue';
        
        storageManager.save(key, value);
        const loaded = storageManager.load(key);
        
        expect(loaded).toBe(value);
      });

      it('should return null for non-existent key', () => {
        const result = storageManager.load('nonExistentKey');
        expect(result).toBeNull();
      });

      it('should load number values correctly', () => {
        const key = 'numKey';
        const value = 123;
        
        storageManager.save(key, value);
        const loaded = storageManager.load(key);
        
        expect(loaded).toBe(value);
        expect(typeof loaded).toBe('number');
      });

      it('should load boolean values correctly', () => {
        const key = 'boolKey';
        const value = false;
        
        storageManager.save(key, value);
        const loaded = storageManager.load(key);
        
        expect(loaded).toBe(value);
        expect(typeof loaded).toBe('boolean');
      });
    });

    describe('remove()', () => {
      it('should remove an existing item from localStorage', () => {
        const key = 'removeKey';
        const value = 'removeValue';
        
        storageManager.save(key, value);
        expect(storageManager.load(key)).toBe(value);
        
        storageManager.remove(key);
        expect(storageManager.load(key)).toBeNull();
      });

      it('should not throw error when removing non-existent key', () => {
        expect(() => {
          storageManager.remove('nonExistentKey');
        }).not.toThrow();
      });

      it('should only remove the specified key', () => {
        storageManager.save('key1', 'value1');
        storageManager.save('key2', 'value2');
        
        storageManager.remove('key1');
        
        expect(storageManager.load('key1')).toBeNull();
        expect(storageManager.load('key2')).toBe('value2');
      });
    });

    describe('clear()', () => {
      it('should remove all items from localStorage', () => {
        storageManager.save('key1', 'value1');
        storageManager.save('key2', 'value2');
        storageManager.save('key3', 'value3');
        
        storageManager.clear();
        
        expect(storageManager.load('key1')).toBeNull();
        expect(storageManager.load('key2')).toBeNull();
        expect(storageManager.load('key3')).toBeNull();
      });

      it('should work on empty localStorage', () => {
        expect(() => {
          storageManager.clear();
        }).not.toThrow();
      });
    });
  });

  describe('Complex Object Serialization', () => {
    it('should serialize and deserialize a simple object', () => {
      const key = 'objectKey';
      const value = { name: 'John', age: 30 };
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
    });

    it('should serialize and deserialize nested objects', () => {
      const key = 'nestedKey';
      const value = {
        user: {
          name: 'Jane',
          profile: {
            age: 25,
            city: 'New York'
          }
        }
      };
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
      expect(loaded.user.profile.city).toBe('New York');
    });

    it('should serialize and deserialize arrays', () => {
      const key = 'arrayKey';
      const value = [1, 2, 3, 4, 5];
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
      expect(Array.isArray(loaded)).toBe(true);
    });

    it('should serialize and deserialize arrays of objects', () => {
      const key = 'arrayOfObjectsKey';
      const value = [
        { id: 1, name: 'Film 1' },
        { id: 2, name: 'Film 2' },
        { id: 3, name: 'Film 3' }
      ];
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
      expect(loaded.length).toBe(3);
      expect(loaded[1].name).toBe('Film 2');
    });

    it('should serialize and deserialize objects with mixed types', () => {
      const key = 'mixedKey';
      const value = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { key: 'value' }
      };
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
      expect(loaded.string).toBe('text');
      expect(loaded.number).toBe(42);
      expect(loaded.boolean).toBe(true);
      expect(loaded.null).toBeNull();
      expect(loaded.array).toEqual([1, 2, 3]);
      expect(loaded.nested.key).toBe('value');
    });

    it('should handle empty objects', () => {
      const key = 'emptyObjectKey';
      const value = {};
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
    });

    it('should handle empty arrays', () => {
      const key = 'emptyArrayKey';
      const value = [];
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(loaded).toEqual(value);
      expect(Array.isArray(loaded)).toBe(true);
    });

    it('should preserve data types after round-trip serialization', () => {
      const key = 'typePreservationKey';
      const value = {
        id: 123,
        active: true,
        name: 'Test',
        tags: ['tag1', 'tag2'],
        metadata: { created: 1234567890 }
      };
      
      storageManager.save(key, value);
      const loaded = storageManager.load(key);
      
      expect(typeof loaded.id).toBe('number');
      expect(typeof loaded.active).toBe('boolean');
      expect(typeof loaded.name).toBe('string');
      expect(Array.isArray(loaded.tags)).toBe(true);
      expect(typeof loaded.metadata).toBe('object');
    });
  });
});
