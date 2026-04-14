// src/app/dashboard/market-funnel-insights/sqp-v2/components/SQPOverallTrends.tsx
"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SQPMonthlyTrendPoint } from "../types/sqp_v2.types";

interface TrendChartProps {
  data: SQPMonthlyTrendPoint[];
  title: string;
  ourKey: "our_ctr" | "our_cvr";
  marketKey: "market_ctr" | "market_cvr";
  ourLabel: string;
  marketLabel: string;
}

function TrendChart({ data, title, ourKey, marketKey, ourLabel, marketLabel }: TrendChartProps) {
  return (
    <div className="bg-white rounded-xl border  border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              }}
              formatter={(value: number | undefined) => [value != null ? `${value.toFixed(2)}%` : "—", ""]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            <Line
              type="monotone"
              dataKey={ourKey}
              name={ourLabel}
              stroke="#1e40af"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#1e40af" }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey={marketKey}
              name={marketLabel}
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 2.5, fill: "#9ca3af" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface SQPOverallTrendsProps {
  data: SQPMonthlyTrendPoint[];
}

export default function SQPOverallTrends({ data }: SQPOverallTrendsProps) {
  return (
    <div className="grid grid-cols-1 h-full lg:grid-cols-2 gap-4">
      <TrendChart
        data={data}
        title="Overall CTR Trend — Ours vs Market"
        ourKey="our_ctr"
        marketKey="market_ctr"
        ourLabel="Our CTR"
        marketLabel="Market CTR"
      />
      <TrendChart
        data={data}
        title="Overall CVR Trend — Ours vs Market"
        ourKey="our_cvr"
        marketKey="market_cvr"
        ourLabel="Our CVR"
        marketLabel="Market CVR"
      />
    </div>
  );
}

// Also export TrendChart for reuse inside ASINCard
export { TrendChart };