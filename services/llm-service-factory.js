/**
 * Factory class for creating LLM service instances
 */
import GroqService from './groq-service.js';
import OpenAIService from './openai-service.js';

/**
 * Factory class for creating LLM service instances
 * Centralizes the creation of different service implementations
 */
class LLMServiceFactory {
  /**
   * Create an LLM service instance based on the provider name
   * @param {string} provider - The service provider name ('groq', 'openai', etc.)
   * @param {Object} config - Configuration object for the service
   * @returns {LLMService} - An instance of the requested LLM service
   */
  static createService(provider, config = {}) {
    switch (provider.toLowerCase()) {
      case 'groq':
        return new GroqService(config);
      case 'openai':
        return new OpenAIService(config);
      default:
        console.warn(`Unknown provider: ${provider}. Using Groq as fallback.`);
        return new GroqService(config);
    }
  }
}

export default LLMServiceFactory;