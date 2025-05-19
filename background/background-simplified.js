/**
 * BrowserMagic.ai Background Script
 * Simplified version for fixing Module issues
 */

// Config stub
const config = {
  defaultProvider: 'mock',
  providers: {
    mock: {
      delayMs: 500
    }
  }
};

// Mock service manager (simplified)
const serviceManager = {
  currentProvider: 'mock',
  currentService: null,
  
  async initialize(provider = 'mock', config = {}) {
    console.log(`Initializing service with provider: ${provider}`);
    this.currentProvider = provider;
    return true;
  },
  
  async processPrompt(prompt, pageContext, sessionInfo = {}) {
    console.log(`Processing prompt: ${prompt.substring(0, 50)}...`);
    // Return mock command
    return {
      commands: [
        {
          action: "navigate",
          url: "https://example.com"
        }
      ],
      isComplete: true,
      completionMessage: "Mock service is responding with a simple command."
    };
  },
  
  getCurrentProvider() {
    return this.currentProvider;
  },
  
  async changeProvider(provider, config = {}) {
    return this.initialize(provider, config);
  }
};

// Store active tab information and conversation history
let activeTabId = null;
let sessionHistory = {
  initialPrompt: null,
  actionHistory: [],
  lastPageContext: null
};

// Initialize the service manager when the extension starts
(async function initializeServices() {
  try {
    // Load saved configuration from storage, if any
    chrome.storage.local.get(['provider', 'serviceConfig'], async (result) => {
      const savedProvider = result.provider || config.defaultProvider;
      const savedConfig = result.serviceConfig || config.providers[savedProvider] || {};
      
      const initialized = await serviceManager.initialize(savedProvider, savedConfig);
      
      if (initialized) {
        console.log(`Successfully initialized ${savedProvider} service.`);
      } else {
        console.warn(`Failed to initialize ${savedProvider} service. Using fallback.`);
      }
    });
  } catch (error) {
    console.error('Error initializing services:', error);
  }
})();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processPrompt') {
    handleUserPrompt(request.prompt, request.options || {})
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    
    // Return true to indicate we will respond asynchronously
    return true;
  } 
  
  // Handle request for a fast page snapshot
  else if (request.action === 'getPageSnapshot') {
    // Get current active tab if not already known
    if (!activeTabId) {
      chrome.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
          if (tabs && tabs.length > 0) {
            activeTabId = tabs[0].id;
            return takePageSnapshot(activeTabId, request.options);
          } else {
            throw new Error('No active tab found');
          }
        })
        .then(snapshot => sendResponse({ success: true, snapshot }))
        .catch(error => sendResponse({ error: error.message }));
    } else {
      takePageSnapshot(activeTabId, request.options)
        .then(snapshot => sendResponse({ success: true, snapshot }))
        .catch(error => sendResponse({ error: error.message }));
    }
    
    return true;
  }
  
  // Handle service configuration updates
  else if (request.action === 'updateServiceConfig') {
    updateServiceConfig(request.provider, request.config)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
  
  // Handle service provider changes
  else if (request.action === 'changeProvider') {
    changeServiceProvider(request.provider)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
});

// Listen for tab activation to keep track of the active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
});

/**
 * Handle the user's natural language prompt (simplified version)
 */
async function handleUserPrompt(prompt, options = {}) {
  try {
    // Get current active tab
    if (!activeTabId) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) throw new Error('No active tab found');
      activeTabId = tabs[0].id;
    }
    
    // Get page context (simplified)
    console.log('Getting page context for prompt processing');
    const pageContext = await takePageSnapshot(activeTabId);
    
    // Setup session history
    const isNewSession = !sessionHistory.initialPrompt || options.resetSession;
    if (isNewSession) {
      sessionHistory = {
        initialPrompt: prompt,
        actionHistory: [],
        lastPageContext: pageContext
      };
    }
    
    // Get commands from service manager (simplified)
    const structuredCommands = await serviceManager.processPrompt(prompt, pageContext, {
      initialPrompt: sessionHistory.initialPrompt,
      actionHistory: sessionHistory.actionHistory,
      isNewSession
    });
    
    // Execute commands (simplified)
    await chrome.tabs.sendMessage(activeTabId, {
      action: 'executeCommands',
      commands: structuredCommands.commands
    });
    
    // Return success response
    return { 
      success: true,
      isComplete: true,
      completionMessage: structuredCommands.completionMessage || 'Commands executed successfully'
    };
  } catch (error) {
    console.error('Error handling prompt:', error);
    throw error;
  }
}

