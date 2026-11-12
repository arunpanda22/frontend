// 'use client'

// import { useQuery } from '@tanstack/react-query'
// import { apiClient } from '@/lib/api/config'

// export interface PivotMetrics {
//   impressions: number
//   clicks: number
//   spend: number
//   sales: number
//   orders: number
//   cpm: number
//   ctr: number
//   cpc: number
//   cvr: number
//   acos: number
//   aov: number
//   cpa: number
// }

// export interface PivotTreeNode {
//   level: "tag" | "campaign" | "entity"
//   tag_type_id?: string
//   name: string
//   metrics: {
//     current: PivotMetrics
//     previous: PivotMetrics
//   }
//   children?: PivotTreeNode[]
// }

// export interface CompPtMomResponse {
//   tree: PivotTreeNode[]
//   current_period: { start_date: string; end_date: string }
//   previous_period: { start_date: string; end_date: string }
// }

// export interface SummaryResponse {
//   tree: PivotTreeNode[]
//   period: { start_date: string; end_date: string }
// }

// export function useCompPtMomQuery(startDate: string, endDate: string, enabled = true) {
//   return useQuery({
//     queryKey: ['pivot-reports', 'comp-pt-mom', startDate, endDate],
//     queryFn: async () => {
//       const { data } = await apiClient.get<CompPtMomResponse>('/api/v1/pivot-reports/comp-pt-mom/', {
//         params: { start_date: startDate, end_date: endDate },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }

// export interface PlacementMoMResponse {
//   sp_tree: PivotTreeNode[]
//   sb_tree: PivotTreeNode[]
//   current_period: { start_date: string; end_date: string }
//   previous_period: { start_date: string; end_date: string }
// }

// export function usePlacementMoMQuery(startDate: string, endDate: string, enabled = true) {
//   return useQuery({
//     queryKey: ['pivot-reports', 'placement-mom', startDate, endDate],
//     queryFn: async () => {
//       const { data } = await apiClient.get<PlacementMoMResponse>('/api/v1/pivot-reports/placement-mom/', {
//         params: { start_date: startDate, end_date: endDate },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }

// export interface AdTypeMoMResponse {
//   tree: PivotTreeNode[]
//   current_period: { start_date: string; end_date: string }
//   previous_period: { start_date: string; end_date: string }
// }

// export function useAdTypeMoMQuery(startDate: string, endDate: string, enabled = true) {
//   return useQuery({
//     queryKey: ['pivot-reports', 'ad-type-mom', startDate, endDate],
//     queryFn: async () => {
//       const { data } = await apiClient.get<AdTypeMoMResponse>('/api/v1/pivot-reports/ad-type-mom/', {
//         params: { start_date: startDate, end_date: endDate },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }

// export interface TargetingLevelMomResponse {
//   tree: PivotTreeNode[]
//   current_period: { start_date: string; end_date: string }
//   previous_period: { start_date: string; end_date: string }
// }

// export function useTargetingLevelMomQuery(startDate: string, endDate: string, enabled = true) {
//   return useQuery({
//     queryKey: ['pivot-reports', 'targeting-mom', startDate, endDate],
//     queryFn: async () => {
//       const { data } = await apiClient.get<TargetingLevelMomResponse>('/api/v1/pivot-reports/targeting-mom/', {
//         params: { start_date: startDate, end_date: endDate },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }

// export function useSummaryQuery(startDate: string, endDate: string, enabled = true) {
//   return useQuery({
//     queryKey: ['pivot-reports', 'summary', startDate, endDate],
//     queryFn: async () => {
//       const { data } = await apiClient.get<SummaryResponse>('/api/v1/pivot-reports/summary/', {
//         params: { start_date: startDate, end_date: endDate },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }

// export interface SearchTermMomResponse {
//   tree: PivotTreeNode[]
//   current_period: { start_date: string; end_date: string }
//   previous_period: { start_date: string; end_date: string }
// }

// export function useSearchTermMomQuery(startDate: string, endDate: string, enabled = true) {
//   return useQuery({
//     queryKey: ['pivot-reports', 'search-term-mom', startDate, endDate],
//     queryFn: async () => {
//       const { data } = await apiClient.get<SearchTermMomResponse>('/api/v1/pivot-reports/search-term-mom/', {
//         params: { start_date: startDate, end_date: endDate },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }


// export interface TargetBreakdownResponse {
//   tree: PivotTreeNode[]
//   current_period: { start_date: string; end_date: string }
//   previous_period: { start_date: string; end_date: string }
// }

