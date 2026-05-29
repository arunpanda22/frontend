"use client";
import React from "react";
import FilterBar from "../../../components/dashboard/ui/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import type { Range } from "react-date-range";
import { RevenueMap } from "./components/RevenueMap";
import { CohortTable } from "./components/CohortTable";
import { useRevenueMap, useCohortOrders } from "@/lib/hooks/queries/use-order-analytics";

const OrderAnalyticsPage = () => {
  const { dateRange, updateCustomDates } = useDateRange();

  const analyticsParams = {
    date_from: dateRange.startDate ?? undefined,
    date_to:   dateRange.endDate   ?? undefined,
  };

  const hasDateRange = !!dateRange.startDate && !!dateRange.endDate;

  const revenueMap   = useRevenueMap(analyticsParams, hasDateRange);
  // Cohort is always last 6 months — no params, not affected by date filter
  const cohortOrders = useCohortOrders();

  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate:   dateRange.endDate   ? new Date(dateRange.endDate)   : undefined,
    key: "selection" as const,
  };

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
      const fmt = (d: Date) => {
        const y   = d.getFullYear();
        const m   = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      updateCustomDates(fmt(newRange.startDate), fmt(newRange.endDate));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full transition-all duration-300 space-y-6">

        <FilterBar
          title="Order Analytics"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Cohort — always last 6 months, unaffected by date filter */}
        {cohortOrders.isError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-6 py-4 text-sm text-red-500">
            Failed to load cohort data. Please try again.
          </div>
        ) : (
          <CohortTable
            orders={cohortOrders.data?.orders ?? []}
            isLoading={cohortOrders.isLoading}
          />
        )}

        {/* Revenue Map — respects date filter */}
        {revenueMap.isError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-6 py-4 text-sm text-red-500">
            Failed to load revenue map. Please try again.
          </div>
        ) : (
          <RevenueMap
            data={revenueMap.data ?? { total_revenue: 0, total_orders: 0, min_revenue: 0, max_revenue: 0, states: [] }}
            params={analyticsParams}
            isLoading={revenueMap.isLoading}
          />
        )}

      </div>
    </div>
  );
};

// No defaultPreset — page loads without a pre-selected date range
export default function OrderAnalyticsLayout() {
  return (
    <DateRangeProvider>
      <OrderAnalyticsPage />
    </DateRangeProvider>
  );
}