"use client";
import React from "react";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import {
  DateRangeProvider,
  useDateRange,
} from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range";
import { PivotReportsSection } from "./PivotReportsSection";

/**
 * Standalone Pivot Reports page. All tab logic lives in PivotReportsSection (also embedded
 * on the campaign analytics page), so there is exactly one tab list to maintain.
 * This page only supplies the page-level date range that each tab uses until the user
 * picks a pivot-specific range in the controls bar.
 */
function PivotReportsPage() {
  const { dateRange, updateCustomDates } = useDateRange();

  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  function handleDateRangeChange(newRange: Range) {
    if (newRange.startDate && newRange.endDate) {
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      updateCustomDates(
        formatLocalDate(newRange.startDate),
        formatLocalDate(newRange.endDate),
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full">
        <FilterBar
          title="Pivot Reports"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />
        <PivotReportsSection startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </div>
    </div>
  );
}

export default function PivotReportsPageWrapper() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <PivotReportsPage />
    </DateRangeProvider>
  );
}