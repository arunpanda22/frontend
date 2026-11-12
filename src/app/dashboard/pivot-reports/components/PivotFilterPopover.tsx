// app/dashboard/pivot-reports/components/PivotFilterPopover.tsx
"use client";

/**
 * PivotFilterPopover — the single filter interface for every pivot tab.
 *
 * Flow: open -> pick a dimension (left) -> tick values (right) -> optionally switch to
 * another dimension and repeat -> Apply. Edits live in a DRAFT; nothing is sent to the
 * backend (no refetch) until Apply. Cancel/Escape/outside-click discard the draft.
 *
 * Dimensions come from the controls hook (built from the meta endpoint); this component
 * hardcodes no tag names or values. Tag values are fetched lazily with useTagsQuery for the
 * dimension being viewed (same ['tags', id] cache as the chips' labels). Tag dimensions also
 * offer "(Not Tagged)" (blank token "~").
 *
 * Semantics: OR within a dimension, AND across dimensions (backend filtering.py).
 * `showUntaggedToggle` is true on slot presets only; it maps to include_untagged=true.
 *
 * Open state is controlled by the parent so a chip click can open the popover on its dimension.
 * Hand-rolled popover (outside click + Escape) to avoid assuming shadcn import paths.
 */
import React, { useEffect, useRef, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { useTagsQuery } from "@/lib/hooks/queries/use-tags";
import { PIVOT_BLANK_TOKEN } from "@/lib/hooks/queries/use-pivot-reports";
import type { FilterSelection, PivotFilterDimension } from "../hooks/use-pivot-report-controls";

const SEARCH_THRESHOLD = 10;

export function PivotFilterPopover({
  dimensions,
  selected,
  includeUntagged,
  showUntaggedToggle,
  activeCount,
  open,
  focusKey,
  onOpenChange,
  onApply,
}: {
  dimensions: PivotFilterDimension[];
  selected: FilterSelection;
  includeUntagged: boolean;
  showUntaggedToggle: boolean;
  activeCount: number;
  open: boolean;
  /** Dimension to show first when opening (e.g. from a chip click). */
  focusKey: string | null;
  onOpenChange: (open: boolean) => void;
  onApply: (next: { selected: FilterSelection; includeUntagged: boolean }) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<FilterSelection>({});
  const [draftUntagged, setDraftUntagged] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Re-seed the draft from committed state each time the popover opens.
  useEffect(() => {
    if (!open) return;
    setDraft(selected);
    setDraftUntagged(includeUntagged);
    setActiveKey(focusKey ?? dimensions[0]?.key ?? null);
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const activeDim = dimensions.find((d) => d.key === activeKey) ?? null;
  const tagQuery = useTagsQuery(activeDim?.kind === "tag" ? (activeDim.tagTypeId ?? null) : null, open);
  const optionsLoading = activeDim?.kind === "tag" && tagQuery.isLoading;
  const options =
    activeDim?.kind === "tag"
      ? [
          ...(tagQuery.data ?? []).map((t) => ({ value: t.id, label: t.name })),
          { value: PIVOT_BLANK_TOKEN, label: "(Not Tagged)" },
        ]
      : (activeDim?.options ?? []);

  const query = search.trim().toLowerCase();
  const visibleOptions = query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options;
  const activeValues = activeKey ? (draft[activeKey] ?? []) : [];

  function selectDimension(key: string) {
    setActiveKey(key);
    setSearch("");
  }

  function toggleValue(value: string) {
    if (!activeKey) return;
    setDraft((cur) => {
      const existing = cur[activeKey] ?? [];
      const next = existing.includes(value) ? existing.filter((v) => v !== value) : [...existing, value];
      return { ...cur, [activeKey]: next };
    });
  }

  function clearActiveDimension() {
    if (!activeKey) return;
    setDraft((cur) => ({ ...cur, [activeKey]: [] }));
  }

  function apply() {
    onApply({ selected: draft, includeUntagged: draftUntagged });
    onOpenChange(false);
  }

  function clearDraft() {
    setDraft({});
    setDraftUntagged(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => onOpenChange(!open)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
          open ? "border-[#1a2b3c] text-[#1a2b3c]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
        } bg-white`}
      >
        <Filter className="size-4 text-slate-400" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-700">{activeCount}</span>
        ) : (
          <Plus className="size-3.5 text-slate-400" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filters"
          className="absolute left-0 top-full z-30 mt-2 w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {dimensions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No filters available for this report.</div>
          ) : (
            <div className="grid grid-cols-[11rem_1fr]">
              {/* Dimensions */}
              <nav className="max-h-80 overflow-y-auto border-r border-slate-100 bg-slate-50/60 p-2">
                {dimensions.map((dim) => {
                  const count = draft[dim.key]?.length ?? 0;
                  const isActive = dim.key === activeKey;
                  return (
                    <button
                      key={dim.key}
                      type="button"
                      onClick={() => selectDimension(dim.key)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${
                        isActive ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/70"
                      }`}
                    >
                      <span className="truncate">{dim.label}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-[#1a2b3c] px-1.5 text-[10px] font-medium text-white">{count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Values */}
              <div className="flex max-h-80 min-w-0 flex-col p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {activeDim?.label ?? "Select a filter"}
                  </p>
                  {activeValues.length > 0 && (
                    <button type="button" onClick={clearActiveDimension} className="text-xs text-slate-500 hover:text-slate-800">
                      Clear
                    </button>
                  )}
                </div>

                {options.length > SEARCH_THRESHOLD && (
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${activeDim?.label.toLowerCase() ?? ""}…`}
                      className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-sm focus:border-[#1a2b3c] focus:outline-none"
                    />
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {optionsLoading ? (
                    <p className="py-6 text-center text-sm text-slate-400">Loading values…</p>
                  ) : visibleOptions.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">No matches.</p>
                  ) : (
                    visibleOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={activeValues.includes(option.value)}
                          onChange={() => toggleValue(option.value)}
                          className="size-4 rounded border-slate-300"
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3">
            {showUntaggedToggle && (
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={draftUntagged}
                  onChange={(e) => setDraftUntagged(e.target.checked)}
                  className="size-4 rounded border-slate-300"
                />
                Also show untagged rows
              </label>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={clearDraft} className="h-8 px-2 text-sm text-slate-500 hover:text-slate-800">
                Clear all
              </button>
              <button
                type="button"
                onClick={apply}
                className="h-8 rounded-lg bg-[#1a2b3c] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}