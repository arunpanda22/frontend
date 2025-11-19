import { apiClient } from "@/lib/api/config";
import type { AdsOptimizerRequest, AdsOptimizerResponse } from "@/app/dashboard/ads-optimizer/lib/types";

class AdsOptimizerService {
  /**
   * Invoke ads optimizer Lambda function
   */
  async invokeOptimizer(params: AdsOptimizerRequest): Promise<AdsOptimizerResponse> {
    const res = await apiClient.post<AdsOptimizerResponse>(
      '/api/v1/ads-optimizer/invoke/',
      params
    );
    return res.data;
  }

  async pushOptimizations(payload: any) {
    const res = await apiClient.post("/api/v1/ads-optimizer/push/", payload);
    return res.data;
  }

}

export const adsOptimizerService = new AdsOptimizerService();