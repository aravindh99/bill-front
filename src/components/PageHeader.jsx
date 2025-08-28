import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  actionButton, 
  className = "" 
}) => {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {actionButton && (
        <div className="flex-shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default PageHeader; 