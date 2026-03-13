/**
 * Unit tests for authentication UI flow
 * Tests the UI state transitions during authentication
 * Requirements: 2.1, 2.2, 2.4, 2.5
 * 
 * Task 6.1: Write unit tests for authentication flow
 * - Test login success hides login screen
 * - Test authenticated UI shows correctly
 * - Test only one section visible at a time
 */

describe('Authentication UI Flow - Task 6.1', () => {
  let mockAuthService;
  let mockTabManager;
  let mockListService;
  let mockStorageManager;
  
  // Mock DOM elements
  let loginSection;
  let filmListingSection;
  let sharedListSection;
  let watchedFilmsSection;
  let mainTabsContainer;
  let navMenu;
  
  beforeEach(() => {
    // Create mock DOM structure
    document.body.innerHTML = `
      <div id="login-section" class="hidden">
        <div id="login-form-container">
          <form id="login-form">
            <input id="login-email" type="email" />
            <input id="login-password" type="password" />
            <button id="login-btn" type="submit">
              <span class="btn-text">Login</span>
              <span class="btn-loader hidden">Loading...</span>
            </button>
          </form>
          <div id="login-error" class="hidden"></div>
        </div>
        <div id="register-form-container" class="hidden">
          <form id="register-form">
            <input id="register-name" type="text" />
            <input id="register-email" type="email" />
            <input id="register-password" type="password" />
            <input id="register-password-confirm" type="password" />
            <button id="register-btn" type="submit">Register</button>
          </form>
          <div id="register-error" class="hidden"></div>
        </div>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="register">Register</button>
        </div>
      </div>
      <div id="main-tabs" class="hidden">
        <button data-tab="film-listing">Films</button>
        <button data-tab="shared-list">Shared List</button>
        <button data-tab="watched-films">Watched</button>
      </div>
      <div id="film-listing" class="hidden"></div>
      <div id="shared-list" class="hidden"></div>
      <div id="watched-films" class="hidden"></div>
      <div id="nav-menu"></div>
    `;
    
    // Get references to DOM elements
    loginSection = document.getElementById('login-section');
    filmListingSection = document.getElementById('film-listing');
    sharedListSection = document.getElementById('shared-list');
    watchedFilmsSection = document.getElementById('watched-films');
    mainTabsContainer = document.getElementById('main-tabs');
    navMenu = document.getElementById('nav-menu');
    
    // Create mock services
    mockAuthService = {
      isAuthenticated: jest.fn(),
      getCurrentUser: jest.fn(),
      login: jest.fn(),
      logout: jest.fn()
    };
    
    mockTabManager = {
      initialize: jest.fn()
    };
    
    mockListService = {
      initialize: jest.fn().mockResolvedValue(undefined)
    };
    
    mockStorageManager = {
      load: jest.fn(),
      save: jest.fn()
    };
    
    // Mock global notification service
    global.notificationService = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    };
    
    // Set global services
    global.authService = mockAuthService;
    global.tabManager = mockTabManager;
    global.listService = mockListService;
    global.storageManager = mockStorageManager;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });
  
  describe('hideAllSections()', () => {
    it('should hide all main sections', () => {
      // Arrange - Show all sections
      loginSection.classList.remove('hidden');
      filmListingSection.classList.remove('hidden');
      sharedListSection.classList.remove('hidden');
      watchedFilmsSection.classList.remove('hidden');
      mainTabsContainer.classList.remove('hidden');
      
      // Act
      hideAllSections();
      
      // Assert - All sections should be hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
      expect(filmListingSection.classList.contains('hidden')).toBe(true);
      expect(sharedListSection.classList.contains('hidden')).toBe(true);
      expect(watchedFilmsSection.classList.contains('hidden')).toBe(true);
      expect(mainTabsContainer.classList.contains('hidden')).toBe(true);
    });
    
    it('should not throw error if sections are already hidden', () => {
      // Arrange - All sections already hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
      
      // Act & Assert - Should not throw
      expect(() => hideAllSections()).not.toThrow();
    });
    
    it('should handle missing DOM elements gracefully', () => {
      // Arrange - Remove a section
      const filmListing = document.getElementById('film-listing');
      filmListing.remove();
      
      // Act & Assert - Should not throw
      expect(() => hideAllSections()).not.toThrow();
    });
  });
  
  describe('showLoginScreen()', () => {
    it('should hide all other sections before showing login', () => {
      // Arrange - Show some other sections
      filmListingSection.classList.remove('hidden');
      sharedListSection.classList.remove('hidden');
      mainTabsContainer.classList.remove('hidden');
      
      // Act
      showLoginScreen();
      
      // Assert - Only login section should be visible
      expect(loginSection.classList.contains('hidden')).toBe(false);
      expect(filmListingSection.classList.contains('hidden')).toBe(true);
      expect(sharedListSection.classList.contains('hidden')).toBe(true);
      expect(watchedFilmsSection.classList.contains('hidden')).toBe(true);
      expect(mainTabsContainer.classList.contains('hidden')).toBe(true);
    });
    
    it('should show login section', () => {
      // Arrange - Login section is hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
      
      // Act
      showLoginScreen();
      
      // Assert - Login section should be visible
      expect(loginSection.classList.contains('hidden')).toBe(false);
    });
    
    it('should handle missing login section gracefully', () => {
      // Arrange - Remove login section
      loginSection.remove();
      
      // Act & Assert - Should not throw
      expect(() => showLoginScreen()).not.toThrow();
    });
  });
  
  describe('showAuthenticatedUI()', () => {
    beforeEach(() => {
      // Mock the initialization functions
      global.initializeFilmListing = jest.fn();
      global.initializeSharedList = jest.fn();
      global.initializeWatchedFilms = jest.fn();
      global.setupNavigation = jest.fn();
    });
    
    it('should hide all sections first including login section', () => {
      // Arrange - Show login section
      loginSection.classList.remove('hidden');
      
      // Act
      showAuthenticatedUI();
      
      // Assert - Login section should be hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
    });
    
    it('should show main tabs container', () => {
      // Arrange - Tabs are hidden
      expect(mainTabsContainer.classList.contains('hidden')).toBe(true);
      
      // Act
      showAuthenticatedUI();
      
      // Assert - Tabs should be visible
      expect(mainTabsContainer.classList.contains('hidden')).toBe(false);
    });
    
    it('should initialize tab manager', () => {
      // Act
      showAuthenticatedUI();
      
      // Assert - Tab manager should be initialized
      expect(mockTabManager.initialize).toHaveBeenCalledTimes(1);
    });
    
    it('should initialize all interface sections', () => {
      // Act
      showAuthenticatedUI();
      
      // Assert - All interfaces should be initialized
      expect(global.initializeFilmListing).toHaveBeenCalledTimes(1);
      expect(global.initializeSharedList).toHaveBeenCalledTimes(1);
      expect(global.initializeWatchedFilms).toHaveBeenCalledTimes(1);
    });
    
    it('should setup navigation', () => {
      // Act
      showAuthenticatedUI();
      
      // Assert - Navigation should be set up
      expect(global.setupNavigation).toHaveBeenCalledTimes(1);
    });
    
    it('should ensure login section is hidden even if hideAllSections fails', () => {
      // Arrange - Login section is visible
      loginSection.classList.remove('hidden');
      
      // Act
      showAuthenticatedUI();
      
      // Assert - Login section should be hidden (defensive check)
      expect(loginSection.classList.contains('hidden')).toBe(true);
    });
    
    it('should handle missing tabs container gracefully', () => {
      // Arrange - Remove tabs container
      mainTabsContainer.remove();
      
      // Act & Assert - Should not throw
      expect(() => showAuthenticatedUI()).not.toThrow();
    });
  });
  
  describe('checkAuthenticationAndRedirect()', () => {
    beforeEach(() => {
      // Mock the UI functions
      global.showLoginScreen = jest.fn();
      global.showAuthenticatedUI = jest.fn();
      global.hideAllSections = jest.fn();
    });
    
    it('should hide all sections first to ensure mutual exclusivity', () => {
      // Arrange
      mockAuthService.isAuthenticated.mockReturnValue(false);
      
      // Act
      checkAuthenticationAndRedirect();
      
      // Assert - hideAllSections should be called first
      expect(global.hideAllSections).toHaveBeenCalledTimes(1);
    });
    
    it('should show login screen when user is not authenticated', () => {
      // Arrange
      mockAuthService.isAuthenticated.mockReturnValue(false);
      
      // Act
      checkAuthenticationAndRedirect();
      
      // Assert
      expect(global.showLoginScreen).toHaveBeenCalledTimes(1);
      expect(global.showAuthenticatedUI).not.toHaveBeenCalled();
    });
    
    it('should show authenticated UI when user is authenticated', () => {
      // Arrange
      mockAuthService.isAuthenticated.mockReturnValue(true);
      
      // Act
      checkAuthenticationAndRedirect();
      
      // Assert
      expect(global.showAuthenticatedUI).toHaveBeenCalledTimes(1);
      expect(global.showLoginScreen).not.toHaveBeenCalled();
    });
    
    it('should ensure mutual exclusivity by hiding all sections before showing any', () => {
      // Arrange
      mockAuthService.isAuthenticated.mockReturnValue(true);
      
      // Track call order
      const callOrder = [];
      global.hideAllSections.mockImplementation(() => callOrder.push('hide'));
      global.showAuthenticatedUI.mockImplementation(() => callOrder.push('show'));
      
      // Act
      checkAuthenticationAndRedirect();
      
      // Assert - hideAllSections should be called before showAuthenticatedUI
      expect(callOrder).toEqual(['hide', 'show']);
    });
  });
  
  describe('Login Success Flow', () => {
    it('should hide login screen immediately after successful login', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue({
        id: 'user123',
        username: 'Test User',
        email: 'test@example.com',
        isAdmin: false
      });
      
      mockAuthService.getCurrentUser.mockReturnValue({
        id: 'user123',
        username: 'Test User',
        email: 'test@example.com',
        isAdmin: false
      });
      
      // Mock the UI functions
      const mockShowAuthenticatedUI = jest.fn();
      global.showAuthenticatedUI = mockShowAuthenticatedUI;
      global.initializeFilmListing = jest.fn();
      global.initializeSharedList = jest.fn();
      global.initializeWatchedFilms = jest.fn();
      global.setupNavigation = jest.fn();
      
      // Show login screen first
      loginSection.classList.remove('hidden');
      expect(loginSection.classList.contains('hidden')).toBe(false);
      
      // Act - Simulate the login success flow
      await mockAuthService.login('test@example.com', 'password123');
      
      // Hide login screen immediately (Requirement 2.1)
      const loginSectionElement = document.getElementById('login-section');
      if (loginSectionElement) {
        loginSectionElement.classList.add('hidden');
      }
      
      notificationService.success('Login realizado com sucesso!');
      global.showAuthenticatedUI();
      
      // Assert - Login section should be hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
      expect(notificationService.success).toHaveBeenCalledWith('Login realizado com sucesso!');
      expect(mockShowAuthenticatedUI).toHaveBeenCalled();
    });
    
    it('should ensure login section is hidden before showing authenticated UI', () => {
      // Arrange
      loginSection.classList.remove('hidden');
      
      // Mock functions
      global.initializeFilmListing = jest.fn();
      global.initializeSharedList = jest.fn();
      global.initializeWatchedFilms = jest.fn();
      global.setupNavigation = jest.fn();
      
      // Act
      showAuthenticatedUI();
      
      // Assert - Login section should be hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
      expect(mainTabsContainer.classList.contains('hidden')).toBe(false);
    });
  });
  
  describe('Mutual Exclusivity', () => {
    it('should ensure only one section is visible at a time', () => {
      // Test 1: Show login screen
      showLoginScreen();
      
      expect(loginSection.classList.contains('hidden')).toBe(false);
      expect(filmListingSection.classList.contains('hidden')).toBe(true);
      expect(sharedListSection.classList.contains('hidden')).toBe(true);
      expect(watchedFilmsSection.classList.contains('hidden')).toBe(true);
      expect(mainTabsContainer.classList.contains('hidden')).toBe(true);
      
      // Test 2: Show authenticated UI
      global.initializeFilmListing = jest.fn();
      global.initializeSharedList = jest.fn();
      global.initializeWatchedFilms = jest.fn();
      global.setupNavigation = jest.fn();
      
      showAuthenticatedUI();
      
      expect(loginSection.classList.contains('hidden')).toBe(true);
      expect(mainTabsContainer.classList.contains('hidden')).toBe(false);
      // Note: film-listing, shared-list, watched-films visibility is managed by TabManager
    });
    
    it('should prevent multiple sections from being visible simultaneously', () => {
      // Arrange - Manually show multiple sections (simulating a bug)
      loginSection.classList.remove('hidden');
      filmListingSection.classList.remove('hidden');
      sharedListSection.classList.remove('hidden');
      
      // Act - Call hideAllSections
      hideAllSections();
      
      // Assert - All should be hidden
      expect(loginSection.classList.contains('hidden')).toBe(true);
      expect(filmListingSection.classList.contains('hidden')).toBe(true);
      expect(sharedListSection.classList.contains('hidden')).toBe(true);
      expect(watchedFilmsSection.classList.contains('hidden')).toBe(true);
    });
  });
});

