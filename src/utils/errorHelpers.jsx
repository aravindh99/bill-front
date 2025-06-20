export const formatRelatedRecords = (relatedRecords) => {
  if (!relatedRecords) return null;

  const recordList = Object.entries(relatedRecords)
    .filter(([key, count]) => count > 0)
    .map(([key, count]) => {
      // Convert camelCase to readable format
      const readableKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace('Invoice Items', 'Invoice Items')
        .replace('Quotation Items', 'Quotation Items')
        .replace('Proforma Invoices', 'Proforma Invoices')
        .replace('Delivery Chalans', 'Delivery Chalans')
        .replace('Credit Notes', 'Credit Notes')
        .replace('Debit Notes', 'Debit Notes')
        .replace('Payment Details', 'Payment Details');

      return { key: readableKey, count };
    });

  if (recordList.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Related records found:
      </div>
      <div className="space-y-2">
        {recordList.map(({ key, count }, index) => (
          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
            <span className="text-gray-700">{key}</span>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
              {count} {count === 1 ? 'record' : 'records'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 mt-0.5">💡</span>
          <div className="text-sm text-blue-800">
            <strong>What to do:</strong> Delete these related records first before deleting the main record.
          </div>
        </div>
      </div>
    </div>
  );
};

export const getErrorMessage = (error, defaultMessage) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || defaultMessage;
};

export const getErrorType = (error) => {
  if (error.response?.status === 400) return 'warning';
  if (error.response?.status >= 500) return 'error';
  return 'error';
}; 