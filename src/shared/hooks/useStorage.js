import { useState, useEffect } from 'react';

/**
 * Enhanced hook for interacting with Chrome's storage API with change notification
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

/**
 * Hook to watch a specific key in Chrome storage
 * @param {string} key - The storage key to watch
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {[any, function]} The value and a function to update it
 */
export const useStorageState = (key, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue);
  const { saveData, loadData } = useStorage();
  
  // Load initial value
  useEffect(() => {
    const fetchValue = async () => {
      try {
        const storedValue = await loadData(key);
        if (storedValue !== undefined) {
          setValue(storedValue);
        }
      } catch (error) {
        console.error(`Error loading ${key} from storage:`, error);
      }
    };
    
    fetchValue();
    
    // Set up storage change listener
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes[key]) {
        setValue(changes[key].newValue);
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    // Clean up
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key]);
  
  // Update function
  const updateValue = async (newValue) => {
    try {
      await saveData(key, newValue);
      setValue(newValue);
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      return false;
    }
  };
  
  return [value, updateValue];
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