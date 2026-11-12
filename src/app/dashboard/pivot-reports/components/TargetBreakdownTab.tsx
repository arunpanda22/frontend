"use client";
import React, { useMemo } from "react";
import { useTargetBreakdownQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell, slotTagTypeName } from "./PivotReportShell";

/**
 * Target Breakdown: Range tag > target > campaign.
 * The group-by is LOCKED to this client's "range" TagType by the backend preset
 * (default_slot_slug="range"), so the controls bar shows no Group by pill. Fallback: a client
 * with no "range" TagType gets the picker so the tab stays usable. The group-by name appears in
 * the card title. Narrowing (other tag types, Ad type incl. SBV, Target kind) is done in the
 * Filters popover.
 */
export function TargetBreakdownTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("target-breakdown", pageRange);
  const result = useTargetBreakdownQuery(controls.query, enabled && controls.canRun);
  const groupName = slotTagTypeName(controls, "Tag");

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => (
        <PivotReportCard
          {...ui}
          title={`Target Breakdown — by ${groupName}`}
          data={data}
          rootLabel={groupName}
          exportFilename="target-breakdown"
        />
      )}
    </PivotReportShell>
  );
}