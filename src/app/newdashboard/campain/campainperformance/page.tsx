"use client"
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

import campaignData from "../../../../../public/campain_summery_filtered.json";
import { FaBoxOpen } from "react-icons/fa";


import CampainAdsSummery from "./campain_summery";



export default function CampaignPerformanceLayout() {
  // Calculate Total ASIN's (unique ASINs from campaignName)
  const asinSet = new Set<string>();
  campaignData.forEach(item => {
    // Extract ASIN (assume it's the first word in campaignName)
    const asin = item.campaignName?.split(' ')[0];
    if (asin) asinSet.add(asin);
  });
  const totalAsins = asinSet.size;

  // Calculate Total Quantity
  const totalQuantity = campaignData.reduce((sum, item) => sum + (Number(item["Units Sold"]) || 0), 0);

  // Calculate Total Sales
  const totalSales = campaignData.reduce((sum, item) => sum + (Number(item["Sales"]) || 0), 0);

  // Avg. BuyBox (placeholder, since not in data)
  const avgBuyBox = 0; // Or leave as null/undefined if you want to hide it

  // Prepare data for Bar Chart (top 5 campaigns by Sales)
  const top5 = [...campaignData]
    .sort((a, b) => b.Sales - a.Sales)
    .slice(0, 5);
  const barData = {
    labels: top5.map(item => item.campaignName),
    datasets: [
      {
        label: 'Sales',
        data: top5.map(item => item.Sales),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 6,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top 5 Campaigns by Sales' },
      tooltip: { callbacks: { label: (ctx: any) => `₹${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: {
      x: { ticks: { maxRotation: 30, minRotation: 15, font: { size: 12 } } },
      y: { beginAtZero: true, ticks: { callback: (v: any) => `₹${v.toLocaleString()}` } },
    },
  };

  return (
    <div className="min-h-screen w-full p-6 bg-[#f6fafd] flex flex-col gap-6 font-sans">
      {/* --- Page Heading --- */}
      <h1 className="text-4xl font-extrabold text-[#1a2b3c] mb-6 text-center w-full">Campain</h1>
      {/* --- Top Stat Cards Row --- */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200" title="The number of unique ASINs (Amazon Standard Identification Numbers) found in your campaign data. Each ASIN represents a unique product.">
          <FaBoxOpen className="text-blue-500 text-3xl mb-2" />
          <div className="text-3xl font-extrabold text-[#1a2b3c]">{totalAsins.toLocaleString()}</div>
          <div className="text-[#64748b] font-medium mt-1">Total ASIN's</div>
        </div>
        <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200" title="The total number of units sold across all campaigns in the selected period.">
          <span className="text-blue-500 text-3xl mb-2">📦</span>
          <div className="text-3xl font-extrabold text-[#1a2b3c]">{totalQuantity.toLocaleString()}</div>
          <div className="text-[#64748b] font-medium mt-1">Total Quantity</div>
        </div>
        <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200" title="The total sales revenue generated from all campaigns, summed across all products and campaigns.">
          <span className="text-blue-500 text-3xl mb-2">₹</span>
          <div className="text-3xl font-extrabold text-[#1a2b3c]">₹{totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="text-[#64748b] font-medium mt-1">Total Sales</div>
        </div>
        <div className="rounded-2xl bg-white/80 flex flex-col items-center justify-center p-8 min-w-[180px] shadow-lg transition duration-200 hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200" title="This is a placeholder. The BuyBox percentage typically represents the average percentage of time your products held the Amazon BuyBox (the default seller position for a product). However, this data is not present in your current dataset, so it is shown as 'N/A'.">
          <span className="text-blue-500 text-3xl mb-2">%</span>
          <div className="text-3xl font-extrabold text-[#1a2b3c]">N/A</div>
          <div className="text-[#64748b] font-medium mt-1">Avg. BuyBox</div>
        </div>
      </div>
      {/* --- Sponsored Campaign Cards Row --- */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Pie Chart Card */}
        <div className="rounded-3xl bg-white shadow-2xl flex flex-col items-center  w-full border border-[#e0e7ef] hover:scale-[1.02] transition-transform duration-200">
          <div className="text-2xl font-extrabold pt-10 mb-10  text-[#1a2b3c] drop-shadow">Campaign Share</div>
          <div className="">
            <Doughnut
              data={{
                labels: ["2.7", "4.1", "7.4"],
                datasets: [
                  {
                    data: [2.7, 4.1, 7.4],
                    backgroundColor: [
                      "#67B3E5",
                      "#ED7294",
                      "#FDD96C"
                    ],
                    borderWidth: 3,
                  },
                ],
              }}
              options={{
                cutout: "75%",
                plugins: {
                  legend: { display: false },
                  datalabels: {
                    color: '#fff',
                    backgroundColor: "transparent",
                    borderRadius: 8,
                    font: { weight: "bold", size: 16 },
                    padding: 6,
                    display: true,
                    formatter: (value, ctx) => ctx.chart?.data?.labels?.[ctx.dataIndex] ?? value,
                  },
                },
              }}
              width={260}
              height={260}
            />
          </div>
        </div>
        {/* Card 1 */}
        <div className="rounded-3xl bg-white p-10 shadow-2xl flex flex-col gap-5 w-full border border-[#e0e7ef] hover:scale-[1.02] transition-transform duration-200">
          <div className="text-2xl font-extrabold mb-4 text-[#1a2b3c] drop-shadow">Sponsored Product</div>
          {[
            { label: "impressions", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "ctr%", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "Ad cost", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "Ad sails", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "ASOC%", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center rounded-xl px-5 py-3 font-semibold text-white shadow hover:bg-opacity-90 transition"
              style={{ backgroundColor: "#0282D5" }}
            >
              <span className="flex items-center">{item.icon}{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
        {/* Card 2 */}
        <div className="rounded-3xl bg-white p-10 shadow-2xl flex flex-col gap-5 w-full border border-[#e0e7ef] hover:scale-[1.02] transition-transform duration-200">
          <div className="text-2xl font-extrabold mb-4 text-[#1a2b3c] drop-shadow">Sponsored Brand</div>
          {[
            { label: "impressions", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "ctr%", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "Ad cost", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "Ad sails", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "ASOC%", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center rounded-xl px-5 py-3 font-semibold text-white shadow hover:bg-opacity-90 transition"
              style={{ backgroundColor: "#E3144D" }}
            >
              <span className="flex items-center">{item.icon}{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
        {/* Card 3 */}
        <div className="rounded-3xl bg-white p-10 shadow-2xl flex flex-col gap-5 w-full border border-[#e0e7ef] hover:scale-[1.02] transition-transform duration-200">
          <div className="text-2xl font-extrabold mb-4 text-[#1a2b3c] drop-shadow">Sponsored Display</div>
          {[
            { label: "impressions", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "ctr%", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "Ad cost", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "Ad sails", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
            { label: "ASOC%", value: "30M", icon: <FaBoxOpen className='text-lg mr-2' /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center rounded-xl px-5 py-3 font-semibold text-white shadow hover:bg-opacity-90 transition"
              style={{ backgroundColor: "#FEC20A" }}
            >
              <span className="flex items-center">{item.icon}{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Section 1: Bar Chart and Large Card --- */}
     

      {/* --- Section 2: Large card, next to a card with two cylinders inside --- */}
      

     

      {/* --- Section 4: Large card, next to a card with two stacked rectangles --- */}
      

      {/* --- Bottom: Three Large Chart Cards with Table --- */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="rounded-2xl bg-white/80 shadow-lg p-8 flex items-center justify-center transition duration-200 hover:shadow-[0_4px_32px_0_rgba(37,99,235,0.15)] hover:ring-2 hover:ring-blue-200">
          {/* FIX: Corrected component name */}
          <CampainAdsSummery />
        </div>
      </div>
    </div>
  );
}
