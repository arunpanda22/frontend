"use client"
import React, { useState } from "react";
import AsinTablePage from "./PerformanceTable";
import { FaBoxOpen, FaCubes, FaRupeeSign, FaPercent, FaLeaf, FaUserFriends, FaFeather, FaShoppingCart, FaHeart, FaDollarSign, FaCoins, FaRedo, FaChartLine, FaEllipsisH, FaEye } from "react-icons/fa";
import asinData from "../../../../public/asinperformance.json";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterProps } from "recharts";
import OrganicSalesBarChart from "./OrganicSalesBarChart";
import DotScatterChart from "./DotScatterChart";
import AsinPerformanceTable from "./PerformanceTable";
import AsinSalesTable from "./SalesTable";
import StatCards from "./StatCards";

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

function TrendBadge({ value, positive }: { value: string, positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
      {positive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      )}
      {value}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  trendPositive,
  valueSuffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  valueSuffix?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between w-full relative shadow-sm"
      style={{
        backgroundImage: "radial-gradient(circle at 80% 20%, #f3f4f6 1%, transparent 60%)"
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm sm:text-base">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <FaEllipsisH className="text-gray-300 text-lg flex-shrink-0" />
      </div>
      <div className="flex flex-col items-start gap-2 mt-2">
        <span className="text-xl sm:text-2xl font-bold text-gray-900">{value}{valueSuffix}</span>
        {trend && typeof trendPositive === "boolean" && (
          <TrendBadge value={trend} positive={trendPositive} />
        )}
      </div>
    </div>
  );
}

export default function ASINPerformance() {
  const stats = getSummaryStats(asinData as AsinData[]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#f5f6fa] w-full px-1 py-4 sm:py-8">
      <div className="w-full flex flex-col gap-4 sm:gap-6 md:gap-8">

          {/* --- Page Heading --- */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1a2b3c] mb-2 text-center tracking-tight px-2">ASIN Performance</h1>
        
        {/* Stat Cards Grid - Responsive */}
        <StatCards
          stats={[
            {
              label: "TOTAL ASINS",
              percentChange: 0.0, // Example, replace with real change if available
              isPositive: true,
              icon: <FaBoxOpen />,
              value: stats.totalAsins,
              color: "green",
            },
            {
              label: "TOTAL QUANTITY",
              percentChange: 0.0, // Example, replace with real change if available
              isPositive: true,
              icon: <FaCubes />,
              value: stats.totalQuantity,
              color: "blue",
            },
            {
              label: "TOTAL SALES",
              percentChange: 0.0, // Example, replace with real change if available
              isPositive: true,
              icon: <FaRupeeSign />,
              value: stats.totalSales,
              color: "orange",
            },
            {
              label: "AVG. BUYBOX",
              percentChange: 0.0, // Example, replace with real change if available
              isPositive: true,
              icon: <FaPercent />,
              value: stats.avgBuyBox.toFixed(2) + "%",
              color: "purple",
            },
          ]}
        />
      
        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start w-full">
          {/* Dot Scatter Chart */}
          <div className="xl:col-span-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-4 sm:p-6 md:p-8 flex flex-col justify-center items-center min-h-[400px] sm:min-h-[520px] w-full">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#1a2b3c] mb-2 text-center">Total Sales vs TACOS</div>
            <div className="rounded-2xl  w-full h-full p-2 transition-transform transition-shadow duration-200 ">
              <DotScatterChart />
            </div>
            {/* Color legend */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 justify-center">
              {dotColors.map((color, idx) => (
                <div key={color} className="flex items-center gap-1 sm:gap-2">
                  <span style={{ background: color, borderRadius: '50%', width: 16, height: 16, display: 'inline-block', border: '2px solid #e5e7eb' }}></span>
                  <span className="text-[#64748b] text-xs sm:text-sm font-medium">Color {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Organic Sales Bar Chart */}
          <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-4 sm:p-6 md:p-8 w-full h-full flex justify-center min-h-[400px] sm:min-h-[520px]">
            <OrganicSalesBarChart height={440} />
          </div>
        </div>

        {/* --- Table Section --- */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-lg min-h-[220px] flex flex-col gap-6 sm:gap-8 w-full overflow-hidden">
          {/* Performance Table Card */}
          <div className="w-full overflow-x-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 pt-3 flex items-center justify-center px-2">
              ASIN Performance Table
            </h2>
            <div className="w-full overflow-x-auto">
              <AsinPerformanceTable />
            </div>
          </div>
         
          {/* Sales Table Card */}
          <div className="w-full overflow-x-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 pt-3 flex items-center justify-center px-2">
               ASIN Sales Table
            </h2>
            <div className="w-full overflow-x-auto">
              <AsinSalesTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
