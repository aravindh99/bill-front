import React from 'react';
import ActionButton from './ActionButton';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonVariant: 'danger'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonVariant: 'warning'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonVariant: 'primary'
        };
      default:
        return {
          icon: '❓',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          buttonVariant: 'secondary'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center mr-3`}>
              <span className="text-xl">{styles.icon}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">{message}</p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton
              onClick={onClose}
              variant="secondary"
              size="md"
            >
              {cancelText}
            </ActionButton>
            <ActionButton
              onClick={handleConfirm}
              variant={styles.buttonVariant}
              size="md"
            >
              {confirmText}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 