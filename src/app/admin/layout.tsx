'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { userProfile, hasPermission } = useAuth()

  // Check if user has admin permissions or is superuser
  const allowAccess = useMemo(() => {
    // Always allow access in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Admin access check (DEV MODE - allowing all):', {
        userProfile,
        permissions: userProfile?.permissions,
        isAdmin: userProfile?.isAdmin,
        user: userProfile ? 'Logged in' : 'Not logged in'
      });
      return true; // Allow all access in development
    }
    
    if (!userProfile) return false;
    
    // Allow admins/superadmins automatically
    if (userProfile.isAdmin) return true;
    
    // Check for admin-related permissions
    const adminPermissions = [
      'view_users',
      'manage_users', 
      'view_rbac_admin',
      'rbac.view_user',
      'rbac.view_role',
      'rbac.view_permission',
      'rbac.view_agency'
    ];
    
    const hasAdminAccess = adminPermissions.some(perm => hasPermission(perm));
    
    console.log('🔐 Admin access check (PRODUCTION):', {
      userProfile,
      permissions: userProfile.permissions,
      hasAdminAccess,
      isAdmin: userProfile.isAdmin
    });
    
    return hasAdminAccess;
  }, [userProfile, hasPermission])

  if (!allowAccess) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to view this area.</p>
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

