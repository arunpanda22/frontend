"use client";

import React, { useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useUserProfile } from "@/lib/hooks/queries/use-user-profile";
import { RevenueCard } from "./RevenueCard";
import { useCurrency } from "@/lib/context/CurrencyContext";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a YYYY-MM-DD string into "Feb 25" without any timezone conversion.
 */
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

/**
 * Convert an ISO datetime string to a wall-clock hour **in the given IANA
 * timezone**. Returns the 0-23 hour integer, or null on failure.
 *
 * This fixes the original bug where `new Date(...).getHours()` used the
 * browser's local timezone (India) instead of the marketplace timezone (US).
 */
function getHourInTimezone(isoString: string, ianaTimezone: string): number | null {
  try {
    const date = new Date(isoString);
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      hour: "numeric",
      hour12: false,
    }).format(date);
    const h = parseInt(hourStr, 10);
    // Intl can return 24 for midnight in some environments
    return h === 24 ? 0 : h;
  } catch {
    return null;
  }
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
  const { formatCurrencyNoDecimal, getCurrencySymbol } = useCurrency();

  const lineColors = ["#3B82F6", "#8B5CF6", "#EC4899"];
  const barColors  = ["#60A5FA", "#A78BFA"];

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
      series: [],
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

    // Convert 12-h (hour + period) to 0-23 index
    const getHourIndex = (hour: string, period: string): number => {
      const h = parseInt(hour, 10);
      if (period === "AM") return h === 12 ? 0 : h;
      return h === 12 ? 12 : h + 12;
    };

    // -----------------------------------------------------------------
    // Calculate lastAvailableHour using MARKETPLACE timezone (bug fix)
    // -----------------------------------------------------------------
    let lastAvailableHour = -1;
    const marketTz = metadata?.timezone;

    if (metadata?.last_refreshed_at && marketTz) {
      const h = getHourInTimezone(metadata.last_refreshed_at, marketTz);
      if (h !== null) {
        // last_refreshed_at is the START of the most recently completed ingestion.
        // The completed data covers hours UP TO (but not including) this hour,
        // so the last complete hour slot is h - 1.
        lastAvailableHour = Math.max(0, h - 1);
        console.log(
          `[Chart] last_refreshed_at=${metadata.last_refreshed_at}, ` +
          `market hour=${h} (${marketTz}), last complete hour=${lastAvailableHour}`,
        );
      }
    }

    // Fallback: derive from data if metadata not available
    if (lastAvailableHour === -1 && todayDate && dataByDate[todayDate]) {
      dataByDate[todayDate].forEach((point) => {
        const idx = getHourIndex(point.hour, point.period);
        if (point.total_quantity > 0 && idx > lastAvailableHour) {
          lastAvailableHour = idx;
        }
      });
    }

    // -----------------------------------------------------------------
    // Build per-day arrays
    // -----------------------------------------------------------------
    const createDayData = (
      date: string,
      capAtLastAvailable = false,
    ): number[] => {
      const arr = new Array<number | null>(24).fill(null);
      (dataByDate[date] ?? []).forEach((point) => {
        const idx = getHourIndex(point.hour, point.period);
        if (!capAtLastAvailable || idx <= lastAvailableHour) {
          arr[idx] = point.total_quantity;
        }
      });
      return arr as number[];
    };

    const createTodaySplit = () => {
      const seller = new Array<number | null>(24).fill(null);
      const vendor = new Array<number | null>(24).fill(null);
      (dataByDate[todayDate] ?? []).forEach((point) => {
        const idx = getHourIndex(point.hour, point.period);
        if (idx <= lastAvailableHour) {
          seller[idx] = point.seller_quantity;
          vendor[idx] = point.vendor_quantity;
        }
      });
      return { sellerData: seller as number[], vendorData: vendor as number[] };
    };

    const todayTotalData     = createDayData(todayDate, true);
    const yesterdayTotalData = createDayData(yesterdayDate, false);
    const dayBeforeTotalData = createDayData(dayBeforeDate, false);
    const { sellerData: todaySellerData, vendorData: todayVendorData } =
      createTodaySplit();

    // Simple totals (for the cards)
    const sumArr = (arr: (number | null)[]) =>
      arr.reduce<number>((s, v) => s + (v ?? 0), 0);

    // Build time-label lookup from whichever date has the most points
    const timeLabels = new Array<string>(24).fill("");
    const referenceDate = todayDate || yesterdayDate || dayBeforeDate;
    (dataByDate[referenceDate] ?? []).forEach((point) => {
      timeLabels[getHourIndex(point.hour, point.period)] = point.timestamp;
    });

    const categories = Array.from({ length: 24 }, (_, i) => `${i}-${i + 1}`);

    const series = hasVendorAccounts
      ? [
          { name: `Today Total (${formatDateShortFromISO(todayDate)})`,     data: todayTotalData,     type: "line"   as const },
          { name: `Yesterday (${formatDateShortFromISO(yesterdayDate)})`,   data: yesterdayTotalData, type: "line"   as const },
          { name: `2 Days Ago (${formatDateShortFromISO(dayBeforeDate)})`,  data: dayBeforeTotalData, type: "line"   as const },
          { name: "Today - Seller",                                          data: todaySellerData,    type: "column" as const },
          { name: "Today - Vendor",                                          data: todayVendorData,    type: "column" as const },
        ]
      : [
          { name: `Today Total (${formatDateShortFromISO(todayDate)})`,     data: todayTotalData,     type: "line" as const },
          { name: `Yesterday (${formatDateShortFromISO(yesterdayDate)})`,   data: yesterdayTotalData, type: "line" as const },
          { name: `2 Days Ago (${formatDateShortFromISO(dayBeforeDate)})`,  data: dayBeforeTotalData, type: "line" as const },
        ];

    return {
      series,
      categories,
      dates: { today: todayDate, yesterday: yesterdayDate, dayBefore: dayBeforeDate },
      totals: {
        today:     sumArr(todayTotalData),
        yesterday: sumArr(yesterdayTotalData),
        dayBefore: sumArr(dayBeforeTotalData),
      },
      timeLabels,
      lastAvailableHour: lastAvailableHour >= 0 ? lastAvailableHour : null,
    };
  }, [hourlyData, metadata, hasVendorAccounts]);

  // -------------------------------------------------------------------------
  // ApexCharts options
  // -------------------------------------------------------------------------
  const options: ApexOptions = useMemo(() => ({
    chart: {
      height: 400,
      type: "line",
      stacked: false,
      zoom: { enabled: false },
      toolbar: {
        show: true,
        tools: { download: true, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false },
      },
      animations: { enabled: true, easing: "easeinout", speed: 800 },
    },
    dataLabels: { enabled: false },
    stroke: {
      width:     hasVendorAccounts ? [3, 3, 3, 0, 0] : [3, 3, 3],
      curve:     "smooth",
      dashArray: hasVendorAccounts ? [0, 8, 4, 0, 0] : [0, 8, 4],
    },
    plotOptions: {
      bar: { columnWidth: "40%", dataLabels: { position: "top" } },
    },
    title: {
      text: "Orders by Hour - Last 3 Days",
      align: "left",
      style: { fontSize: "18px", fontWeight: "bold", color: "#1a2b3c" },
    },
    legend: { show: false },
    markers: {
      size:  hasVendorAccounts ? [4, 0, 0, 0, 0] : [4, 0, 0],
      hover: { sizeOffset: 6 },
    },
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
        text: "Number of Orders",
        style: { fontSize: "13px", fontWeight: 600, color: "#374151" },
      },
      labels: { formatter: (val) => val?.toFixed(0) ?? "0" },
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
          val === null || val === undefined ? "No data" : `${val.toFixed(0)} orders`,
      },
    },
    colors: hasVendorAccounts ? [...lineColors, ...barColors] : lineColors,
    annotations:
      chartData.lastAvailableHour !== null
        ? {
            xaxis: [
              {
                x: chartData.lastAvailableHour,
                x2: chartData.lastAvailableHour + 0.5,
                borderColor: "#3b82f6",
                fillColor: "#3b82f6",
                opacity: 0.1,
                label: {
                  text: `Last: ${chartData.lastAvailableHour}-${chartData.lastAvailableHour + 1}`,
                  position: "top",
                  style: { color: "#fff", background: "#3b82f6", fontSize: "10px" },
                },
              },
            ],
          }
        : undefined,
  }), [chartData, hasVendorAccounts]);

  // -------------------------------------------------------------------------
  // Derived date labels for revenue cards  (e.g. "Feb 25")
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

      {/* Chart */}
      {isMounted && (
        <div id="hybrid-orders-chart">
          <ReactApexChart
            options={options}
            series={chartData.series}
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
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Today Total (Line)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500"></div>
            <span className="text-gray-600">Yesterday (Line)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dotted border-pink-500"></div>
            <span className="text-gray-600">2 Days Ago (Line)</span>
          </div>
          {hasVendorAccounts && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span className="text-gray-600">Today Seller (Bar)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-400 rounded"></div>
                <span className="text-gray-600">Today Vendor (Bar)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HourlyOrdersChart;