/**
 * Refactored Claude LLM Service Implementation
 * Uses the new BaseService class and other abstractions
 */
import BaseService from './base-service.js';
import * as PromptTemplates from './prompt-templates.js';

/**
 * Claude LLM Service Implementation
 * Handles communication with the Anthropic Claude API
 * @extends BaseService
 */
class ClaudeService extends BaseService {
  /**
   * Initialize the Claude service
   * @param {Object} config - Configuration object for the service
   * @param {string} config.apiKey - Claude API key
   * @param {string} config.model - Claude model to use (defaults to claude-3-7-sonnet-20250219)
   * @param {number} config.temperature - Sampling temperature (0.0 to 1.0)
   * @param {number} config.maxTokens - Maximum tokens to generate
   */
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || '',
      model: config.model || 'claude-3-sonnet-20240229',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1024,
      apiEndpoint: 'https://api.anthropic.com/v1/messages'
    });
    
    // Use latest API version
    this.apiVersion = '2023-06-01';
    
    console.log(`🔧 Initialized Claude service with model: ${this.model}`);
  }

  /**
   * Process a natural language prompt into browser commands
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Optional context about the current page
   * @param {Object} sessionInfo - Optional session information including history
   * @returns {Promise<Object>} - Structured browser commands
   */
  async processPrompt(prompt, pageContext = null, sessionInfo = {}) {
    console.log(`🧠 Claude service processing prompt: "${prompt.substring(0, 50)}..."`);
    
    if (!this.apiKey) {
      console.error('❌ Claude API key missing');
      throw new Error('Claude API key is required. Please provide an API key in the configuration.');
    }

    try {
      // Format the user prompt with context and history
      const userPrompt = this.formatPromptWithContext(prompt, pageContext, sessionInfo);
      
      console.log(`🌐 Sending request to Claude API with model: ${this.model}`);
      console.log(`🔑 Using API key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      console.log(`🧪 Temperature: ${this.temperature}, Max Tokens: ${this.maxTokens}`);
      
      // Prepare full request payload
      const requestPayload = {
        model: this.model,
        system: this.getSystemPrompt(!!pageContext),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: userPrompt
              }
            ]
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };
      
      // Log the request payload for debugging
      console.log(`📝 Full request payload:`, JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const error = await this.handleApiError(response);
        throw error;
      }

      console.log(`✅ Claude API response successful`);
      const data = await response.json();
      
      // Extract the content from the response according to latest API documentation
      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw new Error('Unexpected response format from Claude API: missing content array');
      }
      
      // Find the first text block
      const textBlock = data.content.find(block => block.type === 'text');
      
      if (!textBlock || !textBlock.text) {
        throw new Error('No text content found in Claude API response');
      }
      
      console.log(`ℹ️ Found text content in response`);
      const content = textBlock.text;
      
      // Parse the JSON response into commands
      return this.parseResponseContent(content);
    } catch (error) {
      console.error('❌ Error processing prompt with Claude:', error);
      throw new Error(`Failed to process prompt: ${error.message}`);
    }
  }

  /**
   * Test the connection to the Claude service
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    console.log(`🧪 Testing connection to Claude API`);
    
    if (!this.apiKey) {
      console.error(`❌ No API key provided for Claude connection test`);
      return false;
    }

    try {
      console.log(`🌐 Sending test request to Claude API (${this.apiEndpoint})`);
      // Prepare the test request payload
      const testPayload = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Hello'
              }
            ]
          }
        ],
        max_tokens: 10
      };
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(testPayload)
      });

      console.log(`📥 Test response status: ${response.status} ${response.statusText}`);
      
      return response.ok;
    } catch (error) {
      console.error('❌ Error testing connection to Claude:', error);
      return false;
    }
  }

  /**
   * Get the system prompt for the Claude API
   * Uses the shared prompt templates
   * @param {boolean} hasPageContext - Whether page context is provided
   * @returns {string} - System prompt
   */
  getSystemPrompt(hasPageContext = false) {
    return PromptTemplates.getBaseSystemPrompt(hasPageContext);
  }
}

export default ClaudeService;