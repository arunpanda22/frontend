"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api/config";
import { useAdsOptimizerStore } from "./use-ads-optimizer-store";
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
}

export function usePushOptimizations() {
  const {
    getCategoryData,
    markCategoryAsPushed,
    clearCategoryEdits,
    getAllCategoriesData,
  } = useAdsOptimizerStore();

  /**
   * Push a single category (handles bid-placement linking).
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

          // Mark both as pushed (only if not dryrun)
          if (!dryrun) {
            markCategoryAsPushed(category);
            markCategoryAsPushed(linked);
          }

          console.log(`Push ${category} (with ${linked}) ${dryrun ? '[DRY RUN]' : ''}:`, response.data);
          return { success: true, data: response.data };
        }

        // --- CASE 2: Single category push ---
        const payload = {
          category,
          data: rows,
          dryrun,
        };

        const response = await apiClient.post("/api/v1/ads-optimizer/push/", payload);

        // Mark as pushed (only if not dryrun)
        if (!dryrun) {
          markCategoryAsPushed(category);
          clearCategoryEdits(category);
        }

        console.log(`Push ${category} ${dryrun ? '[DRY RUN]' : ''}:`, response.data);
        return { success: true, data: response.data };
      } catch (error: any) {
        console.error(`Failed to push ${category}:`, error);
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

      // Mark all categories as pushed (only if not dryrun)
      if (!dryrun) {
        Object.keys(filtered).forEach((cat) =>
          markCategoryAsPushed(cat as OptimizationKey)
        );
      }

      console.log(`Push ALL ${dryrun ? '[DRY RUN]' : ''}:`, response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Failed to push all:", error);
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