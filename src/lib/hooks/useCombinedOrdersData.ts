// hooks/useCombinedOrdersData.ts

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getJWTAccessToken, isImpersonating } from '../api/config';
import { auth } from '@/lib/firebase';

// Types matching the Django API response
export interface DailyMetrics {
  revenue: number;
  orders: number;
  units: number;
  asp: number;
  cancelled: number;
}

export interface DailyMetricsData {
  seller: DailyMetrics;
  vendor: DailyMetrics;
  combined: DailyMetrics;
}

export interface TopProduct {
  asin: string;
  product_name: string;
  image_url: string | null;
  seller_revenue: number;
  vendor_revenue: number;
  total_revenue: number;
  seller_units: number;
  vendor_units: number;
  total_units: number;
  orders: number;
  asp: number;
  price: number;
}

export interface HourlyDataPoint {
  date: string;
  hour: string;
  period: string;
  seller_quantity: number;
  vendor_quantity: number;
  total_quantity: number;
  seller_revenue: number;
  vendor_revenue: number;
  total_revenue: number;
  timestamp: string;
}

export interface HourlyTotals {
  today: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
  yesterday: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
  day_before_yesterday: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
}

export interface DashboardMetadata {
  date: string;
  timezone: string;
  marketplace_id: string;
  last_updated: string;
  last_refreshed_at: string;
}

export interface CombinedOrdersData {
  daily_metrics: DailyMetricsData;
  top_products: TopProduct[];
  hourly_orders: HourlyDataPoint[];
  hourly_totals: HourlyTotals;
  metadata: DashboardMetadata;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  return isDevelopment ? 'http://localhost:8000' : 'https://api.pacepivot.com';
};

const API_BASE_URL = getApiUrl();

// Get authentication token (Firebase or JWT)
async function getAuthToken(): Promise<string | null> {
  try {
    // Check if impersonating (use JWT)
    if (isImpersonating()) {
      const jwtToken = getJWTAccessToken();
      if (jwtToken) {
        if (isDevelopment) console.log('🔑 Using JWT token for API');
        return jwtToken;
      }
    }

    // Use Firebase token
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (isDevelopment) console.log('🔑 Using Firebase token for API');
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Fetch combined orders data
async function fetchCombinedOrdersData(): Promise<CombinedOrdersData> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/realtime/orders-data/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.detail || 'Failed to fetch combined orders data'
    );
  }

  const data = await response.json();

  if (isDevelopment) {
    console.log('📊 Combined orders data received:', {
      revenue: data.daily_metrics?.combined?.revenue,
      orders: data.daily_metrics?.combined?.orders,
      topProducts: data.top_products?.length,
      hourlyPoints: data.hourly_orders?.length,
      hourlyTotals: data.hourly_totals,
    });
  }

  return data;
}

// Refresh combined orders data (forces server refresh)
async function refreshCombinedOrdersData(): Promise<CombinedOrdersData> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/realtime/orders-data/refresh/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        errorData.detail ||
        'Failed to refresh combined orders data'
    );
  }

  const data = await response.json();

  if (isDevelopment) {
    console.log('🔄 Combined orders data refreshed');
  }

  return data;
}

export interface UseCombinedOrdersDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export function useCombinedOrdersData(
  options: UseCombinedOrdersDataOptions = {}
): UseQueryResult<CombinedOrdersData, Error> & {
  refreshCombinedOrdersData: () => Promise<void>;
} {
  const {
    enabled = true,
    refetchInterval = 0,
    staleTime = 5 * 60 * 1000,
  } = options;

  const queryResult = useQuery<CombinedOrdersData, Error>({
    queryKey: ['combinedOrdersData'],
    queryFn: fetchCombinedOrdersData,
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const refreshCombinedOrdersDataHandler = async () => {
    try {
      await refreshCombinedOrdersData();
      await queryResult.refetch();
      if (isDevelopment) {
        console.log('✅ Combined orders data refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to refresh combined orders data:', error);
      throw error;
    }
  };

  return {
    ...queryResult,
    refreshCombinedOrdersData: refreshCombinedOrdersDataHandler,
  };
}

// Hook variant with auto-refresh enabled
export function useCombinedOrdersDataLive(
  refetchIntervalMs: number = 60000
) {
  return useCombinedOrdersData({
    enabled: true,
    refetchInterval: refetchIntervalMs,
    staleTime: 30000,
  });
}