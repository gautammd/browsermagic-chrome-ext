import React from 'react';

/**
 * Popup component that redirects users to use the sidebar
 */
const App = () => {
  const openSidebar = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
        window.close(); // Close the popup
      }
    });
  };

  return (
    <div className="w-80 p-4 flex flex-col items-center">
      <h1 className="text-xl font-semibold text-primary mb-4">BrowserMagic.ai</h1>
      
      <p className="text-center text-text-secondary mb-6">
        BrowserMagic now uses a sidebar interface for a better experience.
      </p>
      
      <button 
        onClick={openSidebar}
        className="btn btn-primary w-full"
      >
        Open Sidebar
      </button>
      
      <p className="text-xs text-text-tertiary mt-4">
        Click the extension icon in the toolbar to open the sidebar directly in the future.
      </p>
    </div>
  );
};

export default App;