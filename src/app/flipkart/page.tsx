'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { FlipkartConnector } from '@/components/flipkart/FlipkartConnector'
import { useUserProfile } from '@/lib/hooks/queries/use-user-profile'

export default function FlipkartPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { isLoading: profileLoading, refetch: refetchProfile } = useUserProfile()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Flipkart Advertising</h1>
          <p className="text-gray-600 mb-8">
            Connect your Flipkart Advertising account to start managing campaigns from here.
          </p>

          <FlipkartConnector />
        </div>
      </div>
    </div>
  )
}