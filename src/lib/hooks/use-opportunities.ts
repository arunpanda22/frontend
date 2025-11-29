// lib/hooks/queries/use-opportunities.ts
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

// ==================== ASIN SUGGEST TYPES ====================

export interface KeywordRecommendation {
  keyword: string;
  matchType: string;
  bid: number;
  rank: number;
  suggestedBid_rangeStart: number;
  suggestedBid_rangeMedian: number;
  suggestedBid_rangeEnd: number;
  asin: string;
  region: string;
  valid_data_count: number;
  average_rank: number;
  average_bid_lower_range: number;
  average_bid_higher_range: number;
  average_suggested_bid: number;
}

export interface AsinSuggestResponse {
  keywords: KeywordRecommendation[];
  total_keywords: number;
  asins: string[];
  statusCode: number;
}

export interface AsinSuggestRequest {
  asin: string;
}

// ==================== NGRAM TYPES ====================

export interface NgramKeyword {
  ASIN: string;
  Product_Name: string;
  Keyword: string;
  Keyword_Type: string;
  ACOS_Comment: string;
  ACOS_Value: number | string;
  CTR_Comment: string;
  CTR_Value: number;
  Conversion_Comment: string;
  Conversion_Value: number;
  impressions: number;
  clicks: number;
  cost: number;
  sales_30d: number;
  purchases_30d: number;
  Units: number;
  Classification: string;
  match_type: string;
}

export interface NgramSummary {
  total_keywords: number;
  positive_count: number;
  negative_count: number;
  positive_bmm_count: number;
  positive_exact_count: number;
  negative_phrase_count: number;
  negative_exact_count: number;
}

export interface NgramResponse {
  ngram_positive: NgramKeyword[];
  ngram_negative: NgramKeyword[];
  summary: NgramSummary;
}

// ==================== SQP TYPES ====================

export interface SQPSearchQuery {
  asin: string;
  search_query: string;
  total_click_count: number;
  asin_click_count: number;
  total_median_click_price: number;
  asin_median_click_price: number;
  total_purchase_count: number;
  asin_purchase_count: number;
  total_conversion: number;
  asin_conversion: number;
  BROAD: string;
  PHRASE: string;
  EXACT: string;
  "Conversion > Market": boolean;
  keyword_exists: boolean;
}

export interface SQPOpportunitiesResponse {
  search_queries: SQPSearchQuery[];
  top_asins: string[];
  metadata: {
    date_range: {
      start_date: string;
      end_date: string;
    };
    total_queries: number;
    total_asins: number;
  };
}

// ==================== DEDUP TYPES ====================

export interface DedupResult {
  asin: string;
  keyword: string;
  exact: number;
  broad: number;
  phrase: number;
  has_duplicates: boolean;
}

export interface DedupResponse {
  results: DedupResult[];
  asin: string;
  keywords_checked: number;
  total_duplicates: number;
}

export interface DedupRequest {
  asin: string;
  keywords: string[];
}

// ==================== COMPETIRANK TYPES ====================

export interface CompetiRankRecord {
  department_name: string;
  search_term: string;
  search_frequency_rank: number;
  clicked_asin: string;
  clicked_item_name: string;
  click_share_rank: number;
  click_share: number;
  conversion_share: number;
  report_period: string;
  marketplace_id: string;
}

export interface CompetiRankSummary {
  total_records: number;
  unique_asins: number;
  unique_search_terms: number;
  asins_queried: string[];
  marketplace_id: string | null;
  report_period: string | null;
}

export interface CompetiRankResponse {
  data: CompetiRankRecord[];
  summary: CompetiRankSummary;
}

export interface CompetiRankRequest {
  asins?: string;
  marketplace_id?: string;
  report_period?: string;
  limit?: number;
}

// ==================== KEYWORD CLUSTER TYPES ====================

export interface KeywordClusterRecord {
  department_name: string;
  search_term: string;
  search_frequency_rank: number;
  clicked_asin: string;
  clicked_item_name: string;
  click_share_rank: number;
  click_share: number;
  conversion_share: number;
  report_period: string;
  marketplace_id: string;
}

export interface KeywordClusterSummary {
  total_records: number;
  unique_search_terms: number;
  unique_asins: number;
  search_words: string[];
  match_mode: string;
  marketplace_id: string | null;
  report_period: string | null;
}

export interface KeywordClusterResponse {
  data: KeywordClusterRecord[];
  summary: KeywordClusterSummary;
}

