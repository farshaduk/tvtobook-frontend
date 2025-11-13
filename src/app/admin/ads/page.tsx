'use client';

import React, { useState, useEffect } from 'react'
import adminApi, { AdminAdDto, AdminAdDetailDto, AdminUpdateAdDto } from '@/services/adminApi'
import { toast } from 'react-hot-toast'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EllipsisVerticalIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  FireIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const AdminAdsPage: React.FC = () => {
  const [ads, setAds] = useState<AdminAdDto[]>([])
  const [pendingAds, setPendingAds] = useState<AdminAdDto[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedAd, setSelectedAd] = useState<AdminAdDetailDto | null>(null)
  const [showAdModal, setShowAdModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAd, setEditingAd] = useState<AdminUpdateAdDto | null>(null)
  const [editingAdId, setEditingAdId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [adStats, setAdStats] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    if (activeTab === 'all') {
      fetchAds()
    } else if (activeTab === 'pending') {
      fetchPendingAds()
    }
    fetchAdStats()
  }, [currentPage, searchTerm, statusFilter, categoryFilter, activeTab])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAds(currentPage, 20, searchTerm, statusFilter, categoryFilter)
      setAds(response.data.ads)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('❌ Error fetching ads:', error)
      toast.error('Error loading ads', {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'left',
          direction: 'ltr',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingAds = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getPendingAds(currentPage, 20)
      setPendingAds(response.data.ads)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('❌ Error fetching pending ads:', error)
      toast.error('Error loading pending ads', {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'left',
          direction: 'ltr',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAdStats = async () => {
    try {
      const response = await adminApi.getAdStats()
      setAdStats(response.data)
    } catch (error) {
      // Stats loading failure is not critical
    }
  }

  const viewAdDetail = async (adId: string) => {
    try {
      const response = await adminApi.getAd(adId)
      setSelectedAd(response.data)
      setShowAdModal(true)
    } catch (error) {
      toast.error('Error loading ad details', {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          fontFamily: 'iranSans, sans-serif',
          textAlign: 'right',
          direction: 'rtl',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
        }
      })
    }
  }

  const handleApproveAd = async (adId: string) => {
    setActionLoading(`approve-${adId}`)
    try {
      await adminApi.approveAd(adId)
      toast.success('Ad approved successfully', {
        icon: '✅',
        style: {
          background: '#10B981',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'left',
          direction: 'ltr',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      })
      if (activeTab === 'pending') {
        fetchPendingAds()
      } else {
        fetchAds()
      }
    } catch (error) {
      toast.error('Error approving ad', {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'left',
          direction: 'ltr',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectAd = async (adId: string) => {
    setActionLoading(`reject-${adId}`)
    try {
      // await adminApi.rejectAd(adId)
      // toast.success('Ad rejected successfully', {
      //   icon: '✅',
      //   style: {
      //     background: '#10B981',
      //     color: '#ffffff',
      //     fontFamily: 'Arial, sans-serif',
      //     textAlign: 'left',
      //     direction: 'ltr',
      //     borderRadius: '12px',
      //     fontSize: '14px',
      //     fontWeight: '500',
      //     padding: '16px',
      //     boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      //   }
      // })
      if (activeTab === 'pending') {
        fetchPendingAds()
      } else {
        fetchAds()
      }
    } catch (error) {
      toast.error('Error rejecting ad', {
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'left',
          direction: 'ltr',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        }
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (ad: AdminAdDto) => {
    switch (ad.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircleIcon className="w-3 h-3" />
            Active
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <ClockIcon className="w-3 h-3" />
            Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircleIcon className="w-3 h-3" />
            Rejected
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            <ExclamationTriangleIcon className="w-3 h-3" />
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            <ExclamationTriangleIcon className="w-3 h-3" />
            Unknown
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <FireIcon className="w-3 h-3" />
            High
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <StarIcon className="w-3 h-3" />
            Medium
          </span>
        )
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <ClockIcon className="w-3 h-3" />
            Low
          </span>
        )
      default:
        return null
    }
  }

  const currentAds = activeTab === 'pending' ? pendingAds : ads

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all ads in the system
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {/* Handle export */}}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        {adStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div key="total-ads" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Ads</p>
                  <p className="text-2xl font-bold text-gray-900">{(adStats.totalAds || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">+8% from last month</p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
              </div>
            </div>
            
            <div key="pending-ads" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{(adStats.pendingAds || 0).toLocaleString()}</p>
                  <p className="text-xs text-yellow-600 font-medium">Needs Review</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div key="active-ads" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{(adStats.activeAds || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div key="rejected-ads" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{(adStats.rejectedAds || 0).toLocaleString()}</p>
                  <p className="text-xs text-red-600 font-medium">This month</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Ads
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending Review
            </button>
          </div>
        </div>

        {/* Modern Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[120px]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              
              <button className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                <FunnelIcon className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Modern Ads Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'pending' ? 'Pending Ads' : 'All Ads'} ({currentAds.length} ads)
              </h3>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {pagination?.totalPages || 1}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading ads...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Ad Details
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        User
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Priority
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Created
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentAds.map((ad, index) => (
                      <tr key={ad.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 h-12">
                              <img 
                              //  src={ad.images[0]?.url || '/placeholder-image.jpg'} 
                                alt={ad.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {ad.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{ad.title}</div>
                              <div className="text-xs text-gray-400">{ad.categoryName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{ad.userName}</div>
                          <div className="text-sm text-gray-500">{ad.userEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(ad)}
                        </td>
                        <td className="px-6 py-4">
                          {getPriorityBadge(ad.isFeatured ? 'high' : 'medium')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(ad.datePosted).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => viewAdDetail(ad.id)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {ad.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveAd(ad.id)}
                                  disabled={actionLoading === `approve-${ad.id}`}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve Ad"
                                >
                                  {actionLoading === `approve-${ad.id}` ? (
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <CheckCircleIcon className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectAd(ad.id)}
                                  disabled={actionLoading === `reject-${ad.id}`}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject Ad"
                                >
                                  {actionLoading === `reject-${ad.id}` ? (
                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <XCircleIcon className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {pagination && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * 20, pagination.totalAds || 0)}</span> of{' '}
                      <span className="font-medium">{pagination.totalAds || 0}</span> ads
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, pagination.totalPages || 1))].map((_, i) => {
                          const pageNum = i + 1
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages || 1, currentPage + 1))}
                        disabled={currentPage === (pagination.totalPages || 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Ad Detail Modal */}
        {showAdModal && selectedAd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-8 mx-auto max-w-4xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Ad Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Complete information for {selectedAd.title}</p>
                  </div>
                  <button
                    onClick={() => setShowAdModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ad Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Ad Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedAd.title}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedAd.description}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedAd.categoryName}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedAd.price}</p>
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">User Information</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">User Name:</span>
                          <span className="text-sm text-gray-900">{selectedAd.userName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Email:</span>
                          <span className="text-sm text-gray-900">{selectedAd.userEmail}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Status:</span>
                          {getStatusBadge(selectedAd)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Created:</span>
                          <span className="text-sm text-gray-900">{new Date(selectedAd.datePosted).toLocaleDateString('en-US')}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Priority:</span>
                          {getPriorityBadge(selectedAd.isFeatured ? 'high' : 'medium')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowAdModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    {selectedAd.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleApproveAd(selectedAd.id)
                            setShowAdModal(false)
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Approve Ad
                        </button>
                        <button
                          onClick={() => {
                            handleRejectAd(selectedAd.id)
                            setShowAdModal(false)
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject Ad
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAdsPage

