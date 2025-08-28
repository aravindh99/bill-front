import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import PageHeader from '../components/PageHeader';
import ActionButton from '../components/ActionButton';
import ResultsSummary from '../components/ResultsSummary';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';
import ReadOnlyDocumentNumber from '../components/ReadOnlyDocumentNumber';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    quotationNo: '',
    poNumber: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: '0.00',
    total: '0.00',
    items: []
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter quotations based on search term
  const filteredQuotations = quotations.filter(quotation =>
    quotation.quotationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.total?.toString().includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedQuotations,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredQuotations, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'quotationNo',
      header: 'Quotation No',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.poNumber && <div className="text-xs text-gray-500">PO: {row.poNumber}</div>}
        </div>
      )
    },
    {
      key: 'client',
      header: 'Client',
      render: (value) => (
        <div className="text-sm text-gray-900">{value?.companyName || '-'}</div>
      )
    },
    {
      key: 'quotationDate',
      header: 'Date',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'total',
      header: 'Total',
      render: (value) => (
        <div className="text-sm font-medium text-gray-900">
          ₹{parseFloat(value || 0).toFixed(2)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, row) => {
        const validUntil = new Date(row.validUntil);
        const today = new Date();
        const isExpired = validUntil < today;
        const colorClass = isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        const status = isExpired ? 'Expired' : 'Valid';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        );
      }
    }
  ];

  useEffect(() => {
    fetchQuotations();
    fetchClients();
    fetchItems();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get('/quotations');
      setQuotations(response.data);
    } catch (_error) {
      console.error('Error fetching quotations:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch quotations'), getErrorType(_error));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (_error) {
      console.error('Error fetching clients:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch clients'), getErrorType(_error));
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('/items');
      setItems(response.data);
    } catch (_error) {
      console.error('Error fetching items:', _error);
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await axios.get('/profiles');
      if (response.data.length > 0) {
        setCompanyCodeMissing(!response.data[0].companyCode);
      } else {
        setCompanyCodeMissing(true);
      }
    } catch (_error) {
      console.error('Error fetching profile:', _error);
      setCompanyCodeMissing(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await axios.delete(`/quotations/${id}`);
          fetchQuotations();
        resetToFirstPage();
        } catch (error) {
          console.error('Error deleting quotation:', error);
        showErrorModal('Error', getErrorMessage(error, 'Failed to delete quotation'), getErrorType(error));
      }
    }
  };

  const handlePrint = (quotation) => {
    // Create a new window for printing
        const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
          <html>
            <head>
          <title>Quotation - ${quotation.quotationNo}</title>
              <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .quotation-details { margin-bottom: 20px; }
            .client-details { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
          <div class="header">
            <h1>QUOTATION</h1>
            <h2>${quotation.quotationNo}</h2>
                  </div>
          
          <div class="quotation-details">
            <p><strong>Quotation Date:</strong> ${new Date(quotation.quotationDate).toLocaleDateString()}</p>
            <p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>
                </div>
  
          <div class="client-details">
            <h3>Quote To:</h3>
            <p><strong>${quotation.client?.companyName || 'N/A'}</strong></p>
            <p>${quotation.client?.address || 'N/A'}</p>
            <p>${quotation.client?.city || ''}, ${quotation.client?.state || ''} ${quotation.client?.pinCode || ''}</p>
                </div>
  
          <table class="items-table">
                  <thead>
                    <tr>
                <th>Item</th>
                <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
              ${quotation.items?.map(item => `
                <tr>
                  <td>${item.item?.name || 'N/A'}</td>
                  <td>${item.description || ''}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${item.total}</td>
                      </tr>
              `).join('') || ''}
                  </tbody>
                </table>
  
          <div class="totals">
            <p><strong>Subtotal:</strong> ₹${quotation.subtotal || 0}</p>
            <p><strong>Tax:</strong> ₹${quotation.tax || 0}</p>
            <p><strong>Total Amount:</strong> ₹${quotation.amount || 0}</p>
                </div>
  
          <div class="footer">
            <p>This quotation is valid until ${new Date(quotation.validUntil).toLocaleDateString()}</p>
              </div>
            </body>
          </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (companyCodeMissing) return;
    if (formData.items.length === 0) {
      showErrorModal('Error', 'Please add at least one item to the quotation', 'error');
      return;
    }
    // Prepare the data with proper types, do NOT include quotationNo
    const { clientId, poNumber, quotationDate, validUntil, subtotal, total, items } = formData;
    const quotationData = {
      clientId: parseInt(clientId),
      poNumber,
      quotationDate,
      validUntil,
      subtotal,
      total,
      items: items.map(item => ({
        itemId: parseInt(item.itemId),
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        discountPercent: item.discountPercent || 0,
        total: item.total,
        description: item.description || ''
      }))
    };
    try {
      if (editingQuotation) {
        const _response = await axios.put(`/quotations/${editingQuotation.id}`, quotationData);
        showErrorModal('Success', 'Quotation updated successfully!', 'success');
      } else {
        const _response = await axios.post('/quotations', quotationData);
        showErrorModal('Success', 'Quotation created successfully!', 'success');
      }
      setShowModal(false);
      setEditingQuotation(null);
      resetForm();
      fetchQuotations();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      showErrorModal('Error', getErrorMessage(error, 'Failed to save quotation'), getErrorType(error));
    }
  };

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      clientId: quotation.clientId.toString(),
      quotationNo: quotation.quotationNo,
      poNumber: quotation.poNumber || '',
      quotationDate: new Date(quotation.quotationDate).toISOString().split('T')[0],
      validUntil: new Date(quotation.validUntil).toISOString().split('T')[0],
      subtotal: quotation.subtotal?.toString() || '0.00',
      total: quotation.total?.toString() || '0.00',
      items: quotation.items?.map(item => ({
        itemId: item.itemId.toString(),
        unit: item.unit,
        quantity: item.quantity.toString(),
        price: item.price.toString(),
        discountPercent: item.discountPercent?.toString() || '0',
        total: item.total.toString(),
        description: item.description || ''
      })) || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      quotationNo: '',
      poNumber: '',
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: '0.00',
      total: '0.00',
      items: []
    });
  };

  // Add item to quotation
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        itemId: '',
        unit: '',
        quantity: '1',
        price: '0.00',
        discountPercent: '0',
        total: '0.00',
        description: ''
      }]
    });
  };

  // Remove item from quotation
  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    // Recalculate totals after removing item
    calculateTotals(newItems);
  };

  // Update item in quotation
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // If updating quantity, price, or discount, recalculate the line total
    if (['quantity', 'price', 'discountPercent'].includes(field)) {
      const quantity = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].price || 0);
      const discount = parseFloat(newItems[index].discountPercent || 0);
      const lineTotal = quantity * price * (1 - discount / 100);
      newItems[index].total = lineTotal.toFixed(2);
    }
    
    // If updating itemId, get the item details and set default values
    if (field === 'itemId' && value) {
      const selectedItem = items.find(item => item.id.toString() === value);
      if (selectedItem) {
        newItems[index].unit = selectedItem.unit;
        newItems[index].price = selectedItem.salesUnitPrice.toString();
        newItems[index].description = selectedItem.description || '';
        // Recalculate line total with new price
        const quantity = parseFloat(newItems[index].quantity || 1);
        const price = parseFloat(selectedItem.salesUnitPrice);
        const discount = parseFloat(newItems[index].discountPercent || 0);
        const lineTotal = quantity * price * (1 - discount / 100);
        newItems[index].total = lineTotal.toFixed(2);
      }
    }
    
    setFormData({
      ...formData,
      items: newItems
    });
    
    // Recalculate totals
    calculateTotals(newItems);
  };

  // Calculate quotation totals
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2) // For quotations, total equals subtotal (no tax/shipping)
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <PageHeader
        title="Quotations"
        subtitle="Manage your quotations"
        actionButton={
          <ActionButton
            onClick={() => setShowModal(true)}
            variant="primary"
            size="lg"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
          Create Quotation
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by quotation number, client, PO number, or total..."
        label="Search Quotations"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="quotation"
      />

      {/* Quotations Table */}
      <DataTable
        columns={columns}
        data={paginatedQuotations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No quotations found"
        emptyIcon="📋"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => console.log('Modal overlay clicked')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingQuotation(null);
                  resetForm();
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <ReadOnlyDocumentNumber
                      label="Quotation Number *"
                      value={formData.quotationNo}
                      tooltip="This number is auto-generated by the system and cannot be changed."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quotation Date *</label>
                    <input
                      type="date"
                      name="quotationDate"
                      value={formData.quotationDate}
                      onChange={(e) => setFormData({...formData, quotationDate: e.target.value})}
                      className="form-input"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid Until *</label>
                    <input
                      type="date"
                      name="validUntil"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      className="form-input"
                      min={formData.quotationDate}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PO Number</label>
                    <input
                      type="text"
                      name="poNumber"
                      value={formData.poNumber}
                      onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                      className="form-input"
                      placeholder="PO-001"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Quotation Items</h4>
                    <ActionButton
                      type="button"
                      onClick={addItem}
                      variant="primary"
                      size="sm"
                    >
                      Add Item
                    </ActionButton>
                  </div>
                  {formData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Item</th>
                            <th className="text-left py-2 px-2">Description</th>
                            <th className="text-left py-2 px-2">Unit</th>
                            <th className="text-left py-2 px-2">Qty</th>
                            <th className="text-left py-2 px-2">Price</th>
                            <th className="text-left py-2 px-2">Discount %</th>
                            <th className="text-left py-2 px-2">Total</th>
                            <th className="text-left py-2 px-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-2">
                                <select
                                  value={item.itemId}
                                  onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                                  className="form-input form-input-sm"
                                  required
                                >
                                  <option value="">Select Item</option>
                                  {items.map((i) => (
                                    <option key={i.id} value={i.id}>
                                      {i.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                  className="form-input form-input-sm"
                                  placeholder="Description"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                  className="form-input form-input-sm"
                                  readOnly
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  name="quantity"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                  className="form-input"
                                  min="0"
                                  step="1"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  name="rate"
                                  value={item.price}
                                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                                  className="form-input"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  name="taxRate"
                                  value={item.taxRate || ''}
                                  onChange={(e) => updateItem(index, 'taxRate', e.target.value)}
                                  className="form-input"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g., 18 for 18%"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.total}
                                  className="form-input form-input-sm"
                                  readOnly
                                />
                              </td>
                              <td className="py-2 px-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                      <p>No items added. Click "Add Item" to start.</p>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div className="border-t pt-4">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Subtotal</label>
                      <input
                        type="number"
                        name="subtotal"
                        value={formData.subtotal}
                        className="form-input bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Amount</label>
                      <input
                        type="number"
                        name="total"
                        value={formData.total}
                        className="form-input bg-gray-100 font-semibold"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingQuotation(null);
                      resetForm();
                    }}
                    variant="secondary"
                    size="md"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={companyCodeMissing || profileLoading}
                  >
                    {editingQuotation ? 'Update Quotation' : 'Create Quotation'}
                  </ActionButton>
                </div>
                {companyCodeMissing && !profileLoading && (
                  <div className="text-red-600 text-sm mt-2">
                    Please set your <b>Company Code</b> in the <a href="/profile" className="underline">profile</a> before creating quotations.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modern Error Modal */}
      <ModernModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '', type: 'error' })}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      >
        {errorModal.children}
      </ModernModal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
};

export default Quotations; 