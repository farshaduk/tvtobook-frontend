"use client";

import * as React from "react";
import { toPersianNumber } from "@/utils/numberUtils";

interface PriceRangeSliderProps {
  minPrice: number;
  maxPrice: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onApply: (value: [number, number]) => void;
  onCancel: () => void;
  currency?: string;
  distribution?: number[];
}

export function PriceRangeSlider({
  minPrice,
  maxPrice,
  value,
  onChange,
  onApply,
  onCancel,
  currency = "تومان",
  distribution
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState<'min' | 'max' | null>(null);
  const prevValueRef = React.useRef<[number, number]>(value);

  React.useEffect(() => {
    // Only update if value actually changed (not just reference)
    if (value[0] !== prevValueRef.current[0] || value[1] !== prevValueRef.current[1]) {
      setLocalValue(value);
      prevValueRef.current = value;
    }
  }, [value]);

  const getPercentage = (price: number) => {
    if (maxPrice === minPrice) return 0;
    return ((price - minPrice) / (maxPrice - minPrice)) * 100;
  };

  const getPriceFromPercentage = (percentage: number) => {
    return minPrice + (percentage / 100) * (maxPrice - minPrice);
  };

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const newPrice = Math.round(getPriceFromPercentage(clampedPercentage));

    if (isDragging === 'min') {
      const newMin = Math.max(minPrice, Math.min(newPrice, localValue[1] - 1));
      setLocalValue([newMin, localValue[1]]);
    } else {
      const newMax = Math.min(maxPrice, Math.max(newPrice, localValue[0] + 1));
      setLocalValue([localValue[0], newMax]);
    }
  }, [isDragging, localValue, minPrice, maxPrice]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleApply = () => {
    onApply(localValue);
  };

  const handleCancel = () => {
    setLocalValue(value);
    onCancel();
  };

  // Calculate distribution curve based on selected price range
  const distributionPoints = React.useMemo(() => {
    if (distribution && distribution.length > 0 && maxPrice > minPrice) {
      const bucketCount = distribution.length;
      const priceRange = maxPrice - minPrice;
      const selectedMin = localValue[0];
      const selectedMax = localValue[1];

      // Calculate which buckets fall within the selected range
      const selectedBuckets: number[] = [];
      for (let i = 0; i < bucketCount; i++) {
        const bucketStart = minPrice + (i / bucketCount) * priceRange;
        const bucketEnd = minPrice + ((i + 1) / bucketCount) * priceRange;
        
        // Check if bucket overlaps with selected range
        if (bucketEnd >= selectedMin && bucketStart <= selectedMax) {
          // Calculate overlap percentage
          const overlapStart = Math.max(bucketStart, selectedMin);
          const overlapEnd = Math.min(bucketEnd, selectedMax);
          const overlapRatio = (overlapEnd - overlapStart) / (bucketEnd - bucketStart);
          selectedBuckets.push(distribution[i] * overlapRatio);
        }
      }

      // If we have selected buckets, scale them to fill visualization width
      if (selectedBuckets.length > 0) {
        // Normalize to 0-1 range for visualization
        const maxValue = Math.max(...selectedBuckets, 0.01);
        const normalized = selectedBuckets.map(val => val / maxValue);
        
        // Scale to fill all 20 visualization points
        const scaledPoints: number[] = [];
        const normalizedLength = normalized.length;
        for (let i = 0; i < bucketCount; i++) {
          const sourceIndex = Math.floor((i / bucketCount) * normalizedLength);
          scaledPoints.push(normalized[Math.min(sourceIndex, normalizedLength - 1)]);
        }
        return scaledPoints;
      }
      
      // If no buckets in selected range, return flat line
      return new Array(bucketCount).fill(0.1);
    }
    
    // Fallback to simple distribution if no data available
    const points = 20;
    const data: number[] = [];
    for (let i = 0; i < points; i++) {
      const x = i / (points - 1);
      const height = Math.sin(x * Math.PI) * 0.8 + 0.2;
      data.push(height);
    }
    return data;
  }, [distribution, minPrice, maxPrice, localValue]);

  const minPercentage = getPercentage(localValue[0]);
  const maxPercentage = getPercentage(localValue[1]);

  return (
    <div className="relative">
      {/* Triangle indicator */}
      <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 z-10" />
      
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200" dir="rtl">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-1">محدوده قیمت</h4>
          <p className="text-xs text-gray-500">میانگین قیمت: {toPersianNumber(Math.round((minPrice + maxPrice) / 2))} {currency}</p>
        </div>

      {/* Distribution Graph */}
      <div className="relative h-16 mb-6" ref={sliderRef}>
        {/* Background distribution visualization */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d={`M 0,100 ${distributionPoints.map((height, i) => {
              const x = (i / (distributionPoints.length - 1)) * 100;
              const y = 100 - (height * 80);
              return `L ${x},${y}`;
            }).join(' ')} L 100,100 Z`}
            fill="url(#priceGradient)"
          />
        </svg>

        {/* Slider Track */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-gray-200 rounded-full relative">
            {/* Active range */}
            <div
              className="absolute h-1 bg-orange-500 rounded-full"
              style={{
                left: `${minPercentage}%`,
                width: `${maxPercentage - minPercentage}%`
              }}
            />
            {/* Min handle */}
            <div
              className="absolute w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-grab active:cursor-grabbing shadow-md transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-10"
              style={{ left: `${minPercentage}%` }}
              onMouseDown={handleMouseDown('min')}
            />
            {/* Max handle */}
            <div
              className="absolute w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-grab active:cursor-grabbing shadow-md transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-10"
              style={{ left: `${maxPercentage}%` }}
              onMouseDown={handleMouseDown('max')}
            />
          </div>
        </div>
      </div>

      {/* Price Values and Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {toPersianNumber(localValue[0])} {currency}
          </span>
          <button
            onClick={handleCancel}
            className="text-xs text-orange-500 underline mt-1 text-right"
          >
            لغو
          </button>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">
            {toPersianNumber(localValue[1])} {currency}
          </span>
          <button
            onClick={handleApply}
            className="text-xs text-orange-500 underline mt-1"
          >
            اعمال
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

