import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

interface UpdateTargetAcosPayload {
  target_acos: number
}

export const useUpdateTargetAcos = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ target_acos }: UpdateTargetAcosPayload) => {
      const response = await apiClient.put('/api/v1/auth/profile/', {
        target_acos,
      })
      return response.data
    },

    onSuccess: () => {
      // Refresh cached profile so UI updates everywhere
      queryClient.invalidateQueries({
        queryKey: ['user-profile'],
      })
    },
  })
}
