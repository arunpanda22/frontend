'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiClient, clearAuthTokenCache } from '@/lib/api/config'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

// RBAC context from backend API - Updated to match new model
export interface RBACContext {
  role_id: number
  role_name: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  role_display: string
  hierarchy_level: number
  // Agency role context (only for 'agency' role)
  agency_id?: number
  agency_name?: string
  agency_slug?: string
  // Admin role context (only for 'admin' role)
  managed_agencies?: Array<{
    id: number
    name: string
    slug: string
  }>
  managed_agency_ids?: number[]
  // User role context (only for 'user' role)
  parent_seller_id?: number
  parent_seller_email?: string
}

// Connected account interfaces
export interface ConnectedAdvertisingProfile {
  profile_id: string
  account_name: string
  account_type: string
  account_subtype: string
  country_code: string
  currency_code: string
  timezone: string
  marketplace_id: string
  region: string
  valid_payment_method: boolean
  is_active: boolean
  created_at: string
  last_synced_at: string
}

export interface ConnectedSellerAccount {
  seller_id: string
  marketplace_id: string
  region: string
  is_active: boolean
  created_at: string
  last_refreshed_at: string
}

// User profile with new RBAC data structure
export interface UserProfile {
  id: number
  email: string
  firebase_uid: string
  username: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string

  current_role_name: string | null
  current_role_display: string | null
  current_agency: {
    id: number
    name: string
    slug: string
  } | null

  rbac_context: RBACContext | null
  connected_advertising_profiles: ConnectedAdvertisingProfile[]
  connected_seller_accounts: ConnectedSellerAccount[]

  // Impersonation fields
  isImpersonating?: boolean
  originalUser?: {
    id: number
    email: string
    role: string
    agency?: string
  }
}

