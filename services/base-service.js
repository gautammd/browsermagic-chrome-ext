/**
 * Base Service for LLM Implementations
 * Provides common functionality and base implementation for all LLM services
 */
import LLMService from './llm-service.js';
import * as PromptTemplates from './prompt-templates.js';

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
   */
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.temperature = config.temperature || 0.3;
    this.maxTokens = config.maxTokens || 1024;
    this.apiEndpoint = config.apiEndpoint || '';
  }

  /**
   * Process a natural language prompt into browser commands
   * This is the main method that child classes should override with specific API calling logic
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Context about the current page
   * @param {Object} sessionInfo - Information about the current session
   * @returns {Promise<Object>} - Structured browser commands
   */
  async processPrompt(prompt, pageContext = null, sessionInfo = {}) {
    // Child classes should implement this method
    throw new Error('Method not implemented. Each service must implement this method.');
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
        console.log('Found JSON in code block, extracting...');
        jsonContent = jsonBlockMatch[1];
      }
      
      // Try parsing the content
      let parsedCommands;
      try {
        parsedCommands = JSON.parse(jsonContent);
        console.log('Successfully parsed JSON directly');
      } catch (initialError) {
        // If that fails, try to find any JSON object in the text
        console.log('Initial JSON parse failed:', initialError.message);
        
        const jsonObjectMatch = content.match(/(\{[\s\S]*"commands"[\s\S]*?\})/);
        if (jsonObjectMatch && jsonObjectMatch[1]) {
          console.log('Found potential JSON object, attempting to parse...');
          jsonContent = jsonObjectMatch[1];
          try {
            parsedCommands = JSON.parse(jsonContent);
            console.log('Successfully parsed extracted JSON object');
          } catch (extractError) {
            console.error('Failed to parse extracted JSON:', extractError.message);
            throw extractError;
          }
        } else {
          console.error('No JSON object found in content');
          throw initialError;
        }
      }
      
      return parsedCommands;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      
      // Create a fallback object with the raw content if parsing fails
      return {
        commands: [
          {
            action: "error",
            message: "Failed to parse JSON response. Please try again.",
            errorDetail: parseError.message,
            rawContent: content.substring(0, 500) + (content.length > 500 ? '...' : '')
          }
        ],
        isComplete: false,
        completionMessage: "Error parsing response"
      };
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
   * Test the connection to the service
   * This is a default implementation that should be overridden by child classes
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    if (!this.apiKey) {
      console.error('No API key provided');
      return false;
    }

    try {
      // Child classes should implement their own test connection logic
      // This default implementation just returns true for services that don't need testing
      return true;
    } catch (error) {
      console.error(`Error testing connection:`, error);
      return false;
    }
  }

  /**
   * Handle API errors consistently
   * @param {Response} response - Fetch API response
   * @returns {Promise<Error>} - Standardized error
   */
  async handleApiError(response) {
    let errorMessage = response.statusText;
    
    try {
      const errorData = await response.json();
      console.error(`API error details:`, errorData);
      
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else {
          errorMessage = JSON.stringify(errorData.error);
        }
      }
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
      // Use response text as fallback if JSON parsing fails
      try {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (textError) {
        console.error('Could not get error response text:', textError);
      }
    }
    
    return new Error(`API Error: ${errorMessage}`);
  }
}

export default BaseService;