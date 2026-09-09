import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

export interface AsinTagRow {
  asin: string
  tag: string
}

export function useAsinTags() {
  return useQuery({
    queryKey: ['asin-tags'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/user-config/asin-tags/')
      return data
    },
  })
}

export function useCreateAsinTags() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { rows: AsinTagRow[]; replace?: boolean }) => {
      const { data } = await apiClient.post('/api/v1/user-config/asin-tags/', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asin-tags'] }),
  })
}