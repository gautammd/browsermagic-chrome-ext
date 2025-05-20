/**
 * OpenAI API Adapter
 * Handles the specific format for OpenAI API
 */
import LLMApiAdapter from './adapter-interface';

class OpenAIAdapter extends LLMApiAdapter {
  /**
   * Format a request payload for OpenAI API
   * @param {string} prompt - The user prompt
   * @param {string} systemPrompt - The system prompt
   * @param {Object} options - Additional options
   * @returns {Object} - Formatted request payload
   */
  formatRequest(prompt, systemPrompt, options = {}) {
    const { temperature = 0.3, maxTokens = 1024, model = 'gpt-4o' } = options;
    
    return {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    };
  }

  /**
   * Parse OpenAI API response to extract content
   * @param {Object} response - Raw API response
   * @returns {string} - Extracted content
   */
  parseResponse(response) {
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new Error('Unexpected response format from OpenAI API: missing choices array');
    }
    
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content found in OpenAI API response');
    }
    
    return content;
  }

  /**
   * Format a request for testing the API connection
   * @param {Object} options - Options including model
   * @returns {Object} - Test request payload
   */
  formatTestRequest(options = {}) {
    const { model = 'gpt-4o' } = options;
    
    return {
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ],
      max_tokens: 5
    };
  }

  /**
   * Get headers for OpenAI API requests
   * @param {string} apiKey - OpenAI API key
   * @returns {Object} - Request headers
   */
  getRequestHeaders(apiKey) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }
}

export default OpenAIAdapter;