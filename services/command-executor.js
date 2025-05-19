/**
 * Command Executor Module
 * Implements the Command pattern for browser automation
 */
import { findElementByXPath, getXPath } from 'browsermagic-dom';

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
   * @param {string} xpath - XPath to the element to click
   */
  constructor(xpath) {
    super();
    this.action = 'click';
    this.xpath = xpath;
  }

  /**
   * Execute the click command
   * @returns {Promise<Object>} - Click result
   */
  async execute() {
    try {
      if (!this.xpath) {
        return {
          success: false,
          action: this.action,
          error: 'Click command requires an xpath'
        };
      }
      
      // Use browsermagic-dom's findElementByXPath function
      const element = findElementByXPath(this.xpath);
      
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
      return {
        success: false,
        action: this.action,
        error: error.message,
        xpath: this.xpath
      };
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
   * @param {string} xpath - XPath to the input element
   * @param {string} value - Value to fill into the input
   */
  constructor(xpath, value) {
    super();
    this.action = 'fill';
    this.xpath = xpath;
    this.value = value;
  }

  /**
   * Execute the fill command
   * @returns {Promise<Object>} - Fill result
   */
  async execute() {
    try {
      if (!this.xpath) {
        return {
          success: false,
          action: this.action,
          error: 'Fill command requires an xpath'
        };
      }
      
      // Use browsermagic-dom's findElementByXPath function
      const element = findElementByXPath(this.xpath);
      
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
      return {
        success: false,
        action: this.action,
        error: error.message,
        xpath: this.xpath,
        value: this.value
      };
    }
  }

  /**
   * Fill the value into an element
   * @param {Element} element - The input element to fill
   */
  async fillElement(element) {
    // Focus the element
    element.focus();
    
    const tagName = element.tagName.toLowerCase();
    
    // Handle different input types
    if (tagName === 'select') {
      this.handleSelectElement(element);
    } else {
      // Default behavior for text inputs
      element.value = '';
      element.value = this.value;
    }
    
    // Dispatch input and change events to trigger any listeners
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  /**
   * Handle select dropdown elements
   * @param {HTMLSelectElement} selectElement - The select element
   */
  handleSelectElement(selectElement) {
    const options = Array.from(selectElement.options);
    const value = this.value;
    
    // Try exact match on value or text
    let option = options.find(opt => 
      opt.value === value || opt.text === value);
    
    // Try case-insensitive contains match
    if (!option) {
      const lowerValue = value.toLowerCase();
      option = options.find(opt => 
        opt.text.toLowerCase().includes(lowerValue));
    }
    
    if (option) {
      selectElement.value = option.value;
    } else {
      throw new Error(`Could not find option matching "${value}" in dropdown`);
    }
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
        return new ClickCommand(commandData.xpath);
      case 'fill':
        return new FillCommand(commandData.xpath, commandData.value);
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