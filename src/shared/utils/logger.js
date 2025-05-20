/**
 * Simple logging utility with configurable levels
 * Replaces direct console.log calls with a more structured logging system
 */

// Define log levels with numeric values for comparison
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Default configuration
let config = {
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG,
  enableTimestamps: true,
  prefix: '🔮'
};

/**
 * The Logger class provides static methods for different log levels
 */
class Logger {
  /**
   * Configure the logger
   * @param {Object} options - Configuration options
   * @param {string} options.level - Minimum log level to display
   * @param {boolean} options.enableTimestamps - Whether to include timestamps
   * @param {string} options.prefix - Prefix for all log messages
   */
  static configure(options = {}) {
    config = { ...config, ...options };
  }

  /**
   * Get the current configuration
   * @returns {Object} Current logger configuration
   */
  static getConfig() {
    return { ...config };
  }

  /**
   * Format a log message with timestamp and prefix if enabled
   * @param {string} message - The message to format
   * @returns {string} Formatted message
   */
  static _formatMessage(message) {
    let formattedMessage = '';
    
    if (config.prefix) {
      formattedMessage += `${config.prefix} `;
    }
    
    if (config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formattedMessage += `[${timestamp}] `;
    }
    
    formattedMessage += message;
    return formattedMessage;
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static debug(message, ...args) {
    if (config.level <= LOG_LEVELS.DEBUG) {
      console.debug(this._formatMessage(message), ...args);
    }
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static info(message, ...args) {
    if (config.level <= LOG_LEVELS.INFO) {
      console.info(this._formatMessage(message), ...args);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static warn(message, ...args) {
    if (config.level <= LOG_LEVELS.WARN) {
      console.warn(this._formatMessage(message), ...args);
    }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static error(message, ...args) {
    if (config.level <= LOG_LEVELS.ERROR) {
      console.error(this._formatMessage(message), ...args);
    }
  }

  /**
   * Log a message only in development mode
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static dev(message, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this._formatMessage(`[DEV] ${message}`), ...args);
    }
  }
}

// Export both the Logger class and LOG_LEVELS enum
export { Logger, LOG_LEVELS };
export default Logger;