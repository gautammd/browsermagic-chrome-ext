/**
 * Groq API Adapter
 * Handles the specific format for Groq API (OpenAI-compatible)
 */
import LLMApiAdapter from './adapter-interface';

class GroqApiAdapter extends LLMApiAdapter {
  /**
   * Format a request payload for Groq API (OpenAI-compatible)
   * @param {string} prompt - The user prompt
   * @param {string} systemPrompt - The system prompt
   * @param {Object} options - Additional options
   * @returns {Object} - Formatted request payload
   */
  formatRequest(prompt, systemPrompt, options = {}) {
    const { temperature = 0.3, maxTokens = 1024, model = 'llama-3.3-70b-versatile' } = options;
    
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
   * Parse Groq API response to extract content
   * @param {Object} response - Raw API response
   * @returns {string} - Extracted content
   */
  parseResponse(response) {
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new Error('Unexpected response format from Groq API: missing choices array');
    }
    
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content found in Groq API response');
    }
    
    return content;
  }

  /**
   * Format a request for testing the API connection
   * @param {Object} options - Options including model
   * @returns {Object} - Test request payload
   */
  formatTestRequest(options = {}) {
    const { model = 'llama-3.3-70b-versatile' } = options;
    
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
   * Get headers for Groq API requests
   * @param {string} apiKey - Groq API key
   * @returns {Object} - Request headers
   */
  getRequestHeaders(apiKey) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }
}

export default GroqApiAdapter;