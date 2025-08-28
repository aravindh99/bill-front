import React from 'react';

const ResultsSummary = ({ 
  totalItems, 
  currentPage, 
  totalPages, 
  searchTerm, 
  itemName = "item",
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600">
          Found {totalItems} {itemName}{totalItems !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary; 