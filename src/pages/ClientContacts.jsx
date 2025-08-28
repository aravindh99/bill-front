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

const ClientContacts = () => {
  const [clientContacts, setClientContacts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    contactName: '',
    email: '',
    phone: '',
    designation: '',
    isPrimary: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter client contacts based on search term
  const filteredClientContacts = clientContacts.filter(contact =>
    contact.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    contact.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedClientContacts,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredClientContacts, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'client',
      header: 'Client',
      render: (value) => (
        <div className="text-sm font-medium text-gray-900">{value?.companyName || '-'}</div>
      )
    },
    {
      key: 'contactName',
      header: 'Contact Name',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'isPrimary',
      header: 'Primary Contact',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }
  ];

  useEffect(() => {
    fetchClientContacts();
    fetchClients();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchClientContacts = async () => {
    try {
      const response = await axios.get('/client-contacts');
      setClientContacts(response.data || []);
    } catch (error) {
      console.error('Error fetching client contacts:', error);
      setClientContacts([]); // Ensure clientContacts is always an array
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch client contacts'), getErrorType(error));
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

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await axios.delete(`/client-contacts/${id}`);
        fetchClientContacts();
        resetToFirstPage();
      } catch (error) {
        console.error('Error deleting contact:', error);
        showErrorModal('Error', getErrorMessage(error, 'Failed to delete contact'), getErrorType(error));
      }
    }
  };

  const handlePrint = (contact) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Client Contact - ${contact.contactName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .contact-details { margin-bottom: 20px; }
            .client-details { margin-bottom: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLIENT CONTACT</h1>
            <h2>${contact.contactName}</h2>
          </div>
          
          <div class="contact-details">
            <p><strong>Contact Name:</strong> ${contact.contactName}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Phone:</strong> ${contact.phone}</p>
            <p><strong>Designation:</strong> ${contact.designation || 'N/A'}</p>
            <p><strong>Primary Contact:</strong> ${contact.isPrimary ? 'Yes' : 'No'}</p>
          </div>
          
          <div class="client-details">
            <h3>Client Company:</h3>
            <p><strong>${contact.client?.companyName || 'N/A'}</strong></p>
            <p>${contact.client?.address || 'N/A'}</p>
            <p>${contact.client?.city || ''}, ${contact.client?.state || ''} ${contact.client?.pinCode || ''}</p>
          </div>
          
          <div class="footer">
            <p>This is a client contact information document</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting contact data:', formData);
    try {
      if (editingContact) {
        const response = await axios.put(`/client-contacts/${editingContact.id}`, formData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Contact updated successfully!', 'success');
      } else {
        const response = await axios.post('/client-contacts', formData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Contact created successfully!', 'success');
      }
      setShowModal(false);
      setEditingContact(null);
      resetForm();
      fetchClientContacts();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving contact:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save contact'), getErrorType(error));
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      clientId: contact.clientId.toString(),
      contactName: contact.contactName,
      email: contact.email,
      phone: contact.phone,
      designation: contact.designation,
      isPrimary: contact.isPrimary
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      contactName: '',
      email: '',
      phone: '',
      designation: '',
      isPrimary: false
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
        title="Client Contacts"
        subtitle="Manage your client contacts"
        actionButton={
          <ActionButton
            onClick={() => {
              console.log('Opening modal for new contact');
              setShowModal(true);
            }}
            variant="primary"
            size="lg"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Contact
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by contact name, client, email, phone, or designation..."
        label="Search Client Contacts"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="client contact"
      />

      {/* Client Contacts Table */}
      <DataTable
        columns={columns}
        data={paginatedClientContacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No client contacts found"
        emptyIcon="📞"
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
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingContact(null);
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
                    <label className="form-label">Contact Name *</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      className="form-input"
                      placeholder="Contact person name"
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
                      placeholder="Email address"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="form-input"
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      className="form-input"
                      placeholder="Job title or designation"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Contact</label>
                    <input
                      type="checkbox"
                      name="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})}
                      className="form-checkbox"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => setShowModal(false)}
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
                    {editingContact ? 'Update Contact' : 'Create Contact'}
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

export default ClientContacts; 