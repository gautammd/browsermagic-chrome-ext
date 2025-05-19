import React from 'react';
import { motion } from 'framer-motion';
import { FiClock } from 'react-icons/fi';

const MockSettings = ({ settings, onChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 style={{ 
        fontSize: 'var(--font-size-lg)',
        marginBottom: 'var(--spacing-md)',
        color: 'var(--color-text-primary)'
      }}>
        Mock Settings (For Development)
      </h3>
      
      <div className="input-container">
        <label htmlFor="mock-delay" className="input-label">
          Simulated Delay (ms)
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="mock-delay"
            type="number"
            className="input"
            min="0"
            max="5000"
            value={settings.delay}
            onChange={(e) => onChange('delay', parseInt(e.target.value, 10))}
          />
          <FiClock 
            size={16} 
            className="input-icon"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </div>
      </div>
      
      <div style={{ 
        marginTop: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)'
      }}>
        <p>Mock mode simulates LLM responses for development and testing purposes only. No API requests will be made.</p>
      </div>
    </motion.div>
  );
};

export default MockSettings;