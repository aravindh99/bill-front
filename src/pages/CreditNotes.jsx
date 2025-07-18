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
  const [editingCreditNote, setEditingCreditNote] = useState(null);
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

  const handlePrintCreditNote = async (creditNoteId) => {
    try {
      console.log('Attempting to print Credit Note...', creditNoteId);
      const creditNoteResponse = await axios.get(`/credit-notes/${creditNoteId}`);
      const creditNote = creditNoteResponse.data;

      const profileResponse = await axios.get('/profiles'); // Fetch company profile
      const companyProfile = profileResponse.data.length > 0 ? profileResponse.data[0] : {};

      if (!creditNote) {
        showErrorModal('Error', 'Credit Note not found for printing', 'error');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showErrorModal('Error', 'Please allow pop-ups for printing', 'error');
        return;
      }

      const creditNoteHtml = `
        <html>
          <head>
            <title>Credit Note #${creditNote.docNo}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
              .note-page { width: 210mm; min-height: 297mm; margin: 10mm auto; border: 1px solid #eee; background: #fff; padding: 20mm; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .company-info h1 { margin: 0; font-size: 28px; color: #333; }
              .company-info p { margin: 2px 0; font-size: 14px; color: #555; }
              .note-title { font-size: 40px; font-weight: bold; color: #333; margin-top: 0; }
              .note-meta { margin-top: 10px; text-align: right; font-size: 14px; }
              .note-meta div { margin-bottom: 5px; }

              .details-section { margin-bottom: 30px; border: 1px solid #eee; padding: 15px; }
              .details-section h3 { margin-top: 0; font-size: 16px; color: #333; margin-bottom: 10px; }
              .details-section p { margin: 2px 0; font-size: 14px; color: #555; }

              .amount-section { text-align: right; margin-bottom: 30px; }
              .amount-box { display: inline-block; border: 1px solid #eee; padding: 15px; background-color: #f9f9f9; }
              .amount-box strong { font-size: 24px; color: #333; }

              .description-section { font-size: 14px; color: #555; margin-bottom: 30px; }

              .footer-section { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
              @media print {
                .note-page { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="note-page">
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
                  <h2 class="note-title">CREDIT NOTE</h2>
                  <div class="note-meta">
                    <div><strong>Credit Note No:</strong> ${creditNote.docNo || 'N/A'}</div>
                    <div><strong>Issue Date:</strong> ${new Date(creditNote.issueDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <h3>Client Details:</h3>
                <p><strong>Company Name:</strong> ${creditNote.client?.companyName || 'N/A'}</p>
                <p><strong>Address:</strong> ${creditNote.client?.billingAddress || 'N/A'}, ${creditNote.client?.city || 'N/A'}, ${creditNote.client?.state || 'N/A'} ${creditNote.client?.pinCode || 'N/A'}</p>
                <p><strong>Email:</strong> ${creditNote.client?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${creditNote.client?.phone || 'N/A'}</p>
              </div>

              <div class="amount-section">
                <div class="amount-box">
                  Total Credit: <strong>${formatCurrency(creditNote.amount)}</strong>
                </div>
              </div>

              ${creditNote.description ? `<div class="description-section">
                <strong>Description:</strong>
                <p>${creditNote.description}</p>
              </div>` : ''}

              <div class="footer-section">
                <p>${companyProfile.companyName || 'Your Company Name'} | ${companyProfile.address || 'Your Company Address'}</p>
                <p>Email: ${companyProfile.email || 'N/A'} | Phone: ${companyProfile.phone || 'N/A'} | Website: ${companyProfile.website || 'N/A'}</p>
                ${companyProfile.bankDetails && companyProfile.bankDetails.length > 0 ? `
                  <p>Bank: ${companyProfile.bankDetails[0].bankName} | A/C No: ${companyProfile.bankDetails[0].accountNumber} | IFSC: ${companyProfile.bankDetails[0].ifscCode}</p>
                ` : ''}
                <p>Thank you!</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(creditNoteHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

    } catch (error) {
      console.error('Error printing Credit Note:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to print Credit Note'), getErrorType(error));
    }
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
      if (editingCreditNote) {
        const response = await axios.put(`/credit-notes/${editingCreditNote.id}`, creditNoteData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Credit note updated successfully!', 'success');
      } else {
        const response = await axios.post('/credit-notes', creditNoteData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Credit note created successfully!', 'success');
      }
      setShowModal(false);
      setEditingCreditNote(null);
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

  const handleEdit = (creditNote) => {
    setEditingCreditNote(creditNote);
    setFormData({
      clientId: creditNote.clientId,
      issueDate: creditNote.issueDate,
      amount: creditNote.amount,
      description: creditNote.description || ''
    });
    setShowModal(true);
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
            setEditingCreditNote(null);
            resetForm();
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
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Credit Note #</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Client</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Amount</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Description</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
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
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(creditNote);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePrintCreditNote(creditNote.id);
                            }}
                            type="button"
                            title="Print Credit Note"
                            aria-label="Print Credit Note"
                          >
                            📄
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
              <span className="text-4xl mb-4 block"></span>
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
              <h3 className="modal-title">
                {editingCreditNote ? 'Edit Credit Note' : 'Create New Credit Note'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingCreditNote(null);
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
                      setEditingCreditNote(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCreditNote ? 'Update Credit Note' : 'Create Credit Note'}
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