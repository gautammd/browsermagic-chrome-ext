/**
 * Enhanced Base Service for LLM Implementations
 * Provides common functionality and base implementation for all LLM services
 * Uses the adapter pattern for handling different API formats
 */
import LLMService from './llm-service.js';
import * as PromptTemplates from './prompt-templates.js';
import { ApiAdapterFactory } from './adapters/index.js';
import { ApiErrorHandler } from './error-handler.js';
import { Logger, config } from '../src/shared/utils';

/**
 * Processing stages for progress tracking
 */
export const ProcessingStage = {
  PREPARING: 'preparing',
  SENDING: 'sending',
  PROCESSING: 'processing',
  EXECUTING: 'executing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

/**
 * Base Service implementation with shared functionality
 * @extends LLMService
 */
class BaseService extends LLMService {
  /**
   * Initialize the Base service with common configuration
   * @param {Object} config - Configuration object for the service
   * @param {string} config.apiKey - API key for the service
   * @param {string} config.model - Model name to use
   * @param {number} config.temperature - Sampling temperature (0.0 to 1.0)
   * @param {number} config.maxTokens - Maximum tokens to generate
   * @param {string} config.apiEndpoint - API endpoint URL
   * @param {string} config.provider - Provider name for creating the adapter
   */
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.temperature = config.temperature || 0.3;
    this.maxTokens = config.maxTokens || 1024;
    this.apiEndpoint = config.apiEndpoint || '';
    this.provider = config.provider || '';
    this.progressCallback = null;
    
    // Create the appropriate API adapter
    if (this.provider) {
      try {
        this.adapter = ApiAdapterFactory.createAdapter(this.provider);
      } catch (error) {
        Logger.warn(`Could not create adapter for ${this.provider}: ${error.message}`);
        // We'll handle the missing adapter case in the API call methods
      }
    }
  }
  
  /**
   * Set a callback function for progress updates
   * @param {Function} callback - Function to call with progress updates
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }
  
  /**
   * Update processing progress
   * @param {string} stage - Current processing stage
   * @param {string} message - Optional status message
   * @param {number} progress - Optional progress percentage (0-100)
   */
  updateProgress(stage, message = '', progress = 0) {
    if (typeof this.progressCallback === 'function') {
      this.progressCallback({
        stage,
        message,
        progress,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process a natural language prompt into browser commands
   * Standardized implementation using the adapter pattern
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Context about the current page
   * @param {Object} sessionInfo - Information about the current session
   * @returns {Promise<Object>} - Structured browser commands
   */
  async processPrompt(prompt, pageContext = null, sessionInfo = {}) {
    if (!this.apiKey) {
      throw new Error(`API key is required for ${this.provider}. Please provide an API key in the configuration.`);
    }
    
    if (!this.adapter) {
      throw new Error(`No adapter available for provider: ${this.provider}`);
    }

    try {
      // Update progress: Preparing stage
      this.updateProgress(
        ProcessingStage.PREPARING, 
        `Getting page context and formatting prompt...`
      );
      
      // Format the user prompt with context and history
      const userPrompt = this.formatPromptWithContext(prompt, pageContext, sessionInfo);
      const systemPrompt = this.getSystemPrompt(!!pageContext);
      
      Logger.info(`${this.provider} service processing prompt using ${this.model}`);
      
      // Use the adapter to format the request payload
      const requestPayload = this.adapter.formatRequest(
        userPrompt, 
        systemPrompt, 
        {
          temperature: this.temperature,
          maxTokens: this.maxTokens,
          model: this.model
        }
      );
      
      // Update progress: Sending stage
      this.updateProgress(
        ProcessingStage.SENDING, 
        `Sending request to the model...`
      );
      
      // Get headers from the adapter
      const headers = this.adapter.getRequestHeaders(this.apiKey);
      
      // Make the API request
      const startTime = performance.now();
      
      // Basic request logging
      Logger.info(`API Request to ${this.provider} (${this.model}):`, {
        endpoint: this.apiEndpoint,
        method: 'POST',
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' }
      });
      
      // Detailed API logging when enabled
      if (config.get('app.features.detailedApiLogging', false)) {
        const requestBody = JSON.stringify(requestPayload, null, 2);
        Logger.debug(`Request payload (${this.provider}):`, requestPayload);
        Logger.debug(`Raw request body:\n${requestBody}`);
      }
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const error = await ApiErrorHandler.handleApiError(response, this.provider);
        this.updateProgress(ProcessingStage.ERROR, `Error: ${error.message}`);
        throw error;
      }

      // Update progress: Processing stage
      this.updateProgress(
        ProcessingStage.PROCESSING, 
        `Processing response from ${this.provider}...`
      );
      
      // Parse the API response
      const data = await response.json();
      
      // Basic response data logging
      Logger.info(`API Response from ${this.provider} (${this.model}):`, {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
        responseTimeMs: performance.now() - startTime
      });
      
      // Detailed API logging when enabled
      if (config.get('app.features.detailedApiLogging', false)) {
        // Log full structured response
        Logger.debug(`Response data (${this.provider}):`);
        Logger.debug(JSON.stringify(data, null, 2));
      }
      
      // Use the adapter to extract content from the response
      const content = this.adapter.parseResponse(data);
      
      // Calculate processing time
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);
      
      // Update progress: Complete parsing stage
      this.updateProgress(
        ProcessingStage.EXECUTING, 
        `Preparing to execute commands (completed in ${processingTime}s)...`
      );
      
      // Parse the content into commands
      return this.parseResponseContent(content);
    } catch (error) {
      Logger.error(`Error processing prompt with ${this.provider}:`, error);
      
      // Update progress with error
      this.updateProgress(
        ProcessingStage.ERROR, 
        `Error: ${error.message}`
      );
      
      // Enhance the error with more context
      const enhancedError = ApiErrorHandler.handleConnectionError(error, this.provider);
      throw enhancedError;
    }
  }

  /**
   * Format the user prompt with context and history
   * @param {string} prompt - The original user prompt
   * @param {Object} pageContext - Context about the current page
   * @param {Object} sessionInfo - Information about the current session
   * @returns {string} - Formatted prompt with context and history
   */
  formatPromptWithContext(prompt, pageContext = null, sessionInfo = {}) {
    return PromptTemplates.formatPromptWithContext(prompt, pageContext, sessionInfo);
  }

  /**
   * Extract structured commands from an LLM response
   * @param {string} content - Raw content from the LLM response
   * @returns {Object} - Structured commands object
   */
  parseResponseContent(content) {
    try {
      // First, try to extract JSON from the content if it's wrapped in markdown code blocks
      let jsonContent = content;
      
      // Check if content contains markdown code blocks with JSON
      const jsonBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        Logger.debug('Found JSON in code block, extracting...');
        jsonContent = jsonBlockMatch[1];
      }
      
      // Try parsing the content
      let parsedCommands;
      try {
        parsedCommands = JSON.parse(jsonContent);
        Logger.debug('Successfully parsed JSON directly');
      } catch (initialError) {
        // If that fails, try to find any JSON object in the text
        Logger.debug('Initial JSON parse failed:', initialError.message);
        
        const jsonObjectMatch = content.match(/(\{[\s\S]*"commands"[\s\S]*?\})/);
        if (jsonObjectMatch && jsonObjectMatch[1]) {
          Logger.debug('Found potential JSON object, attempting to parse...');
          jsonContent = jsonObjectMatch[1];
          try {
            parsedCommands = JSON.parse(jsonContent);
            Logger.debug('Successfully parsed extracted JSON object');
          } catch (extractError) {
            Logger.error('Failed to parse extracted JSON:', extractError.message);
            throw extractError;
          }
        } else {
          Logger.error('No JSON object found in content');
          throw initialError;
        }
      }
      
      return parsedCommands;
    } catch (parseError) {
      Logger.error('Failed to parse JSON response:', parseError);
      
      // Use the error handler to create a standardized fallback response
      return ApiErrorHandler.handleParsingError(parseError, content);
    }
  }

  /**
   * Get the system prompt for LLM service
   * @param {boolean} hasPageContext - Whether page context is provided
   * @returns {string} - System prompt string
   */
  getSystemPrompt(hasPageContext = false) {
    return PromptTemplates.getBaseSystemPrompt(hasPageContext);
  }

  /**
   * Test the connection to the service using the adapter
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    if (!this.apiKey) {
      Logger.error(`No API key provided for ${this.provider} connection test`);
      return false;
    }
    
    if (!this.adapter) {
      Logger.error(`No adapter available for provider: ${this.provider}`);
      return false;
    }

    try {
      Logger.info(`Testing connection to ${this.provider} API (${this.apiEndpoint})`);
      
      // Use the adapter to format a test request
      const testPayload = this.adapter.formatTestRequest({ model: this.model });
      
      // Get headers from the adapter
      const headers = this.adapter.getRequestHeaders(this.apiKey);
      
      // Basic test request logging
      Logger.info(`API Test Request to ${this.provider}:`, {
        endpoint: this.apiEndpoint,
        method: 'POST',
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' }
      });
      
      // Detailed API logging when enabled
      if (config.get('app.features.detailedApiLogging', false)) {
        const testRequestBody = JSON.stringify(testPayload, null, 2);
        Logger.debug(`Test request payload (${this.provider}):`, testPayload);
        Logger.debug(`Raw test request body:\n${testRequestBody}`);
      }
      
      // Make the API request
      const startTime = performance.now();
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload)
      });
      
      // Basic test response logging
      Logger.info(`API Test Response from ${this.provider}:`, {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
        responseTimeMs: performance.now() - startTime
      });
      
      // Detailed API logging when enabled
      if (config.get('app.features.detailedApiLogging', false) && response.ok) {
        try {
          const responseData = await response.clone().json();
          Logger.debug(`Test response data (${this.provider}):`);
          Logger.debug(JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          Logger.debug(`Could not parse test response as JSON: ${parseError.message}`);
        }
      }
      
      return response.ok;
    } catch (error) {
      Logger.error(`Error testing connection to ${this.provider}:`, error);
      return false;
    }
  }
}

export default BaseService;