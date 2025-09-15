import React, { useState, useMemo, useEffect } from "react";
import { Chart } from "react-chartjs-2";
import type { ChartData, ChartDataset } from "chart.js";
import { DateRangePicker } from "react-date-range";
import type { Range, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { useWeeklyData } from "@/lib/hooks/queries/use-dashboard";
import { useCurrency } from "@/lib/context/CurrencyContext";

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend, 
  LineController,
  BarController  // ADD THIS - this is what's missing!
} from 'chart.js';

// Register Chart.js components we're using
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController  // ADD THIS - this is what's missing!
);

const DATASET_OPTIONS = [
  { label: "Weekly", value: "weeklysails" },
  { label: "Monthly", value: "monthlysails" },
];

const KPI_OPTIONS = [
  {
    id: "impressions",
    title: "Impressions",
    keys: ["impressions"],
    format: "number",
    color: "#E06CB7",
  },
  {
    id: "clicks",
    title: "Clicks",
    keys: ["clicks"],
    format: "number",
    color: "#633CEB",
  },
  {
    id: "cost",
    title: "Cost",
    keys: ["cost"],
    format: "currency",
    color: "#00B2A9",
  },
  {
    id: "sales",
    title: "Sales",
    keys: ["sales_30d"],
    format: "currency",
    color: "#4285F4",
  },
  {
    id: "purchases",
    title: "Purchases",
    keys: ["purchases_30d"],
    format: "number",
    color: "#FFA500",
  },
  {
    id: "ctr",
    title: "CTR %",
    keys: ["CTR%"],
    format: "percent",
    color: "#4CAF50",
  },
  {
    id: "cpc",
    title: "CPC",
    keys: ["CPC"],
    format: "currency",
    color: "#F44336",
  },
  {
    id: "asp",
    title: "ASP",
    keys: ["Sales ASP"],
    format: "currency",
    color: "#FFC107",
  },
  {
    id: "conversion",
    title: "Conversion %",
    keys: ["CVR%"],
    format: "percent",
    color: "#3F51B5",
  },
  {
    id: "acos",
    title: "ACOS %",
    keys: ["ACOS%"],
    format: "percent",
    color: "#673AB7",
  },
  {
    id: "cpa",
    title: "CPA",
    keys: ["CPA"],
    format: "currency",
    color: "#03A9F4",
  },
  {
    id: "totalSales",
    title: "Total Sales",
    keys: ["Total Sales"],
    format: "currency",
    color: "#CDDC39",
  },
  {
    id: "totalQuantity",
    title: "Total Quantity",
    keys: ["Total Quantity"],
    format: "number",
    color: "#00BCD4",
  },
] as const;

type KPIKey = (typeof KPI_OPTIONS)[number]["id"];

// Group metrics by category for the filter UI
const KPI_GROUPS = [
  {
    label: "Advertising",
    ids: [
      "impressions",
      "clicks",
      "cost",
      "sales",
      "ctr",
      "cpc",
      "acos",
      "cpa",
      "conversion",
    ],
  },
];

const DEFAULT_METRICS: KPIKey[] = ["impressions", "clicks", "acos", "ctr"];

