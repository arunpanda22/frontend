"use client";
import React, { useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList
} from "recharts";
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard';

const dotColors = [
  "#FACC15", "#2563EB", "#F43F5E", "#22C55E", "#FB923C", "#A78BFA",
];

interface DotScatterChartProps {
  startDate: string;
  endDate: string;
}

export default function DotScatterChart({ 
  startDate, 
  endDate,
}: DotScatterChartProps ) {
  const [focusLevel, setFocusLevel] = useState<string>("High Focus");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const period = useMemo(() => {
    if (!startDate || !endDate) return '30d';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Map days to period format
    if (diffDays <= 7) return '7d';
    if (diffDays <= 14) return '14d';
    if (diffDays <= 30) return '30d';
    if (diffDays <= 60) return '60d';
    if (diffDays <= 90) return '90d';
    return 'custom';
  }, [startDate, endDate]);
    
  // Fetch ASIN performance data (automatically handles SC-only vs SC+VC)
  const { asinSummary, hasVendorAccount, isLoading, isError, error } = useAsinPerformanceData({
    start_date: startDate,
    end_date: endDate,
    period: period,
    focus_level: 'all' as const
  });

  // Transform ASIN summary data - handle both response types
  const asinData = React.useMemo(() => {
    let rawData = null;

    if (asinSummary?.data?.asin_summary) {
      rawData = asinSummary.data.asin_summary;
    } else if (asinSummary?.data && Array.isArray(asinSummary.data)) {
      rawData = asinSummary.data;
    }

    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    return rawData.map((item: any) => {
      const actualItem = item.json || item;
      
      if (hasVendorAccount) {
        // Combined SC + VC data
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Sales": actualItem.total_revenue || 0,
          "TACOS": actualItem.tacos_percent || 0,
          "Focus Level": actualItem.focus_category || "High Focus",
        };
      } else {
        // Seller-only data
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Sales": actualItem.total_sales || 0,
          "TACOS": actualItem.tacos_percent || 0,
          "Focus Level": actualItem.focus_category || "High Focus",
        };
      }
    });
  }, [asinSummary, hasVendorAccount]);

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

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-300 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-semibold text-gray-900">
            Total Sales vs TACOS {hasVendorAccount && <span className="text-xs font-normal text-purple-600">(SC + VC)</span>}
          </h6>
          <div className="text-xs text-gray-500">
            {startDate} to {endDate}
          </div>
        </div>
      </div>
      
      {/* Filter Header */}
      <div className="flex items-center justify-between gap-3 px-6 py-2 border-b border-gray-200 dark:border-gray-700">
        <h6 className="text-base text-gray-900 dark:text-white font-montserrat font-semibold">ASIN Scatter</h6>
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
                          <span className="font-semibold">Product:</span> {d.Product}
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