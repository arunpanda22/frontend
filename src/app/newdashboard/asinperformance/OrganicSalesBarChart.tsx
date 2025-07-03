"use client";
import React, { useState } from "react";
import asinDataRaw from "../../../../public/dataset/ ASIN_Performance_2025-03-30_to_2025-06-301.json";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const METRICS = [
  {
    key: "organic",
    label: "Share of Organic Sales (%)",
    color: "#2563EB", // blue
    getValue: (item: any) => item["Organic Sales"] ?? 0,
  },
  {
    key: "return",
    label: "Return Rate (%)",
    color: "#FFD600", // yellow
    getValue: (item: any) => (item["Return Rate"] ?? 0),
  },
  {
    key: "replacement",
    label: "Replacement Rate (%)",
    color: "#E3144D", // red
    getValue: (item: any) => (item["Replacement Rate"] ?? 0) ,
  },
];

// Helper to parse percent strings and numbers
function parseNumber(val: any) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/%/g, '').replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

const asinData = asinDataRaw.map((item: any) => ({
  ...item,
  "Organic Sales": parseNumber(item["Organic Sales"]),
  "Return Rate": parseNumber(item["Return Rate"]),
  "Replacement Rate": parseNumber(item["Replacement Rate"]),
  "Total Sales": parseNumber(item["Total Sales"]),
}));

export default function OrganicSalesBarChart({ height = 440 }: { height?: number }) {
  const [metricIndex, setMetricIndex] = useState(0);
  const metric = METRICS[metricIndex];

  // Sort and get top 10 by absolute Organic Sales
  const dataSorted = [...asinData]
    .sort((a: any, b: any) => (b["Total Sales"] || 0) - (a["Total Sales"] || 0))
    .slice(0, 10)
    .map((item: any) => ({
      asin: item.asin,
      value: metric.getValue(item),
    }));

  const barData = {
    labels: dataSorted.map((item: any) => item.asin),
    datasets: [
      {
        label: metric.label,
        data: dataSorted.map((item: any) => item.value),
        backgroundColor: metric.color,
        borderRadius: 12,
        barThickness: 22,
        barPercentage: 1,
        categoryPercentage: 1,
      },
    ],
  };

  const barOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: metric.label,
        color: "#222",
        font: { size: 22 },
      },
      datalabels: {
        anchor: "end" as const,
        align: "end" as const,
        color: "#222",
        font: { weight: 'bold' as const, size: 14 },
        formatter: (value: number) => value.toFixed(2) + " %",
        clamp: true,
      },
      tooltip: {
        callbacks: {
          label: function(ctx: any) {
            const asin = ctx.label;
            const asinObj = asinData.find((item: any) => item.asin === asin);
            const totalSales = asinObj ? asinObj["Total Sales"] : "N/A";
            let organicSales = "N/A";
            if (asinObj) {
              // Calculate actual organic sales amount
              organicSales = (asinObj["Total Sales"] * (asinObj["Organic Sales"] / 100)).toLocaleString(undefined, {maximumFractionDigits: 2});
            }
            const metricValue = ctx.parsed.x.toFixed(2) + " %";
            return [
              `${ctx.dataset.label}: ${metricValue}`,
              `Organic Sales: ${organicSales}`,
              `Total Sales: ${totalSales.toLocaleString()}`
            ];
          }
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { display: false },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#222", font: { size: 14 } },
        border: { display: false },
        barPercentage: 1,
        categoryPercentage: 1,
      },
    },
  };

  // On click, cycle to next metric
  const handleClick = () => {
    setMetricIndex((prev) => (prev + 1) % METRICS.length);
  };

  return (
    <div className="w-full h-full cursor-pointer" onClick={handleClick} title="Click to cycle metric">
      <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} height={height} />
    </div>
  );
} 