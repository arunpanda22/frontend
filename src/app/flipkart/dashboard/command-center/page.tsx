"use client";

/**
 * Flipkart Campaign Summary page (route: /flipkart/dashboard/command-center).
 * Flipkart counterpart of the Amazon "Campaign Analytics" page.
 *
 * Place at: src/app/flipkart/dashboard/command-center/page.tsx
 *
 * LAYOUT (top to bottom)
 *   1. FilterBar with the date picker (drives every component through DateRangeContext)
 *   2. Performance Snapshot   -> FlipkartKpiCards
 *   3. Advertising Snapshot   -> FlipkartTimelineChart (5/7) + FlipkartCampaignTypeSplit (2/7)
 *   4. Campaign Ads Summary   -> FlipkartCampaignsTable
 *   5. Placement Performance  -> FlipkartCampaignPlacementsTable
 *
 * Every component fetches its own endpoint with its own React Query hook, so each one loads, fails and
 * refetches independently; this page only provides the date range and the ad account.
 *
 * REQUIREMENTS (provided by the app, not by this file)
 *   - A CurrencyProvider and the React Query provider above this page (useCurrency() throws without the
 *     former). If src/app/flipkart/dashboard/layout.tsx does not already include them, add them there.
 *
 * AD ACCOUNT
 *   ADS_TENANT is a single constant for now. `undefined` makes the backend use the user's oldest active
 *   Flipkart ad account. When an ad-account switcher exists, replace the constant with the selected
 *   FlipkartAdAccount UUID; every component already accepts it as the `adsTenant` prop.
 */
import React from "react";
import type { Range } from "react-date-range";
import FilterBar from "@/components/dashboard/ui/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import FlipkartKpiCards from "./components/FlipkartKpiCards";
import FlipkartTimelineChart from "./components/FlipkartTimelineChart";
import FlipkartCampaignTypeSplit from "./components/FlipkartCampaignTypeSplit";
import FlipkartCampaignsTable from "./components/FlipkartCampaignsTable";
import FlipkartCampaignPlacementsTable from "./components/FlipkartCampaignPlacementsTable";

/** See "AD ACCOUNT" in the file header. */
const ADS_TENANT: string | undefined = undefined;

const FlipkartCampaignSummaryPage = () => {
  const { dateRange, updateCustomDates } = useDateRange();

  // Convert the context's date strings to the Range shape FilterBar expects.
  const filterBarDateRange = {
    startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    key: "selection" as const,
  };

  const handleDateRangeChange = (newRange: Range) => {
    if (newRange.startDate && newRange.endDate) {
      // YYYY-MM-DD in the LOCAL timezone: toISOString() would shift the day for users ahead of UTC (India).
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      updateCustomDates(formatLocalDate(newRange.startDate), formatLocalDate(newRange.endDate));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full transition-all duration-300">
        <FilterBar
          title="Campaign Summary"
          dateRange={filterBarDateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Performance Snapshot</h2>
          <FlipkartKpiCards adsTenant={ADS_TENANT} />
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] tracking-tight px-2">Advertising Snapshot</h2>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-6 py-6">
            <div className="rounded-2xl flex w-full bg-white shadow-lg col-span-1 md:col-span-1 lg:col-span-5 row-span-1 transition-all duration-300 animate-fadein delay-300 h-full">
              <FlipkartTimelineChart adsTenant={ADS_TENANT} />
            </div>
            <div className="flex w-full col-span-1 md:col-span-1 lg:col-span-2 row-span-1 h-full">
              <FlipkartCampaignTypeSplit adsTenant={ADS_TENANT} />
            </div>
          </div>
          <FlipkartCampaignsTable adsTenant={ADS_TENANT} />
        </div>

        <div className="flex flex-col mt-10">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Placement Performance</h2>
          <FlipkartCampaignPlacementsTable adsTenant={ADS_TENANT} />
        </div>
      </div>
    </div>
  );
};

export default function FlipkartCampaignSummaryLayout() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <FlipkartCampaignSummaryPage />
    </DateRangeProvider>
  );
}