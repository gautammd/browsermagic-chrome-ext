import React from 'react';
import { SelectField } from '../ui';

/**
 * Provider selector component for choosing the LLM service provider
 */
const ProviderSelector = ({ selectedProvider, onChange }) => {
  const options = [
    { value: 'groq', label: 'Groq' },
    { value: 'openai', label: 'OpenAI' }
  ];
  
  return (
    <SelectField
      id="provider-select"
      label="LLM Provider"
      value={selectedProvider}
      options={options}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default ProviderSelector;