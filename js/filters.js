/**
 * FilterManager - Manages filtering and sorting of shared list
 * Handles genre filters, name search, and random ordering
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

class FilterManager {
  constructor(listService) {
    this.listService = listService;
    this.storageKey = 'filter_state';
    
    // Load persisted filter state or use defaults
    this.activeFilters = this.loadFilterState() || {
      genre: null,
      name: null,
      random: false
    };
  }

  /**
   * Load filter state from localStorage
   * @returns {Object|null} Saved filter state or null
   * Requirements: 14.3
   */
  loadFilterState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading filter state:', error);
    }
    return null;
  }

  /**
   * Save filter state to localStorage
   * Requirements: 14.3
   */
  saveFilterState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.activeFilters));
    } catch (error) {
      console.error('Error saving filter state:', error);
    }
  }

  /**
   * Apply all active filters to a list
   * @param {Array} list - Optional list to filter (defaults to shared list)
   * @returns {Array} Filtered list of film entries
   * Requirements: 11.5, 11.7, 15.5
   */
  applyFilters(list = null) {
    let entries = list !== null ? list : this.listService.getSharedList();

    // Apply genre filter
    if (this.activeFilters.genre) {
      entries = this.filterByGenre(entries, this.activeFilters.genre);
    }

    // Apply name filter
    if (this.activeFilters.name) {
      entries = this.filterByName(entries, this.activeFilters.name);
    }

    // Apply random ordering
    if (this.activeFilters.random) {
      entries = this.shuffleArray([...entries]);
    }

    return entries;
  }

  /**
   * Filter entries by genre
   * @param {Array} entries - Film entries to filter
   * @param {string} genre - Genre to filter by
   * @returns {Array} Filtered entries
   * Requirements: 11.2
   */
  filterByGenre(entries, genre) {
    if (!genre) return entries;
    
    return entries.filter(entry => {
      if (!entry.film.genres || !Array.isArray(entry.film.genres)) {
        return false;
      }
      
      // Case-insensitive genre matching
      return entry.film.genres.some(g => 
        g.toLowerCase() === genre.toLowerCase()
      );
    });
  }

  /**
   * Filter entries by film title
   * @param {Array} entries - Film entries to filter
   * @param {string} searchText - Text to search for in titles
   * @returns {Array} Filtered entries
   * Requirements: 11.3
   */
  filterByName(entries, searchText) {
    if (!searchText || searchText.trim() === '') return entries;
    
    const searchLower = searchText.toLowerCase().trim();
    
    return entries.filter(entry => {
      if (!entry.film.title) return false;
      
      return entry.film.title.toLowerCase().includes(searchLower);
    });
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   * Requirements: 11.4
   */
  shuffleArray(array) {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Set genre filter
   * @param {string|null} genre - Genre to filter by, or null to clear
   * Requirements: 11.2, 14.1
   */
  setGenreFilter(genre) {
    this.activeFilters.genre = genre;
    this.saveFilterState();
  }

  /**
   * Set name filter
   * @param {string|null} searchText - Text to search for, or null to clear
   * Requirements: 11.3, 14.1
   */
  setNameFilter(searchText) {
    this.activeFilters.name = searchText;
    this.saveFilterState();
  }

  /**
   * Set random ordering
   * @param {boolean} enabled - Whether to enable random ordering
   * Requirements: 11.4, 14.2
   */
  setRandomFilter(enabled) {
    this.activeFilters.random = enabled;
    this.saveFilterState();
  }

  /**
   * Clear all filters
   * Requirements: 11.6, 14.3
   */
  clearAllFilters() {
    this.activeFilters = {
      genre: null,
      name: null,
      random: false
    };
    this.saveFilterState();
  }

  /**
   * Get all unique genres from a list
   * @param {Array} list - Optional list to get genres from (defaults to shared list)
   * @returns {Array} Array of unique genre names
   */
  getAllGenres(list = null) {
    const entries = list !== null ? list : this.listService.getSharedList();
    const genresSet = new Set();

    entries.forEach(entry => {
      if (entry.film.genres && Array.isArray(entry.film.genres)) {
        entry.film.genres.forEach(genre => {
          if (genre && typeof genre === 'string') {
            genresSet.add(genre);
          }
        });
      }
    });

    return Array.from(genresSet).sort();
  }

  /**
   * Get current active filters
   * @returns {Object} Current filter state
   */
  getActiveFilters() {
    return { ...this.activeFilters };
  }

  /**
   * Check if any filters are active
   * @returns {boolean} True if any filter is active
   */
  hasActiveFilters() {
    return this.activeFilters.genre !== null ||
           this.activeFilters.name !== null ||
           this.activeFilters.random === true;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterManager;
}
