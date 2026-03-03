/**
 * Integration tests for FilterChips with FilterManager
 * Tests the synchronization between filter controls and chips
 * Requirements: 11.1
 */

// Mock DOM elements
function createMockDOM() {
  document.body.innerHTML = `
    <div id="filter-chips-container" class="filter-chips-container hidden"></div>
    <select id="genre-filter">
      <option value="">Todos os gêneros</option>
      <option value="Ação">Ação</option>
      <option value="Drama">Drama</option>
    </select>
    <input type="text" id="name-filter" />
    <button id="random-filter-btn"></button>
    <button id="clear-filters-btn"></button>
  `;
}

// Mock FilterManager
class MockFilterManager {
  constructor() {
    this.activeFilters = {
      genre: null,
      name: null,
      random: false
    };
  }
  
  setGenreFilter(genre) {
    this.activeFilters.genre = genre;
  }
  
  setNameFilter(name) {
    this.activeFilters.name = name;
  }
  
  setRandomFilter(random) {
    this.activeFilters.random = random;
  }
  
  clearAllFilters() {
    this.activeFilters = {
      genre: null,
      name: null,
      random: false
    };
  }
  
  getActiveFilters() {
    return { ...this.activeFilters };
  }
  
  hasActiveFilters() {
    return this.activeFilters.genre !== null ||
           this.activeFilters.name !== null ||
           this.activeFilters.random === true;
  }
}

