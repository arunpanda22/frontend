"use client";
import React from "react";
// import CampaignMetricsCardGrid from "./components/CampaignMetricsCardGrid"; // Import the new component
// import AdsTimelineChart from "./components/AdsTimelineChart";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range"; 
import CampaignXrayChart from "./components/CampaignXray";

const CampaignXrayPage = () => {
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
          title="🎯 Campaign Xray"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

    

        {/* Advertising Snapshot Section */}
        <div className="flex flex-col">
          {/* <h2 className="text-xl md:text-2xl font-bold text-[#1a2b3c] tracking-tight px-2">
            Advertising Snapshot
          </h2> */}

              <CampaignXrayChart />
   
        </div>
      </div>
    </div>
  );
}

// Main wrapper component
export default function CampaignLayout() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <CampaignXrayPage />
    </DateRangeProvider>
  );
}