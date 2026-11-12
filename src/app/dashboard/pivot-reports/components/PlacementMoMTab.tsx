// PlacementMoMTab.tsx
"use client";
import React, { useMemo } from "react";
import { usePlacementMoMQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { usePivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotReportCard, PivotReportShell } from "./PivotReportShell";

/**
 * Placement > campaign, one table per ad type (SP, SB) inside ONE shell, so the controls bar
 * and filters apply to both tables at once.
 *
 * The response has sp_tree / sb_tree / section_totals instead of tree / totals, so each section
 * is adapted into a PivotReportResponse-shaped object for PivotReportCard. A section with no rows
 * is hidden. Backend warnings are shown once, on the first card.
 *
 * EXCEPTION to "no in-card dropdown": the meta endpoint does not advertise placement values, so
 * the in-table "All placements" select stays here as the only way to isolate one placement.
 */
export function PlacementMoMTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const pageRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const controls = usePivotReportControls("placement-mom", pageRange);
  const result = usePlacementMoMQuery(controls.query, enabled && controls.canRun);

  return (
    <PivotReportShell controls={controls} result={result}>
      {(data, ui) => {
        const sections = [
          {
            key: "sp",
            title: "Sponsored Products — Placement",
            tree: data.sp_tree,
            totals: data.section_totals.sp_tree,
            expandedDepth: 1,
            file: "placement-mom-sp",
          },
          {
            key: "sb",
            title: "Sponsored Brands — Placement",
            tree: data.sb_tree,
            totals: data.section_totals.sb_tree,
            expandedDepth: 0,
            file: "placement-mom-sb",
          },
        ].filter((s) => s.tree.length > 0);

        if (sections.length === 0) {
          return (
            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
              No data for this date range.
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-6">
            {sections.map((s, i) => (
              <PivotReportCard
                key={s.key}
                {...ui}
                tableKey={`${ui.tableKey}:${s.key}`}
                title={s.title}
                data={{ ...data, tree: s.tree, totals: s.totals, warnings: i === 0 ? data.warnings : [] }}
                rootLabel="Placement"
                exportFilename={s.file}
                defaultExpandedDepth={s.expandedDepth}
                enableTopLevelFilter
              />
            ))}
          </div>
        );
      }}
    </PivotReportShell>
  );
}