import React from 'react';
import SelectField from '../ui/SelectField';

/**
 * Provider selector component
 */
const ProviderSelector = ({ selectedProvider, onChange }) => {
  const options = [
    { value: 'mock', label: 'Mock (Development)' },
    { value: 'groq', label: 'Groq' },
    { value: 'claude', label: 'Claude' }
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