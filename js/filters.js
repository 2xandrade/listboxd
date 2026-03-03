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
      streaming: null,
      random: false,
      sortBy: 'dateAdded' // Default sort option
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

    // Apply streaming service filter
    if (this.activeFilters.streaming) {
      entries = this.filterByStreaming(entries, this.activeFilters.streaming);
    }

    // Apply sorting (before random to allow random to override)
    if (this.activeFilters.sortBy && this.activeFilters.sortBy !== 'random') {
      entries = this.sortEntries(entries, this.activeFilters.sortBy);
    }

    // Apply random ordering (overrides other sorting)
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
   * Filter entries by streaming service
   * @param {Array} entries - Film entries to filter
   * @param {string} serviceKey - Streaming service key to filter by
   * @returns {Array} Filtered entries
   * Requirements: 11.3
   */
  filterByStreaming(entries, serviceKey) {
    if (!serviceKey) return entries;
    
    return entries.filter(entry => {
      if (!entry.film.streamingServices || !Array.isArray(entry.film.streamingServices)) {
        return false;
      }
      
      return entry.film.streamingServices.includes(serviceKey);
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
   * Sort entries by specified criteria
   * @param {Array} entries - Film entries to sort
   * @param {string} sortBy - Sort criteria: 'dateAdded', 'rating', 'year', 'random'
   * @returns {Array} Sorted entries
   * Requirements: 11.2
   */
  sortEntries(entries, sortBy) {
    const sorted = [...entries];
    
    switch (sortBy) {
      case 'dateAdded':
        // Sort by date added (newest first)
        return sorted.sort((a, b) => {
          const dateA = new Date(a.addedAt || a.watchedAt || 0);
          const dateB = new Date(b.addedAt || b.watchedAt || 0);
          return dateB - dateA;
        });
      
      case 'rating':
        // Sort by user rating (highest first), then by film rating
        return sorted.sort((a, b) => {
          // For watched films, use the user rating
          const ratingA = a.rating !== undefined ? a.rating : (a.film.rating || 0);
          const ratingB = b.rating !== undefined ? b.rating : (b.film.rating || 0);
          
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          
          // If ratings are equal, sort by film rating
          return (b.film.rating || 0) - (a.film.rating || 0);
        });
      
      case 'year':
        // Sort by release year (newest first)
        return sorted.sort((a, b) => {
          const yearA = parseInt(a.film.year) || 0;
          const yearB = parseInt(b.film.year) || 0;
          return yearB - yearA;
        });
      
      case 'random':
        // Random sorting is handled separately
        return this.shuffleArray(sorted);
      
      default:
        // Default to date added
        return sorted.sort((a, b) => {
          const dateA = new Date(a.addedAt || a.watchedAt || 0);
          const dateB = new Date(b.addedAt || b.watchedAt || 0);
          return dateB - dateA;
        });
    }
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
   * Set streaming service filter
   * @param {string|null} serviceKey - Streaming service key to filter by, or null to clear
   * Requirements: 11.3, 14.1
   */
  setStreamingFilter(serviceKey) {
    this.activeFilters.streaming = serviceKey;
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
   * Set sort order
   * @param {string} sortBy - Sort criteria: 'dateAdded', 'rating', 'year', 'random'
   * Requirements: 11.2
   */
  setSortBy(sortBy) {
    this.activeFilters.sortBy = sortBy;
    
    // If setting to random, also enable random filter
    if (sortBy === 'random') {
      this.activeFilters.random = true;
    } else {
      // If setting to non-random, disable random filter
      this.activeFilters.random = false;
    }
    
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
      streaming: null,
      random: false,
      sortBy: 'dateAdded' // Reset to default sort
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
           this.activeFilters.streaming !== null ||
           this.activeFilters.random === true;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterManager;
}
