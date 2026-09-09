import React from "react";
import { OrganicSalesItem } from "@/lib/api/services/dashboard.service";
import { useAsinPerformanceData } from "@/lib/hooks/queries/use-dashboard";

interface OrganicSalesCardProps {
  maxItems?: number;
  className?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
  focusLevel?: string;
}

const OrganicSalesCard: React.FC<OrganicSalesCardProps> = ({
  maxItems = 10,
  className = "",
  startDate,
  endDate,
  period = "30d",
  focusLevel = "all",
}) => {
  // Set up default date range (last 30 days) if not provided
  const defaultStartDate = React.useMemo(
    () =>
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    [startDate]
  );

  const defaultEndDate = React.useMemo(
    () => endDate || new Date().toISOString().split("T")[0],
    [endDate]
  );

  // Fetch organic sales data directly in this component
  const { organicSalesData, isLoading, isError, error } =
    useAsinPerformanceData({
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      period,
    });

  // Debug logging
  React.useEffect(() => {
    if (organicSalesData?.data) {
      console.log(
        "OrganicSalesCard - Organic Sales Data Available:",
        organicSalesData.data.organic_sales_data?.length,
        "items"
      );
    }
    if (isError) {
      console.error("❌ OrganicSalesCard - API Error:", error);
    }
  }, [organicSalesData, isError, error]);

  // Helper function to assign colors based on performance
  const getColorByPerformance = (index: number): string => {
    const colorPalette = [
      "bg-gradient-to-r from-emerald-400 to-emerald-600",
      "bg-gradient-to-r from-blue-400 to-blue-600",
      "bg-gradient-to-r from-purple-400 to-purple-600",
      "bg-gradient-to-r from-orange-400 to-orange-600",
      "bg-gradient-to-r from-pink-400 to-pink-600",
      "bg-gradient-to-r from-cyan-400 to-cyan-600",
      "bg-gradient-to-r from-indigo-400 to-indigo-600",
      "bg-gradient-to-r from-teal-400 to-teal-600",
      "bg-gradient-to-r from-rose-400 to-rose-600",
      "bg-gradient-to-r from-amber-400 to-amber-600",
    ];

    return colorPalette[index % colorPalette.length];
  };

  // Transform organic sales data
  const rankedItems = React.useMemo(() => {
    if (!organicSalesData?.data?.organic_sales_data) {
      return [];
    }
    return organicSalesData.data.organic_sales_data
      .sort((a, b) => b.total_sales - a.total_sales)
      .map((item: OrganicSalesItem, index) => ({
        id: item.asin,
        name: item.product_name,
        percentage: Math.round(item.organic_sales_percentage * 100) / 100,
        color: getColorByPerformance(index),
      }));
  }, [organicSalesData?.data?.organic_sales_data]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
      >
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: maxItems }, (_, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-gray-300 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!rankedItems || rankedItems.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
      >
        <div className="mb-6">
          <h6 className="text-lg font-semibold text-gray-900">
            Top 10 Organic Sales Performance
          </h6>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">
            No organic sales data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`order-8 col-span-12 xl:col-span-6 2xl:col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm h-full ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <h6 className="text-base font-semibold text-gray-900">
          Top 10 Organic Sales Performance
        </h6>
      </div>

      {/* Items List */}
      <div className="p-4 md:p-6 flex-1 flex flex-col justify-center space-y-4">
        {rankedItems.slice(0, maxItems).map((item, index) => (
          <div key={item.id}>
            {/* Item header with name and percentage */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h6
                  className="text-sm font-medium text-gray-900 truncate"
                  title={item.name}
                >
                  {item.name}
                </h6>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">
            <strong>Error:</strong> Failed to load organic sales data
            {error?.message && (
              <div className="mt-1 text-xs text-red-600">{error.message}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganicSalesCard;
