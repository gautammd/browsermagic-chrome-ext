/**
 * Service State Manager
 * Centralizes service configuration state management
 * Provides reactive access to service settings with proper synchronization
 */
import storageManager, { StorageKeys } from './storage-manager';
import { AppError, ErrorType } from '../../services/error-handler';

// Default service configurations
const defaultConfigurations = {
  groq: {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    maxTokens: 1024
  },
  openai: {
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 1024
  }
};

/**
 * Service State Manager
 * Manages service configurations and provider selection
 */
class ServiceStateManager {
  constructor() {
    // Default provider (used as fallback)
    this.defaultProvider = 'groq';
    
    // Current state (will be populated from storage)
    this.currentProvider = null;
    this.configurations = {};
    
    // Subscribers for state changes
    this.providerChangeListeners = [];
    this.configChangeListeners = {};
    
    // Set up storage subscriptions
    this.setupStorageSubscriptions();
    
    // Initialize state from storage
    this.initializeFromStorage();
  }

  /**
   * Set up storage change subscriptions
   */
  setupStorageSubscriptions() {
    // Subscribe to provider changes
    storageManager.subscribe(StorageKeys.PROVIDER, (newValue) => {
      this.currentProvider = newValue;
      this.notifyProviderChangeListeners();
    });
    
    // Subscribe to service config changes
    storageManager.subscribe(StorageKeys.SERVICE_CONFIG, (newValue) => {
      this.configurations = newValue || {};
      this.notifyConfigChangeListeners();
    });
  }

  /**
   * Initialize state from Chrome storage
   */
  async initializeFromStorage() {
    try {
      // Load provider
      const provider = await storageManager.loadData(StorageKeys.PROVIDER);
      this.currentProvider = provider || this.defaultProvider;
      
      // Load configurations
      const configs = await storageManager.loadData(StorageKeys.SERVICE_CONFIG);
      this.configurations = configs || { ...defaultConfigurations };
      
      // Ensure we have default configs for all providers
      Object.keys(defaultConfigurations).forEach(provider => {
        if (!this.configurations[provider]) {
          this.configurations[provider] = { ...defaultConfigurations[provider] };
        }
      });
      
      // Save defaults back to storage if needed
      if (!configs) {
        await storageManager.saveData(StorageKeys.SERVICE_CONFIG, this.configurations);
      }
      
      if (!provider) {
        await storageManager.saveData(StorageKeys.PROVIDER, this.currentProvider);
      }
      
      console.log('Service state initialized from storage');
    } catch (error) {
      console.error('Error initializing service state:', error);
      
      // Set defaults if we couldn't load from storage
      this.currentProvider = this.defaultProvider;
      this.configurations = { ...defaultConfigurations };
    }
  }

  /**
   * Get current provider
   * @returns {string} Current provider name
   */
  getProvider() {
    return this.currentProvider || this.defaultProvider;
  }

  /**
   * Get configuration for a specific provider
   * @param {string} provider - Provider name (optional, uses current if not specified)
   * @returns {Object} Provider configuration
   */
  getConfig(provider = null) {
    const targetProvider = provider || this.currentProvider || this.defaultProvider;
    return this.configurations[targetProvider] || { ...defaultConfigurations[targetProvider] };
  }

  /**
   * Change provider
   * @param {string} provider - New provider name
   * @returns {Promise<void>} Promise that resolves when provider is changed
   */
  async changeProvider(provider) {
    if (!provider || !defaultConfigurations[provider]) {
      throw new AppError(`Invalid provider: ${provider}`, {
        type: ErrorType.VALIDATION,
        source: 'service-state',
        data: { provider }
      });
    }
    
    try {
      // Save to storage
      await storageManager.saveData(StorageKeys.PROVIDER, provider);
      
      // Update local state
      this.currentProvider = provider;
      
      // Notify listeners
      this.notifyProviderChangeListeners();
      
      return true;
    } catch (error) {
      console.error('Error changing provider:', error);
      throw error;
    }
  }

  /**
   * Update configuration for a provider
   * @param {string} provider - Provider name
   * @param {Object} config - New configuration
   * @returns {Promise<void>} Promise that resolves when config is updated
   */
  async updateConfig(provider, config) {
    if (!provider || !defaultConfigurations[provider]) {
      throw new AppError(`Invalid provider: ${provider}`, {
        type: ErrorType.VALIDATION,
        source: 'service-state',
        data: { provider }
      });
    }
    
    try {
      // Merge with existing config
      const newConfig = {
        ...this.configurations[provider],
        ...config
      };
      
      // Create updated configurations object
      const updatedConfigs = {
        ...this.configurations,
        [provider]: newConfig
      };
      
      // Save to storage
      await storageManager.saveData(StorageKeys.SERVICE_CONFIG, updatedConfigs);
      
      // Update local state
      this.configurations = updatedConfigs;
      
      // Notify listeners
      this.notifyConfigChangeListeners(provider);
      
      return true;
    } catch (error) {
      console.error(`Error updating config for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to provider changes
   * @param {Function} callback - Callback function when provider changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToProviderChange(callback) {
    this.providerChangeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.providerChangeListeners = this.providerChangeListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to configuration changes for a specific provider
   * @param {string} provider - Provider name to watch
   * @param {Function} callback - Callback function when config changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToConfigChange(provider, callback) {
    if (!this.configChangeListeners[provider]) {
      this.configChangeListeners[provider] = [];
    }
    
    this.configChangeListeners[provider].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.configChangeListeners[provider] = this.configChangeListeners[provider].filter(cb => cb !== callback);
      if (this.configChangeListeners[provider].length === 0) {
        delete this.configChangeListeners[provider];
      }
    };
  }

  /**
   * Notify all provider change listeners
   */
  notifyProviderChangeListeners() {
    this.providerChangeListeners.forEach(listener => {
      try {
        listener(this.currentProvider);
      } catch (error) {
        console.error('Error in provider change listener:', error);
      }
    });
  }

  /**
   * Notify all config change listeners
   * @param {string} provider - Specific provider that changed (optional)
   */
  notifyConfigChangeListeners(provider = null) {
    // If a specific provider changed
    if (provider && this.configChangeListeners[provider]) {
      this.configChangeListeners[provider].forEach(listener => {
        try {
          listener(this.configurations[provider]);
        } catch (error) {
          console.error(`Error in config change listener for ${provider}:`, error);
        }
      });
    }
    
    // Also notify listeners for all configs
    if (this.configChangeListeners['all']) {
      this.configChangeListeners['all'].forEach(listener => {
        try {
          listener(this.configurations);
        } catch (error) {
          console.error('Error in global config change listener:', error);
        }
      });
    }
  }

  /**
   * Get supported providers
   * @returns {Array<string>} Array of supported provider names
   */
  getSupportedProviders() {
    return Object.keys(defaultConfigurations);
  }

  /**
   * Get default configuration for a provider
   * @param {string} provider - Provider name
   * @returns {Object} Default configuration
   */
  getDefaultConfig(provider) {
    return defaultConfigurations[provider] || {};
  }

  /**
   * Reset configuration for a provider to default
   * @param {string} provider - Provider name
   * @returns {Promise<void>} Promise that resolves when config is reset
   */
  async resetConfigToDefault(provider) {
    if (!provider || !defaultConfigurations[provider]) {
      throw new AppError(`Invalid provider: ${provider}`, {
        type: ErrorType.VALIDATION,
        source: 'service-state',
        data: { provider }
      });
    }
    
    return this.updateConfig(provider, defaultConfigurations[provider]);
  }
}

// Create and export a singleton instance
const serviceState = new ServiceStateManager();
export default serviceState;