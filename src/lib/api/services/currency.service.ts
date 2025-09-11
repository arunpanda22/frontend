import { CurrencyData } from '../types';
import { apiClient } from '../config';

export const currencyService = {
  async getUserMarketplaceCurrencies(): Promise<CurrencyData> {
    try {
      // Use your existing apiClient which already handles auth, CSRF, etc.
      const response = await apiClient.get('/api/v1/dashboard-api/marketplace-currencies/');
      
      return response.data;
    } catch (error: any) {
      console.error('Currency service error:', error);
      throw new Error(`Failed to fetch currencies: ${error.response?.data?.message || error.message}`);
    }
  },
};