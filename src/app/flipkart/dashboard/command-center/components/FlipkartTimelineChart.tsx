"use client";

/**
 * FlipkartTimelineChart: daily metrics chart for the selected date range.
 * Flipkart counterpart of Amazon's AdsTimelineChart.
 *
 * Place at: src/app/flipkart/dashboard/command-center/components/FlipkartTimelineChart.tsx
 *
 * DATA: GET /api/v1/fk/dashboard/timeline/ via useFlipkartTimeline. The backend returns ONE BUCKET PER
 * CALENDAR DAY in the requested range (days without data are zero-filled), each with the raw sums and the
 * derived metrics already computed from that day's own sums. This component therefore does no maths.
 *
 * DIFFERENCES FROM THE AMAZON CHART
 *   - No daily / weekly selector: Flipkart is daily only.
 *   - No client-side date filtering: the date picker drives the request itself.
 *   - Metric keys are the backend's own keys (Impressions, Clicks, CTR, ...), so there is no key mapping.
 *   - Money is shown with the rupee symbol (see flipkart-constants.ts).
 *
 * BEHAVIOUR KEPT FROM THE AMAZON CHART
 *   - Choose 1 to 4 metrics. Each gets its own y axis (left/right) and a fixed colour from CHART_COLORS
 *     by selection order. Impressions is drawn as bars, every other metric as a line.
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { ChevronDown } from "lucide-react";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useFlipkartTimeline } from "@/lib/hooks/queries/use-flipkart-dashboard";
import type { FlipkartMetricKey } from "@/lib/api/services/flipkart-dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/chartcard";
import { CURRENCY_SYMBOL } from "./flipkart-constants";

// Same palette as the Amazon timeline chart.
const CHART_COLORS = ["#316095", "#FFBF00", "#00E0B2", "#E41F66"];

type MetricFormat = "number" | "money" | "money2" | "percent" | "multiplier";

interface MetricOption {
  key: FlipkartMetricKey;
  title: string;
  format: MetricFormat;
  category: "Traffic" | "Sales" | "Efficiency";
}

const METRIC_OPTIONS: MetricOption[] = [
  { key: "Impressions", title: "Impressions", format: "number", category: "Traffic" },
  { key: "Clicks", title: "Clicks", format: "number", category: "Traffic" },
  { key: "CTR", title: "CTR %", format: "percent", category: "Traffic" },
  { key: "CPC", title: "CPC", format: "money2", category: "Traffic" },
  { key: "CPM", title: "CPM", format: "money2", category: "Traffic" },
  { key: "Units", title: "Units", format: "number", category: "Sales" },
  { key: "Revenue", title: "Revenue", format: "money", category: "Sales" },
  { key: "CVR", title: "CVR %", format: "percent", category: "Sales" },
  { key: "ASP", title: "ASP", format: "money2", category: "Sales" },
  { key: "Spend", title: "Spend", format: "money", category: "Efficiency" },
  { key: "ACOS", title: "ACOS %", format: "percent", category: "Efficiency" },
  { key: "ROAS", title: "ROAS", format: "multiplier", category: "Efficiency" },
];

const DEFAULT_CHART_METRICS: FlipkartMetricKey[] = ["Impressions", "Clicks"];
const MAX_METRICS = 4;

/** Above this many days the dots are hidden so a long range stays readable. */
const MAX_DAYS_WITH_DOTS = 45;

const LoadingState = () => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

const ErrorState = ({ error }: { error?: Error | null }) => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-red-600 text-xl">!</span>
      </div>
      <p className="font-semibold text-gray-900">Error loading data</p>
      {error && <p className="text-sm text-gray-500">{error.message}</p>}
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="w-full h-96 flex items-center justify-center">
    <p className="text-gray-600">{message}</p>
  </div>
);

