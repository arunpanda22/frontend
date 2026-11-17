// app/dashboard/pivot-reports/components/PivotReportShell.tsx
"use client";

/**
 * PivotReportShell + PivotReportCard — shared scaffolding for every pivot tab.
 *
 *   const controls = usePivotReportControls("<preset-key>", pageRange);
 *   const result   = use<Tab>Query(controls.query, enabled && controls.canRun);
 *   <PivotReportShell controls={controls} result={result}>
 *     {(data, ui) => <PivotReportCard {...ui} title=... data={data} rootLabel=... exportFilename=... />}
 *   </PivotReportShell>
 *
 * Shell: controls bar + every non-data state (meta error, "choose a tag type", query loading/error).
 * Card:  title, compact period line, CSV/Excel export, notices, then PivotTreeTable.
 *
 * EXPORT lives in the card (not the table) so it can include the Grand Total row. It exports
 * the whole report as returned by the API. EXPORT_COLUMNS mirrors PivotTreeTable's DEFAULT_COLUMNS;
 * keep them in sync if columns change.
 *
 * tableKey: PivotTreeTable keeps expanded rows by index path, so it must remount when the DATA
 * changes but NOT while placeholder data is shown during a refetch. The shell only advances the
 * key once real (non-placeholder) data has arrived.
 *
 * enableTopLevelFilter: the in-table "All <things>" select. Only Placement uses it now, because
 * the meta endpoint cannot list placement values. Every other tab narrows via the Filters popover.
 */
import React, { useRef } from "react";
import { Download, Loader2 } from "lucide-react";
import { getPivotErrorMessage, type PivotReportResponse } from "@/lib/hooks/queries/use-pivot-reports";
import {
  downloadPivotTreeCsv,
  downloadPivotTreeXlsx,
  type ExportColumn,
} from "@/lib/utils/export-pivot-tree";
import type { PivotReportControls } from "../hooks/use-pivot-report-controls";
import { PivotControlsBar, PivotResponseNotices } from "./PivotControlsBar";
import { fromIsoDate } from "./PivotDateRangeModal";
import { PivotTreeTable } from "./PivotTreeTable";

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "impressions", label: "Impressions" },
  { key: "clicks", label: "Clicks" },
  { key: "sales", label: "Sales" },
  { key: "spend", label: "Spend" },
  { key: "orders", label: "Orders" },
  { key: "spend_share", label: "Spend %" },
  { key: "sales_share", label: "Sales %" },
  { key: "acos", label: "ACOS" },
  { key: "cvr", label: "CVR" },
];

const fmtDate = (iso: string) =>
  fromIsoDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtPeriod = (p: { start_date: string; end_date: string }) => `${fmtDate(p.start_date)} – ${fmtDate(p.end_date)}`;

/** The subset of a React Query result the shell needs. */
interface QueryLike<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isPlaceholderData: boolean;
}

export interface PivotShellUi {
  /** true while old data is shown during a refetch. */
  dimmed: boolean;
  /** pass to PivotReportCard so the table remounts only when real new data arrives. */
  tableKey: string;
}

/** Name of the currently selected group-by tag type (for the root column label / titles). */
export function slotTagTypeName(controls: PivotReportControls, fallback: string): string {
  return controls.slot?.tag_types.find((t) => t.id === controls.groupBy)?.name ?? fallback;
}

const box = "rounded-xl border bg-white shadow-sm";

export function PivotReportShell<T>({
  controls,
  result,
  children,
}: {
  controls: PivotReportControls;
  result: QueryLike<T>;
  children: (data: T, ui: PivotShellUi) => React.ReactNode;
}) {
  const signature = JSON.stringify(controls.query);
  const tableKeyRef = useRef(signature);
  if (!result.isPlaceholderData) tableKeyRef.current = signature;

  const { slot } = controls;
  let body: React.ReactNode = null;

  if (controls.metaError) {
    body = (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
        Couldn&apos;t load report settings: {getPivotErrorMessage(controls.metaError)}
      </div>
    );
  } else if (slot && !controls.groupBy && !controls.metaLoading) {
    const message =
      slot.tag_types.length === 0
        ? "No tag types are defined for this report yet."
        : slot.required
          ? "Choose what to group by above to view this report."
          : `No default tag type found for this client. Choose one under "${slot.label}" above.`;
    body = (
      <div className={`${box} flex items-center justify-center border-slate-200 py-16 text-sm text-slate-500`}>
        {message}
      </div>
    );
  } else if (result.isError) {
    body = (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
        Couldn&apos;t load data: {getPivotErrorMessage(result.error)}
      </div>
    );
  } else if (result.data) {
    body = children(result.data, { dimmed: result.isPlaceholderData, tableKey: tableKeyRef.current });
  } else if (result.isLoading || controls.metaLoading) {
    body = (
      <div className={`${box} flex items-center justify-center gap-2 border-slate-200 py-16 text-sm text-slate-500`}>
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PivotControlsBar controls={controls} />
      {body}
    </div>
  );
}

export function PivotReportCard({
  title,
  data,
  rootLabel,
  exportFilename,
  dimmed,
  tableKey,
  defaultExpandedDepth = 0,
  enableTopLevelFilter = false,
}: PivotShellUi & {
  title: string;
  data: PivotReportResponse;
  rootLabel: string;
  exportFilename: string;
  defaultExpandedDepth?: number;
  enableTopLevelFilter?: boolean;
}) {
  const period = data.previous_period
    ? `${fmtPeriod(data.current_period)} · vs ${fmtPeriod(data.previous_period)}`
    : fmtPeriod(data.current_period);

  const exportBtn =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-500">{period}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={exportBtn}
              onClick={() => downloadPivotTreeCsv(data.tree, EXPORT_COLUMNS, rootLabel, exportFilename, data.totals)}
            >
              <Download className="size-3.5" /> CSV
            </button>
            <button
              type="button"
              className={exportBtn}
              onClick={() => downloadPivotTreeXlsx(data.tree, EXPORT_COLUMNS, rootLabel, exportFilename, data.totals)}
            >
              <Download className="size-3.5" /> Excel
            </button>
          </div>
        </div>
        <PivotResponseNotices warnings={data.warnings} comparison={data.comparison} />
      </div>
      <PivotTreeTable
        key={tableKey}
        tree={data.tree}
        totals={data.totals}
        dimmed={dimmed}
        rootLabel={rootLabel}
        defaultExpandedDepth={defaultExpandedDepth}
        enableTopLevelFilter={enableTopLevelFilter}
      />
    </section>
  );
}