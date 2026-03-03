/**
 * Property-based tests for AuthService
 * Uses fast-check for property-based testing
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

const fc = require('fast-check');
const AuthService = require('./auth.js');
const StorageManager = require('./storage.js');

// Mock GoogleSheetsApi for testing
class MockGoogleSheetsApi {
  constructor() {
    this.users = new Map(); // Store users by email
  }

  async registerUser(payload) {
    const { nome, email, senha } = payload;
    
    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('Email já existe');
    }
    
    // Create user with mock ID
    const user = {
      id_usuario: `user_${Date.now()}_${Math.random()}`,
      nome: nome,
      email: email,
      senha: senha, // In real API, this would be hashed
      is_admin: false
    };
    
    this.users.set(email, user);
    
    return {
      ok: true,
      data: user
    };
  }

  async login(payload) {
    const { email, senha } = payload;
    
    const user = this.users.get(email);
    
    if (!user || user.senha !== senha) {
      throw new Error('Invalid credentials');
    }
    
    return {
      ok: true,
      data: user
    };
  }

  // Helper method to clear users (for testing)
  clear() {
    this.users.clear();
  }
}

describe('AuthService - Property-Based Tests', () => {
  let authService;
  let storageManager;
  let mockApi;

  beforeEach(() => {
    // Create fresh instances before each test
    storageManager = new StorageManager();
    mockApi = new MockGoogleSheetsApi();
    authService = new AuthService(storageManager, mockApi);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    mockApi.clear();
  });

  /**
   * Feature: google-sheets-integration, Property 1: Valid authentication success
   * Validates: Requirements 1.3, 1.4
   * 
   * For any user with valid credentials registered via API, when those credentials 
   * are provided for login, authentication should succeed and create a local session.
   */
  describe('Property 1: Valid authentication success', () => {
    it('should authenticate users with valid credentials via API', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register user via mock API
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: password
            });
            
            // Attempt to login with the same credentials
            const result = await authService.login(email, password);
            
            // Should return user object
            expect(result).toBeDefined();
            expect(result.username).toBe(nome);
            expect(result.email).toBe(email);
            expect(result.id).toBeDefined();
            
            // Should be authenticated after login
            expect(authService.isAuthenticated()).toBe(true);
            
            // Should return the same user from getCurrentUser
            const currentUser = authService.getCurrentUser();
            expect(currentUser.username).toBe(nome);
            expect(currentUser.email).toBe(email);
            
            // Clean up for next iteration
            authService.logout();
            mockApi.clear();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: google-sheets-integration, Property 2: Invalid authentication rejection
   * Validates: Requirements 1.5
   * 
   * For any invalid credential combination (wrong email or password), 
   * when provided for login, authentication should fail with appropriate error message.
   */
  describe('Property 2: Invalid authentication rejection', () => {
    it('should reject login with wrong password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, correctPassword, wrongPassword) => {
            // Skip if passwords are the same
            fc.pre(correctPassword !== wrongPassword);
            
            // Register user with correct password
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: correctPassword
            });
            
            // Attempt to login with wrong password
            await expect(authService.login(email, wrongPassword)).rejects.toThrow();
            
            // Should not be authenticated after failed login
            expect(authService.isAuthenticated()).toBe(false);
            
            // Clean up for next iteration
            mockApi.clear();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should reject login with non-existent email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (email, password) => {
            // Attempt to login without registering user
            await expect(authService.login(email, password)).rejects.toThrow();
            
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
   * Feature: google-sheets-integration, Property 3: Session persistence
   * Validates: Requirements 7.1, 7.2, 7.3
   * 
   * For any authenticated user, the session should persist in localStorage
   * and remain valid until logout or expiration.
   */
  describe('Property 3: Session persistence', () => {
    it('should maintain session across multiple operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          async (nome, email, password, numOperations) => {
            // Register and login user
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: password
            });
            await authService.login(email, password);
            
            // Perform multiple operations and verify session persists
            for (let i = 0; i < numOperations; i++) {
              expect(authService.isAuthenticated()).toBe(true);
              
              const currentUser = authService.getCurrentUser();
              expect(currentUser).not.toBeNull();
              expect(currentUser.username).toBe(nome);
              expect(currentUser.email).toBe(email);
            }
            
            // Session should still be valid after all operations
            expect(authService.isAuthenticated()).toBe(true);
            
            // Clean up for next iteration
            authService.logout();
            mockApi.clear();
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
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register and login user
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: password
            });
            await authService.login(email, password);
            
            // Verify authenticated
            expect(authService.isAuthenticated()).toBe(true);
            
            // Logout
            authService.logout();
            
            // Session should be invalid after logout
            expect(authService.isAuthenticated()).toBe(false);
            expect(authService.getCurrentUser()).toBeNull();
            
            // Clean up for next iteration
            mockApi.clear();
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
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register and login user
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: password
            });
            await authService.login(email, password);
            
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
            mockApi.clear();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: google-sheets-integration, Property 4: User registration
   * Validates: Requirements 1.1, 1.2
   * 
   * For any valid user data, when registration is requested via API,
   * a new user should be created and returned.
   */
  describe('Property 4: User registration', () => {
    it('should register new users via API', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register user
            const result = await authService.register(nome, email, password);
            
            // Should return user object
            expect(result).toBeDefined();
            expect(result.nome).toBe(nome);
            expect(result.email).toBe(email);
            expect(result.id).toBeDefined();
            
            // Should be able to login with registered credentials
            const loginResult = await authService.login(email, password);
            expect(loginResult).toBeDefined();
            expect(loginResult.email).toBe(email);
            
            // Clean up for next iteration
            authService.logout();
            mockApi.clear();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should reject duplicate email registration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register user first time
            await authService.register(nome, email, password);
            
            // Attempt to register with same email should fail
            await expect(authService.register(nome, email, password)).rejects.toThrow();
            
            // Clean up for next iteration
            mockApi.clear();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: google-sheets-integration, Property 5: Error handling
   * Validates: Requirements 7.4, 7.5
   * 
   * For any API error, the service should provide user-friendly error messages
   * in Portuguese.
   */
  describe('Property 5: Error handling', () => {
    it('should provide user-friendly error messages for login failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (email, password) => {
            // Attempt login with non-existent user
            try {
              await authService.login(email, password);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Error message should be user-friendly
              expect(error.message).toBeDefined();
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
            }
            
            // Clean up for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Feature: google-sheets-integration, Property 6: Protected route authentication
   * Validates: Requirements 7.1
   * 
   * For any protected route, when accessed without authentication, 
   * access should be denied.
   */
  describe('Property 6: Protected route authentication', () => {
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
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register and login user
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: password
            });
            await authService.login(email, password);
            
            // Should not throw when authenticated
            expect(() => authService.requireAuth()).not.toThrow();
            
            // Clean up for next iteration
            authService.logout();
            mockApi.clear();
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
          fc.emailAddress(),
          fc.string({ minLength: 4, maxLength: 50 }),
          async (nome, email, password) => {
            // Register and login non-admin user
            await mockApi.registerUser({
              nome: nome,
              email: email,
              senha: password
            });
            await authService.login(email, password);
            
            // Should throw when non-admin tries to access admin route
            expect(() => authService.requireAdmin()).toThrow('Admin privileges required');
            
            // Clean up for next iteration
            authService.logout();
            mockApi.clear();
            localStorage.clear();
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});

