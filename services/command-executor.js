/**
 * Command Executor Module
 * Implements the Command pattern for browser automation
 */
import * as DOMUtils from './dom-utils.js';

/**
 * Base Command class
 * Defines the interface for all commands
 */
class Command {
  /**
   * Execute the command
   * @returns {Promise<Object>} - Execution result
   */
  async execute() {
    throw new Error('Method not implemented. Each command must implement execute()');
  }
}

/**
 * Click Command - Handles element clicking
 * @extends Command
 */
class ClickCommand extends Command {
  /**
   * Create a click command
   * @param {string|null} xpath - XPath to the element to click
   * @param {string|null} description - Description of the element to click (fallback)
   */
  constructor(xpath, description) {
    super();
    this.action = 'click';
    this.xpath = xpath;
    this.description = description;
  }

  /**
   * Execute the click command
   * @returns {Promise<Object>} - Click result
   */
  async execute() {
    try {
      if (this.xpath) {
        return await this.clickByXPath();
      } else if (this.description) {
        return await this.clickByDescription();
      } else {
        return {
          success: false,
          action: this.action,
          error: 'Click command requires either an xpath or description'
        };
      }
    } catch (error) {
      return {
        success: false,
        action: this.action,
        error: error.message,
        xpath: this.xpath,
        description: this.description
      };
    }
  }

  /**
   * Click an element using XPath
   * @returns {Promise<Object>} - Click result
   */
  async clickByXPath() {
    try {
      let element = null;
      
      // Use XPath to find the element
      try {
        const result = document.evaluate(
          this.xpath, 
          document, 
          null, 
          XPathResult.FIRST_ORDERED_NODE_TYPE, 
          null
        );
        
        if (result.singleNodeValue) {
          element = result.singleNodeValue;
        }
      } catch (xpathError) {
        throw new Error(`Error evaluating XPath: ${xpathError.message}`);
      }
      
      // If no element found, throw error
      if (!element) {
        throw new Error(`No element found matching XPath: ${this.xpath}`);
      }
      
      // Click the element
      element.click();
      
      return {
        success: true,
        action: 'click',
        xpath: this.xpath
      };
    } catch (error) {
      throw new Error(`Failed to click by XPath: ${error.message}`);
    }
  }

  /**
   * Click an element using description
   * @returns {Promise<Object>} - Click result
   */
  async clickByDescription() {
    try {
      const element = DOMUtils.findElementByDescription(this.description, 'click');
      
      if (!element) {
        throw new Error(`No element found matching description: ${this.description}`);
      }
      
      // Generate an XPath for reporting purposes
      const xpath = DOMUtils.getXPath(element);
      
      // Click the element
      element.click();
      
      return {
        success: true,
        action: 'click',
        description: this.description,
        xpath // Include the generated XPath for debugging
      };
    } catch (error) {
      throw new Error(`Failed to click by description: ${error.message}`);
    }
  }
}

/**
 * Fill Command - Handles input field filling
 * @extends Command
 */
class FillCommand extends Command {
  /**
   * Create a fill command
   * @param {string|null} xpath - XPath to the input element
   * @param {string|null} description - Description of the input element (fallback)
   * @param {string} value - Value to fill into the input
   */
  constructor(xpath, description, value) {
    super();
    this.action = 'fill';
    this.xpath = xpath;
    this.description = description;
    this.value = value;
  }

  /**
   * Execute the fill command
   * @returns {Promise<Object>} - Fill result
   */
  async execute() {
    try {
      if (this.xpath) {
        return await this.fillByXPath();
      } else if (this.description) {
        return await this.fillByDescription();
      } else {
        return {
          success: false,
          action: this.action,
          error: 'Fill command requires either an xpath or description'
        };
      }
    } catch (error) {
      return {
        success: false,
        action: this.action,
        error: error.message,
        xpath: this.xpath,
        description: this.description,
        value: this.value
      };
    }
  }

  /**
   * Fill an input element using XPath
   * @returns {Promise<Object>} - Fill result
   */
  async fillByXPath() {
    try {
      let element = null;
      
      // Use XPath to find the element
      try {
        const result = document.evaluate(
          this.xpath, 
          document, 
          null, 
          XPathResult.FIRST_ORDERED_NODE_TYPE, 
          null
        );
        
        if (result.singleNodeValue) {
          element = result.singleNodeValue;
        }
      } catch (xpathError) {
        throw new Error(`Error evaluating XPath: ${xpathError.message}`);
      }
      
      // If no element found, throw error
      if (!element) {
        throw new Error(`No input found matching XPath: ${this.xpath}`);
      }
      
      // Fill the input
      await this.fillElement(element);
      
      return {
        success: true,
        action: 'fill',
        xpath: this.xpath,
        value: this.value
      };
    } catch (error) {
      throw new Error(`Failed to fill by XPath: ${error.message}`);
    }
  }

