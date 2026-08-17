import { useMutation, useQuery, UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

type ConnectFlipkartResponse = {
  success: boolean
  connected: boolean
  created: boolean
  scopes: string
}

type FlipkartStatusResponse = {
  connected: boolean
  scopes?: string
  token_expires_at?: string
  refresh_token_expires_at?: string
}

export const useFlipkartAuthConfig = (): UseQueryResult<{ client_id: string; redirect_uri: string }, Error> => {
  return useQuery({
    queryKey: ['flipkart-auth-config'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/fk/auth/config')
      return response.data
    },
    staleTime: Infinity, // this never changes at runtime
  })
}

export const useFlipkartAdvertisingStatus = (): UseQueryResult<FlipkartStatusResponse, Error> => {
  return useQuery({
    queryKey: ['flipkart-advertising-status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/fk/advertising/status')
      return response.data
    },
  })
}

export const useConnectFlipkartAdvertising = (): UseMutationResult<ConnectFlipkartResponse, Error, { code: string }> => {
  return useMutation({
    mutationFn: async ({ code }) => {
      const response = await apiClient.post('/api/v1/fk/advertising/connect', { code })
      return response.data
    },
  })
}