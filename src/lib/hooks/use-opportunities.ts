// lib/hooks/queries/use-opportunities.ts
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

export interface AsinListItem {
  asin: string;
  rank: number;
  max_gms: number;
  product_name?: string; // from FBAEnhancedListingData.item_name
  image_url?: string;    // image_url_catalog ?? image_url_original
}

export interface AllAsinsResponse {
  count: number;
  results: AsinListItem[];
}

export interface AllAsinsRequest {
  days_back?: number;
  search?: string;
  limit?: number;
}

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
  BROAD: string;       
  PHRASE: string;
  EXACT: string;
  keyword_exists: boolean;
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
  keyword_type: "positive" | "negative";
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
  asin: string;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  items: NgramKeyword[];
  summary: NgramSummary;
}

export interface NgramRequest {
  asin: string;
  page?: number;
  page_size?: number;
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
  search_query_volume: number;
  total_query_impression_count: number;
  asin_impression_count: number;
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
  asins: string[];
  keywords_checked: number;
  total_duplicates: number;
}

export interface DedupRequestSingle {
  asin: string;
  keywords: string[];
}

export interface DedupRequestMultiple {
  asin_keywords: Record<string, string[]>;
}

export type DedupRequest = DedupRequestSingle | DedupRequestMultiple;

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

export interface ProductRecommendation {
  "Top converting targets": string | null;
  "Similar items with low ratings and reviews": string | null;
  "Similar items (frequently viewed together)": string | null;
  Exact:          string;  
  Expanded:       string;  
  keyword_exists: boolean;
}

export interface ProductRecommendationsResponse {
  recommendations: ProductRecommendation[];  
  total_recommendations: number;
  asin: string;
  statusCode: number;
}

export interface AnnotatedAsinRecommendation {
  keyword: string;  
  BROAD: string;
  PHRASE: string;
  EXACT: string;
  keyword_exists: boolean;
}

export interface ProductRecommendationsRequest {
  asin: string;
}

// ==================== QUERY KEYS ====================

export const asinQueryKeys = {
  all: ["all-asins"] as const,
  list: (params: AllAsinsRequest) => ["all-asins", "list", params] as const,
};

export const opportunitiesQueryKeys = {
  asinSuggest: {
    all: ["asin-suggest-opportunities"] as const,
    list: (asin: string | null) =>
      ["asin-suggest-opportunities", "list", asin] as const,
  },
  ngram: {
    all: ["ngram-opportunities"] as const,
    list: (params: NgramRequest) => ["ngram-opportunities", "list", params] as const,
  },
  sqp: {
    all: ["sqp-opportunities"] as const,
    list: () => ["sqp-opportunities", "list"] as const,
  },
  dedup: {
    all: ["opportunities", "dedup"] as const,
    list: (request: DedupRequest | null) =>
      ["opportunities", "dedup", "list", request] as const,
  },
  competiRank: {
    all: ["competirank-data"] as const,
    list: (params: CompetiRankRequest) =>
      ["competirank-data", "list", params] as const,
  },
  keywordCluster: {
    all: ["keyword-cluster"] as const,
    list: (params: KeywordClusterRequest) =>
      ["keyword-cluster", "list", params] as const,
  },
  competingAsins: {
    all: ["competing-asins"] as const,
    list: (params: CompetingAsinsRequest) =>
      ["competing-asins", "list", params] as const,
  },
  productRecommendations: {
    all: ["product-recommendations"] as const,
    list: (asin: string | null) =>
      ["product-recommendations", "list", asin] as const,
  },
};

// ==================== API FUNCTIONS ====================

async function fetchAllAsins(params: AllAsinsRequest): Promise<AllAsinsResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/all-asins-list/", {
    params,
  });
  return data;
}

async function fetchAsinSuggestOpportunities(
  request: AsinSuggestRequest
): Promise<AsinSuggestResponse> {
  const { data } = await apiClient.post(
    "/api/v1/dashboard-api/keyword-recommendations/",
    request
  );
  return data;
}

// Target ACOS is read from the user's account settings on the backend —
// no parameter is sent from the frontend.
async function fetchNgramOpportunities(asin: string): Promise<NgramResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/ngram-opportunities/", {
    params: { asin, page: 1, page_size: 5000 },
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

async function fetchProductRecommendations(
  request: ProductRecommendationsRequest
): Promise<ProductRecommendationsResponse> {
  const { data } = await apiClient.post(
    "/api/v1/dashboard-api/product-recommendations/",
    request
  );
  return data;
}

// ==================== HOOKS ====================

