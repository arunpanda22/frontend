'use client'

/**
 * use-flipkart-dashboard.ts
 *
 * React Query hooks for the Flipkart Campaign Summary page: one hook per backend endpoint, so
 * each card / chart / table loads, fails and refetches on its own (same idea as the backend:
 * one view per page component). Same conventions as use-dashboard.ts (Amazon):
 *   - queryKey starts with a fixed prefix + the full options object, so changing the date range
 *     or the ad account refetches automatically.
 *   - `enabled` is false until both dates are present (and the caller's own `enabled` is true).
 *   - staleTime 5 min, gcTime 30 min.
 *
 * `ads_tenant` is part of the options AND therefore part of the query key. When it is undefined
 * the backend falls back to the user's oldest active ad account.
 */
import { useQuery } from '@tanstack/react-query'
import {
  flipkartDashboardService,
  type FlipkartDashboardParams,
} from '@/lib/api/services/flipkart-dashboard.service'

export const flipkartDashboardQueryKeys = {
  all: ['flipkart-dashboard'] as const,
  campaignMetrics: (options: FlipkartDashboardParams) =>
    ['flipkart-dashboard', 'campaign-metrics', options] as const,
  timeline: (options: FlipkartDashboardParams) =>
    ['flipkart-dashboard', 'timeline', options] as const,
  campaignTypeContribution: (options: FlipkartDashboardParams) =>
    ['flipkart-dashboard', 'campaign-type-contribution', options] as const,
  campaigns: (options: FlipkartDashboardParams) =>
    ['flipkart-dashboard', 'campaigns', options] as const,
  campaignPlacements: (options: FlipkartDashboardParams) =>
    ['flipkart-dashboard', 'campaign-placements', options] as const,
}

/** Shared `enabled` rule: both dates are required by the backend (400 otherwise). */
function isReady(options: FlipkartDashboardParams, enabled: boolean) {
  return enabled && !!options.start_date && !!options.end_date
}

const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const GC_TIME = 30 * 60 * 1000 // 30 minutes

// KPI cards: current vs previous period
export function useFlipkartCampaignMetrics(options: FlipkartDashboardParams, enabled = true) {
  return useQuery({
    queryKey: flipkartDashboardQueryKeys.campaignMetrics(options),
    queryFn: () => flipkartDashboardService.getCampaignMetrics(options),
    enabled: isReady(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// Daily metrics chart
export function useFlipkartTimeline(options: FlipkartDashboardParams, enabled = true) {
  return useQuery({
    queryKey: flipkartDashboardQueryKeys.timeline(options),
    queryFn: () => flipkartDashboardService.getTimeline(options),
    enabled: isReady(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// Spend / revenue share per campaign type
export function useFlipkartCampaignTypeContribution(options: FlipkartDashboardParams, enabled = true) {
  return useQuery({
    queryKey: flipkartDashboardQueryKeys.campaignTypeContribution(options),
    queryFn: () => flipkartDashboardService.getCampaignTypeContribution(options),
    enabled: isReady(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// Campaigns table
export function useFlipkartCampaigns(options: FlipkartDashboardParams, enabled = true) {
  return useQuery({
    queryKey: flipkartDashboardQueryKeys.campaigns(options),
    queryFn: () => flipkartDashboardService.getCampaigns(options),
    enabled: isReady(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// Campaign x placement table
export function useFlipkartCampaignPlacements(options: FlipkartDashboardParams, enabled = true) {
  return useQuery({
    queryKey: flipkartDashboardQueryKeys.campaignPlacements(options),
    queryFn: () => flipkartDashboardService.getCampaignPlacements(options),
    enabled: isReady(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}