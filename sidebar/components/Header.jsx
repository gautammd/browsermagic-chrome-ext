import React from 'react';
// Using inline SVG instead of react-icons
import { Button } from '../../src/shared/components/ui';

/**
 * Header component with title and settings toggle
 */
const Header = ({ activeView, onToggleView }) => {
  return (
    <header className="flex justify-between items-center mb-4 pb-4 border-b border-divider">
      <h1 className="text-2xl font-semibold text-primary">
        BrowserMagic.ai
      </h1>
      
      <button
        className="btn btn-primary px-3 py-1 rounded-md text-white"
        onClick={onToggleView}
      >
        {activeView === 'prompt' ? 'Settings' : 'Close'}
      </button>
    </header>
  );
};

export default Header;