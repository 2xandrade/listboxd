/**
 * Integration tests for complete authentication flow
 * Tests the full user journey from registration to logout
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * Task 28: Testar fluxo completo de autenticação
 * - Testar registro de novo usuário
 * - Testar login com credenciais válidas
 * - Testar login com credenciais inválidas
 * - Testar expiração de sessão
 * - Testar logout
 */

const AuthService = require('./auth.js');
const StorageManager = require('./storage.js');

// Mock GoogleSheetsApi for testing
class MockGoogleSheetsApi {
  constructor() {
    this.users = new Map(); // Store users by email
    this.shouldFailNetwork = false;
    this.shouldFailAuth = false;
  }

  async registerUser(payload) {
    if (this.shouldFailNetwork) {
      throw new Error('Network error: Failed to fetch');
    }

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
      senha: senha,
      is_admin: false
    };
    
    this.users.set(email, user);
    
    return {
      ok: true,
      data: user
    };
  }

  async login(payload) {
    if (this.shouldFailNetwork) {
      throw new Error('Network error: Failed to fetch');
    }

    if (this.shouldFailAuth) {
      throw new Error('401: Unauthorized');
    }

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

  clear() {
    this.users.clear();
    this.shouldFailNetwork = false;
    this.shouldFailAuth = false;
  }
}

