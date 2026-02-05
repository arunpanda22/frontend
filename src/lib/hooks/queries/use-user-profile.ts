import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api/config';

export interface ConnectedAdvertisingProfile {
  profile_id: string;
  account_name: string;
  account_type: string;
  target_acos: string;
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

export interface ConnectedVendorAccount {
  vendor_code: string;
  marketplace_id: string;
  region: string;
  is_active: boolean;
  created_at: string;
  last_refreshed_at: string;
}

export interface RBACContext {
  role_id: number;
  role_name: 'super_admin' | 'admin' | 'agency' | 'seller' | 'user';
  role_display: string;
  hierarchy_level: number;

  // Agency role context
  agency_id?: number;
  agency_name?: string;
  agency_slug?: string;
  
  // Admin role context
  managed_agencies?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  managed_agency_ids?: number[];
  
  // User role context
  parent_seller_id?: number;
  parent_seller_email?: string;
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
  current_role_name: string | null;
  current_role_display: string | null;
  current_agency: {
    id: number;
    name: string;
    slug: string;
  } | null;
  rbac_context: RBACContext;
  connected_advertising_profiles: ConnectedAdvertisingProfile[];
  connected_seller_accounts: ConnectedSellerAccount[];
  connected_vendor_accounts: ConnectedVendorAccount[];
}

/**
 * Hook to fetch user profile with RBAC context
 * 
 * Caching Strategy:
 * - Profile data is cached for 30 minutes since roles/permissions/accounts don't change frequently
 * - Cache is kept in memory for 1 hour before garbage collection
 * - No automatic refetch on window focus or component mount to reduce API calls
 * - Use invalidateProfileCache() from AuthContext to manually refresh when account connections change
 */
export const useUserProfile = (options?: { enabled?: boolean }): UseQueryResult<UserProfile, Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.get('/api/v1/auth/profile/');
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Extended cache times - profile data rarely changes
    staleTime: 30 * 60 * 1000, // 30 minutes - data considered fresh
    gcTime: 60 * 60 * 1000, // 1 hour - keep in memory
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

/**
 * Helper hook to check if user has a connected vendor account
 * Uses the cached user profile data
 */
export const useHasVendorAccount = (): {
  hasVendorAccount: boolean;
  isLoading: boolean;
  vendorAccounts: ConnectedVendorAccount[];
} => {
  const { data: userProfile, isLoading } = useUserProfile();

  return {
    hasVendorAccount: (userProfile?.connected_vendor_accounts?.length ?? 0) > 0,
    isLoading,
    vendorAccounts: userProfile?.connected_vendor_accounts ?? [],
  };
};

/**
 * Helper hook to check if user has a connected seller account
 */
export const useHasSellerAccount = (): {
  hasSellerAccount: boolean;
  isLoading: boolean;
  sellerAccounts: ConnectedSellerAccount[];
} => {
  const { data: userProfile, isLoading } = useUserProfile();

  return {
    hasSellerAccount: (userProfile?.connected_seller_accounts?.length ?? 0) > 0,
    isLoading,
    sellerAccounts: userProfile?.connected_seller_accounts ?? [],
  };
};