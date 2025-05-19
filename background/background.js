// Import the LLM service manager
import serviceManager from '../services/llm-service-manager.js';
import config from '../services/config.js';

// Store active tab information and conversation history
let activeTabId = null;
let sessionHistory = {
  initialPrompt: null,
  actionHistory: [],
  lastPageContext: null
};

// Initialize the service manager when the extension starts
(async function initializeServices() {
  try {
    // Load saved configuration from storage, if any
    chrome.storage.local.get(['provider', 'serviceConfig'], async (result) => {
      const savedProvider = result.provider || config.defaultProvider;
      const savedConfig = result.serviceConfig || config.providers[savedProvider] || {};
      
      const initialized = await serviceManager.initialize(savedProvider, savedConfig);
      
      if (initialized) {
        console.log(`Successfully initialized ${savedProvider} service.`);
      } else {
        console.warn(`Failed to initialize ${savedProvider} service. Using fallback.`);
      }
    });
  } catch (error) {
    console.error('Error initializing services:', error);
  }
})();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processPrompt') {
    handleUserPrompt(request.prompt, request.options || {})
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    
    // Return true to indicate we will respond asynchronously
    return true;
  } 
  
  // Handle test connection request
  else if (request.action === 'testConnection') {
    // Return a simple success response to verify connection works
    // In a real implementation, this would test the actual LLM API connection
    console.log('Testing connection with settings:', request.settings);
    
    // Simulate API testing
    setTimeout(() => {
      sendResponse({ 
        success: true,
        message: 'Connection successful'
      });
    }, 500);
    
    return true;
  }
  
  // Handle request for a fast page snapshot
  else if (request.action === 'getPageSnapshot') {
    // Get current active tab if not already known
    if (!activeTabId) {
      chrome.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
          if (tabs && tabs.length > 0) {
            activeTabId = tabs[0].id;
            return takePageSnapshot(activeTabId, request.options);
          } else {
            throw new Error('No active tab found');
          }
        })
        .then(snapshot => sendResponse({ success: true, snapshot }))
        .catch(error => sendResponse({ error: error.message }));
    } else {
      takePageSnapshot(activeTabId, request.options)
        .then(snapshot => sendResponse({ success: true, snapshot }))
        .catch(error => sendResponse({ error: error.message }));
    }
    
    return true;
  }
  
  // Handle service configuration updates
  else if (request.action === 'updateServiceConfig') {
    updateServiceConfig(request.provider, request.config)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
  
  // Handle service provider changes
  else if (request.action === 'changeProvider') {
    changeServiceProvider(request.provider)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
});

// Listen for tab activation to keep track of the active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
});

// Open the sidebar when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

/**
 * Handle the user's natural language prompt
 * @param {string} prompt - The user's natural language instructions
 * @param {Object} options - Options for processing the prompt
 * @returns {Promise<Object>} - Command execution result
 */
async function handleUserPrompt(prompt, options = {}) {
  try {
    // Get current active tab
    if (!activeTabId) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) throw new Error('No active tab found');
      activeTabId = tabs[0].id;
    }
    
    // Get page context
    console.log('Getting page context for prompt processing');
    const useSnapshot = options.useFastSnapshot || prompt.toLowerCase().includes('quick') || prompt.toLowerCase().includes('fast');
    const pageContext = useSnapshot ? 
      await getFastSnapshotContext(activeTabId) : 
      await extractPageContext(activeTabId);
    
    // Setup session history
    const isNewSession = !sessionHistory.initialPrompt || options.resetSession;
    if (isNewSession) {
      console.log('Starting new session with prompt:', prompt);
      sessionHistory = {
        initialPrompt: prompt,
        actionHistory: [],
        lastPageContext: pageContext
      };
    } else {
      sessionHistory.lastPageContext = pageContext;
    }
    
    // Get commands - either from continuation or by querying LLM
    const structuredCommands = await getCommands(prompt, pageContext, isNewSession, options);
    
    // Execute commands
    console.log(`Executing ${structuredCommands.commands?.length || 0} commands`);
    const executionResults = await executeCommandsWithOrchestration(activeTabId, structuredCommands);
    
    console.log(`Action history updated, now ${sessionHistory.actionHistory.length} actions`);
    
    // Check if flow needs continuation
    const needsContinuation = executionResults.isComplete === false || structuredCommands.isComplete === false;
    
    if (needsContinuation) {
      return await continueUserFlow(sessionHistory.initialPrompt, activeTabId, options);
    }
    
    // Return results
    return { 
      success: true,
      isComplete: true,
      completionMessage: executionResults.completionMessage || structuredCommands.completionMessage || 'Flow completed successfully'
    };
  } catch (error) {
    console.error('Error handling prompt:', error);
    throw error;
  }
}

