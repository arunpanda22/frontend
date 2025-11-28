// app/dashboard/campaign-xray/page.tsx

"use client";
import React from "react";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range"; 
import CampaignXrayChart from "./components/CampaignXray";
import { CampaignSegmentsTables } from "./components/CampaignSegmentsTables";

const CampaignXrayPage = () => {
  const { dateRange, updateCustomDates } = useDateRange();
  
  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
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
      <div className="w-full transition-all duration-300">
        {/* Date Range Filter */}
        <FilterBar
          title="🎯 Campaign Xray"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Campaign Xray Chart Section */}
        <div className="mb-8">
          <CampaignXrayChart />
        </div>

        {/* Campaign Segments Tables Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#1a2b3c] tracking-tight mb-6 px-2">
            Campaign Performance Segments
          </h2>
          <CampaignSegmentsTables />
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