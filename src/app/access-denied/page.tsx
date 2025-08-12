'use client'

import { useRouter } from 'next/navigation'

export default function AccessDenied() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          
          <p className="text-gray-700 mb-8">
            You don't have permission to access this resource.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/newdashboard')}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}