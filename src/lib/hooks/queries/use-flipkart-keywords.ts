'use client'

/**
 * React Query hooks for the Flipkart Keywords page.
 *
 * Place at: src/lib/hooks/queries/use-flipkart-keywords.ts
 *
 * One hook per endpoint, so every component of the page loads, fails and refetches on its own (same principle as
 * the backend: one view per component). Calling the same hook with the same params from two components costs ONE
 * request, because React Query dedupes by query key (the summary cards and the funnel share the summary query).
 *
 * `enabled` is false until both dates exist, so nothing is fetched with an empty range. The campaign detail and the
 * keyword table take an extra `enabled` flag: the campaign card passes true only while it is expanded, which is what
 * makes the cards lazy.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  flipkartKeywordsService,
  type KeywordBaseParams,
  type KeywordCampaignDetailParams,
  type KeywordCampaignsParams,
  type KeywordTableParams,
} from '@/lib/api/services/flipkart-keywords.service'

export const flipkartKeywordQueryKeys = {
  all: ['flipkart', 'keywords'] as const,
  summary: (params: KeywordBaseParams) => ['flipkart', 'keywords', 'summary', params] as const,
  trend: (params: KeywordBaseParams) => ['flipkart', 'keywords', 'trend', params] as const,
  campaigns: (params: KeywordCampaignsParams) => ['flipkart', 'keywords', 'campaigns', params] as const,
  campaignDetail: (params: KeywordCampaignDetailParams) =>
    ['flipkart', 'keywords', 'campaign-detail', params] as const,
  table: (params: KeywordTableParams) => ['flipkart', 'keywords', 'table', params] as const,
}

const hasDates = (params: KeywordBaseParams) => !!params.start_date && !!params.end_date

/** Summary cards + funnel (account-wide). */
export function useKeywordSummary(params: KeywordBaseParams, enabled = true) {
  return useQuery({
    queryKey: flipkartKeywordQueryKeys.summary(params),
    queryFn: () => flipkartKeywordsService.getSummary(params),
    enabled: enabled && hasDates(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/** Overall monthly trend (account-wide). */
export function useKeywordTrend(params: KeywordBaseParams, enabled = true) {
  return useQuery({
    queryKey: flipkartKeywordQueryKeys.trend(params),
    queryFn: () => flipkartKeywordsService.getTrend(params),
    enabled: enabled && hasDates(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/** Campaign card headers. Keeps the previous list on screen while a new search / sort loads. */
export function useKeywordCampaigns(params: KeywordCampaignsParams, enabled = true) {
  return useQuery({
    queryKey: flipkartKeywordQueryKeys.campaigns(params),
    queryFn: () => flipkartKeywordsService.getCampaigns(params),
    enabled: enabled && hasDates(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/** Body of one opened campaign card. Pass enabled = isExpanded so closed cards cost nothing. */
export function useKeywordCampaignDetail(params: KeywordCampaignDetailParams, enabled = true) {
  return useQuery({
    queryKey: flipkartKeywordQueryKeys.campaignDetail(params),
    queryFn: () => flipkartKeywordsService.getCampaignDetail(params),
    enabled: enabled && hasDates(params) && !!params.campaign_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/** Keyword table of an opened card. Keeps the previous page on screen while the next one loads. */
export function useKeywordTable(params: KeywordTableParams, enabled = true) {
  return useQuery({
    queryKey: flipkartKeywordQueryKeys.table(params),
    queryFn: () => flipkartKeywordsService.getTable(params),
    enabled: enabled && hasDates(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}