"use client";

/**
 * OptimizationTablePanel
 * ---------------------------------------------------------------------------
 * Inline replacement for the old <OptimizationTableDrawer />. Renders the
 * content of ONE category tab:
 *
 *   ┌ header: title · count · "Edited" chip · [Reset] [Save] [Push Changes] ┐
 *   │ validation errors (if any)                                           │
 *   │ <AdvancedDataTable />  (or push summary / empty state)               │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * DATA FLOW
 *   store (`data` prop) ──► local working copy (`tableData`) ──► Save ──► store
 *   - The table only edits `tableData`. Nothing reaches the store until the user
 *     clicks Save (→ `onSave`) or Push (→ `onPush`, which receives the clean rows).
 *   - Whenever the `data` prop changes identity (after Save, or a fresh
 *     optimizer run), the working copy is rebuilt from it and the dirty flag
 *     is cleared. The store is the source of truth.
 *   - `_rowKey` is an internal field added for AdvancedDataTable; it is stripped
 *     by getCleanData() before anything leaves this component.
 *
 * VISIBILITY STATES (mutually exclusive, evaluated in this order)
 *   1. isPushed && pushResult → <PushResultSummary />
 *   2. data.length === 0      → "No optimizations available"
 *   3. otherwise              → editable table
 *
 * AI-AGENT NOTES
 *   - Panels stay MOUNTED while hidden (see OptimizationSection) so unsaved
 *     edits survive tab switches. Don't add logic that assumes unmount-on-hide.
 *   - Unsaved state is reported upward via `onUnsavedChange` so the tab bar and
 *     the page's "Push All" warning can react to it.
 *   - `onPush` must resolve to `true` on success, `false` on failure (the page
 *     handles toasts and the global `pushingCategory` flag).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RotateCcw, Save, Send } from "lucide-react";
import { AdvancedDataTable } from "@/components/dashboard/table/advanced-data-table";
import type { TableData } from "@/components/dashboard/table/advanced-data-table";
import type { OptimizationKey } from "@/lib/hooks/use-ads-optimizer-store";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { PushResultSummary } from "./PushResultSummary";
import {
  COLUMN_MAPPINGS,
  generateRowKey,
  validateData,
} from "../lib/optimization-table-config";
import type { ValidationError } from "../lib/optimization-table-config";

/** Shape of a push result is owned by PushResultSummary – derive it, don't redeclare. */
type PushResult = React.ComponentProps<typeof PushResultSummary>["result"];

export interface OptimizationTablePanelProps {
  categoryKey: OptimizationKey;
  categoryTitle: string;
  /** Current rows from the store (without `_rowKey`). */
  data: any[];
  /** Category was pushed successfully/partially – show the result summary. */
  isPushed: boolean;
  pushResult?: PushResult;
  /** Store says this category has saved edits ("Edited" chip). */
  isDirty: boolean;
  /** True while ANY push (this category or Push All) is running. Disables actions. */
  isBusy: boolean;
  /** True only while THIS category is being pushed. Drives the "Pushing..." spinner. */
  isPushingThis: boolean;
  /** Persist edited rows to the store. */
  onSave: (key: OptimizationKey, data: any[]) => void;
  /** Push rows. Resolve `true` on success, `false` on failure. */
  onPush: (key: OptimizationKey, data: any[], dryrun?: boolean) => Promise<boolean>;
  /** Open the failed-items modal for this category. */
  onViewPushDetails: (key: OptimizationKey) => void;
  /** Report whether the working copy has unsaved edits. */
  onUnsavedChange: (key: OptimizationKey, hasUnsaved: boolean) => void;
}

