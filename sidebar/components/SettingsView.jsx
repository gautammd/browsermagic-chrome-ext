import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { Button, Card, StatusMessage } from '../../src/shared/components/ui';
import { ProviderSelector, GroqSettings, OpenAISettings } from '../../src/shared/components/settings';
import { saveSettings, useBackgroundMessaging } from '../../src/shared/hooks';

/**
 * Settings view component for configuring providers
 */
const SettingsView = ({ settings, setSettings, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [isSaving, setIsSaving] = useState(false);
  
  const { updateServiceConfig, testConnection } = useBackgroundMessaging();

  /**
   * Handle provider change
   */
  const handleProviderChange = (provider) => {
    setLocalSettings(prev => ({
      ...prev,
      provider
    }));
  };

  /**
   * Handle setting change for specific provider
   */
  const handleSettingChange = (provider, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          [key]: value
        }
      }
    }));
  };

  /**
   * Handle settings save
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save settings to storage
      await saveSettings(localSettings);
      
      // Update service configuration in background
      await updateServiceConfig(
        localSettings.provider, 
        localSettings.providers[localSettings.provider]
      );
      
      // Update parent component state
      setSettings(localSettings);
      setStatus({ message: 'Settings saved!', type: 'success' });
      
      // Close settings view immediately
      onClose();
    } catch (error) {
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
      setIsSaving(false);
    }
  };

  /**
   * Handle test connection
   */
  const handleTestConnection = async () => {
    setStatus({ message: 'Testing connection...', type: 'info' });
    
    try {
      const response = await testConnection(localSettings);
      
      if (response.success) {
        setStatus({ message: 'Connection successful!', type: 'success' });
      } else {
        setStatus({ message: `Error: ${response.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  /**
   * Render provider-specific settings
   */
  const renderProviderSettings = () => {
    switch (localSettings.provider) {
      case 'groq':
        return (
          <GroqSettings
            settings={localSettings.providers.groq}
            onChange={(key, value) => handleSettingChange('groq', key, value)}
          />
        );
      case 'openai':
        return (
          <OpenAISettings
            settings={localSettings.providers.openai || {}}
            onChange={(key, value) => handleSettingChange('openai', key, value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <Card title="Provider Settings">
        <ProviderSelector
          selectedProvider={localSettings.provider}
          onChange={handleProviderChange}
        />
        
        <div className="mt-6">
          {renderProviderSettings()}
        </div>
        
        <div className="flex justify-between mt-8 gap-4">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            isLoading={isSaving}
            icon={<FiSave size={16} />}
          >
            Save
          </Button>
        </div>

        <Button
          variant="success"
          className="w-full mt-4"
          onClick={handleTestConnection}
          disabled={isSaving}
        >
          Test Connection
        </Button>
        
        {status.message && (
          <StatusMessage
            message={status.message}
            type={status.type}
          />
        )}
      </Card>
    </div>
  );
};

export default SettingsView;