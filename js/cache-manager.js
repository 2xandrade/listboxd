/**
 * CacheManager - Manages local cache for shared list and watched movies
 * Provides immediate updates and tracks pending sync operations
 * Requirements: 3.1, 3.4, 3.6, 3.7
 */

// Import ErrorRecovery for error handling
const ErrorRecovery = typeof require !== 'undefined' ? require('./error-recovery.js') : window.ErrorRecovery;

class CacheManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.SHARED_LIST_KEY = 'letterboxd_shared_list';
    this.WATCHED_LIST_KEY = 'letterboxd_watched_list';
    this.PENDING_OPS_KEY = 'letterboxd_pending_operations';
    
    // In-memory cache for faster access
    this.sharedListCache = null;
    this.watchedListCache = null;
    this.pendingOpsCache = null;
  }

  /**
   * Get shared list from cache
   * @returns {Array} Cached entries
   * Requirements: 3.6
   */
  getSharedList() {
    if (this.sharedListCache === null) {
      this.sharedListCache = this.storage.load(this.SHARED_LIST_KEY) || [];
    }
    return this.sharedListCache;
  }

  /**
   * Get watched movies from cache
   * @returns {Array} Cached watched movies
   * Requirements: 3.6
   */
  getWatchedList() {
    if (this.watchedListCache === null) {
      this.watchedListCache = this.storage.load(this.WATCHED_LIST_KEY) || [];
    }
    return this.watchedListCache;
  }

  /**
   * Add entry to shared list cache
   * @param {Object} entry - Entry to add
   * Requirements: 3.1, 3.7
   */
  addToSharedList(entry) {
    // Validate entry before adding
    if (!entry || typeof entry !== 'object') {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Cannot add invalid entry to shared list'), {
        context: 'CacheManager.addToSharedList',
        entryType: typeof entry,
        entryValue: entry
      });
      return;
    }

    // Ensure entry has required film fields
    if (!entry.film || typeof entry.film !== 'object') {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Entry missing film object'), {
        context: 'CacheManager.addToSharedList',
        entryId: entry.id || entry.id_filme,
        entryKeys: Object.keys(entry),
        filmType: typeof entry.film
      });
      return;
    }

    const sharedList = this.getSharedList();
    const initialLength = sharedList.length;
    
    // Check if entry already exists
    const existingIndex = sharedList.findIndex(e => 
      e.id === entry.id || e.id_filme === entry.id_filme
    );

    if (existingIndex >= 0) {
      // Update existing entry
      sharedList[existingIndex] = entry;
      console.log('CacheManager: Updated existing entry in shared list', entry.id);
    } else {
      // Add new entry
      sharedList.push(entry);
      console.log('CacheManager: Added new entry to shared list', entry.id);
    }

    // Update cache and persist
    this.sharedListCache = sharedList;
    this.storage.save(this.SHARED_LIST_KEY, sharedList);
    
    // Log cache state changes (Requirement 6.3)
    console.log(`CacheManager: Shared list cache updated`, {
      previousLength: initialLength,
      currentLength: sharedList.length,
      operation: existingIndex >= 0 ? 'update' : 'add',
      entryId: entry.id,
      filmTitle: entry.film?.title
    });
  }

  /**
   * Remove entry from shared list cache
   * @param {string} entryId - Entry ID to remove
   * Requirements: 3.1
   */
  removeFromSharedList(entryId) {
    const sharedList = this.getSharedList();
    const initialLength = sharedList.length;
    
    // Filter out the entry
    const filteredList = sharedList.filter(e => 
      e.id !== entryId && e.id_filme !== entryId
    );

    if (filteredList.length < initialLength) {
      this.sharedListCache = filteredList;
      this.storage.save(this.SHARED_LIST_KEY, filteredList);
      
      // Log cache state changes (Requirement 6.3)
      console.log(`CacheManager: Removed entry from shared list`, {
        entryId,
        previousLength: initialLength,
        currentLength: filteredList.length
      });
    } else {
      // Log when entry not found (Requirement 6.5)
      ErrorRecovery.logError(new Error('Entry not found in shared list'), {
        context: 'CacheManager.removeFromSharedList',
        entryId,
        currentCacheSize: sharedList.length,
        availableIds: sharedList.map(e => e.id || e.id_filme)
      });
    }
  }

  /**
   * Update cache from API response
   * @param {Array} entries - Entries from API
   * Requirements: 3.6
   */
  updateSharedListCache(entries) {
    if (!Array.isArray(entries)) {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Expected array for updateSharedListCache'), {
        context: 'CacheManager.updateSharedListCache',
        receivedType: typeof entries,
        receivedValue: entries
      });
      return;
    }

    // Deduplicate entries by ID to ensure unique entries in cache
    const uniqueEntries = [];
    const seenIds = new Set();
    for (const entry of entries) {
      const entryId = entry.id || entry.id_filme;
      if (entryId && !seenIds.has(entryId)) {
        seenIds.add(entryId);
        uniqueEntries.push(entry);
      }
    }

    const previousLength = this.sharedListCache ? this.sharedListCache.length : 0;
    this.sharedListCache = uniqueEntries;
    this.storage.save(this.SHARED_LIST_KEY, uniqueEntries);
    
    // Log cache state changes (Requirement 6.3)
    console.log(`CacheManager: Updated shared list cache`, {
      previousLength,
      currentLength: uniqueEntries.length,
      entriesAdded: Math.max(0, uniqueEntries.length - previousLength),
      entriesRemoved: Math.max(0, previousLength - uniqueEntries.length)
    });
  }

  /**
   * Update watched movies cache
   * @param {Array} movies - Watched movies from API
   * Requirements: 3.6
   */
  updateWatchedCache(movies) {
    if (!Array.isArray(movies)) {
      // Log entry structure when validation fails (Requirement 6.1)
      ErrorRecovery.logError(new Error('Expected array for updateWatchedCache'), {
        context: 'CacheManager.updateWatchedCache',
        receivedType: typeof movies,
        receivedValue: movies
      });
      return;
    }

    const previousLength = this.watchedListCache ? this.watchedListCache.length : 0;
    this.watchedListCache = movies;
    this.storage.save(this.WATCHED_LIST_KEY, movies);
    
    // Log cache state changes (Requirement 6.3)
    console.log(`CacheManager: Updated watched list cache`, {
      previousLength,
      currentLength: movies.length,
      moviesAdded: Math.max(0, movies.length - previousLength),
      moviesRemoved: Math.max(0, previousLength - movies.length)
    });
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.sharedListCache = null;
    this.watchedListCache = null;
    this.pendingOpsCache = null;
    
    this.storage.remove(this.SHARED_LIST_KEY);
    this.storage.remove(this.WATCHED_LIST_KEY);
    this.storage.remove(this.PENDING_OPS_KEY);
    
    console.log('CacheManager: Cleared all caches');
  }

  /**
   * Get pending sync operations
   * @returns {Array} Operations waiting to sync
   * Requirements: 3.4
   */
  getPendingOperations() {
    if (this.pendingOpsCache === null) {
      this.pendingOpsCache = this.storage.load(this.PENDING_OPS_KEY) || [];
    }
    return this.pendingOpsCache;
  }

  /**
   * Add operation to pending queue
   * @param {Object} operation - Operation to queue
   * Requirements: 3.4
   */
  addPendingOperation(operation) {
    const pendingOps = this.getPendingOperations();
    
    // Add operation with metadata
    const op = {
      id: operation.id || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: operation.type,
      entity: operation.entity,
      data: operation.data,
      timestamp: operation.timestamp || new Date().toISOString(),
      status: 'pending',
      retries: 0
    };
    
    pendingOps.push(op);
    this.pendingOpsCache = pendingOps;
    this.storage.save(this.PENDING_OPS_KEY, pendingOps);
    
    console.log(`CacheManager: Added pending operation ${op.id}`);
    return op;
  }

  /**
   * Mark operation as synced
   * @param {string} operationId - Operation ID
   * Requirements: 3.4
   */
  markAsSynced(operationId) {
    const pendingOps = this.getPendingOperations();
    
    // Remove the synced operation
    const filteredOps = pendingOps.filter(op => op.id !== operationId);
    
    if (filteredOps.length < pendingOps.length) {
      this.pendingOpsCache = filteredOps;
      this.storage.save(this.PENDING_OPS_KEY, filteredOps);
      console.log(`CacheManager: Marked operation ${operationId} as synced`);
    } else {
      console.warn(`CacheManager: Operation ${operationId} not found in pending operations`);
    }
  }

  /**
   * Update operation retry count
   * @param {string} operationId - Operation ID
   */
  incrementRetryCount(operationId) {
    const pendingOps = this.getPendingOperations();
    const op = pendingOps.find(o => o.id === operationId);
    
    if (op) {
      op.retries = (op.retries || 0) + 1;
      this.pendingOpsCache = pendingOps;
      this.storage.save(this.PENDING_OPS_KEY, pendingOps);
      console.log(`CacheManager: Incremented retry count for operation ${operationId} to ${op.retries}`);
    }
  }

  /**
   * Mark operation as failed
   * @param {string} operationId - Operation ID
   */
  markAsFailed(operationId) {
    const pendingOps = this.getPendingOperations();
    const op = pendingOps.find(o => o.id === operationId);
    
    if (op) {
      op.status = 'failed';
      this.pendingOpsCache = pendingOps;
      this.storage.save(this.PENDING_OPS_KEY, pendingOps);
      console.log(`CacheManager: Marked operation ${operationId} as failed`);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}
