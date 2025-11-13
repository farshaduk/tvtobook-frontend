# Authentication & Authorization Security Analysis

## 🔴 CRITICAL ISSUES FOUND

### 1. **RACE CONDITION - Multiple Auth State Sources**
**Severity: CRITICAL**

The application has **TWO SEPARATE** authentication systems running simultaneously:

- **AuthContext** (`src/contexts/AuthContext.tsx`) - using React Context
- **UserStore** (`src/store/index.ts`) - using Zustand with persistence

**Problem:** Different pages use different auth sources:
- `/admin/products/create/page.tsx` uses `useAuth()` from AuthContext
- `/admin/layout.tsx` uses `useUserStore()` from Zustand
- `/admin/categories/page.tsx` uses `useUserStore()` from Zustand
- `ProtectedAdminRoute.tsx` uses `useUserStore()` from Zustand

**Impact:**
- When you login, one system updates but the other doesn't immediately sync
- After refresh, Zustand rehydrates from localStorage first, THEN validates with server
- This creates a window where `isAuthenticated` is true but user data is stale
- Race conditions between the two systems cause intermittent access issues

---

### 2. **ZUSTAND REHYDRATION TIMING ISSUE**
**Severity: HIGH**

```typescript
// src/store/index.ts - Line 135
onRehydrateStorage: () => (state) => {
  // After rehydration, validate the authentication state with the server
  if (state?.isAuthenticated && state?.user) {
    state.checkAuth();  // ❌ ASYNC call happens AFTER components mount
  }
}
```

**Problem:**
1. Page loads → Zustand rehydrates from localStorage (isAuthenticated=true)
2. Components mount and see isAuthenticated=true → render protected content
3. checkAuth() API call happens asynchronously
4. If API returns 401, user gets kicked out AFTER briefly seeing protected content

**Impact:**
- "Flash of protected content" before redirect
- Components render before actual auth validation
- Race condition between rehydration and API validation

---

### 3. **INCONSISTENT AUTH CHECKING IN ADMIN LAYOUT**
**Severity: HIGH**

```typescript
// src/app/admin/layout.tsx - Line 54
useEffect(() => {
  const checkAdminAccess = async () => {
    if (!isAuthenticated) {  // ❌ Checks Zustand state, not server
      router.push('/login');
      return;
    }
    // ... admin role check
  };
  checkAdminAccess();
}, [isAuthenticated, user, router]);
```

**Problem:**
- Only checks `isAuthenticated` flag from Zustand store
- Doesn't actually verify with backend
- If localStorage has stale token, this check passes
- User sees admin panel briefly before API calls fail

---

### 4. **NO SERVER-SIDE VALIDATION ON PAGE LOAD**
**Severity: HIGH**

Admin pages don't verify authentication with backend on initial load. They only check client-side state:

```typescript
// Multiple admin pages
if (!isAuthenticated) {
  router.push('/login');
}
```

**Problem:**
- Relies entirely on client-side state
- If localStorage is tampered with, user sees protected content
- No server verification until user makes an API call
- Backend cookies might be expired but client state says authenticated

---

### 5. **DUPLICATE AUTH LOGIC IN MULTIPLE PLACES**
**Severity: MEDIUM**

Auth checking logic is duplicated in:
- `ProtectedAdminRoute.tsx` (uses `useUserStore`)
- `ProtectedUserRoute.tsx` (uses `useUserStore`)
- `AdminLayout` (uses `useUserStore`)
- Individual admin pages (uses `useAuth` OR `useUserStore`)
- `AuthContext.tsx` `withAuth()` HOC (uses `useAuth`)

**Problem:**
- Inconsistent behavior across pages
- Hard to maintain and debug
- Different timing for auth checks
- Some use async getCurrentUser(), others don't

---

### 6. **ADMIN ROLE CHECK DUPLICATED EVERYWHERE**
**Severity: MEDIUM**

The same admin role checking logic is copy-pasted in:
- `ProtectedAdminRoute.tsx`
- `AdminLayout.tsx`
- `/admin/products/create/page.tsx`

