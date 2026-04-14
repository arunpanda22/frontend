// src/app/dashboard/market-funnel-insights/sqp-v2/hooks/useSQPDataV2.tsx
// New V2 hook — old useSQPData.tsx untouched

import { useState, useEffect, useCallback } from 'react';
import { SQPApiServiceV2 } from '@/lib/api/dashboard/sqp_api_v2';
import { SQPDashboardV2Response, SQPV2RequestParams } from '../types/sqp_v2.types';

interface UseSQPDataV2Return {
  data: SQPDashboardV2Response | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: SQPV2RequestParams) => Promise<void>;
}

export const useSQPDataV2 = (initialParams?: SQPV2RequestParams): UseSQPDataV2Return => {
  const [data, setData] = useState<SQPDashboardV2Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params?: SQPV2RequestParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await SQPApiServiceV2.getDashboardData(params);
      setData(response);
    } catch (err: any) {
      console.error('Error fetching SQP v2 data:', err);
      let msg = 'Failed to fetch SQP data';
      if (err.response?.status === 404) msg = 'No SQP data found for the specified criteria';
      else if (err.response?.status === 400) msg = err.response.data?.details || 'Invalid parameters';
      else if (err.response?.status >= 500) msg = 'Server error. Please try again later.';
      else if (err.code === 'NETWORK_ERROR') msg = 'Network error. Please check your connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(initialParams);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};