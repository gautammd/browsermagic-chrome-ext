/**
 * Save settings to chrome.storage.local
 * @param {Object} settings - The settings object to save
 * @returns {Promise} - A promise that resolves when the settings are saved
 */
export const saveSettings = (settings) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ settings }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get settings from chrome.storage.local
 * @returns {Promise<Object>} - A promise that resolves with the settings object
 */
export const getSettings = () => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get('settings', (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result.settings);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};