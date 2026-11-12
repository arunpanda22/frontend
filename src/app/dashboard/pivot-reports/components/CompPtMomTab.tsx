"use client";
import React, { useMemo } from "react";
import { useCompPtMomQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell, slotTagTypeName } from "./PivotReportShell";

/**
 * Comp PT: brand tag > target > campaign. The brand dimension is locked to this client's
 * "competitor-brand" TagType by the backend preset. To view one brand, filter by that tag type.
 */
export function CompPtMomTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("comp-pt-mom", pageRange);
  const result = useCompPtMomQuery(controls.query, enabled && controls.canRun);

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => (
        <PivotReportCard
          {...ui}
          title="Comp PT — Month over Month"
          data={data}
          rootLabel={slotTagTypeName(controls, "Brand")}
          exportFilename="comp-pt-mom"
        />
      )}
    </PivotReportShell>
  );
}