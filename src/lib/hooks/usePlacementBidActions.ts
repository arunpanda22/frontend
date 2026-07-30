// lib/hooks/usePlacementBidActions.ts
//
// Mutation hooks for the three Placement & Bid Insights action endpoints.
// Mirrors the auth/fetch pattern already used in usePlacementBidInsightsData.ts.
//
// These are exposed as both plain async functions (for imperative, possibly-
// concurrent calls — e.g. applying several staged rows at once) and as
// useMutation-wrapped hooks (for the common single-row case where you want
// isPending/isError from React Query directly). The staging panel in
// PlacementBidInsightsSection uses the plain functions so it can run many
// of these concurrently and track each row's status itself via
// usePlacementBidActionsStore, rather than sharing one mutation's state
// across every row.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getJWTAccessToken, isImpersonating } from '../api/config';
import { auth } from '@/lib/firebase';
import type { PlacementAdType } from './usePlacementBidInsightsData';

const isDevelopment = process.env.NODE_ENV === 'development';

const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return isDevelopment ? 'http://localhost:8000' : 'https://api.pacepivot.com';
};

const API_BASE_URL = getApiUrl();
const INSIGHTS_BASE = `${API_BASE_URL}/api/v1/optivise-x/placement-bid-insights`;

async function getAuthToken(): Promise<string | null> {
  try {
    if (isImpersonating()) {
      const jwtToken = getJWTAccessToken();
      if (jwtToken) return jwtToken;
    }
    const currentUser = auth?.currentUser;
    if (currentUser) return currentUser.getIdToken();
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Thrown for any non-2xx response from the action endpoints. `code` is the
 * backend's `error` field verbatim — e.g. "cooldown_active" (429) — and
 * `retryAfterMinutes` is populated only for cooldown responses.
 */
export class PlacementBidActionError extends Error {
  status: number;
  code?: string;
  retryAfterMinutes?: number;

  constructor(body: any, status: number) {
    super(
      typeof body?.error === 'string' && body.error !== 'cooldown_active'
        ? body.error
        : body?.detail || 'Placement/bid action failed',
    );
    this.status = status;
    this.code = body?.error;
    this.retryAfterMinutes = body?.retry_after_minutes;
  }
}

async function postAction<T>(path: string, payload: object): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${INSIGHTS_BASE}/${path}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new PlacementBidActionError(body, response.status);
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Table 1 / Table 2 — apply-placement-bid
// ---------------------------------------------------------------------------

export interface ApplyPlacementBidPayload {
  ad_type: PlacementAdType;
  campaign_id: string;
  campaign_name?: string | null;
  placement: string;
  new_value: number;
}

export interface ApplyPlacementBidResult {
  status: 'applied';
  change_id: string;
  campaign_id: string;
  placement: string;
  previous_value: number;
  new_value: number;
  day_baseline_value: number;
  applied_at: string;
}

export function applyPlacementBidAdjustment(
  payload: ApplyPlacementBidPayload,
): Promise<ApplyPlacementBidResult> {
  return postAction<ApplyPlacementBidResult>('apply-placement-bid', payload);
}

export function useApplyPlacementBidAdjustment() {
  return useMutation({
    mutationFn: applyPlacementBidAdjustment,
  });
}

// ---------------------------------------------------------------------------
// Table 3 — apply-bid-decrease
// ---------------------------------------------------------------------------

export interface ApplyBidDecreasePayload {
  ad_type: PlacementAdType;
  campaign_id: string;
  campaign_name?: string | null;
  decrease_pct: number;
}

export interface ApplyBidDecreaseResult {
  batch_id: string;
  status: 'applied' | 'partial_failed' | 'failed';
  successful: number;
  failed: number;
  target_count: number;
  can_retry_failed: boolean;
}

export function applyCampaignBidDecrease(
  payload: ApplyBidDecreasePayload,
): Promise<ApplyBidDecreaseResult> {
  return postAction<ApplyBidDecreaseResult>('apply-bid-decrease', payload);
}

export function useApplyCampaignBidDecrease() {
  return useMutation({
    mutationFn: applyCampaignBidDecrease,
  });
}

// ---------------------------------------------------------------------------
// Table 3 — retry-bid-decrease
// ---------------------------------------------------------------------------

export interface RetryBidDecreasePayload {
  ad_type: PlacementAdType;
  campaign_id: string;
  batch_id: string;
}

export function retryCampaignBidDecrease(
  payload: RetryBidDecreasePayload,
): Promise<ApplyBidDecreaseResult> {
  return postAction<ApplyBidDecreaseResult>('retry-bid-decrease', payload);
}

export function useRetryCampaignBidDecrease() {
  return useMutation({
    mutationFn: retryCampaignBidDecrease,
  });
}

// ---------------------------------------------------------------------------
// Optional: invalidate the underlying insights query after a batch of
// actions, so the next manual "Run Analysis" click is guaranteed fresh
// rather than relying on the 5-minute staleTime. NOT called automatically
// after every single apply — that endpoint does a live Amazon Ads API round
// trip plus a full pandas re-analysis per the service docstring, so forcing
// a refetch per row (e.g. during a bulk apply of 20 rows) would be
// expensive. Call this once after a batch of actions finishes instead.
// ---------------------------------------------------------------------------

export function useInvalidatePlacementBidInsights() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['placementBidInsightsData'] });
}