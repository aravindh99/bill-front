import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';
import ActionButton from '../components/ActionButton';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    type: 'product',
    unit: '',
    openingQuantity: '',
    tax: '',
    code: '',
    salesUnitPrice: '',
    salesCurrency: 'INR',
    salesCessPercentage: '',
    salesCess: '',
    purchaseUnitPrice: '',
    purchaseCurrency: 'INR',
    purchaseCessPercentage: '',
    purchaseCess: ''
  });

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedItems,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredItems, 25);

  useEffect(() => {
    fetchItems();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch items'), getErrorType(error));
    } finally {
      setLoading(false);
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting item data:', formData);
    try {
      if (editingItem) {
        const response = await axios.put(`/items/${editingItem.id}`, formData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Item updated successfully!', 'success');
      } else {
        const response = await axios.post('/items', formData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Item created successfully!', 'success');
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving item:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save item'), getErrorType(error));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku,
      type: item.type,
      unit: item.unit,
      openingQuantity: item.openingQuantity?.toString() || '',
      tax: item.tax?.toString() || '',
      code: item.code || '',
      salesUnitPrice: item.salesUnitPrice?.toString() || '',
      salesCurrency: item.salesCurrency || 'INR',
      salesCessPercentage: item.salesCessPercentage?.toString() || '',
      salesCess: item.salesCess?.toString() || '',
      purchaseUnitPrice: item.purchaseUnitPrice?.toString() || '',
      purchaseCurrency: item.purchaseCurrency || 'INR',
      purchaseCessPercentage: item.purchaseCessPercentage?.toString() || '',
      purchaseCess: item.purchaseCess?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    showConfirmModal(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      async () => {
        try {
          await axios.delete(`/items/${id}`);
          showErrorModal('Success', 'Item deleted successfully!', 'success');
          fetchItems();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting item:', error);
          showErrorModal('Error', getErrorMessage(error, 'Failed to delete item'), getErrorType(error));
        }
      }
    );
  };

  const handlePrint = (item) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Item - ${item.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .item-details { margin-bottom: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ITEM DETAILS</h1>
            <h2>${item.name}</h2>
          </div>
          
          <div class="item-details">
            <p><strong>Item Name:</strong> ${item.name}</p>
            <p><strong>SKU:</strong> ${item.sku}</p>
            <p><strong>Type:</strong> ${item.type}</p>
            <p><strong>Unit:</strong> ${item.unit}</p>
            <p><strong>Price:</strong> ₹${item.price}</p>
            <p><strong>Description:</strong> ${item.description || 'N/A'}</p>
            <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
            <p><strong>Stock:</strong> ${item.stock || 0}</p>
          </div>
          
          <div class="footer">
            <p>This is an item information document</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      type: 'product',
      unit: '',
      openingQuantity: '',
      tax: '',
      code: '',
      salesUnitPrice: '',
      salesCurrency: 'INR',
      salesCessPercentage: '',
      salesCess: '',
      purchaseUnitPrice: '',
      purchaseCurrency: 'INR',
      purchaseCessPercentage: '',
      purchaseCess: ''
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600 mt-2">Manage your inventory items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Items
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Found {totalItems} item{totalItems !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU/Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.sku || '-'}</div>
                      {item.code && <div className="text-xs text-gray-500">{item.code}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.unit || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.openingQuantity || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.salesUnitPrice ? formatCurrency(item.salesUnitPrice, item.salesCurrency) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
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
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="form-input"
                      placeholder="e.g., pcs, kg, hours"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sales Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="salesUnitPrice"
                      value={formData.salesUnitPrice}
                      onChange={(e) => setFormData({...formData, salesUnitPrice: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchaseUnitPrice"
                      value={formData.purchaseUnitPrice}
                      onChange={(e) => setFormData({...formData, purchaseUnitPrice: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="tax"
                      value={formData.tax}
                      onChange={(e) => setFormData({...formData, tax: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HSN/SAC Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
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
                  >
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </ActionButton>
                </div>
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />
    </div>
  );
};

export default Items; 