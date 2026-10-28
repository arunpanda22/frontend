"use client";

/**
 * FlipkartDataTableCard: the card shell + loading / error / empty states around AdvancedDataTable,
 * shared by FlipkartCampaignsTable and FlipkartCampaignPlacementsTable.
 *
 * The caller owns the data fetching and the row mapping; this component only renders. That keeps
 * each table wrapper tiny and guarantees both tables look and fail the same way.
 *
 * Styling matches Amazon's CampaignAdsSummary card (rounded-2xl, white, shadow-lg, header row).
 * Unlike the Amazon version it uses plain Tailwind (no MUI Typography).
 */
import React, { useState } from "react";
import {
  AdvancedDataTable,
  type ColumnDefinition,
  type TableData,
} from "@/components/dashboard/table/advanced-data-table";

interface FlipkartDataTableCardProps {
  title: string;
  /** Right-hand header line, e.g. "12 campaigns". */
  summary?: string;
  /** Right-hand header sub-line, e.g. "2026-10-01 to 2026-10-20". */
  dateLabel?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  rows: TableData[];
  /** Initial column definitions. Pin changes made by the user are kept in local state. */
  columns: ColumnDefinition[];
  /** Field whose value is unique per row (keeps selection / sorting stable). */
  rowKey: string;
  initialSort?: { field: string; direction: "asc" | "desc" }[];
  filename: string;
  emptyMessage: string;
  /** Explanation shown under the table. */
  footerNote: string;
}

const CARD_CLASS =
  "h-full rounded-2xl bg-white shadow-lg transition-all duration-300 animate-fadein delay-500 flex flex-col";

export default function FlipkartDataTableCard({
  title,
  summary,
  dateLabel,
  isLoading,
  isError,
  errorMessage,
  rows,
  columns,
  rowKey,
  initialSort,
  filename,
  emptyMessage,
  footerNote,
}: FlipkartDataTableCardProps) {
  const [tableColumns, setTableColumns] = useState<ColumnDefinition[]>(columns);

  const header = (
    <div className="p-4 border-b border-gray-100 flex-shrink-0">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h6 className="text-lg font-bold text-[#1a2b3c] tracking-tight">{title}</h6>
        {(summary || dateLabel) && (
          <div className="text-right">
            {summary && <div className="text-sm font-medium text-slate-700">{summary}</div>}
            {dateLabel && <div className="text-xs text-slate-500">{dateLabel}</div>}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500">Loading data...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 font-semibold">Failed to load data</div>
            <div className="text-sm text-gray-500">{errorMessage || "Unknown error occurred"}</div>
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={CARD_CLASS}>
        {header}
        <div className="p-4 md:p-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600">No data available</div>
            <div className="text-sm text-gray-500">{emptyMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={CARD_CLASS}>
      {header}
      <div className="flex-1 min-h-0 p-2">
        <AdvancedDataTable
          data={rows}
          columns={tableColumns}
          onColumnsChange={setTableColumns}
          className="w-full h-full"
          showCheckboxColumn={false}
          showDeleteOption={false}
          rowKey={rowKey}
          initialSort={initialSort}
          filename={filename}
        />
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-gray-600">{footerNote}</p>
        </div>
      </div>
    </div>
  );
}