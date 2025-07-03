"use client";
import React from "react";
import RevenueCard from "./components/Card";
import QuantityCard from "./components/Card2";
import AcosVsTacosChart from "./components/AcosVsTacos";
import AdvancedFunnel from "./components/AdvancedFunnel";
import PerformanceChart from "./components/PerformanceChart";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f7fafc] flex items-center justify-center p-0">
      <div
        className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 grid-rows-[repeat(3,minmax(320px,auto))] gap-4 md:gap-6 lg:gap-8 px-2 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8"
      >
        {/* Top Left: RevenueCard */}
        <div className="rounded-2xl flex items-center justify-center bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-1 row-span-1 transition-all duration-300 hover:shadow-2xl hover:scale-105 animate-fadein">
          <RevenueCard />
        </div>
        {/* Top Middle: RevenueCard2 */}
        <div className="rounded-2xl flex items-center justify-center bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-1 row-span-1 transition-all duration-300 hover:shadow-2xl hover:scale-105 animate-fadein delay-100">
          <QuantityCard />
        </div>
        {/* Top Middle: RevenueCard2 */}
        <div className="rounded-2xl flex items-center justify-center bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-1 row-span-1 transition-all duration-300 hover:shadow-2xl hover:scale-105 animate-fadein delay-100">
          <RevenueCard />
        </div>
        {/* Top Right: Large Card with ACOS vs TACOS Chart */}
        <div className="rounded-2xl flex items-center justify-center bg-white shadow-lg col-span-1 md:col-span-2 lg:col-span-2 row-span-1 transition-all duration-300 hover:shadow-2xl hover:scale-105 animate-fadein delay-200">
          <AcosVsTacosChart />
        </div>
        {/* Middle Wide Box: Advanced Funnel */}
        <div className="rounded-2xl flex items-center justify-center bg-white shadow-lg col-span-1 md:col-span-2 lg:col-span-5 row-span-1 transition-all duration-300  animate-fadein delay-300">
          <AdvancedFunnel />
        </div>
        {/* Bottom: Single Large Card with big ACOS vs TACOS Chart */}
        <div className="rounded-2xl flex items-center justify-center bg-white shadow-lg col-span-1 md:col-span-2 lg:col-span-5 row-span-1 px-2 md:px-8 py-4 md:py-8 transition-all duration-300  animate-fadein delay-400">
          <PerformanceChart />
        </div>
      </div>
    </div>
  );
}
