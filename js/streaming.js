/**
 * StreamingService - Manages streaming service availability and filtering
 * Provides streaming service badges and filtering functionality
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.3
 */

class StreamingService {
  constructor() {
    // Mapping of streaming services with visual properties
    // Requirements: 10.1, 10.2
    this.services = {
      netflix: { 
        name: 'Netflix', 
        icon: '🎬', 
        color: '#E50914',
        url: 'https://www.netflix.com'
      },
      prime: { 
        name: 'Prime Video', 
        icon: '📺', 
        color: '#00A8E1',
        url: 'https://www.primevideo.com'
      },
      disney: { 
        name: 'Disney+', 
        icon: '🏰', 
        color: '#113CCF',
        url: 'https://www.disneyplus.com'
      },
      hbo: { 
        name: 'HBO Max', 
        icon: '🎭', 
        color: '#B026FF',
        url: 'https://www.max.com'
      },
      apple: { 
        name: 'Apple TV+', 
        icon: '🍎', 
        color: '#000000',
        url: 'https://tv.apple.com'
      },
      paramount: {
        name: 'Paramount+',
        icon: '⛰️',
        color: '#0064FF',
        url: 'https://www.paramountplus.com'
      },
      star: {
        name: 'Star+',
        icon: '⭐',
        color: '#FFD700',
        url: 'https://www.starplus.com'
      }
    };
  }
  
  /**
   * Get streaming availability for a film
   * This is a mock implementation - in production, integrate with JustWatch API or similar
   * @param {number} filmId - TMDB film ID
   * @returns {Promise<Array>} Array of available streaming service keys
   * Requirements: 10.1
   */
  async getAvailability(filmId) {
    // Mock implementation - randomly assign 0-3 streaming services
    // In production, this would call an external API like JustWatch
    
    // Use filmId as seed for consistent results per film
    const seed = filmId % 100;
    const serviceKeys = Object.keys(this.services);
    const availableServices = [];
    
    // Randomly select services based on seed
    if (seed % 7 === 0) availableServices.push('netflix');
    if (seed % 5 === 0) availableServices.push('prime');
    if (seed % 11 === 0) availableServices.push('disney');
    if (seed % 13 === 0) availableServices.push('hbo');
    if (seed % 17 === 0) availableServices.push('apple');
    if (seed % 19 === 0) availableServices.push('paramount');
    if (seed % 23 === 0) availableServices.push('star');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return availableServices;
  }
  
  /**
   * Create streaming badges HTML
   * @param {Array} services - Array of service keys
   * @returns {string} HTML string with badges
   * Requirements: 10.2, 10.3, 10.4
   */
  createBadges(services) {
    // Handle no services available (Requirement 10.3)
    if (!services || services.length === 0) {
      return '<span class="streaming-unavailable">Informação não disponível</span>';
    }
    
    // Create badges for each service (Requirements 10.2, 10.4)
    return services.map(serviceKey => {
      const service = this.services[serviceKey];
      if (!service) return '';
      
      return `
        <a href="${this.escapeHtmlAttr(service.url)}" 
           target="_blank" 
           rel="noopener noreferrer"
           class="streaming-badge" 
           style="background-color: ${this.escapeHtmlAttr(service.color)}" 
           title="Assistir em ${this.escapeHtmlAttr(service.name)}"
           aria-label="Assistir ${this.escapeHtmlAttr(service.name)}">
          <span class="streaming-icon">${service.icon}</span>
          <span class="streaming-name">${this.escapeHtml(service.name)}</span>
        </a>
      `;
    }).join('');
  }
  
  /**
   * Get all available streaming service options for filter dropdown
   * @returns {Array} Array of service objects with key and name
   */
  getAllServices() {
    return Object.entries(this.services).map(([key, service]) => ({
      key,
      name: service.name,
      icon: service.icon
    }));
  }
  
  /**
   * Filter films by streaming service
   * @param {Array} films - Array of film objects
   * @param {string} serviceKey - Service key to filter by
   * @returns {Array} Filtered films
   * Requirements: 11.3
   */
  filterByService(films, serviceKey) {
    if (!serviceKey) return films;
    
    return films.filter(film => {
      // Check if film has streaming data
      if (!film.streamingServices || !Array.isArray(film.streamingServices)) {
        return false;
      }
      
      // Check if the service is in the film's streaming services
      return film.streamingServices.includes(serviceKey);
    });
  }
  
  /**
   * Escape HTML attribute values
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtmlAttr(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  /**
   * Escape HTML text content
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StreamingService;
}
