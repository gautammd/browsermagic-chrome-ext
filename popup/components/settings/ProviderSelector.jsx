import React from 'react';
import { motion } from 'framer-motion';

const ProviderSelector = ({ selectedProvider, onChange }) => {
  const providers = [
    { id: 'mock', name: 'Mock (Development)' },
    { id: 'groq', name: 'Groq' },
    { id: 'claude', name: 'Claude' }
  ];
  
  return (
    <div className="input-container">
      <label htmlFor="provider-select" className="input-label">
        LLM Provider
      </label>
      <select
        id="provider-select"
        className="select"
        value={selectedProvider}
        onChange={(e) => onChange(e.target.value)}
      >
        {providers.map(provider => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProviderSelector;