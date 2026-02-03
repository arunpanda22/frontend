"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, TrendingUp, DollarSign, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/chartcard";
import { FilterDropdown } from "@/components/dashboard/ui/FilterDropdown";
import { useCampaignXrayData } from "@/lib/hooks/useCampaignQueries";
import { useCurrency } from "@/lib/context/CurrencyContext";

// State components
const LoadingState = () => (
  <div className="w-full space-y-6 bg-white shadow rounded-xl p-6">
    <div className="w-full h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-powder-blue-200 border-t-powder-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error }: { error?: Error | null }) => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-red-600 text-xl">!</span>
      </div>
      <p className="font-semibold text-gray-800">Error loading data</p>
      {error && <p className="text-sm text-gray-500">{error.message}</p>}
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="w-full h-96 flex items-center justify-center">
    <p className="text-gray-600">{message}</p>
  </div>
);

// KPI Options with categories
const KPI_OPTIONS = [
  // Sales Metrics
  {
    id: "total_sales",
    title: "Total Sales",
    keys: ["Total Sales"],
    format: "currency",
    color: "#10B981",
    category: "Sales",
  },
  {
    id: "total_quantity",
    title: "Total Quantity",
    keys: ["Total Quantity"],
    format: "number",
    color: "#059669",
    category: "Sales",
  },
  {
    id: "sales_asp",
    title: "Sales ASP",
    keys: ["Sales ASP"],
    format: "currency",
    color: "#34D399",
    category: "Sales",
  },

  // Advertising Metrics
  {
    id: "impressions",
    title: "Impressions",
    keys: ["impressions"],
    format: "number",
    color: "#587FA7",
    category: "Advertising",
  },
  {
    id: "clicks",
    title: "Clicks",
    keys: ["clicks"],
    format: "number",
    color: "#F59E0B",
    category: "Advertising",
  },
  {
    id: "sales_30d",
    title: "Ad Sales (30d)",
    keys: ["sales_30d"],
    format: "currency",
    color: "#F54927",
    category: "Advertising",
  },
  {
    id: "purchases_30d",
    title: "Purchases (30d)",
    keys: ["purchases_30d"],
    format: "number",
    color: "#F97316",
    category: "Advertising",
  },
  {
    id: "ctr",
    title: "CTR %",
    keys: ["CTR%"],
    format: "percent",
    color: "#8B5CF6",
    category: "Advertising",
  },
  {
    id: "cpc",
    title: "CPC",
    keys: ["CPC"],
    format: "currency",
    color: "#EC4899",
    category: "Advertising",
  },
  {
    id: "cost",
    title: "Cost",
    keys: ["cost"],
    format: "currency",
    color: "#EF4444",
    category: "Advertising",
  },
  {
    id: "cvr",
    title: "CVR %",
    keys: ["CVR%"],
    format: "percent",
    color: "#3B82F6",
    category: "Advertising",
  },
  {
    id: "acos",
    title: "ACOS %",
    keys: ["ACOS%"],
    format: "percent",
    color: "#DC2626",
    category: "Advertising",
  },
  {
    id: "cpa",
    title: "CPA",
    keys: ["CPA"],
    format: "currency",
    color: "#7C3AED",
    category: "Advertising",
  },
] as const;

type KPIKey = (typeof KPI_OPTIONS)[number]["id"];

const DEFAULT_METRICS: KPIKey[] = [
  "total_sales",
  "impressions",
  "clicks",
  "acos",
];

interface CampaignXrayChartProps {
  focusLevel?: "high" | "medium" | "low" | "all";
}

