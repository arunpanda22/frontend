// lib/hooks/queries/use-sqp-opportunities.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";

// ==================== TYPES ====================

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

// ==================== QUERY KEYS ====================

export const sqpOpportunitiesQueryKeys = {
  all: ["sqp-opportunities"] as const,
  list: () => [...sqpOpportunitiesQueryKeys.all, "list"] as const,
};

const SQP_OPPORTUNITIES_QUERY_KEY = sqpOpportunitiesQueryKeys.list();

// ==================== API FUNCTIONS ====================

async function fetchSQPOpportunities(): Promise<SQPOpportunitiesResponse> {
  const { data } = await apiClient.get("/api/v1/dashboard-api/sqp-opportunities/");
  return data;
}

// ==================== HOOK ====================

export function useSQPOpportunities() {
  return useQuery({
    queryKey: SQP_OPPORTUNITIES_QUERY_KEY,
    queryFn: fetchSQPOpportunities,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// ==================== HELPER FUNCTIONS ====================

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
