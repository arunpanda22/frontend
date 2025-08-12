'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { apiClient } from '@/lib/api/config'

export default function ProfileDropdown() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { 
    isAgencyAdmin,
    isActingAsManagedUser,
    switchToManagedUser,
    resetToAdminUser
  } = usePermissions()

  type AvailableUser = {
    id: number
    email: string
    username?: string
    first_name?: string
    last_name?: string
    role?: string
  }
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load switchable users when menu opens (only for agency admins)
  useEffect(() => {
    const loadUsers = async () => {
      if (!open) return
      if (!isAgencyAdmin()) return
      setLoadingUsers(true)
      try {
        const res = await apiClient.get('/api/v1/auth/switch-to-user/')
        setAvailableUsers(res.data || [])
      } catch (e) {
        setAvailableUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [open, isAgencyAdmin])

  if (!user) return null

  const displayName = user.displayName || user.email || 'User'
  const initials = (displayName || '?')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const navigateAndClose = (href: string) => {
    setOpen(false)
    if (href !== pathname) router.push(href)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-800 text-gray-200"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-black text-sm font-bold">
          {initials}
        </span>
        <span className="hidden sm:block text-sm max-w-[160px] truncate">{displayName}</span>
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.22 3.817a.75.75 0 01-1.02 0L5.25 8.33a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-gray-900 border border-gray-700 shadow-lg focus:outline-none z-50"
        >
          <div className="py-1">
            <button
              role="menuitem"
              onClick={() => navigateAndClose('/newdashboard')}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              Profile
            </button>

            {/* Quick account switcher */}
            {isAgencyAdmin() && (
              <div className="py-1">
                {isActingAsManagedUser() ? (
                  <button
                    role="menuitem"
                    onClick={async () => {
                      await resetToAdminUser()
                      setOpen(false)
                      if (pathname !== '/newdashboard') router.push('/newdashboard')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-300 hover:bg-gray-800 hover:text-blue-200"
                  >
                    End Impersonation
                  </button>
                ) : (
                  <>
                    <div className="px-4 pt-2 pb-1 text-xs uppercase tracking-wider text-gray-400">Switch account</div>
                    <div className="max-h-60 overflow-y-auto">
                      {loadingUsers && (
                        <div className="px-4 py-2 text-sm text-gray-400">Loading...</div>
                      )}
                      {!loadingUsers && availableUsers.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-400">No switchable users</div>
                      )}
                      {availableUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={async () => {
                            await switchToManagedUser(String(u.id))
                            setOpen(false)
                            if (pathname !== '/newdashboard') router.push('/newdashboard')
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 flex items-center gap-2"
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-gray-200 text-xs">
                            {(u.first_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </span>
                          <span className="flex-1 truncate">{u.first_name} {u.last_name} ({u.email})</span>
                        </button>
                      ))}
                    </div>
                    <button
                      role="menuitem"
                      onClick={() => navigateAndClose('/user-switching')}
                      className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-gray-800"
                    >
                      Manage accounts
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="my-1 border-t border-gray-700" />
            <button
              role="menuitem"
              onClick={async () => {
                setOpen(false)
                await signOut()
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

