import { useQuery } from '@tanstack/react-query'
import { impersonationService, ImpersonationUser } from '@/lib/api/services/impersonation.service'

export const useAvailableUsersForImpersonation = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['available-users-for-impersonation'],
    queryFn: async (): Promise<ImpersonationUser[]> => {
      const users = await impersonationService.getAvailableUsers()
      console.log('✅ React Query loaded available users:', users.length, users)
      return users
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
