"use client";

/**
 * AdsOptimizerResultsPage
 * ---------------------------------------------------------------------------
 * Results screen for the Ads Optimizer. Layout (top → bottom):
 *
 *   Sticky header (title, totals)
 *   Issues banner (if the optimizer reported errors)
 *   <OptimizationSection prefix="sp" />   5 tabs: Budget, Bids, Placement, New Campaigns, Negatives
 *   <OptimizationSection prefix="sb" />   5 tabs: same as SP
 *   <OptimizationSection prefix="sd" />   2 tabs: Budget, Bids
 *   Footer actions (Back / Push All) + tip
 *
 * Each section renders its tabs and inline editable tables itself
 * (see components/OptimizationSection.tsx). This page only owns:
 *   - bootstrap (hydrate the store from the React Query cache)
 *   - push orchestration + toasts (`handlePushCategory`, `handlePushAll`)
 *   - page-level modals: Push All confirm, failed-items details, push progress
 *   - the set of categories that hold unsaved local edits (`unsavedKeys`)
 *
 * AI-AGENT NOTES
 *   - Section/tab structure is configured in lib/optimization-table-config.ts.
 *   - The old card grid and <OptimizationTableDrawer /> are no longer used here.
 *   - Push All sends what is in the STORE. Unsaved table edits are not included,
 *     so the Push All confirmation warns about them via `unsavedKeys`.
 *   - Per-category pushes (from a panel) send the panel's current rows directly.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, AlertCircle, Send } from "lucide-react";
import { adsOptimizerQueryKeys } from "@/lib/hooks/queries/use-ads-optimizer";
import { useAdsOptimizerStore, OPTIMIZATION_KEYS } from "@/lib/hooks/use-ads-optimizer-store";
import type { OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";
import { OptimizationSection } from "../components/OptimizationSection";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { FailedItemsModal } from "../components/FailedItemsModal";
import { PushProgressModal } from "../components/PushProgressModal";
import type { AdsOptimizerResponse } from "../lib/types";
import {
  ALL_CATEGORY_KEYS,
  OPTIMIZATION_SECTIONS,
  getCategoryTitle,
} from "../lib/optimization-table-config";
import { usePushOptimizations } from "@/lib/hooks/usePushOptimizations";

export default function AdsOptimizerResultsPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  // ── Store ─────────────────────────────────────────────────────────────────
  // Subscribe to the raw data slices so the component re-renders on mutations.
  const categoryData     = useAdsOptimizerStore((s) => s.categoryData);
  const errors           = useAdsOptimizerStore((s) => s.errors);
  const dirtyCategories  = useAdsOptimizerStore((s) => s.dirtyCategories);
  const pushedCategories = useAdsOptimizerStore((s) => s.pushedCategories);
  const pushResults      = useAdsOptimizerStore((s) => s.pushResults);

  // Actions
  const setOptimizationData = useAdsOptimizerStore((s) => s.setOptimizationData);
  const setCategoryData     = useAdsOptimizerStore((s) => s.setCategoryData);

  // ── Derived helpers (plain functions — no store subscription needed) ──────
  const getCategoryCount = (key: OptimizationKey) => {
    if (pushedCategories.has(key)) return 0;
    return categoryData[key]?.length ?? 0;
  };

  const getAvailableCategories = () =>
    OPTIMIZATION_KEYS.filter(
      (key) => !pushedCategories.has(key) && (categoryData[key]?.length ?? 0) > 0,
    );

  // ── Local UI state ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]               = useState(true);
  const [pushingCategory, setPushingCategory]   = useState<string | null>(null);
  /** Categories whose inline tables have edits that were not saved yet. */
  const [unsavedKeys, setUnsavedKeys]           = useState<Set<OptimizationKey>>(new Set());
  const [failedItemsModal, setFailedItemsModal] = useState<{
    isOpen: boolean; categoryKey: OptimizationKey | null; categoryTitle: string;
  }>({ isOpen: false, categoryKey: null, categoryTitle: "" });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: (dryrun: boolean) => void; variant?: "danger" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // `progress` is non-null only while a batched push is running; it drives
  // <PushProgressModal />. Pushes are sent in batches (see usePushOptimizations).
  const { pushCategory, pushAll, progress } = usePushOptimizations();

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const cachedData = queryClient.getQueryData<AdsOptimizerResponse>(
      adsOptimizerQueryKeys.results()
    );
    if (cachedData) {
      setOptimizationData(cachedData);
      setIsLoading(false);
    } else if (Object.keys(categoryData).length === 0) {
      router.push("/dashboard/ads-optimizer");
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Panels report whether their table has unsaved edits. Stable identity (useCallback). */
  const handleUnsavedChange = useCallback((key: OptimizationKey, hasUnsaved: boolean) => {
    setUnsavedKeys((prev) => {
      if (prev.has(key) === hasUnsaved) return prev;
      const next = new Set(prev);
      if (hasUnsaved) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  /** Called by a panel's Save button — writes directly into the store. */
  const handleSaveCategory = (key: OptimizationKey, updatedData: any[]) => {
    setCategoryData(key, updatedData);
    toast.success("Changes saved", { duration: 2000, position: "top-right" });
  };

  /**
   * Called by a panel's Push button (after its own confirm dialog).
   * Handles toasts + the global `pushingCategory` flag.
   * @returns true on success, false on failure (never throws).
   */
  const handlePushCategory = async (
    key: OptimizationKey,
    data: any[],
    dryrun = false,
  ): Promise<boolean> => {
    setPushingCategory(key);
    const toastId = toast.loading(
      dryrun ? "Testing push (dry run)..." : `Pushing ${key} optimizations...`,
      { position: "top-right" },
    );
    try {
      const result = await pushCategory(key as any, dryrun, data);
      if (!result.success) throw new Error(result.error || "Push failed");
      toast.success(
        dryrun
          ? `✅ Dry run successful! ${data.length} optimizations validated.`
          : `✅ Successfully pushed ${data.length} optimizations!`,
        { id: toastId, duration: dryrun ? 5000 : 3000 },
      );
      return true;
    } catch (err: any) {
      // Show the real reason (e.g. "2 of 5 batches failed: ...") instead of a generic message.
      toast.error(`Failed: ${err.message || "Unknown error"}`, {
        id: toastId, duration: 6000,
      });
      return false;
    } finally {
      setPushingCategory(null);
    }
  };

  const handlePushAll = () => {
    const available = getAvailableCategories();
    const total     = available.reduce((s, k) => s + getCategoryCount(k), 0);
    const unsavedCount = unsavedKeys.size;
    const unsavedWarning = unsavedCount > 0
      ? ` ⚠️ ${unsavedCount} categor${unsavedCount === 1 ? "y has" : "ies have"} unsaved edits that will NOT be included — save them first.`
      : "";
    setConfirmDialog({
      isOpen: true,
      title: "Push All Optimizations",
      message: `Push ALL ${available.length} categories (${total} total)? Choose "Dry Run" to test first.${unsavedWarning}`,
      variant: "warning",
      onConfirm: async (dryrun) => {
        setPushingCategory("ALL");
        const toastId = toast.loading(
          dryrun ? "Testing all pushes (dry run)..." : "Pushing all optimizations...",
          { position: "top-right" },
        );
        try {
          const result = await pushAll(dryrun);
          if (result.success) {
            toast.success(
              dryrun ? "✅ Dry run completed!" : "✅ Successfully pushed all optimizations!",
              { id: toastId, duration: 3000 },
            );
          } else throw new Error(result.error || "Push failed");
        } catch (err: any) {
          toast.error(`Failed: ${err.message || "Unknown error"}`, {
            id: toastId, duration: 6000,
          });
        } finally {
          setPushingCategory(null);
        }
      },
    });
  };

  const handleViewPushDetails = (key: OptimizationKey) =>
    setFailedItemsModal({ isOpen: true, categoryKey: key, categoryTitle: getCategoryTitle(key) });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-[#7BA7C7] animate-pulse" />
        </div>
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-[#D4E5F1] rounded-full" />
              <div className="absolute inset-0 border-4 border-[#7BA7C7] rounded-full border-t-transparent animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Campaigns</h3>
            <p className="text-gray-600 text-sm">
              AI is processing your data to generate optimal recommendations...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalOptimizations = ALL_CATEGORY_KEYS.reduce((s, key) => s + getCategoryCount(key), 0);
  const categoriesWithData = ALL_CATEGORY_KEYS.filter((key) => getCategoryCount(key) > 0).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

      {/* Blocking progress overlay while batches are being sent */}
      <PushProgressModal progress={progress} />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Push"
        cancelText="Cancel"
        showDryRun={true}
      />

      <FailedItemsModal
        isOpen={failedItemsModal.isOpen}
        onClose={() => setFailedItemsModal({ isOpen: false, categoryKey: null, categoryTitle: "" })}
        categoryTitle={failedItemsModal.categoryTitle}
        failedItems={failedItemsModal.categoryKey ? pushResults[failedItemsModal.categoryKey]?.details?.failed_items    ?? [] : []}
        duplicateItems={failedItemsModal.categoryKey ? pushResults[failedItemsModal.categoryKey]?.details?.duplicate_items ?? [] : []}
        errorItems={failedItemsModal.categoryKey ? pushResults[failedItemsModal.categoryKey]?.details?.error_items       ?? [] : []}
        successfulItems={failedItemsModal.categoryKey ? pushResults[failedItemsModal.categoryKey]?.details?.successful_items ?? [] : []}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Optimization Results</h1>
            {dirtyCategories.size > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                {dirtyCategories.size} edited
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-700">Total Optimizations</div>
              <div className="text-2xl font-bold text-powder-blue-800">{totalOptimizations}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700">Categories</div>
              <div className="text-2xl font-bold text-powder-blue-800">{categoriesWithData}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">

        {errors.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-900 mb-2">Some Optimizations Had Issues</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SP → SB → SD, each with its own category tabs */}
        <div className="space-y-8">
          {OPTIMIZATION_SECTIONS.map((section) => (
            <OptimizationSection
              key={section.prefix}
              section={section}
              pushingCategory={pushingCategory}
              unsavedKeys={unsavedKeys}
              onUnsavedChange={handleUnsavedChange}
              onSave={handleSaveCategory}
              onPush={handlePushCategory}
              onViewPushDetails={handleViewPushDetails}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/command-center")}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Command Center
          </button>
          <button
            onClick={handlePushAll}
            disabled={pushingCategory !== null || getAvailableCategories().length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            Push All Optimizations ({getAvailableCategories().length})
          </button>
        </div>

        <div className="mt-8 p-4 bg-[#E8F1F8] border border-[#A8C5DD] rounded-xl">
          <p className="text-sm text-[#2D5573] text-center">
            💡 <strong>Tip:</strong> Edit values directly in a tab's table, then <strong>Save</strong> to keep
            your changes or <strong>Push Changes</strong> to apply them.
          </p>
        </div>
      </div>
    </div>
  );
}