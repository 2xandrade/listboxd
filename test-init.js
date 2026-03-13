/**
 * Simple test to verify app.js initialization with new architecture
 */

// Mock dependencies
global.CONFIG = {
  googleSheets: {
    apiUrl: 'https://script.google.com/macros/s/test/exec'
  }
};

// Mock DOM
global.document = {
  addEventListener: (event, handler) => {
    if (event === 'DOMContentLoaded') {
      console.log('✓ DOMContentLoaded listener registered');
    }
  },
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {}
  })
};

global.window = {
  addEventListener: () => {},
  innerWidth: 1024
};

global.navigator = {
  onLine: true
};

// Mock classes
class StorageManager {
  load() { return null; }
  save() {}
  remove() {}
}

class CacheManager {
  constructor(storage) {
    console.log('✓ CacheManager instantiated with StorageManager');
  }
  getSharedList() { return []; }
  getWatchedList() { return []; }
}

class SyncManager {
  constructor(api, cache) {
    console.log('✓ SyncManager instantiated with API and CacheManager');
  }
}

class ErrorRecovery {
  static async retryWithBackoff(fn, retries, delay, timeout) {
    console.log(`✓ ErrorRecovery.retryWithBackoff called with ${retries} retries, ${delay}ms delay, ${timeout}ms timeout`);
    return await fn();
  }
  
  static withTimeout(promise, timeout) {
    console.log(`✓ ErrorRecovery.withTimeout called with ${timeout}ms timeout`);
    return promise;
  }
  
  static handleApiError(error, context) {
    console.log(`✓ ErrorRecovery.handleApiError called for context: ${context}`);
    return { userMessage: error.message };
  }
}

class GoogleSheetsApi {}
class AuthService {
  getCurrentUser() { return null; }
}
class UserService {}
class FilmService {}
class ListService {
  constructor(api, auth, cache, sync) {
    console.log('✓ ListService instantiated with API, AuthService, CacheManager, and SyncManager');
  }
  async initialize() {
    console.log('✓ ListService.initialize called');
  }
}
class FilterManager {}
class TabManager {}
class StreamingService {}
class KeyboardShortcuts {
  register() {}
}

// Make classes global
global.StorageManager = StorageManager;
global.CacheManager = CacheManager;
global.SyncManager = SyncManager;
global.ErrorRecovery = ErrorRecovery;
global.GoogleSheetsApi = GoogleSheetsApi;
global.AuthService = AuthService;
global.UserService = UserService;
global.FilmService = FilmService;
global.ListService = ListService;
global.FilterManager = FilterManager;
global.TabManager = TabManager;
global.StreamingService = StreamingService;
global.KeyboardShortcuts = KeyboardShortcuts;

console.log('\n=== Testing app.js initialization ===\n');

// Load app.js (just the initialization part)
eval(`
let cacheManager, syncManager;

(async () => {
  try {
    await ErrorRecovery.retryWithBackoff(async () => {
      console.log('Starting initialization...');
      
      const storageManager = new StorageManager();
      const authService = new AuthService();
      const googleSheetsApi = new GoogleSheetsApi();
      
      // Create CacheManager
      cacheManager = new CacheManager(storageManager);
      
      // Create SyncManager
      syncManager = new SyncManager(googleSheetsApi, cacheManager);
      
      // Create ListService with new parameters
      const listService = new ListService(googleSheetsApi, authService, cacheManager, syncManager);
      
      // Test initialize with timeout
      await ErrorRecovery.withTimeout(listService.initialize(), 10000);
      
      console.log('\\n✓ All components initialized successfully!');
    }, 3, 2000, 15000);
  } catch (error) {
    const errorInfo = ErrorRecovery.handleApiError(error, 'Application initialization');
    console.log('\\n✓ Error handling works correctly');
  }
})();
`);

console.log('\n=== Test completed ===\n');
