import { create } from 'zustand';
import type { AdsOptimizerResponse } from '@/app/dashboard/ads-optimizer/lib/types';

interface AdsOptimizerStore {
  // Original data from API
  optimizationData: AdsOptimizerResponse | null;
  
  // Edited data (only categories that have been modified)
  editedData: Partial<AdsOptimizerResponse>;
  
  // Track which categories have unsaved changes
  dirtyCategories: Set<keyof AdsOptimizerResponse>;
  
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
  
  // Check if a category has unsaved changes
  isCategoryDirty: (category: keyof AdsOptimizerResponse) => boolean;
  
  // Clear edits for a specific category (after successful push)
  clearCategoryEdits: (category: keyof AdsOptimizerResponse) => void;
  
  // Reset all edits
  resetEdits: () => void;
  
  // Check if any edits exist
  hasEdits: () => boolean;
  
  // Get count of dirty categories
  getDirtyCount: () => number;
}

export const useAdsOptimizerStore = create<AdsOptimizerStore>((set, get) => ({
  optimizationData: null,
  editedData: {},
  dirtyCategories: new Set(),
  
  setOptimizationData: (data) => set({ 
    optimizationData: data,
    editedData: {},
    dirtyCategories: new Set()
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
    // Return edited data if exists, otherwise return original
    return state.editedData[category] ?? state.optimizationData?.[category];
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
  
  resetEdits: () => set({ 
    editedData: {}, 
    dirtyCategories: new Set() 
  }),
  
  hasEdits: () => Object.keys(get().editedData).length > 0,
  
  getDirtyCount: () => get().dirtyCategories.size,
}));