  /**
   * Fill an input element using description
   * @returns {Promise<Object>} - Fill result
   */
  async fillByDescription() {
    try {
      const element = DOMUtils.findElementByDescription(this.description, 'fill');
      
      if (!element) {
        throw new Error(`No input found matching description: ${this.description}`);
      }
      
      // Generate an XPath for reporting purposes
      const xpath = DOMUtils.getXPath(element);
      
      // Fill the input
      await this.fillElement(element);
      
      return {
        success: true,
        action: 'fill',
        description: this.description,
        xpath, // Include the generated XPath for debugging
        value: this.value
      };
    } catch (error) {
      throw new Error(`Failed to fill by description: ${error.message}`);
    }
  }

  /**
   * Fill the value into an element
   * @param {Element} element - The input element to fill
   */
  async fillElement(element) {
    // Focus the element
    element.focus();
    
    // Clear the current value
    element.value = '';
    
    // Set the new value
    element.value = this.value;
    
    // Dispatch input and change events to trigger any listeners
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Navigate Command - Handles page navigation
 * @extends Command
 */
class NavigateCommand extends Command {
  /**
   * Create a navigate command
   * @param {string} url - URL to navigate to
   */
  constructor(url) {
    super();
    this.action = 'navigate';
    this.url = url;
  }

  /**
   * Execute the navigate command
   * @returns {Promise<Object>} - Navigation result
   */
  async execute() {
    try {
      // Validate URL
      new URL(this.url); // Will throw if invalid
      
      // Create the result object
      const result = {
        success: true,
        action: 'navigate',
        url: this.url
      };
      
      // Schedule the navigation to happen after our response is sent
      setTimeout(() => {
        try {
          window.location.href = this.url;
        } catch (e) {
          console.error('Navigation failed in delayed execution:', e);
        }
      }, 50);
      
      return result;
    } catch (error) {
      return {
        success: false,
        action: 'navigate',
        url: this.url,
        error: error.message
      };
    }
  }
}

/**
 * Command Factory - Creates command instances
 */
class CommandFactory {
  /**
   * Create a command from a command object
   * @param {Object} commandData - Command data from LLM
   * @returns {Command} - Command instance
   */
  static createCommand(commandData) {
    switch (commandData.action) {
      case 'click':
        return new ClickCommand(commandData.xpath, commandData.description);
      case 'fill':
        return new FillCommand(commandData.xpath, commandData.description, commandData.value);
      case 'navigate':
        return new NavigateCommand(commandData.url);
      default:
        throw new Error(`Unknown command action: ${commandData.action}`);
    }
  }
}

/**
 * Command Executor - Executes commands
 */
class CommandExecutor {
  /**
   * Execute a sequence of commands
   * @param {Array} commands - Array of command objects
   * @returns {Promise<Object>} - Result of command execution
   */
  static async executeCommands(commands) {
    console.log(`Starting to execute ${commands.length} commands`);
    
    const results = {
      success: true,
      commandResults: []
    };
    
    try {
      // Execute commands sequentially
      for (let i = 0; i < commands.length; i++) {
        const commandData = commands[i];
        console.log(`Executing command ${i + 1}/${commands.length}:`, commandData);
        
        // Create and execute the command
        const command = CommandFactory.createCommand(commandData);
        const startTime = performance.now();
        const result = await command.execute();
        const endTime = performance.now();
        
        console.log(`Command ${i + 1} executed in ${(endTime - startTime).toFixed(2)}ms:`, result);
        
        results.commandResults.push(result);
        
        // If a command fails, stop execution
        if (!result.success) {
          console.error(`Command ${i + 1} failed, stopping execution:`, result.error);
          results.success = false;
          results.error = result.error;
          break;
        }
        
        // Add a small delay between commands
        if (i < commands.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error executing commands:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export { 
  Command, 
  ClickCommand, 
  FillCommand, 
  NavigateCommand, 
  CommandFactory,
  CommandExecutor
};