/**
 * State Management System
 * Exports all state managers for use in components
 */
import storageManager, { StorageKeys } from './storage-manager';
import serviceState from './service-state';
import historyManager from './history-manager';

// Export individual state managers
export {
  storageManager,
  StorageKeys,
  serviceState,
  historyManager
};

// Export a combined state API
const state = {
  storage: storageManager,
  service: serviceState,
  history: historyManager
};

export default state;