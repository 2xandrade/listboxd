/**
 * Main Application Module
 * Handles UI rendering and user interactions
 */

// Initialize services
let filmService;
let listService;
let storageManager;
let authService;
let userService;
let tabManager;
let filterManager;
let watchedFilterManager;
let currentCategory = 'popular';
let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = null;

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (1-5)
 * @param {string} className - Optional CSS class name
 * @returns {string} HTML string with star icons
 */
function generateStarRating(rating, className = '') {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHTML = `<span class="star-rating ${className}">`;
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '★';
  }
  
  // Half star
  if (hasHalfStar) {
    starsHTML += '⯨';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '☆';
  }
  
  starsHTML += '</span>';
  
  return starsHTML;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  storageManager = new StorageManager();
  userService = new UserService(storageManager);
  authService = new AuthService(storageManager, userService);
  filmService = new FilmService();
  listService = new ListService(storageManager);
  filterManager = new FilterManager(listService);
  watchedFilterManager = new FilterManager(listService);
  watchedFilterManager.storageKey = 'watched_filter_state'; // Use separate storage key
  tabManager = new TabManager(storageManager);
  
  // Create default user if no users exist
  initializeDefaultUser();
  
  // Implement route protection - check authentication on page load
  checkAuthenticationAndRedirect();
});

/**
 * Initialize default user if no users exist
 */
function initializeDefaultUser() {
  const users = userService.getAllUsers();
  
  // If no users exist, create a default admin user
  if (users.length === 0) {
    try {
      const defaultPassword = 'admin';
      const passwordHash = authService.hashPassword(defaultPassword);
      userService.createUser('admin', passwordHash, true);
      console.log('✅ Usuário admin padrão criado!');
      console.log('   Username: admin');
      console.log('   Password: admin');
      console.log('   ⚠️  Altere a senha após o primeiro login!');
    } catch (error) {
      console.error('Failed to create default user:', error);
    }
  }
}

/**
 * Check authentication and redirect if necessary
 * Implements route protection for the application
 * Requirements: 2.4
 */
function checkAuthenticationAndRedirect() {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // User is not authenticated - show login screen
    showLoginScreen();
    return;
  }
  
  // User is authenticated - show authenticated UI
  showAuthenticatedUI();
}

/**
 * Show login screen
 */
function showLoginScreen() {
  // Hide all sections
  hideAllSections();
  
  // Show login section
  const loginSection = document.getElementById('login-section');
  loginSection.classList.remove('hidden');
  
  // Setup login form handler
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    loginError.classList.add('hidden');
    loginError.textContent = '';
    
    // Get form values
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Disable submit button during login
    const loginBtn = document.getElementById('login-btn');
    notificationService.setButtonLoading(loginBtn, true);
    
    try {
      // Attempt login
      await authService.login(username, password);
      
      // Login successful - show success notification
      notificationService.success('Login realizado com sucesso!');
      
      // Show authenticated UI
      showAuthenticatedUI();
    } catch (error) {
      // Show error notification
      const errorMessage = error.message === 'Invalid credentials' 
        ? 'Usuário ou senha inválidos' 
        : error.message;
      notificationService.error(errorMessage);
      
      // Re-enable submit button
      notificationService.setButtonLoading(loginBtn, false);
    }
  });
}

/**
 * Show authenticated UI (film listing and shared list)
 */
function showAuthenticatedUI() {
  // Hide all sections
  hideAllSections();
  
  // Show tab navigation
  const tabsContainer = document.getElementById('main-tabs');
  tabsContainer.classList.remove('hidden');
  
  // Initialize tab manager
  tabManager.initialize();
  
  // Initialize interfaces
  initializeFilmListing();
  initializeSharedList();
  initializeWatchedFilms();
  
  // Setup navigation with logout button
  setupNavigation();
}

/**
 * Setup navigation menu with logout button
 */
function setupNavigation() {
  const navMenu = document.getElementById('nav-menu');
  const currentUser = authService.getCurrentUser();
  
  navMenu.innerHTML = `
    <span style="color: #9ab; margin-right: 1rem;">Olá, ${escapeHtml(currentUser.username)}</span>
    ${currentUser.isAdmin ? '<a href="admin.html">Admin</a>' : ''}
    <button id="logout-btn" style="padding: 0.5rem 1rem;">Sair</button>
  `;
  
  // Setup logout handler - clears session and redirects to login
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', handleLogout);
}

/**
 * Handle logout - clear session and redirect to login
 * Requirements: 2.4
 */
function handleLogout() {
  // Clear session
  authService.logout();
  
  // Redirect to login screen by reloading the page
  // This will trigger checkAuthenticationAndRedirect which will show login
  location.reload();
}

/**
 * Hide all main sections
 */
function hideAllSections() {
  const sections = ['login-section', 'film-listing', 'shared-list', 'watched-films'];
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add('hidden');
    }
  });
  
  // Also hide tabs when showing login
  const tabsContainer = document.getElementById('main-tabs');
  if (tabsContainer) {
    tabsContainer.classList.add('hidden');
  }
}

/**
 * Initialize film listing interface
 */
function initializeFilmListing() {
  const filmListingSection = document.getElementById('film-listing');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('film-search');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');

  // Show film listing section
  filmListingSection.classList.remove('hidden');

  // Load initial films (popular)
  loadFilms('popular', 1);

  // Create debounced search function
  const debouncedSearch = debounce((query) => {
    if (query) {
      searchFilms(query, 1);
    }
  }, 500);

  // Search button click handler
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      searchFilms(query, 1);
    }
  });

  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        searchFilms(query, 1);
      }
    }
  });
  
  // Debounced search on input (optional - for live search)
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length >= 3) {
      debouncedSearch(query);
    }
  });

  // Tab button click handlers
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active tab
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Load films for selected category
      const category = btn.dataset.category;
      currentCategory = category;
      currentSearchQuery = null;
      searchInput.value = ''; // Clear search
      loadFilms(category, 1);
    });
  });

  // Pagination button handlers
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      if (currentSearchQuery) {
        searchFilms(currentSearchQuery, currentPage - 1);
      } else {
        loadFilms(currentCategory, currentPage - 1);
      }
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      if (currentSearchQuery) {
        searchFilms(currentSearchQuery, currentPage + 1);
      } else {
        loadFilms(currentCategory, currentPage + 1);
      }
    }
  });
}

