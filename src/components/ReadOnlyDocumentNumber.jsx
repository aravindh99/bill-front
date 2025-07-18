import React from 'react';

const ReadOnlyDocumentNumber = ({ label, value, tooltip }) => (
  <div className="form-group">
    <label className="form-label flex items-center">
      {label}
      {tooltip && (
        <span className="ml-1 text-xs text-gray-400" title={tooltip}>
          ⓘ
        </span>
      )}
    </label>
    <input
      type="text"
      value={value || ''}
      className="form-input bg-gray-100 font-mono text-blue-700 font-semibold"
      readOnly
      tabIndex={-1}
      style={{ cursor: 'not-allowed' }}
    />
  </div>
);

export default ReadOnlyDocumentNumber; 