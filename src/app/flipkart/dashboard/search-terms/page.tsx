"use client";

/**
 * Flipkart Search Terms page (route: /flipkart/dashboard/search-terms).
 *
 * Place at: src/app/flipkart/dashboard/search-terms/page.tsx
 *
 * WHAT IT ANSWERS
 * For every search term in the selected date range: what it costs, what it returns, and what to do about it.
 * Each term is classified against a BASELINE ROAS (the ROAS of all search-term data in scope):
 *   winner / inefficient / wasted (enough clicks, no units) / low data
 * Unlike the Amazon SQP page there is no market data on Flipkart: the benchmark is the account's own (or the
 * selected campaign's) overall performance.
 *
 * LAYOUT (top to bottom)
 *   1. FilterBar with the date picker (DateRangeContext drives every component)
 *   2. Filters: campaign + min clicks
 *   3. Data notice (renders nothing when the data looks complete)
 *   4. Performance Snapshot   -> FlipkartSearchTermsCards
 *   5. Search Term Health     -> FlipkartSearchTermClassificationChart (click a class to filter the table)
 *   6. Top Search Terms       -> FlipkartTopSearchTerms (top by revenue + top wasted)
 *   7. Search term table      -> FlipkartSearchTermsTable (server-side search / filter / sort / pagination)
 *   8. Detail modal           -> FlipkartSearchTermDetailModal (opened from any term in 6 or 7)
 *
 * STATE OWNED HERE (shared by several components): campaignId, minClicks, classification, selectedTerm.
 * Every component fetches its own endpoint with its own hook, so each loads, fails and refetches independently.
 *
 * REQUIREMENTS (provided by the app, not by this file): a CurrencyProvider and the React Query provider above this
 * page, as for the Campaign Summary page (src/app/flipkart/dashboard/layout.tsx).
 *
 * AD ACCOUNT: ADS_TENANT is a constant for now. `undefined` makes the backend use the user's oldest active
 * Flipkart ad account. Replace it with the selected FlipkartAdAccount UUID once an ad-account switcher exists;
 * every component already accepts it as the `adsTenant` prop.
 */
import React, { useState } from "react";
import type { Range } from "react-date-range";
import FilterBar from "@/components/dashboard/ui/FilterBar";
import { DateRangeProvider, useDateRange } from "@/lib/context/DateRangeContext";
import type { SearchTermClassification } from "@/lib/api/services/flipkart-search-terms.service";
import FlipkartSearchTermsFilters from "./components/FlipkartSearchTermsFilters";
import FlipkartSearchTermsDataNotice from "./components/FlipkartSearchTermsDataNotice";
import FlipkartSearchTermsCards from "./components/FlipkartSearchTermsCards";
import FlipkartSearchTermClassificationChart from "./components/FlipkartSearchTermClassificationChart";
import FlipkartTopSearchTerms from "./components/FlipkartTopSearchTerms";
import FlipkartSearchTermsTable from "./components/FlipkartSearchTermsTable";
import FlipkartSearchTermDetailModal from "./components/FlipkartSearchTermDetailModal";
import { DEFAULT_MIN_CLICKS } from "./components/flipkart-search-terms-utils";

/** See "AD ACCOUNT" in the file header. */
const ADS_TENANT: string | undefined = undefined;

const FlipkartSearchTermsPage = () => {
  const { dateRange, updateCustomDates } = useDateRange();

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [minClicks, setMinClicks] = useState<number>(DEFAULT_MIN_CLICKS);
  const [classification, setClassification] = useState<SearchTermClassification | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

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
        <FilterBar title="Search Terms" dateRange={filterBarDateRange} onDateRangeChange={handleDateRangeChange} />

        <FlipkartSearchTermsFilters
          adsTenant={ADS_TENANT}
          campaignId={campaignId}
          onCampaignChange={setCampaignId}
          minClicks={minClicks}
          onMinClicksChange={setMinClicks}
        />

        <FlipkartSearchTermsDataNotice adsTenant={ADS_TENANT} campaignId={campaignId} minClicks={minClicks} />

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Performance Snapshot</h2>
          <FlipkartSearchTermsCards adsTenant={ADS_TENANT} campaignId={campaignId} minClicks={minClicks} />
        </div>

        <div className="flex flex-col mb-8">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Search Term Health</h2>
          <FlipkartSearchTermClassificationChart
            adsTenant={ADS_TENANT}
            campaignId={campaignId}
            minClicks={minClicks}
            selected={classification}
            onSelect={setClassification}
          />
        </div>

        <div className="flex flex-col mb-8">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Top Search Terms</h2>
          <FlipkartTopSearchTerms
            adsTenant={ADS_TENANT}
            campaignId={campaignId}
            minClicks={minClicks}
            onSelectTerm={setSelectedTerm}
          />
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">All Search Terms</h2>
          <FlipkartSearchTermsTable
            adsTenant={ADS_TENANT}
            campaignId={campaignId}
            minClicks={minClicks}
            classification={classification}
            onClassificationChange={setClassification}
            onSelectTerm={setSelectedTerm}
          />
        </div>

        <FlipkartSearchTermDetailModal
          term={selectedTerm}
          startDate={dateRange.startDate || ""}
          endDate={dateRange.endDate || ""}
          adsTenant={ADS_TENANT}
          onClose={() => setSelectedTerm(null)}
        />
      </div>
    </div>
  );
};

export default function FlipkartSearchTermsLayout() {
  return (
    <DateRangeProvider defaultPreset="this month">
      <FlipkartSearchTermsPage />
    </DateRangeProvider>
  );
}