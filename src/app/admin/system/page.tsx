'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { siteSettingsApi, SiteSetting, UpdateSiteSettingRequest } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { 
  CogIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  LinkIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  KeyIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

const AdminSystemPage: React.FC = () => {
  const { successPersian, errorPersian } = useToastHelpers();
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'contact' | 'social' | 'system' | 'security' | 'features'>('general');
  const [formData, setFormData] = useState<UpdateSiteSettingRequest>({
    frontendUrl: '',
    backendUrl: '',
    apiBaseUrl: '',
    cdnUrl: '',
    siteTitle: '',
    siteDescription: '',
    metaKeywords: '',
    siteLogoUrl: '',
    faviconUrl: '',
    openGraphImageUrl: '',
    siteAuthor: '',
    defaultLanguage: 'fa',
    businessName: '',
    contactEmail: '',
    supportEmail: '',
    contactPhone: '',
    businessAddress: '',
    copyrightText: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    telegramUrl: '',
    linkedInUrl: '',
    maintenanceMode: false,
    siteActive: true,
    maxFileUploadSizeMB: 10,
    allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx',
    defaultCurrency: 'IRR',
    timezone: 'Asia/Tehran',
    googleAnalyticsId: '',
    googleTagManagerId: '',
    facebookPixelId: '',
    termsOfServiceUrl: '',
    privacyPolicyUrl: '',
    cookiePolicyUrl: '',
    enableRegistration: true,
    enableGuestPosting: false,
    enableMessaging: false,
    enableReviews: false,
    enableOtpOnlyLogin: true,
    maxActiveSessionsPerUser: 3,
    globalDeviceLimit: 3,
    enableSessionLimitEnforcement: true
  });

  const { data: settingsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const response = await siteSettingsApi.get();
      return response.data;
    },
    retry: 2,
  });

  useEffect(() => {
    if (settingsResponse) {
      const data = settingsResponse as any;
      if (data?.data) {
        const settings = data.data;
        setFormData({
          frontendUrl: settings.frontendUrl || '',
          backendUrl: settings.backendUrl || '',
          apiBaseUrl: settings.apiBaseUrl || '',
          cdnUrl: settings.cdnUrl || '',
          siteTitle: settings.siteTitle || '',
          siteDescription: settings.siteDescription || '',
          metaKeywords: settings.metaKeywords || '',
          siteLogoUrl: settings.siteLogoUrl || '',
          faviconUrl: settings.faviconUrl || '',
          openGraphImageUrl: settings.openGraphImageUrl || '',
          siteAuthor: settings.siteAuthor || '',
          defaultLanguage: settings.defaultLanguage || 'fa',
          businessName: settings.businessName || '',
          contactEmail: settings.contactEmail || '',
          supportEmail: settings.supportEmail || '',
          contactPhone: settings.contactPhone || '',
          businessAddress: settings.businessAddress || '',
          copyrightText: settings.copyrightText || '',
          facebookUrl: settings.facebookUrl || '',
          twitterUrl: settings.twitterUrl || '',
          instagramUrl: settings.instagramUrl || '',
          telegramUrl: settings.telegramUrl || '',
          linkedInUrl: settings.linkedInUrl || '',
          maintenanceMode: settings.maintenanceMode || false,
          siteActive: settings.siteActive !== false,
          maxFileUploadSizeMB: settings.maxFileUploadSizeMB || 10,
          allowedFileTypes: settings.allowedFileTypes || 'jpg,jpeg,png,gif,pdf,doc,docx',
          defaultCurrency: settings.defaultCurrency || 'IRR',
          timezone: settings.timezone || 'Asia/Tehran',
          googleAnalyticsId: settings.googleAnalyticsId || '',
          googleTagManagerId: settings.googleTagManagerId || '',
          facebookPixelId: settings.facebookPixelId || '',
          termsOfServiceUrl: settings.termsOfServiceUrl || '',
          privacyPolicyUrl: settings.privacyPolicyUrl || '',
          cookiePolicyUrl: settings.cookiePolicyUrl || '',
          enableRegistration: settings.enableRegistration !== false,
          enableGuestPosting: settings.enableGuestPosting || false,
          enableMessaging: settings.enableMessaging || false,
          enableReviews: settings.enableReviews || false,
          enableOtpOnlyLogin: settings.enableOtpOnlyLogin !== false,
          maxActiveSessionsPerUser: settings.maxActiveSessionsPerUser || 3,
          globalDeviceLimit: settings.globalDeviceLimit || 3,
          enableSessionLimitEnforcement: settings.enableSessionLimitEnforcement !== false
        });
      }
    }
  }, [settingsResponse]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSiteSettingRequest) => siteSettingsApi.update(data),
    onSuccess: (response) => {
      successPersian((response.data as any).message || 'تنظیمات با موفقیت بروزرسانی شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در بروزرسانی تنظیمات');
    },
  });

  const initializeMutation = useMutation({
    mutationFn: () => siteSettingsApi.initialize(),
    onSuccess: (response) => {
      successPersian((response.data as any).message || 'تنظیمات پیشفرض با موفقیت ایجاد شد');
      refetch();
    },
    onError: (err: any) => {
      errorPersian(err.response?.data?.message || 'خطا در ایجاد تنظیمات پیشفرض');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof UpdateSiteSettingRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'عمومی', icon: GlobeAltIcon },
    { id: 'seo', label: 'SEO و متا', icon: ChartBarIcon },
    { id: 'contact', label: 'اطلاعات تماس', icon: BuildingOfficeIcon },
    { id: 'social', label: 'شبکه‌های اجتماعی', icon: LinkIcon },
    { id: 'system', label: 'سیستم', icon: ServerIcon },
    { id: 'security', label: 'امنیت', icon: ShieldCheckIcon },
    { id: 'features', label: 'ویژگی‌ها', icon: CogIcon }
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تنظیمات سیستم</h1>
            <p className="text-gray-600 mt-2">مدیریت تنظیمات کلی سیستم</p>
          </div>
          <button
            onClick={() => initializeMutation.mutate()}
            disabled={initializeMutation.isPending}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {initializeMutation.isPending ? 'در حال ایجاد...' : 'ایجاد تنظیمات پیشفرض'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تنظیمات عمومی</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عنوان سایت</label>
                  <input
                    type="text"
                    value={formData.siteTitle}
                    onChange={(e) => handleInputChange('siteTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نام کسب‌وکار</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات سایت</label>
                  <textarea
                    value={formData.siteDescription}
                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نویسنده</label>
                  <input
                    type="text"
                    value={formData.siteAuthor}
                    onChange={(e) => handleInputChange('siteAuthor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">زبان پیشفرض</label>
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="fa">فارسی</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">متن کپی‌رایت</label>
                  <input
                    type="text"
                    value={formData.copyrightText}
                    onChange={(e) => handleInputChange('copyrightText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تنظیمات SEO</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">کلمات کلیدی متا</label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                    placeholder="کلمات کلیدی را با کاما جدا کنید"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس لوگو</label>
                  <input
                    type="url"
                    value={formData.siteLogoUrl}
                    onChange={(e) => handleInputChange('siteLogoUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس Favicon</label>
                  <input
                    type="url"
                    value={formData.faviconUrl}
                    onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس تصویر Open Graph</label>
                  <input
                    type="url"
                    value={formData.openGraphImageUrl}
                    onChange={(e) => handleInputChange('openGraphImageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
                  <input
                    type="text"
                    value={formData.googleAnalyticsId}
                    onChange={(e) => handleInputChange('googleAnalyticsId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Tag Manager ID</label>
                  <input
                    type="text"
                    value={formData.googleTagManagerId}
                    onChange={(e) => handleInputChange('googleTagManagerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={formData.facebookPixelId}
                    onChange={(e) => handleInputChange('facebookPixelId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">اطلاعات تماس</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ایمیل تماس</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ایمیل پشتیبانی</label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">شماره تماس</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس کسب‌وکار</label>
                  <textarea
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">لینک شرایط استفاده</label>
                  <input
                    type="url"
                    value={formData.termsOfServiceUrl}
                    onChange={(e) => handleInputChange('termsOfServiceUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">لینک حریم خصوصی</label>
                  <input
                    type="url"
                    value={formData.privacyPolicyUrl}
                    onChange={(e) => handleInputChange('privacyPolicyUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">لینک سیاست کوکی</label>
                  <input
                    type="url"
                    value={formData.cookiePolicyUrl}
                    onChange={(e) => handleInputChange('cookiePolicyUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">شبکه‌های اجتماعی</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                  <input
                    type="url"
                    value={formData.facebookUrl}
                    onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter URL</label>
                  <input
                    type="url"
                    value={formData.twitterUrl}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                  <input
                    type="url"
                    value={formData.instagramUrl}
                    onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telegram URL</label>
                  <input
                    type="url"
                    value={formData.telegramUrl}
                    onChange={(e) => handleInputChange('telegramUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedInUrl}
                    onChange={(e) => handleInputChange('linkedInUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تنظیمات سیستم</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس Frontend</label>
                  <input
                    type="url"
                    value={formData.frontendUrl}
                    onChange={(e) => handleInputChange('frontendUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس Backend</label>
                  <input
                    type="url"
                    value={formData.backendUrl}
                    onChange={(e) => handleInputChange('backendUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس API</label>
                  <input
                    type="url"
                    value={formData.apiBaseUrl}
                    onChange={(e) => handleInputChange('apiBaseUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس CDN</label>
                  <input
                    type="url"
                    value={formData.cdnUrl}
                    onChange={(e) => handleInputChange('cdnUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر حجم فایل (MB)</label>
                  <input
                    type="number"
                    value={formData.maxFileUploadSizeMB}
                    onChange={(e) => handleInputChange('maxFileUploadSizeMB', parseInt(e.target.value) || 10)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">انواع فایل مجاز</label>
                  <input
                    type="text"
                    value={formData.allowedFileTypes}
                    onChange={(e) => handleInputChange('allowedFileTypes', e.target.value)}
                    placeholder="jpg,jpeg,png,gif,pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ارز پیشفرض</label>
                  <input
                    type="text"
                    value={formData.defaultCurrency}
                    onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">منطقه زمانی</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                      حالت تعمیرات
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="siteActive"
                      checked={formData.siteActive}
                      onChange={(e) => handleInputChange('siteActive', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="siteActive" className="text-sm font-medium text-gray-700">
                      سایت فعال است
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تنظیمات امنیت</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableOtpOnlyLogin"
                    checked={formData.enableOtpOnlyLogin}
                    onChange={(e) => handleInputChange('enableOtpOnlyLogin', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableOtpOnlyLogin" className="text-sm font-medium text-gray-700">
                    فقط ورود با OTP
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">حداکثر جلسات فعال هر کاربر</label>
                    <input
                      type="number"
                      value={formData.maxActiveSessionsPerUser}
                      onChange={(e) => handleInputChange('maxActiveSessionsPerUser', parseInt(e.target.value) || 3)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">حد مجاز دستگاه‌های جهانی</label>
                    <input
                      type="number"
                      value={formData.globalDeviceLimit}
                      onChange={(e) => handleInputChange('globalDeviceLimit', parseInt(e.target.value) || 3)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableSessionLimitEnforcement"
                        checked={formData.enableSessionLimitEnforcement}
                        onChange={(e) => handleInputChange('enableSessionLimitEnforcement', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="enableSessionLimitEnforcement" className="text-sm font-medium text-gray-700">
                        فعال‌سازی محدودیت جلسات
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ویژگی‌های سیستم</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableRegistration"
                    checked={formData.enableRegistration}
                    onChange={(e) => handleInputChange('enableRegistration', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableRegistration" className="text-sm font-medium text-gray-700">
                    فعال‌سازی ثبت‌نام
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableGuestPosting"
                    checked={formData.enableGuestPosting}
                    onChange={(e) => handleInputChange('enableGuestPosting', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableGuestPosting" className="text-sm font-medium text-gray-700">
                    ارسال توسط مهمان
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableMessaging"
                    checked={formData.enableMessaging}
                    onChange={(e) => handleInputChange('enableMessaging', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableMessaging" className="text-sm font-medium text-gray-700">
                    فعال‌سازی پیام‌رسانی
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableReviews"
                    checked={formData.enableReviews}
                    onChange={(e) => handleInputChange('enableReviews', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableReviews" className="text-sm font-medium text-gray-700">
                    فعال‌سازی نظرات
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSystemPage;

