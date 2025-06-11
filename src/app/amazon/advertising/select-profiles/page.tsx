'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ProfileSelector } from '@/components/amazon/ProfileSelector'
import { toast } from 'sonner'

interface Profile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  dailyBudget: number;
  timezone: string;
  accountInfo: {
    marketplaceStringId: string;
    id: string;
    type: string;
    name: string;
    validPaymentMethod: boolean;
  };
}

interface ProfilesResponse {
  profiles: Profile[];
}

export default function SelectAmazonProfiles() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  // Redirect if no session ID
  useEffect(() => {
    if (!sessionId) {
      router.push('/amazon/advertising/error?message=Invalid session')
    }
  }, [sessionId, router])

  // Fetch profiles using session ID
  const { data: profilesData, isLoading: isLoadingProfiles, error } = useQuery<ProfilesResponse, Error>({
    queryKey: ['amazon-profiles', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/amazon/advertising/profiles/data?session=${sessionId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch profiles')
      }
      return response.json()
    },
    enabled: !!sessionId
  })

  // Select profile mutation
  const { mutate: selectProfile, isPending: isSelectingProfile } = useMutation({
    mutationFn: async (profileId: string) => {
      const response = await fetch('/api/amazon/advertising/profiles/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profiles: [profileId] // Send as array with single profile
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to select profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Profile selected successfully');
      router.push('/amazon/advertising/success');
    },
    onError: (error: Error) => {
      toast.error(`Failed to select profile: ${error.message}`);
    }
  });

  useEffect(() => {
    if (error) {
      router.push(`/amazon/advertising/error?message=${encodeURIComponent(error.message)}`)
    }
  }, [error, router])

  if (!sessionId) return null

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Select Amazon Advertising Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose the advertising profile you want to use with PacePivot.
          </p>
        </div>

        {profilesData?.profiles && (
          <div className="mt-8">
            <ProfileSelector
              profiles={profilesData.profiles}
              onProfileSelect={(profileId) => selectProfile(profileId)}
              isLoading={isSelectingProfile}
            />
          </div>
        )}
      </div>
    </div>
  )
} 