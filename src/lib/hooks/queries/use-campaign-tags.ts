import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

export interface CampaignTagRow {
  campaign_name: string
  tag: string
}

export function useCampaignTags() {
  return useQuery({
    queryKey: ['campaign-tags'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/user-config/campaign-tags/')
      return data
    },
  })
}

export function useCreateCampaignTags() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { rows: CampaignTagRow[]; replace?: boolean }) => {
      const { data } = await apiClient.post('/api/v1/user-config/campaign-tags/', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-tags'] }),
  })
}