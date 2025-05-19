import LLMServiceFactory from './llm-service-factory.js';

/**
 * Manager class for LLM service operations
 * Handles service configuration, caching, and operation
 */
class LLMServiceManager {
  constructor() {
    this.currentService = null;
    this.currentProvider = null;
    this.serviceConfig = {};
    
    // Default to mock service in development
    this.defaultProvider = 'mock';
  }

  /**
   * Initialize the service with the specified provider and configuration
   * @param {string} provider - The service provider to use
   * @param {Object} config - Configuration for the service
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(provider = null, config = {}) {
    try {
      // Use provided provider or fallback to stored/default
      const serviceProvider = provider || this.currentProvider || this.defaultProvider;
      
      // Create the service
      this.currentService = LLMServiceFactory.createService(serviceProvider, config);
      this.currentProvider = serviceProvider;
      this.serviceConfig = config;
      
      // Test connection
      const isConnected = await this.currentService.testConnection();
      
      if (!isConnected) {
        console.warn(`Failed to connect to ${serviceProvider} service. Check configuration.`);
        if (serviceProvider !== this.defaultProvider) {
          console.warn(`Falling back to ${this.defaultProvider} service.`);
          return this.initialize(this.defaultProvider, {});
        }
      }
      
      return isConnected;
    } catch (error) {
      console.error('Error initializing LLM service:', error);
      
      // If not already using default, try falling back
      if (provider !== this.defaultProvider) {
        console.warn(`Falling back to ${this.defaultProvider} service.`);
        return this.initialize(this.defaultProvider, {});
      }
      
      return false;
    }
  }

  /**
   * Process a user prompt using the current service
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Optional page context information
   * @param {Object} sessionInfo - Optional session information including history
   * @returns {Promise<Object>} - Structured commands object
   */
  async processPrompt(prompt, pageContext = null, sessionInfo = {}) {
    if (!this.currentService) {
      await this.initialize();
    }
    
    try {
      console.log(`📡 LLMServiceManager: Processing prompt with ${this.currentProvider} service`);
      console.log(`📊 LLMServiceManager: Service config: ${JSON.stringify(this.serviceConfig)}`);
      
      if (sessionInfo && sessionInfo.actionHistory) {
        console.log(`🔄 LLMServiceManager: Including session history with ${sessionInfo.actionHistory.length} previous actions`);
      }
      
      const startTime = performance.now();
      
      const result = await this.currentService.processPrompt(prompt, pageContext, sessionInfo);
      
      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000;
      console.log(`✅ LLMServiceManager: Successfully processed prompt with ${this.currentProvider} service in ${processingTime.toFixed(2)}s`);
      
      return result;
    } catch (error) {
      console.error(`❌ LLMServiceManager: Error processing prompt with ${this.currentProvider} service:`, error);
      throw error;
    }
  }
  
  /**
   * Refine a selector for a specific command using page context
   * @param {Object} command - The command to refine
   * @param {Object} pageContext - Current page context
   * @returns {Promise<Object>} - Command with refined selector
   */
  async refineSelectorForCommand(command, pageContext) {
    if (!this.currentService) {
      await this.initialize();
    }
    
    if (!command.description || !pageContext) {
      // If we don't have a description or page context, return the original command
      console.log(`ℹ️ LLMServiceManager: Skipping XPath refinement - missing description or page context`);
      return command;
    }
    
    try {
      console.log(`🔍 LLMServiceManager: Refining XPath for "${command.description}" with ${this.currentProvider} service`);
      
      // Create a special prompt for the refinement
      const refinementPrompt = `I need to ${command.action} the element described as: "${command.description}".
Please analyze the interactive elements list to provide the exact XPath for this element from the page context.
If you find a matching element in the interactive elements list, use its exact XPath.
If not, suggest a description that might be better for finding the element.`;
      
      const startTime = performance.now();
      
      // Process the prompt with the page context
      const result = await this.currentService.processPrompt(refinementPrompt, pageContext);
      
      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000;
      
      // Extract the XPath from the response
      if (result && result.commands && result.commands.length > 0) {
        const firstCommand = result.commands[0];
        if (firstCommand.xpath) {
          console.log(`✅ LLMServiceManager: Successfully refined XPath to "${firstCommand.xpath}" in ${processingTime.toFixed(2)}s`);
          // Return a new command with the refined XPath
          return {
            ...command,
            xpath: firstCommand.xpath
          };
        }
      }
      
      console.log(`⚠️ LLMServiceManager: Could not refine XPath in ${processingTime.toFixed(2)}s - keeping original`);
      // If we couldn't get a refined XPath, return the original command
      return command;
    } catch (error) {
      console.error(`❌ LLMServiceManager: Error refining XPath:`, error);
      // Return the original command if refinement fails
      return command;
    }
  }

  /**
   * Get the current service provider name
   * @returns {string} - Current provider name
   */
  getCurrentProvider() {
    return this.currentProvider || this.defaultProvider;
  }

  /**
   * Change the service provider
   * @param {string} provider - The new service provider to use
   * @param {Object} config - Configuration for the new service
   * @returns {Promise<boolean>} - True if provider change was successful
   */
  async changeProvider(provider, config = {}) {
    return this.initialize(provider, config);
  }
}

// Create and export a singleton instance
const serviceManager = new LLMServiceManager();
export default serviceManager;