import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

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

  useEffect(() => {
    fetchItems();
  }, []);

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
    const item = items.find(i => i.id === id);
    const message = `Are you sure you want to delete the item "${item?.name}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Item',
      message,
      async () => {
        try {
          console.log('Deleting item with ID:', id);
          const response = await axios.delete(`/items/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Item deleted successfully!', 'success');
          fetchItems();
        } catch (error) {
          console.error('Error deleting item:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting item');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Item',
              message,
              'warning'
            );
            // We'll handle the related records in the modal children
            setErrorModal(prev => ({
              ...prev,
              children: relatedRecordsComponent
            }));
          } else {
            showErrorModal('Error', message, getErrorType(error));
          }
        }
      }
    );
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

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600">Manage your products and services</p>
        </div>
        <button
          onClick={() => {
            console.log('Opening modal for new item');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Add Item
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full md:w-1/3"
        />
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="card-content">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Item</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">SKU</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Type</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Sales Price</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Purchase Price</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{item.sku}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(item.salesUnitPrice, item.salesCurrency)}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(item.purchaseUnitPrice, item.purchaseCurrency)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for item ID:', item.id);
                              handleDelete(item.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📦</span>
              <p>No items found</p>
            </div>
          )}
        </div>
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update' : 'Create'} Item
                  </button>
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