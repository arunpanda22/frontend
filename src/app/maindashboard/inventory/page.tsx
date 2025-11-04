"use client"
import React, { useEffect, useState, useRef, useMemo } from "react";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useInventoryHealth } from '@/lib/hooks/queries/use-dashboard';

import InventoryHealth from "./inventoryHealth";
import ASinLiqudation from "./asinliqudation";
import ASinExcess from "./asinexcess";
import InventoryStats from "./inventoryStats";
import TopRestockRecommendations from "./RestockRecommendations";

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
  LineController,
} from "chart.js";
import LineColumnAreaChart from "./linenadbarchart";
import { Widgets } from "@mui/icons-material";
import Cards from "./cards";
import AdsRevenueApp from "./cards";
import InventoryReplenishment from "../components/InventoryReplenishment";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  LineController
);

function TopAsinInventoryBarChart() {
  // Use real inventory health API instead of static JSON
  const { data: inventoryHealthData, isLoading: loading, error } = useInventoryHealth({
    sales_days: 30,
    reorder_cover_days: 60,
    supply_chain_lead_time: 60
  });

  // Process real API data
  const data = useMemo(() => {
    if (!inventoryHealthData?.inventory_health) return [];

    const processed = inventoryHealthData.inventory_health.map((item: any) => ({
      asin: item.asin,
      totalInventory: (item.reserved_quantity || 0) + (item.fulfillable_quantity || 0),
      inventoryCover: item['Sales/Day'] && item['Sales/Day'] > 0
        ? ((item.reserved_quantity || 0) + (item.fulfillable_quantity || 0)) / item['Sales/Day']
        : 0,
    }));

    // Get top 10 by total inventory
    return processed
      .sort((a: any, b: any) => b.totalInventory - a.totalInventory)
      .slice(0, 10);
  }, [inventoryHealthData]);

  if (loading) {
    return <div className="w-full h-64 flex items-center justify-center text-blue-700 text-lg">Loading chart...</div>;
  }

  if (error) {
    return <div className="w-full h-64 flex items-center justify-center text-red-600 text-lg">Failed to load inventory data: {error.message}</div>;
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
  const chartRef = useRef(null);
  const adsChartRef = useRef(null);

  return (
    <div className="min-h-screen w-full px-12 py-8 bg-[#f6fafd] flex flex-col gap-6 font-sans">
      {/* --- Page Heading --- */}
      <h1 className="text-4xl font-extrabold text-[#1a2b3c] mb-6 text-center tracking-tight">InventoryPulse</h1>
      <InventoryStats />
      
      {/* --- Section 1: Bar Chart and Restock Recommendations --- */}
      <div className="flex gap-4 items-stretch min-h-[500px]">
        {/* Left: Chart */}
        <div className="w-[70%]">
          <LineColumnAreaChart chartColors="" chartDarkColors="" chartId={chartRef} />
        </div>

        {/* Right: Replenishment */}
        <div className="w-[30%]">
          <InventoryReplenishment />
        </div>
      </div>

      {/* --- Bottom: Three Large Chart Cards with Table --- */}
      <div className="flex flex-col gap-6 w-full">
          <InventoryHealth />
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1 min-w-0 min-h-[300px] flex">
            <div className="bg-white rounded-2xl shadow-lg w-full h-full flex flex-col">
              <ASinLiqudation />
            </div>
          </div>
          <div className="flex-1 min-w-0 min-h-[300px] flex">
            <div className="bg-white rounded-2xl shadow-lg w-full h-full flex flex-col">
              <ASinExcess />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}