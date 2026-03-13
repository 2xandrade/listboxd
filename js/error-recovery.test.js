/**
 * Unit tests for ErrorRecovery utility
 */

const ErrorRecovery = require('./error-recovery.js');

describe('ErrorRecovery', () => {
  // Mock console.error to avoid cluttering test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    // Reset error count before each test
    ErrorRecovery.consecutiveErrors = 0;
    ErrorRecovery.reloadPromptShown = false;
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    console.info.mockRestore();
    // Clean up any reload prompt that might have been created
    const overlay = document.getElementById('error-threshold-overlay');
    if (overlay) {
      overlay.remove();
    }
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await ErrorRecovery.retryWithBackoff(operation, 3);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on recoverable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await ErrorRecovery.retryWithBackoff(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const sleepSpy = jest.spyOn(ErrorRecovery, 'sleep').mockResolvedValue();
      
      await ErrorRecovery.retryWithBackoff(operation, 3, 100);
      
      expect(sleepSpy).toHaveBeenCalledWith(100); // First retry: 100ms
      expect(sleepSpy).toHaveBeenCalledWith(200); // Second retry: 200ms
      
      sleepSpy.mockRestore();
    });

    it('should throw error after max retries exceeded', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        ErrorRecovery.retryWithBackoff(operation, 2, 10)
      ).rejects.toThrow('Network error');
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-recoverable errors', async () => {
      const error = new Error('Bad request');
      error.response = { status: 400 };
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(
        ErrorRecovery.retryWithBackoff(operation, 3)
      ).rejects.toThrow('Bad request');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should timeout long-running operations', async () => {
      const operation = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve('success'), 5000));
      });
      
      await expect(
        ErrorRecovery.retryWithBackoff(operation, 0, 100, 100)
      ).rejects.toThrow('Operation timed out after 100ms');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      
      const result = await ErrorRecovery.withTimeout(promise, 1000);
      
      expect(result).toBe('success');
    });

    it('should reject if promise exceeds timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 500));
      
      await expect(
        ErrorRecovery.withTimeout(promise, 100)
      ).rejects.toThrow('Operation timed out after 100ms');
    });
  });

  describe('handleApiError', () => {
    it('should extract status code from error response', () => {
      const error = new Error('API error');
      error.response = { status: 500, statusText: 'Internal Server Error' };
      
      const result = ErrorRecovery.handleApiError(error, 'test context');
      
      expect(result.statusCode).toBe(500);
      expect(result.statusText).toBe('Internal Server Error');
      expect(result.context).toBe('test context');
    });

    it('should provide user-friendly message for timeout errors', () => {
      const error = new Error('Operation timed out');
      
      const result = ErrorRecovery.handleApiError(error, 'loading data');
      
      expect(result.userMessage).toBe('A operação demorou muito. Tente novamente.');
    });

    it('should provide user-friendly message for network errors', () => {
      const error = new Error('Network request failed');
      
      const result = ErrorRecovery.handleApiError(error, 'fetching data');
      
      expect(result.userMessage).toBe('Erro de conexão. Verifique sua internet.');
    });

    it('should provide user-friendly message for 401 errors', () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      
      const result = ErrorRecovery.handleApiError(error, 'api call');
      
      expect(result.userMessage).toBe('Sessão expirada. Faça login novamente.');
    });

    it('should provide user-friendly message for 429 errors', () => {
      const error = new Error('Too many requests');
      error.response = { status: 429 };
      
      const result = ErrorRecovery.handleApiError(error, 'api call');
      
      expect(result.userMessage).toBe('Muitas requisições. Aguarde um momento.');
    });

    it('should provide user-friendly message for 5xx errors', () => {
      const error = new Error('Server error');
      error.response = { status: 503 };
      
      const result = ErrorRecovery.handleApiError(error, 'api call');
      
      expect(result.userMessage).toBe('Erro no servidor. Tente novamente mais tarde.');
    });

    it('should mark error as recoverable or not', () => {
      const recoverableError = new Error('Network error');
      const nonRecoverableError = new Error('Bad request');
      nonRecoverableError.response = { status: 400 };
      
      const result1 = ErrorRecovery.handleApiError(recoverableError, 'test');
      const result2 = ErrorRecovery.handleApiError(nonRecoverableError, 'test');
      
      expect(result1.recoverable).toBe(true);
      expect(result2.recoverable).toBe(false);
    });
  });

  describe('isRecoverable', () => {
    it('should return true for network errors', () => {
      expect(ErrorRecovery.isRecoverable(new Error('Network error'))).toBe(true);
      expect(ErrorRecovery.isRecoverable(new Error('fetch failed'))).toBe(true);
      expect(ErrorRecovery.isRecoverable(new Error('Connection timeout'))).toBe(true);
    });

    it('should return true for 5xx server errors', () => {
      const error = new Error('Server error');
      error.response = { status: 500 };
      
      expect(ErrorRecovery.isRecoverable(error)).toBe(true);
    });

    it('should return true for 429 rate limit errors', () => {
      const error = new Error('Too many requests');
      error.response = { status: 429 };
      
      expect(ErrorRecovery.isRecoverable(error)).toBe(true);
    });

    it('should return true for 408 timeout errors', () => {
      const error = new Error('Request timeout');
      error.response = { status: 408 };
      
      expect(ErrorRecovery.isRecoverable(error)).toBe(true);
    });

    it('should return false for 4xx client errors (except 408, 429)', () => {
      const error400 = new Error('Bad request');
      error400.response = { status: 400 };
      
      const error401 = new Error('Unauthorized');
      error401.response = { status: 401 };
      
      const error404 = new Error('Not found');
      error404.response = { status: 404 };
      
      expect(ErrorRecovery.isRecoverable(error400)).toBe(false);
      expect(ErrorRecovery.isRecoverable(error401)).toBe(false);
      expect(ErrorRecovery.isRecoverable(error404)).toBe(false);
    });

    it('should return true for unknown errors by default', () => {
      const error = new Error('Unknown error');
      
      expect(ErrorRecovery.isRecoverable(error)).toBe(true);
    });
  });

  describe('logError', () => {
    it('should log error with timestamp and context', () => {
      const error = new Error('Test error');
      const context = { context: 'test', additionalInfo: 'data' };
      
      ErrorRecovery.logError(error, context);
      
      expect(console.error).toHaveBeenCalledWith(
        '[ErrorRecovery]',
        expect.objectContaining({
          level: 'ERROR',
          message: 'Test error',
          context: 'test',
          data: context,
          timestamp: expect.any(String),
          stack: expect.any(String)
        })
      );
    });

    it('should use "unknown" as default context', () => {
      const error = new Error('Test error');
      
      ErrorRecovery.logError(error);
      
      expect(console.error).toHaveBeenCalledWith(
        '[ErrorRecovery]',
        expect.objectContaining({
          context: 'unknown'
        })
      );
    });
  });

  describe('Error Threshold Handling', () => {
    describe('incrementErrorCount', () => {
      it('should increment consecutive error count', () => {
        ErrorRecovery.incrementErrorCount();
        expect(ErrorRecovery.getErrorCount()).toBe(1);
        
        ErrorRecovery.incrementErrorCount();
        expect(ErrorRecovery.getErrorCount()).toBe(2);
      });

      it('should log warning with current count', () => {
        ErrorRecovery.incrementErrorCount();
        
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Consecutive errors: 1/5')
        );
      });

      it('should show reload prompt when threshold is reached', () => {
        const showReloadPromptSpy = jest.spyOn(ErrorRecovery, 'showReloadPrompt').mockImplementation(() => {});
        
        // Increment to threshold
        for (let i = 0; i < 5; i++) {
          ErrorRecovery.incrementErrorCount();
        }
        
        expect(showReloadPromptSpy).toHaveBeenCalledTimes(1);
        
        showReloadPromptSpy.mockRestore();
      });

      it('should not show reload prompt multiple times', () => {
        const showReloadPromptSpy = jest.spyOn(ErrorRecovery, 'showReloadPrompt').mockImplementation(() => {});
        
        // Increment beyond threshold
        for (let i = 0; i < 10; i++) {
          ErrorRecovery.incrementErrorCount();
        }
        
        // Should only be called once
        expect(showReloadPromptSpy).toHaveBeenCalledTimes(1);
        
        showReloadPromptSpy.mockRestore();
      });
    });

    describe('resetErrorCount', () => {
      it('should reset error count to zero', () => {
        ErrorRecovery.consecutiveErrors = 3;
        
        ErrorRecovery.resetErrorCount();
        
        expect(ErrorRecovery.getErrorCount()).toBe(0);
      });

      it('should reset reload prompt flag', () => {
        ErrorRecovery.consecutiveErrors = 5;
        ErrorRecovery.reloadPromptShown = true;
        
        ErrorRecovery.resetErrorCount();
        
        expect(ErrorRecovery.reloadPromptShown).toBe(false);
      });

      it('should log info message when resetting', () => {
        ErrorRecovery.consecutiveErrors = 3;
        
        ErrorRecovery.resetErrorCount();
        
        expect(console.info).toHaveBeenCalledWith(
          expect.stringContaining('Resetting error count from 3 to 0')
        );
      });

      it('should not log if count is already zero', () => {
        ErrorRecovery.consecutiveErrors = 0;
        
        ErrorRecovery.resetErrorCount();
        
        expect(console.info).not.toHaveBeenCalled();
      });
    });

    describe('getErrorCount', () => {
      it('should return current error count', () => {
        ErrorRecovery.consecutiveErrors = 3;
        
        expect(ErrorRecovery.getErrorCount()).toBe(3);
      });
    });

    describe('showReloadPrompt', () => {
      beforeEach(() => {
        // Set up a basic DOM environment
        document.body.innerHTML = '';
      });

      it('should create modal overlay in DOM', () => {
        ErrorRecovery.showReloadPrompt();
        
        const overlay = document.getElementById('error-threshold-overlay');
        expect(overlay).toBeTruthy();
        expect(overlay.style.position).toBe('fixed');
        expect(overlay.style.zIndex).toBe('10000');
      });

      it('should display error message and reload button', () => {
        ErrorRecovery.showReloadPrompt();
        
        const overlay = document.getElementById('error-threshold-overlay');
        expect(overlay.textContent).toContain('Múltiplos Erros Detectados');
        expect(overlay.textContent).toContain('5 erros consecutivos');
        
        const button = document.getElementById('reload-page-btn');
        expect(button).toBeTruthy();
        expect(button.textContent.trim()).toBe('Recarregar Página');
      });

      it('should set reloadPromptShown flag', () => {
        ErrorRecovery.showReloadPrompt();
        
        expect(ErrorRecovery.reloadPromptShown).toBe(true);
      });

      it('should log error message', () => {
        ErrorRecovery.showReloadPrompt();
        
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Error threshold reached')
        );
      });

      it('should reload page when button is clicked', () => {
        // Mock window.location.reload
        const originalLocation = window.location;
        delete window.location;
        window.location = { reload: jest.fn() };
        
        ErrorRecovery.showReloadPrompt();
        
        const button = document.getElementById('reload-page-btn');
        button.click();
        
        expect(window.location.reload).toHaveBeenCalled();
        
        // Restore original location
        window.location = originalLocation;
      });
    });

    describe('Integration with retryWithBackoff', () => {
      it('should reset error count on successful operation', async () => {
        ErrorRecovery.consecutiveErrors = 3;
        const operation = jest.fn().mockResolvedValue('success');
        
        await ErrorRecovery.retryWithBackoff(operation, 3);
        
        expect(ErrorRecovery.getErrorCount()).toBe(0);
      });

      it('should increment error count when all retries fail', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('Network error'));
        
        try {
          await ErrorRecovery.retryWithBackoff(operation, 2, 10);
        } catch (e) {
          // Expected to fail
        }
        
        expect(ErrorRecovery.getErrorCount()).toBe(1);
      });
    });

    describe('Integration with handleApiError', () => {
      it('should increment error count when handling API error', () => {
        const error = new Error('API error');
        
        ErrorRecovery.handleApiError(error, 'test');
        
        expect(ErrorRecovery.getErrorCount()).toBe(1);
      });

      it('should trigger reload prompt after 5 API errors', () => {
        const showReloadPromptSpy = jest.spyOn(ErrorRecovery, 'showReloadPrompt').mockImplementation(() => {});
        
        for (let i = 0; i < 5; i++) {
          ErrorRecovery.handleApiError(new Error('API error'), 'test');
        }
        
        expect(showReloadPromptSpy).toHaveBeenCalledTimes(1);
        
        showReloadPromptSpy.mockRestore();
      });
    });
  });
});
