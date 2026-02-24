/**
 * AuthService - Authentication and session management
 * Handles user login, logout, session persistence, and admin privilege verification
 * Requirements: 1.5, 2.1, 2.2, 2.3, 2.4
 */

// Import bcryptjs for password hashing
let bcrypt;
if (typeof window !== 'undefined' && window.dcodeIO?.bcrypt) {
  bcrypt = window.dcodeIO.bcrypt;
} else if (typeof window !== 'undefined' && window.bcrypt) {
  bcrypt = window.bcrypt;
} else if (typeof require !== 'undefined') {
  bcrypt = require('bcryptjs');
}

class AuthService {
  constructor(storageManager, userService) {
    this.storageManager = storageManager;
    this.userService = userService;
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
   * Authenticate user with username and password
   * @param {string} username - Username
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} User object if successful
   * @throws {Error} If authentication fails
   */
  async login(username, password) {
    // Get all users
    const users = this.userService.getAllUsers();
    
    // Find user by username
    const user = users.find(u => u.username === username);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    
    // Create session
    const session = {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      loginTime: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT
    };
    
    // Save session to storage
    this.storageManager.save(this.SESSION_KEY, session);
    
    // Return user without password hash
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    };
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
