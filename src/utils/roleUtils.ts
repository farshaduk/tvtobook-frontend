import { User } from '@/services/api';

/**
 * Centralized role checking utilities
 */

export const ADMIN_ROLES = ['IsAdmin', 'IsSuperAdmin', 'SuperAdmin'] as const;
export const USER_ROLES = ['User', 'PremiumUser'] as const;

export type AdminRole = typeof ADMIN_ROLES[number];
export type UserRole = typeof USER_ROLES[number];

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check role field (legacy support)
  if (user.role && ADMIN_ROLES.includes(user.role as AdminRole)) {
    return true;
  }
  
  // Check roles array (new format)
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => {
      // Role item may be a string or an object { id, name }
      const roleName = typeof role === 'string' ? role : (role as any).name;
      return ADMIN_ROLES.includes(roleName as AdminRole);
    });
  }
  
  return false;
}

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  
  const superAdminRoles = ['IsSuperAdmin', 'SuperAdmin'];
  
  if (user.role && superAdminRoles.includes(user.role)) {
    return true;
  }
  
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => {
      const roleName = typeof role === 'string' ? role : (role as any).name;
      return superAdminRoles.includes(roleName);
    });
  }
  
  return false;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: User | null | undefined): boolean {
  return user !== null && user !== undefined;
}

/**
 * Get user's display name
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Guest';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if (user.email) return user.email;
  
  return 'User';
}

/**
 * Get user's primary role for display
 */
export function getUserRole(user: User | null | undefined): string {
  if (!user) return 'Guest';
  
  if (isSuperAdmin(user)) return 'Super Admin';
  if (isAdmin(user)) return 'Admin';
  
  if (user.role) return user.role;
  if (user.roles && user.roles.length > 0) {
    const first = user.roles[0];
    return typeof first === 'string' ? first : (first as any).name || String(first);
  }
  
  return 'User';
}
