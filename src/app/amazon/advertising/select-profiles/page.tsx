'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/config'
import { ProfileSelector } from '@/components/amazon/ProfileSelector'

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
  const { user } = useAuth()
  const sessionId = searchParams.get('session')
  const [error, setError] = useState<Error | null>(null)

  // Redirect if no session ID
  useEffect(() => {
    if (!sessionId) {
      router.push('/amazon/advertising/error?message=Invalid or missing session ID')
    }
  }, [sessionId, router])

  // Fetch profiles query
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['amazon-advertising-profiles', sessionId],
    queryFn: async () => {
      if (!user || !sessionId) {
        throw new Error('Missing required parameters');
      }

      const token = await user.getIdToken();
      const response = await apiClient.get('/api/v1/amazon/advertising/profiles/data', {
        params: { session: sessionId },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.profiles) {
        throw new Error('No profiles found in response');
      }

      return response.data;
    },
    enabled: !!user && !!sessionId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Select profile mutation
  const { mutate: selectProfile, isPending: isSelectingProfile } = useMutation({
    mutationFn: async (profileId: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const response = await apiClient.post('/api/v1/amazon/advertising/profiles/select', 
        {
          profileId: String(profileId),  // Ensure profileId is a string
          region: 'EU'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile selected successfully');
      router.push('/amazon/advertising/success');
    },
    onError: (error: Error) => {
      toast.error(`Failed to select profile: ${error.message}`);
      setError(error);
    }
  });

  useEffect(() => {
    if (error) {
      router.push(`/amazon/advertising/error?message=${encodeURIComponent(error.message)}`)
    }
  }, [error, router])

  if (!sessionId) {
    return null;
  }

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

        {profiles?.profiles && (
          <div className="mt-8">
            <ProfileSelector
              profiles={profiles.profiles}
              onProfileSelect={(profileId) => selectProfile(profileId)}
              isLoading={isSelectingProfile}
            />
          </div>
        )}
      </div>
    </div>
  )
} 