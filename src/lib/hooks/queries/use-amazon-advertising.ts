import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api/config';

// Get the backend URL from environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export type AdvertisingProfile = {
  profileId: string;
  profile_id?: string; // For compatibility
  countryCode?: string;
  currencyCode?: string;
  dailyBudget?: number;
  timezone?: string;
  accountInfo?: {
    marketplaceStringId?: string;
    id?: string;
    type?: string;
    name?: string;
  };
  profileName?: string;
  accountId?: string;
  status?: string;
};

type ConnectAmazonPayload = {
  userId: string;
  region?: string;
  scopes?: string;
};

type ConnectAmazonResponse = {
  authorization_url: string;
  state: string;
};

/**
 * Hook to fetch Amazon Advertising profiles
 */
export const useAmazonAdvertisingProfiles = (): UseQueryResult<AdvertisingProfile[], Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['amazon-advertising-profiles'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the user's ID token for authentication
      const idToken = await user.getIdToken();
      
      // Direct call to Django backend
      const response = await apiClient.get('/api/v1/amazon/advertising/profiles', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      return response.data;
    },
    enabled: !!user, // Enable if user is authenticated
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook to connect Amazon Advertising account
 */
export const useConnectAmazonAdvertising = (): UseMutationResult<ConnectAmazonResponse, Error, ConnectAmazonPayload> => {
  return useMutation({
    mutationFn: async (payload: ConnectAmazonPayload) => {
      const { userId, region = 'EU' } = payload;
      
      // Direct call to Django backend with properly encoded scope
      const response = await apiClient.get('/api/v1/amazon/advertising/auth/init', {
        params: {
          region,
          scopes: 'advertising::campaign_management',  // Use pre-encoded scope
          user_id: userId
        }
      });
      
      return response.data;
    }
  });
};

/**
 * Hook to select an Amazon Advertising profile
 */
export const useSelectAdvertisingProfile = (): UseMutationResult<any, Error, { profileId: string; region: string }> => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ profileId, region }: { profileId: string; region: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the user's ID token for authentication
      const idToken = await user.getIdToken();
      
      // Direct call to Django backend
      const response = await apiClient.post('/api/v1/amazon/advertising/profiles/select', 
        { profileId, region },
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      return response.data;
    }
  });
}; 