'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardService } from '@/lib/api/services/dashboard.service'
import type {
  PlacementData,
  InventoryHealthResponse,
  AsinLiquidationResponse,
  CampaignSummaryItem,
  TargetingAnalysisItem,
  SalesTrendAsinItem,
  WeeklyDataResponse,
  AdsSalesResponse,
  AsinSummaryItem,
  AdsTrendItem
} from '@/lib/api/services/dashboard.service'

// Query keys for consistent caching
export const dashboardQueryKeys = {
  placement: (startDate: string, endDate: string) => ['dashboard', 'placement', startDate, endDate] as const,
  inventoryHealth: (options?: any) => ['dashboard', 'inventory-health', options] as const,
  asinLiquidation: (daysWindow?: number) => ['dashboard', 'asin-liquidation', daysWindow] as const,
  campaignSummary: (period?: string) => ['dashboard', 'campaign-summary', period] as const,
  targetingAnalysis: (period?: string) => ['dashboard', 'targeting-analysis', period] as const,
  salesTrendAsin: (period?: string) => ['dashboard', 'sales-trend-asin', period] as const,
  weeklyData: (options?: any) => ['dashboard', 'weekly-data', options] as const,
  adsSalesData: (options: any) => ['dashboard', 'ads-sales-data', options] as const,
  asinSummary: (options: any) => ['dashboard', 'asin-summary', options] as const,
  adsTrend: (days?: number) => ['dashboard', 'ads-trend', days] as const,
}

// Placement Data Hook
export function usePlacementData(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: dashboardQueryKeys.placement(startDate, endDate),
    queryFn: () => dashboardService.getPlacementData(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Inventory Health Hook
export function useInventoryHealth(options?: {
  sales_days?: number
  reorder_cover_days?: number
  supply_chain_lead_time?: number
}) {
  return useQuery({
    queryKey: dashboardQueryKeys.inventoryHealth(options),
    queryFn: () => dashboardService.getInventoryHealth(options),
    staleTime: 10 * 60 * 1000, // 10 minutes - inventory changes less frequently
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// ASIN Liquidation Hook
export function useAsinLiquidation(daysWindow?: number) {
  return useQuery({
    queryKey: dashboardQueryKeys.asinLiquidation(daysWindow),
    queryFn: () => dashboardService.getAsinLiquidation(daysWindow),
    staleTime: 15 * 60 * 1000, // 15 minutes - liquidation data changes slowly
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Campaign Summary Hook
export function useCampaignSummary(period?: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.campaignSummary(period),
    queryFn: () => dashboardService.getCampaignSummary(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Targeting Analysis Hook
export function useTargetingAnalysis(period?: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.targetingAnalysis(period),
    queryFn: () => dashboardService.getTargetingAnalysis(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Sales Trend ASIN Hook
export function useSalesTrendAsin(period?: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.salesTrendAsin(period),
    queryFn: () => dashboardService.getSalesTrendAsin(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Weekly Data Hook
export function useWeeklyData(options?: {
  focus_level?: 'high' | 'medium' | 'low' | 'all'
  aggregation?: 'weekly' | 'monthly'
}) {
  return useQuery({
    queryKey: dashboardQueryKeys.weeklyData(options),
    queryFn: () => dashboardService.getWeeklyData(options),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Ads Sales Data Hook
export function useAdsSalesData(options: {
  start_date: string
  end_date: string
  focus_level?: 'high' | 'medium' | 'low' | 'all'
}, enabled = true) {
  return useQuery({
    queryKey: dashboardQueryKeys.adsSalesData(options),
    queryFn: () => dashboardService.getAdsSalesData(options),
    enabled: enabled && !!options.start_date && !!options.end_date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ASIN Summary Hook
export function useAsinSummary(options: {
  start_date: string
  end_date: string
  focus_level?: 'high' | 'medium' | 'low' | 'all'
}, enabled = true) {
  return useQuery({
    queryKey: dashboardQueryKeys.asinSummary(options),
    queryFn: () => dashboardService.getAsinSummary(options),
    enabled: enabled && !!options.start_date && !!options.end_date,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Ads Trend Hook
export function useAdsTrend(days?: number) {
  return useQuery({
    queryKey: dashboardQueryKeys.adsTrend(days),
    queryFn: () => dashboardService.getAdsTrend(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Utility hook for manual refresh
export function useDashboardQueryRefresh() {
  const queryClient = useQueryClient()
  
  return {
    refreshPlacementData: async (startDate: string, endDate: string) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.placement(startDate, endDate) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.placement(startDate, endDate) })
    },
    refreshInventoryHealth: async (options?: any) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.inventoryHealth(options) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.inventoryHealth(options) })
    },
    refreshAsinLiquidation: async (daysWindow?: number) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.asinLiquidation(daysWindow) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.asinLiquidation(daysWindow) })
    },
    refreshCampaignSummary: async (period?: string) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.campaignSummary(period) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.campaignSummary(period) })
    },
    refreshTargetingAnalysis: async (period?: string) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.targetingAnalysis(period) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.targetingAnalysis(period) })
    },
    refreshSalesTrendAsin: async (period?: string) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.salesTrendAsin(period) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.salesTrendAsin(period) })
    },
    refreshWeeklyData: async (options?: any) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.weeklyData(options) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.weeklyData(options) })
    },
    refreshAdsSalesData: async (options: any) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.adsSalesData(options) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.adsSalesData(options) })
    },
    refreshAsinSummary: async (options: any) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.asinSummary(options) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.asinSummary(options) })
    },
    refreshAdsTrend: async (days?: number) => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.adsTrend(days) })
      return queryClient.refetchQueries({ queryKey: dashboardQueryKeys.adsTrend(days) })
    },
    refreshAll: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      return queryClient.refetchQueries({ queryKey: ['dashboard'] })
    },
  }
}

