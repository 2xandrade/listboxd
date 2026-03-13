/**
 * Property-based tests for DataValidator
 * Uses fast-check for property-based testing
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

const fc = require('fast-check');
const DataValidator = require('./data-validator.js');

describe('DataValidator - Property-Based Tests', () => {
  
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
    addedAt: fc.date().map(d => d.toISOString()),
    streamingServices: fc.array(fc.string(), { maxLength: 5 })
  });

  // Generator for entries with missing film object
  const entryWithoutFilmArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    id_filme: fc.string({ minLength: 1, maxLength: 50 }),
    titulo_filme: fc.string({ minLength: 1, maxLength: 200 }),
    ano: fc.option(fc.integer({ min: 1900, max: 2030 }))
  });

  // Generator for entries with null/undefined film
  const entryWithNullFilmArb = validEntryArb.map(entry => ({
    ...entry,
    film: fc.sample(fc.constantFrom(null, undefined), 1)[0]
  }));

  // Generator for mixed valid and invalid entries
  const mixedEntriesArb = fc.array(
    fc.oneof(
      validEntryArb,
      entryWithoutFilmArb,
      entryWithNullFilmArb
    ),
    { minLength: 1, maxLength: 20 }
  );

  /**
   * Feature: critical-bugs-fix, Property 1: Valid entries are always rendered
   * Validates: Requirements 1.1, 1.2
   * 
   * For any list of entries containing both valid and invalid entries, 
   * the rendering function should successfully render all valid entries without throwing errors.
   */
  describe('Property 1: Valid entries are always rendered', () => {
    it('should validate and return all valid entries from mixed array', () => {
      fc.assert(
        fc.property(
          mixedEntriesArb,
          (entries) => {
            // Validate entries - should not throw
            const validEntries = DataValidator.validateEntries(entries);
            
            // Result should be an array
            expect(Array.isArray(validEntries)).toBe(true);
            
            // All returned entries should be valid
            for (const entry of validEntries) {
              expect(entry).toBeDefined();
              expect(entry.film).toBeDefined();
              expect(entry.film.title).toBeDefined();
              expect(typeof entry.film.title).toBe('string');
              expect(entry.film.title.length).toBeGreaterThan(0);
              expect(Array.isArray(entry.film.genres)).toBe(true);
            }
            
            // Should not return more entries than input
            expect(validEntries.length).toBeLessThanOrEqual(entries.length);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should handle arrays with all valid entries', () => {
      fc.assert(
        fc.property(
          fc.array(validEntryArb, { minLength: 1, maxLength: 20 }),
          (entries) => {
            const validEntries = DataValidator.validateEntries(entries);
            
            // All entries should be returned when all are valid
            expect(validEntries.length).toBe(entries.length);
            
            // All should have complete structure
            for (const entry of validEntries) {
              expect(DataValidator.isCompleteEntry(entry)).toBe(true);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should handle arrays with all invalid entries', () => {
      fc.assert(
        fc.property(
          fc.array(entryWithoutFilmArb, { minLength: 1, maxLength: 20 }),
          (entries) => {
            const validEntries = DataValidator.validateEntries(entries);
            
            // No entries should be returned when all are invalid
            expect(validEntries.length).toBe(0);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * Feature: critical-bugs-fix, Property 2: Defensive access prevents crashes
   * Validates: Requirements 1.4
   * 
   * For any entry object (including those with missing or null film objects), 
   * accessing film properties should never throw an error.
   */
  describe('Property 2: Defensive access prevents crashes', () => {
    it('should safely validate entries with null or undefined film', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            entryWithoutFilmArb,
            entryWithNullFilmArb,
            fc.constant(null),
            fc.constant(undefined),
            fc.constant({})
          ),
          (entry) => {
            // Should not throw when validating invalid entries
            let result;
            expect(() => {
              result = DataValidator.validateEntry(entry);
            }).not.toThrow();
            
            // Result should be null for invalid entries
            expect(result).toBeNull();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should safely validate film objects with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant({}),
            fc.record({ id: fc.integer() }), // Missing title
            fc.record({ title: fc.string() }), // Missing id
            fc.record({ title: fc.string(), id: fc.integer(), genres: fc.string() }) // Invalid genres type
          ),
          (film) => {
            // Should not throw when validating invalid films
            let result;
            expect(() => {
              result = DataValidator.validateFilm(film);
            }).not.toThrow();
            
            // Result should be false for invalid films
            expect(result).toBe(false);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should safely check completeness of any entry', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          (entry) => {
            // Should not throw for any input
            let result;
            expect(() => {
              result = DataValidator.isCompleteEntry(entry);
            }).not.toThrow();
            
            // Result should be a boolean
            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * Feature: critical-bugs-fix, Property 3: Normalization produces consistent structure
   * Validates: Requirements 1.5
   * 
   * For any API response format, the normalization function should produce 
   * an entry with all required fields in the expected structure.
   */
  describe('Property 3: Normalization produces consistent structure', () => {
    it('should normalize valid entries to consistent structure', () => {
      fc.assert(
        fc.property(
          validEntryArb,
          (rawEntry) => {
            const normalized = DataValidator.normalizeEntry(rawEntry);
            
            // Should have all required top-level fields
            expect(normalized.id).toBeDefined();
            expect(normalized.id_filme).toBeDefined();
            expect(normalized.tmdb_id).toBeDefined();
            expect(normalized.film).toBeDefined();
            expect(normalized.titulo_filme).toBeDefined();
            expect(normalized.addedBy).toBeDefined();
            expect(normalized.addedByUserId).toBeDefined();
            expect(normalized.addedAt).toBeDefined();
            
            // Film object should have all required fields
            expect(normalized.film.id).toBeDefined();
            expect(normalized.film.title).toBeDefined();
            expect(typeof normalized.film.title).toBe('string');
            expect(Array.isArray(normalized.film.genres)).toBe(true);
            expect(typeof normalized.film.rating).toBe('number');
            expect(typeof normalized.film.overview).toBe('string');
            
            // Streaming services should be an array
            expect(Array.isArray(normalized.streamingServices)).toBe(true);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should normalize entries with missing optional fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            film: fc.record({
              id: fc.integer({ min: 1, max: 1000000 }),
              title: fc.string({ minLength: 1, maxLength: 200 })
            })
          }),
          (rawEntry) => {
            const normalized = DataValidator.normalizeEntry(rawEntry);
            
            // Should have all required fields with defaults
            expect(normalized.id).toBeDefined();
            expect(normalized.id_filme).toBeDefined();
            expect(normalized.film).toBeDefined();
            expect(normalized.film.title).toBe(rawEntry.film.title);
            expect(normalized.film.id).toBe(rawEntry.film.id);
            expect(Array.isArray(normalized.film.genres)).toBe(true);
            expect(typeof normalized.film.rating).toBe('number');
            expect(typeof normalized.film.overview).toBe('string');
            expect(Array.isArray(normalized.streamingServices)).toBe(true);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should normalize entries with alternative field names', () => {
      fc.assert(
        fc.property(
          fc.record({
            id_filme: fc.string({ minLength: 1, maxLength: 50 }),
            titulo_filme: fc.string({ minLength: 1, maxLength: 200 }),
            ano: fc.integer({ min: 1900, max: 2030 }),
            tmdb_id: fc.integer({ min: 1, max: 1000000 })
          }),
          (rawEntry) => {
            // Add minimal film object to make it valid
            const entryWithFilm = {
              ...rawEntry,
              film: {
                id: rawEntry.tmdb_id,
                title: rawEntry.titulo_filme
              }
            };
            
            const normalized = DataValidator.normalizeEntry(entryWithFilm);
            
            // Should map alternative field names correctly
            expect(normalized.id).toBe(rawEntry.id_filme);
            expect(normalized.id_filme).toBe(rawEntry.id_filme);
            expect(normalized.titulo_filme).toBe(rawEntry.titulo_filme);
            expect(normalized.ano).toBe(rawEntry.ano);
            expect(normalized.tmdb_id).toBe(rawEntry.tmdb_id);
            expect(normalized.film.title).toBe(rawEntry.titulo_filme);
            expect(normalized.film.year).toBe(rawEntry.ano);
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should produce entries that pass completeness check', () => {
      fc.assert(
        fc.property(
          validEntryArb,
          (rawEntry) => {
            const normalized = DataValidator.normalizeEntry(rawEntry);
            
            // Normalized entry should be complete
            expect(DataValidator.isCompleteEntry(normalized)).toBe(true);
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
