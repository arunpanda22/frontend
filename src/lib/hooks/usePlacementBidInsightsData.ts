// hooks/usePlacementBidInsightsData.ts

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getJWTAccessToken, isImpersonating } from '../api/config';
import { auth } from '@/lib/firebase';

// Types matching PlacementBidInsightsService's response.
// NOTE: this feature only covers SP + SB (no SD) — same scope as the
// underlying service and the original analysis script.
export type PlacementAdType = 'sp' | 'sb';

export interface Table1Row {
  ad_type: PlacementAdType;
  campaign_id: string;
  campaign_name: string | null;
  today_impressions: number;
  dow_avg_impressions_elapsed_hours: number;
  impression_threshold_0_7x: number;
  placement: string;
  current_bid_adjustment_pct: number | null;
  today_placement_impressions: number;
  today_placement_clicks: number;
  today_placement_ctr_pct: number;
  dow_placement_ctr_pct: number | null;
  account_dow_avg_ctr_pct: number;
}

export interface Table2Row {
  ad_type: PlacementAdType;
  campaign_id: string;
  campaign_name: string | null;
  today_campaign_ctr_pct: number;
  dow_avg_campaign_ctr_pct: number;
  placement: string;
  current_bid_adjustment_pct: number | null;
  today_placement_ctr_pct: number;
  dow_avg_placement_ctr_pct: number;
}

export interface Table3Row {
  ad_type: PlacementAdType;
  campaign_id: string;
  campaign_name: string | null;
  today_cpc: number;
  dow_avg_cpc: number;
  cpc_threshold_1_3x: number;
  today_ctr_pct: number;
  dow_avg_ctr_pct: number;
}

export interface BidLookupStatus {
  available: boolean;
  reason: string | null;
  sp_campaigns_matched: number;
  sp_campaigns_total: number;
  sb_campaigns_matched: number;
  sb_campaigns_total: number;
}

export interface PlacementBidInsightsMetadata {
  local_date: string;
  weekday_iso: number;
  weekday_group_isos: number[];
  elapsed_hours_today: number[];
  dow_reference_days_used: number;
  account_dow_avg_ctr_pct: number;
  impressions_underpace_ratio: number;
  cpc_overspend_ratio: number;
  dow_lookback_days: number;
  ad_types_included: PlacementAdType[];
  timezone: string;
  generated_at: string;
  bid_lookup_status: BidLookupStatus;
}

export interface PlacementBidInsightsData {
  table1_low_impressions: Table1Row[];
  table2_low_ctr_placements: Table2Row[];
  table3_high_cpc_low_ctr: Table3Row[];
  metadata: PlacementBidInsightsMetadata;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return isDevelopment ? 'http://localhost:8000' : 'https://api.pacepivot.com';
};

const API_BASE_URL = getApiUrl();

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

export interface UsePlacementBidInsightsDataOptions {
  enabled?: boolean;
  timezone?: string;
}

async function fetchPlacementBidInsightsData(timezone?: string): Promise<PlacementBidInsightsData> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const qs = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';

  const response = await fetch(`${API_BASE_URL}/api/v1/optivise-x/placement-bid-insights/${qs}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.detail || 'Failed to fetch placement/bid insights',
    );
  }

  const data = await response.json();

  if (isDevelopment) {
    console.log('📊 Placement/bid insights received:', {
      table1: data.table1_low_impressions?.length,
      table2: data.table2_low_ctr_placements?.length,
      table3: data.table3_high_cpc_low_ctr?.length,
    });
  }

  return data;
}

// This is intentionally NOT auto-polled (no refetchInterval) — it's an
// on-demand, heavier endpoint (live Amazon Ads API round trip + pandas
// analysis per request), fetched once when the section mounts / the user
// explicitly refreshes it, unlike the 60s-polled revenue dashboard.
export function usePlacementBidInsightsData(
  options: UsePlacementBidInsightsDataOptions = {},
): UseQueryResult<PlacementBidInsightsData, Error> {
  const { enabled = true, timezone } = options;

  return useQuery<PlacementBidInsightsData, Error>({
    queryKey: ['placementBidInsightsData', timezone ?? 'default'],
    queryFn: () => fetchPlacementBidInsightsData(timezone),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}