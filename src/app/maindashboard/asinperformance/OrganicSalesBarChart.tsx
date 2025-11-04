import React from "react";
import RankedItemsCard from "@/components/dashboard/ui/RankedItemsCard";
import { OrganicSalesItem } from "@/lib/api/services/dashboard.service";
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard';

interface OrganicSalesCardProps {
  maxItems?: number;
  className?: string;
  // Optional date range props - if not provided, defaults to last 30 days
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
  period = '30d',
  focusLevel = 'all'
}) => {
  // Set up default date range (last 30 days) if not provided
  const defaultStartDate = React.useMemo(() => 
    startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  , [startDate]);
  
  const defaultEndDate = React.useMemo(() => 
    endDate || new Date().toISOString().split('T')[0]
  , [endDate]);

  // Fetch organic sales data directly in this component
  const { 
    organicSalesData,
    isLoading, 
    isError, 
    error 
  } = useAsinPerformanceData({
    start_date: defaultStartDate,
    end_date: defaultEndDate,
    period,

  });

  // Debug logging
  React.useEffect(() => {
    if (organicSalesData?.data) {
      console.log('OrganicSalesCard - Organic Sales Data Available:', organicSalesData.data.organic_sales_data?.length, 'items');
    }
    if (isError) {
      console.error('❌ OrganicSalesCard - API Error:', error);
    }
  }, [organicSalesData, isError, error]);

  // Transform organic sales data for RankedItemsCard
  const rankedItems = React.useMemo(() => {
    if (!organicSalesData?.data?.organic_sales_data) {
      return [];
    }
    return organicSalesData.data.organic_sales_data
      .sort((a, b) => b.total_sales - a.total_sales) // Sort by percentage descending
      .map((item: OrganicSalesItem, index) => ({
        id: item.asin,
        name: item.product_name, 
        percentage: Math.round(item.organic_sales_percentage * 100) / 100, 
        // value: `₹${item.organic_sales.toLocaleString()}`, 
        color: getColorByPerformance(item.organic_sales_percentage, index),
      }));
  }, [organicSalesData?.data?.organic_sales_data]);

  // Helper function to assign colors based on performance
  function getColorByPerformance(percentage: number, index: number): string {
    // Modern vibrant color palette
    const colorPalette = [
      "bg-gradient-to-r from-emerald-400 to-emerald-600", // Emerald
      "bg-gradient-to-r from-blue-400 to-blue-600",       // Blue
      "bg-gradient-to-r from-purple-400 to-purple-600",   // Purple
      "bg-gradient-to-r from-orange-400 to-orange-600",   // Orange
      "bg-gradient-to-r from-pink-400 to-pink-600",       // Pink
      "bg-gradient-to-r from-cyan-400 to-cyan-600",       // Cyan
      "bg-gradient-to-r from-indigo-400 to-indigo-600",   // Indigo
      "bg-gradient-to-r from-teal-400 to-teal-600",       // Teal
      "bg-gradient-to-r from-rose-400 to-rose-600",       // Rose
      "bg-gradient-to-r from-amber-400 to-amber-600",     // Amber
    ];
    
    // Use index to cycle through colors for visual variety
    return colorPalette[index % colorPalette.length];
  }

  // Format summary stats for display
  const summaryInfo = React.useMemo(() => {
    if (!organicSalesData?.data?.summary) return null;
    const summary = organicSalesData.data.summary;
    return {
      totalAsins: summary.total_asins_analyzed,
      avgPercentage: Math.round(summary.avg_organic_percentage * 100) / 100,
      periodStart: new Date(summary.period_start).toLocaleDateString(),
      periodEnd: new Date(summary.period_end).toLocaleDateString(),
    };
  }, [organicSalesData?.data?.summary]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main Ranked Items Card */}
      <RankedItemsCard
        title="Top 10 Organic Sales Performance"
        items={rankedItems}
        showValues={true}
        maxItems={maxItems}
        isLoading={isLoading}
        emptyMessage="No organic sales data available"
        className="h-full"
      />
      
      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">
            <strong>Error:</strong> Failed to load organic sales data
            {error?.message && (
              <div className="mt-1 text-xs text-red-600">
                {error.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional: Display summary info if available */}
      {summaryInfo && (
        <div className="text-xs text-gray-500 mt-2">
          <div>Period: {summaryInfo.periodStart} - {summaryInfo.periodEnd}</div>
          <div>ASINs Analyzed: {summaryInfo.totalAsins} | Avg Organic %: {summaryInfo.avgPercentage}%</div>
        </div>
      )}
    </div>
  );
};

export default OrganicSalesCard;