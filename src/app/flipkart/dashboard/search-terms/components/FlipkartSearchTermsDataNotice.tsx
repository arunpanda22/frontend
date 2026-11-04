"use client";

/**
 * FlipkartSearchTermsDataNotice: honest warnings about the DATA behind the numbers.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartSearchTermsDataNotice.tsx
 *
 * WHY IT EXISTS
 * Totals and period-over-period changes are only meaningful when the report pull has loaded (about) the same
 * number of days for both periods. The backend therefore reports, in the summary response:
 *   data_days   distinct days of search-term data per period
 *   coverage    search-term spend vs campaign-report spend
 *   truncated   whether the term cap was hit
 * This component turns them into plain-language banners and renders NOTHING when everything looks fine, so a
 * healthy account sees no noise. It reads the same summary query as the cards (same params, same React Query
 * key), so it costs no extra request.
 *
 * THRESHOLDS (change here if they feel too loud or too quiet)
 *   - warn when the current period has fewer days of data than days in the range
 *   - warn when the two periods' day counts differ by more than 20% (changes are not like-for-like)
 *   - note when search-term spend is outside 70-130% of campaign-report spend (different days or ad products)
 */
import React from "react";
import { useDateRange } from "@/lib/context/DateRangeContext";
import { useFlipkartSearchTermsSummary } from "@/lib/hooks/queries/use-flipkart-search-terms";
import { buildSearchTermsParams } from "./flipkart-search-terms-utils";

const DAY_COUNT_TOLERANCE = 0.2;
const COVERAGE_LOW = 70;
const COVERAGE_HIGH = 130;

interface Notice {
  level: "warn" | "info";
  text: string;
}

interface FlipkartSearchTermsDataNoticeProps {
  adsTenant?: string;
  campaignId: string | null;
  minClicks: number;
}

export default function FlipkartSearchTermsDataNotice({
  adsTenant,
  campaignId,
  minClicks,
}: FlipkartSearchTermsDataNoticeProps) {
  const { dateRange } = useDateRange();
  const startDate = dateRange.startDate || "";
  const endDate = dateRange.endDate || "";

  const { data } = useFlipkartSearchTermsSummary(
    buildSearchTermsParams({ startDate, endDate, adsTenant, campaignId, minClicks }),
    !!(startDate && endDate)
  );

  if (!data) return null;

  const current = data.data_days.current_period;
  const previous = data.data_days.previous_period;
  const notices: Notice[] = [];

  if (current.days_with_data === 0) {
    notices.push({ level: "warn", text: "There is no search-term data in the selected date range." });
  } else {
    if (current.days_with_data < current.days_in_range) {
      notices.push({
        level: "warn",
        text: `Search-term data exists for ${current.days_with_data} of ${current.days_in_range} days in this range (${current.first_date} to ${current.last_date}). Totals cover only those days.`,
      });
    }

    if (previous.days_with_data === 0) {
      notices.push({
        level: "info",
        text: "There is no data in the previous period, so the changes on the cards show as New.",
      });
    } else {
      const larger = Math.max(current.days_with_data, previous.days_with_data);
      const relativeGap = Math.abs(current.days_with_data - previous.days_with_data) / larger;
      if (relativeGap > DAY_COUNT_TOLERANCE) {
        notices.push({
          level: "warn",
          text: `The changes compare ${current.days_with_data} days of data with ${previous.days_with_data} days in the previous period, so they are not like-for-like.`,
        });
      }
    }
  }

  const { campaign_report_spend: campaignSpend, search_term_spend: termSpend, spend_coverage_pct: coveragePct } =
    data.coverage;
  if (campaignSpend > 0 && termSpend > 0 && (coveragePct < COVERAGE_LOW || coveragePct > COVERAGE_HIGH)) {
    notices.push({
      level: "info",
      text: `Search-term spend is ${coveragePct.toFixed(0)}% of campaign-report spend for this range. The two reports may cover different days, or the search-term report may include only some ad products.`,
    });
  }

  if (data.truncated) {
    notices.push({
      level: "info",
      text: "There are more distinct search terms than the page can list: only the highest-spend terms are shown. Totals and the baseline ROAS still cover all of them.",
    });
  }

  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {notices.map((notice) => (
        <div
          key={notice.text}
          role="status"
          className={`text-sm rounded-lg border px-4 py-3 ${
            notice.level === "warn"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {notice.text}
        </div>
      ))}
    </div>
  );
}