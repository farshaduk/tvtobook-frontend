'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { motion } from 'framer-motion'
import { getMediaUrl } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Star, 
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner, TvtoBookSpinner } from '@/components/ui/spinner'
import { Pagination } from '@/components/ui/pagination'
import { useLoading } from '@/providers/LoadingProvider'
import { publicApi, PublicProductDto, InpPublicProductListDto, PublicProductListDto } from '@/services/publicApi'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { PriceRangeSlider } from '@/components/ui/price-range-slider'
import { useCartStore } from '@/store'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { toPersianNumber } from '@/utils/numberUtils'

interface FilterOptions {
  category?: string[];
  authorId?: string[];
  publisherId?: string[];
  priceRange?: [number, number];
  formats?: string[];
  rating?: number;
  language?: string[];
  ageGroup?: string[];
}

interface SortOption {
  field: 'title' | 'price' | 'rating' | 'publishedDate';
  direction: 'asc' | 'desc';
}

function ShopPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filters, setFilters] = useState<FilterOptions>({})
  const [sort, setSort] = useState<SortOption>({ field: 'title', direction: 'asc' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showPriceSlider, setShowPriceSlider] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { startLoading, stopLoading } = useLoading()

  // Set default view mode to 'list' on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('list')
    }
  }, [])

  const searchQuery = searchParams.get('search') || ''
  const categoryFilter = searchParams.get('category') || ''
  const formatFilter = searchParams.get('format') || ''

  useEffect(() => {
    const newFilters: FilterOptions = {}
    
    // Handle category parameter (for backward compatibility, treat as format type)
    if (categoryFilter) {
      // Map legacy category values to format types
      const formatTypeMap: { [key: string]: string } = {
        'ebook': 'EBook',
        'audiobook': 'AudioBook',
        'book': 'Physical',
        'physical': 'Physical'
      }
      const mappedFormat = formatTypeMap[categoryFilter.toLowerCase()]
      if (mappedFormat) {
        newFilters.formats = [mappedFormat]
      }
    }
    
    // Handle format parameter (direct format type)
    if (formatFilter) {
      newFilters.formats = [formatFilter]
    }
    
    setFilters(newFilters)
    setCurrentPage(1)
  }, [categoryFilter, formatFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Pre-load categories on page mount - cached separately
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const params: InpPublicProductListDto = {
        pageNumber: 1,
        pageSize: 1,
        onlyAvailable: true,
        includeAggregations: true
      };
      const response = await publicApi.getProducts(params);
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  })

  const { data: productsResponse, isLoading, isFetching } = useQuery({
    queryKey: ['products', filters, sort, searchQuery, currentPage],
    queryFn: async () => {
      const params: InpPublicProductListDto = {
        searchTerm: searchQuery || undefined,
        categoryId: filters.category && filters.category.length > 0 ? (typeof filters.category[0] === 'string' ? filters.category[0] : undefined) : undefined,
        authorId: filters.authorId && filters.authorId.length > 0 ? filters.authorId[0] : undefined,
        publisherId: filters.publisherId && filters.publisherId.length > 0 ? filters.publisherId[0] : undefined,
        formatType: filters.formats && filters.formats.length > 0 ? filters.formats[0] : undefined,
        minPrice: filters.priceRange?.[0],
        maxPrice: filters.priceRange?.[1],
        language: filters.language && filters.language.length > 0 ? filters.language[0] : undefined,
        ageGroup: filters.ageGroup && filters.ageGroup.length > 0 ? filters.ageGroup[0] : undefined,
        sortBy: sort.field === 'price' 
          ? (sort.direction === 'asc' ? 'price_asc' : 'price_desc')
          : sort.field === 'title'
          ? 'title'
          : 'newest',
        pageNumber: currentPage,
        pageSize: 12,
        onlyAvailable: true,
        includeAggregations: true
      };
      const response = await publicApi.getProducts(params);
      return response.data;
    },
  })

  const products = productsResponse?.data?.products || []
  const aggregations = productsResponse?.data?.aggregations
  const hasInitialData = !!productsResponse

  useEffect(() => {
    if (!isFetching && !isLoading) {
      stopLoading()
    }
  }, [isFetching, isLoading, stopLoading])

  // Get categories from cached categories data or current aggregations
  const cachedCategories = categoriesData?.data?.aggregations?.categories || []
  const categoriesFromAggregations = aggregations?.categories || cachedCategories
  
  // Extract unique categories from products if aggregations are empty
  const categoriesFromProducts = products.length > 0 && categoriesFromAggregations.length === 0
    ? Array.from(new Map(
        products
          .map((p: PublicProductDto) => p.categoryName)
          .filter((catName): catName is string => Boolean(catName))
          .map((catName: string, index: number) => {
            // Try to find category ID from products if available
            const product = products.find((p: PublicProductDto) => p.categoryName === catName)
            return [catName, {
              id: `cat-${index}`,
              key: `cat-${index}`,
              label: catName,
              count: products.filter((p: PublicProductDto) => p.categoryName === catName).length
            }]
          })
      ).values())
    : []
  
  // Use categories from aggregations (preferred) or extract from products
  const categories = categoriesFromAggregations.length > 0 
    ? categoriesFromAggregations.filter((cat: any) => {
        // Ensure valid category structure - accept both string and GUID IDs
        const categoryId = cat.id || cat.key
        const categoryLabel = cat.label || cat.name || cat.title
        const isValid = categoryId && categoryLabel
        return isValid
      })
    : categoriesFromProducts

  // Build category hierarchy
  const buildCategoryTree = (flatCategories: any[]) => {
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];
    const categoryOrder = new Map<string, number>();
    let orderIndex = 0;

    // First pass: create map of all categories and preserve order
    flatCategories.forEach((cat: any) => {
      const categoryId = cat.id || cat.key
      const categoryIdString = typeof categoryId === 'string' 
        ? categoryId 
        : (categoryId?.toString?.() || String(categoryId) || '')
      const categoryLabel = cat.label || cat.name || cat.title
      const parentId = cat.parentId

      if (!categoryIdString || !categoryLabel) return

      categoryOrder.set(categoryIdString, orderIndex++)
      categoryMap.set(categoryIdString, {
        id: categoryIdString,
        label: categoryLabel,
        count: cat.count || 0,
        parentId: parentId,
        children: []
      })
    })

    // Second pass: build tree structure
    categoryMap.forEach((category) => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    // Sort by original order (preserve backend Sort order)
    const sortCategories = (cats: any[]): any[] => {
      return cats.sort((a, b) => {
        const orderA = categoryOrder.get(a.id) ?? 999999
        const orderB = categoryOrder.get(b.id) ?? 999999
        if (orderA !== orderB) return orderA - orderB
        return a.label.localeCompare(b.label)
      }).map((cat: any) => ({
        ...cat,
        children: cat.children.length > 0 ? sortCategories(cat.children) : []
      }))
    }

    return sortCategories(rootCategories)
  }

  const categoryTree = buildCategoryTree(categories)

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const renderCategoryItem = (category: any, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children && category.children.length > 0
    const selectedCategoryId = filters.category && filters.category.length > 0 ? String(filters.category[0]) : null
    const categoryIdString = String(category.id)
    const isSelected = selectedCategoryId === categoryIdString && !hasChildren

    return (
      <div key={category.id}>
        <div
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              // Parent category: only expand/collapse, don't select
              toggleCategory(category.id)
            } else {
              // Leaf category: single selection - replace with new selection
              const newCategory = isSelected ? undefined : [category.id]
              handleFilterChange('category', newCategory)
            }
          }}
                 className={`flex items-center justify-between cursor-pointer py-1.5 px-2 text-sm transition-colors ${
                   isSelected ? 'text-primary font-medium' : 'text-gray-700 hover:text-primary'
                 } ${hasChildren ? 'font-bold' : ''}`}
                 style={{ paddingRight: level > 0 ? `${level * 12}px` : '0' }}
               >
                 <span className="text-sm flex-1 text-right">
                   {category.label} {category.count > 0 ? `(${toPersianNumber(category.count)})` : ''}
                 </span>
                 {hasChildren && (
                   <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                     {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                   </span>
                 )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child: any) => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const authors = aggregations?.authors || []
  const publishers = aggregations?.publishers || []
  const languages = aggregations?.languages || []
  const ageGroups = aggregations?.ageGroups || []

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    startLoading('در حال بارگذاری...', true)
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSortChange = (field: SortOption['field']) => {
    const newSort: SortOption = {
      field,
      direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
    }
    setSort(newSort)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    // In Next.js App Router, we'd use router.push('/shop')
  }

  // Calculate active filter count
  const activeFilterCount = [
    filters.category?.length,
    filters.priceRange,
    filters.formats?.length,
    filters.authorId?.length,
    filters.publisherId?.length,
    filters.language?.length,
    filters.ageGroup?.length,
    filters.rating
  ].filter(Boolean).length

  // Get price range from cached categories data (full range) or current aggregations
  const fullPriceRange = categoriesData?.data?.aggregations?.priceRange
  const minPrice = fullPriceRange?.minPrice || aggregations?.priceRange?.minPrice || 0
  const maxPrice = fullPriceRange?.maxPrice || aggregations?.priceRange?.maxPrice || 1000000
  const currentPriceRange: [number, number] = filters.priceRange || [minPrice, maxPrice]

  // Get format types from aggregations or extract from products
  const formatTypesFromAggregations = aggregations?.formatTypes || []
  const formatTypesFromProducts = products.length > 0 && formatTypesFromAggregations.length === 0
    ? Array.from(new Set(products.flatMap((p: PublicProductDto) => 
        p.formats?.map(f => f.formatType).filter(Boolean) || []
      ))).map(formatType => ({
        key: formatType,
        label: formatType,
        count: products.filter((p: PublicProductDto) => 
          p.formats?.some(f => f.formatType === formatType)
        ).length
      }))
    : []
  const formatTypes = formatTypesFromAggregations.length > 0 
    ? formatTypesFromAggregations 
    : formatTypesFromProducts

  const formatLabels: { [key: string]: string } = {
    'Physical': 'جلد سخت',
    'Paperback': 'جلد نرم',
    'EBook': 'پی دی اف',
    'PDF': 'پی دی اف',
    'Audiobook': 'ام پی ۳',
    'MP3': 'ام پی ۳',
    'Streaming': 'استریمینگ',
    'ebook': 'کتاب الکترونیکی',
    'audiobook': 'کتاب صوتی',
    'physical': 'کتاب فیزیکی'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
      {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-900 mb-1">
            فروشگاه کتاب
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            مجموعه کتاب‌های فیزیکی، الکترونیکی و صوتی
        </p>
      </div>

      <div className="flex flex-col xl:flex-row-reverse gap-4 sm:gap-6 xl:gap-6">

        {/* Filters Sidebar */}
        <aside className={`
          xl:w-64 2xl:w-72 flex-shrink-0
          xl:sticky xl:top-4 xl:self-start
          xl:order-2
          ${showFilters ? 'fixed' : 'hidden xl:block'}
          ${showFilters ? 'inset-0 xl:inset-auto' : ''}
          z-50 xl:z-auto
        `}>
          {/* Mobile: Full overlay with drawer */}
          {showFilters && (
            <div className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFilters(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFilters(false);
              }}
              style={{ 
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label="Close filters"
            />
          )}
          
          {/* Filter Panel */}
          <div className={`
            ${showFilters ? 'fixed xl:static' : 'hidden xl:block'}
            ${showFilters ? 'top-0 bottom-0 rtl:right-0 ltr:left-0' : ''}
            ${showFilters ? 'w-80 max-w-[85vw] xl:w-auto' : ''}
            ${showFilters ? 'z-50 xl:z-auto' : ''}
            ${showFilters ? 'animate-in slide-in-from-right xl:animate-none' : ''}
            h-full xl:max-h-[calc(100vh-2rem)] flex flex-col bg-white 
            border-r xl:border border-gray-200 xl:rounded-lg xl:shadow-sm overflow-hidden
          `}>
            <div className="flex-shrink-0 border-b border-gray-200 px-3 py-2.5">
              <div className="flex items-center justify-between text-right">
                <span className="text-base font-normal text-gray-900">
                فیلترها
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFilters(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFilters(false);
                  }}
                  className="xl:hidden h-7 w-7 p-0 touch-manipulation active:scale-90 select-none"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  type="button"
                  aria-label="بستن فیلترها"
                >
                  <X className="h-4 w-4 pointer-events-none" />
                </Button>
              </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto px-3 py-4">
              {/* Category Filter */}
              <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                  دسته‌بندی
                </h3>
                <div className="space-y-0 text-right">
                  {categoryTree.length > 0 ? (
                    categoryTree.map((category: any) => renderCategoryItem(category, 0))
                  ) : hasInitialData ? (
                    <p className="text-sm text-muted-foreground py-2">دسته‌بندی‌ای یافت نشد</p>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">در حال بارگذاری...</p>
                  )}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="relative pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                  محدوده قیمت
                </h3>
                <button
                  onClick={() => setShowPriceSlider(!showPriceSlider)}
                  className="w-full text-right px-2 py-1.5 text-base text-gray-700 hover:text-primary transition-colors"
                >
                  {filters.priceRange 
                    ? `${toPersianNumber(currentPriceRange[0])} - ${toPersianNumber(currentPriceRange[1])} تومان`
                    : 'انتخاب محدوده قیمت'}
                </button>
                {showPriceSlider && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-pointer" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPriceSlider(false);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPriceSlider(false);
                      }}
                      style={{ 
                        touchAction: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      aria-label="بستن انتخابگر قیمت"
                    />
                    <div className="absolute z-50 mt-2 left-0 right-0">
                      <PriceRangeSlider
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        value={currentPriceRange}
                        distribution={fullPriceRange?.distribution || aggregations?.priceRange?.distribution}
                        onChange={(value) => {
                          // Only update local state, don't apply filter yet
                        }}
                        onApply={(value) => {
                          handleFilterChange('priceRange', value)
                          setShowPriceSlider(false)
                        }}
                        onCancel={() => {
                          setShowPriceSlider(false)
                        }}
                      />
                </div>
                  </>
                )}
              </div>

              {/* Format Filter */}
              <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                  فرمت
                </h3>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
                ) : formatTypes.length > 0 ? (
                  <SearchableMultiSelect
                    options={formatTypes.map((formatType: any) => {
                      const formatKey = formatType.key || formatType.label || formatType
                      const formatLabel = formatLabels[formatKey] || formatLabels[formatKey?.toLowerCase()] || formatType.label || formatKey
                      return {
                        value: formatKey,
                        label: formatLabel,
                        count: formatType.count
                      }
                    })}
                    value={filters.formats || []}
                    onChange={(value) => handleFilterChange('formats', value.length > 0 ? value : undefined)}
                    placeholder="انتخاب فرمت"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">فرمتی یافت نشد</p>
                )}
              </div>

              {/* Author Filter */}
              {authors.length > 0 && (
                <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                    نویسنده
                  </h3>
                  <SearchableMultiSelect
                    options={authors.map((author: any) => {
                      const authorId = author.id || author.key
                      const authorLabel = author.label || author.name
                      return {
                        value: authorId,
                        label: authorLabel,
                        count: author.count
                      }
                    })}
                    value={filters.authorId || []}
                    onChange={(value) => handleFilterChange('authorId', value.length > 0 ? value : undefined)}
                    placeholder="انتخاب نویسنده"
                  />
                </div>
              )}

              {/* Publisher Filter */}
              {publishers.length > 0 && (
                <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                    ناشر
                  </h3>
                  <SearchableMultiSelect
                    options={publishers.map((publisher: any) => {
                      const publisherId = publisher.id || publisher.key
                      const publisherLabel = publisher.label || publisher.name
                      return {
                        value: publisherId,
                        label: publisherLabel,
                        count: publisher.count
                      }
                    })}
                    value={filters.publisherId || []}
                    onChange={(value) => handleFilterChange('publisherId', value.length > 0 ? value : undefined)}
                    placeholder="انتخاب ناشر"
                  />
                </div>
              )}

              {/* Language Filter */}
              {languages.length > 0 && (
                <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                    زبان
                  </h3>
                  <SearchableMultiSelect
                    options={languages.map((language: any) => {
                      const languageKey = language.key || language.label
                      const rawLabel = language.label || language.name
                      const languageLabel = rawLabel === 'fa' ? 'فارسی' : rawLabel === 'en' ? 'انگلیسی' : rawLabel
                      return {
                        value: languageKey,
                        label: languageLabel,
                        count: language.count
                      }
                    })}
                    value={filters.language || []}
                    onChange={(value) => handleFilterChange('language', value.length > 0 ? value : undefined)}
                    placeholder="انتخاب زبان"
                  />
                </div>
              )}

              {/* Age Group Filter */}
              {ageGroups.length > 0 && (
                <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                  <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                    گروه سنی
                  </h3>
                  <SearchableMultiSelect
                    options={ageGroups.map((ageGroup: any) => {
                      const ageGroupKey = ageGroup.key || ageGroup.label
                      const ageGroupLabel = ageGroup.label || ageGroup.name
                      return {
                        value: ageGroupKey,
                        label: ageGroupLabel,
                        count: ageGroup.count
                      }
                    })}
                    value={filters.ageGroup || []}
                    onChange={(value) => handleFilterChange('ageGroup', value.length > 0 ? value : undefined)}
                    placeholder="انتخاب گروه سنی"
                  />
              </div>
              )}

              {/* Rating Filter */}
              <div className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-bold mb-2 text-right text-gray-900 uppercase tracking-wide">
                  حداقل امتیاز
                </h3>
                <div className="space-y-1 text-right">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center justify-start cursor-pointer rtl:space-x-reverse py-1 text-base">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">                     
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </div>
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={filters.rating === rating}
                        onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
                        className="rounded mr-1 rtl:mr-0 rtl:ml-1"
                      />
                      <span className="text-base text-gray-700">{toPersianNumber(rating)}+ ستاره</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={clearFilters} 
                className="w-full text-right text-sm py-2 mt-2 text-gray-600 hover:text-primary underline"
              >
                پاک کردن همه فیلترها
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 xl:order-1">
          {/* Mobile Filter Button */}
          <div className="mb-3 sm:mb-4 xl:hidden">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              className="relative text-sm px-3 py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 ml-1.5 rtl:ml-1.5 rtl:mr-0" />
              فیلترها
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 rtl:-right-1.5 ltr:-left-1.5 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
                </Button>
          </div>

          {/* Sort Options and Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-200">
            <p className="text-sm sm:text-base text-gray-600">
              {isLoading || isFetching ? 'در حال بارگذاری...' : (() => {
                const count = productsResponse?.data?.totalCount ?? products.length ?? 0;
                return count > 0 ? `${toPersianNumber(count)} نتیجه` : '';
              })()}
            </p>
            <div className="flex flex-wrap gap-1.5">
            {[
              { field: 'title' as const, label: 'عنوان' },
              { field: 'price' as const, label: 'قیمت' },
              { field: 'rating' as const, label: 'امتیاز' },
              { field: 'publishedDate' as const, label: 'تاریخ' },
            ].map((option) => (
                <button
                key={option.field}
                onClick={() => handleSortChange(option.field)}
                  className={`px-2 py-1 text-sm border rounded ${
                    sort.field === option.field 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <span className="flex items-center space-x-1 rtl:space-x-reverse">
                <span>{option.label}</span>
                {sort.field === option.field && (
                  sort.direction === 'asc' ? 
                    <SortAsc className="h-3 w-3" /> : 
                    <SortDesc className="h-3 w-3" />
                )}
                  </span>
                </button>
            ))}
          </div>
          </div>

          {/* Products Grid */}
          {isLoading || isFetching ? (
            <div className="flex justify-center items-center py-12 sm:py-20">
              <div className="text-center space-y-3 sm:space-y-4">
                <TvtoBookSpinner size="lg" />
                <p className="text-sm sm:text-base text-muted-foreground">در حال بارگذاری محصولات...</p>
              </div>
            </div>
          ) : (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-0'}`}>
              {products.map((product: PublicProductDto) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}

          {products.length === 0 && !isLoading && !isFetching && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-muted-foreground text-lg sm:text-xl">محصولی یافت نشد</p>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                فیلترها یا عبارت جستجوی خود را تنظیم کنید
              </p>
            </div>
          )}

          {/* Pagination */}
          {productsResponse?.data?.totalPages && productsResponse.data.totalPages > 1 && (
            <div className="mt-6 sm:mt-8">
              <Pagination
                currentPage={productsResponse.data.pageNumber}
                totalPages={productsResponse.data.totalPages}
                totalItems={productsResponse.data.totalCount}
                pageSize={productsResponse.data.pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                showInfo={true}
                className="rtl:flex-row-reverse"
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, viewMode }: { product: PublicProductDto; viewMode: 'grid' | 'list' }) {
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
  const originalPrice = hasRealDiscount ? bestFormat.price : null;
  const discountPercentage = hasRealDiscount && bestFormat.discountPercentage ? bestFormat.discountPercentage : null;
  const formatType = product.formats[0]?.formatType || 'physical';
  const { addItem } = useCartStore();
  const { showToast } = useToast();
  const router = useRouter();

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.formats || product.formats.length === 0) {
      showToast({ type: 'error', title: 'این محصول فرمت قابل فروشی ندارد.' });
      return;
    }

    const selectedFormat = product.formats[0];
    
    if (selectedFormat.formatType?.toLowerCase() === 'physical') {
      const stockQuantity = selectedFormat.stockQuantity ?? 0;
      if (stockQuantity <= 0) {
        showToast({ type: 'error', title: 'این محصول در حال حاضر موجود نیست.' });
        return;
      }
    }

    const itemToAdd = {
      ...product,
      selectedFormat,
      quantity: 1,
      price: selectedFormat.finalPrice || displayPrice
    };
    
    addItem(itemToAdd as any);
    showToast({ type: 'success', title: 'محصول به سبد خرید اضافه شد.' });
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/product?slug=${product.slug}`);
  };
  
  if (viewMode === 'list') {
    return (
      <Link href={`/product?slug=${product.slug}`}>
        <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-200 last:border-b-0">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-24 sm:w-32 h-32 sm:h-40 overflow-hidden bg-gray-100">
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-normal mb-1 group-hover:text-primary transition-colors text-gray-900 line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{authors}</p>
                  {product.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {product.description}
                  </p>
                  )}
                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
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
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {product.categoryName && (
                      <span className="text-xs text-gray-500">{product.categoryName}</span>
                    )}
                    {formatType && (
                      <span className="text-xs text-gray-500">
                        {formatType === 'physical' ? 'فیزیکی' : formatType === 'ebook' ? 'الکترونیکی' : 'صوتی'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      className="bg-[#aa0001] hover:bg-[#880001] text-white px-3 py-1.5 text-xs font-normal rounded"
                      onClick={handleQuickAdd}
                    >
                      افزودن به سبد
                    </Button>
                    <Button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 text-xs font-normal rounded"
                      onClick={handleViewDetails}
                    >
                      جزئیات
                  </Button>
                  </div>
                </div>
                <div className="text-left sm:text-left rtl:sm:text-right ltr:sm:text-right sm:ml-4 rtl:sm:ml-0 rtl:sm:mr-4 ltr:sm:ml-4 flex sm:block items-center sm:items-start justify-between sm:justify-start gap-2">
                  <div>
                    {hasRealDiscount && originalPrice && originalPrice > displayPrice ? (
                      <div>
                        <p className="text-xs text-gray-400 line-through mb-0.5">{toPersianNumber(originalPrice)} تومان</p>
                        <p className="text-base sm:text-lg font-normal text-gray-900 mb-1">{toPersianNumber(displayPrice)} تومان</p>
                        {discountPercentage && discountPercentage > 0 && (
                          <p className="text-xs text-red-600 font-medium">{toPersianNumber(discountPercentage)}% تخفیف</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-base sm:text-lg font-normal text-gray-900 mb-1">{toPersianNumber(displayPrice)} تومان</p>
                    )}
                  {formatType === 'ebook' && (
                      <p className="text-xs text-green-700 font-medium">دانلود فوری</p>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

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
          
          <div className="mb-2">
            <div className="flex flex-col gap-1">
              {hasRealDiscount && originalPrice && originalPrice > displayPrice ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 line-through">{toPersianNumber(originalPrice)} تومان</span>
                    {discountPercentage && discountPercentage > 0 && (
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">{toPersianNumber(discountPercentage)}% تخفیف</span>
                    )}
                  </div>
                  <span className="text-base font-bold text-primary">
                    {toPersianNumber(displayPrice)} تومان
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-primary">
                  {toPersianNumber(displayPrice)} تومان
                </span>
              )}
            </div>
          </div>
          
          {formatType === 'ebook' && (
            <p className="text-xs text-green-600 font-semibold mb-2">دانلود فوری</p>
          )}
          
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-[#aa0001] hover:bg-[#880001] text-white px-2 py-2 text-xs font-medium rounded-md shadow-sm hover:shadow transition-all"
              size="sm"
              onClick={handleQuickAdd}
            >
              افزودن به سبد
            </Button>
            <Button 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-2 text-xs font-medium rounded-md transition-all"
              size="sm"
              onClick={handleViewDetails}
            >
              جزئیات
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <TvtoBookSpinner />
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  )
}
