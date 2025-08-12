// src/app/newdashboard/searchqueryperformance/hooks/useSQPData.tsx

import { useState, useEffect, useCallback } from 'react';
import { SQPApiService } from '@/lib/api/dashboard/sqp.api';
import { 
  SQPDashboardResponse, 
  SQPRequestParams, 
  SearchQueryPerformanceData,
  MonthlyMetric 
} from '../types/sqp.types';

interface UseSQPDataReturn {
  data: SQPDashboardResponse | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: SQPRequestParams) => Promise<void>;
  availableAsins: string[];
  loadingAsins: boolean;
}

export const useSQPData = (initialParams?: SQPRequestParams): UseSQPDataReturn => {
  const [data, setData] = useState<SQPDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableAsins, setAvailableAsins] = useState<string[]>([]);
  const [loadingAsins, setLoadingAsins] = useState(true);

  const fetchData = useCallback(async (params?: SQPRequestParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SQPApiService.getSQPDashboardData(params);
      setData(response);
    } catch (err: any) {
      console.error('Error fetching SQP data:', err);
      
      let errorMessage = 'Failed to fetch SQP data';
      
      if (err.response?.status === 404) {
        errorMessage = 'No SQP data found for the specified criteria';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.details || 'Invalid parameters';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableAsins = useCallback(async () => {
    try {
      setLoadingAsins(true);
      const asins = await SQPApiService.getAvailableASINs();
      setAvailableAsins(asins);
    } catch (err) {
      console.error('Error fetching available ASINs:', err);
      // Don't set error for ASINs fetch failure, just use empty array
      setAvailableAsins([]);
    } finally {
      setLoadingAsins(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData(initialParams);
    fetchAvailableAsins();
  }, [fetchData, fetchAvailableAsins, initialParams]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    availableAsins,
    loadingAsins,
  };
};

// Hook for processing and calculating summary stats
export const useSQPSummaryStats = (data: SearchQueryPerformanceData[]) => {
  return {
    totalClicks: data.reduce((sum, item) => sum + item.total_click_count, 0),
    totalAsinClicks: data.reduce((sum, item) => sum + item.asin_click_count, 0),
    
    totalPurchases: data.reduce((sum, item) => sum + item.total_purchase_count, 0),
    totalAsinPurchases: data.reduce((sum, item) => sum + item.asin_purchase_count, 0),
    
    avgMarketPrice: data.length > 0 
      ? data.reduce((sum, item) => sum + item.total_median_click_price, 0) / data.length 
      : 0,
    avgAsinPrice: data.length > 0 
      ? data.reduce((sum, item) => sum + item.asin_median_click_price, 0) / data.length 
      : 0,
    
    avgTotalConversion: data.length > 0 
      ? data.reduce((sum, item) => sum + item.total_conversion, 0) / data.length 
      : 0,
    avgAsinConversion: data.length > 0 
      ? data.reduce((sum, item) => sum + item.asin_conversion, 0) / data.length 
      : 0,
  };
};