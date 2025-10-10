'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/context/AuthContext'
import { apiClient } from '@/lib/api/config'

// Response from /api/v1/auth/user-permissions/
interface UserPermissionsResponse {
  permissions: string[]  // Flat array of effective permissions (default + granted - revoked)
  current_role: {
    role_id: number
    role_name: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
    role_display: string
    hierarchy_level: number
    assigned_at: string
    // Optional context fields
    agency?: { id: number; name: string; slug: string }
    managed_agencies?: Array<{ id: number; name: string; slug: string }>
    parent_seller?: { id: number; email: string }
  } | null
  is_superuser: boolean
}

/**
 * Hook to fetch and cache user permissions from backend
 * Single source of truth for permissions
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
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes (same for normal and impersonation)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3, // Retry 3 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Main hook for checking user permissions and roles
 * Combines permissions from API with role helpers from AuthContext
 */
export function usePermissions() {
  const { 
    userProfile,
    endImpersonation,
    isImpersonating,
    getUserRole,
    hasRoleOrHigher,
    getAgency,
    getManagedAgencies,
    getParentSeller,
  } = useAuth()
  
  const { data: permissionsData, isLoading, isError, error } = useUserPermissions()

  // ============================================
  // PERMISSION CHECKS (Backend-driven)
  // ============================================

  /**
   * Check if user has a specific permission
   * Super admins bypass permission checks (they can do anything)
   * Regular users check against their effective permissions array
   */
  const hasPermission = (permission: string): boolean => {
    // Super admins have all permissions
    if (permissionsData?.is_superuser) return true
    
    // Check if permission exists in user's effective permissions
    return permissionsData?.permissions?.includes(permission) ?? false
  }

  /**
   * Check if user has ANY of the specified permissions
   * Useful for: "User needs permission A OR permission B"
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (permissionsData?.is_superuser) return true
    if (!permissions || permissions.length === 0) return false
    
    return permissions.some(p => permissionsData?.permissions?.includes(p))
  }

  /**
   * Check if user has ALL of the specified permissions
   * Useful for: "User needs both permission A AND permission B"
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (permissionsData?.is_superuser) return true
    if (!permissions || permissions.length === 0) return true
    
    return permissions.every(p => permissionsData?.permissions?.includes(p))
  }

  // ============================================
  // ROLE CHECKS (Delegate to AuthContext)
  // ============================================

  /**
   * Role checkers - delegated to AuthContext for consistency
   */
  const isSuperAdmin = (): boolean => {
    return getUserRole() === 'super_admin' || permissionsData?.is_superuser === true
  }

  const isAdmin = (): boolean => {
    return hasRoleOrHigher('admin')
  }

  const isAgency = (): boolean => {
    return getUserRole() === 'agency'
  }

  const isSeller = (): boolean => {
    return getUserRole() === 'seller'
  }

  const isUser = (): boolean => {
    return getUserRole() === 'user'
  }

  // ============================================
  // ROUTE ACCESS CONTROL
  // ============================================

  /**
   * Check if user can access a route/page
   * Supports three types of requirements:
   * 1. Single required permission
   * 2. ANY of multiple permissions (OR logic)
   * 3. ALL of multiple permissions (AND logic)
   * 
   * Also supports optional role requirement
   */
  const canAccess = (requirements: {
    permission?: string
    anyPermissions?: string[]
    allPermissions?: string[]
    role?: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
    minRole?: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user'
  }): boolean => {
    if (!userProfile) return false
    
    // Super admins can access everything (except maybe dashboard without seller account)
    if (isSuperAdmin()) return true

    // Check role requirement if specified
    if (requirements.role && getUserRole() !== requirements.role) {
      return false
    }

    // Check minimum role requirement if specified
    if (requirements.minRole && !hasRoleOrHigher(requirements.minRole)) {
      return false
    }

    // Check single permission
    if (requirements.permission) {
      return hasPermission(requirements.permission)
    }

    // Check ANY permissions (OR logic)
    if (requirements.anyPermissions && requirements.anyPermissions.length > 0) {
      return hasAnyPermission(requirements.anyPermissions)
    }

    // Check ALL permissions (AND logic)
    if (requirements.allPermissions && requirements.allPermissions.length > 0) {
      return hasAllPermissions(requirements.allPermissions)
    }

    // No requirements specified - default to false for security
    return false
  }

  // ============================================
  // AGENCY & SELLER MANAGEMENT
  // ============================================

  /**
   * Check if user can manage a specific agency
   * Logic:
   * - Super admins: Yes (all agencies)
   * - Admins: Yes (only their managed agencies)
   * - Agency role: Yes (only their assigned agency)
   * - Others: Check for 'manage_agencies' permission
   */
  const canManageAgency = (agencyId: number): boolean => {
    // Super admins can manage all agencies
    if (isSuperAdmin()) return true
    
    // Check if user has the permission
    if (!hasPermission('manage_agencies') && !hasPermission('manage_agency_clients')) {
      return false
    }

    // Admin role: Check if agency is in their managed list
    if (isAdmin()) {
      const managedAgencies = getManagedAgencies()
      return managedAgencies.some(a => a.id === agencyId)
    }

    // Agency role: Check if this is their assigned agency
    if (isAgency()) {
      const currentAgency = getAgency()
      return currentAgency?.id === agencyId
    }

    // For other roles, having the permission is enough
    return true
  }

  /**
   * Check if user can manage a specific seller
   * Logic:
   * - Super admins: Yes (all sellers)
   * - Admins: Yes (only sellers in their managed agencies)
   * - Agency role: Yes (only sellers that are their clients)
   * - Others: No
   */
  const canManageSeller = (sellerAgencyId?: number): boolean => {
    // Super admins can manage all sellers
    if (isSuperAdmin()) return true

    // Must have seller management permission
    if (!hasPermission('manage_agency_clients') && !isAdmin() && !isAgency()) {
      return false
    }

    // If no agency specified, can't determine
    if (!sellerAgencyId) return false

    // Check if user can manage the seller's agency
    return canManageAgency(sellerAgencyId)
  }

  // ============================================
  // IMPERSONATION
  // ============================================

  /**
   * Check if user is currently impersonating another user
   */
  const isActingAsManagedUser = (): boolean => {
    return isImpersonating()
  }

  /**
   * End impersonation and return to original user
   */
  const resetToAdminUser = async (): Promise<void> => {
    await endImpersonation()
  }

  /**
   * Check if current user can impersonate sellers
   * Only super_admin, admin, and agency roles can impersonate
   */
  const canImpersonateSellers = (): boolean => {
    if (isSuperAdmin()) return true
    if (isAdmin() && hasPermission('impersonate_users')) return true
    if (isAgency() && hasPermission('impersonate_users')) return true
    return false
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Get all permissions as array (for debugging/display)
   */
  const getAllPermissions = (): string[] => {
    return permissionsData?.permissions || []
  }

  /**
   * Check if permissions are currently loading
   */
  const isLoadingPermissions = (): boolean => {
    return isLoading
  }

  /**
   * Check if there was an error loading permissions
   */
  const hasPermissionsError = (): boolean => {
    return isError
  }

  /**
   * Get the permissions error if any
   */
  const getPermissionsError = (): Error | null => {
    return error as Error | null
  }

  // ============================================
  // RETURN PUBLIC API
  // ============================================

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    
    // Role checks
    isSuperAdmin,
    isAdmin,
    isAgency,
    isSeller,
    isUser,
    getUserRole,
    hasRoleOrHigher,
    
    // Agency & Seller management
    canManageAgency,
    canManageSeller,
    getAgency,
    getManagedAgencies,
    getParentSeller,
    
    // Impersonation
    isActingAsManagedUser,
    resetToAdminUser,
    canImpersonateSellers,
    
    // Utility
    getAllPermissions,
    isLoadingPermissions,
    hasPermissionsError,
    getPermissionsError,
    
    // Raw data (for debugging)
    permissions: permissionsData?.permissions || [],
    currentRole: permissionsData?.current_role?.role_name || null,
    currentRoleDisplay: permissionsData?.current_role?.role_display || null,
    isSuperuser: permissionsData?.is_superuser || false,
  }
}

export default usePermissions