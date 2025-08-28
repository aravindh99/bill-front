import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientContacts from './pages/ClientContacts';
import VendorContacts from './pages/VendorContacts';
import Invoices from './pages/Invoices';
import Items from './pages/Items';
import Vendors from './pages/Vendors';
import Quotations from './pages/Quotations';
import PurchaseOrders from './pages/PurchaseOrders';
import ProformaInvoices from './pages/ProformaInvoices';
import DeliveryChalans from './pages/DeliveryChalans';
import CreditNotes from './pages/CreditNotes';
import DebitNotes from './pages/DebitNotes';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import './index.css';

// Loading Component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-background">
      <div className="loading-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
    <div className="loading-content">
      <div className="loading-logo-container">
        <img 
          src="/assets/xtown-light.png" 
          alt="XTown Logo" 
          className="loading-logo" 
        />
        <div className="loading-logo-glow"></div>
      </div>
      <div className="loading-spinner-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      </div>
      <div className="loading-text-container">
        <h2 className="loading-title">Billing System</h2>
        <p className="loading-subtitle">Loading your dashboard...</p>
      </div>
    </div>
  </div>
);

// Auth Check Component
const AuthCheck = () => {
  const { isAuthenticated, loading } = useAuth();

  // For portfolio demo, bypass auth completely in production
  const demoBypass = true;

  if (loading && !demoBypass) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !demoBypass) {
    return (
      <div className="auth-split-layout">
        <div className="auth-split-left">
          <div className="auth-container">
            <div className="auth-header">
              <div className="auth-icon">🔐</div>
              <h1 className="auth-title">Authentication Required</h1>
              <p className="auth-subtitle">Please authenticate to access the billing system</p>
            </div>
            <div className="alert alert-info">
              <span className="alert-icon">ℹ️</span>
              You need to be authenticated to access this application.
            </div>
          </div>
        </div>
        <div className="auth-split-right">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <img 
                src="/assets/xtown-light.png" 
                alt="XTown Logo" 
                className="h-16 w-auto mx-auto mb-8" 
              />
              <h2 className="text-3xl font-bold mb-4">Billing System</h2>
              <p className="text-xl opacity-90">
                Complete invoicing and billing solution
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/client-contacts" element={<ClientContacts />} />
        <Route path="/vendor-contacts" element={<VendorContacts />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/items" element={<Items />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/proforma-invoices" element={<ProformaInvoices />} />
        <Route path="/delivery-chalans" element={<DeliveryChalans />} />
        <Route path="/credit-notes" element={<CreditNotes />} />
        <Route path="/debit-notes" element={<DebitNotes />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </DashboardLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthCheck />
      </Router>
    </AuthProvider>
  );
}

export default App;
