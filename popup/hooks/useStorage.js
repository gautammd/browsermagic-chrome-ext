/**
 * Hook for interacting with Chrome's storage API
 */
export const useStorage = () => {
  /**
   * Save data to Chrome's local storage
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @returns {Promise} Promise that resolves when data is saved
   */
  const saveData = (key, data) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [key]: data }, () => {
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
   * Load data from Chrome's local storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} Promise that resolves with the stored data
   */
  const loadData = (key) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(key, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result[key]);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Remove data from Chrome's local storage
   * @param {string} key - Storage key
   * @returns {Promise} Promise that resolves when data is removed
   */
  const removeData = (key) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove(key, () => {
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

  return {
    saveData,
    loadData,
    removeData
  };
};

// Specific functions for saving/loading settings
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