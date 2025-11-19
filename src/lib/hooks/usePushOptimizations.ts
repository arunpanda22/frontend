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
    async (category: OptimizationKey) => {
      const rows = getCategoryData(category);
      if (!rows || rows.length === 0) return;

      const linked = BID_PLACEMENT_LINKS[category];

      // --- CASE 1: With LINKED CATEGORY ---
      if (linked) {
        const linkedRows = getCategoryData(linked) || [];

        const payload = {
          optimizations: {
            [category]: rows,
            [linked]: linkedRows,
          },
        };

        await apiClient.post("/api/v1/ads-optimizer/push/", payload);

        // Mark both as pushed
        markCategoryAsPushed(category);
        markCategoryAsPushed(linked);

        return;
      }

      // --- CASE 2: Single category push ---
      await apiClient.post("/api/v1/ads-optimizer/push/", {
        category,
        data: rows,
      });

      markCategoryAsPushed(category);
      clearCategoryEdits(category);
    },
    [getCategoryData, markCategoryAsPushed, clearCategoryEdits]
  );

  /**
   * Push ALL optimizations together.
   */
  const pushAll = useCallback(async () => {
    const allData = getAllCategoriesData(); // Zustand selector

    // Remove empty categories
    const filtered: Record<string, any[]> = {};
    Object.entries(allData).forEach(([key, rows]) => {
      if (Array.isArray(rows) && rows.length > 0) {
        filtered[key] = rows;
      }
    });

    if (Object.keys(filtered).length === 0) return;

    const payload = { optimizations: filtered };

    await apiClient.post("/api/v1/ads-optimizer/push/", payload);

    // Mark all categories as pushed
    Object.keys(filtered).forEach((cat) =>
      markCategoryAsPushed(cat as OptimizationKey)
    );
  }, [getAllCategoriesData, markCategoryAsPushed]);

  return {
    pushCategory,
    pushAll,
  };
}
