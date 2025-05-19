/**
 * Factory class for creating LLM service instances
 */
import GroqService from './groq-service.js';
import MetaService from './meta-service.js';
import MockService from './mock-service.js';
import ClaudeService from './claude-service.js';

/**
 * Factory class for creating LLM service instances
 * Centralizes the creation of different service implementations
 */
class LLMServiceFactory {
  /**
   * Create an LLM service instance based on the provider name
   * @param {string} provider - The service provider name ('groq', 'meta', 'claude', 'mock', etc.)
   * @param {Object} config - Configuration object for the service
   * @returns {LLMService} - An instance of the requested LLM service
   */
  static createService(provider, config = {}) {
    switch (provider.toLowerCase()) {
      case 'groq':
        return new GroqService(config);
      case 'meta':
        return new MetaService(config);
      case 'claude':
        return new ClaudeService(config);
      case 'mock':
        return new MockService(config);
      default:
        console.warn(`Unknown provider: ${provider}. Using MockService as fallback.`);
        return new MockService(config);
    }
  }
}

export default LLMServiceFactory;