// PivotFilterBar.tsx
"use client";
import React, { useState } from "react";
import { Check, ChevronDown, Filter, Plus, RotateCcw, Search, X } from "lucide-react";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

export interface PivotFilterOption {
  value: string;
  label: string;
}

export interface PivotFilterDef {
  key: string;
  label: string;
  options: PivotFilterOption[];
  /** "multi" (default): optional, any number selectable. "single": exactly one at a time. */
  mode?: "multi" | "single";
  /** Only meaningful with mode "single". Can't be deselected and is skipped by "Clear all". */
  required?: boolean;
  /** Options are still loading (API-backed filters). */
  loading?: boolean;
  /** Shows a small × on the filter button; clicking it calls onRemoveFilter(key). */
  removable?: boolean;
}

export interface PivotFilterAddControl {
  label: string;
  options: PivotFilterOption[];
  /** Return the key of the filter that was just added to auto-open its options panel. */
  onAdd: (value: string) => string | void;
}

const ADD_PANEL_KEY = "__add__";
const SEARCH_THRESHOLD = 12;

export function PivotFilterBar({
  filters,
  selected,
  onToggle,
  onClear,
  addControl,
  onRemoveFilter,
}: {
  filters: PivotFilterDef[];
  selected: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
  onClear: () => void;
  addControl?: PivotFilterAddControl;
  onRemoveFilter?: (key: string) => void;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function openPanel(key: string | null) {
    setActiveKey(key);
    setSearch("");
  }

  if (filters.length === 0 && !addControl) return null;

  const clearableCount = filters.reduce(
    (sum, f) => (f.required ? sum : sum + (selected[f.key]?.length ?? 0)),
    0
  );

  const pills = filters
    .filter((f) => !f.required)
    .flatMap((f) =>
      (selected[f.key] ?? []).map((value) => ({
        filter: f,
        value,
        label: f.options.find((o) => o.value === value)?.label ?? (f.loading ? "…" : "Unknown"),
      }))
    );

  function renderPanel() {
    if (!activeKey) return null;

    if (activeKey === ADD_PANEL_KEY) {
      if (!addControl) return null;
      return (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="mb-2 text-xs text-slate-500">Filter by another dimension</p>
          <div className="flex flex-wrap gap-2">
            {addControl.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const newKey = addControl.onAdd(option.value);
                  openPanel(typeof newKey === "string" ? newKey : null);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-[#1a2b3c]/40"
              >
                <Plus className="size-3.5 text-slate-400" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const filter = filters.find((f) => f.key === activeKey);
    if (!filter) return null;

    if (filter.loading) {
      return (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">Loading options…</div>
      );
    }
    if (filter.options.length === 0) {
      return (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
          No options available.
        </div>
      );
    }

    const isSingle = filter.mode === "single";
    const filterSelected = selected[filter.key] ?? [];
    const query = search.trim().toLowerCase();
    const visibleOptions = query
      ? filter.options.filter((o) => o.label.toLowerCase().includes(query))
      : filter.options;

    return (
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        {filter.options.length > SEARCH_THRESHOLD && (
          <div className="relative mb-3 max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${filter.label.toLowerCase()}…`}
              className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-sm focus:border-[#1a2b3c] focus:outline-none"
            />
          </div>
        )}
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {visibleOptions.length === 0 ? (
            <span className="text-sm text-slate-400">No matches.</span>
          ) : (
            visibleOptions.map((option) => {
              const checked = filterSelected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onToggle(filter.key, option.value)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-[#1a2b3c] bg-[#1a2b3c]/10 text-[#1a2b3c]"
                      : "border-slate-200 bg-white hover:border-[#1a2b3c]/40"
                  }`}
                >
                  <span
                    className={`flex size-4 items-center justify-center border ${
                      isSingle ? "rounded-full" : "rounded"
                    } ${checked ? "border-[#1a2b3c] bg-[#1a2b3c] text-white" : "border-slate-300"}`}
                  >
                    {checked &&
                      (isSingle ? <span className="size-1.5 rounded-full bg-white" /> : <Check className="size-3" />)}
                  </span>
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Filters">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="mr-1 flex size-9 items-center justify-center rounded-lg bg-[#1a2b3c] text-white">
          <Filter className="size-4" />
        </div>

        {filters.map((filter) => {
          const isActive = activeKey === filter.key;
          const filterSelected = selected[filter.key] ?? [];
          const singleLabel =
            filter.mode === "single" && filterSelected.length > 0
              ? filter.options.find((o) => o.value === filterSelected[0])?.label
              : undefined;

          return (
            <div
              key={filter.key}
              className={`inline-flex h-9 items-stretch overflow-hidden rounded-lg border text-sm font-medium transition ${
                isActive ? "border-[#1a2b3c] bg-[#1a2b3c] text-white" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <button
                type="button"
                aria-expanded={isActive}
                onClick={() => openPanel(isActive ? null : filter.key)}
                className={`inline-flex items-center gap-2 px-3 ${isActive ? "" : "hover:bg-slate-50"}`}
              >
                <span>{filter.label}</span>
                {filter.loading ? (
                  <span className="text-xs opacity-70">loading…</span>
                ) : singleLabel ? (
                  <span className="max-w-[10rem] truncate text-xs opacity-90">{singleLabel}</span>
                ) : filterSelected.length > 0 ? (
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      isActive ? "bg-white/20" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {filterSelected.length}
                  </span>
                ) : null}
                <ChevronDown className="size-3.5" />
              </button>
              {filter.removable && (
                <button
                  type="button"
                  aria-label={`Remove ${filter.label} filter`}
                  onClick={() => {
                    if (isActive) openPanel(null);
                    onRemoveFilter?.(filter.key);
                  }}
                  className={`flex items-center border-l px-2 ${
                    isActive
                      ? "border-white/20 hover:bg-white/10"
                      : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {addControl && addControl.options.length > 0 && (
          <button
            type="button"
            aria-expanded={activeKey === ADD_PANEL_KEY}
            onClick={() => openPanel(activeKey === ADD_PANEL_KEY ? null : ADD_PANEL_KEY)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            <Plus className="size-3.5" /> {addControl.label}
          </button>
        )}

        {clearableCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto inline-flex h-9 items-center gap-1.5 px-2 text-sm text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="size-3.5" /> Clear all
          </button>
        )}
      </div>

      {renderPanel()}

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3">
          {pills.map(({ filter, value, label }) => (
            <span
              key={`${filter.key}-${value}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
            >
              <span className="text-slate-500">{filter.label}:</span> {label}
              <button type="button" aria-label={`Remove ${label} from ${filter.label}`} onClick={() => onToggle(filter.key, value)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function usePivotFilters(filters: PivotFilterDef[], persistKey?: string) {
  // Both state hooks are always called (rules of hooks); persistKey only
  // decides which one is used. Pass a literal string, not a changing value.
  const persisted = usePersistedState<Record<string, string[]>>(persistKey ?? "pivot-filters:unpersisted", {});
  const local = useState<Record<string, string[]>>({});
  const [selected, setSelected] = persistKey ? persisted : local;

  function onToggle(key: string, value: string) {
    const def = filters.find((f) => f.key === key);
    setSelected((current) => {
      const existing = current[key] ?? [];
      if (def?.mode === "single") {
        if (existing[0] === value) {
          return def.required ? current : { ...current, [key]: [] };
        }
        return { ...current, [key]: [value] };
      }
      const next = existing.includes(value) ? existing.filter((v) => v !== value) : [...existing, value];
      return { ...current, [key]: next };
    });
  }

  /** Clears every non-required filter's selection. Required filters keep theirs. */
  function onClear() {
    setSelected((current) => {
      const next: Record<string, string[]> = {};
      for (const f of filters) {
        if (f.required && current[f.key]) next[f.key] = current[f.key];
      }
      return next;
    });
  }

  /** Drops one filter's selection entirely (used when a dimension is removed). */
  function onClearKey(key: string) {
    setSelected((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function isSelected(key: string, value: string) {
    const values = selected[key];
    return !values || values.length === 0 || values.includes(value);
  }

  return { selected, onToggle, onClear, onClearKey, isSelected };
}