/**
 * Tab Navigation Module
 * Manages navigation between different tabs in the main interface
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.4
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
    
    // Touch gesture support
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50; // Minimum distance for a swipe
  }

  /**
   * Initialize tab navigation
   * Creates tab buttons and sets up event listeners
   * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
   */
  initialize() {
    const tabContainer = document.getElementById('main-tabs');
    if (!tabContainer) {
      console.error('Tab container not found');
      return;
    }

    // Clear existing tabs
    tabContainer.innerHTML = '';

    // Ensure all tab content sections are hidden initially (Requirement 13.1)
    this.hideAllTabContent();

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

    // Show only the active tab content (Requirements 13.2, 13.3)
    this.showTabContent(this.activeTab);
    
    // Setup touch gestures for mobile
    this.setupTouchGestures();
    
    // Ensure active tab is visible in scrollable container
    this.scrollToActiveTab();
  }

  /**
   * Setup touch gesture support for swiping between tabs
   * Requirements: 12.4
   */
  setupTouchGestures() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Touch start
    mainContent.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    // Touch end
    mainContent.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipeGesture();
    }, { passive: true });
  }

  /**
   * Handle swipe gesture to switch tabs
   */
  handleSwipeGesture() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    // Ignore small movements
    if (Math.abs(swipeDistance) < this.minSwipeDistance) {
      return;
    }

    const tabIds = Object.keys(this.tabs);
    const currentIndex = tabIds.indexOf(this.activeTab);

    // Swipe right - go to previous tab
    if (swipeDistance > 0 && currentIndex > 0) {
      this.switchTab(tabIds[currentIndex - 1]);
    }
    // Swipe left - go to next tab
    else if (swipeDistance < 0 && currentIndex < tabIds.length - 1) {
      this.switchTab(tabIds[currentIndex + 1]);
    }
  }

  /**
   * Scroll the tab container to make the active tab visible
   */
  scrollToActiveTab() {
    const tabContainer = document.getElementById('main-tabs');
    if (!tabContainer) return;

    const activeButton = tabContainer.querySelector('.main-tab-btn.active');
    if (!activeButton) return;

    // Scroll the active tab into view
    activeButton.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
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
    
    // Scroll to make active tab visible
    this.scrollToActiveTab();
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
   * Hide all tab content sections
   * Requirements: 13.1, 13.3
   */
  hideAllTabContent() {
    Object.values(this.tabs).forEach(tab => {
      const section = document.getElementById(tab.contentId);
      if (section) {
        section.classList.add('hidden');
      }
    });
  }

  /**
   * Show content for the specified tab
   * @param {string} tabId - ID of the tab to show
   * Requirements: 13.2, 13.3, 13.4
   */
  showTabContent(tabId) {
    const tab = this.tabs[tabId];
    if (!tab) {
      console.error(`Tab ${tabId} not found`);
      return;
    }

    // Hide all tab content sections first (Requirement 13.3)
    this.hideAllTabContent();

    // Show the selected tab content with transition (Requirement 13.4)
    const activeSection = document.getElementById(tab.contentId);
    if (activeSection) {
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        activeSection.classList.remove('hidden');
      });
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