/**
 * Load films by category (popular or trending)
 * @param {string} category - 'popular' or 'trending'
 * @param {number} page - Page number
 */
async function loadFilms(category, page = 1) {
  const filmsGrid = document.getElementById('films-grid');
  const loadingEl = document.getElementById('films-loading');
  const errorEl = document.getElementById('films-error');

  // Show loading state
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  filmsGrid.innerHTML = '';
  hidePaginationControls();

  try {
    let result;
    if (category === 'popular') {
      result = await filmService.getPopularFilms(page);
    } else if (category === 'trending') {
      result = await filmService.getTrendingFilms(page);
    }

    // Update pagination state
    currentPage = page;
    totalPages = result.totalPages;
    currentSearchQuery = null;

    // Hide loading
    loadingEl.classList.add('hidden');

    // Render films
    renderFilms(result.films);

    // Show pagination controls
    updatePaginationControls();
  } catch (error) {
    // Hide loading and show error
    loadingEl.classList.add('hidden');
    
    // Show error notification
    const errorMessage = `Erro ao carregar filmes: ${error.message}`;
    notificationService.error(errorMessage);
    
    errorEl.textContent = errorMessage;
    errorEl.classList.remove('hidden');
  }
}

/**
 * Search films by title
 * @param {string} query - Search query
 * @param {number} page - Page number
 */
async function searchFilms(query, page = 1) {
  const filmsGrid = document.getElementById('films-grid');
  const loadingEl = document.getElementById('films-loading');
  const errorEl = document.getElementById('films-error');

  // Show loading state
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  filmsGrid.innerHTML = '';
  hidePaginationControls();

  try {
    const result = await filmService.searchFilms(query, page);

    // Update pagination state
    currentPage = page;
    totalPages = result.totalPages;
    currentSearchQuery = query;

    // Hide loading
    loadingEl.classList.add('hidden');

    // Render films
    if (result.films.length === 0) {
      filmsGrid.innerHTML = '<p style="color: #9ab; text-align: center; grid-column: 1 / -1;">Nenhum filme encontrado.</p>';
      notificationService.info('Nenhum filme encontrado para sua busca.');
    } else {
      renderFilms(result.films);
      // Show pagination controls
      updatePaginationControls();
    }
  } catch (error) {
    // Hide loading and show error
    loadingEl.classList.add('hidden');
    
    // Show error notification
    const errorMessage = `Erro ao buscar filmes: ${error.message}`;
    notificationService.error(errorMessage);
    
    errorEl.textContent = errorMessage;
    errorEl.classList.remove('hidden');
  }
}

/**
 * Render films in the grid
 * @param {Array} films - Array of film objects
 */
function renderFilms(films) {
  const filmsGrid = document.getElementById('films-grid');
  filmsGrid.innerHTML = '';

  films.forEach(film => {
    const filmCard = createFilmCard(film);
    filmsGrid.appendChild(filmCard);
  });
}

/**
 * Escape HTML attribute values
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML attributes
 */
function escapeHtmlAttr(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape HTML text content
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML content
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a film card element
 * @param {Object} film - Film object
 * @returns {HTMLElement} Film card element
 * Requirements: 16.1, 16.4
 */
function createFilmCard(film) {
  const card = document.createElement('div');
  card.className = 'film-card';
  card.dataset.filmId = film.id;

  // Check if film is already in the shared list (Requirement 16.1)
  const isInList = listService.isFilmInList(film.id);

  // Poster
  let posterHTML;
  if (film.poster) {
    posterHTML = `<img src="${escapeHtmlAttr(film.poster)}" alt="${escapeHtmlAttr(film.title)}" class="film-poster" loading="lazy" onload="this.classList.add('loaded')" />`;
  } else {
    posterHTML = `<div class="film-poster no-poster">🎬</div>`;
  }

  // Genres (handle both array of strings and array of IDs)
  let genresText = '';
  if (film.genres && film.genres.length > 0) {
    if (typeof film.genres[0] === 'string') {
      genresText = film.genres.slice(0, 3).join(', ');
    } else {
      genresText = 'Gêneros: ' + film.genres.slice(0, 3).join(', ');
    }
  }

  // Year display
  const yearText = film.year ? `(${film.year})` : '';

  // Determine button text and class based on whether film is in list (Requirements 16.1, 16.4)
  const buttonText = isInList ? 'Retirar da Lista' : 'Adicionar à Lista';
  const buttonClass = isInList ? 'add-to-list-btn in-list' : 'add-to-list-btn';
  const cardClass = isInList ? 'film-card in-list' : 'film-card';

  card.className = cardClass;

  card.innerHTML = `
    ${posterHTML}
    <div class="film-info">
      <h3 class="film-title" title="${escapeHtmlAttr(film.title)}">${escapeHtml(film.title)}</h3>
      <div class="film-meta">
        <span class="film-rating">★ ${film.rating.toFixed(1)}</span>
        <span class="film-year">${escapeHtml(yearText)}</span>
      </div>
      <div class="film-genres" title="${escapeHtmlAttr(genresText)}">${escapeHtml(genresText)}</div>
      <button class="${buttonClass}" data-film-id="${film.id}">${buttonText}</button>
    </div>
  `;

  // Add click handler for card to show modal
  card.addEventListener('click', (e) => {
    // Don't open modal if clicking the add button
    if (!e.target.classList.contains('add-to-list-btn')) {
      showFilmModal(film);
    }
  });

  // Add click handler for "Add to List" or "Remove from List" button
  const addBtn = card.querySelector('.add-to-list-btn');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAddOrRemoveFromList(film);
  });

  return card;
}

