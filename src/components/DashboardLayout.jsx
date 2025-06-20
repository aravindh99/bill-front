import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HelpGuide from './HelpGuide';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Clients', path: '/clients', icon: '👥' },
    { name: 'Client Contacts', path: '/client-contacts', icon: '📞' },
    { name: 'Invoices', path: '/invoices', icon: '📄' },
    { name: 'Items', path: '/items', icon: '📦' },
    { name: 'Vendors', path: '/vendors', icon: '🏢' },
    { name: 'Vendor Contacts', path: '/vendor-contacts', icon: '📞' },
    { name: 'Quotations', path: '/quotations', icon: '📋' },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: '🛒' },
    { name: 'Proforma Invoices', path: '/proforma-invoices', icon: '📝' },
    { name: 'Delivery Chalans', path: '/delivery-chalans', icon: '🚚' },
    { name: 'Credit Notes', path: '/credit-notes', icon: '💳' },
    { name: 'Debit Notes', path: '/debit-notes', icon: '💸' },
    { name: 'Payments', path: '/payments', icon: '💰' },
    { name: 'Profile', path: '/profile', icon: '⚙️' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const renderHeader = () => (
    <div className="dashboard-header">
      <div className="flex items-center">
        <h1 className="dashboard-title">Billing System</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowHelp(true)}
          className="btn btn-secondary text-sm"
          title="Help Guide"
        >
          <span className="mr-2">❓</span>
          Help
        </button>
        <div className="text-sm text-gray-600">
          Welcome, {user?.name || 'User'}
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary text-sm"
        >
          <span className="mr-2">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div
      className="dashboard-sidebar flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #211531, #9254de)',
        minHeight: '100vh',
        width: '350px',
        padding: '1.5rem'
      }}
    >
      <div className="mb-8 flex justify-start ml-8">
        <img 
          src="/assets/xtown-light.png" 
          alt="XTown Logo" 
          className="h-8 w-auto" 
        />
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'font-semibold'
                    : 'text-white hover:bg-white hover:bg-opacity-20 hover:text-gray-900'
                }`}
                style={{
                  color: location.pathname === item.path ? '#111827' : '#ffffff',
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                }}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto pt-8">
        <div className="text-white text-center">
          <b>Powered by Xtown</b>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {renderSidebar()}
      <div className="flex-1 flex flex-col">
        {renderHeader()}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
      <HelpGuide isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default DashboardLayout; 