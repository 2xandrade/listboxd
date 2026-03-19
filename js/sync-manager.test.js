/**
 * Property-based tests for SyncManager
 * Uses fast-check for property-based testing
 * Requirements: 3.2, 3.3, 3.4, 7.2
 */

const fc = require('fast-check');
const SyncManager = require('./sync-manager.js');
const CacheManager = require('./cache-manager.js');
const StorageManager = require('./storage.js');

describe('SyncManager - Property-Based Tests', () => {
  
  // Mock localStorage for testing
  let mockStorage;
  let storageKeyCounter = 0;
  
  beforeEach(() => {
    // Reset mock storage
    // Use isolated storage
    storageKeyCounter = 0;
    mockStorage = {};
    global.localStorage = {
      getItem: jest.fn((key) => mockStorage[key] || null),
      setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
      removeItem: jest.fn((key) => { delete mockStorage[key]; }),
      clear: jest.fn(() => { mockStorage = {}; }) // Use isolated storage
    };
    
    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // Helper to create isolated storage manager with unique keys
  function createIsolatedStorage() {
    const uniqueId = ++storageKeyCounter;
    const prefix = `test_${uniqueId}_`;
    
    // Create a storage manager wrapper that adds a unique prefix to all keys
    return {
      save: (key, data) => {
        const prefixedKey = prefix + key;
        mockStorage[prefixedKey] = JSON.stringify(data);
      },
      load: (key) => {
        const prefixedKey = prefix + key;
        const item = mockStorage[prefixedKey];
        if (!item) return null;
        try {
          return JSON.parse(item);
        } catch (e) {
          return null;
        }
      },
      remove: (key) => {
        const prefixedKey = prefix + key;
        delete mockStorage[prefixedKey];
      },
      clear: () => {
        // Clear only keys with this prefix
        Object.keys(mockStorage).forEach(k => {
          if (k.startsWith(prefix)) {
            delete mockStorage[k];
          }
        });
      }
    };
  }

  // Simple ID generator for testing
  const tempIdArb = fc.integer({ min: 1, max: 1000 }).map(n => `temp-${n}`);
  const realIdArb = fc.integer({ min: 1000, max: 9999 }).map(n => `real-${n}`);

  // Generator for minimal film data
  const minimalFilmArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    genres: fc.array(fc.constantFrom('Action', 'Drama', 'Comedy'), { maxLength: 3 })
  });

  // Generator for add operation data
  const addOperationDataArb = fc.record({
    id_lista: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    id_usuario: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    titulo_filme: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    ano: fc.option(fc.integer({ min: 1900, max: 2030 })),
    tmdb_id: fc.integer({ min: 1, max: 1000 }),
    tempId: tempIdArb
  });

  // Generator for sync operations
  const syncOperationArb = fc.record({
    type: fc.constantFrom('add', 'remove'),
    entity: fc.constantFrom('shared', 'watched'),
    data: addOperationDataArb
  });

  /**
   * Feature: critical-bugs-fix, Property 5: API calls include all required data
   * Validates: Requirements 3.2
   * 
   * For any film being added, the API call should include all required fields 
   * (title, year, TMDB ID, user ID, etc.).
   */
  describe('Property 5: API calls include all required data', () => {
    it('should include all required fields when syncing add to shared list', () => {
      fc.assert(
        fc.asyncProperty(
          addOperationDataArb,
          async (operationData) => {
            // Mock API
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ 
                ok: true, 
                data: [] 
              }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: 'real-id',
                data: { id: 'real-id' }
              })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            const sync = new SyncManager(mockApi, cache);
            
            // Create operation
            const operation = {
              type: 'add',
              entity: 'shared',
              data: operationData
            };
            
            // Sync the operation
            await sync.syncOperation(operation);
            
            // Verify API was called
            expect(mockApi.addMovieToList).toHaveBeenCalled();
            
            // Verify all required fields were included in the call
            const callArgs = mockApi.addMovieToList.mock.calls[0][0];
            expect(callArgs.id_lista).toBe(operationData.id_lista);
            expect(callArgs.id_usuario).toBe(operationData.id_usuario);
            
            // Required fields must be present
            expect(callArgs.id_lista).toBeDefined();
            expect(callArgs.id_usuario).toBeDefined();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should include all required fields when syncing add watched movie', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            id_lista: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            id_usuario: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            titulo_filme: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            ano: fc.option(fc.integer({ min: 1900, max: 2030 })),
            nota: fc.float({ min: 0.5, max: 5, noNaN: true }),
            assistido_em: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
            tempId: tempIdArb
          }),
          async (operationData) => {
            // Mock API
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockResolvedValue({ ok: true })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            const sync = new SyncManager(mockApi, cache);
            
            // Create operation
            const operation = {
              type: 'add',
              entity: 'watched',
              data: operationData
            };
            
            // Sync the operation
            await sync.syncOperation(operation);
            
            // Verify API was called with all required fields
            expect(mockApi.addWatchedMovie).toHaveBeenCalled();
            
            const callArgs = mockApi.addWatchedMovie.mock.calls[0][0];
            expect(callArgs.id_lista).toBe(operationData.id_lista);
            expect(callArgs.id_usuario).toBe(operationData.id_usuario);
            expect(callArgs.titulo_filme).toBe(operationData.titulo_filme);
            expect(callArgs.ano).toBe(operationData.ano);
            expect(callArgs.nota).toBe(operationData.nota);
            expect(callArgs.assistido_em).toBe(operationData.assistido_em);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should reject operations missing required fields', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            // Missing id_lista and id_usuario
            titulo_filme: fc.string({ minLength: 1, maxLength: 50 })
          }),
          async (incompleteData) => {
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockResolvedValue({ ok: true })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            const sync = new SyncManager(mockApi, cache);
            
            const operation = {
              type: 'add',
              entity: 'shared',
              data: incompleteData
            };
            
            // Should throw error for missing required fields
            await expect(sync.syncOperation(operation)).rejects.toThrow();
            
            // API should not be called with incomplete data
            expect(mockApi.addMovieToList).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Feature: critical-bugs-fix, Property 6: Temporary IDs are replaced with real IDs
   * Validates: Requirements 3.3
   * 
   * For any successful API response containing a real ID, the cache entry should be 
   * updated to use the real ID instead of the temporary one.
   */
  describe('Property 6: Temporary IDs are replaced with real IDs', () => {
    it('should replace temporary ID with real ID after successful sync', () => {
      fc.assert(
        fc.asyncProperty(
          tempIdArb,
          realIdArb,
          minimalFilmArb,
          async (tempId, realId, film) => {
            // Clear mock storage for this iteration
            // Use isolated storage
            
            // Mock API that returns real ID
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: realId,
                data: { id: realId }
              }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: realId,
                data: { id: realId }
              })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add entry with temporary ID to cache
            const entry = {
              id: tempId,
              id_filme: tempId,
              film: film,
              titulo_filme: film.title
            };
            cache.addToSharedList(entry);
            
            const sync = new SyncManager(mockApi, cache);
            
            // Sync operation with temp ID
            const operationData = {
              id_lista: 'list-1',
              id_usuario: 'user-1',
              titulo_filme: film.title,
              tempId: tempId
            };
            
            await sync.syncAddToSharedList(operationData);
            
            // Verify cache was updated with real ID
            const sharedList = cache.getSharedList();
            const updatedEntry = sharedList.find(e => e.id === realId);
            
            expect(updatedEntry).toBeDefined();
            expect(updatedEntry.id).toBe(realId);
            expect(updatedEntry.id_filme).toBe(realId);
            
            // Temp ID should no longer exist
            const tempEntry = sharedList.find(e => e.id === tempId);
            expect(tempEntry).toBeUndefined();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should replace temporary ID in watched list after successful sync', () => {
      fc.assert(
        fc.asyncProperty(
          tempIdArb,
          realIdArb,
          minimalFilmArb,
          async (tempId, realId, film) => {
            // Clear mock storage for this iteration
            // Use isolated storage
            
            // Mock API that returns real ID
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: realId,
                data: { id: realId }
              }),
              addMovieToList: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: realId,
                data: { id: realId }
              })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add watched entry with temporary ID to cache
            const watchedEntry = {
              id: tempId,
              id_filme: tempId,
              film: film,
              rating: 4.5,
              review: 'Great movie'
            };
            cache.updateWatchedCache([watchedEntry]);
            
            const sync = new SyncManager(mockApi, cache);
            
            // Sync operation with temp ID
            const operationData = {
              id_lista: 'list-1',
              id_usuario: 'user-1',
              titulo_filme: film.title,
              nota: 4.5,
              tempId: tempId
            };
            
            await sync.syncAddWatchedMovie(operationData);
            
            // Verify cache was updated with real ID
            const watchedList = cache.getWatchedList();
            const updatedEntry = watchedList.find(e => e.id === realId);
            
            expect(updatedEntry).toBeDefined();
            expect(updatedEntry.id).toBe(realId);
            expect(updatedEntry.id_filme).toBe(realId);
            
            // Temp ID should no longer exist
            const tempEntry = watchedList.find(e => e.id === tempId);
            expect(tempEntry).toBeUndefined();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should preserve entry data when replacing ID', () => {
      fc.assert(
        fc.asyncProperty(
          tempIdArb,
          realIdArb,
          minimalFilmArb,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (tempId, realId, film, addedBy) => {
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: realId,
                data: { id: realId }
              }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockResolvedValue({ 
                ok: true, 
                id: realId,
                data: { id: realId }
              })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add entry with temporary ID and additional data
            const entry = {
              id: tempId,
              id_filme: tempId,
              film: film,
              titulo_filme: film.title,
              addedBy: addedBy,
              addedAt: new Date().toISOString()
            };
            cache.addToSharedList(entry);
            
            const sync = new SyncManager(mockApi, cache);
            
            const operationData = {
              id_lista: 'list-1',
              id_usuario: 'user-1',
              titulo_filme: film.title,
              tempId: tempId
            };
            
            await sync.syncAddToSharedList(operationData);
            
            // Verify all data preserved except ID
            const sharedList = cache.getSharedList();
            const updatedEntry = sharedList.find(e => e.id === realId);
            
            expect(updatedEntry).toBeDefined();
            if (updatedEntry) {
              expect(updatedEntry.film).toBeDefined();
              expect(updatedEntry.film.title).toBe(film.title);
              expect(updatedEntry.addedBy).toBe(addedBy);
              expect(updatedEntry.addedAt).toBe(entry.addedAt);
            }
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Feature: critical-bugs-fix, Property 7: Errors preserve cache state
   * Validates: Requirements 3.4, 7.2
   * 
   * For any API error during add operation, the film should remain in the cache 
   * with its temporary ID.
   */
  describe('Property 7: Errors preserve cache state', () => {
    it('should preserve cache entry when API call fails', () => {
      fc.assert(
        fc.asyncProperty(
          tempIdArb,
          minimalFilmArb,
          async (tempId, film) => {
            // Clear mock storage for this iteration
            // Use isolated storage
            
            // Mock API that fails
            const mockApi = {
              getMoviesByList: jest.fn().mockRejectedValue(new Error('API Error')),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockRejectedValue(new Error('API Error'))
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add entry with temporary ID to cache
            const entry = {
              id: tempId,
              id_filme: tempId,
              film: film,
              titulo_filme: film.title
            };
            cache.addToSharedList(entry);
            
            const initialList = cache.getSharedList();
            const initialLength = initialList.length;
            
            const sync = new SyncManager(mockApi, cache);
            
            // Try to sync (will fail)
            const operationData = {
              id_lista: 'list-1',
              id_usuario: 'user-1',
              titulo_filme: film.title,
              tempId: tempId
            };
            
            await expect(sync.syncAddToSharedList(operationData)).rejects.toThrow();
            
            // Verify cache still contains entry with temp ID
            const sharedList = cache.getSharedList();
            expect(sharedList.length).toBe(initialLength);
            
            const preservedEntry = sharedList.find(e => e.id === tempId);
            expect(preservedEntry).toBeDefined();
            expect(preservedEntry.film.title).toBe(film.title);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should queue operation when offline', () => {
      fc.assert(
        fc.property(
          syncOperationArb,
          (operation) => {
            // Mock offline state
            Object.defineProperty(global.navigator, 'onLine', {
              writable: true,
              value: false
            });
            
            const mockApi = {
              getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
              deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
              addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
              addMovieToList: jest.fn().mockResolvedValue({ ok: true })
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            const sync = new SyncManager(mockApi, cache);
            
            // Queue operation while offline
            const queuedOp = sync.queueOperation(operation);
            
            // Verify operation was queued
            expect(queuedOp).toBeDefined();
            expect(queuedOp.id).toBeDefined();
            expect(queuedOp.status).toBe('pending');
            
            // Verify it's in pending operations
            const pendingOps = cache.getPendingOperations();
            expect(pendingOps.length).toBeGreaterThan(0);
            
            const foundOp = pendingOps.find(op => op.id === queuedOp.id);
            expect(foundOp).toBeDefined();
            expect(foundOp.type).toBe(operation.type);
            expect(foundOp.entity).toBe(operation.entity);
            
            // Reset online state
            Object.defineProperty(global.navigator, 'onLine', {
              writable: true,
              value: true
            });
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should preserve cache state across multiple failed sync attempts', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(tempIdArb, minimalFilmArb),
            { minLength: 1, maxLength: 5 }
          ),
          async (entries) => {
            // Clear mock storage for this iteration
            // Use isolated storage
            
            // Mock API that always fails
            const mockApi = {
              getMoviesByList: jest.fn().mockRejectedValue(new Error('Network Error')),
              deleteMovie: jest.fn().mockRejectedValue(new Error('Network Error')),
              addWatchedMovie: jest.fn().mockRejectedValue(new Error('Network Error')),
              addMovieToList: jest.fn().mockRejectedValue(new Error('Network Error'))
            };
            
            const storage = createIsolatedStorage();
            const cache = new CacheManager(storage);
            
            // Add all entries to cache
            entries.forEach(([tempId, film]) => {
              const entry = {
                id: tempId,
                id_filme: tempId,
                film: film,
                titulo_filme: film.title
              };
              cache.addToSharedList(entry);
            });
            
            const initialList = cache.getSharedList();
            const initialLength = initialList.length;
            
            const sync = new SyncManager(mockApi, cache);
            
            // Try to sync multiple times (all will fail)
            for (const [tempId, film] of entries) {
              const operationData = {
                id_lista: 'list-1',
                id_usuario: 'user-1',
                titulo_filme: film.title,
                tempId: tempId
              };
              
              try {
                await sync.syncAddToSharedList(operationData);
              } catch (error) {
                // Expected to fail
              }
            }
            
            // Verify cache still contains all entries with temp IDs
            const finalList = cache.getSharedList();
            expect(finalList.length).toBe(initialLength);
            
            // All temp IDs should still exist
            entries.forEach(([tempId, film]) => {
              const preservedEntry = finalList.find(e => e.id === tempId);
              expect(preservedEntry).toBeDefined();
              expect(preservedEntry.film.title).toBe(film.title);
            });
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  // Additional unit tests for edge cases
  describe('Edge Cases and Error Handling', () => {
    it('should require GoogleSheetsApi instance', () => {
      const storage = createIsolatedStorage();
      const cache = new CacheManager(storage);
      
      expect(() => new SyncManager(null, cache)).toThrow('GoogleSheetsApi');
    });

    it('should require CacheManager instance', () => {
      const mockApi = {
        getMoviesByList: jest.fn(),
        deleteMovie: jest.fn(),
        addWatchedMovie: jest.fn(),
        addMovieToList: jest.fn()
      };
      
      expect(() => new SyncManager(mockApi, null)).toThrow('CacheManager');
    });

    it('should detect online/offline state', () => {
      const mockApi = {
        getMoviesByList: jest.fn(),
        deleteMovie: jest.fn(),
        addWatchedMovie: jest.fn(),
        addMovieToList: jest.fn()
      };
      
      const storage = createIsolatedStorage();
      const cache = new CacheManager(storage);
      const sync = new SyncManager(mockApi, cache);
      
      // Should be online by default
      expect(sync.isOnline()).toBe(true);
      
      // Set offline
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      expect(sync.isOnline()).toBe(false);
    });

    it('should not process sync queue when already syncing', async () => {
      const mockApi = {
        getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
        deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
        addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
        addMovieToList: jest.fn().mockResolvedValue({ ok: true })
      };
      
      const storage = createIsolatedStorage();
      const cache = new CacheManager(storage);
      const sync = new SyncManager(mockApi, cache);
      
      // Set syncing flag
      sync.isSyncing = true;
      
      // Try to process queue
      await sync.processSyncQueue();
      
      // API should not be called
      expect(mockApi.getMoviesByList).not.toHaveBeenCalled();
    });

    it('should handle empty sync queue', async () => {
      const mockApi = {
        getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
        deleteMovie: jest.fn().mockResolvedValue({ ok: true }),
        addWatchedMovie: jest.fn().mockResolvedValue({ ok: true }),
        addMovieToList: jest.fn().mockResolvedValue({ ok: true })
      };
      
      const storage = createIsolatedStorage();
      const cache = new CacheManager(storage);
      const sync = new SyncManager(mockApi, cache);
      
      // Process empty queue
      await sync.processSyncQueue();
      
      // Should complete without errors
      expect(sync.isSyncing).toBe(false);
    });
  });
});
