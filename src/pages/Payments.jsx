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
import ReadOnlyDocumentNumber from '../components/ReadOnlyDocumentNumber';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    transactionId: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment =>
    payment.invoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoice?.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount?.toString().includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedPayments,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredPayments, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (value) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value?.invoiceNo || '-'}</div>
          {value?.client?.companyName && <div className="text-xs text-gray-500">{value.client.companyName}</div>}
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => (
        <div className="text-sm font-medium text-green-600">
          ₹{parseFloat(value || 0).toFixed(2)}
        </div>
      )
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      render: (value) => (
        <div className="text-sm text-gray-900 font-mono">{value || '-'}</div>
      )
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (value) => (
        <div className="text-sm text-gray-900 max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
    fetchClients();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/payments');
      setPayments(response.data);
    } catch (_error) {
      console.error('Error fetching payments:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch payments'), getErrorType(_error));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (_error) {
      console.error('Error fetching invoices:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch invoices'), getErrorType(_error));
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (_error) {
      console.error('Error fetching clients:', _error);
      showErrorModal('Error', getErrorMessage(_error, 'Failed to fetch clients'), getErrorType(_error));
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await axios.get('/profiles');
      if (response.data.length > 0) {
        setCompanyCodeMissing(!response.data[0].companyCode);
      } else {
        setCompanyCodeMissing(true);
      }
    } catch (_error) {
      console.error('Error fetching profile:', _error);
      setCompanyCodeMissing(true);
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
    const payment = payments.find(p => p.id === id);
    const message = `Are you sure you want to delete the payment for invoice "${payment?.invoice?.invoiceNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Payment',
      message,
      async () => {
        try {
          console.log('Deleting payment with ID:', id);
          const _response = await axios.delete(`/payments/${id}`);
          console.log('Delete response:', _response.data);
          showErrorModal('Success', 'Payment deleted successfully!', 'success');
          fetchPayments();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting payment:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting payment');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Payment',
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
   const handlePrintPayment = (payment) => {
    // Create a new window for printing
        const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
          <html>
            <head>
          <title>Payment Receipt - ${payment.paymentNo}</title>
              <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .payment-details { margin-bottom: 20px; }
            .client-details { margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            .totals { text-align: right; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PAYMENT RECEIPT</h1>
            <h2>${payment.paymentNo}</h2>
          </div>
          
          <div class="payment-details">
            <p><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod || 'N/A'}</p>
            <p><strong>Reference Number:</strong> ${payment.referenceNumber || 'N/A'}</p>
                </div>
  
          <div class="client-details">
            <h3>Client:</h3>
            <p><strong>${payment.client?.companyName || 'N/A'}</strong></p>
            <p>${payment.client?.address || 'N/A'}</p>
            <p>${payment.client?.city || ''}, ${payment.client?.state || ''} ${payment.client?.pinCode || ''}</p>
                  </div>
          
          <div class="invoice-details">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${payment.invoice?.invoiceNo || 'N/A'}</p>
            <p><strong>Invoice Date:</strong> ${payment.invoice?.invoiceDate ? new Date(payment.invoice.invoiceDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Invoice Amount:</strong> ₹${payment.invoice?.amount || 0}</p>
                </div>
  
          <div class="totals">
            <p><strong>Payment Amount:</strong> ₹${payment.amount || 0}</p>
            <p><strong>Remaining Balance:</strong> ₹${payment.invoice?.balance || 0}</p>
                </div>
  
          <div class="footer">
            <p>Thank you for your payment!</p>
              </div>
            </body>
          </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (companyCodeMissing) return;
    if (formData.amount === '') {
      showErrorModal('Error', 'Payment amount cannot be empty', 'error');
      return;
    }
    // Prepare the data with proper types, do NOT include paymentId
    const { invoiceId, amount, paymentDate, paymentMethod, transactionId, notes } = formData;
    const paymentData = {
      invoiceId: parseInt(invoiceId),
      amount: parseFloat(amount), // Ensure amount is number
      paymentDate,
      paymentMethod,
      transactionId,
      notes: notes || ''
    };
    try {
      if (editingPayment) {
        const _response = await axios.put(`/payments/${editingPayment.id}`, paymentData);
        showErrorModal('Success', 'Payment updated successfully!', 'success');
      } else {
        const _response = await axios.post('/payments', paymentData);
        showErrorModal('Success', 'Payment created successfully!', 'success');
      }
      setShowModal(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      showErrorModal('Error', getErrorMessage(error, 'Failed to save payment'), getErrorType(error));
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      invoiceId: payment.invoiceId.toString(),
      amount: payment.amount?.toString() || '',
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod || '',
      transactionId: payment.transactionId || '',
      notes: payment.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      invoiceId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      transactionId: '',
      notes: ''
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
      {/* Header */}
      <PageHeader
        title="Payments"
        subtitle="Manage your payment receipts"
        actionButton={
          <ActionButton
          onClick={() => {
            setShowModal(true);
              setEditingPayment(null);
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
            Create Payment
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by invoice, client, payment method, or transaction ID..."
        label="Search Payments"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="payment"
      />

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={paginatedPayments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrintPayment}
        emptyMessage="No payments found"
        emptyIcon="💰"
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
                {editingPayment ? 'Edit Payment' : 'Create New Payment'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingPayment(null);
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
                          {invoice.invoiceNo} - {invoice.client?.companyName || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="form-input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Date *</label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method *</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Transaction ID</label>
                    <input
                      type="text"
                      name="transactionId"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                      className="form-input"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                  className="form-input"
                      rows="3"
                      placeholder="Additional notes for the payment"
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
                    disabled={companyCodeMissing || profileLoading}
                  >
                    {editingPayment ? 'Update Payment' : 'Create Payment'}
                  </ActionButton>
                </div>
                {companyCodeMissing && !profileLoading && (
                  <div className="text-red-600 text-sm mt-2">
                    Please set your <b>Company Code</b> in the <a href="/profile" className="underline">profile</a> before creating payments.
                  </div>
                )}
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

export default Payments; 