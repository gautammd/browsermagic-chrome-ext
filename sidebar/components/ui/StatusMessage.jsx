import React from 'react';
import { clsx } from 'clsx';
import { FiInfo, FiAlertCircle, FiCheck } from 'react-icons/fi';

/**
 * Status message component for displaying success, error, or info messages
 */
const StatusMessage = ({
  message,
  type = 'info', // 'info', 'success', 'error'
  className,
  ...props
}) => {
  if (!message) return null;
  
  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-success/10';
      case 'error': return 'bg-error/10';
      default: return 'bg-primary/10';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <FiCheck className="text-success" size={18} />;
      case 'error': return <FiAlertCircle className="text-error" size={18} />;
      default: return <FiInfo className="text-primary" size={18} />;
    }
  };

  return (
    <div
      className={clsx(
        'mt-4 p-4 rounded-md flex items-center gap-2',
        getBgColor(),
        className
      )}
      {...props}
    >
      {getIcon()}
      <p>{message}</p>
    </div>
  );
};

export default StatusMessage;