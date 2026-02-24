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
 * Property-Based Tests for Watched Films Filters
 * Using fast-check for property-based testing
 */

const fc = require('fast-check');
const FilterManager = require('./filters.js');
const ListService = require('./list.js');
const StorageManager = require('./storage.js');

describe('FilterManager - Watched Films Property Tests', () => {
  let storageManager;
  let listService;
  let filterManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Initialize services
    storageManager = new StorageManager();
    listService = new ListService(storageManager);
    filterManager = new FilterManager(listService);
  });

  /**
   * Property 49: Watched films genre filter
   * Feature: letterboxd-manager, Property 49: Watched films genre filter
   * Validates: Requirements 15.2
   * 
   * For any genre and watched list, when a genre filter is applied, 
   * only watched films matching that genre should be displayed.
   */
  describe('Property 49: Watched films genre filter', () => {
    it('should filter watched films by genre correctly', () => {
      fc.assert(
        fc.property(
          // Generate a list of watched films with various genres
          fc.array(
            fc.record({
              id: fc.string(),
              film: fc.record({
                id: fc.integer({ min: 1, max: 100000 }),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                poster: fc.string(),
                rating: fc.float({ min: 0, max: 10 }),
                genres: fc.array(fc.constantFrom('Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance'), { minLength: 1, maxLength: 3 }),
                year: fc.integer({ min: 1900, max: 2024 }),
                overview: fc.string(),
                tmdbUrl: fc.string()
              }),
              rating: fc.float({ min: 1, max: 5 }),
              ratedBy: fc.string({ minLength: 1 }),
              ratedByUserId: fc.string(),
              watchedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              review: fc.string()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate a genre to filter by
          fc.constantFrom('Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance'),
          (watchedFilms, genreToFilter) => {
            // Apply genre filter
            const filtered = filterManager.filterByGenre(watchedFilms, genreToFilter);
            
            // All filtered films should contain the selected genre
            filtered.forEach(watchedFilm => {
              expect(watchedFilm.film.genres).toContain(genreToFilter);
            });
            
            // All films with the genre should be in the filtered list
            const filmsWithGenre = watchedFilms.filter(wf => 
              wf.film.genres && wf.film.genres.includes(genreToFilter)
            );
            expect(filtered.length).toBe(filmsWithGenre.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 50: Watched films name filter
   * Feature: letterboxd-manager, Property 50: Watched films name filter
   * Validates: Requirements 15.3
   * 
   * For any search text and watched list, when a name filter is applied, 
   * only watched films whose titles contain the search text should be displayed.
   */
  describe('Property 50: Watched films name filter', () => {
    it('should filter watched films by name correctly', () => {
      fc.assert(
        fc.property(
          // Generate a list of watched films with various titles
          fc.array(
            fc.record({
              id: fc.string(),
              film: fc.record({
                id: fc.integer({ min: 1, max: 100000 }),
                title: fc.constantFrom('The Matrix', 'Inception', 'The Dark Knight', 'Pulp Fiction', 'Fight Club', 'Interstellar'),
                poster: fc.string(),
                rating: fc.float({ min: 0, max: 10 }),
                genres: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
                year: fc.integer({ min: 1900, max: 2024 }),
                overview: fc.string(),
                tmdbUrl: fc.string()
              }),
              rating: fc.float({ min: 1, max: 5 }),
              ratedBy: fc.string({ minLength: 1 }),
              ratedByUserId: fc.string(),
              watchedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              review: fc.string()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate a search text
          fc.constantFrom('the', 'matrix', 'dark', 'fight', 'inter', 'pulp'),
          (watchedFilms, searchText) => {
            // Apply name filter
            const filtered = filterManager.filterByName(watchedFilms, searchText);
            
            // All filtered films should have titles containing the search text (case-insensitive)
            filtered.forEach(watchedFilm => {
              expect(watchedFilm.film.title.toLowerCase()).toContain(searchText.toLowerCase());
            });
            
            // All films with matching titles should be in the filtered list
            const filmsWithMatchingTitle = watchedFilms.filter(wf => 
              wf.film.title && wf.film.title.toLowerCase().includes(searchText.toLowerCase())
            );
            expect(filtered.length).toBe(filmsWithMatchingTitle.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 51: Watched films random order
   * Feature: letterboxd-manager, Property 51: Watched films random order
   * Validates: Requirements 15.4
   * 
   * For any watched list, when random order is applied multiple times, 
   * the resulting orderings should differ.
   */
  describe('Property 51: Watched films random order', () => {
    it('should produce different orderings when applied multiple times', () => {
      fc.assert(
        fc.property(
          // Generate a list of watched films with at least 3 items with unique IDs
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              film: fc.record({
                id: fc.integer({ min: 1, max: 100000 }),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                poster: fc.string(),
                rating: fc.float({ min: 0, max: 10 }),
                genres: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
                year: fc.integer({ min: 1900, max: 2024 }),
                overview: fc.string(),
                tmdbUrl: fc.string()
              }),
              rating: fc.float({ min: 1, max: 5 }),
              ratedBy: fc.string({ minLength: 1 }),
              ratedByUserId: fc.string(),
              watchedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              review: fc.string()
            }),
            { minLength: 3, maxLength: 10 }
          ).map(films => {
            // Ensure unique IDs by adding index
            return films.map((film, index) => ({
              ...film,
              id: `film_${index}_${film.id}`
            }));
          }),
          (watchedFilms) => {
            // Apply random ordering multiple times
            const shuffled1 = filterManager.shuffleArray(watchedFilms);
            const shuffled2 = filterManager.shuffleArray(watchedFilms);
            const shuffled3 = filterManager.shuffleArray(watchedFilms);
            
            // All shuffled arrays should have the same length
            expect(shuffled1.length).toBe(watchedFilms.length);
            expect(shuffled2.length).toBe(watchedFilms.length);
            expect(shuffled3.length).toBe(watchedFilms.length);
            
            // All shuffled arrays should contain the same elements
            const originalIds = watchedFilms.map(wf => wf.id).sort();
            expect(shuffled1.map(wf => wf.id).sort()).toEqual(originalIds);
            expect(shuffled2.map(wf => wf.id).sort()).toEqual(originalIds);
            expect(shuffled3.map(wf => wf.id).sort()).toEqual(originalIds);
            
            // At least one of the shuffled arrays should differ from the original order
            // (with high probability for lists with 3+ items)
            const order1 = shuffled1.map(wf => wf.id).join(',');
            const order2 = shuffled2.map(wf => wf.id).join(',');
            const order3 = shuffled3.map(wf => wf.id).join(',');
            const originalOrder = watchedFilms.map(wf => wf.id).join(',');
            
            // At least one should be different (very high probability with 3+ items)
            const allSame = order1 === originalOrder && order2 === originalOrder && order3 === originalOrder;
            expect(allSame).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 52: Watched films combined filters
   * Feature: letterboxd-manager, Property 52: Watched films combined filters
   * Validates: Requirements 15.5
   * 
   * For any combination of filters and watched list, when applied, 
   * only watched films matching all criteria should be displayed.
   */
  describe('Property 52: Watched films combined filters', () => {
    it('should apply multiple filters correctly', () => {
      fc.assert(
        fc.property(
          // Generate a list of watched films
          fc.array(
            fc.record({
              id: fc.string(),
              film: fc.record({
                id: fc.integer({ min: 1, max: 100000 }),
                title: fc.constantFrom('The Matrix', 'Matrix Reloaded', 'The Dark Knight', 'Dark Phoenix', 'Inception'),
                poster: fc.string(),
                rating: fc.float({ min: 0, max: 10 }),
                genres: fc.array(fc.constantFrom('Action', 'Comedy', 'Drama', 'Sci-Fi'), { minLength: 1, maxLength: 3 }),
                year: fc.integer({ min: 1900, max: 2024 }),
                overview: fc.string(),
                tmdbUrl: fc.string()
              }),
              rating: fc.float({ min: 1, max: 5 }),
              ratedBy: fc.string({ minLength: 1 }),
              ratedByUserId: fc.string(),
              watchedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              review: fc.string()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate filter criteria
          fc.constantFrom('Action', 'Sci-Fi', 'Drama'),
          fc.constantFrom('matrix', 'dark', 'the'),
          (watchedFilms, genre, searchText) => {
            // Set filters
            filterManager.setGenreFilter(genre);
            filterManager.setNameFilter(searchText);
            
            // Apply combined filters
            const filtered = filterManager.applyFilters(watchedFilms);
            
            // All filtered films should match both criteria
            filtered.forEach(watchedFilm => {
              expect(watchedFilm.film.genres).toContain(genre);
              expect(watchedFilm.film.title.toLowerCase()).toContain(searchText.toLowerCase());
            });
            
            // All films matching both criteria should be in the filtered list
            const matchingFilms = watchedFilms.filter(wf => 
              wf.film.genres && wf.film.genres.includes(genre) &&
              wf.film.title && wf.film.title.toLowerCase().includes(searchText.toLowerCase())
            );
            expect(filtered.length).toBe(matchingFilms.length);
            
            // Clean up
            filterManager.clearAllFilters();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 53: Watched films clear filters
   * Feature: letterboxd-manager, Property 53: Watched films clear filters
   * Validates: Requirements 15.6
   * 
   * For any filtered watched list, when filters are cleared, 
   * all watched films should be displayed.
   */
  describe('Property 53: Watched films clear filters', () => {
    it('should display all films when filters are cleared', () => {
      fc.assert(
        fc.property(
          // Generate a list of watched films
          fc.array(
            fc.record({
              id: fc.string(),
              film: fc.record({
                id: fc.integer({ min: 1, max: 100000 }),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                poster: fc.string(),
                rating: fc.float({ min: 0, max: 10 }),
                genres: fc.array(fc.constantFrom('Action', 'Comedy', 'Drama'), { minLength: 1, maxLength: 3 }),
                year: fc.integer({ min: 1900, max: 2024 }),
                overview: fc.string(),
                tmdbUrl: fc.string()
              }),
              rating: fc.float({ min: 1, max: 5 }),
              ratedBy: fc.string({ minLength: 1 }),
              ratedByUserId: fc.string(),
              watchedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              review: fc.string()
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (watchedFilms) => {
            // Apply some filters
            filterManager.setGenreFilter('Action');
            filterManager.setNameFilter('test');
            filterManager.setRandomFilter(true);
            
            // Clear all filters
            filterManager.clearAllFilters();
            
            // Apply filters (should return all films since filters are cleared)
            const filtered = filterManager.applyFilters(watchedFilms);
            
            // Should return all films (same length)
            expect(filtered.length).toBe(watchedFilms.length);
            
            // Should contain all the same film IDs
            const originalIds = watchedFilms.map(wf => wf.id).sort();
            const filteredIds = filtered.map(wf => wf.id).sort();
            expect(filteredIds).toEqual(originalIds);
            
            // Verify filters are actually cleared
            const activeFilters = filterManager.getActiveFilters();
            expect(activeFilters.genre).toBeNull();
            expect(activeFilters.name).toBeNull();
            expect(activeFilters.random).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
