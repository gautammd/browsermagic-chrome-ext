/**
 * API Adapter Factory
 * Central factory for creating appropriate API adapters
 */
import GroqApiAdapter from './groq-adapter';
import OpenAIAdapter from './openai-adapter';

/**
 * Factory class for creating API adapters
 */
class ApiAdapterFactory {
  /**
   * Create the appropriate API adapter based on provider name
   * @param {string} provider - The provider name ('openai', 'groq', etc.)
   * @returns {LLMApiAdapter} - Instance of the appropriate adapter
   */
  static createAdapter(provider) {
    switch (provider.toLowerCase()) {
      case 'groq':
        return new GroqApiAdapter();
      case 'openai':
        return new OpenAIAdapter();
      default:
        throw new Error(`No adapter available for provider: ${provider}`);
    }
  }
}

export default ApiAdapterFactory;