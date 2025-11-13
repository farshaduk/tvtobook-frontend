'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import adminApi, { AdminUserDto, AdminUserDetailDto, AdminUpdateUserDto, AdminCreateUserDto, RoleInfoDto, UserOnlineStatusDto } from '../../../services/adminApi';
import { authorApi, ApiCreateAuthorByAdminDto, ApiAuthorDto } from '../../../services/api';
import { analyticsApi } from '../../../services/api';
import { toast } from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EllipsisVerticalIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const AdminUsersPage: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserDetailDto | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive: boolean;
    emailConfirmed: boolean;
    phoneNumberConfirmed: boolean;
    isProfileComplete: boolean;
  } | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<AdminCreateUserDto>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    isActive: true,
    isVerified: false,
    isEmailVerified: false,
    isPhoneVerified: false,
    city: '',
    province: '',
    postalCode: '',
    businessName: '',
    businessDescription: '',
    businessWebsite: '',
    userType: 'Individual'
  });
  const [userStats, setUserStats] = useState<any>(null);
  const [authors, setAuthors] = useState<ApiAuthorDto[]>([]);
  const [allUsersForStats, setAllUsersForStats] = useState<AdminUserDto[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Role management states
  const [allRoles, setAllRoles] = useState<RoleInfoDto[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<AdminUserDto | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  
  // Online status states
  const [showOnlineStatusModal, setShowOnlineStatusModal] = useState(false);
  const [selectedUserForOnlineStatus, setSelectedUserForOnlineStatus] = useState<AdminUserDto | null>(null);
  const [userOnlineStatus, setUserOnlineStatus] = useState<UserOnlineStatusDto | null>(null);
  const [onlineStatusLoading, setOnlineStatusLoading] = useState(false);

  // Create author modal states
  const [showCreateAuthorModal, setShowCreateAuthorModal] = useState(false);
  const [selectedUserForAuthor, setSelectedUserForAuthor] = useState<AdminUserDto | null>(null);
  const [newAuthor, setNewAuthor] = useState<ApiCreateAuthorByAdminDto>({
    UserId: '',
    PenName: '',
    Biography: '',
    Website: '',
    Nationality: '',
    ProfileImageUrl: '',
    DateOfBirth: '',
    ApprovalStatus: 'Approved',
    ApprovalNote: '',
    IsActive: true,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    fetchUsers();
    fetchAllRoles();
    fetchAuthors();
    fetchAllUsersForStats();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    // Only fetch data in browser, not during static export build
    if (typeof window === 'undefined') return;
    
    fetchUserStats();
  }, [allUsersForStats, authors]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(currentPage, 20, searchTerm);
  const data: any = response?.data;

      // Validate response shape before updating state to avoid runtime crashes
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error('Unexpected response shape from adminApi.getUsers:', response);
        // Keep existing users state (do not assign undefined) to prevent client crashes
        toast.error('خطا در دریافت فهرست کاربران از سرور');
      }
    } catch (error) {
      toast.error('خطا در بارگذاری کاربران');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsersForStats = async () => {
    try {
      const response = await adminApi.getAllUsers();
  const data: any = response?.data;

      // Response might be an array or an envelope { data: [...] } depending on server.
      if (Array.isArray(data)) {
        setAllUsersForStats(data);
      } else if (data && Array.isArray(data.users)) {
        setAllUsersForStats(data.users);
      } else {
        console.error('Unexpected response shape from adminApi.getAllUsers:', response);
        // Do not overwrite existing stats array if server response is malformed
      }
    } catch (error) {
      // Stats loading failure is not critical
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!allUsersForStats || allUsersForStats.length === 0) {
        setUserStats({
          totalUsers: 0,
          verifiedUsers: 0,
          authorUsers: 0,
          newUsersThisMonth: 0,
          totalUsersChange: 0,
          verifiedUsersChange: 0,
          authorUsersChange: 0,
          newUsersThisMonthChange: 0
        });
        return;
      }

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate current month stats from ALL users (not paginated)
      const totalUsers = allUsersForStats.length;
      const verifiedUsers = allUsersForStats.filter(u => u.isVerified).length;
      const authorUsers = allUsersForStats.filter(u => u.isAuthor === true).length;
      const newUsersThisMonth = allUsersForStats.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= currentMonthStart;
      }).length;

      // Calculate stats at the end of last month (users created before this month)
      const usersBeforeThisMonth = allUsersForStats.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt < currentMonthStart;
      });
      
      const lastMonthTotal = usersBeforeThisMonth.length;
      const lastMonthVerified = usersBeforeThisMonth.filter(u => u.isVerified).length;
      const lastMonthAuthor = usersBeforeThisMonth.filter(u => u.isAuthor === true).length;

      // Calculate new users in last month
      const lastMonthNew = allUsersForStats.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
      }).length;

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // For total users, compare with total users at the end of last month
      const totalUsersChange = calculateChange(totalUsers, lastMonthTotal);

      // For verified users, compare verified count at the end of last month
      const verifiedUsersChange = calculateChange(verifiedUsers, lastMonthVerified);

      // For author users, compare author count at the end of last month
      const authorUsersChange = calculateChange(authorUsers, lastMonthAuthor);

      // For new users this month, compare with new users last month
      const newUsersThisMonthChange = calculateChange(newUsersThisMonth, lastMonthNew);

      setUserStats({
        totalUsers,
        verifiedUsers,
        authorUsers,
        newUsersThisMonth,
        totalUsersChange,
        verifiedUsersChange,
        authorUsersChange,
        newUsersThisMonthChange
      });
    } catch (error) {
      // Stats loading failure is not critical
    }
  };

  const fetchAllRoles = async () => {
    try {
      const response = await adminApi.getAllRoles();
      setAllRoles(response.data);
    } catch (error) {
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await authorApi.getAll();
      if (response.data.isSucceeded && response.data.data) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          setAuthors(data);
        } else if (data.authors && Array.isArray(data.authors)) {
          setAuthors(data.authors);
        }
      }
    } catch (error) {
      // Authors loading failure is not critical
    }
  };

  const viewUserDetail = async (userId: string) => {
    try {
      // Use the user data from the table instead of making another API call
      const userFromTable = users.find(user => user.id === userId);
      if (userFromTable) {
        setSelectedUser(userFromTable as AdminUserDetailDto);
        setShowUserModal(true);
      } else {
        // Fallback to API call if user not found in table
        const response = await adminApi.getUser(userId);
        setSelectedUser(response.data);
        setShowUserModal(true);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری جزئیات کاربر');
    }
  };

  const startEditUser = (user: AdminUserDto) => {
    setEditingUser({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      emailConfirmed: user.isEmailVerified,
      phoneNumberConfirmed: user.isPhoneVerified,
      isProfileComplete: user.isVerified
    });
    setEditingUserId(user.id);
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editingUserId) return;

    setActionLoading('update');
    try {
      const updateData = {
        Id: editingUser.id,
        FirstName: editingUser.firstName,
        LastName: editingUser.lastName,
        PhoneNumber: editingUser.phoneNumber,
        IsActive: editingUser.isActive,
        EmailConfirmed: editingUser.emailConfirmed,
        PhoneNumberConfirmed: editingUser.phoneNumberConfirmed,
        IsProfileComplete: editingUser.isProfileComplete
      };
      await adminApi.updateUser(editingUserId, updateData);
      toast.success('کاربر با موفقیت به‌روزرسانی شد');
      setShowEditModal(false);
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      toast.error('خطا در به‌روزرسانی کاربر');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <span className="font-medium">حذف کاربر</span>
        </div>
        <p className="text-sm text-gray-600">آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            انصراف
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await adminApi.deleteUser(userId);
                toast.success('کاربر با موفقیت حذف شد');
                fetchUsers();
              } catch (error) {
                toast.error('خطا در حذف کاربر');
              }
            }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            حذف
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: 'white',
        color: 'black',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        borderRadius: '0.75rem',
        padding: '1rem',
      }
    });
  };

  const handleVerifyUser = async (userId: string) => {
    setActionLoading(`verify-${userId}`);
    try {
      await adminApi.verifyUser(userId);
      toast.success('کاربر با موفقیت تأیید شد');
      fetchUsers();
    } catch (error) {
      toast.error('خطا در تأیید کاربر');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    let suspensionReason = '';
    
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-80">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
          <span className="font-medium">تعلیق کاربر</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            دلیل تعلیق حساب:
          </label>
          <textarea
            onChange={(e) => suspensionReason = e.target.value}
            placeholder="دلیل تعلیق را وارد کنید..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            انصراف
          </button>
          <button
            onClick={async () => {
              if (!suspensionReason.trim()) {
                toast.error('لطفاً دلیل تعلیق را وارد کنید');
                return;
              }
              toast.dismiss(t.id);
              try {
                await adminApi.suspendUser(userId, suspensionReason);
                toast.success('کاربر با موفقیت تعلیق شد');
                fetchUsers();
              } catch (error) {
                toast.error('خطا در تعلیق کاربر');
              }
            }}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            تعلیق
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: 'white',
        color: 'black',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        borderRadius: '0.75rem',
        padding: '1rem',
      }
    });
  };

  const handleChangeUserRole = async (userId: string, newRole: string, currentRole: string) => {
    if (currentRole === newRole) return;

    // Show confirmation dialog
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <span className="font-medium">تغییر نقش کاربر</span>
        </div>
        <p className="text-sm text-gray-600">
          آیا مطمئن هستید که می‌خواهید نقش این کاربر را از "{getRoleName(currentRole)}" به "{getRoleName(newRole)}" تغییر دهید؟
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeRoleChange(userId, newRole);
            }}
            className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            تأیید
          </button>
        </div>
      </div>
    ), {
      duration: 0,
      style: {
        background: '#ffffff',
        color: '#000000',
        fontFamily: 'iranSans, sans-serif',
        textAlign: 'right',
        direction: 'rtl',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '16px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      }
    });
  };

  const executeRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(`role-${userId}`);
    try {
      // Find the user to update
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Create update payload with new role
      const updateData: AdminUpdateUserDto = {
        Id: user.id,
        FirstName: user.firstName,
        LastName: user.lastName,
        PhoneNumber: user.phoneNumber,
        IsActive: user.isActive,
        EmailConfirmed: user.isEmailVerified,
        PhoneNumberConfirmed: user.isPhoneVerified,
        IsProfileComplete: user.isVerified
      };

      await adminApi.updateUser(userId, updateData);
      
      toast.success(`نقش کاربر با موفقیت به "${getRoleName(newRole)}" تغییر یافت`);
      
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast.error('خطا در تغییر نقش کاربر');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'Individual': return 'فردی';
      case 'Business': return 'تجاری';
      case 'Admin': return 'مدیر';
      default: return role;
    }
  };

  const getRoleDisplayName = (role: RoleInfoDto) => {
    // Use pageName if available (Persian name), otherwise map English names to Persian
    if (role.pageName) {
      return role.pageName;
    }
    
    // Fallback mapping for English role names
    switch (role.name) {
      case 'IsNormalUser': return 'کاربر عادی';
      case 'IsAdmin': return 'مدیر سایت';
      case 'IsEmployee': return 'کارمند';
      case 'SuperAdmin': return 'مدیر کل';
      default: return role.name;
    }
  };

  const parseUserAgent = (userAgent: string): string => {
    if (!userAgent) return 'دستگاه نامشخص';
    
    // Parse browser
    let browser = 'مرورگر نامشخص';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Parse OS
    let os = 'سیستم عامل نامشخص';
    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10';
    else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    return `${browser} روی ${os}`;
  };

  const openRoleAssignmentModal = (user: AdminUserDto) => {
    setSelectedUserForRoles(user);
    setSelectedRoleIds(user.roles?.map(role => role.id) || []);
    setShowRoleModal(true);
  };

  const openOnlineStatusModal = async (user: AdminUserDto) => {
    setSelectedUserForOnlineStatus(user);
    setShowOnlineStatusModal(true);
    setOnlineStatusLoading(true);
    
    try {
      const response = await adminApi.getUserOnlineStatus(user.id);
      setUserOnlineStatus(response.data);
    } catch (error) {
      toast.error('خطا در دریافت وضعیت آنلاین کاربر');
    } finally {
      setOnlineStatusLoading(false);
    }
  };

  const openCreateAuthorModal = (user: AdminUserDto) => {
    console.log('=== Opening Create Author Modal ===');
    console.log('Selected user for author:', user);
    console.log('User ID:', user.id, 'Type:', typeof user.id);
    console.log('User ID length:', user.id?.length);
    console.log('Is valid GUID format:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id || ''));
    
    if (!user.id) {
      console.error('ERROR: User ID is missing!');
      toast.error('خطا: شناسه کاربر یافت نشد');
      return;
    }
    
    setSelectedUserForAuthor(user);
    setNewAuthor({
      UserId: user.id,
      PenName: `${user.firstName} ${user.lastName}`,
      Biography: '',
      Website: '',
      Nationality: '',
      ProfileImageUrl: '',
      DateOfBirth: '',
      ApprovalStatus: 'Approved',
      ApprovalNote: '',
      IsActive: true,
    });
    setShowCreateAuthorModal(true);
  };

  const handleCreateAuthor = async () => {
    setActionLoading('create-author');
    try {
      console.log('=== handleCreateAuthor Called ===');
      console.log('newAuthor state:', JSON.stringify(newAuthor, null, 2));
      
      // Validate required fields
      if (!newAuthor.UserId || !newAuthor.PenName || !newAuthor.Biography) {
        console.error('Validation failed - missing required fields');
        console.error('UserId:', newAuthor.UserId);
        console.error('PenName:', newAuthor.PenName);
        console.error('Biography:', newAuthor.Biography);
        toast.error('لطفاً فیلدهای الزامی را پر کنید');
        setActionLoading(null);
        return;
      }

      // Validate GUID format using same logic as backend
      const trimmedUserId = newAuthor.UserId.trim();
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      console.log('UserId validation:');
      console.log('  Original:', newAuthor.UserId);
      console.log('  Trimmed:', trimmedUserId);
      console.log('  Length:', trimmedUserId.length);
      console.log('  Matches GUID pattern:', guidRegex.test(trimmedUserId));
      
      if (!trimmedUserId || !guidRegex.test(trimmedUserId)) {
        console.error('GUID validation failed!');
        toast.error('شناسه کاربر نامعتبر است (فرمت GUID اشتباه است)');
        setActionLoading(null);
        return;
      }

      // Prepare data - only include fields with values
      const authorData: any = {
        UserId: trimmedUserId,
        PenName: newAuthor.PenName.trim(),
        Biography: newAuthor.Biography.trim(),
        ApprovalStatus: newAuthor.ApprovalStatus || 'Approved',
        IsActive: newAuthor.IsActive,
      };

      // Only include optional string fields if they have values
      if (newAuthor.Website?.trim()) {
        authorData.Website = newAuthor.Website.trim();
      }
      if (newAuthor.Nationality?.trim()) {
        authorData.Nationality = newAuthor.Nationality.trim();
      }
      if (newAuthor.ProfileImageUrl?.trim()) {
        authorData.ProfileImageUrl = newAuthor.ProfileImageUrl.trim();
      }
      if (newAuthor.DateOfBirth?.trim()) {
        authorData.DateOfBirth = newAuthor.DateOfBirth.trim();
      }
      if (newAuthor.ApprovalNote?.trim()) {
        authorData.ApprovalNote = newAuthor.ApprovalNote.trim();
      }

      console.log('Final payload to send:', JSON.stringify(authorData, null, 2));
      
      const response = await authorApi.createByAdmin(authorData);
      console.log('Success response:', response);
      
      toast.success('نویسنده با موفقیت ایجاد شد');
      setShowCreateAuthorModal(false);
      setSelectedUserForAuthor(null);
      
      // Redirect to admin authors page
      router.push('/admin/authors');
    } catch (error: any) {
      console.error('=== Error Creating Author ===');
      console.error('Full error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Validation errors:', error.response?.data?.errors);
      
      // Show detailed validation errors
      if (error.response?.data?.errors) {
        const errorDetails = Object.entries(error.response.data.errors)
          .map(([field, messages]: [string, any]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('\n');
        console.error('Detailed errors:\n', errorDetails);
      }
      
      toast.error(error.response?.data?.message || error.response?.data?.title || 'خطا در ایجاد نویسنده');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleAssignment = async () => {
    if (!selectedUserForRoles) return;

    setActionLoading(`roles-${selectedUserForRoles.id}`);
    try {
      
      await adminApi.assignRolesToUser(selectedUserForRoles.id, selectedRoleIds);
      toast.success('نقش‌های کاربر با موفقیت به‌روزرسانی شد');
      setShowRoleModal(false);
      fetchUsers(); // Refresh users list
    } catch (error) {
      toast.error('خطا در به‌روزرسانی نقش‌های کاربر');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (user: AdminUserDto) => {
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircleIcon className="w-3 h-3" />
          غیرفعال
        </span>
      );
    }
    if (user.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircleIcon className="w-3 h-3" />
          تأیید شده
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <ExclamationTriangleIcon className="w-3 h-3" />
        در انتظار تأیید
      </span>
    );
  };

 
  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive) ||
      (filterStatus === 'verified' && user.isVerified) ||
      (filterStatus === 'unverified' && !user.isVerified);
    
    const matchesType = filterType === 'all' || 
      (filterType === 'individual' && user.userType === 'Individual') ||
      (filterType === 'business' && user.userType === 'Business') ||
      (filterType === 'admin' && user.userType === 'Admin');
    
    return matchesStatus && matchesType;
  });

  const handleCreateNewUser = () => {
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    setActionLoading('create');
    try {
      await adminApi.createUser(newUser);
      toast.success('کاربر جدید با موفقیت ایجاد شد');
      setShowCreateModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        isActive: true,
        isVerified: false,
        isEmailVerified: false,
        isPhoneVerified: false,
        city: '',
        province: '',
        postalCode: '',
        businessName: '',
        businessDescription: '',
        businessWebsite: '',
        userType: 'Individual'
      });
      fetchUsers();
    } catch (error) {
      toast.error('خطا در ایجاد کاربر جدید');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportUsers = async () => {
    try {
      setActionLoading('export');
      // Create CSV content
      const csvContent = generateUsersCsv(users);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('فایل کاربران با موفقیت دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود فایل');
    } finally {
      setActionLoading(null);
    }
  };

  const generateUsersCsv = (users: AdminUserDto[]) => {
    const headers = [
      'نام',
      'نام خانوادگی', 
      'ایمیل',
      'شماره تلفن',
      'نوع حساب',
      'وضعیت',
      'تاریخ عضویت',
      'شهر',
      'استان',
      'کل آگهی‌ها',
      'آگهی‌های فعال'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const user of users) {
      const row = [
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber || '',
        user.userType === 'Individual' ? 'فردی' : 'تجاری',
        user.isActive ? 'فعال' : 'غیرفعال',
        new Date(user.createdAt).toLocaleDateString('fa-IR'),
        user.city || '',
        user.province || '',
        user.totalAds || 0,
        user.activeAds || 0
      ];
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">کاربران</h1>
              <p className="mt-1 text-sm text-gray-500">
                مدیریت تمام کاربران ثبت شده در سیستم
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportUsers}
                disabled={actionLoading === 'export'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                {actionLoading === 'export' ? 'در حال دانلود...' : 'خروجی'}
              </button>
              <button 
                onClick={handleCreateNewUser}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <UserPlusIcon className="w-4 h-4" />
                کاربر جدید
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div key="total-users" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">کل کاربران</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.totalUsers || 0).toLocaleString()}</p>
                  <p className={`text-xs font-medium ${(userStats.totalUsersChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(userStats.totalUsersChange || 0) >= 0 ? '+' : ''}{userStats.totalUsersChange || 0}% نسبت به ماه قبل
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
              </div>
            </div>
            
            <div key="verified-users" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">تأیید شده</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.verifiedUsers || 0).toLocaleString()}</p>
                  <p className={`text-xs font-medium ${(userStats.verifiedUsersChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(userStats.verifiedUsersChange || 0) >= 0 ? '+' : ''}{userStats.verifiedUsersChange || 0}% نسبت به ماه قبل
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>
            
            <div key="author-users" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">نویسنده</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.authorUsers || 0).toLocaleString()}</p>
                  <p className={`text-xs font-medium ${(userStats.authorUsersChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(userStats.authorUsersChange || 0) >= 0 ? '+' : ''}{userStats.authorUsersChange || 0}% نسبت به ماه قبل
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✍️</span>
                </div>
              </div>
            </div>
            
            <div key="new-users" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">این ماه</p>
                  <p className="text-2xl font-bold text-gray-900">{(userStats.newUsersThisMonth || 0).toLocaleString()}</p>
                  <p className={`text-xs font-medium ${(userStats.newUsersThisMonthChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(userStats.newUsersThisMonthChange || 0) >= 0 ? '+' : ''}{userStats.newUsersThisMonthChange || 0}% نسبت به ماه قبل
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
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
                placeholder="جستجو بر اساس نام، ایمیل یا شماره تلفن..."
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
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="verified">تأیید شده</option>
                <option value="unverified">تأیید نشده</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[120px]"
              >
                <option value="all">همه انواع</option>
                <option value="individual">فردی</option>
                <option value="business">تجاری</option>
                <option value="admin">مدیر</option>
              </select>
              
              <button className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                <FunnelIcon className="w-4 h-4" />
                فیلترها
              </button>
            </div>
          </div>
        </div>

        {/* Modern Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                لیست کاربران ({filteredUsers.length} کاربر)
              </h3>
              <div className="text-sm text-gray-500">
                صفحه {currentPage} از {pagination?.totalPages || 1}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">در حال بارگذاری کاربران...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        نام کاربر
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        اطلاعات تماس
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        نوع حساب / نقش
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        وضعیت
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        تاریخ عضویت
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-center">
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                                {(user.firstName || '')[0]}{(user.lastName || '')[0]}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {(user.firstName || '')} {(user.lastName || '')}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.phoneNumber || 'ندارد'}</div>                         
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {/* Display current roles */}
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    {getRoleDisplayName(role)}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                  بدون نقش
                                </span>
                              )}
                            </div>
                            
                        {/* Role assignment button */}
                        <button
                          onClick={() => openRoleAssignmentModal(user)}
                          disabled={actionLoading === `roles-${user.id}`}
                          className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] hover:bg-gray-50"
                        >
                          {actionLoading === `roles-${user.id}` ? 'در حال تغییر...' : 'مدیریت نقش‌ها'}
                        </button>
                        
                        {/* Online status button */}
                        <button
                          onClick={() => openOnlineStatusModal(user)}
                          className="text-xs border border-green-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500 min-w-[100px] hover:bg-green-50 text-green-700"
                        >
                          وضعیت آنلاین
                        </button>

                        {/* Create Author button */}
                        <button
                          onClick={() => openCreateAuthorModal(user)}
                          className="text-xs border border-purple-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-w-[100px] hover:bg-purple-50 text-purple-700"
                        >
                          افزودن نویسنده
                        </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'نامشخص'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => viewUserDetail(user.id)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="مشاهده جزئیات"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditUser(user)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            {!user.isVerified && (
                              <button
                                onClick={() => handleVerifyUser(user.id)}
                                disabled={actionLoading === `verify-${user.id}`}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="تأیید کاربر"
                              >
                                {actionLoading === `verify-${user.id}` ? (
                                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircleIcon className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
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
                      نمایش <span className="font-medium">{((currentPage - 1) * (pagination.pageSize || 20)) + 1}</span> تا{' '}
                      <span className="font-medium">{Math.min(currentPage * (pagination.pageSize || 20), pagination.totalCount || pagination.totalUsers || pagination.total || 0)}</span> از{' '}
                      <span className="font-medium">{pagination.totalCount || pagination.totalUsers || pagination.total || 0}</span> کاربر
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        قبلی
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, pagination.totalPages || 1))].map((_, i) => {
                          const pageNum = i + 1;
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
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages || 1, currentPage + 1))}
                        disabled={currentPage === (pagination.totalPages || 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        بعدی
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced User Detail Modal */}
        {showUserModal && selectedUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowUserModal(false);
              }
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowUserModal(false);
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="بستن جزئیات کاربر"
          >
            <div className="relative top-8 mx-auto max-w-4xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">جزئیات کاربر</h3>
                    <p className="text-sm text-gray-500 mt-1">اطلاعات کامل برای {selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUserModal(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUserModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation active:scale-90"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    type="button"
                    aria-label="بستن"
                  >
                    <svg className="w-6 h-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">اطلاعات شخصی</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.firstName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.lastName}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.email}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedUser.phoneNumber || 'ندارد'}</p>
                      </div>
                      
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">اطلاعات حساب</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">نقش‌ها:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedUser.roles && selectedUser.roles.length > 0 ? (
                              selectedUser.roles.map((role, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  {getRoleDisplayName(role)}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                بدون نقش
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">وضعیت:</span>
                          {getStatusBadge(selectedUser)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">تاریخ عضویت:</span>
                          <span className="text-sm text-gray-900">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'نامشخص'}</span>
                        </div>
                        
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUserModal(false);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-95"
                      style={{ 
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      type="button"
                    >
                      بستن
                    </button>
                    <button
                      onClick={() => {
                        startEditUser(selectedUser);
                        setShowUserModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      ویرایش کاربر
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowEditModal(false);
              }
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowEditModal(false);
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="بستن ویرایش کاربر"
          >
            <div className="relative top-8 mx-auto max-w-2xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">ویرایش کاربر</h3>
                    <p className="text-sm text-gray-500 mt-1">ویرایش اطلاعات کاربر</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowEditModal(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowEditModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation active:scale-90"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    type="button"
                    aria-label="بستن"
                  >
                    <svg className="w-6 h-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نام</label>
                        <input
                          type="text"
                          value={editingUser.firstName}
                          onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نام خانوادگی</label>
                        <input
                          type="text"
                          value={editingUser.lastName}
                          onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">شماره تلفن</label>
                      <input
                        type="text"
                        value={editingUser.phoneNumber || ''}
                        onChange={(e) => setEditingUser({...editingUser, phoneNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>


                    {/* User Role */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">نقش کاربر</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نقش‌های کاربر</label>
                        <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                          {editingUser && users.find(u => u.id === editingUserId)?.roles && users.find(u => u.id === editingUserId)!.roles!.length > 0 ? (
                            users.find(u => u.id === editingUserId)!.roles!.map((role, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {getRoleDisplayName(role)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">بدون نقش</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">برای تغییر نقش‌ها از دکمه "مدیریت نقش‌ها" در جدول استفاده کنید</p>
                      </div>
                    </div>

                    {/* Status Checkboxes */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">وضعیت حساب</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingUser.isActive}
                            onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">فعال</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingUser.isProfileComplete}
                            onChange={(e) => setEditingUser({...editingUser, isProfileComplete: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">پروفایل کامل</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingUser.emailConfirmed}
                            onChange={(e) => setEditingUser({...editingUser, emailConfirmed: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">ایمیل تأیید شده</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingUser.phoneNumberConfirmed}
                            onChange={(e) => setEditingUser({...editingUser, phoneNumberConfirmed: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">تلفن تأیید شده</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowEditModal(false);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowEditModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-95"
                      style={{ 
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      type="button"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      disabled={actionLoading === 'update'}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'update' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          در حال ذخیره...
                        </>
                      ) : (
                        'ذخیره تغییرات'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowCreateModal(false);
              }
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowCreateModal(false);
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="بستن ایجاد کاربر"
          >
            <div className="relative top-8 mx-auto max-w-2xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">ایجاد کاربر جدید</h3>
                    <p className="text-sm text-gray-500 mt-1">تکمیل اطلاعات کاربر</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateModal(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCreateModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation active:scale-90"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    type="button"
                    aria-label="بستن"
                  >
                    <svg className="w-6 h-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نام</label>
                        <input
                          type="text"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نام خانوادگی</label>
                        <input
                          type="text"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ایمیل</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">شماره تلفن</label>
                        <input
                          type="text"
                          value={newUser.phoneNumber}
                          onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">شهر</label>
                        <input
                          type="text"
                          value={newUser.city}
                          onChange={(e) => setNewUser({...newUser, city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">استان</label>
                        <input
                          type="text"
                          value={newUser.province}
                          onChange={(e) => setNewUser({...newUser, province: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">کد پستی</label>
                        <input
                          type="text"
                          value={newUser.postalCode}
                          onChange={(e) => setNewUser({...newUser, postalCode: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نام کسب و کار</label>
                        <input
                          type="text"
                          value={newUser.businessName}
                          onChange={(e) => setNewUser({...newUser, businessName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات کسب و کار</label>
                        <textarea
                          value={newUser.businessDescription}
                          onChange={(e) => setNewUser({...newUser, businessDescription: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">وب‌سایت کسب و کار</label>
                        <input
                          type="text"
                          value={newUser.businessWebsite}
                          onChange={(e) => setNewUser({...newUser, businessWebsite: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع کاربر / نقش</label>
                        <select
                          value={newUser.userType}
                          onChange={(e) => setNewUser({...newUser, userType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="Individual">👤 فردی</option>
                          <option value="Business">🏢 تجاری</option>
                          <option value="Admin">👑 مدیر</option>
                        </select>
                      </div>
                    </div>

                    {/* Status Checkboxes */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">وضعیت حساب</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newUser.isActive}
                            onChange={(e) => setNewUser({...newUser, isActive: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">فعال</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newUser.isVerified}
                            onChange={(e) => setNewUser({...newUser, isVerified: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">تأیید شده</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newUser.isEmailVerified}
                            onChange={(e) => setNewUser({...newUser, isEmailVerified: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">ایمیل تأیید شده</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newUser.isPhoneVerified}
                            onChange={(e) => setNewUser({...newUser, isPhoneVerified: e.target.checked})}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">تلفن تأیید شده</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCreateModal(false);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCreateModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-95"
                      style={{ 
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      type="button"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={actionLoading === 'create'}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'create' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          در حال ایجاد...
                        </>
                      ) : (
                        'ایجاد کاربر'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Assignment Modal */}
        {showRoleModal && selectedUserForRoles && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowRoleModal(false);
              }
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowRoleModal(false);
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="بستن مدیریت نقش‌ها"
          >
            <div className="relative top-8 mx-auto max-w-md">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">مدیریت نقش‌های کاربر</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      نقش‌های {selectedUserForRoles.firstName} {selectedUserForRoles.lastName}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRoleModal(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRoleModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation active:scale-90"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    type="button"
                    aria-label="بستن"
                  >
                    <svg className="w-6 h-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        انتخاب نقش‌ها (می‌توانید چندین نقش انتخاب کنید):
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {allRoles.length > 0 ? (
                          allRoles.map((role) => (
                            <label key={role.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRoleIds.includes(role.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRoleIds([...selectedRoleIds, role.id]);
                                  } else {
                                    setSelectedRoleIds(selectedRoleIds.filter(id => id !== role.id));
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {getRoleDisplayName(role)}
                                </div>
                                <div className="text-xs text-gray-500">{role.name}</div>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-sm">در حال بارگذاری نقش‌ها...</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRoleModal(false);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRoleModal(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-95"
                      style={{ 
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      type="button"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleRoleAssignment}
                      disabled={actionLoading === `roles-${selectedUserForRoles.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === `roles-${selectedUserForRoles.id}` ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          در حال ذخیره...
                        </>
                      ) : (
                        'ذخیره نقش‌ها'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Online Status Modal */}
        {showOnlineStatusModal && selectedUserForOnlineStatus && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowOnlineStatusModal(false);
              }
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                setShowOnlineStatusModal(false);
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            aria-label="بستن وضعیت آنلاین"
          >
            <div className="relative top-8 mx-auto max-w-4xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">وضعیت آنلاین کاربر</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedUserForOnlineStatus.firstName} {selectedUserForOnlineStatus.lastName}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOnlineStatusModal(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOnlineStatusModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation active:scale-90"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    type="button"
                    aria-label="بستن"
                  >
                    <svg className="w-6 h-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {onlineStatusLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
                    </div>
                  ) : userOnlineStatus ? (
                    <div className="space-y-6">
                      {/* Online Status Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              userOnlineStatus.isOnline 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                userOnlineStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              {userOnlineStatus.isOnline ? 'آنلاین' : 'آفلاین'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{userOnlineStatus.activeSessionsCount}</div>
                            <div className="text-sm text-gray-600">جلسات فعال</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{userOnlineStatus.totalDevicesCount}</div>
                            <div className="text-sm text-gray-600">تعداد دستگاه‌ها</div>
                          </div>
                        </div>
                        {userOnlineStatus.lastActivity && (
                          <div className="mt-4 text-center text-sm text-gray-600">
                            آخرین فعالیت: {new Date(userOnlineStatus.lastActivity).toLocaleString('fa-IR')}
                          </div>
                        )}
                      </div>

                      {/* Active Sessions */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">جلسات فعال</h4>
                        {userOnlineStatus.activeSessions.length > 0 ? (
                          <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                            {userOnlineStatus.activeSessions.map((session) => (
                              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <div>
                                      <div className="font-medium text-gray-900">{parseUserAgent(session.userAgent)}</div>
                                      <div className="text-sm text-gray-600">{session.ipAddress}</div>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm text-gray-500">
                                    <div>شروع: {new Date(session.createdAt).toLocaleString('fa-IR')}</div>
                                    {session.lastActivityAt && (
                                      <div>آخرین فعالیت: {new Date(session.lastActivityAt).toLocaleString('fa-IR')}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            هیچ جلسه فعالی وجود ندارد
                          </div>
                        )}
                      </div>

                      {/* User Devices */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">دستگاه‌های کاربر</h4>
                        {userOnlineStatus.userDevices.length > 0 ? (
                          <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                            {userOnlineStatus.userDevices.map((device) => (
                              <div key={device.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{device.deviceName}</div>
                                    <div className="text-sm text-gray-600">{device.deviceType}</div>
                                    <div className="text-sm text-gray-500">{device.ipAddress}</div>
                                  </div>
                                  <div className="text-right text-sm text-gray-500">
                                    <div>اولین ورود: {new Date(device.firstLoginAt).toLocaleString('fa-IR')}</div>
                                    <div>آخرین ورود: {new Date(device.lastLoginAt).toLocaleString('fa-IR')}</div>
                                    <div className={`mt-1 px-2 py-1 rounded-full text-xs ${
                                      device.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {device.isActive ? 'فعال' : 'غیرفعال'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            هیچ دستگاهی ثبت نشده است
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      خطا در دریافت اطلاعات وضعیت آنلاین
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Author Modal */}
        {showCreateAuthorModal && selectedUserForAuthor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4" dir="rtl">
            <div className="relative top-8 mx-auto max-w-2xl">
              <div className="bg-white rounded-xl shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">افزودن نویسنده جدید</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ثبت {selectedUserForAuthor.firstName} {selectedUserForAuthor.lastName} به عنوان نویسنده
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateAuthorModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نام مستعار *</label>
                      <input
                        type="text"
                        value={newAuthor.PenName}
                        onChange={(e) => setNewAuthor({ ...newAuthor, PenName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">بیوگرافی *</label>
                      <textarea
                        value={newAuthor.Biography}
                        onChange={(e) => setNewAuthor({ ...newAuthor, Biography: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        maxLength={2000}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وب‌سایت</label>
                      <input
                        type="url"
                        value={newAuthor.Website}
                        onChange={(e) => setNewAuthor({ ...newAuthor, Website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ملیت</label>
                      <input
                        type="text"
                        value={newAuthor.Nationality}
                        onChange={(e) => setNewAuthor({ ...newAuthor, Nationality: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL تصویر پروفایل</label>
                      <input
                        type="url"
                        value={newAuthor.ProfileImageUrl}
                        onChange={(e) => setNewAuthor({ ...newAuthor, ProfileImageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ تولد</label>
                      <input
                        type="date"
                        value={newAuthor.DateOfBirth}
                        onChange={(e) => setNewAuthor({ ...newAuthor, DateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت تایید *</label>
                      <select
                        value={newAuthor.ApprovalStatus}
                        onChange={(e) => setNewAuthor({ ...newAuthor, ApprovalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="Approved">تایید شده</option>
                        <option value="Pending">در انتظار بررسی</option>
                        <option value="Rejected">رد شده</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت </label>
                      <textarea
                        value={newAuthor.ApprovalNote}
                        onChange={(e) => setNewAuthor({ ...newAuthor, ApprovalNote: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        maxLength={500}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActiveAuthor"
                        checked={newAuthor.IsActive}
                        onChange={(e) => setNewAuthor({ ...newAuthor, IsActive: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActiveAuthor" className="text-sm text-gray-700">
                        فعال
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateAuthorModal(false)}
                      disabled={actionLoading === 'create-author'}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAuthor}
                      disabled={actionLoading === 'create-author'}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading === 'create-author' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          در حال ایجاد...
                        </>
                      ) : (
                        <>
                          <PencilSquareIcon className="h-5 w-5" />
                          ایجاد نویسنده
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;

