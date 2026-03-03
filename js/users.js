/**
 * UserService - User management operations
 * Handles user operations via Google Sheets API
 * Requirements: 4.1, 4.2, 4.3
 */

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
      console.error('Error fetching user:', error);
      return null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserService;
}
