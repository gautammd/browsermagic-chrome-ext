import React from 'react';
import { FiKey } from 'react-icons/fi';
import { InputField, SelectField, RangeField } from '../ui';

/**
 * Groq settings component
 */
const GroqSettings = ({ settings, onChange }) => {
  const modelOptions = [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
    { value: 'llama-3.1-405b-reasoning', label: 'Llama 3.1 405B Reasoning' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' }
  ];
  
  return (
    <div>
      <h3 className="text-lg font-medium text-text-primary mb-4">
        Groq Settings
      </h3>
      
      <InputField
        id="groq-api-key"
        label="API Key"
        type="password"
        placeholder="Enter Groq API key"
        value={settings.apiKey || ''}
        onChange={(e) => onChange('apiKey', e.target.value)}
        icon={<FiKey size={16} />}
      />
      
      <SelectField
        id="groq-model"
        label="Model"
        value={settings.model || 'llama-3.3-70b-versatile'}
        options={modelOptions}
        onChange={(e) => onChange('model', e.target.value)}
      />
      
      <RangeField
        id="groq-temperature"
        label="Temperature"
        min="0"
        max="1"
        step="0.1"
        value={settings.temperature || 0.3}
        onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
      />
    </div>
  );
};

export default GroqSettings;