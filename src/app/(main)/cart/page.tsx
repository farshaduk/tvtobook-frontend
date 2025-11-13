'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner, TvtoBookSpinner } from '@/components/ui/spinner'
import { useCartStore } from '@/store'
import { useLoading } from '@/providers/LoadingProvider'
import { useAuth } from '@/contexts/AuthContext'
import { toPersianNumber, toPersianCurrency } from '@/utils/numberUtils'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart, syncCart } = useCartStore()
  const { startLoading, stopLoading } = useLoading()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  // Sync cart from database when authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      syncCart()
    }
  }, [authLoading, isAuthenticated, syncCart])
  
  // Clear cart if user is not authenticated (but not during initial auth check)
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated && items.length > 0) {
      clearCart()
    }
  }, [authLoading, isAuthenticated, items.length, clearCart])

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    startLoading('در حال به‌روزرسانی سبد خرید...', true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
    stopLoading()
  }

  const subtotal = getTotalPrice()
  const tax = subtotal * 0.10 // 10% tax
  const total = subtotal + tax

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">سبد خرید شما خالی است</h1>
          <p className="text-muted-foreground mb-6">
            به نظر می‌رسد هنوز هیچ آیتمی به سبد خرید خود اضافه نکرده‌اید.
          </p>
          <Link href="/shop">
            <Button size="lg">
              شروع خرید
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">سبد خرید</h1>
          <p className="text-muted-foreground">
            {toPersianNumber(getTotalItems())} {getTotalItems() === 1 ? 'آیتم' : 'آیتم'} در سبد خرید شما
          </p>
        </div>
        <Link href="/shop">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ادامه خرید
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-28 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.product.title}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        نویسنده: {(item.product as any).authorsDisplay || ((item.product as any).authors && (item.product as any).authors.length > 0 ? (item.product as any).authors.map((a: any) => a.authorName).join(', ') : (item.product as any).author)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="capitalize">{item.product.category}</span>
                        {item.product.format && (
                          <span className="capitalize">{item.product.format}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {toPersianNumber(item.quantity)}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className="h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      {(() => {
                        const productPrice = (item.product as any).price || (item.product as any).selectedFormat?.finalPrice || (item.product as any).selectedFormat?.price || 0;
                        const totalPrice = productPrice * item.quantity;
                        const unitPrice = productPrice;
                        const originalPrice = (item.product as any).selectedFormat?.price || (item.product as any).price || 0;
                        const hasDiscount = (item.product as any).selectedFormat?.hasDiscount || ((item.product as any).selectedFormat?.discountPrice && (item.product as any).selectedFormat?.discountPrice < originalPrice);
                        
                        return (
                          <>
                            {hasDiscount && originalPrice > productPrice && (
                              <p className="text-xs text-muted-foreground line-through mb-1">
                                {toPersianCurrency(originalPrice * item.quantity)}
                              </p>
                            )}
                            <p className="font-semibold text-lg">
                              {toPersianCurrency(totalPrice)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {toPersianCurrency(unitPrice)} هر کدام
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.product.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Clear Cart Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              پاک کردن سبد
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>جمع کل</span>
                  <span>{toPersianCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>مالیات</span>
                  <span>{toPersianCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>مجموع</span>
                  <span>{toPersianCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-6">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={async () => {
                    startLoading('در حال انتقال به صفحه پرداخت...', true, 'high')
                    await new Promise(resolve => setTimeout(resolve, 500))
                    router.push('/checkout')
                    stopLoading()
                  }}
                >
                  ادامه به پرداخت
                </Button>
                <Link href="/shop" className="w-full block mt-4">
                  <Button variant="outline" className="w-full">
                    ادامه خرید
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-muted-foreground text-center mt-6 space-y-1">
                <p>هزینه ارسال بر اساس آدرس شما محاسبه می‌شود</p>
                <p>آیتم‌های دیجیتال بلافاصله پس از خرید در دسترس هستند</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

