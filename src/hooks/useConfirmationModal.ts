'use client'

import { useState, useCallback } from 'react';
import { ModalType } from '../components/ui/confirmation-modal';

interface ModalConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  showCancel?: boolean;
  isRtl?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface UseConfirmationModalReturn {
  isOpen: boolean;
  modalConfig: ModalConfig | null;
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export const useConfirmationModal = (): UseConfirmationModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const showModal = useCallback((config: ModalConfig) => {
    setModalConfig(config);
    setIsOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsOpen(false);
    setModalConfig(null);
  }, []);

  const confirm = useCallback(async () => {
    if (modalConfig?.onConfirm) {
      await modalConfig.onConfirm();
    }
    hideModal();
  }, [modalConfig, hideModal]);

  const cancel = useCallback(() => {
    if (modalConfig?.onCancel) {
      modalConfig.onCancel();
    }
    hideModal();
  }, [modalConfig, hideModal]);

  return {
    isOpen,
    modalConfig,
    showModal,
    hideModal,
    confirm,
    cancel
  };
};

// Export useConfirmation as an alias for useConfirmationModal
export const useConfirmation = useConfirmationModal;

// Predefined modal configurations for common use cases
export const modalPresets = {
  delete: (itemName: string, onConfirm: () => void | Promise<void>): ModalConfig => ({
    title: 'Delete Item',
    message: `Are you sure you want to delete ${itemName}?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'error' as ModalType,
    isRtl: false,
    onConfirm
  }),

  deleteEn: (itemName: string, onConfirm: () => void | Promise<void>): ModalConfig => ({
    title: 'Delete Item',
    message: `Are you sure you want to delete ${itemName}?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'error' as ModalType,
    isRtl: false,
    onConfirm
  }),

  logout: (onConfirm: () => void | Promise<void>): ModalConfig => ({
    title: 'Logout',
    message: 'Are you sure you want to logout from your account?',
    confirmText: 'Logout',
    cancelText: 'Cancel',
    type: 'warning' as ModalType,
    isRtl: false,
    onConfirm
  }),

  success: (message: string, onConfirm?: () => void): ModalConfig => ({
    title: 'Success',
    message,
    confirmText: 'OK',
    type: 'success' as ModalType,
    showCancel: false,
    isRtl: false,
    onConfirm
  }),

  error: (message: string, onConfirm?: () => void): ModalConfig => ({
    title: 'Error',
    message,
    confirmText: 'OK',
    type: 'error' as ModalType,
    showCancel: false,
    isRtl: false,
    onConfirm
  }),

  info: (message: string, onConfirm?: () => void): ModalConfig => ({
    title: 'Information',
    message,
    confirmText: 'OK',
    type: 'info' as ModalType,
    showCancel: false,
    isRtl: false,
    onConfirm
  }),

  warning: (message: string, onConfirm?: () => void): ModalConfig => ({
    title: 'Warning',
    message,
    confirmText: 'OK',
    type: 'warning' as ModalType,
    showCancel: false,
    isRtl: false,
    onConfirm
  }),

  // English versions
  successEn: (message: string, onConfirm?: () => void): ModalConfig => ({
    title: 'Success',
    message,
    confirmText: 'OK',
    type: 'success' as ModalType,
    showCancel: false,
    isRtl: false,
    onConfirm
  }),

  errorEn: (message: string, onConfirm?: () => void): ModalConfig => ({
    title: 'Error',
    message,
    confirmText: 'OK',
    type: 'error' as ModalType,
    showCancel: false,
    isRtl: false,
    onConfirm
  }),

  // Custom Persian message like in your image
  customPersian: (message: string, onConfirm?: () => void): ModalConfig => ({
    message,
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info' as ModalType,
    isRtl: true,
    onConfirm
  })
};
