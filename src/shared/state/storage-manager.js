/**
 * Enhanced Storage Manager
 * Provides a reactive storage system with change listeners
 * Centralizes data storage operations with consistent error handling
 */
import { AppError, ErrorType } from '../../services/error-handler';

// Storage keys used by the application
export const StorageKeys = {
  SETTINGS: 'settings',
  PROVIDER: 'provider',
  SERVICE_CONFIG: 'serviceConfig',
  PROMPT_HISTORY: 'promptHistory'
};

/**
 * Storage Manager for consistent storage operations
 * Provides a middleware-like pattern for storage operations
 */
class StorageManager {
  constructor() {
    this.listeners = {};
    this.registeredKeys = new Set(Object.values(StorageKeys));
    this.setupStorageListener();
  }

  /**
   * Setup the storage change listener
   * Listens for changes in chrome.storage.local and notifies subscribers
   */
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      
      // Process each changed key
      Object.keys(changes).forEach(key => {
        const change = changes[key];
        
        // Skip if we don't have listeners for this key
        if (!this.listeners[key]) return;
        
        // Notify all listeners for this key
        this.listeners[key].forEach(listener => {
          try {
            listener(change.newValue, change.oldValue);
          } catch (error) {
            console.error(`Error in storage listener for key ${key}:`, error);
          }
        });
      });
    });
  }

  /**
   * Save data to Chrome's local storage
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @returns {Promise<void>} - Promise that resolves when data is saved
   */
  saveData(key, data) {
    return new Promise((resolve, reject) => {
      try {
        // Validate key if it's a registered key
        if (this.registeredKeys.has(key)) {
          // Add any validation logic here
        }
        
        // Store the data
        chrome.storage.local.set({ [key]: data }, () => {
          if (chrome.runtime.lastError) {
            const error = new AppError(`Failed to save data: ${chrome.runtime.lastError.message}`, {
              type: ErrorType.STORAGE,
              source: 'storage-manager',
              data: { key }
            });
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        const appError = new AppError(`Error saving data: ${error.message}`, {
          type: ErrorType.STORAGE,
          source: 'storage-manager',
          originalError: error,
          data: { key }
        });
        reject(appError);
      }
    });
  }

  /**
   * Load data from Chrome's local storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} - Promise that resolves with the stored data
   */
  loadData(key) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(key, (result) => {
          if (chrome.runtime.lastError) {
            const error = new AppError(`Failed to load data: ${chrome.runtime.lastError.message}`, {
              type: ErrorType.STORAGE,
              source: 'storage-manager',
              data: { key }
            });
            reject(error);
          } else {
            resolve(result[key]);
          }
        });
      } catch (error) {
        const appError = new AppError(`Error loading data: ${error.message}`, {
          type: ErrorType.STORAGE,
          source: 'storage-manager',
          originalError: error,
          data: { key }
        });
        reject(appError);
      }
    });
  }

  /**
   * Remove data from Chrome's local storage
   * @param {string} key - Storage key
   * @returns {Promise<void>} Promise that resolves when data is removed
   */
  removeData(key) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove(key, () => {
          if (chrome.runtime.lastError) {
            const error = new AppError(`Failed to remove data: ${chrome.runtime.lastError.message}`, {
              type: ErrorType.STORAGE,
              source: 'storage-manager',
              data: { key }
            });
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        const appError = new AppError(`Error removing data: ${error.message}`, {
          type: ErrorType.STORAGE,
          source: 'storage-manager',
          originalError: error,
          data: { key }
        });
        reject(appError);
      }
    });
  }

  /**
   * Subscribe to changes for a specific key
   * @param {string} key - Storage key to watch
   * @param {Function} callback - Callback function when the key changes
   * @returns {Function} - Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    
    this.listeners[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
      if (this.listeners[key].length === 0) {
        delete this.listeners[key];
      }
    };
  }

  /**
   * Batch update multiple storage keys at once
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {Promise<void>} - Promise that resolves when all updates are saved
   */
  batchUpdate(updates) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(updates, () => {
          if (chrome.runtime.lastError) {
            const error = new AppError(`Failed to batch update: ${chrome.runtime.lastError.message}`, {
              type: ErrorType.STORAGE,
              source: 'storage-manager',
              data: { keys: Object.keys(updates) }
            });
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        const appError = new AppError(`Error in batch update: ${error.message}`, {
          type: ErrorType.STORAGE,
          source: 'storage-manager',
          originalError: error,
          data: { keys: Object.keys(updates) }
        });
        reject(appError);
      }
    });
  }
}

// Create and export a singleton instance
const storageManager = new StorageManager();
export default storageManager;