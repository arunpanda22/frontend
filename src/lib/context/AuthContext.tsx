'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { 
  apiClient, 
  clearAuthTokenCache, 
  setJWTTokens, 
  clearJWTTokens,
  isImpersonating as checkImpersonating,
  getJWTAccessToken
} from '@/lib/api/config'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

// RBAC context from backend API (simplified - removed permissions)
export interface RBACContext {
  role_id: number
  role_name: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  role_display: string
  hierarchy_level: number
  agency_id?: number
  agency_name?: string
  agency_slug?: string
  managed_agencies?: Array<{
    id: number
    name: string
    slug: string
  }>
  managed_agency_ids?: number[]
  parent_seller_id?: number
  parent_seller_email?: string
}

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

// Available SELLER for impersonation
export interface AvailableSeller {
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
  is_current?: boolean
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: Error | null
  signOut: () => Promise<void>
  
  // Impersonation functions (seller-only)
  startSellerImpersonation: (sellerId: number) => Promise<void>
  endImpersonation: () => Promise<void>
  getAvailableSellers: () => Promise<AvailableSeller[]>
  switchToSeller: (sellerId: number) => Promise<void>
  
  // Role-based functions (no permission checks)
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
  canImpersonateSellers: () => boolean
  
  // Cache management
  invalidateProfileCache: () => void
  invalidatePermissionsCache: () => void
  
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
  startSellerImpersonation: async () => {},
  endImpersonation: async () => {},
  getAvailableSellers: async () => [],
  switchToSeller: async () => {},
  getUserRole: () => null,
  isRole: () => false,
  hasRoleOrHigher: () => false,
  isSuperAdmin: () => false,
  isAdmin: () => false,
  isAgencyAdmin: () => false,
  isSeller: () => false,
  isUser: () => false,
  isImpersonating: () => false,
  canImpersonateSellers: () => false,
  invalidateProfileCache: () => {},
  invalidatePermissionsCache: () => {},
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
      // Clear JWT tokens first (in case of impersonation)
      clearJWTTokens()
      
      if (auth) {
        await firebaseSignOut(auth)
        clearAuthTokenCache()
        
        setUser(null)
        setUserProfile(null)
        
        // Clear all caches
        queryClient.clear()
        
        try {
          router.replace('/login')
        } catch {
          if (typeof window !== 'undefined') window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Check if user can impersonate sellers
  const canImpersonateSellers = (): boolean => {
    const role = getUserRole()
    // Only super_admin, admin, and agency can impersonate sellers
    return role === 'super_admin' || role === 'admin' || role === 'agency'
  }

  // Start seller impersonation
  const startSellerImpersonation = async (sellerId: number) => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      if (!canImpersonateSellers()) {
        throw new Error('You do not have permission to impersonate sellers')
      }
      
      console.log(`🔄 Starting seller impersonation: ${sellerId}`)
      
      const response = await apiClient.post('/api/v1/auth/switch-user/', { 
        user_id: sellerId
      })
      
      if (response.data) {
        // Store JWT tokens
        if (response.data.access && response.data.refresh) {
          setJWTTokens(response.data.access, response.data.refresh)
        }
        
        // Store original user info
        const originalUserInfo = {
          id: userProfile?.id || 0,
          email: userProfile?.email || '',
          role: userProfile?.rbac_context?.role_name || 'unknown',
          agency: userProfile?.rbac_context?.agency_name
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('original_user_data', JSON.stringify(originalUserInfo))
        }

        // Invalidate permissions cache to fetch impersonated user's permissions
        invalidatePermissionsCache()
        
        // Update user profile
        await fetchUserProfile(true)
        
        console.log('✅ Seller impersonation started:', response.data.message)
      }
    } catch (error) {
      console.error('❌ Seller impersonation failed:', error)
      throw error
    }
  }

  // Switch directly to another seller (while already impersonating)
  const switchToSeller = async (sellerId: number) => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      console.log(`🔄 Switching to seller: ${sellerId}`)
      
      const response = await apiClient.post('/api/v1/auth/switch-user/', { 
        user_id: sellerId
      })
      
