import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
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

  useEffect(() => {
    fetchQuotations();
    fetchClients();
    fetchItems();
    fetchProfile();
  }, []);

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
    const quotation = quotations.find(q => q.id === id);
    const message = `Are you sure you want to delete the quotation "${quotation?.quotationNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Quotation',
      message,
      async () => {
        try {
          console.log('Deleting quotation with ID:', id);
          const _response = await axios.delete(`/quotations/${id}`);
          console.log('Delete response:', _response.data);
          showErrorModal('Success', 'Quotation deleted successfully!', 'success');
          fetchQuotations();
        } catch (error) {
          console.error('Error deleting quotation:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting quotation');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Quotation',
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
   const handlePrintQuotation= async (quotationId) => {
      try {
        const quotationResponse = await axios.get(`/quotations/${quotationId}`);
        const quotation = quotationResponse.data;
  
        const profileResponse = await axios.get('/profiles'); // Fetch company profile
        const companyProfile = profileResponse.data.length > 0 ? profileResponse.data[0] : {};
  
        if (!quotation) {
          showErrorModal('Error', 'quotation not found for printing', 'error');
          return;
        }
  
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showErrorModal('Error', 'Please allow pop-ups for printing', 'error');
          return;
        }
  
        const quotationHtml = `
          <html>
            <head>
              <title>quotation #${quotation.quotationNo}</title>
              <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
                .quotation-page { width: 210mm; min-height: 297mm; margin: 10mm auto; border: 1px solid #eee; background: #fff; padding: 20mm; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
                .company-info h1 { margin: 0; font-size: 28px; color: #333; }
                .company-info p { margin: 2px 0; font-size: 14px; color: #555; }
                .quotation-title { font-size: 40px; font-weight: bold; color: #333; margin-top: 0; }
                .quotation-meta { margin-top: 10px; text-align: right; font-size: 14px; }
                .quotation-meta div { margin-bottom: 5px; }
  
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
  
                .terms-conditions { font-size: 13px; color: #555; margin-bottom: 30px; }
                .footer-section { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                @media print {
                  .quotation-page { box-shadow: none; border: none; }
                }
              </style>
            </head>
            <body>
              <div class="quotation-page">
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
                    <h2 class="quotation-title">QUOTATION</h2>
                    <div class="quotation-meta">
                      <div><strong>Quotation No:</strong> ${quotation.quotationNo}</div>
                      <div><strong>Quotation Date:</strong> ${new Date(quotation.quotationDate).toLocaleDateString()}</div>
                      <div><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</div>
                      ${quotation.poNumber ? `<div><strong>PO No:</strong> ${quotation.poNumber}</div>` : ''}
                    </div>
                  </div>
                </div>
  
                <div class="address-section">
                  <div class="address-box">
                    <h3>Bill To:</h3>
                    <p><strong>${quotation.client?.companyName || 'Client Name'}</strong></p>
                    <p>${quotation.client?.billingAddress || 'Client Address'}</p>
                    <p>${quotation.client?.city || 'City'}, ${quotation.client?.state || 'State'} ${quotation.client?.pinCode || 'PIN'}</p>
                    <p>Email: ${quotation.client?.email || 'N/A'}</p>
                    <p>Phone: ${quotation.client?.phone || 'N/A'}</p>
                    ${quotation.client?.gstin ? `<p>GSTIN: ${quotation.client.gstin}</p>` : ''}
                  </div>
                  <div class="address-box">
                    <h3>Ship To:</h3>
                    <p><strong>${quotation.client?.companyName || 'Client Name'}</strong></p>
                    <p>${quotation.client?.shippingAddress || 'Client Address'}</p>
                    <p>${quotation.client?.city || 'City'}, ${quotation.client?.state || 'State'} ${quotation.client?.pinCode || 'PIN'}</p>
                    <!-- Assuming shipping address is stored in client, or you can add it to quotation model if needed -->
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
                    ${quotation.items.map((item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>
                          <strong>${item.item?.name || 'N/A'}</strong><br/>
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
                    <div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(quotation.subtotal)}</span></div>
                    <div class="summary-row total"><span>TOTAL:</span><span>${formatCurrency(quotation.total)}</span></div>
                  </div>
                </div>
  
                ${quotation.termsConditions ? `<div class="terms-conditions">
                  <strong>Terms and Conditions:</strong>
                  <p>${quotation.termsConditions}</p>
                </div>` : ''}
  
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
  
        printWindow.document.write(quotationHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // printWindow.close(); // Optionally close after printing, but can cause issues depending on browser settings
  
      } catch (_error) {
        console.error('Error printing Quotation:', _error);
        showErrorModal('Error', getErrorMessage(_error, 'Failed to print Quotation'), getErrorType(_error));
      }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Manage your quotations</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new quotation');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Create Quotation
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          {quotations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Quotation #</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Client</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Valid Until</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Total</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((quotation) => (
                    <tr key={quotation.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{quotation.quotationNo}</td>
                      <td className="py-3 px-4">{quotation.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(quotation.quotationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(quotation.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(quotation.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(quotation)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handlePrintQuotation(quotation.id)}
                          >
                            📄
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for quotation ID:', quotation.id);
                              handleDelete(quotation.id);
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
              <p>No quotations found</p>
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingQuotation(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={companyCodeMissing || profileLoading}>
                    {editingQuotation ? 'Update' : 'Create'} Quotation
                  </button>
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