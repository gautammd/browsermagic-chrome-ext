import React, { useState } from 'react';
import { FiSend, FiClock, FiRefreshCw } from 'react-icons/fi';
import { 
  Button, 
  Card, 
  TextareaField, 
  StatusMessage,
  ProgressIndicator
} from '../../src/shared/components/ui';
import { usePromptHistory, useBackgroundMessaging } from '../../src/shared/hooks';

/**
 * Prompt input view for executing commands
 */
const PromptView = ({ settings }) => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [showHistory, setShowHistory] = useState(false);
  
  // Custom hooks
  const { history, addToHistory, getLatest } = usePromptHistory();
  const { processPrompt, progress, isLoading } = useBackgroundMessaging();

  /**
   * Handle prompt execution
   */
  const handleExecute = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    
    try {
      // Save to history
      addToHistory(prompt.trim());

      // Process the prompt (progress will be tracked via the hook)
      const response = await processPrompt(prompt.trim(), settings);
      
      if (response.error) {
        setStatus({ message: `Error: ${response.error}`, type: 'error' });
      } else {
        setStatus({ message: 'Command executed successfully!', type: 'success' });
        setPrompt('');
      }
    } catch (error) {
      console.error('Execution error:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
      
      // Clear status after 3 seconds (only clear success/error messages, not progress updates)
      if (progress.stage === 'complete' || progress.stage === 'error') {
        setTimeout(() => {
          setStatus({ message: '', type: 'info' });
        }, 3000);
      }
    }
  };

  /**
   * Handle selecting a prompt from history
   */
  const handlePromptSelect = (selectedPrompt) => {
    setPrompt(selectedPrompt.text);
    setShowHistory(false);
  };

  /**
   * Format a date string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render history view when showHistory is true
  const renderHistoryView = () => (
    <div className="flex-1 border border-border rounded-md overflow-auto bg-surface">
      {history.length > 0 ? (
        <ul className="list-none p-0">
          {history.map(item => (
            <li 
              key={item.id}
              onClick={() => handlePromptSelect(item)}
              className="p-3 border-b border-divider cursor-pointer flex justify-between items-center gap-2 hover:bg-background"
            >
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {item.text}
              </div>
              <div className="text-xs text-text-tertiary whitespace-nowrap">
                {formatDate(item.timestamp)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-3 text-center text-text-tertiary">
          No history yet
        </div>
      )}
    </div>
  );

  // Render prompt input when showHistory is false
  const renderPromptInput = () => (
    <TextareaField
      id="prompt-input"
      label=""
      placeholder="Enter your instructions (e.g., 'Navigate to google.com, search for AI tools')"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      disabled={isProcessing}
      className="flex-1 min-h-[200px]"
      containerClassName="flex-1 flex flex-col"
    />
  );

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="prompt-input" className="input-label">
              What would you like to do?
            </label>
            <Button 
              variant="ghost"
              className="p-1"
              onClick={() => setShowHistory(!showHistory)}
              aria-label="Toggle history"
            >
              <FiClock size={16} />
            </Button>
          </div>
          
          {showHistory ? renderHistoryView() : renderPromptInput()}
        </div>

        {/* Progress indicator - shown during processing */}
        {isProcessing && (
          <ProgressIndicator 
            stage={progress.stage}
            message={progress.message}
            steps={progress.steps}
          />
        )}
        
        <div className="flex justify-end mt-4 gap-2">
          {!showHistory && history.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => handlePromptSelect(getLatest())}
              aria-label="Repeat last prompt"
            >
              <FiRefreshCw size={16} />
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isProcessing || !prompt.trim()}
            isLoading={isProcessing}
            icon={<FiSend size={16} />}
          >
            Execute
          </Button>
        </div>

        {/* Status message - shown for errors/success and cleared automatically */}
        {status.message && (
          <StatusMessage
            message={status.message}
            type={status.type}
          />
        )}
      </Card>

      <div className="mt-4 text-center text-xs text-text-tertiary">
        <p>Using {settings.provider} as provider</p>
        <p>
          {settings.provider === 'groq' && `Model: ${settings.providers.groq.model}`}
          {settings.provider === 'openai' && `Model: ${settings.providers.openai?.model || 'gpt-4o'}`}
        </p>
      </div>
    </div>
  );
};

export default PromptView;