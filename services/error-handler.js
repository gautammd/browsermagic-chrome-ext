/**
 * Error Handler Module
 * Provides standardized error handling across the application
 */

/**
 * API Error Handler
 * Consistently handles API errors across different services
 */
class ApiErrorHandler {
  /**
   * Handle an API error from a fetch response
   * @param {Response} response - Fetch API response
   * @param {string} serviceName - Name of the service (e.g., 'Claude', 'Groq')
   * @returns {Promise<Error>} - Standardized error
   */
  static async handleApiError(response, serviceName) {
    let errorMessage = response.statusText;
    let errorType = 'unknown';
    
    try {
      const errorData = await response.json();
      
      if (errorData.error) {
        // Extract error information
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
          errorType = errorData.error.type || 'unknown';
        } else {
          errorMessage = JSON.stringify(errorData.error);
        }
        
        // Log additional helpful information
        if (errorType === 'authentication_error') {
          console.error(`💡 Authentication error: Please check your API key format and permissions.`);
        } else if (errorType === 'invalid_request_error') {
          console.error(`💡 Invalid request: Check model name and request parameters.`);
        } else if (errorType === 'permission_error') {
          console.error(`💡 Permission error: Your API key may not have permission to use this model.`);
        } else if (errorType === 'rate_limit_error') {
          console.error(`💡 Rate limit exceeded: Please try again later.`);
        }
      }
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
      
      // Use response text as fallback if JSON parsing fails
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (textError) {
        console.error('Could not get error response text:', textError);
      }
    }
    
    // Create standardized error object
    const error = new Error(`${serviceName} API Error: ${errorMessage}`);
    error.statusCode = response.status;
    error.errorType = errorType;
    error.serviceName = serviceName;
    
    return error;
  }

  /**
   * Handle common connection errors
   * @param {Error} error - Original error
   * @param {string} serviceName - Name of the service
   * @returns {Error} - Enhanced error with suggestions
   */
  static handleConnectionError(error, serviceName) {
    const originalMessage = error.message;
    let enhancedMessage = originalMessage;
    
    // Add helpful suggestions based on error type
    if (originalMessage.includes('Failed to fetch') || 
        originalMessage.includes('NetworkError')) {
      enhancedMessage = `${originalMessage} - Please check your internet connection.`;
    } else if (originalMessage.includes('timeout')) {
      enhancedMessage = `${originalMessage} - The request timed out. Try again or check your network.`;
    } else if (originalMessage.includes('CORS')) {
      enhancedMessage = `${originalMessage} - This may be due to CORS policy restrictions.`;
    }
    
    // Create enhanced error
    const enhancedError = new Error(enhancedMessage);
    enhancedError.originalError = error;
    enhancedError.serviceName = serviceName;
    
    return enhancedError;
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
    console.error(`Error executing ${action} command:`, error);
    
    return {
      success: false,
      action,
      error: error.message,
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
    let errorMessage = error.message;
    
    // Provide more helpful information for common navigation errors
    if (errorMessage.includes('invalid URL')) {
      errorMessage = `Invalid URL format: ${url}. Please provide a complete URL including http:// or https://`;
    } else if (errorMessage.includes('NetworkError')) {
      errorMessage = `Network error while navigating to ${url}. The site may be unavailable.`;
    }
    
    return {
      success: false,
      action: 'navigate',
      url,
      error: errorMessage
    };
  }

  /**
   * Handle missing element errors
   * @param {string} action - Command action
   * @param {string} selector - Selector or XPath that failed
   * @returns {Object} - Standardized error result
   */
  static handleMissingElementError(action, selector) {
    return {
      success: false,
      action,
      error: `No element found matching: ${selector}`,
      selector
    };
  }
}

export { ApiErrorHandler, CommandErrorHandler };