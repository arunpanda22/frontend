"use client";

/**
 * Flipkart Search Terms page (route: /flipkart/dashboard/search-terms).
 *
 * Place at: src/app/flipkart/dashboard/search-terms/page.tsx
 *
 * WHAT IT ANSWERS
 * For every search term in the selected months: what it costs, what it returns, and what to do about it.
 * Each term is classified against a BASELINE ROAS (the ROAS of all search-term data in scope):
 *   winner / inefficient / wasted (enough clicks, no units) / low data
 *
 * MONTH PICKER, COMPLETE MONTHS ONLY (same behaviour as the Keywords page)
 * Search-term data is stored as monthly periods and the backend counts only WHOLE months inside
 * start_date..end_date, so a free date range could silently drop a month. The page therefore keeps the selection as a
 * MonthRange ("YYYY-MM" from / to) and converts it with monthRangeToDates(): the 1st of the first month to the last
 * day of the last month. The picker offers COMPLETE months only (INCLUDE_CURRENT_MONTH in keywords/utils/keywordDates.ts):
 * the latest month is LAST month, and the default is the last DEFAULT_MONTHS complete months. Flip that one constant
 * to offer the current month-to-date month again; the backend and the coverage notices already handle it.
 * The components receive plain startDate / endDate props, so they do not depend on DateRangeProvider any more.
 *
 * LAYOUT (top to bottom)
 *   1. Header card with the month range picker
 *   2. Filters: campaign + min clicks
 *   3. Data notice (renders nothing when the data looks complete)
 *   4. Performance Snapshot   -> FlipkartSearchTermsCards
 *   5. Search Term Health     -> FlipkartSearchTermClassificationChart (click a class to filter the table)
 *   6. Top Search Terms       -> FlipkartTopSearchTerms
 *   7. Search term table      -> FlipkartSearchTermsTable
 *   8. Detail modal           -> FlipkartSearchTermDetailModal (monthly trend)
 *
 * STATE OWNED HERE: monthRange, campaignId, minClicks, classification, selectedTerm.
 *
 * REQUIREMENTS (provided by the app): a CurrencyProvider and the React Query provider above this page.
 *
 * AD ACCOUNT: ADS_TENANT is a constant for now (undefined = the user's oldest active Flipkart ad account).
 */
import React, { useMemo, useState } from "react";
import type { SearchTermClassification } from "@/lib/api/services/flipkart-search-terms.service";
import FlipkartMonthRangePicker from "@/app/flipkart/dashboard/keywords/components/FlipkartMonthRangePicker";
import {
  INCLUDE_CURRENT_MONTH,
  formatMonthRange,
  lastMonthsRange,
  monthRangeToDates,
  type MonthRange,
} from "@/app/flipkart/dashboard/keywords/utils/keywordDates";
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

/** Months selected when the page opens (complete months, ending last month). Same as the Keywords page. */
const DEFAULT_MONTHS = 6;

export default function FlipkartSearchTermsPage() {
  const [monthRange, setMonthRange] = useState<MonthRange>(() => lastMonthsRange(DEFAULT_MONTHS));
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [minClicks, setMinClicks] = useState<number>(DEFAULT_MIN_CLICKS);
  const [classification, setClassification] = useState<SearchTermClassification | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => monthRangeToDates(monthRange), [monthRange]);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full transition-all duration-300">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Search Terms</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatMonthRange(monthRange)}
              {!INCLUDE_CURRENT_MONTH && <span> · complete months only</span>}
            </p>
          </div>
          <FlipkartMonthRangePicker value={monthRange} onChange={setMonthRange} />
        </div>

        <FlipkartSearchTermsFilters
          adsTenant={ADS_TENANT}
          campaignId={campaignId}
          onCampaignChange={setCampaignId}
          minClicks={minClicks}
          onMinClicksChange={setMinClicks}
        />

        <FlipkartSearchTermsDataNotice
          startDate={startDate}
          endDate={endDate}
          adsTenant={ADS_TENANT}
          campaignId={campaignId}
          minClicks={minClicks}
        />

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Performance Snapshot</h2>
          <FlipkartSearchTermsCards
            startDate={startDate}
            endDate={endDate}
            adsTenant={ADS_TENANT}
            campaignId={campaignId}
            minClicks={minClicks}
          />
        </div>

        <div className="flex flex-col mb-8">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">Search Term Health</h2>
          <FlipkartSearchTermClassificationChart
            startDate={startDate}
            endDate={endDate}
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
            startDate={startDate}
            endDate={endDate}
            adsTenant={ADS_TENANT}
            campaignId={campaignId}
            minClicks={minClicks}
            onSelectTerm={setSelectedTerm}
          />
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-[#1a2b3c] mb-6 tracking-tight px-2">All Search Terms</h2>
          <FlipkartSearchTermsTable
            startDate={startDate}
            endDate={endDate}
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
          startDate={startDate}
          endDate={endDate}
          adsTenant={ADS_TENANT}
          onClose={() => setSelectedTerm(null)}
        />
      </div>
    </div>
  );
}