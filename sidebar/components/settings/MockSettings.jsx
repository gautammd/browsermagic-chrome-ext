import React from 'react';
import { FiClock } from 'react-icons/fi';
import InputField from '../ui/InputField';

/**
 * Mock settings component for development
 */
const MockSettings = ({ settings, onChange }) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-text-primary mb-4">
        Mock Settings (For Development)
      </h3>
      
      <InputField
        id="mock-delay"
        label="Simulated Delay (ms)"
        type="number"
        min="0"
        max="5000"
        value={settings.delay}
        onChange={(e) => onChange('delay', parseInt(e.target.value, 10))}
        icon={<FiClock size={16} />}
      />
      
      <div className="mt-6 p-4 bg-warning/10 rounded-md text-sm">
        <p>Mock mode simulates LLM responses for development and testing purposes only. No API requests will be made.</p>
      </div>
    </div>
  );
};

export default MockSettings;