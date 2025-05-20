import React from 'react';
import { clsx } from 'clsx';

/**
 * Reusable textarea component with label
 */
const TextareaField = ({ 
  label, 
  id, 
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
      <textarea
        id={id}
        className={clsx('input', className)}
        {...props}
      />
    </div>
  );
};

export default TextareaField;