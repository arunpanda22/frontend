// components/SummaryTab.tsx
"use client";
import React, { useMemo } from "react";
import { useSummaryQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell } from "./PivotReportShell";

/** Month > date rollup, SP + SB + SD combined. No comparison (backend ignores it for this preset). */
export function SummaryTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("summary", pageRange);
  const result = useSummaryQuery(controls.query, enabled && controls.canRun);

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => (
        <PivotReportCard
          {...ui}
          title="Summary — Daily (SP + SB + SD)"
          data={data}
          rootLabel="Month"
          exportFilename="summary"
        />
      )}
    </PivotReportShell>
  );
}