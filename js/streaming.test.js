/**
 * Tests for StreamingService
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.3
 */

const StreamingService = require('./streaming.js');

describe('StreamingService', () => {
  let streamingService;

  beforeEach(() => {
    streamingService = new StreamingService();
  });

  describe('Service Configuration', () => {
    test('should have predefined streaming services', () => {
      expect(streamingService.services).toBeDefined();
      expect(streamingService.services.netflix).toBeDefined();
      expect(streamingService.services.prime).toBeDefined();
      expect(streamingService.services.disney).toBeDefined();
      expect(streamingService.services.hbo).toBeDefined();
      expect(streamingService.services.apple).toBeDefined();
    });

    test('each service should have required properties', () => {
      Object.values(streamingService.services).forEach(service => {
        expect(service.name).toBeDefined();
        expect(service.icon).toBeDefined();
        expect(service.color).toBeDefined();
        expect(service.url).toBeDefined();
      });
    });
  });

  describe('getAvailability', () => {
    test('should return an array of service keys', async () => {
      const result = await streamingService.getAvailability(123);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should return consistent results for same film ID', async () => {
      const result1 = await streamingService.getAvailability(100);
      const result2 = await streamingService.getAvailability(100);
      expect(result1).toEqual(result2);
    });

    test('should return valid service keys', async () => {
      const result = await streamingService.getAvailability(123);
      const validKeys = Object.keys(streamingService.services);
      result.forEach(key => {
        expect(validKeys).toContain(key);
      });
    });
  });

  describe('createBadges', () => {
    test('should return unavailable message for empty array', () => {
      const result = streamingService.createBadges([]);
      expect(result).toContain('Informação não disponível');
    });

    test('should return unavailable message for null', () => {
      const result = streamingService.createBadges(null);
      expect(result).toContain('Informação não disponível');
    });

    test('should create badges for valid services', () => {
      const result = streamingService.createBadges(['netflix', 'prime']);
      expect(result).toContain('Netflix');
      expect(result).toContain('Prime Video');
      expect(result).toContain('streaming-badge');
    });

    test('should include service icons in badges', () => {
      const result = streamingService.createBadges(['netflix']);
      expect(result).toContain('🎬');
    });

    test('should create clickable links', () => {
      const result = streamingService.createBadges(['netflix']);
      expect(result).toContain('href=');
      expect(result).toContain('target="_blank"');
    });

    test('should handle invalid service keys gracefully', () => {
      const result = streamingService.createBadges(['invalid_service']);
      expect(result).toBe('');
    });
  });

  describe('getAllServices', () => {
    test('should return array of service objects', () => {
      const result = streamingService.getAllServices();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('each service object should have key, name, and icon', () => {
      const result = streamingService.getAllServices();
      result.forEach(service => {
        expect(service.key).toBeDefined();
        expect(service.name).toBeDefined();
        expect(service.icon).toBeDefined();
      });
    });
  });

  describe('filterByService', () => {
    const mockFilms = [
      { id: 1, title: 'Film 1', streamingServices: ['netflix', 'prime'] },
      { id: 2, title: 'Film 2', streamingServices: ['disney'] },
      { id: 3, title: 'Film 3', streamingServices: ['netflix'] },
      { id: 4, title: 'Film 4', streamingServices: [] },
      { id: 5, title: 'Film 5' } // No streaming data
    ];

    test('should return all films when no service key provided', () => {
      const result = streamingService.filterByService(mockFilms, null);
      expect(result).toEqual(mockFilms);
    });

    test('should filter films by service key', () => {
      const result = streamingService.filterByService(mockFilms, 'netflix');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    test('should return empty array when no films match', () => {
      const result = streamingService.filterByService(mockFilms, 'hbo');
      expect(result).toHaveLength(0);
    });

    test('should exclude films without streaming data', () => {
      const result = streamingService.filterByService(mockFilms, 'netflix');
      expect(result.every(film => film.streamingServices)).toBe(true);
    });
  });

  describe('HTML Escaping', () => {
    test('should escape HTML in attributes', () => {
      const malicious = '<script>alert("xss")</script>';
      const escaped = streamingService.escapeHtmlAttr(malicious);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;');
    });

    test('should escape HTML in content', () => {
      const malicious = '<img src=x onerror=alert(1)>';
      const escaped = streamingService.escapeHtml(malicious);
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;');
    });
  });
});
