import React from 'react';

const ActionButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  ...props
}) => {
  const baseClasses = "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "text-white hover:shadow-lg focus:ring-purple-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const primaryStyle = {
    background: 'linear-gradient(135deg, #211531, #9254de)',
    boxShadow: '0 2px 8px rgba(64,18,178,0.10)'
  };

  const hoverStyle = {
    background: 'linear-gradient(135deg, #1a0f24, #7f3fc7)',
    boxShadow: '0 4px 12px rgba(146,84,222,0.3)',
    transform: 'translateY(-1px)'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={variant === 'primary' ? primaryStyle : {}}
      onMouseEnter={(e) => {
        if (variant === 'primary' && !disabled) {
          Object.assign(e.target.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary' && !disabled) {
          Object.assign(e.target.style, primaryStyle);
        }
      }}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
};

export default ActionButton; 