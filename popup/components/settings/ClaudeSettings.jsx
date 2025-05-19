import React from 'react';
import { motion } from 'framer-motion';
import { FiKey } from 'react-icons/fi';

const ClaudeSettings = ({ settings, onChange }) => {
  const models = [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' }
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
        Claude Settings
      </h3>
      
      <div className="input-container">
        <label htmlFor="claude-api-key" className="input-label">
          API Key
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="claude-api-key"
            type="password"
            className="input"
            placeholder="Enter Claude API key"
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
        <label htmlFor="claude-model" className="input-label">
          Model
        </label>
        <select
          id="claude-model"
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
        <label htmlFor="claude-temperature" className="input-label">
          Temperature: {settings.temperature}
        </label>
        <div className="range-container">
          <input
            id="claude-temperature"
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

export default ClaudeSettings;