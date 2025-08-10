'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  anyRequiredPermissions?: string[]
  allRequiredPermissions?: string[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  anyRequiredPermissions,
  allRequiredPermissions,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // If not authenticated, redirect to login
    if (!user) {
      router.replace(redirectTo)
      return
    }

    // Check for required permissions if specified
    const hasRequiredPermission = requiredPermission ? hasPermission(requiredPermission) : true
    const hasAnyRequired = anyRequiredPermissions && anyRequiredPermissions.length > 0 
      ? hasAnyPermission(anyRequiredPermissions) 
      : true
    const hasAllRequired = allRequiredPermissions && allRequiredPermissions.length > 0 
      ? hasAllPermissions(allRequiredPermissions) 
      : true

    // If permission checks fail, redirect to access denied page
    if (!(hasRequiredPermission && hasAnyRequired && hasAllRequired)) {
      router.replace('/access-denied')
    }
  }, [
    user, 
    loading, 
    router, 
    redirectTo, 
    requiredPermission, 
    anyRequiredPermissions, 
    allRequiredPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  ])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400"></div>
      </div>
    )
  }

  // Only render children if user is authenticated (permission checks handled in the useEffect)
  return user ? <>{children}</> : null
} 