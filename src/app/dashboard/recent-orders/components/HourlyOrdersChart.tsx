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
  today: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
  yesterday: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
  day_before_yesterday: {
    revenue: number;
    seller_revenue: number;
    vendor_revenue: number;
  };
}

interface HourlyOrdersChartProps {
  hourlyData: HourlyDataPoint[] | null;
  hourlyTotals?: HourlyTotals | null;
  metadata?: Metadata | null;
  isLoading?: boolean;
}

export interface Metadata {
  date: string;
  timezone: string;
  marketplace_id: string;
  last_updated: string;
  last_refreshed_at: string | null;
}

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[month - 1]} ${day}`;
  } catch {
    return dateStr;
  }
};

const HourlyOrdersChart = ({
  hourlyData,
  hourlyTotals,
  metadata,
  isLoading = false,
}: HourlyOrdersChartProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const { formatCurrencyNoDecimal, formatNumber, getCurrencySymbol } = useCurrency();

  const lineColors = ["#3B82F6", "#8B5CF6", "#EC4899"];
  const barColors = ["#60A5FA", "#A78BFA"];

  const { data: userProfile } = useUserProfile();
  const hasVendorAccounts =
    (userProfile?.connected_vendor_accounts?.length ?? 0) > 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatRevenue = (value: number) =>
  `${getCurrencySymbol()}${Math.round(value).toLocaleString()}`;

  const chartData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return {
        series: [],
        categories: Array.from({ length: 24 }, (_, i) => `${i}-${i + 1}`),
        dates: { today: "", yesterday: "", dayBefore: "" },
        totals: { today: 0, yesterday: 0, dayBefore: 0 },
        timeLabels: [],
        lastAvailableHour: null,
      };
    }

    const dataByDate = hourlyData.reduce(
      (acc, point) => {
        if (!acc[point.date]) {
          acc[point.date] = [];
        }
        acc[point.date].push(point);
        return acc;
      },
      {} as Record<string, HourlyDataPoint[]>,
    );

    const dates = Object.keys(dataByDate).sort((a, b) => b.localeCompare(a));

    const todayDate = dates[0] || "";
    const yesterdayDate = dates[1] || "";
    const dayBeforeDate = dates[2] || "";

    const getHourIndex = (hour: string, period: string): number => {
      let h = parseInt(hour);
      if (period === "AM") {
        return h === 12 ? 0 : h;
      } else {
        return h === 12 ? 12 : h + 12;
      }
    };

    // Calculate last available hour from last_refreshed_at
    let lastAvailableHour = -1;
    if (metadata?.last_refreshed_at) {
      try {
        const lastRefreshedDate = new Date(metadata.last_refreshed_at);
        const lastRefreshedHour = lastRefreshedDate.getHours();
        // The data is for completed hours, so if it's 10:30, the last complete hour is 9-10 (hour 9)
        lastAvailableHour = lastRefreshedHour - 1;

        // Make sure it's not negative
        if (lastAvailableHour < 0) {
          lastAvailableHour = 0;
        }

        console.log(
          `Last refreshed at: ${metadata.last_refreshed_at}, Hour: ${lastRefreshedHour}, Last complete hour: ${lastAvailableHour}-${lastAvailableHour + 1}`,
        );
      } catch (error) {
        console.error("Error parsing last_refreshed_at:", error);
        // Fallback to finding last hour from data
        if (todayDate && dataByDate[todayDate]) {
          dataByDate[todayDate].forEach((point) => {
            const hourIndex = getHourIndex(point.hour, point.period);
            if (hourIndex > lastAvailableHour) {
              lastAvailableHour = hourIndex;
            }
          });
        }
      }
    } else {
      // Fallback: find last available hour from data
      if (todayDate && dataByDate[todayDate]) {
        dataByDate[todayDate].forEach((point) => {
          const hourIndex = getHourIndex(point.hour, point.period);
          if (hourIndex > lastAvailableHour) {
            lastAvailableHour = hourIndex;
          }
        });
      }
    }

    const createDayTotalData = (
      date: string,
      limitToLastAvailable: boolean = false,
    ) => {
      const dayData = new Array(24).fill(null);
      const datePoints = dataByDate[date] || [];

      datePoints.forEach((point) => {
        const hourIndex = getHourIndex(point.hour, point.period);

        // Only add data if it's within the available range
        if (!limitToLastAvailable || hourIndex <= lastAvailableHour) {
          dayData[hourIndex] = point.total_quantity;
        }
      });

      return dayData;
    };

    const createTodaySplitData = () => {
      const sellerData = new Array(24).fill(null);
      const vendorData = new Array(24).fill(null);
      const datePoints = dataByDate[todayDate] || [];

      datePoints.forEach((point) => {
        const hourIndex = getHourIndex(point.hour, point.period);

        // Only add data if it's within the available range
        if (hourIndex <= lastAvailableHour) {
          sellerData[hourIndex] = point.seller_quantity;
          vendorData[hourIndex] = point.vendor_quantity;
        }
      });

      return { sellerData, vendorData };
    };

    const todayTotalData = createDayTotalData(todayDate, true);
    const yesterdayTotalData = createDayTotalData(yesterdayDate, false);
    const dayBeforeTotalData = createDayTotalData(dayBeforeDate, false);

    const { sellerData: todaySellerData, vendorData: todayVendorData } =
      createTodaySplitData();

    const total_today = todayTotalData
      .filter((v) => v !== null)
      .reduce((sum, v) => sum + (v || 0), 0);
    const total_yesterday = yesterdayTotalData
      .filter((v) => v !== null)
      .reduce((sum, v) => sum + (v || 0), 0);
    const total_day_before = dayBeforeTotalData
      .filter((v) => v !== null)
      .reduce((sum, v) => sum + (v || 0), 0);

    // Create categories as hour ranges: "0-1", "1-2", ..., "23-24"
    const categories = Array.from({ length: 24 }, (_, i) => `${i}-${i + 1}`);

    const timeLabels = Array(24).fill("");
    const availableDate = todayDate || yesterdayDate || dayBeforeDate;
    if (availableDate && dataByDate[availableDate]) {
      dataByDate[availableDate].forEach((point) => {
        const hourIndex = getHourIndex(point.hour, point.period);
        timeLabels[hourIndex] = point.timestamp;
      });
    }

    const series = hasVendorAccounts
      ? [
          {
            name: `Today Total (${formatDateShort(todayDate)})`,
            data: todayTotalData,
            type: "line" as const,
          },
          {
            name: `Yesterday (${formatDateShort(yesterdayDate)})`,
            data: yesterdayTotalData,
            type: "line" as const,
          },
          {
            name: `2 Days Ago (${formatDateShort(dayBeforeDate)})`,
            data: dayBeforeTotalData,
            type: "line" as const,
          },
          {
            name: "Today - Seller",
            data: todaySellerData,
            type: "column" as const,
          },
          {
            name: "Today - Vendor",
            data: todayVendorData,
            type: "column" as const,
          },
        ]
      : [
          {
            name: `Today Total (${formatDateShort(todayDate)})`,
            data: todayTotalData,
            type: "line" as const,
          },
          {
            name: `Yesterday (${formatDateShort(yesterdayDate)})`,
            data: yesterdayTotalData,
            type: "line" as const,
          },
          {
            name: `2 Days Ago (${formatDateShort(dayBeforeDate)})`,
            data: dayBeforeTotalData,
            type: "line" as const,
          },
        ];

    return {
      series,
      categories,
      dates: {
        today: todayDate,
        yesterday: yesterdayDate,
        dayBefore: dayBeforeDate,
      },
      totals: {
        today: total_today,
        yesterday: total_yesterday,
        dayBefore: total_day_before,
      },
      timeLabels,
      lastAvailableHour: lastAvailableHour >= 0 ? lastAvailableHour : null,
    };
  }, [hourlyData, metadata?.last_refreshed_at, hasVendorAccounts]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        height: 400,
        type: "line",
        stacked: false,
        zoom: { enabled: false },
        toolbar: {
          show: true,
          tools: {
            download: true,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        width: hasVendorAccounts ? [3, 3, 3, 0, 0] : [3, 3, 3], // Conditional stroke widths
        curve: "smooth",
        dashArray: hasVendorAccounts ? [0, 8, 4, 0, 0] : [0, 8, 4], // Conditional dash arrays
      },
      plotOptions: {
        bar: {
          columnWidth: "40%",
          dataLabels: {
            position: "top",
          },
        },
      },
      title: {
        text: "Orders by Hour - Last 3 Days",
        align: "left",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          color: "#1a2b3c",
        },
      },
      legend: {
        show: false,
      },
      markers: {
        size: hasVendorAccounts ? [4, 0, 0, 0, 0] : [4, 0, 0], // Conditional marker sizes
        hover: { sizeOffset: 6 },
      },
      xaxis: {
        categories: chartData.categories,
        title: {
          text: "Hour Range",
          style: {
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
          },
        },
        labels: {
          rotate: -45,
          style: {
            fontSize: "11px",
            colors: "#6b7280",
          },
          formatter: (val) => {
            const hourRange = String(val);
            const [start] = hourRange.split("-").map(Number);
            if (start % 2 === 0) {
              return hourRange;
            }
            return "";
          },
        },
      },
      yaxis: {
        title: {
          text: "Number of Orders",
          style: {
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
          },
        },
        labels: {
          formatter: (val) => val?.toFixed(0) || "0",
        },
        min: 0,
      },
      grid: {
        show: true,
        borderColor: "#f3f4f6",
        strokeDashArray: 3,
      },
      tooltip: {
        shared: true,
        intersect: false,
        x: {
          formatter: (val, opts) => {
            const hourIndex =
              opts?.dataPointIndex ??
              (typeof val === "number" ? val : parseInt(String(val)));
            if (chartData.timeLabels[hourIndex]) {
              return chartData.timeLabels[hourIndex];
            }
            return `${hourIndex}:00 - ${hourIndex + 1}:00`;
          },
        },
        y: {
          formatter: (val) => {
            if (val === null || val === undefined) {
              return "No data";
            }
            return val.toFixed(0) + " orders";
          },
        },
      },
      colors: hasVendorAccounts
        ? [...lineColors, ...barColors] // All 5 colors
        : lineColors, // Only 3 colors for lines
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
                    style: {
                      color: "#fff",
                      background: "#3b82f6",
                      fontSize: "10px",
                    },
                  },
                },
              ],
            }
          : undefined,
    }),
    [chartData, lineColors, barColors, hasVendorAccounts], // Add hasVendorAccounts to dependencies
  );

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
      <div className="grid grid-cols-3 gap-4 mb-2">
        <RevenueCard
          label="Today's Revenue"
          data={hourlyTotals?.today}
          color="blue"
          showVendor={hasVendorAccounts}
          formatRevenue={formatRevenue}
        />

        <RevenueCard
          label="Yesterday's Revenue"
          data={hourlyTotals?.yesterday}
          color="purple"
          showVendor={hasVendorAccounts}
          formatRevenue={formatRevenue}
        />

        <RevenueCard
          label="2 Days Ago Revenue"
          data={hourlyTotals?.day_before_yesterday}
          color="pink"
          showVendor={hasVendorAccounts}
          formatRevenue={formatRevenue}
        />
      </div>

      <div className="mb-4 flex items-center pl-2">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500">
          Revenue shown is tax adjusted
        </p>
      </div>

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
