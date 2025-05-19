import React from 'react';
import { clsx } from 'clsx';

/**
 * Button component with various styles and loading state
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading = false,
  icon,
  disabled,
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  
  return (
    <button
      className={clsx(
        baseClass,
        variantClass,
        isLoading && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="spinner w-4 h-4" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {children}
          {icon && <span className="ml-1">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;