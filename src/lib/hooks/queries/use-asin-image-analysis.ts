// use-asin-images-analysis.ts
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { asinImagesService } from '@/lib/api/services/asin-images.service';
import { ASINImagesPayload, ApiError, ASINImagesResponse } from '@/lib/api/types';

export const useASINImagesAnalysis = (): UseMutationResult<ASINImagesResponse, ApiError, ASINImagesPayload> => {
  return useMutation({
    mutationFn: async (payload: ASINImagesPayload) => {
      return await asinImagesService.analyzeASINImages(payload);
    },
  });
};