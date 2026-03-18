import { create } from 'zustand';
import type { AdsOptimizerResponse } from '@/app/dashboard/ads-optimizer/lib/types';

export type OptimizationKey = Exclude<keyof AdsOptimizerResponse, 'errors'>;

export const OPTIMIZATION_KEYS: OptimizationKey[] = [
  'sp_budget', 'sb_budget', 'sd_budget',
  'sp_bid', 'sb_bid', 'sd_bid',
  'sp_placement', 'sb_placement',
  'sp_new_campaigns', 'sb_new_campaigns',
  'sp_negatives', 'sb_negatives',
];

export interface PushResultData {
  push_id: string;
  total_items: number;
  successful: number;
  failed: number;
  duplicates?: number;
  errors?: number;
  success_rate: string;
  timestamp: string;
  s3_location?: string | null;
  // details shape differs per category — typed loosely until each
  // category's frontend handler is built from real response logs.
  details?: Record<string, any>;
}

interface AdsOptimizerStore {
  // ── Single source of truth ──────────────────────────────────────────────
  // categoryData holds the current data for every category.
  // It is initialised from the API response and mutated in-place when the
  // user edits or deletes rows. No separate editedData/optimizationData split.
  categoryData: Partial<Record<OptimizationKey, any[]>>;

  // Top-level errors from the API response
  errors: string[];

  // Which categories have unsaved changes (mutated vs original)
  dirtyCategories: Set<OptimizationKey>;

  // Which categories have been pushed
  pushedCategories: Set<OptimizationKey>;

  // Push results per category
  pushResults: Partial<Record<OptimizationKey, PushResultData>>;

  // ── Actions ─────────────────────────────────────────────────────────────

  /** Load initial data from the API response. Resets all state. */
  setOptimizationData: (data: AdsOptimizerResponse) => void;

  /** Overwrite a category's data (called by Save button in the drawer). */
  setCategoryData: (key: OptimizationKey, data: any[]) => void;

  /** Get current data for a category (always up-to-date). */
  getCategoryData: (key: OptimizationKey) => any[];

  /** Get the row count for a category (0 if pushed). */
  getCategoryCount: (key: OptimizationKey) => number;

  /** Get all categories that have data and haven't been pushed. */
  getAvailableCategories: () => OptimizationKey[];

  /** Mark a category as pushed and store its result. */
  markCategoryAsPushed: (key: OptimizationKey, result?: PushResultData) => void;

  isCategoryPushed: (key: OptimizationKey) => boolean;
  isCategoryDirty: (key: OptimizationKey) => boolean;
  getPushResult: (key: OptimizationKey) => PushResultData | undefined;
  getDirtyCount: () => number;

  resetPushedCategories: () => void;
}

export const useAdsOptimizerStore = create<AdsOptimizerStore>((set, get) => ({
  categoryData: {},
  errors: [],
  dirtyCategories: new Set(),
  pushedCategories: new Set(),
  pushResults: {},

  // ── setOptimizationData ─────────────────────────────────────────────────
  setOptimizationData: (data) => {
    const categoryData: Partial<Record<OptimizationKey, any[]>> = {};
    OPTIMIZATION_KEYS.forEach((key) => {
      const val = data[key];
      if (Array.isArray(val)) categoryData[key] = val;
    });
    set({
      categoryData,
      errors: data.errors ?? [],
      dirtyCategories: new Set(),
      pushedCategories: new Set(),
      pushResults: {},
    });
  },

  // ── setCategoryData ─────────────────────────────────────────────────────
  // This is the ONLY write path for category data after initialisation.
  // Called by the drawer's Save button with the user's edited/pruned array.
  setCategoryData: (key, data) =>
    set((state) => {
      const newDirty = new Set(state.dirtyCategories);
      newDirty.add(key);
      return {
        categoryData: { ...state.categoryData, [key]: data },
        dirtyCategories: newDirty,
      };
    }),

  // ── getCategoryData ─────────────────────────────────────────────────────
  getCategoryData: (key) => get().categoryData[key] ?? [],

  // ── getCategoryCount ────────────────────────────────────────────────────
  getCategoryCount: (key) => {
    const state = get();
    if (state.pushedCategories.has(key)) return 0;
    return state.categoryData[key]?.length ?? 0;
  },

  // ── getAvailableCategories ──────────────────────────────────────────────
  getAvailableCategories: () => {
    const state = get();
    return OPTIMIZATION_KEYS.filter(
      (key) =>
        !state.pushedCategories.has(key) &&
        (state.categoryData[key]?.length ?? 0) > 0,
    );
  },

  // ── markCategoryAsPushed ────────────────────────────────────────────────
  markCategoryAsPushed: (key, result) =>
    set((state) => {
      const newPushed = new Set(state.pushedCategories);
      newPushed.add(key);
      const newDirty = new Set(state.dirtyCategories);
      newDirty.delete(key);
      return {
        pushedCategories: newPushed,
        dirtyCategories: newDirty,
        categoryData: { ...state.categoryData, [key]: [] },
        pushResults: result
          ? { ...state.pushResults, [key]: result }
          : state.pushResults,
      };
    }),

  isCategoryPushed: (key) => get().pushedCategories.has(key),
  isCategoryDirty:  (key) => get().dirtyCategories.has(key),
  getPushResult:    (key) => get().pushResults[key],
  getDirtyCount:    ()    => get().dirtyCategories.size,

  resetPushedCategories: () =>
    set({ pushedCategories: new Set(), pushResults: {} }),
}));