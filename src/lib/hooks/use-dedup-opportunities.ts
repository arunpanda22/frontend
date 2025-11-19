// lib/hooks/queries/use-dedup-opportunities.ts
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

// ==================== TYPES ====================

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

// ==================== QUERY KEYS ====================

export const dedupOpportunitiesQueryKeys = {
  all: ["dedup-opportunities"] as const,
  list: (asin: string | null, keywords: string[] | null) =>
    [...dedupOpportunitiesQueryKeys.all, "list", asin, keywords] as const,
};

const DEDUP_OPPORTUNITIES_QUERY_KEY = (
  asin: string | null,
  keywords: string[] | null
) => dedupOpportunitiesQueryKeys.list(asin, keywords);

// ==================== API FUNCTIONS ====================

async function fetchDedupOpportunities(
  request: DedupRequest
): Promise<DedupResponse> {
  const { data } = await apiClient.post(
    "/api/v1/dashboard-api/keyword-dedup-check/",
    request
  );
  return data;
}

// ==================== HOOK ====================

export const useDedupOpportunities = (
  asin: string | null,
  keywords: string[] | null
) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const query = useQuery({
    queryKey: DEDUP_OPPORTUNITIES_QUERY_KEY(asin, keywords),
    queryFn: async () => {
      // runtime guard — should not be invoked when asin or keywords are null
      if (!asin || !keywords || keywords.length === 0) {
        throw new Error("ASIN and keywords are required");
      }
      return fetchDedupOpportunities({ asin, keywords });
    },
    enabled: isEnabled && asin !== null && keywords !== null && keywords.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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