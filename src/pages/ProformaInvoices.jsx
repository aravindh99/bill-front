import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';
import ReadOnlyDocumentNumber from '../components/ReadOnlyDocumentNumber';

const ProformaInvoices = () => {
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProformaInvoice, setEditingProformaInvoice] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [quotations, setQuotations] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    proformaNo: '',
    poNumber: '',
    proformaDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    quotationId: ''
  });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);

  useEffect(() => {
    fetchProformaInvoices();
    fetchClients();
    fetchItems();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      axios.get(`/quotations/client/${formData.clientId}`)
        .then(res => setQuotations(res.data))
        .catch(() => setQuotations([]));
    } else {
      setQuotations([]);
      setFormData(f => ({ ...f, quotationId: '' }));
    }
  }, [formData.clientId]);

  useEffect(() => {
    if (
      formData.quotationId &&
      !editingProformaInvoice &&
      (!formData.items || formData.items.length === 0)
    ) {
      const selectedQuotation = quotations.find(q => q.id === parseInt(formData.quotationId));
      if (selectedQuotation) {
        setFormData(f => ({
          ...f,
          items: selectedQuotation.items.map(item => ({
            itemId: item.itemId?.toString() || '',
            unit: item.unit,
            quantity: item.quantity.toString(),
            price: item.price.toString(),
            discountPercent: item.discountPercent?.toString() || '0',
            total: item.total.toString(),
            description: item.description || ''
          }))
        }));
      }
    }
  }, [formData.quotationId, quotations, editingProformaInvoice]);

  const fetchProformaInvoices = async () => {
    try {
      const response = await axios.get('/proformas');
      setProformaInvoices(response.data);
    } catch (error) {
      console.error('Error fetching proforma invoices:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch proforma invoices'), getErrorType(error));
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
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch clients'), getErrorType(error));
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

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await axios.get('/profiles');
      if (response.data.length > 0) {
        setProfile(response.data[0]);
        setCompanyCodeMissing(!response.data[0].companyCode);
      } else {
        setCompanyCodeMissing(true);
      }
    } catch (error) {
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
    const proformaInvoice = proformaInvoices.find(pi => pi.id === id);
    const message = `Are you sure you want to delete the proforma invoice "${proformaInvoice?.proformaNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Proforma Invoice',
      message,
      async () => {
        try {
          console.log('Deleting proforma invoice with ID:', id);
          const response = await axios.delete(`/proformas/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Proforma invoice deleted successfully!', 'success');
          fetchProformaInvoices();
        } catch (error) {
          console.error('Error deleting proforma invoice:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting proforma invoice');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Proforma Invoice',
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

  const handlePrintProformaInvoice = async (proformaInvoiceId) => {
    try {
      console.log('Attempting to print Proforma Invoice...', proformaInvoiceId);
      const proformaInvoiceResponse = await axios.get(`/proformas/${proformaInvoiceId}`);
      const proformaInvoice = proformaInvoiceResponse.data;

      const profileResponse = await axios.get('/profiles'); // Fetch company profile
      const companyProfile = profileResponse.data.length > 0 ? profileResponse.data[0] : {};

      if (!proformaInvoice) {
        showErrorModal('Error', 'Proforma Invoice not found for printing', 'error');
        return;
      }

      // Ensure proformaInvoice.items is an array for mapping
      if (!proformaInvoice.items) {
        proformaInvoice.items = [];
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showErrorModal('Error', 'Please allow pop-ups for printing', 'error');
        return;
      }

      const proformaInvoiceHtml = `
        <html>
          <head>
            <title>Proforma Invoice #${proformaInvoice.proformaNo}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
              .invoice-page { width: 210mm; min-height: 297mm; margin: 10mm auto; border: 1px solid #eee; background: #fff; padding: 20mm; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .company-info h1 { margin: 0; font-size: 28px; color: #333; }
              .company-info p { margin: 2px 0; font-size: 14px; color: #555; }
              .invoice-title { font-size: 40px; font-weight: bold; color: #333; margin-top: 0; }
              .invoice-meta { margin-top: 10px; text-align: right; font-size: 14px; }
              .invoice-meta div { margin-bottom: 5px; }

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
                .invoice-page { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-page">
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
                  <h2 class="invoice-title">PROFORMA INVOICE</h2>
                  <div class="invoice-meta">
                    <div><strong>Proforma No:</strong> ${proformaInvoice.proformaNo}</div>
                    <div><strong>Proforma Date:</strong> ${new Date(proformaInvoice.proformaDate).toLocaleDateString()}</div>
                    <div><strong>Valid Until:</strong> ${new Date(proformaInvoice.validUntil).toLocaleDateString()}</div>
                    ${proformaInvoice.poNumber ? `<div><strong>PO Number:</strong> ${proformaInvoice.poNumber}</div>` : ''}
                  </div>
                </div>
              </div>

              <div class="address-section">
                <div class="address-box">
                  <h3>Bill To:</h3>
                  <p><strong>${proformaInvoice.client?.companyName || 'Client Name'}</strong></p>
                  <p>${proformaInvoice.client?.billingAddress || 'Client Address'}</p>
                  <p>${proformaInvoice.client?.city || 'City'}, ${proformaInvoice.client?.state || 'State'} ${proformaInvoice.client?.pinCode || 'PIN'}</p>
                  <p>Email: ${proformaInvoice.client?.email || 'N/A'}</p>
                  <p>Phone: ${proformaInvoice.client?.phone || 'N/A'}</p>
                  ${proformaInvoice.client?.gstin ? `<p>GSTIN: ${proformaInvoice.client.gstin}</p>` : ''}
                </div>
                <div class="address-box">
                  <h3>Ship To:</h3>
                  <p><strong>${proformaInvoice.client?.companyName || 'Client Name'}</strong></p>
                  <p>${proformaInvoice.client?.shippingAddress || 'Client Address'}</p>
                  <p>${proformaInvoice.client?.city || 'City'}, ${proformaInvoice.client?.state || 'State'} ${proformaInvoice.client?.pinCode || 'PIN'}</p>
                </div>
              </div>

              <table class="item-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item & Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${(proformaInvoice.items || []).map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>
                        <strong>${items.find(i => i.id.toString() === item.itemId)?.name || 'N/A'}</strong><br/>
                        <span style="font-size: 12px; color: #777;">${item.description || ''}</span>
                      </td>
                      <td>${item.quantity}</td>
                      <td>${item.unit}</td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>${item.discountPercent || '0'}%</td>
                      <td>${formatCurrency(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="summary-section">
                <div class="summary-box">
                  <div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(proformaInvoice.subtotal || 0)}</span></div>
                  <div class="summary-row total"><span>TOTAL:</span><span>${formatCurrency(proformaInvoice.total || 0)}</span></div>
                </div>
              </div>

              ${proformaInvoice.terms ? `<div class="terms-conditions">
                <strong>Terms and Conditions:</strong>
                <p>${proformaInvoice.terms}</p>
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

      printWindow.document.write(proformaInvoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

    } catch (error) {
      console.error('Error printing Proforma Invoice:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to print Proforma Invoice'), getErrorType(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (companyCodeMissing) return;
    if (formData.items.length === 0) {
      showErrorModal('Error', 'Please add at least one item to the proforma invoice', 'error');
      return;
    }
    // Prepare the data with proper types, do NOT include proformaNo
    const { clientId, poNumber, proformaDate, validUntil, items, quotationId } = formData;
    const proformaInvoiceData = {
      clientId: parseInt(clientId),
      poNumber,
      proformaDate,
      validUntil,
      quotationId: quotationId ? parseInt(quotationId) : undefined,
      items: items.map(item => ({
        itemId: item.itemId ? parseInt(item.itemId) : null,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        discountPercent: parseFloat(item.discountPercent || 0),
        total: parseFloat(item.total),
        description: item.description || ''
      }))
    };
    try {
      if (editingProformaInvoice) {
        const response = await axios.put(`/proformas/${editingProformaInvoice.id}`, proformaInvoiceData);
        showErrorModal('Success', 'Proforma invoice updated successfully!', 'success');
      } else {
        const response = await axios.post('/proformas', proformaInvoiceData);
        showErrorModal('Success', 'Proforma invoice created successfully!', 'success');
      }
      setShowModal(false);
      setEditingProformaInvoice(null);
      resetForm();
      fetchProformaInvoices();
    } catch (error) {
      showErrorModal('Error', getErrorMessage(error, 'Failed to save proforma invoice'), getErrorType(error));
    }
  };

  const handleEdit = (proformaInvoice) => {
    setEditingProformaInvoice(proformaInvoice);
    setFormData({
      clientId: proformaInvoice.clientId.toString(),
      proformaNo: proformaInvoice.proformaNo,
      poNumber: proformaInvoice.poNumber || '',
      proformaDate: new Date(proformaInvoice.proformaDate).toISOString().split('T')[0],
      validUntil: new Date(proformaInvoice.validUntil).toISOString().split('T')[0],
      items: proformaInvoice.items?.map(item => ({
        itemId: item.itemId?.toString() || '',
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
      proformaNo: '',
      poNumber: '',
      proformaDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
      quotationId: ''
    });
  };

  // Add item to proforma invoice
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

  // Remove item from proforma invoice
  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    // Recalculate totals after removing item
    calculateTotals(newItems);
  };

  // Update item in proforma invoice
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

  // Calculate proforma invoice totals
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    // For proforma invoices, total equals subtotal (no tax/shipping)
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
          <h1 className="text-3xl font-bold text-gray-900">Proforma Invoices</h1>
          <p className="text-gray-600">Manage your proforma invoices</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new proforma invoice');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Create Proforma Invoice
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          {proformaInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Proforma #</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Client</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Valid Until</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proformaInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invoice.proformaNo}</td>
                      <td className="py-3 px-4">{invoice.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.proformaDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(invoice)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePrintProformaInvoice(invoice.id);
                            }}
                            type="button"
                            title="Print Proforma Invoice"
                            aria-label="Print Proforma Invoice"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for proforma invoice ID:', invoice.id);
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
              <span className="text-4xl mb-4 block"></span>
              <p>No proforma invoices found</p>
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
                {editingProformaInvoice ? 'Edit' : 'Create New'} Proforma Invoice
              </h3>
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
                    <label className="form-label">Client *</label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!editingProformaInvoice && formData.clientId && quotations.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Create from Quotation (Optional)</label>
                      <select
                        name="quotationId"
                        value={formData.quotationId}
                        onChange={(e) => setFormData({...formData, quotationId: e.target.value})}
                        className="form-input"
                      >
                        <option value="">-- Select Quotation --</option>
                        {quotations.map(quotation => (
                          <option key={quotation.id} value={quotation.id}>
                            {quotation.quotationNo} ({new Date(quotation.quotationDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selecting a quotation will auto-fill items. You can still edit them.
                      </p>
                    </div>
                  )}
                  <div className="form-group">
                    <ReadOnlyDocumentNumber
                      label="Proforma Number *"
                      value={formData.proformaNo}
                      tooltip="This number is auto-generated by the system and cannot be changed."
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
                  <div className="form-group">
                    <label className="form-label">Proforma Date *</label>
                    <input
                      type="date"
                      name="proformaDate"
                      value={formData.proformaDate}
                      onChange={(e) => setFormData({...formData, proformaDate: e.target.value})}
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
                    <h4 className="text-lg font-semibold">Proforma Invoice Items</h4>
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
                                  placeholder="Unit"
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

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProformaInvoice(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={companyCodeMissing || profileLoading}>
                    {editingProformaInvoice ? 'Update' : 'Create'} Proforma Invoice
                  </button>
                </div>
                {companyCodeMissing && !profileLoading && (
                  <div className="text-red-600 text-sm mt-2">
                    Please set your <b>Company Code</b> in the <a href="/profile" className="underline">profile</a> before creating proforma invoices.
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

export default ProformaInvoices; 