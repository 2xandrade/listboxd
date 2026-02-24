/**
 * Tab Navigation Module
 * Manages navigation between different tabs in the main interface
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

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

  /**
   * Initialize tab navigation
   * Creates tab buttons and sets up event listeners
   */
  initialize() {
    const tabContainer = document.getElementById('main-tabs');
    if (!tabContainer) {
      console.error('Tab container not found');
      return;
    }

    // Clear existing tabs
    tabContainer.innerHTML = '';

    // Create tab buttons
    Object.values(this.tabs).forEach(tab => {
      const button = document.createElement('button');
      button.className = 'main-tab-btn';
      button.dataset.tabId = tab.id;
      button.textContent = tab.label;
      
      // Set active class if this is the active tab
      if (tab.id === this.activeTab) {
        button.classList.add('active');
      }

      // Add click handler
      button.addEventListener('click', () => {
        this.switchTab(tab.id);
      });

      tabContainer.appendChild(button);
    });

    // Show the active tab content
    this.showTabContent(this.activeTab);
  }

  /**
   * Switch to a different tab
   * @param {string} tabId - ID of the tab to switch to
   */
  switchTab(tabId) {
    if (!this.tabs[tabId]) {
      console.error(`Tab ${tabId} not found`);
      return;
    }

    // Update active tab
    this.activeTab = tabId;

    // Save active tab state
    this.saveActiveTab(tabId);

    // Update tab button states
    this.updateTabButtons();

    // Show tab content
    this.showTabContent(tabId);
  }

  /**
   * Update tab button visual states
   */
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

  /**
   * Show content for the specified tab
   * @param {string} tabId - ID of the tab to show
   */
  showTabContent(tabId) {
    const tab = this.tabs[tabId];
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }

    // Hide all tab content sections
    Object.values(this.tabs).forEach(t => {
      const section = document.getElementById(t.contentId);
      if (section) {
        section.classList.add('hidden');
      }
    });

    // Show the selected tab content
    const activeSection = document.getElementById(tab.contentId);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }
  }

  /**
   * Get the currently active tab ID
   * @returns {string} Active tab ID
   */
  getActiveTab() {
    return this.activeTab;
  }

  /**
   * Save active tab state to storage
   * @param {string} tabId - Tab ID to save
   */
  saveActiveTab(tabId) {
    this.storageManager.save('activeTab', tabId);
  }

  /**
   * Load active tab state from storage
   * @returns {string|null} Saved tab ID or null
   */
  loadActiveTab() {
    return this.storageManager.load('activeTab');
  }
}
