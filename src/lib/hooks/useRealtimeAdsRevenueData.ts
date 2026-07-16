// hooks/useRealtimeAdsRevenueData.ts

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getJWTAccessToken, isImpersonating } from '../api/config';
import { auth } from '@/lib/firebase';

// Types matching the RealtimeAdsRevenueView response

export type AdType = 'sp' | 'sb' | 'sd';

export interface AdTypeMetrics {
  revenue: number;
  orders: number;
  units: number;
  clicks: number;
  impressions: number;
}

export interface PeriodPerformance {
  revenue: number;
  orders: number;
  units: number;
  clicks: number;
  impressions: number;
  asp: number;
  by_ad_type: Partial<Record<AdType, AdTypeMetrics>>;
}

export interface HourlyTrendPoint {
  hour: number; // 0-23, local to metadata.timezone
  today: number;
  yesterday: number;
  two_days_ago: number;
  today_by_ad_type: Partial<Record<AdType, number>>;
}

export interface TopCampaign {
  campaign_id: string;
  ad_type: AdType;
  revenue: number;
  orders: number;
  units: number;
}

export interface AdTypeBreakdownEntry {
  revenue: number;
  pct_of_total: number;
}

export interface AdsRevenueMetadata {
  date: string; // local calendar date, e.g. "2026-07-16"
  attribution_windows: Partial<Record<AdType, string>>;
  ad_types_included: AdType[];
  timezone: string;
  generated_at: string; // ISO timestamp
}

export interface RealtimeAdsRevenueData {
  today_performance: PeriodPerformance;
  yesterday_performance: PeriodPerformance;
  two_days_ago_performance: PeriodPerformance;
  hourly_trend: HourlyTrendPoint[];
  top_campaigns: TopCampaign[];
  ad_type_breakdown: Partial<Record<AdType, AdTypeBreakdownEntry>>;
  metadata: AdsRevenueMetadata;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return isDevelopment ? 'http://localhost:8000' : 'https://api.pacepivot.com';
};

const API_BASE_URL = getApiUrl();

// Get authentication token (Firebase or JWT) — mirrors useCombinedOrdersData.ts
async function getAuthToken(): Promise<string | null> {
  try {
    if (isImpersonating()) {
      const jwtToken = getJWTAccessToken();
      if (jwtToken) {
        if (isDevelopment) console.log('🔑 Using JWT token for API');
        return jwtToken;
      }
    }

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

export interface UseRealtimeAdsRevenueDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  /** Subset of sp/sb/sd — omit for all three combined. */
  adTypes?: AdType[];
  /** IANA tz name — omit to use the server default (Asia/Kolkata). */
  timezone?: string;
}

function buildQueryString(adTypes?: AdType[], timezone?: string): string {
  const params = new URLSearchParams();
  if (adTypes && adTypes.length > 0) params.set('ad_types', adTypes.join(','));
  if (timezone) params.set('timezone', timezone);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function fetchRealtimeAdsRevenueData(
  adTypes?: AdType[],
  timezone?: string,
): Promise<RealtimeAdsRevenueData> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const qs = buildQueryString(adTypes, timezone);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/optivise-x/realtime-ads-revenue/${qs}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.detail || 'Failed to fetch realtime ads revenue data',
    );
  }

  const data = await response.json();

  if (isDevelopment) {
    console.log('📊 Realtime ads revenue data received:', {
      revenue: data.today_performance?.revenue,
      orders: data.today_performance?.orders,
      topCampaigns: data.top_campaigns?.length,
      hourlyPoints: data.hourly_trend?.length,
    });
  }

  return data;
}

export function useRealtimeAdsRevenueData(
  options: UseRealtimeAdsRevenueDataOptions = {},
): UseQueryResult<RealtimeAdsRevenueData, Error> {
  const {
    enabled = true,
    refetchInterval = 0,
    staleTime = 5 * 60 * 1000,
    adTypes,
    timezone,
  } = options;

  return useQuery<RealtimeAdsRevenueData, Error>({
    queryKey: ['realtimeAdsRevenueData', adTypes?.join(',') ?? 'all', timezone ?? 'default'],
    queryFn: () => fetchRealtimeAdsRevenueData(adTypes, timezone),
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Auto-refreshing variant. Data lands hourly via Firehose, so a 60s poll is
// mostly about catching the UI up quickly right after a new batch lands,
// not about catching mid-hour changes (there aren't any).
export function useRealtimeAdsRevenueDataLive(
  options: Omit<UseRealtimeAdsRevenueDataOptions, 'enabled' | 'refetchInterval' | 'staleTime'> & {
    refetchIntervalMs?: number;
  } = {},
) {
  const { refetchIntervalMs = 60000, ...rest } = options;
  return useRealtimeAdsRevenueData({
    enabled: true,
    refetchInterval: refetchIntervalMs,
    staleTime: 30000,
    ...rest,
  });
}