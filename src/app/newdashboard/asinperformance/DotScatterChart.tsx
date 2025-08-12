"use client";
import React, { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterProps } from "recharts";
import { useAsinPerformanceData } from '@/lib/hooks/queries/use-dashboard';

const dotColors = [
  "#FACC15", // Yellow
  "#2563EB", // Blue
  "#F43F5E", // Pink
  "#22C55E", // Green
  "#FB923C", // Orange
  "#A78BFA", // Purple
];

export default function DotScatterChart() {
  const [focusLevel, setFocusLevel] = useState<string>("High Focus");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch ASIN performance data from API - use stable date values
  const dateParams = React.useMemo(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    period: '30d',
    focus_level: 'all' as const
  }), []);

  const { asinSummary, targetingAnalysis, isLoading, isError, error } = useAsinPerformanceData(dateParams);

  // Transform API data for the chart - use targeting analysis since ASIN summary has zero sales
  const asinData = React.useMemo(() => {
    // Use ASIN summary if it has real data, otherwise fall back to targeting analysis
    if (asinSummary?.data?.data) {
      const extractedData = asinSummary.data.data.map((item: any) => {
        const actualItem = item.json || item;
        return {
          asin: actualItem.asin,
          product_name: actualItem.product_name,
          "Total Sales": actualItem.total_sales,
          "TACOS": actualItem.tacos_percent,
          "Focus Level": actualItem.focus_category || "High Focus",
        };
      });
      
      if (extractedData.some((item: any) => item["Total Sales"] > 0)) {
        return extractedData;
      }
    }
    
    // Fallback to targeting analysis data
    if (!targetingAnalysis?.data) return [];
    
    const transformedData: any[] = [];
    Object.entries(targetingAnalysis.data).forEach(([groupName, groupData]: [string, any]) => {
      if (groupData.items && Array.isArray(groupData.items)) {
        groupData.items.forEach((item: any) => {
          transformedData.push({
            asin: `${groupName}-${item.targeting_type}`,
            product_name: `${groupName} - ${item.targeting_type}`,
            "Total Sales": item.sales || 0,
            "TACOS": item.acos_percent || 0, // Use ACOS as proxy for TACOS
            "Focus Level": "High Focus",
          });
        });
      }
    });
    
    return transformedData;
  }, [asinSummary, targetingAnalysis]);

  const filteredData = asinData.filter(item => item["Focus Level"] === focusLevel);

  const topAsins = [...filteredData]
    .filter(item => typeof item["Total Sales"] === "number" && typeof item.TACOS === "number")
    .sort((a, b) => (b["Total Sales"] || 0) - (a["Total Sales"] || 0))
    .slice(0, 10);

  const topScatterData = topAsins.map((item, idx) => ({
    asin: item.asin,
    x: item["Total Sales"],
    y: item.TACOS,
    name: item.product_name,
    color: dotColors[idx % dotColors.length],
  }));

  // Handle loading state
  if (isLoading) {
    return (
      <div style={{ width: "100%", height: 540, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading ASIN scatter chart data...</div>
      </div>
    );
  }

  // Handle error state
  if (isError || !asinData || asinData.length === 0) {
    return (
      <div style={{ width: "100%", height: 540, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'red' }}>
          Failed to load ASIN scatter chart data
          <br />
          <small>{error?.message || 'No data available'}</small>
        </div>
      </div>
    );
  }

  interface CustomDotProps extends Partial<ScatterProps> {
    cx?: number;
    cy?: number;
    payload?: any;
    index: number;
    hoveredIndex: number | null;
    setHoveredIndex: (idx: number | null) => void;
  }

  function CustomDot(props: CustomDotProps) {
    const { cx = 0, cy = 0, payload = {}, index, hoveredIndex, setHoveredIndex } = props;
    const isHovered = hoveredIndex === index;
    return (
      <g
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 11 : 7}
          fill={payload.color}
          stroke={isHovered ? '#fff' : payload.color}
          strokeWidth={isHovered ? 4 : 2}
          filter={isHovered ? 'drop-shadow(0px 0px 8px ' + payload.color + '55)' : 'none'}
          style={{ transition: 'all 0.18s cubic-bezier(.4,2,.6,1)' }}
        />
      </g>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0].payload) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: '#18181b',
          color: '#fff',
          borderRadius: 10,
          padding: '12px 20px',
          boxShadow: '0 4px 24px #0002',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: '2px solid #27272a',
        }}>
          <span style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: d.color,
            display: 'inline-block',
            marginRight: 8,
            border: '2px solid #fff',
          }} />
          <span style={{ fontWeight: 600 }}>ASIN:</span> <span style={{ marginRight: 12 }}>{d.asin}</span>
          <span>Sales: ₹{d.x.toLocaleString()}</span>
          <span>TACOS: {d.y}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 540 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8, fontWeight: 500 }}>Focus Level:</label>
        <select
          value={focusLevel}
          onChange={e => setFocusLevel(e.target.value)}
          style={{ padding: 6, borderRadius: 6, fontSize: 16 }}
        >
          <option value="High Focus">High Focus</option>
          <option value="Medium Focus">Medium Focus</option>
          <option value="Low Focus">Low Focus</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 24, right: 24, left: 24, bottom: 24 }} style={{ background: 'transparent' }}>
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
            domain={[0, 1.6]}
            label={{ value: 'TACOS', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 16 }}
          />
          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            data={topScatterData}
            shape={(props: any) => <CustomDot {...props} index={props.index} hoveredIndex={hoveredIndex} setHoveredIndex={setHoveredIndex} />}
            label={({ x, y, index }) => {
              const asin = topScatterData[index]?.asin;
              return (
                <text
                  x={x + 12}
                  y={y + 4}
                  fontSize={12}
                  fill="#222"
                  
                >
                  {asin}
                </text>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
} 