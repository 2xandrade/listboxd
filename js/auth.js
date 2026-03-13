/**
 * AuthService - Authentication and session management
 * Handles user login, logout, session persistence, and admin privilege verification
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

// Import ErrorRecovery for error handling
const ErrorRecovery = typeof require !== 'undefined' ? require('./error-recovery.js') : window.ErrorRecovery;

// Import bcryptjs for password hashing (kept for backward compatibility with tests)
let bcrypt;
if (typeof window !== 'undefined' && window.dcodeIO?.bcrypt) {
  bcrypt = window.dcodeIO.bcrypt;
} else if (typeof window !== 'undefined' && window.bcrypt) {
  bcrypt = window.bcrypt;
} else if (typeof require !== 'undefined') {
  bcrypt = require('bcryptjs');
}

class AuthService {
  constructor(storageManager, googleSheetsApi) {
    this.storageManager = storageManager;
    this.googleSheetsApi = googleSheetsApi;
    this.SESSION_KEY = 'letterboxd_session';
    this.SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {boolean} True if password matches
   */
  verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Authenticate user with email and password via Google Sheets API
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} User object if successful
   * @throws {Error} If authentication fails
   */
  async login(email, password) {
    // Check if API is configured
    if (!this.googleSheetsApi) {
      throw new Error('API não configurada. Configure o Google Sheets API no arquivo config.js para fazer login.');
    }
    
    try {
      // Call Google Sheets API for authentication
      const response = await this.googleSheetsApi.login({
        email: email,
        senha: password
      });
      
      // Create local session with user data from API
      const session = {
        userId: response.data.id_usuario,
        username: response.data.nome,
        email: response.data.email,
        isAdmin: response.data.is_admin || false,
        loginTime: Date.now(),
        expiresAt: Date.now() + this.SESSION_TIMEOUT
      };
      
      // Save session to localStorage
      this.storageManager.save(this.SESSION_KEY, session);
      
      // Return user without sensitive data
      return {
        id: session.userId,
        username: session.username,
        email: session.email,
        isAdmin: session.isAdmin
      };
    } catch (error) {
      // Log API responses and status codes on errors (Requirement 6.2)
      ErrorRecovery.logError(error, {
        context: 'AuthService.login',
        email,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.message.includes('Invalid') || error.message.includes('credentials')) {
        throw new Error('Email ou senha inválidos.');
      } else if (error.message.includes('401')) {
        throw new Error('Credenciais inválidas.');
      } else if (error.message.includes('429')) {
        throw new Error('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else if (error.message.includes('500') || error.message.includes('503')) {
        throw new Error('Erro no servidor. Tente novamente mais tarde.');
      } else {
        throw new Error(`Falha no login: ${error.message}`);
      }
    }
  }

  /**
   * Register new user via Google Sheets API
   * @param {string} nome - User name
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} Created user object
   * @throws {Error} If registration fails
   */
  async register(nome, email, password) {
    // Check if API is configured
    if (!this.googleSheetsApi) {
      throw new Error('API não configurada. Configure o Google Sheets API no arquivo config.js para usar o cadastro.');
    }
    
    try {
      // Call Google Sheets API to register user
      const response = await this.googleSheetsApi.registerUser({
        nome: nome,
        email: email,
        senha: password
      });
      
      // Return created user data
      return {
        id: response.data.id_usuario,
        nome: response.data.nome,
        email: response.data.email,
        isAdmin: response.data.is_admin || false
      };
    } catch (error) {
      // Log API responses and status codes on errors (Requirement 6.2)
      ErrorRecovery.logError(error, {
        context: 'AuthService.register',
        nome,
        email,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.message.includes('já existe') || error.message.includes('already exists')) {
        throw new Error('Este email já está cadastrado.');
      } else if (error.message.includes('400')) {
        throw new Error('Dados inválidos. Verifique os campos e tente novamente.');
      } else if (error.message.includes('429')) {
        throw new Error('Muitas tentativas. Aguarde um momento e tente novamente.');
      } else if (error.message.includes('500') || error.message.includes('503')) {
        throw new Error('Erro no servidor. Tente novamente mais tarde.');
      } else {
        throw new Error(`Falha no registro: ${error.message}`);
      }
    }
  }

  /**
   * Log out current user
   */
  logout() {
    this.storageManager.remove(this.SESSION_KEY);
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user or null if not authenticated
   */
  getCurrentUser() {
    const session = this.storageManager.load(this.SESSION_KEY);
    
    if (!session) {
      return null;
    }
    
    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }
    
    return {
      id: session.userId,
      username: session.username,
      email: session.email,
      isAdmin: session.isAdmin
    };
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if current user has admin privileges
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user !== null && user.isAdmin === true;
  }

  /**
   * Require authentication for protected routes
   * @throws {Error} If user is not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }
  }

  /**
   * Require admin privileges
   * @throws {Error} If user is not admin
   */
  requireAdmin() {
    this.requireAuth();
    if (!this.isAdmin()) {
      throw new Error('Admin privileges required');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
