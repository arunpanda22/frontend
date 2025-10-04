'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/context/AuthContext'
import { apiClient } from '@/lib/api/config'

interface UserPermissionsResponse {
  permissions: string[]
  current_role: {
    role_id: number
    role_name: string
    role_display: string
    hierarchy_level: number
    agency?: { id: number; name: string; slug: string }
    managed_agencies?: Array<{ id: number; name: string; slug: string }>
    parent_seller?: { id: number; email: string }
  } | null
  is_superuser: boolean
}

/**
 * Hook to fetch and cache user permissions from backend
 */
export function useUserPermissions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const response = await apiClient.get<UserPermissionsResponse>(
        '/api/v1/auth/user-permissions/'
      )
      return response.data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Custom hook for checking user permissions
 */
export function usePermissions() {
  const { 
    userProfile,
    endImpersonation,
    isImpersonating,
    isSuperAdmin,
    isAdmin,
    isAgencyAdmin,
    isSeller,
    isUser,
    getUserRole,
    hasRoleOrHigher,
    getAgency,
    getManagedAgencies,
    getParentSeller,
  } = useAuth()
  
  const { data: permissionsData, isLoading } = useUserPermissions()

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin()) return true
    return permissionsData?.permissions?.includes(permission) ?? false
  }

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (isSuperAdmin()) return true
    return permissions.some(p => permissionsData?.permissions?.includes(p))
  }

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (isSuperAdmin()) return true
    return permissions.every(p => permissionsData?.permissions?.includes(p))
  }
  
  /**
   * Check if user can view a page that requires specific permission(s)
   */
  const canAccess = (
    requiredPermission?: string, 
    anyRequiredPermissions?: string[], 
    allRequiredPermissions?: string[]
  ): boolean => {
    if (!userProfile) return false
    if (isSuperAdmin()) return true
    
    if (requiredPermission && hasPermission(requiredPermission)) {
      return true
    }
    
    if (anyRequiredPermissions && anyRequiredPermissions.length > 0 && 
        hasAnyPermission(anyRequiredPermissions)) {
      return true
    }
    
    if (allRequiredPermissions && allRequiredPermissions.length > 0 && 
        hasAllPermissions(allRequiredPermissions)) {
      return true
    }
    
    return false
  }
  
  /**
   * Check if user can manage a specific agency
   */
  const canManageAgency = (agencyId: number): boolean => {
    if (isSuperAdmin()) return true
    
    // Only admins and agency role can manage agencies
    if (!isAdmin() && getUserRole() !== 'agency') return false
    
    // For admin role, check managed agencies
    if (isAdmin()) {
      const managedAgencies = getManagedAgencies()
      return managedAgencies.some(a => a.id === agencyId)
    }
    
    // For agency role, check if this is their assigned agency
    const currentAgency = getAgency()
    return currentAgency?.id === agencyId
  }
  
  /**
   * Check if user can manage a specific seller
   */
  const canManageSeller = (sellerAgencyId?: number): boolean => {
    if (isSuperAdmin()) return true
    
    // Admins can manage sellers in their agencies
    if (isAdmin() && sellerAgencyId) {
      return canManageAgency(sellerAgencyId)
    }
    
    // Agency role can manage sellers that are their clients
    if (getUserRole() === 'agency') {
      const currentAgency = getAgency()
      return currentAgency?.id === sellerAgencyId
    }
    
    return false
  }
  
  /**
   * Check if user is currently impersonating another user
   */
  const isActingAsManagedUser = (): boolean => {
    return isImpersonating()
  }
  
  /**
   * End impersonation and return to the original user
   */
  const resetToAdminUser = async (): Promise<void> => {
    await endImpersonation()
  }
  
  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isLoadingPermissions: isLoading,
    permissions: permissionsData?.permissions || [],
    
    // Role checks
    isSuperAdmin,
    isAdmin,
    isAgency: () => getUserRole() === 'agency',
    isSeller,
    isUser,
    getUserRole,
    hasRoleOrHigher,
    
    // Context checks
    canManageAgency,
    canManageSeller,
    getAgency,
    getManagedAgencies,
    getParentSeller,
    
    // Impersonation
    isActingAsManagedUser,
    resetToAdminUser,
    
    // User info
    currentRole: userProfile?.current_role_name,
    currentRoleDisplay: userProfile?.current_role_display,
  }
}

export default usePermissions