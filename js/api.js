/**
 * Google Sheets API Client (Apps Script Web App)
 * Encapsulates HTTP calls for users, shared lists, and watched movies.
 */
class GoogleSheetsApi {
  /**
   * @param {string} baseUrl - Apps Script Web App URL
   */
  constructor(baseUrl) {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error('GoogleSheetsApi requires a valid base URL');
    }
    this.baseUrl = baseUrl;
  }

  /**
   * Register a new user.
   * @param {{nome: string, email: string, senha: string}} payload
   * @returns {Promise<Object>}
   */
  async registerUser(payload) {
    return this._post({
      action: 'registerUser',
      ...payload
    });
  }

  /**
   * Authenticate a user.
   * @param {{email: string, senha: string}} payload
   * @returns {Promise<Object>}
   */
  async login(payload) {
    return this._post({
      action: 'login',
      ...payload
    });
  }

  /**
   * Create a shared list.
   * @param {{id_usuario_dono: string, titulo: string, descricao?: string}} payload
   * @returns {Promise<Object>}
   */
  async createList(payload) {
    return this._post({
      action: 'createList',
      ...payload
    });
  }

  /**
   * Share a list with another user.
   * @param {{id_lista: string, id_usuario_solicitante: string, id_usuario_compartilhar: string}} payload
   * @returns {Promise<Object>}
   */
  async shareList(payload) {
    return this._post({
      action: 'shareList',
      ...payload
    });
  }

  /**
   * Add watched movie entry.
   * @param {{id_lista: string, id_usuario: string, titulo_filme: string, ano?: string|number, nota?: string|number, assistido_em?: string}} payload
   * @returns {Promise<Object>}
   */
  async addWatchedMovie(payload) {
    return this._post({
      action: 'addWatchedMovie',
      ...payload
    });
  }

  /**
   * Get all lists visible to a user (owned + shared).
   * @param {string} idUsuario
   * @returns {Promise<Object>}
   */
  async getListsByUser(idUsuario) {
    return this._get({
      action: 'getListsByUser',
      id_usuario: idUsuario
    });
  }

  /**
   * Optional helper - fetch user by email.
   * @param {string} email
   * @returns {Promise<Object>}
   */
  async getUserByEmail(email) {
    return this._get({
      action: 'getUserByEmail',
      email
    });
  }

  /**
   * Optional helper - fetch movies from a list.
   * @param {{id_lista: string, id_usuario: string}} params
   * @returns {Promise<Object>}
   */
  async getMoviesByList(params) {
    return this._get({
      action: 'getMoviesByList',
      ...params
    });
  }

  async _get(params) {
    const url = new URL(this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), { method: 'GET' });
    return this._parseResponse(response);
  }

  async _post(body) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return this._parseResponse(response);
  }

  async _parseResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('Invalid JSON response from Apps Script');
    }

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      throw new Error(`HTTP ${response.status}: ${statusText}`);
    }

    if (!data || data.ok !== true) {
      const message = data && data.error ? data.error : 'API request failed';
      throw new Error(message);
    }

    return data;
  }
}

// Default instance for your published Apps Script URL.
const googleSheetsApi = new GoogleSheetsApi(
  'https://script.google.com/macros/s/AKfycbzBx4I34lxh-WMpT5ITya_0g-sP3KzFjlKtSMQhDfJ36whPAKw2ZjXN531pKpl7xi78/exec'
);

// Export for tests/node usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GoogleSheetsApi,
    googleSheetsApi
  };
}

// Expose on browser window for app usage
if (typeof window !== 'undefined') {
  window.GoogleSheetsApi = GoogleSheetsApi;
  window.googleSheetsApi = googleSheetsApi;
}
