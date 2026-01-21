// src/app/dashboard/asinperformance/page.tsx
"use client";
import React, { useState } from "react";
import { Package, DollarSign, Percent, Coins, RotateCcw } from "lucide-react";
import DotScatterChart from "./components/DotScatterChart";
import AsinPerformanceTable from "./components/PerformanceTable";
import OrganicSalesCard from "./components/OrganicSalesBarChart";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { MetricsCard } from "@/components/dashboard/ui";
import { useAsinPerformanceData } from "@/lib/hooks/queries/use-dashboard";
import type { CombinedAsinSummaryStats } from "@/lib/api/services/dashboard.service";
import {
  DateRangeProvider,
  useDateRange,
} from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { Range } from "react-date-range";

// Type guard to check if stats are combined
function isCombinedStats(
  stats: any
): stats is CombinedAsinSummaryStats {
  return 'total_revenue' in stats;
}

interface AsinData {
  asin: string;
  product_name: string;
  "Total Quantity": number;
  "Total Sales": number;
  "Sales ASP": number;
  BuyBox: number;
  "Organic Sales": number;
  Conversion: number;
  ACOS: number | null;
  TACOS: number | null;
  "Replacement Rate": number | null;
  "Return Rate": number | null;
}



// Separate component that uses the context
const AsinIntelligenceContent = () => {
  // Access the date range context
  const { dateRange, updateCustomDates } = useDateRange();
  const { 
    formatCurrency, 
    formatNumber, 
    formatCurrencyNoDecimal, 
    getCurrencySymbol, 
    formatPercentage 
  } = useCurrency();

  // Convert context date range to FilterBar format
  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
      // Format dates as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      updateCustomDates(
        formatLocalDate(newRange.startDate),
        formatLocalDate(newRange.endDate)
      );
    }
  };

  // Fetch ASIN performance data from API using date range from context
  // Now includes hasVendorAccount flag
  const {
    asinSummary,
    organicSalesData,
    hasVendorAccount, // NEW: Flag indicating if user has vendor account
    isLoading,
    isError,
    error,
  } = useAsinPerformanceData({
    start_date: dateRange.startDate || "",
    end_date: dateRange.endDate || "",
    period: dateRange.preset === "custom" ? "custom" : dateRange.preset,
    focus_level: "all",
  });

  // Debug logging
  React.useEffect(() => {
    if (asinSummary?.data) {
      if (asinSummary.data.asin_summary) {
        console.log(
          "📊 ASIN Summary loaded:",
          asinSummary.data.asin_summary.length,
          "items",
          hasVendorAccount ? "(SC + VC)" : "(SC only)"
        );
      } else if (Array.isArray(asinSummary.data)) {
        console.log("📊 ASIN Summary loaded:", asinSummary.data.length, "items");
      }
    }
    if (isError) {
      console.error("❌ API Error:", error);
    }
  }, [asinSummary, isError, error, hasVendorAccount]);

  // Transform API data for components - handle both seller-only and combined data
  const asinData: AsinData[] = React.useMemo(() => {
    let rawData = null;

    if (asinSummary?.data?.asin_summary) {
      rawData = asinSummary.data.asin_summary;
    } else if (asinSummary?.data && Array.isArray(asinSummary.data)) {
      rawData = asinSummary.data;
    }

    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    return rawData.map((item: any) => {
      const actualItem = item.json || item;
      
      if (hasVendorAccount) {
        // Combined SC + VC data
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Quantity": actualItem.total_quantity || 0,
          "Total Sales": actualItem.total_revenue || 0,
          "Sales ASP": actualItem.asp_combined || 0,
          BuyBox: actualItem.sc_buy_box_percentage || 0,
          "Organic Sales": actualItem.organic_sales || 0,
          Conversion: actualItem.sc_conversion_rate || 0,
          ACOS: actualItem.acos_percent,
          TACOS: actualItem.tacos_percent,
          "Replacement Rate": actualItem.sc_replacement_rate,
          "Return Rate": actualItem.sc_return_rate,
        };
      } else {
        // Seller-only data
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Quantity": actualItem.total_units || 0,
          "Total Sales": actualItem.total_sales || 0,
          "Sales ASP": actualItem.asp || 0,
          BuyBox: actualItem.buy_box_percentage || 0,
          "Organic Sales": (actualItem.total_sales || 0) - (actualItem.total_ad_sales || 0),
          Conversion: actualItem.conversion_rate || 0,
          ACOS: actualItem.acos_percent,
          TACOS: actualItem.tacos_percent,
          "Replacement Rate": actualItem.replacement_rate,
          "Return Rate": actualItem.return_rate,
        };
      }
    });
  }, [asinSummary, hasVendorAccount]);

  // Extract summary stats from API - handle both response types
  const summaryStats = React.useMemo(() => {
    const apiSummaryStats = asinSummary?.data?.summary_stats;

    if (!apiSummaryStats) {
      return null;
    }

    if (hasVendorAccount && isCombinedStats(apiSummaryStats)) {
      // TypeScript now knows this is CombinedAsinSummaryStats
      return {
        totalSales: apiSummaryStats.total_revenue || 0,
        totalQuantity: apiSummaryStats.total_quantity || 0,
        avgBuyBox: apiSummaryStats.sc_buy_box_percent || 0,
        avgReturnRate: apiSummaryStats.sc_return_rate || 0,
        avgReplacementRate: apiSummaryStats.sc_replacement_rate || 0,
        scSales: apiSummaryStats.sc_revenue || 0,
        vcSales: apiSummaryStats.vc_revenue || 0,
        vcContribution: apiSummaryStats.vc_contribution_percent || 0,
      };
    } else {
      // Type assertion for seller-only stats
      const sellerStats = apiSummaryStats as {
        total_sales: number;
        total_quantity: number;
        "Buy Box %": number;
        replacement_rate: number;
        "Return Rate": number;
      };
      
      return {
        totalSales: sellerStats.total_sales || 0,
        totalQuantity: sellerStats.total_quantity || 0,
        avgBuyBox: sellerStats["Buy Box %"] || 0,
        avgReturnRate: sellerStats["Return Rate"] || 0,
        avgReplacementRate: sellerStats.replacement_rate || 0,
      };
    }
  }, [asinSummary, hasVendorAccount]);

  // Prepare metrics data for MetricsCard components
  const metricsData = React.useMemo(() => {
    if (!summaryStats) {
      return [
        {
          title: "SALES",
          value: "Loading...",
          icon: DollarSign,
          color: "bg-ocean-500",
          bgColor: "bg-white",
        },
        {
          title: "QUANTITY",
          value: "Loading...",
          icon: Package,
          color: "bg-gold-400",
          bgColor: "bg-white",
        },
        {
          title: "AVG. BUYBOX",
          value: "Loading...",
          icon: Percent,
          color: "bg-ocean-500",
          bgColor: "bg-white",
        },
        {
          title: "RETURN RATE",
          value: "Loading...",
          icon: RotateCcw,
          color: "bg-gold-400",
          bgColor: "bg-white",
        },
        {
          title: "REPLACEMENT RATE",
          value: "Loading...",
          icon: Coins,
          color: "bg-ocean-500",
          bgColor: "bg-white",
        },
      ];
    }

    const baseMetrics = [
      {
        title: "TOTAL SALES",
        value: `${getCurrencySymbol()}${formatCurrencyNoDecimal(summaryStats.totalSales)}`,
        icon: DollarSign,
        color: "bg-ocean-500",
        bgColor: "bg-white",
        subtitle: hasVendorAccount && summaryStats.vcContribution 
          ? `VC: ${formatPercentage(summaryStats.vcContribution)}` 
          : undefined,
      },
      {
        title:  "QUANTITY",
        value: formatNumber(summaryStats.totalQuantity),
        icon: Package,
        color: "bg-gold-400",
        bgColor: "bg-white",
      },
      {
        title: hasVendorAccount ? "SC BUYBOX" : "AVG. BUYBOX",
        value: formatPercentage(summaryStats.avgBuyBox),
        icon: Percent,
        color: "bg-ocean-500",
        bgColor: "bg-white",
      },
      {
        title: hasVendorAccount ? "SC RETURN RATE" : "RETURN RATE",
        value: formatPercentage(summaryStats.avgReturnRate),
        icon: RotateCcw,
        color: "bg-gold-400",
        bgColor: "bg-white",
      },
      {
        title: hasVendorAccount ? "SC REPLACEMENT" : "REPLACEMENT RATE",
        value: formatPercentage(summaryStats.avgReplacementRate),
        icon: Coins,
        color: "bg-ocean-500",
        bgColor: "bg-white",
      },
    ];

    return baseMetrics;
  }, [
    summaryStats, 
    hasVendorAccount,
    formatCurrencyNoDecimal,
    formatNumber, 
    formatPercentage,
    getCurrencySymbol
  ]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl font-bold text-blue-600 mb-2">
            Loading ASIN Performance...
          </div>
          <div className="text-gray-500">Fetching performance data</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-2xl font-bold mb-2">Error Loading Data</div>
          <div className="text-gray-500">
            {error?.message || "Failed to load ASIN performance data"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-12">
      <div className="w-full transition-all duration-300">
        {/* Filter Bar with date range integration */}
        <FilterBar
          title={hasVendorAccount ? "📊 ASIN Intelligence (SC + VC)" : "📊 ASIN Intelligence"}
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Metrics Cards Grid */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] tracking-tight px-2">
              Performance Snapshot
            </h2>
            {hasVendorAccount && (
              <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded-full">
                Seller Central + Vendor Central
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {metricsData.map((metric) => (
              <MetricsCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                color={metric.color}
                bgColor={metric.bgColor}
              />
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Analytics
          </h2>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
            {/* Dot Scatter Chart */}
            <div className="rounded-2xl flex w-full bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-4 row-span-1 transition-all duration-300 animate-fadein delay-300 h-full">
              <DotScatterChart
                startDate={dateRange.startDate || ""}
                endDate={dateRange.endDate || ""}
              />
            </div>
            {/* Organic Sales Card */}
            <div className="col-span-1 lg:col-span-2 row-span-1 h-full">
              <OrganicSalesCard
                maxItems={10}
                className="h-full"
                startDate={dateRange.startDate || ""}
                endDate={dateRange.endDate || ""}
              />
            </div>
          </div>
        </div>

        {/* Table Section - Performance Table */}
        <div className="flex flex-col mt-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Performance Details
          </h2>
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[220px] flex flex-col gap-6 sm:gap-8 w-full overflow-hidden">
            <AsinPerformanceTable
              startDate={dateRange.startDate || ""}
              endDate={dateRange.endDate || ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main wrapper component with DateRangeProvider
export default function ASINPerformance() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <AsinIntelligenceContent />
    </DateRangeProvider>
  );
}