/**
 * Property-based tests for AuthService
 * Uses fast-check for property-based testing
 * Requirements: 1.5, 2.1, 2.2, 2.3, 2.4
 */

const fc = require('fast-check');
const AuthService = require('./auth.js');
const UserService = require('./users.js');
const StorageManager = require('./storage.js');

describe('AuthService - Property-Based Tests', () => {
  let authService;
  let userService;
  let storageManager;

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
   * Feature: letterboxd-manager, Property 4: Password hashing security
   * Validates: Requirements 1.5
   * 
   * For any password string, when stored in the system, the stored value 
   * should be a hash and not equal to the plain text password.
   */
  describe('Property 4: Password hashing security', () => {
    it('should never store passwords in plain text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (password) => {
            const hash = authService.hashPassword(password);
            
            // Hash should not equal the plain text password
            expect(hash).not.toBe(password);
            
            // Hash should be a string
            expect(typeof hash).toBe('string');
            
            // Hash should not be empty
            expect(hash.length).toBeGreaterThan(0);
            
            // Hash should be significantly different from password
            // (bcrypt hashes are typically 60 characters)
            expect(hash.length).toBeGreaterThan(password.length);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should produce different hashes for different passwords', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (password1, password2) => {
            // Skip if passwords are the same
            fc.pre(password1 !== password2);
            
            const hash1 = authService.hashPassword(password1);
            const hash2 = authService.hashPassword(password2);
            
            // Different passwords should produce different hashes
            expect(hash1).not.toBe(hash2);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should produce verifiable hashes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (password) => {
            const hash = authService.hashPassword(password);
            
            // The hash should verify against the original password
            expect(authService.verifyPassword(password, hash)).toBe(true);
            
            // The hash should not verify against a different password
            expect(authService.verifyPassword(password + 'x', hash)).toBe(false);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 5: Valid authentication success
   * Validates: Requirements 2.1
   * 
   * For any user with valid credentials, when those credentials are provided 
   * for login, authentication should succeed and grant access.
   */
  describe('Property 5: Valid authentication success', () => {
    it('should authenticate users with valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          fc.boolean(),
          async (username, password, isAdmin) => {
            // Create a user with hashed password
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, isAdmin);
            
            // Attempt to login with the same credentials
            const result = await authService.login(username, password);
            
            // Should return user object
            expect(result).toBeDefined();
            expect(result.username).toBe(username);
            expect(result.isAdmin).toBe(isAdmin);
            expect(result.id).toBeDefined();
            
            // Should not include password hash in result
            expect(result.passwordHash).toBeUndefined();
            
            // Should be authenticated after login
            expect(authService.isAuthenticated()).toBe(true);
            
            // Should return the same user from getCurrentUser
            const currentUser = authService.getCurrentUser();
            expect(currentUser.username).toBe(username);
            expect(currentUser.isAdmin).toBe(isAdmin);
            
            // Clean up for next iteration
            authService.logout();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 6: Invalid authentication rejection
   * Validates: Requirements 2.2
   * 
   * For any invalid credential combination (wrong username or password), 
   * when provided for login, authentication should fail and return an error.
   */
  describe('Property 6: Invalid authentication rejection', () => {
    it('should reject login with wrong password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, correctPassword, wrongPassword) => {
            // Skip if passwords are the same
            fc.pre(correctPassword !== wrongPassword);
            
            // Create a user with correct password
            const passwordHash = authService.hashPassword(correctPassword);
            userService.createUser(username, passwordHash, false);
            
            // Attempt to login with wrong password
            await expect(authService.login(username, wrongPassword)).rejects.toThrow('Invalid credentials');
            
            // Should not be authenticated after failed login
            expect(authService.isAuthenticated()).toBe(false);
            
            // Clean up for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should reject login with non-existent username', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, password) => {
            // Attempt to login without creating user
            await expect(authService.login(username, password)).rejects.toThrow('Invalid credentials');
            
            // Should not be authenticated after failed login
            expect(authService.isAuthenticated()).toBe(false);
            
            // Clean up for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 7: Session persistence
   * Validates: Requirements 2.3
   * 
   * For any authenticated user, when performing actions before logout, 
   * the session should remain valid throughout.
   */
  describe('Property 7: Session persistence', () => {
    it('should maintain session across multiple operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          fc.boolean(),
          fc.integer({ min: 1, max: 10 }),
          async (username, password, isAdmin, numOperations) => {
            // Create and login user
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, isAdmin);
            await authService.login(username, password);
            
            // Perform multiple operations and verify session persists
            for (let i = 0; i < numOperations; i++) {
              expect(authService.isAuthenticated()).toBe(true);
              
              const currentUser = authService.getCurrentUser();
              expect(currentUser).not.toBeNull();
              expect(currentUser.username).toBe(username);
              expect(currentUser.isAdmin).toBe(isAdmin);
            }
            
            // Session should still be valid after all operations
            expect(authService.isAuthenticated()).toBe(true);
            
            // Clean up for next iteration
            authService.logout();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should invalidate session after logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, password) => {
            // Create and login user
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, false);
            await authService.login(username, password);
            
            // Verify authenticated
            expect(authService.isAuthenticated()).toBe(true);
            
            // Logout
            authService.logout();
            
            // Session should be invalid after logout
            expect(authService.isAuthenticated()).toBe(false);
            expect(authService.getCurrentUser()).toBeNull();
            
            // Clean up for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should expire session after timeout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, password) => {
            // Create and login user
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, false);
            await authService.login(username, password);
            
            // Verify authenticated
            expect(authService.isAuthenticated()).toBe(true);
            
            // Manually expire the session by modifying the stored session
            const session = storageManager.load('letterboxd_session');
            session.expiresAt = Date.now() - 1000; // Set to past
            storageManager.save('letterboxd_session', session);
            
            // Session should be invalid after expiration
            expect(authService.isAuthenticated()).toBe(false);
            expect(authService.getCurrentUser()).toBeNull();
            
            // Clean up for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: letterboxd-manager, Property 8: Protected route authentication
   * Validates: Requirements 2.4
   * 
   * For any protected route, when accessed without authentication, 
   * access should be denied.
   */
  describe('Property 8: Protected route authentication', () => {
    it('should deny access to protected routes without authentication', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('requireAuth', 'requireAdmin'),
          (methodName) => {
            // Ensure no user is logged in
            authService.logout();
            
            // Attempting to access protected route should throw error
            expect(() => authService[methodName]()).toThrow();
            
            // Clean up for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should allow access to protected routes with valid authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, password) => {
            // Create and login user
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, false);
            await authService.login(username, password);
            
            // Should not throw when authenticated
            expect(() => authService.requireAuth()).not.toThrow();
            
            // Clean up for next iteration
            authService.logout();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should deny admin routes to non-admin users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, password) => {
            // Create and login non-admin user
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, false); // isAdmin = false
            await authService.login(username, password);
            
            // Should throw when non-admin tries to access admin route
            expect(() => authService.requireAdmin()).toThrow('Admin privileges required');
            
            // Clean up for next iteration
            authService.logout();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should allow admin routes to admin users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (username, password) => {
            // Create and login admin user
            const passwordHash = authService.hashPassword(password);
            userService.createUser(username, passwordHash, true); // isAdmin = true
            await authService.login(username, password);
            
            // Should not throw when admin accesses admin route
            expect(() => authService.requireAdmin()).not.toThrow();
            
            // Clean up for next iteration
            authService.logout();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});
