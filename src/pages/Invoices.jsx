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

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [proformas, setProformas] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNo: '',
    poNo: '',
    invoiceDate: '',
    poDate: '',
    dueDate: '',
    paymentTerms: '',
    shippingCharges: '0.00',
    subtotal: '0.00',
    tax: '0.00',
    amount: '0.00',
    balance: '0.00',
    drCr: 'DR',
    termsConditions: '',
    items: [],
    proformaInvoiceId: '',
    quotationId: ''
  });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [companyCodeMissing, setCompanyCodeMissing] = useState(false);

  // New state for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    transactionId: '',
    notes: ''
  });

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.poNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.amount?.toString().includes(searchTerm)
  );

  // Use pagination hook with filtered data
  const {
    currentData: paginatedInvoices,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredInvoices, 25);

  // Table columns configuration
  const columns = [
    {
      key: 'invoiceNo',
      header: 'Invoice No',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.poNo && <div className="text-xs text-gray-500">PO: {row.poNo}</div>}
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
      key: 'invoiceDate',
      header: 'Date',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
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
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (value) => (
        <div className={`text-sm font-medium ${parseFloat(value || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ₹{parseFloat(value || 0).toFixed(2)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, row) => {
        const balance = parseFloat(row.balance || 0);
        const status = balance > 0 ? 'Pending' : 'Paid';
        const colorClass = balance > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        );
      }
    }
  ];

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchItems();
    fetchProfile();
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, resetToFirstPage]);

  useEffect(() => {
    if (formData.clientId) {
      axios.get(`/proformas/client/${formData.clientId}`)
        .then(res => setProformas(res.data))
        .catch(() => setProformas([]));
      axios.get(`/quotations/client/${formData.clientId}`)
        .then(res => setQuotations(res.data))
        .catch(() => setQuotations([]));
    } else {
      setProformas([]);
      setQuotations([]);
      setFormData(f => ({ ...f, proformaInvoiceId: '', quotationId: '' }));
    }
  }, [formData.clientId]);

  useEffect(() => {
    if (
      formData.proformaInvoiceId &&
      !editingInvoice &&
      (!formData.items || formData.items.length === 0)
    ) {
      const selectedProforma = proformas.find(p => p.id === parseInt(formData.proformaInvoiceId));
      if (selectedProforma) {
        const newItems = selectedProforma.items.map(item => ({
          itemId: item.itemId?.toString() || '',
          unit: item.unit,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          discountPercent: item.discountPercent?.toString() || '0',
          total: item.total.toString(),
          description: item.description || ''
        }));
        setFormData(f => ({
          ...f,
          quotationId: selectedProforma.quotationId ? selectedProforma.quotationId.toString() : '',
          items: newItems
        }));
        calculateTotals(newItems); // Recalculate totals after setting items
      }
    }
  }, [formData.proformaInvoiceId, proformas, editingInvoice]);

  useEffect(() => {
    if (
      formData.quotationId &&
      !editingInvoice &&
      (!formData.items || formData.items.length === 0) &&
      !formData.proformaInvoiceId
    ) {
      const selectedQuotation = quotations.find(q => q.id === parseInt(formData.quotationId));
      if (selectedQuotation) {
        const newItems = selectedQuotation.items.map(item => ({
          itemId: item.itemId?.toString() || '',
          unit: item.unit,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          discountPercent: item.discountPercent?.toString() || '0',
          total: item.total.toString(),
          description: item.description || ''
        }));
        setFormData(f => ({
          ...f,
          items: newItems
        }));
        calculateTotals(newItems); // Recalculate totals after setting items
      }
    }
  }, [formData.quotationId, quotations, editingInvoice, formData.proformaInvoiceId]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch invoices'), getErrorType(error));
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
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await axios.get('/profiles');
      if (response.data.length > 0) {
        setProfile(response.data[0]);
        setCompanyCodeMissing(!response.data[0].companyCode);
      } else {
        setCompanyCodeMissing(true);
      }
    } catch (error) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (companyCodeMissing) return;
    if (formData.items.length === 0) {
      showErrorModal('Error', 'Please add at least one item to the invoice', 'error');
      return;
    }
    // Prepare the data with proper types, do NOT include invoiceNo
    const { clientId, poNo, invoiceDate, poDate, dueDate, paymentTerms, shippingCharges, subtotal, tax, amount, balance, drCr, termsConditions, items, proformaInvoiceId, quotationId } = formData;
    const invoiceData = {
      clientId: parseInt(clientId),
      poNo,
      invoiceDate,
      poDate,
      dueDate,
      paymentTerms,
      shippingCharges,
      subtotal,
      tax,
      amount,
      balance,
      drCr,
      termsConditions,
      proformaInvoiceId: proformaInvoiceId ? parseInt(proformaInvoiceId) : undefined,
      quotationId: quotationId ? parseInt(quotationId) : undefined,
      items: items.map(item => ({
        itemId: parseInt(item.itemId),
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        discountPercent: item.discountPercent || 0,
        total: item.total,
        description: item.description || ''
      }))
    };
    try {
      if (editingInvoice) {
        const response = await axios.put(`/invoices/${editingInvoice.id}`, invoiceData);
        showErrorModal('Success', 'Invoice updated successfully!', 'success');
      } else {
        const response = await axios.post('/invoices', invoiceData);
        showErrorModal('Success', 'Invoice created successfully!', 'success');
      }
      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
      resetToFirstPage(); // Reset pagination after data change
    } catch (error) {
      showErrorModal('Error', getErrorMessage(error, 'Failed to save invoice'), getErrorType(error));
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId.toString(),
      invoiceNo: invoice.invoiceNo,
      poNo: invoice.poNo || '',
      invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
      poDate: invoice.poDate ? new Date(invoice.poDate).toISOString().split('T')[0] : '',
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      paymentTerms: invoice.paymentTerms,
      shippingCharges: invoice.shippingCharges?.toString() || '0.00',
      subtotal: invoice.subtotal?.toString() || '0.00',
      tax: invoice.tax?.toString() || '0.00',
      amount: invoice.amount?.toString() || '0.00',
      balance: invoice.balance?.toString() || '0.00',
      drCr: invoice.drCr || 'DR',
      termsConditions: invoice.termsConditions || '',
      items: invoice.invoiceItems?.map(item => ({
        itemId: item.itemId.toString(),
        unit: item.unit,
        quantity: item.quantity.toString(),
        price: item.price.toString(),
        discountPercent: item.discountPercent?.toString() || '0',
        total: item.total.toString(),
        description: item.description || ''
      })) || []
    });
    // Initialize payment form data when editing an invoice
    setPaymentFormData(prev => ({
      ...prev,
      invoiceId: invoice.id.toString(),
      amount: (invoice.balance || invoice.amount || 0).toString(), // Pre-fill with outstanding balance
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '', // Clear previous method
      transactionId: '', // Clear previous transaction ID
      notes: '' // Clear previous notes
    }));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const invoice = invoices.find(i => i.id === id);
    const message = `Are you sure you want to delete the invoice "${invoice?.invoiceNo}"? This action cannot be undone.`;
    
    showConfirmModal(
      'Delete Invoice',
      message,
      async () => {
        try {
          console.log('Deleting invoice with ID:', id);
          const response = await axios.delete(`/invoices/${id}`);
          console.log('Delete response:', response.data);
          showErrorModal('Success', 'Invoice deleted successfully!', 'success');
          fetchInvoices();
          resetToFirstPage(); // Reset pagination after deletion
        } catch (error) {
          console.error('Error deleting invoice:', error);
          console.error('Error response:', error.response?.data);
          
          let message = getErrorMessage(error, 'Error deleting invoice');
          
          // If there are related records, show them in the modal
          if (error.response?.data?.relatedRecords) {
            const relatedRecordsComponent = formatRelatedRecords(error.response.data.relatedRecords);
            showErrorModal(
              'Cannot Delete Invoice',
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

  const handlePrint = (invoice) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
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
            <h1>INVOICE</h1>
            <h2>${invoice.invoiceNo}</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          
          <div class="client-details">
            <h3>Bill To:</h3>
            <p><strong>${invoice.client?.companyName || 'N/A'}</strong></p>
            <p>${invoice.client?.address || 'N/A'}</p>
            <p>${invoice.client?.city || ''}, ${invoice.client?.state || ''} ${invoice.client?.pinCode || ''}</p>
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
              ${invoice.items?.map(item => `
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
            <p><strong>Subtotal:</strong> ₹${invoice.subtotal || 0}</p>
            <p><strong>Tax:</strong> ₹${invoice.tax || 0}</p>
            <p><strong>Total Amount:</strong> ₹${invoice.amount || 0}</p>
            <p><strong>Balance Due:</strong> ₹${invoice.balance || 0}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      invoiceNo: '',
      poNo: '',
      invoiceDate: '',
      poDate: '',
      dueDate: '',
      paymentTerms: '',
      shippingCharges: '0.00',
      subtotal: '0.00',
      tax: '0.00',
      amount: '0.00',
      balance: '0.00',
      drCr: 'DR',
      termsConditions: '',
      items: [],
      proformaInvoiceId: '',
      quotationId: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusColor = (balance) => {
    if (balance === 0) return 'bg-green-100 text-green-800';
    if (balance > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        itemId: '',
        unit: '',
        quantity: '1',
        price: '0.00',
        discountPercent: '0',
        total: '0.00',
        description: ''
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    // Recalculate totals after removing item
    calculateTotals(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // If updating quantity, price, or discount, recalculate the line total
    if (['quantity', 'price', 'discountPercent'].includes(field)) {
      const quantity = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].price || 0);
      const discount = parseFloat(newItems[index].discountPercent || 0);
      const lineTotal = quantity * price * (1 - discount / 100);
      newItems[index].total = lineTotal.toFixed(2);
    }
    
    // If updating itemId, get the item details and set default values
    if (field === 'itemId' && value) {
      const selectedItem = items.find(item => item.id.toString() === value);
      if (selectedItem) {
        newItems[index].unit = selectedItem.unit;
        newItems[index].price = selectedItem.salesUnitPrice.toString();
        newItems[index].description = selectedItem.description || '';
        // Recalculate line total with new price
        const quantity = parseFloat(newItems[index].quantity || 1);
        const price = parseFloat(selectedItem.salesUnitPrice);
        const discount = parseFloat(newItems[index].discountPercent || 0);
        const lineTotal = quantity * price * (1 - discount / 100);
        newItems[index].total = lineTotal.toFixed(2);
      }
    }
    
    setFormData({
      ...formData,
      items: newItems
    });
    
    // Recalculate totals
    calculateTotals(newItems);
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const taxAmount = parseFloat(formData.tax || 0);
    const shippingCharges = parseFloat(formData.shippingCharges || 0);
    const totalAmount = subtotal + taxAmount + shippingCharges;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      amount: totalAmount.toFixed(2),
      balance: totalAmount.toFixed(2) // For new invoices, balance equals amount
    }));
  };

  const updateTax = (value) => {
    const subtotal = parseFloat(formData.subtotal || 0);
    const taxAmount = parseFloat(value || 0);
    const shippingCharges = parseFloat(formData.shippingCharges || 0);
    const totalAmount = subtotal + taxAmount + shippingCharges;
    
    setFormData({
      ...formData,
      tax: value,
      amount: totalAmount.toFixed(2),
      balance: totalAmount.toFixed(2)
    });
  };

  const updateShippingCharges = (value) => {
    const subtotal = parseFloat(formData.subtotal || 0);
    const taxAmount = parseFloat(formData.tax || 0);
    const shippingCharges = parseFloat(value || 0);
    const totalAmount = subtotal + taxAmount + shippingCharges;
    
    setFormData({
      ...formData,
      shippingCharges: value,
      amount: totalAmount.toFixed(2),
      balance: totalAmount.toFixed(2)
    });
  };

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        invoiceId: parseInt(paymentFormData.invoiceId),
        amount: parseFloat(paymentFormData.amount),
        paymentDate: paymentFormData.paymentDate,
        paymentMethod: paymentFormData.paymentMethod,
        transactionId: paymentFormData.transactionId,
        notes: paymentFormData.notes,
      };
      await axios.post('/payments', payload); // Assuming backend endpoint is /payments
      showErrorModal('Success', 'Payment recorded successfully!', 'success');
      setShowPaymentModal(false);
      // Fetch the updated invoice to reflect the new balance and payments
      if (editingInvoice) {
        const response = await axios.get(`/invoices/${editingInvoice.id}`);
        setEditingInvoice(response.data);
      }
      fetchInvoices(); // Re-fetch invoices to update the main list
    } catch (error) {
      console.error('Error saving payment:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to record payment'), getErrorType(error));
    }
  };

  const handlePrintInvoice = async (invoiceId) => {
    try {
      const invoiceResponse = await axios.get(`/invoices/${invoiceId}`);
      const invoice = invoiceResponse.data;

      const profileResponse = await axios.get('/profiles'); // Fetch company profile
      const companyProfile = profileResponse.data.length > 0 ? profileResponse.data[0] : {};

      if (!invoice) {
        showErrorModal('Error', 'Invoice not found for printing', 'error');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showErrorModal('Error', 'Please allow pop-ups for printing', 'error');
        return;
      }

      const invoiceHtml = `
        <html>
          <head>
            <title>Invoice #${invoice.invoiceNo}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
              .invoice-page { width: 210mm; min-height: 297mm; margin: 10mm auto; border: 1px solid #eee; background: #fff; padding: 20mm; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
              .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .company-info h1 { margin: 0; font-size: 28px; color: #333; }
              .company-info p { margin: 2px 0; font-size: 14px; color: #555; }
              .invoice-title { font-size: 40px; font-weight: bold; color: #333; margin-top: 0; }
              .invoice-meta { margin-top: 10px; text-align: right; font-size: 14px; }
              .invoice-meta div { margin-bottom: 5px; }

              .address-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .address-box { border: 1px solid #eee; padding: 15px; width: 48%; }
              .address-box h3 { margin-top: 0; font-size: 16px; color: #333; }
              .address-box p { margin: 2px 0; font-size: 14px; color: #555; }

              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .item-table th, .item-table td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 14px; }
              .item-table th { background-color: #f9f9f9; font-weight: bold; color: #333; }

              .summary-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
              .summary-box { width: 40%; border: 1px solid #eee; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px solid #eee; }
              .summary-row:last-child { border-bottom: none; }
              .summary-row.total { background-color: #f2f2f2; font-weight: bold; font-size: 16px; }

              .terms-conditions { font-size: 13px; color: #555; margin-bottom: 30px; }
              .footer-section { text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
              @media print {
                .invoice-page { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-page">
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
                  <h2 class="invoice-title">INVOICE</h2>
                  <div class="invoice-meta">
                    <div><strong>Invoice No:</strong> ${invoice.invoiceNo}</div>
                    <div><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
                    <div><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
                    ${invoice.poNo ? `<div><strong>PO No:</strong> ${invoice.poNo}</div>` : ''}
                  </div>
                </div>
              </div>

              <div class="address-section">
                <div class="address-box">
                  <h3>Bill To:</h3>
                  <p><strong>${invoice.client?.companyName || 'Client Name'}</strong></p>
                  <p>${invoice.client?.billingAddress || 'Client Address'}</p>
                  <p>${invoice.client?.city || 'City'}, ${invoice.client?.state || 'State'} ${invoice.client?.pinCode || 'PIN'}</p>
                  <p>Email: ${invoice.client?.email || 'N/A'}</p>
                  <p>Phone: ${invoice.client?.phone || 'N/A'}</p>
                  ${invoice.client?.gstin ? `<p>GSTIN: ${invoice.client.gstin}</p>` : ''}
                </div>
                <div class="address-box">
                  <h3>Ship To:</h3>
                  <p><strong>${invoice.client?.companyName || 'Client Name'}</strong></p>
                  <p>${invoice.client?.shippingAddress || 'Client Address'}</p>
                  <p>${invoice.client?.city || 'City'}, ${invoice.client?.state || 'State'} ${invoice.client?.pinCode || 'PIN'}</p>
                  <!-- Assuming shipping address is stored in client, or you can add it to Invoice model if needed -->
                </div>
              </div>

              <table class="item-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item & Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.invoiceItems.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>
                        <strong>${item.item?.name || 'N/A'}</strong><br/>
                        <span style="font-size: 12px; color: #777;">${item.description || ''}</span>
                      </td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>${item.discountPercent || '0'}%</td>
                      <td>${formatCurrency(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="summary-section">
                <div class="summary-box">
                  <div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal)}</span></div>
                  <div class="summary-row"><span>Tax:</span><span>${formatCurrency(invoice.tax || 0)}</span></div>
                  <div class="summary-row"><span>Shipping Charges:</span><span>${formatCurrency(invoice.shippingCharges || 0)}</span></div>
                  <div class="summary-row total"><span>TOTAL:</span><span>${formatCurrency(invoice.amount)}</span></div>
                  <div class="summary-row"><span>Amount Paid:</span><span>${formatCurrency(invoice.amount - invoice.balance)}</span></div>
                  <div class="summary-row"><span>Balance Due:</span><span>${formatCurrency(invoice.balance)}</span></div>
                </div>
              </div>

              ${invoice.termsConditions ? `<div class="terms-conditions">
                <strong>Terms and Conditions:</strong>
                <p>${invoice.termsConditions}</p>
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

      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      // printWindow.close(); // Optionally close after printing, but can cause issues depending on browser settings

    } catch (error) {
      console.error('Error printing invoice:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to print invoice'), getErrorType(error));
    }
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
        title="Invoices"
        subtitle="Manage your invoices and billing"
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
            Create Invoice
          </ActionButton>
        }
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by invoice number, client, PO number, or amount..."
        label="Search Invoices"
      />

      {/* Results Summary */}
      <ResultsSummary
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        itemName="invoice"
      />

      {/* Invoices Table */}
      <DataTable
        columns={columns}
        data={paginatedInvoices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        emptyMessage="No invoices found"
        emptyIcon="📄"
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
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h3>
              <button
                onClick={() => {
                  console.log('Closing modal');
                  setShowModal(false);
                  setEditingInvoice(null);
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
                      onChange={(e) => setFormData(f => ({ ...f, clientId: e.target.value, proformaInvoiceId: '', quotationId: '' }))}
                      className="form-input"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!editingInvoice && formData.clientId && (proformas.length > 0 || quotations.length > 0) && (
                    <div className="form-grid-2">
                      {proformas.length > 0 && (
                        <div className="form-group">
                          <label className="form-label">Create from Proforma Invoice (Optional)</label>
                          <select
                            name="proformaInvoiceId"
                            value={formData.proformaInvoiceId}
                            onChange={(e) => setFormData(f => ({
                              ...f,
                              proformaInvoiceId: e.target.value,
                              quotationId: '' // Clear quotation if proforma is selected
                            }))}
                            className="form-input"
                          >
                            <option value="">-- Select Proforma Invoice --</option>
                            {proformas.map(proforma => (
                              <option key={proforma.id} value={proforma.id}>
                                {proforma.proformaNo} ({new Date(proforma.proformaDate).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-fills items from the selected Proforma Invoice.
                          </p>
                        </div>
                      )}

                      {quotations.length > 0 && (
                        <div className="form-group">
                          <label className="form-label">Create from Quotation (Optional)</label>
                          <select
                            name="quotationId"
                            value={formData.quotationId}
                            onChange={(e) => setFormData(f => ({
                              ...f,
                              quotationId: e.target.value,
                              proformaInvoiceId: '' // Clear proforma if quotation is selected
                            }))}
                            className="form-input"
                          >
                            <option value="">-- Select Quotation --</option>
                            {quotations.map(quotation => (
                              <option key={quotation.id} value={quotation.id}>
                                {quotation.quotationNo} ({new Date(quotation.quotationDate).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-fills items from the selected Quotation.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="form-group">
                    <ReadOnlyDocumentNumber
                      label="Invoice Number *"
                      value={formData.invoiceNo}
                      tooltip="This number is auto-generated by the system and cannot be changed."
                    />
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
                    <label className="form-label">PO Number</label>
                    <input
                      type="text"
                      name="poNo"
                      value={formData.poNo}
                      onChange={(e) => setFormData({...formData, poNo: e.target.value})}
                      className="form-input"
                      placeholder="PO-001"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PO Date</label>
                    <input
                      type="date"
                      name="poDate"
                      value={formData.poDate}
                      onChange={(e) => setFormData({...formData, poDate: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <input
                      type="text"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                      className="form-input"
                      placeholder="Net 30"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Invoice Items</h4>
                    <ActionButton
                      type="button"
                      onClick={addItem}
                      variant="primary"
                      size="sm"
                    >
                      Add Item
                    </ActionButton>
                  </div>
                  {formData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Item</th>
                            <th className="text-left py-2 px-2">Description</th>
                            <th className="text-left py-2 px-2">Unit</th>
                            <th className="text-left py-2 px-2">Qty</th>
                            <th className="text-left py-2 px-2">Price</th>
                            <th className="text-left py-2 px-2">Discount %</th>
                            <th className="text-left py-2 px-2">Total</th>
                            <th className="text-left py-2 px-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-2">
                                <select
                                  value={item.itemId}
                                  onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                                  className="form-input form-input-sm"
                                  required
                                >
                                  <option value="">Select Item</option>
                                  {items.map((i) => (
                                    <option key={i.id} value={i.id}>
                                      {i.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                  className="form-input form-input-sm"
                                  placeholder="Description"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                  className="form-input form-input-sm"
                                  readOnly
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                  className="form-input form-input-sm"
                                  min="0"
                                  step="any"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                                  className="form-input form-input-sm"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.discountPercent}
                                  onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                                  className="form-input form-input-sm"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={item.total}
                                  className="form-input form-input-sm"
                                  readOnly
                                />
                              </td>
                              <td className="py-2 px-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                      <p>No items added. Click "Add Item" to start.</p>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div className="border-t pt-4">
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Shipping Charges</label>
                      <input
                        type="number"
                        name="shippingCharges"
                        value={formData.shippingCharges}
                        onChange={(e) => updateShippingCharges(e.target.value)}
                        className="form-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subtotal</label>
                      <input
                        type="number"
                        name="subtotal"
                        value={formData.subtotal}
                        className="form-input bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tax Amount</label>
                      <input
                        type="number"
                        name="tax"
                        value={formData.tax}
                        onChange={(e) => updateTax(e.target.value)}
                        className="form-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Amount</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        className="form-input bg-gray-100 font-semibold"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Balance</label>
                      <input
                        type="number"
                        name="balance"
                        value={formData.balance}
                        className="form-input bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select
                        name="drCr"
                        value={formData.drCr}
                        onChange={(e) => setFormData({...formData, drCr: e.target.value})}
                        className="form-input"
                      >
                        <option value="DR">Debit (DR)</option>
                        <option value="CR">Credit (CR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group form-full-width">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea
                    name="termsConditions"
                    value={formData.termsConditions}
                    onChange={(e) => setFormData({...formData, termsConditions: e.target.value})}
                    className="form-input"
                    rows="3"
                    placeholder="Payment terms, delivery terms, etc."
                  />
                </div>

                {/* Payment Details and Record Payment Button */}
                {editingInvoice && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Payments</h3>
                    {editingInvoice.payments && editingInvoice.payments.length > 0 ? (
                      <div className="space-y-2">
                        {editingInvoice.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                            <div>
                              <p className="text-gray-800 font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm text-gray-700">{payment.paymentMethod}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No payments recorded for this invoice.</p>
                    )}
                    <ActionButton
                      type="button"
                      onClick={handleOpenPaymentModal}
                      variant="secondary"
                      size="md"
                      className="mt-4"
                    >
                      Record Payment
                    </ActionButton>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <ActionButton
                    onClick={() => {
                      setShowModal(false);
                      setEditingInvoice(null);
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
                    disabled={companyCodeMissing || profileLoading}
                  >
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                  </ActionButton>
                </div>
                {companyCodeMissing && !profileLoading && (
                  <div className="text-red-600 text-sm mt-2">
                    Please set your <b>Company Code</b> in the <a href="/profile" className="underline">profile</a> before creating invoices.
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

      {/* Payment Modal */}
      {showPaymentModal && editingInvoice && (
        <ModernModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Record New Payment"
          type="form"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input
                type="text"
                value={editingInvoice.invoiceNo}
                className="form-input bg-gray-100 font-mono"
                readOnly
                tabIndex={-1}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input
                type="number"
                name="amount"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                className="form-input"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                name="paymentDate"
                value={paymentFormData.paymentDate}
                onChange={(e) => setPaymentFormData({...paymentFormData, paymentDate: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                name="paymentMethod"
                value={paymentFormData.paymentMethod}
                onChange={(e) => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})}
                className="form-input"
                required
              >
                <option value="">Select Method</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Online Payment">Online Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction ID (Optional)</label>
              <input
                type="text"
                name="transactionId"
                value={paymentFormData.transactionId}
                onChange={(e) => setPaymentFormData({...paymentFormData, transactionId: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                name="notes"
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                className="form-input"
                rows="2"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <ActionButton
                onClick={() => setShowPaymentModal(false)}
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
                Record Payment
              </ActionButton>
            </div>
          </form>
        </ModernModal>
      )}
    </div>
  );
};

export default Invoices; 