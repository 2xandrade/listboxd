/**
 * Property-based tests for CacheManager
 * Uses fast-check for property-based testing
 * Requirements: 3.1, 3.6, 3.7
 */

const fc = require('fast-check');
const CacheManager = require('./cache-manager.js');
const StorageManager = require('./storage.js');

describe('CacheManager - Property-Based Tests', () => {
  
  // Mock localStorage for testing
  let storageKeyCounter = 0;
  
  beforeEach(() => {
    // Reset counter for each test
    storageKeyCounter = 0;
    
    // Clear any global mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // Helper to create isolated storage manager with unique in-memory storage
  function createIsolatedStorage() {
    const uniqueId = ++storageKeyCounter;
    // Each storage instance gets its own completely isolated storage object
    const isolatedStorage = {};
    
    // Create a storage manager that uses its own isolated storage
    return {
      save: (key, data) => {
        isolatedStorage[key] = JSON.stringify(data);
      },
      load: (key) => {
        const item = isolatedStorage[key];
        if (!item) return null;
        try {
          return JSON.parse(item);
        } catch (e) {
          return null;
        }
      },
      remove: (key) => {
        delete isolatedStorage[key];
      },
      clear: () => {
        // Clear all keys in this isolated storage
        Object.keys(isolatedStorage).forEach(k => {
          delete isolatedStorage[k];
        });
      }
    };
  }

  // Generator for valid film objects
  const validFilmArb = fc.record({
    id: fc.integer({ min: 1, max: 1000000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    poster: fc.option(fc.webUrl()),
    rating: fc.float({ min: 0, max: 10, noNaN: true }),
    genres: fc.array(
      fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-Fi'),
      { minLength: 0, maxLength: 5 }
    ),
    year: fc.option(fc.integer({ min: 1900, max: 2030 })),
    overview: fc.string({ maxLength: 500 })
  });

  // Generator for valid entry objects
  const validEntryArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    id_filme: fc.string({ minLength: 1, maxLength: 50 }),
    tmdb_id: fc.integer({ min: 1, max: 1000000 }),
    film: validFilmArb,
    titulo_filme: fc.string({ minLength: 1, maxLength: 200 }),
    ano: fc.option(fc.integer({ min: 1900, max: 2030 })),
    addedBy: fc.string({ minLength: 1, maxLength: 50 }),
    addedByUserId: fc.string({ minLength: 1, maxLength: 50 }),
    addedAt: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
    streamingServices: fc.array(fc.string(), { maxLength: 5 })
  });

  // Generator for watched movie objects
  const watchedMovieArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    id_filme: fc.string({ minLength: 1, maxLength: 50 }),
    tmdb_id: fc.integer({ min: 1, max: 1000000 }),
    film: validFilmArb,
    rating: fc.float({ min: 0.5, max: 5, noNaN: true }),
    review: fc.string({ maxLength: 1000 }),
    watchedAt: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
    ratedBy: fc.string({ minLength: 1, maxLength: 50 }),
    ratedByUserId: fc.string({ minLength: 1, maxLength: 50 })
  });

  /**
   * Feature: critical-bugs-fix, Property 4: Cache updates are immediate
   * Validates: Requirements 3.1
   * 
   * For any film added to the list, the cache should contain that film 
   * immediately after the add operation completes.
   */
  describe('Property 4: Cache updates are immediate', () => {
    it('should immediately reflect added entries in cache', () => {
      fc.assert(
        fc.property(
          validEntryArb,
          (entry) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add entry to cache
            cache.addToSharedList(entry);
            
            // Entry should be immediately available in cache
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBeGreaterThan(0);
            
            // Find the added entry
            const foundEntry = sharedList.find(e => 
              e.id === entry.id || e.id_filme === entry.id_filme
            );
            
            expect(foundEntry).toBeDefined();
            expect(foundEntry.film).toBeDefined();
            expect(foundEntry.film.title).toBe(entry.film.title);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should immediately reflect removed entries in cache', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 2, maxLength: 10 }),
          (entries) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Deduplicate entries by ID to get expected count
            // Match the cache's deduplication logic which checks both id and id_filme
            const uniqueEntries = [];
            const seenIds = new Set();
            for (const entry of entries) {
              const entryId = entry.id || entry.id_filme;
              const entryIdFilme = entry.id_filme || entry.id;
              // Check if either ID has been seen
              if (!seenIds.has(entryId) && !seenIds.has(entryIdFilme)) {
                seenIds.add(entryId);
                seenIds.add(entryIdFilme);
                uniqueEntries.push(entry);
              }
            }
            
            // Skip test if we don't have at least 2 unique entries
            if (uniqueEntries.length < 2) {
              return true;
            }
            
            // Add all entries
            entries.forEach(entry => cache.addToSharedList(entry));
            
            // Get initial count (should match unique entries)
            const initialCount = cache.getSharedList().length;
            expect(initialCount).toBe(uniqueEntries.length);
            
            // Remove first unique entry
            const entryToRemove = uniqueEntries[0];
            cache.removeFromSharedList(entryToRemove.id);
            
            // Cache should immediately reflect removal
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(initialCount - 1);
            
            // Removed entry should not be found
            const foundEntry = sharedList.find(e => 
              e.id === entryToRemove.id || e.id_filme === entryToRemove.id_filme
            );
            expect(foundEntry).toBeUndefined();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should immediately reflect bulk updates to cache', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 1, maxLength: 20 }),
          (entries) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Update cache with entries
            cache.updateSharedListCache(entries);
            
            // Cache should immediately contain all entries
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(entries.length);
            
            // All entries should be present
            entries.forEach(entry => {
              const foundEntry = sharedList.find(e => 
                e.id === entry.id || e.id_filme === entry.id_filme
              );
              expect(foundEntry).toBeDefined();
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should immediately reflect watched movie updates', () => {
      fc.assert(
        fc.property(
          fc.array(watchedMovieArb, { minLength: 1, maxLength: 20 }),
          (movies) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Update watched cache
            cache.updateWatchedCache(movies);
            
            // Cache should immediately contain all movies
            const watchedList = cache.getWatchedList();
            expect(watchedList.length).toBe(movies.length);
            
            // All movies should be present
            movies.forEach(movie => {
              const foundMovie = watchedList.find(m => 
                m.id === movie.id || m.id_filme === movie.id_filme
              );
              expect(foundMovie).toBeDefined();
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: critical-bugs-fix, Property 8: Cache validation on add
   * Validates: Requirements 3.7
   * 
   * For any entry being added to cache, if it lacks required film fields, 
   * it should either be rejected or normalized to include them.
   */
  describe('Property 8: Cache validation on add', () => {
    it('should reject entries without film object', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            titulo_filme: fc.string({ minLength: 1, maxLength: 200 })
          }),
          (entryWithoutFilm) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Try to add entry without film object
            cache.addToSharedList(entryWithoutFilm);
            
            // Cache should remain empty (entry rejected)
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject entries with null or undefined film', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            film: fc.constantFrom(null, undefined)
          }),
          (entryWithNullFilm) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Try to add entry with null/undefined film
            cache.addToSharedList(entryWithNullFilm);
            
            // Cache should remain empty (entry rejected)
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should only accept entries with valid film objects', () => {
      fc.assert(
        fc.property(
          validEntryArb,
          (validEntry) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add valid entry
            cache.addToSharedList(validEntry);
            
            // Cache should contain the entry
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(1);
            
            // Entry should have film object with required fields
            const cachedEntry = sharedList[0];
            expect(cachedEntry.film).toBeDefined();
            expect(typeof cachedEntry.film).toBe('object');
            expect(cachedEntry.film.title).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid entries and accept valid ones in mixed batch', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 1, maxLength: 5 }),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              film: fc.constantFrom(null, undefined)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (validEntries, invalidEntries) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Deduplicate valid entries by ID
            const uniqueValidEntries = [];
            const seenIds = new Set();
            for (const entry of validEntries) {
              if (!seenIds.has(entry.id)) {
                seenIds.add(entry.id);
                uniqueValidEntries.push(entry);
              }
            }
            
            // Ensure invalid entries have different IDs than valid ones
            const uniqueInvalidEntries = invalidEntries.filter(e => !seenIds.has(e.id));
            
            // Add valid entries
            uniqueValidEntries.forEach(entry => cache.addToSharedList(entry));
            
            // Try to add invalid entries
            uniqueInvalidEntries.forEach(entry => cache.addToSharedList(entry));
            
            // Cache should only contain valid entries
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(uniqueValidEntries.length);
            
            // All cached entries should have valid film objects
            sharedList.forEach(entry => {
              expect(entry.film).toBeDefined();
              expect(typeof entry.film).toBe('object');
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: critical-bugs-fix, Property 9: Rendering uses cache data
   * Validates: Requirements 3.6
   * 
   * For any cache state, the render function should use exactly the data from cache, 
   * not making additional API calls.
   */
  describe('Property 9: Rendering uses cache data', () => {
    it('should return exact cache contents without modification', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 1, maxLength: 20 }),
          (entries) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Update cache
            cache.updateSharedListCache(entries);
            
            // Get cache contents
            const cachedList = cache.getSharedList();
            
            // Should return exact same data
            expect(cachedList.length).toBe(entries.length);
            
            // Verify each entry matches
            entries.forEach((entry, index) => {
              expect(cachedList[index].id).toBe(entry.id);
              expect(cachedList[index].film.title).toBe(entry.film.title);
              expect(cachedList[index].film.id).toBe(entry.film.id);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return same cache data on multiple reads', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 1, maxLength: 20 }),
          (entries) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Update cache
            cache.updateSharedListCache(entries);
            
            // Read cache multiple times
            const read1 = cache.getSharedList();
            const read2 = cache.getSharedList();
            const read3 = cache.getSharedList();
            
            // All reads should return same data
            expect(read1.length).toBe(entries.length);
            expect(read2.length).toBe(entries.length);
            expect(read3.length).toBe(entries.length);
            
            // Verify data consistency across reads
            for (let i = 0; i < entries.length; i++) {
              expect(read1[i].id).toBe(read2[i].id);
              expect(read2[i].id).toBe(read3[i].id);
              expect(read1[i].film.title).toBe(read2[i].film.title);
              expect(read2[i].film.title).toBe(read3[i].film.title);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should persist cache data across CacheManager instances', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 1, maxLength: 20 }),
          (entries) => {
            const storage = createIsolatedStorage();
            
            // Deduplicate entries by ID to get expected count
            const uniqueEntries = [];
            const seenIds = new Set();
            for (const entry of entries) {
              const entryId = entry.id || entry.id_filme;
              if (entryId && !seenIds.has(entryId)) {
                seenIds.add(entryId);
                uniqueEntries.push(entry);
              }
            }
            
            // Create first cache instance and add data
            const cache1 = new CacheManager(storage);
            cache1.updateSharedListCache(entries);
            
            // Create second cache instance with same storage
            const cache2 = new CacheManager(storage);
            const cachedList = cache2.getSharedList();
            
            // Second instance should read persisted data (deduplicated)
            expect(cachedList.length).toBe(uniqueEntries.length);
            
            // Verify data matches (check that all unique entries are present)
            uniqueEntries.forEach((entry) => {
              const found = cachedList.find(e => e.id === entry.id);
              expect(found).toBeDefined();
              expect(found.film.title).toBe(entry.film.title);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return watched cache data without modification', () => {
      fc.assert(
        fc.property(
          fc.array(watchedMovieArb, { minLength: 1, maxLength: 20 }),
          (movies) => {
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Update watched cache
            cache.updateWatchedCache(movies);
            
            // Get watched cache contents
            const cachedMovies = cache.getWatchedList();
            
            // Should return exact same data
            expect(cachedMovies.length).toBe(movies.length);
            
            // Verify each movie matches
            movies.forEach((movie, index) => {
              expect(cachedMovies[index].id).toBe(movie.id);
              expect(cachedMovies[index].film.title).toBe(movie.film.title);
              expect(cachedMovies[index].rating).toBe(movie.rating);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Additional unit tests for edge cases
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty cache gracefully', () => {
      const storage = new StorageManager();
      const cache = new CacheManager(storage);
      
      const sharedList = cache.getSharedList();
      const watchedList = cache.getWatchedList();
      
      expect(Array.isArray(sharedList)).toBe(true);
      expect(sharedList.length).toBe(0);
      expect(Array.isArray(watchedList)).toBe(true);
      expect(watchedList.length).toBe(0);
    });

    it('should handle updating existing entry', () => {
      const storage = new StorageManager();
      const cache = new CacheManager(storage);
      
      const entry = {
        id: 'test-123',
        id_filme: 'test-123',
        film: { id: 1, title: 'Original Title', genres: [] }
      };
      
      cache.addToSharedList(entry);
      expect(cache.getSharedList().length).toBe(1);
      
      // Update with same ID
      const updatedEntry = {
        id: 'test-123',
        id_filme: 'test-123',
        film: { id: 1, title: 'Updated Title', genres: [] }
      };
      
      cache.addToSharedList(updatedEntry);
      
      // Should still have only one entry
      const sharedList = cache.getSharedList();
      expect(sharedList.length).toBe(1);
      expect(sharedList[0].film.title).toBe('Updated Title');
    });

    it('should handle clearAll operation', () => {
      const storage = new StorageManager();
      const cache = new CacheManager(storage);
      
      const entry = {
        id: 'test-123',
        id_filme: 'test-123',
        film: { id: 1, title: 'Test', genres: [] }
      };
      
      cache.addToSharedList(entry);
      expect(cache.getSharedList().length).toBe(1);
      
      cache.clearAll();
      
      expect(cache.getSharedList().length).toBe(0);
      expect(cache.getWatchedList().length).toBe(0);
    });

    it('should handle pending operations', () => {
      const storage = new StorageManager();
      const cache = new CacheManager(storage);
      
      const operation = {
        type: 'add',
        entity: 'shared',
        data: { filmId: 123 }
      };
      
      const addedOp = cache.addPendingOperation(operation);
      expect(addedOp.id).toBeDefined();
      expect(addedOp.status).toBe('pending');
      
      const pendingOps = cache.getPendingOperations();
      expect(pendingOps.length).toBe(1);
      
      cache.markAsSynced(addedOp.id);
      
      const remainingOps = cache.getPendingOperations();
      expect(remainingOps.length).toBe(0);
    });
  });
});