export function useAllAsins(params: AllAsinsRequest = {}) {
  return useQuery({
    queryKey: asinQueryKeys.list(params),
    queryFn: () => fetchAllAsins(params),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}

// 1. ASIN Suggest Hook
export const useAsinSuggestOpportunities = (asin: string | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.asinSuggest.list(asin),
    queryFn: async () => {
      if (!asin) throw new Error("ASIN is required");
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

// 2. Ngram Hook — target ACOS comes from the user's account settings on the backend
export const useNgramOpportunities = (asin: string | null) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [data, setData] = useState<{ items: NgramKeyword[]; summary: NgramSummary } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!asin || asin.trim().length === 0) return;
    setIsEnabled(true);
    setIsLoading(true);
    setFetchError(null);

    try {
      const result = await fetchNgramOpportunities(asin);
      setData({ items: result.items, summary: result.summary });
    } catch (e) {
      setFetchError(e as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data: data ?? undefined,
    isLoading,
    error: fetchError,
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
export const useDedupOpportunities = (requestData: DedupRequest | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.dedup.list(requestData),
    queryFn: async () => {
      if (!requestData) throw new Error("Request data is required");

      if ('asin_keywords' in requestData) {
        if (!requestData.asin_keywords || Object.keys(requestData.asin_keywords).length === 0) {
          throw new Error("At least one ASIN with keywords is required");
        }
      } else {
        if (!requestData.asin || !requestData.keywords || requestData.keywords.length === 0) {
          throw new Error("ASIN and keywords are required");
        }
      }

      return fetchDedupOpportunities(requestData);
    },
    enabled: isEnabled && requestData !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const fetchData = () => {
    if (requestData) {
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
    queryFn: () => fetchCompetiRankData(params),
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
    queryFn: () => fetchCompetingAsins(params),
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

// 8. Product Recommendations Hook
export const useProductRecommendations = (asin: string | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: opportunitiesQueryKeys.productRecommendations.list(asin),
    queryFn: async () => {
      if (!asin) throw new Error("ASIN is required");
      return fetchProductRecommendations({ asin });
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
    data: query.data as ProductRecommendationsResponse | undefined,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    fetchData,
    isEnabled,
  };
};

// ==================== HELPER FUNCTIONS ====================

export const getMatchTypeStatus = (query: SQPSearchQuery) => ({
  broad: query.BROAD !== "doesn't exist",
  phrase: query.PHRASE !== "doesn't exist",
  exact: query.EXACT !== "doesn't exist",
});

export const getConversionDifference = (query: SQPSearchQuery): number =>
  query.asin_conversion - query.total_conversion;

export const getPriceDifference = (query: SQPSearchQuery): number =>
  query.asin_median_click_price - query.total_median_click_price;

export const filterByMarketplace = (
  records: CompetiRankRecord[],
  marketplaceId: string
) => records.filter((r) => r.marketplace_id === marketplaceId);

export const filterByReportPeriod = (
  records: CompetiRankRecord[],
  reportPeriod: string
) => records.filter((r) => r.report_period === reportPeriod);

export const getTopSearchTerms = (
  records: CompetiRankRecord[],
  limit: number = 10
) => records.sort((a, b) => a.search_frequency_rank - b.search_frequency_rank).slice(0, limit);

export const getStrongCompetitors = (
  competitors: TopCompetitor[],
  minOccurrence: number = 5
) => competitors.filter((c) => c.occurrence_count >= minOccurrence);

export const getHighClickShareCompetitors = (
  competitors: TopCompetitor[],
  minClickShare: number = 0.1
) => competitors.filter((c) => c.avg_click_share >= minClickShare);

export const groupByDepartment = (records: KeywordClusterRecord[]) =>
  records.reduce((acc, record) => {
    const dept = record.department_name;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(record);
    return acc;
  }, {} as Record<string, KeywordClusterRecord[]>);

export const getUniqueSearchTerms = (records: KeywordClusterRecord[]) =>
  [...new Set(records.map((r) => r.search_term))];

export const extractAllAsins = (recommendations: ProductRecommendation[]): string[] => {
  const asins = new Set<string>();
  recommendations.forEach((rec) => {
    if (rec["Top converting targets"]) asins.add(rec["Top converting targets"]);
    if (rec["Similar items with low ratings and reviews"]) asins.add(rec["Similar items with low ratings and reviews"]);
    if (rec["Similar items (frequently viewed together)"]) asins.add(rec["Similar items (frequently viewed together)"]);
  });
  return Array.from(asins).filter(Boolean);
};

export const getRecommendationsByCategory = (recommendations: ProductRecommendation[]) => ({
  topConverting: recommendations.map((r) => r["Top converting targets"]).filter(Boolean) as string[],
  lowRatings: recommendations.map((r) => r["Similar items with low ratings and reviews"]).filter(Boolean) as string[],
  frequentlyViewed: recommendations.map((r) => r["Similar items (frequently viewed together)"]).filter(Boolean) as string[],
});

export const countRecommendationTypes = (recommendations: ProductRecommendation[]) => {
  let topConvertingCount = 0;
  let lowRatingsCount = 0;
  let frequentlyViewedCount = 0;
  recommendations.forEach((rec) => {
    if (rec["Top converting targets"]) topConvertingCount++;
    if (rec["Similar items with low ratings and reviews"]) lowRatingsCount++;
    if (rec["Similar items (frequently viewed together)"]) frequentlyViewedCount++;
  });
  return { topConvertingCount, lowRatingsCount, frequentlyViewedCount };
};