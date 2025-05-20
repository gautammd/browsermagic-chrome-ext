import React from 'react';
import { FiKey } from 'react-icons/fi';
import { InputField, SelectField, RangeField } from '../ui';

/**
 * OpenAI settings component
 */
const OpenAISettings = ({ settings, onChange }) => {
  const modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ];
  
  return (
    <div>
      <h3 className="text-lg font-medium text-text-primary mb-4">
        OpenAI Settings
      </h3>
      
      <InputField
        id="openai-api-key"
        label="API Key"
        type="password"
        placeholder="Enter OpenAI API key"
        value={settings.apiKey || ''}
        onChange={(e) => onChange('apiKey', e.target.value)}
        icon={<FiKey size={16} />}
      />
      
      <SelectField
        id="openai-model"
        label="Model"
        value={settings.model || 'gpt-4o'}
        options={modelOptions}
        onChange={(e) => onChange('model', e.target.value)}
      />
      
      <RangeField
        id="openai-temperature"
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

export default OpenAISettings;