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

const CreditNotes = () => {
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCreditNote, setEditingCreditNote] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    creditNoteNo: '',
    invoiceId: '',
    creditNoteDate: new Date().toISOString().split('T')[0],
    reason: '',
    amount: '0.00',
    items: []
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter credit notes based on search term
  const filteredCreditNotes = creditNotes.filter(creditNote =>
    creditNote.creditNoteNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creditNote.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creditNote.invoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creditNote.amount?.toString().includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedCreditNotes,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredCreditNotes, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'creditNoteNo',
      header: 'Credit Note No',
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
      key: 'creditNoteDate',
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
    fetchCreditNotes();
    fetchClients();
    fetchInvoices();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

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
    const creditNote = creditNotes.find(cn => cn.id === id);
    const message = `Are you sure you want to delete the credit note "${creditNote?.creditNoteNo}"? This action cannot be undone.`;
    
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
          resetToFirstPage(); // Reset pagination after deletion
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

  const handlePrint = (creditNote) => {
    // Create a new window for printing
      const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
        <html>
          <head>
          <title>Credit Note - ${creditNote.creditNoteNo}</title>
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
            <h1>CREDIT NOTE</h1>
            <h2>${creditNote.creditNoteNo}</h2>
              </div>

          <div class="note-details">
            <p><strong>Credit Note Date:</strong> ${new Date(creditNote.creditNoteDate).toLocaleDateString()}</p>
            <p><strong>Invoice Reference:</strong> ${creditNote.invoice?.invoiceNo || 'N/A'}</p>
            <p><strong>Reason:</strong> ${creditNote.reason || 'N/A'}</p>
              </div>

          <div class="client-details">
            <h3>Client:</h3>
            <p><strong>${creditNote.invoice?.client?.companyName || 'N/A'}</strong></p>
            <p>${creditNote.invoice?.client?.address || 'N/A'}</p>
            <p>${creditNote.invoice?.client?.city || ''}, ${creditNote.invoice?.client?.state || ''} ${creditNote.invoice?.client?.pinCode || ''}</p>
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
              ${creditNote.items?.map(item => `
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
            <p><strong>Total Credit Amount:</strong> ₹${creditNote.amount || 0}</p>
              </div>
          
          <div class="footer">
            <p>This credit note reduces the amount due on invoice ${creditNote.invoice?.invoiceNo || 'N/A'}</p>
            </div>
          </body>
        </html>
    `);
      printWindow.document.close();
      printWindow.print();
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
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      console.error('Error saving credit note:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save credit note'), getErrorType(error));
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      creditNoteNo: '',
      invoiceId: '',
      creditNoteDate: new Date().toISOString().split('T')[0],
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

  const handleEdit = (creditNote) => {
    setEditingCreditNote(creditNote);
    setFormData({
      clientId: creditNote.clientId,
      creditNoteNo: creditNote.creditNoteNo,
      invoiceId: creditNote.invoiceId,
      creditNoteDate: creditNote.creditNoteDate,
      reason: creditNote.reason,
      amount: creditNote.amount,
      items: creditNote.items || []
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
        title="Credit Notes"
        subtitle="Manage your credit notes"
        actionButton={
          <ActionButton
          onClick={() => {
            setShowModal(true);
            setEditingCreditNote(null);
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
          Create Credit Note
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by credit note number, client, invoice, or amount..."
        label="Search Credit Notes"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="credit note"
      />

      {/* Credit Notes Table */}
      <DataTable
        columns={columns}
        data={paginatedCreditNotes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No credit notes found"
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
                      name="creditNoteDate"
                      value={formData.creditNoteDate}
                      onChange={(e) => setFormData({...formData, creditNoteDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credit Note No *</label>
                    <ReadOnlyDocumentNumber
                      value={formData.creditNoteNo}
                      prefix="CN"
                      length={6}
                      onValueChange={(value) => setFormData({...formData, creditNoteNo: value})}
                      disabled
                    />
                  </div>
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
                <div className="form-group">
                  <label className="form-label">Invoice</label>
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
                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingCreditNote(null);
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
                    {editingCreditNote ? 'Update Credit Note' : 'Create Credit Note'}
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

export default CreditNotes; 