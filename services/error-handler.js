/**
 * Enhanced Error Handler Module
 * Provides standardized error handling across the application
 * Includes retry capabilities and application-wide error utility
 */

/**
 * Common error types used throughout the application
 * @enum {string}
 */
const ErrorType = {
  // Generic error types
  UNKNOWN: 'unknown_error',
  VALIDATION: 'validation_error',
  TIMEOUT: 'timeout_error',
  
  // API specific errors
  AUTHENTICATION: 'authentication_error',
  PERMISSION: 'permission_error',
  RATE_LIMIT: 'rate_limit_error',
  SERVER: 'server_error',
  NETWORK: 'network_error',
  
  // Service specific errors
  CONFIGURATION: 'configuration_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  
  // Command execution errors
  COMMAND_EXECUTION: 'command_execution_error',
  NAVIGATION: 'navigation_error',
  ELEMENT_NOT_FOUND: 'element_not_found',
  PAGE_LOAD: 'page_load_error',
  
  // State errors
  STATE_SYNCHRONIZATION: 'state_sync_error',
  STORAGE: 'storage_error'
};

/**
 * Custom application error with enhanced properties
 */
class AppError extends Error {
  /**
   * Create an enhanced application error
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {ErrorType} options.type - Type of error
   * @param {string} options.source - Source of the error (component/service name)
   * @param {Error} options.originalError - Original error if wrapping
   * @param {Object} options.data - Additional error data
   * @param {boolean} options.retryable - Whether the error can be retried
   */
  constructor(message, options = {}) {
    super(message);
    
    this.name = 'AppError';
    this.type = options.type || ErrorType.UNKNOWN;
    this.source = options.source || 'app';
    this.originalError = options.originalError;
    this.data = options.data || {};
    this.retryable = options.retryable !== undefined ? options.retryable : true;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Get a user-friendly message with suggestions
   * @returns {string} User-friendly error message
   */
  getUserMessage() {
    // Error type specific messages
    const typeMessages = {
      [ErrorType.AUTHENTICATION]: 'Authentication failed. Please check your API key.',
      [ErrorType.PERMISSION]: 'Permission denied. Your account may not have access to this resource.',
      [ErrorType.RATE_LIMIT]: 'Rate limit exceeded. Please try again later.',
      [ErrorType.TIMEOUT]: 'The operation timed out. Please try again.',
      [ErrorType.NETWORK]: 'Network error. Please check your internet connection.',
      [ErrorType.SERVER]: 'Server error. Please try again later.',
      [ErrorType.ELEMENT_NOT_FOUND]: 'Element not found on the page. The page structure may have changed.',
      [ErrorType.NAVIGATION]: 'Navigation error. Please check the URL or try again later.',
      [ErrorType.PAGE_LOAD]: 'Page failed to load properly. Please try again.'
    };
    
    return typeMessages[this.type] || this.message;
  }
  
  /**
   * Determine if the error should be retried
   * @param {Object} options - Options for retry decision
   * @param {number} options.attempt - Current attempt number
   * @param {number} options.maxAttempts - Maximum number of attempts
   * @returns {boolean} Whether to retry the operation
   */
  shouldRetry(options = {}) {
    const { attempt = 1, maxAttempts = 3 } = options;
    
    // If explicitly marked as not retryable, don't retry
    if (!this.retryable) return false;
    
    // If reached max attempts, don't retry
    if (attempt >= maxAttempts) return false;
    
    // Error-type specific retry logic
    switch (this.type) {
      case ErrorType.RATE_LIMIT:
        // Always retry rate limit errors but with exponential backoff
        return true;
      case ErrorType.NETWORK:
      case ErrorType.SERVER:
      case ErrorType.TIMEOUT:
        // Retry transient errors
        return true;
      case ErrorType.AUTHENTICATION:
      case ErrorType.PERMISSION:
      case ErrorType.VALIDATION:
        // Don't retry user error/configuration errors
        return false;
      default:
        // By default, retry unknown errors a few times
        return true;
    }
  }
  
  /**
   * Get recommended backoff time in milliseconds
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Recommended backoff in milliseconds
   */
  getBackoffTime(attempt) {
    const baseBackoff = 1000; // 1 second
    
    switch (this.type) {
      case ErrorType.RATE_LIMIT:
        // Longer backoff for rate limits
        return Math.min(30000, baseBackoff * Math.pow(2, attempt));
      case ErrorType.SERVER:
        // Medium backoff for server errors
        return Math.min(15000, baseBackoff * Math.pow(1.5, attempt));
      default:
        // Standard exponential backoff with jitter
        const expBackoff = baseBackoff * Math.pow(1.5, attempt);
        const jitter = Math.random() * 500; // Add up to 500ms of jitter
        return Math.min(10000, expBackoff + jitter);
    }
  }
}

/**
 * API Error Handler
 * Consistently handles API errors across different services
 */
class ApiErrorHandler {
  /**
   * Handle an API error from a fetch response
   * @param {Response} response - Fetch API response
   * @param {string} serviceName - Name of the service (e.g., 'Claude', 'Groq')
   * @returns {Promise<AppError>} - Standardized error
   */
  static async handleApiError(response, serviceName) {
    let errorMessage = response.statusText || 'API request failed';
    let errorType = ErrorType.UNKNOWN;
    let errorData = {};
    
    try {
      errorData = await response.json();
      
      if (errorData.error) {
        // Extract error information
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
          
          // Map error types
          if (errorData.error.type) {
            if (errorData.error.type.includes('auth')) {
              errorType = ErrorType.AUTHENTICATION;
            } else if (errorData.error.type.includes('permission')) {
              errorType = ErrorType.PERMISSION;
            } else if (errorData.error.type.includes('rate')) {
              errorType = ErrorType.RATE_LIMIT;
            }
          }
        } else {
          errorMessage = JSON.stringify(errorData.error);
        }
      }
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
      
      // Use response text as fallback if JSON parsing fails
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText.substring(0, 200); // Limit length
        }
      } catch (textError) {
        console.error('Could not get error response text:', textError);
      }
    }
    
    // Determine error type based on status code if not already set
    if (errorType === ErrorType.UNKNOWN) {
      if (response.status === 401 || response.status === 403) {
        errorType = ErrorType.AUTHENTICATION;
      } else if (response.status === 429) {
        errorType = ErrorType.RATE_LIMIT;
      } else if (response.status >= 500) {
        errorType = ErrorType.SERVER;
      }
    }
    
    // Determine if error should be retryable
    const retryable = [ErrorType.RATE_LIMIT, ErrorType.SERVER, ErrorType.NETWORK].includes(errorType);
    
    // Create standardized error object
    return new AppError(`${serviceName} API Error: ${errorMessage}`, {
      type: errorType,
      source: serviceName,
      data: {
        statusCode: response.status,
        statusText: response.statusText,
        apiResponse: errorData
      },
      retryable
    });
  }

  /**
   * Handle common connection errors
   * @param {Error} error - Original error
   * @param {string} serviceName - Name of the service
   * @returns {AppError} - Enhanced error with suggestions
   */
  static handleConnectionError(error, serviceName) {
    let errorType = ErrorType.UNKNOWN;
    let retryable = true;
    
    // Determine error type based on message content
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError')) {
      errorType = ErrorType.NETWORK;
    } else if (error.message.includes('timeout')) {
      errorType = ErrorType.TIMEOUT;
    } else if (error.message.includes('CORS')) {
      errorType = ErrorType.PERMISSION;
      retryable = false;
    } else if (error.message.includes('API key')) {
      errorType = ErrorType.AUTHENTICATION;
      retryable = false;
    }
    
    // Create enhanced error
    return new AppError(error.message, {
      type: errorType,
      source: serviceName,
      originalError: error,
      retryable
    });
  }

  /**
   * Handle parsing errors for LLM responses
   * @param {Error} error - Original parsing error
   * @param {string} content - Raw content that failed to parse
   * @returns {Object} - Fallback response object
   */
  static handleParsingError(error, content) {
    console.error('Failed to parse LLM response:', error);
    
    // Create a fallback object with the raw content
    return {
      commands: [
        {
          action: "error",
          message: "Failed to parse response. Please try again.",
          errorDetail: error.message,
          rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
        }
      ],
      isComplete: false,
      completionMessage: "Error parsing response"
    };
  }
  
  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Async function to retry
   * @param {Object} options - Retry options
   * @param {number} options.maxAttempts - Maximum number of retry attempts
   * @param {number} options.initialBackoff - Initial backoff in milliseconds
   * @param {Function} options.shouldRetry - Function to determine if error should be retried
   * @returns {Promise<any>} - Result of the function or throws the last error
   */
  static async retryWithBackoff(fn, options = {}) {
    const {
      maxAttempts = 3,
      initialBackoff = 1000,
      shouldRetry = (error) => true,
      onRetry = null
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // If this is the last attempt or we shouldn't retry, throw the error
        if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
          throw error;
        }
        
        // Calculate backoff time - use error's backoff if it's an AppError
        let backoffTime = initialBackoff * Math.pow(1.5, attempt - 1);
        if (error instanceof AppError) {
          backoffTime = error.getBackoffTime(attempt);
        }
        
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${backoffTime}ms...`);
        
        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(error, attempt, backoffTime);
        }
        
        // Wait for backoff time before retrying
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    
    // Should not reach here, but just in case
    throw lastError;
  }
}

/**
 * Command Execution Error Handler
 * Handles errors during command execution
 */
class CommandErrorHandler {
  /**
   * Handle command execution errors
   * @param {Error} error - Original error
   * @param {string} action - Command action
   * @param {Object} details - Additional details about the command
   * @returns {Object} - Standardized error result
   */
  static handleExecutionError(error, action, details = {}) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(`Error executing ${action} command: ${error.message}`, {
          type: ErrorType.COMMAND_EXECUTION,
          source: 'command-executor',
          originalError: error,
          data: details
        });
    
    console.error(`Error executing ${action} command:`, appError);
    
    return {
      success: false,
      action,
      error: appError.message,
      errorType: appError.type,
      ...details
    };
  }

  /**
   * Handle navigation errors specifically
   * @param {Error} error - Original error
   * @param {string} url - URL that failed to load
   * @returns {Object} - Standardized error result
   */
  static handleNavigationError(error, url) {
    let errorType = ErrorType.NAVIGATION;
    let errorMessage = error.message;
    
    // Provide more helpful information for common navigation errors
    if (errorMessage.includes('invalid URL')) {
      errorMessage = `Invalid URL format: ${url}. Please provide a complete URL including http:// or https://`;
      errorType = ErrorType.VALIDATION;
    } else if (errorMessage.includes('NetworkError')) {
      errorMessage = `Network error while navigating to ${url}. The site may be unavailable.`;
      errorType = ErrorType.NETWORK;
    } else if (errorMessage.includes('timeout')) {
      errorMessage = `Timeout while navigating to ${url}. The site might be slow or unreachable.`;
      errorType = ErrorType.TIMEOUT;
    }
    
    const appError = new AppError(errorMessage, {
      type: errorType,
      source: 'navigation',
      originalError: error,
      data: { url }
    });
    
    return {
      success: false,
      action: 'navigate',
      url,
      error: appError.message,
      errorType: appError.type
    };
  }

  /**
   * Handle missing element errors
   * @param {string} action - Command action
   * @param {string} selector - Selector or XPath that failed
   * @returns {Object} - Standardized error result
   */
  static handleMissingElementError(action, selector) {
    const errorMessage = `No element found matching: ${selector}`;
    
    const appError = new AppError(errorMessage, {
      type: ErrorType.ELEMENT_NOT_FOUND,
      source: 'command-executor',
      data: { action, selector }
    });
    
    return {
      success: false,
      action,
      error: appError.message,
      errorType: appError.type,
      selector
    };
  }
}

export { ApiErrorHandler, CommandErrorHandler, AppError, ErrorType };