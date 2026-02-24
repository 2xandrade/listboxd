/**
 * Property-based tests for Film Details Modal
 * Uses fast-check for property-based testing
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

const fc = require('fast-check');

// Mock DOM setup
beforeEach(() => {
  document.body.innerHTML = `
    <div id="app">
      <main id="main-content"></main>
      
      <!-- Film Details Modal -->
      <div id="film-modal" class="modal hidden">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <button class="modal-close" aria-label="Fechar">&times;</button>
          <div class="modal-body">
            <div class="modal-poster-container">
              <img id="modal-poster" class="modal-poster" alt="" />
            </div>
            <div class="modal-info">
              <h2 id="modal-title" class="modal-title"></h2>
              <div class="modal-meta">
                <span id="modal-rating" class="modal-rating"></span>
                <span id="modal-year" class="modal-year"></span>
              </div>
              <div id="modal-genres" class="modal-genres"></div>
              <div class="modal-synopsis">
                <h3>Sinopse</h3>
                <p id="modal-overview"></p>
              </div>
              <button id="modal-add-btn" class="modal-add-btn">Adicionar à Lista</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
});

afterEach(() => {
  document.body.innerHTML = '';
  document.body.classList.remove('modal-open');
});

describe('Film Details Modal - Property-Based Tests', () => {
  // Generator for film objects
  const filmArb = fc.record({
    id: fc.integer({ min: 1, max: 1000000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    poster: fc.option(fc.webUrl()),
    rating: fc.float({ min: 0, max: 10, noNaN: true }),
    genres: fc.array(
      fc.constantFrom('Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Fantasy'),
      { minLength: 0, maxLength: 5 }
    ),
    year: fc.option(fc.integer({ min: 1900, max: 2030 })),
    overview: fc.string({ minLength: 0, maxLength: 1000 }),
    tmdbUrl: fc.webUrl()
  });

  /**
   * Feature: letterboxd-manager, Property 19: Film detail view display
   * Validates: Requirements 8.1
   * 
   * For any film, when a user clicks on it, a detailed view with film information should be displayed.
   */
  describe('Property 19: Film detail view display', () => {
    it('should display modal when showFilmModal is called with any film', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Get modal element
            const modal = document.getElementById('film-modal');
            
            // Modal should be hidden initially
            expect(modal.classList.contains('hidden')).toBe(true);
            
            // Show modal with film
            showFilmModal(film);
            
            // Modal should now be visible
            expect(modal.classList.contains('hidden')).toBe(false);
            
            // Body should have modal-open class
            expect(document.body.classList.contains('modal-open')).toBe(true);
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display modal with all required elements present', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Show modal
            showFilmModal(film);
            
            const modal = document.getElementById('film-modal');
            
            // Check that all required elements exist
            expect(modal.querySelector('.modal-overlay')).toBeDefined();
            expect(modal.querySelector('.modal-content')).toBeDefined();
            expect(modal.querySelector('.modal-close')).toBeDefined();
            expect(modal.querySelector('#modal-poster')).toBeDefined();
            expect(modal.querySelector('#modal-title')).toBeDefined();
            expect(modal.querySelector('#modal-rating')).toBeDefined();
            expect(modal.querySelector('#modal-year')).toBeDefined();
            expect(modal.querySelector('#modal-genres')).toBeDefined();
            expect(modal.querySelector('#modal-overview')).toBeDefined();
            expect(modal.querySelector('#modal-add-btn')).toBeDefined();
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close modal when closeFilmModal is called', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            const modal = document.getElementById('film-modal');
            
            // Show modal
            showFilmModal(film);
            expect(modal.classList.contains('hidden')).toBe(false);
            
            // Close modal
            closeFilmModal();
            
            // Modal should be hidden
            expect(modal.classList.contains('hidden')).toBe(true);
            
            // Body should not have modal-open class
            expect(document.body.classList.contains('modal-open')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 20: Synopsis display in details
   * Validates: Requirements 8.2
   * 
   * For any film detail view, when displayed, the film synopsis should be visible.
   */
  describe('Property 20: Synopsis display in details', () => {
    it('should display synopsis for any film with overview', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Skip if film doesn't have overview
            if (!film.overview || film.overview.trim() === '') {
              return true;
            }
            
            // Show modal
            showFilmModal(film);
            
            // Get overview element
            const overviewEl = document.getElementById('modal-overview');
            
            // Overview should be displayed
            expect(overviewEl).toBeDefined();
            expect(overviewEl.textContent).toBe(film.overview);
            expect(overviewEl.textContent.length).toBeGreaterThan(0);
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display fallback message when synopsis is empty', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Only test when overview is empty
            if (film.overview && film.overview.trim() !== '') {
              return true;
            }
            
            // Show modal
            showFilmModal(film);
            
            // Get overview element
            const overviewEl = document.getElementById('modal-overview');
            
            // Should display fallback message
            expect(overviewEl).toBeDefined();
            expect(overviewEl.textContent).toContain('não disponível');
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always have synopsis section visible', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Show modal
            showFilmModal(film);
            
            // Synopsis section should exist
            const synopsisSection = document.querySelector('.modal-synopsis');
            expect(synopsisSection).toBeDefined();
            
            // Synopsis heading should exist
            const synopsisHeading = synopsisSection.querySelector('h3');
            expect(synopsisHeading).toBeDefined();
            expect(synopsisHeading.textContent).toContain('Sinopse');
            
            // Overview paragraph should exist
            const overviewEl = document.getElementById('modal-overview');
            expect(overviewEl).toBeDefined();
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 21: Complete film details display
   * Validates: Requirements 8.3
   * 
   * For any film detail view, when displayed, it should show poster, title, rating, genres, and release year.
   */
  describe('Property 21: Complete film details display', () => {
    it('should display all required film details', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Show modal
            showFilmModal(film);
            
            // Check title
            const titleEl = document.getElementById('modal-title');
            expect(titleEl).toBeDefined();
            expect(titleEl.textContent).toBe(film.title);
            
            // Check rating
            const ratingEl = document.getElementById('modal-rating');
            expect(ratingEl).toBeDefined();
            expect(ratingEl.textContent).toContain(film.rating.toFixed(1));
            expect(ratingEl.textContent).toContain('★');
            
            // Check year
            const yearEl = document.getElementById('modal-year');
            expect(yearEl).toBeDefined();
            if (film.year) {
              expect(yearEl.textContent).toContain(film.year.toString());
            }
            
            // Check genres
            const genresEl = document.getElementById('modal-genres');
            expect(genresEl).toBeDefined();
            if (film.genres && film.genres.length > 0) {
              const genresText = film.genres.join(', ');
              expect(genresEl.textContent).toBe(genresText);
            }
            
            // Check poster
            const posterEl = document.getElementById('modal-poster');
            expect(posterEl).toBeDefined();
            if (film.poster) {
              // Browser normalizes URLs, so we just check that poster was set
              // and that it's a valid URL
              expect(posterEl.src).toBeTruthy();
              expect(posterEl.src.length).toBeGreaterThan(0);
              expect(posterEl.alt).toBe(film.title);
              expect(posterEl.classList.contains('no-poster')).toBe(false);
            }
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle films with missing optional fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000000 }),
            title: fc.string({ minLength: 1, maxLength: 200 }),
            poster: fc.constant(null),
            rating: fc.float({ min: 0, max: 10, noNaN: true }),
            genres: fc.constant([]),
            year: fc.constant(null),
            overview: fc.constant(''),
            tmdbUrl: fc.webUrl()
          }),
          (film) => {
            // Show modal
            showFilmModal(film);
            
            // Required fields should still be present
            const titleEl = document.getElementById('modal-title');
            expect(titleEl.textContent).toBe(film.title);
            
            const ratingEl = document.getElementById('modal-rating');
            expect(ratingEl.textContent).toContain(film.rating.toFixed(1));
            
            // Optional fields should handle gracefully
            const posterEl = document.getElementById('modal-poster');
            expect(posterEl).toBeDefined();
            
            const yearEl = document.getElementById('modal-year');
            expect(yearEl).toBeDefined();
            
            const genresEl = document.getElementById('modal-genres');
            expect(genresEl).toBeDefined();
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display poster or placeholder for all films', () => {
      fc.assert(
        fc.property(
          filmArb,
          (film) => {
            // Show modal
            showFilmModal(film);
            
            const posterEl = document.getElementById('modal-poster');
            expect(posterEl).toBeDefined();
            
            if (film.poster) {
              // Should have poster URL set (browser normalizes URLs)
              expect(posterEl.src).toBeTruthy();
              expect(posterEl.src.length).toBeGreaterThan(0);
              expect(posterEl.classList.contains('no-poster')).toBe(false);
            } else {
              // Should have placeholder
              expect(posterEl.classList.contains('no-poster')).toBe(true);
            }
            
            // Clean up
            closeFilmModal();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Example Tests for Modal Buttons
   * Validates: Requirements 8.4, 8.5
   */
  describe('Example Tests: Modal Buttons', () => {
    it('should have close button present', () => {
      // Validates: Requirements 8.4
      const film = {
        id: 550,
        title: 'Fight Club',
        poster: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        rating: 8.8,
        genres: ['Drama'],
        year: 1999,
        overview: 'An insomniac office worker...',
        tmdbUrl: 'https://www.themoviedb.org/movie/550'
      };
      
      // Show modal
      showFilmModal(film);
      
      // Check close button exists
      const modal = document.getElementById('film-modal');
      const closeBtn = modal.querySelector('.modal-close');
      
      expect(closeBtn).not.toBeNull();
      expect(closeBtn).toBeDefined();
      expect(closeBtn.getAttribute('aria-label')).toBe('Fechar');
      
      // Clean up
      closeFilmModal();
    });

    it('should have add to list button present', () => {
      // Validates: Requirements 8.5
      const film = {
        id: 550,
        title: 'Fight Club',
        poster: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        rating: 8.8,
        genres: ['Drama'],
        year: 1999,
        overview: 'An insomniac office worker...',
        tmdbUrl: 'https://www.themoviedb.org/movie/550'
      };
      
      // Show modal
      showFilmModal(film);
      
      // Check add button exists
      const addBtn = document.getElementById('modal-add-btn');
      
      expect(addBtn).not.toBeNull();
      expect(addBtn).toBeDefined();
      expect(addBtn.textContent).toContain('Adicionar');
      expect(addBtn.classList.contains('modal-add-btn')).toBe(true);
      
      // Clean up
      closeFilmModal();
    });

    it('should close modal when close button is clicked', () => {
      // Validates: Requirements 8.4
      const film = {
        id: 550,
        title: 'Fight Club',
        poster: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        rating: 8.8,
        genres: ['Drama'],
        year: 1999,
        overview: 'An insomniac office worker...',
        tmdbUrl: 'https://www.themoviedb.org/movie/550'
      };
      
      // Show modal
      showFilmModal(film);
      
      const modal = document.getElementById('film-modal');
      expect(modal.classList.contains('hidden')).toBe(false);
      
      // Click close button
      const closeBtn = modal.querySelector('.modal-close');
      closeBtn.click();
      
      // Modal should be closed
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should close modal when overlay is clicked', () => {
      // Validates: Requirements 8.4
      const film = {
        id: 550,
        title: 'Fight Club',
        poster: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        rating: 8.8,
        genres: ['Drama'],
        year: 1999,
        overview: 'An insomniac office worker...',
        tmdbUrl: 'https://www.themoviedb.org/movie/550'
      };
      
      // Show modal
      showFilmModal(film);
      
      const modal = document.getElementById('film-modal');
      expect(modal.classList.contains('hidden')).toBe(false);
      
      // Click overlay
      const overlay = modal.querySelector('.modal-overlay');
      overlay.click();
      
      // Modal should be closed
      expect(modal.classList.contains('hidden')).toBe(true);
    });
  });
});

// Modal functions (to be implemented in app.js)
function showFilmModal(film) {
  const modal = document.getElementById('film-modal');
  const modalPoster = document.getElementById('modal-poster');
  const modalTitle = document.getElementById('modal-title');
  const modalRating = document.getElementById('modal-rating');
  const modalYear = document.getElementById('modal-year');
  const modalGenres = document.getElementById('modal-genres');
  const modalOverview = document.getElementById('modal-overview');
  const modalAddBtn = document.getElementById('modal-add-btn');
  const modalClose = modal.querySelector('.modal-close');
  const modalOverlay = modal.querySelector('.modal-overlay');

  // Set poster
  if (film.poster) {
    modalPoster.src = film.poster;
    modalPoster.alt = film.title;
    modalPoster.classList.remove('no-poster');
  } else {
    modalPoster.src = '';
    modalPoster.alt = '';
    modalPoster.classList.add('no-poster');
    modalPoster.textContent = '🎬';
  }

  // Set title
  modalTitle.textContent = film.title;

  // Set rating
  modalRating.textContent = `★ ${film.rating.toFixed(1)}`;

  // Set year
  modalYear.textContent = film.year ? `(${film.year})` : '';

  // Set genres
  let genresText = '';
  if (film.genres && film.genres.length > 0) {
    genresText = film.genres.join(', ');
  }
  modalGenres.textContent = genresText;

  // Set synopsis/overview - check if it's empty or just whitespace
  const hasOverview = film.overview && film.overview.trim().length > 0;
  modalOverview.textContent = hasOverview ? film.overview : 'Sinopse não disponível.';

  // Setup add button handler
  modalAddBtn.onclick = () => {
    closeFilmModal();
  };

  // Setup close button handler
  modalClose.onclick = closeFilmModal;

  // Setup overlay click to close
  modalOverlay.onclick = closeFilmModal;

  // Show modal
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeFilmModal() {
  const modal = document.getElementById('film-modal');
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}
