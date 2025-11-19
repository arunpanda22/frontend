// lib/hooks/queries/use-asin-suggest-opportunities.ts
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

// ==================== TYPES ====================

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

// ==================== QUERY KEYS ====================

export const asinSuggestQueryKeys = {
  all: ["asin-suggest-opportunities"] as const,
  list: (asin: string | null) =>
    [...asinSuggestQueryKeys.all, "list", asin] as const,
};

const ASIN_SUGGEST_QUERY_KEY = (asin: string | null) =>
  asinSuggestQueryKeys.list(asin);

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

// ==================== HOOK ====================

export const useAsinSuggestOpportunities = (asin: string | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: ASIN_SUGGEST_QUERY_KEY(asin),
    queryFn: async () => {
      // runtime guard — should not be invoked when asin is null
      if (!asin) {
        throw new Error("ASIN is required");
      }
      return fetchAsinSuggestOpportunities({ asin });
    },
    enabled: isEnabled && asin !== null && asin.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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