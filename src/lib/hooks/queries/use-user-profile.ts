import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api/config';

export interface ConnectedAdvertisingProfile {
  profile_id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  country_code: string;
  currency_code: string;
  timezone: string;
  marketplace_id: string;
  region: string;
  valid_payment_method: boolean;
  is_active: boolean;
  created_at: string;
  last_synced_at: string;
}

export interface ConnectedSellerAccount {
  seller_id: string;
  marketplace_id: string;
  region: string;
  is_active: boolean;
  created_at: string;
  last_refreshed_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firebase_uid: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  connected_advertising_profiles: ConnectedAdvertisingProfile[];
  connected_seller_accounts: ConnectedSellerAccount[];
}

export const useUserProfile = (): UseQueryResult<UserProfile, Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Token will be added automatically by axios interceptor
      const response = await apiClient.get('/api/v1/auth/profile/');
      
      return response.data;
    },
    enabled: !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 