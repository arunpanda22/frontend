"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api/config";
import { useAdsOptimizerStore, OPTIMIZATION_KEYS } from "@/lib/hooks/use-ads-optimizer-store";
import type { PushResultData, OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";

// Categories that must be pushed together — both are always included in
// the payload even if one is empty, so Amazon can reconcile bid + placement.
const BID_PLACEMENT_LINKS: Partial<Record<OptimizationKey, OptimizationKey>> = {
  sp_bid:       "sp_placement",
  sp_placement: "sp_bid",
  sb_bid:       "sb_placement",
  sb_placement: "sb_bid",
};

interface PushResult {
  success: boolean;
  data?: any;
  error?: string;
  result?: PushResultData;
}

/**
 * Extract a normalised PushResultData from a category's raw service result.
 *
 * The view always returns:
 * {
 *   dryrun: bool,
 *   optimization_type: string,
 *   results: {
 *     sp_bid:       { ...raw service result } | null,
 *     sp_placement: { ...raw service result } | null,
 *     ...all 12 categories...
 *   }
 * }
 *
 * Each category's result shape differs — this function extracts the common
 * fields that every service returns (successful, failed, success_rate,
 * timestamp, s3_location, details). Category-specific fields (e.g. keywords /
 * product_targets breakdown for sp_bid) are preserved under `details` as-is.
 *
 * Returns undefined if the category was not part of this push (null slot).
 */
function extractPushResult(
  response: any,
  category: OptimizationKey,
): PushResultData | undefined {
  // All responses go through response.results[category] — the old
  // single-category top-level shape is no longer used.
  const raw = response?.results?.[category];

  // null means this category was not part of the push
  if (raw == null) return undefined;

  // Service errored — no standard fields present
  if (raw.error) {
    return {
      push_id:      "",
      total_items:  raw.total_items  ?? 0,
      successful:   0,
      failed:       raw.total_items  ?? 0,
      success_rate: "0.00%",
      timestamp:    new Date().toISOString(),
      details:      { successful_items: [], failed_items: [], error: raw.error },
    };
  }

  // Dryrun placeholder
  if (raw.dryrun) {
    return {
      push_id:      "",
      total_items:  raw.total_items  ?? 0,
      successful:   0,
      failed:       0,
      success_rate: "0.00%",
      timestamp:    new Date().toISOString(),
      details:      { successful_items: [], failed_items: [], message: raw.message },
      s3_location:  raw.s3_location,
    };
  }

  // Standard service result — fields present in every service
  return {
    push_id:      raw.push_id       ?? "",
    total_items:  raw.total_items   ?? (raw.successful ?? 0) + (raw.failed ?? 0),
    successful:   raw.successful    ?? 0,
    failed:       raw.failed        ?? 0,
    duplicates:   raw.duplicates,
    errors:       raw.errors,
    success_rate: raw.success_rate  ?? "0.00%",
    timestamp:    raw.timestamp     ?? new Date().toISOString(),
    s3_location:  raw.s3_location,
    // Preserve the full details blob — each category has a different shape
    // here. The frontend handler for each category reads what it needs.
    details:      raw.details,
  };
}

export function usePushOptimizations() {
  const categoryData         = useAdsOptimizerStore((s) => s.categoryData);
  const markCategoryAsPushed = useAdsOptimizerStore((s) => s.markCategoryAsPushed);

  /**
   * Push a single category.
   *
   * If the category has a linked counterpart (bid ↔ placement) both are sent
   * together in one request. The linked category may have zero rows — that is
   * fine, the backend handles it.
   */
  const pushCategory = useCallback(
    async (
      category: OptimizationKey,
      dryrun = false,
      rowsOverride?: any[],   // ← add this
    ): Promise<PushResult> => {
      try {
        const rows = rowsOverride ?? categoryData[category];  // ← prefer override
        if (!rows || rows.length === 0) {
          return { success: false, error: "No data to push" };
        }

        const linked = BID_PLACEMENT_LINKS[category];

        if (linked) {
          const linkedRows = categoryData[linked] ?? [];
          const payload = {
            optimizations: { [category]: rows, [linked]: linkedRows },
            dryrun,
          };

          const response = await apiClient.post(
            "/api/v1/optimizer/push/optimizations/",
            payload,
          );

          const mainResult   = extractPushResult(response.data, category);
          const linkedResult = extractPushResult(response.data, linked);

          markCategoryAsPushed(category, mainResult);
          markCategoryAsPushed(linked,   linkedResult);

          console.log(
            `✅ Push ${category} + ${linked}${dryrun ? " [DRY RUN]" : ""}`,
            response.data,
          );
          return { success: true, data: response.data, result: mainResult };
        }

        // ── Standalone ────────────────────────────────────────────────────
        const payload = { category, data: rows, dryrun };

        const response = await apiClient.post(
          "/api/v1/optimizer/push/optimizations/",
          payload,
        );

        const result = extractPushResult(response.data, category);
        markCategoryAsPushed(category, result);

        console.log(
          `✅ Push ${category}${dryrun ? " [DRY RUN]" : ""}`,
          response.data,
        );
        return { success: true, data: response.data, result };

      } catch (error: any) {
        console.error(`❌ Push ${category} FAILED:`, error);
        return {
          success: false,
          error: error.response?.data?.error || error.message || "Unknown error",
        };
      }
    },
    [categoryData, markCategoryAsPushed],
  );

  /**
   * Push all available (non-pushed, non-empty) categories in one request.
   */
  const pushAll = useCallback(
    async (dryrun = false): Promise<PushResult> => {
      try {
        const pushedCategories = useAdsOptimizerStore.getState().pushedCategories;

        const filtered: Record<string, any[]> = {};
        OPTIMIZATION_KEYS.forEach((key) => {
          if (pushedCategories.has(key)) return;
          const rows = categoryData[key];
          if (Array.isArray(rows) && rows.length > 0) {
            filtered[key] = rows;
          }
        });

        if (Object.keys(filtered).length === 0) {
          return { success: false, error: "No data to push" };
        }

        const payload = { optimizations: filtered, dryrun };

        const response = await apiClient.post(
          "/api/v1/optimizer/push/optimizations/",
          payload,
        );

        // Mark every pushed category with its extracted result
        Object.keys(filtered).forEach((key) => {
          const result = extractPushResult(response.data, key as OptimizationKey);
          markCategoryAsPushed(key as OptimizationKey, result);
        });

        console.log(
          `✅ Push ALL${dryrun ? " [DRY RUN]" : ""}`,
          response.data,
        );
        return { success: true, data: response.data };

      } catch (error: any) {
        console.error("❌ Push ALL FAILED:", error);
        return {
          success: false,
          error: error.response?.data?.error || error.message || "Unknown error",
        };
      }
    },
    [categoryData, markCategoryAsPushed],
  );

  return { pushCategory, pushAll };
}