// Specific hooks for dashboard sections

// Main Dashboard Data (combines multiple APIs)
export function useMainDashboardData(options?: {
  start_date?: string
  end_date?: string
  period?: string
  focus_level?: 'high' | 'medium' | 'low' | 'all'
}) {
  const defaultOptions = {
    start_date: options?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: options?.end_date || new Date().toISOString().split('T')[0],
    period: options?.period || '30d',
    focus_level: options?.focus_level || 'all' as const,
  }

  const campaignSummary = useCampaignSummary(defaultOptions.period)
  const weeklyData = useWeeklyData({ 
    focus_level: defaultOptions.focus_level,
    aggregation: 'weekly'
  })
  const adsSalesData = useAdsSalesData({
    start_date: defaultOptions.start_date,
    end_date: defaultOptions.end_date,
    focus_level: defaultOptions.focus_level
  })

  return {
    campaignSummary,
    weeklyData,
    adsSalesData,
    isLoading: campaignSummary.isLoading || weeklyData.isLoading || adsSalesData.isLoading,
    isError: campaignSummary.isError || weeklyData.isError || adsSalesData.isError,
    error: campaignSummary.error || weeklyData.error || adsSalesData.error,
  }
}

// ASIN Performance Data
export function useAsinPerformanceData(options?: {
  start_date?: string
  end_date?: string
  period?: string
  focus_level?: 'high' | 'medium' | 'low' | 'all'
}) {
  const defaultOptions = {
    start_date: options?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: options?.end_date || new Date().toISOString().split('T')[0],
    period: options?.period || '30d',
    focus_level: options?.focus_level || 'all' as const,
  }

  const asinSummary = useAsinSummary({
    start_date: defaultOptions.start_date,
    end_date: defaultOptions.end_date,
    focus_level: defaultOptions.focus_level
  })
  const salesTrendAsin = useSalesTrendAsin(defaultOptions.period)
  const targetingAnalysis = useTargetingAnalysis(defaultOptions.period)

  return {
    asinSummary,
    salesTrendAsin,
    targetingAnalysis,
    isLoading: asinSummary.isLoading || salesTrendAsin.isLoading || targetingAnalysis.isLoading,
    isError: asinSummary.isError || salesTrendAsin.isError || targetingAnalysis.isError,
    error: asinSummary.error || salesTrendAsin.error || targetingAnalysis.error,
  }
}

// Campaign Performance Data
export function useCampaignPerformanceData(options?: {
  period?: string
  days?: number
}) {
  const defaultOptions = {
    period: options?.period || '30d',
    days: options?.days || 90,
  }

  const campaignSummary = useCampaignSummary(defaultOptions.period)
  const targetingAnalysis = useTargetingAnalysis(defaultOptions.period)
  const adsTrend = useAdsTrend(defaultOptions.days)

  return {
    campaignSummary,
    targetingAnalysis,
    adsTrend,
    isLoading: campaignSummary.isLoading || targetingAnalysis.isLoading || adsTrend.isLoading,
    isError: campaignSummary.isError || targetingAnalysis.isError || adsTrend.isError,
    error: campaignSummary.error || targetingAnalysis.error || adsTrend.error,
  }
}

// Inventory Performance Data
export function useInventoryPerformanceData(options?: {
  sales_days?: number
  reorder_cover_days?: number
  supply_chain_lead_time?: number
  liquidation_days_window?: number
}) {
  const defaultOptions = {
    sales_days: options?.sales_days || 30,
    reorder_cover_days: options?.reorder_cover_days || 60,
    supply_chain_lead_time: options?.supply_chain_lead_time || 60,
    liquidation_days_window: options?.liquidation_days_window || 30,
  }

  const inventoryHealth = useInventoryHealth({
    sales_days: defaultOptions.sales_days,
    reorder_cover_days: defaultOptions.reorder_cover_days,
    supply_chain_lead_time: defaultOptions.supply_chain_lead_time
  })
  const asinLiquidation = useAsinLiquidation(defaultOptions.liquidation_days_window)

  return {
    inventoryHealth,
    asinLiquidation,
    isLoading: inventoryHealth.isLoading || asinLiquidation.isLoading,
    isError: inventoryHealth.isError || asinLiquidation.isError,
    error: inventoryHealth.error || asinLiquidation.error,
  }
}
