'use client'

import { useAuth } from '@/lib/context/AuthContext'
// import { ManagedUser } from '@/lib/context/AuthContext'

/**
 * Custom hook for checking user permissions
 */
export function usePermissions() {
  const { 
    userProfile,
    // switchManagedUser,
    endImpersonation,
    isImpersonating,
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions 
  } = useAuth()
  
  /**
   * Check if user can view a page that requires specific permission(s)
   * @param requiredPermission Single permission required
   * @param anyRequiredPermissions Array of permissions where user needs at least one
   * @param allRequiredPermissions Array of permissions where user needs all
   * @returns boolean indicating if user has access
   */
  const canAccess = (
    requiredPermission?: string, 
    anyRequiredPermissions?: string[], 
    allRequiredPermissions?: string[]
  ): boolean => {
    if (!userProfile) return false
    
    // Check for admin status first - admins have all permissions
    // if (userProfile.isAdmin) return true
    
    // Check single permission if provided
    if (requiredPermission && hasPermission(requiredPermission)) {
      return true
    }
    
    // Check if user has any of the specified permissions
    if (anyRequiredPermissions && anyRequiredPermissions.length > 0 && 
        hasAnyPermission(anyRequiredPermissions)) {
      return true
    }
    
    // Check if user has all of the specified permissions
    if (allRequiredPermissions && allRequiredPermissions.length > 0 && 
        hasAllPermissions(allRequiredPermissions)) {
      return true
    }
    
    return false
  }
  
  /**
   * Check if current user belongs to specified agency
   * @param agencyId Agency ID to check
   * @returns boolean indicating if user belongs to the agency
   */
  // const belongsToAgency = (agencyId: string): boolean => {
  //   if (!userProfile || !userProfile.agencies) return false
  //   return !!userProfile.agencies.find(agency => agency.id === agencyId)
  // }
  
  /**
   * Check if current user is an agency admin
   * @returns boolean indicating if user is an agency admin
   */
  // const isAgencyAdmin = (): boolean => {
  //   return userProfile?.isAgencyAdmin || false
  // }
  
  /**
   * Check if user is currently impersonating another user
   * @returns boolean indicating if user is impersonating someone
   */
  const isActingAsManagedUser = (): boolean => {
    return isImpersonating()
  }
  
  /**
   * Switch to impersonate a user (for agency admins)
   * @param userId The user ID to switch to
   * @returns Promise that resolves when the switch is complete
   */
  // const switchToManagedUser = async (userId: string): Promise<void> => {
  //   if (!userProfile?.isAgencyAdmin) {
  //     throw new Error('Only agency admins can impersonate users')
  //   }
    
  //   await switchManagedUser(userId)
  // }
  
  /**
   * End impersonation and return to the admin's own account
   * @returns Promise that resolves when the switch is complete
   */
  const resetToAdminUser = async (): Promise<void> => {
    await endImpersonation()
  }
  
  return {
    // Base permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Advanced permission helpers
    canAccess,
    // belongsToAgency,
    // isAgencyAdmin,
    isActingAsManagedUser,
    
    // Managed user functions
    // switchToManagedUser,
    resetToAdminUser,
    
    // Agency and managed user information
    // currentAgency: userProfile?.currentAgency || null,
    // agencies: userProfile?.agencies || [],
    // managedUsers: userProfile?.managedUsers || [],
    // currentManagedUser: userProfile?.currentManagedUser || null,
    
    // // User information
    // isAdmin: userProfile?.isAdmin || false,
    // permissions: userProfile?.permissions || []
  }
}

export default usePermissions