describe('Complete Authentication Flow - Task 28', () => {
  let authService;
  let storageManager;
  let mockApi;

  beforeEach(() => {
    storageManager = new StorageManager();
    mockApi = new MockGoogleSheetsApi();
    authService = new AuthService(storageManager, mockApi);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    mockApi.clear();
  });

  describe('1. Testar registro de novo usuário', () => {
    it('should successfully register a new user with valid data', async () => {
      // Arrange
      const userData = {
        nome: 'João Silva',
        email: 'joao.silva@example.com',
        password: 'senha123'
      };

      // Act
      const result = await authService.register(
        userData.nome,
        userData.email,
        userData.password
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.nome).toBe(userData.nome);
      expect(result.email).toBe(userData.email);
      expect(result.id).toBeDefined();
      expect(result.isAdmin).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      // Arrange
      const userData = {
        nome: 'João Silva',
        email: 'joao.silva@example.com',
        password: 'senha123'
      };

      // Register first user
      await authService.register(userData.nome, userData.email, userData.password);

      // Act & Assert - Try to register again with same email
      await expect(
        authService.register(userData.nome, userData.email, userData.password)
      ).rejects.toThrow('Este email já está cadastrado');
    });

    it('should handle network errors during registration', async () => {
      // Arrange
      mockApi.shouldFailNetwork = true;

      // Act & Assert
      await expect(
        authService.register('João Silva', 'joao@example.com', 'senha123')
      ).rejects.toThrow('Erro de conexão');
    });
  });

  describe('2. Testar login com credenciais válidas', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange - Register a user first
      const userData = {
        nome: 'Maria Santos',
        email: 'maria.santos@example.com',
        password: 'senha456'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Act - Login with the same credentials
      const result = await authService.login(userData.email, userData.password);

      // Assert
      expect(result).toBeDefined();
      expect(result.username).toBe(userData.nome);
      expect(result.email).toBe(userData.email);
      expect(result.id).toBeDefined();
    });

    it('should create a session after successful login', async () => {
      // Arrange
      const userData = {
        nome: 'Pedro Costa',
        email: 'pedro.costa@example.com',
        password: 'senha789'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Act
      await authService.login(userData.email, userData.password);

      // Assert - Check session was created
      expect(authService.isAuthenticated()).toBe(true);
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser.username).toBe(userData.nome);
      expect(currentUser.email).toBe(userData.email);
    });

    it('should persist session in localStorage', async () => {
      // Arrange
      const userData = {
        nome: 'Ana Lima',
        email: 'ana.lima@example.com',
        password: 'senha321'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Act
      await authService.login(userData.email, userData.password);

      // Assert - Check localStorage has session data
      const sessionData = localStorage.getItem('letterboxd_session');
      expect(sessionData).not.toBeNull();
      
      const session = JSON.parse(sessionData);
      expect(session.username).toBe(userData.nome);
      expect(session.email).toBe(userData.email);
      expect(session.loginTime).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });
  });

  describe('3. Testar login com credenciais inválidas', () => {
    it('should reject login with wrong password', async () => {
      // Arrange - Register a user
      const userData = {
        nome: 'Carlos Souza',
        email: 'carlos.souza@example.com',
        password: 'senhaCorreta123'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Act & Assert - Try to login with wrong password
      await expect(
        authService.login(userData.email, 'senhaErrada456')
      ).rejects.toThrow();
    });

    it('should reject login with non-existent email', async () => {
      // Act & Assert - Try to login with email that doesn't exist
      await expect(
        authService.login('naoexiste@example.com', 'qualquersenha')
      ).rejects.toThrow();
    });

    it('should not create session after failed login', async () => {
      // Arrange - Register a user
      const userData = {
        nome: 'Lucia Ferreira',
        email: 'lucia.ferreira@example.com',
        password: 'senha654'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Act - Try to login with wrong password
      try {
        await authService.login(userData.email, 'senhaErrada');
      } catch (error) {
        // Expected to fail
      }

      // Assert - No session should be created
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should provide user-friendly error messages', async () => {
      // Arrange
      mockApi.shouldFailAuth = true;

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('should handle network errors during login', async () => {
      // Arrange
      mockApi.shouldFailNetwork = true;

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Erro de conexão');
    });
  });

  describe('4. Testar expiração de sessão', () => {
    it('should expire session after timeout period', async () => {
      // Arrange - Register and login
      const userData = {
        nome: 'Roberto Alves',
        email: 'roberto.alves@example.com',
        password: 'senha987'
      };
      await authService.register(userData.nome, userData.email, userData.password);
      await authService.login(userData.email, userData.password);

      // Verify session is active
      expect(authService.isAuthenticated()).toBe(true);

      // Act - Manually expire the session
      const session = storageManager.load('letterboxd_session');
      session.expiresAt = Date.now() - 1000; // Set to past
      storageManager.save('letterboxd_session', session);

      // Assert - Session should be expired
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should automatically logout when session expires', async () => {
      // Arrange - Register and login
      const userData = {
        nome: 'Fernanda Rocha',
        email: 'fernanda.rocha@example.com',
        password: 'senha147'
      };
      await authService.register(userData.nome, userData.email, userData.password);
      await authService.login(userData.email, userData.password);

      // Act - Expire session and try to get current user
      const session = storageManager.load('letterboxd_session');
      session.expiresAt = Date.now() - 1000;
      storageManager.save('letterboxd_session', session);

      const currentUser = authService.getCurrentUser();

      // Assert - Should return null and clear session
      expect(currentUser).toBeNull();
      expect(localStorage.getItem('letterboxd_session')).toBeNull();
    });

    it('should maintain session within timeout period', async () => {
      // Arrange - Register and login
      const userData = {
        nome: 'Gustavo Mendes',
        email: 'gustavo.mendes@example.com',
        password: 'senha258'
      };
      await authService.register(userData.nome, userData.email, userData.password);
      await authService.login(userData.email, userData.password);

      // Act - Wait a short time (much less than timeout)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Session should still be valid
      expect(authService.isAuthenticated()).toBe(true);
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser.email).toBe(userData.email);
    });
  });

  describe('5. Testar logout', () => {
    it('should successfully logout authenticated user', async () => {
      // Arrange - Register and login
      const userData = {
        nome: 'Helena Dias',
        email: 'helena.dias@example.com',
        password: 'senha369'
      };
      await authService.register(userData.nome, userData.email, userData.password);
      await authService.login(userData.email, userData.password);

      // Verify user is logged in
      expect(authService.isAuthenticated()).toBe(true);

      // Act - Logout
      authService.logout();

      // Assert - User should be logged out
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should clear session data from localStorage on logout', async () => {
      // Arrange - Register and login
      const userData = {
        nome: 'Igor Barbosa',
        email: 'igor.barbosa@example.com',
        password: 'senha741'
      };
      await authService.register(userData.nome, userData.email, userData.password);
      await authService.login(userData.email, userData.password);

      // Verify session exists
      expect(localStorage.getItem('letterboxd_session')).not.toBeNull();

      // Act - Logout
      authService.logout();

      // Assert - Session should be removed from localStorage
      expect(localStorage.getItem('letterboxd_session')).toBeNull();
    });

    it('should allow login again after logout', async () => {
      // Arrange - Register user
      const userData = {
        nome: 'Julia Martins',
        email: 'julia.martins@example.com',
        password: 'senha852'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Login first time
      await authService.login(userData.email, userData.password);
      expect(authService.isAuthenticated()).toBe(true);

      // Logout
      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);

      // Act - Login again
      const result = await authService.login(userData.email, userData.password);

      // Assert - Should be able to login again
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should handle logout when not authenticated', () => {
      // Arrange - Ensure no user is logged in
      expect(authService.isAuthenticated()).toBe(false);

      // Act & Assert - Should not throw error
      expect(() => authService.logout()).not.toThrow();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('Complete Flow Integration', () => {
    it('should handle complete user journey: register -> login -> use -> logout', async () => {
      // Step 1: Register
      const userData = {
        nome: 'Complete Flow User',
        email: 'complete.flow@example.com',
        password: 'senha963'
      };
      
      const registerResult = await authService.register(
        userData.nome,
        userData.email,
        userData.password
      );
      expect(registerResult).toBeDefined();
      expect(registerResult.email).toBe(userData.email);

      // Step 2: Login
      const loginResult = await authService.login(userData.email, userData.password);
      expect(loginResult).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);

      // Step 3: Use (verify session persists)
      const currentUser = authService.getCurrentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser.email).toBe(userData.email);

      // Step 4: Logout
      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should handle multiple login/logout cycles', async () => {
      // Arrange - Register user
      const userData = {
        nome: 'Cycle Test User',
        email: 'cycle.test@example.com',
        password: 'senha159'
      };
      await authService.register(userData.nome, userData.email, userData.password);

      // Act & Assert - Multiple cycles
      for (let i = 0; i < 3; i++) {
        // Login
        await authService.login(userData.email, userData.password);
        expect(authService.isAuthenticated()).toBe(true);

        // Logout
        authService.logout();
        expect(authService.isAuthenticated()).toBe(false);
      }
    });
  });
});
