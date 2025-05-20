/**
 * OpenAI Service Implementation
 * Uses the enhanced BaseService class with adapter pattern
 */
import BaseService from './base-service.js';

/**
 * OpenAI Service Implementation
 * Handles communication with the OpenAI API
 * @extends BaseService
 */
class OpenAIService extends BaseService {
  /**
   * Initialize the OpenAI service
   * @param {Object} config - Configuration object for the service
   * @param {string} config.apiKey - OpenAI API key
   * @param {string} config.model - OpenAI model to use
   * @param {number} config.temperature - Sampling temperature (0.0 to 1.0)
   * @param {number} config.maxTokens - Maximum tokens to generate
   */
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || '',
      model: config.model || 'gpt-4o',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1024,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      provider: 'openai'
    });
    
    console.log(`🔧 Initialized OpenAI service with model: ${this.model}`);
  }
}

export default OpenAIService;