      if (response.data) {
        // Update JWT tokens
        if (response.data.access && response.data.refresh) {
          setJWTTokens(response.data.access, response.data.refresh)
        }

        // Invalidate permissions cache to fetch new seller's permissions
        invalidatePermissionsCache()

        // Update user profile
        await fetchUserProfile(true)
        
        console.log('✅ Switched to seller:', response.data.message)
      }
    } catch (error) {
      console.error('❌ Seller switch failed:', error)
      throw error
    }
  }
  
  // End impersonation
  const endImpersonation = async () => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      if (!checkImpersonating()) {
        throw new Error('Not currently impersonating')
      }
      
      console.log('🔄 Ending seller impersonation')
      
      const response = await apiClient.post('/api/v1/auth/end-impersonation/')
      
      if (response.data) {
        // Clear JWT tokens
        clearJWTTokens()
        
        // Clear Firebase token cache to force refresh
        clearAuthTokenCache()
        
        // Invalidate permissions cache to fetch original user's permissions
        invalidatePermissionsCache()
        
        // Force re-fetch user profile with Firebase token
        await fetchUserProfile(false)
        
        console.log('✅ Returned to original user:', response.data.message)
      }
    } catch (error) {
      console.error('❌ End impersonation failed:', error)
      
      // Force cleanup on error
      clearJWTTokens()
      clearAuthTokenCache()
      
      // Reload the page to reset state
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      
      throw error
    }
  }

  // Get available sellers for impersonation
  const getAvailableSellers = async (): Promise<AvailableSeller[]> => {
    try {
      const response = await apiClient.get('/api/v1/auth/switch-user/')
      
      if (response.data) {
        const sellers = response.data.users || response.data || []
        return sellers
      }
      
      return []
    } catch (error) {
      console.error('❌ Failed to get available sellers:', error)
      return []
    }
  }

  // Fetch user profile (simplified - no permissions here)
  const fetchUserProfile = async (isImpersonating: boolean = false) => {
    try {
      const currentUser = auth?.currentUser
      if (!currentUser && !isImpersonating) {
        return
      }

      console.log('🔄 Fetching user profile...')
      
      // Use the profile endpoint (not verify-token)
      const response = await apiClient.get('/api/v1/auth/profile/')
      
      if (response.data) {
        const userData = response.data
        
        // Check impersonation status
        const impersonationActive = checkImpersonating()
        let originalUser = undefined
        
        if (impersonationActive && typeof window !== 'undefined') {
          const originalUserStr = localStorage.getItem('original_user_data')
          if (originalUserStr) {
            try {
              originalUser = JSON.parse(originalUserStr)
            } catch (e) {
              console.warn('Failed to parse original user data')
            }
          }
        }
        
        const userProfile: UserProfile = {
          id: userData.id || 0,
          email: userData.email || '',
          firebase_uid: currentUser?.uid || userData.firebase_uid || '',
          username: userData.username || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          created_at: userData.created_at || '',
          updated_at: userData.updated_at || '',
          current_role_name: userData.current_role_name || null,
          current_role_display: userData.current_role_display || null,
          current_agency: userData.current_agency || null,
          rbac_context: userData.rbac_context || null,
          connected_advertising_profiles: userData.connected_advertising_profiles || [],
          connected_seller_accounts: userData.connected_seller_accounts || [],
          isImpersonating: impersonationActive,
          originalUser: originalUser
        }
        
        console.log('✅ UserProfile loaded:', {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.current_role_name,
          isImpersonating: userProfile.isImpersonating
        })
        
        setUserProfile(userProfile)
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      
      if (error?.response?.status === 401) {
        console.warn('🔐 Unauthorized, clearing auth state')
        await signOut()
      }
    }
  }

  // Check if user is currently impersonating
  const isImpersonating = (): boolean => {
    return checkImpersonating() || !!userProfile?.isImpersonating
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
    
    if (context?.role_name === 'agency' && context?.agency_id && context?.agency_name && context?.agency_slug) {
      return {
        id: context.agency_id,
        name: context.agency_name,
        slug: context.agency_slug
      }
    }
    
    if (userProfile?.current_agency) {
      return userProfile.current_agency
    }
    
    return null
  }

  const getManagedAgencies = () => {
    const context = userProfile?.rbac_context
    
    if (context?.role_name === 'admin' && context?.managed_agencies) {
      return context.managed_agencies
    }
    
    return []
  }

  const getParentSeller = () => {
    const context = userProfile?.rbac_context
    if (context?.role_name === 'user' && context?.parent_seller_id && context?.parent_seller_email) {
      return {
        id: context.parent_seller_id,
        email: context.parent_seller_email
      }
    }
    return null
  }

  // Invalidate profile cache
  const invalidateProfileCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  }
  
  // Invalidate permissions cache (critical for impersonation)
  const invalidatePermissionsCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
    console.log('🔄 Permissions cache invalidated')
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (authInitialized) return

    let timeoutId: NodeJS.Timeout
    let unsubscribe: () => void
    let lastVerifyCall: number = 0
    const VERIFY_DEBOUNCE_MS = 5000

    const initializeAuth = async () => {
      try {
        if (!auth) {
          throw new Error('Firebase auth not initialized')
        }

        timeoutId = setTimeout(() => {
          if (loading && !authInitialized) {
            setLoading(false)
            setError(new Error('Auth initialization timed out'))
          }
        }, 7000)

        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            setUser(firebaseUser)
            
            if (firebaseUser) {
              const now = Date.now()
              
              if (now - lastVerifyCall < VERIFY_DEBOUNCE_MS) {
                console.log('🚫 Skipping profile fetch (debounced)')
                return
              }
              lastVerifyCall = now

              try {
                await new Promise(resolve => setTimeout(resolve, 100))
                
                // Check if we're in impersonation mode
                const impersonating = checkImpersonating()
                
                if (impersonating) {
                  console.log('🔄 Loading impersonated user profile')
                  await fetchUserProfile(true)
                } else {
                  console.log('🔄 Loading normal user profile')
                  await fetchUserProfile(false)
                }
              } catch (profileError: any) {
                console.error('Error fetching user profile:', profileError)
                
                if (profileError?.response?.status === 401) {
                  console.warn('🔐 Token expired, clearing auth state')
                  await signOut()
                  return
                }
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
        startSellerImpersonation,
        endImpersonation,
        getAvailableSellers,
        switchToSeller,
        getUserRole,
        isRole,
        hasRoleOrHigher,
        isSuperAdmin,
        isAdmin,
        isAgencyAdmin,
        isSeller,
        isUser,
        isImpersonating,
        canImpersonateSellers,
        invalidateProfileCache,
        invalidatePermissionsCache,
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