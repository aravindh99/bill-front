import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNo: '',
    poNo: '',
    invoiceDate: '',
    poDate: '',
    dueDate: '',
    paymentTerms: '',
    shippingCharges: '0.00',
    subtotal: '0.00',
    tax: '0.00',
    amount: '0.00',
    balance: '0.00',
    drCr: 'DR',
    termsConditions: '',
    items: []
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchItems();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch invoices'), getErrorType(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we have at least one item
    if (formData.items.length === 0) {
      showErrorModal('Error', 'Please add at least one item to the invoice', 'error');
      return;
    }
    
    console.log('Submitting invoice data:', formData);
    
    // Prepare the data with proper types
    const invoiceData = {
      ...formData,
      clientId: parseInt(formData.clientId),
      shippingCharges: formData.shippingCharges || '0.00',
      subtotal: formData.subtotal,
      tax: formData.tax,
      amount: formData.amount,
      balance: formData.balance || formData.amount, // Balance equals amount for new invoices
      drCr: formData.drCr || 'DR',
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
      if (editingInvoice) {
        const response = await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Invoice updated successfully!', 'success');
      } else {
        const response = await axios.post('/invoices', invoiceData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Invoice created successfully!', 'success');
      }
      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save invoice'), getErrorType(error));
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId.toString(),
      invoiceNo: invoice.invoiceNo,
      poNo: invoice.poNo || '',
      invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
      poDate: invoice.poDate ? new Date(invoice.poDate).toISOString().split('T')[0] : '',
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      paymentTerms: invoice.paymentTerms,
      shippingCharges: invoice.shippingCharges?.toString() || '0.00',
      subtotal: invoice.subtotal?.toString() || '0.00',
      tax: invoice.tax?.toString() || '0.00',
      amount: invoice.amount?.toString() || '0.00',
      balance: invoice.balance?.toString() || '0.00',
      drCr: invoice.drCr || 'DR',
      termsConditions: invoice.termsConditions || '',
      items: invoice.invoiceItems?.map(item => ({
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

  const handleDelete = async (id) => {
    const invoice = invoices.find(i => i.id === id);
    const message = `Are you sure you want to delete the invoice "${invoice?.invoiceNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Invoice',
      message,
      async () => {
        try {
          console.log('Deleting invoice with ID:', id);
          const response = await axios.delete(`/invoices/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Invoice deleted successfully!', 'success');
          fetchInvoices();
        } catch (error) {
          console.error('Error deleting invoice:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting invoice');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Invoice',
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
      clientId: '',
      invoiceNo: '',
      poNo: '',
      invoiceDate: '',
      poDate: '',
      dueDate: '',
      paymentTerms: '',
      shippingCharges: '0.00',
      subtotal: '0.00',
      tax: '0.00',
      amount: '0.00',
      balance: '0.00',
      drCr: 'DR',
      termsConditions: '',
      items: []
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusColor = (balance) => {
    if (balance === 0) return 'bg-green-100 text-green-800';
    if (balance > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add item to invoice
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

  // Remove item from invoice
  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    // Recalculate totals after removing item
    calculateTotals(newItems);
  };

  // Update item in invoice
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

  // Calculate invoice totals
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const taxAmount = parseFloat(formData.tax || 0);
    const shippingCharges = parseFloat(formData.shippingCharges || 0);
    const totalAmount = subtotal + taxAmount + shippingCharges;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      amount: totalAmount.toFixed(2),
      balance: totalAmount.toFixed(2) // For new invoices, balance equals amount
    }));
  };

  // Update tax and recalculate totals
  const updateTax = (value) => {
    const subtotal = parseFloat(formData.subtotal || 0);
    const taxAmount = parseFloat(value || 0);
    const shippingCharges = parseFloat(formData.shippingCharges || 0);
    const totalAmount = subtotal + taxAmount + shippingCharges;
    
    setFormData({
      ...formData,
      tax: value,
      amount: totalAmount.toFixed(2),
      balance: totalAmount.toFixed(2)
    });
  };

  // Update shipping charges and recalculate totals
  const updateShippingCharges = (value) => {
    const subtotal = parseFloat(formData.subtotal || 0);
    const taxAmount = parseFloat(formData.tax || 0);
    const shippingCharges = parseFloat(value || 0);
    const totalAmount = subtotal + taxAmount + shippingCharges;
    
    setFormData({
      ...formData,
      shippingCharges: value,
      amount: totalAmount.toFixed(2),
      balance: totalAmount.toFixed(2)
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage your invoices and billing</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="mr-2">➕</span>
          Create Invoice
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full md:w-1/3"
        />
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-content">
          {filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Balance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invoice.invoiceNo}</td>
                      <td className="py-3 px-4">{invoice.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(invoice.balance)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.balance)}`}>
                          {invoice.balance === 0 ? 'Paid' : invoice.balance > 0 ? 'Pending' : 'Overdue'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800" onClick={() => handleEdit(invoice)}>
                            👁️
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            📄
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for invoice ID:', invoice.id);
                              handleDelete(invoice.id);
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
              <span className="text-4xl mb-4 block">📄</span>
              <p>No invoices found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => console.log('Modal overlay clicked')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingInvoice(null);
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
                    <label className="form-label">Invoice Number *</label>
                    <input
                      type="text"
                      name="invoiceNo"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                      className="form-input"
                      placeholder="INV-001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice Date *</label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PO Number</label>
                    <input
                      type="text"
                      name="poNo"
                      value={formData.poNo}
                      onChange={(e) => setFormData({...formData, poNo: e.target.value})}
                      className="form-input"
                      placeholder="PO-001"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PO Date</label>
                    <input
                      type="date"
                      name="poDate"
                      value={formData.poDate}
                      onChange={(e) => setFormData({...formData, poDate: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <input
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                      className="form-input"
                      placeholder="Net 30"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Invoice Items</h4>
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
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Shipping Charges</label>
                      <input
                        type="number"
                        name="shippingCharges"
                        value={formData.shippingCharges}
                        onChange={(e) => updateShippingCharges(e.target.value)}
                        className="form-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
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
                      <label className="form-label">Tax Amount</label>
                      <input
                        type="number"
                        name="tax"
                        value={formData.tax}
                        onChange={(e) => updateTax(e.target.value)}
                        className="form-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Amount</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        className="form-input bg-gray-100 font-semibold"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Balance</label>
                      <input
                        type="number"
                        name="balance"
                        value={formData.balance}
                        className="form-input bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select
                        name="drCr"
                        value={formData.drCr}
                        onChange={(e) => setFormData({...formData, drCr: e.target.value})}
                        className="form-input"
                      >
                        <option value="DR">Debit (DR)</option>
                        <option value="CR">Credit (CR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group form-full-width">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea
                    name="termsConditions"
                    value={formData.termsConditions}
                    onChange={(e) => setFormData({...formData, termsConditions: e.target.value})}
                    className="form-input"
                    rows="3"
                    placeholder="Payment terms, delivery terms, etc."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingInvoice(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingInvoice ? 'Update' : 'Create'} Invoice
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

export default Invoices; 