export const OptimizationTablePanel: React.FC<OptimizationTablePanelProps> = ({
  categoryKey,
  categoryTitle,
  data,
  isPushed,
  pushResult,
  isDirty,
  isBusy,
  isPushingThis,
  onSave,
  onPush,
  onViewPushDetails,
  onUnsavedChange,
}) => {
  // ── Working copy ─────────────────────────────────────────────────────────
  const buildRows = useCallback(
    (): TableData[] =>
      data.map((item, index) => ({
        ...item,
        _rowKey: generateRowKey(item, categoryKey, index),
      })),
    [data, categoryKey],
  );

  const [tableData, setTableData] = useState<TableData[]>(buildRows);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [showPushConfirm, setShowPushConfirm] = useState(false);

  // Re-sync from the store whenever the incoming data changes identity.
  useEffect(() => {
    setTableData(buildRows());
    setValidationErrors([]);
    setHasUnsaved(false);
  }, [buildRows]);

  // Tell the parent (tab dot + Push All warning) about unsaved edits.
  useEffect(() => {
    onUnsavedChange(categoryKey, hasUnsaved);
  }, [categoryKey, hasUnsaved, onUnsavedChange]);

  const columns = useMemo(() => COLUMN_MAPPINGS[categoryKey] ?? [], [categoryKey]);

  /** Rows without the internal `_rowKey`, safe to send to the store / API. */
  const getCleanData = useCallback(
    () => tableData.map(({ _rowKey, ...rest }) => rest),
    [tableData],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDataChange = useCallback((next: TableData[]) => {
    setTableData(next);
    setHasUnsaved(true);
  }, []);

  const handleReset = useCallback(() => {
    setTableData(buildRows());
    setValidationErrors([]);
    setHasUnsaved(false);
  }, [buildRows]);

  const handleSave = useCallback(() => {
    const errors = validateData(tableData, categoryKey);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    // The store update changes `data` identity → effect above resets the dirty flag.
    onSave(categoryKey, getCleanData());
  }, [tableData, categoryKey, onSave, getCleanData]);

  const handlePushClick = useCallback(() => {
    const errors = validateData(tableData, categoryKey);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setShowPushConfirm(true);
  }, [tableData, categoryKey]);

  const handlePushConfirm = useCallback(
    async (dryrun: boolean) => {
      setShowPushConfirm(false);
      // Edits are sent directly; they are only written to the store via Save.
      await onPush(categoryKey, getCleanData(), dryrun);
    },
    [categoryKey, getCleanData, onPush],
  );

  // ── State 1: already pushed ──────────────────────────────────────────────
  if (isPushed && pushResult) {
    return (
      <div className="p-6">
        <div className="max-w-xl rounded-xl border-2 border-green-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-bold text-gray-900">{categoryTitle}</h3>
          <PushResultSummary
            result={pushResult}
            onViewDetails={() => onViewPushDetails(categoryKey)}
          />
        </div>
      </div>
    );
  }

  // ── State 2: nothing to show ─────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
        <div className="text-3xl font-bold text-gray-300">0</div>
        <div className="text-sm text-gray-500">No optimizations available for {categoryTitle}</div>
      </div>
    );
  }

  // ── State 3: editable table ──────────────────────────────────────────────
  return (
    <div>
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{categoryTitle}</h3>
            <p className="text-sm text-gray-600">
              {tableData.length} optimization{tableData.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isDirty && !hasUnsaved && (
            <span className="rounded-full border border-powder-blue-400 bg-powder-blue-100 px-2 py-1 text-xs font-semibold text-gray-900">
              Edited
            </span>
          )}
          {hasUnsaved && (
            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnsaved && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy || !hasUnsaved}
            className="flex items-center gap-1.5 rounded-lg bg-powder-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-powder-blue-700 disabled:opacity-50"
          >
            <Save className="h-3 w-3" /> Save
          </button>
          <button
            type="button"
            onClick={handlePushClick}
            disabled={isBusy || tableData.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:from-green-600 hover:to-green-700 disabled:opacity-50"
          >
            {isPushingThis ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Pushing...
              </>
            ) : (
              <>
                <Send className="h-3 w-3" /> Push Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <h4 className="mb-2 text-sm font-semibold text-red-900">
                Validation Errors ({validationErrors.length})
              </h4>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-red-800">
                {validationErrors.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    Row {e.row + 1}, {e.field}: {e.message}
                  </li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="font-medium">…and {validationErrors.length - 5} more</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="px-2 pb-2">
        <AdvancedDataTable
          data={tableData}
          columns={columns}
          onDataChange={handleDataChange}
          rowsPerPage={10}
          showCheckboxColumn={true}
          filename={categoryTitle.replace(/\s+/g, "_")}
          rowKey="_rowKey"
        />
      </div>

      <ConfirmationDialog
        isOpen={showPushConfirm}
        onClose={() => setShowPushConfirm(false)}
        onConfirm={handlePushConfirm}
        title="Push Optimizations"
        message={`Push ${tableData.length} ${categoryTitle} optimizations? Choose "Dry Run" to test without applying changes.`}
        variant="info"
        confirmText="Push"
        cancelText="Cancel"
        showDryRun={true}
      />
    </div>
  );
};