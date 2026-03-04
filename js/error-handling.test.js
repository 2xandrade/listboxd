/**
 * Comprehensive Error Handling Tests
 * Tests error scenarios across the application
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Task 30: Testar tratamento de erros
 * - Simular erro de rede (offline)
 * - Simular erro 401 (sessão expirada)
 * - Simular erro 500 (servidor)
 * - Verificar mensagens de erro amigáveis
 * - Verificar que aplicação não quebra
 */

const AuthService = require('./auth.js');
const StorageManager = require('./storage.js');

// Mock GoogleSheetsApi for error simulation
class MockGoogleSheetsApiWithErrors {
  constructor() {
    this.errorMode = null; // 'network', '401', '500', '429', 'invalid-json', null
    this.users = new Map();
  }

  async registerUser(payload) {
    return this._simulateRequest(payload, 'register');
  }

  async login(payload) {
    return this._simulateRequest(payload, 'login');
  }

  async createList(payload) {
    return this._simulateRequest(payload, 'createList');
  }

  async getListsByUser(idUsuario) {
    return this._simulateRequest({ id_usuario: idUsuario }, 'getLists');
  }

  async _simulateRequest(payload, action) {
    // Simulate different error scenarios
    switch (this.errorMode) {
      case 'network':
        throw new Error('Network error: Failed to fetch');
      
      case 'network-timeout':
        throw new Error('Network request timeout');
      
      case '401':
        throw new Error('HTTP 401: Unauthorized');
      
      case '403':
        throw new Error('HTTP 403: Forbidden');
      
      case '404':
        throw new Error('HTTP 404: Not Found');
      
      case '429':
        throw new Error('HTTP 429: Too Many Requests');
      
      case '500':
        throw new Error('HTTP 500: Internal Server Error');
      
      case '503':
        throw new Error('HTTP 503: Service Unavailable');
      
      case 'invalid-json':
        throw new Error('Invalid JSON response from Apps Script');
      
      case 'api-error':
        throw new Error('Credenciais inválidas');
      
      case 'duplicate-email':
        throw new Error('Email já existe');
      
      default:
        // Success case
        if (action === 'register') {
          const user = {
            id_usuario: `user_${Date.now()}`,
            nome: payload.nome,
            email: payload.email,
            is_admin: false
          };
          this.users.set(payload.email, user);
          return { ok: true, data: user };
        } else if (action === 'login') {
          const user = this.users.get(payload.email);
          if (user) {
            return { ok: true, data: user };
          }
          throw new Error('Invalid credentials');
        }
        return { ok: true, data: {} };
    }
  }

  setErrorMode(mode) {
    this.errorMode = mode;
  }

  clearErrorMode() {
    this.errorMode = null;
  }

  clear() {
    this.users.clear();
    this.errorMode = null;
  }
}

