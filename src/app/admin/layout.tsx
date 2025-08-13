'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { userProfile, isAdmin } = useAuth()

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
    
    if (!userProfile) return false;
    
    // Check if user has admin or superadmin role
    const hasAdminAccess = isAdmin();
    
    console.log('🔐 Admin access check (PRODUCTION):', {
      userProfile,
      role: userProfile.rbac_context?.role_name,
      hasAdminAccess,
      isAdmin: hasAdminAccess
    });
    
    return hasAdminAccess;
  }, [userProfile, isAdmin])

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

