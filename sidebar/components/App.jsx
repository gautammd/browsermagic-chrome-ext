import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import PromptView from './PromptView';
import SettingsView from './SettingsView';
import { getSettings } from '../hooks/useStorage';

/**
 * Main App component for the sidebar
 */
const App = () => {
  // View state
  const [activeView, setActiveView] = useState('prompt');
  
  // Settings state
  const [settings, setSettings] = useState({
    provider: 'mock',
    providers: {
      mock: {
        delay: 500,
      },
      groq: {
        apiKey: '',
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
      },
      claude: {
        apiKey: '',
        model: 'claude-3-7-sonnet-20250219',
        temperature: 0.3,
      },
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = await getSettings();
      if (storedSettings) {
        setSettings(storedSettings);
      }
    };
    
    loadSettings();
  }, []);

  // Toggle between views
  const toggleView = () => {
    setActiveView(activeView === 'prompt' ? 'settings' : 'prompt');
  };

  return (
    <div className="sidebar-container">
      <Header 
        activeView={activeView} 
        onToggleView={toggleView} 
      />
      
      <main className="flex-1 overflow-hidden">
        {activeView === 'prompt' ? (
          <PromptView settings={settings} />
        ) : (
          <SettingsView 
            settings={settings} 
            setSettings={setSettings} 
            onClose={() => setActiveView('prompt')} 
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;