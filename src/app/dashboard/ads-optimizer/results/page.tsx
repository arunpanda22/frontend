"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft, AlertCircle, Edit3, Send, Save,
  DollarSign, Tag, Monitor, Target, Award, Palette,
  MapPin, Pin, Sparkles, Star, XCircle, StopCircle,
} from "lucide-react";
import { adsOptimizerQueryKeys } from "@/lib/hooks/queries/use-ads-optimizer";
import { useAdsOptimizerStore, OPTIMIZATION_KEYS } from "@/lib/hooks/use-ads-optimizer-store";
import type { OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";
import { OptimizationTableDrawer } from "../components/OptimizationTableDrawer";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { PushResultSummary } from "../components/PushResultSummary";
import { FailedItemsModal } from "../components/FailedItemsModal";
import type { AdsOptimizerResponse, OptimizationCategory } from "../lib/types";
import { usePushOptimizations } from "@/lib/hooks/usePushOptimizations";

const OPTIMIZATION_CATEGORIES: OptimizationCategory[] = [
  { key: "sp_budget",        title: "SP Budget Adjustments",       description: "", icon: "DollarSign" },
  { key: "sb_budget",        title: "SB Budget Adjustments",       description: "", icon: "Tag"        },
  { key: "sd_budget",        title: "SD Budget Adjustments",       description: "", icon: "Monitor"    },
  { key: "sp_bid",           title: "SP Bid Optimizations",        description: "", icon: "Target"     },
  { key: "sb_bid",           title: "SB Bid Optimizations",        description: "", icon: "Award"      },
  { key: "sd_bid",           title: "SD Bid Optimizations",        description: "", icon: "Palette"    },
  { key: "sp_placement",     title: "SP Placement Adjustments",    description: "", icon: "MapPin"     },
  { key: "sb_placement",     title: "SB Placement Adjustments",    description: "", icon: "Pin"        },
  { key: "sp_new_campaigns", title: "SP New Campaign Suggestions", description: "", icon: "Sparkles"   },
  { key: "sb_new_campaigns", title: "SB New Campaign Suggestions", description: "", icon: "Star"       },
  { key: "sp_negatives",     title: "SP Negative Keywords",        description: "", icon: "XCircle"    },
  { key: "sb_negatives",     title: "SB Negative Keywords",        description: "", icon: "StopCircle" },
];

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
  const setOptimizationData  = useAdsOptimizerStore((s) => s.setOptimizationData);
  const setCategoryData      = useAdsOptimizerStore((s) => s.setCategoryData);
  const markCategoryAsPushed = useAdsOptimizerStore((s) => s.markCategoryAsPushed);

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
  const [isLoading, setIsLoading]                 = useState(true);
  const [selectedCategory, setSelectedCategory]   = useState<OptimizationKey | null>(null);
  const [pushingCategory, setPushingCategory]     = useState<string | null>(null);
  const [failedItemsModal, setFailedItemsModal]   = useState<{
    isOpen: boolean; categoryKey: OptimizationKey | null; categoryTitle: string;
  }>({ isOpen: false, categoryKey: null, categoryTitle: "" });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: (dryrun: boolean) => void; variant?: "danger" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const { pushCategory, pushAll } = usePushOptimizations();

  // Expose toast helper for the drawer (avoids importing react-hot-toast there)
  useEffect(() => {
    (window as any).__toastSuccess = (msg: string) =>
      toast.success(msg, { duration: 2000, position: "top-right" });
  }, []);

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

  /** Called by drawer Save button — writes directly into the store */
  const handleSaveCategory = (key: OptimizationKey, updatedData: any[]) => {
    setCategoryData(key, updatedData);
    toast.success("Changes saved", { duration: 2000, position: "top-right" });
  };

  const handlePushCategory = async (
    key: OptimizationKey,
    data: any[],
    dryrun = false,
  ) => {
    setPushingCategory(key);
    const toastId = toast.loading(
      dryrun ? "Testing push (dry run)..." : `Pushing ${key} optimizations...`,
      { position: "top-right" },
    );
    try {
      const result = await pushCategory(key as any, dryrun, data);  // ← pass data
      if (result.success) {
        toast.success(
          dryrun
            ? `✅ Dry run successful! ${data.length} optimizations validated.`
            : `✅ Successfully pushed ${data.length} optimizations!`,
          { id: toastId, duration: dryrun ? 5000 : 3000 },
        );
      } else {
        throw new Error(result.error || "Push failed");
      }
    } catch (err: any) {
      toast.error("Failed to push optimizations. Please try again.", {
        id: toastId, duration: 4000,
      });
    } finally {
      setPushingCategory(null);
    }
  };

  const handleDirectPush = (key: OptimizationKey) => {
    const count = getCategoryCount(key);
    setConfirmDialog({
      isOpen: true,
      title: "Push Optimizations",
      message: `Push ${count} ${key} optimizations? Choose "Dry Run" to test first.`,
      variant: "info",
      onConfirm: async (dryrun) => {
        setPushingCategory(key);
        const toastId = toast.loading(
          dryrun ? "Testing push (dry run)..." : "Pushing optimizations...",
          { position: "top-right" },
        );
        try {
          const result = await pushCategory(key as any, dryrun);
          if (result.success) {
            toast.success(
              dryrun
                ? `✅ Dry run successful! ${count} optimizations validated.`
                : `✅ Successfully pushed ${count} optimizations!`,
              { id: toastId, duration: dryrun ? 5000 : 3000 },
            );
          } else throw new Error(result.error || "Push failed");
        } catch (err: any) {
          toast.error(`Failed: ${err.message || "Unknown error"}`, {
            id: toastId, duration: 4000,
          });
        } finally {
          setPushingCategory(null);
        }
      },
    });
  };

  const handlePushAll = () => {
    const available = getAvailableCategories();
    const total     = available.reduce((s, k) => s + getCategoryCount(k), 0);
    setConfirmDialog({
      isOpen: true,
      title: "Push All Optimizations",
      message: `Push ALL ${available.length} categories (${total} total)? Choose "Dry Run" to test first.`,
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
            id: toastId, duration: 4000,
          });
        } finally {
          setPushingCategory(null);
        }
      },
    });
  };

  // ── Icons ─────────────────────────────────────────────────────────────────
  const getIcon = (name: string) => {
    const map: Record<string, any> = {
      DollarSign, Tag, Monitor, Target, Award,
      Palette, MapPin, Pin, Sparkles, Star, XCircle, StopCircle,
    };
    const I = map[name];
    return I ? <I className="w-5 h-5" /> : null;
  };

  // ── Card renderer ─────────────────────────────────────────────────────────
  const renderCard = (cat: OptimizationCategory) => {
    const count     = getCategoryCount(cat.key as OptimizationKey);
    const isPushed  = pushedCategories.has(cat.key as OptimizationKey);
    const isDirty   = dirtyCategories.has(cat.key as OptimizationKey);
    const isPushing = pushingCategory === cat.key;
    const result    = pushResults[cat.key as OptimizationKey];

    if (isPushed && result) {
      return (
        <div key={cat.key} className="bg-white rounded-2xl border-2 border-green-200 shadow-sm p-6 flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white mb-4">
            {getIcon(cat.icon)}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{cat.title}</h3>
          <div className="mt-auto">
            <PushResultSummary
              result={result}
              onViewDetails={() =>
                setFailedItemsModal({ isOpen: true, categoryKey: cat.key as OptimizationKey, categoryTitle: cat.title })
              }
            />
          </div>
        </div>
      );
    }

    if (count === 0) {
      return (
        <div key={cat.key} className="bg-white rounded-2xl border-2 border-gray-200 opacity-50 p-6 flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-gray-400 flex items-center justify-center text-white mb-4">
            {getIcon(cat.icon)}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.title}</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-400">0</div>
            <div className="text-sm text-gray-500">optimizations</div>
          </div>
          <div className="mt-auto text-center text-sm text-gray-400">No optimizations available</div>
        </div>
      );
    }

    return (
      <div key={cat.key} className="bg-white rounded-2xl border-2 border-powder-blue-200 hover:border-powder-blue-500 hover:shadow-xl transition-all duration-300 p-6 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-powder-blue-600 flex items-center justify-center text-white">
            {getIcon(cat.icon)}
          </div>
          {isDirty && (
            <span className="px-2 py-1 bg-powder-blue-100 border border-powder-blue-400 text-gray-900 text-xs font-semibold rounded-full flex items-center gap-1">
              <Save className="w-3 h-3" /> Edited
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{cat.title}</h3>
        <div className="mb-6">
          <div className="text-3xl font-bold text-gray-900">{count}</div>
          <div className="text-sm text-gray-600">optimization{count !== 1 ? "s" : ""}</div>
        </div>
        <div className="mt-auto flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedCategory(cat.key as OptimizationKey)}
            disabled={isPushing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-powder-blue-600 hover:bg-powder-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => handleDirectPush(cat.key as OptimizationKey)}
            disabled={isPushing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPushing ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Pushing...</>
            ) : (
              <><Send className="w-3 h-3" />Push</>
            )}
          </button>
        </div>
      </div>
    );
  };

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
  const totalOptimizations = OPTIMIZATION_CATEGORIES.reduce(
    (s, cat) => s + getCategoryCount(cat.key as OptimizationKey), 0,
  );
  const categoriesWithData = OPTIMIZATION_CATEGORIES.filter(
    (cat) => getCategoryCount(cat.key as OptimizationKey) > 0,
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
      <div className="max-w-7xl mx-auto px-6 py-8">

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

        <div className="space-y-8">
          {[
            { prefix: "sp", label: "Sponsored Products" },
            { prefix: "sb", label: "Sponsored Brands"   },
            { prefix: "sd", label: "Sponsored Display"  },
          ].map(({ prefix, label }) => {
            const cats  = OPTIMIZATION_CATEGORIES.filter((c) => c.key.startsWith(`${prefix}_`));
            const total = cats.reduce((s, c) => s + getCategoryCount(c.key as OptimizationKey), 0);
            return (
              <div key={prefix}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-powder-blue-300 to-powder-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{prefix.toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{label}</h2>
                    <p className="text-sm text-gray-600">{total} total optimizations</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cats.map(renderCard)}
                </div>
              </div>
            );
          })}
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
            💡 <strong>Tip:</strong> Click "Edit" to review and modify recommendations, or "Push"
            to apply them directly.
          </p>
        </div>
      </div>

      {/* Drawer — conditionally mounted so it always starts fresh with latest store data */}
      {selectedCategory && (
        <OptimizationTableDrawer
          key={selectedCategory}
          isOpen={true}
          onClose={() => setSelectedCategory(null)}
          categoryKey={selectedCategory}
          categoryTitle={OPTIMIZATION_CATEGORIES.find((c) => c.key === selectedCategory)?.title ?? ""}
          initialData={categoryData[selectedCategory] ?? []}
          onSave={handleSaveCategory}
          onPush={handlePushCategory}
        />
      )}
    </div>
  );
}