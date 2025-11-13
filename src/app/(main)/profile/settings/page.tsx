'use client';

import React, { useState, useEffect } from 'react';
import { User, Settings, Shield, Eye, Mail, Phone, Calendar, Edit3, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useConfirmation } from '@/hooks/useConfirmationMo';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, UpdateUserProfileRequest } from '@/services/api';
import { useToastHelpers } from '@/hooks/useToastHelpers';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showConfirmation, showWarning, showError, showSuccess, showInfo } = useConfirmation();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  // Profile form states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');

  // OTP states
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('fa');
  const [publicProfile, setPublicProfile] = useState(true);
  const [showReadingActivity, setShowReadingActivity] = useState(true);
  const [showWishlist, setShowWishlist] = useState(false);

  const sendEmailOtpMutation = useMutation({
    mutationFn: (email: string) => authApi.sendOtpForProfileUpdate({ emailOrPhone: email, type: 'email' }),
    onSuccess: () => {
      toast.successPersian('کد تأیید به ایمیل شما ارسال شد');
      setEmailOtpSent(true);
      setShowEmailOtp(true);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ارسال کد تأیید');
    },
  });

  const sendPhoneOtpMutation = useMutation({
    mutationFn: (phone: string) => authApi.sendOtpForProfileUpdate({ emailOrPhone: phone, type: 'phone' }),
    onSuccess: () => {
      toast.successPersian('کد تأیید به شماره تلفن شما ارسال شد');
      setPhoneOtpSent(true);
      setShowPhoneOtp(true);
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ارسال کد تأیید');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateUserProfileRequest) => authApi.updateProfile(data),
    onSuccess: (response) => {
      if (response.data.isSucceeded && response.data.data) {
        updateUser(response.data.data);
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        toast.successPersian('اطلاعات پروفایل با موفقیت بروزرسانی شد');
        setShowEmailOtp(false);
        setShowPhoneOtp(false);
        setEmailOtpCode('');
        setPhoneOtpCode('');
        setEmailOtpSent(false);
        setPhoneOtpSent(false);
      }
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در بروزرسانی پروفایل');
    },
  });

  const handleSendEmailOtp = () => {
    if (!email || email === user?.email) {
      toast.errorPersian('لطفاً ایمیل جدید را وارد کنید');
      return;
    }
    sendEmailOtpMutation.mutate(email);
  };

  const handleSendPhoneOtp = () => {
    if (!phoneNumber || phoneNumber === user?.phoneNumber) {
      toast.errorPersian('لطفاً شماره تلفن جدید را وارد کنید');
      return;
    }
    sendPhoneOtpMutation.mutate(phoneNumber);
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const handleSave = () => {
    const updateData: UpdateUserProfileRequest = {
      firstName: firstName !== user?.firstName ? firstName : undefined,
      lastName: lastName !== user?.lastName ? lastName : undefined,
      city: city || undefined,
      province: province || undefined,
    };

    if (email !== user?.email) {
      if (!emailOtpCode) {
        toast.errorPersian('برای تغییر ایمیل، کد تأیید الزامی است');
        return;
      }
      updateData.email = email;
      updateData.emailOtpCode = emailOtpCode;
    }

    if (phoneNumber !== user?.phoneNumber) {
      if (!phoneOtpCode) {
        toast.errorPersian('برای تغییر شماره تلفن، کد تأیید الزامی است');
        return;
      }
      updateData.phoneNumber = phoneNumber;
      updateData.phoneOtpCode = phoneOtpCode;
    }

    updateProfileMutation.mutate(updateData);
  };

  return (
    <div>
      {/* Professional Settings Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-gray-600 via-slate-600 via-zinc-600 to-neutral-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 lg:space-x-4 mb-3 lg:mb-4 rtl:space-x-reverse">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">تنظیمات حساب</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">⚙️ مدیریت اطلاعات شخصی و تنظیمات حساب کاربری 🔧</p>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Personal Information Settings */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">اطلاعات شخصی</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">نام</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">نام خانوادگی</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value !== user?.email) {
                          setShowEmailOtp(false);
                          setEmailOtpSent(false);
                          setEmailOtpCode('');
                        }
                      }}
                      className="flex-1"
                    />
                    {email !== user?.email && !emailOtpSent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendEmailOtp}
                        disabled={sendEmailOtpMutation.isPending}
                      >
                        {sendEmailOtpMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'ارسال کد'
                        )}
                      </Button>
                    )}
                  </div>
                  {showEmailOtp && (
                    <div className="mt-2">
                      <Input
                        placeholder="کد تأیید ایمیل"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">شماره تلفن</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (e.target.value !== user?.phoneNumber) {
                          setShowPhoneOtp(false);
                          setPhoneOtpSent(false);
                          setPhoneOtpCode('');
                        }
                      }}
                      className="flex-1"
                    />
                    {phoneNumber !== user?.phoneNumber && !phoneOtpSent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendPhoneOtp}
                        disabled={sendPhoneOtpMutation.isPending}
                      >
                        {sendPhoneOtpMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'ارسال کد'
                        )}
                      </Button>
                    )}
                  </div>
                  {showPhoneOtp && (
                    <div className="mt-2">
                      <Input
                        placeholder="کد تأیید شماره تلفن"
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value)}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bio">درباره من</Label>
                  <Textarea
                    id="bio"
                    placeholder="درباره خودتان بنویسید..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Account Settings */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">تنظیمات حساب</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>حالت تاریک</Label>
                    <p className="text-sm text-gray-500">استفاده از تم تاریک</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>نمایش عمومی پروفایل</Label>
                    <p className="text-sm text-gray-500">اجازه مشاهده پروفایل توسط دیگران</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicProfile}
                    onChange={(e) => setPublicProfile(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>نمایش فعالیت مطالعه</Label>
                    <p className="text-sm text-gray-500">نمایش فعالیت‌های مطالعه در پروفایل</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showReadingActivity}
                    onChange={(e) => setShowReadingActivity(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>نمایش لیست علاقه‌مندی‌ها</Label>
                    <p className="text-sm text-gray-500">نمایش لیست علاقه‌مندی‌ها در پروفایل</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWishlist}
                    onChange={(e) => setShowWishlist(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Notification Settings */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">تنظیمات اعلان‌ها</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>اعلان‌های ایمیل</Label>
                    <p className="text-sm text-gray-500">دریافت اعلان‌ها از طریق ایمیل</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>اعلان‌های پیامک</Label>
                    <p className="text-sm text-gray-500">دریافت اعلان‌ها از طریق پیامک</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="language">زبان</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fa">فارسی</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 sm:mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">امنیت</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>تغییر رمز عبور</Label>
                  <p className="text-sm text-gray-500">تغییر رمز عبور حساب کاربری</p>
                </div>
                <Button variant="outline" size="sm">
                  تغییر رمز عبور
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>احراز هویت دو مرحله‌ای</Label>
                  <p className="text-sm text-gray-500">افزایش امنیت حساب کاربری</p>
                </div>
                <Button variant="outline" size="sm">
                  فعال‌سازی
                </Button>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setFirstName(user?.firstName || '');
                setLastName(user?.lastName || '');
                setEmail(user?.email || '');
                setPhoneNumber(user?.phoneNumber || '');
                setCity('');
                setProvince('');
                setShowEmailOtp(false);
                setShowPhoneOtp(false);
                setEmailOtpCode('');
                setPhoneOtpCode('');
                setEmailOtpSent(false);
                setPhoneOtpSent(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              لغو
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  ذخیره تغییرات
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

