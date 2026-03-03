/**
 * ListService - Shared list management
 * Handles operations for the shared film list via Google Sheets API
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5
 */

class ListService {
  constructor(googleSheetsApi, authService) {
    this.googleSheetsApi = googleSheetsApi;
    this.authService = authService;
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
      console.error('Error fetching lists:', error);
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
      console.error('Error creating list:', error);
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
      console.error('Error adding watched movie:', error);
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
      console.error('Error fetching movies:', error);
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ListService;
}
