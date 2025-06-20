import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const PerforaInvoices = () => {
  const [performaInvoices, setPerformaInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subject: '',
    terms: ''
  });

  useEffect(() => {
    fetchPerformaInvoices();
    fetchClients();
  }, []);

  const fetchPerformaInvoices = async () => {
    try {
      const response = await axios.get('/proformas');
      setPerformaInvoices(response.data);
    } catch (error) {
      console.error('Error fetching performa invoices:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch performa invoices'), getErrorType(error));
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this performa invoice?')) {
      try {
        console.log('Deleting performa invoice with ID:', id);
        const response = await axios.delete(`/proformas/${id}`);
        console.log('Delete response:', response.data);
        showErrorModal('Success', 'Performa invoice deleted successfully!', 'success');
        fetchPerformaInvoices();
      } catch (error) {
        console.error('Error deleting performa invoice:', error);
        console.error('Error response:', error.response?.data);
        
        let message = getErrorMessage(error, 'Error deleting performa invoice');
        
        // If there are related records, show them in the modal
        if (error.response?.data?.relatedRecords) {
          const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
          showErrorModal(
            'Cannot Delete Performa Invoice',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting performa invoice data:', formData);
    try {
      const response = await axios.post('/proformas', formData);
      console.log('Create response:', response.data);
      showErrorModal('Success', 'Performa invoice created successfully!', 'success');
      setShowModal(false);
      resetForm();
      fetchPerformaInvoices();
    } catch (error) {
      console.error('Error saving performa invoice:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save performa invoice'), getErrorType(error));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subject: '',
      terms: ''
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
          <h1 className="text-3xl font-bold text-gray-900">Perfora Invoices</h1>
          <p className="text-gray-600">Manage your perfora invoices</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new perfora invoice');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Create Perfora Invoice
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          {performaInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performaInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invoice.invoiceNo}</td>
                      <td className="py-3 px-4">{invoice.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">👁️</button>
                          <button className="text-green-600 hover:text-green-800">📄</button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for performa invoice ID:', invoice.id);
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
              <span className="text-4xl mb-4 block">📄</span>
              <p>No perfora invoices found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => console.log('Modal overlay clicked')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Perfora Invoice</h3>
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
                    <label className="form-label">Invoice Date *</label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="form-input"
                      placeholder="Invoice subject"
                    />
                  </div>
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Terms</label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    className="form-input"
                    rows="4"
                    placeholder="Enter invoice terms..."
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
                    Create Perfora Invoice
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
    </div>
  );
};

export default PerforaInvoices; 