describe('FilterChips Integration', () => {
  let filterChips;
  let filterManager;
  let container;
  let genreFilter;
  let nameFilter;
  let randomFilterBtn;
  let clearFiltersBtn;
  
  beforeEach(() => {
    createMockDOM();
    
    container = document.getElementById('filter-chips-container');
    genreFilter = document.getElementById('genre-filter');
    nameFilter = document.getElementById('name-filter');
    randomFilterBtn = document.getElementById('random-filter-btn');
    clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    // Load FilterChips class
    const FilterChips = require('./filter-chips.js');
    filterChips = new FilterChips(container);
    filterManager = new MockFilterManager();
  });
  
  describe('Genre Filter Integration', () => {
    test('should add chip when genre filter is applied', () => {
      // Simulate genre filter change
      genreFilter.value = 'Ação';
      filterManager.setGenreFilter('Ação');
      
      filterChips.addChip('genre', `Gênero: Ação`, (key) => {
        filterManager.setGenreFilter(null);
        genreFilter.value = '';
      });
      
      expect(filterChips.hasChip('genre')).toBe(true);
      expect(filterChips.getChipCount()).toBe(1);
      expect(container.classList.contains('hidden')).toBe(false);
    });
    
    test('should remove chip when genre filter is cleared', () => {
      // Add chip first
      filterChips.addChip('genre', `Gênero: Ação`, () => {});
      expect(filterChips.hasChip('genre')).toBe(true);
      
      // Clear filter
      genreFilter.value = '';
      filterManager.setGenreFilter(null);
      filterChips.removeChip('genre');
      
      // Wait for animation
      return new Promise(resolve => {
        setTimeout(() => {
          expect(filterChips.hasChip('genre')).toBe(false);
          resolve();
        }, 250);
      });
    });
    
    test('should sync filter when chip X button is clicked', () => {
      // Add chip with callback
      let callbackCalled = false;
      filterChips.addChip('genre', `Gênero: Drama`, (key) => {
        callbackCalled = true;
        filterManager.setGenreFilter(null);
        genreFilter.value = '';
      });
      
      // Click the remove button
      const removeBtn = container.querySelector('.filter-chip-remove');
      removeBtn.click();
      
      // Wait for animation
      return new Promise(resolve => {
        setTimeout(() => {
          expect(callbackCalled).toBe(true);
          expect(filterManager.getActiveFilters().genre).toBe(null);
          expect(genreFilter.value).toBe('');
          resolve();
        }, 250);
      });
    });
  });
  
  describe('Name Filter Integration', () => {
    test('should add chip when name filter is applied', () => {
      // Simulate name filter input
      nameFilter.value = 'Matrix';
      filterManager.setNameFilter('Matrix');
      
      filterChips.addChip('name', `Busca: "Matrix"`, (key) => {
        filterManager.setNameFilter(null);
        nameFilter.value = '';
      });
      
      expect(filterChips.hasChip('name')).toBe(true);
      expect(filterChips.getChipCount()).toBe(1);
    });
    
    test('should update chip when name filter changes', () => {
      // Add initial chip
      filterChips.addChip('name', `Busca: "Matrix"`, () => {});
      expect(filterChips.getChipCount()).toBe(1);
      
      // Update with new search
      filterChips.addChip('name', `Busca: "Inception"`, () => {});
      
      // Should still have only 1 chip (replaced)
      expect(filterChips.getChipCount()).toBe(1);
      
      // Check label updated
      const label = container.querySelector('.filter-chip-label');
      expect(label.textContent).toBe('Busca: "Inception"');
    });
  });
  
  describe('Random Filter Integration', () => {
    test('should add chip when random filter is applied', () => {
      // Simulate random filter click
      filterManager.setRandomFilter(true);
      randomFilterBtn.classList.add('active');
      
      filterChips.addChip('random', 'Ordem Aleatória', (key) => {
        filterManager.setRandomFilter(false);
        randomFilterBtn.classList.remove('active');
      });
      
      expect(filterChips.hasChip('random')).toBe(true);
      expect(randomFilterBtn.classList.contains('active')).toBe(true);
    });
    
    test('should sync when random chip is removed', () => {
      // Add chip
      filterChips.addChip('random', 'Ordem Aleatória', (key) => {
        filterManager.setRandomFilter(false);
        randomFilterBtn.classList.remove('active');
      });
      
      // Click remove button
      const removeBtn = container.querySelector('.filter-chip-remove');
      removeBtn.click();
      
      // Wait for animation
      return new Promise(resolve => {
        setTimeout(() => {
          expect(filterManager.getActiveFilters().random).toBe(false);
          expect(randomFilterBtn.classList.contains('active')).toBe(false);
          resolve();
        }, 250);
      });
    });
  });
  
  describe('Multiple Filters Integration', () => {
    test('should handle multiple active filters', () => {
      // Add multiple chips
      filterChips.addChip('genre', 'Gênero: Ação', () => {});
      filterChips.addChip('name', 'Busca: "Matrix"', () => {});
      filterChips.addChip('random', 'Ordem Aleatória', () => {});
      
      expect(filterChips.getChipCount()).toBe(3);
      expect(container.classList.contains('hidden')).toBe(false);
    });
    
    test('should clear all chips when clear button is clicked', () => {
      // Add multiple chips
      filterChips.addChip('genre', 'Gênero: Ação', () => {});
      filterChips.addChip('name', 'Busca: "Matrix"', () => {});
      filterChips.addChip('random', 'Ordem Aleatória', () => {});
      
      expect(filterChips.getChipCount()).toBe(3);
      
      // Clear all
      filterManager.clearAllFilters();
      filterChips.clearAll();
      genreFilter.value = '';
      nameFilter.value = '';
      randomFilterBtn.classList.remove('active');
      
      // Wait for animation
      return new Promise(resolve => {
        setTimeout(() => {
          expect(filterChips.getChipCount()).toBe(0);
          expect(container.classList.contains('hidden')).toBe(true);
          expect(filterManager.hasActiveFilters()).toBe(false);
          resolve();
        }, 250);
      });
    });
  });
  
  describe('Container Visibility', () => {
    test('should hide container when no chips exist', () => {
      expect(container.classList.contains('hidden')).toBe(true);
    });
    
    test('should show container when chips are added', () => {
      filterChips.addChip('genre', 'Gênero: Ação', () => {});
      expect(container.classList.contains('hidden')).toBe(false);
    });
    
    test('should hide container after all chips are removed', () => {
      // Add and remove chip
      filterChips.addChip('genre', 'Gênero: Ação', () => {});
      expect(container.classList.contains('hidden')).toBe(false);
      
      filterChips.removeChip('genre');
      
      // Wait for animation
      return new Promise(resolve => {
        setTimeout(() => {
          expect(container.classList.contains('hidden')).toBe(true);
          resolve();
        }, 250);
      });
    });
  });
});
