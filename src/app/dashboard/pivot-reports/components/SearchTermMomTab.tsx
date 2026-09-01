// components/SearchTermMomTab.tsx
"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { useSearchTermMomQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { PivotTreeTable } from "./PivotTreeTable";

export function SearchTermMomTab({
  startDate,
  endDate,
  enabled,
}: {
  startDate: string;
  endDate: string;
  enabled: boolean;
}) {
  const { data, isLoading, isError, error } = useSearchTermMomQuery(startDate, endDate, enabled);

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
        Couldn&apos;t load Search Term data{error instanceof Error ? `: ${error.message}` : "."}
      </div>
    );
  }

  if (!data) return null;

  const periodLabel = `${data.current_period.start_date} to ${data.current_period.end_date} vs. previous period (${data.previous_period.start_date} to ${data.previous_period.end_date})`;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800">Search Term — Month over Month</h2>
        <p className="text-xs text-slate-500">{periodLabel}</p>
      </div>
      <PivotTreeTable
        tree={data.tree}
        rootLabel="Tag"
        defaultExpandedDepth={1}
        enableTopLevelFilter
        enableExport
        exportFilename="search-term-mom"
      />
    </section>
  );
}