'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/config'

export interface PivotMetrics {
  impressions: number
  clicks: number
  spend: number
  sales: number
  orders: number
  cpm: number
  ctr: number
  cpc: number
  cvr: number
  acos: number
  aov: number
  cpa: number
}

export interface PivotTreeNode {
  level: "tag" | "campaign" | "entity"
  tag_type_id?: string
  name: string
  metrics: {
    current: PivotMetrics
    previous: PivotMetrics
  }
  children?: PivotTreeNode[]
}

export interface CompPtMomResponse {
  tree: PivotTreeNode[]
  current_period: { start_date: string; end_date: string }
  previous_period: { start_date: string; end_date: string }
}

export interface SummaryResponse {
  tree: PivotTreeNode[]
  period: { start_date: string; end_date: string }
}

export function useCompPtMomQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'comp-pt-mom', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<CompPtMomResponse>('/api/v1/pivot-reports/comp-pt-mom/', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export interface PlacementMoMResponse {
  sp_tree: PivotTreeNode[]
  sb_tree: PivotTreeNode[]
  current_period: { start_date: string; end_date: string }
  previous_period: { start_date: string; end_date: string }
}

export function usePlacementMoMQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'placement-mom', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<PlacementMoMResponse>('/api/v1/pivot-reports/placement-mom/', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export interface AdTypeMoMResponse {
  tree: PivotTreeNode[]
  current_period: { start_date: string; end_date: string }
  previous_period: { start_date: string; end_date: string }
}

export function useAdTypeMoMQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'ad-type-mom', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<AdTypeMoMResponse>('/api/v1/pivot-reports/ad-type-mom/', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export interface TargetingLevelMomResponse {
  tree: PivotTreeNode[]
  current_period: { start_date: string; end_date: string }
  previous_period: { start_date: string; end_date: string }
}

export function useTargetingLevelMomQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'targeting-mom', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<TargetingLevelMomResponse>('/api/v1/pivot-reports/targeting-mom/', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useSummaryQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'summary', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<SummaryResponse>('/api/v1/pivot-reports/summary/', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export interface SearchTermMomResponse {
  tree: PivotTreeNode[]
  current_period: { start_date: string; end_date: string }
  previous_period: { start_date: string; end_date: string }
}

export function useSearchTermMomQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'search-term-mom', startDate, endDate],
    queryFn: async () => {
      const { data } = await apiClient.get<SearchTermMomResponse>('/api/v1/pivot-reports/search-term-mom/', {
        params: { start_date: startDate, end_date: endDate },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}


export interface TargetBreakdownResponse {
  tree: PivotTreeNode[]
  current_period: { start_date: string; end_date: string }
  previous_period: { start_date: string; end_date: string }
}

// tagFilters: {tag_type_id: [tag_id, ...]} — serialized to the backend's
// "filters=<tag_type_id>:<id>|<id>,<tag_type_id>:<id>" format (AND across
// TagTypes, OR within one TagType's selected ids).
// adTypes: selected subset of SP/SB/SD — omitted entirely when all three
// (or none) are selected, since the backend already defaults to all
// three when the param is absent.
function serializeTagFilters(tagFilters: Record<string, string[]>): string {
  return Object.entries(tagFilters)
    .filter(([, ids]) => ids.length > 0)
    .map(([tagTypeId, ids]) => `${tagTypeId}:${ids.join('|')}`)
    .join(',')
}

export function useTargetBreakdownQuery(
  startDate: string,
  endDate: string,
  groupByTagTypeId: string | null,
  tagFilters: Record<string, string[]>,
  adTypes: string[],
  enabled = true,
) {
  const filtersParam = serializeTagFilters(tagFilters)
  const adTypesParam = adTypes.length > 0 && adTypes.length < 3 ? adTypes.join(',') : ''

  return useQuery({
    queryKey: ['pivot-reports', 'target-breakdown', startDate, endDate, groupByTagTypeId, filtersParam, adTypesParam],
    queryFn: async () => {
      const { data } = await apiClient.get<TargetBreakdownResponse>('/api/v1/pivot-reports/target-breakdown/', {
        params: {
          start_date: startDate,
          end_date: endDate,
          group_by: groupByTagTypeId,
          ...(filtersParam ? { filters: filtersParam } : {}),
          ...(adTypesParam ? { ad_types: adTypesParam } : {}),
        },
      })
      return data
    },
    enabled: enabled && !!startDate && !!endDate && !!groupByTagTypeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}