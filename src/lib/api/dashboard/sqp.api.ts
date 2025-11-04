import { apiClient, LONG_OPERATION_TIMEOUT } from '@/lib/api/config';
import { SQPDashboardResponse, SQPRequestParams } from '@/app/maindashboard/searchqueryperformance/types/sqp.types';

export class SQPApiService {
  private static readonly BASE_PATH = '/api/v1/dashboard-api';

  /**
   * Get SQP dashboard data
   */
  static async getSQPDashboardData(params?: SQPRequestParams): Promise<SQPDashboardResponse> {
    try {
      console.log('Fetching SQP dashboard data with params:', params);

      const response = await apiClient.get<SQPDashboardResponse>(
        `${this.BASE_PATH}/sqp-dashboard-data/`,
        {
          params,
          timeout: LONG_OPERATION_TIMEOUT,
        }
      );

      console.log('SQP dashboard data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching SQP dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get unique ASINs for filter dropdown
   */
  static async getAvailableASINs(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ asins: string[] }>(`${this.BASE_PATH}/sqp-asins-list/`);
      return response.data.asins;
    } catch (error) {
      console.error('Error fetching available ASINs:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Export SQP data as CSV
   */
  static async exportSQPData(params?: SQPRequestParams): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/sqp-export/`, {
        params,
        responseType: 'blob',
        timeout: LONG_OPERATION_TIMEOUT,
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting SQP data:', error);
      throw error;
    }
  }
}