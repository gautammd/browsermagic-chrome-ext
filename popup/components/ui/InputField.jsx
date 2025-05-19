import React from 'react';
import { clsx } from 'clsx';

/**
 * Reusable input field component with label and icon support
 */
const InputField = ({ 
  label, 
  id, 
  icon,
  className, 
  containerClassName,
  labelClassName,
  ...props 
}) => {
  return (
    <div className={clsx('input-container', containerClassName)}>
      {label && (
        <label 
          htmlFor={id} 
          className={clsx('input-label', labelClassName)}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={clsx('input', className)}
          {...props}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;