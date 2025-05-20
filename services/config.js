/**
 * Default configuration for LLM services
 * This file now imports from the centralized configuration system
 */
import { config } from '../src/shared/utils';

// LLM model options for dropdowns
const modelOptions = {
  groq: [
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
  ],
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini'
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo'
    },
    {
      id: 'gpt-4',
      name: 'GPT-4'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo'
    }
  ]
};

// Get service configuration from centralized config
const serviceConfig = config.getSection('service');

// Extend with model options
const extendedConfig = {
  ...serviceConfig,
  modelOptions
};

export default extendedConfig;