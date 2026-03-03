/**
 * FilterChips - Visual chip component for displaying active filters
 * Provides visual feedback for applied filters with remove functionality
 * Requirements: 11.1
 */

class FilterChips {
  /**
   * Create a FilterChips instance
   * @param {HTMLElement} container - Container element for chips
   */
  constructor(container) {
    this.container = container;
    this.activeFilters = new Map();
  }
  
  /**
   * Add a filter chip
   * @param {string} key - Unique filter key
   * @param {string} label - Display label for the chip
   * @param {Function} onRemove - Callback function when chip is removed
   * Requirements: 11.1
   */
  addChip(key, label, onRemove) {
    // Remove existing chip with same key if it exists (synchronously)
    if (this.activeFilters.has(key)) {
      const filterData = this.activeFilters.get(key);
      if (filterData) {
        filterData.chip.remove();
        this.activeFilters.delete(key);
      }
    }
    
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.dataset.filterKey = key;
    chip.innerHTML = `
      <span class="filter-chip-label">${this.escapeHtml(label)}</span>
      <button class="filter-chip-remove" aria-label="Remover filtro ${this.escapeHtml(label)}">×</button>
    `;
    
    const removeBtn = chip.querySelector('.filter-chip-remove');
    removeBtn.addEventListener('click', () => {
      this.removeChip(key);
      if (onRemove) {
        onRemove(key);
      }
    });
    
    this.activeFilters.set(key, { chip, onRemove });
    this.container.appendChild(chip);
    this.updateVisibility();
    
    // Trigger animation
    requestAnimationFrame(() => {
      chip.classList.add('filter-chip-visible');
    });
  }
  
  /**
   * Remove a filter chip
   * @param {string} key - Filter key to remove
   * Requirements: 11.1
   */
  removeChip(key) {
    const filterData = this.activeFilters.get(key);
    if (filterData) {
      const { chip } = filterData;
      
      // Animate out
      chip.classList.add('filter-chip-removing');
      
      // Remove after animation completes
      setTimeout(() => {
        chip.remove();
        this.activeFilters.delete(key);
        this.updateVisibility();
      }, 200);
    }
  }
  
  /**
   * Clear all filter chips
   * Requirements: 11.1
   */
  clearAll() {
    // Animate all chips out
    this.activeFilters.forEach((filterData) => {
      filterData.chip.classList.add('filter-chip-removing');
    });
    
    // Clear after animation
    setTimeout(() => {
      this.activeFilters.forEach((filterData) => {
        filterData.chip.remove();
      });
      this.activeFilters.clear();
      this.updateVisibility();
    }, 200);
  }
  
  /**
   * Update container visibility based on active chips
   * Requirements: 11.1
   */
  updateVisibility() {
    if (this.activeFilters.size > 0) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }
  
  /**
   * Check if a chip exists
   * @param {string} key - Filter key to check
   * @returns {boolean} True if chip exists
   */
  hasChip(key) {
    return this.activeFilters.has(key);
  }
  
  /**
   * Get count of active chips
   * @returns {number} Number of active chips
   */
  getChipCount() {
    return this.activeFilters.size;
  }
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterChips;
}