/**
 * Show film details modal
 * @param {Object} film - Film object to display
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 16.1, 16.4
 */
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

  // Check if film is already in the list (Requirement 16.1)
  const isInList = listService.isFilmInList(film.id);

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
    if (typeof film.genres[0] === 'string') {
      genresText = film.genres.join(', ');
    } else {
      genresText = film.genres.join(', ');
    }
  }
  modalGenres.textContent = genresText;

  // Set synopsis/overview
  modalOverview.textContent = film.overview && film.overview.trim().length > 0 
    ? film.overview 
    : 'Sinopse não disponível.';

  // Update button text and class based on list status (Requirements 16.1, 16.4)
  modalAddBtn.textContent = isInList ? 'Retirar da Lista' : 'Adicionar à Lista';
  if (isInList) {
    modalAddBtn.classList.add('in-list');
  } else {
    modalAddBtn.classList.remove('in-list');
  }

  // Setup add button handler
  modalAddBtn.onclick = () => {
    handleAddOrRemoveFromList(film);
    
    // Update modal button state immediately (Requirement 16.5)
    const newIsInList = listService.isFilmInList(film.id);
    modalAddBtn.textContent = newIsInList ? 'Retirar da Lista' : 'Adicionar à Lista';
    if (newIsInList) {
      modalAddBtn.classList.add('in-list');
    } else {
      modalAddBtn.classList.remove('in-list');
    }
  };

  // Setup close button handler
  modalClose.onclick = closeFilmModal;

  // Setup overlay click to close
  modalOverlay.onclick = closeFilmModal;

  // Show modal
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');

  // Setup escape key to close
  document.addEventListener('keydown', handleModalEscape);
}

/**
 * Close film details modal
 */
function closeFilmModal() {
  const modal = document.getElementById('film-modal');
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  
  // Remove escape key listener
  document.removeEventListener('keydown', handleModalEscape);
}

/**
 * Handle escape key press to close modal
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleModalEscape(e) {
  if (e.key === 'Escape') {
    closeFilmModal();
  }
}

/**
 * Handle adding or removing a film from the shared list
 * @param {Object} film - Film object to add or remove
 * Requirements: 16.2, 16.3, 16.5
 */
function handleAddOrRemoveFromList(film) {
  try {
    // Get current authenticated user
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      notificationService.error('Você precisa estar autenticado para gerenciar filmes.');
      return;
    }
    
    // Check if film is already in the list
    const isInList = listService.isFilmInList(film.id);
    
    if (isInList) {
      // Remove film from list (Requirement 16.2)
      const sharedList = listService.getSharedList();
      const entry = sharedList.find(e => e.film.id === film.id);
      
      if (entry) {
        listService.removeFilmFromList(entry.id);
        
        // Show success notification
        notificationService.success(`"${film.title}" foi removido da lista compartilhada!`);
        
        // Update button state immediately (Requirement 16.5)
        updateFilmCardButton(film.id, false);
        
        // Refresh shared list display
        renderSharedList();
      }
    } else {
      // Add film to list
      listService.addFilmToList(film, currentUser.id, currentUser.username);
      
      // Show success notification
      notificationService.success(`"${film.title}" foi adicionado à lista compartilhada!`);
      
      // Update button state immediately (Requirement 16.5)
      updateFilmCardButton(film.id, true);
      
      // Refresh shared list display
      renderSharedList();
    }
  } catch (error) {
    // Show error notification
    notificationService.error(`Erro ao gerenciar filme: ${error.message}`);
  }
}

/**
 * Update the button state for a specific film card
 * @param {number} filmId - TMDB film ID
 * @param {boolean} isInList - Whether the film is now in the list
 * Requirements: 16.3, 16.5
 */
function updateFilmCardButton(filmId, isInList) {
  // Find all film cards with this ID (there might be multiple on the page)
  const filmCards = document.querySelectorAll(`.film-card[data-film-id="${filmId}"]`);
  
  filmCards.forEach(card => {
    const button = card.querySelector('.add-to-list-btn');
    
    if (button) {
      // Update button text (Requirement 16.3)
      button.textContent = isInList ? 'Retirar da Lista' : 'Adicionar à Lista';
      
      // Update button class for visual indication (Requirement 16.4)
      if (isInList) {
        button.classList.add('in-list');
        card.classList.add('in-list');
      } else {
        button.classList.remove('in-list');
        card.classList.remove('in-list');
      }
    }
  });
}

/**
 * Handle adding a film to the shared list
 * @param {Object} film - Film object to add
 */
function handleAddToList(film) {
  try {
    // Get current authenticated user
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      notificationService.error('Você precisa estar autenticado para adicionar filmes.');
      return;
    }
    
    // Add film to list
    listService.addFilmToList(film, currentUser.id, currentUser.username);
    
    // Show success notification
    notificationService.success(`"${film.title}" foi adicionado à lista compartilhada!`);
    
    // Refresh shared list display
    renderSharedList();
  } catch (error) {
    // Show error notification
    notificationService.error(`Erro ao adicionar filme: ${error.message}`);
  }
}

/**
 * Initialize shared list interface
 */
function initializeSharedList() {
  const sharedListSection = document.getElementById('shared-list');
  
  // Show shared list section
  sharedListSection.classList.remove('hidden');
  
  // Initialize filter controls
  initializeFilterControls();
  
  // Render initial list
  renderSharedList();
}

/**
 * Initialize filter controls
 * Requirements: 11.1, 14.1, 14.2, 14.3, 14.4
 */
function initializeFilterControls() {
  const genreFilter = document.getElementById('genre-filter');
  const nameFilter = document.getElementById('name-filter');
  const randomFilterBtn = document.getElementById('random-filter-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');

  // Populate genre dropdown
  populateGenreFilter();
  
  // Restore filter state from persistence
  restoreFilterState();

  // Genre filter change handler - immediate update (Requirement 14.1)
  genreFilter.addEventListener('change', (e) => {
    const selectedGenre = e.target.value || null;
    filterManager.setGenreFilter(selectedGenre);
    renderSharedList(); // Immediate update
    updateClearButtonState();
  });

  // Name filter input handler (with debounce)
  const debouncedNameFilter = debounce((searchText) => {
    filterManager.setNameFilter(searchText || null);
    renderSharedList();
    updateClearButtonState();
  }, 300);

  nameFilter.addEventListener('input', (e) => {
    const searchText = e.target.value.trim();
    debouncedNameFilter(searchText);
  });

  // Random filter button handler - generates new order each click (Requirement 14.2)
  randomFilterBtn.addEventListener('click', () => {
    // Always enable random filter and generate new order
    filterManager.setRandomFilter(true);
    randomFilterBtn.classList.add('active');
    
    renderSharedList(); // This will generate a new random order
    updateClearButtonState();
  });

  // Clear filters button handler
  clearFiltersBtn.addEventListener('click', () => {
    // Clear all filters
    filterManager.clearAllFilters();
    
    // Reset UI controls
    genreFilter.value = '';
    nameFilter.value = '';
    randomFilterBtn.classList.remove('active');
    
    // Re-render list
    renderSharedList();
    updateClearButtonState();
  });

  // Initial state
  updateClearButtonState();
  updateFilterCount();
}

