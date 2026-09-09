// PivotFilterBar.tsx
"use client";
import React, { useState } from "react";
import { Check, ChevronDown, Filter, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

export interface PivotFilterOption {
  value: string;
  label: string;
}

export interface PivotFilterDef {
  key: string;
  label: string;
  options: PivotFilterOption[];
  /** "multi" (default): optional, toggle any number on/off — narrows what's shown.
   *  "single": exactly one selectable at a time — usually drives the query itself, not just display. */
  mode?: "multi" | "single";
  /** Only meaningful with mode "single". Blocks deselecting down to zero and is skipped by "Clear all". */
  required?: boolean;
  /** Options are still loading (e.g. an API-backed filter like tag types). */
  loading?: boolean;
}

export function PivotFilterBar({
  filters,
  selected,
  onToggle,
  onClear,
}: {
  filters: PivotFilterDef[];
  selected: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // "Clear all" only counts/clears non-required filters — a required
  // single-select always has to leave the report with something to query.
  const clearableCount = Object.entries(selected)
    .filter(([key]) => !filters.find((f) => f.key === key)?.required)
    .reduce((sum, [, values]) => sum + values.length, 0);

  if (filters.length === 0) return null;

  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Filters">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#1a2b3c] text-white">
            <Filter className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
            <p className="text-xs text-slate-500">Narrow down what&apos;s shown below</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const filterSelected = selected[filter.key] ?? [];
            const selectedLabel =
              filter.mode === "single" && filterSelected.length > 0
                ? filter.options.find((o) => o.value === filterSelected[0])?.label
                : undefined;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(activeFilter === filter.key ? null : filter.key)}
                disabled={filter.loading}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  activeFilter === filter.key
                    ? "border-[#1a2b3c] bg-[#1a2b3c] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="size-3.5" />
                {filter.label}
                {filter.loading ? (
                  <span className="text-xs opacity-70">loading…</span>
                ) : selectedLabel ? (
                  <span className="max-w-[10rem] truncate text-xs opacity-90">{selectedLabel}</span>
                ) : (
                  filterSelected.length > 0 && (
                    <span className="rounded-full bg-white/20 px-1.5 text-xs">{filterSelected.length}</span>
                  )
                )}
                <ChevronDown className="size-3.5" />
              </button>
            );
          })}
          {clearableCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="size-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {activeFilter &&
        (() => {
          const filter = filters.find((f) => f.key === activeFilter)!;
          const filterSelected = selected[filter.key] ?? [];
          const isSingle = filter.mode === "single";

          if (filter.loading) {
            return (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
                Loading options…
              </div>
            );
          }

          if (filter.options.length === 0) {
            return (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
                No options available.
              </div>
            );
          }

          return (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {filter.options.map((option) => {
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
                        {checked && (isSingle ? <span className="size-1.5 rounded-full bg-white" /> : <Check className="size-3" />)}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {Object.values(selected).some((v) => v.length > 0) && (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3">
          {Object.entries(selected).flatMap(([key, values]) => {
            const def = filters.find((f) => f.key === key);
            const removable = !(def?.mode === "single" && def?.required);
            return values.map((value) => {
              const label = def?.options.find((o) => o.value === value)?.label ?? value;
              return (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                >
                  {label}
                  {removable && (
                    <button type="button" aria-label={`Remove ${label} filter`} onClick={() => onToggle(key, value)}>
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              );
            });
          })}
        </div>
      )}
    </section>
  );
}

export function usePivotFilters(filters: PivotFilterDef[], persistKey?: string) {
  const persisted = usePersistedState<Record<string, string[]>>(persistKey ?? "__unused__", {});
  const plain = useState<Record<string, string[]>>({});
  const [selected, setSelected] = persistKey ? persisted : plain;

  function onToggle(key: string, value: string) {
    const def = filters.find((f) => f.key === key);
    setSelected((current) => {
      const existing = current[key] ?? [];
      if (def?.mode === "single") {
        if (existing[0] === value) {
          // Clicking the already-selected value: no-op if required, else clear.
          return def.required ? current : { ...current, [key]: [] };
        }
        return { ...current, [key]: [value] };
      }
      const next = existing.includes(value) ? existing.filter((v) => v !== value) : [...existing, value];
      return { ...current, [key]: next };
    });
  }

  function onClear() {
    setSelected((current) => {
      const next: Record<string, string[]> = {};
      for (const [key, values] of Object.entries(current)) {
        if (filters.find((f) => f.key === key)?.required) next[key] = values;
      }
      return next;
    });
  }

  function isSelected(key: string, value: string) {
    const values = selected[key];
    return !values || values.length === 0 || values.includes(value);
  }

  return { selected, onToggle, onClear, isSelected };
}