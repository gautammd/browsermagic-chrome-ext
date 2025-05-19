document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements for prompt interface
  const promptInput = document.getElementById('prompt-input');
  const executeBtn = document.getElementById('execute-btn');
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');
  
  // DOM elements for settings interface
  const settingsBtn = document.getElementById('settings-btn');
  const promptView = document.getElementById('prompt-view');
  const settingsView = document.getElementById('settings-view');
  const providerSelect = document.getElementById('provider-select');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const connectionStatus = document.getElementById('connection-status');
  
  // Provider-specific settings elements
  const providerSettings = document.querySelectorAll('.provider-settings');
  const groqSettings = document.getElementById('groq-settings');
  const claudeSettings = document.getElementById('claude-settings');
  const mockSettings = document.getElementById('mock-settings');
  
  // Groq settings elements
  const groqApiKey = document.getElementById('groq-api-key');
  const groqModel = document.getElementById('groq-model');
  const groqTemperature = document.getElementById('groq-temperature');
  const groqTemperatureValue = document.getElementById('groq-temperature-value');
  
  // Claude settings elements
  const claudeApiKey = document.getElementById('claude-api-key');
  const claudeModel = document.getElementById('claude-model');
  const claudeTemperature = document.getElementById('claude-temperature');
  const claudeTemperatureValue = document.getElementById('claude-temperature-value');
  
  // Mock settings elements
  const mockDelay = document.getElementById('mock-delay');
  
  // Load saved settings
  await loadSettings();
  
  // Setup event listeners
  executeBtn.addEventListener('click', handleExecutePrompt);
  settingsBtn.addEventListener('click', showSettingsView);
  providerSelect.addEventListener('change', handleProviderChange);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', showPromptView);
  testConnectionBtn.addEventListener('click', testConnection);
  groqTemperature.addEventListener('input', updateGroqTemperatureValue);
  claudeTemperature.addEventListener('input', updateClaudeTemperatureValue);
  
  /**
   * Handle execute prompt button click
   */
  async function handleExecutePrompt() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      alert('Please enter instructions before executing.');
      return;
    }
    
    try {
      // Show loading state
      executeBtn.disabled = true;
      statusContainer.classList.remove('hidden');
      statusMessage.textContent = 'Processing your request...';
      
      // Get the active tab info to check if it's a valid page
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0) {
        const url = tabs[0].url || '';
        // Check if on a restricted page
        if (url.startsWith('chrome://') || 
            url.startsWith('chrome-extension://') || 
            url.startsWith('chrome-search://') ||
            url.startsWith('devtools://') ||
            url.startsWith('edge://') ||
            url.startsWith('about:') ||
            url === 'chrome://newtab/') {
          throw new Error('Cannot execute on this page. Please navigate to a regular website first.');
        }
      }
      
      // Send prompt to background script
      const response = await chrome.runtime.sendMessage({
        action: 'processPrompt',
        prompt
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      statusMessage.textContent = 'Instructions received! Executing...';
      
      // Clear input after successful processing
      setTimeout(() => {
        promptInput.value = '';
        statusContainer.classList.add('hidden');
        executeBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error processing prompt:', error);
      
      // Set error message and highlight restricted pages in red
      const errorMessage = error.message || 'Failed to process your request';
      statusMessage.innerHTML = `Error: ${errorMessage}`;
      
      // Add highlighting for restricted page errors
      if (errorMessage.includes('Cannot execute on this page') || 
          errorMessage.includes('Please navigate to a regular website')) {
        statusMessage.style.color = '#ff3b30';
        statusMessage.style.fontWeight = 'bold';
      }
      
      // Keep the error visible a bit longer for restricted pages
      const timeout = errorMessage.includes('Cannot execute') ? 5000 : 3000;
      
      setTimeout(() => {
        statusContainer.classList.add('hidden');
        executeBtn.disabled = false;
        // Reset styles
        statusMessage.style.color = '';
        statusMessage.style.fontWeight = '';
      }, timeout);
    }
  }
  
  /**
   * Show the settings view
   */
  function showSettingsView() {
    promptView.classList.remove('active');
    settingsView.classList.add('active');
  }
  
  /**
   * Show the prompt view
   */
  function showPromptView() {
    settingsView.classList.remove('active');
    promptView.classList.add('active');
  }
  
  /**
   * Handle provider selection change
   */
  function handleProviderChange() {
    const selectedProvider = providerSelect.value;
    
    // Hide all provider settings
    providerSettings.forEach(element => {
      element.classList.remove('active');
    });
    
    // Show selected provider settings
    if (selectedProvider === 'groq') {
      groqSettings.classList.add('active');
    } else if (selectedProvider === 'claude') {
      claudeSettings.classList.add('active');
    } else if (selectedProvider === 'mock') {
      mockSettings.classList.add('active');
    }
    
    // Hide connection status
    connectionStatus.classList.add('hidden');
  }
  
  /**
   * Update Groq temperature value display
   */
  function updateGroqTemperatureValue() {
    groqTemperatureValue.textContent = groqTemperature.value;
  }
  
  /**
   * Update Claude temperature value display
   */
  function updateClaudeTemperatureValue() {
    claudeTemperatureValue.textContent = claudeTemperature.value;
  }
  
  /**
   * Save settings to storage
   */
  async function saveSettings() {
    const provider = providerSelect.value;
    let config = {};
    
    try {
      if (provider === 'groq') {
        config = {
          apiKey: groqApiKey.value,
          model: groqModel.value,
          temperature: parseFloat(groqTemperature.value)
        };
      } else if (provider === 'claude') {
        config = {
          apiKey: claudeApiKey.value,
          model: claudeModel.value,
          temperature: parseFloat(claudeTemperature.value)
        };
      } else if (provider === 'mock') {
        config = {
          delayMs: parseInt(mockDelay.value)
        };
      }
      
      const response = await chrome.runtime.sendMessage({
        action: 'updateServiceConfig',
        provider,
        config
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show success message
      connectionStatus.textContent = 'Settings saved successfully!';
      connectionStatus.classList.remove('hidden', 'error');
      connectionStatus.classList.add('success');
      
      // Return to prompt view after a delay
      setTimeout(() => {
        showPromptView();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Show error message
      connectionStatus.textContent = `Error: ${error.message || 'Failed to save settings'}`;
      connectionStatus.classList.remove('hidden', 'success');
      connectionStatus.classList.add('error');
    }
  }
  
  /**
   * Test connection to the selected provider
   */
  async function testConnection() {
    const provider = providerSelect.value;
    let config = {};
    
    try {
      connectionStatus.textContent = 'Testing connection...';
      connectionStatus.classList.remove('hidden', 'success', 'error');
      
      if (provider === 'groq') {
        config = {
          apiKey: groqApiKey.value,
          model: groqModel.value,
          temperature: parseFloat(groqTemperature.value)
        };
      } else if (provider === 'claude') {
        config = {
          apiKey: claudeApiKey.value,
          model: claudeModel.value,
          temperature: parseFloat(claudeTemperature.value)
        };
      } else if (provider === 'mock') {
        config = {
          delayMs: parseInt(mockDelay.value)
        };
      }
      
      const response = await chrome.runtime.sendMessage({
        action: 'updateServiceConfig',
        provider,
        config
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show success message
      connectionStatus.textContent = 'Connection successful!';
      connectionStatus.classList.remove('error');
      connectionStatus.classList.add('success');
      
    } catch (error) {
      console.error('Error testing connection:', error);
      
      // Show error message
      connectionStatus.textContent = `Error: ${error.message || 'Connection failed'}`;
      connectionStatus.classList.remove('success');
      connectionStatus.classList.add('error');
    }
  }
  
  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['provider', 'serviceConfig']);
      
      if (result.provider) {
        providerSelect.value = result.provider;
        
        // Show appropriate provider settings
        handleProviderChange();
        
        // Set provider-specific settings
        if (result.provider === 'groq' && result.serviceConfig) {
          groqApiKey.value = result.serviceConfig.apiKey || '';
          groqModel.value = result.serviceConfig.model || 'llama-3.3-70b-versatile';
          groqTemperature.value = result.serviceConfig.temperature || 0.3;
          updateGroqTemperatureValue();
        } else if (result.provider === 'claude' && result.serviceConfig) {
          claudeApiKey.value = result.serviceConfig.apiKey || '';
          claudeModel.value = result.serviceConfig.model || 'claude-3-7-sonnet-20250219';
          claudeTemperature.value = result.serviceConfig.temperature || 0.3;
          updateClaudeTemperatureValue();
        } else if (result.provider === 'mock' && result.serviceConfig) {
          mockDelay.value = result.serviceConfig.delayMs || 500;
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
});