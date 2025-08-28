import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';
import ActionButton from '../components/ActionButton';
import DataTable from '../components/DataTable'; // Added import for DataTable

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    gstTreatment: '',
    gstin: '',
    pan: '',
    tin: '',
    vat: '',
    website: '',
    billingAddress: '',
    city: '',
    openingBalance: '0.00',
    isVendor: false
  });

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedClients,
    totalItems,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredClients, 25);

  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (value, client) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{client.companyName}</div>
          {client.city && <div className="text-sm text-gray-500">{client.city}</div>}
        </div>
      )
    },
    {
      key: 'contactName',
      header: 'Contact',
      render: (value) => value || '-'
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => value || '-'
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => value || '-'
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      render: (value) => value || '-'
    },
    {
      key: 'openingBalance',
      header: 'Opening Balance',
      render: (value) => `₹${parseFloat(value || 0).toFixed(2)}`
    }
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch clients'), getErrorType(error));
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
    console.log('Submitting form data:', formData);
    try {
      if (editingClient) {
        const response = await axios.put(`/clients/${editingClient.id}`, formData);
        console.log('Update response:', response.data);
        showErrorModal('Success', response.data.message || 'Client updated successfully!', 'success');
      } else {
        const response = await axios.post('/clients', formData);
        console.log('Create response:', response.data);
        showErrorModal('Success', response.data.message || 'Client created successfully!', 'success');
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving client:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save client'), getErrorType(error));
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      contactName: client.contactName,
      phone: client.phone,
      email: client.email,
      gstTreatment: client.gstTreatment || '',
      gstin: client.gstin || '',
      pan: client.pan || '',
      tin: client.tin || '',
      vat: client.vat || '',
      website: client.website || '',
      billingAddress: client.billingAddress || '',
      city: client.city || '',
      openingBalance: client.openingBalance?.toString() || '0',
      isVendor: client.isVendor || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const client = clients.find(c => c.id === id);
    const message = `Are you sure you want to delete the client "${client?.companyName}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Client',
      message,
      async () => {
        try {
          console.log('Deleting client with ID:', id);
          const response = await axios.delete(`/clients/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Client deleted successfully!', 'success');
          fetchClients();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting client:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting client');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Client',
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

  const handlePrint = (client) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Client - ${client.companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .client-details { margin-bottom: 20px; }
            .address-details { margin-bottom: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLIENT DETAILS</h1>
            <h2>${client.companyName}</h2>
          </div>
          
          <div class="client-details">
            <p><strong>Company Name:</strong> ${client.companyName}</p>
            <p><strong>Contact Person:</strong> ${client.contactPerson || 'N/A'}</p>
            <p><strong>Email:</strong> ${client.email}</p>
            <p><strong>Phone:</strong> ${client.phone}</p>
            <p><strong>Website:</strong> ${client.website || 'N/A'}</p>
            <p><strong>GSTIN:</strong> ${client.gstin || 'N/A'}</p>
          </div>
          
          <div class="address-details">
            <h3>Billing Address:</h3>
            <p>${client.billingAddress || 'N/A'}</p>
            <p>${client.city || ''}, ${client.state || ''} ${client.pinCode || ''}</p>
            <p>${client.country || 'India'}</p>
          </div>
          
          <div class="footer">
            <p>This is a client information document</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      gstTreatment: '',
      gstin: '',
      pan: '',
      tin: '',
      vat: '',
      website: '',
      billingAddress: '',
      city: '',
      openingBalance: '0.00',
      isVendor: false
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your client relationships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Clients
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by company name, contact, email, or phone..."
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
            Found {totalItems} client{totalItems !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <DataTable
        columns={columns}
        data={paginatedClients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No clients found"
        emptyIcon="👥"
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
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingClient(null);
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
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN</label>
                    <input
                      type="text"
                      name="pan"
                      value={formData.pan}
                      onChange={(e) => setFormData({...formData, pan: e.target.value})}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Billing Address</label>
                  <textarea
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVendor}
                      onChange={(e) => setFormData({...formData, isVendor: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="font-medium">Is also a Vendor</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    (Will create vendor record automatically)
                  </span>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingClient(null);
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
                    {editingClient ? 'Update Client' : 'Create Client'}
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

export default Clients; 