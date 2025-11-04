// src/app/maindashboard/asinperformance/page.tsx
"use client";
import React, { useState } from "react";
import { Package, DollarSign, Percent, Coins, RotateCcw } from "lucide-react";
import { ScatterProps } from "recharts";
import DotScatterChart from "./DotScatterChart";
import AsinPerformanceTable from "./PerformanceTable";
import AsinSalesTable from "./SalesTable";
import OrganicSalesCard from "./OrganicSalesBarChart";
import { MetricsCard, type MetricsCardProps } from "@/components/dashboard/ui";
import { useAsinPerformanceData } from "@/lib/hooks/queries/use-dashboard";

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

// Brighter, modern color palette
const dotColors = [
  "#FACC15", // Yellow
  "#2563EB", // Blue
  "#F43F5E", // Pink
  "#22C55E", // Green
  "#FB923C", // Orange
  "#A78BFA", // Purple
];

interface CustomDotProps extends Partial<ScatterProps> {
  cx?: number;
  cy?: number;
  payload?: any;
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

function CustomDot(props: CustomDotProps) {
  const {
    cx = 0,
    cy = 0,
    payload = {},
    index,
    hoveredIndex,
    setHoveredIndex,
  } = props;
  const isHovered = hoveredIndex === index;
  return (
    <g
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 11 : 7}
        fill={payload.color}
        stroke={isHovered ? "#fff" : payload.color}
        strokeWidth={isHovered ? 4 : 2}
        filter={
          isHovered
            ? "drop-shadow(0px 0px 8px " + payload.color + "55)"
            : "none"
        }
        style={{ transition: "all 0.18s cubic-bezier(.4,2,.6,1)" }}
      />
    </g>
  );
}

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length && payload[0].payload) {
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: "#18181b",
          color: "#fff",
          borderRadius: 10,
          padding: "12px 20px",
          boxShadow: "0 4px 24px #0002",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "2px solid #27272a",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: d.color,
            display: "inline-block",
            marginRight: 8,
            border: "2px solid #fff",
          }}
        />
        <span style={{ fontWeight: 600 }}>ASIN:</span>{" "}
        <span style={{ marginRight: 12 }}>{d.asin}</span>
        <span>Sales: ₹{d.x.toLocaleString()}</span>
        <span>TACOS: {d.y}</span>
      </div>
    );
  }
  return null;
};

