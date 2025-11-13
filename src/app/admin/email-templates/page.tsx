'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailTemplateApi, EmailTemplate, EmailTemplateType, CreateEmailTemplateRequest, UpdateEmailTemplateRequest } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { toPersianNumber } from '@/utils/numberUtils';
import { SearchableSelect } from '@/components/ui/searchable-select';

const getTypeLabel = (type: number): string => {
  const typeMap: Record<number, string> = {
    1: 'ثبت‌نام',
    2: 'تأیید ایمیل',
    3: 'بازیابی رمز عبور',
    4: 'خوش‌آمدگویی',
    5: 'خبرنامه',
    6: 'تأیید آگهی',
    7: 'رد آگهی',
    8: 'انقضای آگهی',
    9: 'تأیید کسب‌وکار',
    10: 'رد کسب‌وکار',
    11: 'تأیید پرداخت',
    12: 'فعال‌سازی تبلیغ',
    13: 'اعلان سیستم',
    14: 'تبلیغات',
    15: 'فرم تماس'
  };
  return typeMap[type] || 'نامشخص';
};

export default function AdminEmailTemplatesPage() {
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { isOpen, modalConfig, showModal, confirm, cancel } = useConfirmationModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<CreateEmailTemplateRequest>({
    name: '',
    subject: '',
    htmlBody: '',
    textBody: '',
    type: EmailTemplateType.Registration,
    isActive: true,
    isDefault: false,
    description: ''
  });

  // Fetch templates
  const { data: templatesResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-email-templates', searchTerm, typeFilter, activeFilter],
    queryFn: async () => {
      const response = await emailTemplateApi.getAll();
      return response.data;
    },
    retry: 2,
  });

  const allTemplates: EmailTemplate[] = templatesResponse?.data || [];
  
  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === null || template.type === typeFilter;
    const matchesActive = activeFilter === null || template.isActive === activeFilter;
    return matchesSearch && matchesType && matchesActive;
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEmailTemplateRequest) => emailTemplateApi.create(data),
    onSuccess: (response) => {
      successPersian('قالب ایمیل با موفقیت ایجاد شد');
      setIsCreateModalOpen(false);
      setNewTemplate({
        name: '',
        subject: '',
        htmlBody: '',
        textBody: '',
        type: EmailTemplateType.Registration,
        isActive: true,
        isDefault: false,
        description: ''
      });
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد قالب ایمیل');
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailTemplateRequest }) => 
      emailTemplateApi.update(id, data),
    onSuccess: (response) => {
      successPersian('قالب ایمیل با موفقیت بروزرسانی شد');
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در بروزرسانی قالب ایمیل');
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailTemplateApi.delete(id),
    onSuccess: (response) => {
      successPersian('قالب ایمیل با موفقیت حذف شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در حذف قالب ایمیل');
    },
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => emailTemplateApi.setAsDefault(id),
    onSuccess: (response) => {
      successPersian('قالب ایمیل به عنوان پیش‌فرض تنظیم شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در تنظیم قالب پیش‌فرض');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => emailTemplateApi.toggleActive(id),
    onSuccess: (response) => {
      successPersian('وضعیت قالب ایمیل تغییر کرد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در تغییر وضعیت قالب');
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.subject.trim() || !newTemplate.htmlBody.trim()) {
      errorPersian('لطفاً نام، موضوع و محتوای قالب را وارد کنید');
      return;
    }
    createMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim() || !editingTemplate.subject.trim() || !editingTemplate.htmlBody.trim()) {
      errorPersian('لطفاً نام، موضوع و محتوای قالب را وارد کنید');
      return;
    }
    const updateData: UpdateEmailTemplateRequest = {
      name: editingTemplate.name,
      subject: editingTemplate.subject,
      htmlBody: editingTemplate.htmlBody,
      textBody: editingTemplate.textBody,
      isActive: editingTemplate.isActive,
      description: editingTemplate.description
    };
    updateMutation.mutate({ id: editingTemplate.id, data: updateData });
  };

  const handleDelete = (templateId: string) => {
    showModal({
      title: 'حذف قالب ایمیل',
      message: 'آیا از حذف این قالب ایمیل اطمینان دارید؟',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'warning',
      onConfirm: () => {
        deleteMutation.mutate(templateId);
      }
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditModalOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleSetDefault = (templateId: string) => {
    setDefaultMutation.mutate(templateId);
  };

  const handleToggleActive = (templateId: string) => {
    toggleActiveMutation.mutate(templateId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">مدیریت قالب‌های ایمیل</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 ml-2" />
          ایجاد قالب جدید
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی قالب..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={typeFilter === null ? '' : typeFilter}
              onChange={(e) => setTypeFilter(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه انواع</option>
              {Object.entries(EmailTemplateType).filter(([key]) => isNaN(Number(key))).map(([key, value]) => (
                <option key={value} value={value}>{getTypeLabel(value)}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={activeFilter === null ? '' : activeFilter.toString()}
              onChange={(e) => setActiveFilter(e.target.value === '' ? null : e.target.value === 'true')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">موضوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">پیش‌فرض</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    هیچ قالبی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-gray-500">{template.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getTypeLabel(template.type)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{template.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 ml-1" />
                          فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-4 h-4 ml-1" />
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <StarIcon className="w-4 h-4 ml-1" />
                          پیش‌فرض
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="پیش‌نمایش"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="ویرایش"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleSetDefault(template.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="تنظیم به عنوان پیش‌فرض"
                          >
                            <StarIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(template.id)}
                          className={template.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                          title={template.isActive ? "غیرفعال کردن" : "فعال کردن"}
                        >
                          {template.isActive ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">ایجاد قالب ایمیل جدید</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام قالب</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="نام قالب"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع قالب</label>
                <SearchableSelect
                  options={Object.entries(EmailTemplateType)
                    .filter(([key]) => isNaN(Number(key)))
                    .map(([key, value]) => ({
                      value: value.toString(),
                      label: getTypeLabel(value)
                    }))}
                  value={newTemplate.type.toString()}
                  onChange={(value) => setNewTemplate({ ...newTemplate, type: Number(value) as EmailTemplateType })}
                  placeholder="انتخاب نوع قالب"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">موضوع ایمیل</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="موضوع ایمیل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                <textarea
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                  placeholder="توضیحات (اختیاری)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">محتوای HTML</label>
                <textarea
                  value={newTemplate.htmlBody}
                  onChange={(e) => setNewTemplate({ ...newTemplate, htmlBody: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  rows={10}
                  placeholder="محتوای HTML قالب"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">محتوای متنی (اختیاری)</label>
                <textarea
                  value={newTemplate.textBody || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, textBody: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  rows={5}
                  placeholder="محتوای متنی قالب (برای ایمیل‌های بدون HTML)"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTemplate.isActive}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.checked })}
                    className="ml-2"
                  />
                  <span className="text-sm text-gray-700">فعال</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTemplate.isDefault}
                    onChange={(e) => setNewTemplate({ ...newTemplate, isDefault: e.target.checked })}
                    className="ml-2"
                  />
                  <span className="text-sm text-gray-700">پیش‌فرض</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'در حال ایجاد...' : 'ایجاد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">ویرایش قالب ایمیل</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام قالب</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع قالب</label>
                <input
                  type="text"
                  value={getTypeLabel(editingTemplate.type)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">موضوع ایمیل</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                <textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">محتوای HTML</label>
                <textarea
                  value={editingTemplate.htmlBody}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlBody: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  rows={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">محتوای متنی (اختیاری)</label>
                <textarea
                  value={editingTemplate.textBody || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, textBody: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  rows={5}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingTemplate.isActive}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                    className="ml-2"
                  />
                  <span className="text-sm text-gray-700">فعال</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={handleUpdateTemplate}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'در حال بروزرسانی...' : 'بروزرسانی'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">پیش‌نمایش قالب ایمیل</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{previewTemplate.subject}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  <div>نوع: {getTypeLabel(previewTemplate.type)}</div>
                  <div>نام: {previewTemplate.name}</div>
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.htmlBody }} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={cancel}
        onConfirm={confirm}
        title={modalConfig?.title}
        message={modalConfig?.message || ''}
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        type={modalConfig?.type}
        showCancel={modalConfig?.showCancel}
        isRtl={modalConfig?.isRtl}
      />
    </div>
  );
}

