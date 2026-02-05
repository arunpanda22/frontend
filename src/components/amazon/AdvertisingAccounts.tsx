'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Badge } from '../ui/badge'
import { AlertCircle, Check, Globe2, Store, Tag, Info, Building2, Clock, DollarSign } from 'lucide-react'
import { useUserProfile, ConnectedAdvertisingProfile, type UserProfile } from '@/lib/hooks/queries/use-user-profile'
import { ScrollArea } from "@/components/ui/scroll-area"
import * as Tooltip from '@radix-ui/react-tooltip'
import { TargetAcosEditor } from './TargetAcosEditor'

interface AdvertisingAccountsProps {
  userProfile?: UserProfile | null
  onRefresh?: () => Promise<void> | void
}

export function AdvertisingAccounts({ userProfile: userProfileProp, onRefresh }: AdvertisingAccountsProps) {
  // If parent provides profile, avoid internal fetching
  const shouldFetchInternally = !userProfileProp
  const { data: userProfileQueryData, isLoading, error, isError, refetch } = useUserProfile({ enabled: shouldFetchInternally })
  const userProfile = userProfileProp ?? userProfileQueryData
  const [isRefetching, setIsRefetching] = useState(false)
  
  const handleRefresh = async () => {
    setIsRefetching(true)
    try {
      if (onRefresh) {
        await onRefresh()
      } else if (shouldFetchInternally) {
        await refetch()
      }
    } finally {
      setIsRefetching(false)
    }
  }
  
  const connectedProfiles = userProfile?.connected_advertising_profiles || []
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium text-gray-800">Connected Accounts</h3>
        {connectedProfiles.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={(shouldFetchInternally ? isLoading : false) || isRefetching}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>
      
      {(shouldFetchInternally && isLoading) ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        </div>
      ) : (shouldFetchInternally && isError) ? (
        <div className="p-4 rounded-md bg-red-50 text-red-800 flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to load connected accounts</p>
            <p className="text-sm">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      ) : connectedProfiles.length > 0 ? (
        <ScrollArea className="h-auto max-h-[500px]">
          <div className="space-y-3 pr-4">
            <Tooltip.Provider delayDuration={300}>
              {connectedProfiles.map((profile) => (
                <div
                  key={profile.profile_id}
                  className="flex items-start space-x-4 rounded-lg border p-4 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {profile.account_name}
                            </p>
                            {profile.valid_payment_method && (
                              <Badge variant="success" className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Valid Payment
                              </Badge>
                            )}
                            {profile.is_active && (
                              <Badge variant="success" className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button className="inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-500">
                                  <Info className="h-4 w-4" />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  className="max-w-xs rounded-md bg-white px-4 py-3 shadow-lg border border-gray-200"
                                  sideOffset={5}
                                >
                                  <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Profile ID:</span> {profile.profile_id}</p>
                                    <p><span className="font-medium">Marketplace:</span> {profile.marketplace_id}</p>
                                    <p><span className="font-medium">Type:</span> {profile.account_type}</p>
                                    <p><span className="font-medium">Subtype:</span> {profile.account_subtype}</p>
                                    <p><span className="font-medium">Country:</span> {profile.country_code}</p>
                                    <p><span className="font-medium">Currency:</span> {profile.currency_code}</p>
                                    <p><span className="font-medium">Target ACOS:</span> {profile.target_acos}</p>
                                    <p><span className="font-medium">Timezone:</span> {profile.timezone}</p>
                                    <p><span className="font-medium">Last Synced:</span> {new Date(profile.last_synced_at).toLocaleString()}</p>
                                  </div>
                                  <Tooltip.Arrow className="fill-white" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5" />
                              {profile.profile_id}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Store className="h-3.5 w-3.5" />
                              {profile.marketplace_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Target ACOS:</span>
                          <TargetAcosEditor targetAcos={profile.target_acos} />
                        </div>

                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Region:</span>{' '}
                          {profile.region}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(profile.created_at).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Currency:</span>{' '}
                          {profile.currency_code}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Tooltip.Provider>
          </div>
        </ScrollArea>
      ) : (
        <div className="p-4 rounded-md bg-gray-50 border border-gray-200 text-gray-600 text-center">
          <p className="mb-2">No advertising accounts connected yet</p>
          <p className="text-sm">Connect your Amazon Advertising account to manage campaigns and view performance metrics.</p>
        </div>
      )}
    </div>
  )
}
 