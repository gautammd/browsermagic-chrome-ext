import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import PromptView from './PromptView';
import SettingsView from './SettingsView';
import { getSettings } from '../utils/storage';

const Sidebar = () => {
  const [activeView, setActiveView] = useState('prompt');
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

  useEffect(() => {
    // Load settings from storage when the component mounts
    const loadSettings = async () => {
      const storedSettings = await getSettings();
      if (storedSettings) {
        setSettings(storedSettings);
      }
    };
    
    loadSettings();
  }, []);

  return (
    <div className="sidebar-container">
      <Header 
        activeView={activeView} 
        onToggleView={() => setActiveView(activeView === 'prompt' ? 'settings' : 'prompt')} 
      />
      
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {activeView === 'prompt' ? (
          <PromptView key="prompt" settings={settings} />
        ) : (
          <SettingsView 
            key="settings" 
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

export default Sidebar;