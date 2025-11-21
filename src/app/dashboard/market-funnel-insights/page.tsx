// src/app/maindashboard/searchqueryperformance/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  FaSearch,
  FaEye,
  FaMousePointer,
  FaShoppingCart,
  FaPercent,
  FaFilter,
  FaChevronDown,
  FaCartPlus,
  FaDollarSign,
  FaExchangeAlt,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import SearchQueryPerformanceTable from "./components/searchqueryperformancetable";
import MetricChartCard from "./components/MetricChartCard";
import PriceWeightageChart from "./components/PriceWeightageChart";
import ConversionChart from "./components/ConversionChart";
import { useSQPData } from "./hooks/useSQPData";
import {
  processMonthlyMetrics,
  getMonthsFromData,
  calculateTrend,
  getLastMonthValue,
} from "./utils/sqp.utils";
import { FilterState, SQPRequestParams } from "./types/sqp.types";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { Button } from "@/components/ui/button";
import SearchableAsinDropdown from "./components/SearchableAsinDropdown";

export default function ASINSearchQueryPerformance() {
  const [filterState, setFilterState] = useState<FilterState>({
    view: "all",
    selectedAsin: "",
  });

  // API integration
  const {
    data: sqpData,
    loading,
    error,
    refetch,

    loadingAsins,
  } = useSQPData();

  // Prepare filtered data based on current view
  const filteredSearchQueries = useMemo(() => {
    if (!sqpData?.search_queries) return [];

    if (filterState.view === "individual" && filterState.selectedAsin) {
      return sqpData.search_queries.filter(
        (item) => item.asin === filterState.selectedAsin
      );
    }

    return sqpData.search_queries;
  }, [sqpData?.search_queries, filterState]);

  // Process monthly metrics for charts with dynamic months
  const { chartData, months } = useMemo(() => {
    if (!sqpData?.monthly_metrics) return { chartData: null, months: [] };

    // Pass full data to utils
    const processedData = processMonthlyMetrics(
      sqpData.monthly_metrics,
      filterState.view === "individual" && filterState.selectedAsin
        ? filterState.selectedAsin
        : "All ASINs"
    );

    // Get months from full data (not filtered by ASIN)
    const dynamicMonths = getMonthsFromData(sqpData.monthly_metrics);

    return { chartData: processedData, months: dynamicMonths };
  }, [sqpData?.monthly_metrics, filterState]);

  // Handle filter changes
  const handleFilterChange = async (
    view: "all" | "individual",
    asin?: string
  ) => {
    const newFilterState: FilterState = {
      view,
      selectedAsin: view === "individual" ? asin || "" : "",
    };

    setFilterState(newFilterState);

    // Prepare API parameters
    const params: SQPRequestParams = {};
    if (view === "individual" && asin) {
      params.selected_asin = asin;
    }

    // Refetch data with new parameters
    await refetch(params);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-lg text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <FaExclamationTriangle className="text-4xl text-red-500 mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!sqpData || !chartData) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center">
          <FaSearch className="text-4xl text-gray-400 mb-4" />
          <p className="text-lg text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-12 py-12">
      <div className="w-full transition-all duration-300">
        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">
              🔍 Market Funnel Insights
            </h1>
          </div>

          <SearchableAsinDropdown
            asins={sqpData.top_asins}
            selectedAsin={filterState.selectedAsin}
            totalAsins={sqpData.metadata.total_asins}
            view={filterState.view}
            onSelect={(asin) => handleFilterChange("individual", asin)}
            onSelectAll={() => handleFilterChange("all")}
            disabled={loadingAsins || loading}
          />
        </div>

        {/* Stats Grid - 3x3 layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 py-4">
          {/* Impressions Column Group */}
          <div className="flex flex-col gap-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-bold text-blue-700 flex items-center justify-center gap-2">
                <FaEye className="text-blue-600" />
                Impressions
              </h3>
              <div className="w-12 h-1 bg-blue-500 mx-auto mt-1 rounded-full"></div>
            </div>

            <MetricChartCard
              icon={<FaPercent />}
              label="ASIN IMPRESSION SHARE"
              value={getLastMonthValue(chartData.impressions.share).toFixed(2)}
              valueSuffix="%"
              trend={calculateTrend(chartData.impressions.share).value}
              trendPositive={
                calculateTrend(chartData.impressions.share).positive
              }
              chartData={chartData.impressions.share}
              chartColors={["#1d4ed8"]}
              chartType="vertical"
              months={months}
            />
          </div>

          {/* Clicks Column Group */}
          <div className="flex flex-col gap-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-bold text-green-700 flex items-center justify-center gap-2">
                <FaMousePointer className="text-green-600" />
                Clicks
              </h3>
              <div className="w-12 h-1 bg-green-500 mx-auto mt-1 rounded-full"></div>
            </div>

            <MetricChartCard
              icon={<FaPercent />}
              label="ASIN CLICK SHARE"
              value={getLastMonthValue(chartData.clicks.share).toFixed(2)}
              valueSuffix="%"
              trend={calculateTrend(chartData.clicks.share).value}
              trendPositive={calculateTrend(chartData.clicks.share).positive}
              chartData={chartData.clicks.share}
              chartColors={["#047857"]}
              chartType="vertical"
              months={months}
            />
          </div>

          {/* Purchases Column Group */}
          <div className="flex flex-col gap-4">
            <div className="text-center py-2">
              <h3 className="text-lg font-bold text-amber-700 flex items-center justify-center gap-2">
                <FaShoppingCart className="text-amber-600" />
                Purchases
              </h3>
              <div className="w-12 h-1 bg-amber-500 mx-auto mt-1 rounded-full"></div>
            </div>

            <MetricChartCard
              icon={<FaPercent />}
              label="ASIN PURCHASE SHARE"
              value={getLastMonthValue(chartData.purchases.share).toFixed(2)}
              valueSuffix="%"
              trend={calculateTrend(chartData.purchases.share).value}
              trendPositive={calculateTrend(chartData.purchases.share).positive}
              chartData={chartData.purchases.share}
              chartColors={["#b45309"]}
              chartType="vertical"
              months={months}
            />
          </div>
        </div>

        {/* Chart Sections - Weighted Sales and Conversion */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
          {/* Weighted Click Sales Chart */}
          <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaDollarSign className="text-2xl text-red-500" />
              <h2 className="text-xl font-bold text-gray-800">
                Weighted Click Sales Analysis
              </h2>
            </div>
            <PriceWeightageChart
              totalWeightedSalesData={
                chartData.weightedSales.total_weighted_click_sales
              }
              asinWeightedSalesData={
                chartData.weightedSales.asin_weighted_click_sales
              }
              months={months}
            />
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-700">
                  Total Weighted Sales
                </p>
                <p className="text-xl font-bold text-red-600">
                  ₹
                  {getLastMonthValue(
                    chartData.weightedSales.total_weighted_click_sales
                  ).toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-700">
                  ASIN Weighted Sales
                </p>
                <p className="text-xl font-bold text-blue-600">
                  ₹
                  {getLastMonthValue(
                    chartData.weightedSales.asin_weighted_click_sales
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Conversion Chart */}
          <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaExchangeAlt className="text-2xl text-purple-500" />
              <h2 className="text-xl font-bold text-gray-800">
                Conversion Rate Analysis
              </h2>
            </div>
            <ConversionChart
              totalConversionData={chartData.conversion.total_conversion}
              asinConversionData={chartData.conversion.asin_conversion}
              months={months}
            />
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-700">
                  Total Conversion Rate
                </p>
                <p className="text-xl font-bold text-green-600">
                  {getLastMonthValue(
                    chartData.conversion.total_conversion
                  ).toFixed(2)}
                  %
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-purple-700">
                  ASIN Conversion Rate
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {getLastMonthValue(
                    chartData.conversion.asin_conversion
                  ).toFixed(2)}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[400px] flex flex-col mt-8 gap-6 w-full overflow-hidden">
          {/* <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 pb-4 flex items-center justify-center">
                {filterState.view === "individual" &&
                  filterState.selectedAsin && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      - {filterState.selectedAsin}
                    </span>
                  )}
              </h2> */}

          <SearchQueryPerformanceTable data={filteredSearchQueries} />
        </div>
      </div>
    </div>
  );
}
