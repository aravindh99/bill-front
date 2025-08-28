import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const DebitNotes = () => {
  const navigate = useNavigate();
  const [debitNotes, setDebitNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDebitNote, setEditingDebitNote] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    debitNoteNo: '',
    invoiceId: '',
    debitNoteDate: new Date().toISOString().split('T')[0],
    reason: '',
    amount: '0.00',
    items: []
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter debit notes based on search term
  const filteredDebitNotes = debitNotes.filter(debitNote =>
    debitNote.debitNoteNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debitNote.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debitNote.invoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debitNote.amount?.toString().includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedDebitNotes,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredDebitNotes, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'debitNoteNo',
      header: 'Debit Note No',
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
      key: 'debitNoteDate',
      header: 'Date',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => (
        <div className="text-sm font-medium text-gray-900">
          ₹{parseFloat(value || 0).toFixed(2)}
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchDebitNotes();
    fetchClients();
    fetchInvoices();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchDebitNotes = async () => {
    try {
      const response = await axios.get('/debit-notes');
      setDebitNotes(response.data);
    } catch (error) {
      console.error('Error fetching debit notes:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch debit notes'), getErrorType(error));
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
      const response = await axios.get('/profiles');
      if (response.data.length === 0) {
        setCompanyCodeMissing(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch company profile'), getErrorType(error));
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
    const debitNote = debitNotes.find(dn => dn.id === id);
    const message = `Are you sure you want to delete the debit note "${debitNote?.debitNoteNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Debit Note',
      message,
      async () => {
        try {
          console.log('Deleting debit note with ID:', id);
          const response = await axios.delete(`/debit-notes/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Debit note deleted successfully!', 'success');
          fetchDebitNotes();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting debit note:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting debit note');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Debit Note',
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

  const handlePrint = (debitNote) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Debit Note - ${debitNote.debitNoteNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .note-details { margin-bottom: 20px; }
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
            <h1>DEBIT NOTE</h1>
            <h2>${debitNote.debitNoteNo}</h2>
          </div>
          
          <div class="note-details">
            <p><strong>Debit Note Date:</strong> ${new Date(debitNote.debitNoteDate).toLocaleDateString()}</p>
            <p><strong>Invoice Reference:</strong> ${debitNote.invoice?.invoiceNo || 'N/A'}</p>
            <p><strong>Reason:</strong> ${debitNote.reason || 'N/A'}</p>
          </div>
          
          <div class="client-details">
            <h3>Client:</h3>
            <p><strong>${debitNote.invoice?.client?.companyName || 'N/A'}</strong></p>
            <p>${debitNote.invoice?.client?.address || 'N/A'}</p>
            <p>${debitNote.invoice?.client?.city || ''}, ${debitNote.invoice?.client?.state || ''} ${debitNote.invoice?.client?.pinCode || ''}</p>
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
              ${debitNote.items?.map(item => `
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
            <p><strong>Total Debit Amount:</strong> ₹${debitNote.amount || 0}</p>
          </div>
          
          <div class="footer">
            <p>This debit note increases the amount due on invoice ${debitNote.invoice?.invoiceNo || 'N/A'}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting debit note data:', formData);
    
    // Prepare the data with proper types
    const debitNoteData = {
      ...formData,
      clientId: parseInt(formData.clientId),
      amount: parseFloat(formData.amount)
    };
    
    try {
      if (editingDebitNote) {
        const response = await axios.put(`/debit-notes/${editingDebitNote.id}`, debitNoteData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Debit note updated successfully!', 'success');
      } else {
        const response = await axios.post('/debit-notes', debitNoteData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Debit note created successfully!', 'success');
      }
      setShowModal(false);
      setEditingDebitNote(null);
      resetForm();
      fetchDebitNotes();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving debit note:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save debit note'), getErrorType(error));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      debitNoteNo: '',
      invoiceId: '',
      debitNoteDate: new Date().toISOString().split('T')[0],
      reason: '',
      amount: '0.00',
      items: []
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const handleEdit = (debitNote) => {
    setEditingDebitNote(debitNote);
    setFormData({
      clientId: debitNote.clientId,
      debitNoteNo: debitNote.debitNoteNo,
      invoiceId: debitNote.invoiceId,
      debitNoteDate: debitNote.debitNoteDate,
      reason: debitNote.reason || '',
      amount: debitNote.amount,
      items: debitNote.items || []
    });
    setShowModal(true);
  };

  if (loading || profileLoading) {
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

  if (companyCodeMissing) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Profile Required</h2>
          <p className="text-lg text-gray-800 mb-4">
            The company profile (logo, name, address, etc.) is not configured. Please contact your administrator to set it up.
          </p>
          <ActionButton
            onClick={() => navigate('/profile')}
            variant="primary"
            size="md"
          >
            Go to Profile
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <PageHeader
        title="Debit Notes"
        subtitle="Manage your debit notes"
        actionButton={
          <ActionButton
            onClick={() => {
              setShowModal(true);
              setEditingDebitNote(null);
              resetForm();
            }}
            variant="primary"
            size="lg"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Create Debit Note
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by debit note number, client, invoice, or amount..."
        label="Search Debit Notes"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="debit note"
      />

      {/* Debit Notes Table */}
      <DataTable
        columns={columns}
        data={paginatedDebitNotes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No debit notes found"
        emptyIcon="💳"
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
                {editingDebitNote ? 'Edit Debit Note' : 'Create New Debit Note'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingDebitNote(null);
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
                    <label className="form-label">Debit Note Date *</label>
                    <input
                      type="date"
                      name="debitNoteDate"
                      value={formData.debitNoteDate}
                      onChange={(e) => setFormData({...formData, debitNoteDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Debit Note No *</label>
                    <ReadOnlyDocumentNumber
                      value={formData.debitNoteNo}
                      onEditClick={() => {
                        // This functionality is not yet implemented in the backend
                        // For now, we'll just show an alert
                        alert('Editing Debit Note No is not yet implemented.');
                      }}
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
                          {invoice.invoiceNo} - {invoice.client?.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="form-input"
                      rows="4"
                      placeholder="Enter detailed reason..."
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
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingDebitNote(null);
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
                    {editingDebitNote ? 'Update Debit Note' : 'Create Debit Note'}
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

export default DebitNotes; 