/**
 * Takes a fast snapshot of a page (simplified)
 */
async function takePageSnapshot(tabId, options = {}) {
  try {
    console.log(`📸 Starting fast page snapshot for tab ${tabId}`);
    
    // Ensure the content script is injected
    const injected = await ensureContentScriptInjected(tabId);
    
    // Create a promise with timeout for the message
    return new Promise((resolve, reject) => {
      console.log(`📨 Sending fastSnapshot message to tab ${tabId}`);
      
      // Set up a timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Fast snapshot timed out.'));
      }, 5000);
      
      // Send the message to take snapshot
      chrome.tabs.sendMessage(
        tabId, 
        { 
          action: 'fastSnapshot',
          options: options
        }, 
        (response) => {
          // Clear the timeout when we get a response
          clearTimeout(timeoutId);
          
          // Check for error in the response
          if (chrome.runtime.lastError) {
            reject(new Error('Communication with page failed: ' + chrome.runtime.lastError.message));
            return;
          }
          
          // Check for error in the response data
          if (response && response.error) {
            reject(new Error(response.error));
            return;
          }
          
          if (response && response.success && response.snapshot) {
            resolve(response.snapshot);
          } else {
            reject(new Error('Failed to take page snapshot'));
          }
        }
      );
    });
  } catch (error) {
    console.error(`Error taking snapshot from tab ${tabId}:`, error);
    return null;
  }
}

/**
 * Ensure the content script is injected into the tab
 */
async function ensureContentScriptInjected(tabId) {
  try {
    console.log(`🔍 Checking content script in tab ${tabId}`);
    
    // Get tab information to check URL
    const tab = await chrome.tabs.get(tabId);
    
    // Check if it's a restricted URL that doesn't allow content script injection
    const url = tab.url || '';
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') || 
        url.startsWith('chrome-search://') ||
        url.startsWith('devtools://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url === 'chrome://newtab/') {
      throw new Error(`Cannot execute on this page (${url.split('/')[0]}//). Please navigate to a regular website.`);
    }
    
    // Try ping the content script to see if it's already injected
    const isContentScriptInjected = await new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
        if (chrome.runtime.lastError || !response || response.status !== 'alive') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
      
      // Add timeout for the ping check
      setTimeout(() => resolve(false), 1000);
    });
    
    if (isContentScriptInjected) {
      return true;
    }
    
    console.log(`💉 Content script not yet injected, injecting now in tab ${tabId}...`);
    
    // Inject the content script
    const injectionResult = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/content-bundled.js']
    });
    
    // Wait a moment for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error(`Error injecting content script to tab ${tabId}:`, error);
    return false;
  }
}

/**
 * Update the service configuration (simplified)
 */
async function updateServiceConfig(provider, newConfig) {
  try {
    // Save to storage
    await chrome.storage.local.set({
      provider: provider,
      serviceConfig: newConfig
    });
    
    // Update the service
    const success = await serviceManager.changeProvider(provider, newConfig);
    return success;
  } catch (error) {
    console.error('Error updating service config:', error);
    throw error;
  }
}

/**
 * Change the service provider (simplified)
 */
async function changeServiceProvider(provider) {
  try {
    // Get saved config for this provider, if any
    const result = await chrome.storage.local.get(['serviceConfig']);
    const savedConfig = result.serviceConfig || {};
    
    // Get default config for this provider
    const defaultConfig = config.providers[provider] || {};
    
    // Merge saved config with default config
    const providerConfig = { ...defaultConfig, ...savedConfig };
    
    // Update the service
    const success = await serviceManager.changeProvider(provider, providerConfig);
    
    if (success) {
      // Save the provider choice
      await chrome.storage.local.set({ provider });
    }
    
    return success;
  } catch (error) {
    console.error('Error changing service provider:', error);
    throw error;
  }
}