import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const CreditNotes = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchCreditNotes();
    fetchClients();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      const response = await axios.get('/credit-notes');
      setCreditNotes(response.data);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch credit notes'), getErrorType(error));
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
    const creditNote = creditNotes.find(cn => cn.id === id);
    const message = `Are you sure you want to delete the credit note "${creditNote?.docNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Credit Note',
      message,
      async () => {
        try {
          console.log('Deleting credit note with ID:', id);
          const response = await axios.delete(`/credit-notes/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Credit note deleted successfully!', 'success');
          fetchCreditNotes();
        } catch (error) {
          console.error('Error deleting credit note:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting credit note');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Credit Note',
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
    console.log('Submitting credit note data:', formData);
    
    // Prepare the data with proper types
    const creditNoteData = {
      ...formData,
      clientId: parseInt(formData.clientId),
      amount: parseFloat(formData.amount)
    };
    
    try {
      const response = await axios.post('/credit-notes', creditNoteData);
      console.log('Create response:', response.data);
      showErrorModal('Success', 'Credit note created successfully!', 'success');
      setShowModal(false);
      resetForm();
      fetchCreditNotes();
    } catch (error) {
      console.error('Error saving credit note:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save credit note'), getErrorType(error));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      issueDate: new Date().toISOString().split('T')[0],
      amount: '',
      description: ''
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Credit Notes</h1>
          <p className="text-gray-600">Manage your credit notes</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new credit note');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Create Credit Note
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          {creditNotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Credit Note #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.map((creditNote) => (
                    <tr key={creditNote.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{creditNote.docNo}</td>
                      <td className="py-3 px-4">{creditNote.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(creditNote.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-green-600">
                        {formatCurrency(creditNote.amount)}
                      </td>
                      <td className="py-3 px-4">{creditNote.description || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">👁️</button>
                          <button className="text-green-600 hover:text-green-800">📄</button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for credit note ID:', creditNote.id);
                              handleDelete(creditNote.id);
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
              <span className="text-4xl mb-4 block">📝</span>
              <p>No credit notes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => console.log('Modal overlay clicked')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Credit Note</h3>
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
                    <label className="form-label">Credit Note Date *</label>
                    <input
                      type="date"
                      name="issueDate"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-input"
                    rows="4"
                    placeholder="Enter detailed description..."
                  />
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
                    Create Credit Note
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

export default CreditNotes; 