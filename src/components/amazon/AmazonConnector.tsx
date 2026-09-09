'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useConnectAmazonAdvertising } from '@/lib/hooks/queries/use-amazon-advertising'
import { AdvertisingAccounts } from './AdvertisingAccounts'
import { AccountRegionDialog } from './AccountRegionDialog'
import { AlertTriangle, ArrowRight, ShoppingCart, UserCog } from 'lucide-react'
import { Icons } from '../icons'
import { SellerAccounts } from './SellerAccounts'
import type { UserProfile } from '@/lib/hooks/queries/use-user-profile'

interface AmazonConnectorProps {
  userProfile?: UserProfile | null
  onRefresh?: () => Promise<void> | void
}

export function AmazonConnector({ userProfile, onRefresh }: AmazonConnectorProps) {
  const { user, isImpersonating } = useAuth()
  const [connectError, setConnectError] = useState<string | null>(null)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)

  const impersonating = isImpersonating()

  const { 
    mutate: connectAmazonAdvertising, 
    isPending: isConnectingAdvertising 
  } = useConnectAmazonAdvertising()

  const handleConnectAmazonAdvertising = () => {
    if (!user || impersonating) return
    setConnectError(null)
    
    connectAmazonAdvertising(
      { 
        userId: user.uid,
        scopes: 'advertising::campaign_management'
      },
      {
        onSuccess: (data) => {
          window.location.href = data.authorization_url
        },
        onError: (error) => {
          console.error('Error connecting to Amazon Advertising:', error)
          setConnectError(`Failed to connect to Amazon Advertising: ${error.message}`)
        }
      }
    )
  }

  const handleConnectSellerOrVendor = () => {
    if (impersonating) return
    setIsAccountDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      {impersonating && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-100 text-amber-900 text-sm flex items-center gap-2">
          <UserCog className="h-4 w-4 flex-shrink-0" />
          <span>You&apos;re viewing this account as an impersonated user. Connecting new Amazon accounts is disabled.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amazon Advertising Connection */}
        <div className="p-6 rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Icons.amazonAds className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Amazon Advertising</h3>
              <p className="text-gray-600 mb-4">Connect your Amazon Advertising account to manage campaigns and track performance metrics.</p>
              
              <Button 
                onClick={handleConnectAmazonAdvertising}
                disabled={isConnectingAdvertising || impersonating}
                title={impersonating ? 'Disabled while impersonating a seller' : undefined}
                className="w-full sm:w-auto flex items-center gap-2 bg-amazon hover:bg-amazon/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnectingAdvertising ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Amazon Advertising
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {connectError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm flex gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{connectError}</span>
            </div>
          )}
          
          <div className="mt-6">
            <AdvertisingAccounts userProfile={userProfile} onRefresh={onRefresh} />
          </div>
        </div>
        
        {/* Amazon Seller & Vendor Connection */}
        <div className="p-6 rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Amazon Seller & Vendor</h3>
              <p className="text-gray-600 mb-4">Connect your Amazon Seller or Vendor account to manage inventory, sales, and business data.</p>
              
              <Button 
                onClick={handleConnectSellerOrVendor}
                disabled={impersonating}
                title={impersonating ? 'Disabled while impersonating a seller' : undefined}
                className="w-full sm:w-auto flex items-center gap-2 bg-amazon hover:bg-amazon/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="mt-6">
                <SellerAccounts userProfile={userProfile} onRefresh={onRefresh} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AccountRegionDialog 
        isOpen={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
      />
    </div>
  )
}