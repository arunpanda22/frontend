// src/app/maindashboard/searchqueryperformance/utils/sqp.utils.ts

import { MonthlyMetric } from '../types/sqp.types';

export interface ProcessedChartData {
  // For metric cards
  impressions: {
    total: number[];
    asin: number[];
    share: number[];
  };
  clicks: {
    total: number[];
    asin: number[];
    share: number[];
  };
  purchases: {
    total: number[];
    asin: number[];
    share: number[];
  };
  // For price and conversion charts
  weightedSales: {
    total_weighted_click_sales: number[];
    asin_weighted_click_sales: number[];
  };
  conversion: {
    total_conversion: number[];
    asin_conversion: number[];
  };
}

/**
 * Process monthly metrics from backend into chart-ready format
 */
export const processMonthlyMetrics = (
  monthlyMetrics: MonthlyMetric[],
  filterAsin: string = "All ASINs"  // default to aggregated data
): ProcessedChartData => {
  // Filter data by ASIN (or "All ASINs")
  const filteredMetrics = monthlyMetrics
    .filter(m => m.asin === filterAsin)
    .sort((a, b) => a.year_month.localeCompare(b.year_month));

  // Map fields directly — no aggregation needed because backend already provides aggregated data
  return {
    impressions: {
      total: filteredMetrics.map(m => m.total_query_impression_count),
      asin: filteredMetrics.map(m => m.asin_impression_count),
      share: filteredMetrics.map(m => m.asin_impression_share),
    },
    clicks: {
      total: filteredMetrics.map(m => m.total_click_count),
      asin: filteredMetrics.map(m => m.asin_click_count),
      share: filteredMetrics.map(m => m.asin_click_share),
    },
    purchases: {
      total: filteredMetrics.map(m => m.total_purchase_count),
      asin: filteredMetrics.map(m => m.asin_purchase_count),
      share: filteredMetrics.map(m => m.asin_purchase_share),
    },
    weightedSales: {
      total_weighted_click_sales: filteredMetrics.map(m => m.total_weighted_click_sales),
      asin_weighted_click_sales: filteredMetrics.map(m => m.asin_weighted_click_sales),
    },
    conversion: {
      total_conversion: filteredMetrics.map(m => m.total_conversion),
      asin_conversion: filteredMetrics.map(m => m.asin_conversion),
    },
  };
};

/**
 * Generate months array based on year_month format from backend
 */
export const getMonthsFromData = (monthlyMetrics: MonthlyMetric[]): string[] => {
  if (!monthlyMetrics || monthlyMetrics.length === 0) {
    return getMonthsArray(); // fallback to default
  }

  // Extract unique months from data and sort them
  const uniqueMonths = [...new Set(monthlyMetrics.map(m => m.year_month))]
    .sort((a, b) => a.localeCompare(b));

  // Convert YYYY-MM format to display format
  return uniqueMonths.map(month => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  });
};

/**
 * Generate months array for the last 12 months (fallback)
 */
export const getMonthsArray = (): string[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: string[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(months[date.getMonth()]);
  }
  
  return result;
};

/**
 * Calculate trend percentage between current and previous month
 */
export const calculateTrend = (data: number[]): { value: string; positive: boolean } => {
  if (!data || data.length < 2) return { value: '+0.0%', positive: true };
  
  const currentValue = data[data.length - 1]; // Last month (most recent)
  const previousValue = data[data.length - 2]; // Second to last month
  
  if (previousValue === 0) return { value: '+0.0%', positive: true };
  
  const change = ((currentValue - previousValue) / previousValue) * 100;
  const sign = change >= 0 ? '+' : '';
  return {
    value: `${sign}${change.toFixed(1)}%`,
    positive: change >= 0,
  };
};

/**
 * Get last month value from data array
 */
export const getLastMonthValue = (data: number[]): number => {
  if (!data || data.length === 0) return 0;
  return data[data.length - 1];
};

/**
 * Format large numbers for display
 */
export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
};