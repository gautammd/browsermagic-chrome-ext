/**
 * BrowserMagic.ai - Background API
 * Provides a set of functions for interacting with the extension
 */

// Initialize the service manager when the extension starts
chrome.runtime.onInstalled.addListener(() => {
  console.log('BrowserMagic.ai extension installed');
});

// Simple API functions for external communication
const api = {
  /**
   * Process a natural language prompt
   * @param {string} prompt - The user's natural language instructions
   * @param {Object} options - Options for processing the prompt
   * @returns {Promise<Object>} - Command execution result
   */
  processPrompt: async (prompt, options = {}) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'processPrompt', prompt, options },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  },
  
  /**
   * Get a snapshot of the current page
   * @param {Object} options - Options for the snapshot
   * @returns {Promise<Object>} - Page snapshot
   */
  getPageSnapshot: async (options = {}) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'getPageSnapshot', options },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.snapshot);
          }
        }
      );
    });
  },
  
  /**
   * Update the service configuration
   * @param {string} provider - The service provider to update
   * @param {Object} config - The new configuration
   * @returns {Promise<boolean>} - True if update was successful
   */
  updateServiceConfig: async (provider, config) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'updateServiceConfig', provider, config },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.success);
          }
        }
      );
    });
  },
  
  /**
   * Change the service provider
   * @param {string} provider - The new service provider to use
   * @returns {Promise<boolean>} - True if provider change was successful
   */
  changeProvider: async (provider) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'changeProvider', provider },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.success);
          }
        }
      );
    });
  }
};

// Export the API
export default api;