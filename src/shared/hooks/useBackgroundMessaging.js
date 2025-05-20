import { useState, useCallback, useEffect } from 'react';

/**
 * Enhanced hook for communicating with the extension's background script
 * Includes retry logic, timeout handling, and progress tracking
 */
export const useBackgroundMessaging = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    stage: 'preparing',
    message: '',
    progress: 0,
    steps: [
      { id: 'preparing', label: 'Preparing' },
      { id: 'sending', label: 'Sending' },
      { id: 'processing', label: 'Processing' },
      { id: 'executing', label: 'Executing' },
      { id: 'complete', label: 'Complete' }
    ]
  });

  /**
   * Listen for progress updates from the background script
   */
  useEffect(() => {
    const progressListener = (message) => {
      if (message.action === 'progressUpdate' && message.progress) {
        setProgress(message.progress);
      }
    };
    
    // Add listener
    chrome.runtime.onMessage.addListener(progressListener);
    
    // Cleanup
    return () => {
      chrome.runtime.onMessage.removeListener(progressListener);
    };
  }, []);

  /**
   * Send a message to the background script with retry capability
   * @param {string} action - The action to perform
   * @param {object} data - Additional data to send
   * @param {object} options - Options for the request
   * @param {number} options.timeout - Timeout in milliseconds
   * @param {number} options.retries - Number of retries
   * @returns {Promise<any>} - Response from the background script
   */
  const sendMessage = useCallback((
    action, 
    data = {}, 
    options = { timeout: 30000, retries: 1 }
  ) => {
    setIsLoading(true);
    setError(null);
    
    // Reset progress state for new requests
    if (action === 'processPrompt') {
      setProgress({
        stage: 'preparing',
        message: 'Starting request...',
        progress: 0
      });
    }
    
    return new Promise((resolve, reject) => {
      const { timeout, retries } = options;
      let attempts = 0;
      
      // Create a function we can retry
      const attemptSend = () => {
        attempts++;
        
        // Create a timeout
        const timeoutId = timeout 
          ? setTimeout(() => {
              const timeoutError = new Error(`Request timed out after ${timeout}ms`);
              timeoutError.isTimeout = true;
              handleError(timeoutError);
            }, timeout) 
          : null;
            
        try {
          chrome.runtime.sendMessage(
            { action, ...data },
            (response) => {
              // Clear timeout if it exists
              if (timeoutId) clearTimeout(timeoutId);
              
              // Handle Chrome runtime errors
              if (chrome.runtime.lastError) {
                const runtimeError = new Error(chrome.runtime.lastError.message);
                runtimeError.isRuntimeError = true;
                
                if (attempts <= retries) {
                  console.warn(`Retrying after runtime error (attempt ${attempts}/${retries + 1})`);
                  return attemptSend();
                } else {
                  return handleError(runtimeError);
                }
              }
              
              // Handle explicit error in response
              if (response && response.error) {
                const responseError = new Error(response.error);
                responseError.isResponseError = true;
                
                // Update progress with error state
                if (action === 'processPrompt') {
                  setProgress({
                    stage: 'error',
                    message: `Error: ${response.error}`,
                    progress: 0
                  });
                }
                
                return handleError(responseError);
              }
              
              // Success!
              setIsLoading(false);
              
              // Set complete progress for successful requests
              if (action === 'processPrompt') {
                setProgress({
                  stage: 'complete',
                  message: response.completionMessage || 'Completed successfully',
                  progress: 100
                });
              }
              
              resolve(response);
            }
          );
        } catch (error) {
          // Clear timeout if it exists
          if (timeoutId) clearTimeout(timeoutId);
          
          // Try again or handle error
          if (attempts <= retries) {
            console.warn(`Retrying after exception (attempt ${attempts}/${retries + 1})`);
            attemptSend();
          } else {
            handleError(error);
          }
        }
      };
      
      // Handler for errors
      const handleError = (error) => {
        console.error(`Error in background messaging (${action}):`, error);
        setIsLoading(false);
        setError(error);
        
        // Update progress with error state for prompt processing
        if (action === 'processPrompt') {
          setProgress({
            stage: 'error',
            message: `Error: ${error.message}`,
            progress: 0
          });
        }
        
        reject(error);
      };
      
      // Start the first attempt
      attemptSend();
    });
  }, []);

  /**
   * Process a prompt using the background script
   * @param {string} prompt - The prompt to process
   * @param {object} options - Options including settings and retry options
   * @returns {Promise<object>} - Response from background script
   */
  const processPrompt = (prompt, options = {}) => {
    const { settings, timeout, retries, ...rest } = options;
    return sendMessage(
      'processPrompt', 
      { prompt, options: { settings, ...rest } },
      { timeout: timeout || 60000, retries: retries || 1 } // LLM requests need longer timeout
    );
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
   * @param {object} features - Feature flags
   * @returns {Promise<object>} - Response from background script
   */
  const updateServiceConfig = (provider, config, features) => {
    return sendMessage('updateServiceConfig', { provider, config, features });
  };

  /**
   * Get a page snapshot via the background script
   * @param {object} options - Options for the snapshot
   * @returns {Promise<object>} - The page snapshot
   */
  const getPageSnapshot = (options = {}) => {
    return sendMessage('getPageSnapshot', { options });
  };

  return {
    sendMessage,
    processPrompt,
    testConnection,
    updateServiceConfig,
    getPageSnapshot,
    isLoading,
    error,
    progress
  };
};

export default useBackgroundMessaging;