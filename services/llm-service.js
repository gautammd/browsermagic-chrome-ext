/**
 * Base LLM Service Interface
 * This serves as the abstract interface that all LLM service implementations must follow
 */
class LLMService {
  /**
   * Process a natural language prompt into browser commands
   * @param {string} prompt - User's natural language instructions
   * @param {Object} pageContext - Context about the current page
   * @param {Object} sessionInfo - Information about the current session including history
   * @param {string} sessionInfo.initialPrompt - The first prompt from the user that started the session
   * @param {Array} sessionInfo.actionHistory - Array of previously executed actions and their results
   * @param {boolean} sessionInfo.isNewSession - Whether this is a new session
   * @returns {Promise<Object>} - Structured browser commands
   */
  async processPrompt(prompt, pageContext, sessionInfo = {}) {
    throw new Error('Method not implemented. Each LLM service must implement this method.');
  }

  /**
   * Test the connection to the LLM service
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    throw new Error('Method not implemented. Each LLM service must implement this method.');
  }
}

export default LLMService;