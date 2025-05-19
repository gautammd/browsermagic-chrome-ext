/**
 * Prompt Templates Module
 * Contains standardized prompt templates for different LLM providers
 */

/**
 * Base system prompt for browser automation
 * @param {boolean} hasPageContext - Whether page context is provided
 * @returns {string} - System prompt
 */
export function getBaseSystemPrompt(hasPageContext = false) {
  let basePrompt = `You are BrowserMagic.ai, a browser automation assistant.
Your task is to convert natural language instructions into structured browser commands.
ALWAYS respond with VALID JSON in the following format:

{
  "commands": [
    {
      "action": "navigate",
      "url": "https://example.com"
    },
    {
      "action": "click",
      "xpath": "XPath of the element to click"
    },
    {
      "action": "fill",
      "xpath": "XPath of the input element",
      "value": "Text to fill in"
    }
  ],
  "isComplete": true|false,
  "completionMessage": "Optional message explaining the completion status"
}

Only use these three action types for commands: "navigate", "click", and "fill".

Always include the "isComplete" field to indicate whether the user's intended flow has been completed.
- Set "isComplete" to true when all steps needed to fulfill the user's request have been completed
- Set "isComplete" to false when more steps are needed after these commands execute
- Include a "completionMessage" explaining the current status and what remains to be done if incomplete

When the user provides a follow-up instruction, I will include:
1. The initial instruction that started the session
2. A list of previously completed actions and their results 
3. The current state of the page

Use the action history to understand what has been done so far and avoid repeating failed actions.
Use the current page state to determine the next steps needed to fulfill the user's request.
When errors occur, try alternative approaches to achieve the same goal.`;

  if (hasPageContext) {
    // Add instructions for using the provided page context
    basePrompt += `\n\nI will provide you with details about the current page, including:
1. A list of interactive elements with their XPaths, text, and precise location information
2. Each element's coordinates in the page (x, y, width, height)

When generating commands, use the interactive elements list as it contains pre-extracted, well-formatted element information.
This optimized snapshot includes only visible and interactive elements for better performance.

You MUST use XPath to identify elements in your commands. For example:
{
  "action": "click",
  "xpath": "//*[@id='login-button']"
}

Each element in the interactive elements list includes:
1. A number in brackets [1], [2], etc.
2. Its type (button, input, link, etc.)
3. Its text content (if any)
4. Its XPath expression for precise identification
5. Additional attributes like id, name, placeholder, etc.

Choose the most appropriate element based on the user's instructions and use its XPath in your commands.
When using an XPath from the list, use it EXACTLY as provided.

When deriving a selector from the HTML:
1. Prefer simple, robust selectors using IDs, classes, or element types
2. Ensure the selector is unique on the page
3. Look for semantic HTML and ARIA attributes that identify the element's purpose

If you can't determine a precise selector, return a command with a description instead:
{
  "action": "click",
  "description": "Clear button in search form"
}

For navigation commands, provide the full URL. If the user doesn't specify a URL, use appropriate relative navigation based on the current URL.`;
  } else {
    // Add instructions for generating selectors without page context
    basePrompt += `\n\nIf you don't have XPath information, provide descriptive text of what to match.
For example:
{
  "action": "click",
  "description": "Login button"
}

{
  "action": "fill",
  "description": "Email field in the login form",
  "value": "user@example.com"
}

The extension will use semantic matching to find the right elements based on your descriptions.`;
  }

  basePrompt += `\n\nMake sure to properly escape characters in JSON strings.
If you cannot understand the request, return an empty commands array.`;

  return basePrompt;
}

/**
 * Format the user prompt with context and history
 * @param {string} prompt - The original user prompt
 * @param {Object} pageContext - Context about the current page
 * @param {Object} sessionInfo - Information about the current session
 * @returns {string} - Formatted prompt with context and history
 */
