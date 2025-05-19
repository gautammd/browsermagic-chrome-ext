import React from 'react';
import { motion } from 'framer-motion';
import { FiKey } from 'react-icons/fi';

const GroqSettings = ({ settings, onChange }) => {
  const models = [
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B Versatile' },
    { id: 'llama-3.3-8b-versatile', name: 'LLaMA 3.3 8B Versatile' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32K' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'LLaMA 4 Maverick 17B' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 style={{ 
        fontSize: 'var(--font-size-lg)',
        marginBottom: 'var(--spacing-md)',
        color: 'var(--color-text-primary)'
      }}>
        Groq Settings
      </h3>
      
      <div className="input-container">
        <label htmlFor="groq-api-key" className="input-label">
          API Key
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="groq-api-key"
            type="password"
            className="input"
            placeholder="Enter Groq API key"
            value={settings.apiKey}
            onChange={(e) => onChange('apiKey', e.target.value)}
          />
          <FiKey 
            size={16} 
            className="input-icon"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </div>
      </div>
      
      <div className="input-container">
        <label htmlFor="groq-model" className="input-label">
          Model
        </label>
        <select
          id="groq-model"
          className="select"
          value={settings.model}
          onChange={(e) => onChange('model', e.target.value)}
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="input-container">
        <label htmlFor="groq-temperature" className="input-label">
          Temperature: {settings.temperature}
        </label>
        <div className="range-container">
          <input
            id="groq-temperature"
            type="range"
            className="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default GroqSettings;