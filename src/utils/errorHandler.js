// Error handling utilities for the frontend

export class ErrorHandler {
  static handleApiError(error, context = '') {
    console.error(`API Error${context ? ` (${context})` : ''}:`, error);
    
    // Extract error information
    const errorInfo = {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status,
      details: error.details || {},
      context: context,
      timestamp: new Date().toISOString()
    };
    
    // Log to external service if available
    if (window.logError) {
      window.logError('API Error', errorInfo);
    }
    
    return errorInfo;
  }
  
  static getUserFriendlyMessage(error) {
    // Map error codes to user-friendly messages
    const errorMessages = {
      'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
      'AUTH_ERROR': 'Your session has expired. Please log in again.',
      'ACCESS_DENIED': 'You don\'t have permission to perform this action.',
      'RESOURCE_NOT_FOUND': 'The requested item could not be found.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'FILE_ERROR': 'There was a problem with the file operation.',
      'LMS_INTEGRATION_ERROR': 'Unable to connect to the learning management system.',
      'RATE_LIMIT_ERROR': 'Too many requests. Please wait a moment and try again.',
      'HTTP_401': 'Authentication required. Please log in.',
      'HTTP_403': 'Access denied.',
      'HTTP_404': 'Resource not found.',
      'HTTP_429': 'Too many requests. Please wait and try again.',
      'HTTP_500': 'Server error. Please try again later.',
      'HTTP_502': 'Service temporarily unavailable.',
      'HTTP_503': 'Service temporarily unavailable.',
      'HTTP_504': 'Request timeout. Please try again.',
    };
    
    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }
  
  static shouldRetry(error) {
    // Determine if the operation should be retried
    const retryableErrors = [
      'NETWORK_ERROR',
      'HTTP_500',
      'HTTP_502',
      'HTTP_503',
      'HTTP_504',
      'RATE_LIMIT_ERROR'
    ];
    
    return retryableErrors.includes(error.code);
  }
  
  static getRetryDelay(attemptNumber) {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    
    return delay + jitter;
  }
  
  static async retryOperation(operation, maxAttempts = 3, context = '') {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorInfo = this.handleApiError(error, context);
        
        // If this is the last attempt or error is not retryable, throw the error
        if (attempt === maxAttempts - 1 || !this.shouldRetry(error)) {
          throw error;
        }
        
        // Wait before retrying
        const delay = this.getRetryDelay(attempt);
        console.warn(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Toast notification system
export class ToastManager {
  static notifications = [];
  static listeners = [];
  
  static addListener(callback) {
    this.listeners.push(callback);
  }
  
  static removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  static notify(message, type = 'info', duration = 5000, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      timestamp: new Date().toISOString(),
      ...options
    };
    
    this.notifications.push(notification);
    
    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in toast notification listener:', error);
      }
    });
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, duration);
    }
    
    return notification.id;
  }
  
  static remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    // Notify listeners of removal
    this.listeners.forEach(callback => {
      try {
        callback({ type: 'remove', id });
      } catch (error) {
        console.error('Error in toast notification listener:', error);
      }
    });
  }
  
  static success(message, options = {}) {
    return this.notify(message, 'success', 5000, options);
  }
  
  static error(message, options = {}) {
    return this.notify(message, 'error', 8000, options);
  }
  
  static warning(message, options = {}) {
    return this.notify(message, 'warning', 6000, options);
  }
  
  static info(message, options = {}) {
    return this.notify(message, 'info', 4000, options);
  }
}

// Global error handlers
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Try to extract meaningful error information
    const error = event.reason;
    if (error && error.code) {
      const userMessage = ErrorHandler.getUserFriendlyMessage(error);
      ToastManager.error(userMessage);
    } else {
      ToastManager.error('An unexpected error occurred. Please try again.');
    }
    
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  // Handle uncaught errors
  window.addEventListener('error', event => {
    console.error('Uncaught error:', event.error);
    ToastManager.error('An unexpected error occurred. Please refresh the page.');
  });
  
  // Handle authentication errors
  window.addEventListener('auth-error', event => {
    console.warn('Authentication error:', event.detail);
    ToastManager.warning('Your session has expired. Please log in again.');
    
    // Could redirect to login page
    // window.location.href = '/login';
  });
  
  // Handle server errors
  window.addEventListener('server-error', event => {
    console.error('Server error:', event.detail);
    ToastManager.error('Server error. Please try again later.');
  });
}

// Validation helpers
export class ValidationHelper {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
  
  static validateFileUpload(file, maxSize = 100 * 1024 * 1024, allowedTypes = []) {
    const errors = [];
    
    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }
    
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
    
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        errors.push(`File type '${fileExtension}' is not allowed`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}