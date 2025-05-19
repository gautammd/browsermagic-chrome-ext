import React from 'react';
import { FiSettings, FiX } from 'react-icons/fi';
import Button from './ui/Button';

/**
 * Header component with title and settings toggle
 */
const Header = ({ activeView, onToggleView }) => {
  return (
    <header className="flex justify-between items-center mb-4 pb-4 border-b border-divider">
      <h1 className="text-2xl font-semibold text-primary">
        BrowserMagic.ai
      </h1>
      
      <Button
        variant="ghost"
        className="w-8 h-8 p-1.5 rounded-full"
        onClick={onToggleView}
        aria-label={activeView === 'prompt' ? 'Settings' : 'Close Settings'}
      >
        {activeView === 'prompt' ? (
          <FiSettings size={20} />
        ) : (
          <FiX size={20} />
        )}
      </Button>
    </header>
  );
};

export default Header;