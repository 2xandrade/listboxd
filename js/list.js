/**
 * ListService - Shared list management
 * Handles operations for the shared film list via Google Sheets API
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5
 */

class ListService {
  constructor(googleSheetsApi, authService) {
    this.googleSheetsApi = googleSheetsApi;
    this.authService = authService;
    this.sharedListCache = []; // Cache local da lista compartilhada
    this.watchedMoviesCache = []; // Cache de filmes assistidos
    this.currentListId = null; // ID da lista atual
  }

  /**
   * Initialize the service by loading the default list
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      let lists = await this.getListsByUser();
      
      // If no lists exist, create a default one
      if (!lists || lists.length === 0) {
        console.log('📝 Criando lista padrão...');
        const defaultList = await this.createList(
          'Filmes para Assistir',
          'Lista compartilhada de filmes'
        );
        this.currentListId = defaultList.id_lista;
        this.sharedListCache = [];
        console.log('✅ Lista padrão criada:', this.currentListId);
      } else {
        // Use the first list as default
        this.currentListId = lists[0].id_lista;
        console.log('📋 Usando lista existente:', this.currentListId);
        // Load movies from this list
        await this.refreshCache();
      }
    } catch (error) {
      console.error('Error initializing ListService:', error.message);
      // Initialize with empty cache to prevent errors
      this.sharedListCache = [];
      this.watchedMoviesCache = [];
    }
  }

  /**
   * Refresh the local cache from Google Sheets
   * @returns {Promise<void>}
   */
  async refreshCache() {
    if (!this.currentListId) {
      return;
    }
    
    try {
      const movies = await this.getMoviesByList(this.currentListId);
      this.sharedListCache = movies || [];
    } catch (error) {
      console.error('Error refreshing cache:', error.message);
    }
  }

  /**
   * Get all lists for current user
   * Requirements: 2.3, 4.4
   * @returns {Promise<Array>} Array of list objects
   */
  async getListsByUser() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await this.googleSheetsApi.getListsByUser(currentUser.id);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching lists:', error.message);
      throw new Error(`Failed to fetch lists: ${error.message}`);
    }
  }

  /**
   * Create a new shared list
   * Requirements: 2.1, 4.4
   * @param {string} titulo - List title
   * @param {string} descricao - List description
   * @returns {Promise<Object>} Created list object
   */
  async createList(titulo, descricao = '') {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Validate inputs
    if (!titulo || typeof titulo !== 'string') {
      throw new Error('List title is required');
    }
    
    try {
      const response = await this.googleSheetsApi.createList({
        id_usuario_dono: currentUser.id,
        titulo: titulo,
        descricao: descricao
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating list:', error.message);
      throw new Error(`Failed to create list: ${error.message}`);
    }
  }

  /**
   * Add watched movie to list
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.5
   * @param {string} idLista - List ID
   * @param {Object} film - Film object
   * @param {number} rating - User rating
   * @param {string} review - Optional review
   * @returns {Promise<Object>} Created watched movie entry
   */
  async addWatchedMovie(idLista, film, rating, review = '') {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Validate inputs
    if (!idLista || typeof idLista !== 'string') {
      throw new Error('List ID is required');
    }
    
    if (!film || typeof film !== 'object') {
      throw new Error('Film object is required');
    }
    
    if (!film.title) {
      throw new Error('Film must have a title');
    }
    
    if (typeof rating !== 'number' || rating < 0.5 || rating > 5) {
      throw new Error('Rating must be a number between 0.5 and 5');
    }
    
    try {
      const response = await this.googleSheetsApi.addWatchedMovie({
        id_lista: idLista,
        id_usuario: currentUser.id,
        titulo_filme: film.title,
        ano: film.year || '',
        nota: rating,
        assistido_em: new Date().toISOString(),
        review: review || ''
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding watched movie:', error.message);
      throw new Error(`Failed to add watched movie: ${error.message}`);
    }
  }

  /**
   * Get movies from a list
   * Requirements: 3.2, 3.3, 3.4, 3.5, 4.5
   * @param {string} idLista - List ID
   * @returns {Promise<Array>} Array of movie objects
   */
  async getMoviesByList(idLista) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Validate inputs
    if (!idLista || typeof idLista !== 'string') {
      throw new Error('List ID is required');
    }
    
    try {
      const response = await this.googleSheetsApi.getMoviesByList({
        id_lista: idLista,
        id_usuario: currentUser.id
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching movies:', error.message);
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }
  }

  /**
   * Check if a film is in the shared list (by TMDB ID)
   * Requirements: 16.1
   * @param {number} filmId - TMDB film ID
   * @returns {boolean} True if film is in list
   */
  isFilmInList(filmId) {
    // Check in local cache
    return this.sharedListCache.some(movie => {
      // Try to match by TMDB ID stored in the movie data
      return movie.tmdb_id === filmId || 
             movie.id_filme === String(filmId) ||
             movie.titulo_filme === filmId; // Fallback
    });
  }

  /**
   * Get the shared list (cached)
   * @returns {Array} Array of list entries
   */
  getSharedList() {
    return this.sharedListCache || [];
  }

  /**
   * Get watched movies list (cached)
   * @returns {Array} Array of watched movie entries
   */
  getWatchedList() {
    return this.watchedMoviesCache || [];
  }

  /**
   * Add film to shared list (legacy method for compatibility)
   * @param {Object} film - Film object
   * @param {string} userId - User ID
   * @param {string} username - Username
   * @returns {Object} List entry
   */
  addFilmToList(film, userId, username) {
    // Create entry with proper structure
    const entry = {
      id: `temp-${Date.now()}`,
      id_filme: `temp-${Date.now()}`,
      film: {
        id: film.id,
        title: film.title,
        year: film.year,
        poster: film.poster,
        rating: film.rating,
        genres: film.genres || []
      },
      titulo_filme: film.title,
      ano: film.year,
      tmdb_id: film.id,
      addedBy: username,
      addedByUserId: userId,
      addedAt: new Date().toISOString()
    };
    
    this.sharedListCache.push(entry);
    return entry;
  }

  /**
   * Remove film from shared list (legacy method)
   * @param {string} entryId - Entry ID
   */
  removeFilmFromList(entryId) {
    const index = this.sharedListCache.findIndex(movie => movie.id_filme === entryId);
    if (index !== -1) {
      this.sharedListCache.splice(index, 1);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ListService;
}
