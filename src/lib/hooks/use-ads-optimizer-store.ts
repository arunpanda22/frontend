import { create } from 'zustand';
import type { AdsOptimizerResponse } from '@/app/dashboard/ads-optimizer/lib/types';

interface AdsOptimizerStore {
  // Original data from API
  optimizationData: AdsOptimizerResponse | null;
  
  // Edited data (only categories that have been modified)
  editedData: Partial<AdsOptimizerResponse>;
  
  // Track which categories have unsaved changes
  dirtyCategories: Set<keyof AdsOptimizerResponse>;
  
  // Track which categories have been pushed (to hide them)
  pushedCategories: Set<keyof AdsOptimizerResponse>;
  
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
  
  // Mark category as pushed and remove from store
  markCategoryAsPushed: (category: keyof AdsOptimizerResponse) => void;
  
  // Check if category has been pushed
  isCategoryPushed: (category: keyof AdsOptimizerResponse) => boolean;
  
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
}

export const useAdsOptimizerStore = create<AdsOptimizerStore>((set, get) => ({
  optimizationData: null,
  editedData: {},
  dirtyCategories: new Set(),
  pushedCategories: new Set(),
  
  setOptimizationData: (data) => set({ 
    optimizationData: data,
    editedData: {},
    dirtyCategories: new Set(),
    pushedCategories: new Set() // Reset pushed categories on new data
  }),
  
  updateCategory: (category, data) => set((state) => {
    const newDirtyCategories = new Set(state.dirtyCategories);
    newDirtyCategories.add(category);
    
    return {
      editedData: {
        ...state.editedData,
        [category]: data,
      },
      dirtyCategories: newDirtyCategories,
    };
  }),
  
  getCategoryData: (category) => {
    const state = get();
    
    // If category has been pushed, return undefined (hide it)
    if (state.pushedCategories.has(category)) {
      return undefined;
    }
    
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
        result[key] = value;
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
  
  markCategoryAsPushed: (category) => set((state) => {
    const newPushedCategories = new Set(state.pushedCategories);
    newPushedCategories.add(category);
    
    // Clear edits for this category
    const newEditedData = { ...state.editedData };
    delete newEditedData[category];
    
    const newDirtyCategories = new Set(state.dirtyCategories);
    newDirtyCategories.delete(category);
    
    // CRITICAL FIX: Remove from original optimizationData as well
    const newOptimizationData = state.optimizationData 
      ? { ...state.optimizationData }
      : null;
    
    if (newOptimizationData && category in newOptimizationData) {
      // Set to empty array to effectively remove the data
      (newOptimizationData as any)[category] = [];
    }
    
    return {
      pushedCategories: newPushedCategories,
      editedData: newEditedData,
      dirtyCategories: newDirtyCategories,
      optimizationData: newOptimizationData,
    };
  }),
  
  isCategoryPushed: (category) => {
    return get().pushedCategories.has(category);
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
      const data = state.editedData[cat] ?? state.optimizationData?.[cat];
      return data && Array.isArray(data) && data.length > 0 && !state.pushedCategories.has(cat);
    });
  },
  
  resetPushedCategories: () => set({ 
    pushedCategories: new Set() 
  }),
}));