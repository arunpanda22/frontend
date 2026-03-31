"use client";
import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAsinPerformanceData } from "@/lib/hooks/queries/use-dashboard";

const dotColors = [
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#EA580C",
  "#9333EA",
  "#0891B2",
  "#FACC15",
  "#F43F5E",
  "#22C55E",
  "#FB923C",
];

interface DotScatterChartProps {
  startDate: string;
  endDate: string;
}

export default function DotScatterChart({
  startDate,
  endDate,
}: DotScatterChartProps) {
  const [focusLevel, setFocusLevel] = useState<string>("High Focus");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const period = useMemo(() => {
    if (!startDate || !endDate) return "30d";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 7) return "7d";
    if (diffDays <= 14) return "14d";
    if (diffDays <= 30) return "30d";
    if (diffDays <= 60) return "60d";
    if (diffDays <= 90) return "90d";
    return "custom";
  }, [startDate, endDate]);

  const { asinSummary, hasVendorAccount, isLoading, isError, error } =
    useAsinPerformanceData({
      start_date: startDate,
      end_date: endDate,
      period: period,
      focus_level: "all" as const,
    });

  const asinData = React.useMemo(() => {
    let rawData = null;
    if (asinSummary?.data?.asin_summary) {
      rawData = asinSummary.data.asin_summary;
    } else if (asinSummary?.data && Array.isArray(asinSummary.data)) {
      rawData = asinSummary.data;
    }
    if (!rawData || !Array.isArray(rawData)) return [];

    return rawData.map((item: any) => {
      const actualItem = item.json || item;
      if (hasVendorAccount) {
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Sales": actualItem.total_revenue || 0,
          TACOS: actualItem.tacos_percent || 0,
          "Focus Level": actualItem.focus_category || "High Focus",
        };
      } else {
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Sales": actualItem.total_sales || 0,
          TACOS: actualItem.tacos_percent || 0,
          "Focus Level": actualItem.focus_category || "High Focus",
        };
      }
    });
  }, [asinSummary, hasVendorAccount]);

  const filteredData = asinData.filter(
    (item) => item["Focus Level"] === focusLevel
  );
  const topAsins = [...filteredData]
    .filter(
      (item) =>
        typeof item["Total Sales"] === "number" &&
        typeof item.TACOS === "number"
    )
    .sort((a, b) => (b["Total Sales"] || 0) - (a["Total Sales"] || 0))
    .slice(0, 10);

  const topScatterData = topAsins.map((item, idx) => ({
    product: item.product_name,
    asin: item.asin,
    x: item["Total Sales"],
    y: item.TACOS,
    color: dotColors[idx % dotColors.length],
  }));

  // --- Custom Dot with glow + hover animation ---
  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props as {
      cx: number;
      cy: number;
      payload: any;
      index: number;
    };
    const isHovered = hoveredIndex === index;

    return (
      <g
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ cursor: "pointer" }}
      >
        {/* Outer glow ring */}
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 14 : 10}
          fill={payload.color}
          opacity={isHovered ? 0.2 : 0}
          style={{ transition: "all 0.3s ease-out" }}
        />
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 8 : 6}
          fill={payload.color}
          stroke="white"
          strokeWidth={2.5}
          style={{
            transition: "all 0.2s ease-out",
            filter: isHovered
              ? `drop-shadow(0px 0px 10px ${payload.color}88) drop-shadow(0px 2px 4px rgba(0,0,0,0.1))`
              : `drop-shadow(0px 2px 4px rgba(0,0,0,0.08))`,
          }}
        />
      </g>
    );
  };

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length && payload[0]?.payload) {
      const d = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div
              className="mt-1 h-3 w-3 flex-shrink-0 rounded-full shadow-sm"
              style={{
                backgroundColor: d.color,
                boxShadow: `0 0 8px ${d.color}60`,
              }}
            />
            <div className="space-y-2">
              <p className="line-clamp-2 text-sm font-bold text-slate-900">
                {d.product}
              </p>
              <p className="text-xs text-slate-500 font-mono">{d.asin}</p>
              <p className="text-sm text-slate-600">
                Sales:{" "}
                <span className="font-semibold text-blue-600">
                  ₹{d.x.toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                TACOS:{" "}
                <span className="font-semibold text-emerald-600">
                  {d.y.toFixed(2)}%
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-lg border border-slate-200">
      {/* Decorative gradient orbs */}
      <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-100/40 to-purple-100/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-100/30 to-blue-100/20 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Total Sales vs TACOS
              {hasVendorAccount && (
                <span className="ml-2 text-sm font-normal text-purple-600">
                  (SC + VC)
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {startDate} — {endDate}
            </p>
          </div>

          {/* Focus Level Filter */}
          <select
            value={focusLevel}
            onChange={(e) => setFocusLevel(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="High Focus">High Focus</option>
            <option value="Medium Focus">Medium Focus</option>
            <option value="Low Focus">Low Focus</option>
          </select>
        </div>

        {/* Color Legend */}
        {!isLoading && !isError && topScatterData.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-3">
            {topScatterData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: d.color,
                    boxShadow: `0 0 6px ${d.color}50`,
                  }}
                />
                <span className="text-xs text-slate-600 font-mono">
                  {d.asin}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Chart Area */}
        <div className="h-[460px] rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm text-slate-500">
                Loading scatter data…
              </span>
            </div>
          ) : isError || asinData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-red-500">
                Failed to load scatter data
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {error?.message || "No ASIN summary data available"}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="0"
                  style={{ opacity: 0.6 }}
                />
                <XAxis
                  dataKey="x"
                  name="Total Sales"
                  type="number"
                  domain={[0, "auto"]}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}K`}
                  label={{
                    value: "Total Sales (₹)",
                    position: "bottom",
                    offset: 15,
                    fill: "#334155",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  dataKey="y"
                  name="TACOS"
                  type="number"
                  domain={[0, "auto"]}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: "TACOS (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: "#334155",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Scatter
                  data={topScatterData}
                  shape={(props: any) => (
                    <CustomDot {...props} index={props.index} />
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats Footer */}
        {/* {!isLoading && !isError && topScatterData.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-4">
              <p className="text-xs font-semibold text-slate-600">
                ASINs Shown
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {topScatterData.length}
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4">
              <p className="text-xs font-semibold text-slate-600">
                Avg Sales
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                ₹
                {(
                  topScatterData.reduce((a, c) => a + c.x, 0) /
                  topScatterData.length
                ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 p-4">
              <p className="text-xs font-semibold text-slate-600">Avg TACOS</p>
              <p className="mt-2 text-2xl font-bold text-orange-700">
                {(
                  topScatterData.reduce((a, c) => a + c.y, 0) /
                  topScatterData.length
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}