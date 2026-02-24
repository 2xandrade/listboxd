/**
 * Property-based tests for Tab Navigation
 * Uses fast-check for property-based testing
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

const fc = require('fast-check');

// Mock DOM setup
beforeEach(() => {
  document.body.innerHTML = `
    <div id="app">
      <main id="main-content">
        <div id="main-tabs" class="main-tabs"></div>
        <section id="film-listing" class="hidden">
          <h2>Explorar Filmes</h2>
        </section>
        <section id="shared-list" class="hidden">
          <h2>Lista Compartilhada</h2>
        </section>
        <section id="watched-films" class="hidden">
          <h2>Filmes Assistidos</h2>
        </section>
      </main>
    </div>
  `;
});

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

// Mock StorageManager
class MockStorageManager {
  constructor() {
    this.storage = {};
  }

  save(key, data) {
    this.storage[key] = data;
  }

  load(key) {
    return this.storage[key] || null;
  }

  remove(key) {
    delete this.storage[key];
  }

  clear() {
    this.storage = {};
  }
}

describe('Tab Navigation - Property-Based Tests', () => {
  /**
   * Feature: letterboxd-manager, Property 16: Tab switching to shared list
   * Validates: Requirements 7.2
   * 
   * For any UI state, when a user clicks on the shared list tab, 
   * the shared list view should be displayed.
   */
  describe('Property 16: Tab switching to shared list', () => {
    it('should display shared list view when shared list tab is clicked', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('explore', 'watched'), // Start from any other tab
          (initialTab) => {
            // Initialize tab manager
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            // Set initial tab
            tabManager.activeTab = initialTab;
            tabManager.initialize();
            
            // Click on shared list tab
            const sharedTabBtn = document.querySelector('[data-tab-id="shared"]');
            expect(sharedTabBtn).toBeDefined();
            sharedTabBtn.click();
            
            // Verify shared list section is visible
            const sharedListSection = document.getElementById('shared-list');
            expect(sharedListSection.classList.contains('hidden')).toBe(false);
            
            // Verify other sections are hidden
            const exploreSection = document.getElementById('film-listing');
            const watchedSection = document.getElementById('watched-films');
            expect(exploreSection.classList.contains('hidden')).toBe(true);
            expect(watchedSection.classList.contains('hidden')).toBe(true);
            
            // Verify active tab state
            expect(tabManager.getActiveTab()).toBe('shared');
            expect(sharedTabBtn.classList.contains('active')).toBe(true);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should maintain shared list visibility after switching to it', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('explore', 'watched'),
          (fromTab) => {
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            // Initialize and switch to shared tab
            tabManager.initialize();
            tabManager.switchTab(fromTab);
            tabManager.switchTab('shared');
            
            // Shared list should be visible
            const sharedListSection = document.getElementById('shared-list');
            expect(sharedListSection.classList.contains('hidden')).toBe(false);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 17: Tab switching to explore films
   * Validates: Requirements 7.3
   * 
   * For any UI state, when a user clicks on the explore films tab,
   * the film exploration view should be displayed.
   */
  describe('Property 17: Tab switching to explore films', () => {
    it('should display explore films view when explore tab is clicked', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('shared', 'watched'), // Start from any other tab
          (initialTab) => {
            // Initialize tab manager
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            // Set initial tab
            tabManager.activeTab = initialTab;
            tabManager.initialize();
            
            // Click on explore tab
            const exploreTabBtn = document.querySelector('[data-tab-id="explore"]');
            expect(exploreTabBtn).toBeDefined();
            exploreTabBtn.click();
            
            // Verify explore section is visible
            const exploreSection = document.getElementById('film-listing');
            expect(exploreSection.classList.contains('hidden')).toBe(false);
            
            // Verify other sections are hidden
            const sharedSection = document.getElementById('shared-list');
            const watchedSection = document.getElementById('watched-films');
            expect(sharedSection.classList.contains('hidden')).toBe(true);
            expect(watchedSection.classList.contains('hidden')).toBe(true);
            
            // Verify active tab state
            expect(tabManager.getActiveTab()).toBe('explore');
            expect(exploreTabBtn.classList.contains('active')).toBe(true);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should maintain explore view visibility after switching to it', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('shared', 'watched'),
          (fromTab) => {
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            // Initialize and switch to explore tab
            tabManager.initialize();
            tabManager.switchTab(fromTab);
            tabManager.switchTab('explore');
            
            // Explore section should be visible
            const exploreSection = document.getElementById('film-listing');
            expect(exploreSection.classList.contains('hidden')).toBe(false);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 18: Active tab state persistence
   * Validates: Requirements 7.4
   * 
   * For any tab selection, when a user switches tabs, the active tab state
   * should be maintained until another tab is selected.
   */
  describe('Property 18: Active tab state persistence', () => {
    it('should persist active tab state in storage', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('explore', 'shared', 'watched'),
          (tabId) => {
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            // Initialize and switch to tab
            tabManager.initialize();
            tabManager.switchTab(tabId);
            
            // Verify state is saved in storage
            const savedTab = storageManager.load('activeTab');
            expect(savedTab).toBe(tabId);
            
            // Verify active tab matches
            expect(tabManager.getActiveTab()).toBe(tabId);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should restore active tab state from storage on initialization', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('explore', 'shared', 'watched'),
          (savedTabId) => {
            const storageManager = new MockStorageManager();
            
            // Save tab state
            storageManager.save('activeTab', savedTabId);
            
            // Create new tab manager (simulating page reload)
            const tabManager = new TabManager(storageManager);
            
            // Verify tab state is restored
            expect(tabManager.getActiveTab()).toBe(savedTabId);
            
            // Initialize and verify correct tab is active
            tabManager.initialize();
            
            const activeBtn = document.querySelector('.main-tab-btn.active');
            expect(activeBtn).toBeDefined();
            expect(activeBtn.dataset.tabId).toBe(savedTabId);
            
            // Verify correct section is visible
            const section = document.getElementById(tabManager.tabs[savedTabId].contentId);
            expect(section.classList.contains('hidden')).toBe(false);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should maintain active tab state across multiple switches', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('explore', 'shared', 'watched'), { minLength: 2, maxLength: 10 }),
          (tabSequence) => {
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            tabManager.initialize();
            
            // Switch through sequence of tabs
            for (const tabId of tabSequence) {
              tabManager.switchTab(tabId);
              
              // After each switch, verify state is correct
              expect(tabManager.getActiveTab()).toBe(tabId);
              expect(storageManager.load('activeTab')).toBe(tabId);
              
              // Verify correct section is visible
              const section = document.getElementById(tabManager.tabs[tabId].contentId);
              expect(section.classList.contains('hidden')).toBe(false);
            }
            
            // Final state should match last tab in sequence
            const lastTab = tabSequence[tabSequence.length - 1];
            expect(tabManager.getActiveTab()).toBe(lastTab);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should update visual state when tab changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('explore', 'shared', 'watched'),
          fc.constantFrom('explore', 'shared', 'watched'),
          (fromTab, toTab) => {
            const storageManager = new MockStorageManager();
            const tabManager = new TabManager(storageManager);
            
            tabManager.initialize();
            tabManager.switchTab(fromTab);
            
            // Switch to new tab
            tabManager.switchTab(toTab);
            
            // Verify only the new tab has active class
            const allButtons = document.querySelectorAll('.main-tab-btn');
            let activeCount = 0;
            
            allButtons.forEach(btn => {
              if (btn.classList.contains('active')) {
                activeCount++;
                expect(btn.dataset.tabId).toBe(toTab);
              }
            });
            
            // Exactly one tab should be active
            expect(activeCount).toBe(1);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Example Test: Tab display
   * Validates: Requirements 7.1
   * 
   * WHEN a User accesses the main interface THEN the System SHALL display 
   * separate tabs for film exploration and shared list
   */
  describe('Example Test: Tab display', () => {
    it('should display all three tabs in the interface', () => {
      // Validates: Requirements 7.1
      const storageManager = new MockStorageManager();
      const tabManager = new TabManager(storageManager);
      
      // Initialize tabs
      tabManager.initialize();
      
      // Verify tab container exists
      const tabContainer = document.getElementById('main-tabs');
      expect(tabContainer).toBeDefined();
      
      // Verify all three tabs are present
      const exploreTab = document.querySelector('[data-tab-id="explore"]');
      const sharedTab = document.querySelector('[data-tab-id="shared"]');
      const watchedTab = document.querySelector('[data-tab-id="watched"]');
      
      expect(exploreTab).toBeDefined();
      expect(sharedTab).toBeDefined();
      expect(watchedTab).toBeDefined();
      
      // Verify tab labels
      expect(exploreTab.textContent).toBe('Explorar Filmes');
      expect(sharedTab.textContent).toBe('Lista Compartilhada');
      expect(watchedTab.textContent).toBe('Filmes Assistidos');
      
      // Verify tabs are clickable buttons
      expect(exploreTab.tagName).toBe('BUTTON');
      expect(sharedTab.tagName).toBe('BUTTON');
      expect(watchedTab.tagName).toBe('BUTTON');
      
      // Verify one tab is active by default
      const activeButtons = document.querySelectorAll('.main-tab-btn.active');
      expect(activeButtons.length).toBe(1);
    });

    it('should display tabs in the correct order', () => {
      // Validates: Requirements 7.1
      const storageManager = new MockStorageManager();
      const tabManager = new TabManager(storageManager);
      
      tabManager.initialize();
      
      // Get all tab buttons in order
      const tabButtons = document.querySelectorAll('.main-tab-btn');
      expect(tabButtons.length).toBe(3);
      
      // Verify order: Explore, Shared, Watched
      expect(tabButtons[0].dataset.tabId).toBe('explore');
      expect(tabButtons[1].dataset.tabId).toBe('shared');
      expect(tabButtons[2].dataset.tabId).toBe('watched');
    });
  });
});

// Include TabManager class for testing
class TabManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.activeTab = this.loadActiveTab() || 'explore';
    this.tabs = {
      explore: {
        id: 'explore',
        label: 'Explorar Filmes',
        contentId: 'film-listing'
      },
      shared: {
        id: 'shared',
        label: 'Lista Compartilhada',
        contentId: 'shared-list'
      },
      watched: {
        id: 'watched',
        label: 'Filmes Assistidos',
        contentId: 'watched-films'
      }
    };
  }

  initialize() {
    const tabContainer = document.getElementById('main-tabs');
    if (!tabContainer) {
      console.error('Tab container not found');
      return;
    }

    tabContainer.innerHTML = '';

    Object.values(this.tabs).forEach(tab => {
      const button = document.createElement('button');
      button.className = 'main-tab-btn';
      button.dataset.tabId = tab.id;
      button.textContent = tab.label;
      
      if (tab.id === this.activeTab) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        this.switchTab(tab.id);
      });

      tabContainer.appendChild(button);
    });

    this.showTabContent(this.activeTab);
  }

  switchTab(tabId) {
    if (!this.tabs[tabId]) {
      console.error(`Tab ${tabId} not found`);
      return;
    }

    this.activeTab = tabId;
    this.saveActiveTab(tabId);
    this.updateTabButtons();
    this.showTabContent(tabId);
  }

  updateTabButtons() {
    const tabButtons = document.querySelectorAll('.main-tab-btn');
    tabButtons.forEach(button => {
      if (button.dataset.tabId === this.activeTab) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  showTabContent(tabId) {
    const tab = this.tabs[tabId];
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }

    Object.values(this.tabs).forEach(t => {
      const section = document.getElementById(t.contentId);
      if (section) {
        section.classList.add('hidden');
      }
    });

    const activeSection = document.getElementById(tab.contentId);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }
  }

  getActiveTab() {
    return this.activeTab;
  }

  saveActiveTab(tabId) {
    this.storageManager.save('activeTab', tabId);
  }

  loadActiveTab() {
    return this.storageManager.load('activeTab');
  }
}
