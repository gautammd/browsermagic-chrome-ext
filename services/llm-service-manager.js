import LLMServiceFactory from './llm-service-factory.js';
import { AppError, ErrorType } from './error-handler.js';
import { Logger, config } from '../src/shared/utils';

/**
 * Manager class for LLM service operations
 * Handles service configuration, caching, and operation
 */
class LLMServiceManager {
  constructor() {
    this.currentService = null;
    this.currentProvider = null;
    this.serviceConfig = {};
    this.progressCallback = null;
    
    // Get default provider from config
    this.defaultProvider = config.get('service.defaultProvider', 'groq');
  }
  
  /**
   * Set a callback function for progress updates
   * @param {Function} callback - Function to call with progress updates
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
    
    // If we have a current service, propagate the callback to it
    if (this.currentService) {
      this.currentService.setProgressCallback(callback);
    }
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
      
      // Transfer any existing progress callback to the new service
      if (this.progressCallback && this.currentService.setProgressCallback) {
        this.currentService.setProgressCallback(this.progressCallback);
      }
      
      // Test connection
      const isConnected = await this.currentService.testConnection();
      
      if (!isConnected) {
        Logger.warn(`Failed to connect to ${serviceProvider} service. Check configuration.`);
        
        // Only fall back if we're not already using the default provider
        if (serviceProvider !== this.defaultProvider) {
          Logger.warn(`Falling back to ${this.defaultProvider} service.`);
          return this.initialize(this.defaultProvider, {});
        }
      }
      
      return isConnected;
    } catch (error) {
      Logger.error('Error initializing LLM service:', error);
      
      // If not already using default, try falling back
      if (provider !== this.defaultProvider) {
        Logger.warn(`Falling back to ${this.defaultProvider} service.`);
        return this.initialize(this.defaultProvider, {});
      }
      
      throw new AppError(`Failed to initialize any LLM service`, {
        type: ErrorType.SERVICE_UNAVAILABLE,
        source: 'llm-service-manager',
        originalError: error
      });
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
      Logger.info(`Processing prompt with ${this.currentProvider} service`);
      
      if (sessionInfo && sessionInfo.actionHistory) {
        Logger.debug(`Including session history with ${sessionInfo.actionHistory.length} previous actions`);
      }
      
      const startTime = performance.now();
      
      const result = await this.currentService.processPrompt(prompt, pageContext, sessionInfo);
      
      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000;
      Logger.info(`Successfully processed prompt with ${this.currentProvider} service in ${processingTime.toFixed(2)}s`);
      
      return result;
    } catch (error) {
      Logger.error(`Error processing prompt with ${this.currentProvider} service:`, error);
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
      Logger.debug(`Skipping XPath refinement - missing description or page context`);
      return command;
    }
    
    try {
      Logger.info(`Refining XPath for "${command.description}" with ${this.currentProvider} service`);
      
      // Create a special prompt for the refinement
      const refinementPrompt = `I need to ${command.action} the element described as: "${command.description}".
Please analyze the interactive elements list to provide the exact XPath for this element from the page context.
If you find a matching element in the interactive elements list, use its exact XPath.
If not, suggest a description that might be better for finding the element.`;
      
      // Process the prompt with the page context
      const result = await this.currentService.processPrompt(refinementPrompt, pageContext);
      
      // Extract the XPath from the response
      if (result && result.commands && result.commands.length > 0) {
        const firstCommand = result.commands[0];
        if (firstCommand.xpath) {
          Logger.info(`Successfully refined XPath to "${firstCommand.xpath}"`);
          // Return a new command with the refined XPath
          return {
            ...command,
            xpath: firstCommand.xpath
          };
        }
      }
      
      Logger.warn(`Could not refine XPath - keeping original`);
      // If we couldn't get a refined XPath, return the original command
      return command;
    } catch (error) {
      Logger.error(`Error refining XPath:`, error);
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
  
  /**
   * Get supported provider names
   * @returns {string[]} Array of supported provider names
   */
  getSupportedProviders() {
    return ['groq', 'openai'];
  }
}

// Create and export a singleton instance
const serviceManager = new LLMServiceManager();
export default serviceManager;