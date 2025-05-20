/**
 * Centralized configuration system for BrowserMagic
 * Manages application-wide settings and defaults
 */

import { Logger, LOG_LEVELS } from './logger';

// Service configuration defaults
const serviceDefaults = {
  // LLM provider settings
  providers: {
    groq: {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 1024,
      apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    },
    openai: {
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1024,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    },
  },
  
  // Default provider to use
  defaultProvider: 'groq',
  
  // API request settings
  request: {
    timeout: 30000,
    retries: 2,
    retryDelay: 1000,
  },
};

// UI configuration defaults
const uiDefaults = {
  // Theme settings
  theme: {
    colors: {
      primary: '#7C3AED',
      secondary: '#4F46E5',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: {
        primary: '#1F2937',
        secondary: '#4B5563',
        tertiary: '#9CA3AF',
      },
      border: '#E5E7EB',
      divider: '#F3F4F6',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    radius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
  },
  
  // Layout settings
  layout: {
    sidebarWidth: '320px',
    headerHeight: '60px',
    footerHeight: '40px',
  },
  
  // Animation settings
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
  },
};

// App configuration defaults
const appDefaults = {
  // Feature flags
  features: {
    promptHistory: true,
    notificationsEnabled: true,
    debugMode: process.env.NODE_ENV !== 'production',
    detailedApiLogging: true, // Enable logging of detailed API requests and responses
  },
  
  // Environment settings
  environment: {
    isDevelopment: process.env.NODE_ENV !== 'production',
    version: chrome.runtime.getManifest().version,
  },
  
  // Storage settings
  storage: {
    historyLimit: 50,
    keyPrefix: 'browsermagic_',
  },
  
  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG,
    enableTimestamps: true,
    prefix: '🔮',
  },
};

// Merge all default configurations
const defaultConfig = {
  service: serviceDefaults,
  ui: uiDefaults,
  app: appDefaults,
};

/**
 * Configuration system for the application
 */
class Config {
  constructor() {
    this.config = { ...defaultConfig };
    
    // Initialize logger with config
    this.initializeLogger();
  }
  
  /**
   * Initialize the logger with the configuration
   */
  initializeLogger() {
    const logConfig = this.get('app.logging');
    Logger.configure(logConfig);
    Logger.debug('Logger initialized');
  }
  
  /**
   * Get a configuration value
   * @param {string} path - Dot notation path to the config value
   * @param {*} fallback - Fallback value if the path is not found
   * @returns {*} - The config value or fallback
   */
  get(path, fallback = undefined) {
    const parts = path.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        return fallback;
      }
    }
    
    return current;
  }
  
  /**
   * Set a configuration value
   * @param {string} path - Dot notation path to the config value
   * @param {*} value - Value to set
   */
  set(path, value) {
    const parts = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    
    // Re-initialize logger if logging settings change
    if (path.startsWith('app.logging')) {
      this.initializeLogger();
    }
  }
  
  /**
   * Get all configuration values
   * @returns {Object} - Complete configuration object
   */
  getAll() {
    return { ...this.config };
  }
  
  /**
   * Get a specific section of the configuration
   * @param {string} section - The config section (service, ui, app)
   * @returns {Object} - Configuration section
   */
  getSection(section) {
    return { ...this.config[section] };
  }
  
  /**
   * Update a section of the configuration
   * @param {string} section - The config section (service, ui, app)
   * @param {Object} values - Values to update
   */
  updateSection(section, values) {
    this.config[section] = {
      ...this.config[section],
      ...values,
    };
    
    // Re-initialize logger if app section is updated
    if (section === 'app') {
      this.initializeLogger();
    }
  }
  
  /**
   * Reset the configuration to defaults
   */
  resetToDefaults() {
    this.config = { ...defaultConfig };
    this.initializeLogger();
  }
}

// Create and export a singleton instance
const config = new Config();
export default config;