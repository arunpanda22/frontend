// lib/hooks/queries/use-ngram-opportunities.ts
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

// ==================== TYPES ====================

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

// ==================== QUERY KEYS ====================

export const ngramOpportunitiesQueryKeys = {
  all: ["ngram-opportunities"] as const,
  list: (targetAcos: number | null) =>
    [...ngramOpportunitiesQueryKeys.all, "list", targetAcos] as const,
};

const NGRAM_OPPORTUNITIES_QUERY_KEY = (targetAcos: number | null) =>
  ngramOpportunitiesQueryKeys.list(targetAcos);

// ==================== API FUNCTIONS ====================

async function fetchNgramOpportunities(
  targetAcos: number
): Promise<NgramResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/ngram-opportunities/", {
    params: { target_acos: targetAcos },
  });
  return data;
}

// ==================== HOOK ====================

export const useNgramOpportunities = (targetAcos: number | null) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: NGRAM_OPPORTUNITIES_QUERY_KEY(targetAcos),
    queryFn: async () => {
      // runtime guard — should not be invoked when targetAcos is null because enabled will be false
      if (targetAcos === null) {
        throw new Error("Target ACOS is required");
      }
      return fetchNgramOpportunities(targetAcos);
    },
    enabled: isEnabled && targetAcos !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (optional but consistent with other hook)
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
