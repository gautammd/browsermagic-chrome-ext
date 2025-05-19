import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { saveSettings } from '../utils/storage';
import ProviderSelector from './settings/ProviderSelector';
import GroqSettings from './settings/GroqSettings';
import ClaudeSettings from './settings/ClaudeSettings';
import MockSettings from './settings/MockSettings';

const SettingsView = ({ settings, setSettings, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [testStatus, setTestStatus] = useState({ status: '', isError: false });
  const [isSaving, setIsSaving] = useState(false);

  const handleProviderChange = (provider) => {
    setLocalSettings(prev => ({
      ...prev,
      provider
    }));
  };

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save settings to storage
      await saveSettings(localSettings);
      
      // Update service configuration in background
      chrome.runtime.sendMessage({
        action: 'updateServiceConfig',
        provider: localSettings.provider,
        config: localSettings.providers[localSettings.provider]
      }, response => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to update service configuration');
        }
        
        // Update parent component state
        setSettings(localSettings);
        setTestStatus({ status: 'Settings saved successfully!', isError: false });
        
        // Close settings view after 1 second
        setTimeout(() => {
          onClose();
        }, 1000);
      });
    } catch (error) {
      setTestStatus({ status: `Error saving settings: ${error.message}`, isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ status: 'Testing connection...', isError: false });
    
    try {
      chrome.runtime.sendMessage({
        action: 'testConnection',
        settings: localSettings
      }, response => {
        if (chrome.runtime.lastError) {
          setTestStatus({ status: `Error: ${chrome.runtime.lastError.message}`, isError: true });
          return;
        }

        if (response.success) {
          setTestStatus({ status: 'Connection successful!', isError: false });
        } else {
          setTestStatus({ status: `Error: ${response.error}`, isError: true });
        }
      });
    } catch (error) {
      setTestStatus({ status: `Error: ${error.message}`, isError: true });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <div className="card">
        <h2 style={{ 
          fontSize: 'var(--font-size-xl)', 
          marginBottom: 'var(--spacing-lg)',
          color: 'var(--color-text-primary)'
        }}>
          Provider Settings
        </h2>
        
        <ProviderSelector
          selectedProvider={localSettings.provider}
          onChange={handleProviderChange}
        />
        
        <div className="provider-settings-container" style={{ marginTop: 'var(--spacing-lg)' }}>
          {localSettings.provider === 'groq' && (
            <GroqSettings
              settings={localSettings.providers.groq}
              onChange={(key, value) => handleSettingChange('groq', key, value)}
            />
          )}
          
          {localSettings.provider === 'claude' && (
            <ClaudeSettings
              settings={localSettings.providers.claude}
              onChange={(key, value) => handleSettingChange('claude', key, value)}
            />
          )}
          
          {localSettings.provider === 'mock' && (
            <MockSettings
              settings={localSettings.providers.mock}
              onChange={(key, value) => handleSettingChange('mock', key, value)}
            />
          )}
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: 'var(--spacing-xl)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Saving...
              </>
            ) : (
              <>
                Save <FiSave size={16} />
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleTestConnection}
          className="btn btn-success"
          style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
          disabled={isSaving}
        >
          Test Connection
        </button>
        
        {testStatus.status && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              backgroundColor: testStatus.isError 
                ? 'rgba(255, 59, 48, 0.1)' 
                : 'rgba(52, 199, 89, 0.1)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}
          >
            {testStatus.isError ? (
              <FiAlertCircle size={18} color="var(--color-error)" />
            ) : (
              <FiCheck size={18} color="var(--color-success)" />
            )}
            <p>{testStatus.status}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SettingsView;