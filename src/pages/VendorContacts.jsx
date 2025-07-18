import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const VendorContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    vendorId: '',
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchContacts();
    fetchVendors();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/vendor-contacts');
      console.log('Vendor contacts response:', response.data);
      // Ensure we always set an array
      const contactsData = Array.isArray(response.data) ? response.data : [];
      setContacts(contactsData);
    } catch (error) {
      console.error('Error fetching vendor contacts:', error);
      setContacts([]); // Ensure contacts is always an array
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
    const contact = contacts.find(c => c.id === id);
    const message = `Are you sure you want to delete the contact "${contact?.name}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Vendor Contact',
      message,
      async () => {
        try {
          console.log('Deleting vendor contact with ID:', id);
          const response = await axios.delete(`/vendor-contacts/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Vendor contact deleted successfully!', 'success');
          fetchContacts();
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
      fetchContacts();
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
      name: contact.name,
      phone: contact.phone,
      email: contact.email
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      vendorId: '',
      name: '',
      phone: '',
      email: ''
    });
  };

  const filteredContacts = (() => {
    // Ensure contacts is always an array
    const contactsArray = Array.isArray(contacts) ? contacts : [];
    console.log('Contacts state:', contacts);
    console.log('Contacts type:', typeof contacts);
    console.log('ContactsArray:', contactsArray);
    return contactsArray.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.vendor?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
    );
  })();

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
          <h1 className="text-3xl font-bold text-gray-900">Vendor Contacts</h1>
          <p className="text-gray-600">Manage your vendor contacts</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new vendor contact');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Add Contact
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full md:w-1/3"
        />
      </div>

      <div className="card">
        <div className="card-content">
          {filteredContacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Contact Name</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Vendor</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Phone</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Email</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{contact.name}</td>
                      <td className="py-3 px-4">{contact.vendor?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4">{contact.phone}</td>
                      <td className="py-3 px-4">{contact.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(contact)}
                          >
                            ✏️
                          </button>
                          <button className="text-green-600 hover:text-green-800">📄</button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for vendor contact ID:', contact.id);
                              handleDelete(contact.id);
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
              <span className="text-4xl mb-4 block">🏢</span>
              <p>No vendor contacts found</p>
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
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="form-input"
                      placeholder="Contact person name"
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
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingContact ? 'Update' : 'Add'} Contact
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