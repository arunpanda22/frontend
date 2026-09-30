"use client";

/**
 * usePushOptimizations
 * ============================================================================
 * Location: src/lib/hooks/usePushOptimizations.ts
 *
 * PURPOSE
 *   Pushes Ads Optimizer recommendations (bids, budgets, placements, new
 *   campaigns, negatives) to the backend endpoint
 *   POST /api/v1/optimizer/push/optimizations/  (Django: AdsPushView)
 *
 * WHY THIS FILE WORKS THE WAY IT DOES (context for future AI agents/reviewers)
 *
 *   1. BATCHING. A weekly `sp_bid` push can hold thousands of rows. One request
 *      exceeded nginx `client_max_body_size` (413; nginx's 413 carries no CORS
 *      headers, so the browser reported a CORS/"Network Error"). Rows are now
 *      sent in sequential batches (PUSH_CHUNK_SIZE) and the per-batch results
 *      are MERGED, so the store / PushResultSummary still see ONE
 *      PushResultData per category.
 *
 *   2. NO AUTOMATIC RETRIES. Uses `apiClientNoRetry`, NOT `apiClient`.
 *      `apiClient` has axios-retry (retries network errors and any 5xx, even
 *      on POST). Pushes change live Amazon Ads state and are NOT idempotent.
 *      The backend services already retry Amazon calls internally.
 *
 *   3. ONE CATEGORY PER REQUEST. Each request uses the single-category shape
 *      { category, data, dryrun }. The backend runs categories independently
 *      (AdsPushView passes each service only its own rows), so bid and
 *      placement do NOT need to share a request. Every request therefore
 *      contains non-empty rows (the view returns 400 for an empty list).
 *
 *   4. CAMPAIGN-ATOMIC PLACEMENT BATCHES  (CRITICAL, do not remove).
 *      SPPlacementPushService groups rows by campaign_id and sends, per
 *      campaign, a FULL placementBidding array (top/bottom/product/business).
 *      Any placement missing from the request is sent as 0, and Amazon
 *      REPLACES the campaign's placement config. If one campaign's rows were
 *      split across two requests, the later request would zero the placements
 *      pushed by the earlier one (and an Audience row arriving alone would
 *      zero all standard placements). Categories listed in
 *      CAMPAIGN_ATOMIC_CATEGORIES are therefore batched so all rows of a
 *      campaign always stay in the SAME request.
 *      sp_bid rows are independent keyword/target updates and can be split
 *      anywhere.
 *
 *   5. LINKED BID <-> PLACEMENT. Pushing one of sp_bid / sp_placement (or the
 *      sb_ pair) also pushes its counterpart, as before. Bids are sent FIRST:
 *      the generated `New bid` is divided by (1 + placement multiplier), so if
 *      something fails part-way it is safer for the placement multipliers to
 *      be the part that is missing (effective bids end up lower, not higher).
 *
 * PARTIAL FAILURE SEMANTICS
 *   - A failed batch does NOT stop the remaining batches.
 *   - Rows of a failed batch are added to `details.failed_items` with an
 *     `error` field so PushResultSummary / FailedItemsModal show them.
 *   - A category is marked as pushed if AT LEAST ONE of its batches succeeded.
 *     If every batch failed it is NOT marked pushed, so the user can retry.
 *   - The returned PushResult has success=false if ANY batch failed.
 *
 * BACKEND SIDE EFFECTS TO BE AWARE OF
 *   The push services write one S3 file + one OptimizationLog row PER REQUEST,
 *   so a batched push creates several log entries with the same ads_type.
 * ============================================================================
 */

