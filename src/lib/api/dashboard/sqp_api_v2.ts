// src/lib/api/dashboard/sqp_api_v2.ts
// New V2 API service — old sqp.api.ts untouched

import { apiClient, LONG_OPERATION_TIMEOUT } from '@/lib/api/config';
import { SQPDashboardV2Response, SQPV2RequestParams } from '@/app/dashboard/market-funnel-insights/types/sqp_v2.types';

export class SQPApiServiceV2 {
  private static readonly BASE_PATH = '/api/v1/dashboard-api';

  static async getDashboardData(params?: SQPV2RequestParams): Promise<SQPDashboardV2Response> {
    try {
      const response = await apiClient.get<SQPDashboardV2Response>(
        `${this.BASE_PATH}/sqp-dashboard-v2/`,
        { params, timeout: LONG_OPERATION_TIMEOUT }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching SQP v2 dashboard data:', error);
      throw error;
    }
  }
}