```typescript
const hasAdminRole = 
  user?.role === 'IsAdmin' || 
  user?.role === 'IsSuperAdmin' ||
  user?.role === 'SuperAdmin' ||
  (user?.roles && Array.isArray(user.roles) && (
    user.roles.includes('IsAdmin') || 
    user.roles.includes('IsSuperAdmin') ||
    user.roles.includes('SuperAdmin')
  ));
```

**Problem:**
- Code duplication = maintenance nightmare
- Easy to miss updating one instance
- Inconsistent role names across codebase

---

## 🟡 MEDIUM ISSUES

### 7. **LOADING STATE NOT PROPERLY HANDLED**
- Some pages show "Loading..." while checking auth
- Others immediately redirect
- Inconsistent UX across application

### 8. **NO REFRESH TOKEN MECHANISM**
- Uses HttpOnly cookies (good!)
- But no automatic token refresh
- User gets kicked out when cookie expires, even if actively using app

---

## 🔵 RECOMMENDATIONS

### **IMMEDIATE FIXES** (Do these now):

#### 1. **Remove Dual Auth Systems - Use ONE source of truth**

**Option A: Use AuthContext only** (Recommended)
- Remove useUserStore auth logic
- Make all pages use AuthContext
- Keep Zustand only for cart/theme

**Option B: Use Zustand only**
- Remove AuthContext
- Make all pages use useUserStore
- Improve rehydration logic

#### 2. **Fix Rehydration Race Condition**

```typescript
// Improved store with synchronous validation
onRehydrateStorage: () => (state) => {
  return (state, error) => {
    if (error) {
      console.error('Rehydration failed:', error);
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      return;
    }
    
    // Set loading to true during validation
    if (state) {
      state.isLoading = true;
      
      // Immediately validate with server
      state.checkAuth().then(() => {
        state.isLoading = false;
      });
    }
  };
}
```

#### 3. **Create Single Protected Route Component**

```typescript
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}: { 
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validate = async () => {
      // Always verify with server on mount
      await checkAuth();
      
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      if (requireAdmin && !isAdmin(user)) {
        router.push('/');
        return;
      }
      
      setIsValidating(false);
    };
    
    validate();
  }, []);

  if (isLoading || isValidating) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
```

#### 4. **Centralize Role Checking**

```typescript
// src/utils/roleUtils.ts
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  
  const adminRoles = ['IsAdmin', 'IsSuperAdmin', 'SuperAdmin'];
  
  // Check role field
  if (user.role && adminRoles.includes(user.role)) {
    return true;
  }
  
  // Check roles array
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => adminRoles.includes(role));
  }
  
  return false;
}
```

#### 5. **Always Validate on Page Load**

```typescript
// In admin layout and protected pages
useEffect(() => {
  // Don't trust client state - verify with server
  const verifyAccess = async () => {
    setIsChecking(true);
    
    try {
      // Force fresh check from server
      await checkAuth();
      
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      if (!isAdmin(user)) {
        router.push('/');
        return;
      }
      
      setIsAuthorized(true);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsChecking(false);
    }
  };
  
  verifyAccess();
}, []); // Empty deps - only run on mount
```

---

## 📋 IMPLEMENTATION PRIORITY

### Priority 1 (Fix Immediately):
1. ✅ Choose ONE auth system (AuthContext OR Zustand)
2. ✅ Update all pages to use the same system
3. ✅ Fix rehydration race condition
4. ✅ Add server validation on every page load

### Priority 2 (This Week):
5. ✅ Create centralized ProtectedRoute component
6. ✅ Centralize role checking logic
7. ✅ Add proper loading states everywhere

### Priority 3 (Next Sprint):
8. ✅ Implement token refresh mechanism
9. ✅ Add session timeout warnings
10. ✅ Add auth state monitoring/logging

---

## 🎯 ROOT CAUSE

The core issue is:
1. **Two separate auth systems** fighting each other
2. **Client-side state trusted without server verification** on page load
3. **Rehydration happens before validation**

When admin first navigates to dashboard:
- Client state says authenticated (from localStorage)
- Page renders immediately
- Server validation happens too late
- If token expired, user already saw dashboard

After refresh:
- Zustand rehydrates from localStorage
- checkAuth() called but async
- Components already mounted with stale isAuthenticated=true
- Eventually validated and access granted

This race condition creates the intermittent access issue you're experiencing.
