import React from 'react';
import { CheckField } from '../ui';

/**
 * Developer settings component for advanced configuration
 */
const DeveloperSettings = ({ settings, onChange }) => {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="text-sm font-medium mb-2">Developer Options</h3>
      
      {/* Detailed API Logging toggle */}
      <CheckField 
        id="detailed-api-logging"
        label="Detailed API Logging"
        description="Log full request and response payloads for debugging"
        checked={settings.detailedApiLogging || false}
        onChange={(checked) => onChange('detailedApiLogging', checked)}
      />
    </div>
  );
};

export default DeveloperSettings;