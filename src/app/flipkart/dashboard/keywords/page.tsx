"use client";

/**
 * Flipkart Keywords page (route: /flipkart/dashboard/keywords).
 * Flipkart counterpart of the Amazon "Market Funnel Insights" (SQP v2) page, with one expandable card per CAMPAIGN in
 * place of the top-30 ASIN cards.
 *
 * Place at: src/app/flipkart/dashboard/keywords/page.tsx
 *
 * LAYOUT (top to bottom)
 *   1. Header card with the month range picker (drives every component below)
 *   2. Summary cards            -> FlipkartKeywordSummaryCards
 *   3. Trends (2/3) + Funnel (1/3) -> FlipkartKeywordTrends + FlipkartKeywordFunnel
 *   4. Campaign cards           -> FlipkartKeywordCampaignList (headers first; each card loads its body when opened)
 *
 * Every component fetches its own endpoint with its own React Query hook, so each one loads, fails and refetches on
 * its own; this page only provides the month range and the ad account.
 *
 * WHY A MONTH PICKER INSTEAD OF FilterBar / DateRangeContext
 * Keyword data is stored as monthly periods and the backend counts only WHOLE months inside start_date..end_date, so a
 * free date range could silently drop a month. The page keeps the selection as a MonthRange ("YYYY-MM" from / to) and
 * converts it with monthRangeToDates(): the 1st of the first month to the last day of the last month. The components
 * receive plain startDate / endDate props, so they do not depend on DateRangeProvider.
 *
 * DEFAULT: the last 6 months. That leaves another 6 months of history for the previous-period comparison of the summary
 * cards (the previous window is the same number of whole months before the selection; the pull keeps 12 months).
 *
 * REQUIREMENTS (provided by the app, not by this file)
 *   - The React Query provider above this page. The page needs no CurrencyProvider: money is formatted in rupees by
 *     utils/keywordFormat.ts.
 *
 * AD ACCOUNT
 *   ADS_TENANT is a single constant for now, the same as on the Campaign Summary page. `undefined` makes the backend use
 *   the user's oldest active Flipkart ad account. When an ad-account switcher exists, replace the constant with the
 *   selected FlipkartAdAccount UUID; every component already accepts it as the `adsTenant` prop.
 */
import React, { useMemo, useState } from "react";
import FlipkartMonthRangePicker from "./components/FlipkartMonthRangePicker";
import FlipkartKeywordSummaryCards from "./components/FlipkartKeywordSummaryCards";
import FlipkartKeywordTrends from "./components/FlipkartKeywordTrends";
import FlipkartKeywordFunnel from "./components/FlipkartKeywordFunnel";
import FlipkartKeywordCampaignList from "./components/FlipkartKeywordCampaignList";
import { useKeywordSummary } from "@/lib/hooks/queries/use-flipkart-keywords";
import { formatMonthRange, lastMonthsRange, monthRangeToDates, type MonthRange } from "./utils/keywordDates";
import { formatCount } from "./utils/keywordFormat";

/** See "AD ACCOUNT" in the file header. */
const ADS_TENANT: string | undefined = undefined;

const DEFAULT_MONTHS = 6;

export default function FlipkartKeywordsPage() {
  const [monthRange, setMonthRange] = useState<MonthRange>(() => lastMonthsRange(DEFAULT_MONTHS));

  const { startDate, endDate } = useMemo(() => monthRangeToDates(monthRange), [monthRange]);

  // Same query as the summary cards and the funnel (React Query dedupes it): only used for the counts in the header.
  const { data: summary } = useKeywordSummary({
    start_date: startDate,
    end_date: endDate,
    ads_tenant: ADS_TENANT,
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-12 font-montserrat">
      <div className="w-full space-y-6 transition-all duration-300">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🔑 Keyword Insights</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatMonthRange(monthRange)}
              {summary && (
                <span>
                  {" "}
                  · {formatCount(summary.campaign_count)} campaigns · {formatCount(summary.keyword_count)} keywords
                </span>
              )}
            </p>
          </div>
          <FlipkartMonthRangePicker value={monthRange} onChange={setMonthRange} />
        </div>

        {/* Summary cards */}
        <FlipkartKeywordSummaryCards startDate={startDate} endDate={endDate} adsTenant={ADS_TENANT} />

        {/* Overall trends + funnel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <FlipkartKeywordTrends startDate={startDate} endDate={endDate} adsTenant={ADS_TENANT} />
          </div>
          <FlipkartKeywordFunnel startDate={startDate} endDate={endDate} adsTenant={ADS_TENANT} />
        </div>

        {/* Campaign cards */}
        <FlipkartKeywordCampaignList startDate={startDate} endDate={endDate} adsTenant={ADS_TENANT} />
      </div>
    </div>
  );
}