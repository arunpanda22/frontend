// 'use client'

// import { ReactNode } from 'react'
// import { useAuth } from '@/lib/context/AuthContext'

// interface PermissionGuardProps {
//   /**
//    * The permission required to access the content
//    */
//   permission?: string
  
//   /**
//    * Array of permissions - user must have ANY ONE of these to access content
//    */
//   anyPermissions?: string[]
  
//   /**
//    * Array of permissions - user must have ALL of these to access content
//    */
//   allPermissions?: string[]
  
//   /**
//    * Content to display if the user has permission
//    */
//   children: ReactNode
  
//   /**
//    * Optional content to display if the user doesn't have permission
//    */
//   fallback?: ReactNode
// }

// /**
//  * Component that conditionally renders content based on user permissions
//  */
// export function PermissionGuard({
//   permission,
//   anyPermissions,
//   allPermissions,
//   children,
//   fallback
// }: PermissionGuardProps) {
//   const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()
  
//   // Determine if user has required permissions
//   const hasAccess = (
//     // Check single permission if provided
//     (permission && hasPermission(permission)) ||
//     // Check if user has any of the specified permissions
//     (anyPermissions && anyPermissions.length > 0 && hasAnyPermission(anyPermissions)) ||
//     // Check if user has all of the specified permissions
//     (allPermissions && allPermissions.length > 0 && hasAllPermissions(allPermissions))
//   )
  
//   // Only one permission check type should be used
//   const permissionCheckCount = [
//     !!permission,
//     !!(anyPermissions && anyPermissions.length > 0),
//     !!(allPermissions && allPermissions.length > 0)
//   ].filter(Boolean).length
  
//   // If no permission checks are specified, allow access
//   if (permissionCheckCount === 0) {
//     return <>{children}</>
//   }
  
//   // Render children if user has required permissions, otherwise render fallback
//   return hasAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null)
// }

// export default PermissionGuard