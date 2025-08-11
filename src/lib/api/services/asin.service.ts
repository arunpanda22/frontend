// asin.service.ts
import { apiClient, LONG_OPERATION_TIMEOUT } from '../config';
import { ASINAnalysisPayload, ASINAnalysisResponse } from '../types';
import { getFileDownloadUrl } from '../../utils/asinDownloadFile';

export const asinService = {
  /**
   * Analyze ASIN
   */
  analyzeASIN: async (payload: ASINAnalysisPayload): Promise<ASINAnalysisResponse> => {
    try {
      console.log(`Starting ASIN analysis for: ${payload.asin}`);
      
      // Log when request starts
      const startTime = Date.now();
      console.log(`ASIN analysis API request started at: ${new Date(startTime).toISOString()}`);
      
      const response = await apiClient.post('api/v1/asin-analyzer/analyze/', {
        asin: payload.asin
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: LONG_OPERATION_TIMEOUT,
      });
      
      // Log when response received
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`ASIN analysis API response received after ${duration.toFixed(2)} seconds`);
      console.log('ASIN analysis API response status:', response.status);
      
      // Check for empty response
      if (!response.data) {
        throw new Error('Empty response received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('ASIN analysis API error:', error);
      throw error;
    }
  },

  /**
   * Download analysis file using file_id
   */
  downloadASINFile: (fileId: string, url?: string): string => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      console.log(`Using direct download URL: ${url}`);
      return url;
    }
    
    if (!fileId) {
      console.error('Invalid file ID for download:', fileId);
      throw new Error('Invalid file ID for download');
    }
    
    const downloadUrl = getFileDownloadUrl(fileId);
    console.log(`Generating download URL for file ${fileId}: ${downloadUrl}`);
    return downloadUrl;
  }
};