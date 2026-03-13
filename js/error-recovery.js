/**
 * ErrorRecovery - Utility for handling errors with retry logic and recovery strategies
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class ErrorRecovery {
  // Static property to track consecutive errors
  static consecutiveErrors = 0;
  static ERROR_THRESHOLD = 5;
  static reloadPromptShown = false;

  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Async operation to retry
   * @param {number} maxRetries - Maximum retry attempts (default: 3)
   * @param {number} initialDelay - Initial delay in ms (default: 1000)
   * @param {number} timeout - Timeout in ms for the operation (default: 10000)
   * @returns {Promise<any>} Operation result
   * @throws {Error} If all retries fail or timeout occurs
   */
  static async retryWithBackoff(operation, maxRetries = 3, initialDelay = 1000, timeout = 10000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wrap operation with timeout
        const result = await this.withTimeout(operation(), timeout);
        // Success - reset error count
        this.resetErrorCount();
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not recoverable
        if (!this.isRecoverable(error)) {
          throw error;
        }
        
        // Don't wait after last attempt
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt);
          this.logError(error, {
            context: 'retryWithBackoff',
            attempt: attempt + 1,
            maxRetries,
            nextRetryIn: delay
          });
          await this.sleep(delay);
        }
      }
    }
    
    // All retries failed
    this.incrementErrorCount();
    throw lastError;
  }

  /**
   * Wrap a promise with a timeout
   * @param {Promise} promise - Promise to wrap
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<any>} Promise that rejects on timeout
   */
  static withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Handle API error gracefully
   * @param {Error} error - Error object
   * @param {string} context - Error context description
   * @returns {Object} Error information object
   */
  static handleApiError(error, context) {
    this.incrementErrorCount();
    
    const errorInfo = {
      context,
      message: error.message,
      recoverable: this.isRecoverable(error),
      timestamp: new Date().toISOString()
    };

    // Extract status code if available
    if (error.response) {
      errorInfo.statusCode = error.response.status;
      errorInfo.statusText = error.response.statusText;
    }

    // Determine user-friendly message
    if (error.message.toLowerCase().includes('timeout') || error.message.toLowerCase().includes('timed out')) {
      errorInfo.userMessage = 'A operação demorou muito. Tente novamente.';
    } else if (error.message.includes('Network') || error.message.includes('fetch')) {
      errorInfo.userMessage = 'Erro de conexão. Verifique sua internet.';
    } else if (errorInfo.statusCode === 401) {
      errorInfo.userMessage = 'Sessão expirada. Faça login novamente.';
    } else if (errorInfo.statusCode === 429) {
      errorInfo.userMessage = 'Muitas requisições. Aguarde um momento.';
    } else if (errorInfo.statusCode >= 500) {
      errorInfo.userMessage = 'Erro no servidor. Tente novamente mais tarde.';
    } else {
      errorInfo.userMessage = 'Ocorreu um erro. Tente novamente.';
    }

    this.logError(error, errorInfo);
    return errorInfo;
  }

  /**
   * Log detailed error information
   * @param {Error} error - Error object
   * @param {Object} context - Additional context information
   */
  static logError(error, context = {}) {
    const logEntry = {
      level: LOG_LEVELS.ERROR,
      timestamp: new Date().toISOString(),
      message: error.message,
      context: context.context || 'unknown',
      data: context,
      stack: error.stack
    };

    console.error('[ErrorRecovery]', logEntry);
  }

  /**
   * Check if error is recoverable (can be retried)
   * @param {Error} error - Error object
   * @returns {boolean} True if error is recoverable
   */
  static isRecoverable(error) {
    const message = error.message.toLowerCase();
    
    // Network errors are recoverable
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('timeout') ||
        message.includes('connection')) {
      return true;
    }

    // Check HTTP status codes if available
    if (error.response) {
      const status = error.response.status;
      
      // Server errors (5xx) are recoverable
      if (status >= 500) {
        return true;
      }
      
      // Rate limiting (429) is recoverable
      if (status === 429) {
        return true;
      }
      
      // Client errors (4xx) are generally not recoverable
      // except for 408 (Request Timeout) and 429 (Too Many Requests)
      if (status === 408) {
        return true;
      }
      
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    // Default to recoverable for unknown errors
    return true;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Increment consecutive error count and check threshold
   */
  static incrementErrorCount() {
    this.consecutiveErrors++;
    console.warn(`[ErrorRecovery] Consecutive errors: ${this.consecutiveErrors}/${this.ERROR_THRESHOLD}`);
    
    // Only show prompt once when threshold is first reached
    if (this.consecutiveErrors === this.ERROR_THRESHOLD && !this.reloadPromptShown) {
      this.showReloadPrompt();
    }
  }

  /**
   * Reset consecutive error count (called on successful operation)
   */
  static resetErrorCount() {
    if (this.consecutiveErrors > 0) {
      console.info(`[ErrorRecovery] Operation successful. Resetting error count from ${this.consecutiveErrors} to 0`);
      this.consecutiveErrors = 0;
      this.reloadPromptShown = false;
    }
  }

  /**
   * Get current consecutive error count
   * @returns {number} Current error count
   */
  static getErrorCount() {
    return this.consecutiveErrors;
  }

  /**
   * Display reload prompt to user after threshold is reached
   */
  static showReloadPrompt() {
    this.reloadPromptShown = true;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'error-threshold-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    modal.innerHTML = `
      <h2 style="margin: 0 0 1rem 0; color: #dc2626;">Múltiplos Erros Detectados</h2>
      <p style="margin: 0 0 1.5rem 0; color: #4b5563;">
        A aplicação encontrou ${this.ERROR_THRESHOLD} erros consecutivos. 
        Recarregar a página pode resolver o problema.
      </p>
      <button id="reload-page-btn" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        font-weight: 600;
      ">
        Recarregar Página
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add click handler to reload button
    document.getElementById('reload-page-btn').addEventListener('click', () => {
      window.location.reload();
    });

    console.error(`[ErrorRecovery] Error threshold reached (${this.ERROR_THRESHOLD} consecutive errors). Reload prompt displayed.`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorRecovery;
}
