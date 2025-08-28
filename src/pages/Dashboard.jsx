import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import DataTable from '../components/DataTable';
import ActionButton from '../components/ActionButton';
import { getErrorMessage, getErrorType } from '../utils/errorHelpers.jsx';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalVendors: 0,
    totalItems: 0,
    recentInvoices: [],
    recentPayments: [],
    recentQuotations: [],
    recentProformas: []
  });
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [currentTab, setCurrentTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');

  // Get current data based on selected tab
  const getCurrentData = () => {
    switch (currentTab) {
      case 'invoices':
        return dashboardData.recentInvoices;
      case 'payments':
        return dashboardData.recentPayments;
      case 'quotations':
        return dashboardData.recentQuotations;
      case 'proformas':
        return dashboardData.recentProformas;
      default:
        return dashboardData.recentInvoices;
    }
  };

  // Filter data based on search term
  const filteredData = getCurrentData().filter(item => {
    if (!item) return false;
    
    switch (currentTab) {
      case 'invoices':
        return item.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      case 'payments':
        return item.invoice?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.invoice?.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      case 'quotations':
        return item.quotationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      case 'proformas':
        return item.proformaInvoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      default:
        return true;
    }
  });

  // Use pagination hook with filtered data
  const {
    currentData: paginatedData,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetToFirstPage
  } = usePagination(filteredData, 10);

  // Table columns configuration based on current tab
  const getColumns = () => {
    switch (currentTab) {
      case 'invoices':
        return [
          {
            key: 'invoiceNo',
            header: 'Invoice No',
            render: (value) => <div className="text-sm font-medium text-gray-900">{value}</div>
          },
          {
            key: 'client',
            header: 'Client',
            render: (value) => <div className="text-sm text-gray-900">{value?.companyName || '-'}</div>
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
          }
        ];
      case 'payments':
        return [
          {
            key: 'invoice',
            header: 'Invoice',
            render: (value) => <div className="text-sm font-medium text-gray-900">{value?.invoiceNo || '-'}</div>
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
            header: 'Method',
            render: (value) => <div className="text-sm text-gray-900">{value || '-'}</div>
          }
        ];
      case 'quotations':
        return [
          {
            key: 'quotationNo',
            header: 'Quotation No',
            render: (value) => <div className="text-sm font-medium text-gray-900">{value}</div>
          },
          {
            key: 'client',
            header: 'Client',
            render: (value) => <div className="text-sm text-gray-900">{value?.companyName || '-'}</div>
          },
          {
            key: 'quotationDate',
            header: 'Date',
            render: (value) => (
              <div className="text-sm text-gray-900">
                {value ? new Date(value).toLocaleDateString() : '-'}
              </div>
            )
          },
          {
            key: 'total',
            header: 'Total',
            render: (value) => (
              <div className="text-sm font-medium text-gray-900">
                ₹{parseFloat(value || 0).toFixed(2)}
              </div>
            )
          }
        ];
      case 'proformas':
        return [
          {
            key: 'proformaInvoiceNo',
            header: 'Proforma No',
            render: (value) => <div className="text-sm font-medium text-gray-900">{value}</div>
          },
          {
            key: 'client',
            header: 'Client',
            render: (value) => <div className="text-sm text-gray-900">{value?.companyName || '-'}</div>
          },
          {
            key: 'proformaInvoiceDate',
            header: 'Date',
            render: (value) => (
              <div className="text-sm text-gray-900">
                {value ? new Date(value).toLocaleDateString() : '-'}
              </div>
            )
          },
          {
            key: 'total',
            header: 'Total',
            render: (value) => (
              <div className="text-sm font-medium text-gray-900">
                ₹{parseFloat(value || 0).toFixed(2)}
              </div>
            )
          }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset pagination when search term or tab changes
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, currentTab, resetToFirstPage]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all required data
      const [clientsRes, invoicesRes, vendorsRes, itemsRes, paymentsRes, quotationsRes, proformasRes] = await Promise.all([
        axios.get('/clients'),
        axios.get('/invoices'),
        axios.get('/vendors'),
        axios.get('/items'),
        axios.get('/payments'),
        axios.get('/quotations'),
        axios.get('/proformas')
      ]);

      // Calculate statistics
      const totalRevenue = invoicesRes.data.reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0);
      const pendingPayments = invoicesRes.data.reduce((sum, invoice) => sum + parseFloat(invoice.balance || 0), 0);

      setDashboardData({
        totalInvoices: invoicesRes.data.length,
        totalClients: clientsRes.data.length,
        totalVendors: vendorsRes.data.length,
        totalItems: itemsRes.data.length,
        recentInvoices: invoicesRes.data.slice(0, 50), // Get more for pagination
        recentPayments: paymentsRes.data.slice(0, 50),
        recentQuotations: quotationsRes.data.slice(0, 50),
        recentProformas: proformasRes.data.slice(0, 50)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showErrorModal('Error', getErrorMessage(error, 'Failed to fetch dashboard data'), getErrorType(error));
    } finally {
      setLoading(false);
    }
  };

  const showErrorModal = (title, message, type = 'error') => {
    setErrorModal({ isOpen: true, title, message, type });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your billing system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              </div>
              <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              </div>
              <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              </div>
              <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalVendors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              </div>
              <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-sm text-gray-600">Latest activities across your system</p>
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'invoices', label: 'Invoices', count: dashboardData.recentInvoices.length },
              { id: 'payments', label: 'Payments', count: dashboardData.recentPayments.length },
              { id: 'quotations', label: 'Quotations', count: dashboardData.recentQuotations.length },
              { id: 'proformas', label: 'Proformas', count: dashboardData.recentProformas.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {tab.count}
                        </span>
              </button>
            ))}
          </nav>
            </div>

        {/* Table */}
        <div className="p-6">
          <DataTable
            columns={getColumns()}
            data={paginatedData}
            emptyMessage={`No ${currentTab} found`}
            emptyIcon="📊"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                errorModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {errorModal.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">{errorModal.title}</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">{errorModal.message}</p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 