export interface KeywordClusterRequest {
  words: string;
  match_mode?: 'all' | 'any';
  marketplace_id?: string;
  report_period?: string;
  limit?: number;
}

// ==================== COMPETING ASINS TYPES ====================

export interface CompetingAsinRecord {
  department_name: string;
  search_term: string;
  search_frequency_rank: number;
  clicked_asin: string;
  clicked_item_name: string;
  click_share_rank: number;
  click_share: number;
  conversion_share: number;
  report_period: string;
  marketplace_id: string;
}

export interface TopCompetitor {
  asin: string;
  occurrence_count: number;
  avg_click_share: number;
}

export interface CompetingAsinsSummary {
  total_records: number;
  searched_asins: string[];
  competing_asins_count: number;
  shared_search_terms_count: number;
  marketplace_id: string | null;
  report_period: string | null;
}

export interface CompetingAsinsResponse {
  data: CompetingAsinRecord[];
  summary: CompetingAsinsSummary;
  top_competitors: TopCompetitor[];
}

export interface CompetingAsinsRequest {
  asins?: string;
  marketplace_id?: string;
  report_period?: string;
  limit?: number;
  min_click_share?: number;
}

// ==================== QUERY KEYS ====================

export const opportunitiesQueryKeys = {
  // ASIN Suggest
  asinSuggest: {
    all: ["asin-suggest-opportunities"] as const,
    list: (asin: string | null) =>
      ["asin-suggest-opportunities", "list", asin] as const,
  },
  // Ngram
  ngram: {
    all: ["ngram-opportunities"] as const,
    list: (targetAcos: number | null) =>
      ["ngram-opportunities", "list", targetAcos] as const,
  },
  // SQP
  sqp: {
    all: ["sqp-opportunities"] as const,
    list: () => ["sqp-opportunities", "list"] as const,
  },
  // Dedup
  dedup: {
    all: ["dedup-opportunities"] as const,
    list: (asin: string | null, keywords: string[] | null) =>
      ["dedup-opportunities", "list", asin, keywords] as const,
  },
  // CompetiRank
  competiRank: {
    all: ["competirank-data"] as const,
    list: (params: CompetiRankRequest) =>
      ["competirank-data", "list", params] as const,
  },
  // Keyword Cluster
  keywordCluster: {
    all: ["keyword-cluster"] as const,
    list: (params: KeywordClusterRequest) =>
      ["keyword-cluster", "list", params] as const,
  },
  // Competing ASINs
  competingAsins: {
    all: ["competing-asins"] as const,
    list: (params: CompetingAsinsRequest) =>
      ["competing-asins", "list", params] as const,
  },
};

// ==================== API FUNCTIONS ====================

async function fetchAsinSuggestOpportunities(
  request: AsinSuggestRequest
): Promise<AsinSuggestResponse> {
  const { data } = await apiClient.post(
    "/api/v1/dashboard-api/keyword-recommendations/",
    request
  );
  return data;
}

async function fetchNgramOpportunities(
  targetAcos: number
): Promise<NgramResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/ngram-opportunities/", {
    params: { target_acos: targetAcos },
  });
  return data;
}

async function fetchSQPOpportunities(): Promise<SQPOpportunitiesResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/sqp-opportunities/");
  return data;
}

async function fetchDedupOpportunities(
  request: DedupRequest
): Promise<DedupResponse> {
  const { data } = await apiClient.post(
    "/api/v1/dashboard-api/keyword-dedup-check/",
    request
  );
  return data;
}

async function fetchCompetiRankData(
  params: CompetiRankRequest
): Promise<CompetiRankResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/competirank-data/", {
    params,
  });
  return data;
}

async function fetchKeywordCluster(
  params: KeywordClusterRequest
): Promise<KeywordClusterResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/keyword-cluster/", {
    params,
  });
  return data;
}

async function fetchCompetingAsins(
  params: CompetingAsinsRequest
): Promise<CompetingAsinsResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/competing-asins/", {
    params,
  });
  return data;
}

// ==================== HOOKS ====================

