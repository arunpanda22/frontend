'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function FlipkartAdvertisingError() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Something went wrong while connecting to Flipkart.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Connection Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <Button
          onClick={() => router.push('/flipkart')}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600"
        >
          Try Again
        </Button>

        <div className="text-center text-sm text-gray-500">
          <Link href="/support" className="text-indigo-600 hover:text-indigo-700 hover:underline">
            Need help with your connection?
          </Link>
        </div>
      </div>
    </div>
  )
}