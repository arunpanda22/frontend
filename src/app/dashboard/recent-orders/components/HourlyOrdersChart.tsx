"use client";

import React, { useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";
import { RevenueCard } from "./RevenueCard";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ArrowUpRight } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[450px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HourlyDataPoint {
  date: string;
  hour: string;
  period: string;
  seller_quantity: number;
  vendor_quantity: number;
  total_quantity: number;
  seller_revenue: number;
  vendor_revenue: number;
  total_revenue: number;
  timestamp: string;
}

interface HourlyTotals {
  today: { revenue: number; seller_revenue: number; vendor_revenue: number };
  yesterday: { revenue: number; seller_revenue: number; vendor_revenue: number };
  day_before_yesterday: { revenue: number; seller_revenue: number; vendor_revenue: number };
}

export interface Metadata {
  date: string;            // "2026-02-25"  (market date, YYYY-MM-DD)
  timezone: string;        // "America/Los_Angeles"
  marketplace_id: string;
  last_updated: string;
  last_refreshed_at: string | null;
}

interface HourlyOrdersChartProps {
  hourlyData: HourlyDataPoint[] | null;
  hourlyTotals?: HourlyTotals | null;
  metadata?: Metadata | null;
  isLoading?: boolean;
}

type ViewMode = "hourly" | "cumulative";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateShortFromISO(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const [, month, day] = dateStr.split("-").map(Number);
    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];
    return `${day} ${monthNames[month - 1]}`;
  } catch {
    return dateStr;
  }
}

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

/** Convert a flat hourly array into a running cumulative sum.
 *  If `capAtIndex` is provided, slots after that index are forced to null
 *  so the line stops at the last available hour (used for today's series). */
