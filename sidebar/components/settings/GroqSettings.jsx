import React from 'react';
import { FiKey } from 'react-icons/fi';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import RangeField from '../ui/RangeField';

/**
 * Groq settings component
 */
const GroqSettings = ({ settings, onChange }) => {
  const modelOptions = [
    { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B Versatile' },
    { value: 'llama-3.3-8b-versatile', label: 'LLaMA 3.3 8B Versatile' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B 32K' },
    { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'LLaMA 4 Maverick 17B' }
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
        value={settings.apiKey}
        onChange={(e) => onChange('apiKey', e.target.value)}
        icon={<FiKey size={16} />}
      />
      
      <SelectField
        id="groq-model"
        label="Model"
        value={settings.model}
        options={modelOptions}
        onChange={(e) => onChange('model', e.target.value)}
      />
      
      <RangeField
        id="groq-temperature"
        label="Temperature"
        min="0"
        max="1"
        step="0.1"
        value={settings.temperature}
        onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
      />
    </div>
  );
};

export default GroqSettings;