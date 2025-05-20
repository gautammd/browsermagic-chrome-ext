import React from 'react';
import { clsx } from 'clsx';

/**
 * Card component for containing content
 */
const Card = ({ 
  children, 
  title,
  className, 
  titleClassName,
  ...props 
}) => {
  return (
    <div className={clsx('card', className)} {...props}>
      {title && (
        <h2 className={clsx('text-xl font-semibold text-text-primary mb-6', titleClassName)}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

export default Card;