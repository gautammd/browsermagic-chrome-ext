/**
 * LLM API Adapter Interface
 * Base interface for all LLM API adapters
 */

/**
 * Abstract class that defines the adapter interface
 * Each LLM service adapter must implement these methods
 */
class LLMApiAdapter {
  /**
   * Format a request for the specific API
   * @param {string} prompt - The user prompt
   * @param {string} systemPrompt - The system prompt
   * @param {Object} options - Additional options for the request
   * @returns {Object} - Formatted request payload
   */
  formatRequest(prompt, systemPrompt, options) {
    throw new Error('Method not implemented. Each API adapter must implement formatRequest.');
  }

  /**
   * Parse the API response to extract content
   * @param {Object} response - The raw API response
   * @returns {string} - Extracted content
   */
  parseResponse(response) {
    throw new Error('Method not implemented. Each API adapter must implement parseResponse.');
  }

  /**
   * Format a request for testing the API connection
   * @returns {Object} - Test request payload
   */
  formatTestRequest() {
    throw new Error('Method not implemented. Each API adapter must implement formatTestRequest.');
  }

  /**
   * Get the appropriate headers for the API request
   * @param {string} apiKey - The API key
   * @param {Object} options - Additional options for headers
   * @returns {Object} - Request headers
   */
  getRequestHeaders(apiKey, options = {}) {
    throw new Error('Method not implemented. Each API adapter must implement getRequestHeaders.');
  }
}

export default LLMApiAdapter;