import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api/config';
import { CurrencyData } from '@/lib/api/types';

/**
 * Hook to fetch user marketplace currencies using React Query
 * 
 * Caching Strategy:
 * - Currency data is cached for 10 minutes since it changes infrequently
 * - Cache is kept in memory for 15 minutes before garbage collection
 * - Refetches on window focus to ensure currency rates are current
 * - Background refetch every 15 minutes to keep data fresh
 */
export const useMarketplaceCurrencies = (options?: { 
  enabled?: boolean;
  defaultMarketplace?: string;
}): UseQueryResult<CurrencyData, Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marketplace-currencies'],
    queryFn: async (): Promise<CurrencyData> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        const response = await apiClient.get('/api/v1/dashboard-api/marketplace-currencies/');
        return response.data;
      } catch (error: any) {
        console.error('Currency service error:', error);
        throw new Error(`Failed to fetch currencies: ${error.response?.data?.message || error.message}`);
      }
    },
    enabled: (options?.enabled ?? true) && !!user,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Cache currency data for 10 minutes since it doesn't change very often
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus (currency rates might change)
    refetchInterval: 15 * 60 * 1000, // Background refetch every 15 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });
};