// Available user for impersonation
export interface AvailableUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role?: {
    name: string
    display: string
  }
  agency?: {
    id: number
    name: string
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: Error | null
  signOut: () => Promise<void>
  // New impersonation functions
  startImpersonation: (userId: number) => Promise<void>
  endImpersonation: () => Promise<void>
  getAvailableUsersForImpersonation: () => Promise<AvailableUser[]>
  // Permission checking functions
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  // Role-based functions - Updated for new hierarchy
  getUserRole: () => 'super_admin' | 'admin' | 'agency' | 'seller' | 'user' | null
  isRole: (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user') => boolean
  hasRoleOrHigher: (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user') => boolean
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
  isAgencyAdmin: () => boolean
  isSeller: () => boolean
  isUser: () => boolean
  // Impersonation status
  isImpersonating: () => boolean
  // Cache management
  invalidateProfileCache: () => void
  // Context getters
  getAgency: () => { id: number, name: string, slug: string } | null
  getManagedAgencies: () => Array<{ id: number, name: string, slug: string }>
  getParentSeller: () => { id: number, email: string } | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  startImpersonation: async () => {},
  endImpersonation: async () => {},
  getAvailableUsersForImpersonation: async () => [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  getUserRole: () => null,
  isRole: () => false,
  hasRoleOrHigher: () => false,
  isSuperAdmin: () => false,
  isAdmin: () => false,
  isAgencyAdmin: () => false,
  isSeller: () => false,
  isUser: () => false,
  isImpersonating: () => false,
  invalidateProfileCache: () => {},
  getAgency: () => null,
  getManagedAgencies: () => [],
  getParentSeller: () => null,
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
        await firebaseSignOut(auth)
        // Clear any cached auth state in API client
        clearAuthTokenCache()
        // Clear local storage tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('impersonationActive')
          localStorage.removeItem('originalUser')
        }
        // Proactively clear local auth state
        setUser(null)
        setUserProfile(null)
        // Redirect to login immediately
        try {
          router.replace('/login')
        } catch {
          // Fallback if router not available
          if (typeof window !== 'undefined') window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Start impersonation function
  const startImpersonation = async (userId: number) => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      console.log(`🔄 Starting impersonation of user ${userId}`)
      
      const response = await apiClient.post('/api/v1/auth/switch-user/', { 
        user_id: userId
      })
      
      if (response.data) {
        // Store tokens and impersonation state
        if (response.data.access) {
          localStorage.setItem('accessToken', response.data.access)
        }
        if (response.data.refresh) {
          localStorage.setItem('refreshToken', response.data.refresh)
        }
        
        // Store original user info for returning later
        const originalUserInfo = {
          id: userProfile?.id || 0,
          email: userProfile?.email || '',
          role: userProfile?.rbac_context?.role_name || 'unknown',
          agency: userProfile?.rbac_context?.agency_name
        }
        localStorage.setItem('originalUser', JSON.stringify(originalUserInfo))
        localStorage.setItem('impersonationActive', 'true')

        // Update user profile with the impersonated user data
        setUserProfile(prev => ({
          ...response.data.user,
          isImpersonating: true,
          originalUser: originalUserInfo,
          rbac_context: response.data.target_context ? {
            role_id: 0, // Will be updated by profile fetch
            role_name: response.data.target_context.role_name,
            role_display: response.data.target_context.role_display,
            hierarchy_level: 1, // Will be updated by profile fetch
            agency_name: response.data.target_context.agency_name
          } : null
        }))
        
        // Invalidate and refresh profile cache
        invalidateProfileCache()
        
        console.log('✅ Impersonation started:', response.data.message)
      }
    } catch (error) {
      console.error('❌ Impersonation failed:', error)
      throw error
    }
  }
  
  // End impersonation function
  const endImpersonation = async () => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      console.log('🔄 Ending impersonation')
      
      const response = await apiClient.post('/api/v1/auth/end-impersonation/')
      
      if (response.data) {
        // Update tokens
        if (response.data.access) {
          localStorage.setItem('accessToken', response.data.access)
        }
        if (response.data.refresh) {
          localStorage.setItem('refreshToken', response.data.refresh)
        }
        
        // Clear impersonation flags
        localStorage.removeItem('impersonationActive')
        localStorage.removeItem('originalUser')
        
        // Update user profile to return to the original user
        setUserProfile(prev => prev ? {
          ...response.data.user,
          isImpersonating: false,
          originalUser: undefined
        } : null)
        
        // Invalidate and refresh profile cache
        invalidateProfileCache()
        
        console.log('✅ Returned to original user:', response.data.message)
      }
    } catch (error) {
      console.error('❌ End impersonation failed:', error)
      throw error
    }
  }

  // Get available users for impersonation
  const getAvailableUsersForImpersonation = async (): Promise<AvailableUser[]> => {
    try {
      const response = await apiClient.get('/api/v1/auth/switch-user/')
      return response.data || []
    } catch (error) {
      console.error('❌ Failed to get available users:', error)
      return []
    }
  }

  // Check if user is currently impersonating someone
  const isImpersonating = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('impersonationActive') === 'true' || !!userProfile?.isImpersonating
  }

  // Role hierarchy: super_admin > admin > agency > seller > user
  const roleHierarchy = {
    'super_admin': 5,
    'admin': 4,
    'agency': 3,
    'seller': 2,
    'user': 1
  }

  // Get current user role
  const getUserRole = (): 'super_admin' | 'admin' | 'agency' | 'seller' | 'user' | null => {
    return userProfile?.rbac_context?.role_name || null
  }

  // Check if user has specific role
  const isRole = (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'): boolean => {
    const currentRole = getUserRole()
    return currentRole === role
  }

  // Check if user has role or higher (based on hierarchy)
  const hasRoleOrHigher = (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'): boolean => {
    const currentRole = getUserRole()
    if (!currentRole) return false
    
    return roleHierarchy[currentRole] >= roleHierarchy[role]
  }

  // Specific role checkers
  const isSuperAdmin = (): boolean => isRole('super_admin')
  const isAdmin = (): boolean => hasRoleOrHigher('admin')
  const isAgencyAdmin = (): boolean => hasRoleOrHigher('agency')
  const isSeller = (): boolean => isRole('seller')
  const isUser = (): boolean => isRole('user')

  // Context getters
  const getAgency = () => {
    const context = userProfile?.rbac_context
    
    // Only 'agency' role has direct agency assignment
    if (context?.role_name === 'agency' && context?.agency_id && context?.agency_name && context?.agency_slug) {
      return {
        id: context.agency_id,
        name: context.agency_name,
        slug: context.agency_slug
      }
    }
    
    // Also check the serializer field for convenience
    if (userProfile?.current_agency) {
      return userProfile.current_agency
    }
    
    return null
  }

  // NEW: Get managed agencies for admin rol
  const getManagedAgencies = () => {
    const context = userProfile?.rbac_context
    
    // Only 'admin' role has managed agencies
    if (context?.role_name === 'admin' && context?.managed_agencies) {
      return context.managed_agencies
    }
    
    return []
  }

  const getParentSeller = () => {
    const context = userProfile?.rbac_context
    // Only 'user' role has parent seller
    if (context?.role_name === 'user' && context?.parent_seller_id && context?.parent_seller_email) {
      return {
        id: context.parent_seller_id,
        email: context.parent_seller_email
      }
    }
    return null
  }

  // Invalidate profile cache when needed
  const invalidateProfileCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  }
  
  // Permission check helpers (Note: These would need to be implemented with backend API calls
  // or by including permissions in the user profile response)
  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false
    
    // Super admin always has all permissions
    if (isSuperAdmin()) return true
    
    // TODO: Implement permission checking with backend
    // For now, return false as permissions aren't loaded in this context
    console.warn('Permission checking not fully implemented - use useUserPermissions hook instead')
    return false
  }
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userProfile) return false
    
    // Super admin always has all permissions
    if (isSuperAdmin()) return true
    
    // TODO: Implement permission checking with backend
    console.warn('Permission checking not fully implemented - use useUserPermissions hook instead')
    return false
  }
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userProfile) return false
    
    // Super admin always has all permissions
    if (isSuperAdmin()) return true
    
    // TODO: Implement permission checking with backend
    console.warn('Permission checking not fully implemented - use useUserPermissions hook instead')
    return false
  }

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return
    
    // Prevent double initialization in React Strict Mode
    if (authInitialized) return

    let timeoutId: NodeJS.Timeout
    let unsubscribe: () => void
    let lastVerifyCall: number = 0
    const VERIFY_DEBOUNCE_MS = 5000 // Prevent multiple verify calls within 5 seconds

    const initializeAuth = async () => {
      try {
        if (!auth) {
          throw new Error('Firebase auth not initialized')
        }

        // Set up timeout
        timeoutId = setTimeout(() => {
          if (loading && !authInitialized) {
            setLoading(false)
            setError(new Error('Auth initialization timed out'))
          }
        }, 7000) // 7 seconds timeout

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            setUser(firebaseUser)
            
            // If user is logged in, fetch their profile with RBAC data
            if (firebaseUser) {
              const now = Date.now()
              
              // Debounce verify-token calls to prevent multiple rapid calls
              if (now - lastVerifyCall < VERIFY_DEBOUNCE_MS) {
                console.log('🚫 Skipping verify-token call (debounced)')
                return
              }
              lastVerifyCall = now

              try {
                // Add a small delay to ensure Firebase token is properly set
                await new Promise(resolve => setTimeout(resolve, 100))
                
                const token = await firebaseUser.getIdToken(false) // Use cached token if available
                
                // Add additional validation
                if (!token || token.length < 100) {
                  throw new Error('Invalid token received from Firebase')
                }
                
                console.log('🔄 Calling verify-token with fresh Firebase auth')
                
                // Fetch user profile with permissions from backend
                const response = await apiClient.post(
                  '/api/v1/auth/verify-token/',
                  { token },
                  { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000 // 10 second timeout
                  }
                )
                
                if (response.data && response.data.user) {
                  const userData = response.data.user
                  const userContext = response.data.user_context // Get the separate user_context
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 Backend user data received:', userData)
                    console.log('🔄 Backend user context received:', userContext)
                  }
                  
                  // Check if currently impersonating
                  const impersonationActive = localStorage.getItem('impersonationActive') === 'true'
                  const originalUserStr = localStorage.getItem('originalUser')
                  let originalUser = undefined
                  
                  if (impersonationActive && originalUserStr) {
                    try {
                      originalUser = JSON.parse(originalUserStr)
                    } catch (e) {
                      console.warn('Failed to parse original user data')
                    }
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

                    // NEW: Use serializer fields instead of current_role FK
                    current_role_name: userData.current_role_name || null,
                    current_role_display: userData.current_role_display || null,
                    current_agency: userData.current_agency || null,

                    rbac_context: userContext || null,
                    connected_advertising_profiles: userData.connected_advertising_profiles || [],
                    connected_seller_accounts: userData.connected_seller_accounts || [],
                    // Impersonation fields
                    isImpersonating: impersonationActive,
                    originalUser: originalUser
                  }
                  
                  // Debug logging
                  console.log('✅ UserProfile created:', {
                    id: userProfile.id,
                    email: userProfile.email,
                    role_name: userProfile.current_role_name,
                    role_display: userProfile.current_role_display,
                    agency: userProfile.current_agency,
                    isImpersonating: userProfile.isImpersonating,
                    rbacContext: userProfile.rbac_context
                  })
                  
                  setUserProfile(userProfile)
                }
              } catch (profileError: any) {
                console.error('Error fetching user profile:', profileError)
                
                // Handle specific error cases
                if (profileError?.response?.status === 400) {
                  console.warn('🔄 Verify token failed (400), will retry on next request')
                } else if (profileError?.response?.status === 401) {
                  console.warn('🔐 Token expired, clearing auth state')
                  await signOut() // Sign out on 401 errors
                  return
                } else {
                  console.error('❌ Unexpected profile error:', profileError?.message)
                }
                
                // Don't set global error state here, as we still have a valid Firebase user
              }
            } else {
              setUserProfile(null)
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
        startImpersonation,
        endImpersonation,
        getAvailableUsersForImpersonation,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getUserRole,
        isRole,
        hasRoleOrHigher,
        isSuperAdmin,
        isAdmin,
        isAgencyAdmin,
        isSeller,
        isUser,
        isImpersonating,
        invalidateProfileCache,
        getAgency,
        getManagedAgencies,
        getParentSeller
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)