import { useCallback, useState } from "react";
import { apiClientNoRetry } from "@/lib/api/config";
import { useAdsOptimizerStore, OPTIMIZATION_KEYS } from "@/lib/hooks/use-ads-optimizer-store";
import type { PushResultData, OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";

// ── Constants ───────────────────────────────────────────────────────────────

const PUSH_ENDPOINT = "/api/v1/optimizer/push/optimizations/";

/**
 * Default maximum rows per request. Each request is handled synchronously by
 * Django (Amazon calls + per-row DB writes for sp_bid history), so also keep
 * it low enough to finish inside the gunicorn / nginx proxy timeouts.
 */
export const PUSH_CHUNK_SIZE = 500;

/** Per-category override of PUSH_CHUNK_SIZE (rows per request). Empty = use default. */
export const PUSH_CHUNK_SIZE_OVERRIDES: Partial<Record<OptimizationKey, number>> = {
  // sp_bid: 300,
};

/**
 * Categories whose rows must NEVER be split across requests for the same
 * campaign (see header note 4). Value = row fields that hold the campaign id,
 * checked in order.
 *   - sp_placement: verified against SPPlacementPushService.
 *   - sb_placement: assumed to behave the same (SB service not reviewed);
 *     kept atomic to be safe.
 * Add other categories here if their service also replaces per-campaign config.
 */
const CAMPAIGN_ATOMIC_CATEGORIES: Partial<Record<OptimizationKey, string[]>> = {
  sp_placement: ["campaign_id", "campaignId"],
  sb_placement: ["campaign_id", "campaignId"],
};

/** Categories pushed together (bid <-> placement). Bid is always sent first. */
const BID_PLACEMENT_LINKS: Partial<Record<OptimizationKey, OptimizationKey>> = {
  sp_bid:       "sp_placement",
  sp_placement: "sp_bid",
  sb_bid:       "sb_placement",
  sb_placement: "sb_bid",
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface PushResult {
  success: boolean;
  /** Array of raw backend responses, one per successful batch. */
  data?: any;
  error?: string;
  /** Merged result for the requested category (all batches combined). */
  result?: PushResultData;
  totalBatches?: number;
  failedBatches?: number;
}

/**
 * Live progress of an in-flight push. `null` when nothing is being pushed.
 * Rendered by <PushProgressModal />.
 */
export interface PushProgress {
  /** Human-readable target, e.g. "sp_bid + sp_placement" or "All categories". */
  label: string;
  dryrun: boolean;
  /** 1-based index of the batch currently being sent. */
  currentBatch: number;
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  itemsProcessed: number;
  itemsTotal: number;
}

/** Categories that are pushed as a group (a linked pair, or a single category). */
interface PushUnit {
  /** Push order. For a bid/placement pair the bid key comes first. */
  keys: OptimizationKey[];
  rows: Partial<Record<OptimizationKey, any[]>>;
}

/** One HTTP request worth of rows for ONE category. */
interface PushBatch {
  key: OptimizationKey;
  rows: any[];
}

// ── Pure helpers ────────────────────────────────────────────────────────────

const isPlainObject = (v: unknown): v is Record<string, any> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Split rows into evenly sized slices of at most `size` rows. */
function sliceEvenly(rows: any[], size: number): any[][] {
  const count = Math.max(1, Math.ceil(rows.length / size));
  const per = Math.ceil(rows.length / count);
  const out: any[][] = [];
  for (let i = 0; i < count; i++) {
    const slice = rows.slice(i * per, (i + 1) * per);
    if (slice.length > 0) out.push(slice);
  }
  return out;
}

/**
 * Campaign id of a row, normalised exactly like the backend does
 * (SPPlacementPushService drops anything after a "."). Undefined if absent.
 */
function getGroupId(row: any, fields: string[]): string | undefined {
  for (const f of fields) {
    const v = row?.[f];
    if (v !== undefined && v !== null && v !== "") return String(v).split(".")[0];
  }
  return undefined;
}

/**
 * Split rows into batches of about `size` rows WITHOUT ever separating rows
 * that share a campaign id. A single campaign larger than `size` gets its own
 * (oversized) batch. Rows with no campaign id are treated as their own group.
 */
function sliceByGroup(rows: any[], fields: string[], size: number): any[][] {
  const groups = new Map<string, any[]>();
  rows.forEach((row, i) => {
    const id = getGroupId(row, fields) ?? `__row_${i}`;
    const bucket = groups.get(id);
    if (bucket) bucket.push(row);
    else groups.set(id, [row]);
  });

  const batches: any[][] = [];
  let current: any[] = [];
  for (const group of groups.values()) {
    if (current.length > 0 && current.length + group.length > size) {
      batches.push(current);
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/** Turn a unit into an ordered list of single-category batches. */
function planBatches(unit: PushUnit): PushBatch[] {
  const batches: PushBatch[] = [];
  for (const key of unit.keys) {
    const rows = unit.rows[key] ?? [];
    if (rows.length === 0) continue; // backend rejects empty lists
    const size = PUSH_CHUNK_SIZE_OVERRIDES[key] ?? PUSH_CHUNK_SIZE;
    const groupFields = CAMPAIGN_ATOMIC_CATEGORIES[key];
    const slices = groupFields ? sliceByGroup(rows, groupFields, size) : sliceEvenly(rows, size);
    slices.forEach((slice) => batches.push({ key, rows: slice }));
  }
  return batches;
}

/**
 * Generic merge used to combine per-batch results:
 *   number + number   -> sum
 *   array  + array    -> concatenation
 *   object + object   -> key-wise recursive merge
 *   anything else     -> keep the first value
 * Works for the count-based `details` of sp_bid (keywords / product_targets
 * attempted|successful|failed, failed_batches, total_batches_failed) and
 * sp_placement (summary, successful_items, failed_items, ...).
 */
function mergeValues(a: any, b: any): any {
  if (a === undefined || a === null) return b;
  if (b === undefined || b === null) return a;
  if (typeof a === "number" && typeof b === "number") return a + b;
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (isPlainObject(a) && isPlainObject(b)) {
    const out: Record<string, any> = { ...a };
    for (const k of Object.keys(b)) out[k] = mergeValues(a[k], b[k]);
    return out;
  }
  return a;
}

/**
 * Combine two PushResultData objects (consecutive batches of one category).
 * push_id / s3_location keep the FIRST batch's value; timestamp takes the
 * latest; success_rate (top level and details.summary) is recomputed from the
 * merged counts because string percentages cannot be summed.
 */
function mergePushResults(a?: PushResultData, b?: PushResultData): PushResultData | undefined {
  if (!a) return b;
  if (!b) return a;
  const merged: any = mergeValues(a, b);

  const total = Number(merged.total_items) || 0;
  const ok    = Number(merged.successful)  || 0;
  merged.success_rate = total > 0 ? `${((ok / total) * 100).toFixed(2)}%` : "0.00%";
  merged.timestamp    = b.timestamp ?? a.timestamp;

  // sp_placement carries its own summary block with a string success_rate.
  const summary = merged.details?.summary;
  if (isPlainObject(summary) && typeof summary.total === "number" && typeof summary.successful === "number") {
    summary.success_rate =
      summary.total > 0 ? `${((summary.successful / summary.total) * 100).toFixed(2)}%` : "0%";
  }
  return merged as PushResultData;
}

/** Build a PushResultData representing a batch that failed entirely. */
function buildFailedBatchResult(rows: any[], message: string): PushResultData {
  return {
    push_id:      "",
    total_items:  rows.length,
    successful:   0,
    failed:       rows.length,
    success_rate: "0.00%",
    timestamp:    new Date().toISOString(),
    details: {
      successful_items: [],
      // Each failed row is returned with an `error` field attached.
      failed_items: rows.map((r) => (isPlainObject(r) ? { ...r, error: message } : { item: r, error: message })),
      error: message,
    },
  } as PushResultData;
}

/** Turn an axios error into a readable message. */
function describeError(error: any): string {
  const serverMsg = error?.response?.data?.error;
  if (serverMsg) return serverMsg;
  const status = error?.response?.status;
  if (status === 413) return "Request too large (413)";
  if (!error?.response) {
    return "Network error (request blocked, timed out, or payload too large)";
  }
  return error?.message || "Unknown error";
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

// ── Hook ────────────────────────────────────────────────────────────────────

export function usePushOptimizations() {
  const categoryData         = useAdsOptimizerStore((s) => s.categoryData);
  const markCategoryAsPushed = useAdsOptimizerStore((s) => s.markCategoryAsPushed);

  /** Live progress; render with <PushProgressModal progress={progress} />. */
  const [progress, setProgress] = useState<PushProgress | null>(null);

  /**
   * Core executor: plans single-category batches for every unit, sends them
   * ONE AT A TIME (no parallelism, no automatic retries), merges per-batch
   * results, and marks successful categories as pushed exactly once at the end.
   *
   * @param primaryKey Category whose merged result is returned as `result`.
   */
  const executeUnits = useCallback(
    async (
      units: PushUnit[],
      dryrun: boolean,
      label: string,
      primaryKey?: OptimizationKey,
    ): Promise<PushResult> => {
      const batches: PushBatch[] = units.flatMap((unit) => planBatches(unit));
      const totalBatches = batches.length;
      const itemsTotal   = batches.reduce((s, b) => s + b.rows.length, 0);

      if (totalBatches === 0) return { success: false, error: "No data to push" };

      const merged: Partial<Record<OptimizationKey, PushResultData>> = {};
      const keySucceeded = new Set<OptimizationKey>();
      const responses: any[] = [];
      let failedBatches = 0;
      let itemsProcessed = 0;
      let firstError: string | undefined;

      const report = (completedBatches: number) =>
        setProgress({
          label,
          dryrun,
          totalBatches,
          itemsTotal,
          completedBatches,
          failedBatches,
          itemsProcessed,
          currentBatch: Math.min(completedBatches + 1, totalBatches),
        });

      try {
        report(0);

        for (let i = 0; i < batches.length; i++) {
          const { key, rows } = batches[i];

          try {
            const response = await apiClientNoRetry.post(PUSH_ENDPOINT, {
              category: key,
              data: rows,
              dryrun,
            });
            responses.push(response.data);
            keySucceeded.add(key);
            merged[key] = mergePushResults(merged[key], extractPushResult(response.data, key));
          } catch (error: any) {
            failedBatches++;
            const message = describeError(error);
            firstError ??= message;
            console.error(`❌ Push batch ${i + 1}/${totalBatches} (${key}) FAILED:`, error);
            merged[key] = mergePushResults(merged[key], buildFailedBatchResult(rows, message));
          }

          itemsProcessed += rows.length;
          report(i + 1);
        }

        // Commit to the store once, after all batches are done. A category
        // whose batches ALL failed stays unpushed so the user can retry it.
        keySucceeded.forEach((key) => markCategoryAsPushed(key, merged[key]));

        console.log(
          `✅ Push ${label}${dryrun ? " [DRY RUN]" : ""}: ${totalBatches - failedBatches}/${totalBatches} batches ok`,
          responses,
        );

        return {
          success: failedBatches === 0,
          data: responses,
          result: primaryKey ? merged[primaryKey] : undefined,
          totalBatches,
          failedBatches,
          error:
            failedBatches > 0
              ? `${failedBatches} of ${totalBatches} batches failed: ${firstError}`
              : undefined,
        };
      } finally {
        setProgress(null);
      }
    },
    [markCategoryAsPushed],
  );

  /**
   * Push a single category (batched).
   *
   * If the category has a linked counterpart (bid <-> placement) both are
   * pushed, bid first. A linked category with zero rows is simply skipped.
   *
   * @param rowsOverride Rows edited in the drawer; takes precedence over the store.
   */
  const pushCategory = useCallback(
    async (
      category: OptimizationKey,
      dryrun = false,
      rowsOverride?: any[],
    ): Promise<PushResult> => {
      const rows = rowsOverride ?? categoryData[category];
      if (!rows || rows.length === 0) {
        return { success: false, error: "No data to push" };
      }

      const linked = BID_PLACEMENT_LINKS[category];
      const unit: PushUnit = linked
        ? {
            keys: category.endsWith("_bid") ? [category, linked] : [linked, category],
            rows: { [category]: rows, [linked]: categoryData[linked] ?? [] },
          }
        : { keys: [category], rows: { [category]: rows } };

      return executeUnits([unit], dryrun, unit.keys.join(" + "), category);
    },
    [categoryData, executeUnits],
  );

  /**
   * Push all available (non-pushed, non-empty) categories (batched).
   * Linked bid/placement pairs are pushed together (bid first); every other
   * category is its own unit.
   */
  const pushAll = useCallback(
    async (dryrun = false): Promise<PushResult> => {
      const pushedCategories = useAdsOptimizerStore.getState().pushedCategories;
      const hasRows = (k: OptimizationKey) =>
        !pushedCategories.has(k) && Array.isArray(categoryData[k]) && categoryData[k].length > 0;

      const handled = new Set<OptimizationKey>();
      const units: PushUnit[] = [];

      for (const key of OPTIMIZATION_KEYS) {
        if (handled.has(key) || !hasRows(key)) continue;

        const linked = BID_PLACEMENT_LINKS[key];
        if (linked && hasRows(linked) && !handled.has(linked)) {
          units.push({
            keys: key.endsWith("_bid") ? [key, linked] : [linked, key],
            rows: { [key]: categoryData[key], [linked]: categoryData[linked] },
          });
          handled.add(key);
          handled.add(linked);
        } else {
          units.push({ keys: [key], rows: { [key]: categoryData[key] } });
          handled.add(key);
        }
      }

      if (units.length === 0) return { success: false, error: "No data to push" };

      return executeUnits(units, dryrun, "All categories");
    },
    [categoryData, executeUnits],
  );

  return { pushCategory, pushAll, progress };
}