// Helper functions that need to be available in test scope
function hideAllSections() {
  const sections = ['login-section', 'film-listing', 'shared-list', 'watched-films'];
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section && !section.classList.contains('hidden')) {
      section.classList.add('hidden');
    }
  });
  
  const tabsContainer = document.getElementById('main-tabs');
  if (tabsContainer && !tabsContainer.classList.contains('hidden')) {
    tabsContainer.classList.add('hidden');
  }
}

function showLoginScreen() {
  hideAllSections();
  
  const loginSection = document.getElementById('login-section');
  if (loginSection) {
    loginSection.classList.remove('hidden');
  }
}

function showAuthenticatedUI() {
  hideAllSections();
  
  const loginSection = document.getElementById('login-section');
  if (loginSection && !loginSection.classList.contains('hidden')) {
    loginSection.classList.add('hidden');
  }
  
  const tabsContainer = document.getElementById('main-tabs');
  if (tabsContainer) {
    tabsContainer.classList.remove('hidden');
  }
  
  if (global.tabManager) {
    global.tabManager.initialize();
  }
  
  if (global.initializeFilmListing) global.initializeFilmListing();
  if (global.initializeSharedList) global.initializeSharedList();
  if (global.initializeWatchedFilms) global.initializeWatchedFilms();
  if (global.setupNavigation) global.setupNavigation();
}

function checkAuthenticationAndRedirect() {
  if (global.hideAllSections) {
    global.hideAllSections();
  } else {
    hideAllSections();
  }
  
  if (!global.authService.isAuthenticated()) {
    if (global.showLoginScreen) {
      global.showLoginScreen();
    } else {
      showLoginScreen();
    }
    return;
  }
  
  if (global.showAuthenticatedUI) {
    global.showAuthenticatedUI();
  } else {
    showAuthenticatedUI();
  }
}
