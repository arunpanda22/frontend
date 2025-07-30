import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';

export type Region = 'NA' | 'EU' | 'FE';

type ConnectSellerPayload = {
  userId: string;
  region: Region;
  marketplaceId: string;
};

type ConnectSellerResponse = {
  authorization_url: string;
  state: string;
};

/**
 * Hook to connect Amazon Seller account
 */
export const useConnectAmazonSeller = (): UseMutationResult<ConnectSellerResponse, Error, ConnectSellerPayload> => {
  return useMutation({
    mutationFn: async (payload: ConnectSellerPayload) => {
      const { userId, region, marketplaceId } = payload;
      
      // Direct call to Django backend
      const response = await apiClient.get('/api/v1/amazon/auth/init', {
        params: {
          user_id: userId,
          region,
          marketplace_id: marketplaceId
        }
      });
      
      return response.data;
    }
  });
}; 