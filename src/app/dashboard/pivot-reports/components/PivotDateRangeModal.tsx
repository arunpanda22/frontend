// app/dashboard/pivot-reports/components/PivotDateRangeModal.tsx
"use client";

/**
 * PivotDateRangeModal — pivot-specific date selection with TWO INDEPENDENT ranges, built on the
 * application's shared <AdvancedDatePicker/> (no second calendar implementation, no
 * react-date-range).
 *
 *   Current range     any range (picker with Quick Select sidebar).
 *   Compare against   "Previous period" (AUTO: same length, immediately before the current range,
 *                     computed with previousRangeOf — shown read-only) or "Custom range" (the same
 *                     picker, independent dates; need not touch the current range).
 *
 * STATE MODEL
 *   curDraft / cmpDraft are SEPARATE PivotDateRange objects (ISO YYYY-MM-DD strings, '' = unset).
 *   Only the active card's picker is mounted and it is CONTROLLED by its draft, so switching cards
 *   can never leak one range into the other and the picker is never stale. Nothing is committed
 *   until the modal's single Apply; Cancel/close discards both drafts. Drafts re-seed from props
 *   every time the modal opens.
 *
 * ISO CONTRACT: the picker speaks Date; this file converts with toIsoDate/fromIsoDate (exported,
 * unchanged) so the API always receives YYYY-MM-DD. previousRangeOf mirrors backend
 * periods.previous_range.
 *
 * `supportsComparison=false` (Summary) hides the compare card entirely.
 * `comparisonEnabled` only dims/annotates the compare card; the Compare on/off switch lives in
 * PivotControlsBar.
 */
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdvancedDatePicker, type DateRange } from "@/components/dashboard/ui/date-picker/advanced-date-picker";
import type { PivotDateRange } from "@/lib/hooks/queries/use-pivot-reports";

const pad = (n: number) => String(n).padStart(2, "0");
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIsoDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Same-length range ending the day before `r` starts (mirrors backend periods.previous_range). */
export function previousRangeOf(r: PivotDateRange): PivotDateRange {
  const start = fromIsoDate(r.startDate);
  const end = fromIsoDate(r.endDate);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return { startDate: toIsoDate(prevStart), endDate: toIsoDate(prevEnd) };
}

const EMPTY: PivotDateRange = { startDate: "", endDate: "" };
const isComplete = (r: PivotDateRange) => !!r.startDate && !!r.endDate;

const toPickerRange = (r: PivotDateRange): DateRange => ({
  startDate: r.startDate ? fromIsoDate(r.startDate) : null,
  endDate: r.endDate ? fromIsoDate(r.endDate) : null,
});
const fromPickerRange = (r: DateRange): PivotDateRange => ({
  startDate: r.startDate ? toIsoDate(r.startDate) : "",
  endDate: r.endDate ? toIsoDate(r.endDate) : "",
});

/** DD/MM/YYYY, matching the shared picker. */
const fmt = (iso: string) => fromIsoDate(iso).toLocaleDateString("en-GB");
const fmtRange = (r: PivotDateRange) => (isComplete(r) ? `${fmt(r.startDate)} – ${fmt(r.endDate)}` : "Select dates");

type Card = "current" | "compare";
type CompareMode = "auto" | "custom";

