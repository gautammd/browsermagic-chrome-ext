/**
 * Hook for communicating with the extension's background script
 */
export const useBackgroundMessaging = () => {
  /**
   * Send a message to the background script
   * @param {string} action - The action to perform
   * @param {object} data - Additional data to send
   * @returns {Promise<any>} - Response from the background script
   */
  const sendMessage = (action, data = {}) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          { action, ...data },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response && response.error) {
              reject(new Error(response.error));
              return;
            }
            
            resolve(response);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Process a prompt using the background script
   * @param {string} prompt - The prompt to process
   * @param {object} settings - Provider settings
   * @returns {Promise<object>} - Response from background script
   */
  const processPrompt = (prompt, settings) => {
    return sendMessage('processPrompt', { prompt, settings });
  };

  /**
   * Test connection to provider
   * @param {object} settings - Provider settings
   * @returns {Promise<object>} - Response from background script
   */
  const testConnection = (settings) => {
    return sendMessage('testConnection', { settings });
  };

  /**
   * Update service configuration
   * @param {string} provider - Provider name
   * @param {object} config - Provider configuration
   * @returns {Promise<object>} - Response from background script
   */
  const updateServiceConfig = (provider, config) => {
    return sendMessage('updateServiceConfig', { provider, config });
  };

  return {
    sendMessage,
    processPrompt,
    testConnection,
    updateServiceConfig
  };
};

export default useBackgroundMessaging;