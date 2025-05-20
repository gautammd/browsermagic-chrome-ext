/**
 * Claude API Adapter
 * Handles the specific format for Anthropic's Claude API
 */
import LLMApiAdapter from './adapter-interface';

class ClaudeApiAdapter extends LLMApiAdapter {
  constructor() {
    super();
    this.apiVersion = '2023-06-01';
  }

  /**
   * Format a request payload for Claude API
   * @param {string} prompt - The user prompt
   * @param {string} systemPrompt - The system prompt
   * @param {Object} options - Additional options
   * @returns {Object} - Formatted request payload
   */
  formatRequest(prompt, systemPrompt, options = {}) {
    const { temperature = 0.3, maxTokens = 1024, model = 'claude-3-sonnet-20240229' } = options;
    
    return {
      model: model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens
    };
  }

  /**
   * Parse Claude API response to extract content
   * @param {Object} response - Raw API response
   * @returns {string} - Extracted content
   */
  parseResponse(response) {
    if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
      throw new Error('Unexpected response format from Claude API: missing content array');
    }
    
    // Find the first text block
    const textBlock = response.content.find(block => block.type === 'text');
    
    if (!textBlock || !textBlock.text) {
      throw new Error('No text content found in Claude API response');
    }
    
    return textBlock.text;
  }

  /**
   * Format a request for testing the API connection
   * @param {Object} options - Options including model
   * @returns {Object} - Test request payload
   */
  formatTestRequest(options = {}) {
    const { model = 'claude-3-sonnet-20240229' } = options;
    
    return {
      model: model,
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
  }

  /**
   * Get headers for Claude API requests
   * @param {string} apiKey - Claude API key
   * @returns {Object} - Request headers
   */
  getRequestHeaders(apiKey) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': this.apiVersion,
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  }
}

export default ClaudeApiAdapter;