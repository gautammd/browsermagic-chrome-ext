import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        textAlign: 'center',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-tertiary)',
        marginTop: 'auto',
        paddingTop: '16px'
      }}
    >
      <p>Powered by BrowserMagic.ai</p>
    </motion.footer>
  );
};

export default Footer;