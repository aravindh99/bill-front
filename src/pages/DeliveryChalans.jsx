import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModernModal from '../components/ModernModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatRelatedRecords, getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const DeliveryChalans = () => {
  const [chalans, setChalans] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChalan, setEditingChalan] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceId: '',
    chalanDate: new Date().toISOString().split('T')[0],
    docNo: '',
    notes: ''
  });

  useEffect(() => {
    fetchChalans();
    fetchClients();
    fetchInvoices();
  }, []);

  const fetchChalans = async () => {
    try {
      const response = await axios.get('/delivery-chalans');
      setChalans(response.data);
    } catch (error) {
      console.error('Error fetching chalans:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch chalans'), getErrorType(error));
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
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleDelete = async (id) => {
    const chalan = chalans.find(c => c.id === id);
    const message = `Are you sure you want to delete the delivery chalan "${chalan?.docNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Delivery Chalan',
      message,
      async () => {
        try {
          console.log('Deleting chalan with ID:', id);
          const response = await axios.delete(`/delivery-chalans/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Delivery chalan deleted successfully!', 'success');
          fetchChalans();
        } catch (error) {
          console.error('Error deleting chalan:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting chalan');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Chalan',
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

  const handlePrintDeliveryChalan = async (chalanId) => {
    try {
      console.log('Attempting to print Delivery Chalan...', chalanId);
      const chalanResponse = await axios.get(`/delivery-chalans/${chalanId}`);
      const chalan = chalanResponse.data;

      const profileResponse = await axios.get('/profiles'); // Fetch company profile
      const companyProfile = profileResponse.data.length > 0 ? profileResponse.data[0] : {};

      if (!chalan) {
        showErrorModal('Error', 'Delivery Chalan not found for printing', 'error');
        return;
      }

      // Assuming items are part of the chalan or can be fetched based on invoiceId if available
      // For now, if chalan doesn't have an items array directly, we'll use an empty one.
      // If items need to be fetched via invoiceId, that logic would go here.
      const chalanItems = chalan.invoice?.items || []; // Link to invoice items if associated

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showErrorModal('Error', 'Please allow pop-ups for printing', 'error');
        return;
      }

      // Format currency helper (assuming it's available globally or imported/defined elsewhere)
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(amount || 0);
      };

      const deliveryChalanHtml = `
        <html>
          <head>
            <title>Delivery Chalan #${chalan.docNo}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
              .chalan-page { width: 210mm; min-height: 297mm; margin: 10mm auto; border: 1px solid #eee; background: #fff; padding: 20mm; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .company-info h1 { margin: 0; font-size: 28px; color: #333; }
              .company-info p { margin: 2px 0; font-size: 14px; color: #555; }
              .chalan-title { font-size: 40px; font-weight: bold; color: #333; margin-top: 0; }
              .chalan-meta { margin-top: 10px; text-align: right; font-size: 14px; }
              .chalan-meta div { margin-bottom: 5px; }

              .address-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .address-box { border: 1px solid #eee; padding: 15px; width: 48%; }
              .address-box h3 { margin-top: 0; font-size: 16px; color: #333; }
              .address-box p { margin: 2px 0; font-size: 14px; color: #555; }

              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .item-table th, .item-table td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 14px; }
              .item-table th { background-color: #f9f9f9; font-weight: bold; color: #333; }

              .notes-section { font-size: 13px; color: #555; margin-bottom: 30px; }
              .footer-section { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
              @media print {
                .chalan-page { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="chalan-page">
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
                  <h2 class="chalan-title">DELIVERY CHALAN</h2>
                  <div class="chalan-meta">
                    <div><strong>Chalan No:</strong> ${chalan.docNo}</div>
                    <div><strong>Chalan Date:</strong> ${new Date(chalan.chalanDate).toLocaleDateString()}</div>
                    ${chalan.invoice ? `<div><strong>Invoice No:</strong> ${chalan.invoice.invoiceNo}</div>` : ''}
                  </div>
                </div>
              </div>

              <div class="address-section">
                <div class="address-box">
                  <h3>Deliver To:</h3>
                  <p><strong>${chalan.client?.companyName || 'Client Name'}</strong></p>
                  <p>${chalan.client?.shippingAddress || 'Client Address'}</p>
                  <p>${chalan.client?.city || 'City'}, ${chalan.client?.state || 'State'} ${chalan.client?.pinCode || 'PIN'}</p>
                  <p>Email: ${chalan.client?.email || 'N/A'}</p>
                  <p>Phone: ${chalan.client?.phone || 'N/A'}</p>
                </div>
                <div class="address-box">
                  <h3>Bill To:</h3>
                  <p><strong>${chalan.client?.companyName || 'Client Name'}</strong></p>
                  <p>${chalan.client?.billingAddress || 'Client Address'}</p>
                  <p>${chalan.client?.city || 'City'}, ${chalan.client?.state || 'State'} ${chalan.client?.pinCode || 'PIN'}</p>
                </div>
              </div>

              <table class="item-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item & Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  ${(chalanItems || []).map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>
                        <strong>${item.name || 'N/A'}</strong><br/>
                        <span style="font-size: 12px; color: #777;">${item.description || ''}</span>
                      </td>
                      <td>${item.quantity}</td>
                      <td>${item.unit}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              ${chalan.notes ? `<div class="notes-section">
                <strong>Notes:</strong>
                <p>${chalan.notes}</p>
              </div>` : ''}

              <div class="footer-section">
                <p>${companyProfile.companyName || 'Your Company Name'} | ${companyProfile.address || 'Your Company Address'}</p>
                <p>Email: ${companyProfile.email || 'N/A'} | Phone: ${companyProfile.phone || 'N/A'} | Website: ${companyProfile.website || 'N/A'}</p>
                ${companyProfile.bankDetails && companyProfile.bankDetails.length > 0 ? `
                  <p>Bank: ${companyProfile.bankDetails[0].bankName} | A/C No: ${companyProfile.bankDetails[0].accountNumber} | IFSC: ${companyProfile.bankDetails[0].ifscCode}</p>
                ` : ''}
                <p>Thank you for your business!</p>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(deliveryChalanHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

    } catch (error) {
      console.error('Error printing Delivery Chalan:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to print Delivery Chalan'), getErrorType(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting chalan data:', formData);
    
    // Prepare the data with proper types
    const chalanData = {
      ...formData,
      clientId: parseInt(formData.clientId),
      invoiceId: formData.invoiceId ? parseInt(formData.invoiceId) : null
    };
    
    try {
      if (editingChalan) {
        const response = await axios.put(`/delivery-chalans/${editingChalan.id}`, chalanData);
        console.log('Update response:', response.data);
        showErrorModal('Success', 'Delivery chalan updated successfully!', 'success');
      } else {
        const response = await axios.post('/delivery-chalans', chalanData);
        console.log('Create response:', response.data);
        showErrorModal('Success', 'Delivery chalan created successfully!', 'success');
      }
      setShowModal(false);
      setEditingChalan(null);
      resetForm();
      fetchChalans();
    } catch (error) {
      console.error('Error saving chalan:', error);
      console.error('Error response:', error.response?.data);
      showErrorModal('Error', getErrorMessage(error, 'Failed to save chalan'), getErrorType(error));
    }
  };

  const handleEdit = (chalan) => {
    setEditingChalan(chalan);
    setFormData({
      clientId: chalan.clientId.toString(),
      invoiceId: chalan.invoiceId?.toString() || '',
      chalanDate: new Date(chalan.chalanDate).toISOString().split('T')[0],
      docNo: chalan.docNo,
      notes: chalan.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      invoiceId: '',
      chalanDate: new Date().toISOString().split('T')[0],
      docNo: '',
      notes: ''
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Chalans</h1>
          <p className="text-gray-600">Manage your delivery chalans</p>
        </div>
        <button 
          onClick={() => {
            console.log('Opening modal for new chalan');
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <span className="mr-2">➕</span>
          Create Chalan
        </button>
      </div>

      <div className="card">
        <div className="card-content">
          {chalans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Chalan #</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Client</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Invoice</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Notes</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chalans.map((chalan) => (
                    <tr key={chalan.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{chalan.docNo}</td>
                      <td className="py-3 px-4">{chalan.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(chalan.chalanDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {chalan.invoice?.invoiceNo || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {chalan.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(chalan)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePrintDeliveryChalan(chalan.id);
                            }}
                            type="button"
                            title="Print Delivery Chalan"
                            aria-label="Print Delivery Chalan"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for chalan ID:', chalan.id);
                              handleDelete(chalan.id);
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
              <p>No delivery chalans found</p>
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
                {editingChalan ? 'Edit' : 'Create New'} Delivery Chalan
              </h3>
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
                    <label className="form-label">Invoice (Optional)</label>
                    <select
                      name="invoiceId"
                      value={formData.invoiceId}
                      onChange={(e) => setFormData({...formData, invoiceId: e.target.value})}
                      className="form-input"
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
                    <label className="form-label">Chalan Date *</label>
                    <input
                      type="date"
                      name="chalanDate"
                      value={formData.chalanDate}
                      onChange={(e) => setFormData({...formData, chalanDate: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Document Number *</label>
                    <input
                      type="text"
                      name="docNo"
                      value={formData.docNo}
                      onChange={(e) => setFormData({...formData, docNo: e.target.value})}
                      className="form-input"
                      placeholder="DC-001"
                      required
                    />
                  </div>
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-input"
                    rows="4"
                    placeholder="Enter chalan notes..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingChalan(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingChalan ? 'Update' : 'Create'} Delivery Chalan
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

export default DeliveryChalans; 