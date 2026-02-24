/**
 * Property-based tests for UserService
 * Uses fast-check for property-based testing
 * Requirements: 1.2, 1.3, 1.4
 */

const fc = require('fast-check');
const UserService = require('./users.js');
const StorageManager = require('./storage.js');
const AuthService = require('./auth.js');

describe('UserService - Property-Based Tests', () => {
  let userService;
  let storageManager;
  let authService;

  // Simple alphanumeric username generator (no special characters for private site)
  const usernameArb = fc.string({ 
    minLength: 3, 
    maxLength: 20,
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''))
  });

  // Simple password generator
  const passwordArb = fc.string({ 
    minLength: 4, 
    maxLength: 30,
    unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''))
  });

  beforeEach(() => {
    // Create fresh instances before each test
    storageManager = new StorageManager();
    userService = new UserService(storageManager);
    authService = new AuthService(storageManager, userService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Feature: letterboxd-manager, Property 1: User creation persistence
   * Validates: Requirements 1.2
   * 
   * For any valid username and password combination, when an admin creates a user, 
   * that user should exist in storage and be retrievable.
   */
  describe('Property 1: User creation persistence', () => {
    it('should persist created users to storage and make them retrievable', () => {
      fc.assert(
        fc.property(
          usernameArb,
          passwordArb,
          fc.boolean(),
          (username, password, isAdmin) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Hash the password
            const passwordHash = authService.hashPassword(password);
            
            // Create user
            const createdUser = userService.createUser(username, passwordHash, isAdmin);
            
            // User should have an ID
            expect(createdUser.id).toBeDefined();
            expect(typeof createdUser.id).toBe('string');
            
            // User should have correct properties
            expect(createdUser.username).toBe(username);
            expect(createdUser.passwordHash).toBe(passwordHash);
            expect(createdUser.isAdmin).toBe(isAdmin);
            expect(createdUser.createdAt).toBeDefined();
            
            // User should be retrievable by ID
            const retrievedUser = userService.getUserById(createdUser.id);
            expect(retrievedUser).not.toBeNull();
            expect(retrievedUser.id).toBe(createdUser.id);
            expect(retrievedUser.username).toBe(username);
            expect(retrievedUser.passwordHash).toBe(passwordHash);
            expect(retrievedUser.isAdmin).toBe(isAdmin);
            
            // User should appear in getAllUsers
            const allUsers = userService.getAllUsers();
            const foundUser = allUsers.find(u => u.id === createdUser.id);
            expect(foundUser).toBeDefined();
            expect(foundUser.username).toBe(username);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should persist multiple users independently', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              username: usernameArb,
              password: passwordArb,
              isAdmin: fc.boolean()
            }),
            { minLength: 1, maxLength: 5, selector: (u) => u.username }
          ),
          (usersData) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const createdUsers = [];
            
            // Create all users
            for (const userData of usersData) {
              const passwordHash = authService.hashPassword(userData.password);
              const user = userService.createUser(userData.username, passwordHash, userData.isAdmin);
              createdUsers.push(user);
            }
            
            // All users should be retrievable
            for (const createdUser of createdUsers) {
              const retrieved = userService.getUserById(createdUser.id);
              expect(retrieved).not.toBeNull();
              expect(retrieved.id).toBe(createdUser.id);
              expect(retrieved.username).toBe(createdUser.username);
            }
            
            // getAllUsers should return all created users
            const allUsers = userService.getAllUsers();
            expect(allUsers.length).toBe(createdUsers.length);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should reject duplicate usernames', () => {
      fc.assert(
        fc.property(
          usernameArb,
          passwordArb,
          passwordArb,
          (username, password1, password2) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create first user
            const passwordHash1 = authService.hashPassword(password1);
            userService.createUser(username, passwordHash1, false);
            
            // Attempt to create second user with same username should fail
            const passwordHash2 = authService.hashPassword(password2);
            expect(() => {
              userService.createUser(username, passwordHash2, false);
            }).toThrow('Username already exists');
            
            // Only one user should exist
            const allUsers = userService.getAllUsers();
            expect(allUsers.length).toBe(1);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 2: User deletion completeness
   * Validates: Requirements 1.3
   * 
   * For any existing user, when an admin deletes that user, the user should 
   * no longer exist in storage and authentication attempts should fail.
   */
  describe('Property 2: User deletion completeness', () => {
    it('should completely remove deleted users from storage', () => {
      fc.assert(
        fc.property(
          usernameArb,
          passwordArb,
          fc.boolean(),
          (username, password, isAdmin) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create user
            const passwordHash = authService.hashPassword(password);
            const createdUser = userService.createUser(username, passwordHash, isAdmin);
            
            // Verify user exists
            expect(userService.getUserById(createdUser.id)).not.toBeNull();
            
            // Delete user
            const result = userService.deleteUser(createdUser.id);
            expect(result).toBe(true);
            
            // User should no longer exist in storage
            expect(userService.getUserById(createdUser.id)).toBeNull();
            
            // User should not appear in getAllUsers
            const allUsers = userService.getAllUsers();
            const foundUser = allUsers.find(u => u.id === createdUser.id);
            expect(foundUser).toBeUndefined();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should make authentication fail after user deletion', async () => {
      await fc.assert(
        fc.asyncProperty(
          usernameArb,
          passwordArb,
          async (username, password) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create user
            const passwordHash = authService.hashPassword(password);
            const createdUser = userService.createUser(username, passwordHash, false);
            
            // Verify user can authenticate
            const loginResult = await authService.login(username, password);
            expect(loginResult).toBeDefined();
            expect(loginResult.username).toBe(username);
            
            // Logout
            authService.logout();
            
            // Delete user
            userService.deleteUser(createdUser.id);
            
            // Authentication should now fail
            await expect(authService.login(username, password)).rejects.toThrow('Invalid credentials');
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should only delete the specified user', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              username: usernameArb,
              password: passwordArb,
              isAdmin: fc.boolean()
            }),
            { minLength: 2, maxLength: 5, selector: (u) => u.username }
          ),
          (usersData) => {
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            const createdUsers = [];
            
            // Create all users
            for (const userData of usersData) {
              const passwordHash = authService.hashPassword(userData.password);
              const user = userService.createUser(userData.username, passwordHash, userData.isAdmin);
              createdUsers.push(user);
            }
            
            // Delete the first user
            const userToDelete = createdUsers[0];
            userService.deleteUser(userToDelete.id);
            
            // Deleted user should not exist
            expect(userService.getUserById(userToDelete.id)).toBeNull();
            
            // All other users should still exist
            for (let i = 1; i < createdUsers.length; i++) {
              const user = createdUsers[i];
              const retrieved = userService.getUserById(user.id);
              expect(retrieved).not.toBeNull();
              expect(retrieved.id).toBe(user.id);
              expect(retrieved.username).toBe(user.username);
            }
            
            // getAllUsers should return all users except the deleted one
            const allUsers = userService.getAllUsers();
            expect(allUsers.length).toBe(createdUsers.length - 1);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 3: User update correctness
   * Validates: Requirements 1.4
   * 
   * For any existing user and valid credential updates, when an admin updates 
   * the user, the stored credentials should reflect the changes.
   */
  describe('Property 3: User update correctness', () => {
    it('should persist username updates to storage', () => {
      fc.assert(
        fc.property(
          usernameArb,
          usernameArb,
          passwordArb,
          (originalUsername, newUsername, password) => {
            // Skip if usernames are the same
            fc.pre(originalUsername !== newUsername);
            
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create user
            const passwordHash = authService.hashPassword(password);
            const createdUser = userService.createUser(originalUsername, passwordHash, false);
            
            // Update username
            const updatedUser = userService.updateUser(createdUser.id, { username: newUsername });
            
            // Updated user should have new username
            expect(updatedUser.username).toBe(newUsername);
            
            // Retrieved user should have new username
            const retrieved = userService.getUserById(createdUser.id);
            expect(retrieved.username).toBe(newUsername);
            
            // Old username should not exist
            const allUsers = userService.getAllUsers();
            const oldUsernameUser = allUsers.find(u => u.username === originalUsername);
            expect(oldUsernameUser).toBeUndefined();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should persist password updates to storage', () => {
      fc.assert(
        fc.property(
          usernameArb,
          passwordArb,
          passwordArb,
          (username, originalPassword, newPassword) => {
            // Skip if passwords are the same
            fc.pre(originalPassword !== newPassword);
            
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create user
            const originalPasswordHash = authService.hashPassword(originalPassword);
            const createdUser = userService.createUser(username, originalPasswordHash, false);
            
            // Update password
            const newPasswordHash = authService.hashPassword(newPassword);
            const updatedUser = userService.updateUser(createdUser.id, { passwordHash: newPasswordHash });
            
            // Updated user should have new password hash
            expect(updatedUser.passwordHash).toBe(newPasswordHash);
            expect(updatedUser.passwordHash).not.toBe(originalPasswordHash);
            
            // Retrieved user should have new password hash
            const retrieved = userService.getUserById(createdUser.id);
            expect(retrieved.passwordHash).toBe(newPasswordHash);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should persist admin status updates to storage', () => {
      fc.assert(
        fc.property(
          usernameArb,
          passwordArb,
          fc.boolean(),
          fc.boolean(),
          (username, password, originalIsAdmin, newIsAdmin) => {
            // Skip if admin status is the same
            fc.pre(originalIsAdmin !== newIsAdmin);
            
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create user
            const passwordHash = authService.hashPassword(password);
            const createdUser = userService.createUser(username, passwordHash, originalIsAdmin);
            
            // Update admin status
            const updatedUser = userService.updateUser(createdUser.id, { isAdmin: newIsAdmin });
            
            // Updated user should have new admin status
            expect(updatedUser.isAdmin).toBe(newIsAdmin);
            
            // Retrieved user should have new admin status
            const retrieved = userService.getUserById(createdUser.id);
            expect(retrieved.isAdmin).toBe(newIsAdmin);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should allow authentication with updated credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          usernameArb,
          passwordArb,
          passwordArb,
          async (username, originalPassword, newPassword) => {
            // Skip if passwords are the same
            fc.pre(originalPassword !== newPassword);
            
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create user
            const originalPasswordHash = authService.hashPassword(originalPassword);
            const createdUser = userService.createUser(username, originalPasswordHash, false);
            
            // Verify original credentials work
            await authService.login(username, originalPassword);
            authService.logout();
            
            // Update password
            const newPasswordHash = authService.hashPassword(newPassword);
            userService.updateUser(createdUser.id, { passwordHash: newPasswordHash });
            
            // Old password should not work
            await expect(authService.login(username, originalPassword)).rejects.toThrow('Invalid credentials');
            
            // New password should work
            const loginResult = await authService.login(username, newPassword);
            expect(loginResult).toBeDefined();
            expect(loginResult.username).toBe(username);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should reject duplicate username updates', () => {
      fc.assert(
        fc.property(
          usernameArb,
          usernameArb,
          passwordArb,
          passwordArb,
          (username1, username2, password1, password2) => {
            // Skip if usernames are the same
            fc.pre(username1 !== username2);
            
            // Clear storage at the start of each iteration
            localStorage.clear();
            
            // Create two users
            const passwordHash1 = authService.hashPassword(password1);
            const user1 = userService.createUser(username1, passwordHash1, false);
            
            const passwordHash2 = authService.hashPassword(password2);
            userService.createUser(username2, passwordHash2, false);
            
            // Attempt to update user1's username to user2's username should fail
            expect(() => {
              userService.updateUser(user1.id, { username: username2 });
            }).toThrow('Username already exists');
            
            // User1 should still have original username
            const retrieved = userService.getUserById(user1.id);
            expect(retrieved.username).toBe(username1);
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});
