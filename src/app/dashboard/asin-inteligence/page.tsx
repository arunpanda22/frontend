// src/app/dashboard/asinperformance/page.tsx
"use client";
import React, { useState } from "react";
import { Package, DollarSign, Percent, Coins, RotateCcw } from "lucide-react";
import DotScatterChart from "./components/DotScatterChart";
import AsinPerformanceTable from "./components/PerformanceTable";
// import AsinSalesTable from "./SalesTable";
import OrganicSalesCard from "./components/OrganicSalesBarChart";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { MetricsCard } from "@/components/dashboard/ui";
import { useAsinPerformanceData } from "@/lib/hooks/queries/use-dashboard";
import {
  DateRangeProvider,
  useDateRange,
} from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { Range } from "react-date-range";

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
  const { formatCurrency, formatNumber, formatPercentage } = useCurrency();

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
  const {
    asinSummary,
    // salesTrendAsin,
    // targetingAnalysis,
    organicSalesData,
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
          "items"
        );
      } else if (Array.isArray(asinSummary.data)) {
        console.log("📊 ASIN Summary loaded:", asinSummary.data.length, "items");
      }
    }
    if (isError) {
      console.error("❌ API Error:", error);
    }
  }, [asinSummary, isError, error]);

  // Transform API data for components
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
      return {
        asin: actualItem.asin,
        product_name: actualItem.product_name,
        "Total Quantity": actualItem.total_units,
        "Total Sales": actualItem.total_sales,
        "Sales ASP":
          actualItem.total_sales / Math.max(actualItem.total_units, 1),
        BuyBox: actualItem.buy_box_percentage || 0,
        "Organic Sales":
          actualItem.total_sales - (actualItem.total_ad_sales || 0),
        Conversion: actualItem.conversion_rate,
        ACOS: actualItem.acos_percent,
        TACOS: actualItem.tacos_percent,
        "Replacement Rate": actualItem.replacement_rate,
        "Return Rate": actualItem.return_rate,
      };
    });
  }, [asinSummary]);

  // Extract summary stats from API
  const summaryStats = React.useMemo(() => {
    const apiSummaryStats = asinSummary?.data?.summary_stats;

    if (apiSummaryStats) {
      return {
        totalSales: apiSummaryStats.total_sales || 0,
        totalQuantity: apiSummaryStats.total_quantity || 0,
        avgBuyBox: apiSummaryStats["Buy Box %"] || 0,
        avgReturnRate: apiSummaryStats["Return Rate"] || 0,
        avgReplacementRate: apiSummaryStats.replacement_rate || 0,
      };
    }

    return null;
  }, [asinSummary]);

  // Prepare metrics data for MetricsCard components
  const metricsData = React.useMemo(() => {
    if (!summaryStats) {
      return [
        {
          title: "TOTAL SALES",
          value: "Loading...",
          icon: DollarSign,
          bgColor: "bg-jungle-teal-200",
        },
        {
          title: "TOTAL QUANTITY",
          value: "Loading...",
          icon: Package,
          bgColor: "bg-jungle-teal-100",
        },
        {
          title: "AVG. BUYBOX",
          value: "Loading...",
          icon: Percent,
          bgColor: "bg-jungle-teal-200",
        },
        {
          title: "RETURN RATE",
          value: "Loading...",
          icon: RotateCcw,
          bgColor: "bg-jungle-teal-100",
        },
        {
          title: "REPLACEMENT RATE",
          value: "Loading...",
          icon: Coins,
          bgColor: "bg-jungle-teal-200",
        },
      ];
    }

    return [
      {
        title: "TOTAL SALES",
        value: formatNumber(summaryStats.totalSales),
        icon: DollarSign,
        bgColor: "bg-jungle-teal-200" ,
      },
      {
        title: "TOTAL QUANTITY",
        value: formatNumber(summaryStats.totalQuantity),
        icon: Package,
        bgColor: "bg-jungle-teal-100",
      },
      {
        title: "AVG. BUYBOX",
        value: formatPercentage(summaryStats.avgBuyBox),
        icon: Percent,
        bgColor: "bg-jungle-teal-200",
        
      },
      {
        title: "RETURN RATE",
        value: formatPercentage(summaryStats.avgReturnRate),
        icon: RotateCcw,
        bgColor: "bg-jungle-teal-100",
      },
      {
        title: "REPLACEMENT RATE",
        value: formatPercentage(summaryStats.avgReplacementRate),
        icon: Coins,
        bgColor: "bg-jungle-teal-200",
      },
    ];
  }, [summaryStats, formatCurrency, formatNumber, formatPercentage]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center">
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
    <div className="min-h-screen bg-[#f7fafc] py-12 px-12">
      <div className="w-full transition-all duration-300">
        {/* Filter Bar with date range integration */}
        <FilterBar
          title="📊 ASIN Intelligence"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Metrics Cards Grid */}
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Performance Snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {metricsData.map((metric) => (
              <MetricsCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start w-full">
            {/* Dot Scatter Chart */}
            <div className="xl:col-span-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-4 sm:p-6 md:p-8 flex flex-col min-h-[400px] sm:min-h-[520px] w-full">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a2b3c] mb-2">
                Total Sales vs TACOS
              </div>
              <div className="rounded-2xl w-full h-full p-2 transition-transform duration-200">
                <DotScatterChart
                  startDate={dateRange.startDate || ""}
                  endDate={dateRange.endDate || ""}
                />
              </div>
            </div>

            {/* Organic Sales Card */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-4 sm:p-6 md:p-8 w-full h-full flex flex-col min-h-[400px] sm:min-h-[520px]">
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

        {/* Table Section - Sales Table */}
        {/* <div className="flex flex-col mt-8">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Sales Breakdown
          </h2>
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[220px] flex flex-col gap-6 sm:gap-8 w-full overflow-hidden">
            <div className="w-full overflow-x-auto">
              <AsinSalesTable
              />
            </div>
          </div>
        </div> */}
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