// 1. ASIN Suggest Hook
export const useAsinSuggestOpportunities = (asin: string | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.asinSuggest.list(asin),
    queryFn: async () => {
      if (!asin) {
        throw new Error("ASIN is required");
      }
      return fetchAsinSuggestOpportunities({ asin });
    },
    enabled: isEnabled && asin !== null && asin.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    if (asin && asin.trim().length > 0) {
      setIsEnabled(true);
      query.refetch();
    }
  };

  return {
    data: query.data as AsinSuggestResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// 2. Ngram Hook
export const useNgramOpportunities = (targetAcos: number | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.ngram.list(targetAcos),
    queryFn: async () => {
      if (targetAcos === null) {
        throw new Error("Target ACOS is required");
      }
      return fetchNgramOpportunities(targetAcos);
    },
    enabled: isEnabled && targetAcos !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    if (targetAcos !== null) {
      setIsEnabled(true);
      query.refetch();
    }
  };

  return {
    data: query.data as NgramResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// 3. SQP Hook
export function useSQPOpportunities() {
  return useQuery({
    queryKey: opportunitiesQueryKeys.sqp.list(),
    queryFn: fetchSQPOpportunities,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// 4. Dedup Hook
export const useDedupOpportunities = (
  asin: string | null,
  keywords: string[] | null
) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.dedup.list(asin, keywords),
    queryFn: async () => {
      if (!asin || !keywords || keywords.length === 0) {
        throw new Error("ASIN and keywords are required");
      }
      return fetchDedupOpportunities({ asin, keywords });
    },
    enabled: isEnabled && asin !== null && keywords !== null && keywords.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    if (asin && keywords && keywords.length > 0) {
      setIsEnabled(true);
      query.refetch();
    }
  };

  return {
    data: query.data as DedupResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// 5. CompetiRank Hook
export const useCompetiRankData = (params: CompetiRankRequest) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.competiRank.list(params),
    queryFn: async () => {
      return fetchCompetiRankData(params);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    setIsEnabled(true);
    query.refetch();
  };

  return {
    data: query.data as CompetiRankResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// 6. Keyword Cluster Hook
export const useKeywordCluster = (params: KeywordClusterRequest) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.keywordCluster.list(params),
    queryFn: async () => {
      if (!params.words || params.words.trim().length === 0) {
        throw new Error("Words parameter is required");
      }
      return fetchKeywordCluster(params);
    },
    enabled: isEnabled && params.words !== undefined && params.words.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    if (params.words && params.words.trim().length > 0) {
      setIsEnabled(true);
      query.refetch();
    }
  };

  return {
    data: query.data as KeywordClusterResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// 7. Competing ASINs Hook
export const useCompetingAsins = (params: CompetingAsinsRequest) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.competingAsins.list(params),
    queryFn: async () => {
      return fetchCompetingAsins(params);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    setIsEnabled(true);
    query.refetch();
  };

  return {
    data: query.data as CompetingAsinsResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// ==================== HELPER FUNCTIONS ====================

// SQP Helpers
export const getMatchTypeStatus = (query: SQPSearchQuery) => {
  return {
    broad: query.BROAD !== "doesn't exist",
    phrase: query.PHRASE !== "doesn't exist",
    exact: query.EXACT !== "doesn't exist",
  };
};

export const getConversionDifference = (query: SQPSearchQuery): number => {
  return query.asin_conversion - query.total_conversion;
};

export const getPriceDifference = (query: SQPSearchQuery): number => {
  return query.asin_median_click_price - query.total_median_click_price;
};

// CompetiRank Helpers
export const filterByMarketplace = (
  records: CompetiRankRecord[],
  marketplaceId: string
) => {
  return records.filter((record) => record.marketplace_id === marketplaceId);
};

export const filterByReportPeriod = (
  records: CompetiRankRecord[],
  reportPeriod: string
) => {
  return records.filter((record) => record.report_period === reportPeriod);
};

export const getTopSearchTerms = (
  records: CompetiRankRecord[],
  limit: number = 10
) => {
  return records
    .sort((a, b) => a.search_frequency_rank - b.search_frequency_rank)
    .slice(0, limit);
};

// Competing ASINs Helpers
export const getStrongCompetitors = (
  competitors: TopCompetitor[],
  minOccurrence: number = 5
) => {
  return competitors.filter((comp) => comp.occurrence_count >= minOccurrence);
};

export const getHighClickShareCompetitors = (
  competitors: TopCompetitor[],
  minClickShare: number = 0.1
) => {
  return competitors.filter((comp) => comp.avg_click_share >= minClickShare);
};

// Keyword Cluster Helpers
export const groupByDepartment = (records: KeywordClusterRecord[]) => {
  return records.reduce((acc, record) => {
    const dept = record.department_name;
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(record);
    return acc;
  }, {} as Record<string, KeywordClusterRecord[]>);
};

export const getUniqueSearchTerms = (records: KeywordClusterRecord[]) => {
  return [...new Set(records.map((record) => record.search_term))];
};