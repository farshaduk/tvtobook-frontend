// Simplified authentication utility using /api/auth/me endpoint
// This approach is more secure as it relies on server-side JWT validation

export interface IUserInfo {
  id: string;
  email: string;
  fullName: string;
  role?: string; // Single role (deprecated, use roles array instead)
  roles?: string[]; // Array of role names: ["IsAdmin", "IsSuperAdmin", etc.]
  isActive: boolean;
  isProfileComplete: boolean;
}

/**
 * Get current authenticated user from backend.
 * Backend reads and validates JWT from HttpOnly cookie.
 */
export async function getCurrentUser(): Promise<IUserInfo | null> {
  try {
    // Use the same API base URL as the rest of the application
    const API_BASE_URL = typeof window !== 'undefined'
      ? (window.location.hostname === 'localhost' ? 'http://localhost:7262/api' : 'http://dev.tvtobook.com/api')
      : 'http://dev.tvtobook.com/api';
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include' // Important: send cookies
    });
    if (!res.ok) {
      return null;
    }
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }
    
    const userData = await res.json();

    // Handle both legacy 'role' and new 'roles' field formats
    if (userData && userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
      // If roles array exists, ensure we also populate the role field for backward compatibility
      if (!userData.role) {
        userData.role = userData.roles[0];
      }
    } else if (userData && userData.role && !userData.roles) {
      // If only role field exists, create roles array for forward compatibility
      userData.roles = [userData.role];
    }

    return userData;
  } catch (error) {
    return null;
  }
}
