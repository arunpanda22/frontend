'use client'

import { useUserProfile, type ConnectedSellerAccount, type ConnectedVendorAccount, type UserProfile } from '@/lib/hooks/queries/use-user-profile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface SellerAccountsProps {
  userProfile?: UserProfile | null
  onRefresh?: () => Promise<void> | void
}

export function SellerAccounts({ userProfile: userProfileProp, onRefresh }: SellerAccountsProps) {
  const shouldFetchInternally = !userProfileProp
  const { data: userProfileQueryData, isLoading, error, refetch } = useUserProfile({ enabled: shouldFetchInternally })
  const userProfile = userProfileProp ?? userProfileQueryData
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (onRefresh) {
        await onRefresh()
      } else if (shouldFetchInternally) {
        await refetch()
      }
    } finally {
      setIsRefreshing(false)
    }
  }
  
  const connectedSellerAccounts = userProfile?.connected_seller_accounts || []
  const connectedVendorAccounts = userProfile?.connected_vendor_accounts || []
  
  if (shouldFetchInternally && isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (shouldFetchInternally && error) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-800 mt-4">
        <p>Error loading accounts: {error.message}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    )
  }
  
  if (connectedSellerAccounts.length === 0 && connectedVendorAccounts.length === 0) {
    return null
  }
  
  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Connected Accounts</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-gray-500 hover:bg-transparent hover:text-gray-700"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {connectedSellerAccounts.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Seller Accounts</h5>
          <div className="grid gap-4">
            {connectedSellerAccounts.map((account: ConnectedSellerAccount, index: number) => (
              <div key={`seller-${index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{account.seller_id}</span>
                      <Badge 
                        variant={account.is_active ? 'success' : 'outline'}
                        className="text-xs"
                      >
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <span>Region: {account.region}</span>
                      <span className="mx-2">•</span>
                      <span>Connected: {new Date(account.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {connectedVendorAccounts.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Vendor Accounts</h5>
          <div className="grid gap-4">
            {connectedVendorAccounts.map((account: ConnectedVendorAccount, index: number) => (
              <div key={`vendor-${index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{account.vendor_code}</span>
                      <Badge 
                        variant={account.is_active ? 'success' : 'outline'}
                        className="text-xs"
                      >
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <span>Region: {account.region}</span>
                      <span className="mx-2">•</span>
                      <span>Connected: {new Date(account.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}