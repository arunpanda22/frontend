'use client'

// User Switching/Impersonation is temporarily disabled.
// Original implementation has been removed from runtime to prevent accidental usage.
// You can restore it from version control when needed.

export default function UserSwitchingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h1 className="text-xl font-semibold text-yellow-800 mb-2">User Switching is temporarily disabled</h1>
          <p className="text-sm text-yellow-700">
            This feature has been disabled for now. It will be re-enabled in the future.
          </p>
        </div>
      </div>
    </div>
  )
}

