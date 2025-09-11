'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
// import { useAvailableUsersForImpersonation } from '@/lib/hooks/queries/use-impersonation'

export default function ProfileDropdown() {
  const { 
    user, 
    userProfile,
    signOut,
    // startImpersonation,
    // endImpersonation,
    // isImpersonating,
  } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // // Check if user has impersonation permissions (temporarily disabled)
  // const hasImpersonationPermission = userProfile && (
  //   userProfile.isAdmin || 
  //   userProfile.isAgencyAdmin || 
  //   ['admin', 'superadmin', 'agency'].includes(userProfile.rbac_context?.role_name || '')
  // )
  
  // // Use React Query for available users (temporarily disabled)
  // const { 
  //   data: availableUsers = [], 
  //   isLoading: loadingUsers, 
  //   error: usersError 
  // } = useAvailableUsersForImpersonation(open && !!hasImpersonationPermission)

  // Debug logging for dropdown state
  console.log('🔍 Profile dropdown state:', { open })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

     if (!user) return null

   // Debug logging for user profile
   console.log('🔍 Profile dropdown user data:', {
     user: user?.email,
     userProfile: userProfile ? {
       id: userProfile.id,
       email: userProfile.email,
       role: userProfile.rbac_context?.role_name,
       isAdmin: userProfile.isAdmin,
       isAgencyAdmin: userProfile.isAgencyAdmin
     } : null
   })

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
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-white border border-gray-200 shadow-xl focus:outline-none z-50"
          >
           <div className="py-2">
             <button
               role="menuitem"
               onClick={() => navigateAndClose('/dashboard')}
               className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
             >
               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                 <span className="text-sm font-semibold text-blue-600">👤</span>
               </div>
               <span className="font-medium">Profile</span>
             </button>

             {/* Quick account switcher (temporarily disabled) */}
             <div className="border-t border-gray-100 my-2" />
             <button
               role="menuitem"
               onClick={async () => {
                 setOpen(false)
                 await signOut()
               }}
               className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
             >
               <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                 <span className="text-sm font-semibold text-red-600">🚪</span>
               </div>
               <span className="font-medium">Sign out</span>
             </button>
           </div>
         </div>
       )}
    </div>
  )
}