// --- Main Component ---
const AdsTimeLineChart = () => {
  // Currency context
  const { formatCurrency, formatNumber, isLoading: isCurrencyLoading, error: currencyError } = useCurrency();

  // For each card, track selected KPI
  const [cardKpis, setCardKpis] = useState<KPIKey[]>(DEFAULT_METRICS);
  const [cardDropdownOpen, setCardDropdownOpen] = useState([
    false,
    false,
    false,
    false,
  ]);
  const cardDropdownRefs = [
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
  ];

  // Dropdown state
  const [granularity, setGranularity] = useState<
    "weeklysails" | "monthlysails"
  >("monthlysails");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Multi-metric filter state
  const [metricsDropdownOpen, setMetricsDropdownOpen] = useState(false);
  const metricsDropdownRef = React.useRef<HTMLDivElement>(null);
  const [selectedMetrics, setSelectedMetrics] =
    useState<KPIKey[]>(DEFAULT_METRICS);

  // API data fetching - replaced static JSON
  const {
    data: weeklyApiData,
    isLoading,
    isError,
    error,
  } = useWeeklyData({
    focus_level: "all",
    aggregation: granularity === "monthlysails" ? "monthly" : "weekly",
  });

  // Date range state for react-date-range
  const [dateRange, setDateRange] = useState<Range>({
    startDate: undefined,
    endDate: undefined,
    key: "selection",
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quick, setQuick] = useState<
    "lastWeek" | "lastMonth" | "lastYear" | "custom" | null
  >(null);
  // For filtering
  const startDate = dateRange.startDate;
  const endDate = dateRange.endDate;

  // Currency formatting functions with fallback
  const formatCurrencyValue = (value: number) => {
    if (isCurrencyLoading) return "Loading...";
    if (currencyError) {
      console.warn("Currency context error, using fallback:", currencyError);
      // Fallback formatting
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return formatCurrency(value);
  };

  const formatNumberValue = (value: number) => {
    if (isCurrencyLoading) return "Loading...";
    return formatNumber(value);
  };

  // Compute the metrics to show in the cards: first four from selectedMetrics, fallback to cardKpis if less than four
  const cardMetrics: KPIKey[] = useMemo(() => {
    if (selectedMetrics.length >= 4)
      return selectedMetrics.slice(0, 4) as KPIKey[];
    // Fill with cardKpis if not enough selected
    const filled = [...selectedMetrics];
    for (let i = 0; filled.length < 4 && i < cardKpis.length; i++) {
      if (!filled.includes(cardKpis[i])) filled.push(cardKpis[i]);
    }
    return filled.slice(0, 4) as KPIKey[];
  }, [selectedMetrics, cardKpis]);

  // Close all dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setDropdownOpen(false);
      if (
        metricsDropdownRef.current &&
        !metricsDropdownRef.current.contains(event.target as Node)
      )
        setMetricsDropdownOpen(false);
      setCardDropdownOpen((openArr) =>
        openArr.map((open, idx) => {
          if (
            open &&
            cardDropdownRefs[idx].current &&
            !cardDropdownRefs[idx].current.contains(event.target as Node)
          ) {
            return false;
          }
          return open;
        })
      );
    }
    if (dropdownOpen || metricsDropdownOpen || cardDropdownOpen.some(Boolean)) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, metricsDropdownOpen, cardDropdownOpen]);

  // Transform API data to match the expected format
  const dataset = useMemo(() => {
    if (!weeklyApiData) {
      console.log("No weekly data available:", weeklyApiData);
      return [];
    }

    // Handle both possible response structures
    const dataArray = Array.isArray(weeklyApiData)
      ? weeklyApiData
      : weeklyApiData.weekly_data;

    if (!dataArray || !Array.isArray(dataArray)) {
      console.log("No valid data array found:", weeklyApiData);
      return [];
    }

    console.log("Weekly data received:", dataArray);
    console.log("Weekly data length:", dataArray.length);
    console.log("First item keys:", Object.keys(dataArray[0] || {}));
    return dataArray;
  }, [weeklyApiData]);

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
      {} as Record<KPIKey, number[]>
    );
    const initialTotals = KPI_OPTIONS.reduce(
      (acc, kpi) => ({ ...acc, [kpi.id]: 0 }),
      {} as Record<KPIKey, number>
    );

    if (!dataset.length) {
      console.log("No dataset available for chart");
      return { labels: [], data: initialData, totals: initialTotals };
    }


    // Filter dataset by date range if selected
    let filtered = dataset;
    if (startDate && endDate) {
      const start = new Date(startDate.setHours(0, 0, 0, 0));
      const end = new Date(endDate.setHours(23, 59, 59, 999));
      filtered = dataset.filter((d) => {
        // Try to parse d.time_group as a date
        const date = new Date(d.time_group);
        if (isNaN(date.getTime())) return true; // If can't parse, include by default
        return date >= start && date <= end;
      });
      console.log("Filtered dataset to", filtered.length, "items");
    }

    const data: Record<KPIKey, number[]> = { ...initialData };
    const totals: Record<KPIKey, number> = { ...initialTotals };
    const labels = filtered.map((d) => d.time_group);

    // Log the first item to see available keys
    if (filtered.length > 0) {
      console.log("Sample data item:", filtered[0]);
      console.log("Available keys in first item:", Object.keys(filtered[0]));
    }

    for (const kpi of KPI_OPTIONS) {
      const keyToUse = kpi.keys.find((key) => filtered[0]?.[key] !== undefined);
      console.log(
        `Looking for key for ${kpi.id}:`,
        kpi.keys,
        "Found:",
        keyToUse
      );
      if (keyToUse) {
        const dataArray = filtered.map((item) =>
          safeParse(item[keyToUse], kpi.format)
        );
        data[kpi.id] = dataArray;

        // Calculate totals based on format type
        if (kpi.format === "percent") {
          // For percentages, use the latest value
          totals[kpi.id] = dataArray[dataArray.length - 1] ?? 0;
        } else {
          // For numbers and currency, sum all values
          totals[kpi.id] = dataArray.reduce((sum, val) => sum + val, 0);
        }

        console.log(
          `Processed ${kpi.id}:`,
          dataArray.length,
          "values, total:",
          totals[kpi.id]
        );
      } else {
        console.log(
          `No key found for ${kpi.id}, available keys:`,
          Object.keys(filtered[0] || {})
        );
      }
    }

    return { labels, data, totals };
  }, [dataset, granularity, startDate, endDate]);

  // --- Dynamic Y-axes for each metric ---
  const dynamicAxes = useMemo(() => {
    const axes: any = { x: { grid: { display: false } } };
    // Decide axis positions: first two left, next two right
    const leftIds = selectedMetrics.slice(0, 2);
    const rightIds = selectedMetrics.slice(2, 4);
    selectedMetrics.forEach((id, idx) => {
      const kpi = KPI_OPTIONS.find((k) => k.id === id);
      if (!kpi) return;
      const axisId = `y_${id}`;
      const arr = chartData.data[id] || [];
      const min = Math.min(...arr, 0);
      let max = Math.max(...arr, 1);
      if (kpi.format === "percent") {
        // Always start at 0, pad max
        max = Math.max(max, 10);
      }
      let position: "left" | "right" = "right";
      if (leftIds.includes(id)) position = "left";
      if (rightIds.includes(id)) position = "right";
      axes[axisId] = {
        type: "linear",
        display: true,
        position,
        grid: { drawOnChartArea: false },
        min,
        max,
        ticks: {
          color: kpi.color,
          callback(this: any, value: string | number) {
            if (kpi.format === "currency") {
              // Use currency context for formatting chart axis
              if (isCurrencyLoading) return "Loading...";
              if (currencyError) {
                return `$${(Number(value) / 1000).toFixed(1)}K`;
              }
              // For chart axes, show abbreviated currency values
              const numValue = Number(value);
              if (numValue >= 1000000) {
                return `${formatCurrency(numValue / 1000000).replace(/[₹$]/, '')}M`;
              } else if (numValue >= 1000) {
                return `${formatCurrency(numValue / 1000).replace(/[₹$]/, '')}K`;
              } else {
                return formatCurrency(numValue);
              }
            }
            if (kpi.format === "percent") return `${value}%`;
            if (id === "impressions")
              return `${(Number(value) / 1000).toFixed(0)}K`;
            if (id === "clicks") return `${Number(value).toLocaleString()}`;
            return Number(value).toLocaleString();
          },
        },
        offset: kpi.format === "percent",
        title: { display: true, text: kpi.title, color: kpi.color },
      };
    });
    return axes;
  }, [selectedMetrics, chartData, formatCurrency, isCurrencyLoading, currencyError]);

  // --- Datasets with individual yAxisID ---
  const chartConfigData: ChartData<"bar" | "line", number[], string> =
    useMemo(() => {
      if (!chartData.labels.length) return { labels: [], datasets: [] };

      console.log("Creating chart config data...");
      console.log("Selected metrics:", selectedMetrics);
      console.log("Chart data labels:", chartData.labels);

      const datasets: ChartDataset<"bar" | "line", number[]>[] = [];
      selectedMetrics.forEach((id) => {
        const kpi = KPI_OPTIONS.find((k) => k.id === id);
        if (!kpi) {
          console.log(`KPI not found for id: ${id}`);
          return;
        }

        const axisId = `y_${id}`;
        const dataArray = chartData.data[id];


        if (id === "impressions") {
          datasets.push({
            type: "bar",
            label: kpi.title,
            data: dataArray,
            backgroundColor: kpi.color + "99",
            yAxisID: axisId,
            order: 2,
          });
        } else {
          datasets.push({
            type: "line",
            label: kpi.title,
            data: dataArray,
            borderColor: kpi.color,
            backgroundColor: kpi.color,
            tension: 0.3,
            yAxisID: axisId,
            order: 1,
          });
        }
      });

      console.log("Final chart config:", {
        labels: chartData.labels,
        datasets,
      });
      return { labels: chartData.labels, datasets };
    }, [chartData, selectedMetrics]);

  // Compute which axes are needed and their min/max based on selected metrics
  const axisStats = useMemo(() => {
    const stats = {
      y1: { min: Infinity, max: -Infinity, show: false }, // Impressions (bar)
      y2: { min: Infinity, max: -Infinity, show: false }, // Currency
      y3: { min: Infinity, max: -Infinity, show: false }, // Number
      y4: { min: Infinity, max: -Infinity, show: false }, // Percent
    };
    selectedMetrics.forEach((id) => {
      const kpi = KPI_OPTIONS.find((k) => k.id === id);
      if (!kpi) return;
      const arr = chartData.data[id] || [];
      if (!arr.length) return;
      let axis: keyof typeof stats = "y3";
      if (id === "impressions") axis = "y1";
      else if (kpi.format === "currency") axis = "y2";
      else if (kpi.format === "percent") axis = "y4";
      else axis = "y3";
      stats[axis].show = true;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      if (min < stats[axis].min) stats[axis].min = min;
      if (max > stats[axis].max) stats[axis].max = max;
    });
    // If no data, set min/max to 0/1 to avoid Chart.js errors
    Object.keys(stats).forEach((axis) => {
      if (axis === "y4") {
        // Always set min to 0 for percent axis
        stats.y4.min = 0;
        if (stats.y4.max < 10) stats.y4.max = 10;
      }
      if (!stats[axis as keyof typeof stats].show) {
        stats[axis as keyof typeof stats].min = 0;
        stats[axis as keyof typeof stats].max = 1;
      }
    });
    return stats;
  }, [selectedMetrics, chartData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: { legend: { display: false } },
    scales: dynamicAxes,
  };

  console.log("Chart options:", chartOptions);
  console.log("Dynamic axes:", dynamicAxes);

  // Modified KPICard to accept dropdown for title and use currency context
  type KPICardProps = {
    id: KPIKey;
    value: number;
    dropdown: React.ReactNode;
  };

  const KPICard = ({ id, value, dropdown }: KPICardProps) => {
    const kpiInfo = KPI_OPTIONS.find((k) => k.id === id)!;
    
    const formatValue = () => {
      if (kpiInfo.format === "currency") {
        return formatCurrencyValue(value);
      } else if (kpiInfo.format === "number") {
        return formatNumberValue(value);
      } else if (kpiInfo.format === "percent") {
        return `${value.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}%`;
      }
      return value.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      });
    };

    return (
      <div
        className={`
          p-4 bg-white rounded-lg shadow-sm border border-slate-200
          flex flex-col justify-between
          transition-all duration-300 ease-in-out
        `}
      >
        <div className="flex flex-col">
          <div className="flex items-center mb-2">{dropdown}</div>
          <span className="text-2xl font-bold text-slate-800">
            {formatValue()}
          </span>
        </div>
        <div
          className="mt-4 h-1 w-full rounded-full"
          style={{ backgroundColor: kpiInfo.color }}
        ></div>
      </div>
    );
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-blue-600">
        Loading chart data...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-red-600">
        <p className="text-lg font-semibold mb-2">Failed to load chart data</p>
        <p className="text-sm text-gray-500">
          {error?.message || "Unknown error occurred"}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Check browser console for more details
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weeklyApiData) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-gray-500">
        <p>No API data received</p>
        <p className="text-sm text-gray-400">
          Please check your backend connection
        </p>
      </div>
    );
  }



  if (!dataset?.length) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center text-gray-500">
        <p>No data available</p>
        <p className="text-sm text-gray-400">
          No weekly data found in the response
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Response structure:{" "}
          {JSON.stringify(weeklyApiData, null, 2).substring(0, 200)}...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-300 flex flex-col w-full">
      <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">
          Ads Timeline Chart
        </h6>
        <p className="text-sm text-gray-500 mt-1">
          Performance trends over time
        </p>
      </div>
      <div className="font-sans bg-slate-100 p-6 rounded-xl shadow-lg w-full mx-auto ">
        {/* Top bar: granularity dropdown and metrics filter */}
        <div className="mb-4 flex justify-between items-center">
          {/* Metrics Filter Dropdown */}
          <div className="relative" ref={metricsDropdownRef}>
            <button
              className="border border-slate-300 rounded px-4 py-2 text-slate-700 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[120px] font-semibold"
              onClick={() => setMetricsDropdownOpen((open) => !open)}
              type="button"
            >
              Metrics
              <svg
                className={`w-4 h-4 ml-1 transition-transform ${
                  metricsDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {metricsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-[600px] bg-white border border-slate-300 rounded-xl shadow-2xl z-30 p-0 flex flex-col">
                {/* Title and divider */}
                <div className="px-5 pt-4 pb-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                  <span className="font-bold text-base text-slate-700">
                    Select Metrics
                  </span>
                </div>
                <div className="flex flex-row gap-6 px-5 py-4">
                  {KPI_GROUPS.map((group) => (
                    <div
                      key={group.label}
                      className="flex flex-col min-w-[120px]"
                    >
                      <span className="font-semibold text-xs text-slate-500 mb-2">
                        {group.label}
                      </span>
                      {group.ids.map((id) => {
                        const kpi = KPI_OPTIONS.find((k) => k.id === id);
                        if (!kpi) return null;
                        const checked = selectedMetrics.includes(id as KPIKey);
                        const disabled =
                          !checked && selectedMetrics.length >= 4;
                        return (
                          <label
                            key={id}
                            className={`flex items-center gap-2 mb-1 cursor-pointer text-[15px] px-1 py-1 rounded transition-all ${
                              checked
                                ? "bg-blue-50 font-semibold"
                                : disabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-slate-100"
                            }`}
                            style={{ userSelect: "none" }}
                            title={
                              disabled
                                ? "You can select up to 4 metrics only"
                                : ""
                            }
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (disabled) return;
                                setSelectedMetrics((metrics) =>
                                  metrics.includes(id as KPIKey)
                                    ? metrics.filter((m) => m !== id)
                                    : metrics.length < 4
                                    ? [...metrics, id as KPIKey]
                                    : metrics
                                );
                              }}
                              className="w-4 h-4 accent-blue-500"
                              disabled={disabled}
                            />
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: kpi.color }}
                              ></span>
                              <span style={{ color: kpi.color }}>
                                {kpi.title}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Granularity Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="border border-slate-300 rounded px-4 py-2 text-slate-700 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[120px]"
              onClick={() => setDropdownOpen((open) => !open)}
              type="button"
            >
              {DATASET_OPTIONS.find((opt) => opt.value === granularity)?.label}
              <svg
                className={`w-4 h-4 ml-1 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded shadow-lg z-10">
                {DATASET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-100 ${
                      granularity === opt.value
                        ? "bg-slate-100 font-semibold"
                        : ""
                    }`}
                    onClick={() => {
                      setGranularity(
                        opt.value as "weeklysails" | "monthlysails"
                      );
                      setDropdownOpen(false);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* KPI Cards Grid with independent dropdowns */}
        {selectedMetrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            {cardMetrics.map((kpi, idx) => {
              const opt = KPI_OPTIONS.find((o) => o.id === kpi)!;
              return (
                <KPICard
                  key={idx}
                  id={opt.id}
                  value={chartData.totals[opt.id]}
                  dropdown={
                    <div className="relative" ref={cardDropdownRefs[idx]}>
                      <button
                        className="text-sm text-slate-500 flex items-center gap-1 focus:outline-none"
                        onClick={() =>
                          setCardDropdownOpen((openArr) =>
                            openArr.map((open, i) =>
                              i === idx ? !open : false
                            )
                          )
                        }
                        type="button"
                      >
                        {opt.title} ▼
                      </button>
                      {cardDropdownOpen[idx] && (
                        <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded shadow-lg z-20">
                          {KPI_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              className={`w-full text-left px-4 py-2 hover:bg-slate-100 ${
                                kpi === option.id
                                  ? "bg-slate-100 font-semibold"
                                  : ""
                              }`}
                              onClick={() => {
                                // When a card dropdown is used, update cardKpis and also update selectedMetrics if not present
                                setCardKpis((arr) =>
                                  arr.map((val, i) =>
                                    i === idx ? option.id : val
                                  )
                                );
                                if (
                                  !selectedMetrics.includes(option.id as KPIKey)
                                ) {
                                  setSelectedMetrics((metrics) => {
                                    const newMetrics = [...metrics];
                                    newMetrics[idx] = option.id as KPIKey;
                                    return newMetrics;
                                  });
                                }
                                setCardDropdownOpen((openArr) =>
                                  openArr.map((open, i) =>
                                    i === idx ? false : open
                                  )
                                );
                              }}
                              type="button"
                            >
                              {option.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
        {/* Chart Container */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 h-[400px] w-full">
          {chartData.labels.length > 0 &&
          chartData.data &&
          Object.keys(chartData.data).some(
            (key) => (chartData.data as any)[key].length > 0
          ) ? (
            <>
              <Chart
                type="bar"
                data={chartConfigData}
                options={chartOptions}
                style={{ width: "100%" }}
              />
              {/* Debug info */}
              {/* <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <p>Chart rendered with {chartConfigData.datasets.length} datasets</p>
              <p>Labels: {chartConfigData.labels?.join(', ') || 'No labels'}</p>
              <p>Selected metrics: {selectedMetrics.join(', ')}</p>
            </div> */}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <p>Chart data processing issue</p>
              <p className="text-sm text-gray-400 mt-2">Available data:</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded max-h-32 overflow-auto">
                {JSON.stringify(
                  {
                    labels: chartData.labels,
                    dataKeys: Object.keys(chartData.data),
                    selectedMetrics,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdsTimeLineChart;