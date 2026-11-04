"use client";

/**
 * Small reusable line chart for the Flipkart Keywords page (monthly x axis).
 *
 * Place at: src/app/flipkart/dashboard/keywords/components/FlipkartKeywordLineChart.tsx
 *
 * Used for the account-wide trend (one series) and for "campaign vs baseline" charts (two series: the campaign's
 * line and a dashed grey baseline line), the Flipkart version of Amazon's TrendChart "Ours vs Market".
 *
 * `data` is the timeline from the API (one point per month, key `label` is the x value). `series` says which keys to
 * draw; `formatValue` formats the y axis ticks and the tooltip. A zero-filled month is drawn as 0, not skipped, so a
 * month without data is visible as a dip.
 */
import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LineSeries {
  /** Key of the value in each data point, e.g. "CTR" or "baseline_CTR". */
  key: string;
  /** Legend / tooltip name. */
  name: string;
  color: string;
  /** Dashed line, used for the baseline. */
  dashed?: boolean;
}

interface FlipkartKeywordLineChartProps {
  data: Array<Record<string, string | number>>;
  series: LineSeries[];
  formatValue: (value: number) => string;
  height?: number;
}

export default function FlipkartKeywordLineChart({
  data,
  series,
  formatValue,
  height = 200,
}: FlipkartKeywordLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>
        No data for the selected months
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(value: number) => formatValue(value)}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
            formatter={(value: unknown, name: unknown) => [formatValue(Number(value)), String(name)]}
          />
          {series.length > 1 && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          )}
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color}
              strokeWidth={2}
              strokeDasharray={item.dashed ? "5 5" : undefined}
              dot={{ r: 2.5, fill: item.color }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}