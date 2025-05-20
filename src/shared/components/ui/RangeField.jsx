import React from 'react';
import { clsx } from 'clsx';

/**
 * Reusable range input component with label and value display
 */
const RangeField = ({ 
  label, 
  id, 
  value, 
  className, 
  containerClassName,
  labelClassName,
  showValue = true,
  ...props 
}) => {
  return (
    <div className={clsx('input-container', containerClassName)}>
      <div className="flex justify-between items-center mb-1">
        {label && (
          <label 
            htmlFor={id} 
            className={clsx('input-label', labelClassName)}
          >
            {label}
          </label>
        )}
        {showValue && (
          <span className="text-xs text-text-tertiary">
            {value}
          </span>
        )}
      </div>
      <input
        id={id}
        type="range"
        value={value}
        className={clsx('range', className)}
        {...props}
      />
    </div>
  );
};

export default RangeField;