'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getMediaUrl } from '@/lib/utils'
import { 
  Star, 
  Heart, 
  Share2, 
  Download, 
  Play, 
  ShoppingCart, 
  CreditCard,
  BookOpen,
  Clock,
  FileText,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  Tag,
  Award,
  Globe,
  Users,
  Eye,
  Package,
  Truck,
  Shield,
  Zap,
  Volume2,
  Monitor,
  Smartphone,
  Tablet,
  ThumbsUp,
  MessageCircle,
  Filter,
  SortAsc,
  Plus,
  CheckCircle,
  AlertCircle,
  BookmarkPlus,
  BookmarkCheck,
  Flag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner, TvtoBookSpinner } from '@/components/ui/spinner'
import { adsApi } from '@/services/api'
import { useCartStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext'
import { useLoading } from '@/providers/LoadingProvider'
import { useToast } from '@/components/ui/toast'
import { publicApi, PublicProductDto } from '@/services/publicApi'
import { productReviewApi, productLikeApi, wishlistApi, ProductReviewDto } from '@/services/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductReportModal } from '@/components/ProductReportModal'
import { SeoMetaTags } from '@/components/SeoMetaTags'
import { seoApi } from '@/services/seoApi'

function ProductDetailsContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug') as string
  const id = searchParams.get('id') as string
  const [selectedTab, setSelectedTab] = useState('description')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')
  const [reviewSort, setReviewSort] = useState('newest')
  const [selectedFormatIndex, setSelectedFormatIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const { addItem } = useCartStore()
  const { user, isAuthenticated } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const carouselRef = useRef<HTMLDivElement>(null)

  const { data: productResponse, isLoading } = useQuery({
    queryKey: ['product', slug || id],
    queryFn: async () => {
      if (slug) {
        const response = await publicApi.getProductBySlug(slug);
        return response.data;
      } else if (id) {
        const response = await publicApi.getProductById(id);
        return response.data;
      }
      throw new Error('Product slug or id is required');
    },
    enabled: !!(slug || id) && typeof window !== 'undefined',
  })

  const product = productResponse?.data

  // Fetch SEO meta tags
  const { data: seoResponse } = useQuery({
    queryKey: ['seo-meta', 'Product', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const response = await seoApi.getMetaTags({
        pageType: 'Product',
        entityId: product.id
      });
      return response.data;
    },
    enabled: !!product?.id && typeof window !== 'undefined',
  });

  const seoMeta = seoResponse?.data;

  // Fetch product reviews
  const { data: reviewsResponse } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const response = await productReviewApi.getProductReviews(product.id, true);
      return response.data;
    },
    enabled: !!product?.id && typeof window !== 'undefined',
  });

  const reviews: ProductReviewDto[] = reviewsResponse?.data || [];

  // Fetch like status and count
  const { data: likeStatusResponse } = useQuery({
    queryKey: ['product-like-status', product?.id, user?.id],
    queryFn: async () => {
      if (!product?.id || !isAuthenticated) return null;
      const response = await productLikeApi.checkLike(product.id);
      return response.data;
    },
    enabled: !!product?.id && isAuthenticated && typeof window !== 'undefined',
  });

  const { data: likeCountResponse } = useQuery({
    queryKey: ['product-like-count', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const response = await productLikeApi.getLikeCount(product.id);
      return response.data;
    },
    enabled: !!product?.id && typeof window !== 'undefined',
  });

  useEffect(() => {
    if (likeStatusResponse?.data !== undefined) {
      setIsLiked(likeStatusResponse.data);
    }
  }, [likeStatusResponse]);

  useEffect(() => {
    if (likeCountResponse?.data !== undefined) {
      setLikeCount(likeCountResponse.data);
    }
  }, [likeCountResponse]);

  // Check if product is in wishlist
  const { data: wishlistResponse } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      const response = await wishlistApi.getWishlist(1, 100);
      return response.data;
    },
    enabled: !!user?.id && isAuthenticated && !!product?.id && typeof window !== 'undefined',
  });

  useEffect(() => {
    if (wishlistResponse?.data?.items && product?.id) {
      const isInList = wishlistResponse.data.items.some(item => item.productId === product.id);
      setIsInWishlist(isInList);
    }
  }, [wishlistResponse, product?.id]);

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!product?.id) return;
      return await productLikeApi.toggleLike(product.id);
    },
    onSuccess: (response) => {
      if (response?.data.isSucceeded) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        queryClient.invalidateQueries({ queryKey: ['product-like-status', product?.id] });
        queryClient.invalidateQueries({ queryKey: ['product-like-count', product?.id] });
      }
    },
  });

  // Toggle wishlist mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!product?.id) return;
      if (isInWishlist) {
        const wishlistItem = wishlistResponse?.data?.items?.find(item => item.productId === product.id);
        if (wishlistItem) {
          return await wishlistApi.removeItem(wishlistItem.id);
        }
      } else {
        return await wishlistApi.addItem({ productId: product.id });
      }
    },
    onSuccess: (response) => {
      if (response?.data.isSucceeded) {
        const wasInWishlist = isInWishlist;
        setIsInWishlist(!isInWishlist);
        queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
        showToast({ 
          type: 'success', 
          title: wasInWishlist ? 'از لیست علاقه‌مندی‌ها حذف شد' : 'به لیست علاقه‌مندی‌ها اضافه شد' 
        });
      }
    },
    onError: (error: any) => {
      showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'خطا در افزودن به لیست علاقه‌مندی‌ها' 
      });
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async () => {
      if (!product?.id) return;
      return await productReviewApi.create({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
    },
    onSuccess: (response) => {
      if (response?.data.isSucceeded) {
        showToast({ type: 'success', title: 'نظر شما با موفقیت ثبت شد و در انتظار تایید است.' });
        setShowReviewForm(false);
        setReviewTitle('');
        setReviewComment('');
        setReviewRating(5);
        queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
      } else {
        showToast({ type: 'error', title: response?.data.message || 'خطا در ثبت نظر' });
      }
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: error.response?.data?.message || 'خطا در ثبت نظر' });
    },
  });

  // Fetch related products from same category
  const { data: relatedProductsResponse } = useQuery({
    queryKey: ['related-products', product?.id],
    queryFn: async () => {
      if (product?.id) {
        // Get first author ID if available, or use category
        const authorId = product.authors?.[0]?.authorId;
        if (authorId) {
          const response = await publicApi.getProducts({
            authorId,
            pageNumber: 1,
            pageSize: 12,
            onlyAvailable: true
          });
          // Filter out current product
          const filtered = response.data.data.products.filter(p => p.id !== product.id);
          return { ...response.data.data, products: filtered.slice(0, 8) };
        }
      }
      return { products: [] };
    },
    enabled: !!product?.id && typeof window !== 'undefined',
  })

  const relatedProducts = relatedProductsResponse?.products || []

  // Reset format selection when product changes
  useEffect(() => {
    if (product?.formats && product.formats.length > 0) {
      setSelectedFormatIndex(0)
      const selectedFormat = product.formats[0];
      const isPhysical = selectedFormat?.formatType?.toLowerCase() === 'physical';
      const maxQuantity = isPhysical ? (selectedFormat.stockQuantity ?? 0) : undefined;
      setQuantity(maxQuantity && maxQuantity > 0 ? Math.min(1, maxQuantity) : 1);
    }
  }, [product?.formats])

  // Update quantity when format changes
  useEffect(() => {
    if (product?.formats && product.formats[selectedFormatIndex]) {
      const selectedFormat = product.formats[selectedFormatIndex];
      const isPhysical = selectedFormat?.formatType?.toLowerCase() === 'physical';
      const maxQuantity = isPhysical ? (selectedFormat.stockQuantity ?? 0) : undefined;
      if (maxQuantity && quantity > maxQuantity) {
        setQuantity(maxQuantity);
      }
    }
  }, [selectedFormatIndex, product?.formats, quantity])

  const handleAddToCart = async () => {
    if (product) {
      const selectedFormat = product.formats?.[selectedFormatIndex];
      
      // Check if physical product has stock
      if (selectedFormat?.formatType?.toLowerCase() === 'physical') {
        const stockQuantity = selectedFormat.stockQuantity ?? 0;
        if (stockQuantity <= 0) {
          showToast({ type: 'error', title: 'این محصول در حال حاضر موجود نیست.' });
          return;
        }
        if (quantity > stockQuantity) {
          showToast({ type: 'error', title: `موجودی کافی نیست. موجودی قابل فروش: ${stockQuantity}` });
          return;
        }
      }
      
      startLoading('در حال افزودن به سبد خرید...', true, 'high')
      const itemToAdd = {
        ...product,
        selectedFormat,
        quantity,
        price: selectedFormat?.finalPrice || product.minPrice
      };
      await new Promise(resolve => setTimeout(resolve, 500))
      addItem(itemToAdd as any)
      stopLoading()
    }
  }

  const handleBuyNow = () => {
    if (product) {
      const selectedFormat = product.formats?.[selectedFormatIndex];
      const itemToAdd = {
        ...product,
        selectedFormat,
        quantity,
        price: selectedFormat?.finalPrice || product.minPrice
      };
      addItem(itemToAdd as any)
      // Redirect to checkout
      if (typeof window !== 'undefined') {
        window.location.href = '/checkout'
      }
    }
  }

  // Image gallery functions
  const getProductImages = () => {
    if (!product) return []
    const images: (string | { url: string; title?: string })[] = [];
    if (product.coverImageUrl) {
      images.push(product.coverImageUrl);
    }
    if (product.backCoverImageUrl) {
      images.push(product.backCoverImageUrl);
    }
    product.media?.forEach(m => {
      if (m.mediaUrl) {
        const imageUrl = getMediaUrl(m.mediaUrl, m.title);
        images.push({ url: imageUrl, title: m.title });
      }
    });
    return images.length > 0 ? images : ['/placeholder-book.jpg'];
  }

  const nextImage = () => {
    const images = getProductImages()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    const images = getProductImages()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const selectImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      showToast({ type: 'warning', title: 'لطفاً ابتدا وارد حساب کاربری خود شوید' });
      return;
    }
    toggleLikeMutation.mutate();
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      showToast({ type: 'warning', title: 'لطفاً ابتدا وارد حساب کاربری خود شوید' });
      return;
    }
    toggleWishlistMutation.mutate();
  };

  const handleSubmitReview = () => {
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      showToast({ type: 'error', title: 'لطفاً عنوان و متن نظر را وارد کنید' });
      return;
    }
    createReviewMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="text-center space-y-4">
            <TvtoBookSpinner size="lg" />
            <p className="text-muted-foreground">در حال بارگذاری محصول...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">محصول یافت نشد</h1>
          <p className="text-muted-foreground mb-6">
            متأسفانه محصول مورد نظر شما یافت نشد.
          </p>
          <Link href="/shop">
            <Button size="lg">
              بازگشت به فروشگاه
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = getProductImages()

  return (
    <>
      <SeoMetaTags
        title={seoMeta?.title || product?.metaTitle || product?.title}
        description={seoMeta?.description || product?.metaDescription || product?.description}
        keywords={seoMeta?.keywords || product?.metaKeywords}
        canonicalUrl={seoMeta?.canonicalUrl}
        robotsMeta={seoMeta?.robotsMeta}
        openGraph={seoMeta?.openGraph || {
          title: product?.title,
          description: product?.description,
          image: product?.coverImageUrl,
          type: 'product',
          url: typeof window !== 'undefined' ? window.location.href : ''
        }}
        twitterCard={seoMeta?.twitterCard}
        structuredData={seoMeta?.structuredData || (product ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Book",
          "name": product.title,
          "description": product.description,
          "image": product.coverImageUrl,
          "author": product.authors?.map((a: any) => ({
            "@type": "Person",
            "name": a.name
          })),
          "publisher": product.publisher ? {
            "@type": "Organization",
            "name": product.publisher.name
          } : undefined,
          "isbn": product.isbn,
          "aggregateRating": product.averageRating > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": product.averageRating,
            "reviewCount": product.totalReviews
          } : undefined
        }) : undefined)}
        additionalMetaTags={seoMeta?.additionalMetaTags}
      />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
        <nav className="flex items-center space-x-1 text-sm text-[#81858b] mb-6 rtl:space-x-reverse">
          <Link href="/" className="hover:text-[#ef4056] transition-colors">TvtoBook</Link>
          <span className="mx-1">›</span>
          <Link href="/shop" className="hover:text-[#ef4056] transition-colors">کتاب</Link>
          <span className="mx-1">›</span>
          <span className="text-[#3f4064] line-clamp-1">{product?.title}</span>
      </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Left: Purchase Section */}
          <div className="lg:order-3 space-y-4">
            {/* Format Selection */}
            {product?.formats && product.formats.length > 1 && (
              <div className="space-y-2">
                <label className="text-base font-semibold text-[#3f4064]">انتخاب فرمت</label>
                <div className="grid grid-cols-1 gap-2">
                  {product.formats.map((format, index) => {
                    const formatLabel = format.formatType === 'physical' ? 'فیزیکی' : 
                                      format.formatType === 'ebook' ? 'الکترونیکی' : 
                                      format.formatType === 'audiobook' ? 'صوتی' : format.formatType;
                    return (
                <button
                  key={index}
                        onClick={() => setSelectedFormatIndex(index)}
                        className={`p-3 rounded-lg border-2 text-right transition-all ${
                          index === selectedFormatIndex
                            ? 'border-[#ef4056] bg-[#ef4056]/5'
                            : 'border-[#e0e0e6] hover:border-[#c0c2c5]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-base font-medium ${
                            index === selectedFormatIndex ? 'text-[#ef4056]' : 'text-[#3f4064]'
                          }`}>
                            {formatLabel}
                          </span>
                          <span className="text-base text-[#81858b]">
                            {format.finalPrice?.toLocaleString('fa-IR') || '0'} تومان
                          </span>
                        </div>
                </button>
                    );
                  })}
                </div>
            </div>
          )}

            {/* Price Display */}
            <div className="bg-[#ef4056] rounded-lg p-3 mt-8 lg:mt-[88px]">
              <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
                <span className="text-2xl lg:text-3xl font-bold text-white">
                  {(() => {
                    const format = product?.formats?.[selectedFormatIndex];
                    const finalPrice = format?.finalPrice;
                    const price = format?.price;
                    
                    if (finalPrice !== undefined && finalPrice !== null && finalPrice > 0) {
                      return (finalPrice * quantity).toLocaleString('fa-IR');
                    }
                    if (price !== undefined && price !== null && price > 0) {
                      return (price * quantity).toLocaleString('fa-IR');
                    }
                    if (finalPrice !== undefined && finalPrice !== null) {
                      return (finalPrice * quantity).toLocaleString('fa-IR');
                    }
                    if (price !== undefined && price !== null) {
                      return (price * quantity).toLocaleString('fa-IR');
                    }
                    return product?.minPrice?.toLocaleString('fa-IR') || '0';
                  })()}
                </span>
                <span className="text-base text-white/90">تومان</span>
              </div>
              {product?.formats?.[selectedFormatIndex]?.formatType === 'ebook' && (
                <Link href="#" className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-white mt-2 hover:underline">
                  <Zap className="h-4 w-4" />
                  <span>دانلود فوری</span>
                </Link>
              )}
            </div>

            {/* Quantity Selection */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-[#3f4064]">تعداد</label>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="flex items-center border border-[#e0e0e6] rounded-lg">
                  <button
                    onClick={() => {
                      const selectedFormat = product?.formats?.[selectedFormatIndex];
                      const maxQuantity = selectedFormat?.formatType?.toLowerCase() === 'physical' 
                        ? (selectedFormat.stockQuantity ?? 0)
                        : undefined;
                      setQuantity(prev => {
                        const newQty = Math.max(1, prev - 1);
                        return maxQuantity ? Math.min(newQty, maxQuantity) : newQty;
                      });
                    }}
                    className="px-3 py-2 hover:bg-[#f0f0f1] transition-colors rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none"
                  >
                    <span className="text-[#3f4064] font-semibold text-lg">−</span>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={(() => {
                      const selectedFormat = product?.formats?.[selectedFormatIndex];
                      return selectedFormat?.formatType?.toLowerCase() === 'physical' 
                        ? (selectedFormat.stockQuantity ?? 0)
                        : undefined;
                    })()}
                    value={quantity}
                    onChange={(e) => {
                      const selectedFormat = product?.formats?.[selectedFormatIndex];
                      const maxQuantity = selectedFormat?.formatType?.toLowerCase() === 'physical' 
                        ? (selectedFormat.stockQuantity ?? 0)
                        : undefined;
                      const newQty = Math.max(1, parseInt(e.target.value) || 1);
                      setQuantity(maxQuantity ? Math.min(newQty, maxQuantity) : newQty);
                    }}
                    className="w-16 text-center border-x border-[#e0e0e6] py-2 text-base font-medium text-[#3f4064] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => {
                      const selectedFormat = product?.formats?.[selectedFormatIndex];
                      const maxQuantity = selectedFormat?.formatType?.toLowerCase() === 'physical' 
                        ? (selectedFormat.stockQuantity ?? 0)
                        : undefined;
                      setQuantity(prev => {
                        const newQty = prev + 1;
                        return maxQuantity ? Math.min(newQty, maxQuantity) : newQty;
                      });
                    }}
                    className="px-3 py-2 hover:bg-[#f0f0f1] transition-colors rounded-l-lg rtl:rounded-r-lg rtl:rounded-l-none"
                  >
                    <span className="text-[#3f4064] font-semibold text-lg">+</span>
                  </button>
              </div>
                {(() => {
                  const selectedFormat = product?.formats?.[selectedFormatIndex];
                  const isPhysical = selectedFormat?.formatType?.toLowerCase() === 'physical';
                  const isAvailable = isPhysical 
                    ? (selectedFormat?.stockQuantity ?? 0) > 0
                    : (selectedFormat?.isAvailable ?? true);
                  
                  if (isAvailable) {
                    return (
                      <div className="flex items-center space-x-1 rtl:space-x-reverse text-sm text-[#4caf50]">
                        <div className="w-2 h-2 bg-[#4caf50] rounded-full"></div>
                        <span>موجود در انبار</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center space-x-1 rtl:space-x-reverse text-sm text-[#ef4056]">
                        <div className="w-2 h-2 bg-[#ef4056] rounded-full"></div>
                        <span>ناموجود</span>
                      </div>
                    );
                  }
                })()}
            </div>
          </div>

          {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="lg" 
                className="flex-1 h-12 bg-[#ef4056] hover:bg-[#e6123d] text-white font-semibold text-base rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed" 
                onClick={handleAddToCart}
                disabled={(() => {
                  const selectedFormat = product?.formats?.[selectedFormatIndex];
                  const isPhysical = selectedFormat?.formatType?.toLowerCase() === 'physical';
                  const isAvailable = isPhysical 
                    ? (selectedFormat?.stockQuantity ?? 0) > 0
                    : (selectedFormat?.isAvailable ?? true);
                  return !isAvailable;
                })()}
              >
                <ShoppingCart className="h-5 w-5 ml-2 rtl:ml-2 rtl:mr-0" />
                افزودن به سبد خرید
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className={`h-12 w-12 p-0 border border-[#e0e0e6] hover:bg-[#f0f0f1] rounded-lg ${
                  isLiked ? 'text-[#ef4056] bg-[#fff5f5]' : 'text-[#3f4064]'
                }`}
                onClick={handleToggleLike}
                disabled={toggleLikeMutation.isPending}
                title="لایک"
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className={`h-12 w-12 p-0 border border-[#e0e0e6] hover:bg-[#f0f0f1] rounded-lg ${
                  isInWishlist ? 'text-[#ff9800] bg-[#fff8f0]' : 'text-[#3f4064]'
                }`}
                onClick={handleToggleWishlist}
                disabled={toggleWishlistMutation.isPending}
                title="افزودن به لیست علاقه‌مندی‌ها"
              >
                {isInWishlist ? (
                  <BookmarkCheck className="h-5 w-5 fill-current" />
                ) : (
                  <BookmarkPlus className="h-5 w-5" />
                )}
              </Button>
              {isAuthenticated && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 w-12 p-0 border border-[#e0e0e6] hover:bg-[#f0f0f1] rounded-lg text-[#3f4064]"
                  onClick={() => setShowReportModal(true)}
                  title="گزارش محصول"
                >
                  <Flag className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="h-5 w-5 text-[#4caf50] flex-shrink-0" />
                <span className="text-sm text-[#3f4064]">ضمانت اصالت و سلامت فیزیکی کالا</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Truck className="h-5 w-5 text-[#2196f3] flex-shrink-0" />
                <span className="text-sm text-[#3f4064]">ارسال رایگان برای سفارش‌های بالای ۲۰۰ هزار تومان</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Zap className="h-5 w-5 text-[#ff9800] flex-shrink-0" />
                <span className="text-sm text-[#3f4064]">تحویل سریع و امن</span>
              </div>
            </div>
          </div>

          {/* Middle: Product Info */}
          <div className="lg:order-2 space-y-3">
            {/* Title and Author */}
            <div className="space-y-2">
              <h1 className="text-xl lg:text-2xl font-bold text-[#23254e]">
                {product?.title}
              </h1>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-sm text-[#81858b]">نویسنده:</span>
                <Link href="#" className="text-sm text-[#19bfd3] hover:text-[#ef4056] transition-colors">
                  {product?.authorsDisplay || product?.authors.map(a => a.authorName).join(', ') || 'ناشناس'}
                </Link>
              </div>
              
              {/* Format and Publication Year */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-[#3f4064] pt-1">
                {product?.formats && product.formats.length > 0 && (
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <span className="text-[#81858b]">فرمت:</span>
                    <span className="font-medium">
                      {product.formats.map(f => {
                        if (f.formatType === 'physical') return 'فیزیکی';
                        if (f.formatType === 'ebook') return 'الکترونیکی';
                        if (f.formatType === 'audiobook') return 'صوتی';
                        return f.formatType;
                      }).join(', ')}
                    </span>
                  </div>
                )}
                {product?.publicationDate && (
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <span className="text-[#81858b]">سال انتشار:</span>
                    <span className="font-medium">{new Date(product.publicationDate).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Rating and Reviews Section */}
              <div className="flex items-center space-x-6 rtl:space-x-reverse pt-3 border-t border-[#e0e0e6]">
                {/* Rating Display */}
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Star className="h-5 w-5 fill-[#ffc107] text-[#ffc107]" />
                  <span className="text-lg font-bold text-[#3f4064]">
                    {product?.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-sm text-[#81858b]">
                    (امتیاز {product?.totalRatings || 0} خریدار)
                  </span>
                </div>

                {/* Review/Question Buttons */}
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => setSelectedTab('reviews')}
                    className="px-4 py-2 rounded-lg bg-[#f3e8ff] text-[#9333ea] text-sm font-medium hover:bg-[#e9d5ff] transition-colors flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <Star className="h-4 w-4 fill-[#9333ea] text-[#9333ea]" />
                    <span>خلاصه دیدگاه‌ها</span>
                  </button>
                  <button
                    onClick={() => setSelectedTab('reviews')}
                    className="px-4 py-2 rounded-lg bg-[#f0f0f1] text-[#3f4064] text-sm font-medium hover:bg-[#e0e0e6] transition-colors flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{reviews.length} دیدگاه</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-[#f0f0f1] rounded-lg p-4">
              <div className="text-base font-bold text-[#3f4064] mb-4">مشخصات کلی</div>
              <div className="space-y-0 divide-y divide-[#e0e0e6]">
                {product?.formats && product.formats.length > 0 && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">فرمت:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">
                      {product.formats.map(f => {
                        if (f.formatType === 'physical') return 'فیزیکی';
                        if (f.formatType === 'ebook') return 'الکترونیکی';
                        if (f.formatType === 'audiobook') return 'صوتی';
                        return f.formatType;
                      }).join(', ')}
                    </span>
                  </div>
                )}
                {product?.publicationDate && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">سال انتشار:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{new Date(product.publicationDate).getFullYear()}</span>
                  </div>
                )}
                {product?.pages && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">تعداد صفحات:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.pages}</span>
                  </div>
                )}
                {product?.language && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">زبان:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.language === 'fa' ? 'فارسی' : product.language === 'en' ? 'انگلیسی' : product.language}</span>
                  </div>
                )}
                {product?.publisherName && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">ناشر:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.publisherName}</span>
                  </div>
                )}
                {product?.categoryName && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">دسته‌بندی:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.categoryName}</span>
                  </div>
                )}
                {product?.isbn && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">شابک:</span>
                    <span className="text-sm text-[#3f4064] font-medium font-mono text-right" dir="ltr">{product.isbn}</span>
                  </div>
                )}
                {product?.edition && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">چاپ:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.edition}</span>
                  </div>
                )}
                {product?.series && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">مجموعه:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.series}</span>
                  </div>
                )}
                {product?.volume && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">جلد:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.volume}</span>
                  </div>
                )}
                {product?.ageGroup && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">گروه سنی:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.ageGroup}</span>
                  </div>
                )}
                {product?.dimensions && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">ابعاد:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.dimensions}</span>
                  </div>
                )}
                {product?.weight && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">وزن:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right">{product.weight} گرم</span>
                  </div>
                )}
                {product?.formats?.[selectedFormatIndex]?.fileSize && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#81858b] text-left">حجم فایل:</span>
                    <span className="text-sm text-[#3f4064] font-medium text-right" dir="ltr">
                      {(() => {
                        // API returns fileSize in MB
                        const fileSizeMB = product.formats[selectedFormatIndex].fileSize;
                        if (!fileSizeMB) return '';
                        // Format to 1 decimal place
                        return `${fileSizeMB.toFixed(1)} MB`;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Product Images */}
          <div className="lg:order-1 space-y-3">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-white rounded-lg border border-[#e0e0e6] flex items-center justify-center shadow-lg">
              <img
                src={typeof images[currentImageIndex] === 'string' 
                  ? images[currentImageIndex] 
                  : (images[currentImageIndex] as any)?.url || images[currentImageIndex]}
                alt={product?.title}
                className="w-full h-full object-contain p-4"
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white hover:bg-[#f0f0f1] shadow-md border border-[#e0e0e6] rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-[#3f4064]" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white hover:bg-[#f0f0f1] shadow-md border border-[#e0e0e6] rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-[#3f4064]" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => selectImage(index)}
                    className={`aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-[#ef4056]' 
                        : 'border-[#e0e0e6] hover:border-[#c0c2c5]'
                    }`}
                  >
                    <img
                      src={typeof image === 'string' 
                        ? image 
                        : (image as any)?.url || image}
                      alt={`${product?.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="sticky top-16 z-40 bg-white border-t border-[#e0e0e6] mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="inline-flex h-12 items-center justify-end rounded-md bg-transparent p-1 border-b border-[#e0e0e6] w-full mb-6">
              <TabsTrigger 
                value="description" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#ef4056] data-[state=active]:border-b-2 data-[state=active]:border-[#ef4056] text-[#81858b] border-b-2 border-transparent -mb-[2px]"
              >
                توضیحات
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#ef4056] data-[state=active]:border-b-2 data-[state=active]:border-[#ef4056] text-[#81858b] border-b-2 border-transparent -mb-[2px]"
              >
                نظرات
              </TabsTrigger>
              <TabsTrigger 
                value="specifications" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:text-[#ef4056] data-[state=active]:border-b-2 data-[state=active]:border-[#ef4056] text-[#81858b] border-b-2 border-transparent -mb-[2px]"
              >
                مشخصات
              </TabsTrigger>
          </TabsList>

            <TabsContent value="description" className="mt-0">
              <div className="bg-white p-6">
                <h2 className="text-xl font-bold text-[#3f4064] mb-4">درباره این محصول</h2>
                <div className="text-base leading-7 text-[#3f4064] whitespace-pre-line">
                  {product?.description || 'توضیحات محصول در اینجا قرار می‌گیرد. این کتاب یکی از بهترین آثار نویسنده است که با دقت و مهارت نوشته شده است.'}
                </div>
              </div>
          </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <div className="bg-white p-6">
                {/* Rating Summary Section */}
                {(() => {
                  const avgRating = product?.averageRating || 0;
                  const totalReviewsCount = product?.totalReviews || reviews.length;
                  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => ({
                    stars,
                    count: reviews.filter(r => r.rating === stars).length
                  }));
                  const fullStars = Math.floor(avgRating);
                  const hasHalfStar = avgRating % 1 >= 0.5;

                  return (
                    <div className="flex flex-col lg:flex-row gap-8 mb-10">
                      {/* Overall Rating (Left Card) */}
                      <div className="flex-shrink-0 w-full lg:w-80 bg-gradient-to-br from-[#fffef2] to-[#fff9e6] rounded-2xl p-10 flex flex-col items-center justify-center border-2 border-[#ffe0b2] shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="text-7xl font-bold text-[#23254e] mb-5 leading-none bg-gradient-to-br from-[#23254e] to-[#3f4064] bg-clip-text text-transparent">
                          {avgRating > 0 ? avgRating.toFixed(1) : '۰'}
                        </div>
                        <div className="flex items-center gap-1.5 mb-5">
                          {[...Array(5)].map((_, i) => {
                            if (i < fullStars) {
                              return <Star key={i} className="h-8 w-8 text-[#ffc107] fill-[#ffc107] drop-shadow-sm" />;
                            } else if (i === fullStars && hasHalfStar) {
                              return (
                                <div key={i} className="relative h-8 w-8">
                                  <Star className="h-8 w-8 text-[#e0e0e6] fill-[#e0e0e6] absolute" />
                                  <div className="absolute overflow-hidden" style={{ width: '50%' }}>
                                    <Star className="h-8 w-8 text-[#ffc107] fill-[#ffc107] drop-shadow-sm" />
                                  </div>
                                </div>
                              );
                            } else {
                              return <Star key={i} className="h-8 w-8 text-[#e0e0e6] fill-[#e0e0e6]" />;
                            }
                          })}
                        </div>
                        <div className="text-base text-[#81858b] font-semibold tracking-wide">
                          بر اساس {totalReviewsCount.toLocaleString('fa-IR')} نظر
                        </div>
                      </div>

                      {/* Rating Breakdown (Right Bars) */}
                      <div className="flex-1 space-y-5">
                        {ratingBreakdown.map((item) => {
                          const percentage = totalReviewsCount > 0 ? (item.count / totalReviewsCount) * 100 : 0;
                          return (
                            <div key={item.stars} className="flex items-center gap-5 group">
                              <div className="flex items-center gap-2.5 w-14">
                                <span className="text-lg font-bold text-[#3f4064] w-5">{item.stars}</span>
                                <Star className="h-5 w-5 text-[#ffc107] fill-[#ffc107] flex-shrink-0 drop-shadow-sm" />
                              </div>
                              <div className="flex-1 h-5 bg-gradient-to-r from-[#f5f5f5] to-[#e8e8e8] rounded-full overflow-hidden shadow-inner border border-[#e0e0e6]/50">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#ff9800] via-[#ffb74d] to-[#ffc107] transition-all duration-700 ease-out shadow-sm"
                                  style={{ width: `${percentage}%` }}
                                >
                                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                </div>
                              </div>
                              <span className="text-base font-semibold text-[#3f4064] w-24 text-left">{item.count.toLocaleString('fa-IR')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Add Review Button */}
                {isAuthenticated && (
                  <div className="mb-6">
                    <Button 
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="bg-[#ef4056] hover:bg-[#e6123d] text-white"
                    >
                      <Plus className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" />
                      {showReviewForm ? 'انصراف' : 'ثبت نظر جدید'}
                    </Button>
                  </div>
                )}

                {/* Review Form */}
                {showReviewForm && isAuthenticated && (
                  <Card className="mb-6 border-2 border-[#ef4056]">
                    <CardHeader>
                      <CardTitle>ثبت نظر جدید</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#3f4064] mb-2">امتیاز</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewRating(rating)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  rating <= reviewRating
                                    ? 'text-[#ffc107] fill-[#ffc107]'
                                    : 'text-[#e0e0e6]'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3f4064] mb-2">عنوان نظر</label>
                        <input
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          className="w-full px-4 py-2 border border-[#e0e0e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef4056]"
                          placeholder="عنوان نظر خود را وارد کنید"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3f4064] mb-2">متن نظر</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 border border-[#e0e0e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef4056]"
                          placeholder="نظر خود را در مورد این محصول بنویسید"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={createReviewMutation.isPending}
                        className="w-full bg-[#ef4056] hover:bg-[#e6123d] text-white"
                      >
                        {createReviewMutation.isPending ? 'در حال ثبت...' : 'ثبت نظر'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <h2 className="text-xl font-bold text-[#3f4064] mb-6">نظرات مشتریان</h2>
                <div className="space-y-5">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-[#e0e0e6] pb-5 last:border-b-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span className="font-semibold text-base text-[#3f4064]">{review.userName || `${review.userFirstName} ${review.userLastName}`.trim()}</span>
                            {review.isVerifiedPurchase && (
                              <div title="خرید تأیید شده">
                                <CheckCircle className="h-5 w-5 text-[#4caf50]" />
                              </div>
                            )}
                            <span className="text-sm text-[#81858b]">{new Date(review.createdAt).toLocaleDateString('fa-IR')}</span>
                          </div>
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating
                                    ? 'fill-[#ffc107] text-[#ffc107]'
                                    : 'text-[#e0e0e6]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-base text-[#3f4064] mb-2">{review.title}</h4>
                        )}
                        <p className="text-base text-[#3f4064] mb-3 leading-relaxed">{review.comment}</p>
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-9 text-sm hover:bg-[#f0f0f1] p-0 ${
                              review.userVote === 'helpful' 
                                ? 'text-[#4caf50] bg-[#e8f5e9]' 
                                : review.userId === user?.id
                                  ? 'text-[#c0c0c0] cursor-not-allowed opacity-50'
                                  : 'text-[#81858b]'
                            }`}
                            onClick={async () => {
                              if (review.userId === user?.id) {
                                showToast({ type: 'error', title: 'شما نمی‌توانید روی نظر خودتان رای دهید.' });
                                return;
                              }
                              try {
                                const response = await productReviewApi.markHelpful(review.id, true);
                                if (response.data.isSucceeded) {
                                  queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
                                } else {
                                  showToast({ type: 'error', title: response.data.message || 'خطا در ثبت رای' });
                                }
                              } catch (error: any) {
                                showToast({ type: 'error', title: error.response?.data?.message || 'خطا در ثبت رای' });
                              }
                            }}
                            disabled={review.userId === user?.id}
                          >
                            <ThumbsUp className={`h-4 w-4 ml-1 rtl:ml-1 rtl:mr-0 ${review.userVote === 'helpful' ? 'fill-current' : ''}`} />
                            <span>{review.helpfulCount} مفید</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-9 text-sm hover:bg-[#f0f0f1] p-0 ${
                              review.userVote === 'notHelpful' 
                                ? 'text-[#f44336] bg-[#ffebee]' 
                                : review.userId === user?.id
                                  ? 'text-[#c0c0c0] cursor-not-allowed opacity-50'
                                  : 'text-[#81858b]'
                            }`}
                            onClick={async () => {
                              if (review.userId === user?.id) {
                                showToast({ type: 'error', title: 'شما نمی‌توانید روی نظر خودتان رای دهید.' });
                                return;
                              }
                              try {
                                const response = await productReviewApi.markHelpful(review.id, false);
                                if (response.data.isSucceeded) {
                                  queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
                                } else {
                                  showToast({ type: 'error', title: response.data.message || 'خطا در ثبت رای' });
                                }
                              } catch (error: any) {
                                showToast({ type: 'error', title: error.response?.data?.message || 'خطا در ثبت رای' });
                              }
                            }}
                            disabled={review.userId === user?.id}
                          >
                            <span>{review.notHelpfulCount} غیرمفید</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-[#81858b]">
                      <p className="text-base">هنوز نظری برای این محصول ثبت نشده است.</p>
                      {isAuthenticated && (
                        <Button 
                          onClick={() => setShowReviewForm(true)}
                          className="mt-4 bg-[#ef4056] hover:bg-[#e6123d] text-white"
                        >
                          اولین نظر را شما ثبت کنید
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
          </TabsContent>

            <TabsContent value="specifications" className="mt-0">
              <div className="bg-white p-6" dir="rtl">
                <h2 className="text-xl font-bold text-[#3f4064] mb-6 text-right">مشخصات محصول</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                      <span className="text-base text-[#81858b] text-right">نویسنده:</span>
                      <span className="text-base font-medium text-[#3f4064] text-left">{product?.authorsDisplay || product?.authors.map(a => a.authorName).join(', ') || 'ناشناس'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                      <span className="text-base text-[#81858b] text-right">دسته‌بندی:</span>
                      <span className="text-base font-medium text-[#3f4064] text-left">{product?.categoryName || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                      <span className="text-base text-[#81858b] text-right">فرمت:</span>
                      <span className="text-base font-medium text-[#3f4064] text-left">
                        {product?.formats && product.formats.length > 0 ? product.formats.map(f => {
                          if (f.formatType === 'physical') return 'فیزیکی';
                          if (f.formatType === 'ebook') return 'الکترونیکی';
                          if (f.formatType === 'audiobook') return 'صوتی';
                          return f.formatType;
                        }).join(', ') : 'نامشخص'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {product?.pages && (
                      <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                        <span className="text-base text-[#81858b] text-right">تعداد صفحات:</span>
                        <span className="text-base font-medium text-[#3f4064] text-left">{product.pages}</span>
                      </div>
                    )}
                    {product?.language && (
                      <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                        <span className="text-base text-[#81858b] text-right">زبان:</span>
                        <span className="text-base font-medium text-[#3f4064] text-left">{product.language === 'fa' ? 'فارسی' : product.language}</span>
                    </div>
                    )}
                    {product?.publicationDate && (
                      <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                        <span className="text-base text-[#81858b] text-right">سال انتشار:</span>
                        <span className="text-base font-medium text-[#3f4064] text-left">{new Date(product.publicationDate).getFullYear()}</span>
                    </div>
                    )}
                    {product?.isbn && (
                      <div className="flex justify-between items-center py-3 border-b border-[#e0e0e6]">
                        <span className="text-base text-[#81858b] text-right">شابک:</span>
                        <span className="text-base font-medium font-mono text-[#3f4064] text-left" dir="ltr">{product.isbn}</span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="bg-white border-t border-[#e0e0e6] py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#3f4064] mb-6">محصولات مرتبط</h2>
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {relatedProducts.map((relatedProduct) => {
                    const mainImage = relatedProduct.coverImageUrl || getMediaUrl(
                      relatedProduct.mainMedia?.mediaUrl || relatedProduct.media?.[0]?.mediaUrl,
                      relatedProduct.mainMedia?.title || relatedProduct.media?.[0]?.title
                    );
                    const minPrice = relatedProduct.minPrice || 0;
                    const formatType = relatedProduct.formats?.[0]?.formatType;
                    const authors = relatedProduct.authorsDisplay || relatedProduct.authors?.map(a => a.authorName).join(', ') || 'ناشناس';
                    
                    return (
                      <Link
                        key={relatedProduct.id}
                        href={`/product?slug=${relatedProduct.slug}`}
                        className="flex-shrink-0 w-64 group"
                      >
                        <div className="bg-white rounded-lg border border-[#e0e0e6] hover:border-[#ef4056] hover:shadow-lg transition-all duration-300 overflow-hidden">
                          {/* Product Image */}
                          <div className="relative aspect-[3/4] overflow-hidden bg-[#f0f0f1]">
                            <img
                              src={mainImage}
                              alt={relatedProduct.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {formatType && (
                              <div className="absolute top-2 right-2 rtl:top-2 rtl:right-2 ltr:top-2 ltr:left-2">
                                <span className="px-2 py-1 text-xs font-semibold bg-white/90 text-[#3f4064] rounded-full">
                                  {formatType === 'physical' ? 'فیزیکی' : formatType === 'ebook' ? 'الکترونیکی' : 'صوتی'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-4">
                            <h3 className="text-base font-semibold text-[#3f4064] mb-2 line-clamp-2 group-hover:text-[#ef4056] transition-colors">
                              {relatedProduct.title}
                            </h3>
                            <p className="text-sm text-[#81858b] mb-3 line-clamp-1">{authors}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-[#ef4056]">
                                {minPrice.toLocaleString('fa-IR')} تومان
                              </span>
                              <Button 
                                size="sm" 
                                className="bg-[#ef4056] hover:bg-[#e6123d] text-white text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // Handle add to cart
                                }}
                              >
                                افزودن
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              {relatedProducts.length > 4 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (carouselRef.current) {
                        const scrollAmount = 280;
                        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white border border-[#e0e0e6] rounded-full p-2 shadow-lg hover:bg-[#f0f0f1] transition-colors z-10 rtl:right-4 ltr:left-4"
                  >
                    <ChevronRight className="h-5 w-5 text-[#3f4064] rtl:rotate-180" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (carouselRef.current) {
                        const scrollAmount = 280;
                        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-[#e0e0e6] rounded-full p-2 shadow-lg hover:bg-[#f0f0f1] transition-colors z-10 rtl:left-4 ltr:right-4"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#3f4064] rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Product Report Modal */}
      {isAuthenticated && product?.id && (
        <ProductReportModal
          productId={product.id}
          productTitle={product.title}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  )
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <TvtoBookSpinner />
      </div>
    }>
      <ProductDetailsContent />
    </Suspense>
  )
}
