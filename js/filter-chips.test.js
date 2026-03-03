/**
 * Tests for FilterChips component
 * Requirements: 11.1
 */

const FilterChips = require('./filter-chips.js');

describe('FilterChips', () => {
  let container;
  let filterChips;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.className = 'filter-chips-container hidden';
    document.body.appendChild(container);
    
    // Create FilterChips instance
    filterChips = new FilterChips(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe('addChip', () => {
    test('should add a chip to the container', () => {
      filterChips.addChip('genre', 'Action', () => {});
      
      expect(container.children.length).toBe(1);
      expect(container.querySelector('.filter-chip')).toBeTruthy();
    });

    test('should display the correct label', () => {
      filterChips.addChip('genre', 'Action', () => {});
      
      const label = container.querySelector('.filter-chip-label');
      expect(label.textContent).toBe('Action');
    });

    test('should make container visible when chip is added', () => {
      filterChips.addChip('genre', 'Action', () => {});
      
      expect(container.classList.contains('hidden')).toBe(false);
    });

    test('should replace existing chip with same key', () => {
      filterChips.addChip('genre', 'Action', () => {});
      filterChips.addChip('genre', 'Comedy', () => {});
      
      expect(container.children.length).toBe(1);
      const label = container.querySelector('.filter-chip-label');
      expect(label.textContent).toBe('Comedy');
    });

    test('should escape HTML in labels', () => {
      filterChips.addChip('test', '<script>alert("xss")</script>', () => {});
      
      const label = container.querySelector('.filter-chip-label');
      expect(label.innerHTML).not.toContain('<script>');
      expect(label.textContent).toBe('<script>alert("xss")</script>');
    });

    test('should call onRemove callback when remove button is clicked', (done) => {
      const onRemove = jest.fn((key) => {
        expect(key).toBe('genre');
        done();
      });
      
      filterChips.addChip('genre', 'Action', onRemove);
      
      const removeBtn = container.querySelector('.filter-chip-remove');
      removeBtn.click();
      
      // Wait for animation
      setTimeout(() => {
        expect(onRemove).toHaveBeenCalledWith('genre');
      }, 250);
    });
  });

  describe('removeChip', () => {
    test('should remove a chip by key', (done) => {
      filterChips.addChip('genre', 'Action', () => {});
      
      expect(container.children.length).toBe(1);
      
      filterChips.removeChip('genre');
      
      // Wait for animation to complete
      setTimeout(() => {
        expect(container.children.length).toBe(0);
        done();
      }, 250);
    });

    test('should hide container when last chip is removed', (done) => {
      filterChips.addChip('genre', 'Action', () => {});
      
      filterChips.removeChip('genre');
      
      setTimeout(() => {
        expect(container.classList.contains('hidden')).toBe(true);
        done();
      }, 250);
    });

    test('should do nothing if chip does not exist', () => {
      filterChips.removeChip('nonexistent');
      
      expect(container.children.length).toBe(0);
    });
  });

  describe('clearAll', () => {
    test('should remove all chips', (done) => {
      filterChips.addChip('genre', 'Action', () => {});
      filterChips.addChip('name', 'Matrix', () => {});
      filterChips.addChip('random', 'Random Order', () => {});
      
      expect(container.children.length).toBe(3);
      
      filterChips.clearAll();
      
      setTimeout(() => {
        expect(container.children.length).toBe(0);
        done();
      }, 250);
    });

    test('should hide container after clearing all chips', (done) => {
      filterChips.addChip('genre', 'Action', () => {});
      filterChips.addChip('name', 'Matrix', () => {});
      
      filterChips.clearAll();
      
      setTimeout(() => {
        expect(container.classList.contains('hidden')).toBe(true);
        done();
      }, 250);
    });
  });

  describe('hasChip', () => {
    test('should return true if chip exists', () => {
      filterChips.addChip('genre', 'Action', () => {});
      
      expect(filterChips.hasChip('genre')).toBe(true);
    });

    test('should return false if chip does not exist', () => {
      expect(filterChips.hasChip('genre')).toBe(false);
    });
  });

  describe('getChipCount', () => {
    test('should return 0 when no chips exist', () => {
      expect(filterChips.getChipCount()).toBe(0);
    });

    test('should return correct count of chips', () => {
      filterChips.addChip('genre', 'Action', () => {});
      filterChips.addChip('name', 'Matrix', () => {});
      
      expect(filterChips.getChipCount()).toBe(2);
    });
  });

  describe('updateVisibility', () => {
    test('should hide container when no chips exist', () => {
      filterChips.updateVisibility();
      
      expect(container.classList.contains('hidden')).toBe(true);
    });

    test('should show container when chips exist', () => {
      filterChips.addChip('genre', 'Action', () => {});
      
      expect(container.classList.contains('hidden')).toBe(false);
    });
  });
});