function calculateCumulativeData(hourlyArray: (number | null)[], capAtIndex?: number): (number | null)[] {
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

const HourlyOrdersChart = ({
  hourlyData,
  hourlyTotals,
  metadata,
  isLoading = false,
}: HourlyOrdersChartProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("hourly");

  const { formatCurrencyNoDecimal, getCurrencySymbol } = useCurrency();

  const { data: userProfile } = useUserProfile();
  const hasVendorAccounts =
    (userProfile?.connected_vendor_accounts?.length ?? 0) > 0;

  useEffect(() => { setIsMounted(true); }, []);

  const formatRevenue = (value: number) =>
    `${getCurrencySymbol()}${Math.round(value).toLocaleString()}`;

  // -------------------------------------------------------------------------
  // Derive chart data
  // -------------------------------------------------------------------------
  const chartData = useMemo(() => {
    const empty = {
      series: [] as ApexAxisChartSeries,
      cumulativeSeries: [] as ApexAxisChartSeries,
      categories: Array.from({ length: 24 }, (_, i) => `${i}-${i + 1}`),
      dates: { today: "", yesterday: "", dayBefore: "" },
      totals: { today: 0, yesterday: 0, dayBefore: 0 },
      timeLabels: [] as string[],
      lastAvailableHour: null as number | null,
    };

    if (!hourlyData || hourlyData.length === 0) return empty;

    // Group by date
    const dataByDate = hourlyData.reduce<Record<string, HourlyDataPoint[]>>(
      (acc, point) => {
        (acc[point.date] ??= []).push(point);
        return acc;
      },
      {},
    );

    // Dates in descending order (today first)
    const dates = Object.keys(dataByDate).sort((a, b) => b.localeCompare(a));
    const todayDate     = dates[0] ?? "";
    const yesterdayDate = dates[1] ?? "";
    const dayBeforeDate = dates[2] ?? "";

    const getHourIndex = (hour: string, period: string): number => {
      const h = parseInt(hour, 10);
      if (period === "AM") return h === 12 ? 0 : h;
      return h === 12 ? 12 : h + 12;
    };

    // ------------------------------------------------------------------
    // lastAvailableHour — uses marketplace timezone (bug fix preserved)
    // ------------------------------------------------------------------
    let lastAvailableHour = -1;
    const marketTz = metadata?.timezone;

    if (metadata?.last_refreshed_at && marketTz) {
      const h = getHourInTimezone(metadata.last_refreshed_at, marketTz);
      if (h !== null) {
        lastAvailableHour = Math.max(0, h - 1);
        console.log(
          `[Chart] last_refreshed_at=${metadata.last_refreshed_at}, ` +
          `market hour=${h} (${marketTz}), last complete hour=${lastAvailableHour}`,
        );
      }
    }

    if (lastAvailableHour === -1 && todayDate && dataByDate[todayDate]) {
      dataByDate[todayDate].forEach((point) => {
        const idx = getHourIndex(point.hour, point.period);
        if (point.total_revenue > 0 && idx > lastAvailableHour) {
          lastAvailableHour = idx;
        }
      });
    }

    const sumArr = (arr: (number | null)[]) =>
      arr.reduce<number>((s, v) => s + (v ?? 0), 0);

    // Build time-label lookup
    const timeLabels = new Array<string>(24).fill("");
    const referenceDate = todayDate || yesterdayDate || dayBeforeDate;
    (dataByDate[referenceDate] ?? []).forEach((point) => {
      timeLabels[getHourIndex(point.hour, point.period)] = point.timestamp;
    });

    const categories = Array.from({ length: 24 }, (_, i) => `${i}-${i + 1}`);

    // ---------------------------------------------------------------
    // Series: Yesterday + 2 Days Ago as lines, Today as bars.
    // With vendor: Today = seller_revenue bar + vendor_revenue bar
    //              + total_revenue line (Today Total).
    // Without vendor: Today = total_revenue bar.
    // ---------------------------------------------------------------
    const cap = lastAvailableHour >= 0 ? lastAvailableHour : undefined;

    // Today arrays (capped at lastAvailableHour)
    const todaySellerBar = new Array<number | null>(24).fill(null);
    const todayVendorBar = new Array<number | null>(24).fill(null);
    const todayTotalBar  = new Array<number | null>(24).fill(null);
    (dataByDate[todayDate] ?? []).forEach((point) => {
      const idx = getHourIndex(point.hour, point.period);
      if (cap === undefined || idx <= cap) {
        todaySellerBar[idx] = point.seller_revenue;
        todayVendorBar[idx] = point.vendor_revenue;
        todayTotalBar[idx]  = point.total_revenue;
      }
    });

    // Today total line — same data as todayTotalBar but rendered as a line
    // so it sits on top of the split bars to show the combined value clearly.
    const todayTotalLine = new Array<number | null>(24).fill(null);
    (dataByDate[todayDate] ?? []).forEach((point) => {
      const idx = getHourIndex(point.hour, point.period);
      if (cap === undefined || idx <= cap) {
        todayTotalLine[idx] = point.total_revenue;
      }
    });

    // Yesterday — total_revenue line, uncapped
    const yesterdayLine = new Array<number | null>(24).fill(null);
    (dataByDate[yesterdayDate] ?? []).forEach((point) => {
      yesterdayLine[getHourIndex(point.hour, point.period)] = point.total_revenue;
    });

    // 2 Days Ago — total_revenue line, uncapped
    const dayBeforeLine = new Array<number | null>(24).fill(null);
    (dataByDate[dayBeforeDate] ?? []).forEach((point) => {
      dayBeforeLine[getHourIndex(point.hour, point.period)] = point.total_revenue;
    });

    // Hourly series
    // Vendor accounts: lines (Yesterday, 2 Days Ago, Today Total) + bars (Seller, Vendor)
    // Seller-only: all three days as lines, no bars
    const series: ApexAxisChartSeries = hasVendorAccounts
      ? [
          { name: `Yesterday (${formatDateShortFromISO(yesterdayDate)})`,   data: yesterdayLine,  type: "line"   },
          { name: `2 Days Ago (${formatDateShortFromISO(dayBeforeDate)})`,  data: dayBeforeLine,  type: "line"   },
          { name: `Today Total (${formatDateShortFromISO(todayDate)})`,     data: todayTotalLine, type: "line"   },
          { name: "Today - Seller",                                           data: todaySellerBar, type: "column" },
          { name: "Today - Vendor",                                           data: todayVendorBar, type: "column" },
        ]
      : [
          { name: `Yesterday (${formatDateShortFromISO(yesterdayDate)})`,  data: yesterdayLine,  type: "line" },
          { name: `2 Days Ago (${formatDateShortFromISO(dayBeforeDate)})`, data: dayBeforeLine,  type: "line" },
          { name: `Today (${formatDateShortFromISO(todayDate)})`,          data: todayTotalLine, type: "line" },
        ];

    // Cumulative: all 3 days as lines — today total_revenue (capped), yesterday + day-before uncapped
    const cumulativeSeries: ApexAxisChartSeries = [
      { name: `Yesterday (${formatDateShortFromISO(yesterdayDate)})`,  data: calculateCumulativeData(yesterdayLine),        type: "line" },
      { name: `2 Days Ago (${formatDateShortFromISO(dayBeforeDate)})`, data: calculateCumulativeData(dayBeforeLine),        type: "line" },
      { name: `Today (${formatDateShortFromISO(todayDate)})`,          data: calculateCumulativeData(todayTotalBar, cap),   type: "line" },
    ];

    return {
      series,
      cumulativeSeries,
      categories,
      dates: { today: todayDate, yesterday: yesterdayDate, dayBefore: dayBeforeDate },
      totals: {
        today:     sumArr(todayTotalBar),
        yesterday: sumArr(yesterdayLine),
        dayBefore: sumArr(dayBeforeLine),
      },
      timeLabels,
      lastAvailableHour: lastAvailableHour >= 0 ? lastAvailableHour : null,
    };
  }, [hourlyData, metadata, hasVendorAccounts]);

  // -------------------------------------------------------------------------
  // ApexCharts options — shared base, differing only in title + tooltip y-label
  // -------------------------------------------------------------------------
  const buildOptions = (mode: ViewMode): ApexOptions => ({
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
      // Hourly with vendor: Yesterday (dashed), 2 Days Ago (dotted), Today Total (solid), bars (0)
      // Hourly without vendor: Yesterday (dashed), 2 Days Ago (dotted), bars (0)
      // Cumulative: all 3 are solid lines with varying dash
      width: mode === "cumulative"
        ? [3, 3, 3]
        : hasVendorAccounts ? [3, 3, 2.5, 0, 0] : [3, 3, 3],
      dashArray: mode === "cumulative"
        ? [8, 4, 0]
        : hasVendorAccounts ? [8, 4, 0, 0, 0] : [8, 4, 0],
    },
    markers: {
      size: mode === "cumulative"
        ? [4, 4, 4]
        : hasVendorAccounts ? [4, 4, 4, 0, 0] : [4, 4, 4],
      hover: { sizeOffset: 6 },
    },
    plotOptions: {
      bar: { columnWidth: "40%", dataLabels: { position: "top" } },
    },
    title: {
      text: mode === "hourly"
        ? "Revenue by Hour - Last 3 Days"
        : "Cumulative Revenue - Last 3 Days",
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
      labels: { formatter: (val: number) => val == null ? "0" : `${getCurrencySymbol()}${Math.round(val).toLocaleString()}` },
      min: 0,
    },
    grid: { show: true, borderColor: "#f3f4f6", strokeDashArray: 3 },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (val, opts) => {
          const idx = opts?.dataPointIndex ?? (typeof val === "number" ? val : parseInt(String(val)));
          return chartData.timeLabels[idx] || `${idx}:00 - ${idx + 1}:00`;
        },
      },
      y: {
        formatter: (val) =>
          val === null || val === undefined
            ? "No data"
            : `${getCurrencySymbol()}${Math.round(val).toLocaleString()}${mode === "cumulative" ? " (cumulative)" : ""}`,
      },
    },
    // Hourly with vendor:    Yesterday (purple), 2 Days Ago (pink), Today Total (teal line), Seller bar (blue), Vendor bar (light blue)
    // Hourly seller-only:   Yesterday (purple), 2 Days Ago (pink), Today (blue) — all lines
    // Cumulative:            Yesterday (purple), 2 Days Ago (pink), Today (blue)
    colors: mode === "cumulative"
      ? ["#8B5CF6", "#EC4899", "#3B82F6"]
      : hasVendorAccounts
        ? ["#8B5CF6", "#EC4899", "#3B82F6", "#3B82F6", "#60A5FA"]
        : ["#8B5CF6", "#EC4899", "#3B82F6"],
    annotations:
      chartData.lastAvailableHour !== null
        ? {
            // xaxis: [
            //   {
            //     x: chartData.lastAvailableHour,
            //     x2: chartData.lastAvailableHour + 0.5,
            //     borderColor: "#3b82f6",
            //     fillColor: "#3b82f6",
            //     opacity: 0.1,
            //     label: {
            //       text: `Last: ${chartData.lastAvailableHour}-${chartData.lastAvailableHour + 1}`,
            //       position: "top",
            //       style: { color: "#fff", background: "#3b82f6", fontSize: "10px" },
            //     },
            //   },
            // ],
          }
        : undefined,
  });

  const hourlyOptions     = useMemo(() => buildOptions("hourly"),     [chartData, hasVendorAccounts]);
  const cumulativeOptions = useMemo(() => buildOptions("cumulative"), [chartData, hasVendorAccounts]);

  // -------------------------------------------------------------------------
  // Derived date labels for revenue cards
  // -------------------------------------------------------------------------
  const todayLabel     = formatDateShortFromISO(chartData.dates.today);
  const yestLabel      = formatDateShortFromISO(chartData.dates.yesterday);
  const dayBeforeLabel = formatDateShortFromISO(chartData.dates.dayBefore);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading hourly data...</p>
        </div>
      </div>
    );
  }

  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-xl shadow-lg">
        <p className="text-sm text-gray-500">No hourly data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Revenue summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        <RevenueCard
          label={`Today (${todayLabel})`}
          data={hourlyTotals?.today}
          color="blue"
          showVendor={hasVendorAccounts}
          formatRevenue={formatRevenue}
        />
        <RevenueCard
          label={`Yesterday (${yestLabel})`}
          data={hourlyTotals?.yesterday}
          color="purple"
          showVendor={hasVendorAccounts}
          formatRevenue={formatRevenue}
        />
        <RevenueCard
          label={`2 Days Ago (${dayBeforeLabel})`}
          data={hourlyTotals?.day_before_yesterday}
          color="pink"
          showVendor={hasVendorAccounts}
          formatRevenue={formatRevenue}
        />
      </div>

      {/* Tax note */}
      <div className="mb-4 flex items-center pl-2">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500 ml-1">Revenue shown is tax adjusted</p>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center justify-end mb-4">
        <Tabs
          value={viewMode}
          onValueChange={(val) => setViewMode(val as ViewMode)}
        >
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
        <div id="hybrid-orders-chart">
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
          ) : hasVendorAccounts ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-emerald-500"></div>
                <span className="text-gray-600">Today Total (Line)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Today - Seller (Bar)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span className="text-gray-600">Today - Vendor (Bar)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600">Today</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HourlyOrdersChart;