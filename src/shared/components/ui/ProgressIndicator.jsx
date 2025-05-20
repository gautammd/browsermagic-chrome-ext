import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

/**
 * Apple-inspired minimal progress indicator that shows stages of an LLM request
 * Similar to OpenAI thinking model or Grok's thinking visualization
 * 
 * Default stages include:
 * - preparing: Getting page context
 * - sending: Sending request to LLM
 * - processing: LLM processing the request
 * - executing: Executing commands on the page
 * - complete: All steps completed
 */
const ProgressIndicator = ({
  stage = 'preparing',
  message = '',
  className,
  steps = [
    { id: 'preparing', label: 'Preparing' },
    { id: 'sending', label: 'Sending' },
    { id: 'processing', label: 'Processing' },
    { id: 'executing', label: 'Executing' },
    { id: 'complete', label: 'Complete' },
  ]
}) => {
  // State to track the displayed steps (allows smooth transition when steps change)
  const [displayedSteps, setDisplayedSteps] = useState(steps);
  
  // Update displayed steps when new steps are provided
  useEffect(() => {
    if (steps && steps.length > 0) {
      setDisplayedSteps(steps);
    }
  }, [JSON.stringify(steps)]); // Deep compare steps array
  
  // Get the index of the current stage
  const getStageIndex = (stageId) => {
    const index = displayedSteps.findIndex(step => step.id === stageId);
    return index >= 0 ? index : 0; // Default to first step if not found
  };

  const currentIndex = getStageIndex(stage);
  const currentStep = displayedSteps[currentIndex] || displayedSteps[0];

  return (
    <div className={clsx('my-4 px-1', className)}>
      {/* Thinking status container with Apple-inspired design */}
      <div className="bg-surface/30 backdrop-blur-sm border border-border/30 rounded-xl p-4 shadow-sm">
        {/* Current step and blinking cursor */}
        <div className="mb-3 flex items-center justify-center">
          {/* Status icon */}
          <div className={clsx(
            'w-2 h-2 rounded-full mr-3',
            stage === 'error' ? 'bg-error' : 
            stage === 'complete' ? 'bg-success' : 'bg-primary animate-pulse'
          )} />
          
          {/* Step name with proper capitalization */}
          <div className="text-sm font-medium">
            {currentStep?.label || stage.charAt(0).toUpperCase() + stage.slice(1)}
          </div>
        </div>
        
        {/* Current step message */}
        <div className="text-center text-text-secondary text-sm font-light relative min-h-8">
          {message || currentStep?.description || currentStep?.label || ""}
        </div>
        
        {/* Previous completed steps */}
        {currentIndex > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="text-xs text-text-tertiary">
              {displayedSteps.slice(0, currentIndex).map((step, index) => (
                <div key={step.id} className="flex items-center mb-1 last:mb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mr-2 flex-shrink-0" />
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add some animations to the global CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .animate-blink {
      animation: blink 1s step-end infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .animate-pulse {
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `;
  document.head.appendChild(style);
}

export default ProgressIndicator;