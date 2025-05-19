/**
 * Default configuration for LLM services
 */
const config = {
  // Default LLM provider to use
  defaultProvider: 'mock',
  
  // Provider-specific configurations
  providers: {
    groq: {
      apiKey: '', // To be filled by user
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      maxTokens: 1024,
      // Available models
      availableModels: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'LLaMA 3.3 70B Versatile'
        },
        {
          id: 'llama-3.3-8b-versatile',
          name: 'LLaMA 3.3 8B Versatile'
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B 32K'
        },
        {
          id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
          name: 'LLaMA 4 Maverick 17B'
        }
      ]
    },
    claude: {
      apiKey: '', // To be filled by user
      model: 'claude-3-sonnet-20240229',
      temperature: 0.3,
      maxTokens: 1024,
      // Available models from https://docs.anthropic.com/en/api/models
      availableModels: [
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet'
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus'
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku'
        }
      ]
    },
    mock: {
      delayMs: 500 // Response delay for mock service
    }
  }
};

export default config;