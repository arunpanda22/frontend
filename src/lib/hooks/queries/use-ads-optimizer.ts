import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adsOptimizerService } from '@/lib/api/services/ads-optimizer.service';
import type { AdsOptimizerRequest } from '@/app/dashboard/ads-optimizer/lib/types';

export const adsOptimizerQueryKeys = {
  invoke: (params: AdsOptimizerRequest) => ['ads-optimizer', 'invoke', params] as const,
  results: () => ['ads-optimizer', 'results'] as const,
};

export function useInvokeAdsOptimizer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AdsOptimizerRequest) => adsOptimizerService.invokeOptimizer(params),
    onSuccess: (data) => {
      queryClient.setQueryData(adsOptimizerQueryKeys.results(), data);
    },
  });
}