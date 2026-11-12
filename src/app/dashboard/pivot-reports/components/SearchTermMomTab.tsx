// components/SearchTermMomTab.tsx
"use client";
import React, { useMemo } from "react";
import { useSearchTermMomQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell, slotTagTypeName } from "./PivotReportShell";

/**
 * Search Term: tag > customer search term (SP + SB search-term reports). The tag type is locked
 * to "target-type" by the backend preset. Search terms are rolled up by text across keyword ids.
 *
 * NOTE shown to the user: product-targeting rows (match type TARGETING_EXPRESSION) are excluded
 * by the backend because Amazon puts an ASIN in the search-term column for them, so totals here
 * are intentionally NOT total spend and will not match other tabs.
 */
export function SearchTermMomTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("search-term-mom", pageRange);
  const result = useSearchTermMomQuery(controls.query, enabled && controls.canRun);

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-xs text-slate-500">
            Keyword-targeting search terms only — product targeting (ASIN) rows are excluded, so totals
            differ from the other tabs.
          </p>
          <PivotReportCard
            {...ui}
            title="Search Term — Month over Month"
            data={data}
            rootLabel={slotTagTypeName(controls, "Tag")}
            exportFilename="search-term-mom"
          />
        </div>
      )}
    </PivotReportShell>
  );
}