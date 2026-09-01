// components/TargetBreakdownTab.tsx (rename file from AsinTyLyTab.tsx)
"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { useTargetBreakdownQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { useTagTypesQuery } from "@/lib/hooks/queries/use-tag-types";
import { PivotTreeTable } from "./PivotTreeTable";
import { PivotFilterBar, usePivotFilters, type PivotFilterDef } from "./PivotFilterBar";

export function TargetBreakdownTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const { data: tagTypes, isLoading: tagTypesLoading } = useTagTypesQuery("TARGET", enabled);

  const filterDefs: PivotFilterDef[] = [
    {
      key: "groupBy",
      label: "Group by",
      mode: "single",
      required: true,
      loading: tagTypesLoading,
      options: (tagTypes ?? []).map((tt) => ({ value: tt.id, label: tt.name })),
    },
  ];

  const { selected, onToggle, onClear } = usePivotFilters(filterDefs, "pivot-reports:tag-type:target-breakdown");
  const groupByTagTypeId = selected.groupBy?.[0] ?? null;

  const { data, isLoading, isError, error } = useTargetBreakdownQuery(startDate, endDate, groupByTagTypeId, enabled);

  return (
    <div className="flex flex-col gap-6">
      <PivotFilterBar filters={filterDefs} selected={selected} onToggle={onToggle} onClear={onClear} />

      {!tagTypesLoading && (tagTypes ?? []).length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
          No data for this date range.
        </div>
      ) : !groupByTagTypeId ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
          Select a tag type above to view this report.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
          <Loader2 className="size-4 animate-spin" /> Loading...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          Couldn&apos;t load Target Breakdown data{error instanceof Error ? `: ${error.message}` : "."}
        </div>
      ) : data ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Target Breakdown</h2>
            <p className="text-xs text-slate-500">
              {data.current_period.start_date} to {data.current_period.end_date} vs. previous period (
              {data.previous_period.start_date} to {data.previous_period.end_date})
            </p>
          </div>
          <PivotTreeTable
            tree={data.tree}
            rootLabel="Tag"
            defaultExpandedDepth={1}
            enableTopLevelFilter
            enableExport
            exportFilename="target-breakdown"
          />
        </section>
      ) : null}
    </div>
  );
}