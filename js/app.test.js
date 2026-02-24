/**
 * Property-based tests for App.js - Dynamic Button Functionality
 * Uses fast-check for property-based testing
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

const fc = require('fast-check');

// Mock localStorage for testing
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Load required modules
const StorageManager = require('./storage.js');
const ListService = require('./list.js');

describe('App.js - Dynamic Button Functionality - Property-Based Tests', () => {
  let listService;
  let storageManager;

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

  beforeEach(() => {
    // Create fresh instances before each test
    storageManager = new StorageManager();
    listService = new ListService(storageManager);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Feature: letterboxd-manager, Property 54: Button state for listed films
   * Validates: Requirements 16.1
   * 
   * For any film already in the shared list, when displayed in the explore tab,
   * the button should show "remove" instead of "add".
   */
  describe('Property 54: Button state for listed films', () => {
    it('should show remove button for films already in the list', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to shared list
            listService.addFilmToList(film, userId, username);
            
            // Verify film is in list
            const isInList = listService.isFilmInList(film.id);
            expect(isInList).toBe(true);
            
            // The button state should reflect that the film is in the list
            // In the actual UI, this would be checked by verifying button text
            // For this test, we verify the underlying logic
            const sharedList = listService.getSharedList();
            const filmEntry = sharedList.find(e => e.film.id === film.id);
            
            expect(filmEntry).toBeDefined();
            expect(filmEntry.film.id).toBe(film.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show add button for films not in the list', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Verify film is NOT in list
            const isInList = listService.isFilmInList(film.id);
            expect(isInList).toBe(false);
            
            // The button state should reflect that the film is not in the list
            const sharedList = listService.getSharedList();
            const filmEntry = sharedList.find(e => e.film.id === film.id);
            
            expect(filmEntry).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify film state across multiple films', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(filmArb, { 
            minLength: 3, 
            maxLength: 10, 
            selector: (f) => f.id 
          }),
          userIdArb,
          usernameArb,
          fc.integer({ min: 0, max: 2 }),
          (films, userId, username, addCount) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add only some films to the list
            const filmsToAdd = films.slice(0, Math.min(addCount, films.length));
            const filmsNotAdded = films.slice(Math.min(addCount, films.length));
            
            for (const film of filmsToAdd) {
              listService.addFilmToList(film, userId, username);
            }
            
            // Verify added films are in list
            for (const film of filmsToAdd) {
              expect(listService.isFilmInList(film.id)).toBe(true);
            }
            
            // Verify not-added films are not in list
            for (const film of filmsNotAdded) {
              expect(listService.isFilmInList(film.id)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 55: Remove button functionality
   * Validates: Requirements 16.2
   * 
   * For any film in the shared list, when the remove button is clicked,
   * the film should be removed from the shared list.
   */
  describe('Property 55: Remove button functionality', () => {
    it('should remove film from list when remove button is clicked', () => {
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
            
            // Verify film is in list
            expect(listService.isFilmInList(film.id)).toBe(true);
            expect(listService.getSharedList().length).toBe(1);
            
            // Remove film from list (simulating button click)
            listService.removeFilmFromList(entry.id);
            
            // Verify film is no longer in list
            expect(listService.isFilmInList(film.id)).toBe(false);
            expect(listService.getSharedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove only the specified film from list with multiple films', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(filmArb, { 
            minLength: 2, 
            maxLength: 10, 
            selector: (f) => f.id 
          }),
          userIdArb,
          usernameArb,
          fc.integer({ min: 0, max: 9 }),
          (films, userId, username, removeIndex) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add all films to list
            const entries = [];
            for (const film of films) {
              const entry = listService.addFilmToList(film, userId, username);
              entries.push(entry);
            }
            
            // Verify all films are in list
            expect(listService.getSharedList().length).toBe(films.length);
            
            // Remove one film
            const indexToRemove = removeIndex % films.length;
            const entryToRemove = entries[indexToRemove];
            const filmToRemove = films[indexToRemove];
            
            listService.removeFilmFromList(entryToRemove.id);
            
            // Verify only the specified film was removed
            expect(listService.isFilmInList(filmToRemove.id)).toBe(false);
            expect(listService.getSharedList().length).toBe(films.length - 1);
            
            // Verify other films are still in list
            for (let i = 0; i < films.length; i++) {
              if (i !== indexToRemove) {
                expect(listService.isFilmInList(films[i].id)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 56: Button state after removal
   * Validates: Requirements 16.3
   * 
   * For any film removed from the shared list, when displayed in the explore tab,
   * the button should show "add" instead of "remove".
   */
  describe('Property 56: Button state after removal', () => {
    it('should change button state to add after removing film', () => {
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
            
            // Verify film is in list (button should show "remove")
            expect(listService.isFilmInList(film.id)).toBe(true);
            
            // Remove film from list
            listService.removeFilmFromList(entry.id);
            
            // Verify film is not in list (button should show "add")
            expect(listService.isFilmInList(film.id)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct button state through multiple add/remove cycles', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          fc.integer({ min: 1, max: 5 }),
          (film, userId, username, cycles) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            for (let i = 0; i < cycles; i++) {
              // Add film
              const entry = listService.addFilmToList(film, userId, username);
              expect(listService.isFilmInList(film.id)).toBe(true);
              
              // Remove film
              listService.removeFilmFromList(entry.id);
              expect(listService.isFilmInList(film.id)).toBe(false);
            }
            
            // Final state should be not in list
            expect(listService.isFilmInList(film.id)).toBe(false);
            expect(listService.getSharedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 57: Visual indication of listed films
   * Validates: Requirements 16.4
   * 
   * For any film in the explore tab, when it exists in the shared list,
   * it should be visually indicated.
   */
  describe('Property 57: Visual indication of listed films', () => {
    it('should provide visual indication for films in the list', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Add film to list
            listService.addFilmToList(film, userId, username);
            
            // Verify film is in list
            const isInList = listService.isFilmInList(film.id);
            expect(isInList).toBe(true);
            
            // In the actual UI, this would be indicated by:
            // - Different button color/text
            // - Border around the card
            // - Badge/label on the card
            // For this test, we verify the underlying state that drives the visual indication
            const sharedList = listService.getSharedList();
            const filmEntry = sharedList.find(e => e.film.id === film.id);
            
            expect(filmEntry).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should distinguish between listed and non-listed films visually', () => {
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
            
            // Add only half of the films
            const halfIndex = Math.floor(films.length / 2);
            const listedFilms = films.slice(0, halfIndex);
            const nonListedFilms = films.slice(halfIndex);
            
            for (const film of listedFilms) {
              listService.addFilmToList(film, userId, username);
            }
            
            // Verify listed films are in list
            for (const film of listedFilms) {
              expect(listService.isFilmInList(film.id)).toBe(true);
            }
            
            // Verify non-listed films are not in list
            for (const film of nonListedFilms) {
              expect(listService.isFilmInList(film.id)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 58: Immediate button state update
   * Validates: Requirements 16.5
   * 
   * For any film, when added to or removed from the shared list,
   * the button state should update immediately.
   */
  describe('Property 58: Immediate button state update', () => {
    it('should update button state immediately after adding film', () => {
      fc.assert(
        fc.property(
          filmArb,
          userIdArb,
          usernameArb,
          (film, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Initial state: film not in list
            expect(listService.isFilmInList(film.id)).toBe(false);
            
            // Add film to list
            listService.addFilmToList(film, userId, username);
            
            // State should be updated immediately
            expect(listService.isFilmInList(film.id)).toBe(true);
            
            // No delay or async operation should be needed
            const sharedList = listService.getSharedList();
            expect(sharedList.length).toBe(1);
            expect(sharedList[0].film.id).toBe(film.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update button state immediately after removing film', () => {
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
            expect(listService.isFilmInList(film.id)).toBe(true);
            
            // Remove film from list
            listService.removeFilmFromList(entry.id);
            
            // State should be updated immediately
            expect(listService.isFilmInList(film.id)).toBe(false);
            
            // No delay or async operation should be needed
            const sharedList = listService.getSharedList();
            expect(sharedList.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain immediate state updates across rapid operations', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(filmArb, { 
            minLength: 3, 
            maxLength: 10, 
            selector: (f) => f.id 
          }),
          userIdArb,
          usernameArb,
          (films, userId, username) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Rapidly add all films
            const entries = [];
            for (const film of films) {
              const entry = listService.addFilmToList(film, userId, username);
              entries.push(entry);
              
              // State should be immediately updated after each add
              expect(listService.isFilmInList(film.id)).toBe(true);
            }
            
            // Verify all films are in list
            expect(listService.getSharedList().length).toBe(films.length);
            
            // Rapidly remove all films
            for (let i = 0; i < entries.length; i++) {
              listService.removeFilmFromList(entries[i].id);
              
              // State should be immediately updated after each remove
              expect(listService.isFilmInList(films[i].id)).toBe(false);
            }
            
            // Verify all films are removed
            expect(listService.getSharedList().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
