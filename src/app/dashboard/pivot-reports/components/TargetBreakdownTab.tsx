"use client";
import React, { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useTargetBreakdownQuery } from "@/lib/hooks/queries/use-pivot-reports";
import { useTagTypesQuery } from "@/lib/hooks/queries/use-tag-types";
import { useTagsForTagTypes } from "@/lib/hooks/queries/use-tags";
import { PivotTreeTable } from "./PivotTreeTable";
import { PivotFilterBar, usePivotFilters, type PivotFilterDef } from "./PivotFilterBar";

const AD_TYPE_OPTIONS = [
  { value: "SP", label: "Sponsored Products" },
  { value: "SB", label: "Sponsored Brands" },
  { value: "SD", label: "Sponsored Display" },
];

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

  // "Group by" — unchanged single-select dimension, same as before.
  const groupByFilterDefs: PivotFilterDef[] = [
    {
      key: "groupBy",
      label: "Group by",
      mode: "single",
      required: true,
      loading: tagTypesLoading,
      options: (tagTypes ?? []).map((tt) => ({ value: tt.id, label: tt.name })),
    },
  ];
  const { selected: groupBySelected, onToggle: onGroupByToggle, onClear: onGroupByClear } = usePivotFilters(
    groupByFilterDefs,
    "pivot-reports:tag-type:target-breakdown"
  );
  const groupByTagTypeId = groupBySelected.groupBy?.[0] ?? null;

  // Additional narrowing dimensions — the user picks WHICH TagTypes to
  // filter by (any number, added/removed freely), then PivotFilterBar
  // renders one multi-select per active dimension using the same
  // generic component as everything else in this app.
  const [activeFilterTagTypeIds, setActiveFilterTagTypeIds] = useState<string[]>([]);
  const tagsByTagType = useTagsForTagTypes(activeFilterTagTypeIds);

  function addFilterDimension(tagTypeId: string) {
    if (!tagTypeId || activeFilterTagTypeIds.includes(tagTypeId)) return;
    setActiveFilterTagTypeIds((prev) => [...prev, tagTypeId]);
  }
  function removeFilterDimension(tagTypeId: string) {
    setActiveFilterTagTypeIds((prev) => prev.filter((id) => id !== tagTypeId));
  }

  const dimensionFilterDefs: PivotFilterDef[] = activeFilterTagTypeIds.map((tagTypeId) => {
    const tagType = (tagTypes ?? []).find((tt) => tt.id === tagTypeId);
    const entry = tagsByTagType[tagTypeId];
    return {
      key: `dim:${tagTypeId}`,
      label: tagType?.name ?? "Loading…",
      loading: entry?.isLoading ?? true,
      options: (entry?.tags ?? []).map((tag) => ({ value: tag.id, label: tag.name })),
    };
  });

  const adTypeFilterDef: PivotFilterDef = {
    key: "adTypes",
    label: "Ad Type",
    options: AD_TYPE_OPTIONS,
  };

  const allFilterDefs = [...dimensionFilterDefs, adTypeFilterDef];
  const { selected, onToggle, onClear } = usePivotFilters(allFilterDefs, "pivot-reports:filters:target-breakdown");

  // Build the {tag_type_id: [tag_id, ...]} shape the query hook expects
  // from the "dim:<id>" keyed selections.
  const tagFilters: Record<string, string[]> = {};
  activeFilterTagTypeIds.forEach((tagTypeId) => {
    tagFilters[tagTypeId] = selected[`dim:${tagTypeId}`] ?? [];
  });

  // Empty selection = "all three" (matches backend default), same as an
  // unchecked filter meaning "don't narrow" everywhere else in this app.
  const selectedAdTypes = selected.adTypes ?? [];
  const effectiveAdTypes = selectedAdTypes.length > 0 ? selectedAdTypes : ["SP", "SB", "SD"];

  const { data, isLoading, isError, error } = useTargetBreakdownQuery(
    startDate,
    endDate,
    groupByTagTypeId,
    tagFilters,
    effectiveAdTypes,
    enabled
  );

  const availableToAdd = (tagTypes ?? []).filter((tt) => !activeFilterTagTypeIds.includes(tt.id));

  return (
    <div className="flex flex-col gap-6">
      <PivotFilterBar filters={groupByFilterDefs} selected={groupBySelected} onToggle={onGroupByToggle} onClear={onGroupByClear} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">Additional filters</span>
          {activeFilterTagTypeIds.map((tagTypeId) => {
            const tagType = (tagTypes ?? []).find((tt) => tt.id === tagTypeId);
            return (
              <span
                key={tagTypeId}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                {tagType?.name ?? "…"}
                <button
                  type="button"
                  aria-label={`Remove ${tagType?.name ?? "filter"} dimension`}
                  onClick={() => removeFilterDimension(tagTypeId)}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
          {availableToAdd.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                value=""
                onChange={(e) => addFilterDimension(e.target.value)}
                className="h-8 rounded-full border border-dashed border-slate-300 bg-white pl-2 pr-6 text-xs font-medium text-slate-500 hover:border-slate-400 focus:outline-none appearance-none"
              >
                <option value="" disabled>
                  + Add filter
                </option>
                {availableToAdd.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name}
                  </option>
                ))}
              </select>
              <Plus className="pointer-events-none absolute right-1.5 size-3 text-slate-400" />
            </div>
          )}
        </div>

        <PivotFilterBar filters={allFilterDefs} selected={selected} onToggle={onToggle} onClear={onClear} />
      </div>

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
            defaultExpandedDepth={0}
            enableTopLevelFilter
            enableExport
            exportFilename="target-breakdown"
          />
        </section>
      ) : null}
    </div>
  );
}