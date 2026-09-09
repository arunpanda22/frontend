'use client'

import { useAuth } from '@/lib/context/AuthContext'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export function ImpersonationBanner() {
  const { userProfile, endImpersonation, isImpersonating } = useAuth()
  const [isEnding, setIsEnding] = useState(false)

  // Don't show banner if not impersonating
  if (!isImpersonating()) {
    return null
  }

  const handleEndImpersonation = async () => {
    try {
      setIsEnding(true)
      await endImpersonation()
    } catch (error) {
      console.error('Failed to end impersonation:', error)
    } finally {
      setIsEnding(false)
    }
  }

  const impersonatedUserName = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : userProfile?.email || 'Unknown User'

  const originalUserEmail = userProfile?.originalUser?.email || 'your account'

  return (
    <div className="sticky top-0 z-[9999] bg-yellow-500 text-black px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5 animate-pulse" />
          <span className="font-semibold">Impersonating:</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-bold">{impersonatedUserName}</span>
          <span className="text-sm opacity-80">({userProfile?.email})</span>
        </div>
      </div>

      <button
        onClick={handleEndImpersonation}
        disabled={isEnding}
        className="flex items-center gap-2 px-4 py-1.5 bg-black text-yellow-500 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isEnding ? (
          <>
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            <span>Ending...</span>
          </>
        ) : (
          <>
            <XMarkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Return to {originalUserEmail}</span>
            <span className="sm:hidden">Exit</span>
          </>
        )}
      </button>
    </div>
  )
}