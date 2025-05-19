/**
 * Refactored Mock LLM Service Implementation
 * Uses the new BaseService class and other abstractions
 */
import BaseService from './base-service.js';
import * as PromptTemplates from './prompt-templates.js';

/**
 * Mock LLM Service Implementation
 * For testing and development without using actual API calls
 * @extends BaseService
 */
class MockService extends BaseService {
  /**
   * Initialize the Mock service
   * @param {Object} config - Configuration object for the service
   * @param {number} config.delayMs - Simulated processing delay in milliseconds
   */
  constructor(config = {}) {
    super({
      model: 'mock-model',
      temperature: 0.5,
      maxTokens: 500,
      apiEndpoint: null
    });
    this.delayMs = config.delayMs || 1000;
    
    console.log(`🔧 Initialized Mock service with delay: ${this.delayMs}ms`);
  }

  /**
   * Process a natural language prompt into browser commands
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Optional page context information 
   * @param {Object} sessionInfo - Optional session information
   * @returns {Promise<Object>} - Structured browser commands
   */
  async processPrompt(prompt, pageContext = null, sessionInfo = {}) {
    // Extreme visibility logging for debugging
    console.log(`
**************************************************************
*            MOCK SERVICE - PROCESSING PROMPT                 *
**************************************************************
* THIS PROVES THE LOGGING IS WORKING - CHECK YOUR CONSOLE     *
* IF YOU DON'T SEE THIS, YOU'RE LOOKING AT THE WRONG CONSOLE *
**************************************************************
`);
    
    // Log the complete prompt
    console.log(`📝 MOCK SERVICE - COMPLETE USER PROMPT:
==========================================
${prompt}
==========================================`);

    // Log page context if available
    if (pageContext) {
      console.log(`📝 MOCK SERVICE - PAGE CONTEXT:
==========================================
URL: ${pageContext.url}
Title: ${pageContext.title}
Elements: ${pageContext.elements ? pageContext.elements.length : 0} interactive elements
==========================================`);
    }
    
    // Simple delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, this.delayMs));
    
    // Convert to lowercase for easier pattern matching
    const lowerPrompt = prompt.toLowerCase();
    
    // Generate mock response based on prompt patterns
    const commands = [];
    
    // Check for navigation command
    const navigateMatch = lowerPrompt.match(/navigate to (https?:\/\/[^\s,]+)/);
    if (navigateMatch) {
      commands.push({
        action: 'navigate',
        url: navigateMatch[1]
      });
    }
    
    // Check for fill commands
    const fillMatches = [...lowerPrompt.matchAll(/fill (?:the )?(?:"([^"]+)"|'([^']+)'|(\w+))(?:\s+(?:field|input|form))? with (?:"([^"]+)"|'([^']+)'|([^\s,.]+))/g)];
    
    if (fillMatches.length > 0) {
      fillMatches.forEach(match => {
        // Extract field name and value from the match groups
        const fieldName = match[1] || match[2] || match[3]; // Either quoted or unquoted field name
        const value = match[4] || match[5] || match[6]; // Either quoted or unquoted value
        
        commands.push({
          action: 'fill',
          xpath: null,
          description: fieldName,
          value: value
        });
      });
    }
    
    // Check for click command
    const clickMatches = [...lowerPrompt.matchAll(/click(?:\s+on)?(?:\s+the)?(?:\s+"([^"]+)"|'([^']+)'|([^\s,.]+)(?:\s+(?:button|link))?)/g)];
    
    if (clickMatches.length > 0) {
      clickMatches.forEach(match => {
        // Extract element description from the match groups
        const elementDesc = match[1] || match[2] || match[3]; // Either quoted or unquoted element description
        
        commands.push({
          action: 'click',
          xpath: null,
          description: elementDesc
        });
      });
    }
    
    // Create result object
    const result = { 
      commands,
      isComplete: commands.length > 0,
      completionMessage: commands.length > 0 
        ? "Mock service has generated commands based on your request" 
        : "Couldn't understand your request. Please try again with different wording."
    };
    
    // Log the response
    console.log(`📝 MOCK SERVICE - RESPONSE:
==========================================
${JSON.stringify(result, null, 2)}
==========================================`);
    
    // Return in the expected format
    return result;
  }

  /**
   * Test the connection - always returns true for mock service
   * @returns {Promise<boolean>} - Always true
   */
  async testConnection() {
    console.log('🧪 Testing connection to Mock service (always succeeds)');
    return true;
  }

  /**
   * Get the system prompt
   * @param {boolean} hasPageContext - Whether page context is provided
   * @returns {string} - System prompt
   */
  getSystemPrompt(hasPageContext = false) {
    return PromptTemplates.getBaseSystemPrompt(hasPageContext);
  }
}

export default MockService;