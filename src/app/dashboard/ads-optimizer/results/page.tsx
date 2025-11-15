"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  AlertCircle,
  ChevronRight,
  Edit3,
  Send,
  Save
} from 'lucide-react';
import { adsOptimizerQueryKeys } from '@/lib/hooks/queries/use-ads-optimizer';
import { useAdsOptimizerStore } from '@/lib/hooks/use-ads-optimizer-store';
import { OptimizationTableDrawer } from '../components/OptimizationTableDrawer';
import type { AdsOptimizerResponse, OptimizationCategory } from '../lib/types';

// Optimization categories metadata
const OPTIMIZATION_CATEGORIES: OptimizationCategory[] = [
  {
    key: 'sp_budget',
    title: 'SP Budget Adjustments',
    description: 'Optimize Sponsored Products campaign budgets',
    icon: '💰',
    color: 'from-blue-500 to-blue-600'
  },
  {
    key: 'sb_budget',
    title: 'SB Budget Adjustments',
    description: 'Optimize Sponsored Brands campaign budgets',
    icon: '🏷️',
    color: 'from-purple-500 to-purple-600'
  },
  {
    key: 'sd_budget',
    title: 'SD Budget Adjustments',
    description: 'Optimize Sponsored Display campaign budgets',
    icon: '📺',
    color: 'from-pink-500 to-pink-600'
  },
  {
    key: 'sp_bid',
    title: 'SP Bid Optimizations',
    description: 'Adjust Sponsored Products keyword bids',
    icon: '🎯',
    color: 'from-green-500 to-green-600'
  },
  {
    key: 'sb_bid',
    title: 'SB Bid Optimizations',
    description: 'Adjust Sponsored Brands keyword bids',
    icon: '🎪',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    key: 'sd_bid',
    title: 'SD Bid Optimizations',
    description: 'Adjust Sponsored Display target bids',
    icon: '🎨',
    color: 'from-teal-500 to-teal-600'
  },
  {
    key: 'sp_placement',
    title: 'SP Placement Adjustments',
    description: 'Optimize Sponsored Products placement modifiers',
    icon: '📍',
    color: 'from-orange-500 to-orange-600'
  },
  {
    key: 'sb_placement',
    title: 'SB Placement Adjustments',
    description: 'Optimize Sponsored Brands placement modifiers',
    icon: '📌',
    color: 'from-red-500 to-red-600'
  },
  {
    key: 'sp_new_campaigns',
    title: 'SP New Campaign Suggestions',
    description: 'Create new Sponsored Products campaigns',
    icon: '✨',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    key: 'sb_new_campaigns',
    title: 'SB New Campaign Suggestions',
    description: 'Create new Sponsored Brands campaigns',
    icon: '🌟',
    color: 'from-violet-500 to-violet-600'
  },
  {
    key: 'sp_negatives',
    title: 'SP Negative Keywords',
    description: 'Add negative keywords to Sponsored Products',
    icon: '🚫',
    color: 'from-gray-500 to-gray-600'
  },
  {
    key: 'sb_negatives',
    title: 'SB Negative Keywords',
    description: 'Add negative keywords to Sponsored Brands',
    icon: '⛔',
    color: 'from-slate-500 to-slate-600'
  },
];

