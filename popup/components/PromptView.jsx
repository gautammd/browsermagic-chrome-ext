import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiInfo } from 'react-icons/fi';

const PromptView = ({ settings }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const handleExecute = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setStatus('Processing your request...');

    try {
      // Send a message to the background script
      chrome.runtime.sendMessage({
        action: 'processPrompt',
        prompt: prompt.trim(),
        settings
      }, response => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          setStatus('Error: ' + chrome.runtime.lastError.message);
          setIsProcessing(false);
          return;
        }

        if (response.error) {
          setStatus('Error: ' + response.error);
        } else {
          setStatus('Command executed successfully!');
          // Clear prompt after successful execution
          setPrompt('');
        }
        
        setIsProcessing(false);
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setStatus('');
        }, 3000);
      });
    } catch (error) {
      console.error('Execution error:', error);
      setStatus('Error: ' + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 'var(--spacing-lg)'
      }}
    >
      <div className="input-container" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label htmlFor="prompt-input" className="input-label">
          What would you like to do?
        </label>
        <textarea
          id="prompt-input"
          className="input"
          placeholder="Enter your instructions (e.g., 'Navigate to google.com, search for AI tools')"
          rows="5"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isProcessing}
          style={{ borderRadius: 'var(--radius-md)' }}
        />
      </div>

      <button
        onClick={handleExecute}
        className="btn btn-primary"
        disabled={isProcessing || !prompt.trim()}
        style={{ alignSelf: 'flex-end' }}
      >
        {isProcessing ? (
          <>
            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            Processing...
          </>
        ) : (
          <>
            Execute <FiSend size={16} />
          </>
        )}
      </button>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`status-container ${isProcessing ? '' : status.includes('Error') ? 'error' : 'success'}`}
          style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            backgroundColor: status.includes('Error') 
              ? 'rgba(255, 59, 48, 0.1)' 
              : 'rgba(52, 199, 89, 0.1)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}
        >
          <FiInfo size={18} color={status.includes('Error') ? 'var(--color-error)' : 'var(--color-success)'} />
          <p>{status}</p>
        </motion.div>
      )}

      <div style={{ 
        marginTop: 'var(--spacing-xl)', 
        textAlign: 'center',
        color: 'var(--color-text-tertiary)',
        fontSize: 'var(--font-size-sm)'
      }}>
        <p>Using {settings.provider} as provider</p>
        <p>
          {settings.provider === 'mock' && 'Mock mode (For development)'}
          {settings.provider === 'groq' && `Model: ${settings.providers.groq.model}`}
          {settings.provider === 'claude' && `Model: ${settings.providers.claude.model}`}
        </p>
      </div>
    </motion.div>
  );
};

export default PromptView;