const CampaignXrayChart: React.FC<CampaignXrayChartProps> = ({
  focusLevel = "all",
}) => {
  // State management
  const [chartMetrics, setChartMetrics] = useState<KPIKey[]>([
    "sales_30d",
    "impressions",
    "total_sales"
  ]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [metricsFilterOpen, setMetricsFilterOpen] = useState(false);
  const metricsFilterRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        metricsFilterRef.current &&
        !metricsFilterRef.current.contains(event.target as Node)
      ) {
        setMetricsFilterOpen(false);
      }
    };

    if (metricsFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [metricsFilterOpen]);

  // API data fetching - React Query will automatically refetch when selectedCampaigns changes
  const {
    data: xrayApiData,
    isLoading,
    isError,
    error,
  } = useCampaignXrayData({
    campaign_names:
      selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
    focus_level: focusLevel,
  });

  // Extract data from API response
  const xrayData = useMemo(() => {
    if (!xrayApiData) return [];
    return xrayApiData.xray_data || [];
  }, [xrayApiData]);

  const availableCampaigns = useMemo(() => {
    if (!xrayApiData) return [];
    return (xrayApiData.available_campaigns || []).map((name: string) => ({
      id: name,
      label: name,
    }));
  }, [xrayApiData]);

  // Parse and prepare chart data
  const chartData = useMemo(() => {
    const safeParse = (val: any, format: "number" | "currency" | "percent") => {
      if (val === undefined || val === null) return 0;
      const str = val.toString().replace(/,/g, "").replace("%", "");
      if (str.toLowerCase() === "nan" || str === "") return 0;
      return format === "percent" ? parseFloat(str) : Number(str);
    };

    const initialData = KPI_OPTIONS.reduce(
      (acc, kpi) => ({ ...acc, [kpi.id]: [] }),
      {} as Record<KPIKey, number[]>,
    );
    const initialTotals = KPI_OPTIONS.reduce(
      (acc, kpi) => ({ ...acc, [kpi.id]: 0 }),
      {} as Record<KPIKey, number>,
    );

    if (!xrayData.length) {
      return {
        labels: [],
        data: initialData,
        totals: initialTotals,
        processedData: [],
      };
    }

    const data: Record<KPIKey, number[]> = { ...initialData };
    const totals: Record<KPIKey, number> = { ...initialTotals };
    const labels = xrayData.map((d) => d.time_group);

    // Process data for each KPI
    for (const kpi of KPI_OPTIONS) {
      const keyToUse = kpi.keys.find((key) => xrayData[0]?.[key] !== undefined);
      if (keyToUse) {
        const dataArray = xrayData.map((item) =>
          safeParse(item[keyToUse], kpi.format),
        );
        data[kpi.id] = dataArray;

        if (kpi.format === "percent") {
          totals[kpi.id] = dataArray[dataArray.length - 1] ?? 0;
        } else {
          totals[kpi.id] = dataArray.reduce((sum, val) => sum + val, 0);
        }
      }
    }

    // Create processed data for recharts
    const processedData = xrayData.map((item, idx) => {
      const row: any = { date: item.time_group };
      for (const kpi of KPI_OPTIONS) {
        row[kpi.id] = data[kpi.id][idx];
      }
      return row;
    });

    return { labels, data, totals, processedData };
  }, [xrayData]);

  // Group KPIs by category
  const groupedKPIs = useMemo(() => {
    type GroupedKPI = {
      category: string;
      items: Array<(typeof KPI_OPTIONS)[number]>;
    };
    return KPI_OPTIONS.reduce((acc: GroupedKPI[], kpi) => {
      const group = acc.find((g) => g.category === kpi.category);
      if (group) {
        group.items.push(kpi);
      } else {
        acc.push({ category: kpi.category, items: [kpi] });
      }
      return acc;
    }, [] as GroupedKPI[]);
  }, []);

  const handleChartMetricToggle = (id: KPIKey) => {
    setChartMetrics((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((m) => m !== id) : prev;
      } else {
        return prev.length < 4 ? [...prev, id] : prev;
      }
    });
  };

  const handleCampaignFilterApply = (selectedIds: (string | number)[]) => {
    console.log("Applying campaign filter:", {
      count: selectedIds.length,
      total_available: availableCampaigns.length,
      sample: selectedIds.slice(0, 5), // Log first 5 for debugging
    });

    // React Query will automatically refetch when this state changes
    setSelectedCampaigns(selectedIds as string[]);
  };

  const getYAxisConfig = (metricCount: number) => {
    const positions: Record<
      number,
      Array<{ index: number; yAxisId: string; orientation: "left" | "right" }>
    > = {
      1: [{ index: 0, yAxisId: "right", orientation: "right" }],
      2: [
        { index: 0, yAxisId: "left", orientation: "left" },
        { index: 1, yAxisId: "right", orientation: "right" },
      ],
      3: [
        { index: 0, yAxisId: "left", orientation: "left" },
        { index: 1, yAxisId: "right", orientation: "right" },
        { index: 2, yAxisId: "right2", orientation: "right" },
      ],
      4: [
        { index: 0, yAxisId: "left", orientation: "left" },
        { index: 1, yAxisId: "left2", orientation: "left" },
        { index: 2, yAxisId: "right", orientation: "right" },
        { index: 3, yAxisId: "right2", orientation: "right" },
      ],
    };
    return positions[metricCount] || positions[1];
  };

  const yAxisConfig = getYAxisConfig(chartMetrics.length);

  // Loading and error states
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;
  if (!xrayData?.length)
    return <EmptyState message="No data available for the selected period" />;

  return (
    <div className="w-full bg-white shadow rounded-xl">
      {/* Controls */}
      <div className="bg-powder-blue-50 rounded-t-lg border border-powder-blue-200 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Campaign Filter */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Campaign ({selectedCampaigns.length} selected)
            </label>
            <FilterDropdown
              items={availableCampaigns}
              selectedItems={selectedCampaigns}
              onApply={handleCampaignFilterApply}
              placeholder="Search campaigns..."
              maxHeight="max-h-80"
              width="w-full"
            />
          </div>

          {/* Metrics Filter */}
          <div className="relative" ref={metricsFilterRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Metrics
            </label>
            <button
              onClick={() => setMetricsFilterOpen(!metricsFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border bg-white border-powder-blue-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-powder-blue-50 transition-colors"
            >
              <span>Filter Metrics ({chartMetrics.length}/4)</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  metricsFilterOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {metricsFilterOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-powder-blue-200 rounded-lg shadow-xl z-10 p-4">
                <div className="grid grid-cols-1 gap-6 min-w-80 max-h-96 overflow-y-auto">
                  {groupedKPIs.map((group) => (
                    <div key={group.category}>
                      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 pb-2 border-b border-powder-blue-200">
                        {group.category}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map((kpi) => (
                          <label
                            key={kpi.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-powder-blue-50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={chartMetrics.includes(kpi.id as KPIKey)}
                              onChange={() =>
                                handleChartMetricToggle(kpi.id as KPIKey)
                              }
                              disabled={
                                chartMetrics.length === 1 &&
                                chartMetrics.includes(kpi.id as KPIKey)
                              }
                              className="w-4 h-4 rounded border-powder-blue-300 cursor-pointer"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: kpi.color }}
                              />
                              <span className="text-sm text-gray-700">
                                {kpi.title}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-powder-blue-200 text-xs text-gray-500">
                  Selected: {chartMetrics.length} / 4 metrics (min 1, max 4)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="shadow-md rounded-b-lg border-powder-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap text-gray-700">
            {selectedCampaigns.length > 0 && (
              <span className="text-sm text-gray-500">
                ({selectedCampaigns.length} campaign
                {selectedCampaigns.length !== 1 ? "s" : ""} selected)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={chartData.processedData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#DEE6ED" />
              <XAxis dataKey="date" stroke="#9BB2CA" tick={{ fontSize: 12 }}/>

              {yAxisConfig.map((config) => {
                const metric = chartMetrics[config.index];
                const kpi = KPI_OPTIONS.find((k) => k.id === metric);

                return (
                  <YAxis
                    key={config.yAxisId}
                    yAxisId={config.yAxisId}
                    orientation={config.orientation}
                    stroke={kpi?.color}
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                );
              })}

              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #BCCCDC",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }}/>

              {chartMetrics.map((metricId, index) => {
                const kpi = KPI_OPTIONS.find((k) => k.id === metricId);
                const config = yAxisConfig[index];
                const isBar = metricId === "impressions";

                if (isBar) {
                  return (
                    <Bar
                      key={metricId}
                      yAxisId={config.yAxisId}
                      dataKey={metricId}
                      fill={kpi?.color}
                      name={kpi?.title}
                      opacity={0.8}
                      radius={[8, 8, 0, 0]}
                    />
                  );
                }

                return (
                  <Line
                    key={metricId}
                    yAxisId={config.yAxisId}
                    type="monotone"
                    dataKey={metricId}
                    stroke={kpi?.color}
                    strokeWidth={2}
                    dot={{ fill: kpi?.color, r: 2 }}
                    activeDot={{ r: 6 }}
                    name={kpi?.title}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignXrayChart;
