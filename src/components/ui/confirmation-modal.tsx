'use client'

import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export type ModalType = 'warning' | 'info' | 'success' | 'error' | 'confirmation';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  showCancel?: boolean;
  isRtl?: boolean;
  icon?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'confirmation',
  showCancel = true,
  isRtl = false,
  icon
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          defaultIcon: <AlertTriangle className="w-6 h-6" />
        };
      case 'error':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          defaultIcon: <XCircle className="w-6 h-6" />
        };
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          defaultIcon: <CheckCircle className="w-6 h-6" />
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          defaultIcon: <Info className="w-6 h-6" />
        };
      default:
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
          defaultIcon: <Info className="w-6 h-6" />
        };
    }
  };

  const typeStyles = getTypeStyles();
  const displayIcon = icon || typeStyles.defaultIcon;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out
          max-w-md w-full mx-4 animate-modal-in
          ${isRtl ? 'text-right' : 'text-left'}
        `}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className={`flex items-center justify-between p-6 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 leading-6">
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className={`
              ${isRtl ? 'mr-4' : 'ml-4'} p-2 hover:bg-gray-100 rounded-full 
              transition-colors duration-200 focus:outline-none focus:ring-2 
              focus:ring-gray-300 focus:ring-offset-2
            `}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className={`flex items-start ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Icon */}
            <div className={`
              flex-shrink-0 ${typeStyles.iconBg} rounded-full p-3
              ${isRtl ? 'mr-0 ml-4' : 'ml-0 mr-4'}
            `}>
              <div className={typeStyles.iconColor}>
                {displayIcon}
              </div>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`
          flex gap-3 px-6 pb-6 pt-2
          ${isRtl ? 'flex-row-reverse' : 'flex-row'}
          ${showCancel ? 'justify-end' : 'justify-center'}
        `}>
          {showCancel && (
            <button
              onClick={onClose}
              className={`
                px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 
                rounded-lg font-medium transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
                min-w-[80px]
              `}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`
              px-6 py-2.5 text-white rounded-lg font-medium
              transition-all duration-200 transform hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${typeStyles.confirmBtn}
              min-w-[80px] shadow-lg
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;


