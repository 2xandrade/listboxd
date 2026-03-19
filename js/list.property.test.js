/**
 * Property-based test for ListService - Watched film state transition
 * Uses fast-check for property-based testing
 * Requirements: 5.1, 5.2
 * 
 * Feature: critical-bugs-fix, Property 11: Watched film state transition
 * Validates: Requirements 5.1, 5.2
 * 
 * For any film marked as watched, it should appear in the watched list 
 * and not appear in the shared list.
 */

const fc = require('fast-check');
const ListService = require('./list.js');
const CacheManager = require('./cache-manager.js');
const SyncManager = require('./sync-manager.js');
const StorageManager = require('./storage.js');

describe('ListService - Property 11: Watched film state transition', () => {
  
  // Generator for minimal film objects (only required fields)
  const minimalFilmArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    year: fc.option(fc.integer({ min: 1900, max: 2030 })),
    poster: fc.option(fc.webUrl()),
    rating: fc.float({ min: 0, max: 10, noNaN: true }),
    genres: fc.array(fc.constantFrom('Action', 'Drama', 'Comedy'), { maxLength: 3 }),
    overview: fc.string({ maxLength: 100 })
  });

  // Generator for user IDs
  const userIdArb = fc.string({ minLength: 5, maxLength: 20 });

  // Generator for usernames
  const usernameArb = fc.string({ 
    minLength: 3, 
    maxLength: 20 
  }).filter(s => s.trim().length >= 3);

  // Generator for half-star ratings (0.5 to 5 in 0.5 increments)
  const halfStarRatingArb = fc.integer({ min: 1, max: 10 }).map(n => n * 0.5);

  // Generator for reviews
  const reviewArb = fc.string({ maxLength: 200 });

  /**
   * Property 11: Watched film state transition
   * 
   * For any film in the shared list, when marked as watched, it should:
   * 1. Appear in the watched list
   * 2. Be removed from the shared list
   */
  it('should move film from shared list to watched list when marked as watched', async () => {
    await fc.assert(
      fc.asyncProperty(
        minimalFilmArb,
        userIdArb,
        usernameArb,
        halfStarRatingArb,
        userIdArb,
        usernameArb,
        reviewArb,
        async (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
          // Create unique ID counter for mock API
          let idCounter = 0;
          
          // Create mock API
          const mockApi = {
            getListsByUser: jest.fn().mockResolvedValue({ 
              ok: true, 
              data: [{ id_lista: 'test-list-1', titulo: 'Test List' }] 
            }),
            getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
            addWatchedMovie: jest.fn().mockImplementation(() => {
              return Promise.resolve({ 
                ok: true, 
                data: { id_filme: `watched-${Date.now()}-${idCounter++}` } 
              });
            }),
            deleteMovie: jest.fn().mockResolvedValue({ ok: true })
          };

          // Create mock auth service
          const mockAuthService = {
            getCurrentUser: jest.fn().mockReturnValue({ 
              id: addUserId, 
              nome: addUsername 
            })
          };

          // Create isolated storage for this test iteration
          const storage = new StorageManager();
          const cache = new CacheManager(storage);
          const sync = new SyncManager(mockApi, cache);
          const listService = new ListService(mockApi, mockAuthService, cache, sync);

          // Initialize with empty caches (use cacheManager, not legacy properties)
          cache.updateSharedListCache([]);
          cache.updateWatchedCache([]);
          listService.currentListId = 'test-list-1';

          // Add film to shared list (await the async operation)
          await listService.addFilmToList(film, addUserId, addUsername);
          
          // Verify film is in shared list
          const sharedListBefore = listService.getSharedList();
          expect(sharedListBefore.length).toBe(1);
          expect(sharedListBefore[0].film.id).toBe(film.id);
          
          // Verify film is not in watched list
          const watchedListBefore = listService.getWatchedList();
          expect(watchedListBefore.length).toBe(0);
          
          // Mark film as watched (async operation)
          await listService.markAsWatched(
            film.id,
            rating,
            watchUserId,
            watchUsername,
            review,
            true // isAdmin
          );
          
          // Verify film is removed from shared list (Requirement 5.2)
          const sharedListAfter = listService.getSharedList();
          expect(sharedListAfter.length).toBe(0);
          const stillInShared = sharedListAfter.find(e => e.film && e.film.id === film.id);
          expect(stillInShared).toBeUndefined();
          
          // Verify film is added to watched list (Requirement 5.1)
          const watchedListAfter = listService.getWatchedList();
          expect(watchedListAfter.length).toBe(1);
          const inWatched = watchedListAfter.find(w => w.film && w.film.id === film.id);
          expect(inWatched).toBeDefined();
          expect(inWatched.film.id).toBe(film.id);
          expect(inWatched.film.title).toBe(film.title);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property 11 (variant): Multiple films marked as watched
   * 
   * For multiple films in the shared list, when each is marked as watched,
   * each should transition correctly from shared to watched list.
   */
  it('should handle marking multiple films as watched independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.record({
            film: minimalFilmArb,
            addUserId: userIdArb,
            addUsername: usernameArb,
            rating: halfStarRatingArb,
            watchUserId: userIdArb,
            watchUsername: usernameArb,
            review: reviewArb
          }),
          { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
        ),
        async (entries) => {
          // Create unique ID counter for mock API
          let idCounter = 0;
          
          // Create mock API
          const mockApi = {
            getListsByUser: jest.fn().mockResolvedValue({ 
              ok: true, 
              data: [{ id_lista: 'test-list-1', titulo: 'Test List' }] 
            }),
            getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
            addWatchedMovie: jest.fn().mockImplementation(() => {
              return Promise.resolve({ 
                ok: true, 
                data: { id_filme: `watched-${Date.now()}-${idCounter++}` } 
              });
            }),
            deleteMovie: jest.fn().mockResolvedValue({ ok: true })
          };

          // Create mock auth service
          const mockAuthService = {
            getCurrentUser: jest.fn().mockReturnValue({ 
              id: entries[0].addUserId, 
              nome: entries[0].addUsername 
            })
          };

          // Create isolated storage for this test iteration
          const storage = new StorageManager();
          const cache = new CacheManager(storage);
          const sync = new SyncManager(mockApi, cache);
          const listService = new ListService(mockApi, mockAuthService, cache, sync);

          // Initialize with empty caches (use cacheManager, not legacy properties)
          cache.updateSharedListCache([]);
          cache.updateWatchedCache([]);
          listService.currentListId = 'test-list-1';

          // Add all films to shared list (await each async operation)
          for (const entry of entries) {
            await listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
          }
          
          // Verify all films are in shared list
          expect(listService.getSharedList().length).toBe(entries.length);
          
          // Mark each film as watched one by one
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            
            await listService.markAsWatched(
              entry.film.id,
              entry.rating,
              entry.watchUserId,
              entry.watchUsername,
              entry.review,
              true // isAdmin
            );
            
            // Verify counts after each mark
            expect(listService.getSharedList().length).toBe(entries.length - i - 1);
            expect(listService.getWatchedList().length).toBe(i + 1);
          }
          
          // At the end, shared list should be empty and watched list should have all films
          expect(listService.getSharedList().length).toBe(0);
          expect(listService.getWatchedList().length).toBe(entries.length);
          
          // Verify all films are in watched list with correct data
          const watchedList = listService.getWatchedList();
          for (const entry of entries) {
            const watchedFilm = watchedList.find(w => w.film && w.film.id === entry.film.id);
            expect(watchedFilm).toBeDefined();
            expect(watchedFilm.film.title).toBe(entry.film.title);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property 11 (error case): Cannot mark non-existent film as watched
   * 
   * For any film ID not in the shared list, attempting to mark it as watched
   * should throw an error and not modify either list.
   */
  it('should throw error when trying to mark non-existent film as watched', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        halfStarRatingArb,
        userIdArb,
        usernameArb,
        reviewArb,
        async (nonExistentFilmId, rating, userId, username, review) => {
          // Create unique ID counter for mock API
          let idCounter = 0;
          
          // Create mock API
          const mockApi = {
            getListsByUser: jest.fn().mockResolvedValue({ 
              ok: true, 
              data: [{ id_lista: 'test-list-1', titulo: 'Test List' }] 
            }),
            getMoviesByList: jest.fn().mockResolvedValue({ ok: true, data: [] }),
            addWatchedMovie: jest.fn().mockImplementation(() => {
              return Promise.resolve({ 
                ok: true, 
                data: { id_filme: `watched-${Date.now()}-${idCounter++}` } 
              });
            }),
            deleteMovie: jest.fn().mockResolvedValue({ ok: true })
          };

          // Create mock auth service
          const mockAuthService = {
            getCurrentUser: jest.fn().mockReturnValue({ 
              id: userId, 
              nome: username 
            })
          };

          // Create isolated storage for this test iteration
          const storage = new StorageManager();
          const cache = new CacheManager(storage);
          const sync = new SyncManager(mockApi, cache);
          const listService = new ListService(mockApi, mockAuthService, cache, sync);

          // Initialize with empty caches (use cacheManager, not legacy properties)
          cache.updateSharedListCache([]);
          cache.updateWatchedCache([]);
          listService.currentListId = 'test-list-1';

          // Attempt to mark non-existent film as watched should throw
          await expect(
            listService.markAsWatched(nonExistentFilmId, rating, userId, username, review, true)
          ).rejects.toThrow('Film not found in shared list');
          
          // Both lists should remain empty
          expect(listService.getSharedList().length).toBe(0);
          expect(listService.getWatchedList().length).toBe(0);
        }
      ),
      { numRuns: 15 }
    );
  });
});
