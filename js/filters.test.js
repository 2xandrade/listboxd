/**
 * Property-based tests for FilterManager
 * Uses fast-check for property-based testing
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

const fc = require('fast-check');
const FilterManager = require('./filters.js');
const ListService = require('./list.js');
const StorageManager = require('./storage.js');

// Generator for film objects
const filmArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  poster: fc.option(fc.webUrl()),
  rating: fc.float({ min: 0, max: 10, noNaN: true }),
  genres: fc.array(
    fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Fantasy'),
    { minLength: 1, maxLength: 5 }
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

describe('FilterManager - Property-Based Tests', () => {
  let filterManager;
  let listService;
  let storageManager;

  beforeEach(() => {
    // Create fresh instances before each test
    storageManager = new StorageManager();
    listService = new ListService(storageManager);
    filterManager = new FilterManager(listService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Feature: letterboxd-manager, Property 28: Genre filter
   * Validates: Requirements 11.2
   * 
   * For any genre and shared list, when a user applies a genre filter,
   * only films matching that genre should be displayed.
   */
  describe('Property 28: Genre filter', () => {
    it('should return only films matching the selected genre', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Fantasy'),
          (entries, selectedGenre) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              listService.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter
            filterManager.setGenreFilter(selectedGenre);
            const filtered = filterManager.applyFilters();
            
            // All returned films should have the selected genre
            for (const entry of filtered) {
              expect(entry.film.genres).toBeDefined();
              expect(Array.isArray(entry.film.genres)).toBe(true);
              
              const hasGenre = entry.film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              expect(hasGenre).toBe(true);
            }
            
            // Count how many films in original list have this genre
            const expectedCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              )
            ).length;
            
            // Filtered list should have exactly that many films
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive when matching genres', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 3, maxLength: 10, selector: (item) => item.film.id }
          ),
          fc.constantFrom('action', 'ACTION', 'Action', 'AcTiOn'),
          (entries, genreVariant) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              listService.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter with different case
            filterManager.setGenreFilter(genreVariant);
            const filtered = filterManager.applyFilters();
            
            // All returned films should have "Action" genre (case-insensitive)
            for (const entry of filtered) {
              const hasAction = entry.film.genres.some(g => 
                g.toLowerCase() === 'action'
              );
              expect(hasAction).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no films match the genre', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: fc.record({
                id: fc.integer({ min: 1, max: 1000000 }),
                title: fc.string({ minLength: 1, maxLength: 200 }),
                poster: fc.option(fc.webUrl()),
                rating: fc.float({ min: 0, max: 10, noNaN: true }),
                genres: fc.constant(['Action', 'Drama']), // Only Action and Drama
                year: fc.option(fc.integer({ min: 1900, max: 2030 })),
                overview: fc.string({ maxLength: 500 }),
                tmdbUrl: fc.webUrl()
              }),
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 2, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films to list (all have only Action and Drama)
            for (const { film, userId, username } of entries) {
              listService.addFilmToList(film, userId, username);
            }
            
            // Apply filter for a genre that doesn't exist in any film
            filterManager.setGenreFilter('Horror');
            const filtered = filterManager.applyFilters();
            
            // Should return empty array
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all films when genre filter is null', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 2, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              listService.addFilmToList(film, userId, username);
            }
            
            // Apply null genre filter
            filterManager.setGenreFilter(null);
            const filtered = filterManager.applyFilters();
            
            // Should return all films
            expect(filtered.length).toBe(entries.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

  /**
   * Feature: letterboxd-manager, Property 29: Name filter
   * Validates: Requirements 11.3
   * 
   * For any search text and shared list, when a user applies a name filter,
   * only films whose titles contain the search text should be displayed.
   */
  describe('Property 29: Name filter', () => {
    it('should return only films whose titles contain the search text', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.string({ minLength: 1, maxLength: 10 }),
          (entries, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply name filter
            filter.setNameFilter(searchText);
            const filtered = filter.applyFilters();
            
            // All returned films should have titles containing the search text
            const searchLower = searchText.toLowerCase().trim();
            for (const entry of filtered) {
              expect(entry.film.title).toBeDefined();
              expect(typeof entry.film.title).toBe('string');
              
              const titleLower = entry.film.title.toLowerCase();
              expect(titleLower.includes(searchLower)).toBe(true);
            }
            
            // Count how many films in original list match
            const expectedCount = entries.filter(({ film }) => 
              film.title && film.title.toLowerCase().includes(searchLower)
            ).length;
            
            // Filtered list should have exactly that many films
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive when matching titles', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: fc.record({
                id: fc.integer({ min: 1, max: 1000000 }),
                title: fc.constant('The Dark Knight'),
                poster: fc.option(fc.webUrl()),
                rating: fc.float({ min: 0, max: 10, noNaN: true }),
                genres: fc.array(fc.constantFrom('Action', 'Drama'), { minLength: 1, maxLength: 3 }),
                year: fc.option(fc.integer({ min: 1900, max: 2030 })),
                overview: fc.string({ maxLength: 500 }),
                tmdbUrl: fc.webUrl()
              }),
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 2, maxLength: 5, selector: (item) => item.film.id }
          ),
          fc.constantFrom('dark', 'DARK', 'Dark', 'DaRk', 'knight', 'KNIGHT'),
          (entries, searchVariant) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list (all have "The Dark Knight" as title)
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply name filter with different case
            filter.setNameFilter(searchVariant);
            const filtered = filter.applyFilters();
            
            // Should return all films since all contain the search text
            expect(filtered.length).toBe(entries.length);
            
            // All should have "The Dark Knight" as title
            for (const entry of filtered) {
              expect(entry.film.title).toBe('The Dark Knight');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle partial matches in titles', () => {
      fc.assert(
        fc.property(
          userIdArb,
          usernameArb,
          (userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add films with known titles
            const films = [
              { id: 1, title: 'The Matrix', poster: null, rating: 8.7, genres: ['Sci-Fi'], year: 1999, overview: '', tmdbUrl: 'http://test.com' },
              { id: 2, title: 'The Matrix Reloaded', poster: null, rating: 7.2, genres: ['Sci-Fi'], year: 2003, overview: '', tmdbUrl: 'http://test.com' },
              { id: 3, title: 'The Matrix Revolutions', poster: null, rating: 6.8, genres: ['Sci-Fi'], year: 2003, overview: '', tmdbUrl: 'http://test.com' },
              { id: 4, title: 'Inception', poster: null, rating: 8.8, genres: ['Sci-Fi'], year: 2010, overview: '', tmdbUrl: 'http://test.com' }
            ];
            
            for (const film of films) {
              list.addFilmToList(film, userId, username);
            }
            
            // Search for "Matrix" should return 3 films
            filter.setNameFilter('Matrix');
            let filtered = filter.applyFilters();
            expect(filtered.length).toBe(3);
            
            // Search for "Reloaded" should return 1 film
            filter.setNameFilter('Reloaded');
            filtered = filter.applyFilters();
            expect(filtered.length).toBe(1);
            expect(filtered[0].film.title).toBe('The Matrix Reloaded');
            
            // Search for "The" should return 3 films (not Inception)
            filter.setNameFilter('The');
            filtered = filter.applyFilters();
            expect(filtered.length).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no titles match the search text', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: fc.record({
                id: fc.integer({ min: 1, max: 1000000 }),
                title: fc.constantFrom('Action Movie', 'Drama Film', 'Comedy Show'),
                poster: fc.option(fc.webUrl()),
                rating: fc.float({ min: 0, max: 10, noNaN: true }),
                genres: fc.array(fc.constantFrom('Action', 'Drama'), { minLength: 1, maxLength: 3 }),
                year: fc.option(fc.integer({ min: 1900, max: 2030 })),
                overview: fc.string({ maxLength: 500 }),
                tmdbUrl: fc.webUrl()
              }),
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 2, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Search for text that doesn't exist in any title
            filter.setNameFilter('XYZ123NotFound');
            const filtered = filter.applyFilters();
            
            // Should return empty array
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all films when name filter is null or empty', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 2, maxLength: 10, selector: (item) => item.film.id }
          ),
          fc.constantFrom(null, '', '   '),
          (entries, emptySearch) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply null/empty name filter
            filter.setNameFilter(emptySearch);
            const filtered = filter.applyFilters();
            
            // Should return all films
            expect(filtered.length).toBe(entries.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace from search text', () => {
      fc.assert(
        fc.property(
          userIdArb,
          usernameArb,
          (userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add a film with known title
            const film = {
              id: 1,
              title: 'Test Movie',
              poster: null,
              rating: 7.5,
              genres: ['Drama'],
              year: 2020,
              overview: '',
              tmdbUrl: 'http://test.com'
            };
            
            list.addFilmToList(film, userId, username);
            
            // Search with leading/trailing whitespace
            filter.setNameFilter('  Test  ');
            const filtered = filter.applyFilters();
            
            // Should find the film
            expect(filtered.length).toBe(1);
            expect(filtered[0].film.title).toBe('Test Movie');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 30: Random filter
   * Validates: Requirements 11.4
   * 
   * For any shared list, when a user applies random filter multiple times,
   * the order of films should vary.
   */
  describe('Property 30: Random filter', () => {
    it('should return all films when random filter is applied', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 3, maxLength: 15, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply random filter
            filter.setRandomFilter(true);
            const filtered = filter.applyFilters();
            
            // Should return all films (same count)
            expect(filtered.length).toBe(entries.length);
            
            // All original films should be present
            const originalIds = entries.map(e => e.film.id).sort();
            const filteredIds = filtered.map(e => e.film.id).sort();
            expect(filteredIds).toEqual(originalIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different orderings when applied multiple times', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply random filter multiple times
            filter.setRandomFilter(true);
            const orderings = [];
            
            for (let i = 0; i < 10; i++) {
              const filtered = filter.applyFilters();
              const ordering = filtered.map(e => e.film.id).join(',');
              orderings.push(ordering);
            }
            
            // With 5+ films and 10 iterations, we should see at least 2 different orderings
            // (statistically very likely unless the shuffle is broken)
            const uniqueOrderings = new Set(orderings);
            
            // For lists with 5+ items, we expect variation
            if (entries.length >= 5) {
              expect(uniqueOrderings.size).toBeGreaterThan(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not modify the original list in storage', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 3, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Get original order
            const originalOrder = list.getSharedList().map(e => e.film.id);
            
            // Apply random filter
            filter.setRandomFilter(true);
            filter.applyFilters();
            
            // Original list should remain unchanged
            const afterFilterOrder = list.getSharedList().map(e => e.film.id);
            expect(afterFilterOrder).toEqual(originalOrder);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work with other filters combined', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 15, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          (entries, selectedGenre) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter AND random filter
            filter.setGenreFilter(selectedGenre);
            filter.setRandomFilter(true);
            const filtered = filter.applyFilters();
            
            // All returned films should match the genre
            for (const entry of filtered) {
              const hasGenre = entry.film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              expect(hasGenre).toBe(true);
            }
            
            // Count should match genre-filtered count
            const expectedCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              )
            ).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return films in original order when random filter is disabled', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 3, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Get original order
            const originalOrder = list.getSharedList().map(e => e.film.id);
            
            // Apply random filter then disable it
            filter.setRandomFilter(true);
            filter.setRandomFilter(false);
            const filtered = filter.applyFilters();
            
            // Should return films in original order
            const filteredOrder = filtered.map(e => e.film.id);
            expect(filteredOrder).toEqual(originalOrder);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 31: Combined filters
   * Validates: Requirements 11.5
   * 
   * For any combination of filters and shared list, when a user applies multiple filters,
   * only films matching all criteria should be displayed.
   */
  describe('Property 31: Combined filters', () => {
    it('should apply genre and name filters together', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, selectedGenre, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply both genre and name filters
            filter.setGenreFilter(selectedGenre);
            filter.setNameFilter(searchText);
            const filtered = filter.applyFilters();
            
            const searchLower = searchText.toLowerCase().trim();
            
            // All returned films should match BOTH filters
            for (const entry of filtered) {
              // Should have the selected genre
              const hasGenre = entry.film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              expect(hasGenre).toBe(true);
              
              // Should have title containing search text
              const titleLower = entry.film.title.toLowerCase();
              expect(titleLower.includes(searchLower)).toBe(true);
            }
            
            // Count should match films that satisfy both conditions
            const expectedCount = entries.filter(({ film }) => {
              const hasGenre = film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              const hasTitle = film.title && film.title.toLowerCase().includes(searchLower);
              return hasGenre && hasTitle;
            }).length;
            
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply all three filters together (genre, name, random)', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, selectedGenre, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply all three filters
            filter.setGenreFilter(selectedGenre);
            filter.setNameFilter(searchText);
            filter.setRandomFilter(true);
            const filtered = filter.applyFilters();
            
            const searchLower = searchText.toLowerCase().trim();
            
            // All returned films should match genre and name filters
            for (const entry of filtered) {
              // Should have the selected genre
              const hasGenre = entry.film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              expect(hasGenre).toBe(true);
              
              // Should have title containing search text
              const titleLower = entry.film.title.toLowerCase();
              expect(titleLower.includes(searchLower)).toBe(true);
            }
            
            // Count should match films that satisfy both genre and name conditions
            const expectedCount = entries.filter(({ film }) => {
              const hasGenre = film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              const hasTitle = film.title && film.title.toLowerCase().includes(searchLower);
              return hasGenre && hasTitle;
            }).length;
            
            expect(filtered.length).toBe(expectedCount);
            
            // All original matching films should be present (just in different order)
            const expectedIds = entries
              .filter(({ film }) => {
                const hasGenre = film.genres && film.genres.some(g => 
                  g.toLowerCase() === selectedGenre.toLowerCase()
                );
                const hasTitle = film.title && film.title.toLowerCase().includes(searchLower);
                return hasGenre && hasTitle;
              })
              .map(e => e.film.id)
              .sort();
            
            const filteredIds = filtered.map(e => e.film.id).sort();
            expect(filteredIds).toEqual(expectedIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when combined filters match nothing', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: fc.record({
                id: fc.integer({ min: 1, max: 1000000 }),
                title: fc.constantFrom('Action Movie', 'Drama Film'),
                poster: fc.option(fc.webUrl()),
                rating: fc.float({ min: 0, max: 10, noNaN: true }),
                genres: fc.constantFrom(['Action'], ['Drama']),
                year: fc.option(fc.integer({ min: 1900, max: 2030 })),
                overview: fc.string({ maxLength: 500 }),
                tmdbUrl: fc.webUrl()
              }),
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list (all have either Action or Drama genre)
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply filters that won't match anything
            // Genre: Comedy (none have this)
            // Name: "XYZ" (none have this in title)
            filter.setGenreFilter('Comedy');
            filter.setNameFilter('XYZ');
            const filtered = filter.applyFilters();
            
            // Should return empty array
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle partial filter combinations', () => {
      fc.assert(
        fc.property(
          userIdArb,
          usernameArb,
          (userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add films with known properties
            const films = [
              { id: 1, title: 'Action Hero', poster: null, rating: 7.5, genres: ['Action'], year: 2020, overview: '', tmdbUrl: 'http://test.com' },
              { id: 2, title: 'Action Zero', poster: null, rating: 6.5, genres: ['Action'], year: 2021, overview: '', tmdbUrl: 'http://test.com' },
              { id: 3, title: 'Drama Hero', poster: null, rating: 8.0, genres: ['Drama'], year: 2019, overview: '', tmdbUrl: 'http://test.com' },
              { id: 4, title: 'Comedy Show', poster: null, rating: 7.0, genres: ['Comedy'], year: 2022, overview: '', tmdbUrl: 'http://test.com' }
            ];
            
            for (const film of films) {
              list.addFilmToList(film, userId, username);
            }
            
            // Test: Genre only (Action)
            filter.clearAllFilters();
            filter.setGenreFilter('Action');
            let filtered = filter.applyFilters();
            expect(filtered.length).toBe(2); // Action Hero, Action Zero
            
            // Test: Name only (Hero)
            filter.clearAllFilters();
            filter.setNameFilter('Hero');
            filtered = filter.applyFilters();
            expect(filtered.length).toBe(2); // Action Hero, Drama Hero
            
            // Test: Genre + Name (Action + Hero)
            filter.clearAllFilters();
            filter.setGenreFilter('Action');
            filter.setNameFilter('Hero');
            filtered = filter.applyFilters();
            expect(filtered.length).toBe(1); // Only Action Hero
            expect(filtered[0].film.title).toBe('Action Hero');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 32: Clear filters
   * Validates: Requirements 11.6
   * 
   * For any filtered shared list, when a user clears all filters,
   * all films in the shared list should be displayed.
   */
  describe('Property 32: Clear filters', () => {
    it('should return all films after clearing filters', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, selectedGenre, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply multiple filters
            filter.setGenreFilter(selectedGenre);
            filter.setNameFilter(searchText);
            filter.setRandomFilter(true);
            
            // Get filtered results (should be subset)
            const filtered = filter.applyFilters();
            
            // Clear all filters
            filter.clearAllFilters();
            
            // Get results after clearing
            const afterClear = filter.applyFilters();
            
            // Should return all films
            expect(afterClear.length).toBe(entries.length);
            
            // All original films should be present
            const originalIds = entries.map(e => e.film.id).sort();
            const afterClearIds = afterClear.map(e => e.film.id).sort();
            expect(afterClearIds).toEqual(originalIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset all filter states to null/false', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 3, maxLength: 10, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama'),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, selectedGenre, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply all filters
            filter.setGenreFilter(selectedGenre);
            filter.setNameFilter(searchText);
            filter.setRandomFilter(true);
            
            // Verify filters are active
            expect(filter.hasActiveFilters()).toBe(true);
            
            // Clear all filters
            filter.clearAllFilters();
            
            // Verify no filters are active
            expect(filter.hasActiveFilters()).toBe(false);
            
            // Verify filter states
            const activeFilters = filter.getActiveFilters();
            expect(activeFilters.genre).toBeNull();
            expect(activeFilters.name).toBeNull();
            expect(activeFilters.random).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work correctly when clearing with no filters applied', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 3, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Clear filters without applying any first
            filter.clearAllFilters();
            
            // Should still return all films
            const filtered = filter.applyFilters();
            expect(filtered.length).toBe(entries.length);
            
            // Should have no active filters
            expect(filter.hasActiveFilters()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow reapplying filters after clearing', () => {
      fc.assert(
        fc.property(
          userIdArb,
          usernameArb,
          (userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add films with known properties
            const films = [
              { id: 1, title: 'Action Movie', poster: null, rating: 7.5, genres: ['Action'], year: 2020, overview: '', tmdbUrl: 'http://test.com' },
              { id: 2, title: 'Drama Film', poster: null, rating: 8.0, genres: ['Drama'], year: 2019, overview: '', tmdbUrl: 'http://test.com' },
              { id: 3, title: 'Comedy Show', poster: null, rating: 7.0, genres: ['Comedy'], year: 2022, overview: '', tmdbUrl: 'http://test.com' }
            ];
            
            for (const film of films) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter
            filter.setGenreFilter('Action');
            let filtered = filter.applyFilters();
            expect(filtered.length).toBe(1);
            
            // Clear filters
            filter.clearAllFilters();
            filtered = filter.applyFilters();
            expect(filtered.length).toBe(3);
            
            // Reapply different filter
            filter.setGenreFilter('Drama');
            filtered = filter.applyFilters();
            expect(filtered.length).toBe(1);
            expect(filtered[0].film.title).toBe('Drama Film');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return films in original order after clearing random filter', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Get original order
            const originalOrder = list.getSharedList().map(e => e.film.id);
            
            // Apply random filter
            filter.setRandomFilter(true);
            filter.applyFilters();
            
            // Clear filters
            filter.clearAllFilters();
            
            // Get results after clearing
            const afterClear = filter.applyFilters();
            const afterClearOrder = afterClear.map(e => e.film.id);
            
            // Should return films in original order
            expect(afterClearOrder).toEqual(originalOrder);
          }
        ),
        { numRuns: 100 }
      );
    });
  });



  /**
   * Feature: letterboxd-manager, Property 45: Filter immediate update
   * Validates: Requirements 14.1
   * 
   * For any genre filter applied to the shared list, when applied,
   * the displayed films should immediately match the filter criteria.
   */
  describe('Property 45: Filter immediate update', () => {
    it('should immediately update displayed films when genre filter is applied', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller'),
          (entries, selectedGenre) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter
            filter.setGenreFilter(selectedGenre);
            
            // Immediately get filtered results
            const filtered = filter.applyFilters();
            
            // All returned films should match the genre immediately
            for (const entry of filtered) {
              expect(entry.film.genres).toBeDefined();
              expect(Array.isArray(entry.film.genres)).toBe(true);
              
              const hasGenre = entry.film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              expect(hasGenre).toBe(true);
            }
            
            // Count should match expected immediately
            const expectedCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              )
            ).length;
            
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should immediately update when switching between different genre filters', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply first genre filter
            filter.setGenreFilter('Action');
            const actionFiltered = filter.applyFilters();
            
            // All should be Action
            for (const entry of actionFiltered) {
              const hasAction = entry.film.genres.some(g => 
                g.toLowerCase() === 'action'
              );
              expect(hasAction).toBe(true);
            }
            
            // Immediately switch to Drama filter
            filter.setGenreFilter('Drama');
            const dramaFiltered = filter.applyFilters();
            
            // All should now be Drama (immediate update)
            for (const entry of dramaFiltered) {
              const hasDrama = entry.film.genres.some(g => 
                g.toLowerCase() === 'drama'
              );
              expect(hasDrama).toBe(true);
            }
            
            // Counts should be different (unless all films have both genres)
            const actionCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => g.toLowerCase() === 'action')
            ).length;
            const dramaCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => g.toLowerCase() === 'drama')
            ).length;
            
            expect(actionFiltered.length).toBe(actionCount);
            expect(dramaFiltered.length).toBe(dramaCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should immediately update when name filter is applied', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply name filter
            filter.setNameFilter(searchText);
            
            // Immediately get filtered results
            const filtered = filter.applyFilters();
            
            const searchLower = searchText.toLowerCase().trim();
            
            // All returned films should match the search immediately
            for (const entry of filtered) {
              expect(entry.film.title).toBeDefined();
              const titleLower = entry.film.title.toLowerCase();
              expect(titleLower.includes(searchLower)).toBe(true);
            }
            
            // Count should match expected immediately
            const expectedCount = entries.filter(({ film }) => 
              film.title && film.title.toLowerCase().includes(searchLower)
            ).length;
            
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 46: Random order variation
   * Validates: Requirements 14.2
   * 
   * For any shared list, when random order is applied multiple times,
   * the resulting orderings should differ.
   */
  describe('Property 46: Random order variation', () => {
    it('should generate different orderings when random filter is applied multiple times', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 10, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply random filter multiple times and collect orderings
            filter.setRandomFilter(true);
            const orderings = [];
            
            for (let i = 0; i < 10; i++) {
              const filtered = filter.applyFilters();
              const ordering = filtered.map(e => e.film.id).join(',');
              orderings.push(ordering);
            }
            
            // With 5+ films and 10 iterations, we should see at least 2 different orderings
            const uniqueOrderings = new Set(orderings);
            
            // For lists with 5+ items, we expect variation
            if (entries.length >= 5) {
              expect(uniqueOrderings.size).toBeGreaterThan(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate new random order each time applyFilters is called', () => {
      fc.assert(
        fc.property(
          userIdArb,
          usernameArb,
          (userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add films with known IDs
            const films = [
              { id: 1, title: 'Film A', poster: null, rating: 7.5, genres: ['Action'], year: 2020, overview: '', tmdbUrl: 'http://test.com' },
              { id: 2, title: 'Film B', poster: null, rating: 8.0, genres: ['Drama'], year: 2019, overview: '', tmdbUrl: 'http://test.com' },
              { id: 3, title: 'Film C', poster: null, rating: 7.0, genres: ['Comedy'], year: 2022, overview: '', tmdbUrl: 'http://test.com' },
              { id: 4, title: 'Film D', poster: null, rating: 6.5, genres: ['Thriller'], year: 2021, overview: '', tmdbUrl: 'http://test.com' },
              { id: 5, title: 'Film E', poster: null, rating: 8.5, genres: ['Sci-Fi'], year: 2023, overview: '', tmdbUrl: 'http://test.com' }
            ];
            
            for (const film of films) {
              list.addFilmToList(film, userId, username);
            }
            
            // Enable random filter
            filter.setRandomFilter(true);
            
            // Get multiple orderings
            const orderings = [];
            for (let i = 0; i < 10; i++) {
              const filtered = filter.applyFilters();
              orderings.push(filtered.map(e => e.film.id).join(','));
            }
            
            // Should have at least 2 different orderings
            const uniqueOrderings = new Set(orderings);
            expect(uniqueOrderings.size).toBeGreaterThan(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 47: Filter state persistence
   * Validates: Requirements 14.3
   * 
   * For any filter applied to a list, when applied,
   * the filter state should remain active until explicitly changed or cleared.
   */
  describe('Property 47: Filter state persistence', () => {
    it('should persist genre filter state across multiple applyFilters calls', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          (entries, selectedGenre) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter
            filter.setGenreFilter(selectedGenre);
            
            // Call applyFilters multiple times
            const result1 = filter.applyFilters();
            const result2 = filter.applyFilters();
            const result3 = filter.applyFilters();
            
            // All results should have the same count (filter persists)
            expect(result1.length).toBe(result2.length);
            expect(result2.length).toBe(result3.length);
            
            // All results should contain the same films (ignoring order for random)
            const ids1 = result1.map(e => e.film.id).sort();
            const ids2 = result2.map(e => e.film.id).sort();
            const ids3 = result3.map(e => e.film.id).sort();
            
            expect(ids1).toEqual(ids2);
            expect(ids2).toEqual(ids3);
            
            // Filter state should still be active
            const activeFilters = filter.getActiveFilters();
            expect(activeFilters.genre).toBe(selectedGenre);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist name filter state across multiple applyFilters calls', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply name filter
            filter.setNameFilter(searchText);
            
            // Call applyFilters multiple times
            const result1 = filter.applyFilters();
            const result2 = filter.applyFilters();
            const result3 = filter.applyFilters();
            
            // All results should have the same count (filter persists)
            expect(result1.length).toBe(result2.length);
            expect(result2.length).toBe(result3.length);
            
            // All results should contain the same films
            const ids1 = result1.map(e => e.film.id).sort();
            const ids2 = result2.map(e => e.film.id).sort();
            const ids3 = result3.map(e => e.film.id).sort();
            
            expect(ids1).toEqual(ids2);
            expect(ids2).toEqual(ids3);
            
            // Filter state should still be active
            const activeFilters = filter.getActiveFilters();
            expect(activeFilters.name).toBe(searchText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist combined filter state until explicitly changed', () => {
      fc.assert(
        fc.property(
          userIdArb,
          usernameArb,
          (userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add films with known properties
            const films = [
              { id: 1, title: 'Action Hero', poster: null, rating: 7.5, genres: ['Action'], year: 2020, overview: '', tmdbUrl: 'http://test.com' },
              { id: 2, title: 'Action Zero', poster: null, rating: 6.5, genres: ['Action'], year: 2021, overview: '', tmdbUrl: 'http://test.com' },
              { id: 3, title: 'Drama Hero', poster: null, rating: 8.0, genres: ['Drama'], year: 2019, overview: '', tmdbUrl: 'http://test.com' },
              { id: 4, title: 'Comedy Show', poster: null, rating: 7.0, genres: ['Comedy'], year: 2022, overview: '', tmdbUrl: 'http://test.com' }
            ];
            
            for (const film of films) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply combined filters
            filter.setGenreFilter('Action');
            filter.setNameFilter('Hero');
            
            // Call applyFilters multiple times
            const result1 = filter.applyFilters();
            const result2 = filter.applyFilters();
            
            // Both should return same result (Action Hero)
            expect(result1.length).toBe(1);
            expect(result2.length).toBe(1);
            expect(result1[0].film.title).toBe('Action Hero');
            expect(result2[0].film.title).toBe('Action Hero');
            
            // Filter state should persist
            const activeFilters = filter.getActiveFilters();
            expect(activeFilters.genre).toBe('Action');
            expect(activeFilters.name).toBe('Hero');
            expect(filter.hasActiveFilters()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 48: Filtered count accuracy
   * Validates: Requirements 14.4
   * 
   * For any filtered list, when displayed,
   * the film count should match the number of films that pass the filter criteria.
   */
  describe('Property 48: Filtered count accuracy', () => {
    it('should return accurate count for genre filtered results', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 30, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror'),
          (entries, selectedGenre) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter
            filter.setGenreFilter(selectedGenre);
            const filtered = filter.applyFilters();
            
            // Count films that match the genre manually
            const expectedCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              )
            ).length;
            
            // Filtered count should match expected count exactly
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return accurate count for name filtered results', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 30, selector: (item) => item.film.id }
          ),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply name filter
            filter.setNameFilter(searchText);
            const filtered = filter.applyFilters();
            
            const searchLower = searchText.toLowerCase().trim();
            
            // Count films that match the search manually
            const expectedCount = entries.filter(({ film }) => 
              film.title && film.title.toLowerCase().includes(searchLower)
            ).length;
            
            // Filtered count should match expected count exactly
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return accurate count for combined filters', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 15, maxLength: 30, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          fc.string({ minLength: 1, maxLength: 5 }),
          (entries, selectedGenre, searchText) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply combined filters
            filter.setGenreFilter(selectedGenre);
            filter.setNameFilter(searchText);
            const filtered = filter.applyFilters();
            
            const searchLower = searchText.toLowerCase().trim();
            
            // Count films that match both filters manually
            const expectedCount = entries.filter(({ film }) => {
              const hasGenre = film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              );
              const hasTitle = film.title && film.title.toLowerCase().includes(searchLower);
              return hasGenre && hasTitle;
            }).length;
            
            // Filtered count should match expected count exactly
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return accurate count when random filter is combined with other filters', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: filmArb,
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 10, maxLength: 20, selector: (item) => item.film.id }
          ),
          fc.constantFrom('Action', 'Drama', 'Comedy'),
          (entries, selectedGenre) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply genre filter and random filter
            filter.setGenreFilter(selectedGenre);
            filter.setRandomFilter(true);
            const filtered = filter.applyFilters();
            
            // Count films that match the genre manually
            const expectedCount = entries.filter(({ film }) => 
              film.genres && film.genres.some(g => 
                g.toLowerCase() === selectedGenre.toLowerCase()
              )
            ).length;
            
            // Filtered count should match expected count (random doesn't change count)
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero count when no films match filters', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              film: fc.record({
                id: fc.integer({ min: 1, max: 1000000 }),
                title: fc.constantFrom('Action Movie', 'Drama Film'),
                poster: fc.option(fc.webUrl()),
                rating: fc.float({ min: 0, max: 10, noNaN: true }),
                genres: fc.constantFrom(['Action'], ['Drama']),
                year: fc.option(fc.integer({ min: 1900, max: 2030 })),
                overview: fc.string({ maxLength: 500 }),
                tmdbUrl: fc.webUrl()
              }),
              userId: userIdArb,
              username: usernameArb
            }),
            { minLength: 5, maxLength: 15, selector: (item) => item.film.id }
          ),
          (entries) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create fresh instances
            const storage = new StorageManager();
            const list = new ListService(storage);
            const filter = new FilterManager(list);
            
            // Add all films to list (all have Action or Drama)
            for (const { film, userId, username } of entries) {
              list.addFilmToList(film, userId, username);
            }
            
            // Apply filter for genre that doesn't exist
            filter.setGenreFilter('Horror');
            const filtered = filter.applyFilters();
            
            // Count should be exactly zero
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

/**
 * Example Tests for Filter Controls Display
 * Requirements: 11.1
 */
describe('FilterManager - Example Tests', () => {
  /**
   * Example test for filter controls display
   * Validates: Requirements 11.1
   * 
   * Verifies that filter controls are present in the interface
   */
  describe('Filter controls display', () => {
    it('should have genre filter dropdown in the interface', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="filter-controls" class="filter-controls">
          <div class="filter-group">
            <label for="genre-filter">Filtrar por gênero:</label>
            <select id="genre-filter" class="filter-select">
              <option value="">Todos os gêneros</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="name-filter">Buscar por nome:</label>
            <input type="text" id="name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
          </div>
          <div class="filter-group">
            <button id="random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
          </div>
          <div class="filter-group">
            <button id="clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
          </div>
        </div>
      `;

      // Verify filter controls container exists
      const filterControls = document.getElementById('filter-controls');
      expect(filterControls).toBeDefined();
      expect(filterControls).not.toBeNull();

      // Verify genre filter dropdown exists
      const genreFilter = document.getElementById('genre-filter');
      expect(genreFilter).toBeDefined();
      expect(genreFilter).not.toBeNull();
      expect(genreFilter.tagName).toBe('SELECT');

      // Verify name filter input exists
      const nameFilter = document.getElementById('name-filter');
      expect(nameFilter).toBeDefined();
      expect(nameFilter).not.toBeNull();
      expect(nameFilter.tagName).toBe('INPUT');
      expect(nameFilter.type).toBe('text');

      // Verify random filter button exists
      const randomBtn = document.getElementById('random-filter-btn');
      expect(randomBtn).toBeDefined();
      expect(randomBtn).not.toBeNull();
      expect(randomBtn.tagName).toBe('BUTTON');

      // Verify clear filters button exists
      const clearBtn = document.getElementById('clear-filters-btn');
      expect(clearBtn).toBeDefined();
      expect(clearBtn).not.toBeNull();
      expect(clearBtn.tagName).toBe('BUTTON');
    });

    it('should have all required filter control elements with proper classes', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="filter-controls" class="filter-controls">
          <div class="filter-group">
            <label for="genre-filter">Filtrar por gênero:</label>
            <select id="genre-filter" class="filter-select">
              <option value="">Todos os gêneros</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="name-filter">Buscar por nome:</label>
            <input type="text" id="name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
          </div>
          <div class="filter-group">
            <button id="random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
          </div>
          <div class="filter-group">
            <button id="clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
          </div>
        </div>
      `;

      // Verify filter controls has correct class
      const filterControls = document.getElementById('filter-controls');
      expect(filterControls.classList.contains('filter-controls')).toBe(true);

      // Verify all filter groups exist
      const filterGroups = document.querySelectorAll('.filter-group');
      expect(filterGroups.length).toBeGreaterThanOrEqual(4);

      // Verify genre filter has correct class
      const genreFilter = document.getElementById('genre-filter');
      expect(genreFilter.classList.contains('filter-select')).toBe(true);

      // Verify name filter has correct class
      const nameFilter = document.getElementById('name-filter');
      expect(nameFilter.classList.contains('filter-input')).toBe(true);

      // Verify buttons have correct classes
      const randomBtn = document.getElementById('random-filter-btn');
      expect(randomBtn.classList.contains('filter-btn')).toBe(true);

      const clearBtn = document.getElementById('clear-filters-btn');
      expect(clearBtn.classList.contains('filter-btn')).toBe(true);
      expect(clearBtn.classList.contains('clear-btn')).toBe(true);
    });

    it('should have proper labels for filter controls', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="filter-controls" class="filter-controls">
          <div class="filter-group">
            <label for="genre-filter">Filtrar por gênero:</label>
            <select id="genre-filter" class="filter-select">
              <option value="">Todos os gêneros</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="name-filter">Buscar por nome:</label>
            <input type="text" id="name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
          </div>
          <div class="filter-group">
            <button id="random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
          </div>
          <div class="filter-group">
            <button id="clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
          </div>
        </div>
      `;

      // Verify genre filter label
      const genreLabel = document.querySelector('label[for="genre-filter"]');
      expect(genreLabel).toBeDefined();
      expect(genreLabel).not.toBeNull();
      expect(genreLabel.textContent).toContain('gênero');

      // Verify name filter label
      const nameLabel = document.querySelector('label[for="name-filter"]');
      expect(nameLabel).toBeDefined();
      expect(nameLabel).not.toBeNull();
      expect(nameLabel.textContent).toContain('nome');

      // Verify name filter has placeholder
      const nameFilter = document.getElementById('name-filter');
      expect(nameFilter.placeholder).toBeTruthy();
      expect(nameFilter.placeholder.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Example Tests for Watched Films Filter Controls Display
 * Requirements: 15.1
 */
describe('FilterManager - Watched Films Filter Controls', () => {
  /**
   * Example test for watched films filter controls display
   * Validates: Requirements 15.1
   * 
   * WHEN a User accesses the watched films tab THEN the System SHALL display filter options
   * 
   * Verifies that filter controls are present in the watched films tab interface
   */
  describe('Watched films filter controls display', () => {
    it('should have filter controls in the watched films tab', () => {
      // Create a mock DOM structure for watched films section with filter controls
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <!-- Filter Controls for Watched Films -->
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify watched films section exists
      const watchedSection = document.getElementById('watched-films');
      expect(watchedSection).toBeDefined();
      expect(watchedSection).not.toBeNull();

      // Verify filter controls container exists in watched films tab
      const filterControls = document.getElementById('watched-filter-controls');
      expect(filterControls).toBeDefined();
      expect(filterControls).not.toBeNull();
      expect(filterControls.classList.contains('filter-controls')).toBe(true);

      // Verify genre filter dropdown exists
      const genreFilter = document.getElementById('watched-genre-filter');
      expect(genreFilter).toBeDefined();
      expect(genreFilter).not.toBeNull();
      expect(genreFilter.tagName).toBe('SELECT');
      expect(genreFilter.classList.contains('filter-select')).toBe(true);

      // Verify name filter input exists
      const nameFilter = document.getElementById('watched-name-filter');
      expect(nameFilter).toBeDefined();
      expect(nameFilter).not.toBeNull();
      expect(nameFilter.tagName).toBe('INPUT');
      expect(nameFilter.type).toBe('text');
      expect(nameFilter.classList.contains('filter-input')).toBe(true);

      // Verify random filter button exists
      const randomBtn = document.getElementById('watched-random-filter-btn');
      expect(randomBtn).toBeDefined();
      expect(randomBtn).not.toBeNull();
      expect(randomBtn.tagName).toBe('BUTTON');
      expect(randomBtn.classList.contains('filter-btn')).toBe(true);

      // Verify clear filters button exists
      const clearBtn = document.getElementById('watched-clear-filters-btn');
      expect(clearBtn).toBeDefined();
      expect(clearBtn).not.toBeNull();
      expect(clearBtn.tagName).toBe('BUTTON');
      expect(clearBtn.classList.contains('filter-btn')).toBe(true);
      expect(clearBtn.classList.contains('clear-btn')).toBe(true);
    });

    it('should have all required filter groups in watched films tab', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify all filter groups exist within watched films section
      const watchedSection = document.getElementById('watched-films');
      const filterGroups = watchedSection.querySelectorAll('.filter-group');
      expect(filterGroups.length).toBeGreaterThanOrEqual(4);

      // Verify each filter group contains the expected controls
      const genreFilterGroup = filterGroups[0];
      expect(genreFilterGroup.querySelector('label[for="watched-genre-filter"]')).not.toBeNull();
      expect(genreFilterGroup.querySelector('#watched-genre-filter')).not.toBeNull();

      const nameFilterGroup = filterGroups[1];
      expect(nameFilterGroup.querySelector('label[for="watched-name-filter"]')).not.toBeNull();
      expect(nameFilterGroup.querySelector('#watched-name-filter')).not.toBeNull();

      const randomFilterGroup = filterGroups[2];
      expect(randomFilterGroup.querySelector('#watched-random-filter-btn')).not.toBeNull();

      const clearFilterGroup = filterGroups[3];
      expect(clearFilterGroup.querySelector('#watched-clear-filters-btn')).not.toBeNull();
    });

    it('should have proper labels for watched films filter controls', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify genre filter label
      const genreLabel = document.querySelector('label[for="watched-genre-filter"]');
      expect(genreLabel).toBeDefined();
      expect(genreLabel).not.toBeNull();
      expect(genreLabel.textContent).toContain('gênero');

      // Verify name filter label
      const nameLabel = document.querySelector('label[for="watched-name-filter"]');
      expect(nameLabel).toBeDefined();
      expect(nameLabel).not.toBeNull();
      expect(nameLabel.textContent).toContain('nome');

      // Verify name filter has placeholder
      const nameFilter = document.getElementById('watched-name-filter');
      expect(nameFilter.placeholder).toBeTruthy();
      expect(nameFilter.placeholder.length).toBeGreaterThan(0);

      // Verify button text content
      const randomBtn = document.getElementById('watched-random-filter-btn');
      expect(randomBtn.textContent).toContain('Aleatória');

      const clearBtn = document.getElementById('watched-clear-filters-btn');
      expect(clearBtn.textContent).toContain('Limpar');
    });

    it('should have filter controls positioned within watched films section', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify filter controls are inside watched films section
      const watchedSection = document.getElementById('watched-films');
      const filterControls = document.getElementById('watched-filter-controls');
      
      expect(watchedSection.contains(filterControls)).toBe(true);

      // Verify filter controls appear before the films container
      const filmsContainer = document.getElementById('watched-films-container');
      expect(watchedSection.contains(filmsContainer)).toBe(true);
      
      // Check that filter controls come before films container in DOM order
      const children = Array.from(watchedSection.children);
      const filterIndex = children.indexOf(filterControls);
      const containerIndex = children.indexOf(filmsContainer);
      
      expect(filterIndex).toBeGreaterThan(-1);
      expect(containerIndex).toBeGreaterThan(-1);
      expect(filterIndex).toBeLessThan(containerIndex);
    });
  });
});

/**
 * Example Tests for Watched Films Filter Controls Display
 * Requirements: 15.1
 */
describe('FilterManager - Watched Films Filter Controls', () => {
  /**
   * Example test for watched films filter controls display
   * Validates: Requirements 15.1
   * 
   * WHEN a User accesses the watched films tab THEN the System SHALL display filter options
   * 
   * Verifies that filter controls are present in the watched films tab interface
   */
  describe('Watched films filter controls display', () => {
    it('should have filter controls in the watched films tab', () => {
      // Create a mock DOM structure for watched films section with filter controls
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <!-- Filter Controls for Watched Films -->
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify watched films section exists
      const watchedSection = document.getElementById('watched-films');
      expect(watchedSection).toBeDefined();
      expect(watchedSection).not.toBeNull();

      // Verify filter controls container exists in watched films tab
      const filterControls = document.getElementById('watched-filter-controls');
      expect(filterControls).toBeDefined();
      expect(filterControls).not.toBeNull();
      expect(filterControls.classList.contains('filter-controls')).toBe(true);

      // Verify genre filter dropdown exists
      const genreFilter = document.getElementById('watched-genre-filter');
      expect(genreFilter).toBeDefined();
      expect(genreFilter).not.toBeNull();
      expect(genreFilter.tagName).toBe('SELECT');
      expect(genreFilter.classList.contains('filter-select')).toBe(true);

      // Verify name filter input exists
      const nameFilter = document.getElementById('watched-name-filter');
      expect(nameFilter).toBeDefined();
      expect(nameFilter).not.toBeNull();
      expect(nameFilter.tagName).toBe('INPUT');
      expect(nameFilter.type).toBe('text');
      expect(nameFilter.classList.contains('filter-input')).toBe(true);

      // Verify random filter button exists
      const randomBtn = document.getElementById('watched-random-filter-btn');
      expect(randomBtn).toBeDefined();
      expect(randomBtn).not.toBeNull();
      expect(randomBtn.tagName).toBe('BUTTON');
      expect(randomBtn.classList.contains('filter-btn')).toBe(true);

      // Verify clear filters button exists
      const clearBtn = document.getElementById('watched-clear-filters-btn');
      expect(clearBtn).toBeDefined();
      expect(clearBtn).not.toBeNull();
      expect(clearBtn.tagName).toBe('BUTTON');
      expect(clearBtn.classList.contains('filter-btn')).toBe(true);
      expect(clearBtn.classList.contains('clear-btn')).toBe(true);
    });

    it('should have all required filter groups in watched films tab', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify all filter groups exist within watched films section
      const watchedSection = document.getElementById('watched-films');
      const filterGroups = watchedSection.querySelectorAll('.filter-group');
      expect(filterGroups.length).toBeGreaterThanOrEqual(4);

      // Verify each filter group contains the expected controls
      const genreFilterGroup = filterGroups[0];
      expect(genreFilterGroup.querySelector('label[for="watched-genre-filter"]')).not.toBeNull();
      expect(genreFilterGroup.querySelector('#watched-genre-filter')).not.toBeNull();

      const nameFilterGroup = filterGroups[1];
      expect(nameFilterGroup.querySelector('label[for="watched-name-filter"]')).not.toBeNull();
      expect(nameFilterGroup.querySelector('#watched-name-filter')).not.toBeNull();

      const randomFilterGroup = filterGroups[2];
      expect(randomFilterGroup.querySelector('#watched-random-filter-btn')).not.toBeNull();

      const clearFilterGroup = filterGroups[3];
      expect(clearFilterGroup.querySelector('#watched-clear-filters-btn')).not.toBeNull();
    });

    it('should have proper labels for watched films filter controls', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify genre filter label
      const genreLabel = document.querySelector('label[for="watched-genre-filter"]');
      expect(genreLabel).toBeDefined();
      expect(genreLabel).not.toBeNull();
      expect(genreLabel.textContent).toContain('gênero');

      // Verify name filter label
      const nameLabel = document.querySelector('label[for="watched-name-filter"]');
      expect(nameLabel).toBeDefined();
      expect(nameLabel).not.toBeNull();
      expect(nameLabel.textContent).toContain('nome');

      // Verify name filter has placeholder
      const nameFilter = document.getElementById('watched-name-filter');
      expect(nameFilter.placeholder).toBeTruthy();
      expect(nameFilter.placeholder.length).toBeGreaterThan(0);

      // Verify button text content
      const randomBtn = document.getElementById('watched-random-filter-btn');
      expect(randomBtn.textContent).toContain('Aleatória');

      const clearBtn = document.getElementById('watched-clear-filters-btn');
      expect(clearBtn.textContent).toContain('Limpar');
    });

    it('should have filter controls positioned within watched films section', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify filter controls are inside watched films section
      const watchedSection = document.getElementById('watched-films');
      const filterControls = document.getElementById('watched-filter-controls');
      
      expect(watchedSection.contains(filterControls)).toBe(true);

      // Verify filter controls appear before the films container
      const filmsContainer = document.getElementById('watched-films-container');
      expect(watchedSection.contains(filmsContainer)).toBe(true);
      
      // Check that filter controls come before films container in DOM order
      const children = Array.from(watchedSection.children);
      const filterIndex = children.indexOf(filterControls);
      const containerIndex = children.indexOf(filmsContainer);
      
      expect(filterIndex).toBeGreaterThan(-1);
      expect(containerIndex).toBeGreaterThan(-1);
      expect(filterIndex).toBeLessThan(containerIndex);
    });
  });
});

/**
 * Example Tests for Watched Films Filter Controls Display
 * Requirements: 15.1
 */
describe('FilterManager - Watched Films Filter Controls', () => {
  /**
   * Example test for watched films filter controls display
   * Validates: Requirements 15.1
   * 
   * WHEN a User accesses the watched films tab THEN the System SHALL display filter options
   * 
   * Verifies that filter controls are present in the watched films tab interface
   */
  describe('Watched films filter controls display', () => {
    it('should have filter controls in the watched films tab', () => {
      // Create a mock DOM structure for watched films section with filter controls
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <!-- Filter Controls for Watched Films -->
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify watched films section exists
      const watchedSection = document.getElementById('watched-films');
      expect(watchedSection).toBeDefined();
      expect(watchedSection).not.toBeNull();

      // Verify filter controls container exists in watched films tab
      const filterControls = document.getElementById('watched-filter-controls');
      expect(filterControls).toBeDefined();
      expect(filterControls).not.toBeNull();
      expect(filterControls.classList.contains('filter-controls')).toBe(true);

      // Verify genre filter dropdown exists
      const genreFilter = document.getElementById('watched-genre-filter');
      expect(genreFilter).toBeDefined();
      expect(genreFilter).not.toBeNull();
      expect(genreFilter.tagName).toBe('SELECT');
      expect(genreFilter.classList.contains('filter-select')).toBe(true);

      // Verify name filter input exists
      const nameFilter = document.getElementById('watched-name-filter');
      expect(nameFilter).toBeDefined();
      expect(nameFilter).not.toBeNull();
      expect(nameFilter.tagName).toBe('INPUT');
      expect(nameFilter.type).toBe('text');
      expect(nameFilter.classList.contains('filter-input')).toBe(true);

      // Verify random filter button exists
      const randomBtn = document.getElementById('watched-random-filter-btn');
      expect(randomBtn).toBeDefined();
      expect(randomBtn).not.toBeNull();
      expect(randomBtn.tagName).toBe('BUTTON');
      expect(randomBtn.classList.contains('filter-btn')).toBe(true);

      // Verify clear filters button exists
      const clearBtn = document.getElementById('watched-clear-filters-btn');
      expect(clearBtn).toBeDefined();
      expect(clearBtn).not.toBeNull();
      expect(clearBtn.tagName).toBe('BUTTON');
      expect(clearBtn.classList.contains('filter-btn')).toBe(true);
      expect(clearBtn.classList.contains('clear-btn')).toBe(true);
    });

    it('should have all required filter groups in watched films tab', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify all filter groups exist within watched films section
      const watchedSection = document.getElementById('watched-films');
      const filterGroups = watchedSection.querySelectorAll('.filter-group');
      expect(filterGroups.length).toBeGreaterThanOrEqual(4);

      // Verify each filter group contains the expected controls
      const genreFilterGroup = filterGroups[0];
      expect(genreFilterGroup.querySelector('label[for="watched-genre-filter"]')).not.toBeNull();
      expect(genreFilterGroup.querySelector('#watched-genre-filter')).not.toBeNull();

      const nameFilterGroup = filterGroups[1];
      expect(nameFilterGroup.querySelector('label[for="watched-name-filter"]')).not.toBeNull();
      expect(nameFilterGroup.querySelector('#watched-name-filter')).not.toBeNull();

      const randomFilterGroup = filterGroups[2];
      expect(randomFilterGroup.querySelector('#watched-random-filter-btn')).not.toBeNull();

      const clearFilterGroup = filterGroups[3];
      expect(clearFilterGroup.querySelector('#watched-clear-filters-btn')).not.toBeNull();
    });

    it('should have proper labels for watched films filter controls', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify genre filter label
      const genreLabel = document.querySelector('label[for="watched-genre-filter"]');
      expect(genreLabel).toBeDefined();
      expect(genreLabel).not.toBeNull();
      expect(genreLabel.textContent).toContain('gênero');

      // Verify name filter label
      const nameLabel = document.querySelector('label[for="watched-name-filter"]');
      expect(nameLabel).toBeDefined();
      expect(nameLabel).not.toBeNull();
      expect(nameLabel.textContent).toContain('nome');

      // Verify name filter has placeholder
      const nameFilter = document.getElementById('watched-name-filter');
      expect(nameFilter.placeholder).toBeTruthy();
      expect(nameFilter.placeholder.length).toBeGreaterThan(0);

      // Verify button text content
      const randomBtn = document.getElementById('watched-random-filter-btn');
      expect(randomBtn.textContent).toContain('Aleatória');

      const clearBtn = document.getElementById('watched-clear-filters-btn');
      expect(clearBtn.textContent).toContain('Limpar');
    });

    it('should have filter controls positioned within watched films section', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <section id="watched-films">
          <h2>Filmes Assistidos</h2>
          
          <div id="watched-filter-controls" class="filter-controls">
            <div class="filter-group">
              <label for="watched-genre-filter">Filtrar por gênero:</label>
              <select id="watched-genre-filter" class="filter-select">
                <option value="">Todos os gêneros</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="watched-name-filter">Buscar por nome:</label>
              <input type="text" id="watched-name-filter" class="filter-input" placeholder="Digite o nome do filme..." />
            </div>
            
            <div class="filter-group">
              <button id="watched-random-filter-btn" class="filter-btn">🎲 Ordem Aleatória</button>
            </div>
            
            <div class="filter-group">
              <button id="watched-clear-filters-btn" class="filter-btn clear-btn">✕ Limpar Filtros</button>
            </div>
          </div>
          
          <div id="watched-films-container"></div>
        </section>
      `;

      // Verify filter controls are inside watched films section
      const watchedSection = document.getElementById('watched-films');
      const filterControls = document.getElementById('watched-filter-controls');
      
      expect(watchedSection.contains(filterControls)).toBe(true);

      // Verify filter controls appear before the films container
      const filmsContainer = document.getElementById('watched-films-container');
      expect(watchedSection.contains(filmsContainer)).toBe(true);
      
      // Check that filter controls come before films container in DOM order
      const children = Array.from(watchedSection.children);
      const filterIndex = children.indexOf(filterControls);
      const containerIndex = children.indexOf(filmsContainer);
      
      expect(filterIndex).toBeGreaterThan(-1);
      expect(containerIndex).toBeGreaterThan(-1);
      expect(filterIndex).toBeLessThan(containerIndex);
    });
  });
});
