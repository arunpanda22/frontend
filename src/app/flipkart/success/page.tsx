'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import Link from 'next/link'

export default function FlipkartAdvertisingSuccess() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <Icons.success className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Flipkart Connected!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your Flipkart Advertising account has been successfully connected.
          </p>
        </div>

        <Button
          onClick={() => router.push('/flipkart')}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600"
        >
          Go to Flipkart Dashboard
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