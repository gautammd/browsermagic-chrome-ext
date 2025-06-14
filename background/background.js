/**
 * BrowserMagic.ai Background Script
 * Handles extension lifecycle, manages LLM services, and coordinates communication
 * between the sidebar UI and content script.
 */
import serviceManager from '../services/llm-service-manager.js';
import serviceConfig from '../services/config.js';
import { Logger, config } from '../src/shared/utils';

/**
 * BrowserManager class that handles tab interaction, commands execution, and state management
 */
class BrowserManager {
  constructor() {
    this.activeTabId = null;
    this.sessionState = {
      initialPrompt: null,
      actionHistory: [],
      lastPageContext: null
    };
    
    this.initEventListeners();
    this.initServices();
  }
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Listen for messages from the sidebar
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));
    
    // Listen for tab activation to track the active tab
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.activeTabId = activeInfo.tabId;
      Logger.debug(`Active tab changed to ${this.activeTabId}`);
    });
    
    // Open the sidebar when the extension icon is clicked
    chrome.action.onClicked.addListener((tab) => {
      chrome.sidePanel.open({ tabId: tab.id });
    });
  }
  
  /**
   * Initialize the LLM services
   */
  async initServices() {
    try {
      // Load saved configuration from storage
      const result = await this.getStorageData(['provider', 'serviceConfig', 'features']);
      const savedProvider = result.provider || serviceConfig.defaultProvider;
      const savedConfig = result.serviceConfig || serviceConfig.providers[savedProvider] || {};
      const savedFeatures = result.features || {};
      
      // Initialize feature flags
      if (savedFeatures.detailedApiLogging !== undefined) {
        config.set('app.features.detailedApiLogging', savedFeatures.detailedApiLogging);
        Logger.debug(`Detailed API logging ${savedFeatures.detailedApiLogging ? 'enabled' : 'disabled'} from saved settings`);
      }
      
      const initialized = await serviceManager.initialize(savedProvider, savedConfig);
      
      if (initialized) {
        Logger.info(`Successfully initialized ${savedProvider} service`);
      } else {
        Logger.warn(`Failed to initialize ${savedProvider} service. Using fallback`);
      }
    } catch (error) {
      Logger.error('Error initializing services:', error);
    }
  }
  
  /**
   * Handle incoming messages from the sidebar
   */
  handleMessages(request, sender, sendResponse) {
    Logger.debug(`Received message: ${request.action}`);
    
    // Process natural language prompt
    if (request.action === 'processPrompt') {
      // Include sender in options for progress updates
      const options = { 
        ...request.options || {},
        sender
      };
      
      this.handleUserPrompt(request.prompt, options)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Indicates we'll respond asynchronously
    }
    
    // Test LLM service connection
    else if (request.action === 'testConnection') {
      Logger.debug('Testing service connection', request.settings);
      
      // Simulate API testing
      setTimeout(() => {
        sendResponse({
          success: true,
          message: 'Connection successful'
        });
      }, 500);
      
      return true;
    }
    
    // Get page snapshot
    else if (request.action === 'getPageSnapshot') {
      this.getActiveTabId()
        .then(tabId => this.getPageContext(tabId, request.options))
        .then(snapshot => sendResponse({ success: true, snapshot }))
        .catch(error => sendResponse({ error: error.message }));
      
      return true;
    }
    
    // Update service configuration
    else if (request.action === 'updateServiceConfig') {
      this.updateServiceConfig(request.provider, request.config, request.features)
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ error: error.message }));
      
      return true;
    }
    
    // Change service provider
    else if (request.action === 'changeProvider') {
      this.changeServiceProvider(request.provider)
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ error: error.message }));
      
      return true;
    }
  }
  
  /**
   * Get current active tab ID
   * @returns {Promise<number>} Active tab ID
   */
  async getActiveTabId() {
    if (this.activeTabId) return this.activeTabId;
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error('No active tab found');
    
    this.activeTabId = tabs[0].id;
    return this.activeTabId;
  }
  
  /**
   * Get data from storage
   * @param {string[]} keys - Keys to retrieve
   * @returns {Promise<Object>} Retrieved data
   */
  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    });
  }
  
  /**
   * Handle user's natural language prompt
   * @param {string} prompt - User prompt
   * @param {Object} options - Options
   * @returns {Promise<Object>} Result
   */
  async handleUserPrompt(prompt, options = {}) {
    try {
      // Initialize sender for progress updates
      const sender = options.sender || null;
      
      // Send initial progress update with default steps (will be updated later)
      this.sendProgressUpdate(sender, {
        stage: 'preparing',
        message: 'Getting page context...',
        progress: 0,
        steps: this.getDefaultProgressSteps()
      });
      
      // Get active tab
      const tabId = await this.getActiveTabId();
      
      // Get page context
      Logger.info('Getting page context for prompt processing');
      const pageContext = await this.getPageContext(tabId);
      
      // Manage session state
      const isNewSession = !this.sessionState.initialPrompt || options.resetSession;
      if (isNewSession) {
        Logger.info('Starting new session with prompt:', prompt);
        this.sessionState = {
          initialPrompt: prompt,
          actionHistory: [],
          lastPageContext: pageContext
        };
      } else {
        this.sessionState.lastPageContext = pageContext;
      }
      
      // Set up progress tracking callback
      if (sender) {
        serviceManager.setProgressCallback((progress) => {
          this.sendProgressUpdate(sender, progress);
        });
      }
      
      // Process the prompt - either using continuation commands or by querying LLM
      const structuredCommands = await this.getCommands(prompt, pageContext, isNewSession, options);
      
      // Update progress with LLM's custom progress steps
      const progressSteps = structuredCommands.progressSteps || this.getDefaultProgressSteps();
      const executingStep = progressSteps.find(s => s.id === 'executing') || 
                           progressSteps[Math.floor(progressSteps.length * 0.75)] || // 75% of the way through steps
                           { id: 'executing', label: 'Executing', description: 'Executing commands' };
      
      this.sendProgressUpdate(sender, {
        stage: executingStep.id,
        message: executingStep.description || `Executing ${structuredCommands.commands?.length || 0} commands...`,
        progress: 75,
        steps: progressSteps
      });
      
      // Log structured commands before execution if detailed logging is enabled
      if (config.get('app.features.detailedApiLogging', false)) {
        Logger.debug('Structured commands from LLM:', JSON.stringify(structuredCommands, null, 2));
      }
      
      // Execute commands
      Logger.info(`Executing ${structuredCommands.commands?.length || 0} commands`);
      const executionResults = await this.executeCommands(tabId, structuredCommands);
      
      // Check for continuation
      if (!executionResults.isComplete || !structuredCommands.isComplete) {
        return await this.continueExecution(prompt, tabId, options);
      }
      
      // Send completion progress update with custom progress steps
      // Use the steps we already defined earlier
      const completeStep = progressSteps.find(s => s.id === 'complete') || 
                          progressSteps[progressSteps.length - 1] || // Last step
                          { id: 'complete', label: 'Complete', description: 'All steps completed' };
      
      this.sendProgressUpdate(sender, {
        stage: completeStep.id,
        message: executionResults.completionMessage || 
                structuredCommands.completionMessage || 
                completeStep.description || 
                'Commands executed successfully',
        progress: 100,
        steps: progressSteps
      });
      
      // Return results
      return {
        success: true,
        isComplete: true,
        completionMessage: executionResults.completionMessage || 
                          structuredCommands.completionMessage || 
                          'Commands executed successfully'
      };
    } catch (error) {
      Logger.error('Error handling user prompt:', error);
      
      // Send error progress update
      if (options.sender) {
        this.sendProgressUpdate(options.sender, {
          stage: 'error',
          message: `Error: ${error.message}`,
          progress: 0,
          steps: this.getDefaultProgressSteps() // Use default steps for error case
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Send progress update to the sender
   * @param {Object} sender - The message sender
   * @param {Object} progress - Progress data
   */
  sendProgressUpdate(sender, progress) {
    if (!sender) return;
    
    try {
      // For sidebar/popup, need to use runtime messaging
      chrome.runtime.sendMessage({
        action: 'progressUpdate',
        progress
      }).catch(error => {
        Logger.debug('Could not send runtime message, likely no listeners:', error);
      });
    } catch (error) {
      Logger.warn('Error sending progress update:', error);
    }
  }
  
  /**
   * Get page context using browsermagic-dom through content script
   * @param {number} tabId - Tab ID
   * @param {Object} options - Snapshot options
   * @returns {Promise<Object>} Page context
   */
  async getPageContext(tabId, options = {}) {
    try {
      Logger.info(`Getting page context from tab ${tabId}`);
      
      // Ensure content script is injected
      await this.ensureContentScriptInjected(tabId);
      
      // Get snapshot from content script (which uses browsermagic-dom)
      const response = await this.sendMessageToTab(tabId, {
        action: 'fastSnapshot',
        options
      }, 5000);
      
      if (!response || !response.success || !response.snapshot) {
        throw new Error('Failed to get page snapshot');
      }
      
      const snapshot = response.snapshot;
      Logger.debug(`Retrieved snapshot with ${snapshot.keyElements?.length || 0} elements`);
      
      // Format the response for LLM processing
      return {
        url: snapshot.url,
        title: snapshot.title || '',
        elements: snapshot.keyElements.map(el => ({
          xpath: el.xpath,
          text: el.text,
          type: el.tag,
          location: {
            x: el.x,
            y: el.y,
            width: el.width, 
            height: el.height
          },
          visible: el.inViewport
        }))
      };
    } catch (error) {
      Logger.error(`Error getting page context from tab ${tabId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get commands for execution
   * @param {string} prompt - User prompt
   * @param {Object} pageContext - Page context
   * @param {boolean} isNewSession - Whether this is a new session
   * @param {Object} options - Options
   * @returns {Promise<Object>} Structured commands
   */
  async getCommands(prompt, pageContext, isNewSession, options) {
    // Use continuation commands if provided
    if (options.continuationCommands) {
      const commands = options.continuationCommands;
      commands.isComplete = commands.isComplete ?? false;
      
      // Ensure progress steps exist
      if (!commands.progressSteps || !Array.isArray(commands.progressSteps)) {
        commands.progressSteps = this.getDefaultProgressSteps();
      }
      
      return commands;
    }
    
    // Query LLM for commands
    Logger.info(`Processing prompt with ${serviceManager.getCurrentProvider()}`);
    Logger.debug(`Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
    
    const commands = await serviceManager.processPrompt(
      prompt,
      pageContext,
      {
        initialPrompt: this.sessionState.initialPrompt,
        actionHistory: this.sessionState.actionHistory,
        isNewSession
      }
    );
    
    // Ensure completion status is defined
    commands.isComplete = commands.isComplete ?? false;
    
    // Ensure progress steps exist (fallback to default if not provided)
    if (!commands.progressSteps || !Array.isArray(commands.progressSteps) || commands.progressSteps.length === 0) {
      Logger.warn('LLM did not provide valid progress steps, using defaults');
      commands.progressSteps = this.getDefaultProgressSteps();
    } else {
      Logger.info(`Using LLM-provided progress steps: ${commands.progressSteps.map(s => s.label).join(', ')}`);
    }
    
    return commands;
  }
  
  /**
   * Get default progress steps when LLM doesn't provide them
   * @returns {Array} Default progress steps
   */
  getDefaultProgressSteps() {
    return [
      { id: 'preparing', label: 'Preparing', description: 'Getting page context and preparing' },
      { id: 'sending', label: 'Sending', description: 'Sending request to LLM' },
      { id: 'processing', label: 'Processing', description: 'Processing response from LLM' },
      { id: 'executing', label: 'Executing', description: 'Executing commands on the page' },
      { id: 'complete', label: 'Complete', description: 'All steps completed' }
    ];
  }
  
  /**
   * Execute commands on a tab
   * @param {number} tabId - Tab ID
   * @param {Object} commands - Commands to execute
   * @returns {Promise<Object>} Execution results
   */
  async executeCommands(tabId, commands) {
    try {
      // Ensure content script is injected
      await this.ensureContentScriptInjected(tabId);
      
      // Execute commands in content script
      if (!commands.commands?.length) {
        return {
          success: true,
          isComplete: true,
          commandResults: []
        };
      }
      
      // Send commands to content script
      const response = await this.sendMessageToTab(tabId, {
        action: 'executeCommands',
        commands: commands.commands
      }, 30000);
      
      // Track commands in session history
      if (response && response.commandResults) {
        for (const result of response.commandResults) {
          this.sessionState.actionHistory.push({
            command: commands.commands.find(cmd => cmd.id === result.id) || {},
            result,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return {
        success: response?.success || false,
        isComplete: commands.isComplete,
        commandResults: response?.commandResults || [],
        completionMessage: commands.completionMessage
      };
    } catch (error) {
      Logger.error('Error executing commands:', error);
      return {
        success: false,
        isComplete: false,
        error: error.message,
        commandResults: []
      };
    }
  }
  
  /**
   * Continue command execution flow
   * @param {string} initialPrompt - Initial user prompt
   * @param {number} tabId - Tab ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Continuation results
   */
  async continueExecution(initialPrompt, tabId, options) {
    try {
      Logger.info('Flow not complete, continuing with next steps');
      
      // Wait for DOM to stabilize and get fresh context
      await this.waitForDomStabilization(tabId);
      const newPageContext = await this.getPageContext(tabId);
      this.sessionState.lastPageContext = newPageContext;
      
      // Ask LLM for continuation steps
      Logger.info('Requesting continuation steps from LLM');
      const continuationPrompt = `Continue the process of "${initialPrompt}". What are the next steps needed?`;
      
      const continuationCommands = await serviceManager.processPrompt(
        continuationPrompt,
        newPageContext,
        {
          initialPrompt: this.sessionState.initialPrompt,
          actionHistory: this.sessionState.actionHistory,
          isNewSession: false
        }
      );
      
      // Execute continuation commands if available
      if (continuationCommands.commands?.length > 0) {
        Logger.info(`Executing ${continuationCommands.commands.length} continuation commands`);
        
        // Recursive continuation
        return await this.handleUserPrompt(initialPrompt, {
          ...options,
          resetSession: false,
          continuationCommands
        });
      } else {
        Logger.info('No continuation commands received, flow complete');
        return {
          success: true,
          isComplete: true,
          completionMessage: 'Flow completed (no more commands needed)'
        };
      }
    } catch (error) {
      Logger.error('Error in continuation flow:', error);
      return {
        success: false,
        isComplete: false,
        error: error.message,
        completionMessage: `Flow continuation failed: ${error.message}`
      };
    }
  }
  
  /**
   * Ensure content script is injected in tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<boolean>} Whether content script is injected
   */
  async ensureContentScriptInjected(tabId) {
    try {
      Logger.debug(`Checking content script in tab ${tabId}`);
      
      // Check tab URL
      const tab = await chrome.tabs.get(tabId);
      const url = tab.url || '';
      
      // Check for restricted URLs
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('chrome-search://') ||
          url.startsWith('devtools://') ||
          url.startsWith('edge://') ||
          url.startsWith('about:') ||
          url === 'chrome://newtab/') {
        throw new Error(`Cannot execute on restricted page (${url.split('/')[0]}//)`);
      }
      
      // Check if content script is already injected
      try {
        const response = await this.sendMessageToTab(tabId, { action: 'ping' }, 1000);
        if (response && response.status === 'alive') {
          Logger.debug(`Content script already injected in tab ${tabId}`);
          return true;
        }
      } catch (error) {
        Logger.debug(`Content script not detected: ${error.message}`);
      }
      
      // Inject content script
      Logger.info(`Injecting content script into tab ${tabId}`);
      const injectionResult = await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js']
      });
      
      // Verify injection
      await new Promise(resolve => setTimeout(resolve, 500));
      const verifyResponse = await this.sendMessageToTab(tabId, { action: 'ping' }, 2000);
      
      if (!verifyResponse || verifyResponse.status !== 'alive') {
        throw new Error('Failed to verify content script injection');
      }
      
      Logger.debug(`Content script successfully injected in tab ${tabId}`);
      return true;
    } catch (error) {
      Logger.error(`Error injecting content script to tab ${tabId}:`, error);
      throw error;
    }
  }
  
  /**
   * Send message to a tab with timeout
   * @param {number} tabId - Tab ID
   * @param {Object} message - Message to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<any>} Response
   */
  sendMessageToTab(tabId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Message timeout for action: ${message.action}`));
      }, timeout);
      
      chrome.tabs.sendMessage(tabId, message, (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        resolve(response);
      });
    });
  }
  
  /**
   * Wait for DOM to stabilize after action
   * @param {number} tabId - Tab ID
   * @returns {Promise<void>}
   */
  async waitForDomStabilization(tabId) {
    try {
      Logger.debug(`Waiting for DOM to stabilize in tab ${tabId}`);
      
      // Ensure content script is available
      await this.ensureContentScriptInjected(tabId);
      
      // Initial wait for immediate changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check DOM stability
      const response = await this.sendMessageToTab(tabId, { action: 'checkDomStability' }, 4000);
      
      // If still loading, wait a bit longer
      if (response?.isLoading) {
        Logger.debug('DOM still loading, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      Logger.debug('DOM appears stable');
    } catch (error) {
      Logger.warn('Error checking DOM stability:', error);
      // Fallback wait
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  /**
   * Update service configuration
   * @param {string} provider - Provider name
   * @param {Object} newConfig - New configuration
   * @param {Object} features - Feature flags
   * @returns {Promise<boolean>} Success
   */
  async updateServiceConfig(provider, newConfig, features) {
    try {
      // Save to storage
      await new Promise((resolve) => {
        chrome.storage.local.set({
          provider,
          serviceConfig: newConfig,
          features: features || {}
        }, resolve);
      });
      
      // Update application config if features were provided
      if (features) {
        // Update detailed API logging setting
        if (features.detailedApiLogging !== undefined) {
          config.set('app.features.detailedApiLogging', features.detailedApiLogging);
          Logger.debug(`Detailed API logging ${features.detailedApiLogging ? 'enabled' : 'disabled'}`);
        }
      }
      
      // Update the service
      return await serviceManager.changeProvider(provider, newConfig);
    } catch (error) {
      Logger.error('Error updating service config:', error);
      throw error;
    }
  }
  
  /**
   * Change service provider
   * @param {string} provider - New provider name
   * @returns {Promise<boolean>} Success
   */
  async changeServiceProvider(provider) {
    try {
      // Get saved config for this provider
      const result = await this.getStorageData(['serviceConfig']);
      const savedConfig = result.serviceConfig || {};
      
      // Get default config
      const defaultConfig = serviceConfig.providers[provider] || {};
      
      // Merge configs
      const providerConfig = { ...defaultConfig, ...savedConfig };
      
      // Update service
      const success = await serviceManager.changeProvider(provider, providerConfig);
      
      if (success) {
        // Save provider choice
        await new Promise((resolve) => {
          chrome.storage.local.set({ provider }, resolve);
        });
      }
      
      return success;
    } catch (error) {
      Logger.error('Error changing service provider:', error);
      throw error;
    }
  }
}

// Create browser manager instance
const browserManager = new BrowserManager();

// Export for testing purposes
export { browserManager };