'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  RefreshCw,
  ExternalLink,
  Calendar,
  Navigation,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'pending';
  currentLocation: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  timeline: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
  }>;
  packageDetails: {
    weight: string;
    dimensions: string;
    service: string;
  };
  deliveryInstructions?: string;
  signatureRequired: boolean;
}

interface OrderTrackingModalProps {
  trackingInfo: TrackingInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: (trackingNumber: string) => void;
}

const statusConfig = {
  pending: { 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: Clock,
    label: 'Pending'
  },
  in_transit: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: Truck,
    label: 'In Transit'
  },
  out_for_delivery: { 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    icon: Package,
    label: 'Out for Delivery'
  },
  delivered: { 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
    icon: CheckCircle,
    label: 'Delivered'
  },
  exception: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: AlertCircle,
    label: 'Exception'
  },
};

export function OrderTrackingModal({
  trackingInfo,
  isOpen,
  onClose,
  onRefresh
}: OrderTrackingModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (isOpen && trackingInfo) {
      setLastUpdated(new Date());
    }
  }, [isOpen, trackingInfo]);

  const handleRefresh = async () => {
    if (!trackingInfo || !onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh(trackingInfo.trackingNumber);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!trackingInfo) return null;

  const StatusIcon = statusConfig[trackingInfo.status].icon;
  const statusColor = statusConfig[trackingInfo.status].color;
  const statusLabel = statusConfig[trackingInfo.status].label;

  const getProgressPercentage = () => {
    switch (trackingInfo.status) {
      case 'pending': return 10;
      case 'in_transit': return 50;
      case 'out_for_delivery': return 80;
      case 'delivered': return 100;
      case 'exception': return 30;
      default: return 0;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/20 w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Track Package
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tracking #{trackingInfo.trackingNumber}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={`${statusColor} border`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">{statusLabel}</span>
                </Badge>
                
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {statusLabel}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {trackingInfo.currentLocation}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Progress</span>
                      <span className="font-medium">{getProgressPercentage()}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                      <p className="font-semibold">
                        {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {trackingInfo.actualDelivery && (
                      <div>
                        <p className="text-sm text-muted-foreground">Actual Delivery</p>
                        <p className="font-semibold text-emerald-600">
                          {new Date(trackingInfo.actualDelivery).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Package Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-semibold">{trackingInfo.packageDetails.weight}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-semibold">{trackingInfo.packageDetails.dimensions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-semibold">{trackingInfo.packageDetails.service}</p>
                    </div>
                  </div>
                  
                  {trackingInfo.deliveryInstructions && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Delivery Instructions:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        {trackingInfo.deliveryInstructions}
                      </p>
                    </div>
                  )}

                  {trackingInfo.signatureRequired && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        ⚠️ Signature Required
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        Someone must be present to sign for this package.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tracking Timeline
                  </CardTitle>
                  <CardDescription>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingInfo.timeline.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            index === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {index === 0 ? <CheckCircle className="h-4 w-4" /> : 
                             index === trackingInfo.timeline.length - 1 ? <Clock className="h-4 w-4" /> :
                             <div className="w-2 h-2 bg-current rounded-full" />}
                          </div>
                          {index < trackingInfo.timeline.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2" />
                          )}
                        </div>
                        
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              {event.status}
                            </h4>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {new Date(event.date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.time}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Carrier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Carrier Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {trackingInfo.carrier}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tracking Number: {trackingInfo.trackingNumber}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track on {trackingInfo.carrier}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Standalone tracking component for embedding in other pages
export function TrackingWidget({ trackingNumber }: { trackingNumber: string }) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock tracking data - replace with actual API call
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTrackingInfo({
        trackingNumber,
        carrier: 'FedEx',
        status: 'in_transit',
        currentLocation: 'Memphis, TN',
        estimatedDelivery: '2024-01-25T18:00:00Z',
        timeline: [
          {
            date: '2024-01-20T10:00:00Z',
            time: '10:00 AM',
            status: 'Package Picked Up',
            location: 'Los Angeles, CA',
            description: 'Package picked up from sender'
          },
          {
            date: '2024-01-21T14:30:00Z',
            time: '2:30 PM',
            status: 'In Transit',
            location: 'Phoenix, AZ',
            description: 'Package in transit to destination'
          },
          {
            date: '2024-01-22T09:15:00Z',
            time: '9:15 AM',
            status: 'In Transit',
            location: 'Memphis, TN',
            description: 'Package arrived at sorting facility'
          }
        ],
        packageDetails: {
          weight: '2.5 lbs',
          dimensions: '12" x 8" x 2"',
          service: 'FedEx Ground'
        },
        signatureRequired: true
      });
      setIsLoading(false);
    }, 1000);
  }, [trackingNumber]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Loading tracking information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trackingInfo) return null;

  const StatusIcon = statusConfig[trackingInfo.status].icon;
  const statusColor = statusConfig[trackingInfo.status].color;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Package Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge className={`${statusColor} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              <span className="text-xs">{statusConfig[trackingInfo.status].label}</span>
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {trackingInfo.currentLocation}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">Est. Delivery</p>
          </div>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        <Button variant="outline" className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Tracking
        </Button>
      </CardContent>
    </Card>
  );
}

function getProgressPercentage(): number {
  // This would be calculated based on actual tracking status
  return 60;
}



