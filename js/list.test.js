/**
 * Property-based tests for ListService
 * Uses fast-check for property-based testing
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */

const fc = require('fast-check');
const ListService = require('./list.js');
const StorageManager = require('./storage.js');
const UserService = require('./users.js');
const AuthService = require('./auth.js');

describe('ListService - Property-Based Tests', () => {
  let listService;
  let storageManager;
  let userService;
  let authService;

  // Generator for film objects
  const filmArb = fc.record({
    id: fc.integer({ min: 1, max: 1000000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    poster: fc.option(fc.webUrl()),
    rating: fc.float({ min: 0, max: 10, noNaN: true }),
    genres: fc.array(
      fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance'),
      { minLength: 0, maxLength: 5 }
    ),
    year: fc.option(fc.integer({ min: 1900, max: 2030 })),
    overview: fc.string({ maxLength: 500 }),
    tmdbUrl: fc.webUrl()
  });

  // Generator for usernames
  const usernameArb = fc.string({ 
    minLength: 3, 
    maxLength: 20,
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''))
  });

  // Generator for user IDs
  const userIdArb = fc.string({ minLength: 5, maxLength: 30 });

  // Generator for half-star ratings (0.5 to 5 in 0.5 increments)
  const halfStarRatingArb = fc.integer({ min: 1, max: 10 }).map(n => n * 0.5);

  beforeEach(() => {
    // Create fresh instances before each test
    storageManager = new StorageManager();
    listService = new ListService(storageManager);
    userService = new UserService(storageManager);
    authService = new AuthService(storageManager, userService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Feature: letterboxd-manager, Property 12: Film entry storage completeness
   * Validates: Requirements 4.2, 4.3, 4.4
   * 
   * For any film added to the shared list by any user, the stored entry should contain
   * the film information (poster, title, rating, genre), the username who added it,
   * and the timestamp when it was added.
   */
  describe('Property 12: Film entry storage completeness', () => {
    it('should store complete film entry with all required fields', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to list
            const entry = listService.addFilmToList(film, userId, username);
            
            // Entry should have an ID
            expect(entry.id).toBeDefined();
            expect(typeof entry.id).toBe('string');
            
            // Entry should contain complete film information
            expect(entry.film).toBeDefined();
            expect(entry.film.id).toBe(film.id);
            expect(entry.film.title).toBe(film.title);
            expect(entry.film.poster).toBe(film.poster);
            expect(entry.film.rating).toBe(film.rating);
            expect(entry.film.genres).toEqual(film.genres);
            expect(entry.film.year).toBe(film.year);
            expect(entry.film.overview).toBe(film.overview);
            expect(entry.film.tmdbUrl).toBe(film.tmdbUrl);
            
            // Entry should contain username who added it (Requirement 4.2)
            expect(entry.addedBy).toBe(username);
            expect(typeof entry.addedBy).toBe('string');
            
            // Entry should contain user ID who added it
            expect(entry.addedByUserId).toBe(userId);
            
            // Entry should contain timestamp when it was added (Requirement 4.3)
            expect(entry.addedAt).toBeDefined();
            expect(typeof entry.addedAt).toBe('number');
            expect(entry.addedAt).toBeGreaterThan(0);
            
            // Entry should be retrievable from storage
            const list = listService.getSharedList();
            const storedEntry = list.find(e => e.id === entry.id);
            
            expect(storedEntry).toBeDefined();
            expect(storedEntry.film.id).toBe(film.id);
            expect(storedEntry.film.title).toBe(film.title);
            expect(storedEntry.film.poster).toBe(film.poster);
            expect(storedEntry.film.rating).toBe(film.rating);
            expect(storedEntry.film.genres).toEqual(film.genres);
            expect(storedEntry.addedBy).toBe(username);
            expect(storedEntry.addedAt).toBe(entry.addedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store multiple film entries independently with complete data', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 1, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const addedEntries = [];
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              const entry = listService.addFilmToList(film, userId, username);
              addedEntries.push({ entry, film, userId, username });
            }
            
            // Retrieve list from storage
            const list = listService.getSharedList();
            
            // List should contain all entries
            expect(list.length).toBe(addedEntries.length);
            
            // Each entry should have complete data
            for (const { entry, film, userId, username } of addedEntries) {
              const storedEntry = list.find(e => e.id === entry.id);
              
              expect(storedEntry).toBeDefined();
              
              // Film information should be complete
              expect(storedEntry.film.id).toBe(film.id);
              expect(storedEntry.film.title).toBe(film.title);
              expect(storedEntry.film.poster).toBe(film.poster);
              expect(storedEntry.film.rating).toBe(film.rating);
              expect(storedEntry.film.genres).toEqual(film.genres);
              expect(storedEntry.film.year).toBe(film.year);
              expect(storedEntry.film.overview).toBe(film.overview);
              expect(storedEntry.film.tmdbUrl).toBe(film.tmdbUrl);
              
              // Metadata should be complete
              expect(storedEntry.addedBy).toBe(username);
              expect(storedEntry.addedByUserId).toBe(userId);
              expect(storedEntry.addedAt).toBeDefined();
              expect(typeof storedEntry.addedAt).toBe('number');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all film fields through storage round-trip', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to list
            const entry = listService.addFilmToList(film, userId, username);
            
            // Retrieve from storage
            const list = listService.getSharedList();
            const retrieved = list.find(e => e.id === entry.id);
            
            // All film fields should be preserved exactly
            expect(retrieved.film).toEqual(film);
            
            // Metadata should also be preserved
            expect(retrieved.addedBy).toBe(username);
            expect(retrieved.addedByUserId).toBe(userId);
            expect(retrieved.addedAt).toBe(entry.addedAt);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 13: Duplicate prevention
   * Validates: Requirements 4.5
   * 
   * For any film, when added to the shared list twice, only one entry should exist in the list.
   */
  describe('Property 13: Duplicate prevention', () => {
    it('should prevent duplicate film additions based on film ID', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          userIdArb,
          usernameArb,
          (film, userId1, username1, userId2, username2) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film first time
            const entry1 = listService.addFilmToList(film, userId1, username1);
            expect(entry1).toBeDefined();
            
            // Attempt to add same film again (even by different user)
            expect(() => {
              listService.addFilmToList(film, userId2, username2);
            }).toThrow('Film already exists in the shared list');
            
            // List should contain only one entry
            const list = listService.getSharedList();
            expect(list.length).toBe(1);
            
            // The entry should be the first one added
            expect(list[0].id).toBe(entry1.id);
            expect(list[0].addedBy).toBe(username1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect duplicates even with modified film data', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.float({ min: 0, max: 10, noNaN: true }),
          (film, userId, username, newTitle, newRating) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film first time
            listService.addFilmToList(film, userId, username);
            
            // Create modified version of same film (same ID, different data)
            const modifiedFilm = {
              ...film,
              title: newTitle,
              rating: newRating
            };
            
            // Attempt to add modified film should fail (same ID)
            expect(() => {
              listService.addFilmToList(modifiedFilm, userId, username);
            }).toThrow('Film already exists in the shared list');
            
            // List should contain only one entry
            const list = listService.getSharedList();
            expect(list.length).toBe(1);
            
            // Original data should be preserved
            expect(list[0].film.title).toBe(film.title);
            expect(list[0].film.rating).toBe(film.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow different films with different IDs', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(filmArb, { 
            minLength: 2, 
            maxLength: 10, 
            selector: (f) => f.id 
          }),
          userIdArb,
          usernameArb,
          (films, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films
            for (const film of films) {
              const entry = listService.addFilmToList(film, userId, username);
              expect(entry).toBeDefined();
            }
            
            // List should contain all films
            const list = listService.getSharedList();
            expect(list.length).toBe(films.length);
            
            // Each film should be present exactly once
            for (const film of films) {
              const entries = list.filter(e => e.film.id === film.id);
              expect(entries.length).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify films already in list', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Film should not be in list initially
            expect(listService.isFilmInList(film.id)).toBe(false);
            
            // Add film to list
            listService.addFilmToList(film, userId, username);
            
            // Film should now be in list
            expect(listService.isFilmInList(film.id)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain duplicate prevention after removing and re-adding', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film
            const entry1 = listService.addFilmToList(film, userId, username);
            
            // Remove film
            listService.removeFilmFromList(entry1.id);
            
            // Film should no longer be in list
            expect(listService.isFilmInList(film.id)).toBe(false);
            
            // Should be able to add film again
            const entry2 = listService.addFilmToList(film, userId, username);
            expect(entry2).toBeDefined();
            expect(entry2.id).not.toBe(entry1.id); // Different entry ID
            
            // Film should be in list again
            expect(listService.isFilmInList(film.id)).toBe(true);
            
            // List should contain only one entry
            const list = listService.getSharedList();
            expect(list.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Unit Tests for ListService
   * Testing specific scenarios and edge cases
   * Requirements: 4.2, 4.3, 4.4, 4.5
   */
  describe('ListService - Unit Tests', () => {
    beforeEach(() => {
      storageManager = new StorageManager();
      listService = new ListService(storageManager);
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    describe('Adding film with complete data', () => {
      it('should add a film with all required fields and metadata', () => {
        const film = {
          id: 550,
          title: 'Fight Club',
          poster: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          rating: 8.4,
          genres: ['Drama', 'Thriller'],
          year: 1999,
          overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
          tmdbUrl: 'https://www.themoviedb.org/movie/550'
        };
        const userId = 'user123';
        const username = 'testuser';

        const entry = listService.addFilmToList(film, userId, username);

        // Verify entry structure
        expect(entry).toBeDefined();
        expect(entry.id).toBeDefined();
        expect(typeof entry.id).toBe('string');

        // Verify film data is complete (Requirement 4.4)
        expect(entry.film.id).toBe(550);
        expect(entry.film.title).toBe('Fight Club');
        expect(entry.film.poster).toBe('/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg');
        expect(entry.film.rating).toBe(8.4);
        expect(entry.film.genres).toEqual(['Drama', 'Thriller']);
        expect(entry.film.year).toBe(1999);
        expect(entry.film.overview).toBe('A ticking-time-bomb insomniac and a slippery soap salesman...');
        expect(entry.film.tmdbUrl).toBe('https://www.themoviedb.org/movie/550');

        // Verify username is recorded (Requirement 4.2)
        expect(entry.addedBy).toBe('testuser');
        expect(entry.addedByUserId).toBe('user123');

        // Verify timestamp is recorded (Requirement 4.3)
        expect(entry.addedAt).toBeDefined();
        expect(typeof entry.addedAt).toBe('number');
        expect(entry.addedAt).toBeGreaterThan(0);
        expect(entry.addedAt).toBeLessThanOrEqual(Date.now());
      });

      it('should persist the film entry to storage', () => {
        const film = {
          id: 278,
          title: 'The Shawshank Redemption',
          poster: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          rating: 8.7,
          genres: ['Drama', 'Crime'],
          year: 1994,
          overview: 'Framed in the 1940s for the double murder...',
          tmdbUrl: 'https://www.themoviedb.org/movie/278'
        };
        const userId = 'user456';
        const username = 'moviefan';

        const entry = listService.addFilmToList(film, userId, username);

        // Retrieve from storage
        const list = listService.getSharedList();

        expect(list).toBeDefined();
        expect(list.length).toBe(1);
        expect(list[0].id).toBe(entry.id);
        expect(list[0].film.id).toBe(278);
        expect(list[0].film.title).toBe('The Shawshank Redemption');
        expect(list[0].addedBy).toBe('moviefan');
      });

      it('should throw error when film object is missing', () => {
        expect(() => {
          listService.addFilmToList(null, 'user123', 'testuser');
        }).toThrow('Film object is required');
      });

      it('should throw error when film ID is missing', () => {
        const film = {
          title: 'Test Movie',
          poster: '/test.jpg',
          rating: 7.5,
          genres: ['Action']
        };

        expect(() => {
          listService.addFilmToList(film, 'user123', 'testuser');
        }).toThrow('Film must have an id');
      });

      it('should throw error when userId is missing', () => {
        const film = {
          id: 123,
          title: 'Test Movie',
          poster: '/test.jpg',
          rating: 7.5,
          genres: ['Action']
        };

        expect(() => {
          listService.addFilmToList(film, null, 'testuser');
        }).toThrow('User ID is required');
      });

      it('should throw error when username is missing', () => {
        const film = {
          id: 123,
          title: 'Test Movie',
          poster: '/test.jpg',
          rating: 7.5,
          genres: ['Action']
        };

        expect(() => {
          listService.addFilmToList(film, 'user123', null);
        }).toThrow('Username is required');
      });
    });

    describe('Behavior with empty list', () => {
      it('should return empty array when list is empty', () => {
        const list = listService.getSharedList();

        expect(list).toBeDefined();
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBe(0);
      });

      it('should return false when checking if film is in empty list', () => {
        const isInList = listService.isFilmInList(123);

        expect(isInList).toBe(false);
      });

      it('should successfully add first film to empty list', () => {
        const film = {
          id: 680,
          title: 'Pulp Fiction',
          poster: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
          rating: 8.5,
          genres: ['Crime', 'Drama'],
          year: 1994,
          overview: 'A burger-loving hit man, his philosophical partner...',
          tmdbUrl: 'https://www.themoviedb.org/movie/680'
        };

        const entry = listService.addFilmToList(film, 'user789', 'cinephile');

        expect(entry).toBeDefined();
        expect(entry.film.id).toBe(680);

        const list = listService.getSharedList();
        expect(list.length).toBe(1);
        expect(list[0].id).toBe(entry.id);
      });

      it('should handle multiple additions to initially empty list', () => {
        const film1 = {
          id: 13,
          title: 'Forrest Gump',
          poster: '/h5J4W4veyxMXDMjeNxZI46TsHOb.jpg',
          rating: 8.5,
          genres: ['Comedy', 'Drama', 'Romance'],
          year: 1994,
          overview: 'A man with a low IQ has accomplished great things...',
          tmdbUrl: 'https://www.themoviedb.org/movie/13'
        };

        const film2 = {
          id: 155,
          title: 'The Dark Knight',
          poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          rating: 9.0,
          genres: ['Drama', 'Action', 'Crime', 'Thriller'],
          year: 2008,
          overview: 'Batman raises the stakes in his war on crime...',
          tmdbUrl: 'https://www.themoviedb.org/movie/155'
        };

        listService.addFilmToList(film1, 'user1', 'user1name');
        listService.addFilmToList(film2, 'user2', 'user2name');

        const list = listService.getSharedList();
        expect(list.length).toBe(2);
        expect(list[0].film.id).toBe(13);
        expect(list[1].film.id).toBe(155);
      });

      it('should throw error when trying to remove from empty list', () => {
        expect(() => {
          listService.removeFilmFromList('nonexistent_id');
        }).toThrow('Entry not found');
      });
    });
  });

  /**
   * Feature: letterboxd-manager, Property 33: Mark as watched transition
   * Validates: Requirements 12.2, 12.6
   * 
   * For any film in the shared list, when a user marks it as watched, it should appear
   * in the watched films list and be removed from the shared list.
   */
  describe('Property 33: Mark as watched transition', () => {
    it('should move film from shared list to watched list when marked as watched', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, notes) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Verify film is in shared list
            const sharedListBefore = listService.getSharedList();
            expect(sharedListBefore.length).toBe(1);
            expect(sharedListBefore[0].film.id).toBe(film.id);
            
            // Verify film is not in watched list
            const watchedListBefore = listService.getWatchedList();
            expect(watchedListBefore.length).toBe(0);
            
            // Mark film as watched
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              notes,
              true // isAdmin = true for this test
            );
            
            // Verify film is removed from shared list (Requirement 12.6)
            const sharedListAfter = listService.getSharedList();
            expect(sharedListAfter.length).toBe(0);
            expect(sharedListAfter.find(e => e.film.id === film.id)).toBeUndefined();
            
            // Verify film is added to watched list (Requirement 12.2)
            const watchedListAfter = listService.getWatchedList();
            expect(watchedListAfter.length).toBe(1);
            expect(watchedListAfter[0].film.id).toBe(film.id);
            expect(watchedListAfter[0].id).toBe(watchedFilm.id);
            expect(watchedListAfter[0].rating).toBe(rating);
            expect(watchedListAfter[0].ratedBy).toBe(watchUsername);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle marking multiple films as watched independently', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb,
              review: fc.string({ maxLength: 200 })
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films to shared list
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
            }
            
            // Verify all films are in shared list
            expect(listService.getSharedList().length).toBe(entries.length);
            
            // Mark each film as watched one by one
            for (let i = 0; i < entries.length; i++) {
              const entry = entries[i];
              
              listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                entry.review,
                true // isAdmin = true for this test
              );
              
              // Verify counts after each mark
              expect(listService.getSharedList().length).toBe(entries.length - i - 1);
              expect(listService.getWatchedList().length).toBe(i + 1);
            }
            
            // At the end, shared list should be empty and watched list should have all films
            expect(listService.getSharedList().length).toBe(0);
            expect(listService.getWatchedList().length).toBe(entries.length);
            
            // Verify all films are in watched list
            const watchedList = listService.getWatchedList();
            for (const entry of entries) {
              const watchedFilm = watchedList.find(w => w.film.id === entry.film.id);
              expect(watchedFilm).toBeDefined();
              expect(watchedFilm.rating).toBe(entry.rating);
              expect(watchedFilm.ratedBy).toBe(entry.watchUsername);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when trying to mark non-existent film as watched', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (filmId, rating, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Attempt to mark non-existent film as watched
            expect(() => {
              listService.markAsWatched(filmId, rating, userId, username, '', true);
            }).toThrow('Film not found in shared list');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 34: Rating prompt
   * Validates: Requirements 12.3
   * 
   * For any film being marked as watched, when the action is triggered,
   * the system should prompt for a rating.
   * 
   * Note: This property tests the service layer validation that ensures
   * a rating is required when marking a film as watched.
   */
  describe('Property 34: Rating prompt', () => {
    it('should require a rating when marking film as watched', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Attempt to mark as watched without rating should fail
            expect(() => {
              listService.markAsWatched(film.id, null, watchUserId, watchUsername, '', true);
            }).toThrow();
            
            expect(() => {
              listService.markAsWatched(film.id, undefined, watchUserId, watchUsername, '', true);
            }).toThrow();
            
            // Film should still be in shared list
            expect(listService.getSharedList().length).toBe(1);
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate rating is within valid range (0.5-5)', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          fc.oneof(
            fc.float({ max: Math.fround(0.49), noNaN: true }),
            fc.float({ min: Math.fround(5.01), noNaN: true })
          ),
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, invalidRating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Attempt to mark as watched with invalid rating should fail
            expect(() => {
              listService.markAsWatched(film.id, invalidRating, watchUserId, watchUsername, '', true);
            }).toThrow('Rating must be a number between 0.5 and 5 in 0.5 increments');
            
            // Film should still be in shared list
            expect(listService.getSharedList().length).toBe(1);
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid ratings in range 1-5', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, validRating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Mark as watched with valid rating should succeed
            const watchedFilm = listService.markAsWatched(
              film.id,
              validRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true for this test
            );
            
            expect(watchedFilm).toBeDefined();
            expect(watchedFilm.rating).toBe(validRating);
            
            // Film should be in watched list
            expect(listService.getWatchedList().length).toBe(1);
            expect(listService.getSharedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 35: Watched film rating display
   * Validates: Requirements 12.4
   * 
   * For any watched film, when displayed, the rating given during movie night
   * should be visible.
   */
  describe('Property 35: Watched film rating display', () => {
    it('should store and retrieve rating for watched films', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, rating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Mark as watched with rating
            listService.markAsWatched(film.id, rating, watchUserId, watchUsername, '', true);
            
            // Retrieve watched list
            const watchedList = listService.getWatchedList();
            
            // Rating should be present and correct
            expect(watchedList.length).toBe(1);
            expect(watchedList[0].rating).toBeDefined();
            expect(watchedList[0].rating).toBe(rating);
            expect(typeof watchedList[0].rating).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve rating through storage round-trip', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, rating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true for this test
            );
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Rating should be preserved exactly
            expect(retrieved.rating).toBe(rating);
            expect(retrieved.rating).toBe(watchedFilm.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store different ratings for different films', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films and mark as watched with different ratings
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                '',
                true // isAdmin = true for this test
              );
            }
            
            // Retrieve watched list
            const watchedList = listService.getWatchedList();
            
            // Each film should have its own rating
            for (const entry of entries) {
              const watchedFilm = watchedList.find(w => w.film.id === entry.film.id);
              expect(watchedFilm).toBeDefined();
              expect(watchedFilm.rating).toBe(entry.rating);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 37: Admin-only mark as watched
   * Validates: Requirements 12.8
   * 
   * For any user with isAdmin=false, when attempting to mark a film as watched,
   * the operation should be rejected.
   */
  describe('Property 37: Admin-only mark as watched', () => {
    it('should reject mark as watched attempts by non-admin users', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          usernameArb,
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, nonAdminUsername, nonAdminPassword, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create a non-admin user
            const nonAdminUser = userService.createUser(nonAdminUsername, nonAdminPassword, false);
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Attempt to mark as watched by non-admin should fail
            expect(() => {
              listService.markAsWatched(
                film.id,
                rating,
                nonAdminUser.id,
                nonAdminUser.username,
                review,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to mark films as watched');
            
            // Film should still be in shared list
            expect(listService.getSharedList().length).toBe(1);
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow mark as watched by admin users', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          usernameArb,
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, adminUsername, adminPassword, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create an admin user
            const adminUser = userService.createUser(adminUsername, adminPassword, true);
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Mark as watched by admin should succeed
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              adminUser.id,
              adminUser.username,
              review,
              true // isAdmin = true
            );
            
            expect(watchedFilm).toBeDefined();
            expect(watchedFilm.rating).toBe(rating);
            
            // Film should be in watched list and removed from shared list
            expect(listService.getSharedList().length).toBe(0);
            expect(listService.getWatchedList().length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject when isAdmin parameter is explicitly false', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, rating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Attempt to mark as watched with isAdmin=false should fail
            expect(() => {
              listService.markAsWatched(
                film.id,
                rating,
                watchUserId,
                watchUsername,
                '',
                false
              );
            }).toThrow('Admin privileges required to mark films as watched');
            
            // Film should still be in shared list
            expect(listService.getSharedList().length).toBe(1);
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject when isAdmin parameter is missing or undefined', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, rating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Attempt to mark as watched without isAdmin parameter should fail
            expect(() => {
              listService.markAsWatched(
                film.id,
                rating,
                watchUserId,
                watchUsername
                // no isAdmin parameter
              );
            }).toThrow('Admin privileges required to mark films as watched');
            
            // Film should still be in shared list
            expect(listService.getSharedList().length).toBe(1);
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 36: Watched film metadata display
   * Validates: Requirements 12.5
   * 
   * For any watched film, when displayed, it should show who added the rating
   * and when it was added.
   */
  describe('Property 36: Watched film metadata display', () => {
    it('should store complete metadata for watched films', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, addUserId, addUsername);
            
            // Mark as watched
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true for this test
            );
            
            // Verify metadata is complete
            expect(watchedFilm.ratedBy).toBeDefined();
            expect(watchedFilm.ratedBy).toBe(watchUsername);
            expect(typeof watchedFilm.ratedBy).toBe('string');
            
            expect(watchedFilm.ratedByUserId).toBeDefined();
            expect(watchedFilm.ratedByUserId).toBe(watchUserId);
            
            expect(watchedFilm.watchedAt).toBeDefined();
            expect(typeof watchedFilm.watchedAt).toBe('number');
            expect(watchedFilm.watchedAt).toBeGreaterThan(0);
            expect(watchedFilm.watchedAt).toBeLessThanOrEqual(Date.now());
            
            expect(watchedFilm.review).toBeDefined();
            expect(watchedFilm.review).toBe(review);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retrieve complete metadata from storage', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true for this test
            );
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // All metadata should be preserved
            expect(retrieved.ratedBy).toBe(watchUsername);
            expect(retrieved.ratedByUserId).toBe(watchUserId);
            expect(retrieved.watchedAt).toBe(watchedFilm.watchedAt);
            expect(retrieved.review).toBe(review);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty review gracefully', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          (film, addUserId, addUsername, rating, watchUserId, watchUsername) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched without review
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true for this test
            );
            
            // Review should be empty string
            expect(watchedFilm.review).toBeDefined();
            expect(watchedFilm.review).toBe('');
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            expect(watchedList[0].review).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve metadata for multiple watched films', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb,
              review: fc.string({ maxLength: 200 })
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                entry.review,
                true // isAdmin = true for this test
              );
            }
            
            // Retrieve watched list
            const watchedList = listService.getWatchedList();
            
            // Each film should have its own metadata
            for (const entry of entries) {
              const watchedFilm = watchedList.find(w => w.film.id === entry.film.id);
              expect(watchedFilm).toBeDefined();
              expect(watchedFilm.ratedBy).toBe(entry.watchUsername);
              expect(watchedFilm.ratedByUserId).toBe(entry.watchUserId);
              expect(watchedFilm.watchedAt).toBeDefined();
              expect(watchedFilm.review).toBe(entry.review);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 38: Admin edit rating option availability
   * Validates: Requirements 13.1
   * 
   * For any watched film displayed to an admin, when rendered, an option to edit
   * the rating should be present.
   * 
   * Note: This property tests the service layer that ensures admins can update ratings.
   */
  describe('Property 38: Admin edit rating option availability', () => {
    it('should allow admin to update rating of watched films', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, newRating) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true
            );
            
            // Admin should be able to update rating
            const updatedFilm = listService.updateWatchedRating(
              watchedFilm.id,
              newRating,
              true // isAdmin = true
            );
            
            expect(updatedFilm).toBeDefined();
            expect(updatedFilm.rating).toBe(newRating);
            
            // Verify update persisted to storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            expect(retrieved.rating).toBe(newRating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject rating update by non-admin users', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, newRating) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true
            );
            
            // Non-admin should not be able to update rating
            expect(() => {
              listService.updateWatchedRating(
                watchedFilm.id,
                newRating,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to edit watched films');
            
            // Rating should remain unchanged
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            expect(retrieved.rating).toBe(initialRating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate new rating is within valid range', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.oneof(
            fc.float({ max: Math.fround(0.49), noNaN: true }),
            fc.float({ min: Math.fround(5.01), noNaN: true })
          ),
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, invalidRating) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true
            );
            
            // Attempt to update with invalid rating should fail
            expect(() => {
              listService.updateWatchedRating(
                watchedFilm.id,
                invalidRating,
                true // isAdmin = true
              );
            }).toThrow('Rating must be a number between 0.5 and 5 in 0.5 increments');
            
            // Rating should remain unchanged
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            expect(retrieved.rating).toBe(initialRating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle updating ratings for multiple watched films independently', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              initialRating: halfStarRatingArb,
              newRating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const watchedFilms = [];
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              const watchedFilm = listService.markAsWatched(
                entry.film.id,
                entry.initialRating,
                entry.watchUserId,
                entry.watchUsername,
                '',
                true // isAdmin = true
              );
              watchedFilms.push({ ...entry, watchedId: watchedFilm.id });
            }
            
            // Update each rating
            for (const entry of watchedFilms) {
              listService.updateWatchedRating(
                entry.watchedId,
                entry.newRating,
                true // isAdmin = true
              );
            }
            
            // Verify all ratings were updated correctly
            const watchedList = listService.getWatchedList();
            for (const entry of watchedFilms) {
              const retrieved = watchedList.find(w => w.id === entry.watchedId);
              expect(retrieved.rating).toBe(entry.newRating);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 39: Admin edit review option availability
   * Validates: Requirements 13.2
   * 
   * For any watched film displayed to an admin, when rendered, an option to edit
   * the review should be present.
   * 
   * Note: This property tests the service layer that ensures admins can update reviews.
   */
  describe('Property 39: Admin edit review option availability', () => {
    it('should allow admin to update review of watched films', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Admin should be able to update review
            const updatedFilm = listService.updateWatchedReview(
              watchedFilm.id,
              newReview,
              true // isAdmin = true
            );
            
            expect(updatedFilm).toBeDefined();
            expect(updatedFilm.review).toBe(newReview);
            
            // Verify update persisted to storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            expect(retrieved.review).toBe(newReview);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject review update by non-admin users', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Non-admin should not be able to update review
            expect(() => {
              listService.updateWatchedReview(
                watchedFilm.id,
                newReview,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to edit watched films');
            
            // Review should remain unchanged
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            expect(retrieved.review).toBe(initialReview);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty review updates', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ minLength: 1, maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched with review
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Admin should be able to clear review (set to empty string)
            const updatedFilm = listService.updateWatchedReview(
              watchedFilm.id,
              '',
              true // isAdmin = true
            );
            
            expect(updatedFilm).toBeDefined();
            expect(updatedFilm.review).toBe('');
            
            // Verify update persisted to storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            expect(retrieved.review).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle updating reviews for multiple watched films independently', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              initialReview: fc.string({ maxLength: 200 }),
              newReview: fc.string({ maxLength: 200 }),
              watchUserId: userIdArb,
              watchUsername: usernameArb
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const watchedFilms = [];
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              const watchedFilm = listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                entry.initialReview,
                true // isAdmin = true
              );
              watchedFilms.push({ ...entry, watchedId: watchedFilm.id });
            }
            
            // Update each review
            for (const entry of watchedFilms) {
              listService.updateWatchedReview(
                entry.watchedId,
                entry.newReview,
                true // isAdmin = true
              );
            }
            
            // Verify all reviews were updated correctly
            const watchedList = listService.getWatchedList();
            for (const entry of watchedFilms) {
              const retrieved = watchedList.find(w => w.id === entry.watchedId);
              expect(retrieved.review).toBe(entry.newReview);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 40: Rating update persistence
   * Validates: Requirements 13.3
   * 
   * For any watched film and new rating value, when an admin updates the rating,
   * the stored rating should reflect the new value.
   */
  describe('Property 40: Rating update persistence', () => {
    it('should persist rating updates to storage', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, newRating) => {
            // Skip if ratings are the same
            fc.pre(initialRating !== newRating);
            
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true
            );
            
            // Update rating
            listService.updateWatchedRating(
              watchedFilm.id,
              newRating,
              true // isAdmin = true
            );
            
            // Create new instance of ListService to verify persistence
            const newListService = new ListService(storageManager);
            const watchedList = newListService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Rating should be persisted
            expect(retrieved).toBeDefined();
            expect(retrieved.rating).toBe(newRating);
            expect(retrieved.rating).not.toBe(initialRating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve other fields when updating rating', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          halfStarRatingArb,
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, review, newRating) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // Update rating
            listService.updateWatchedRating(
              watchedFilm.id,
              newRating,
              true // isAdmin = true
            );
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Rating should be updated
            expect(retrieved.rating).toBe(newRating);
            
            // Other fields should remain unchanged
            expect(retrieved.film.id).toBe(film.id);
            expect(retrieved.ratedBy).toBe(watchUsername);
            expect(retrieved.ratedByUserId).toBe(watchUserId);
            expect(retrieved.review).toBe(review);
            expect(retrieved.watchedAt).toBe(watchedFilm.watchedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple rating updates on same film', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.array(halfStarRatingArb, { minLength: 2, maxLength: 5 }),
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, ratingUpdates) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true
            );
            
            // Apply multiple rating updates
            let lastRating = initialRating;
            for (const newRating of ratingUpdates) {
              listService.updateWatchedRating(
                watchedFilm.id,
                newRating,
                true // isAdmin = true
              );
              lastRating = newRating;
            }
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Final rating should be the last update
            expect(retrieved.rating).toBe(lastRating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain list integrity after rating updates', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              initialRating: halfStarRatingArb,
              newRating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const watchedFilms = [];
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              const watchedFilm = listService.markAsWatched(
                entry.film.id,
                entry.initialRating,
                entry.watchUserId,
                entry.watchUsername,
                '',
                true // isAdmin = true
              );
              watchedFilms.push({ ...entry, watchedId: watchedFilm.id });
            }
            
            // Update some ratings
            for (const entry of watchedFilms) {
              listService.updateWatchedRating(
                entry.watchedId,
                entry.newRating,
                true // isAdmin = true
              );
            }
            
            // Verify list integrity
            const watchedList = listService.getWatchedList();
            
            // List should still have same number of entries
            expect(watchedList.length).toBe(entries.length);
            
            // All entries should be present with updated ratings
            for (const entry of watchedFilms) {
              const retrieved = watchedList.find(w => w.id === entry.watchedId);
              expect(retrieved).toBeDefined();
              expect(retrieved.rating).toBe(entry.newRating);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 41: Review update persistence
   * Validates: Requirements 13.4
   * 
   * For any watched film and new review text, when an admin updates the review,
   * the stored review should reflect the new text.
   */
  describe('Property 41: Review update persistence', () => {
    it('should persist review updates to storage', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Update review
            listService.updateWatchedReview(
              watchedFilm.id,
              newReview,
              true // isAdmin = true
            );
            
            // Create new instance of ListService to verify persistence
            const newListService = new ListService(storageManager);
            const watchedList = newListService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Review should be persisted
            expect(retrieved).toBeDefined();
            expect(retrieved.review).toBe(newReview);
            // Only check they're different if they actually are different
            if (initialReview !== newReview) {
              expect(retrieved.review).not.toBe(initialReview);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve other fields when updating review', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Update review
            listService.updateWatchedReview(
              watchedFilm.id,
              newReview,
              true // isAdmin = true
            );
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Review should be updated
            expect(retrieved.review).toBe(newReview);
            
            // Other fields should remain unchanged
            expect(retrieved.film.id).toBe(film.id);
            expect(retrieved.rating).toBe(rating);
            expect(retrieved.ratedBy).toBe(watchUsername);
            expect(retrieved.ratedByUserId).toBe(watchUserId);
            expect(retrieved.watchedAt).toBe(watchedFilm.watchedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple review updates on same film', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          fc.array(fc.string({ maxLength: 200 }), { minLength: 2, maxLength: 5 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview, reviewUpdates) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Apply multiple review updates
            let lastReview = initialReview;
            for (const newReview of reviewUpdates) {
              listService.updateWatchedReview(
                watchedFilm.id,
                newReview,
                true // isAdmin = true
              );
              lastReview = newReview;
            }
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Final review should be the last update
            expect(retrieved.review).toBe(lastReview);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain list integrity after review updates', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              initialReview: fc.string({ maxLength: 200 }),
              newReview: fc.string({ maxLength: 200 }),
              watchUserId: userIdArb,
              watchUsername: usernameArb
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const watchedFilms = [];
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              const watchedFilm = listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                entry.initialReview,
                true // isAdmin = true
              );
              watchedFilms.push({ ...entry, watchedId: watchedFilm.id });
            }
            
            // Update some reviews
            for (const entry of watchedFilms) {
              listService.updateWatchedReview(
                entry.watchedId,
                entry.newReview,
                true // isAdmin = true
              );
            }
            
            // Verify list integrity
            const watchedList = listService.getWatchedList();
            
            // List should still have same number of entries
            expect(watchedList.length).toBe(entries.length);
            
            // All entries should be present with updated reviews
            for (const entry of watchedFilms) {
              const retrieved = watchedList.find(w => w.id === entry.watchedId);
              expect(retrieved).toBeDefined();
              expect(retrieved.review).toBe(entry.newReview);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle clearing reviews (setting to empty string)', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ minLength: 1, maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched with review
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Clear review
            listService.updateWatchedReview(
              watchedFilm.id,
              '',
              true // isAdmin = true
            );
            
            // Retrieve from storage
            const watchedList = listService.getWatchedList();
            const retrieved = watchedList.find(w => w.id === watchedFilm.id);
            
            // Review should be empty
            expect(retrieved.review).toBe('');
            
            // Other fields should remain unchanged
            expect(retrieved.rating).toBe(rating);
            expect(retrieved.ratedBy).toBe(watchUsername);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 42: Admin remove option availability
   * Validates: Requirements 13.5
   * 
   * For any watched film displayed to an admin, when rendered, an option to remove
   * it from the watched list should be present.
   * 
   * Note: This property tests the service layer that ensures admins can remove watched films.
   */
  describe('Property 42: Admin remove option availability', () => {
    it('should allow admin to remove watched films', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // Verify film is in watched list
            expect(listService.getWatchedList().length).toBe(1);
            
            // Admin should be able to remove watched film
            const result = listService.removeFromWatched(
              watchedFilm.id,
              true // isAdmin = true
            );
            
            expect(result).toBe(true);
            
            // Verify film is removed from watched list
            const watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(0);
            expect(watchedList.find(w => w.id === watchedFilm.id)).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject removal by non-admin users', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // Non-admin should not be able to remove watched film
            expect(() => {
              listService.removeFromWatched(
                watchedFilm.id,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to edit watched films');
            
            // Film should still be in watched list
            const watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(1);
            expect(watchedList.find(w => w.id === watchedFilm.id)).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removing multiple watched films independently', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb,
              review: fc.string({ maxLength: 200 })
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const watchedFilms = [];
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              const watchedFilm = listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                entry.review,
                true // isAdmin = true
              );
              watchedFilms.push({ ...entry, watchedId: watchedFilm.id });
            }
            
            // Verify all films are in watched list
            expect(listService.getWatchedList().length).toBe(entries.length);
            
            // Remove each film one by one
            for (let i = 0; i < watchedFilms.length; i++) {
              listService.removeFromWatched(
                watchedFilms[i].watchedId,
                true // isAdmin = true
              );
              
              // Verify count decreases
              expect(listService.getWatchedList().length).toBe(entries.length - i - 1);
            }
            
            // All films should be removed
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when trying to remove non-existent watched film', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }),
          (nonExistentId) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Attempt to remove non-existent watched film should fail
            expect(() => {
              listService.removeFromWatched(nonExistentId, true);
            }).toThrow('Watched film not found');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 43: Watched film removal completeness
   * Validates: Requirements 13.6
   * 
   * For any watched film, when an admin removes it, the film should no longer
   * exist in the watched list.
   */
  describe('Property 43: Watched film removal completeness', () => {
    it('should completely remove watched film from storage', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // Remove watched film
            listService.removeFromWatched(watchedFilm.id, true);
            
            // Create new instance of ListService to verify persistence
            const newListService = new ListService(storageManager);
            const watchedList = newListService.getWatchedList();
            
            // Film should not exist in watched list
            expect(watchedList.find(w => w.id === watchedFilm.id)).toBeUndefined();
            expect(watchedList.find(w => w.film.id === film.id)).toBeUndefined();
            expect(watchedList.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only remove specified film and preserve others', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              addUserId: userIdArb,
              addUsername: usernameArb,
              rating: halfStarRatingArb,
              watchUserId: userIdArb,
              watchUsername: usernameArb,
              review: fc.string({ maxLength: 200 })
            }),
            { minLength: 3, maxLength: 5, selector: (item) => item.film.id }
          ),
          fc.integer({ min: 0, max: 2 }),
          (entries, removeIndex) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const watchedFilms = [];
            
            // Add all films and mark as watched
            for (const entry of entries) {
              listService.addFilmToList(entry.film, entry.addUserId, entry.addUsername);
              const watchedFilm = listService.markAsWatched(
                entry.film.id,
                entry.rating,
                entry.watchUserId,
                entry.watchUsername,
                entry.review,
                true // isAdmin = true
              );
              watchedFilms.push({ ...entry, watchedId: watchedFilm.id });
            }
            
            // Remove one specific film
            const filmToRemove = watchedFilms[removeIndex % watchedFilms.length];
            listService.removeFromWatched(filmToRemove.watchedId, true);
            
            // Verify only that film was removed
            const watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(entries.length - 1);
            expect(watchedList.find(w => w.id === filmToRemove.watchedId)).toBeUndefined();
            
            // Verify other films are still present
            for (let i = 0; i < watchedFilms.length; i++) {
              if (i !== removeIndex % watchedFilms.length) {
                const film = watchedFilms[i];
                const found = watchedList.find(w => w.id === film.watchedId);
                expect(found).toBeDefined();
                expect(found.film.id).toBe(film.film.id);
                expect(found.rating).toBe(film.rating);
                expect(found.review).toBe(film.review);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow re-adding film after removal', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          halfStarRatingArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating1, watchUserId, watchUsername, review1, rating2, review2) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm1 = listService.markAsWatched(
              film.id,
              rating1,
              watchUserId,
              watchUsername,
              review1,
              true // isAdmin = true
            );
            
            // Remove from watched list
            listService.removeFromWatched(watchedFilm1.id, true);
            
            // Film should not be in watched list
            expect(listService.getWatchedList().length).toBe(0);
            
            // Add film back to shared list and mark as watched again
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm2 = listService.markAsWatched(
              film.id,
              rating2,
              watchUserId,
              watchUsername,
              review2,
              true // isAdmin = true
            );
            
            // Film should be in watched list with new data
            const watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(1);
            expect(watchedList[0].id).toBe(watchedFilm2.id);
            expect(watchedList[0].id).not.toBe(watchedFilm1.id); // Different entry ID
            expect(watchedList[0].rating).toBe(rating2);
            expect(watchedList[0].review).toBe(review2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removal from empty list gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }),
          (watchedId) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Attempt to remove from empty list should fail
            expect(() => {
              listService.removeFromWatched(watchedId, true);
            }).toThrow('Watched film not found');
            
            // List should remain empty
            expect(listService.getWatchedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 44: Non-admin edit prevention
   * Validates: Requirements 13.7
   * 
   * For any user with isAdmin=false, when attempting to edit or remove watched films,
   * the operations should be rejected.
   */
  describe('Property 44: Non-admin edit prevention', () => {
    it('should prevent non-admin from updating rating', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          (film, addUserId, addUsername, initialRating, watchUserId, watchUsername, newRating) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              initialRating,
              watchUserId,
              watchUsername,
              '',
              true // isAdmin = true
            );
            
            // Non-admin should not be able to update rating
            expect(() => {
              listService.updateWatchedRating(
                watchedFilm.id,
                newRating,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to edit watched films');
            
            // Rating should remain unchanged
            const watchedList = listService.getWatchedList();
            expect(watchedList[0].rating).toBe(initialRating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent non-admin from updating review', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, initialReview, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              initialReview,
              true // isAdmin = true
            );
            
            // Non-admin should not be able to update review
            expect(() => {
              listService.updateWatchedReview(
                watchedFilm.id,
                newReview,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to edit watched films');
            
            // Review should remain unchanged
            const watchedList = listService.getWatchedList();
            expect(watchedList[0].review).toBe(initialReview);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent non-admin from removing watched films', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // Non-admin should not be able to remove watched film
            expect(() => {
              listService.removeFromWatched(
                watchedFilm.id,
                false // isAdmin = false
              );
            }).toThrow('Admin privileges required to edit watched films');
            
            // Film should still be in watched list
            const watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(1);
            expect(watchedList[0].id).toBe(watchedFilm.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent all edit operations when isAdmin is undefined', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          halfStarRatingArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review, newRating, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // All operations should fail without isAdmin parameter
            expect(() => {
              listService.updateWatchedRating(watchedFilm.id, newRating);
            }).toThrow('Admin privileges required to edit watched films');
            
            expect(() => {
              listService.updateWatchedReview(watchedFilm.id, newReview);
            }).toThrow('Admin privileges required to edit watched films');
            
            expect(() => {
              listService.removeFromWatched(watchedFilm.id);
            }).toThrow('Admin privileges required to edit watched films');
            
            // Film should remain unchanged
            const watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(1);
            expect(watchedList[0].rating).toBe(rating);
            expect(watchedList[0].review).toBe(review);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow admin operations when isAdmin is explicitly true', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          halfStarRatingArb,
          userIdArb,
          usernameArb,
          fc.string({ maxLength: 200 }),
          halfStarRatingArb,
          fc.string({ maxLength: 200 }),
          (film, addUserId, addUsername, rating, watchUserId, watchUsername, review, newRating, newReview) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film and mark as watched
            listService.addFilmToList(film, addUserId, addUsername);
            const watchedFilm = listService.markAsWatched(
              film.id,
              rating,
              watchUserId,
              watchUsername,
              review,
              true // isAdmin = true
            );
            
            // All operations should succeed with isAdmin=true
            listService.updateWatchedRating(watchedFilm.id, newRating, true);
            listService.updateWatchedReview(watchedFilm.id, newReview, true);
            
            // Verify updates
            let watchedList = listService.getWatchedList();
            expect(watchedList[0].rating).toBe(newRating);
            expect(watchedList[0].review).toBe(newReview);
            
            // Remove should also succeed
            listService.removeFromWatched(watchedFilm.id, true);
            
            // Film should be removed
            watchedList = listService.getWatchedList();
            expect(watchedList.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});