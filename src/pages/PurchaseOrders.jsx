import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    vendorId: '',
    poNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: '0.00',
    total: '0.00',
    items: []
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
    fetchItems();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get('/purchase-orders');
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch purchase orders'), getErrorType(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch vendors'), getErrorType(error));
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleDelete = async (id) => {
    const purchaseOrder = purchaseOrders.find(po => po.id === id);
    const message = `Are you sure you want to delete the purchase order "${purchaseOrder?.poNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Purchase Order',
      message,
      async () => {
        try {
          console.log('Deleting purchase order with ID:', id);
          const response = await axios.delete(`/purchase-orders/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Purchase order deleted successfully!', 'success');
          fetchPurchaseOrders();
        } catch (error) {
          console.error('Error deleting purchase order:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting purchase order');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Purchase Order',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we have at least one item
    if (formData.items.length === 0) {
      showErrorModal('Error', 'Please add at least one item to the purchase order', 'error');
      return;
    }
    
    console.log('Submitting purchase order data:', formData);
    
    // Prepare the data with proper types
    const purchaseOrderData = {
      ...formData,
      vendorId: parseInt(formData.vendorId),
      subtotal: formData.subtotal,
      total: formData.total,
      items: formData.items.map(item => ({
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
      if (editingPurchaseOrder) {
        const response = await axios.put(`/purchase-orders/${editingPurchaseOrder.id}`, purchaseOrderData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Purchase order updated successfully!', 'success');
      } else {
        const response = await axios.post('/purchase-orders', purchaseOrderData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Purchase order created successfully!', 'success');
      }
      setShowModal(false);
      setEditingPurchaseOrder(null);
      resetForm();
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save purchase order'), getErrorType(error));
    }
  };

  const handleEdit = (purchaseOrder) => {
    setEditingPurchaseOrder(purchaseOrder);
    setFormData({
      vendorId: purchaseOrder.vendorId.toString(),
      poNo: purchaseOrder.poNo,
      orderDate: new Date(purchaseOrder.orderDate).toISOString().split('T')[0],
      validUntil: new Date(purchaseOrder.validUntil).toISOString().split('T')[0],
      subtotal: purchaseOrder.subtotal?.toString() || '0.00',
      total: purchaseOrder.total?.toString() || '0.00',
      items: purchaseOrder.items?.map(item => ({
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
      vendorId: '',
      poNo: '',
      orderDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: '0.00',
      total: '0.00',
      items: []
    });
  };

  // Add item to purchase order
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

  // Remove item from purchase order
  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    // Recalculate totals after removing item
    calculateTotals(newItems);
  };

  // Update item in purchase order
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
        newItems[index].price = selectedItem.purchaseUnitPrice.toString();
        newItems[index].description = selectedItem.description || '';
        // Recalculate line total with new price
        const quantity = parseFloat(newItems[index].quantity || 1);
        const price = parseFloat(selectedItem.purchaseUnitPrice);
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

  // Calculate purchase order totals
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2) // For purchase orders, total equals subtotal (no tax/shipping)
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage your purchase orders</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new purchase order');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Create PO
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          {purchaseOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">PO #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vendor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Expected Delivery</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{po.poNo}</td>
                      <td className="py-3 px-4">{po.vendor?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(po.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(po.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">👁️</button>
                          <button className="text-green-600 hover:text-green-800">📄</button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for purchase order ID:', po.id);
                              handleDelete(po.id);
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
              <span className="text-4xl mb-4 block">📋</span>
              <p>No purchase orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => console.log('Modal overlay clicked')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Purchase Order</h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
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
                    <label className="form-label">Vendor *</label>
                    <select
                      name="vendorId"
                      value={formData.vendorId}
                      onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">PO Number *</label>
                    <input
                      type="text"
                      name="poNo"
                      value={formData.poNo}
                      onChange={(e) => setFormData({...formData, poNo: e.target.value})}
                      className="form-input"
                      placeholder="PO-001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Date *</label>
                    <input
                      type="date"
                      name="orderDate"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                      className="form-input"
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
                      required
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Purchase Order Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-primary btn-sm"
                    >
                      Add Item
                    </button>
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
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                  className="form-input form-input-sm"
                                  min="0"
                                  step="any"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                                  className="form-input form-input-sm"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.discountPercent}
                                  onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                                  className="form-input form-input-sm"
                                  min="0"
                                  max="100"
                                  step="0.01"
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPurchaseOrder(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPurchaseOrder ? 'Update' : 'Create'} Purchase Order
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

export default PurchaseOrders; 