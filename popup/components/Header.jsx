import React from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiX } from 'react-icons/fi';

const Header = ({ activeView, onToggleView }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}
    >
      <h1 style={{ 
        fontSize: 'var(--font-size-xxl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-primary)' 
      }}>
        BrowserMagic.ai
      </h1>
      
      <button
        onClick={onToggleView}
        className="btn btn-ghost"
        style={{
          width: '32px',
          height: '32px',
          padding: '6px',
          borderRadius: 'var(--radius-full)'
        }}
        aria-label={activeView === 'prompt' ? 'Settings' : 'Close Settings'}
      >
        {activeView === 'prompt' ? (
          <FiSettings size={20} />
        ) : (
          <FiX size={20} />
        )}
      </button>
    </motion.header>
  );
};

export default Header;