// use-asin-analysis.ts
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { asinService } from '@/lib/api/services/asin.service';
import { ASINAnalysisPayload, ApiError, ASINAnalysisResponse } from '@/lib/api/types';

export const useASINAnalysis = (): UseMutationResult<ASINAnalysisResponse, ApiError, ASINAnalysisPayload> => {
  return useMutation({
    mutationFn: async (payload: ASINAnalysisPayload) => {
      return await asinService.analyzeASIN(payload);
    },
  });
};