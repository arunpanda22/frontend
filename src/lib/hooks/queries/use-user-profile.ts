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

export interface RBACContext {
  role_id: number;
  role_name: 'superadmin' | 'admin' | 'agency' | 'user';
  agency_id: number;
  agency_name: string;
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
  rbac_context: RBACContext;
  connected_advertising_profiles: ConnectedAdvertisingProfile[];
  connected_seller_accounts: ConnectedSellerAccount[];
}

/**
 * Hook to fetch user profile with RBAC context
 * 
 * Caching Strategy:
 * - Profile data is cached for 5 minutes since roles/permissions don't change frequently
 * - Cache is kept in memory for 10 minutes before garbage collection
 * - No automatic refetch on window focus or component mount to reduce API calls
 * - Use invalidateProfileCache() from AuthContext to manually refresh when needed
 */
export const useUserProfile = (options?: { enabled?: boolean }): UseQueryResult<UserProfile, Error> => {
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
    enabled: (options?.enabled ?? true) && !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Cache profile data for 5 minutes since roles/permissions don't change often
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data is fresh
  });
}; 