/**
 * ListService - Shared list management
 * Handles operations for the shared film list
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */

class ListService {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.LIST_KEY = 'letterboxd_shared_list';
    this.WATCHED_KEY = 'letterboxd_watched_list';
  }

  /**
   * Get the shared list from storage
   * @returns {Array} Array of FilmEntry objects
   */
  getSharedList() {
    const list = this.storageManager.load(this.LIST_KEY);
    return list || [];
  }

  /**
   * Check if a film is already in the list
   * @param {number} filmId - TMDB film ID
   * @returns {boolean} True if film is in list
   */
  isFilmInList(filmId) {
    const list = this.getSharedList();
    return list.some(entry => entry.film.id === filmId);
  }

  /**
   * Add a film to the shared list
   * @param {Object} film - Film object with id, title, poster, rating, genres
   * @param {string} userId - ID of user adding the film
   * @param {string} username - Username of user adding the film
   * @returns {Object} Created FilmEntry object
   * @throws {Error} If film is already in list or validation fails
   */
  addFilmToList(film, userId, username) {
    // Validate inputs
    if (!film || typeof film !== 'object') {
      throw new Error('Film object is required');
    }
    
    if (!film.id) {
      throw new Error('Film must have an id');
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }
    
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required');
    }
    
    // Check for duplicates
    if (this.isFilmInList(film.id)) {
      throw new Error('Film already exists in the shared list');
    }
    
    // Get current list
    const list = this.getSharedList();
    
    // Create new entry
    const entry = {
      id: this._generateId(),
      film: {
        id: film.id,
        title: film.title,
        poster: film.poster,
        rating: film.rating,
        genres: film.genres,
        year: film.year,
        overview: film.overview,
        tmdbUrl: film.tmdbUrl
      },
      addedBy: username,
      addedByUserId: userId,
      addedAt: Date.now()
    };
    
    // Add to list
    list.push(entry);
    
    // Save to storage
    this.storageManager.save(this.LIST_KEY, list);
    
    return entry;
  }

  /**
   * Remove a film entry from the shared list
   * @param {string} entryId - ID of the entry to remove
   * @returns {boolean} True if entry was removed
   * @throws {Error} If entry not found
   */
  removeFilmFromList(entryId) {
    if (!entryId || typeof entryId !== 'string') {
      throw new Error('Entry ID is required');
    }
    
    const list = this.getSharedList();
    const entryIndex = list.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
      throw new Error('Entry not found');
    }
    
    // Remove entry
    list.splice(entryIndex, 1);
    
    // Save to storage
    this.storageManager.save(this.LIST_KEY, list);
    
    return true;
  }

  /**
   * Generate a unique ID for entries
   * @private
   * @returns {string} Unique ID
   */
  _generateId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Mark a film as watched and move it from shared list to watched list
   * @param {string} filmId - TMDB film ID
   * @param {number} rating - User rating (1-5 stars)
   * @param {string} userId - ID of user marking as watched
   * @param {string} username - Username of user marking as watched
   * @param {string} review - Optional review text about the film
   * @param {boolean} isAdmin - Whether the user has admin privileges
   * @returns {Object} Created WatchedFilm object
   * @throws {Error} If film not found, validation fails, or user is not admin
   */
  markAsWatched(filmId, rating, userId, username, review = '', isAdmin = false) {
    // Check admin privileges (Requirement 12.8)
    if (!isAdmin) {
      throw new Error('Admin privileges required to mark films as watched');
    }
    
    // Validate inputs
    if (!filmId) {
      throw new Error('Film ID is required');
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new Error('Rating must be a number between 1 and 5');
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }
    
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required');
    }
    
    // Find the film in shared list
    const sharedList = this.getSharedList();
    const entryIndex = sharedList.findIndex(entry => entry.film.id === filmId);
    
    if (entryIndex === -1) {
      throw new Error('Film not found in shared list');
    }
    
    const entry = sharedList[entryIndex];
    
    // Create watched film entry
    const watchedFilm = {
      id: this._generateId(),
      film: entry.film,
      rating: rating,
      ratedBy: username,
      ratedByUserId: userId,
      watchedAt: Date.now(),
      review: review || ''
    };
    
    // Add to watched list
    const watchedList = this.getWatchedList();
    watchedList.push(watchedFilm);
    this.storageManager.save(this.WATCHED_KEY, watchedList);
    
    // Remove from shared list
    sharedList.splice(entryIndex, 1);
    this.storageManager.save(this.LIST_KEY, sharedList);
    
    return watchedFilm;
  }

  /**
   * Get the watched films list from storage
   * @returns {Array} Array of WatchedFilm objects
   */
  getWatchedList() {
    const list = this.storageManager.load(this.WATCHED_KEY);
    return list || [];
  }

  /**
   * Update the rating of a watched film
   * @param {string} watchedId - ID of the watched film entry
   * @param {number} newRating - New rating value (1-5 stars)
   * @param {boolean} isAdmin - Whether the user has admin privileges
   * @returns {Object} Updated WatchedFilm object
   * @throws {Error} If watched film not found, validation fails, or user is not admin
   * Requirements: 13.3
   */
  updateWatchedRating(watchedId, newRating, isAdmin = false) {
    // Check admin privileges (Requirement 13.7)
    if (!isAdmin) {
      throw new Error('Admin privileges required to edit watched films');
    }
    
    // Validate inputs
    if (!watchedId || typeof watchedId !== 'string') {
      throw new Error('Watched film ID is required');
    }
    
    if (typeof newRating !== 'number' || newRating < 1 || newRating > 5) {
      throw new Error('Rating must be a number between 1 and 5');
    }
    
    // Get watched list
    const watchedList = this.getWatchedList();
    const watchedIndex = watchedList.findIndex(w => w.id === watchedId);
    
    if (watchedIndex === -1) {
      throw new Error('Watched film not found');
    }
    
    // Update rating
    watchedList[watchedIndex].rating = newRating;
    
    // Save to storage
    this.storageManager.save(this.WATCHED_KEY, watchedList);
    
    return watchedList[watchedIndex];
  }

  /**
   * Update the review of a watched film
   * @param {string} watchedId - ID of the watched film entry
   * @param {string} newReview - New review text
   * @param {boolean} isAdmin - Whether the user has admin privileges
   * @returns {Object} Updated WatchedFilm object
   * @throws {Error} If watched film not found, validation fails, or user is not admin
   * Requirements: 13.4
   */
  updateWatchedReview(watchedId, newReview, isAdmin = false) {
    // Check admin privileges (Requirement 13.7)
    if (!isAdmin) {
      throw new Error('Admin privileges required to edit watched films');
    }
    
    // Validate inputs
    if (!watchedId || typeof watchedId !== 'string') {
      throw new Error('Watched film ID is required');
    }
    
    if (typeof newReview !== 'string') {
      throw new Error('Review must be a string');
    }
    
    // Get watched list
    const watchedList = this.getWatchedList();
    const watchedIndex = watchedList.findIndex(w => w.id === watchedId);
    
    if (watchedIndex === -1) {
      throw new Error('Watched film not found');
    }
    
    // Update review
    watchedList[watchedIndex].review = newReview;
    
    // Save to storage
    this.storageManager.save(this.WATCHED_KEY, watchedList);
    
    return watchedList[watchedIndex];
  }

  /**
   * Remove a watched film from the watched list
   * @param {string} watchedId - ID of the watched film entry to remove
   * @param {boolean} isAdmin - Whether the user has admin privileges
   * @returns {boolean} True if watched film was removed
   * @throws {Error} If watched film not found or user is not admin
   * Requirements: 13.5, 13.6
   */
  removeFromWatched(watchedId, isAdmin = false) {
    // Check admin privileges (Requirement 13.7)
    if (!isAdmin) {
      throw new Error('Admin privileges required to edit watched films');
    }
    
    // Validate inputs
    if (!watchedId || typeof watchedId !== 'string') {
      throw new Error('Watched film ID is required');
    }
    
    // Get watched list
    const watchedList = this.getWatchedList();
    const watchedIndex = watchedList.findIndex(w => w.id === watchedId);
    
    if (watchedIndex === -1) {
      throw new Error('Watched film not found');
    }
    
    // Remove watched film
    watchedList.splice(watchedIndex, 1);
    
    // Save to storage
    this.storageManager.save(this.WATCHED_KEY, watchedList);
    
    return true;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ListService;
}
