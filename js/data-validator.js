/**
 * DataValidator - Validates and normalizes data structures
 * Prevents crashes from malformed API responses
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

// Import ErrorRecovery for error handling
const ErrorRecovery = typeof require !== 'undefined' ? require('./error-recovery.js') : window.ErrorRecovery;

class DataValidator {
  /**
   * Validate and normalize a list entry
   * @param {Object} entry - Raw entry from API or cache
   * @returns {Object|null} Normalized entry or null if invalid
   * Requirements: 1.1, 1.2, 1.5
   */
  static validateEntry(entry) {
    // Check if entry exists
    if (!entry || typeof entry !== 'object') {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Entry validation failed: null or not an object'), {
        context: 'DataValidator.validateEntry',
        entryType: typeof entry,
        entryValue: entry,
        reason: 'Entry is null or not an object'
      });
      return null;
    }

    // Check if entry has a film object
    if (!entry.film || typeof entry.film !== 'object') {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Entry validation failed: missing film object'), {
        context: 'DataValidator.validateEntry',
        entryId: entry.id || entry.id_filme,
        entryStructure: Object.keys(entry),
        filmType: typeof entry.film,
        reason: 'Entry missing film object'
      });
      return null;
    }

    // Validate the film object
    if (!this.validateFilm(entry.film)) {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Entry validation failed: invalid film object'), {
        context: 'DataValidator.validateEntry',
        entryId: entry.id || entry.id_filme,
        filmStructure: Object.keys(entry.film),
        filmData: entry.film,
        reason: 'Invalid film object in entry'
      });
      return null;
    }

    // Normalize the entry structure
    return this.normalizeEntry(entry);
  }

  /**
   * Validate film object structure
   * @param {Object} film - Film object
   * @returns {boolean} True if valid
   * Requirements: 1.1, 1.4
   */
  static validateFilm(film) {
    if (!film || typeof film !== 'object') {
      return false;
    }

    // Check required fields
    if (!film.title || typeof film.title !== 'string' || film.title.trim().length === 0) {
      return false;
    }

    // ID can be number or string
    if (film.id === undefined || film.id === null) {
      return false;
    }

    // Genres should be an array (can be empty)
    if (film.genres !== undefined && !Array.isArray(film.genres)) {
      return false;
    }

    return true;
  }

  /**
   * Normalize entry structure from API response
   * Ensures all expected fields exist with proper types
   * @param {Object} rawEntry - Raw entry from API
   * @returns {Object} Normalized entry
   * Requirements: 1.5
   */
  static normalizeEntry(rawEntry) {
    // Log normalization transformations (Requirement 6.4)
    const transformations = [];
    
    const normalized = {
      // Entry IDs
      id: rawEntry.id || rawEntry.id_filme || `temp-${Date.now()}`,
      id_filme: rawEntry.id_filme || rawEntry.id || `temp-${Date.now()}`,
      
      // TMDB ID
      tmdb_id: rawEntry.tmdb_id || rawEntry.film?.id || null,
      
      // Film object with all required fields
      film: {
        id: rawEntry.film?.id || rawEntry.tmdb_id || null,
        title: rawEntry.film?.title || rawEntry.titulo_filme || '',
        year: rawEntry.film?.year || rawEntry.ano || null,
        poster: rawEntry.film?.poster || null,
        rating: rawEntry.film?.rating || 0,
        genres: Array.isArray(rawEntry.film?.genres) ? rawEntry.film.genres : [],
        overview: rawEntry.film?.overview || ''
      },
      
      // Legacy fields for compatibility
      titulo_filme: rawEntry.titulo_filme || rawEntry.film?.title || '',
      ano: rawEntry.ano || rawEntry.film?.year || null,
      
      // Metadata
      addedBy: rawEntry.addedBy || rawEntry.added_by || '',
      addedByUserId: rawEntry.addedByUserId || rawEntry.added_by_user_id || '',
      addedAt: rawEntry.addedAt || rawEntry.added_at || new Date().toISOString(),
      
      // Streaming services (if present)
      streamingServices: Array.isArray(rawEntry.streamingServices) 
        ? rawEntry.streamingServices 
        : []
    };

    // Track transformations applied
    if (!rawEntry.id && !rawEntry.id_filme) {
      transformations.push('Generated temporary ID');
    }
    if (!rawEntry.film?.title && rawEntry.titulo_filme) {
      transformations.push('Mapped titulo_filme to film.title');
    }
    if (!Array.isArray(rawEntry.film?.genres)) {
      transformations.push('Initialized empty genres array');
    }

    // Log normalization transformations (Requirement 6.4)
    if (transformations.length > 0) {
      console.log('DataValidator: Normalization applied', {
        entryId: normalized.id,
        transformations,
        originalKeys: Object.keys(rawEntry),
        normalizedKeys: Object.keys(normalized)
      });
    }

    return normalized;
  }

  /**
   * Check if entry has all required fields
   * @param {Object} entry - Entry to check
   * @returns {boolean} True if complete
   * Requirements: 1.3
   */
  static isCompleteEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    // Check entry has ID
    if (!entry.id && !entry.id_filme) {
      return false;
    }

    // Check entry has film object
    if (!entry.film || typeof entry.film !== 'object') {
      return false;
    }

    // Check film has required fields
    if (!entry.film.title || typeof entry.film.title !== 'string') {
      return false;
    }

    if (entry.film.id === undefined || entry.film.id === null) {
      return false;
    }

    // Check genres is an array
    if (!Array.isArray(entry.film.genres)) {
      return false;
    }

    return true;
  }

  /**
   * Validate and filter an array of entries
   * Returns only valid entries, logging warnings for invalid ones
   * @param {Array} entries - Array of entries to validate
   * @returns {Array} Array of valid, normalized entries
   * Requirements: 1.1, 1.2
   */
  static validateEntries(entries) {
    if (!Array.isArray(entries)) {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Expected array of entries'), {
        context: 'DataValidator.validateEntries',
        receivedType: typeof entries,
        receivedValue: entries
      });
      return [];
    }

    const validEntries = [];
    const invalidEntries = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const validatedEntry = this.validateEntry(entry);
      
      if (validatedEntry) {
        validEntries.push(validatedEntry);
      } else {
        invalidEntries.push({ index: i, entry });
      }
    }

    // Log validation summary (Requirement 6.1)
    console.log(`DataValidator: Validated ${validEntries.length} of ${entries.length} entries`);
    
    if (invalidEntries.length > 0) {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error(`${invalidEntries.length} invalid entries found`), {
        context: 'DataValidator.validateEntries',
        totalEntries: entries.length,
        validEntries: validEntries.length,
        invalidEntries: invalidEntries.length,
        invalidEntriesDetails: invalidEntries.map(({ index, entry }) => ({
          index,
          id: entry?.id || entry?.id_filme,
          hasFilm: !!entry?.film,
          filmTitle: entry?.film?.title || entry?.titulo_filme
        }))
      });
    }
    
    return validEntries;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
}
