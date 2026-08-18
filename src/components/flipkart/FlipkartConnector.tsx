'use client'

import { useState } from 'react'
import { AlertTriangle, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useFlipkartAdvertisingStatus,
  useInitFlipkartAdvertising,
} from '@/lib/hooks/queries/use-flipkart-advertising'

export function FlipkartConnector() {
  const [connectError, setConnectError] = useState<string | null>(null)
  const { data: status, isLoading: statusLoading } = useFlipkartAdvertisingStatus()
  const { mutate: initFlipkart, isPending: isConnecting } = useInitFlipkartAdvertising()

  const handleConnect = () => {
    setConnectError(null)
    initFlipkart(undefined, {
      onSuccess: (data) => {
        window.location.href = data.authorization_url
      },
      onError: (error) => {
        console.error('Error starting Flipkart Advertising connection:', error)
        setConnectError(`Failed to connect to Flipkart Advertising: ${error.message}`)
      },
    })
  }

  return (
    <div className="p-6 rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Flipkart Advertising</h3>
          <p className="text-gray-600 mb-4">
            Connect your Flipkart Advertising account to manage campaigns and track performance metrics.
          </p>

          {statusLoading ? (
            <Button disabled>Loading…</Button>
          ) : status?.connected ? (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full sm:w-auto flex items-center gap-2 bg-[#2874f0] hover:bg-[#1a56c7] text-white disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                  Connecting...
                </>
              ) : (
                'Connect with Flipkart'
              )}
            </Button>
          )}

          {connectError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm flex gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{connectError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}