"use client";
import React, { useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ScatterProps,
  LabelList
} from "recharts";
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard';

const dotColors = [
  "#FACC15", "#2563EB", "#F43F5E", "#22C55E", "#FB923C", "#A78BFA",
];

export default function DotScatterChart() {
  const [focusLevel, setFocusLevel] = useState<string>("High Focus");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch ASIN performance data
  const dateParams = React.useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);
  const { asinSummary, isLoading, isError, error } = useAsinPerformanceData(dateParams);

  // Transform ASIN summary data
  const asinData = React.useMemo(() => {
    if (!asinSummary?.data?.asin_summary) return [];
    return asinSummary.data.asin_summary.map((item: any) => {
      const actualItem = item.json || item;
      return {
        asin: actualItem.asin,
        product_name: actualItem.product_name,
        "Total Sales": actualItem.total_sales,
        "TACOS": actualItem.tacos_percent,
        "Focus Level": actualItem.focus_category || "High Focus",
      };
    });
  }, [asinSummary]);

  const filteredData = asinData.filter(item => item["Focus Level"] === focusLevel);
  const topAsins = [...filteredData]
    .filter(item => typeof item["Total Sales"] === "number" && typeof item.TACOS === "number")
    .sort((a, b) => (b["Total Sales"] || 0) - (a["Total Sales"] || 0))
    .slice(0, 10);

  const topScatterData = topAsins.map((item, idx) => ({
    Product: item.product_name,
    asin: item.asin,
    x: item["Total Sales"],
    y: item.TACOS,
    name: item.product_name,
    color: dotColors[idx % dotColors.length],
  }));

  // Card wrapper styling (like AdsSplitBubbleChart)
  return (
    <div className="order-7 col-span-12 xl:col-span-6 2xl:col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
        <h6 className="text-lg font-semibold text-gray-900 dark:text-white">ASIN Scatter</h6>
        <select
          value={focusLevel}
          onChange={e => setFocusLevel(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="High Focus">High Focus</option>
          <option value="Medium Focus">Medium Focus</option>
          <option value="Low Focus">Low Focus</option>
        </select>
      </div>

      {/* Body */}
      <div className="p-6 h-[540px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-500">Loading ASIN scatter chart data...</span>
            </div>
          </div>
        ) : isError || !asinData || asinData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-red-500 text-center">
            <div>
              <p className="text-sm font-medium">Failed to load ASIN scatter chart data</p>
              <p className="text-xs text-gray-400">{error?.message || 'No ASIN summary data available'}</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
              <XAxis
                dataKey="x"
                name="Total Sales"
                tick={{ fill: '#64748b', fontSize: 14 }}
                tickFormatter={v => v.toLocaleString()}
                type="number"
                domain={[0, 'auto']}
                label={{ value: 'Total Sales', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 16 }}
              />
              <YAxis
                dataKey="y"
                name="TACOS"
                tick={{ fill: '#64748b', fontSize: 14 }}
                type="number"
                domain={[0, 'auto']}
                label={{ value: 'TACOS (%)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 16 }}
              />
              <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload?.length && payload[0].payload) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm shadow-lg border border-zinc-700">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm border border-white" style={{ background: d.color }}></span>
                          <span className="font-semibold">Product :</span> {d.Product}
                        </div>
                        <div>Sales: ₹{d.x.toLocaleString()}</div>
                        <div>TACOS: {d.y}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter
                data={topScatterData}
                shape={(props: any) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={hoveredIndex === props.index ? 11 : 7}
                    fill={props.payload.color}
                    stroke={hoveredIndex === props.index ? '#fff' : props.payload.color}
                    strokeWidth={hoveredIndex === props.index ? 4 : 2}
                    onMouseEnter={() => setHoveredIndex(props.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                )}
              >
                <LabelList
                  dataKey="asin"
                  position="right"
                  style={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
