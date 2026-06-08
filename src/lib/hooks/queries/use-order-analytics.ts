'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  orderAnalyticsService,
  type OrderAnalyticsParams,
  type CohortTopSkusResponse,
  type HeatmapDataResponse,
  type HeatmapFilterOptions,
  type HeatmapParams,
} from "@/lib/api/services/order-analytics.service";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const orderAnalyticsQueryKeys = {
  all: ['order-analytics'] as const,

  revenueMap: (params?: OrderAnalyticsParams) =>
    ['order-analytics', 'revenue-map', params] as const,
  stateRevenueDetail: (state: string, params?: OrderAnalyticsParams) =>
    ['order-analytics', 'revenue-map', state, params] as const,

  cohortOrders: (params?: OrderAnalyticsParams) =>
    ['order-analytics', 'cohort-orders', params] as const,

  heatmapData: (params: HeatmapParams) =>
    ['order-analytics', 'heatmap', params] as const,
  heatmapFilters: (marketplace?: string) =>
    ['order-analytics', 'heatmap-filters', marketplace] as const,
};

// ─── Revenue Map hooks ────────────────────────────────────────────────────────

export function useRevenueMap(params?: OrderAnalyticsParams, enabled = true) {
  return useQuery({
    queryKey: orderAnalyticsQueryKeys.revenueMap(params),
    queryFn: () => orderAnalyticsService.getRevenueMap(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useStateRevenueDetail(
  state: string | undefined,
  params?: OrderAnalyticsParams
) {
  return useQuery({
    queryKey: orderAnalyticsQueryKeys.stateRevenueDetail(state ?? '', params),
    queryFn: () => orderAnalyticsService.getStateRevenueDetail(state!, params),
    enabled: !!state,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// ─── Cohort hooks ─────────────────────────────────────────────────────────────

export function useCohortOrders(enabled = true) {
  return useQuery({
    queryKey: orderAnalyticsQueryKeys.cohortOrders(),
    queryFn: () => orderAnalyticsService.getCohortOrders(),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useCohortTopSkus(enabled = true) {
  return useQuery<CohortTopSkusResponse>({
    queryKey:  ["cohort-top-skus"],
    queryFn:   () => orderAnalyticsService.getCohortTopSkus(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Heatmap hooks ────────────────────────────────────────────────────────────

export function useHeatmapData(params: HeatmapParams, enabled = true) {
  return useQuery<HeatmapDataResponse>({
    queryKey: orderAnalyticsQueryKeys.heatmapData(params),
    queryFn:  () => orderAnalyticsService.getHeatmapData(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime:   30 * 60 * 1000,
  });
}

export function useHeatmapFilterOptions(
  marketplace_id?: string,
  enabled = true,
) {
  return useQuery<HeatmapFilterOptions>({
    queryKey: orderAnalyticsQueryKeys.heatmapFilters(marketplace_id),
    queryFn:  () => orderAnalyticsService.getHeatmapFilterOptions(marketplace_id),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime:   30 * 60 * 1000,
  });
}

// ─── Composite page hook ──────────────────────────────────────────────────────

export function useOrderAnalyticsPage(params?: OrderAnalyticsParams) {
  const hasRange = !!params?.date_from && !!params?.date_to
  const revenueMap   = useRevenueMap(params, hasRange)
  const cohortOrders = useCohortOrders()

  return {
    revenueMap,
    cohortOrders,
    isLoading: revenueMap.isLoading || cohortOrders.isLoading,
    isError:   revenueMap.isError   || cohortOrders.isError,
  }
}

// ─── Manual refresh ───────────────────────────────────────────────────────────

export function useOrderAnalyticsRefresh() {
  const queryClient = useQueryClient()
  return {
    refreshRevenueMap: (params?: OrderAnalyticsParams) =>
      queryClient.invalidateQueries({ queryKey: orderAnalyticsQueryKeys.revenueMap(params) }),
    refreshStateDetail: (state: string, params?: OrderAnalyticsParams) =>
      queryClient.invalidateQueries({ queryKey: orderAnalyticsQueryKeys.stateRevenueDetail(state, params) }),
    refreshCohortOrders: (params?: OrderAnalyticsParams) =>
      queryClient.invalidateQueries({ queryKey: orderAnalyticsQueryKeys.cohortOrders(params) }),
    refreshAll: () =>
      queryClient.invalidateQueries({ queryKey: orderAnalyticsQueryKeys.all }),
  }
}