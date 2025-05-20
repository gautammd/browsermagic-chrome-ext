/**
 * Prompt History Manager
 * Centralizes prompt history management with proper synchronization
 */
import storageManager, { StorageKeys } from './storage-manager';
import { AppError, ErrorType } from '../../services/error-handler';

/**
 * History item structure
 * @typedef {Object} HistoryItem
 * @property {string} id - Unique identifier
 * @property {string} text - Prompt text
 * @property {string} timestamp - ISO timestamp
 * @property {string} [provider] - Provider used (optional)
 * @property {boolean} [success] - Whether the prompt was successful (optional)
 */

/**
 * Prompt History Manager
 * Manages prompt history with proper storage synchronization
 */
class HistoryManager {
  constructor() {
    // Default configuration
    this.maxHistoryItems = 50;
    
    // Current state (will be populated from storage)
    this.history = [];
    
    // Change listeners
    this.changeListeners = [];
    
    // Set up storage subscription
    this.setupStorageSubscription();
    
    // Initialize from storage
    this.initializeFromStorage();
  }

  /**
   * Set up storage change subscription
   */
  setupStorageSubscription() {
    storageManager.subscribe(StorageKeys.PROMPT_HISTORY, (newValue) => {
      this.history = newValue || [];
      this.notifyChangeListeners();
    });
  }

  /**
   * Initialize history from storage
   */
  async initializeFromStorage() {
    try {
      const history = await storageManager.loadData(StorageKeys.PROMPT_HISTORY);
      this.history = history || [];
    } catch (error) {
      console.error('Error loading prompt history:', error);
      this.history = [];
    }
  }

  /**
   * Get all history items
   * @returns {Array<HistoryItem>} Array of history items
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Add item to history
   * @param {string} text - Prompt text
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<HistoryItem>} Promise that resolves to the added item
   */
  async addToHistory(text, metadata = {}) {
    if (!text || text.trim() === '') {
      throw new AppError('Cannot add empty prompt to history', {
        type: ErrorType.VALIDATION,
        source: 'history-manager'
      });
    }
    
    // Skip if the new text is identical to the most recent item
    if (this.history.length > 0 && this.history[0].text === text) {
      return this.history[0];
    }
    
    // Create new history item
    const newItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    // Add to beginning of array and limit length
    const updatedHistory = [newItem, ...this.history].slice(0, this.maxHistoryItems);
    
    try {
      // Save to storage
      await storageManager.saveData(StorageKeys.PROMPT_HISTORY, updatedHistory);
      
      // Update local state (will be updated by storage listener, but set it for immediate response)
      this.history = updatedHistory;
      
      return newItem;
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  }

  /**
   * Update an existing history item
   * @param {string} id - Item ID to update
   * @param {Object} updates - Properties to update
   * @returns {Promise<HistoryItem>} Promise that resolves to the updated item
   */
  async updateHistoryItem(id, updates) {
    const itemIndex = this.history.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      throw new AppError(`History item not found: ${id}`, {
        type: ErrorType.VALIDATION,
        source: 'history-manager',
        data: { id }
      });
    }
    
    // Create updated item
    const updatedItem = {
      ...this.history[itemIndex],
      ...updates
    };
    
    // Create updated history array
    const updatedHistory = [...this.history];
    updatedHistory[itemIndex] = updatedItem;
    
    try {
      // Save to storage
      await storageManager.saveData(StorageKeys.PROMPT_HISTORY, updatedHistory);
      
      // Update local state
      this.history = updatedHistory;
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating history item:', error);
      throw error;
    }
  }

  /**
   * Clear all history
   * @returns {Promise<void>} Promise that resolves when history is cleared
   */
  async clearHistory() {
    try {
      // Save empty array to storage
      await storageManager.saveData(StorageKeys.PROMPT_HISTORY, []);
      
      // Update local state
      this.history = [];
      
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Delete a specific history item
   * @param {string} id - Item ID to delete
   * @returns {Promise<boolean>} Promise that resolves to success flag
   */
  async deleteHistoryItem(id) {
    const updatedHistory = this.history.filter(item => item.id !== id);
    
    // If no items were removed, the ID didn't exist
    if (updatedHistory.length === this.history.length) {
      return false;
    }
    
    try {
      // Save to storage
      await storageManager.saveData(StorageKeys.PROMPT_HISTORY, updatedHistory);
      
      // Update local state
      this.history = updatedHistory;
      
      return true;
    } catch (error) {
      console.error('Error deleting history item:', error);
      throw error;
    }
  }

  /**
   * Subscribe to history changes
   * @param {Function} callback - Callback function when history changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToChanges(callback) {
    this.changeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.changeListeners = this.changeListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all change listeners
   */
  notifyChangeListeners() {
    this.changeListeners.forEach(listener => {
      try {
        listener(this.history);
      } catch (error) {
        console.error('Error in history change listener:', error);
      }
    });
  }

  /**
   * Get most recent history item
   * @returns {HistoryItem|null} Most recent history item or null if history is empty
   */
  getLatestItem() {
    return this.history.length > 0 ? this.history[0] : null;
  }

  /**
   * Set maximum number of history items to keep
   * @param {number} maxItems - Maximum number of items
   */
  setMaxHistoryItems(maxItems) {
    if (typeof maxItems !== 'number' || maxItems < 1) {
      throw new AppError('Invalid max history items value', {
        type: ErrorType.VALIDATION,
        source: 'history-manager',
        data: { maxItems }
      });
    }
    
    this.maxHistoryItems = maxItems;
    
    // If current history exceeds new max, trim it
    if (this.history.length > maxItems) {
      this.history = this.history.slice(0, maxItems);
      storageManager.saveData(StorageKeys.PROMPT_HISTORY, this.history)
        .catch(error => console.error('Error trimming history:', error));
    }
  }
}

// Create and export a singleton instance
const historyManager = new HistoryManager();
export default historyManager;