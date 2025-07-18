import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HelpGuide from './HelpGuide';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
    <div className="dashboard-header relative">
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
        {/* Profile Icon with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown((v) => !v)}
            className="flex items-center justify-center w-10 h-10 rounded-full focus:outline-none"
            title="Profile"
            style={{
              background: 'linear-gradient(135deg, #211531, #9254de)',
              boxShadow: '0 2px 8px rgba(64,18,178,0.10)'
            }}
          >
            {/* Modern SVG User Icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="14" fill="url(#profile-gradient)" />
              <g filter="url(#shadow)">
                <ellipse cx="14" cy="11" rx="5" ry="5" fill="#fff" fillOpacity="0.95" />
                <ellipse cx="14" cy="20" rx="7" ry="4" fill="#fff" fillOpacity="0.85" />
              </g>
              <defs>
                <linearGradient id="profile-gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#211531" />
                  <stop offset="1" stopColor="#9254de" />
                </linearGradient>
                <filter id="shadow" x="0" y="0" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#4012b2" floodOpacity="0.10" />
                </filter>
              </defs>
            </svg>
          </button>
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
              <div className="px-4 py-2 text-gray-700 border-b border-gray-100">
                <span className="font-semibold">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                <span className="mr-2">🚪</span> Logout
              </button>
            </div>
          )}
        </div>
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