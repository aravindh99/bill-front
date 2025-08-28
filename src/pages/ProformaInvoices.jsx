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
    proformaInvoiceNo: '',
    quotationId: '',
    proformaInvoiceDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: '0.00',
    total: '0.00',
    items: []
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter proforma invoices based on search term
  const filteredProformaInvoices = proformaInvoices.filter(proforma =>
    proforma.proformaInvoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proforma.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proforma.total?.toString().includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedProformaInvoices,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredProformaInvoices, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'proformaInvoiceNo',
      header: 'Proforma No',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.quotation?.quotationNo && <div className="text-xs text-gray-500">Quote: {row.quotation.quotationNo}</div>}
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
      key: 'proformaInvoiceDate',
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
    fetchProformaInvoices();
    fetchClients();
    fetchItems();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

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
    const message = `Are you sure you want to delete the proforma invoice "${proformaInvoice?.proformaInvoiceNo}"? This action cannot be undone.`;
    
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
          resetToFirstPage(); // Reset pagination after deletion
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

  const handlePrint = (proformaInvoice) => {
    // Create a new window for printing
      const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
        <html>
          <head>
          <title>Proforma Invoice - ${proformaInvoice.proformaInvoiceNo}</title>
            <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
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
            <h1>PROFORMA INVOICE</h1>
            <h2>${proformaInvoice.proformaInvoiceNo}</h2>
                </div>
          
          <div class="invoice-details">
            <p><strong>Proforma Date:</strong> ${new Date(proformaInvoice.proformaInvoiceDate).toLocaleDateString()}</p>
            <p><strong>Valid Until:</strong> ${new Date(proformaInvoice.validUntil).toLocaleDateString()}</p>
              </div>

          <div class="client-details">
                  <h3>Bill To:</h3>
            <p><strong>${proformaInvoice.client?.companyName || 'N/A'}</strong></p>
            <p>${proformaInvoice.client?.address || 'N/A'}</p>
            <p>${proformaInvoice.client?.city || ''}, ${proformaInvoice.client?.state || ''} ${proformaInvoice.client?.pinCode || ''}</p>
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
              ${proformaInvoice.items?.map(item => `
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
            <p><strong>Subtotal:</strong> ₹${proformaInvoice.subtotal || 0}</p>
            <p><strong>Tax:</strong> ₹${proformaInvoice.tax || 0}</p>
            <p><strong>Total Amount:</strong> ₹${proformaInvoice.amount || 0}</p>
              </div>

          <div class="footer">
            <p>This is a proforma invoice and is not a tax document</p>
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
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      showErrorModal('Error', getErrorMessage(error, 'Failed to save proforma invoice'), getErrorType(error));
    }
  };

  const handleEdit = (proformaInvoice) => {
    setEditingProformaInvoice(proformaInvoice);
    setFormData({
      clientId: proformaInvoice.clientId.toString(),
      proformaInvoiceNo: proformaInvoice.proformaInvoiceNo,
      poNumber: proformaInvoice.poNumber || '',
      proformaInvoiceDate: new Date(proformaInvoice.proformaInvoiceDate).toISOString().split('T')[0],
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
      proformaInvoiceNo: '',
      poNumber: '',
      proformaInvoiceDate: new Date().toISOString().split('T')[0],
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
      {/* Header */}
      <PageHeader
        title="Proforma Invoices"
        subtitle="Manage your proforma invoices"
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
          Create Proforma Invoice
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by proforma number, client, or total..."
        label="Search Proforma Invoices"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="proforma invoice"
      />

      {/* Proforma Invoices Table */}
      <DataTable
        columns={columns}
        data={paginatedProformaInvoices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No proforma invoices found"
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
                      value={formData.proformaInvoiceNo}
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
                      value={formData.proformaInvoiceDate}
                      onChange={(e) => setFormData({...formData, proformaInvoiceDate: e.target.value})}
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
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingProformaInvoice(null);
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
                    {editingProformaInvoice ? 'Update Proforma Invoice' : 'Create Proforma Invoice'}
                  </ActionButton>
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