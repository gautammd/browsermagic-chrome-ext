import React from 'react';

/**
 * Checkbox input field component
 */
const CheckField = ({ id, label, description, checked, onChange, disabled = false }) => {
  return (
    <div className="flex items-start mb-4">
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light focus:ring-2"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-text-primary cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-text-secondary mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default CheckField;