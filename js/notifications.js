/**
 * Notification System
 * Provides toast notifications and loading states for user feedback
 * Requirements: 3.5
 */

class NotificationService {
  constructor() {
    this.notificationContainer = null;
    this.loadingOverlay = null;
    this.init();
  }

  /**
   * Initialize notification system
   */
  init() {
    // Create notification container
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'notification-container';
    this.notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    
    // Create loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.id = 'loading-overlay';
    this.loadingOverlay.className = 'loading-overlay hidden';
    this.loadingOverlay.innerHTML = `
      <div class="spinner"></div>
      <p class="loading-text">Carregando...</p>
    `;
    
    // Add to DOM when ready
    if (document.body) {
      document.body.appendChild(this.notificationContainer);
      document.body.appendChild(this.loadingOverlay);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.notificationContainer);
        document.body.appendChild(this.loadingOverlay);
      });
    }
    
    // Add CSS styles
    this.addStyles();
  }

  /**
   * Add CSS styles for notifications and loading states
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Notification Styles */
      .notification {
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 0.9rem;
        min-width: 250px;
        max-width: 400px;
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .notification.success {
        background-color: #00c030;
      }

      .notification.error {
        background-color: #ff4444;
      }

      .notification.info {
        background-color: #4a9eff;
      }

      .notification.warning {
        background-color: #ffa500;
      }

      .notification.slide-out {
        animation: slideOut 0.3s ease-out forwards;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      /* Loading Overlay Styles */
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(20, 24, 28, 0.85);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        gap: 1rem;
      }

      .loading-overlay.hidden {
        display: none;
      }

      /* Spinner Styles */
      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #445566;
        border-top-color: #00c030;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-text {
        color: #9ab;
        font-size: 1rem;
        margin: 0;
      }

      /* Inline Loading Spinner */
      .inline-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #445566;
        border-top-color: #00c030;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        vertical-align: middle;
      }

      /* Button Loading State */
      button.loading {
        position: relative;
        color: transparent;
        pointer-events: none;
      }

      button.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show a notification toast
   * @param {string} message - Message to display
   * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  show(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = this.getIcon(type);
    notification.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <span>${this.escapeHtml(message)}</span>
    `;
    
    this.notificationContainer.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      notification.classList.add('slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
    
    return notification;
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  success(message) {
    return this.show(message, 'success');
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  error(message) {
    return this.show(message, 'error');
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   */
  info(message) {
    return this.show(message, 'info');
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   */
  warning(message) {
    return this.show(message, 'warning');
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Icon character
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type] || icons.info;
  }

  /**
   * Show loading overlay
   * @param {string} message - Optional loading message
   */
  showLoading(message = 'Carregando...') {
    if (this.loadingOverlay) {
      const loadingText = this.loadingOverlay.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = message;
      }
      this.loadingOverlay.classList.remove('hidden');
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }

  /**
   * Set button loading state
   * @param {HTMLButtonElement} button - Button element
   * @param {boolean} loading - Loading state
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
      button.dataset.originalText = button.textContent;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
const notificationService = new NotificationService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}
