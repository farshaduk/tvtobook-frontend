'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAddressApi, UserAddressDto } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { toPersianNumber } from '@/utils/numberUtils';
import { useConfirmation } from '@/hooks/useConfirmationMo';
import { useToastHelpers } from '@/hooks/useToastHelpers';

const AddressesPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToastHelpers();
  const { showConfirmation } = useConfirmation();
  const queryClient = useQueryClient();

  const { data: addressesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: async () => {
      const response = await userAddressApi.getAll();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const addresses: UserAddressDto[] = addressesResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await userAddressApi.delete(addressId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      refetch();
      toast.success('آدرس با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در حذف آدرس');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await userAddressApi.setDefault(addressId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      refetch();
      toast.success('آدرس پیش‌فرض با موفقیت تنظیم شد');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در تنظیم آدرس پیش‌فرض');
    },
  });

  const handleDelete = (address: UserAddressDto) => {
    showConfirmation({
      title: 'حذف آدرس',
      message: 'آیا از حذف این آدرس اطمینان دارید؟',
      confirmText: 'حذف',
      cancelText: 'انصراف',
      type: 'warning',
      onConfirm: () => {
        deleteMutation.mutate(address.id);
      },
    });
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  const handleEdit = (address: UserAddressDto) => {
    router.push(`/profile/addresses/add?id=${address.id}`);
  };

  const handleAdd = () => {
    router.push('/profile/addresses/add');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" text="در حال بارگذاری آدرس‌ها..." />
      </div>
    );
  }

  return (
    <div>
      {/* Professional Addresses Header */}
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-600 to-rose-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full animate-shimmer"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-right">آدرس‌های من</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">مدیریت آدرس‌های ارسال</p>
              </div>
              <Button
                onClick={handleAdd}
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4 ml-1" />
                افزودن آدرس جدید
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {/* Addresses List */}
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">شما هنوز آدرسی ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mb-4">برای افزودن آدرس جدید، روی دکمه "افزودن آدرس جدید" کلیک کنید</p>
              <Button onClick={handleAdd} variant="outline">
                <Plus className="h-4 w-4 ml-1" />
                افزودن آدرس جدید
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {addresses.map((address) => (
                <Card key={address.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">
                            {address.label || `${address.firstName} ${address.lastName}`}
                          </CardTitle>
                          {address.isDefault && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              پیش‌فرض
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-medium">{address.firstName} {address.lastName}</p>
                          <p>{address.address}</p>
                          <p>{address.city}، {address.state}</p>
                          <p>کد پستی: {toPersianNumber(address.postalCode)}</p>
                          <p>کشور: {address.country}</p>
                          {address.phoneNumber && (
                            <p>تلفن: {toPersianNumber(address.phoneNumber)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          تنظیم به عنوان پیش‌فرض
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(address)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressesPage;