/**
 * Restore filter state from persistence
 * Requirements: 14.3
 */
function restoreFilterState() {
  const genreFilter = document.getElementById('genre-filter');
  const nameFilter = document.getElementById('name-filter');
  const randomFilterBtn = document.getElementById('random-filter-btn');
  
  const activeFilters = filterManager.getActiveFilters();
  
  // Restore genre filter
  if (activeFilters.genre) {
    genreFilter.value = activeFilters.genre;
  }
  
  // Restore name filter
  if (activeFilters.name) {
    nameFilter.value = activeFilters.name;
  }
  
  // Restore random filter
  if (activeFilters.random) {
    randomFilterBtn.classList.add('active');
  }
}

/**
 * Populate genre filter dropdown with available genres
 */
function populateGenreFilter() {
  const genreFilter = document.getElementById('genre-filter');
  const genres = filterManager.getAllGenres();

  // Clear existing options (except the first "All genres" option)
  while (genreFilter.options.length > 1) {
    genreFilter.remove(1);
  }

  // Add genre options
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

/**
 * Update clear filters button state
 */
function updateClearButtonState() {
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const hasFilters = filterManager.hasActiveFilters();
  
  clearFiltersBtn.disabled = !hasFilters;
}

/**
 * Update filter count display
 * Requirements: 14.4
 */
function updateFilterCount() {
  const filterCountEl = document.getElementById('filter-count');
  
  if (!filterCountEl) {
    return;
  }
  
  const entries = filterManager.applyFilters();
  const totalEntries = listService.getSharedList().length;
  
  if (filterManager.hasActiveFilters()) {
    filterCountEl.textContent = `Mostrando ${entries.length} de ${totalEntries} filmes`;
    filterCountEl.classList.remove('hidden');
  } else {
    filterCountEl.textContent = `${totalEntries} filmes na lista`;
    if (totalEntries === 0) {
      filterCountEl.classList.add('hidden');
    } else {
      filterCountEl.classList.remove('hidden');
    }
  }
}

/**
 * Render the shared list
 * Requirements: 14.4
 */
function renderSharedList() {
  const container = document.getElementById('shared-list-container');
  
  if (!container) {
    console.error('Shared list container not found');
    return;
  }
  
  // Get filtered entries from filter manager
  const entries = filterManager.applyFilters();
  
  // Update genre filter options (in case new genres were added)
  populateGenreFilter();
  
  // Update filter count display (Requirement 14.4)
  updateFilterCount();
  
  // Clear container
  container.innerHTML = '';
  
  // Handle empty list
  if (entries.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    
    // Check if filters are active
    if (filterManager.hasActiveFilters()) {
      emptyMessage.textContent = 'Nenhum filme encontrado com os filtros aplicados.';
    } else {
      emptyMessage.textContent = 'A lista compartilhada está vazia. Adicione filmes para começar!';
    }
    
    container.appendChild(emptyMessage);
    return;
  }
  
  // Render each entry
  entries.forEach(entry => {
    const entryElement = createListEntryElement(entry);
    container.appendChild(entryElement);
  });
}

/**
 * Create a list entry element
 * @param {Object} entry - Film entry object
 * @returns {HTMLElement} List entry element
 */
function createListEntryElement(entry) {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'list-entry';
  entryDiv.dataset.entryId = entry.id;
  
  // Format timestamp
  const date = new Date(entry.addedAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Poster
  let posterHTML;
  if (entry.film.poster) {
    posterHTML = `<img src="${escapeHtmlAttr(entry.film.poster)}" alt="${escapeHtmlAttr(entry.film.title)}" class="film-poster" loading="lazy" onload="this.classList.add('loaded')" />`;
  } else {
    posterHTML = `<div class="film-poster no-poster">🎬</div>`;
  }
  
  // Genres
  let genresText = '';
  if (entry.film.genres && entry.film.genres.length > 0) {
    genresText = entry.film.genres.join(', ');
  }
  
  // Year
  const yearText = entry.film.year ? `(${entry.film.year})` : '';
  
  // Get current user to check admin status (Requirement 12.8)
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser && currentUser.isAdmin;
  
  // Only show mark as watched button for admins
  const markWatchedButtonHTML = isAdmin 
    ? `<button class="mark-watched-btn" data-film-id="${entry.film.id}">✓ Marcar como Assistido</button>`
    : '';
  
  // Synopsis/overview
  const overviewHTML = entry.film.overview && entry.film.overview.trim().length > 0
    ? `<div class="film-overview">${escapeHtml(entry.film.overview)}</div>`
    : '';
  
  entryDiv.innerHTML = `
    ${posterHTML}
    <div class="entry-info">
      <h3 class="film-title">${escapeHtml(entry.film.title)}</h3>
      <div class="film-meta">
        <span class="film-rating">★ ${entry.film.rating.toFixed(1)}</span>
        <span class="film-year">${escapeHtml(yearText)}</span>
      </div>
      <div class="film-genres">${escapeHtml(genresText)}</div>
      ${overviewHTML}
      <div class="entry-metadata">
        <span class="entry-user">Adicionado por: ${escapeHtml(entry.addedBy)}</span>
        <span class="entry-timestamp">${escapeHtml(formattedDate)}</span>
      </div>
      <div class="entry-actions">
        ${markWatchedButtonHTML}
        <button class="remove-from-list-btn" data-entry-id="${entry.id}">Remover</button>
      </div>
    </div>
  `;
  
  // Add click handler for mark as watched button (only if admin)
  if (isAdmin) {
    const markWatchedBtn = entryDiv.querySelector('.mark-watched-btn');
    markWatchedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleMarkAsWatched(entry.film.id);
    });
  }
  
  // Add click handler for remove button
  const removeBtn = entryDiv.querySelector('.remove-from-list-btn');
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleRemoveFromList(entry.id);
  });
  
  return entryDiv;
}

