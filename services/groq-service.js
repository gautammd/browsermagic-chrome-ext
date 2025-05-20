/**
 * Simplified Groq LLM Service Implementation
 * Uses the enhanced BaseService class with adapter pattern
 */
import BaseService from './base-service.js';
import { Logger } from '../src/shared/utils';

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
   * @param {string} config.model - Groq model to use
   * @param {number} config.temperature - Sampling temperature (0.0 to 1.0)
   * @param {number} config.maxTokens - Maximum tokens to generate
   */
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || '',
      model: config.model || 'llama-3.3-70b-versatile',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1024,
      apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
      provider: 'groq'
    });
    
    Logger.info(`Initialized Groq service with model: ${this.model}`);
  }
}

export default GroqService;