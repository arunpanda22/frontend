'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useAvailableUsersForImpersonation } from '@/lib/hooks/queries/use-impersonation'
import { ArrowPathIcon, MagnifyingGlassIcon, UserCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'

export default function ProfileDropdown() {
  const { 
    user, 
    userProfile,
    signOut,
    switchToSeller,
    endImpersonation,
    isImpersonating,
    canImpersonateSellers,
  } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSwitching, setIsSwitching] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [switchingId, setSwitchingId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Check impersonation status
  const impersonating = isImpersonating()
  const originalUser = userProfile?.originalUser
  
  // Check if user has impersonation permissions
  const hasImpersonationPermission = canImpersonateSellers()
  
  // Fetch available sellers for impersonation
  const { 
    data: availableSellers = [], 
    isLoading: loadingUsers, 
    error: usersError 
  } = useAvailableUsersForImpersonation(open && hasImpersonationPermission)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const displayName = userProfile?.first_name || userProfile?.username
  const initials = (displayName || '?')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const navigateAndClose = (href: string) => {
    setOpen(false)
    setSearchQuery('')
    if (href !== pathname) router.push(href)
  }

  const handleSwitchToSeller = async (sellerId: number) => {
    if (isSwitching) return
    
    try {
      setIsSwitching(true)
      setSwitchingId(sellerId)
      await switchToSeller(sellerId)
      setSearchQuery('')
      setOpen(false)
      router.push('/maindashboard') 
    } catch (error) {
      console.error('Failed to switch to seller:', error)
      alert('Failed to switch to seller. Please try again.')
    } finally {
      setIsSwitching(false)
      setSwitchingId(null)
    }
  }

  const handleEndImpersonation = async () => {
    if (isEnding) return
    
    try {
      setIsEnding(true)
      await endImpersonation()
      setOpen(false)
      setSearchQuery('')
    } catch (error) {
      console.error('Failed to end impersonation:', error)
      alert('Failed to return to original user. Please try again.')
    } finally {
      setIsEnding(false)
    }
  }

  // Filter sellers based on search query
  const filteredSellers = availableSellers.filter(seller => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      seller.email.toLowerCase().includes(query) ||
      seller.display_name.toLowerCase().includes(query) ||
      seller.username.toLowerCase().includes(query) ||
      (seller.agency_name && seller.agency_name.toLowerCase().includes(query))
    )
  })

  const currentSellerId = userProfile?.id

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
          impersonating 
            ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30' 
            : 'hover:bg-gray-800 text-gray-200'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
          impersonating ? 'bg-yellow-500 text-black' : 'bg-yellow-500 text-black'
        }`}>
          {initials}
        </span>
        <span className="hidden sm:block text-sm max-w-[160px] truncate">{displayName}</span>
        {impersonating && (
          <span className="hidden sm:block text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-semibold">
            Viewing
          </span>
        )}
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.22 3.817a.75.75 0 01-1.02 0L5.25 8.33a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-96 origin-top-right rounded-lg bg-white border border-gray-200 shadow-xl focus:outline-none z-50"
        >
          <div className="py-2">
            {/* Profile Section */}
            <button
              role="menuitem"
              onClick={() => navigateAndClose('/dashboard')}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium">Profile</span>
                <span className="text-xs text-gray-500 truncate">{userProfile?.email}</span>
                {impersonating && originalUser && (
                  <span className="text-xs text-yellow-600 font-medium mt-0.5">
                    Original: {originalUser.email}
                  </span>
                )}
              </div>
            </button>

            {/* End Impersonation Button - Show when impersonating */}
            {impersonating && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <button
                  role="menuitem"
                  onClick={handleEndImpersonation}
                  disabled={isEnding}
                  className="w-full text-left px-4 py-3 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    {isEnding ? (
                      <ArrowPathIcon className="w-5 h-5 text-yellow-600 animate-spin" />
                    ) : (
                      <ArrowUturnLeftIcon className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {isEnding ? 'Returning...' : 'Return to Original User'}
                    </span>
                    {originalUser && (
                      <span className="text-xs text-gray-500 truncate max-w-[250px]">
                        {originalUser.email}
                      </span>
                    )}
                  </div>
                </button>
              </>
            )}

            {/* Impersonation Section - Only show if user has permission */}
            {hasImpersonationPermission && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>{impersonating ? 'Switch to Another Seller' : 'Switch Account'}</span>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-2">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sellers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  {/* Sellers List */}
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
                    </div>
                  ) : usersError ? (
                    <div className="text-center py-4 text-sm text-red-600">
                      Failed to load sellers
                    </div>
                  ) : filteredSellers.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      {searchQuery ? 'No sellers found' : 'No sellers available'}
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                      {filteredSellers.map((seller) => {
                        const isCurrent = seller.id === currentSellerId
                        const isSwitchingThis = switchingId === seller.id
                        return (
                          <button
                            key={seller.id}
                            onClick={() => !isCurrent && handleSwitchToSeller(seller.id)}
                            disabled={isSwitching || isCurrent || isEnding}
                            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all ${
                              isCurrent
                                ? 'bg-yellow-50 border border-yellow-300 cursor-default'
                                : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                            } ${(isSwitching || isEnding) && !isSwitchingThis ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isCurrent ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {seller.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">
                                    {seller.display_name}
                                  </p>
                                  {isCurrent && (
                                    <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{seller.email}</p>
                                {seller.agency_name && (
                                  <p className="text-xs text-gray-400 truncate">
                                    Agency: {seller.agency_name}
                                  </p>
                                )}
                              </div>
                              {isSwitchingThis && (
                                <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sign Out */}
            <div className="border-t border-gray-100 my-2" />
            <button
              role="menuitem"
              onClick={async () => {
                setOpen(false)
                await signOut()
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
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