export function PivotDateRangeModal({
  open,
  onClose,
  current,
  comparisonRange,
  comparisonEnabled,
  supportsComparison = true,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  current: PivotDateRange;
  /** null = AUTO (previous period). */
  comparisonRange: PivotDateRange | null;
  comparisonEnabled: boolean;
  /** false hides the compare card (e.g. Summary). */
  supportsComparison?: boolean;
  onApply: (next: { current: PivotDateRange; comparisonRange: PivotDateRange | null }) => void;
}) {
  const [card, setCard] = useState<Card>("current");
  const [curDraft, setCurDraft] = useState<PivotDateRange>(current);
  const [cmpMode, setCmpMode] = useState<CompareMode>(comparisonRange ? "custom" : "auto");
  const [cmpDraft, setCmpDraft] = useState<PivotDateRange>(comparisonRange ?? previousRangeOf(current));
  /** true once the user has picked/seeded custom comparison dates; stops auto re-seeding. */
  const [cmpTouched, setCmpTouched] = useState(!!comparisonRange);

  // Re-seed every draft from props each time the modal opens (no stale state).
  useEffect(() => {
    if (!open) return;
    setCard("current");
    setCurDraft(current);
    setCmpMode(comparisonRange ? "custom" : "auto");
    setCmpDraft(comparisonRange ?? previousRangeOf(current));
    setCmpTouched(!!comparisonRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const curComplete = isComplete(curDraft);
  const autoCompared = curComplete ? previousRangeOf(curDraft) : null;
  const cmpComplete = isComplete(cmpDraft);
  const compareActive = supportsComparison;
  const canApply = curComplete && !(compareActive && cmpMode === "custom" && !cmpComplete);

  // ISO strings compare correctly as text.
  const overlaps =
    curComplete && cmpMode === "custom" && cmpComplete && cmpDraft.startDate <= curDraft.endDate && curDraft.startDate <= cmpDraft.endDate;

  function chooseCompareMode(mode: CompareMode) {
    setCmpMode(mode);
    // First time switching to Custom: start from the auto range so the picker opens somewhere useful.
    if (mode === "custom" && !cmpTouched && autoCompared) setCmpDraft(autoCompared);
  }

  function apply() {
    if (!canApply) return;
    onApply({
      current: curDraft,
      comparisonRange: compareActive && cmpMode === "custom" && cmpComplete ? cmpDraft : null,
    });
    onClose();
  }

  const cardBase = "flex flex-1 flex-col items-start gap-0.5 rounded-lg border px-4 py-2.5 text-left transition";
  const cardOn = "border-powder-blue-400 bg-powder-blue-50";
  const cardOff = "border-slate-200 bg-white hover:bg-slate-50";

  const compareSummary =
    cmpMode === "auto"
      ? autoCompared
        ? `Previous period · ${fmtRange(autoCompared)}`
        : "Previous period"
      : `Custom · ${fmtRange(cmpDraft)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            {supportsComparison ? "Pivot report date ranges" : "Pivot report date range"}
          </h3>
          <button type="button" aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-auto p-5">
          {/* Range cards: summary of both ranges + switch between them. */}
          {supportsComparison && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setCard("current")}
                className={`${cardBase} ${card === "current" ? cardOn : cardOff}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current range</span>
                <span className="text-sm font-medium text-slate-800">{fmtRange(curDraft)}</span>
              </button>
              <button
                type="button"
                onClick={() => setCard("compare")}
                className={`${cardBase} ${card === "compare" ? cardOn : cardOff} ${comparisonEnabled ? "" : "opacity-60"}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Compare against{comparisonEnabled ? "" : " (off)"}
                </span>
                <span className="text-sm font-medium text-slate-800">{compareSummary}</span>
              </button>
            </div>
          )}

          {card === "current" || !supportsComparison ? (
            <AdvancedDatePicker
              variant="embedded"
              showActions={false}
              value={toPickerRange(curDraft)}
              onChange={(range) => setCurDraft(fromPickerRange(range))}
              onClear={() => setCurDraft(EMPTY)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" checked={cmpMode === "auto"} onChange={() => chooseCompareMode("auto")} /> Previous period
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" checked={cmpMode === "custom"} onChange={() => chooseCompareMode("custom")} /> Custom range
                </label>
              </div>

              {cmpMode === "auto" ? (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  {autoCompared
                    ? `Comparing against ${fmtRange(autoCompared)} — same length as the current range, ending the day before it starts.`
                    : "Select a current range first."}
                </p>
              ) : (
                <AdvancedDatePicker
                  variant="embedded"
                  showActions={false}
                  value={toPickerRange(cmpDraft)}
                  onChange={(range) => {
                    setCmpDraft(fromPickerRange(range));
                    setCmpTouched(true);
                  }}
                  // Clear on the comparison picker means "no custom range": fall back to previous period.
                  onClear={() => {
                    setCmpMode("auto");
                    setCmpTouched(false);
                  }}
                />
              )}

              {overlaps && <p className="text-xs text-amber-700">This comparison range overlaps the current range.</p>}
              {!comparisonEnabled && (
                <p className="text-xs text-slate-500">Comparison is switched off; this applies once Compare is turned on.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!canApply}
            className="h-9 rounded-lg bg-[#1a2b3c] px-4 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}