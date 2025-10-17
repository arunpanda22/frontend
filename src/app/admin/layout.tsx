'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { userProfile, isAdmin, loading, error } = useAuth()

  // Check if user has admin access (admin or super_admin roles)
  const allowAccess = useMemo(() => {
    if (loading) return true // Allow while loading
    if (!userProfile) return false
    
    // Check RBAC role
    const hasAdminRole = isAdmin()
    
    return hasAdminRole 
  }, [userProfile, isAdmin, loading])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading admin panel...</span>
        </div>
      </div>
    )
  }

  if (!allowAccess) {
    return (
      <div className="max-w-7xl mx-auto px-3 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-red-900 mb-2">Access Denied</h1>
          <p className="text-red-700 mb-4">You don't have permission to access the admin panel.</p>
          
          <div className="bg-white border border-red-200 rounded p-4 text-sm">
            <p className="font-medium text-gray-900 mb-2">Required Access:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Super Admin role (full system access)</li>
              <li>Admin role (manage users and agencies)</li>
            </ul>
            
            {userProfile && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-medium text-gray-900 mb-2">Your Current Role:</p>
                <p className="text-gray-700">
                  {userProfile.rbac_context?.role_name || 'No role assigned'}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <Link 
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { 
      href: '/admin/users', 
      label: 'Users',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      href: '/admin/reports', 
      label: 'Reports',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      href: '/admin/roles', 
      label: 'Roles',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      href: '/admin/permissions', 
      label: 'Permissions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      href: '/admin/staff-emails', 
      label: 'Staff Emails',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      href: '/admin/notifications', 
      label: 'Manage Notifications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ]

  const currentRole = userProfile?.rbac_context?.role_name || 'Unknown'
  const currentAgency = userProfile?.rbac_context?.agency_name

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-3 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  currentRole === 'super_admin' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {currentRole}
                </span>
                {currentAgency && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-600">{currentAgency}</span>
                  </>
                )}
              </div>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to App
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation - Reduced from span-5 to span-2 */}
          <aside className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-2">
              <nav className="space-y-1">
                {navigationItems.map(item => {
                  const isActive = pathname?.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-gray-500'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Quick Info */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-blue-900 mb-2">RBAC System</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• 5 fixed roles</p>
                <p>• Simple hierarchy</p>
                <p>• Permission overrides</p>
                <p>• Agency-based access</p>
              </div>
            </div>
          </aside>

          {/* Main Content - Increased from span-4 to span-10 */}
          <main className="lg:col-span-10 min-h-[70vh]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}