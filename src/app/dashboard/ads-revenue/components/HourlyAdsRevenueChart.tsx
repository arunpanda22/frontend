"use client";

import React, { useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import {
  AdType,
  HourlyTrendPoint,
  AdsRevenueMetadata,
} from "@/lib/hooks/useRealtimeAdsRevenueData";
import { AD_TYPE_META, AD_TYPE_ORDER } from "@/lib/constants/adTypes";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[450px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface HourlyAdsRevenueChartProps {
  hourlyTrend: HourlyTrendPoint[] | null;
  metadata?: AdsRevenueMetadata | null;
  isLoading?: boolean;
}

type ViewMode = "hourly" | "cumulative";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getHourInTimezone(isoString: string, ianaTimezone: string): number | null {
  try {
    const date = new Date(isoString);
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      hour: "numeric",
      hour12: false,
    }).format(date);
    const h = parseInt(hourStr, 10);
    return h === 24 ? 0 : h;
  } catch {
    return null;
  }
}

/** Running cumulative sum; slots after `capAtIndex` are forced to null so the
 *  line stops at the last complete hour (used for today's series). */
function calculateCumulativeData(
  hourlyArray: (number | null)[],
  capAtIndex?: number,
): (number | null)[] {
  const cumulative: (number | null)[] = [];
  let sum = 0;
  let hasAnyData = false;

  for (let i = 0; i < hourlyArray.length; i++) {
    if (capAtIndex !== undefined && i > capAtIndex) {
      cumulative.push(null);
      continue;
    }
    const val = hourlyArray[i];
    if (val !== null && val !== undefined) {
      sum += val;
      hasAnyData = true;
      cumulative.push(sum);
    } else {
      cumulative.push(hasAnyData ? sum : null);
    }
  }
  return cumulative;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HourlyAdsRevenueChart = ({
  hourlyTrend,
  metadata,
  isLoading = false,
}: HourlyAdsRevenueChartProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("hourly");
  const { getCurrencySymbol } = useCurrency();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render bars/legend entries for ad types actually present in the response
  // (respects the `ad_types` query param on the hook/API).
  const adTypesIncluded = useMemo<AdType[]>(
    () => AD_TYPE_ORDER.filter((t) => metadata?.ad_types_included?.includes(t)),
    [metadata],
  );

  // -------------------------------------------------------------------------
  // Derive chart data — simpler than the orders chart since the backend
  // already returns one pre-aggregated row per local hour (0-23), rather
  // than a flat array grouped by calendar date.
  // -------------------------------------------------------------------------
  const chartData = useMemo(() => {
    const categories = Array.from({ length: 24 }, (_, i) => `${i}-${i + 1}`);
    const empty = {
      series: [] as ApexAxisChartSeries,
      cumulativeSeries: [] as ApexAxisChartSeries,
      categories,
      lastCompleteHour: null as number | null,
    };

    if (!hourlyTrend || hourlyTrend.length === 0) return empty;

    const sorted = [...hourlyTrend].sort((a, b) => a.hour - b.hour);

    // Cap "today" at the last complete hour so a partially-ingested current
    // hour doesn't show as a misleading dip.
    let lastCompleteHour = -1;
    if (metadata?.generated_at && metadata?.timezone) {
      const h = getHourInTimezone(metadata.generated_at, metadata.timezone);
      if (h !== null) lastCompleteHour = Math.max(0, h - 1);
    }
    const cap = lastCompleteHour >= 0 ? lastCompleteHour : undefined;

    const yesterdayLine = sorted.map((p) => p.yesterday);
    const twoDaysAgoLine = sorted.map((p) => p.two_days_ago);
    const todayTotalCapped = sorted.map((p, idx) =>
      cap === undefined || idx <= cap ? p.today : null,
    );

    const adTypeBars: Partial<Record<AdType, (number | null)[]>> = {};
    adTypesIncluded.forEach((adType) => {
      adTypeBars[adType] = sorted.map((p, idx) => {
        if (cap !== undefined && idx > cap) return null;
        return p.today_by_ad_type?.[adType] ?? null;
      });
    });

    const series: ApexAxisChartSeries = [
      { name: "Yesterday", data: yesterdayLine, type: "line" },
      { name: "2 Days Ago", data: twoDaysAgoLine, type: "line" },
      { name: "Today Total", data: todayTotalCapped, type: "line" },
      ...adTypesIncluded.map((adType) => ({
        name: `Today - ${AD_TYPE_META[adType].shortLabel}`,
        data: adTypeBars[adType] as (number | null)[],
        type: "column" as const,
      })),
    ];

    const cumulativeSeries: ApexAxisChartSeries = [
      { name: "Yesterday", data: calculateCumulativeData(yesterdayLine), type: "line" },
      { name: "2 Days Ago", data: calculateCumulativeData(twoDaysAgoLine), type: "line" },
      { name: "Today", data: calculateCumulativeData(todayTotalCapped, cap), type: "line" },
    ];

    return {
      series,
      cumulativeSeries,
      categories,
      lastCompleteHour: lastCompleteHour >= 0 ? lastCompleteHour : null,
    };
  }, [hourlyTrend, metadata, adTypesIncluded]);

  // -------------------------------------------------------------------------
  // ApexCharts options
  // -------------------------------------------------------------------------
  const buildOptions = (mode: ViewMode): ApexOptions => {
    const barCount = mode === "hourly" ? adTypesIncluded.length : 0;

    return {
      chart: {
        height: 400,
        type: "line",
        stacked: false,
        zoom: { enabled: false },
        toolbar: {
          show: true,
          tools: { download: true, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false },
        },
        animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 150 } },
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        // Yesterday (dashed), 2 Days Ago (dotted), Today Total (solid), then 0-width for each ad-type bar
        width: mode === "cumulative" ? [3, 3, 3] : [3, 3, 2.5, ...Array(barCount).fill(0)],
        dashArray: mode === "cumulative" ? [8, 4, 0] : [8, 4, 0, ...Array(barCount).fill(0)],
      },
      markers: {
        size: mode === "cumulative" ? [4, 4, 4] : [4, 4, 4, ...Array(barCount).fill(0)],
        hover: { sizeOffset: 6 },
      },
      plotOptions: {
        bar: { columnWidth: "40%", dataLabels: { position: "top" } },
      },
      title: {
        text:
          mode === "hourly"
            ? "Ad Revenue by Hour - Last 3 Days"
            : "Cumulative Ad Revenue - Last 3 Days",
        align: "left",
        style: { fontSize: "18px", fontWeight: "bold", color: "#1a2b3c" },
      },
      legend: { show: false },
      xaxis: {
        categories: chartData.categories,
        title: {
          text: "Hour Range",
          style: { fontSize: "13px", fontWeight: 600, color: "#374151" },
        },
        labels: {
          rotate: -45,
          style: { fontSize: "11px", colors: "#6b7280" },
          formatter: (val) => {
            const [start] = String(val).split("-").map(Number);
            return start % 2 === 0 ? String(val) : "";
          },
        },
      },
      yaxis: {
        title: {
          text: mode === "hourly" ? "Revenue" : "Cumulative Revenue",
          style: { fontSize: "13px", fontWeight: 600, color: "#374151" },
        },
        labels: {
          formatter: (val: number) =>
            val == null ? "0" : `${getCurrencySymbol()}${Math.round(val).toLocaleString()}`,
        },
        min: 0,
      },
      grid: { show: true, borderColor: "#f3f4f6", strokeDashArray: 3 },
      tooltip: {
        shared: true,
        intersect: false,
        x: {
          formatter: (val) => `${val}:00 - ${Number(val) + 1}:00`,
        },
        y: {
          formatter: (val) =>
            val === null || val === undefined
              ? "No data"
              : `${getCurrencySymbol()}${Math.round(val).toLocaleString()}${
                  mode === "cumulative" ? " (cumulative)" : ""
                }`,
        },
      },
      colors:
        mode === "cumulative"
          ? ["#8B5CF6", "#EC4899", "#3B82F6"]
          : ["#8B5CF6", "#EC4899", "#10B981", ...adTypesIncluded.map((t) => AD_TYPE_META[t].chartColor)],
    };
  };

  const hourlyOptions = useMemo(() => buildOptions("hourly"), [chartData, adTypesIncluded]);
  const cumulativeOptions = useMemo(() => buildOptions("cumulative"), [chartData, adTypesIncluded]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading hourly ad revenue...</p>
        </div>
      </div>
    );
  }

  if (!hourlyTrend || hourlyTrend.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-xl shadow-lg">
        <p className="text-sm text-gray-500">No hourly data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* View mode toggle */}
      <div className="flex items-center justify-end mb-4">
        <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as ViewMode)}>
          <TabsList>
            <TabsTrigger value="hourly" className="gap-1.5">
              <TrendingUp className="size-4" />
              Hourly
            </TabsTrigger>
            <TabsTrigger value="cumulative" className="gap-1.5">
              <ArrowUpRight className="size-4" />
              Cumulative
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chart */}
      {isMounted && (
        <div id="ads-revenue-chart">
          <ReactApexChart
            key={viewMode}
            options={viewMode === "hourly" ? hourlyOptions : cumulativeOptions}
            series={viewMode === "hourly" ? chartData.series : chartData.cumulativeSeries}
            type="line"
            height={400}
            width="100%"
          />
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-4 tracking-tighter text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500"></div>
            <span className="text-gray-600">Yesterday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dotted border-pink-500"></div>
            <span className="text-gray-600">2 Days Ago</span>
          </div>
          {viewMode === "cumulative" ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600">Today</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-emerald-500"></div>
                <span className="text-gray-600">Today Total (Line)</span>
              </div>
              {adTypesIncluded.map((adType) => (
                <div key={adType} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: AD_TYPE_META[adType].chartColor }}
                  />
                  <span className="text-gray-600">
                    Today - {AD_TYPE_META[adType].shortLabel} (Bar)
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HourlyAdsRevenueChart;