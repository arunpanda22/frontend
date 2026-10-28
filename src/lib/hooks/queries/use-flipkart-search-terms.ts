'use client'

/**
 * use-flipkart-search-terms.ts
 *
 * React Query hooks for the Flipkart Search Terms page: one hook per backend endpoint, so the summary
 * cards, the classification chart, the table, the top-terms charts and the detail modal each load, fail
 * and refetch on their own. Same conventions as use-flipkart-dashboard.ts:
 *   - queryKey = fixed prefix + endpoint name + the FULL options object, so changing the date range, the
 *     ad account, the campaign filter, min_clicks, or any table param refetches automatically.
 *   - `enabled` stays false until both dates are present (the backend answers 400 without them).
 *   - staleTime 5 min, gcTime 30 min.
 *
 * TABLE: uses keepPreviousData so the old page stays on screen (dimmed by the component) while the next
 * page / sort / search loads, instead of flashing a spinner on every click. This relies on React Query v5
 * (the project already uses `gcTime`).
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  flipkartSearchTermsService,
  type FlipkartSearchTermDetailParams,
  type FlipkartSearchTermsParams,
  type FlipkartSearchTermsTableParams,
  type FlipkartSearchTermsTopParams,
} from '@/lib/api/services/flipkart-search-terms.service'

export const flipkartSearchTermsQueryKeys = {
  all: ['flipkart-search-terms'] as const,
  summary: (options: FlipkartSearchTermsParams) =>
    ['flipkart-search-terms', 'summary', options] as const,
  table: (options: FlipkartSearchTermsTableParams) =>
    ['flipkart-search-terms', 'table', options] as const,
  top: (options: FlipkartSearchTermsTopParams) =>
    ['flipkart-search-terms', 'top', options] as const,
  detail: (options: FlipkartSearchTermDetailParams) =>
    ['flipkart-search-terms', 'detail', options] as const,
}

const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const GC_TIME = 30 * 60 * 1000 // 30 minutes

/** Shared `enabled` rule: both dates are required by the backend. */
function hasDates(options: { start_date: string; end_date: string }, enabled: boolean) {
  return enabled && !!options.start_date && !!options.end_date
}

// Summary cards + classification chart
export function useFlipkartSearchTermsSummary(options: FlipkartSearchTermsParams, enabled = true) {
  return useQuery({
    queryKey: flipkartSearchTermsQueryKeys.summary(options),
    queryFn: () => flipkartSearchTermsService.getSummary(options),
    enabled: hasDates(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// Server-paginated table (search / classification filter / sort / page all live in `options`)
export function useFlipkartSearchTermsTable(options: FlipkartSearchTermsTableParams, enabled = true) {
  return useQuery({
    queryKey: flipkartSearchTermsQueryKeys.table(options),
    queryFn: () => flipkartSearchTermsService.getTable(options),
    enabled: hasDates(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  })
}

// Top terms by revenue + top wasted terms
export function useFlipkartSearchTermsTop(options: FlipkartSearchTermsTopParams, enabled = true) {
  return useQuery({
    queryKey: flipkartSearchTermsQueryKeys.top(options),
    queryFn: () => flipkartSearchTermsService.getTop(options),
    enabled: hasDates(options, enabled),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

// One term's detail (modal). Disabled until a term is selected, so the modal costs nothing while closed.
export function useFlipkartSearchTermDetail(options: FlipkartSearchTermDetailParams, enabled = true) {
  return useQuery({
    queryKey: flipkartSearchTermsQueryKeys.detail(options),
    queryFn: () => flipkartSearchTermsService.getDetail(options),
    enabled: hasDates(options, enabled) && !!options.term,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}