describe('Error Handling - Task 30', () => {
  let authService;
  let storageManager;
  let mockApi;

  beforeEach(() => {
    storageManager = new StorageManager();
    mockApi = new MockGoogleSheetsApiWithErrors();
    authService = new AuthService(storageManager, mockApi);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    mockApi.clear();
  });

  describe('1. Simular erro de rede (offline) - Requirement 5.1', () => {
    it('should handle network error during login', async () => {
      // Arrange
      mockApi.setErrorMode('network');

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow();

      // Verify user-friendly error message
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toContain('Erro de conexão');
        expect(error.message).toContain('Verifique sua internet');
      }
    });

    it('should handle network error during registration', async () => {
      // Arrange
      mockApi.setErrorMode('network');

      // Act & Assert
      await expect(
        authService.register('João Silva', 'joao@example.com', 'senha123')
      ).rejects.toThrow();

      // Verify user-friendly error message
      try {
        await authService.register('João Silva', 'joao@example.com', 'senha123');
      } catch (error) {
        expect(error.message).toContain('Erro de conexão');
        expect(error.message).toContain('Verifique sua internet');
      }
    });

    it('should not create session when network error occurs during login', async () => {
      // Arrange
      mockApi.setErrorMode('network');

      // Act
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Expected to fail
      }

      // Assert - No session should be created
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('letterboxd_session')).toBeNull();
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      mockApi.setErrorMode('network-timeout');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toContain('Erro de conexão');
      }
    });

    it('should not break application state after network error', async () => {
      // Arrange
      mockApi.setErrorMode('network');

      // Act - Try to login with network error
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Expected
      }

      // Clear error mode and register a user
      mockApi.clearErrorMode();
      const user = await authService.register('Test User', 'test@example.com', 'password123');

      // Assert - Application should still work after error
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');

      // Should be able to login now
      const loginResult = await authService.login('test@example.com', 'password123');
      expect(loginResult).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('2. Simular erro 401 (sessão expirada) - Requirement 5.2', () => {
    it('should handle 401 error during login', async () => {
      // Arrange
      mockApi.setErrorMode('401');

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow();

      // Verify user-friendly error message
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toContain('Credenciais inválidas');
      }
    });

    it('should provide appropriate message for 401 errors', async () => {
      // Arrange
      mockApi.setErrorMode('401');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error.message).toBe('Credenciais inválidas.');
      }
    });

    it('should not create session on 401 error', async () => {
      // Arrange
      mockApi.setErrorMode('401');

      // Act
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Expected
      }

      // Assert
      expect(authService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('letterboxd_session')).toBeNull();
    });

    it('should handle session expiration gracefully', async () => {
      // Arrange - Create a valid session first
      mockApi.clearErrorMode();
      await authService.register('Test User', 'test@example.com', 'password123');
      await authService.login('test@example.com', 'password123');
      
      expect(authService.isAuthenticated()).toBe(true);

      // Act - Manually expire the session
      const session = storageManager.load('letterboxd_session');
      session.expiresAt = Date.now() - 1000; // Set to past
      storageManager.save('letterboxd_session', session);

      // Assert - Session should be expired and cleared
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('3. Simular erro 500 (servidor) - Requirement 5.3', () => {
    it('should handle 500 error during login', async () => {
      // Arrange
      mockApi.setErrorMode('500');

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow();

      // Verify user-friendly error message
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toContain('Erro no servidor');
        expect(error.message).toContain('Tente novamente mais tarde');
      }
    });

    it('should handle 500 error during registration', async () => {
      // Arrange
      mockApi.setErrorMode('500');

      // Act & Assert
      try {
        await authService.register('João Silva', 'joao@example.com', 'senha123');
      } catch (error) {
        expect(error.message).toContain('Erro no servidor');
        expect(error.message).toContain('Tente novamente mais tarde');
      }
    });

    it('should handle 503 Service Unavailable error', async () => {
      // Arrange
      mockApi.setErrorMode('503');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toContain('Erro no servidor');
        expect(error.message).toContain('Tente novamente mais tarde');
      }
    });

    it('should not corrupt application state after 500 error', async () => {
      // Arrange
      mockApi.setErrorMode('500');

      // Act - Try operation that fails with 500
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Expected
      }

      // Clear error and try again
      mockApi.clearErrorMode();
      await authService.register('Test User', 'test@example.com', 'password123');
      const result = await authService.login('test@example.com', 'password123');

      // Assert - Should work after server recovers
      expect(result).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('4. Verificar mensagens de erro amigáveis - Requirement 5.4', () => {
    it('should provide friendly message for network errors', async () => {
      // Arrange
      mockApi.setErrorMode('network');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Should be in Portuguese and user-friendly
        expect(error.message).toMatch(/Erro de conexão/i);
        expect(error.message).toMatch(/internet/i);
        // Should not expose technical details
        expect(error.message).not.toMatch(/fetch/i);
        expect(error.message).not.toMatch(/XMLHttpRequest/i);
      }
    });

    it('should provide friendly message for authentication errors', async () => {
      // Arrange
      mockApi.setErrorMode('401');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'wrongpassword');
      } catch (error) {
        // Should be clear and actionable
        expect(error.message).toMatch(/Credenciais inválidas/i);
        // Should not expose technical HTTP codes
        expect(error.message).not.toMatch(/401/);
        expect(error.message).not.toMatch(/Unauthorized/i);
      }
    });

    it('should provide friendly message for server errors', async () => {
      // Arrange
      mockApi.setErrorMode('500');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Should be reassuring and suggest retry
        expect(error.message).toMatch(/Erro no servidor/i);
        expect(error.message).toMatch(/Tente novamente/i);
        // Should not expose technical details
        expect(error.message).not.toMatch(/500/);
        expect(error.message).not.toMatch(/Internal Server Error/i);
      }
    });

    it('should provide friendly message for rate limiting', async () => {
      // Arrange
      mockApi.setErrorMode('429');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toMatch(/Muitas tentativas/i);
        expect(error.message).toMatch(/Aguarde/i);
      }
    });

    it('should provide friendly message for duplicate email', async () => {
      // Arrange
      mockApi.setErrorMode('duplicate-email');

      // Act & Assert
      try {
        await authService.register('João Silva', 'joao@example.com', 'senha123');
      } catch (error) {
        expect(error.message).toMatch(/email já está cadastrado/i);
      }
    });

    it('should provide friendly message for invalid JSON response', async () => {
      // Arrange
      mockApi.setErrorMode('invalid-json');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        // Should have a fallback message
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('5. Verificar que aplicação não quebra - Requirement 5.5', () => {
    it('should maintain application stability after multiple errors', async () => {
      // Test multiple error scenarios in sequence
      const errorModes = ['network', '401', '500', '429'];

      for (const mode of errorModes) {
        mockApi.setErrorMode(mode);
        
        try {
          await authService.login('test@example.com', 'password123');
        } catch (error) {
          // Expected to fail
          expect(error).toBeDefined();
        }

        // Verify application state is still valid
        expect(authService.isAuthenticated()).toBe(false);
        expect(() => authService.getCurrentUser()).not.toThrow();
      }

      // After all errors, application should still work
      mockApi.clearErrorMode();
      await authService.register('Test User', 'test@example.com', 'password123');
      const result = await authService.login('test@example.com', 'password123');
      
      expect(result).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should handle errors without throwing unhandled exceptions', async () => {
      // Arrange
      mockApi.setErrorMode('network');

      // Act & Assert - Should catch and handle error gracefully
      const loginPromise = authService.login('test@example.com', 'password123');
      
      await expect(loginPromise).rejects.toThrow();
      
      // Application should still be in valid state
      expect(() => authService.isAuthenticated()).not.toThrow();
      expect(() => authService.getCurrentUser()).not.toThrow();
    });

    it('should preserve existing session when new login fails', async () => {
      // Arrange - Create valid session
      mockApi.clearErrorMode();
      await authService.register('User 1', 'user1@example.com', 'password1');
      await authService.login('user1@example.com', 'password1');
      
      expect(authService.isAuthenticated()).toBe(true);
      const originalUser = authService.getCurrentUser();

      // Act - Try to login as different user with error
      mockApi.setErrorMode('network');
      try {
        await authService.login('user2@example.com', 'password2');
      } catch (error) {
        // Expected
      }

      // Assert - Original session should be preserved
      expect(authService.isAuthenticated()).toBe(true);
      const currentUser = authService.getCurrentUser();
      expect(currentUser.email).toBe(originalUser.email);
    });

    it('should handle rapid successive errors without breaking', async () => {
      // Arrange
      mockApi.setErrorMode('500');

      // Act - Make multiple rapid requests that fail
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          authService.login('test@example.com', 'password123').catch(e => e)
        );
      }

      const results = await Promise.all(promises);

      // Assert - All should fail gracefully
      results.forEach(result => {
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain('Erro no servidor');
      });

      // Application should still be functional
      mockApi.clearErrorMode();
      await authService.register('Test User', 'test@example.com', 'password123');
      const loginResult = await authService.login('test@example.com', 'password123');
      
      expect(loginResult).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should handle errors in different service methods', async () => {
      // Test that errors in one method don't affect others
      mockApi.setErrorMode('network');

      // Try login (will fail)
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Try register (will also fail)
      try {
        await authService.register('Test User', 'test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Other methods should still work
      expect(() => authService.logout()).not.toThrow();
      expect(() => authService.isAuthenticated()).not.toThrow();
      expect(() => authService.getCurrentUser()).not.toThrow();
    });

    it('should recover gracefully from invalid session data', async () => {
      // Arrange - Create corrupted session data
      localStorage.setItem('letterboxd_session', 'invalid json data');

      // Act & Assert - getCurrentUser will throw due to invalid JSON
      // but the application should be able to recover
      expect(() => authService.getCurrentUser()).toThrow('Failed to load data');
      
      // Clear the corrupted data
      localStorage.removeItem('letterboxd_session');

      // Should be able to login normally after clearing corrupted data
      mockApi.clearErrorMode();
      await authService.register('Test User', 'test@example.com', 'password123');
      const result = await authService.login('test@example.com', 'password123');
      
      expect(result).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('Additional Error Scenarios', () => {
    it('should handle 403 Forbidden errors', async () => {
      // Arrange
      mockApi.setErrorMode('403');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle 404 Not Found errors', async () => {
      // Arrange
      mockApi.setErrorMode('404');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty error responses', async () => {
      // Arrange
      mockApi.setErrorMode('api-error');

      // Act & Assert
      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error.message).toBeDefined();
        expect(error.message).toContain('Credenciais inválidas');
      }
    });
  });
});
