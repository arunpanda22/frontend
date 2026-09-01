// AdTypeMoMTab.tsx
"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { useAdTypeMoMQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { PivotTreeTable } from "./PivotTreeTable";
import { PivotFilterBar, usePivotFilters, type PivotFilterDef } from "./PivotFilterBar";

const AD_TYPE_OPTIONS = ["Sponsored Products", "Sponsored Brands", "Sponsored Display"];

const AD_TYPE_FILTER_DEFS: PivotFilterDef[] = [
  {
    key: "adType",
    label: "Ad Type",
    // node.name IS the human label already ("Sponsored Products", etc.) —
    // value and label are the same string here, no id mapping needed.
    options: AD_TYPE_OPTIONS.map((name) => ({ value: name, label: name })),
  },
];

export function AdTypeMoMTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const { data, isLoading, isError, error } = useAdTypeMoMQuery(startDate, endDate, enabled);
  const { selected, onToggle, onClear, isSelected } = usePivotFilters(AD_TYPE_FILTER_DEFS);

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
        Couldn&apos;t load Ad Type data{error instanceof Error ? `: ${error.message}` : "."}
      </div>
    );
  }

  if (!data) return null;

  const periodLabel = `${data.current_period.start_date} to ${data.current_period.end_date} vs. previous period (${data.previous_period.start_date} to ${data.previous_period.end_date})`;

  const visibleTree = data.tree.filter((node) => isSelected("adType", node.name));

  return (
    <div className="flex flex-col gap-6">
      <PivotFilterBar filters={AD_TYPE_FILTER_DEFS} selected={selected} onToggle={onToggle} onClear={onClear} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Ad Type — Month over Month</h2>
          <p className="text-xs text-slate-500">{periodLabel}</p>
        </div>
        <PivotTreeTable
          tree={visibleTree}
          rootLabel="Ad Type"
          defaultExpandedDepth={1}
          enableTopLevelFilter
          enableExport
          exportFilename="ad-type-mom"
        />
      </section>
    </div>
  );
}