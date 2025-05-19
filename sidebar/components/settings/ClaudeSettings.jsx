import React from 'react';
import { FiKey } from 'react-icons/fi';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import RangeField from '../ui/RangeField';

/**
 * Claude settings component
 */
const ClaudeSettings = ({ settings, onChange }) => {
  const modelOptions = [
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' }
  ];

  return (
    <div>
      <h3 className="text-lg font-medium text-text-primary mb-4">
        Claude Settings
      </h3>
      
      <InputField
        id="claude-api-key"
        label="API Key"
        type="password"
        placeholder="Enter Claude API key"
        value={settings.apiKey}
        onChange={(e) => onChange('apiKey', e.target.value)}
        icon={<FiKey size={16} />}
      />
      
      <SelectField
        id="claude-model"
        label="Model"
        value={settings.model}
        options={modelOptions}
        onChange={(e) => onChange('model', e.target.value)}
      />
      
      <RangeField
        id="claude-temperature"
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

export default ClaudeSettings;