export default function AdsOptimizerResultsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    optimizationData, 
    setOptimizationData,
    getCategoryData,
    updateCategory,
    isCategoryDirty,
    clearCategoryEdits,
    getDirtyCount
  } = useAdsOptimizerStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<keyof AdsOptimizerResponse | null>(null);
  const [pushingCategory, setPushingCategory] = useState<string | null>(null);

  useEffect(() => {
    // Try to get data from query cache
    const cachedData = queryClient.getQueryData<AdsOptimizerResponse>(
      adsOptimizerQueryKeys.results()
    );

    if (cachedData) {
      setOptimizationData(cachedData);
      setIsLoading(false);
    } else if (!optimizationData) {
      // No data available, redirect back to form
      router.push('/dashboard/ads-optimizer');
    } else {
      setIsLoading(false);
    }
  }, [queryClient, optimizationData, router, setOptimizationData]);

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!optimizationData) return null;

    const totalOptimizations = OPTIMIZATION_CATEGORIES.reduce((sum, cat) => {
      const data = getCategoryData(cat.key);
      return sum + (Array.isArray(data) ? data.length : 0);
    }, 0);

    const categoriesWithData = OPTIMIZATION_CATEGORIES.filter(cat => {
      const data = getCategoryData(cat.key);
      return Array.isArray(data) && data.length > 0;
    }).length;

    return {
      totalOptimizations,
      categoriesWithData,
      hasErrors: optimizationData.errors && optimizationData.errors.length > 0,
      dirtyCount: getDirtyCount()
    };
  };

  const stats = getSummaryStats();

  // Handle saving data locally
  const handleSaveCategory = (categoryKey: keyof AdsOptimizerResponse, updatedData: any[]) => {
    updateCategory(categoryKey, updatedData);
  };

  // Handle pushing data to backend (API to be implemented)
  const handlePushCategory = async (categoryKey: keyof AdsOptimizerResponse, data: any[]) => {
    setPushingCategory(categoryKey);
    
    try {
      // TODO: Replace with actual API call
      console.log('Pushing data for category:', categoryKey, data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful push, clear edits for this category
      clearCategoryEdits(categoryKey);
      
      alert(`Successfully pushed ${data.length} ${categoryKey} optimizations!`);
    } catch (error) {
      console.error('Failed to push optimizations:', error);
      alert('Failed to push optimizations. Please try again.');
      throw error;
    } finally {
      setPushingCategory(null);
    }
  };

  // Handle direct push without editing
  const handleDirectPush = async (categoryKey: keyof AdsOptimizerResponse) => {
    const data = getCategoryData(categoryKey);
    if (!data || !Array.isArray(data)) return;
    
    await handlePushCategory(categoryKey, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-blue-600 animate-pulse"></div>
        </div>
        
        <div className="blur-sm pointer-events-none p-8">
          <div className="max-w-7xl mx-auto">
            <div className="h-12 bg-gray-200 rounded mb-8 w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-white rounded-xl shadow"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Analyzing Your Campaigns
            </h3>
            <p className="text-gray-600 text-sm">
              AI is processing thousands of data points to generate optimal recommendations...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!optimizationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/ads-optimizer')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Configure</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Optimization Results
              </h1>
              {stats && stats.dirtyCount > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                  {stats.dirtyCount} unsaved
                </span>
              )}
            </div>
            
            {stats && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Optimizations</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalOptimizations}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Categories</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.categoriesWithData}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Messages */}
        {optimizationData.errors && optimizationData.errors.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                  Some Optimizations Had Issues
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {optimizationData.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Categories Grouped by Campaign Type */}
        <div className="space-y-8">
          {/* Sponsored Products */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SP</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sponsored Products</h2>
                <p className="text-sm text-gray-600">
                  {OPTIMIZATION_CATEGORIES.filter(c => c.key.startsWith('sp_'))
                    .reduce((sum, cat) => {
                      const data = getCategoryData(cat.key);
                      return sum + (Array.isArray(data) ? data.length : 0);
                    }, 0)} total optimizations
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPTIMIZATION_CATEGORIES.filter(c => c.key.startsWith('sp_')).map((category) => {
                const data = getCategoryData(category.key);
                const count = Array.isArray(data) ? data.length : 0;
                const isEmpty = count === 0;
                const isDirty = isCategoryDirty(category.key);
                const isPushing = pushingCategory === category.key;

                return (
                  <div
                    key={category.key}
                    className={`
                      bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300
                      p-5 group flex flex-col
                      ${isEmpty ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`
                        w-11 h-11 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200
                        flex items-center justify-center text-xl
                        transition-transform duration-300
                      `}>
                        {category.icon}
                      </div>
                      {isDirty && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded flex items-center gap-1">
                          <Save className="w-2.5 h-2.5" />
                          Edited
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                      {category.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {category.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className={`
                        px-2.5 py-1 rounded text-xs font-medium
                        ${isEmpty 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }
                      `}>
                        {count} {count === 1 ? 'item' : 'items'}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-2">
                      {!isEmpty && (
                        <>
                          <button
                            onClick={() => setSelectedCategory(category.key)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDirectPush(category.key)}
                            disabled={isPushing}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPushing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Pushing...
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Push
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sponsored Brands */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SB</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sponsored Brands</h2>
                <p className="text-sm text-gray-600">
                  {OPTIMIZATION_CATEGORIES.filter(c => c.key.startsWith('sb_'))
                    .reduce((sum, cat) => {
                      const data = getCategoryData(cat.key);
                      return sum + (Array.isArray(data) ? data.length : 0);
                    }, 0)} total optimizations
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPTIMIZATION_CATEGORIES.filter(c => c.key.startsWith('sb_')).map((category) => {
                const data = getCategoryData(category.key);
                const count = Array.isArray(data) ? data.length : 0;
                const isEmpty = count === 0;
                const isDirty = isCategoryDirty(category.key);
                const isPushing = pushingCategory === category.key;

                return (
                  <div
                    key={category.key}
                    className={`
                      bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300
                      p-5 group flex flex-col
                      ${isEmpty ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`
                        w-11 h-11 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200
                        flex items-center justify-center text-xl
                        transition-transform duration-300
                      `}>
                        {category.icon}
                      </div>
                      {isDirty && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded flex items-center gap-1">
                          <Save className="w-2.5 h-2.5" />
                          Edited
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                      {category.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {category.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className={`
                        px-2.5 py-1 rounded text-xs font-medium
                        ${isEmpty 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }
                      `}>
                        {count} {count === 1 ? 'item' : 'items'}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-2">
                      {!isEmpty && (
                        <>
                          <button
                            onClick={() => setSelectedCategory(category.key)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDirectPush(category.key)}
                            disabled={isPushing}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPushing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Pushing...
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Push
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sponsored Display */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SD</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sponsored Display</h2>
                <p className="text-sm text-gray-600">
                  {OPTIMIZATION_CATEGORIES.filter(c => c.key.startsWith('sd_'))
                    .reduce((sum, cat) => {
                      const data = getCategoryData(cat.key);
                      return sum + (Array.isArray(data) ? data.length : 0);
                    }, 0)} total optimizations
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPTIMIZATION_CATEGORIES.filter(c => c.key.startsWith('sd_')).map((category) => {
                const data = getCategoryData(category.key);
                const count = Array.isArray(data) ? data.length : 0;
                const isEmpty = count === 0;
                const isDirty = isCategoryDirty(category.key);
                const isPushing = pushingCategory === category.key;

                return (
                  <div
                    key={category.key}
                    className={`
                      bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300
                      p-5 group flex flex-col
                      ${isEmpty ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`
                        w-11 h-11 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200
                        flex items-center justify-center text-xl
                        transition-transform duration-300
                      `}>
                        {category.icon}
                      </div>
                      {isDirty && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded flex items-center gap-1">
                          <Save className="w-2.5 h-2.5" />
                          Edited
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                      {category.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {category.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className={`
                        px-2.5 py-1 rounded text-xs font-medium
                        ${isEmpty 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }
                      `}>
                        {count} {count === 1 ? 'item' : 'items'}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-2">
                      {!isEmpty && (
                        <>
                          <button
                            onClick={() => setSelectedCategory(category.key)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDirectPush(category.key)}
                            disabled={isPushing}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPushing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Pushing...
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                Push
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-900 text-center">
            💡 <strong>Tip:</strong> Click "Edit" to review and modify recommendations, or "Push" to apply them directly. 
            Edited changes are saved locally until you push them.
          </p>
        </div>
      </div>

      {/* Optimization Table Drawer */}
      {selectedCategory && (
        <OptimizationTableDrawer
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          categoryKey={selectedCategory}
          categoryTitle={OPTIMIZATION_CATEGORIES.find(c => c.key === selectedCategory)?.title || ''}
          data={getCategoryData(selectedCategory) || []}
          onSave={handleSaveCategory}
          onPush={handlePushCategory}
        />
      )}
    </div>
  );
}