/** Same axis layout as the Amazon chart: where each selected metric's y axis goes. */
const getYAxisConfig = (metricCount: number) => {
  const positions: Record<number, Array<{ index: number; yAxisId: string; orientation: "left" | "right" }>> = {
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

/** Compact axis ticks ("1.2L" style is avoided: en-IN compact gives "12 L"/"1.2 Cr"; keep plain en-US K/M). */
const formatAxisTick = (value: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

interface FlipkartTimelineChartProps {
  /** FlipkartAdAccount UUID. Omit to use the user's oldest active ad account. */
  adsTenant?: string;
}

const FlipkartTimelineChart: React.FC<FlipkartTimelineChartProps> = ({ adsTenant }) => {
  const { dateRange } = useDateRange();
  const { formatNumber, formatCurrency, formatCurrencyNoDecimal, formatNumberWithDecimals } = useCurrency();

  const [chartMetrics, setChartMetrics] = useState<FlipkartMetricKey[]>(DEFAULT_CHART_METRICS);
  const [metricsFilterOpen, setMetricsFilterOpen] = useState(false);
  const metricsFilterRef = useRef<HTMLDivElement>(null);

  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data, isLoading, isError, error } = useFlipkartTimeline(
    { start_date: startDate, end_date: endDate, ads_tenant: adsTenant },
    !!(startDate && endDate)
  );

  // Close the metric dropdown when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricsFilterRef.current && !metricsFilterRef.current.contains(event.target as Node)) {
        setMetricsFilterOpen(false);
      }
    };
    if (metricsFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [metricsFilterOpen]);

  const optionByKey = useMemo(() => {
    const map = new Map<FlipkartMetricKey, MetricOption>();
    METRIC_OPTIONS.forEach((option) => map.set(option.key, option));
    return map;
  }, []);

  const groupedOptions = useMemo(() => {
    const groups: { category: string; items: MetricOption[] }[] = [];
    METRIC_OPTIONS.forEach((option) => {
      const group = groups.find((g) => g.category === option.category);
      if (group) group.items.push(option);
      else groups.push({ category: option.category, items: [option] });
    });
    return groups;
  }, []);

  const formatMetricValue = (format: MetricFormat, value: number): string => {
    switch (format) {
      case "number":
        return formatNumber(value);
      case "money":
        return `${CURRENCY_SYMBOL}${formatCurrencyNoDecimal(value)}`;
      case "money2":
        return `${CURRENCY_SYMBOL}${formatCurrency(value)}`;
      case "percent":
        return `${formatNumberWithDecimals(value)}%`;
      case "multiplier":
        return `${formatNumberWithDecimals(value)}x`;
    }
  };

  const handleMetricToggle = (key: FlipkartMetricKey) => {
    setChartMetrics((prev) => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter((m) => m !== key) : prev;
      }
      return prev.length < MAX_METRICS ? [...prev, key] : prev;
    });
  };

  const yAxisConfig = getYAxisConfig(chartMetrics.length);
  const timeline = data?.timeline ?? [];

  if (isLoading || (!data && !isError)) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;
  if (timeline.length === 0) return <EmptyState message="No data available for the selected period" />;

  return (
    <div className="w-full bg-white rounded-xl">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-semibold text-gray-900">Ads Timeline</h6>
          <div className="text-xs text-gray-500">
            {startDate} to {endDate}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-t-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="relative" ref={metricsFilterRef}>
            <button
              onClick={() => setMetricsFilterOpen(!metricsFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>
                Filter Metrics ({chartMetrics.length}/{MAX_METRICS})
              </span>
              <ChevronDown size={16} className={`transition-transform ${metricsFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {metricsFilterOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-10 p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-6 min-w-80">
                  {groupedOptions.map((group) => (
                    <div key={group.category}>
                      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 pb-2 border-b border-gray-200">
                        {group.category}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map((option) => {
                          const metricIndex = chartMetrics.indexOf(option.key);
                          const color = metricIndex >= 0 ? CHART_COLORS[metricIndex] : "#D1D5DB";
                          return (
                            <label
                              key={option.key}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={chartMetrics.includes(option.key)}
                                onChange={() => handleMetricToggle(option.key)}
                                disabled={chartMetrics.length === 1 && chartMetrics.includes(option.key)}
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-sm text-gray-700">{option.title}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  Selected: {chartMetrics.length} / {MAX_METRICS} metrics (min 1, max {MAX_METRICS})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="shadow-md rounded-b-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            {chartMetrics.map((key, idx) => (
              <span key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }} />
                <span>{optionByKey.get(key)?.title}</span>
                {idx < chartMetrics.length - 1 && <span className="text-gray-400">•</span>}
              </span>
            ))}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={timeline} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#6b7280" minTickGap={24} />

              {yAxisConfig.map((config) => (
                <YAxis
                  key={config.yAxisId}
                  yAxisId={config.yAxisId}
                  orientation={config.orientation}
                  stroke={CHART_COLORS[config.index]}
                  tickFormatter={formatAxisTick}
                  width={80}
                />
              ))}

              <Tooltip
                // `any` on purpose: recharts types the tooltip formatter loosely; the series' dataKey is the metric key.
                formatter={(value: any, name: any, item: any) => {
                  const option = optionByKey.get(item?.dataKey as FlipkartMetricKey);
                  return [option ? formatMetricValue(option.format, Number(value)) : value, name];
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />

              {chartMetrics.map((key, index) => {
                const option = optionByKey.get(key);
                const config = yAxisConfig[index];
                const color = CHART_COLORS[index];

                if (key === "Impressions") {
                  return (
                    <Bar
                      key={key}
                      yAxisId={config.yAxisId}
                      dataKey={key}
                      fill={color}
                      name={option?.title}
                      opacity={0.8}
                      radius={[8, 8, 0, 0]}
                    />
                  );
                }

                return (
                  <Line
                    key={key}
                    yAxisId={config.yAxisId}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={timeline.length <= MAX_DAYS_WITH_DOTS ? { fill: color, r: 4 } : false}
                    activeDot={{ r: 6 }}
                    name={option?.title}
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

export default FlipkartTimelineChart;