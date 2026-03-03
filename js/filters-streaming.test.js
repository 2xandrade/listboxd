/**
 * Tests for FilterManager streaming service integration
 * Requirements: 11.3
 */

const FilterManager = require('./filters.js');

describe('FilterManager - Streaming Service Integration', () => {
  let filterManager;
  let mockListService;

  beforeEach(() => {
    // Mock list service
    mockListService = {
      getSharedList: jest.fn(() => [
        {
          id: '1',
          film: {
            id: 1,
            title: 'Film on Netflix',
            genres: ['Action'],
            streamingServices: ['netflix']
          }
        },
        {
          id: '2',
          film: {
            id: 2,
            title: 'Film on Prime',
            genres: ['Drama'],
            streamingServices: ['prime']
          }
        },
        {
          id: '3',
          film: {
            id: 3,
            title: 'Film on Netflix and Disney',
            genres: ['Comedy'],
            streamingServices: ['netflix', 'disney']
          }
        },
        {
          id: '4',
          film: {
            id: 4,
            title: 'Film with no streaming',
            genres: ['Horror']
          }
        }
      ])
    };

    filterManager = new FilterManager(mockListService);
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('setStreamingFilter', () => {
    test('should set streaming filter', () => {
      filterManager.setStreamingFilter('netflix');
      expect(filterManager.activeFilters.streaming).toBe('netflix');
    });

    test('should clear streaming filter when null', () => {
      filterManager.setStreamingFilter('netflix');
      filterManager.setStreamingFilter(null);
      expect(filterManager.activeFilters.streaming).toBeNull();
    });

    test('should persist streaming filter to localStorage', () => {
      filterManager.setStreamingFilter('prime');
      const saved = JSON.parse(localStorage.getItem('filter_state'));
      expect(saved.streaming).toBe('prime');
    });
  });

  describe('filterByStreaming', () => {
    test('should return all entries when no service key provided', () => {
      const entries = mockListService.getSharedList();
      const result = filterManager.filterByStreaming(entries, null);
      expect(result).toEqual(entries);
    });

    test('should filter entries by streaming service', () => {
      const entries = mockListService.getSharedList();
      const result = filterManager.filterByStreaming(entries, 'netflix');
      expect(result).toHaveLength(2);
      expect(result[0].film.title).toBe('Film on Netflix');
      expect(result[1].film.title).toBe('Film on Netflix and Disney');
    });

    test('should return empty array when no entries match', () => {
      const entries = mockListService.getSharedList();
      const result = filterManager.filterByStreaming(entries, 'hbo');
      expect(result).toHaveLength(0);
    });

    test('should exclude entries without streaming data', () => {
      const entries = mockListService.getSharedList();
      const result = filterManager.filterByStreaming(entries, 'netflix');
      expect(result.every(entry => entry.film.streamingServices)).toBe(true);
    });
  });

  describe('applyFilters with streaming', () => {
    test('should apply streaming filter', () => {
      filterManager.setStreamingFilter('prime');
      const result = filterManager.applyFilters();
      expect(result).toHaveLength(1);
      expect(result[0].film.title).toBe('Film on Prime');
    });

    test('should combine streaming filter with genre filter', () => {
      filterManager.setGenreFilter('Comedy');
      filterManager.setStreamingFilter('netflix');
      const result = filterManager.applyFilters();
      expect(result).toHaveLength(1);
      expect(result[0].film.title).toBe('Film on Netflix and Disney');
    });

    test('should combine streaming filter with name filter', () => {
      filterManager.setNameFilter('Disney');
      filterManager.setStreamingFilter('netflix');
      const result = filterManager.applyFilters();
      expect(result).toHaveLength(1);
      expect(result[0].film.title).toBe('Film on Netflix and Disney');
    });
  });

  describe('clearAllFilters', () => {
    test('should clear streaming filter', () => {
      filterManager.setStreamingFilter('netflix');
      filterManager.clearAllFilters();
      expect(filterManager.activeFilters.streaming).toBeNull();
    });

    test('should clear all filters including streaming', () => {
      filterManager.setGenreFilter('Action');
      filterManager.setNameFilter('Film');
      filterManager.setStreamingFilter('netflix');
      filterManager.clearAllFilters();
      
      expect(filterManager.activeFilters.genre).toBeNull();
      expect(filterManager.activeFilters.name).toBeNull();
      expect(filterManager.activeFilters.streaming).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    test('should return true when streaming filter is active', () => {
      filterManager.setStreamingFilter('netflix');
      expect(filterManager.hasActiveFilters()).toBe(true);
    });

    test('should return false when no filters are active', () => {
      filterManager.clearAllFilters();
      expect(filterManager.hasActiveFilters()).toBe(false);
    });

    test('should return true when multiple filters including streaming are active', () => {
      filterManager.setGenreFilter('Action');
      filterManager.setStreamingFilter('netflix');
      expect(filterManager.hasActiveFilters()).toBe(true);
    });
  });

  describe('Filter State Persistence', () => {
    test('should load streaming filter from localStorage', () => {
      localStorage.setItem('filter_state', JSON.stringify({
        genre: null,
        name: null,
        streaming: 'disney',
        random: false,
        sortBy: 'dateAdded'
      }));

      const newFilterManager = new FilterManager(mockListService);
      expect(newFilterManager.activeFilters.streaming).toBe('disney');
    });

    test('should persist streaming filter changes', () => {
      filterManager.setStreamingFilter('hbo');
      const saved = JSON.parse(localStorage.getItem('filter_state'));
      expect(saved.streaming).toBe('hbo');
    });
  });
});
