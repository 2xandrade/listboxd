/**
 * SyncManager - Manages synchronization between local cache and API
 * Handles offline operations, retry logic, and connectivity detection
 * Requirements: 3.2, 3.3, 3.5, 7.2, 7.3, 7.4
 */

class SyncManager {
  constructor(googleSheetsApi, cacheManager) {
    if (!googleSheetsApi) {
      throw new Error('SyncManager requires a GoogleSheetsApi instance');
    }
    if (!cacheManager) {
      throw new Error('SyncManager requires a CacheManager instance');
    }
    
    this.api = googleSheetsApi;
    this.cache = cacheManager;
    this.isSyncing = false;
    this.maxRetries = 3;
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Check if online
   * @returns {boolean} True if online
   * Requirements: 7.3
   */
  isOnline() {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') {
      return navigator.onLine;
    }
    // Default to true if we can't detect
    return true;
  }

  /**
   * Handle online event
   * Requirements: 7.4
   */
  handleOnline() {
    console.log('SyncManager: Connection restored, syncing pending operations');
    this.processSyncQueue().catch(error => {
      console.error('SyncManager: Error processing sync queue after reconnection:', error);
    });
  }

  /**
   * Handle offline event
   * Requirements: 7.3
   */
  handleOffline() {
    console.log('SyncManager: Connection lost, operations will be queued');
  }

