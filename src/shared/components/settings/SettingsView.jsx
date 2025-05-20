import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { Button, Card, StatusMessage } from '../ui';
import { ProviderSelector, GroqSettings, OpenAISettings } from '.';

/**
 * Settings view component for configuring providers
 */
const SettingsView = ({ settings, onSave, onClose, serviceTester }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [isSaving, setIsSaving] = useState(false);
  
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
    setStatus({ message: '', type: 'info' });
    
    try {
      // Test connection before saving
      await testConnection(localSettings);
      
      // If test is successful, save settings
      await onSave(localSettings);
      
      setStatus({
        message: 'Settings saved successfully!',
        type: 'success'
      });
    } catch (error) {
      setStatus({
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Test connection to the service
   */
  const testConnection = async (settings) => {
    const provider = settings.provider;
    const config = settings.providers[provider];
    
    if (!config.apiKey) {
      throw new Error(`API key is required for ${provider}`);
    }
    
    try {
      setStatus({
        message: `Testing connection to ${provider}...`,
        type: 'info'
      });
      
      await serviceTester({ provider, config });
      
      setStatus({
        message: `Connection to ${provider} successful!`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      setStatus({
        message: `Connection failed: ${error.message}`,
        type: 'error'
      });
      
      throw error;
    }
  };

  /**
   * Render provider specific settings
   */
  const renderProviderSettings = () => {
    const provider = localSettings.provider;
    const providerSettings = localSettings.providers[provider] || {};
    
    const handleChange = (key, value) => {
      handleSettingChange(provider, key, value);
    };
    
    switch (provider) {
      case 'groq':
        return <GroqSettings settings={providerSettings} onChange={handleChange} />;
      case 'openai':
        return <OpenAISettings settings={providerSettings} onChange={handleChange} />;
      default:
        return <div>No settings available for {provider}</div>;
    }
  };

  return (
    <Card title="Settings">
      <ProviderSelector 
        selectedProvider={localSettings.provider} 
        onChange={handleProviderChange}
      />
      
      {renderProviderSettings()}
      
      <div className="mt-6 flex justify-between">
        <Button 
          variant="secondary" 
          onClick={onClose}
        >
          Cancel
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleSave}
          isLoading={isSaving}
          icon={<FiSave />}
        >
          Save
        </Button>
      </div>
      
      {status.message && (
        <StatusMessage message={status.message} type={status.type} />
      )}
    </Card>
  );
};

export default SettingsView;