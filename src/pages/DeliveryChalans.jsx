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

const DeliveryChalans = () => {
  const [deliveryChalans, setDeliveryChalans] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeliveryChalan, setEditingDeliveryChalan] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    docNo: '',
    invoiceId: '',
    chalanDate: new Date().toISOString().split('T')[0],
    items: []
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter delivery chalans based on search term
  const filteredDeliveryChalans = deliveryChalans.filter(chalan =>
    chalan.docNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chalan.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chalan.invoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedDeliveryChalans,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredDeliveryChalans, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'docNo',
      header: 'Chalan No',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.invoice?.invoiceNo && <div className="text-xs text-gray-500">Invoice: {row.invoice.invoiceNo}</div>}
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
      key: 'chalanDate',
      header: 'Chalan Date',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'invoice',
      header: 'Invoice',
      render: (value) => (
        <div className="text-sm text-gray-900">{value?.invoiceNo || '-'}</div>
      )
    },
    {
      key: 'items',
      header: 'Items',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value && value.length > 0 ? `${value.length} item(s)` : '-'}
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchDeliveryChalans();
    fetchClients();
    fetchInvoices();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchDeliveryChalans = async () => {
    try {
      const response = await axios.get('/delivery-chalans');
      setDeliveryChalans(response.data);
    } catch (error) {
      console.error('Error fetching chalans:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch chalans'), getErrorType(error));
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

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch invoices'), getErrorType(error));
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/profile');
      // Assuming the response includes companyCode
      if (!response.data.companyCode) {
        setCompanyCodeMissing(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch profile'), getErrorType(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery chalan?')) {
      try {
        await axios.delete(`/delivery-chalans/${id}`);
        fetchDeliveryChalans();
        resetToFirstPage();
      } catch (error) {
        console.error('Error deleting delivery chalan:', error);
        showErrorModal('Error', getErrorMessage(error, 'Failed to delete delivery chalan'), getErrorType(error));
      }
    }
  };

  const handlePrint = (deliveryChalan) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Chalan - ${deliveryChalan.docNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .chalan-details { margin-bottom: 20px; }
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
            <h1>DELIVERY CHALAN</h1>
            <h2>${deliveryChalan.docNo}</h2>
          </div>
          
          <div class="chalan-details">
            <p><strong>Invoice Reference:</strong> ${deliveryChalan.invoice?.invoiceNo || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="client-details">
            <h3>Deliver To:</h3>
            <p><strong>${deliveryChalan.invoice?.client?.companyName || 'N/A'}</strong></p>
            <p>${deliveryChalan.invoice?.client?.address || 'N/A'}</p>
            <p>${deliveryChalan.invoice?.client?.city || ''}, ${deliveryChalan.invoice?.client?.state || ''} ${deliveryChalan.invoice?.client?.pinCode || ''}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${deliveryChalan.items?.map(item => `
                <tr>
                  <td>${item.item?.name || 'N/A'}</td>
                  <td>${item.description || ''}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit || 'N/A'}</td>
                  <td>${item.remarks || ''}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is a delivery chalan for goods mentioned above</p>
            <p>Customer Signature: _________________</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEdit = (row) => {
    console.log('Editing chalan:', row);
    setEditingDeliveryChalan(row);
    setFormData({
      clientId: row.clientId,
      docNo: row.docNo,
      invoiceId: row.invoiceId,
      chalanDate: row.chalanDate,
      items: row.items
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting chalan data:', formData);
    try {
      const response = await axios.post('/delivery-chalans', formData);
      console.log('Create response:', response.data);
      showErrorModal('Success', 'Delivery chalan created successfully!', 'success');
      setShowModal(false);
      resetForm();
      fetchDeliveryChalans();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving chalan:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save chalan'), getErrorType(error));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      docNo: '',
      invoiceId: '',
      chalanDate: new Date().toISOString().split('T')[0],
      items: []
    });
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
        title="Delivery Chalans"
        subtitle="Manage your delivery challans"
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
            Create Chalan
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by chalan number, client, or invoice..."
        label="Search Delivery Chalans"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="delivery chalan"
      />

      {/* Delivery Chalans Table */}
      <DataTable
        columns={columns}
        data={paginatedDeliveryChalans}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No delivery chalans found"
        emptyIcon="🚚"
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
              <h3 className="modal-title">Create New Chalan</h3>
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
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chalan Date *</label>
                    <input
                      type="date"
                      name="chalanDate"
                      value={formData.chalanDate}
                      onChange={(e) => setFormData({...formData, chalanDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chalan No *</label>
                    <input
                      type="text"
                      name="docNo"
                      value={formData.docNo}
                      onChange={(e) => setFormData({...formData, docNo: e.target.value})}
                      className="form-input"
                      required
                      placeholder="Chalan number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice *</label>
                    <select
                      name="invoiceId"
                      value={formData.invoiceId}
                      onChange={(e) => setFormData({...formData, invoiceId: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Select Invoice</option>
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Items</label>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1 mr-4">
                          <input
                            type="text"
                            name={`itemName-${index}`}
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = { ...newItems[index], name: e.target.value };
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="form-input"
                            placeholder="Item name"
                          />
                        </div>
                        <div className="flex-1 mr-4">
                          <input
                            type="number"
                            name={`itemQuantity-${index}`}
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = { ...newItems[index], quantity: e.target.value };
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="form-input"
                            placeholder="Quantity"
                          />
                        </div>
                        <div className="flex-1 mr-4">
                          <input
                            type="number"
                            name={`itemPrice-${index}`}
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = { ...newItems[index], price: e.target.value };
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="form-input"
                            placeholder="Price"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== index);
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        items: [...prev.items, { name: '', quantity: 1, price: 0 }]
                      }));
                    }}
                    className="text-blue-600 hover:text-blue-800 mt-4"
                  >
                    Add Item
                  </button>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
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
                    {editingDeliveryChalan ? 'Update Delivery Chalan' : 'Create Delivery Chalan'}
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
    </div>
  );
};

export default DeliveryChalans; 