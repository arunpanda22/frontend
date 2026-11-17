"use client";

/**
 * FlipkartSearchTermsDataNotice: honest warnings about the DATA behind the numbers.
 *
 * Place at: src/app/flipkart/dashboard/search-terms/components/FlipkartSearchTermsDataNotice.tsx
 *
 * Renders the notices built by buildSearchTermsNotices() (../utils/dataCoverageNotices.ts): month coverage,
 * month-to-date months, previous-window gaps, spend coverage and the term cap. All wording and thresholds live in
 * that util; this component only renders them, and renders NOTHING when the data looks complete.
 *
 * Reads the same summary query as the cards (same params, same React Query key), so it costs no extra request.
 */
import React from "react";
import { useFlipkartSearchTermsSummary } from "@/lib/hooks/queries/use-flipkart-search-terms";
import { buildSearchTermsNotices } from "../utils/dataCoverageNotices";
import { buildSearchTermsParams } from "./flipkart-search-terms-utils";

const NOTICE_CLASS = {
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
} as const;

interface FlipkartSearchTermsDataNoticeProps {
  /** First day of the first selected month, YYYY-MM-DD. */
  startDate: string;
  /** Last day of the last selected month, YYYY-MM-DD. */
  endDate: string;
  adsTenant?: string;
  campaignId: string | null;
  minClicks: number;
}

export default function FlipkartSearchTermsDataNotice({
  startDate,
  endDate,
  adsTenant,
  campaignId,
  minClicks,
}: FlipkartSearchTermsDataNoticeProps) {
  const { data } = useFlipkartSearchTermsSummary(
    buildSearchTermsParams({ startDate, endDate, adsTenant, campaignId, minClicks }),
    !!(startDate && endDate)
  );

  if (!data) return null;

  const { notices } = buildSearchTermsNotices(data);
  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {notices.map((notice) => (
        <div
          key={notice.message}
          role="status"
          className={`text-sm rounded-lg border px-4 py-3 ${NOTICE_CLASS[notice.tone]}`}
        >
          {notice.message}
        </div>
      ))}
    </div>
  );
}