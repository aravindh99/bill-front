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

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    gstin: '',
    pan: '',
    billingAddress: ''
  });

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone?.includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedVendors,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredVendors, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.city && <div className="text-sm text-gray-500">{row.city}</div>}
        </div>
      )
    },
    {
      key: 'contactName',
      header: 'Contact'
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'phone',
      header: 'Phone'
    },
    {
      key: 'city',
      header: 'City'
    },
    {
      key: 'gstin',
      header: 'GSTIN'
    }
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchVendors = async () => {
    try {
      const response = await axios.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch vendors'), getErrorType(error));
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
    console.log('Submitting vendor data:', formData);
    try {
      if (editingVendor) {
        const response = await axios.put(`/vendors/${editingVendor.id}`, formData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Vendor updated successfully!', 'success');
      } else {
        const response = await axios.post('/vendors', formData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Vendor created successfully!', 'success');
      }
      setShowModal(false);
      setEditingVendor(null);
      resetForm();
      fetchVendors();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving vendor:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save vendor'), getErrorType(error));
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      companyName: vendor.companyName,
      contactName: vendor.contactName || '',
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address || '',
      city: vendor.city || '',
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      billingAddress: vendor.billingAddress || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const vendor = vendors.find(v => v.id === id);
    const message = `Are you sure you want to delete the vendor "${vendor?.companyName}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Vendor',
      message,
      async () => {
        try {
          const response = await axios.delete(`/vendors/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Vendor deleted successfully!', 'success');
          fetchVendors();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting vendor:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting vendor');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Vendor',
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
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      gstin: '',
      pan: '',
      billingAddress: ''
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
      <PageHeader
        title="Vendors"
        subtitle="Manage your vendor relationships"
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
            Add Vendor
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by company name, contact, email, or phone..."
        label="Search Vendors"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="vendor"
      />

      {/* Vendors Table */}
      <DataTable
        columns={columns}
        data={paginatedVendors}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No vendors found"
        emptyIcon="🏢"
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
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingVendor(null);
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
                    <label className="form-label">Contact Person *</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      className="form-input"
                      required
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
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingVendor(null);
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
                    {editingVendor ? 'Update Vendor' : 'Create Vendor'}
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

export default Vendors; 