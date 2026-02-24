/**
 * UserService - User management operations
 * Handles CRUD operations for users
 * Requirements: 1.2, 1.3, 1.4
 */

class UserService {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.USERS_KEY = 'letterboxd_users';
  }

  /**
   * Get all users from storage
   * @returns {Array} Array of user objects
   */
  getAllUsers() {
    const users = this.storageManager.load(this.USERS_KEY);
    return users || [];
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User object or null if not found
   */
  getUserById(userId) {
    const users = this.getAllUsers();
    return users.find(u => u.id === userId) || null;
  }

  /**
   * Validate user data
   * @private
   * @param {string} username - Username to validate
   * @param {string} passwordHash - Password hash to validate
   * @throws {Error} If validation fails
   */
  _validateUserData(username, passwordHash) {
    if (!username || typeof username !== 'string' || username.length === 0) {
      throw new Error('Username is required and must be a non-empty string');
    }
    
    if (!passwordHash || typeof passwordHash !== 'string' || passwordHash.length === 0) {
      throw new Error('Password hash is required and must be a non-empty string');
    }
  }

  /**
   * Create a new user
   * @param {string} username - Username
   * @param {string} passwordHash - Hashed password
   * @param {boolean} isAdmin - Admin flag
   * @returns {Object} Created user object
   * @throws {Error} If validation fails or username already exists
   */
  createUser(username, passwordHash, isAdmin = false) {
    // Validate input data
    this._validateUserData(username, passwordHash);
    
    const users = this.getAllUsers();
    
    // Check for duplicate username
    if (users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    
    const user = {
      id: this._generateId(),
      username: username,
      passwordHash,
      isAdmin: Boolean(isAdmin),
      createdAt: Date.now()
    };
    
    users.push(user);
    this.storageManager.save(this.USERS_KEY, users);
    
    return user;
  }

  /**
   * Update an existing user
   * @param {string} userId - User ID to update
   * @param {Object} updates - Object containing fields to update
   * @param {string} [updates.username] - New username
   * @param {string} [updates.passwordHash] - New password hash
   * @param {boolean} [updates.isAdmin] - New admin status
   * @returns {Object} Updated user object
   * @throws {Error} If user not found or validation fails
   */
  updateUser(userId, updates) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates object is required');
    }
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const user = users[userIndex];
    
    // Validate username if being updated
    if (updates.username !== undefined) {
      if (!updates.username || typeof updates.username !== 'string' || updates.username.length === 0) {
        throw new Error('Username must be a non-empty string');
      }
      
      // Check for duplicate username (excluding current user)
      const duplicateUser = users.find(u => u.username === updates.username && u.id !== userId);
      if (duplicateUser) {
        throw new Error('Username already exists');
      }
      
      user.username = updates.username;
    }
    
    // Validate password hash if being updated
    if (updates.passwordHash !== undefined) {
      if (!updates.passwordHash || typeof updates.passwordHash !== 'string' || updates.passwordHash.length === 0) {
        throw new Error('Password hash must be a non-empty string');
      }
      
      user.passwordHash = updates.passwordHash;
    }
    
    // Update admin status if provided
    if (updates.isAdmin !== undefined) {
      user.isAdmin = Boolean(updates.isAdmin);
    }
    
    users[userIndex] = user;
    this.storageManager.save(this.USERS_KEY, users);
    
    return user;
  }

  /**
   * Delete a user
   * @param {string} userId - User ID to delete
   * @returns {boolean} True if user was deleted
   * @throws {Error} If user not found
   */
  deleteUser(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users.splice(userIndex, 1);
    this.storageManager.save(this.USERS_KEY, users);
    
    return true;
  }

  /**
   * Generate a unique ID
   * @private
   * @returns {string} Unique ID
   */
  _generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserService;
}
