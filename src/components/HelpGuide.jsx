import React from 'react';

const HelpGuide = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const guides = [
    {
      title: "Getting Started",
      icon: "🚀",
      content: [
        "Welcome to Xtown Billing! This app helps you manage your business billing and invoicing.",
        "Start by adding your clients and vendors in the respective sections.",
        "Then add your products and services in the Items section.",
        "You can create quotations, invoices, and track payments easily."
      ]
    },
    {
      title: "Managing Clients & Vendors",
      icon: "👥",
      content: [
        "Add clients who buy from you and vendors who supply to you.",
        "Each client/vendor can have contact details, GSTIN, and address information.",
        "You can edit or delete clients/vendors, but deletion is restricted if they have related records.",
        "Use the search function to quickly find specific clients or vendors."
      ]
    },
    {
      title: "Items Management",
      icon: "📦",
      content: [
        "Add products and services you sell or purchase.",
        "Set sales and purchase prices, tax rates, and HSN/SAC codes.",
        "Items can be marked as 'product' or 'service'.",
        "Like clients, items with related records cannot be deleted."
      ]
    },
    {
      title: "Creating Documents",
      icon: "📄",
      content: [
        "Quotations: Create price quotes for potential customers.",
        "Invoices: Bill your customers for products/services sold.",
        "Purchase Orders: Order from your vendors.",
        "Proforma Invoices: Preliminary invoices before final billing.",
        "Delivery Chalans: Document goods delivered to customers.",
        "Credit/Debit Notes: Adjust invoice amounts when needed."
      ]
    },
    {
      title: "Payment Tracking",
      icon: "💰",
      content: [
        "Record payments received from customers.",
        "Link payments to specific invoices or record general payments.",
        "Track payment methods (cash, bank transfer, UPI, etc.).",
        "View payment history and outstanding balances."
      ]
    },
    {
      title: "Error Handling",
      icon: "⚠️",
      content: [
        "Modern error messages will guide you when something goes wrong.",
        "If you can't delete a client/item, check what related records exist.",
        "Delete related records first before deleting the main record.",
        "All forms have validation to ensure data quality."
      ]
    },
    {
      title: "Best Practices",
      icon: "💡",
      content: [
        "Always fill required fields marked with *.",
        "Keep client and vendor information up to date.",
        "Use consistent naming for items and services.",
        "Regularly record payments to maintain accurate financial records.",
        "Back up your data regularly."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl transform rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📚</span>
              <h3 className="text-2xl font-bold text-gray-900">Help Guide</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {guides.map((guide, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{guide.icon}</span>
                    <h4 className="text-lg font-semibold text-gray-900">{guide.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {guide.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpGuide; 