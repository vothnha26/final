import React from 'react';

const Form = ({ 
  children, 
  onSubmit, 
  className = '',
  showActions = true,
  onCancel,
  submitText = 'Lưu',
  cancelText = 'Hủy',
  isLoading = false
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {children}
      
      {showActions && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xử lý...' : submitText}
          </button>
        </div>
      )}
    </form>
  );
};

// Form Field Component
export const FormField = ({ 
  label, 
  children, 
  error, 
  required = false,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Input Component
export const Input = ({ 
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      {...props}
    />
  );
};

// Select Component
export const Select = ({ 
  value,
  onChange,
  options = [],
  placeholder = 'Chọn...',
  error,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Textarea Component
export const Textarea = ({ 
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      {...props}
    />
  );
};

export default Form;



