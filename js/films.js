/**
 * FilmService - TMDB API integration
 * Handles fetching film data from The Movie Database API
 * Requirements: 3.1, 3.4, 3.5
 */

class FilmService {
  constructor() {
    this.baseUrl = CONFIG.tmdb.baseUrl;
    this.imageBaseUrl = CONFIG.tmdb.imageBaseUrl;
    this.readAccessToken = CONFIG.tmdb.readAccessToken;
    
    // In-memory cache for API responses
    this.cache = new Map();
    this.cacheExpiration = CONFIG.app.cacheExpiration || 300000; // 5 minutes default
    
    // TMDB Genre ID to Name mapping
    // Source: https://developers.themoviedb.org/3/genres/get-movie-list
    this.genreMap = {
      28: 'Ação',
      12: 'Aventura',
      16: 'Animação',
      35: 'Comédia',
      80: 'Crime',
      99: 'Documentário',
      18: 'Drama',
      10751: 'Família',
      14: 'Fantasia',
      36: 'História',
      27: 'Terror',
      10402: 'Música',
      9648: 'Mistério',
      10749: 'Romance',
      878: 'Ficção Científica',
      10770: 'Cinema TV',
      53: 'Thriller',
      10752: 'Guerra',
      37: 'Faroeste'
    };
  }
  
  /**
   * Get genre name from genre ID
   * @param {number} genreId - TMDB genre ID
   * @returns {string} Genre name or 'Desconhecido' if not found
   */
  getGenreName(genreId) {
    return this.genreMap[genreId] || 'Desconhecido';
  }

  /**
   * Get genre names from array of genre IDs
   * @param {Array<number>} genreIds - Array of TMDB genre IDs
   * @returns {Array<string>} Array of genre names
   */
  getGenreNames(genreIds) {
    if (!Array.isArray(genreIds)) {
      return [];
    }
    return genreIds.map(id => this.getGenreName(id));
  }

  /**
   * Get cached data if available and not expired
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheExpiration) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Make authenticated request to TMDB API
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response data
   * @throws {Error} On network or API errors
   */
  async makeRequest(endpoint, params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams(params);
      const url = `${this.baseUrl}${endpoint}?${queryParams}`;

      // Make request with Bearer token authentication
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.readAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Resource not found');
        } else if (response.status === 500) {
          throw new Error('TMDB API server error');
        } else if (response.status === 401) {
          throw new Error('Invalid API credentials');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded');
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      // Handle network errors
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to TMDB API');
      }
      throw error;
    }
  }

  /**
   * Parse TMDB film data to internal Film model
   * @param {Object} tmdbFilm - Raw film data from TMDB API
   * @returns {Object} Parsed Film object
   */
  parseFilm(tmdbFilm) {
    // Handle genres: prefer genres array with names, otherwise map genre_ids to names
    let genres = [];
    if (tmdbFilm.genres && Array.isArray(tmdbFilm.genres)) {
      genres = tmdbFilm.genres.map(g => g.name);
    } else if (tmdbFilm.genre_ids && Array.isArray(tmdbFilm.genre_ids)) {
      genres = this.getGenreNames(tmdbFilm.genre_ids);
    }

    // Extract overview
    const overview = tmdbFilm.overview || '';

    return {
      id: tmdbFilm.id,
      title: tmdbFilm.title || tmdbFilm.original_title || 'Unknown Title',
      poster: tmdbFilm.poster_path 
        ? `${this.imageBaseUrl}${tmdbFilm.poster_path}` 
        : null,
      rating: tmdbFilm.vote_average || 0,
      genres: genres,
      year: tmdbFilm.release_date 
        ? new Date(tmdbFilm.release_date).getFullYear() 
        : null,
      overview: overview,
      tmdbUrl: `https://www.themoviedb.org/movie/${tmdbFilm.id}`
    };
  }

  /**
   * Search films by title
   * @param {string} query - Search query
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} Object with films array and totalPages
   */
  async searchFilms(query, page = 1) {
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty');
    }

    const cacheKey = `search:${query.trim().toLowerCase()}:${page}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.makeRequest('/search/movie', {
      query: query.trim(),
      language: 'pt-BR',
      include_adult: false,
      page: page
    });

    const result = {
      films: data.results.map(film => this.parseFilm(film)),
      totalPages: data.total_pages || 1
    };
    
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get detailed information about a specific film
   * @param {number} filmId - TMDB film ID
   * @returns {Promise<Object>} Film object with full details
   */
  async getFilmDetails(filmId) {
    if (!filmId || typeof filmId !== 'number') {
      throw new Error('Valid film ID is required');
    }

    const cacheKey = `details:${filmId}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.makeRequest(`/movie/${filmId}`, {
      language: 'pt-BR'
    });

    const film = this.parseFilm(data);
    this.setCache(cacheKey, film);
    return film;
  }

  /**
   * Get popular films
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} Object with films array and totalPages
   */
  async getPopularFilms(page = 1) {
    const cacheKey = `popular:${page}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.makeRequest('/movie/popular', {
      language: 'pt-BR',
      page: page
    });

    const result = {
      films: data.results.map(film => this.parseFilm(film)),
      totalPages: data.total_pages || 1
    };
    
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get trending films for the week
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} Object with films array and totalPages
   */
  async getTrendingFilms(page = 1) {
    const cacheKey = `trending:week:${page}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.makeRequest('/trending/movie/week', {
      language: 'pt-BR',
      page: page
    });

    const result = {
      films: data.results.map(film => this.parseFilm(film)),
      totalPages: data.total_pages || 1
    };
    
    this.setCache(cacheKey, result);
    return result;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilmService;
}
