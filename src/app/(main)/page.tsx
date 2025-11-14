'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, FileText, Headphones, Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner, TvtoBookSpinner } from '@/components/ui/spinner'
import { PageLoader } from '@/components/ui/page-loader'
import { useLoading } from '@/providers/LoadingProvider'
import { publicApi, PublicProductDto } from '@/services/publicApi'
import { toPersianNumber } from '@/utils/numberUtils'
import { getMediaUrl } from '@/lib/utils'

export default function HomePage() {
  const carouselRef = useRef<HTMLDivElement>(null)
  
  const { data: homepageResponse, isLoading } = useQuery({
    queryKey: ['homepage-products'],
    queryFn: async () => {
      const response = await publicApi.getHomepageProductsSimple(12);
      return response.data;
    },
  })

  const featuredProducts = (() => {
    const data = homepageResponse?.data;
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.slice(0, 12);
    }
    const productList = data as { products?: PublicProductDto[] };
    return (productList.products || []).slice(0, 12);
  })()

  const { startLoading, stopLoading } = useLoading()

  useEffect(() => {
    if (!isLoading) {
      stopLoading()
    }
  }, [isLoading, stopLoading])

  // Demo function to showcase loading animations
  const handleDemoLoading = async (type: 'brand' | 'simple' | 'page' | 'maximum') => {
    if (type === 'brand') {
      startLoading('در حال بارگذاری تجربه توتوبوک...', true, 'high')
      setTimeout(() => stopLoading(), 3000)
    } else if (type === 'simple') {
      startLoading('در حال بارگذاری محتوا...', true, 'medium')
      setTimeout(() => stopLoading(), 2000)
    } else if (type === 'page') {
      // This would be used for page transitions
      startLoading('در حال انتقال به صفحه جدید...', true, 'high')
      setTimeout(() => stopLoading(), 2500)
    } else if (type === 'maximum') {
      startLoading('حداکثر شدت پوشش...', true, 'maximum')
      setTimeout(() => stopLoading(), 3000)
    }
  }

  const categories = [
    {
      name: 'کتاب‌های فیزیکی',
      description: 'کتاب‌های کلاسیک و مدرن در قالب جلد نرم و سخت',
      icon: BookOpen,
      href: '/shop?category=book',
      color: 'bg-blue-500',
    },
    {
      name: 'کتاب‌های الکترونیکی',
      description: 'کتاب‌های دیجیتال در فرمت PDF برای مطالعه فوری',
      icon: FileText,
      href: '/shop?category=ebook',
      color: 'bg-green-500',
    },
    {
      name: 'کتاب‌های صوتی',
      description: 'به کتاب‌های مورد علاقه خود در هر مکان گوش دهید',
      icon: Headphones,
      href: '/shop?category=audiobook',
      color: 'bg-purple-500',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            کتاب مناسب خود را پیدا کنید . 
              <br />
              و یادگیری را شروع کنید
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            مجموعه‌ای گسترده از کتاب‌های آموزشی و تخصصی در اختیار شماست—
            از مهارت‌های فنی تا توسعه فردی.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button size="lg" className="w-full sm:w-auto">
                  خرید کنید
                  <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/shop?category=audiobook">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  کتاب‌های صوتی را امتحان کنید
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">محصولات ویژه</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              جدیدترین و محبوب‌ترین کتاب‌های ما
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center space-y-4">
                <TvtoBookSpinner size="lg" />
                <p className="text-muted-foreground">در حال بارگذاری محصولات...</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {featuredProducts.map((product: PublicProductDto) => (
                    <div key={product.id} className="flex-shrink-0 w-56">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              {featuredProducts.length > 5 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (carouselRef.current) {
                        const scrollAmount = 240;
                        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10 rtl:right-4 ltr:left-4"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700 rtl:rotate-180" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (carouselRef.current) {
                        const scrollAmount = 240;
                        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10 rtl:left-4 ltr:right-4"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">خرید بر اساس دسته‌بندی</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              از سه دسته اصلی ما انتخاب کنید تا دقیقاً آنچه را که دنبال آن هستید پیدا کنید
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {categories.map((category, index) => (
              <motion.div key={category.name} variants={itemVariants}>
                <Link href={category.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <category.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription className="text-base">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {category.name}
                        <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">کتاب‌های ویژه</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              انتخاب‌های دستچین شده از محبوب‌ترین و با بالاترین امتیاز کتاب‌های ما
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center space-y-4">
                <TvtoBookSpinner size="lg" />
                <p className="text-muted-foreground">در حال بارگذاری محصولات ویژه...</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {featuredProducts.map((product: PublicProductDto) => (
                    <div key={product.id} className="flex-shrink-0 w-56">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/shop">
              <Button size="lg" variant="outline">
                مشاهده همه کتاب‌ها
                <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
               خواندن خود را امروز شروع کنید
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            هزاران خواننده با ما کتاب بعدی محبوبشان را پیدا کرده‌اند؛ شما چطور؟
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                ایجاد حساب کاربری
                <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function ProductCard({ product }: { product: PublicProductDto }) {
  const mainImage = product.coverImageUrl || getMediaUrl(product.mainMedia?.mediaUrl, product.mainMedia?.title);
  const authors = product.authorsDisplay || product.authors.map(a => a.authorName).join(', ') || 'ناشناس';
  
  // Find the format with the minimum price (use price when discountPrice is 0 or null, otherwise use finalPrice)
  const bestFormat = product.formats && product.formats.length > 0
    ? product.formats.reduce((best, current) => {
        if (!best) return current;
        const currentPrice = (!current.discountPrice || current.discountPrice <= 0) ? current.price : current.finalPrice;
        const bestPrice = (!best.discountPrice || best.discountPrice <= 0) ? best.price : best.finalPrice;
        return currentPrice < bestPrice ? current : best;
      })
    : null;
  
  const hasRealDiscount = bestFormat?.hasDiscount && bestFormat.discountPrice && bestFormat.discountPrice > 0 && bestFormat.price > bestFormat.finalPrice;
  const displayPrice = hasRealDiscount ? bestFormat.finalPrice : (bestFormat?.price ?? (product.minPrice != null ? product.minPrice : 0));
  const formatType = product.formats[0]?.formatType || 'physical';
  
  return (
    <Link href={`/product?slug=${product.slug}`}>
      <div className="h-full bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          
          <div className="absolute top-2 right-2 rtl:top-2 rtl:right-2 ltr:top-2 ltr:left-2">
            <span className="px-2 py-1 text-xs font-semibold bg-white/90 text-primary rounded-full">
              {formatType === 'physical' ? '📖 فیزیکی' : 
               formatType === 'ebook' ? '📱 الکترونیکی' : '🎧 صوتی'}
            </span>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-1 min-h-[2.5rem]">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {authors}
          </p>
          
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-2.5 w-2.5 ${
                      star <= Math.round(product.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-300 text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600">({toPersianNumber(product.averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })})</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-primary">
              {toPersianNumber(displayPrice)} تومان
            </span>
          </div>
          
          {formatType === 'ebook' && (
            <p className="text-xs text-green-600 font-semibold mt-1">دانلود فوری</p>
          )}
        </div>
      </div>
    </Link>
  )
}

