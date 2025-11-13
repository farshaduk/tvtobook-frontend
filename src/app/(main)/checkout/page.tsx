'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  MapPin, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCartStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext'
import { useRequireAuth } from '@/contexts/AuthContext'
import { orderApi, paymentApi, userAddressApi, UserAddressDto, couponApi, ValidateCouponResponse } from '@/services/api'
import { useToast } from '@/components/ui/toast'
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils'
import { useQuery } from '@tanstack/react-query'

const checkoutSchema = z.object({
  selectedAddressId: z.string().optional(),
  address: z.string().min(5, 'آدرس باید حداقل 5 کاراکتر باشد'),
  city: z.string().min(2, 'شهر باید حداقل 2 کاراکتر باشد'),
  state: z.string().min(2, 'استان باید حداقل 2 کاراکتر باشد'),
  zipCode: z.string().min(5, 'کد پستی باید حداقل 5 کاراکتر باشد'),
  country: z.string().min(2, 'کشور باید حداقل 2 کاراکتر باشد'),
  phone: z.string().min(10, 'شماره تلفن باید حداقل 10 رقم باشد'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user } = useAuth()
  useRequireAuth('/login')

  const { data: addressesResponse } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: async () => {
      const response = await userAddressApi.getAll();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const addresses: UserAddressDto[] = addressesResponse?.data || [];
  const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'ایران',
      selectedAddressId: defaultAddress?.id || '',
      address: defaultAddress?.address || '',
      city: defaultAddress?.city || '',
      state: defaultAddress?.state || '',
      zipCode: defaultAddress?.postalCode || '',
      phone: defaultAddress?.phoneNumber || '',
    },
  })

  const handleAddressSelect = (addressId: string) => {
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setValue('selectedAddressId', addressId);
      setValue('address', address.address);
      setValue('city', address.city);
      setValue('state', address.state || '');
      setValue('zipCode', address.postalCode);
      setValue('country', address.country);
      setValue('phone', address.phoneNumber || '');
    }
  }

  React.useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      handleAddressSelect(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddressId]);

  // Frontend calculation for display only (estimates) - backend calculates actual values
  const subtotal = getTotalPrice()
  const tax = subtotal * 0.10
  const discountAmount = appliedCoupon?.discountAmount || 0
  const total = subtotal + tax - discountAmount
  const { showToast } = useToast()

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      showToast({ type: 'error', title: 'لطفاً کد کوپن را وارد کنید' })
      return
    }

    setIsValidatingCoupon(true)
    try {
      const productIds = items.map(item => item.product.id)
      const response = await couponApi.validate({
        code: couponCode.trim().toUpperCase(),
        orderAmount: subtotal,
        productIds: productIds
      })

      if (response.data.isSucceeded && response.data.data?.isValid) {
        setAppliedCoupon(response.data.data)
        showToast({ type: 'success', title: 'کوپن با موفقیت اعمال شد' })
      } else {
        showToast({ type: 'error', title: response.data.data?.errorMessage || 'کوپن نامعتبر است' })
        setAppliedCoupon(null)
      }
    } catch (error: any) {
      showToast({ type: 'error', title: error.response?.data?.message || 'خطا در اعتبارسنجی کوپن' })
      setAppliedCoupon(null)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true)
    
    try {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      const firstName = selectedAddress?.firstName || user?.firstName?.split(' ')[0] || '';
      const lastName = selectedAddress?.lastName || user?.lastName?.split(' ')[1] || '';

      // Create order (backend reads from cart and calculates all totals)
      const orderResponse = await orderApi.create({
        items: [],
        shippingFirstName: firstName,
        shippingLastName: lastName,
        shippingAddress: data.address,
        shippingCity: data.city,
        shippingState: data.state,
        shippingPostalCode: data.zipCode,
        shippingCountry: data.country,
        shippingPhoneNumber: data.phone,
        paymentMethod: 'CreditCard',
        couponCode: appliedCoupon ? couponCode : undefined,
        notes: 'پرداخت از طریق درگاه پرداخت'
      })

      if (!orderResponse.data.isSucceeded) {
        showToast({ type: 'error', title: orderResponse.data.message || 'خطا در ایجاد سفارش' })
        setIsProcessing(false)
        return
      }

      const order = orderResponse.data.data

      // Create payment using backend calculated totalAmount
      const paymentResponse = await paymentApi.create({
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'IRR',
        paymentMethod: 'CreditCard',
        description: `Payment for order ${order.orderNumber}`
      })

      if (!paymentResponse.data.isSucceeded) {
        showToast({ type: 'error', title: paymentResponse.data.message || 'خطا در ایجاد پرداخت' })
        return
      }

      // Process payment (simulate - in real scenario, this would be done by payment gateway callback)
      await paymentApi.process({
        paymentId: paymentResponse.data.data.id,
        status: 'Completed',
        gatewayTransactionId: `TXN-${Date.now()}`,
        receiptUrl: `https://receipt.example.com/${paymentResponse.data.data.id}`
      })

      showToast({ type: 'success', title: 'سفارش شما با موفقیت ثبت شد!' })
      
      // Clear cart and show success
      clearCart()
      setIsComplete(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/profile?tab=orders')
      }, 3000)
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      showToast({ type: 'error', title: error.response?.data?.message || 'خطا در پردازش سفارش' })
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0 && !isComplete) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">سبد خرید شما خالی است</h1>
        <p className="text-muted-foreground mb-6">
          قبل از پرداخت، محصولاتی به سبد خرید خود اضافه کنید.
        </p>
        <Button onClick={() => router.push('/shop')}>
          رفتن به فروشگاه
        </Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">سفارش تکمیل شد!</h1>
          <p className="text-muted-foreground mb-6">
            از خرید شما متشکریم. به زودی ایمیل تأیید برای شما ارسال خواهد شد.
          </p>
          <Button onClick={() => router.push('/profile?tab=orders')}>
            مشاهده تاریخچه سفارشات
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/cart')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          بازگشت به سبد خرید
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تکمیل سفارش</h1>
          <p className="text-muted-foreground">
            خرید خود را به صورت ایمن تکمیل کنید
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                آدرس ارسال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">انتخاب آدرس</label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => handleAddressSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label || `${address.firstName} ${address.lastName}`} - {address.city}
                        {address.isDefault && ' (پیش‌فرض)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">آدرس *</label>
                <Input
                  {...register('address')}
                  placeholder="آدرس کامل"
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">شهر *</label>
                  <Input
                    {...register('city')}
                    placeholder="شهر"
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">استان *</label>
                  <Input
                    {...register('state')}
                    placeholder="استان"
                    className={errors.state ? 'border-destructive' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">کد پستی *</label>
                  <Input
                    {...register('zipCode')}
                    placeholder="کد پستی"
                    className={errors.zipCode ? 'border-destructive' : ''}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.zipCode.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">کشور *</label>
                  <Input
                    {...register('country')}
                    placeholder="کشور"
                    className={errors.country ? 'border-destructive' : ''}
                  />
                  {errors.country && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">شماره تلفن *</label>
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="شماره تلفن"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3">
                    <div className="w-12 h-16 overflow-hidden rounded bg-muted">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.title}</p>
                      <p className="text-xs text-muted-foreground">تعداد: {toPersianNumber(item.quantity)}</p>
                    </div>
                    <div className="text-left">
                      {((item.product as any).selectedFormat?.finalPrice || (item.product as any).selectedFormat?.price || item.product.price) && (
                        <>
                          {((item.product as any).selectedFormat?.discountPrice || (item.product as any).selectedFormat?.hasDiscount) && (
                            <p className="text-xs text-muted-foreground line-through">
                              {toPersianCurrency(((item.product as any).selectedFormat?.price || item.product.price) * item.quantity)}
                            </p>
                          )}
                          <p className="font-medium">
                            {toPersianCurrency(((item.product as any).selectedFormat?.finalPrice || (item.product as any).selectedFormat?.price || item.product.price) * item.quantity)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="border-t pt-4 space-y-3">
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">کد تخفیف</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleValidateCoupon()}
                        placeholder="کد کوپن را وارد کنید"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        variant="outline"
                        size="sm"
                      >
                        {isValidatingCoupon ? '...' : 'اعمال'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">کوپن اعمال شده:</p>
                        <p className="text-sm text-green-600">{appliedCoupon.coupon?.name || couponCode}</p>
                        <p className="text-xs text-green-500 mt-1">
                          تخفیف: {toPersianCurrency(appliedCoupon.discountAmount)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleRemoveCoupon}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>جمع کل</span>
                  <span>{toPersianCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>تخفیف</span>
                    <span>-{toPersianCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>مالیات</span>
                  <span>{toPersianCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>مجموع</span>
                  <span>{toPersianCurrency(Math.max(0, total))}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? 'در حال پردازش...' : `تکمیل سفارش - ${toPersianCurrency(total)}`}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                <p>با تکمیل این سفارش، شما با شرایط استفاده ما موافقت می‌کنید</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