export default function ASINPerformance() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch ASIN performance data from API
  const {
    asinSummary,
    salesTrendAsin,
    targetingAnalysis,
    organicSalesData, // Add this to get organic sales data
    isLoading,
    isError,
    error,
  } = useAsinPerformanceData({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    period: "30d",
    focus_level: "all",
  });

  // Debug logging - only show summary
  React.useEffect(() => {
    if (asinSummary?.data) {
      // Check if we have the new structure or old structure
      if (asinSummary.data.asin_summary) {
        console.log(
          asinSummary.data.asin_summary.length
        );
        } else if (Array.isArray(asinSummary.data)) {
        console.log(
          asinSummary.data.length
        );
      }
    }
    // if (organicSalesData?.data) {
    //   console.log(
    //     "Organic Sales Data Available:",
    //     organicSalesData.data.organic_sales_data?.length,
    //     "items"
    //   );
    // }
    if (isError) {
      console.error("❌ API Error:", error);
    }
  }, [asinSummary, organicSalesData, isError, error]);

  // Transform API data for components
  const asinData: AsinData[] = React.useMemo(() => {
    // Handle new API structure: asin_summary array
    let rawData = null;

    if (asinSummary?.data?.asin_summary) {
      rawData = asinSummary.data.asin_summary;
    } else if (asinSummary?.data && Array.isArray(asinSummary.data)) {
      // Fallback for old structure
      rawData = asinSummary.data;
    }

    if (!rawData || !Array.isArray(rawData)) {
      console.log("No valid ASIN data found");
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

  // Extract summary stats from API - only use API data, no fallback calculations
  const summaryStats = React.useMemo(() => {
    // Try to get summary stats from new API structure
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

    // No API summary stats available
    console.log("⚠️ No API Summary Stats available");
    return null;
  }, [asinSummary]);

  // Calculate top ASINs for scatter chart
  const topAsins = React.useMemo(() => {
    return [...asinData]
      .filter(
        (item) =>
          typeof item["Total Sales"] === "number" &&
          typeof item.TACOS === "number"
      )
      .sort((a, b) => (b["Total Sales"] || 0) - (a["Total Sales"] || 0))
      .slice(0, 10);
  }, [asinData]);

  const topScatterData = React.useMemo(() => {
    return topAsins.map((item, idx) => ({
      asin: item.asin,
      x: item["Total Sales"],
      y: item.TACOS,
      name: item.product_name,
      color: dotColors[idx % dotColors.length],
    }));
  }, [topAsins]);

  // Prepare metrics data for MetricsCard components
  const metricsData = React.useMemo(() => {
    if (!summaryStats) return [];

    return [
      {
        title: "TOTAL SALES",
        value: `₹${summaryStats.totalSales.toLocaleString()}`,
        icon: DollarSign,
        bgColor: "green" as const,
      },
      {
        title: "TOTAL QUANTITY",
        value: summaryStats.totalQuantity.toLocaleString(),
        icon: Package,
        bgColor: "blue" as const,
      },
      {
        title: "AVG. BUYBOX",
        value: `${summaryStats.avgBuyBox.toFixed(2)}%`,
        icon: Percent,
        bgColor: "orange" as const,
      },
      {
        title: "RETURN RATE",
        value: `${summaryStats.avgReturnRate.toFixed(2)}%`,
        icon: RotateCcw,
        bgColor: "red" as const,
      },
      {
        title: "REPLACEMENT RATE",
        value: `${summaryStats.avgReplacementRate.toFixed(2)}%`,
        icon: Coins,
        bgColor: "purple" as const,
      },
    ];
  }, [summaryStats]);

  // Handle loading and error states
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
    <div className="min-h-screen bg-[#f5f6fa] px-12">
      <div className="w-full transition-all duration-300 px-1 py-2 sm:py-8">
        <div className="w-full flex flex-col gap-4 sm:gap-6 md:gap-8">
          {/* --- Page Heading --- */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1a2b3c] mb-2 text-center tracking-tight px-2">
            📊 ASIN Intelligence  

          </h1>

          {/* Metrics Cards Grid - Only show if API Summary Stats are available */}
          {summaryStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {metricsData.map((metric, idx) => (
                <MetricsCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  bgColor={metric.bgColor}
                />
              ))}
            </div>
          )}

          {/* --- Charts Section --- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start w-full">
            {/* Dot Scatter Chart */}
            <div className="xl:col-span-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-4 sm:p-6 md:p-8 flex flex-col min-h-[400px] sm:min-h-[520px] w-full">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a2b3c] mb-2">
                Total Sales vs TACOS
              </div>
              <div className="rounded-2xl w-full h-full p-2 transition-transform duration-200">
                <DotScatterChart />
              </div>
            
            </div>

            {/* Organic Sales Card - Keep original implementation */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-4 sm:p-6 md:p-8 w-full h-full flex flex-col min-h-[400px] sm:min-h-[520px]">
              <OrganicSalesCard maxItems={10} className="h-full" />
            </div>
          </div>

          {/* --- Table Section --- */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[220px] flex flex-col gap-6 sm:gap-8 w-full overflow-hidden">
            
            {/* Performance Table Card */}
            {/* <div className="w-full overflow-x-auto "> */}
              <AsinPerformanceTable />
            {/* </div> */}
          </div>
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[220px] flex flex-col gap-6 sm:gap-8 w-full overflow-hidden">
            {/* Sales Table Card */}
            <div className="w-full overflow-x-auto">
              <AsinSalesTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