// // tagFilters: {tag_type_id: [tag_id, ...]} — serialized to the backend's
// // "filters=<tag_type_id>:<id>|<id>,<tag_type_id>:<id>" format (AND across
// // TagTypes, OR within one TagType's selected ids).
// // adTypes: selected subset of SP/SB/SD — omitted entirely when all three
// // (or none) are selected, since the backend already defaults to all
// // three when the param is absent.
// function serializeTagFilters(tagFilters: Record<string, string[]>): string {
//   return Object.entries(tagFilters)
//     .filter(([, ids]) => ids.length > 0)
//     .map(([tagTypeId, ids]) => `${tagTypeId}:${ids.join('|')}`)
//     .join(',')
// }

// export function useTargetBreakdownQuery(
//   startDate: string,
//   endDate: string,
//   groupByTagTypeId: string | null,
//   tagFilters: Record<string, string[]>,
//   adTypes: string[],
//   enabled = true,
// ) {
//   const filtersParam = serializeTagFilters(tagFilters)
//   const adTypesParam = adTypes.length > 0 && adTypes.length < 3 ? adTypes.join(',') : ''

//   return useQuery({
//     queryKey: ['pivot-reports', 'target-breakdown', startDate, endDate, groupByTagTypeId, filtersParam, adTypesParam],
//     queryFn: async () => {
//       const { data } = await apiClient.get<TargetBreakdownResponse>('/api/v1/pivot-reports/target-breakdown/', {
//         params: {
//           start_date: startDate,
//           end_date: endDate,
//           group_by: groupByTagTypeId,
//           ...(filtersParam ? { filters: filtersParam } : {}),
//           ...(adTypesParam ? { ad_types: adTypesParam } : {}),
//         },
//       })
//       return data
//     },
//     enabled: enabled && !!startDate && !!endDate && !!groupByTagTypeId,
//     staleTime: 5 * 60 * 1000,
//     gcTime: 30 * 60 * 1000,
//   })
// }


// lib/hooks/queries/use-pivot-reports.ts
'use client'

/**
 * use-pivot-reports.ts — React Query layer for the pivot reports API.
 *
 * BACKEND CONTRACT (pivot_reports/, see presets.py / periods.py / filtering.py)
 * ---------------------------------------------------------------------------
 *   GET /api/v1/pivot-reports/<preset>/        run a report tab
 *   GET /api/v1/pivot-reports/meta/<preset>/   describe it (filters, group-by slot, tag types)
 *
 * Every tab is a backend *preset*; this file has ONE generic hook
 * (`usePivotReportQuery`) plus thin typed wrappers per tab. Adding a tab is one
 * entry in PIVOT_PRESET_KEYS + one wrapper (or just call the generic hook).
 *
 * QUERY PARAMS (built by `buildPivotParams`)
 *   start_date, end_date                      current range (YYYY-MM-DD, inclusive)
 *   compare=false                             comparison OFF (nodes omit metrics.previous)
 *   compare_start_date, compare_end_date      custom comparison range (need not touch current)
 *   (neither of the above)                    AUTO: same-length range immediately before current
 *   group_by=<TagType id>                     fills the preset's tag "slot" (optional if the
 *                                             preset has a default slug; required for target-breakdown)
 *   include_untagged=true                     slot presets show "(Not Tagged)" too
 *   filters=<key>:<v>|<v>,-<key>:<v>|~        see `serializePivotFilters`
 *
 * ERRORS: validation problems come back as HTTP 400 {"error": "..."}; use
 * `getPivotErrorMessage(error)` to show the server's message.
 *
 * NOTE ON PRESET KEYS vs TAB KEYS: the backend keys are "targeting-mom" and
 * "search-term-mom". The old page-level tab keys ("targeting-level-mom",
 * "searchterm-mom") differ — map them when the components are updated.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { apiClient } from '@/lib/api/config'

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

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
  /** This node's share of the grand total spend in the same period (0..1). */
  spend_share?: number
  /** This node's share of the grand total sales in the same period (0..1). */
  sales_share?: number
}

/** `month` / `date` appear only in the Summary preset. */
export type PivotNodeLevel = 'tag' | 'campaign' | 'entity' | 'month' | 'date'

export interface PivotNodeMetrics {
  current: PivotMetrics
  /** Omitted entirely when comparison is off. */
  previous?: PivotMetrics
}

export interface PivotTreeNode {
  level: PivotNodeLevel
  tag_type_id?: string
  name: string
  metrics: PivotNodeMetrics
  children?: PivotTreeNode[]
}

/** Grand total computed from fact rows (NOT the sum of root nodes — multi-valued tags overlap). */
export type PivotTotals = PivotNodeMetrics

export interface PivotPeriod {
  start_date: string
  end_date: string
}

