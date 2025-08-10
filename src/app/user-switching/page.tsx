'use client'

import ManagedUserSwitcher from '@/components/auth/ManagedUserSwitcher'

export default function UserSwitchingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">User Switching</h1>
      <p className="text-gray-600 mb-6">Impersonate a user assigned to your agency role. End impersonation to return.</p>
      <ManagedUserSwitcher />
    </div>
  )
}

