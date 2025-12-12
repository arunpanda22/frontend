import { create } from 'zustand';
import type { AdsOptimizerResponse } from '@/app/dashboard/ads-optimizer/lib/types';

// Push result structure from backend
export interface PushResultData {
  push_id: string;
  total_items: number;
  successful: number;
  failed: number;
  duplicates?: number;
  errors?: number;
  success_rate: string;
  timestamp: string;
  details?: {
    successful_items: any[];
    failed_items: any[];
    duplicate_items?: any[];
    error_items?: any[];
  };
}

interface AdsOptimizerStore {
  // Original data from API
  optimizationData: AdsOptimizerResponse | null;
  
  // Edited data (only categories that have been modified)
  editedData: Partial<AdsOptimizerResponse>;
  
  // Track which categories have unsaved changes
  dirtyCategories: Set<keyof AdsOptimizerResponse>;
  
  // Track which categories have been pushed
  pushedCategories: Set<keyof AdsOptimizerResponse>;
  
  // Store push results for each category
  pushResults: Partial<Record<keyof AdsOptimizerResponse, PushResultData>>;
  
  // Set initial optimization data from API
  setOptimizationData: (data: AdsOptimizerResponse) => void;
  
  // Update a specific category with edited data
  updateCategory: <K extends keyof AdsOptimizerResponse>(
    category: K,
    data: AdsOptimizerResponse[K]
  ) => void;
  
  // Get data for a category (returns edited version if exists, otherwise original)
  getCategoryData: <K extends keyof AdsOptimizerResponse>(
    category: K
  ) => AdsOptimizerResponse[K] | undefined;

  getAllCategoriesData: () => Record<string, any[]>;
  
  // Check if a category has unsaved changes
  isCategoryDirty: (category: keyof AdsOptimizerResponse) => boolean;
  
  // Clear edits for a specific category (after successful push)
  clearCategoryEdits: (category: keyof AdsOptimizerResponse) => void;
  
  // Mark category as pushed, DELETE its data, and store result
  markCategoryAsPushed: (category: keyof AdsOptimizerResponse, result?: PushResultData) => void;
  
  // Check if category has been pushed
  isCategoryPushed: (category: keyof AdsOptimizerResponse) => boolean;
  
  // Get push result for a category
  getPushResult: (category: keyof AdsOptimizerResponse) => PushResultData | undefined;
  
  // Reset all edits
  resetEdits: () => void;
  
  // Check if any edits exist
  hasEdits: () => boolean;
  
  // Get count of dirty categories
  getDirtyCount: () => number;
  
  // Get all categories that have data and haven't been pushed
  getAvailableCategories: () => Array<keyof AdsOptimizerResponse>;
  
  // Reset pushed categories (for new optimization run)
  resetPushedCategories: () => void;
  
  // Get count of items in a category
  getCategoryCount: (category: keyof AdsOptimizerResponse) => number;
}

export const useAdsOptimizerStore = create<AdsOptimizerStore>((set, get) => ({
  optimizationData: null,
  editedData: {},
  dirtyCategories: new Set(),
  pushedCategories: new Set(),
  pushResults: {},
  
  setOptimizationData: (data) => set({ 
    optimizationData: data,
    editedData: {},
    dirtyCategories: new Set(),
    pushedCategories: new Set(),
    pushResults: {}
  }),
  
  // UPDATED: When editing, remove data from original store and move to editedData only
  updateCategory: (category, data) => set((state) => {
    const newDirtyCategories = new Set(state.dirtyCategories);
    newDirtyCategories.add(category);
    
    // Remove from original data when editing
    const newOptimizationData = state.optimizationData ? { ...state.optimizationData } : null;
    if (newOptimizationData) {
      (newOptimizationData as any)[category] = [];
    }
    
    return {
      optimizationData: newOptimizationData,
      editedData: {
        ...state.editedData,
        [category]: data,
      },
      dirtyCategories: newDirtyCategories,
    };
  }),
  
  getCategoryData: (category) => {
    const state = get();
    
    // Return edited data if exists, otherwise return original
    return state.editedData[category] ?? state.optimizationData?.[category];
  },

  getAllCategoriesData: () => {
    const state = get();
    const data = state.optimizationData;
    if (!data) return {};

    const result: Record<string, any[]> = {};

    Object.entries(data).forEach(([key, value]) => {
      const k = key as keyof AdsOptimizerResponse;

      // Skip categories already pushed
      if (state.pushedCategories.has(k)) return;

      // Include only array categories with data
      if (Array.isArray(value) && value.length > 0) {
        result[key] = state.editedData[k] ?? value;
      }
    });

    return result;
  },
  
  isCategoryDirty: (category) => {
    return get().dirtyCategories.has(category);
  },
  
  clearCategoryEdits: (category) => set((state) => {
    const newEditedData = { ...state.editedData };
    delete newEditedData[category];
    
    const newDirtyCategories = new Set(state.dirtyCategories);
    newDirtyCategories.delete(category);
    
    return {
      editedData: newEditedData,
      dirtyCategories: newDirtyCategories,
    };
  }),
  
  // DELETE data from memory after push (works for both dry-run and actual push)
  markCategoryAsPushed: (category, result) => set((state) => {
    const newPushedCategories = new Set(state.pushedCategories);
    newPushedCategories.add(category);
    
    // DELETE edited data for this category
    const newEditedData = { ...state.editedData };
    delete newEditedData[category];
    
    // DELETE original data for this category
    const newOptimizationData = state.optimizationData ? { ...state.optimizationData } : null;
    if (newOptimizationData) {
      (newOptimizationData as any)[category] = [];
    }
    
    const newDirtyCategories = new Set(state.dirtyCategories);
    newDirtyCategories.delete(category);
    
    // Store push result if provided
    const newPushResults = { ...state.pushResults };
    if (result) {
      newPushResults[category] = result;
    }
    
    return {
      optimizationData: newOptimizationData,
      pushedCategories: newPushedCategories,
      editedData: newEditedData,
      dirtyCategories: newDirtyCategories,
      pushResults: newPushResults,
    };
  }),
  
  isCategoryPushed: (category) => {
    return get().pushedCategories.has(category);
  },
  
  getPushResult: (category) => {
    return get().pushResults[category];
  },
  
  resetEdits: () => set({ 
    editedData: {}, 
    dirtyCategories: new Set() 
  }),
  
  hasEdits: () => Object.keys(get().editedData).length > 0,
  
  getDirtyCount: () => get().dirtyCategories.size,
  
  getAvailableCategories: () => {
    const state = get();
    const categories: Array<keyof AdsOptimizerResponse> = [
      'sp_budget', 'sb_budget', 'sd_budget',
      'sp_bid', 'sb_bid', 'sd_bid',
      'sp_placement', 'sb_placement',
      'sp_new_campaigns', 'sb_new_campaigns',
      'sp_negatives', 'sb_negatives'
    ];
    
    return categories.filter(cat => {
      // Don't include categories that have been pushed
      if (state.pushedCategories.has(cat)) return false;
      
      const data = state.editedData[cat] ?? state.optimizationData?.[cat];
      return data && Array.isArray(data) && data.length > 0;
    });
  },
  
  resetPushedCategories: () => set({ 
    pushedCategories: new Set(),
    pushResults: {}
  }),
  
  getCategoryCount: (category) => {
    const state = get();
    
    // If already pushed, return 0
    if (state.pushedCategories.has(category)) return 0;
    
    const data = state.editedData[category] ?? state.optimizationData?.[category];
    return Array.isArray(data) ? data.length : 0;
  },
}));