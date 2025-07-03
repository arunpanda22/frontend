"use client"
import React, { useState } from "react";
import AsinTablePage from "./PerformanceTable";
import { FaBoxOpen, FaCubes, FaRupeeSign, FaPercent, FaLeaf } from "react-icons/fa";
import asinData from "../../../../public/asinperformance.json";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterProps } from "recharts";
import OrganicSalesBarChart from "./OrganicSalesBarChart";
import DotScatterChart from "./DotScatterChart";
import AsinPerformanceTable from "./PerformanceTable";
import AsinSalesTable from "./SalesTable";

interface AsinData {
  asin: string;
  product_name: string;
  "Total Quantity": number;
  "Total Sales": number;
  "Sales ASP": number;
  BuyBox: number;
  "Organic Sales": number;
  Conversion: number;
  ACOS: number | null;
  TACOS: number | null;
  "Replacement Rate": number | null;
  "Return Rate": number | null;
}

function getSummaryStats(data: AsinData[]) {
  const totalAsins = data.length;
  const totalQuantity = data.reduce((sum, item) => sum + (item["Total Quantity"] || 0), 0);
  const totalSales = data.reduce((sum, item) => sum + (item["Total Sales"] || 0), 0);
  const avgBuyBox = data.length ? (data.reduce((sum, item) => sum + (item["BuyBox"] || 0), 0) / data.length) : 0;
  const totalOrganicSales = data.reduce((sum, item) => sum + (item["Organic Sales"] || 0), 0);
  return {
    totalAsins,
    totalQuantity,
    totalSales,
    avgBuyBox,
    totalOrganicSales,
  };
}

// Get top 10 ASINs by Total Sales
const topAsins = [...(asinData as AsinData[])]
  .filter(item => typeof item["Total Sales"] === "number" && typeof item.TACOS === "number")
  .sort((a, b) => (b["Total Sales"] || 0) - (a["Total Sales"] || 0))
  .slice(0, 10);

// Brighter, modern color palette
const dotColors = [
  "#FACC15", // Yellow
  "#2563EB", // Blue
  "#F43F5E", // Pink
  "#22C55E", // Green
  "#FB923C", // Orange
  "#A78BFA", // Purple
];
const topScatterData = topAsins.map((item, idx) => ({
  asin: item.asin,
  x: item["Total Sales"],
  y: item.TACOS,
  name: item.product_name,
  color: dotColors[idx % dotColors.length],
}));

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

// Custom tooltip for recharts
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

// Color palette for card glows
const cardGlowColors = [
  '#2563EB', // blue
  '#22C55E', // green
  '#FACC15', // yellow
  '#F43F5E', // pink
  '#22C55E', // green (repeat or pick another)
];

export default function ASINPerformance() {
  const stats = getSummaryStats(asinData as AsinData[]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return (
    <div className="min-h-screen w-full p-6 flex flex-col gap-6" style={{
      background: "linear-gradient(135deg, #e0e7ef 0%, #f6fafd 100%)"
    }}>
      {/* --- Page Heading --- */}
      <h1 className="text-4xl font-extrabold text-[#1a2b3c] mb-2 text-center tracking-tight">ASIN Performance</h1>
      {/* --- Stat Cards Section --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {/* Total ASINs */}
        <div
          className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] transition-transform transition-shadow duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)]"
        >
          <FaBoxOpen className="text-blue-500 text-3xl mb-2" />
          <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.totalAsins.toLocaleString()}</div>
          <div className="text-[#64748b] font-medium mt-1">Total ASIN's</div>
        </div>
        {/* Total Quantity */}
        <div
          className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] transition-transform transition-shadow duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)]"
        >
          <FaCubes className="text-blue-500 text-3xl mb-2" />
          <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.totalQuantity.toLocaleString()}</div>
          <div className="text-[#64748b] font-medium mt-1">Total Quantity</div>
        </div>
        {/* Total Sales */}
        <div
          className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] transition-transform transition-shadow duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)]"
        >
          <FaRupeeSign className="text-blue-500 text-3xl mb-2" />
          <div className="text-3xl font-extrabold text-[#1a2b3c]">₹{stats.totalSales.toLocaleString()}</div>
          <div className="text-[#64748b] font-medium mt-1">Total Sales</div>
        </div>
        {/* Avg. BuyBox */}
        <div
          className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] transition-transform transition-shadow duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)]"
        >
          <FaPercent className="text-blue-500 text-3xl mb-2" />
          <div className="text-3xl font-extrabold text-[#1a2b3c]">{stats.avgBuyBox.toFixed(2)}%</div>
          <div className="text-[#64748b] font-medium mt-1">Avg. BuyBox</div>
        </div>
        {/* Total Organic Sales */}
        <div
          className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] transition-transform transition-shadow duration-200 hover:scale-[1.03] hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)]"
        >
          <FaLeaf className="text-green-500 text-3xl mb-2" />
          <div className="text-3xl font-extrabold text-[#1a2b3c]">₹{stats.totalOrganicSales.toLocaleString()}</div>
          <div className="text-[#64748b] font-medium mt-1">Total Organic Sales</div>
        </div>
      </div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Dot Scatter Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-8 flex flex-col justify-center items-center min-h-[520px]">
          <div className="text-2xl font-bold text-[#1a2b3c] mb-2 text-center">Total Sales vs TACOS</div>
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg w-full h-full p-2 transition-transform transition-shadow duration-200 hover:scale-[1.015] hover:shadow-xl">
            <DotScatterChart />
          </div>
          {/* Color legend */}
          <div className="flex gap-4 mt-4">
            {dotColors.map((color, idx) => (
              <div key={color} className="flex items-center gap-2">
                <span style={{ background: color, borderRadius: '50%', width: 18, height: 18, display: 'inline-block', border: '2px solid #e5e7eb' }}></span>
                <span className="text-[#64748b] text-sm font-medium">Color {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Organic Sales Bar Chart */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-8 w-full h-full flex  justify-center min-h-[520px]">
          <OrganicSalesBarChart height={440} />
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[220px]  flex flex-col gap-8">
        {/* Performance Table Card */}
        
          <h2 className="text-2xl font-bold text-blue-700 pt-3 flex items-center  justify-center">
            ASIN Performance Table
          </h2>
          
          <AsinPerformanceTable />
       
        {/* Sales Table Card */}
       
          <h2 className="text-2xl font-bold text-blue-700 pt-3 flex items-center  justify-center">
             ASIN Sales Table
          </h2>
         
          <AsinSalesTable />
        </div>
      </div>
   
  );
}
