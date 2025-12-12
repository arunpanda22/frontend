"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api/config";
import { useAdsOptimizerStore, PushResultData } from "./use-ads-optimizer-store";
import type { OptimizationKey } from "@/app/dashboard/ads-optimizer/lib/types";

const BID_PLACEMENT_LINKS: Record<OptimizationKey, OptimizationKey | null> = {
  sp_bid: "sp_placement",
  sp_placement: "sp_bid",

  sb_bid: "sb_placement",
  sb_placement: "sb_bid",

  // No linking for these:
  sp_budget: null,
  sb_budget: null,
  sd_budget: null,

  sd_bid: null,
  sp_new_campaigns: null,
  sb_new_campaigns: null,

  sp_negatives: null,
  sb_negatives: null,
};

interface PushResult {
  success: boolean;
  data?: any;
  error?: string;
  result?: PushResultData; // Extracted result for the main category
}

export function usePushOptimizations() {
  const {
    getCategoryData,
    markCategoryAsPushed,
    clearCategoryEdits,
    getAllCategoriesData,
  } = useAdsOptimizerStore();

  /**
   * Extract standardized result from backend response
   */
  const extractPushResult = (response: any, category: OptimizationKey): PushResultData | undefined => {
    console.log('🔍 extractPushResult called with:', { 
      category, 
      responseKeys: Object.keys(response),
      responseCategory: response.category,
      responseResults: response.results ? Object.keys(response.results) : 'none'
    });

    if (response.results && response.results[category]) {
      console.log(`✅ Found result for ${category}:`, response.results[category]);
    } else {
      console.log(`❌ No result found for ${category}`, response.results);
    }
    try {
      // For single category push
      if (response.category === category) {
        return {
          push_id: response.push_id || "",
          total_items: response.total_items || 0,
          successful: response.successful || 0,
          failed: response.failed || 0,
          duplicates: response.duplicates,
          errors: response.errors,
          success_rate: response.success_rate || "0.00%",
          timestamp: response.timestamp || new Date().toISOString(),
          details: response.details,
        };
      }

      // For multi-category push (results object)
      if (response.results && response.results[category]) {
        const catResult = response.results[category];
        return {
          push_id: catResult.push_id || "",
          total_items: catResult.total_items || 0,
          successful: catResult.successful || 0,
          failed: catResult.failed || 0,
          duplicates: catResult.duplicates,
          errors: catResult.errors,
          success_rate: catResult.success_rate || "0.00%",
          timestamp: catResult.timestamp || new Date().toISOString(),
          details: catResult.details,
        };
      }

      return undefined;
    } catch (error) {
      console.error("Error extracting push result:", error);
      return undefined;
    }
  };

  /**
   * Push a single category (handles bid-placement linking).
   * NO RETRY LOGIC - fails immediately on error
   */
  const pushCategory = useCallback(
    async (category: OptimizationKey, dryrun: boolean = false): Promise<PushResult> => {
      try {
        const rows = getCategoryData(category);
        if (!rows || rows.length === 0) {
          return { success: false, error: "No data to push" };
        }

        const linked = BID_PLACEMENT_LINKS[category];

        // --- CASE 1: With LINKED CATEGORY ---
        if (linked) {
          const linkedRows = getCategoryData(linked) || [];

          const payload = {
            optimizations: {
              [category]: rows,
              [linked]: linkedRows,
            },
            dryrun,
          };

          const response = await apiClient.post("/api/v1/ads-optimizer/push/", payload);

          // Extract results for both categories
          const mainResult = extractPushResult(response.data, category);
          const linkedResult = extractPushResult(response.data, linked);

          // DELETE data from memory after push (for both dry-run and actual push)
          markCategoryAsPushed(category, mainResult);
          markCategoryAsPushed(linked, linkedResult);

          console.log(`✅ Push ${category} (with ${linked}) ${dryrun ? '[DRY RUN]' : ''}:`, response.data);
          return { 
            success: true, 
            data: response.data,
            result: mainResult 
          };
        }

        // --- CASE 2: Single category push ---
        const payload = {
          category,
          data: rows,
          dryrun,
        };

        const response = await apiClient.post("/api/v1/ads-optimizer/push/", payload);

        // Extract result
        const result = extractPushResult(response.data, category);

        console.log('📊 Backend response for', category, ':', response.data);
        console.log('📊 Extracted result:', result);

        // DELETE data from memory after push (for both dry-run and actual push)
        markCategoryAsPushed(category, result);
        clearCategoryEdits(category);

        console.log(`✅ Push ${category} ${dryrun ? '[DRY RUN]' : ''}:`, response.data);
        return { 
          success: true, 
          data: response.data,
          result 
        };
      } catch (error: any) {
        console.error(`❌ Push ${category} FAILED:`, error);
        // NO RETRY LOGIC - just return error immediately
        return { 
          success: false, 
          error: error.response?.data?.error || error.message || "Unknown error" 
        };
      }
    },
    [getCategoryData, markCategoryAsPushed, clearCategoryEdits]
  );

  /**
   * Push ALL optimizations together.
   * NO RETRY LOGIC - fails immediately on error
   */
  const pushAll = useCallback(async (dryrun: boolean = false): Promise<PushResult> => {
    try {
      const allData = getAllCategoriesData(); // Zustand selector

      // Remove empty categories
      const filtered: Record<string, any[]> = {};
      Object.entries(allData).forEach(([key, rows]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          filtered[key] = rows;
        }
      });

      if (Object.keys(filtered).length === 0) {
        return { success: false, error: "No data to push" };
      }

      const payload = { 
        optimizations: filtered,
        dryrun,
      };

      const response = await apiClient.post("/api/v1/ads-optimizer/push/", payload);

      // DELETE data from memory after push for all categories (for both dry-run and actual push)
      Object.keys(filtered).forEach((cat) => {
        const result = extractPushResult(response.data, cat as OptimizationKey);
        markCategoryAsPushed(cat as OptimizationKey, result);
      });

      console.log(`✅ Push ALL ${dryrun ? '[DRY RUN]' : ''}:`, JSON.stringify(response.data, null, 2));
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("❌ Push ALL FAILED:", error);
      // NO RETRY LOGIC - just return error immediately
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || "Unknown error" 
      };
    }
  }, [getAllCategoriesData, markCategoryAsPushed]);

  return {
    pushCategory,
    pushAll,
  };
}