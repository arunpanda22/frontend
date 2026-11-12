// AdTypeMoMTab.tsx
"use client";
import React, { useMemo } from "react";
import { useAdTypeMoMQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell } from "./PivotReportShell";

/**
 * Ad type (SP / SB / SBV / SD) > campaign. Narrow by Ad type via the Filters popover
 * (the backend's `ad_format` filter, which includes "Sponsored Brands Video").
 */
export function AdTypeMoMTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("ad-type-mom", pageRange);
  const result = useAdTypeMoMQuery(controls.query, enabled && controls.canRun);

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => (
        <PivotReportCard
          {...ui}
          title="Ad Type — Month over Month"
          data={data}
          rootLabel="Ad Type"
          exportFilename="ad-type-mom"
        />
      )}
    </PivotReportShell>
  );
}