// asin-images.service.ts
import { apiClient, LONG_OPERATION_TIMEOUT } from '../config';
import { ASINImagesPayload, ASINImagesResponse } from '../types';
import { getFileDownloadUrl } from '../utils';

export const asinImagesService = {
  /**
   * Analyze ASIN Images
   */
  analyzeASINImages: async (payload: ASINImagesPayload): Promise<ASINImagesResponse> => {
   try {
    console.log(`Starting ASIN Images analysis for: ${payload.asins.join(', ')}`);
    
    const startTime = Date.now();
    console.log(`ASIN Images analysis API request started at: ${new Date(startTime).toISOString()}`);
    
    const response = await apiClient.post('api/v1/asin-images/analyze/', {
      asins: payload.asins
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: LONG_OPERATION_TIMEOUT,
    });
      
      // Log when response received
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`ASIN Images analysis API response received after ${duration.toFixed(2)} seconds`);
      console.log('ASIN Images analysis API response status:', response.status);
      
      // Check for empty response
      if (!response.data) {
        throw new Error('Empty response received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('ASIN Images analysis API error:', error);
      throw error;
    }
  },

  /**
   * Download analysis file using file_id
   */
  downloadASINImagesFile: (fileId: string, url?: string): string => {
    // If direct URL is provided, use it instead of file_id
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