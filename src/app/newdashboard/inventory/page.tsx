"use client"
import React, { useEffect, useState } from "react";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import InventoryHealth from "./inventoryHealth";
import ASinLiqudation from "./asinliqudation";
import ASinExcess from "./asinexcess";

import InventoryStats from "./inventoryStats";

import { Bar as ChartBar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend
);

function TopAsinInventoryBarChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/dataset/%20inventory_health_30d_avg.json');
        const raw = await res.json();
        const processed = raw.map((item: any) => ({
          asin: item.asin,
          totalInventory: (item.reserved_quantity || 0) + (item.fulfillable_quantity || 0),
          inventoryCover: item['Sales/Day'] && item['Sales/Day'] > 0
            ? ((item.reserved_quantity || 0) + (item.fulfillable_quantity || 0)) / item['Sales/Day']
            : 0,
        }));
        const top10 = processed
          .sort((a: any, b: any) => b.totalInventory - a.totalInventory)
          .slice(0, 10);
        setData(top10);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="w-full h-64 flex items-center justify-center text-blue-700 text-lg">Loading chart...</div>;
  }

  if (!data.length) {
    return <div className="w-full h-64 flex items-center justify-center text-red-600 text-lg">No data available</div>;
  }

  const labels = data.slice(0, 10).map(item => item.asin);
  const dataValues = data.slice(0, 10).map(item => item.totalInventory);
  const inventoryCoverValues = data.slice(0, 10).map(item => item.inventoryCover);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: "Total Inventory",
        data: dataValues,
        backgroundColor: "#2563EB",
        borderRadius: { topLeft: 14, topRight: 14, bottomLeft: 0, bottomRight: 0 },
        barThickness: 36,
        borderSkipped: false,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Inventory Cover',
        data: inventoryCoverValues,
        borderColor: '#F43F5E',
        backgroundColor: 'rgba(244,63,94,0.15)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#F43F5E',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: "Top 10 ASINs by Total Inventory",
        color: "#1a2b3c",
        font: { size: 22, weight: 700 },
        padding: { top: 16, bottom: 24 },
      },
      tooltip: {
        backgroundColor: "#18181b",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#2563EB",
        borderWidth: 2,
        padding: 16,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.label === 'Inventory Cover') {
              return `Inventory Cover: ${ctx.parsed.y}`;
            }
            return `Inventory: ${ctx.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 16, weight: 700 } },
      },
      y: {
        grid: { color: "#e5e7eb" },
        ticks: { color: "#64748b", font: { size: 16, weight: 700 } },
        beginAtZero: true,
        title: { display: true, text: 'Total Inventory', color: '#2563EB', font: { size: 16, weight: 700 } },
      },
      y1: {
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#F43F5E', font: { size: 16, weight: 700 } },
        title: { display: true, text: 'Inventory Cover', color: '#F43F5E', font: { size: 16, weight: 700 } },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ChartBar data={chartData as any} options={chartOptions} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function CampaignPerformanceLayout() {
  return (
    <div className="min-h-screen w-full p-6 bg-[#f6fafd] flex flex-col gap-6 font-sans">
      {/* --- Page Heading --- */}
      <h1 className="text-4xl font-extrabold text-[#1a2b3c] mb-6 text-center tracking-tight">Inventory Dashboard</h1>
      <InventoryStats />
      {/* --- Top Stat Cards Row --- */}
      
      {/* --- Section 1: Bar Chart and Large Card --- */}
      <div className="flex gap-4">
        {/* Left: Bar Chart, 40% width */}
        <div className="rounded-2xl bg-white/80 h-[50vh] shadow-lg flex items-center justify-center p-2 w-full transition duration-200 hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200">
          <TopAsinInventoryBarChart />
        </div>
        
      </div>

      {/* --- Section 2: Large card, next to a card with two cylinders inside --- */}
      

     

      {/* --- Section 4: Large card, next to a card with two stacked rectangles --- */}
     

      {/* --- Bottom: Three Large Chart Cards with Table --- */}
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-white rounded-2xl shadow-lg p-4 w-full flex flex-col mb-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Inventory Health</h2>
          <InventoryHealth />
        </div>
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 min-w-0 min-h-[300px] flex">
            <div className="bg-white rounded-2xl shadow-lg p-4 w-full h-full flex flex-col">
              <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">ASIN Liquidation</h2>
              <ASinLiqudation />
            </div>
          </div>
          <div className="flex-1 min-w-0 min-h-[300px] flex">
            <div className="bg-white rounded-2xl shadow-lg p-4 w-full h-full flex flex-col">
              <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">ASIN Excess</h2>
              <ASinExcess />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
