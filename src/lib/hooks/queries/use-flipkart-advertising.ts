import { useMutation, useQuery, UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

type FlipkartAuthInitResponse = {
  authorization_url: string
  state: string
}

type FlipkartStatusResponse = {
  connected: boolean
  scopes?: string
  token_expires_at?: string
  refresh_token_expires_at?: string
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

export const useInitFlipkartAdvertising = (): UseMutationResult<FlipkartAuthInitResponse, Error, void> => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.get('/api/v1/fk/auth/init')
      return response.data
    },
  })
}