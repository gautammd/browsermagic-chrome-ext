/**
 * Simplified Claude LLM Service Implementation
 * Uses the enhanced BaseService class with adapter pattern
 */
import BaseService from './base-service.js';

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
   * @param {string} config.model - Claude model to use
   * @param {number} config.temperature - Sampling temperature (0.0 to 1.0)
   * @param {number} config.maxTokens - Maximum tokens to generate
   */
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || '',
      model: config.model || 'claude-3-sonnet-20240229',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1024,
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      provider: 'claude'
    });
    
    console.log(`🔧 Initialized Claude service with model: ${this.model}`);
  }
}

export default ClaudeService;