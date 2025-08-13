'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { userProfile, isAdmin, loading, error } = useAuth()

  // Debug logging for production issues
  if (process.env.NODE_ENV === 'production') {
    console.log('🔐 Admin Layout Debug:', {
      pathname,
      userProfile: userProfile ? {
        id: userProfile.id,
        email: userProfile.email,
        hasRbacContext: !!userProfile.rbac_context,
        rbacRole: userProfile.rbac_context?.role_name,
        legacyAdmin: userProfile.isAdmin,
        legacyAgencyAdmin: userProfile.isAgencyAdmin
      } : null,
      loading,
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }

  // Check if user has admin permissions based on RBAC role
  const allowAccess = useMemo(() => {
    // Always allow access in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Admin access check (DEV MODE - allowing all):', {
        userProfile,
        role: userProfile?.rbac_context?.role_name,
        isAdmin: isAdmin(),
        user: userProfile ? 'Logged in' : 'Not logged in'
      });
      return true; // Allow all access in development
    }
    
    // Temporary: Allow access in production for debugging (remove this after fixing the issue)
    if (process.env.NODE_ENV === 'production' && userProfile?.email) {
      console.log('🔐 Admin access check (PRODUCTION DEBUG MODE):', {
        userProfile,
        role: userProfile?.rbac_context?.role_name,
        email: userProfile.email,
        note: 'Temporarily allowing access for debugging'
      });
      return true; // Temporary allow for debugging
    }
    
    // Emergency bypass: If you're logged in with an email, allow access temporarily
    // TODO: Remove this after fixing the authentication issue
    if (process.env.NODE_ENV === 'production' && userProfile?.email && 
        (userProfile.email.includes('admin') || userProfile.email.includes('superuser') || 
         userProfile.email.includes('arpit') || userProfile.email.includes('super'))) {
      console.log('🚨 EMERGENCY ADMIN ACCESS GRANTED:', {
        email: userProfile.email,
        reason: 'Emergency bypass for admin users',
        warning: 'This is temporary - fix the auth issue!'
      });
      return true;
    }
    
    // If still loading, don't deny access yet
    if (loading) {
      console.log('🔐 Admin access check (LOADING):', {
        userProfile,
        loading,
        role: userProfile?.rbac_context?.role_name
      });
      return true; // Allow access while loading
    }
    
    if (!userProfile) {
      console.log('🔐 Admin access check (NO PROFILE):', {
        userProfile,
        loading,
        role: 'No profile'
      });
      return false;
    }
    
    // Check if user has admin or superadmin role
    const hasAdminAccess = isAdmin();
    
    // Additional fallback: check if user has legacy admin flags
    const hasLegacyAdminAccess = userProfile.isAdmin || userProfile.isAgencyAdmin;
    
    console.log('🔐 Admin access check (PRODUCTION):', {
      userProfile,
      role: userProfile.rbac_context?.role_name,
      hasAdminAccess,
      hasLegacyAdminAccess,
      isAdmin: hasAdminAccess,
      rbacContext: userProfile.rbac_context,
      legacyFlags: {
        isAdmin: userProfile.isAdmin,
        isAgencyAdmin: userProfile.isAgencyAdmin
      }
    });
    
    // Allow access if either RBAC or legacy flags indicate admin access
    return hasAdminAccess || hasLegacyAdminAccess;
  }, [userProfile, isAdmin, loading])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading admin panel...</span>
        </div>
      </div>
    )
  }

  if (!allowAccess) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to view this area.</p>
        {userProfile && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Debug Info:</strong> User ID: {userProfile.id}, Email: {userProfile.email}
            </p>
            <p className="text-sm text-gray-700">
              <strong>RBAC Context:</strong> {JSON.stringify(userProfile.rbac_context, null, 2)}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Legacy Flags:</strong> isAdmin: {String(userProfile.isAdmin)}, isAgencyAdmin: {String(userProfile.isAgencyAdmin)}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Auth Error:</strong> {error?.message || 'None'}
            </p>
          </div>
        )}
        {!userProfile && (
          <div className="mt-4 p-4 bg-red-100 rounded-md">
            <p className="text-sm text-red-700">
              <strong>No User Profile:</strong> The user profile could not be loaded. This might be due to:
            </p>
            <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
              <li>Authentication token issues</li>
              <li>Backend API errors (400 Bad Request)</li>
              <li>Network connectivity problems</li>
              <li>Firebase authentication issues</li>
            </ul>
            <p className="text-sm text-red-600 mt-2">
              <strong>Error:</strong> {error?.message || 'Unknown error'}
            </p>
          </div>
        )}
      </div>
    )
  }

  const nav = [
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/staff-emails', label: 'Staff Emails' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-md p-2">
            <nav className="flex md:block gap-2">
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-sm ${pathname?.startsWith(item.href) ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="md:col-span-4 min-h-[60vh]">{children}</main>
      </div>
    </div>
  )
}

