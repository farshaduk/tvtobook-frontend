'use client';

import React, { useState, useEffect } from 'react'
import adminApi, { AdminUserDto, AdminUserDetailDto } from '@/services/adminApi'
import { toast } from 'react-hot-toast'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

const AdminBusinessUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserDetailDto | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    fetchBusinessUsers()
    //fetchUserStats()
  }, [currentPage, searchTerm, filterStatus])

  const fetchBusinessUsers = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getUsers(currentPage, 20, searchTerm)
      
      // Filter only business users
      const businessUsers = response.data.users.filter((user: AdminUserDto) => user.userType === 'Business')
      
      setUsers(businessUsers)
      setPagination({
        ...response.data.pagination,
        totalUsers: businessUsers.length
      })
    } catch (error) {
      console.error('❌ Error fetching business users:', error)
      toast.error('Error loading businesses', {
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

  // const fetchUserStats = async () => {
  //   try {
  //     const response = await adminApi.getUserStats()
  //     setUserStats(response.data)
  //   } catch (error) {
  //     // Stats loading failure is not critical
  //   }
  // }

  const viewUserDetail = async (userId: string) => {
    try {
      const response = await adminApi.getUser(userId)
      setSelectedUser(response.data)
      setShowUserModal(true)
    } catch (error) {
      toast.error('Error loading business details', {
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

  const handleVerifyUser = async (userId: string) => {
    setActionLoading(`verify-${userId}`)
    try {
      await adminApi.verifyUser(userId)
      toast.success('Business verified successfully', {
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
      fetchBusinessUsers()
    } catch (error) {
      toast.error('Error verifying business', {
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

  const getStatusBadge = (user: AdminUserDto) => {
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircleIcon className="w-3 h-3" />
          Inactive
        </span>
      )
    }
    if (user.isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircleIcon className="w-3 h-3" />
          Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <ExclamationTriangleIcon className="w-3 h-3" />
        Pending Verification
      </span>
    )
  }

  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive) ||
      (filterStatus === 'verified' && user.isVerified) ||
      (filterStatus === 'unverified' && !user.isVerified)
    
    return matchesStatus
  })

  const handleExportUsers = async () => {
    try {
      setActionLoading('export')
      // Create CSV content
      const csvContent = generateBusinessUsersCsv(users)
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `business-users-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Business users file downloaded successfully', {
        icon: '📥',
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
        }
      })
    } catch (error) {
      toast.error('Error downloading file', {
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
        }
      })
    } finally {
      setActionLoading(null)
    }
  }

  const generateBusinessUsersCsv = (users: AdminUserDto[]) => {
    const headers = [
      'Business Name',
      'Contact Person', 
      'Email',
      'Phone Number',
      'Status',
      'Join Date',
      'City',
      'Province',
      'Total Ads',
      'Active Ads'
    ]
    
    const csvRows = [headers.join(',')]
    
    for (const user of users) {
      const row = [
        user.businessName || '',
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.phoneNumber || '',
        user.isActive ? 'Active' : 'Inactive',
        new Date(0).toLocaleDateString('en-US'),
        user.city || '',
        user.province || '',
        user.totalAds || 0,
        user.activeAds || 0
      ]
      csvRows.push(row.join(','))
    }
    
    return csvRows.join('\n')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Users</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all registered business accounts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportUsers}
                disabled={actionLoading === 'export'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                {actionLoading === 'export' ? 'Downloading...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div key="total-businesses" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Businesses</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.businessUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">+15% from last month</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div key="verified-businesses" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.verifiedBusinessUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div key="pending-businesses" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pending Verification</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.pendingBusinessUsers || 0).toLocaleString()}</p>
                  <p className="text-xs text-yellow-600 font-medium">Needs Review</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div key="new-businesses" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.newBusinessUsersThisMonth || 0).toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">+18% from last month</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[120px]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              
              <button className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                <FunnelIcon className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Modern Business Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Business Users List ({filteredUsers.length} businesses)
              </h3>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {pagination?.totalPages || 1}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading business users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Business Info
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Contact Details
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Ads
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Join Date
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                <BuildingOfficeIcon className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.businessName || 'Unnamed Business'}
                              </div>
                              <div className="text-sm text-gray-500">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phoneNumber || 'No phone'}</div>
                          <div className="text-sm text-gray-500">{user.city || ''}, {user.province || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">Total: {user.totalAds || 0}</div>
                          <div className="text-sm text-gray-500">Active: {user.activeAds || 0}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(0).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => viewUserDetail(user.id)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {!user.isVerified && (
                              <button
                                onClick={() => handleVerifyUser(user.id)}
                                disabled={actionLoading === `verify-${user.id}`}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Verify Business"
                              >
                                {actionLoading === `verify-${user.id}` ? (
                                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircleIcon className="w-4 h-4" />
                                )}
                              </button>
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
                      <span className="font-medium">{Math.min(currentPage * 20, pagination.totalUsers || 0)}</span> of{' '}
                      <span className="font-medium">{pagination.totalUsers || 0}</span> businesses
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

        {/* Enhanced Business Detail Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-8 mx-auto max-w-4xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Business Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Complete information for {selectedUser.businessName || 'Unnamed Business'}</p>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
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
                    {/* Business Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Business Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.businessName || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.firstName} {selectedUser.lastName}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.email}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.phoneNumber || 'Not provided'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.city || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.province || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Account Information</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Account Type:</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                            🏢 Business
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Status:</span>
                          {getStatusBadge(selectedUser)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Join Date:</span>
                          <span className="text-sm text-gray-900">{new Date(0).toLocaleDateString('en-US')}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total Ads:</span>
                          <span className="text-sm text-gray-900">{selectedUser.totalAds || 0}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Active Ads:</span>
                          <span className="text-sm text-gray-900">{selectedUser.activeAds || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    {!selectedUser.isVerified && (
                      <button
                        onClick={() => {
                          handleVerifyUser(selectedUser.id)
                          setShowUserModal(false)
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Verify Business
                      </button>
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

export default AdminBusinessUsersPage