/**
 * Handle removing a film from the shared list
 * @param {string} entryId - Entry ID to remove
 */
function handleRemoveFromList(entryId) {
  if (!confirm('Tem certeza que deseja remover este filme da lista?')) {
    return;
  }
  
  try {
    // Remove from list
    listService.removeFilmFromList(entryId);
    
    // Show success notification
    notificationService.success('Filme removido da lista com sucesso!');
    
    // Refresh display
    renderSharedList();
  } catch (error) {
    notificationService.error(`Erro ao remover filme: ${error.message}`);
  }
}

/**
 * Show rating modal for marking a film as watched
 * @param {number} filmId - TMDB film ID
 * @returns {Promise<{rating: number, review: string} | null>} Rating and review or null if cancelled
 * Requirements: 17.1, 17.2
 */
function showRatingModal(filmId) {
  return new Promise((resolve) => {
    const modal = document.getElementById('rating-modal');
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    const stars = modal.querySelectorAll('.star-btn');
    const ratingLabel = document.getElementById('rating-label');
    const reviewInput = document.getElementById('review-input');
    const cancelBtn = document.getElementById('rating-cancel-btn');
    const submitBtn = document.getElementById('rating-submit-btn');
    
    let selectedRating = 0;
    
    // Reset modal state
    reviewInput.value = '';
    selectedRating = 0;
    submitBtn.disabled = true;
    ratingLabel.textContent = 'Selecione uma avaliação';
    ratingLabel.classList.remove('has-rating');
    stars.forEach(star => {
      star.classList.remove('full', 'half', 'active');
      star.classList.add('empty');
      star.textContent = '★';
    });
    
    // Show modal with animation
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Helper function to update star display
    function updateStarDisplay(rating) {
      const fullStars = Math.floor(rating);
      const hasHalf = (rating % 1) === 0.5;
      
      stars.forEach((star, index) => {
        const starNum = index + 1;
        star.classList.remove('full', 'half', 'empty', 'active');
        
        if (starNum <= fullStars) {
          // Stars before the half star should be full
          star.classList.add('full', 'active');
          star.textContent = '★';
        } else if (starNum === fullStars + 1 && hasHalf) {
          // The star after full stars should be half if hasHalf
          star.classList.add('half', 'active');
          star.textContent = '★';
        } else {
          // All other stars should be empty
          star.classList.add('empty');
          star.textContent = '★';
        }
      });
    }
    
    // Star rating interaction
    stars.forEach((star) => {
      const starNum = parseInt(star.dataset.star);
      
      // Click handler - toggle between empty → full → half
      star.addEventListener('click', () => {
        const currentState = star.classList.contains('full') ? 'full' : 
                           star.classList.contains('half') ? 'half' : 'empty';
        
        // If clicking on a star that's less than current rating, set to that star
        if (selectedRating > starNum) {
          selectedRating = starNum;
        }
        // If clicking on the last selected star (full), make it half
        else if (currentState === 'full' && selectedRating === starNum) {
          selectedRating = starNum - 0.5;
        }
        // If clicking on a half star, go back one full star
        else if (currentState === 'half' && selectedRating === starNum - 0.5) {
          selectedRating = starNum - 1;
        }
        // Otherwise, set to full star
        else {
          selectedRating = starNum;
        }
        
        // Ensure minimum rating of 0.5
        if (selectedRating < 0.5) {
          selectedRating = 0;
        }
        
        submitBtn.disabled = selectedRating === 0;
        updateStarDisplay(selectedRating);
        
        // Update label
        if (selectedRating > 0) {
          ratingLabel.textContent = `${selectedRating} ${selectedRating === 1 ? 'estrela' : 'estrelas'}`;
          ratingLabel.classList.add('has-rating');
        } else {
          ratingLabel.textContent = 'Selecione uma avaliação';
          ratingLabel.classList.remove('has-rating');
        }
      });
    });
    
    // Close handlers
    const closeModal = (result) => {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
      
      // Clean up event listeners
      stars.forEach(star => {
        star.replaceWith(star.cloneNode(true));
      });
      
      resolve(result);
    };
    
    closeBtn.addEventListener('click', () => closeModal(null), { once: true });
    overlay.addEventListener('click', () => closeModal(null), { once: true });
    cancelBtn.addEventListener('click', () => closeModal(null), { once: true });
    
    submitBtn.addEventListener('click', () => {
      if (selectedRating > 0) {
        closeModal({
          rating: selectedRating,
          review: reviewInput.value.trim()
        });
      }
    }, { once: true });
    
    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal(null);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

/**
 * Handle marking a film as watched
 * @param {number} filmId - TMDB film ID
 * Requirements: 12.2, 12.3, 12.6, 12.8, 17.1, 17.2
 */
async function handleMarkAsWatched(filmId) {
  // Get current authenticated user
  const currentUser = authService.getCurrentUser();
  
  if (!currentUser) {
    notificationService.error('Você precisa estar autenticado.');
    return;
  }
  
  // Check if user is admin (Requirement 12.8)
  if (!currentUser.isAdmin) {
    notificationService.error('Apenas administradores podem marcar filmes como assistidos.');
    return;
  }
  
  // Show rating modal (Requirements 17.1, 17.2)
  const result = await showRatingModal(filmId);
  
  // Check if user cancelled
  if (!result) {
    return;
  }
  
  const { rating, review } = result;
  
  try {
    // Mark as watched (pass isAdmin flag)
    listService.markAsWatched(filmId, rating, currentUser.id, currentUser.username, review, currentUser.isAdmin);
    
    // Show success notification
    notificationService.success('Filme marcado como assistido!');
    
    // Refresh both lists
    renderSharedList();
    renderWatchedFilms();
  } catch (error) {
    notificationService.error(`Erro ao marcar filme como assistido: ${error.message}`);
  }
}

/**
 * Initialize watched films interface
 */
function initializeWatchedFilms() {
  const watchedFilmsSection = document.getElementById('watched-films');
  
  // Show watched films section (will be hidden by tab manager initially)
  watchedFilmsSection.classList.remove('hidden');
  
  // Initialize watched filter controls
  initializeWatchedFilterControls();
  
  // Render initial watched films list
  renderWatchedFilms();
}

/**
 * Initialize watched filter controls
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */
function initializeWatchedFilterControls() {
  const genreFilter = document.getElementById('watched-genre-filter');
  const nameFilter = document.getElementById('watched-name-filter');
  const randomFilterBtn = document.getElementById('watched-random-filter-btn');
  const clearFiltersBtn = document.getElementById('watched-clear-filters-btn');

  // Populate genre dropdown
  populateWatchedGenreFilter();
  
  // Restore filter state from persistence
  restoreWatchedFilterState();

  // Genre filter change handler - immediate update
  genreFilter.addEventListener('change', (e) => {
    const selectedGenre = e.target.value || null;
    watchedFilterManager.setGenreFilter(selectedGenre);
    renderWatchedFilms(); // Immediate update
    updateWatchedClearButtonState();
  });

  // Name filter input handler (with debounce)
  const debouncedNameFilter = debounce((searchText) => {
    watchedFilterManager.setNameFilter(searchText || null);
    renderWatchedFilms();
    updateWatchedClearButtonState();
  }, 300);

  nameFilter.addEventListener('input', (e) => {
    const searchText = e.target.value.trim();
    debouncedNameFilter(searchText);
  });

  // Random filter button handler - generates new order each click
  randomFilterBtn.addEventListener('click', () => {
    // Always enable random filter and generate new order
    watchedFilterManager.setRandomFilter(true);
    randomFilterBtn.classList.add('active');
    
    renderWatchedFilms(); // This will generate a new random order
    updateWatchedClearButtonState();
  });

  // Clear filters button handler
  clearFiltersBtn.addEventListener('click', () => {
    // Clear all filters
    watchedFilterManager.clearAllFilters();
    
    // Reset UI controls
    genreFilter.value = '';
    nameFilter.value = '';
    randomFilterBtn.classList.remove('active');
    
    // Re-render list
    renderWatchedFilms();
    updateWatchedClearButtonState();
  });

  // Initial state
  updateWatchedClearButtonState();
  updateWatchedFilterCount();
}

/**
 * Restore watched filter state from persistence
 */
function restoreWatchedFilterState() {
  const genreFilter = document.getElementById('watched-genre-filter');
  const nameFilter = document.getElementById('watched-name-filter');
  const randomFilterBtn = document.getElementById('watched-random-filter-btn');
  
  const activeFilters = watchedFilterManager.getActiveFilters();
  
  // Restore genre filter
  if (activeFilters.genre) {
    genreFilter.value = activeFilters.genre;
  }
  
  // Restore name filter
  if (activeFilters.name) {
    nameFilter.value = activeFilters.name;
  }
  
  // Restore random filter
  if (activeFilters.random) {
    randomFilterBtn.classList.add('active');
  }
}

/**
 * Populate watched genre filter dropdown with available genres
 */
function populateWatchedGenreFilter() {
  const genreFilter = document.getElementById('watched-genre-filter');
  const watchedList = listService.getWatchedList();
  const genres = watchedFilterManager.getAllGenres(watchedList);

  // Clear existing options (except the first "All genres" option)
  while (genreFilter.options.length > 1) {
    genreFilter.remove(1);
  }

  // Add genre options
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

/**
 * Update watched clear filters button state
 */
function updateWatchedClearButtonState() {
  const clearFiltersBtn = document.getElementById('watched-clear-filters-btn');
  const hasFilters = watchedFilterManager.hasActiveFilters();
  
  clearFiltersBtn.disabled = !hasFilters;
}

/**
 * Update watched filter count display
 */
function updateWatchedFilterCount() {
  const filterCountEl = document.getElementById('watched-filter-count');
  
  if (!filterCountEl) {
    return;
  }
  
  const watchedList = listService.getWatchedList();
  const entries = watchedFilterManager.applyFilters(watchedList);
  const totalEntries = watchedList.length;
  
  if (watchedFilterManager.hasActiveFilters()) {
    filterCountEl.textContent = `Mostrando ${entries.length} de ${totalEntries} filmes`;
    filterCountEl.classList.remove('hidden');
  } else {
    filterCountEl.textContent = `${totalEntries} filmes assistidos`;
    if (totalEntries === 0) {
      filterCountEl.classList.add('hidden');
    } else {
      filterCountEl.classList.remove('hidden');
    }
  }
}

/**
 * Render the watched films list
 * Requirements: 12.1, 12.4, 12.5, 15.2, 15.3, 15.4, 15.5, 15.6
 */
function renderWatchedFilms() {
  const container = document.getElementById('watched-films-container');
  
  if (!container) {
    console.error('Watched films container not found');
    return;
  }
  
  // Get watched films from list service
  const watchedList = listService.getWatchedList();
  
  // Apply filters to watched list
  const watchedFilms = watchedFilterManager.applyFilters(watchedList);
  
  // Update genre filter options (in case new genres were added)
  populateWatchedGenreFilter();
  
  // Update filter count display
  updateWatchedFilterCount();
  
  // Clear container
  container.innerHTML = '';
  
  // Handle empty list
  if (watchedFilms.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    
    // Check if filters are active
    if (watchedFilterManager.hasActiveFilters()) {
      emptyMessage.textContent = 'Nenhum filme encontrado com os filtros aplicados.';
    } else {
      emptyMessage.textContent = 'Nenhum filme assistido ainda. Marque filmes como assistidos para vê-los aqui!';
    }
    
    container.appendChild(emptyMessage);
    return;
  }
  
  // Render each watched film
  watchedFilms.forEach(watchedFilm => {
    const watchedElement = createWatchedFilmElement(watchedFilm);
    container.appendChild(watchedElement);
  });
}

/**
 * Create a watched film element
 * @param {Object} watchedFilm - Watched film object
 * @returns {HTMLElement} Watched film element
 * Requirements: 12.4, 12.5
 */
function createWatchedFilmElement(watchedFilm) {
  const watchedDiv = document.createElement('div');
  watchedDiv.className = 'watched-entry';
  watchedDiv.dataset.watchedId = watchedFilm.id;
  
  // Format timestamp
  const date = new Date(watchedFilm.watchedAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Poster
  let posterHTML;
  if (watchedFilm.film.poster) {
    posterHTML = `<img src="${escapeHtmlAttr(watchedFilm.film.poster)}" alt="${escapeHtmlAttr(watchedFilm.film.title)}" class="film-poster" loading="lazy" onload="this.classList.add('loaded')" />`;
  } else {
    posterHTML = `<div class="film-poster no-poster">🎬</div>`;
  }
  
  // Genres
  let genresText = '';
  if (watchedFilm.film.genres && watchedFilm.film.genres.length > 0) {
    genresText = watchedFilm.film.genres.join(', ');
  }
  
  // Year
  const yearText = watchedFilm.film.year ? `(${watchedFilm.film.year})` : '';
  
  // Review
  const reviewHTML = watchedFilm.review && watchedFilm.review.trim().length > 0
    ? `<div class="watched-review"><strong>Review:</strong> ${escapeHtml(watchedFilm.review)}</div>`
    : '';
  
  // Get current user to check admin status (Requirements 13.1, 13.2, 13.5)
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser && currentUser.isAdmin;
  
  // Only show edit and remove buttons for admins
  const editButtonsHTML = isAdmin 
    ? `<div class="watched-actions">
        <button class="edit-rating-btn" data-watched-id="${watchedFilm.id}">✏️ Editar Avaliação</button>
        <button class="edit-review-btn" data-watched-id="${watchedFilm.id}">✏️ Editar Review</button>
        <button class="remove-watched-btn" data-watched-id="${watchedFilm.id}">🗑️ Remover</button>
      </div>`
    : '';
  
  watchedDiv.innerHTML = `
    ${posterHTML}
    <div class="watched-info">
      <h3 class="film-title">${escapeHtml(watchedFilm.film.title)}</h3>
      <div class="film-meta">
        <span class="film-rating">★ ${watchedFilm.film.rating.toFixed(1)}</span>
        <span class="film-year">${escapeHtml(yearText)}</span>
      </div>
      <div class="film-genres">${escapeHtml(genresText)}</div>
      <div class="watched-rating">
        <span class="rating-label">Nossa Avaliação:</span>
        ${generateStarRating(watchedFilm.rating, 'rating-stars')}
        <span class="rating-value">${watchedFilm.rating.toFixed(1)}/5</span>
      </div>
      <div class="watched-metadata">
        <span class="watched-user">Avaliado por: ${escapeHtml(watchedFilm.ratedBy)}</span>
        <span class="watched-timestamp">Assistido em: ${escapeHtml(formattedDate)}</span>
      </div>
      ${reviewHTML}
      ${editButtonsHTML}
    </div>
  `;
  
  // Add click handlers for edit buttons (only if admin)
  if (isAdmin) {
    const editRatingBtn = watchedDiv.querySelector('.edit-rating-btn');
    const editReviewBtn = watchedDiv.querySelector('.edit-review-btn');
    const removeWatchedBtn = watchedDiv.querySelector('.remove-watched-btn');
    
    editRatingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleEditRating(watchedFilm.id, watchedFilm.rating);
    });
    
    editReviewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleEditReview(watchedFilm.id, watchedFilm.review);
    });
    
    removeWatchedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRemoveWatched(watchedFilm.id);
    });
  }
  
  return watchedDiv;
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
  const paginationControls = document.getElementById('pagination-controls');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const paginationInfo = document.getElementById('pagination-info');

  // Show pagination controls
  paginationControls.classList.remove('hidden');

  // Update pagination info text
  paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;

  // Disable/enable previous button
  if (currentPage <= 1) {
    prevPageBtn.disabled = true;
    prevPageBtn.classList.add('disabled');
  } else {
    prevPageBtn.disabled = false;
    prevPageBtn.classList.remove('disabled');
  }

  // Disable/enable next button
  if (currentPage >= totalPages) {
    nextPageBtn.disabled = true;
    nextPageBtn.classList.add('disabled');
  } else {
    nextPageBtn.disabled = false;
    nextPageBtn.classList.remove('disabled');
  }
}

