import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  // Date range dropdown state
  const [dateRange, setDateRange] = useState('today');
  const [showDropdown, setShowDropdown] = useState(false);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard statistics
        const [clientsRes, invoicesRes] = await Promise.all([
          axios.get('/clients'),
          axios.get('/invoices')
        ]);

        const clients = clientsRes.data;
        const invoices = invoicesRes.data;

        // Calculate statistics
        const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
        const pendingPayments = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance), 0);

        setStats({
          totalClients: clients.length,
          totalInvoices: invoices.length,
          totalRevenue,
          pendingPayments
        });

        // Get recent invoices (last 5)
        setRecentInvoices(invoices.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header + Date Range Dropdown */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || 'User'}!</p>
        </div>
        {/* Date Range Dropdown */}
        <div className="relative mt-4 md:mt-0">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none"
          >
            <span className="mr-2">
              {dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Today'}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {dateRangeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setDateRange(opt.value); setShowDropdown(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${dateRange === opt.value ? 'font-semibold text-purple-700' : 'text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-md transition-colors">
          <div className="card-content">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-800">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-colors">
          <div className="card-content">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                <span className="text-2xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-colors">
          <div className="card-content">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-800">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-colors">
          <div className="card-content">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingPayments)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Invoices</h2>
        </div>
        <div className="card-content">
          {recentInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Invoice #</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Client</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Amount</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Status</th>
                    <th className="text-left py-3 px-4 font-bold text-lg text-gray-800">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invoice.invoiceNo}</td>
                      <td className="py-3 px-4">{invoice.client?.companyName || 'N/A'}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.balance > 0 ? 'pending' : 'paid')}`}>
                          {invoice.balance > 0 ? 'Pending' : 'Paid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📄</span>
              <p>No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 