// app/dashboard/pivot-reports/components/PivotControlsBar.tsx
"use client";

/**
 * PivotControlsBar — the control surface every pivot tab renders above its report.
 *
 *   [ date range ]  [ Compare: On/Off ]  [ Group by ▾ ]  [ Filters + ]            [ Reset ]
 *   [ chip ×  chip ×  Including untagged × ]  Clear filters
 *
 * - The tab (backend preset) decides the primary dimension, so there is NO group-by dropdown
 *   unless `controls.canChooseGroupBy` (Target Breakdown, or a client with no default tag type).
 * - Compare is hidden entirely on presets that do not support comparison (Summary).
 * - All narrowing lives in <PivotFilterPopover/>; active filters render as removable chips.
 *
 * Also exports <PivotResponseNotices/>: backend data-quality warnings and comparison caveats
 * (different length / overlapping ranges) shown above the table.
 */
import React, { useState } from "react";
import { CalendarRange, X } from "lucide-react";
import type { PivotComparisonInfo } from "@/lib/hooks/queries/use-pivot-reports";
import type { PivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotFilterPopover } from "./PivotFilterPopover";
import { PivotDateRangeModal, fromIsoDate, previousRangeOf } from "./PivotDateRangeModal";

const fmt = (iso: string) =>
  fromIsoDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtRange = (r: { startDate: string; endDate: string }) => `${fmt(r.startDate)} – ${fmt(r.endDate)}`;

export function PivotControlsBar({ controls }: { controls: PivotReportControls }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [popover, setPopover] = useState<{ open: boolean; focusKey: string | null }>({ open: false, focusKey: null });
  const { slot, compareOn } = controls;
  const comparedRange = controls.comparisonRange ?? previousRangeOf(controls.current);
  const hasChips = controls.chips.length > 0 || controls.includeUntagged;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <CalendarRange className="size-4 text-slate-400" />
          <span>{fmtRange(controls.current)}</span>
          {compareOn && <span className="text-xs font-normal text-slate-500">vs {fmtRange(comparedRange)}</span>}
        </button>
        {controls.isCustomCurrent && (
          <button type="button" onClick={controls.resetCurrentToPage} className="text-xs text-slate-500 underline hover:text-slate-800">
            Use page dates
          </button>
        )}

        {controls.supportsComparison && (
          <button
            type="button"
            role="switch"
            aria-checked={compareOn}
            onClick={() => controls.setComparisonEnabled(!controls.comparisonEnabled)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            Compare
            <span
              className={`rounded px-1.5 text-xs font-semibold ${
                compareOn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {compareOn ? "On" : "Off"}
            </span>
          </button>
        )}

        {/* Only when the report genuinely needs the user to choose its tag type. */}
        {slot && controls.canChooseGroupBy && (
          <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-1 text-sm text-slate-600">
            {slot.label}
            <select
              value={controls.groupBy ?? ""}
              onChange={(e) => controls.setGroupBy(e.target.value || null)}
              className="h-7 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 focus:border-[#1a2b3c] focus:outline-none"
            >
              {!controls.groupBy && <option value="">Select…</option>}
              {slot.tag_types.map((tt) => (
                <option key={tt.id} value={tt.id}>
                  {tt.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <PivotFilterPopover
          dimensions={controls.dimensions}
          selected={controls.selected}
          includeUntagged={controls.includeUntagged}
          showUntaggedToggle={controls.showUntaggedToggle}
          activeCount={controls.activeFilterCount}
          open={popover.open}
          focusKey={popover.focusKey}
          onOpenChange={(open) => setPopover((p) => ({ open, focusKey: open ? p.focusKey : null }))}
          onApply={controls.applyFilters}
        />

        {controls.isDirty && (
          <button type="button" onClick={controls.resetAll} className="ml-auto text-sm text-slate-500 hover:text-slate-800">
            Reset
          </button>
        )}
      </div>

      {hasChips && (
        <div className="flex flex-wrap items-center gap-2">
          {controls.chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-2.5 pr-1 text-xs text-slate-700"
            >
              <button
                type="button"
                title="Edit filter"
                onClick={() => setPopover({ open: true, focusKey: chip.key })}
                className="inline-flex max-w-[16rem] items-center gap-1 truncate"
              >
                <span className="text-slate-400">{chip.label}:</span>
                <span className="truncate">{chip.summary}</span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${chip.label} filter`}
                onClick={() => controls.removeFilter(chip.key)}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {controls.includeUntagged && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-2.5 pr-1 text-xs text-slate-700">
              Including untagged
              <button
                type="button"
                aria-label="Stop including untagged rows"
                onClick={() => controls.setIncludeUntagged(false)}
                className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          <button type="button" onClick={controls.clearFilters} className="px-1 text-xs text-slate-500 hover:text-slate-800">
            Clear filters
          </button>
        </div>
      )}

      <PivotDateRangeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        current={controls.current}
        comparisonRange={controls.comparisonRange}
        comparisonEnabled={compareOn}
        supportsComparison={controls.supportsComparison}
        onApply={({ current, comparisonRange }) => {
          controls.setCustomCurrent(current);
          controls.setComparisonRange(comparisonRange);
        }}
      />
    </div>
  );
}

/** Backend warnings + comparison caveats. Renders nothing when there is nothing to say. */
export function PivotResponseNotices({
  warnings,
  comparison,
}: {
  warnings?: string[];
  comparison?: PivotComparisonInfo;
}) {
  const notes: string[] = [...(warnings ?? [])];
  if (comparison?.enabled && comparison.same_length === false) {
    notes.push("The comparison range is a different length than the current range; deltas may be misleading.");
  }
  if (comparison?.enabled && comparison.overlaps_current) {
    notes.push("The comparison range overlaps the current range.");
  }
  if (notes.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <ul className="list-disc space-y-1 pl-4">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}