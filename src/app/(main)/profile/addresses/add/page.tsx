'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAddressApi, CreateUserAddressRequest, UpdateUserAddressRequest, UserAddressDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { Spinner } from '@/components/ui/spinner';
import UserLayout from '@/components/UserLayout';
import { useLoading } from '@/providers/LoadingProvider';

function AddAddressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = searchParams.get('id');
  const isEdit = !!addressId;
  const { user } = useAuth();
  const { successPersian, errorPersian } = useToastHelpers();
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();

  const { data: addressResponse, isLoading: isLoadingAddress } = useQuery({
    queryKey: ['user-address', addressId],
    queryFn: async () => {
      if (!addressId) return null;
      const response = await userAddressApi.getById(addressId);
      return response.data;
    },
    enabled: !!addressId && isEdit && typeof window !== 'undefined',
  });

  const address: UserAddressDto | undefined = addressResponse?.data;

  const [formData, setFormData] = useState<CreateUserAddressRequest | UpdateUserAddressRequest>({
    ...(isEdit ? { id: addressId! } : {}),
    firstName: address?.firstName || '',
    lastName: address?.lastName || '',
    address: address?.address || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'ایران',
    phoneNumber: address?.phoneNumber || '',
    label: address?.label || '',
    isDefault: address?.isDefault || false,
  });

  React.useEffect(() => {
    if (address && isEdit) {
      setFormData({
        id: address.id,
        firstName: address.firstName,
        lastName: address.lastName,
        address: address.address,
        city: address.city,
        state: address.state || '',
        postalCode: address.postalCode,
        country: address.country,
        phoneNumber: address.phoneNumber || '',
        label: address.label || '',
        isDefault: address.isDefault,
      });
    }
  }, [address, isEdit]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserAddressRequest) => {
      const response = await userAddressApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      successPersian('آدرس با موفقیت ایجاد شد');
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      setTimeout(() => {
        startLoading('در حال بازگشت...', true, 'high');
        setTimeout(() => {
          window.location.href = '/profile?tab=addresses';
        }, 500);
      }, 1500);
    },
    onError: (error: any) => {
      stopLoading();
      errorPersian(error.response?.data?.message || 'خطا در ایجاد آدرس');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserAddressRequest) => {
      const response = await userAddressApi.update(data);
      return response.data;
    },
    onSuccess: () => {
      successPersian('آدرس با موفقیت به‌روزرسانی شد');
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      startLoading('در حال بازگشت...', true, 'high');
      setTimeout(() => {
        window.location.href = '/profile?tab=addresses';
      }, 500);
    },
    onError: (error: any) => {
      stopLoading();
      errorPersian(error.response?.data?.message || 'خطا در به‌روزرسانی آدرس');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate(formData as UpdateUserAddressRequest);
    } else {
      createMutation.mutate(formData as CreateUserAddressRequest);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleTabSwitch = (tab: string) => {
    router.push(`/profile?tab=${tab}`);
  };

  const userStats = {
    totalOrders: 0,
    totalSpent: 0,
    memberSince: user?.dateJoined || new Date().toISOString()
  };

  if (isLoadingAddress && isEdit) {
    return (
      <UserLayout
        activeTab="addresses"
        onTabChange={handleTabSwitch}
        user={user}
        userStats={userStats}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" text="در حال بارگذاری آدرس..." />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout
      activeTab="addresses"
      onTabChange={handleTabSwitch}
      user={user}
      userStats={userStats}
    >
      <div>
        {/* Professional Address Header */}
        <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-rose-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">
                    {isEdit ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">
                    {isEdit ? 'ویرایش اطلاعات آدرس' : 'افزودن آدرس جدید برای ارسال'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    window.location.href = '/profile?tab=addresses';
                  }}
                  variant="outline"
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
                >
                  <ArrowRight className="h-4 w-4 ml-1" />
                  بازگشت
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 lg:space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">نام *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">نام خانوادگی *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">آدرس *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">شهر *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">استان</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">کد پستی *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">کشور *</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">شماره تلفن</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">برچسب (مثلاً: خانه، محل کار)</label>
                      <input
                        type="text"
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        placeholder="خانه"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                      className="ml-2"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium">
                      تنظیم به عنوان آدرس پیش‌فرض
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        window.location.href = '/profile?tab=addresses';
                      }}
                    >
                      انصراف
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                          در حال ذخیره...
                        </>
                      ) : (
                        isEdit ? 'ذخیره تغییرات' : 'افزودن آدرس'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default function AddAddressPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" text="در حال بارگذاری..." />
      </div>
    }>
      <AddAddressContent />
    </Suspense>
  );
}

