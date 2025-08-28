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

const VendorContacts = () => {
  const [vendorContacts, setVendorContacts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    vendorId: '',
    contactName: '',
    email: '',
    phone: '',
    designation: '',
    isPrimary: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter vendor contacts based on search term
  const filteredVendorContacts = vendorContacts.filter(contact =>
    contact.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    contact.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.vendor?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedVendorContacts,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredVendorContacts, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'vendor',
      header: 'Vendor',
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
    fetchVendorContacts();
    fetchVendors();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchVendorContacts = async () => {
    try {
      const response = await axios.get('/vendor-contacts');
      console.log('Vendor contacts response:', response.data);
      // Ensure we always set an array
      const contactsData = Array.isArray(response.data) ? response.data : [];
      setVendorContacts(contactsData);
    } catch (error) {
      console.error('Error fetching vendor contacts:', error);
      setVendorContacts([]); // Ensure contacts is always an array
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch vendor contacts'), getErrorType(error));
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

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleDelete = async (id) => {
    const contact = vendorContacts.find(c => c.id === id);
    const message = `Are you sure you want to delete the contact "${contact?.contactName}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Vendor Contact',
      message,
      async () => {
        try {
          console.log('Deleting vendor contact with ID:', id);
          const response = await axios.delete(`/vendor-contacts/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Vendor contact deleted successfully!', 'success');
          fetchVendorContacts();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting vendor contact:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting vendor contact');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Vendor Contact',
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

  const handlePrint = (contact) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vendor Contact - ${contact.contactName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .contact-details { margin-bottom: 20px; }
            .vendor-details { margin-bottom: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VENDOR CONTACT</h1>
            <h2>${contact.contactName}</h2>
          </div>
          
          <div class="contact-details">
            <p><strong>Contact Name:</strong> ${contact.contactName}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Phone:</strong> ${contact.phone}</p>
            <p><strong>Designation:</strong> ${contact.designation || 'N/A'}</p>
            <p><strong>Primary Contact:</strong> ${contact.isPrimary ? 'Yes' : 'No'}</p>
          </div>
          
          <div class="vendor-details">
            <h3>Vendor Company:</h3>
            <p><strong>${contact.vendor?.companyName || 'N/A'}</strong></p>
            <p>${contact.vendor?.address || 'N/A'}</p>
            <p>${contact.vendor?.city || ''}, ${contact.vendor?.state || ''} ${contact.vendor?.pinCode || ''}</p>
          </div>
          
          <div class="footer">
            <p>This is a vendor contact information document</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting vendor contact data:', formData);
    try {
      if (editingContact) {
        const response = await axios.put(`/vendor-contacts/${editingContact.id}`, formData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Vendor contact updated successfully!', 'success');
      } else {
        const response = await axios.post('/vendor-contacts', formData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Vendor contact created successfully!', 'success');
      }
      setShowModal(false);
      setEditingContact(null);
      resetForm();
      fetchVendorContacts();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving vendor contact:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save vendor contact'), getErrorType(error));
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      vendorId: contact.vendorId.toString(),
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
      vendorId: '',
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
        title="Vendor Contacts"
        subtitle="Manage your vendor contacts"
        actionButton={
          <ActionButton
            onClick={() => {
              console.log('Opening modal for new vendor contact');
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
        placeholder="Search by contact name, vendor, email, phone, or designation..."
        label="Search Vendor Contacts"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="vendor contact"
      />

      {/* Vendor Contacts Table */}
      <DataTable
        columns={columns}
        data={paginatedVendorContacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No vendor contacts found"
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
                {editingContact ? 'Edit Vendor Contact' : 'Add New Vendor Contact'}
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
                      placeholder="Contact designation"
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

export default VendorContacts; 