/**
 * Hide pagination controls
 */
function hidePaginationControls() {
  const paginationControls = document.getElementById('pagination-controls');
  paginationControls.classList.add('hidden');
}

/**
 * Show rating modal for editing a watched film rating
 * @param {string} watchedId - ID of the watched film entry
 * @param {number} currentRating - Current rating value
 * @returns {Promise<number | null>} New rating or null if cancelled
 * Requirements: 17.1, 17.2
 */
function showEditRatingModal(watchedId, currentRating) {
  return new Promise((resolve) => {
    const modal = document.getElementById('rating-modal');
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    const stars = modal.querySelectorAll('.star-btn');
    const ratingLabel = document.getElementById('rating-label');
    const reviewContainer = document.querySelector('.review-container');
    const cancelBtn = document.getElementById('rating-cancel-btn');
    const submitBtn = document.getElementById('rating-submit-btn');
    const modalTitle = modal.querySelector('.rating-modal-title');
    const modalSubtitle = modal.querySelector('.rating-modal-subtitle');
    
    let selectedRating = currentRating;
    
    // Update modal for edit mode
    modalTitle.textContent = 'Editar Avaliação';
    modalSubtitle.textContent = `Avaliação atual: ${currentRating.toFixed(1)} estrelas`;
    
    // Hide review container for edit mode
    reviewContainer.style.display = 'none';
    
    // Set initial rating
    submitBtn.disabled = false;
    updateStarDisplay(selectedRating);
    
    ratingLabel.textContent = `${selectedRating} ${selectedRating === 1 ? 'estrela' : 'estrelas'}`;
    ratingLabel.classList.add('has-rating');
    
    // Show modal with animation
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Helper function to update star display
    function updateStarDisplay(rating) {
      const fullStars = Math.floor(rating);
      const hasHalf = (rating % 1) === 0.5;
      
      stars.forEach((star, index) => {
        const starNum = index + 1;
        star.classList.remove('full', 'half', 'empty', 'active');
        
        if (starNum <= fullStars) {
          // Stars before the half star should be full
          star.classList.add('full', 'active');
          star.textContent = '★';
        } else if (starNum === fullStars + 1 && hasHalf) {
          // The star after full stars should be half if hasHalf
          star.classList.add('half', 'active');
          star.textContent = '★';
        } else {
          // All other stars should be empty
          star.classList.add('empty');
          star.textContent = '★';
        }
      });
    }
    
    // Star rating interaction
    stars.forEach((star) => {
      const starNum = parseInt(star.dataset.star);
      
      // Click handler - toggle between empty → full → half
      star.addEventListener('click', () => {
        const currentState = star.classList.contains('full') ? 'full' : 
                           star.classList.contains('half') ? 'half' : 'empty';
        
        // If clicking on a star that's less than current rating, set to that star
        if (selectedRating > starNum) {
          selectedRating = starNum;
        }
        // If clicking on the last selected star (full), make it half
        else if (currentState === 'full' && selectedRating === starNum) {
          selectedRating = starNum - 0.5;
        }
        // If clicking on a half star, go back one full star
        else if (currentState === 'half' && selectedRating === starNum - 0.5) {
          selectedRating = starNum - 1;
        }
        // Otherwise, set to full star
        else {
          selectedRating = starNum;
        }
        
        // Ensure minimum rating of 0.5
        if (selectedRating < 0.5) {
          selectedRating = 0.5;
        }
        
        updateStarDisplay(selectedRating);
        
        // Update label
        ratingLabel.textContent = `${selectedRating} ${selectedRating === 1 ? 'estrela' : 'estrelas'}`;
        ratingLabel.classList.add('has-rating');
      });
    });
    
    // Close handlers
    const closeModal = (result) => {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
      
      // Reset modal state
      modalTitle.textContent = 'Avaliar Filme';
      modalSubtitle.textContent = 'Como foi a experiência?';
      reviewContainer.style.display = 'flex';
      
      // Clean up event listeners
      stars.forEach(star => {
        star.replaceWith(star.cloneNode(true));
      });
      
      resolve(result);
    };
    
    closeBtn.addEventListener('click', () => closeModal(null), { once: true });
    overlay.addEventListener('click', () => closeModal(null), { once: true });
    cancelBtn.addEventListener('click', () => closeModal(null), { once: true });
    
    submitBtn.addEventListener('click', () => {
      if (selectedRating > 0) {
        closeModal(selectedRating);
      }
    }, { once: true });
    
    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal(null);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

/**
 * Handle editing rating of a watched film
 * @param {string} watchedId - ID of the watched film entry
 * @param {number} currentRating - Current rating value
 * Requirements: 13.1, 13.3, 17.1, 17.2
 */
async function handleEditRating(watchedId, currentRating) {
  // Get current authenticated user
  const currentUser = authService.getCurrentUser();
  
  if (!currentUser) {
    notificationService.error('Você precisa estar autenticado.');
    return;
  }
  
  // Check if user is admin (Requirement 13.7)
  if (!currentUser.isAdmin) {
    notificationService.error('Apenas administradores podem editar avaliações.');
    return;
  }
  
  // Show edit rating modal (Requirements 17.1, 17.2)
  const newRating = await showEditRatingModal(watchedId, currentRating);
  
  // Check if user cancelled
  if (newRating === null) {
    return;
  }
  
  try {
    // Update rating (pass isAdmin flag)
    listService.updateWatchedRating(watchedId, newRating, currentUser.isAdmin);
    
    // Show success notification
    notificationService.success('Avaliação atualizada com sucesso!');
    
    // Refresh watched films display
    renderWatchedFilms();
  } catch (error) {
    notificationService.error(`Erro ao atualizar avaliação: ${error.message}`);
  }
}

/**
 * Handle editing review of a watched film
 * @param {string} watchedId - ID of the watched film entry
 * @param {string} currentReview - Current review text
 * Requirements: 13.2, 13.4
 */
function handleEditReview(watchedId, currentReview) {
  // Get current authenticated user
  const currentUser = authService.getCurrentUser();
  
  if (!currentUser) {
    notificationService.error('Você precisa estar autenticado.');
    return;
  }
  
  // Check if user is admin (Requirement 13.7)
  if (!currentUser.isAdmin) {
    notificationService.error('Apenas administradores podem editar reviews.');
    return;
  }
  
  // Prompt for new review
  const newReview = prompt(`Review atual: ${currentReview || '(vazio)'}\n\nInsira a nova review:`, currentReview || '');
  
  // Check if user cancelled
  if (newReview === null) {
    return;
  }
  
  try {
    // Update review (pass isAdmin flag)
    listService.updateWatchedReview(watchedId, newReview, currentUser.isAdmin);
    
    // Show success notification
    notificationService.success('Review atualizada com sucesso!');
    
    // Refresh watched films display
    renderWatchedFilms();
  } catch (error) {
    notificationService.error(`Erro ao atualizar review: ${error.message}`);
  }
}

/**
 * Handle removing a watched film
 * @param {string} watchedId - ID of the watched film entry
 * Requirements: 13.5, 13.6
 */
function handleRemoveWatched(watchedId) {
  // Get current authenticated user
  const currentUser = authService.getCurrentUser();
  
  if (!currentUser) {
    notificationService.error('Você precisa estar autenticado.');
    return;
  }
  
  // Check if user is admin (Requirement 13.7)
  if (!currentUser.isAdmin) {
    notificationService.error('Apenas administradores podem remover filmes assistidos.');
    return;
  }
  
  // Confirm removal
  if (!confirm('Tem certeza que deseja remover este filme da lista de assistidos?')) {
    return;
  }
  
  try {
    // Remove watched film (pass isAdmin flag)
    listService.removeFromWatched(watchedId, currentUser.isAdmin);
    
    // Show success notification
    notificationService.success('Filme removido da lista de assistidos com sucesso!');
    
    // Refresh watched films display
    renderWatchedFilms();
  } catch (error) {
    notificationService.error(`Erro ao remover filme: ${error.message}`);
  }
}
