'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiClient, clearAuthTokenCache } from '@/lib/api/config'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

// Agency and managed user interfaces
export interface Agency {
  id: string
  name: string
}

export interface ManagedUser {
  uid: string
  email: string
  displayName: string | null
  role: string
  permissions: string[]
}

// RBAC context from backend API
export interface RBACContext {
  role_id: number
  role_name: 'superadmin' | 'admin' | 'agency' | 'user'
  agency_id: number
  agency_name: string
}

// User profile with RBAC data
export interface UserProfile {
  id: number
  email: string
  firebase_uid: string
  username: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
  rbac_context: RBACContext
  // Legacy fields for compatibility - will be deprecated
  uid?: string
  displayName?: string | null
  agencies?: Agency[]
  currentAgency?: Agency | null
  managedUsers?: ManagedUser[]
  currentManagedUser?: ManagedUser | null
  permissions?: string[]
  isAdmin?: boolean
  isAgencyAdmin?: boolean
  // Impersonation fields
  isImpersonating?: boolean
  originalUser?: {
    id: number
    email: string
    role: string
    agency: string
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: Error | null
  signOut: () => Promise<void>
  switchAgency: (agencyId: string) => Promise<void>
  switchManagedUser: (userId: string) => Promise<void>
  endImpersonation: () => Promise<void>
  // New impersonation functions
  startImpersonation: (userId: number) => Promise<void>
  getAvailableUsersForImpersonation: () => Promise<any[]>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  isImpersonating: () => boolean
  // New role-based functions
  getUserRole: () => 'superadmin' | 'admin' | 'agency' | 'user' | null
  isRole: (role: 'superadmin' | 'admin' | 'agency' | 'user') => boolean
  hasRoleOrHigher: (role: 'superadmin' | 'admin' | 'agency' | 'user') => boolean
  isAdmin: () => boolean
  isAgencyAdmin: () => boolean
  isSuperAdmin: () => boolean
  // Cache management
  invalidateProfileCache: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  switchAgency: async () => {},
  switchManagedUser: async () => {},
  endImpersonation: async () => {},
  // New impersonation function defaults
  startImpersonation: async () => {},
  getAvailableUsersForImpersonation: async () => [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isImpersonating: () => false,
  // New role-based function defaults
  getUserRole: () => null,
  isRole: () => false,
  hasRoleOrHigher: () => false,
  isAdmin: () => false,
  isAgencyAdmin: () => false,
  isSuperAdmin: () => false,
  // Cache management
  invalidateProfileCache: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Sign out function
  const signOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
        // Clear any cached auth state in API client
        clearAuthTokenCache();
        // Proactively clear local auth state
        setUser(null);
        setUserProfile(null);
        // Redirect to login immediately
        try {
          router.replace('/login');
        } catch {
          // Fallback if router not available
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Switch agency function
  const switchAgency = async (agencyId: string) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      // Token will be added automatically by axios interceptor
      const response = await apiClient.post('/api/v1/auth/switch-agency/', { 
        agency_id: agencyId
      });
      
      if (response.data && response.data.user) {
        setUserProfile(prevProfile => {
          if (!prevProfile) return null;
          
          // Find the selected agency
          const selectedAgency = prevProfile.agencies?.find(a => a.id === agencyId) || null;
          
          // Get managed users for this agency if the user is an agency admin
          const managedUsers = response.data.user.managed_users || [];
          const currentManagedUser = null; // Reset selected managed user when switching agencies
          
          return {
            ...prevProfile,
            currentAgency: selectedAgency,
            managedUsers: managedUsers,
            currentManagedUser: currentManagedUser,
            permissions: response.data.user.permissions || [],
            isAgencyAdmin: response.data.user.is_agency_admin || false
          };
        });
      }
    } catch (error) {
      console.error('Agency switch error:', error);
      throw error;
    }
  };
  
  // Switch to user function - for agency users to impersonate/act as users under their agency
  const switchManagedUser = async (userId: string) => {
    try {
      // End impersonation if userId is empty
      if (!userId) {
        return await endImpersonation();
      }

      if (!user) throw new Error('No authenticated user');
      if (!userProfile?.isAgencyAdmin) throw new Error('User is not an agency admin');
      
      // Call the correct API endpoint based on documentation
      const response = await apiClient.post('/api/v1/auth/switch-to-user/', { 
        user_id: parseInt(userId)  // Backend expects a numeric ID
      });
      
      if (response.data) {
        // Store tokens and impersonation state according to the documentation
        if (response.data.access) {
          localStorage.setItem('accessToken', response.data.access);
        }
        if (response.data.refresh) {
          localStorage.setItem('refreshToken', response.data.refresh);
        }
        
        // Store a flag indicating impersonation mode
        localStorage.setItem('impersonationActive', 'true');
        
        // Store original user info for UI display
        localStorage.setItem('originalUser', JSON.stringify({
          role: response.data.role,
          agency: response.data.agency
        }));

        // Update user profile with the switched user data
        setUserProfile(prevProfile => {
          if (!prevProfile) return null;
          
          // Create a managed user object from the response
          const switchedUser: ManagedUser = {
            uid: response.data.user.id.toString(),
            email: response.data.user.email,
            displayName: `${response.data.user.first_name} ${response.data.user.last_name}`,
            role: response.data.role || 'user',
            permissions: response.data.permissions || []
          };
          
          return {
            ...prevProfile,
            currentManagedUser: switchedUser,
            permissions: response.data.permissions || [],
          };
        });
      }
    } catch (error) {
      console.error('User switching error:', error);
      throw error;
    }
  };
  
  // End impersonation function - for returning to the original agency user
  const endImpersonation = async () => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      // Call the correct API endpoint to end impersonation
      const response = await apiClient.post('/api/v1/auth/end-impersonation/');
      
      if (response.data) {
        // Update tokens
        if (response.data.access) {
          localStorage.setItem('accessToken', response.data.access);
        }
        if (response.data.refresh) {
          localStorage.setItem('refreshToken', response.data.refresh);
        }
        
        // Clear impersonation flags
        localStorage.removeItem('impersonationActive');
        localStorage.removeItem('originalUser');
        
        // Update user profile to return to the original user
        setUserProfile(prevProfile => {
          if (!prevProfile) return null;
          
          return {
            ...prevProfile,
            currentManagedUser: null,
            permissions: response.data.permissions || prevProfile.permissions,
          };
        });
      }
    } catch (error) {
      console.error('End impersonation error:', error);
      throw error;
    }
  };
  
  // Check if user is currently impersonating someone
  const isImpersonating = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('impersonationActive') === 'true';
  };

  // Role hierarchy: superadmin > admin > agency > user
  const roleHierarchy = {
    'superadmin': 4,
    'admin': 3,
    'agency': 2,
    'user': 1
  };

  // Get current user role
  const getUserRole = (): 'superadmin' | 'admin' | 'agency' | 'user' | null => {
    return userProfile?.rbac_context?.role_name || null;
  };

  // Check if user has specific role
  const isRole = (role: 'superadmin' | 'admin' | 'agency' | 'user'): boolean => {
    const currentRole = getUserRole();
    return currentRole === role;
  };

  // Check if user has role or higher (based on hierarchy)
  const hasRoleOrHigher = (role: 'superadmin' | 'admin' | 'agency' | 'user'): boolean => {
    const currentRole = getUserRole();
    if (!currentRole) return false;
    
    return roleHierarchy[currentRole] >= roleHierarchy[role];
  };

  // Check if user is admin (admin or superadmin)
  const isAdmin = (): boolean => {
    return hasRoleOrHigher('admin');
  };

  // Check if user is agency admin (agency role or higher)
  const isAgencyAdmin = (): boolean => {
    return hasRoleOrHigher('agency');
  };

  // Check if user is superadmin
  const isSuperAdmin = (): boolean => {
    return isRole('superadmin');
  };

  // Invalidate profile cache when needed (e.g., after role changes)
  // This can be called manually when user roles/permissions are updated
  // Example usage: invalidateProfileCache() after admin changes user roles
  const invalidateProfileCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };
  
  // Permission check helpers
  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    
    // Global admin always has all permissions
    if (userProfile.isAdmin) return true;
    
    // If acting as another user, check that user's permissions
    if (userProfile.currentManagedUser) {
      return userProfile.currentManagedUser.permissions.includes(permission);
    }
    
    // Otherwise check the user's own permissions
    return userProfile.permissions?.includes(permission) || false;
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userProfile) return false;
    
    // Global admin always has all permissions
    if (userProfile.isAdmin) return true;
    
    // If acting as another user, check that user's permissions
    if (userProfile.currentManagedUser) {
      return permissions.some(p => userProfile.currentManagedUser!.permissions.includes(p));
    }
    
    // Otherwise check the user's own permissions
    return permissions.some(p => userProfile.permissions?.includes(p) || false);
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userProfile) return false;
    
    // Global admin always has all permissions
    if (userProfile.isAdmin) return true;
    
    // If acting as another user, check that user's permissions
    if (userProfile.currentManagedUser) {
      return permissions.every(p => userProfile.currentManagedUser!.permissions.includes(p));
    }
    
    // Otherwise check the user's own permissions
    return permissions.every(p => userProfile.permissions?.includes(p) || false);
  };

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;
    
    // Prevent double initialization in React Strict Mode
    if (authInitialized) return;

    let timeoutId: NodeJS.Timeout;
    let unsubscribe: () => void;
    let lastVerifyCall: number = 0;
    const VERIFY_DEBOUNCE_MS = 5000; // Prevent multiple verify calls within 5 seconds

    const initializeAuth = async () => {
      try {
        if (!auth) {
          throw new Error('Firebase auth not initialized');
        }

        // Set up timeout
        timeoutId = setTimeout(() => {
          if (loading && !authInitialized) {
            setLoading(false)
            setError(new Error('Auth initialization timed out'))
          }
        }, 5000) // Reduced to 5 seconds

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            setUser(firebaseUser)
            
            // If user is logged in, fetch their profile with RBAC data
            if (firebaseUser) {
              const now = Date.now();
              
              // Debounce verify-token calls to prevent multiple rapid calls
              if (now - lastVerifyCall < VERIFY_DEBOUNCE_MS) {
                console.log('🚫 Skipping verify-token call (debounced)');
                return;
              }
              lastVerifyCall = now;

              try {
                // Add a small delay to ensure Firebase token is properly set
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const token = await firebaseUser.getIdToken(false); // Use cached token if available
                
                // Add additional validation
                if (!token || token.length < 100) {
                  throw new Error('Invalid token received from Firebase');
                }
                
                console.log('🔄 Calling verify-token with fresh Firebase auth');
                
                // Fetch user profile with permissions from backend
                const response = await apiClient.post(
                  '/api/v1/auth/verify-token/',
                  { token },
                  { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000 // 10 second timeout
                  }
                );
                
                if (response.data && response.data.user) {
                  const userData = response.data.user;
                  const userContext = response.data.user_context; // Get the separate user_context
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 Backend user data received:', userData);
                    console.log('🔄 Backend user context received:', userContext);
                  }
                  
                  // Transform backend response to our UserProfile format
                  const userProfile: UserProfile = {
                    id: userData.id || 0,
                    email: userData.email || firebaseUser.email || '',
                    firebase_uid: firebaseUser.uid,
                    username: userData.username || '',
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    created_at: userData.created_at || '',
                    updated_at: userData.updated_at || '',
                    rbac_context: userContext || userData.rbac_context || {
                      role_id: 0,
                      role_name: 'user' as const,
                      agency_id: 0,
                      agency_name: ''
                    },
                    // Legacy fields for compatibility
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    agencies: userData.agencies || [],
                    currentAgency: userData.current_agency || null,
                    managedUsers: userData.managed_users || [],
                    currentManagedUser: userData.current_managed_user || null,
                    permissions: userData.permissions || [],
                    // Set legacy admin flags based on RBAC context
                    isAdmin: userContext?.role_name === 'admin' || userContext?.role_name === 'superadmin' || userData.is_admin || false,
                    isAgencyAdmin: userContext?.role_name === 'agency' || userContext?.role_name === 'admin' || userContext?.role_name === 'superadmin' || userData.is_agency_admin || false
                  };
                  
                  // Debug logging for both development and production
                  console.log('✅ UserProfile created:', {
                    id: userProfile.id,
                    email: userProfile.email,
                    role: userProfile.rbac_context?.role_name,
                    isAdmin: userProfile.isAdmin,
                    isAgencyAdmin: userProfile.isAgencyAdmin,
                    rbacContext: userProfile.rbac_context
                  });
                  
                  setUserProfile(userProfile);
                }
              } catch (profileError: any) {
                console.error('Error fetching user profile:', profileError);
                
                // Handle specific error cases
                if (profileError?.response?.status === 400) {
                  console.warn('🔄 Verify token failed (400), will retry on next request');
                } else if (profileError?.response?.status === 401) {
                  console.warn('🔐 Token expired, clearing auth state');
                  await signOut(); // Sign out on 401 errors
                  return;
                } else {
                  console.error('❌ Unexpected profile error:', profileError?.message);
                }
                
                // Don't set global error state here, as we still have a valid Firebase user
                // The user can still interact with the app, just without backend profile data
              }
            } else {
              setUserProfile(null);
            }
            
            setLoading(false)
            setError(null)
            setAuthInitialized(true)
            clearTimeout(timeoutId)
          },
          (error) => {
            console.error('Auth error:', error)
            setError(error)
            setLoading(false)
            setAuthInitialized(true)
            clearTimeout(timeoutId)
          }
        )
      } catch (error) {
        console.error('Auth setup error:', error)
        setError(error instanceof Error ? error : new Error('Auth setup failed'))
        setLoading(false)
        setAuthInitialized(true)
        clearTimeout(timeoutId)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-red-400 text-center p-4">
          <p>Authentication Error</p>
          <p className="text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userProfile,
        loading, 
        error, 
        signOut, 
        switchAgency,
        switchManagedUser,
        endImpersonation,
        // New impersonation functions
        startImpersonation: async (userId: number) => {
          try {
            const { impersonationService } = await import('@/lib/api/services/impersonation.service');
            const response = await impersonationService.startImpersonation(userId);
            
            // Store the new tokens
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', response.access);
              localStorage.setItem('refreshToken', response.refresh);
            }
            
            // Update user profile with impersonation data
            setUserProfile(prev => prev ? {
              ...prev,
              id: response.user.id,
              email: response.user.email,
              username: response.user.username,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              isImpersonating: true,
              originalUser: prev.originalUser || {
                id: prev.id,
                email: prev.email,
                role: prev.rbac_context?.role_name || 'unknown',
                agency: prev.rbac_context?.agency_name || 'unknown'
              }
            } : null);
            
            // Invalidate profile cache to refresh data
            invalidateProfileCache();
            
            console.log('✅ Impersonation started:', response.message);
          } catch (error) {
            console.error('❌ Impersonation failed:', error);
            throw error;
          }
        },
        getAvailableUsersForImpersonation: async () => {
          try {
            const { impersonationService } = await import('@/lib/api/services/impersonation.service');
            return await impersonationService.getAvailableUsers();
          } catch (error) {
            console.error('❌ Failed to get available users:', error);
            return [];
          }
        },
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isImpersonating,
        // New role-based functions
        getUserRole,
        isRole,
        hasRoleOrHigher,
        isAdmin,
        isAgencyAdmin,
        isSuperAdmin,
        // Cache management
        invalidateProfileCache
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 