export type PivotComparisonMode = 'off' | 'auto' | 'custom'

export interface PivotComparisonInfo {
  enabled: boolean
  mode: PivotComparisonMode
  /** null when comparison is off. */
  same_length: boolean | null
  /** null when comparison is off. Useful for a "ranges overlap" warning in the UI. */
  overlaps_current: boolean | null
}

interface PivotResponseBase {
  current_period: PivotPeriod
  /** null when comparison is off. */
  previous_period: PivotPeriod | null
  comparison: PivotComparisonInfo
  /** Same as current_period; kept because the backend still returns it. */
  period: PivotPeriod
  /** Data-quality messages (e.g. targets present in both KT and ET tables). Show, don't throw. */
  warnings: string[]
}

/** Every preset except Placement. */
export interface PivotReportResponse extends PivotResponseBase {
  tree: PivotTreeNode[]
  totals: PivotTotals
}

/** Placement returns one tree per ad type instead of `tree`/`totals`. */
export interface PivotPlacementResponse extends PivotResponseBase {
  sp_tree: PivotTreeNode[]
  sb_tree: PivotTreeNode[]
  section_totals: { sp_tree: PivotTotals; sb_tree: PivotTotals }
}

// Named aliases so components keep readable imports.
export type SummaryResponse = PivotReportResponse
export type CompPtMomResponse = PivotReportResponse
export type TargetBreakdownResponse = PivotReportResponse
export type TargetingLevelMomResponse = PivotReportResponse
export type AdTypeMoMResponse = PivotReportResponse
export type SearchTermMomResponse = PivotReportResponse
export type PlacementMoMResponse = PivotPlacementResponse

// ---------------------------------------------------------------------------
// Meta endpoint types
// ---------------------------------------------------------------------------

export interface PivotMetaTagType {
  id: string
  name: string
  entity_type: 'ASIN' | 'TARGET' | 'CAMPAIGN'
}

export interface PivotMetaFieldFilter {
  /** Filter key to send in `filters` (e.g. "ad_format", "target_kind"). */
  key: string
  kind: 'field'
  label: string
  options: { value: string; label: string }[]
}

export interface PivotMetaGroupBySlot {
  label: string
  /** true => no default slug exists; the user MUST pick a tag type (target-breakdown). */
  required: boolean
  /** This client's TagType matching the preset's default slug, if any. */
  default_tag_type_id: string | null
  tag_types: PivotMetaTagType[]
}

export interface PivotPresetMeta {
  key: string
  label: string
  description: string
  supports_comparison: boolean
  /** null for presets with no tag slot (summary, ad-type, placement). */
  group_by_slot: PivotMetaGroupBySlot | null
  field_filters: PivotMetaFieldFilter[]
  /** TagTypes the user may filter by; values come from /tagging-v2/tags/?tag_type=<id>. */
  tag_filters: PivotMetaTagType[]
  /** The token meaning "(blank)/untagged" in filters. Currently "~". */
  blank_token: string
  defaults: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Request model
// ---------------------------------------------------------------------------

/** Backend preset keys == URL segments. */
export const PIVOT_PRESET_KEYS = [
  'summary',
  'comp-pt-mom',
  'target-breakdown',
  'targeting-mom',
  'ad-type-mom',
  'placement-mom',
  'search-term-mom',
] as const
export type PivotPresetKey = (typeof PIVOT_PRESET_KEYS)[number]

/** Blank/untagged token, mirrors backend filtering.UNTAGGED. */
export const PIVOT_BLANK_TOKEN = '~'

export interface PivotDateRange {
  /** YYYY-MM-DD. Empty string = not set. */
  startDate: string
  endDate: string
}

export interface PivotComparison {
  /** false => sends compare=false. */
  enabled: boolean
  /**
   * Custom comparison range. When enabled and this is missing/incomplete the
   * backend uses AUTO (same length, immediately before current).
   */
  range?: PivotDateRange | null
}

/**
 * One filter. `key` is a TagType id (values = tag ids, or PIVOT_BLANK_TOKEN)
 * or a field key such as "ad_format" / "target_kind" (values = literals).
 * op "in": value OR value. op "not_in": everything except these (blank "~" works in both).
 */
export interface PivotFilter {
  key: string
  op: 'in' | 'not_in'
  values: string[]
}

export interface PivotQuery {
  current: PivotDateRange
  comparison?: PivotComparison
  /** TagType id for the preset's slot. Omit to use the backend default. */
  groupBy?: string | null
  filters?: PivotFilter[]
  /** Slot presets: also include a "(Not Tagged)" node. */
  includeUntagged?: boolean
}

/**
 * [PivotFilter] -> "key:v|v,-key:v|~". Filters with no values are dropped
 * (the backend rejects empty ones as malformed). Returns undefined when empty.
 */
export function serializePivotFilters(filters: PivotFilter[] | undefined): string | undefined {
  const parts = (filters ?? [])
    .filter((f) => f.key && f.values.length > 0)
    .map((f) => `${f.op === 'not_in' ? '-' : ''}${f.key}:${f.values.join('|')}`)
  return parts.length > 0 ? parts.join(',') : undefined
}

/**
 * PivotQuery -> flat axios params. Undefined values are omitted by axios, and
 * the result doubles as the stable React Query cache key.
 */
export function buildPivotParams(query: PivotQuery): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {
    start_date: query.current.startDate,
    end_date: query.current.endDate,
  }

