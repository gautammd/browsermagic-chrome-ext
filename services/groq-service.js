/**
 * Refactored Groq LLM Service Implementation
 * Uses the new BaseService class and other abstractions
 */
import BaseService from './base-service.js';
import * as PromptTemplates from './prompt-templates.js';
import { ApiErrorHandler } from './error-handler.js';

/**
 * Groq LLM Service Implementation
 * Handles communication with the Groq API
 * @extends BaseService
 */
class GroqService extends BaseService {
  /**
   * Initialize the Groq service
   * @param {Object} config - Configuration object for the service
   * @param {string} config.apiKey - Groq API key
   * @param {string} config.model - Groq model to use (defaults to llama-3.3-70b-versatile)
   * @param {number} config.temperature - Sampling temperature (0.0 to 1.0)
   * @param {number} config.maxTokens - Maximum tokens to generate
   */
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || '',
      model: config.model || 'llama-3.3-70b-versatile',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1024,
      apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions'
    });
    
    console.log(`🔧 Initialized Groq service with model: ${this.model}`);
  }

  /**
   * Process a natural language prompt into browser commands
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Optional context about the current page
   * @param {Object} sessionInfo - Optional session information including history
   * @returns {Promise<Object>} - Structured browser commands
   */
  async processPrompt(prompt, pageContext = null, sessionInfo = {}) {
    console.log(`🧠 Groq service processing prompt: "${prompt.substring(0, 50)}..."`);
    
    if (!this.apiKey) {
      console.error('❌ Groq API key missing');
      throw new Error('Groq API key is required. Please provide an API key in the configuration.');
    }

    try {
      // Format the user prompt with context and history
      const userPrompt = this.formatPromptWithContext(prompt, pageContext, sessionInfo);
      
      console.log(`🌐 Sending request to Groq API with model: ${this.model}`);
      console.log(`🔑 Using API key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      console.log(`🧪 Temperature: ${this.temperature}, Max Tokens: ${this.maxTokens}`);
      
      // Build the request payload using OpenAI format
      const requestPayload = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(!!pageContext)
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      };
      
      // Log request for debugging
      console.log(`📝 Full request payload:`, JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const error = await ApiErrorHandler.handleApiError(response, 'Groq');
        throw error;
      }

      console.log(`✅ Groq API response successful`);
      const data = await response.json();
      
      // Extract the content from the response
      const content = data.choices[0].message.content;
      
      // Log response for debugging
      console.log(`📝 COMPLETE LLM RESPONSE:
==========================================
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}
==========================================`);
      
      // Parse the JSON response into commands
      return this.parseResponseContent(content);
    } catch (error) {
      console.error('❌ Error processing prompt with Groq:', error);
      throw new Error(`Failed to process prompt: ${error.message}`);
    }
  }

  /**
   * Test the connection to the Groq service
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    console.log(`🧪 Testing connection to Groq API`);
    
    if (!this.apiKey) {
      console.error(`❌ No API key provided for Groq connection test`);
      return false;
    }

    try {
      console.log(`🌐 Sending test request to Groq API (${this.apiEndpoint})`);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ],
          max_tokens: 5
        })
      });

      console.log(`📥 Test response status: ${response.status} ${response.statusText}`);
      
      return response.ok;
    } catch (error) {
      console.error('❌ Error testing connection to Groq:', error);
      return false;
    }
  }

  /**
   * Get the system prompt for the Groq API
   * Uses the shared prompt templates
   * @param {boolean} hasPageContext - Whether page context is provided
   * @returns {string} - System prompt
   */
  getSystemPrompt(hasPageContext = false) {
    return PromptTemplates.getBaseSystemPrompt(hasPageContext);
  }
}

export default GroqService;