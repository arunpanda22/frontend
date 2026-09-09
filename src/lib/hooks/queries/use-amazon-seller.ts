import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';

export type Region = 'NA' | 'EU' | 'FE';
export type AccountType = 'seller' | 'vendor';

type ConnectAccountPayload = {
  userId: string;
  region: Region;
  marketplaceId: string;
  accountType: AccountType;
};

type ConnectAccountResponse = {
  authorization_url: string;
  state: string;
};

/**
 * Unified hook to connect Amazon Seller or Vendor account
 */
export const useConnectAmazonAccount = (): UseMutationResult<ConnectAccountResponse, Error, ConnectAccountPayload> => {
  return useMutation({
    mutationFn: async (payload: ConnectAccountPayload) => {
      const { userId, region, marketplaceId, accountType } = payload;
      
      // Determine the endpoint based on account type
      const endpoint = accountType === 'vendor' 
        ? '/api/v1/amazon/vendor/auth/' 
        : '/api/v1/amazon/auth/init';
      
      const response = await apiClient.get(endpoint, {
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