  const cmp = query.comparison
  if (cmp && !cmp.enabled) {
    params.compare = 'false'
  } else if (cmp?.range?.startDate && cmp.range.endDate) {
    // Both dates or none: the backend 400s on exactly one.
    params.compare_start_date = cmp.range.startDate
    params.compare_end_date = cmp.range.endDate
  }
  // else: AUTO — send nothing.

  if (query.groupBy) params.group_by = query.groupBy
  if (query.includeUntagged) params.include_untagged = 'true'
  params.filters = serializePivotFilters(query.filters)
  return params
}

/** Server-provided message for 400s ({"error": "..."}), else the generic error message. */
export function getPivotErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: string } | undefined)?.error
    if (serverMessage) return serverMessage
  }
  return error instanceof Error ? error.message : 'Unknown error'
}

// ---------------------------------------------------------------------------
// Generic hooks
// ---------------------------------------------------------------------------

const REPORT_STALE_MS = 5 * 60 * 1000
const REPORT_GC_MS = 30 * 60 * 1000
const META_STALE_MS = 10 * 60 * 1000

/**
 * Run any preset. `enabled` is combined with "current range is set".
 * keepPreviousData keeps the old table on screen while a filter/date change
 * refetches (check `isPlaceholderData` to dim it).
 */
export function usePivotReportQuery<TResponse = PivotReportResponse>(
  presetKey: PivotPresetKey,
  query: PivotQuery,
  enabled = true,
) {
  const params = buildPivotParams(query)
  return useQuery({
    queryKey: ['pivot-reports', presetKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get<TResponse>(`/api/v1/pivot-reports/${presetKey}/`, { params })
      return data
    },
    enabled: enabled && !!query.current.startDate && !!query.current.endDate,
    placeholderData: keepPreviousData,
    staleTime: REPORT_STALE_MS,
    gcTime: REPORT_GC_MS,
  })
}

/** Describe a preset: which filters/slot/tag types the UI should render. */
export function usePivotMetaQuery(presetKey: PivotPresetKey, enabled = true) {
  return useQuery({
    queryKey: ['pivot-reports', 'meta', presetKey],
    queryFn: async () => {
      const { data } = await apiClient.get<PivotPresetMeta>(`/api/v1/pivot-reports/meta/${presetKey}/`)
      return data
    },
    enabled,
    staleTime: META_STALE_MS,
    gcTime: REPORT_GC_MS,
  })
}

// ---------------------------------------------------------------------------
// Per-tab wrappers (same endpoints as before; signature is now (query, enabled))
// ---------------------------------------------------------------------------

/** Month > date, SP+SB+SD combined. Backend ignores comparison for this preset. */
export const useSummaryQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<SummaryResponse>('summary', query, enabled)

/** Brand > target > campaign. group_by defaults to the "competitor-brand" TagType if present. */
export const useCompPtMomQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<CompPtMomResponse>('comp-pt-mom', query, enabled)

/** Any tag > target > campaign. No default slug: waits until query.groupBy is set. */
export const useTargetBreakdownQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<TargetBreakdownResponse>('target-breakdown', query, enabled && !!query.groupBy)

/** Targets grouped by one tag; group_by defaults to the "target-type" TagType if present. */
export const useTargetingLevelMomQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<TargetingLevelMomResponse>('targeting-mom', query, enabled)

/** Ad type (SP / SB / SBV / SD) > campaign. */
export const useAdTypeMoMQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<AdTypeMoMResponse>('ad-type-mom', query, enabled)

/** Placement > campaign; returns sp_tree + sb_tree + section_totals. */
export const usePlacementMoMQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<PlacementMoMResponse>('placement-mom', query, enabled)

/** Tag > customer search term; group_by defaults to "target-type". */
export const useSearchTermMomQuery = (query: PivotQuery, enabled = true) =>
  usePivotReportQuery<SearchTermMomResponse>('search-term-mom', query, enabled)