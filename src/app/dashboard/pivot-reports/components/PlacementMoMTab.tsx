// PlacementMoMTab.tsx
"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { usePlacementMoMQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { PivotTreeTable } from "./PivotTreeTable";
import { PivotFilterBar, usePivotFilters, type PivotFilterDef } from "./PivotFilterBar";

const PLACEMENT_FILTER_DEFS: PivotFilterDef[] = [
  {
    key: "adType",
    label: "Ad Type",
    options: [
      { value: "Sponsored Products", label: "Sponsored Products" },
      { value: "Sponsored Brands", label: "Sponsored Brands" },
    ],
  },
];

export function PlacementMoMTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const { data, isLoading, isError, error } = usePlacementMoMQuery(startDate, endDate, enabled);
  const { selected, onToggle, onClear, isSelected } = usePivotFilters(PLACEMENT_FILTER_DEFS);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
        Couldn&apos;t load Placement data{error instanceof Error ? `: ${error.message}` : "."}
      </div>
    );
  }

  if (!data) return null;

  const periodLabel = `${data.current_period.start_date} to ${data.current_period.end_date} vs. previous period (${data.previous_period.start_date} to ${data.previous_period.end_date})`;
  const showSP = isSelected("adType", "Sponsored Products");
  const showSB = isSelected("adType", "Sponsored Brands");

  return (
    <div className="flex flex-col gap-6">
      <PivotFilterBar filters={PLACEMENT_FILTER_DEFS} selected={selected} onToggle={onToggle} onClear={onClear} />

      {showSP && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Sponsored Products — Placement</h2>
            <p className="text-xs text-slate-500">{periodLabel}</p>
          </div>
          <PivotTreeTable
            tree={data.sp_tree}
            rootLabel="Placement"
            defaultExpandedDepth={1}
            enableTopLevelFilter
            enableExport
            exportFilename="placement-mom-sp"
          />
        </section>
      )}

      {showSB && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Sponsored Brands — Placement</h2>
            <p className="text-xs text-slate-500">{periodLabel}</p>
          </div>
          <PivotTreeTable
            tree={data.sb_tree}
            rootLabel="Placement"
            defaultExpandedDepth={0}
            enableTopLevelFilter
            enableExport
            exportFilename="placement-mom-sb"
          />
        </section>
      )}
    </div>
  );
}