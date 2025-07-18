import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';
import ReadOnlyDocumentNumber from '../components/ReadOnlyDocumentNumber';

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
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
    fetchItems();
    fetchProfile();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const _response = await axios.get('/purchase-orders');
      setPurchaseOrders(_response.data);
    } catch (_error) {
      console.error('Error fetching purchase orders:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch purchase orders'), getErrorType(_error));
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const _response = await axios.get('/vendors');
      setVendors(_response.data);
    } catch (_error) {
      console.error('Error fetching vendors:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch vendors'), getErrorType(_error));
    }
  };

  const fetchItems = async () => {
    try {
      const _response = await axios.get('/items');
      setItems(_response.data);
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
    const purchaseOrder = purchaseOrders.find(po => po.id === id);
    const message = `Are you sure you want to delete the purchase order "${purchaseOrder?.poNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Purchase Order',
      message,
      async () => {
        try {
          console.log('Deleting purchase order with ID:', id);
          const _response = await axios.delete(`/purchase-orders/${id}`);
          console.log('Delete response:', _response.data);
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

  // New function for printing purchase order
  const handlePrintPurchaseOrder = async (purchaseOrderId) => {
    try {
      const purchaseOrderResponse = await axios.get(`/purchase-orders/${purchaseOrderId}`);
      const purchaseOrder = purchaseOrderResponse.data;

      const profileResponse = await axios.get('/profiles'); // Fetch company profile
      const companyProfile = profileResponse.data.length > 0 ? profileResponse.data[0] : {};

      if (!purchaseOrder) {
        showErrorModal('Error', 'Purchase Order not found for printing', 'error');
        return;
      }

      // Ensure purchaseOrder.items is an array for mapping
      if (!purchaseOrder.items) {
        purchaseOrder.items = [];
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showErrorModal('Error', 'Please allow pop-ups for printing', 'error');
        return;
      }

      const purchaseOrderHtml = `
        <html>
          <head>
            <title>Purchase Order #${purchaseOrder.poNo}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
              .po-page { width: 210mm; min-height: 297mm; margin: 10mm auto; border: 1px solid #eee; background: #fff; padding: 20mm; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .company-info h1 { margin: 0; font-size: 28px; color: #333; }
              .company-info p { margin: 2px 0; font-size: 14px; color: #555; }
              .po-title { font-size: 40px; font-weight: bold; color: #333; margin-top: 0; }
              .po-meta { margin-top: 10px; text-align: right; font-size: 14px; }
              .po-meta div { margin-bottom: 5px; }

              .address-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .address-box { border: 1px solid #eee; padding: 15px; width: 48%; }
              .address-box h3 { margin-top: 0; font-size: 16px; color: #333; }
              .address-box p { margin: 2px 0; font-size: 14px; color: #555; }

              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .item-table th, .item-table td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 14px; }
              .item-table th { background-color: #f9f9f9; font-weight: bold; color: #333; }

              .summary-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
              .summary-box { width: 40%; border: 1px solid #eee; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px solid #eee; }
              .summary-row:last-child { border-bottom: none; }
              .summary-row.total { background-color: #f2f2f2; font-weight: bold; font-size: 16px; }

              .footer-section { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
              @media print {
                .po-page { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="po-page">
              <div class="header-section">
                <div class="company-info">
                  ${companyProfile.logo ? `<img src="${companyProfile.logo}" alt="Company Logo" style="height: 60px; margin-bottom: 10px;"/>` : ''}
                  <h1>${companyProfile.companyName || 'Your Company Name'}</h1>
                  <p>${companyProfile.address || 'Your Company Address'}</p>
                  <p>${companyProfile.city || 'City'}, ${companyProfile.state || 'State'} ${companyProfile.pinCode || 'PIN'}</p>
                  <p>Email: ${companyProfile.email || 'N/A'} | Phone: ${companyProfile.phone || 'N/A'}</p>
                  ${companyProfile.website ? `<p>Website: ${companyProfile.website}</p>` : ''}
                  ${companyProfile.serviceTaxNo ? `<p>Service Tax No: ${companyProfile.serviceTaxNo}</p>` : ''}
                </div>
                <div>
                  <h2 class="po-title">PURCHASE ORDER</h2>
                  <div class="po-meta">
                    <div><strong>PO No:</strong> ${purchaseOrder.poNo}</div>
                    <div><strong>Order Date:</strong> ${new Date(purchaseOrder.orderDate).toLocaleDateString()}</div>
                    <div><strong>Valid Until:</strong> ${new Date(purchaseOrder.validUntil).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div class="address-section">
                <div class="address-box">
                  <h3>Vendor:</h3>
                  <p><strong>${purchaseOrder.vendor?.companyName || 'Vendor Name'}</strong></p>
                  <p>${purchaseOrder.vendor?.billingAddress || 'Vendor Address'}</p>
                  <p>${purchaseOrder.vendor?.city || 'City'}, ${purchaseOrder.vendor?.state || 'State'} ${purchaseOrder.vendor?.pinCode || 'PIN'}</p>
                  <p>Email: ${purchaseOrder.vendor?.email || 'N/A'}</p>
                  <p>Phone: ${purchaseOrder.vendor?.phone || 'N/A'}</p>
                  ${purchaseOrder.vendor?.gstin ? `<p>GSTIN: ${purchaseOrder.vendor.gstin}</p>` : ''}
                </div>
                <div class="address-box">
                  <h3>Ship To:</h3>
                  <p><strong>${companyProfile.companyName || 'Your Company Name'}</strong></p>
                  <p>${companyProfile.address || 'Your Company Address'}</p>
                  <p>${companyProfile.city || 'City'}, ${companyProfile.state || 'State'} ${companyProfile.pinCode || 'PIN'}</p>
                </div>
              </div>

              <table class="item-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item & Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${(purchaseOrder.items || []).map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>
                        <strong>${items.find(i => i.id.toString() === item.itemId)?.name || 'N/A'}</strong><br/>
                        <span style="font-size: 12px; color: #777;">${item.description || ''}</span>
                      </td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>${item.discountPercent || '0'}%</td>
                      <td>${formatCurrency(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="summary-section">
                <div class="summary-box">
                  <div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(purchaseOrder.subtotal)}</span></div>
                  <div class="summary-row total"><span>TOTAL:</span><span>${formatCurrency(purchaseOrder.total)}</span></div>
                </div>
              </div>

              <div class="footer-section">
                <p>${companyProfile.companyName || 'Your Company Name'} | ${companyProfile.address || 'Your Company Address'}</p>
                <p>Email: ${companyProfile.email || 'N/A'} | Phone: ${companyProfile.phone || 'N/A'} | Website: ${companyProfile.website || 'N/A'}</p>
                ${companyProfile.bankDetails && companyProfile.bankDetails.length > 0 ? `
                  <p>Bank: ${companyProfile.bankDetails[0].bankName} | A/C No: ${companyProfile.bankDetails[0].accountNumber} | IFSC: ${companyProfile.bankDetails[0].ifscCode}</p>
                ` : ''}
                <p>Thank you for your business!</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(purchaseOrderHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

    } catch (error) {
      console.error('Error printing Purchase Order:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to print Purchase Order'), getErrorType(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (companyCodeMissing) return;
    if (formData.items.length === 0) {
      showErrorModal('Error', 'Please add at least one item to the purchase order', 'error');
      return;
    }
    
    console.log('Submitting purchase order data:', formData);
    
    // Prepare the data with proper types, do NOT include poNo
    const { vendorId, orderDate, validUntil, subtotal, total, items } = formData;
    const purchaseOrderData = {
      vendorId: parseInt(vendorId),
      orderDate,
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
      if (editingPurchaseOrder) {
        const _response = await axios.put(`/purchase-orders/${editingPurchaseOrder.id}`, purchaseOrderData);
        console.log('Update response:', _response.data);
        showErrorModal('Success', 'Purchase order updated successfully!', 'success');
      } else {
        const _response = await axios.post('/purchase-orders', purchaseOrderData);
        console.log('Create response:', _response.data);
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
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">PO #</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Vendor</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Expected Delivery</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Total</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
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
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(po)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handlePrintPurchaseOrder(po.id)}
                          >
                            📄
                          </button>
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
              <h3 className="modal-title">{editingPurchaseOrder ? 'Edit Purchase Order' : 'Create New Purchase Order'}</h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingPurchaseOrder(null);
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
                    <ReadOnlyDocumentNumber
                      label="PO Number *"
                      value={formData.poNo}
                      tooltip="This number is auto-generated by the system and cannot be changed."
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
                  <button type="submit" className="btn btn-primary" disabled={companyCodeMissing || profileLoading}>
                    {editingPurchaseOrder ? 'Update' : 'Create'} Purchase Order
                  </button>
                </div>
                {companyCodeMissing && !profileLoading && (
                  <div className="text-red-600 text-sm mt-2">
                    Please set your <b>Company Code</b> in the <a href="/profile" className="underline">profile</a> before creating purchase orders.
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

export default PurchaseOrders; 