// components/TargetingLevelMomTab.tsx
"use client";
import React, { useMemo } from "react";
import { useTargetingLevelMomQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell, slotTagTypeName } from "./PivotReportShell";

/**
 * Targeting Level: targets grouped by ONE tag, locked to the client's "target-type" TagType by
 * the backend preset. To see a single target type (Generic, Branded, ...), use the Filters
 * popover and pick that tag type — there is no second dropdown in the card.
 * Preset key is "targeting-mom" (the page-level tab key is still "targeting-level-mom").
 */
export function TargetingLevelMomTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("targeting-mom", pageRange);
  const result = useTargetingLevelMomQuery(controls.query, enabled && controls.canRun);

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => (
        <PivotReportCard
          {...ui}
          title="Targeting Level — Month over Month"
          data={data}
          rootLabel={slotTagTypeName(controls, "Targeting Type")}
          exportFilename="targeting-level-mom"
        />
      )}
    </PivotReportShell>
  );
}