/**
 * Get fast snapshot context
 * @param {number} tabId - Tab ID
 * @returns {Promise<Object>} Page context
 */
async function getFastSnapshotContext(tabId) {
  console.log('Using fast snapshot for context');
  const snapshot = await takePageSnapshot(tabId);
  
  return {
    url: snapshot.url,
    title: snapshot.title || '',
    elements: snapshot.keyElements.map(el => ({
      xpath: el.xpath,
      text: el.text,
      type: el.tag,
      location: {
        x: el.x,
        y: el.y,
        width: el.w, 
        height: el.h
      }
    })),
    isPartialContext: true
  };
}

/**
 * Get commands from LLM or continuation
 * @param {string} prompt - User prompt
 * @param {Object} pageContext - Page context
 * @param {boolean} isNewSession - Whether this is a new session
 * @param {Object} options - Options
 * @returns {Promise<Object>} Structured commands
 */
async function getCommands(prompt, pageContext, isNewSession, options) {
  // Use continuation commands if available
  if (options.continuationCommands) {
    console.log('Using provided continuation commands');
    const commands = options.continuationCommands;
    
    // Ensure completion status is defined
    if (commands.isComplete === undefined) {
      commands.isComplete = false;
    }
    
    return commands;
  }
  
  // Otherwise query LLM
  console.log(`Processing prompt with ${serviceManager.getCurrentProvider()} service`);
  console.log(`Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
  console.log(`Page: ${pageContext.url}, ${pageContext.elements?.length || 0} elements`);
  console.log(`Session history: ${sessionHistory.actionHistory.length} actions`);
  
  const commands = await serviceManager.processPrompt(
    prompt, 
    pageContext, 
    {
      initialPrompt: sessionHistory.initialPrompt,
      actionHistory: sessionHistory.actionHistory,
      isNewSession
    }
  );
  
  // Ensure completion status is defined
  if (commands.isComplete === undefined) {
    commands.isComplete = false;
  }
  
  return commands;
}

/**
 * Continue user flow with additional steps
 * @param {string} initialPrompt - Initial user prompt
 * @param {number} tabId - Tab ID
 * @param {Object} options - Options
 * @returns {Promise<Object>} Result
 */
async function continueUserFlow(initialPrompt, tabId, options) {
  console.log('Flow is not complete, continuing with next steps');
  
  try {
    // Get fresh context
    await waitForDomStabilization(tabId);
    const newPageContext = await extractPageContext(tabId);
    sessionHistory.lastPageContext = newPageContext;
    
    // Query LLM for next steps
    console.log('Sending continuation prompt to LLM');
    const continuationPrompt = `Continue the process of "${initialPrompt}". What are the next steps needed?`;
    
    const continuationCommands = await serviceManager.processPrompt(
      continuationPrompt,
      newPageContext,
      {
        initialPrompt: sessionHistory.initialPrompt,
        actionHistory: sessionHistory.actionHistory,
        isNewSession: false
      }
    );
    
    // Execute continuation commands if available
    if (continuationCommands.commands?.length > 0) {
      console.log(`Executing ${continuationCommands.commands.length} continuation commands`);
      
      // Recursively continue the flow
      return await handleUserPrompt(initialPrompt, {
        ...options,
        resetSession: false,
        continuationCommands
      });
    } else {
      console.log('No continuation commands received, flow complete');
      return { 
        success: true,
        isComplete: true,
        completionMessage: 'Flow completed (no more commands needed)'
      };
    }
  } catch (error) {
    console.error('Error in flow continuation:', error);
    return { 
      success: false,
      isComplete: false,
      error: error.message,
      completionMessage: `Flow continuation failed: ${error.message}`
    };
  }
}

/**
 * Takes a fast snapshot of a page
 * @param {number} tabId - The ID of the tab to snapshot
 * @param {Object} options - Options for the snapshot
 * @returns {Promise<Object>} - Snapshot information
 */
async function takePageSnapshot(tabId, options = {}) {
  try {
    console.log(`📸 Starting fast page snapshot for tab ${tabId}`);
    
    // Ensure the content script is injected
    console.log(`🔄 Ensuring content script is injected in tab ${tabId}`);
    const injected = await ensureContentScriptInjected(tabId);
    console.log(`✅ Content script injection status for tab ${tabId}:`, injected);
    
    // Create a promise with timeout for the message
    return new Promise((resolve, reject) => {
      console.log(`📨 Sending fastSnapshot message to tab ${tabId}`);
      
      // Set up a timeout - shorter for fast snapshot
      const timeoutId = setTimeout(() => {
        console.error(`⏱️ Fast snapshot timed out for tab ${tabId}`);
        reject(new Error('Fast snapshot timed out.'));
      }, 5000); // 5 seconds is enough for a fast snapshot
      
      // Send the message to take snapshot
      chrome.tabs.sendMessage(
        tabId, 
        { 
          action: 'fastSnapshot',
          options: options
        }, 
        (response) => {
          // Clear the timeout when we get a response
          clearTimeout(timeoutId);
          
          // Check for error in the response
          if (chrome.runtime.lastError) {
            console.error(`🛑 Runtime error during snapshot for tab ${tabId}:`, chrome.runtime.lastError);
            reject(new Error('Communication with page failed: ' + chrome.runtime.lastError.message));
            return;
          }
          
          // Check for error in the response data
          if (response && response.error) {
            console.error(`❌ Error in snapshot response for tab ${tabId}:`, response.error);
            reject(new Error(response.error));
            return;
          }
          
          if (response && response.success && response.snapshot) {
            console.log(`✅ Successfully took snapshot from tab ${tabId}`);
            console.log(`📊 Captured ${response.snapshot.keyElements?.length || 0} key elements`);
            resolve(response.snapshot);
          } else {
            console.error(`❓ Received invalid response from tab ${tabId}:`, response);
            reject(new Error('Failed to take page snapshot'));
          }
        }
      );
    });
  } catch (error) {
    console.error(`💥 Error taking snapshot from tab ${tabId}:`, error);
    // Return null to indicate we couldn't get snapshot, but don't fail the whole process
    return null;
  }
}

/**
 * Extract full page context from a tab
 * @param {number} tabId - The ID of the tab to extract context from
 * @returns {Promise<Object>} - Page context information
 */
async function extractPageContext(tabId) {
  try {
    console.log(`🔍 Starting page context extraction for tab ${tabId}`);
    
    // Ensure the content script is injected
    console.log(`🔄 Ensuring content script is injected in tab ${tabId}`);
    const injected = await ensureContentScriptInjected(tabId);
    console.log(`✅ Content script injection status for tab ${tabId}:`, injected);
    
    // Create a promise with timeout for the message
    return new Promise((resolve, reject) => {
      console.log(`📨 Sending extractPageContext message to tab ${tabId}`);
      
      // Set up a timeout
      const timeoutId = setTimeout(() => {
        console.error(`⏱️ Context extraction timed out for tab ${tabId}`);
        reject(new Error('Context extraction timed out.'));
      }, 10000);
      
      // Send the message to extract context
      chrome.tabs.sendMessage(
        tabId, 
        { action: 'extractPageContext' }, 
        (response) => {
          // Clear the timeout when we get a response
          clearTimeout(timeoutId);
          
          // Check for error in the response
          if (chrome.runtime.lastError) {
            console.error(`🛑 Runtime error during context extraction for tab ${tabId}:`, chrome.runtime.lastError);
            reject(new Error('Communication with page failed: ' + chrome.runtime.lastError.message));
            return;
          }
          
          // Check for error in the response data
          if (response && response.error) {
            console.error(`❌ Error in context extraction response for tab ${tabId}:`, response.error);
            reject(new Error(response.error));
            return;
          }
          
          if (response && response.success && response.pageContext) {
            console.log(`✅ Successfully extracted page context from tab ${tabId}`);
            console.log(`📊 Found ${response.pageContext.elements?.length || 0} interactive elements`);
            resolve(response.pageContext);
          } else {
            console.error(`❓ Received invalid response from tab ${tabId}:`, response);
            reject(new Error('Failed to extract page context'));
          }
        }
      );
    });
  } catch (error) {
    console.error(`💥 Error extracting page context from tab ${tabId}:`, error);
    // Return null to indicate we couldn't get context, but don't fail the whole process
    return null;
  }
}

/**
 * Execute commands with orchestration to handle navigation
 * @param {number} tabId - The ID of the tab to execute commands on
 * @param {Object} structuredCommands - The structured commands to execute
 * @returns {Promise<Object>} - Results of command execution with details for each command
 */
async function executeCommandsWithOrchestration(tabId, structuredCommands) {
  try {
    // Ensure the content script is injected
    await ensureContentScriptInjected(tabId);
    
    // Handle empty commands case
    if (!structuredCommands.commands?.length) {
      return {
        success: true,
        commandResults: [],
        isComplete: structuredCommands.isComplete || true,
        completionMessage: structuredCommands.completionMessage || 'No commands to execute'
      };
    }
    
    // Group commands by navigation points
    const commandGroups = splitCommandsAtNavigation(structuredCommands.commands);
    
    // Initialize results
    const results = {
      success: true,
      commandResults: [],
      isComplete: structuredCommands.isComplete || false,
      completionMessage: structuredCommands.completionMessage || ''
    };
    
    // Execute each group sequentially
    for (let i = 0; i < commandGroups.length; i++) {
      const group = commandGroups[i];
      console.log(`Executing command group ${i + 1} of ${commandGroups.length}`);
      
      // Execute the current group
      const groupResult = await executeCommandGroup(tabId, group, i, commandGroups, results);
      
      // Update results
      results.success = results.success && groupResult.success;
      results.commandResults.push(...groupResult.commandResults);
      
      if (groupResult.isComplete !== undefined) {
        results.isComplete = groupResult.isComplete;
      }
      
      if (groupResult.completionMessage) {
        results.completionMessage = groupResult.completionMessage;
      }
      
      if (groupResult.error) {
        results.error = groupResult.error;
      }
      
      // Handle navigation to next page if needed
      if (groupResult.needsNavigation && i < commandGroups.length - 1) {
        const navResult = await handleNavigation(tabId, group, i, commandGroups, results);
        
        // Update command groups if navigation resulted in new commands
        if (navResult.newCommandGroups) {
          commandGroups.splice(i + 1, commandGroups.length - (i + 1), ...navResult.newCommandGroups);
        }
        
        // Update completion status if provided
        if (navResult.isComplete !== undefined) {
          results.isComplete = navResult.isComplete;
        }
      }
      
      // If flow is marked complete, stop execution
      if (results.isComplete === true) {
        break;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error executing commands:', error);
    return {
      success: false,
      error: error.message,
      commandResults: [],
      isComplete: false,
      completionMessage: `Error during execution: ${error.message}`
    };
  }
}

/**
 * Execute a group of commands
 * @param {number} tabId - Tab ID
 * @param {Array} group - Group of commands
 * @param {number} groupIndex - Index of the group
 * @param {Array} allGroups - All command groups
 * @param {Object} currentResults - Current results
 * @returns {Promise<Object>} - Group execution results
 */
async function executeCommandGroup(tabId, group, groupIndex, allGroups, currentResults) {
  const groupResults = {
    success: true,
    commandResults: [],
    needsNavigation: false
  };
  
  // Execute commands one by one
  for (let j = 0; j < group.length; j++) {
    const command = group[j];
    console.log(`Executing command ${j + 1}/${group.length}: ${command.action}`);
    
    // Execute single command
    const commandResult = await executeSingleCommand(tabId, command);
    groupResults.commandResults.push(commandResult);
    
    // Track action in history
    sessionHistory.actionHistory.push({
      command,
      result: commandResult,
      timestamp: new Date().toISOString()
    });
    
    // Check for navigation
    if (command.action === 'navigate' && commandResult.success) {
      groupResults.needsNavigation = true;
    }
    
    // Handle command failure
    if (!commandResult.success) {
      groupResults.success = false;
      groupResults.error = commandResult.error;
      
      // Try to recover with alternative commands
      const recoveryResult = await handleCommandFailure(
        tabId, command, commandResult, j, group, groupIndex, allGroups
      );
      
      if (recoveryResult.recoveryCommands?.length) {
        // Replace remaining commands in current group
        if (j < group.length - 1) {
          // Update the group with recovery commands
          group.splice(j + 1, group.length - (j + 1), ...recoveryResult.recoveryCommands);
        }
        
        // Update completion status if provided
        if (recoveryResult.isComplete !== undefined) {
          groupResults.isComplete = recoveryResult.isComplete;
          groupResults.completionMessage = recoveryResult.completionMessage || '';
        }
      }
    }
    
    // Update page context for remaining commands if not the last command
    if (j < group.length - 1) {
      await updateDomContextForRemainingCommands(tabId, group.slice(j + 1));
    }
  }
  
  return groupResults;
}

/**
 * Handle a failed command by asking LLM for alternatives
 * @param {number} tabId - Tab ID
 * @param {Object} command - Failed command
 * @param {Object} commandResult - Failed command result
 * @param {number} commandIndex - Index of command in group
 * @param {Array} group - Current command group
 * @param {number} groupIndex - Index of group
 * @param {Array} allGroups - All command groups
 * @returns {Promise<Object>} - Recovery results
 */
async function handleCommandFailure(tabId, command, commandResult, commandIndex, group, groupIndex, allGroups) {
  console.log(`Command failed: ${command.action}, error: ${commandResult.error}`);
  
  // Get fresh page context
  await waitForDomStabilization(tabId);
  const newPageContext = await extractPageContext(tabId);
  sessionHistory.lastPageContext = newPageContext;
  
  // Only try recovery if more commands pending
  if (commandIndex >= group.length - 1 && groupIndex >= allGroups.length - 1) {
    console.log('No more commands to execute, skipping recovery');
    return { recoveryCommands: [] };
  }
  
  // Create recovery prompt
  const recoveryPrompt = `The previous command (${command.action}) failed with error: "${commandResult.error}". Please provide alternative commands to achieve the same goal.`;
  
  // Get alternative commands from LLM
  console.log('Asking LLM for alternative approaches');
  const recoveryResponse = await serviceManager.processPrompt(
    recoveryPrompt,
    newPageContext,
    {
      initialPrompt: sessionHistory.initialPrompt,
      actionHistory: sessionHistory.actionHistory,
      isNewSession: false
    }
  );
  
  // Return recovery commands and completion status
  return {
    recoveryCommands: recoveryResponse.commands || [],
    isComplete: recoveryResponse.isComplete,
    completionMessage: recoveryResponse.completionMessage
  };
}

/**
 * Update DOM context and refine selectors for remaining commands
 * @param {number} tabId - Tab ID
 * @param {Array} remainingCommands - Commands to update
 * @returns {Promise<void>}
 */
async function updateDomContextForRemainingCommands(tabId, remainingCommands) {
  console.log('Updating DOM context for remaining commands');
  
  // Wait for DOM to stabilize
  await waitForDomStabilization(tabId);
  
  // Get fresh page context
  const newPageContext = await extractPageContext(tabId);
  sessionHistory.lastPageContext = newPageContext;
  
  // Refine selectors for remaining commands
  await refineCommandSelectors(remainingCommands, newPageContext);
}

/**
 * Handle navigation between command groups
 * @param {number} tabId - Tab ID
 * @param {Array} currentGroup - Current command group
 * @param {number} groupIndex - Current group index
 * @param {Array} allGroups - All command groups
 * @param {Object} results - Current results
 * @returns {Promise<Object>} - Navigation results
 */
async function handleNavigation(tabId, currentGroup, groupIndex, allGroups, results) {
  console.log('Handling navigation between command groups');
  
  // Wait for navigation to complete
  await waitForNavigation(tabId);
  await ensureContentScriptInjected(tabId);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Extra wait for page load
  
  // Get fresh page context
  console.log('Getting fresh page context after navigation');
  const newPageContext = await extractPageContext(tabId);
  sessionHistory.lastPageContext = newPageContext;
  
  // Get new commands for the page
  console.log('Asking LLM for commands appropriate for new page');
  const continuationPrompt = 'Continue with the next steps on the current page';
  
  const refinedCommands = await serviceManager.processPrompt(
    continuationPrompt,
    newPageContext,
    {
      initialPrompt: sessionHistory.initialPrompt,
      actionHistory: sessionHistory.actionHistory,
      isNewSession: false
    }
  );
  
  // Check if we got valid commands for the new page
  if (!refinedCommands.commands?.length) {
    console.log('No new commands received, using existing commands');
    
    // Just refine selectors for next group as fallback
    if (groupIndex + 1 < allGroups.length) {
      await refineCommandSelectors(allGroups[groupIndex + 1], newPageContext);
    }
    
    return { 
      newCommandGroups: null,
      isComplete: refinedCommands.isComplete
    };
  }
  
  console.log(`Received ${refinedCommands.commands.length} new commands for post-navigation page`);
  
  // Log completion status
  if (refinedCommands.isComplete === true) {
    console.log(`LLM indicates flow will be complete after these commands`);
  } else if (refinedCommands.isComplete === false) {
    console.log(`LLM indicates more steps will be needed after these commands`);
  }
  
  // Create a single new command group with the refined commands
  return {
    newCommandGroups: [refinedCommands.commands],
    isComplete: refinedCommands.isComplete
  };
}

/**
 * Split commands into groups at navigation points
 * @param {Array} commands - Array of command objects
 * @returns {Array} - Array of command groups
 */
function splitCommandsAtNavigation(commands) {
  const commandGroups = [];
  let currentGroup = [];
  
  for (const command of commands) {
    // Add the command to the current group
    currentGroup.push(command);
    
    // If this is a navigation command, start a new group after it
    if (command.action === 'navigate') {
      commandGroups.push(currentGroup);
      currentGroup = [];
    }
  }
  
  // Add any remaining commands as the final group
  if (currentGroup.length > 0) {
    commandGroups.push(currentGroup);
  }
  
  return commandGroups;
}

/**
 * Send commands to a tab and handle response
 * @param {number} tabId - The ID of the tab to execute commands on
 * @param {Array} commandGroup - Group of commands to execute
 * @returns {Promise<Object>} - Command execution result
 */
async function sendCommandsToTab(tabId, commandGroup) {
  // Create a promise with timeout for the message
  return new Promise((resolve, reject) => {
    // Set up a timeout (longer for navigation commands)
    const hasNavigation = commandGroup.some(cmd => cmd.action === 'navigate');
    const timeout = hasNavigation ? 60000 : 30000;
    
    const timeoutId = setTimeout(() => {
      reject(new Error('Command execution timed out. The page might have navigated away or reloaded.'));
    }, timeout);
    
    // Send the message
    chrome.tabs.sendMessage(
      tabId, 
      {
        action: 'executeCommands',
        commands: commandGroup
      }, 
      (response) => {
        // Clear the timeout when we get a response
        clearTimeout(timeoutId);
        
        // Check for error in the response
        if (chrome.runtime.lastError) {
          console.error('Runtime error during command execution:', chrome.runtime.lastError);
          
          // If there's a navigation command, this might be expected
          if (hasNavigation && chrome.runtime.lastError.message.includes('message port closed')) {
            console.log('Navigation occurred as expected, resolving command group');
            resolve({ success: true, navigated: true });
            return;
          }
          
          reject(new Error('Communication with page failed: ' + chrome.runtime.lastError.message));
          return;
        }
        
        // Check for error in the response data
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        
        resolve(response || { success: true });
      }
    );
  });
}

/**
 * Wait for navigation to complete on a tab
 * @param {number} tabId - The ID of the tab to wait for
 * @returns {Promise<void>} - Resolves when navigation is complete
 */
async function waitForNavigation(tabId) {
  return new Promise((resolve) => {
    // Create a listener for the tab's updates
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        // Navigation is complete, remove the listener and resolve
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    
    // Add the listener
    chrome.tabs.onUpdated.addListener(listener);
    
    // Set a safety timeout in case navigation doesn't trigger the event
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 10000);
  });
}

/**
 * Wait for DOM to stabilize after an action
 * @param {number} tabId - The ID of the tab to wait for
 * @returns {Promise<void>} - Resolves when DOM has stabilized
 */
async function waitForDomStabilization(tabId) {
  console.log(`Waiting for DOM to stabilize in tab ${tabId}...`);
  
  try {
    // Ensure content script is available
    const isInjected = await ensureContentScriptInjected(tabId);
    if (!isInjected) {
      // Simple fallback: just wait a bit
      await new Promise(resolve => setTimeout(resolve, 800));
      return;
    }
    
    // Get current tab URL for context
    const tab = await chrome.tabs.get(tabId);
    console.log(`Tab URL during stabilization check: ${tab?.url}`);
    
    // Initial wait for immediate changes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create stability check with timeout
    const stabilityPromise = new Promise(resolve => {
      let stabilityCheckCount = 0;
      const MAX_CHECKS = 10;
      
      // Check DOM stability recursively
      function checkStability() {
        stabilityCheckCount++;
        
        chrome.tabs.sendMessage(
          tabId,
          { action: 'checkDomStability' },
          (response) => {
            // Handle errors or missing response
            if (chrome.runtime.lastError || !response) {
              console.log('DOM check error or no response, assuming stable');
              resolve();
              return;
            }
            
            // If still loading and under max checks, try again
            if (response.isLoading && stabilityCheckCount < MAX_CHECKS) {
              console.log(`DOM still loading (check ${stabilityCheckCount}/${MAX_CHECKS}), waiting...`);
              setTimeout(checkStability, 300);
            } else {
              // Either stable or max checks reached
              console.log('DOM appears stable or max checks reached');
              resolve();
            }
          }
        );
      }
      
      // Start checking
      checkStability();
    });
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        console.log('DOM stability check timed out, proceeding anyway');
        resolve();
      }, 4000);
    });
    
    // Wait for either stability or timeout
    await Promise.race([stabilityPromise, timeoutPromise]);
    
    // Final brief pause to let any animations complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
  } catch (error) {
    console.error('Error in DOM stabilization:', error);
    // Fallback wait
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Refine command selectors based on current page context
 * @param {Array} commands - Array of commands to refine
 * @param {Object} pageContext - Current page context
 * @returns {Promise<void>} - Resolves when refinement is complete
 */
async function refineCommandSelectors(commands, pageContext) {
  if (!commands?.length || !pageContext?.elements?.length) {
    console.log('No commands or page elements to refine');
    return;
  }
  
  console.log(`Refining selectors for ${commands.length} commands`);
  
  // Process all commands that need XPath refinement
  const commandsToRefine = commands.filter(cmd => 
    cmd.action !== 'navigate' && 
    !cmd.xpath && 
    cmd.description
  );
  
  if (commandsToRefine.length === 0) {
    console.log('No commands need XPath refinement');
    return;
  }
  
  console.log(`Found ${commandsToRefine.length} commands that need XPath refinement`);
  
  // Refine each command
  for (const command of commandsToRefine) {
    try {
      // Get refined XPath from LLM
      console.log(`Refining XPath for "${command.description.substring(0, 30)}${command.description.length > 30 ? '...' : ''}"`);
      const refinedCommand = await serviceManager.refineSelectorForCommand(command, pageContext);
      
      // Update command with XPath if found
      if (refinedCommand?.xpath) {
        command.xpath = refinedCommand.xpath;
        command.originalDescription = command.description;
        console.log(`Found XPath: ${command.xpath}`);
      } else {
        console.log('No XPath found, keeping description-based targeting');
      }
    } catch (error) {
      console.log(`XPath refinement failed: ${error.message}`);
    }
  }
}

/**
 * Execute a single command on a tab
 * @param {number} tabId - The ID of the tab to execute the command on
 * @param {Object} command - The command to execute
 * @returns {Promise<Object>} - Command execution result
 */
async function executeSingleCommand(tabId, command) {
  console.log(`Executing ${command.action} command`);
  
  // For navigate commands, handle the expected disconnection
  const isNavigation = command.action === 'navigate';
  const timeout = isNavigation ? 30000 : 15000;
  
  try {
    // Send command to content script with timeout
    return await Promise.race([
      sendCommandToContentScript(tabId, command),
      createTimeout(timeout, `Command execution timed out after ${timeout}ms`)
    ]);
  } catch (error) {
    // For navigation commands, connection errors are expected
    if (isNavigation && error.message.includes('message port closed')) {
      console.log('Navigation caused connection to close (expected)');
      return { 
        success: true, 
        action: command.action,
        navigated: true 
      };
    }
    
    // Regular error
    console.error(`Command execution error: ${error.message}`);
    return {
      success: false,
      action: command.action,
      error: error.message
    };
  }
}

/**
 * Helper to send command to content script
 * @param {number} tabId - Tab ID
 * @param {Object} command - Command to execute
 * @returns {Promise<Object>} - Command result
 */
function sendCommandToContentScript(tabId, command) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId, 
      {
        action: 'executeCommands',
        commands: [command]
      }, 
      (response) => {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        // Check for error in response
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        
        // Extract result
        const result = response?.commandResults?.[0] || response || { success: true };
        resolve(result);
      }
    );
  });
}

/**
 * Create a timeout promise
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise<never>} - Rejects with timeout error
 */
function createTimeout(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Execute the structured commands on the active tab (simple version)
 * @param {number} tabId - The ID of the tab to execute commands on
 * @param {Object} structuredCommands - The structured commands to execute
 */
async function executeCommandsOnTab(tabId, structuredCommands) {
  try {
    // Ensure the content script is injected before sending messages
    await ensureContentScriptInjected(tabId);
    
    // Create a promise with timeout for the message
    const sendMessageWithTimeout = async (timeout = 30000) => {
      return new Promise((resolve, reject) => {
        // Set up a timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Command execution timed out. The page might have navigated away or reloaded.'));
        }, timeout);
        
        // Send the message
        chrome.tabs.sendMessage(
          tabId, 
          {
            action: 'executeCommands',
            commands: structuredCommands.commands
          }, 
          (response) => {
            // Clear the timeout when we get a response
            clearTimeout(timeoutId);
            
            // Check for error in the response
            if (chrome.runtime.lastError) {
              console.error('Runtime error:', chrome.runtime.lastError);
              reject(new Error('Communication with page failed: ' + chrome.runtime.lastError.message));
              return;
            }
            
            // Check for error in the response data
            if (response && response.error) {
              reject(new Error(response.error));
              return;
            }
            
            resolve(response || { success: true });
          }
        );
      });
    };
    
    // Execute with timeout
    const response = await sendMessageWithTimeout();
    return response;
    
  } catch (error) {
    console.error('Error executing commands:', error);
    
    // Provide more specific error messages based on the error
    if (error.message.includes('timed out')) {
      throw new Error('The command execution timed out. The page might have navigated away or reloaded.');
    } else if (error.message.includes('message channel closed')) {
      throw new Error('The page changed before execution completed. Try again or try a simpler command.');
    } else {
      throw new Error('Failed to execute your instructions: ' + error.message);
    }
  }
}

/**
 * Ensure the content script is injected into the tab
 * @param {number} tabId - The ID of the tab to inject the content script into
 * @returns {Promise<boolean>} - True if the content script is injected
 */
async function ensureContentScriptInjected(tabId) {
  try {
    console.log(`🔍 Checking content script in tab ${tabId}`);
    
    // Get tab information to check URL
    const tab = await chrome.tabs.get(tabId);
    console.log(`📄 Tab URL: ${tab.url}`);
    
    // Check if it's a restricted URL that doesn't allow content script injection
    const url = tab.url || '';
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') || 
        url.startsWith('chrome-search://') ||
        url.startsWith('devtools://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url === 'chrome://newtab/') {
      console.error(`🚫 Restricted URL detected: ${url}`);
      throw new Error(`Cannot execute on this page (${url.split('/')[0]}//). Please navigate to a regular website.`);
    }
    
    console.log(`🏓 Sending ping to check if content script is already injected in tab ${tabId}`);
    
    // First, try to check if the content script is already injected using a reliable ping
    const isContentScriptInjected = await new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
        if (chrome.runtime.lastError) {
          console.log(`⚠️ Content script not detected: ${chrome.runtime.lastError.message}`);
          resolve(false);
        } else if (!response || response.status !== 'alive') {
          console.log(`⚠️ Content script response invalid:`, response);
          resolve(false);
        } else {
          console.log(`✅ Content script already injected in tab ${tabId}`);
          resolve(true);
        }
      });
      
      // Add timeout for the ping check
      setTimeout(() => {
        console.log(`⏱️ Ping timeout, assuming content script not injected`);
        resolve(false);
      }, 1000);
    });
    
    if (isContentScriptInjected) {
      return true;
    }
    
    console.log(`💉 Content script not yet injected, injecting now in tab ${tabId}...`);
    
    // Inject the content script
    console.log(`📝 Executing script injection for content/content.js`);
    const injectionResult = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/content.js']
    });
    
    console.log(`📊 Script injection result:`, injectionResult);
    
    // Give the content script a moment to initialize
    console.log(`⏳ Waiting for content script to initialize...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify injection was successful
    console.log(`🔄 Verifying content script injection with ping`);
    const verifyInjection = await new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
        if (chrome.runtime.lastError) {
          console.error(`❌ Verification failed with error: ${chrome.runtime.lastError.message}`);
          resolve(false);
        } else if (!response || response.status !== 'alive') {
          console.error(`❌ Verification received invalid response:`, response);
          resolve(false);
        } else {
          console.log(`✅ Content script injection verified in tab ${tabId}`);
          resolve(true);
        }
      });
      
      // Add timeout for the verification check
      setTimeout(() => {
        console.error(`⏱️ Verification timeout, injection likely failed`);
        resolve(false);
      }, 2000);
    });
    
    if (!verifyInjection) {
      console.error(`🚫 Failed to verify content script injection in tab ${tabId}`);
      throw new Error('Failed to verify content script injection. The page might be restricting scripts.');
    }
    
    console.log(`🎉 Content script successfully injected and verified in tab ${tabId}`);
    return true;
  } catch (error) {
    console.error(`💥 Error injecting content script to tab ${tabId}:`, error);
    if (error.message.includes('Cannot execute on this page')) {
      throw error; // Pass through our specific error
    } else if (error.message.includes('Failed to verify content script injection')) {
      throw error; // Pass through verification errors
    } else {
      throw new Error('Failed to inject content script. Please navigate to a regular website.');
    }
  }
}

/**
 * Update the service configuration
 * @param {string} provider - The service provider to update
 * @param {Object} newConfig - The new configuration
 * @returns {Promise<boolean>} - True if update was successful
 */
async function updateServiceConfig(provider, newConfig) {
  try {
    // Save to storage
    await chrome.storage.local.set({
      provider: provider,
      serviceConfig: newConfig
    });
    
    // Update the service
    const success = await serviceManager.changeProvider(provider, newConfig);
    return success;
  } catch (error) {
    console.error('Error updating service config:', error);
    throw error;
  }
}

/**
 * Change the service provider
 * @param {string} provider - The new service provider to use
 * @returns {Promise<boolean>} - True if provider change was successful
 */
async function changeServiceProvider(provider) {
  try {
    // Get saved config for this provider, if any
    const result = await chrome.storage.local.get(['serviceConfig']);
    const savedConfig = result.serviceConfig || {};
    
    // Get default config for this provider
    const defaultConfig = config.providers[provider] || {};
    
    // Merge saved config with default config
    const providerConfig = { ...defaultConfig, ...savedConfig };
    
    // Update the service
    const success = await serviceManager.changeProvider(provider, providerConfig);
    
    if (success) {
      // Save the provider choice
      await chrome.storage.local.set({ provider });
    }
    
    return success;
  } catch (error) {
    console.error('Error changing service provider:', error);
    throw error;
  }
}