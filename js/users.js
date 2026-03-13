/**
 * UserService - User management operations
 * Handles user operations via Google Sheets API
 * Requirements: 4.1, 4.2, 4.3
 */

// Import ErrorRecovery for error handling
const ErrorRecovery = typeof require !== 'undefined' ? require('./error-recovery.js') : window.ErrorRecovery;

class UserService {
  constructor(googleSheetsApi) {
    this.googleSheetsApi = googleSheetsApi;
  }

  /**
   * Get user by email from Google Sheets
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async getUserByEmail(email) {
    try {
      const response = await this.googleSheetsApi.getUserByEmail(email);
      return response.data || null;
    } catch (error) {
      // Log API responses and status codes on errors (Requirement 6.2)
      ErrorRecovery.logError(error, {
        context: 'UserService.getUserByEmail',
        email,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      return null;
    }
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsers() {
    try {
      // Get current user to pass as admin verification
      const currentUser = JSON.parse(localStorage.getItem('letterboxd_session') || '{}');
      if (!currentUser || !currentUser.id) {
        throw new Error('Not authenticated');
      }
      
      const response = await this.googleSheetsApi.getAllUsers(currentUser.id);
      return response.data || [];
    } catch (error) {
      // Log API responses and status codes on errors (Requirement 6.2)
      ErrorRecovery.logError(error, {
        context: 'UserService.getAllUsers',
        userId: currentUser.id,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      return [];
    }
  }

  /**
   * Create a new user (admin only)
   * @param {string} username - Username
   * @param {string} passwordHash - Hashed password
   * @param {boolean} isAdmin - Whether user is admin
   * @returns {Promise<Object>} Created user object
   */
  async createUser(username, passwordHash, isAdmin = false) {
    try {
      // Use registerUser endpoint
      const response = await this.googleSheetsApi.registerUser({
        nome: username,
        email: `${username}@letterboxd.local`, // Generate email from username
        senha: passwordHash // Note: This should be the plain password, not hash
      });
      return response.data;
    } catch (error) {
      // Log API responses and status codes on errors (Requirement 6.2)
      ErrorRecovery.logError(error, {
        context: 'UserService.createUser',
        nome,
        email,
        isAdmin,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Update user (admin only)
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(userId, updates) {
    // TODO: Implement updateUser endpoint in Google Sheets API
    console.warn('updateUser not implemented yet');
    throw new Error('updateUser not implemented yet');
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    // TODO: Implement deleteUser endpoint in Google Sheets API
    console.warn('deleteUser not implemented yet');
    throw new Error('deleteUser not implemented yet');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserService;
}
