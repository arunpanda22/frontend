"use client";
import React from "react";
import CampaignMetricsCardGrid from "./CampaignMetricsCardGrid"; // Import the new component

import CampaignSummaryCard from "./CampaignSummaryCard";
import AdsTimelineChart from "./AdsTimelineChart";
import FilterBar from "../../components/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range"; 
import SalesContributionDonut from "./SalesContributionDonut";
import CampaignAdsSummary from "./campain_summery";
import CampaignTablePage from "./CampaignXRay";

const CampaignPerformancePage = () => {
  // Access the date range context
  const { dateRange, updateCustomDates } = useDateRange();
  
  // Convert context date range to FilterBar format
  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
      // Format dates as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      updateCustomDates(
        formatLocalDate(newRange.startDate),
        formatLocalDate(newRange.endDate)
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12">
      <div className="w-full transition-all duration-300 ">
        {/* Date Range Filter */}
        <FilterBar
          title="🎯 Campaign Analytics"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Performance Snapshot Section */}
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">
            Performance Snapshot
          </h2>
          {/* Replace StatCardGrid with CampaignMetricsCardGrid */}
          <CampaignMetricsCardGrid />
        </div>

        {/* Advertising Snapshot Section */}
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] tracking-tight px-2">
            Advertising Snapshot
          </h2>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-6 md:py-6 lg:py-8">
            <div className="rounded-2xl flex w-full bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-5 row-span-1 transition-all duration-300 animate-fadein delay-300 h-full">
              <AdsTimelineChart />
            </div>
            <div className="rounded-2xl flex w-full bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-2 row-span-1 transition-all duration-300 animate-fadein delay-300 h-full">
              <SalesContributionDonut />
            </div>
          </div>
          {/* Campaign Summary Table */}
          <CampaignAdsSummary 
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            period={dateRange.preset || '30d'}
          />
        </div>
        <CampaignTablePage />
      </div>
    </div>
  );
}

// Main wrapper component
export default function CampaignLayout() {
  return (
    <DateRangeProvider defaultPreset="30d">
      <CampaignPerformancePage />
    </DateRangeProvider>
  );
}