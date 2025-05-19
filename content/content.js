/**
 * BrowserMagic.ai Content Script
 * Executes commands and provides page context for LLM-based automation
 */
import * as DOMUtils from '../services/dom-utils.js';
import { CommandExecutor } from '../services/command-executor.js';

// Log initialization
console.log('BrowserMagic.ai content script initialized');

// Listen for messages from the background script
console.log('🚀 Content script initialized and ready to receive messages');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📩 Content script received message:', message.action);
  
  // Handle ping messages for content script presence detection
  if (message.action === 'ping') {
    console.log('🏓 Responding to ping message');
    sendResponse({ status: 'alive' });
    return false; // No async response needed for ping
  }
  
  // Handle DOM stability check
  if (message.action === 'checkDomStability') {
    console.log('🔍 Checking DOM stability');
    
    try {
      // Check if page is still loading
      const isLoading = document.readyState !== 'complete';
      
      // Check for ongoing network requests in modern browsers
      // These are rough heuristics for detecting if the page is still loading
      let hasPendingRequests = false;
      
      // Check for animations and transitions
      const hasActiveAnimations = document.getAnimations && 
                                document.getAnimations().some(anim => 
                                  anim.playState === 'running');
                                  
      // Count elements being rendered                            
      const currentElementCount = document.querySelectorAll('*').length;
      
      // Store this count in a data attribute for comparison next time
      const previousCount = parseInt(document.body.dataset.elementCount || '0');
      document.body.dataset.elementCount = currentElementCount.toString();
      
      // Check if the DOM is still growing significantly
      const significantGrowth = currentElementCount > previousCount + 5;
      
      console.log(`DOM stability check - isLoading: ${isLoading}, hasActiveAnimations: ${hasActiveAnimations}, currentElements: ${currentElementCount}, previousElements: ${previousCount}`);
      
      sendResponse({ 
        success: true, 
        isLoading: isLoading || hasPendingRequests || hasActiveAnimations || significantGrowth
      });
    } catch (error) {
      console.error('❌ Error checking DOM stability:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Unknown error checking DOM stability',
        isLoading: false // Assume not loading if there's an error
      });
    }
    
    return true; // Indicate async response
  }
  
  // Handle fast snapshot request
  if (message.action === 'fastSnapshot') {
    console.log('📸 Starting fast page snapshot');
    try {
      const startTime = performance.now();
      const options = message.options || {};
      const snapshot = DOMUtils.fastSnapshot(options);
      const endTime = performance.now();
      
      console.log(`✅ Fast snapshot complete in ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 Captured ${snapshot.keyElements?.length || 0} key elements`);
      
      sendResponse({ success: true, snapshot });
    } catch (error) {
      console.error('❌ Error taking fast snapshot:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Unknown error taking snapshot' 
      });
    }
    
    return true; // Indicate async response
  }
  
  // Handle full page context extraction
  if (message.action === 'extractPageContext') {
    console.log('🔍 Starting page context extraction');
    try {
      console.log('📊 Current URL:', window.location.href);
      console.log('📑 Page title:', document.title);
      
      const startTime = performance.now();
      const pageContext = DOMUtils.extractPageContext();
      const endTime = performance.now();
      
      console.log(`✅ Page context extraction complete in ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 Found ${pageContext.elements.length} interactive elements`);
      
      sendResponse({ success: true, pageContext });
    } catch (error) {
      console.error('❌ Error extracting page context:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Unknown error extracting page context' 
      });
    }
    
    return true; // Indicate async response
  }
  
  // Handle command execution
  if (message.action === 'executeCommands' && Array.isArray(message.commands)) {
    console.log(`⚙️ Received executeCommands with ${message.commands.length} commands:`, message.commands);
    
    // Create a response timeout in case anything goes wrong
    const responseTimeout = setTimeout(() => {
      console.error('⏱️ Command execution timed out in content script');
      sendResponse({ 
        success: false, 
        error: 'Command execution timed out in content script' 
      });
    }, 25000);
    
    // Use the new CommandExecutor
    CommandExecutor.executeCommands(message.commands)
      .then(result => {
        console.log(`✅ Commands executed successfully:`, result);
        clearTimeout(responseTimeout);
        sendResponse(result);
      })
      .catch(error => {
        console.error(`❌ Error executing commands:`, error);
        clearTimeout(responseTimeout);
        sendResponse({ 
          success: false, 
          error: error.message || 'Unknown error during command execution' 
        });
      });
    
    // Return true to indicate we will respond asynchronously
    console.log(`🔄 Waiting for async command execution...`);
    return true;
  }
});