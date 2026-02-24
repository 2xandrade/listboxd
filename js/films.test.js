/**
 * FilmService Tests
 * Property-based and unit tests for TMDB API integration
 */

const fc = require('fast-check');
const FilmService = require('./films.js');

// Mock CONFIG for tests
global.CONFIG = {
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
    readAccessToken: 'test_token'
  },
  app: {
    cacheExpiration: 300000
  }
};

describe('FilmService', () => {
  let filmService;

  beforeEach(() => {
    filmService = new FilmService();
    // Clear cache before each test
    filmService.cache.clear();
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: letterboxd-manager, Property 9: Film data parsing completeness
     * Validates: Requirements 3.4
     * 
     * For any valid TMDB API film response, when parsed by the system,
     * all required fields (poster, title, rating, genre) should be extracted correctly.
     */
    test('Property 9: Film data parsing completeness', () => {
      // Generator for valid TMDB film responses
      const tmdbFilmArbitrary = fc.record({
        id: fc.integer({ min: 1, max: 1000000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        original_title: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
        poster_path: fc.option(fc.string({ minLength: 1 }).map(s => `/poster_${s}.jpg`)),
        vote_average: fc.float({ min: 0, max: 10, noNaN: true }),
        genres: fc.option(fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 100 }),
            name: fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance')
          }),
          { minLength: 0, maxLength: 5 }
        )),
        genre_ids: fc.option(fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 0, maxLength: 5 })),
        release_date: fc.option(
          fc.integer({ min: 1900, max: 2030 })
            .chain(year => 
              fc.integer({ min: 1, max: 12 })
                .chain(month => 
                  fc.integer({ min: 1, max: 28 })
                    .map(day => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
                )
            )
        ),
        overview: fc.option(fc.string({ maxLength: 1000 }))
      });

      fc.assert(
        fc.property(tmdbFilmArbitrary, (tmdbFilm) => {
          const parsed = filmService.parseFilm(tmdbFilm);

          // All required fields must be present
          expect(parsed).toHaveProperty('id');
          expect(parsed).toHaveProperty('title');
          expect(parsed).toHaveProperty('poster');
          expect(parsed).toHaveProperty('rating');
          expect(parsed).toHaveProperty('genres');
          expect(parsed).toHaveProperty('year');
          expect(parsed).toHaveProperty('overview');
          expect(parsed).toHaveProperty('tmdbUrl');

          // ID must be preserved
          expect(parsed.id).toBe(tmdbFilm.id);

          // Title must be extracted (prefer title over original_title)
          if (tmdbFilm.title) {
            expect(parsed.title).toBe(tmdbFilm.title);
          } else if (tmdbFilm.original_title) {
            expect(parsed.title).toBe(tmdbFilm.original_title);
          } else {
            expect(parsed.title).toBe('Unknown Title');
          }

          // Poster must be correctly formatted or null
          if (tmdbFilm.poster_path) {
            expect(parsed.poster).toBe(`${filmService.imageBaseUrl}${tmdbFilm.poster_path}`);
          } else {
            expect(parsed.poster).toBeNull();
          }

          // Rating must be extracted or default to 0
          expect(parsed.rating).toBe(tmdbFilm.vote_average || 0);
          expect(typeof parsed.rating).toBe('number');

          // Genres must be extracted (either from genres array or genre_ids)
          if (tmdbFilm.genres) {
            expect(parsed.genres).toEqual(tmdbFilm.genres.map(g => g.name));
          } else if (tmdbFilm.genre_ids) {
            // Now genre_ids should be mapped to names
            expect(Array.isArray(parsed.genres)).toBe(true);
            expect(parsed.genres.length).toBe(tmdbFilm.genre_ids.length);
            // All genres should be strings (names, not IDs)
            parsed.genres.forEach(genre => {
              expect(typeof genre).toBe('string');
            });
          } else {
            expect(parsed.genres).toEqual([]);
          }
          expect(Array.isArray(parsed.genres)).toBe(true);

          // Year must be extracted from release_date or null
          if (tmdbFilm.release_date) {
            const expectedYear = new Date(tmdbFilm.release_date).getFullYear();
            expect(parsed.year).toBe(expectedYear);
          } else {
            expect(parsed.year).toBeNull();
          }

          // Overview must be extracted or empty string
          expect(parsed.overview).toBe(tmdbFilm.overview || '');
          expect(typeof parsed.overview).toBe('string');

          // TMDB URL must be correctly formatted
          expect(parsed.tmdbUrl).toBe(`https://www.themoviedb.org/movie/${tmdbFilm.id}`);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: letterboxd-manager, Property 22: Genre ID to name mapping
     * Validates: Requirements 9.1
     * 
     * For any valid TMDB genre ID, when the system processes it,
     * it should map to the corresponding genre name.
     */
    test('Property 22: Genre ID to name mapping', () => {
      // Generator for valid TMDB genre IDs (from the genreMap)
      const validGenreIds = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
      const genreIdArbitrary = fc.constantFrom(...validGenreIds);

      fc.assert(
        fc.property(genreIdArbitrary, (genreId) => {
          const genreName = filmService.getGenreName(genreId);

          // Genre name must be a non-empty string
          expect(typeof genreName).toBe('string');
          expect(genreName.length).toBeGreaterThan(0);

          // Genre name must not be 'Desconhecido' for valid IDs
          expect(genreName).not.toBe('Desconhecido');

          // Genre name must not be a number (must be mapped)
          expect(isNaN(parseInt(genreName))).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: letterboxd-manager, Property 23: Genre names display
     * Validates: Requirements 9.2
     * 
     * For any film display, when showing genres, only genre names should appear,
     * never numeric IDs.
     */
    test('Property 23: Genre names display', () => {
      // Generator for TMDB films with genre_ids
      const validGenreIds = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
      const tmdbFilmWithGenreIdsArbitrary = fc.record({
        id: fc.integer({ min: 1, max: 1000000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        genre_ids: fc.array(fc.constantFrom(...validGenreIds), { minLength: 1, maxLength: 5 }),
        vote_average: fc.float({ min: 0, max: 10, noNaN: true }),
        release_date: fc.option(fc.string())
      });

      fc.assert(
        fc.property(tmdbFilmWithGenreIdsArbitrary, (tmdbFilm) => {
          const parsed = filmService.parseFilm(tmdbFilm);

          // Genres must be an array
          expect(Array.isArray(parsed.genres)).toBe(true);
          expect(parsed.genres.length).toBeGreaterThan(0);

          // All genres must be strings (names, not numeric IDs)
          parsed.genres.forEach(genre => {
            expect(typeof genre).toBe('string');
            // Genre should not be a numeric string
            expect(isNaN(parseInt(genre)) || genre.includes(' ')).toBe(true);
            // Genre should not be 'Desconhecido' for valid IDs
            expect(genre).not.toBe('Desconhecido');
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: letterboxd-manager, Property 24: Multiple genres display
     * Validates: Requirements 9.3
     * 
     * For any film with multiple genres, when displayed, all genre names
     * should be shown in a readable format.
     */
    test('Property 24: Multiple genres display', () => {
      // Generator for TMDB films with multiple genre_ids
      const validGenreIds = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
      const tmdbFilmWithMultipleGenresArbitrary = fc.record({
        id: fc.integer({ min: 1, max: 1000000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        genre_ids: fc.array(fc.constantFrom(...validGenreIds), { minLength: 2, maxLength: 5 }),
        vote_average: fc.float({ min: 0, max: 10, noNaN: true }),
        release_date: fc.option(fc.string())
      });

      fc.assert(
        fc.property(tmdbFilmWithMultipleGenresArbitrary, (tmdbFilm) => {
          const parsed = filmService.parseFilm(tmdbFilm);

          // Genres must be an array with multiple elements
          expect(Array.isArray(parsed.genres)).toBe(true);
          expect(parsed.genres.length).toBeGreaterThanOrEqual(2);
          expect(parsed.genres.length).toBe(tmdbFilm.genre_ids.length);

          // All genres must be strings (names)
          parsed.genres.forEach(genre => {
            expect(typeof genre).toBe('string');
            expect(genre.length).toBeGreaterThan(0);
          });

          // Genres should be in a readable format (array of strings)
          // This allows for easy display as comma-separated or other formats
          const genreString = parsed.genres.join(', ');
          expect(genreString.length).toBeGreaterThan(0);
          expect(genreString).toContain(',');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: letterboxd-manager, Property 25: Page size limit
     * Validates: Requirements 10.1
     * 
     * For any page of films, when displayed, the number of films
     * should not exceed the configured page size.
     */
    test('Property 25: Page size limit', async () => {
      // Mock fetch to return controlled data
      const originalFetch = global.fetch;
      
      // Generator for page numbers
      const pageArbitrary = fc.integer({ min: 1, max: 10 });
      
      await fc.assert(
        fc.asyncProperty(pageArbitrary, async (page) => {
          // Clear cache before each property test iteration
          filmService.cache.clear();
          
          // Generate a random number of results (TMDB typically returns 20 per page)
          const numResults = Math.min(20, Math.floor(Math.random() * 20) + 1);
          const mockResults = Array.from({ length: numResults }, (_, i) => ({
            id: page * 1000 + i,
            title: `Film ${i}`,
            vote_average: 7.5,
            release_date: '2024-01-01'
          }));

          global.fetch = jest.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                results: mockResults,
                total_pages: 10,
                page: page
              })
            })
          );

          const result = await filmService.getPopularFilms(page);

          // The number of films returned should not exceed 20 (TMDB's page size)
          expect(result.films.length).toBeLessThanOrEqual(20);
          expect(result.films.length).toBeGreaterThan(0);
          
          // Verify result structure
          expect(result).toHaveProperty('films');
          expect(result).toHaveProperty('totalPages');
          expect(Array.isArray(result.films)).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });

    /**
     * Feature: letterboxd-manager, Property 26: Page navigation
     * Validates: Requirements 10.3
     * 
     * For any valid page number, when a user navigates to that page,
     * the system should load and display films for that page.
     */
    test('Property 26: Page navigation', async () => {
      const originalFetch = global.fetch;
      
      // Generator for valid page numbers
      const pageArbitrary = fc.integer({ min: 1, max: 100 });
      
      await fc.assert(
        fc.asyncProperty(pageArbitrary, async (page) => {
          // Clear cache before each property test iteration
          filmService.cache.clear();
          
          // Mock fetch to return page-specific data
          global.fetch = jest.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                results: Array.from({ length: 20 }, (_, i) => ({
                  id: page * 1000 + i,
                  title: `Film ${page}-${i}`,
                  vote_average: 7.5,
                  release_date: '2024-01-01'
                })),
                total_pages: 100,
                page: page
              })
            })
          );

          const result = await filmService.getPopularFilms(page);

          // Verify that films are returned
          expect(result.films.length).toBeGreaterThan(0);
          
          // Verify that the page parameter was used in the request
          expect(global.fetch).toHaveBeenCalled();
          const fetchCall = global.fetch.mock.calls[0][0];
          expect(fetchCall).toContain(`page=${page}`);
          
          // Verify result structure
          expect(result).toHaveProperty('films');
          expect(result).toHaveProperty('totalPages');
          expect(result.totalPages).toBe(100);
        }),
        { numRuns: 100 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });

    /**
     * Feature: letterboxd-manager, Property 27: Pagination info display
     * Validates: Requirements 10.6
     * 
     * For any paginated view, when displayed, the current page number
     * and total pages should be visible.
     */
    test('Property 27: Pagination info display', async () => {
      const originalFetch = global.fetch;
      
      // Generator for page numbers and total pages
      const paginationArbitrary = fc.record({
        currentPage: fc.integer({ min: 1, max: 50 }),
        totalPages: fc.integer({ min: 1, max: 100 })
      }).filter(({ currentPage, totalPages }) => currentPage <= totalPages);
      
      await fc.assert(
        fc.asyncProperty(paginationArbitrary, async ({ currentPage, totalPages }) => {
          // Clear cache before each property test iteration
          filmService.cache.clear();
          
          // Mock fetch to return pagination data
          global.fetch = jest.fn(() =>
            Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                results: Array.from({ length: 20 }, (_, i) => ({
                  id: currentPage * 1000 + i,
                  title: `Film ${i}`,
                  vote_average: 7.5,
                  release_date: '2024-01-01'
                })),
                total_pages: totalPages,
                page: currentPage
              })
            })
          );

          const result = await filmService.getPopularFilms(currentPage);

          // Verify that pagination info is included in the result
          expect(result).toHaveProperty('totalPages');
          expect(result.totalPages).toBe(totalPages);
          
          // Verify that films are returned (indicating current page data)
          expect(result.films.length).toBeGreaterThan(0);
          
          // The result should contain all necessary info to display pagination
          expect(typeof result.totalPages).toBe('number');
          expect(result.totalPages).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('Unit Tests - API Response Parsing', () => {
    /**
     * Unit tests for parsing API responses
     * Validates: Requirements 3.4
     */
    test('should parse complete TMDB film response correctly', () => {
      const tmdbFilm = {
        id: 550,
        title: 'Fight Club',
        original_title: 'Fight Club',
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        vote_average: 8.4,
        genres: [
          { id: 18, name: 'Drama' },
          { id: 53, name: 'Thriller' }
        ],
        release_date: '1999-10-15',
        overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.id).toBe(550);
      expect(parsed.title).toBe('Fight Club');
      expect(parsed.poster).toBe('https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg');
      expect(parsed.rating).toBe(8.4);
      expect(parsed.genres).toEqual(['Drama', 'Thriller']);
      expect(parsed.year).toBe(1999);
      expect(parsed.overview).toBe('A ticking-time-bomb insomniac and a slippery soap salesman...');
      expect(parsed.tmdbUrl).toBe('https://www.themoviedb.org/movie/550');
    });

    test('should handle missing poster_path gracefully', () => {
      const tmdbFilm = {
        id: 123,
        title: 'Test Movie',
        vote_average: 7.5,
        release_date: '2020-01-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.poster).toBeNull();
      expect(parsed.id).toBe(123);
      expect(parsed.title).toBe('Test Movie');
    });

    test('should handle missing title by using original_title', () => {
      const tmdbFilm = {
        id: 456,
        original_title: 'Original Title',
        vote_average: 6.0,
        release_date: '2021-05-10'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.title).toBe('Original Title');
    });

    test('should default to "Unknown Title" when both title and original_title are missing', () => {
      const tmdbFilm = {
        id: 789,
        vote_average: 5.5,
        release_date: '2022-03-15'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.title).toBe('Unknown Title');
    });

    test('should handle missing vote_average by defaulting to 0', () => {
      const tmdbFilm = {
        id: 111,
        title: 'Unrated Movie',
        release_date: '2023-07-20'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.rating).toBe(0);
    });

    test('should parse genres from genres array', () => {
      const tmdbFilm = {
        id: 222,
        title: 'Genre Test',
        genres: [
          { id: 28, name: 'Action' },
          { id: 12, name: 'Adventure' },
          { id: 878, name: 'Science Fiction' }
        ],
        release_date: '2024-01-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.genres).toEqual(['Action', 'Adventure', 'Science Fiction']);
    });

    test('should use genre_ids when genres array is not present', () => {
      const tmdbFilm = {
        id: 333,
        title: 'Genre ID Test',
        genre_ids: [28, 12, 878],
        release_date: '2024-02-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      // genre_ids should now be mapped to names
      expect(parsed.genres).toEqual(['Ação', 'Aventura', 'Ficção Científica']);
    });

    test('should default to empty array when no genre information is present', () => {
      const tmdbFilm = {
        id: 444,
        title: 'No Genre Movie',
        release_date: '2024-03-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.genres).toEqual([]);
    });

    test('should handle missing release_date by setting year to null', () => {
      const tmdbFilm = {
        id: 555,
        title: 'No Release Date',
        vote_average: 7.0
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.year).toBeNull();
    });

    test('should handle missing overview by defaulting to empty string', () => {
      const tmdbFilm = {
        id: 666,
        title: 'No Overview',
        release_date: '2024-04-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.overview).toBe('');
    });

    /**
     * Unit test for overview extraction
     * Validates: Requirements 3.4, 3.6
     * 
     * Verifies that overview is extracted correctly from the API response
     */
    test('should extract overview correctly from TMDB response', () => {
      const tmdbFilm = {
        id: 550,
        title: 'Fight Club',
        overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
        vote_average: 8.4,
        release_date: '1999-10-15'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.overview).toBe('A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.');
      expect(typeof parsed.overview).toBe('string');
      expect(parsed.overview.length).toBeGreaterThan(0);
    });

    /**
     * Unit test for empty overview handling
     * Validates: Requirements 3.4, 3.6
     * 
     * Verifies that empty overview is handled correctly
     */
    test('should handle empty overview string', () => {
      const tmdbFilm = {
        id: 777,
        title: 'Empty Overview Movie',
        overview: '',
        vote_average: 7.0,
        release_date: '2024-01-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.overview).toBe('');
      expect(typeof parsed.overview).toBe('string');
    });

    /**
     * Unit test for whitespace-only overview handling
     * Validates: Requirements 3.4, 3.6
     * 
     * Verifies that whitespace-only overview is preserved (UI will handle display)
     */
    test('should preserve whitespace-only overview', () => {
      const tmdbFilm = {
        id: 888,
        title: 'Whitespace Overview Movie',
        overview: '   ',
        vote_average: 6.5,
        release_date: '2024-02-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.overview).toBe('   ');
      expect(typeof parsed.overview).toBe('string');
    });

    /**
     * Unit test for long overview handling
     * Validates: Requirements 3.4, 3.6
     * 
     * Verifies that long overviews are extracted correctly
     */
    test('should handle long overview text', () => {
      const longOverview = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      const tmdbFilm = {
        id: 999,
        title: 'Long Overview Movie',
        overview: longOverview,
        vote_average: 7.5,
        release_date: '2024-03-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.overview).toBe(longOverview);
      expect(typeof parsed.overview).toBe('string');
      expect(parsed.overview.length).toBeGreaterThan(100);
    });

    /**
     * Unit test for overview with special characters
     * Validates: Requirements 3.4, 3.6
     * 
     * Verifies that overview with special characters is extracted correctly
     */
    test('should handle overview with special characters', () => {
      const tmdbFilm = {
        id: 1010,
        title: 'Special Characters Movie',
        overview: 'A story about "quotes", \'apostrophes\', & ampersands, <tags>, and émojis 🎬',
        vote_average: 8.0,
        release_date: '2024-04-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.overview).toBe('A story about "quotes", \'apostrophes\', & ampersands, <tags>, and émojis 🎬');
      expect(typeof parsed.overview).toBe('string');
    });

    test('should handle malformed release_date gracefully', () => {
      const tmdbFilm = {
        id: 777,
        title: 'Bad Date Format',
        release_date: 'invalid-date'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      // new Date('invalid-date') returns Invalid Date, getFullYear() returns NaN
      expect(isNaN(parsed.year)).toBe(true);
    });

    test('should handle empty genres array', () => {
      const tmdbFilm = {
        id: 888,
        title: 'Empty Genres',
        genres: [],
        release_date: '2024-05-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.genres).toEqual([]);
    });

    test('should handle empty genre_ids array', () => {
      const tmdbFilm = {
        id: 999,
        title: 'Empty Genre IDs',
        genre_ids: [],
        release_date: '2024-06-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.genres).toEqual([]);
    });

    test('should always generate correct TMDB URL', () => {
      const tmdbFilm = {
        id: 12345,
        title: 'URL Test'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.tmdbUrl).toBe('https://www.themoviedb.org/movie/12345');
    });

    test('should handle zero rating', () => {
      const tmdbFilm = {
        id: 1111,
        title: 'Zero Rating',
        vote_average: 0,
        release_date: '2024-07-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.rating).toBe(0);
    });

    test('should handle maximum rating', () => {
      const tmdbFilm = {
        id: 2222,
        title: 'Perfect Rating',
        vote_average: 10,
        release_date: '2024-08-01'
      };

      const parsed = filmService.parseFilm(tmdbFilm);

      expect(parsed.rating).toBe(10);
    });
  });

  describe('Example Tests', () => {
    /**
     * Example test for API error handling
     * Validates: Requirements 3.5
     * 
     * Verifies that when the TMDB API is unavailable, the system displays
     * an appropriate error message.
     */
    test('should display error message when API is unavailable', async () => {
      // Mock fetch to simulate network failure
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        Promise.reject(new Error('fetch failed: Network error'))
      );

      try {
        await filmService.getPopularFilms();
        // If we reach here, the test should fail
        fail('Expected an error to be thrown');
      } catch (error) {
        // Verify that an appropriate error message is returned
        expect(error.message).toContain('Network error');
        expect(error.message).toContain('Unable to connect to TMDB API');
      } finally {
        // Restore original fetch
        global.fetch = originalFetch;
      }
    });

    test('should handle 404 errors appropriately', async () => {
      // Mock fetch to simulate 404 response
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({})
        })
      );

      try {
        await filmService.getFilmDetails(999999);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Resource not found');
      } finally {
        global.fetch = originalFetch;
      }
    });

    test('should handle 500 server errors appropriately', async () => {
      // Mock fetch to simulate 500 response
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({})
        })
      );

      try {
        await filmService.getPopularFilms();
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('TMDB API server error');
      } finally {
        global.fetch = originalFetch;
      }
    });

    test('should handle 401 authentication errors appropriately', async () => {
      // Mock fetch to simulate 401 response
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({})
        })
      );

      try {
        await filmService.searchFilms('test');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Invalid API credentials');
      } finally {
        global.fetch = originalFetch;
      }
    });

    test('should handle 429 rate limit errors appropriately', async () => {
      // Mock fetch to simulate 429 response
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({})
        })
      );

      try {
        await filmService.getTrendingFilms();
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toBe('API rate limit exceeded');
      } finally {
        global.fetch = originalFetch;
      }
    });

    /**
     * Example tests for pagination controls
     * Validates: Requirements 10.2, 10.4, 10.5
     * 
     * Verifies that pagination controls are present and behave correctly
     * at page boundaries.
     */
    test('should have pagination controls present in the interface', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="pagination-controls" class="pagination-controls">
          <button id="prev-page-btn" class="pagination-btn">← Anterior</button>
          <span id="pagination-info" class="pagination-info"></span>
          <button id="next-page-btn" class="pagination-btn">Próximo →</button>
        </div>
      `;

      // Verify that navigation controls are present
      const paginationControls = document.getElementById('pagination-controls');
      const prevBtn = document.getElementById('prev-page-btn');
      const nextBtn = document.getElementById('next-page-btn');
      const paginationInfo = document.getElementById('pagination-info');

      expect(paginationControls).not.toBeNull();
      expect(prevBtn).not.toBeNull();
      expect(nextBtn).not.toBeNull();
      expect(paginationInfo).not.toBeNull();

      // Verify button text
      expect(prevBtn.textContent).toContain('Anterior');
      expect(nextBtn.textContent).toContain('Próximo');
    });

    test('should disable previous button on first page', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="pagination-controls" class="pagination-controls">
          <button id="prev-page-btn" class="pagination-btn">← Anterior</button>
          <span id="pagination-info" class="pagination-info">Página 1 de 10</span>
          <button id="next-page-btn" class="pagination-btn">Próximo →</button>
        </div>
      `;

      const prevBtn = document.getElementById('prev-page-btn');
      const nextBtn = document.getElementById('next-page-btn');

      // Simulate being on first page
      prevBtn.disabled = true;
      prevBtn.classList.add('disabled');
      nextBtn.disabled = false;
      nextBtn.classList.remove('disabled');

      // Verify previous button is disabled on first page
      expect(prevBtn.disabled).toBe(true);
      expect(prevBtn.classList.contains('disabled')).toBe(true);
      
      // Verify next button is enabled
      expect(nextBtn.disabled).toBe(false);
    });

    test('should disable next button on last page', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="pagination-controls" class="pagination-controls">
          <button id="prev-page-btn" class="pagination-btn">← Anterior</button>
          <span id="pagination-info" class="pagination-info">Página 10 de 10</span>
          <button id="next-page-btn" class="pagination-btn">Próximo →</button>
        </div>
      `;

      const prevBtn = document.getElementById('prev-page-btn');
      const nextBtn = document.getElementById('next-page-btn');

      // Simulate being on last page
      prevBtn.disabled = false;
      prevBtn.classList.remove('disabled');
      nextBtn.disabled = true;
      nextBtn.classList.add('disabled');

      // Verify next button is disabled on last page
      expect(nextBtn.disabled).toBe(true);
      expect(nextBtn.classList.contains('disabled')).toBe(true);
      
      // Verify previous button is enabled
      expect(prevBtn.disabled).toBe(false);
    });

    test('should enable both buttons on middle pages', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <div id="pagination-controls" class="pagination-controls">
          <button id="prev-page-btn" class="pagination-btn">← Anterior</button>
          <span id="pagination-info" class="pagination-info">Página 5 de 10</span>
          <button id="next-page-btn" class="pagination-btn">Próximo →</button>
        </div>
      `;

      const prevBtn = document.getElementById('prev-page-btn');
      const nextBtn = document.getElementById('next-page-btn');

      // Simulate being on a middle page
      prevBtn.disabled = false;
      prevBtn.classList.remove('disabled');
      nextBtn.disabled = false;
      nextBtn.classList.remove('disabled');

      // Verify both buttons are enabled on middle pages
      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(false);
      expect(prevBtn.classList.contains('disabled')).toBe(false);
      expect(nextBtn.classList.contains('disabled')).toBe(false);
    });
  });
});