export function formatPromptWithContext(prompt, pageContext = null, sessionInfo = {}) {
  let userPrompt = prompt;
  
  // Add session history context if available
  if (sessionInfo && sessionInfo.initialPrompt && !sessionInfo.isNewSession) {
    // Start with the initial user instruction for context
    userPrompt = `This is a continuation of your previous tasks. The initial instruction was:\n"${sessionInfo.initialPrompt}"\n\nMy new instruction is:\n${prompt}\n`;
    
    // Add the action history
    if (sessionInfo.actionHistory && sessionInfo.actionHistory.length > 0) {
      userPrompt += "\nPreviously completed actions:\n";
      
      sessionInfo.actionHistory.forEach((action, index) => {
        const success = action.result.success ? '✓' : '✗';
        userPrompt += `[${index + 1}] ${success} Action: ${action.command.action}, `;
        
        if (action.command.action === 'navigate') {
          userPrompt += `URL: "${action.command.url}"\n`;
        } else if (action.command.action === 'click') {
          userPrompt += `XPath: "${action.command.xpath || 'N/A'}", ` +
                       `Description: "${action.command.description || 'N/A'}"\n`;
        } else if (action.command.action === 'fill') {
          userPrompt += `XPath: "${action.command.xpath || 'N/A'}", ` +
                       `Description: "${action.command.description || 'N/A'}", ` +
                       `Value: "${action.command.value}"\n`;
        }
        
        // Add result status if there was an error
        if (!action.result.success && action.result.error) {
          userPrompt += `    Error: ${action.result.error}\n`;
        }
      });
    }
  }
  
  // Add page context information
  if (pageContext) {
    // Format page context for the LLM
    userPrompt += "\n\nCurrent page information:\n" +
          `URL: ${pageContext.url}\n` +
          `Title: ${pageContext.title}\n`;
    
    // Add the page elements information
    if (pageContext.elements && pageContext.elements.length > 0) {
      userPrompt += "\nInteractive elements on the page:\n";
      
      pageContext.elements.forEach((element, index) => {
        userPrompt += `[${index + 1}] Type: ${element.type}, ` +
                     `Text: "${element.text || ''}", ` +
                     `XPath: "${element.xpath}"\n`;
        
        // Add relevant attributes
        if (element.attributes) {
          const attrStr = Object.entries(element.attributes)
            .map(([key, value]) => `${key}: "${value}"`)
            .join(', ');
          
          userPrompt += `    Attributes: ${attrStr}\n`;
        }
        
        // Add location information if available
        if (element.location) {
          userPrompt += `    Location: x=${element.location.x}, y=${element.location.y}, ` +
                       `width=${element.location.width}, height=${element.location.height}\n`;
        }
      });
    }
    
    // Check if this is an optimized page context
    if (pageContext.isOptimized) {
      userPrompt += "\n\nNote: Using optimized DOM snapshot for better performance.";
    }
  }
  
  return userPrompt;
}

/**
 * Format a prompt for XPath refinement
 * @param {Object} command - The command to refine
 * @returns {string} - Refinement prompt
 */
export function formatRefinementPrompt(command) {
  return `I need to ${command.action} the element described as: "${command.description}".
Please analyze the interactive elements list to provide the exact XPath for this element from the page context.
If you find a matching element in the interactive elements list, use its exact XPath.
If not, suggest a description that might be better for finding the element.`;
}

/**
 * Format a prompt for recovery after a failed command
 * @param {Object} command - The failed command
 * @param {string} errorMessage - The error message
 * @returns {string} - Recovery prompt
 */
export function formatRecoveryPrompt(command, errorMessage) {
  return `The previous command (${command.action}) failed with error: "${errorMessage}". 
Please provide alternative commands to achieve the same goal.
Consider different ways to identify the element or alternative elements that would accomplish the same task.`;
}

/**
 * Format a prompt for continuation
 * @param {string} initialPrompt - The initial user prompt
 * @returns {string} - Continuation prompt
 */
export function formatContinuationPrompt(initialPrompt) {
  return `Continue the process of "${initialPrompt}". What are the next steps needed?
Based on the current page state and actions taken so far, provide the next set of commands to complete the user's request.`;
}