"use client";
import React from "react";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range"; 
import CampaignXrayChart from "./components/CampaignXray";
import KeywordPerformanceTable from "./components/CampaignPerformanceTable";

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
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
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

        {/* Keyword Performance Table Section */}
        <div className="mt-8">
          <h2 className="text-base font-semibold text-gray-900">
            Keyword & Expression Performance
          </h2>
          <KeywordPerformanceTable />
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