import React from 'react';
import { clsx } from 'clsx';

/**
 * Reusable select field component with label
 */
const SelectField = ({ 
  label, 
  id, 
  options = [],
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
      <select
        id={id}
        className={clsx('select', className)}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;