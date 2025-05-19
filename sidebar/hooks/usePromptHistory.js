import { useState, useEffect } from 'react';
import { useStorage } from './useStorage';

/**
 * Hook for managing prompt history
 * @param {number} limit - Maximum number of history items to keep
 */
export const usePromptHistory = (limit = 10) => {
  const [history, setHistory] = useState([]);
  const { saveData, loadData } = useStorage();
  const STORAGE_KEY = 'promptHistory';

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await loadData(STORAGE_KEY);
        if (savedHistory) {
          setHistory(savedHistory);
        }
      } catch (error) {
        console.error('Error loading prompt history:', error);
      }
    };
    
    loadHistory();
  }, []);

  /**
   * Add a new prompt to history
   * @param {string} text - The prompt text to save
   */
  const addToHistory = async (text) => {
    // Skip if empty or duplicate of most recent
    if (
      text.trim() === '' || 
      (history.length > 0 && history[0].text === text)
    ) {
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [newItem, ...history].slice(0, limit);
    setHistory(updatedHistory);
    
    try {
      await saveData(STORAGE_KEY, updatedHistory);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  /**
   * Clear all history items
   */
  const clearHistory = async () => {
    setHistory([]);
    try {
      await saveData(STORAGE_KEY, []);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  /**
   * Get the most recent history item
   */
  const getLatest = () => {
    return history.length > 0 ? history[0] : null;
  };

  return {
    history,
    addToHistory,
    clearHistory,
    getLatest
  };
};

export default usePromptHistory;