  /**
   * Load data from API to cache
   * @param {string} userId - User ID for fetching lists
   * @returns {Promise<void>}
   * Requirements: 3.5
   */
  async loadFromServer(userId) {
    if (!userId) {
      throw new Error('User ID is required to load data from server');
    }

    try {
      console.log('SyncManager: Loading data from server for user', userId);
      
      // Load shared lists
      const listsResponse = await this.api.getListsByUser(userId);
      
      // Log API responses (Requirement 6.2)
      console.log('SyncManager: Received lists response', {
        userId,
        listsCount: listsResponse?.data?.length || 0,
        responseStatus: listsResponse?.status || 'unknown'
      });
      
      if (listsResponse && listsResponse.data) {
        const lists = listsResponse.data;
        
        // Find the shared list (assuming first list or specific list)
        if (lists.length > 0) {
          const sharedListId = lists[0].id_lista;
          
          // Load movies from the shared list
          const moviesResponse = await this.api.getMoviesByList({
            id_lista: sharedListId,
            id_usuario: userId
          });
          
          // Log API responses (Requirement 6.2)
          console.log('SyncManager: Received movies response', {
            listId: sharedListId,
            moviesCount: moviesResponse?.data?.length || 0,
            responseStatus: moviesResponse?.status || 'unknown'
          });
          
          if (moviesResponse && moviesResponse.data) {
            const entries = moviesResponse.data;
            this.cache.updateSharedListCache(entries);
            console.log(`SyncManager: Loaded ${entries.length} entries from server`);
          }
        } else {
          // No lists found, clear cache
          this.cache.updateSharedListCache([]);
          console.log('SyncManager: No lists found, cache cleared');
        }
      }
      
      // Note: Watched movies would be loaded separately if API supports it
      // For now, we focus on shared list as per requirements
      
    } catch (error) {
      // Log API responses and status codes on errors (Requirement 6.2)
      ErrorRecovery.logError(error, {
        context: 'SyncManager.loadFromServer',
        userId,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Add operation to sync queue
   * @param {Object} operation - Operation to queue
   * @returns {Object} Queued operation
   * Requirements: 7.2
   */
  queueOperation(operation) {
    if (!operation || typeof operation !== 'object') {
      throw new Error('Invalid operation object');
    }
    
    if (!operation.type || !operation.entity || !operation.data) {
      throw new Error('Operation must have type, entity, and data fields');
    }
    
    console.log('SyncManager: Queueing operation', operation.type, operation.entity);
    
    const queuedOp = this.cache.addPendingOperation(operation);
    
    // If online, try to process immediately (but don't await to avoid blocking)
    if (this.isOnline() && !this.isSyncing) {
      // Use setTimeout to avoid blocking the current execution
      setTimeout(() => {
        this.processSyncQueue().catch(error => {
          console.error('SyncManager: Error processing sync queue:', error);
        });
      }, 0);
    }
    
    return queuedOp;
  }

  /**
   * Process sync queue with retry logic
   * @returns {Promise<void>}
   * Requirements: 3.2, 7.2, 7.4
   */
  async processSyncQueue() {
    if (this.isSyncing) {
      console.log('SyncManager: Already syncing, skipping');
      return;
    }
    
    if (!this.isOnline()) {
      console.log('SyncManager: Offline, skipping sync');
      return;
    }
    
    this.isSyncing = true;
    
    try {
      const pendingOps = this.cache.getPendingOperations();
      
      if (pendingOps.length === 0) {
        console.log('SyncManager: No pending operations to sync');
        return;
      }
      
      console.log(`SyncManager: Processing ${pendingOps.length} pending operations`);
      
      for (const operation of pendingOps) {
        if (operation.status === 'failed' && operation.retries >= this.maxRetries) {
          // Log context information (Requirement 6.5)
          ErrorRecovery.logError(new Error('Operation exceeded max retries'), {
            context: 'SyncManager.processSyncQueue',
            operationId: operation.id,
            operationType: operation.type,
            operationEntity: operation.entity,
            retries: operation.retries,
            maxRetries: this.maxRetries,
            operationData: operation.data
          });
          continue;
        }
        
        try {
          await this.syncOperation(operation);
          this.cache.markAsSynced(operation.id);
          console.log(`SyncManager: Successfully synced operation ${operation.id}`);
        } catch (error) {
          // Log API responses and status codes on errors (Requirement 6.2)
          ErrorRecovery.logError(error, {
            context: 'SyncManager.processSyncQueue',
            operationId: operation.id,
            operationType: operation.type,
            operationEntity: operation.entity,
            retries: operation.retries,
            statusCode: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data
          });
          
          this.cache.incrementRetryCount(operation.id);
          
          if (operation.retries + 1 >= this.maxRetries) {
            this.cache.markAsFailed(operation.id);
            // Log context information (Requirement 6.5)
            ErrorRecovery.logError(new Error('Operation marked as failed'), {
              context: 'SyncManager.processSyncQueue',
              operationId: operation.id,
              operationType: operation.type,
              finalRetries: operation.retries + 1,
              maxRetries: this.maxRetries
            });
          }
        }
      }
      
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single operation to the server
   * @param {Object} operation - Operation to sync
   * @returns {Promise<any>} API response
   * Requirements: 3.2, 3.3
   */
  async syncOperation(operation) {
    const { type, entity, data } = operation;
    
    console.log(`SyncManager: Syncing ${type} operation for ${entity}`);
    
    if (entity === 'shared') {
      if (type === 'add') {
        return await this.syncAddToSharedList(data);
      } else if (type === 'remove') {
        return await this.syncRemoveFromSharedList(data);
      }
    } else if (entity === 'watched') {
      if (type === 'add') {
        return await this.syncAddWatchedMovie(data);
      }
    }
    
    throw new Error(`Unknown operation type: ${type} for entity: ${entity}`);
  }

  /**
   * Sync add to shared list operation
   * @param {Object} data - Operation data
   * @returns {Promise<any>} API response
   * Requirements: 3.2, 3.3
   */
  async syncAddToSharedList(data) {
    // Validate required fields
    if (!data.id_lista || !data.id_usuario || !data.titulo_filme) {
      throw new Error('Missing required fields for adding to shared list');
    }
    
    // Call API to add movie
    const response = await this.api.addMovieToList({
      id_lista: data.id_lista,
      id_usuario: data.id_usuario,
      titulo_filme: data.titulo_filme,
      ano: data.ano,
      tmdb_id: data.tmdb_id,
      addedBy: data.addedBy,
      addedByUserId: data.addedByUserId
    });
    
    // If the entry has a temporary ID, update it with the real ID from server
    if (data.tempId && response && response.data) {
      const realId = response.id || response.data.id;
      if (realId) {
        this.updateEntryId(data.tempId, realId);
      }
    }
    
    return response;
  }

  /**
   * Sync remove from shared list operation
   * @param {Object} data - Operation data
   * @returns {Promise<any>} API response
   * Requirements: 3.2
   */
  async syncRemoveFromSharedList(data) {
    if (!data.id_filme) {
      throw new Error('Missing id_filme for removing from shared list');
    }
    
    // Call API to delete movie
    const response = await this.api.deleteMovie(data.id_filme);
    return response;
  }

  /**
   * Sync add watched movie operation
   * @param {Object} data - Operation data
   * @returns {Promise<any>} API response
   * Requirements: 3.2, 3.3
   */
  async syncAddWatchedMovie(data) {
    // Validate required fields
    if (!data.id_lista || !data.id_usuario || !data.titulo_filme) {
      throw new Error('Missing required fields for adding watched movie');
    }
    
    // Call API to add watched movie
    const response = await this.api.addWatchedMovie({
      id_lista: data.id_lista,
      id_usuario: data.id_usuario,
      titulo_filme: data.titulo_filme,
      ano: data.ano,
      nota: data.nota,
      assistido_em: data.assistido_em
    });
    
    // If the entry has a temporary ID, update it with the real ID from server
    if (data.tempId && response && response.data) {
      const realId = response.id || response.data.id;
      if (realId) {
        this.updateWatchedEntryId(data.tempId, realId);
      }
    }
    
    return response;
  }

  /**
   * Update entry ID in cache after successful sync
   * @param {string} tempId - Temporary ID
   * @param {string} realId - Real ID from server
   * Requirements: 3.3
   */
  updateEntryId(tempId, realId) {
    const sharedList = this.cache.getSharedList();
    const entryIndex = sharedList.findIndex(e => e.id === tempId || e.id_filme === tempId);
    
    if (entryIndex >= 0) {
      // Create a new entry object with updated ID to avoid mutation issues
      const entry = sharedList[entryIndex];
      const updatedEntry = {
        ...entry,
        id: realId,
        id_filme: realId
      };
      
      // Create a new array with the updated entry
      const updatedList = [
        ...sharedList.slice(0, entryIndex),
        updatedEntry,
        ...sharedList.slice(entryIndex + 1)
      ];
      
      this.cache.updateSharedListCache(updatedList);
      console.log(`SyncManager: Updated entry ID from ${tempId} to ${realId}`);
    }
  }

  /**
   * Update watched entry ID in cache after successful sync
   * @param {string} tempId - Temporary ID
   * @param {string} realId - Real ID from server
   * Requirements: 3.3
   */
  updateWatchedEntryId(tempId, realId) {
    const watchedList = this.cache.getWatchedList();
    const entryIndex = watchedList.findIndex(e => e.id === tempId || e.id_filme === tempId);
    
    if (entryIndex >= 0) {
      // Create a new entry object with updated ID to avoid mutation issues
      const entry = watchedList[entryIndex];
      const updatedEntry = {
        ...entry,
        id: realId,
        id_filme: realId
      };
      
      // Create a new array with the updated entry
      const updatedList = [
        ...watchedList.slice(0, entryIndex),
        updatedEntry,
        ...watchedList.slice(entryIndex + 1)
      ];
      
      this.cache.updateWatchedCache(updatedList);
      console.log(`SyncManager: Updated watched entry ID from ${tempId} to ${realId}`);
    }
  }

  /**
   * Sync local changes to API
   * @returns {Promise<void>}
   * Requirements: 3.2
   */
  async syncToServer() {
    return this.processSyncQueue();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncManager;
}
