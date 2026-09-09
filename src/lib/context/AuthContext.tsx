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
} from '@/lib/api/config'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ConnectedVendorAccount } from '../hooks/queries/use-user-profile'

// Your existing interfaces (keep them as is)
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
  connected_vendor_accounts: ConnectedVendorAccount[]
  isImpersonating?: boolean
  originalUser?: {
    id: number
    email: string
    role: string
    agency?: string
  }
}

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
  startSellerImpersonation: (sellerId: number) => Promise<void>
  endImpersonation: () => Promise<void>
  getAvailableSellers: () => Promise<AvailableSeller[]>
  switchToSeller: (sellerId: number) => Promise<void>
  getUserRole: () => 'super_admin' | 'admin' | 'agency' | 'seller' | 'user' | null
  isRole: (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user') => boolean
  hasRoleOrHigher: (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user') => boolean
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
  isAgencyAdmin: () => boolean
  isSeller: () => boolean
  isUser: () => boolean
  isImpersonating: () => boolean
  canImpersonateSellers: () => boolean
  invalidateProfileCache: () => void
  invalidatePermissionsCache: () => void
  getAgency: () => { id: number, name: string, slug: string } | null
  getManagedAgencies: () => Array<{ id: number, name: string, slug: string }>
  getParentSeller: () => { id: number, email: string } | null
  refreshProfile: () => Promise<void>
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
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  // 🔧 FIX: Clear ALL query cache when switching users
  const clearAllCaches = () => {
    console.log('🧹 Clearing all query caches...')
    queryClient.clear() // This removes ALL cached queries
    queryClient.invalidateQueries() // Extra safety - invalidate any remaining queries
  }

  // Fetch user profile from backend
  const fetchUserProfile = async (): Promise<void> => {
    try {
      console.log('🔄 Fetching user profile from backend...')
      
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
        
        const profile: UserProfile = {
          id: userData.id || 0,
          email: userData.email || '',
          firebase_uid: userData.firebase_uid || '',
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
          connected_vendor_accounts: userData.connected_vendor_accounts || [],
          isImpersonating: impersonationActive,
          originalUser: originalUser
        }
        
        console.log('✅ UserProfile loaded:', {
          id: profile.id,
          email: profile.email,
          role: profile.current_role_name,
          isImpersonating: profile.isImpersonating
        })
        
        setUserProfile(profile)
        setError(null)
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error)
      
      if (error?.response?.status === 401) {
        console.warn('🔐 Unauthorized, clearing auth state')
        await signOut()
      } else {
        setError(error)
      }
      
      throw error
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      clearJWTTokens()
      
      if (auth) {
        await firebaseSignOut(auth)
        clearAuthTokenCache()
        
        setUser(null)
        setUserProfile(null)
        
        clearAllCaches() // Clear everything on sign out
        
        router.replace('/login')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // 🔧 FIX: Updated switchToSeller with proper cache clearing
  const switchToSeller = async (sellerId: number) => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      console.log(`🔄 Switching to seller: ${sellerId}`)
      
      const response = await apiClient.post('/api/v1/auth/switch-seller/', { 
        user_id: sellerId
      })
      
      if (response.data) {
        // Store JWT tokens for impersonation
        if (response.data.access && response.data.refresh) {
          setJWTTokens(response.data.access, response.data.refresh)
        }
        
        // Store original user info if not already stored (first impersonation)
        if (typeof window !== 'undefined') {
          const existingOriginalUser = localStorage.getItem('original_user_data')
          if (!existingOriginalUser) {
            const originalUserInfo = {
              id: userProfile?.id || 0,
              email: userProfile?.email || '',
              role: userProfile?.rbac_context?.role_name || 'unknown',
              agency: userProfile?.rbac_context?.agency_name
            }
            localStorage.setItem('original_user_data', JSON.stringify(originalUserInfo))
          }
        }

        // 🔧 FIX: Clear ALL caches before fetching new profile
        clearAllCaches()
        
        // 🔧 FIX: Also clear Firebase token cache
        clearAuthTokenCache()
        
        // Fetch new profile
        await fetchUserProfile()
        
        console.log('✅ Switched to seller successfully')
      }
    } catch (error) {
      console.error('❌ Seller switch failed:', error)
      throw error
    }
  }

  const startSellerImpersonation = async (sellerId: number) => {
    return switchToSeller(sellerId)
  }
  
  // 🔧 FIX: Updated endImpersonation with proper cache clearing
  const endImpersonation = async () => {
    try {
      if (!user) throw new Error('No authenticated user')
      
      if (!checkImpersonating()) {
        throw new Error('Not currently impersonating')
      }
      
      console.log('🔄 Ending seller impersonation')
      
      const response = await apiClient.post('/api/v1/auth/end-impersonation/')
      
      if (response.data) {
        // Clear JWT tokens and impersonation state
        clearJWTTokens()
        clearAuthTokenCache()
        
        // 🔧 FIX: Clear ALL caches before fetching original user profile
        clearAllCaches()
        
        // Fetch profile with Firebase auth again
        await fetchUserProfile()
        
        console.log('✅ Returned to original user')
      }
    } catch (error) {
      console.error('❌ End impersonation failed:', error)
      
      // Fallback: clear everything and reload
      clearJWTTokens()
      clearAuthTokenCache()
      
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      
      throw error
    }
  }

  const getAvailableSellers = async (): Promise<AvailableSeller[]> => {
    try {
      const response = await apiClient.get('/api/v1/auth/switch-seller/')
      return response.data.users || []
    } catch (error) {
      console.error('❌ Failed to get available sellers:', error)
      return []
    }
  }

  // Role hierarchy
  const roleHierarchy = {
    'super_admin': 5,
    'admin': 4,
    'agency': 3,
    'seller': 2,
    'user': 1
  }

  const getUserRole = (): 'super_admin' | 'admin' | 'agency' | 'seller' | 'user' | null => {
    return userProfile?.rbac_context?.role_name || null
  }

  const isRole = (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'): boolean => {
    const currentRole = getUserRole()
    return currentRole === role
  }

  const hasRoleOrHigher = (role: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'): boolean => {
    const currentRole = getUserRole()
    if (!currentRole) return false
    return roleHierarchy[currentRole] >= roleHierarchy[role]
  }

  const isSuperAdmin = (): boolean => isRole('super_admin')
  const isAdmin = (): boolean => hasRoleOrHigher('admin')
  const isAgencyAdmin = (): boolean => hasRoleOrHigher('agency')
  const isSeller = (): boolean => isRole('seller')
  const isUser = (): boolean => isRole('user')

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

  const isImpersonating = (): boolean => {
    return checkImpersonating() || !!userProfile?.isImpersonating
  }

  // 🔧 FIX: Allow impersonation checks even during impersonation
  const canImpersonateSellers = (): boolean => {
    // If impersonating, check the ORIGINAL user's role
    if (isImpersonating() && typeof window !== 'undefined') {
      const originalUserStr = localStorage.getItem('original_user_data')
      if (originalUserStr) {
        try {
          const originalUser = JSON.parse(originalUserStr)
          const originalRole = originalUser.role
          return originalRole === 'super_admin' || originalRole === 'admin' || originalRole === 'agency'
        } catch (e) {
          console.warn('Failed to parse original user role')
        }
      }
    }
    
    // Normal check for current role
    const role = getUserRole()
    return role === 'super_admin' || role === 'admin' || role === 'agency'
  }

  const invalidateProfileCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  }
  
  const invalidatePermissionsCache = () => {
    queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
    console.log('🔄 Permissions cache invalidated')
  }

  const refreshProfile = async () => {
    await fetchUserProfile()
  }

  // Initialize auth
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!auth) {
      console.error('Firebase auth not initialized')
      setError(new Error('Firebase auth not initialized'))
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log('🔥 Firebase auth state changed:', firebaseUser ? 'Logged in' : 'Logged out')
        
        setUser(firebaseUser)
        
        if (firebaseUser) {
          try {
            await fetchUserProfile()
          } catch (error) {
            console.error('Failed to fetch profile:', error)
          }
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      },
      (error) => {
        console.error('Auth error:', error)
        setError(error)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
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
        getParentSeller,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)