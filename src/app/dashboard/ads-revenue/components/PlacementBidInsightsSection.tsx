"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CampaignDataTable,
  type CampaignColumnDefinition,
  type CampaignTableData,
} from "@/components/dashboard/table/campaign-data-table";
import {
  usePlacementBidInsightsData,
  Table1Row,
  Table2Row,
  Table3Row,
  BidLookupStatus,
} from "@/lib/hooks/usePlacementBidInsightsData";
import {
  applyPlacementBidAdjustment,
  applyCampaignBidDecrease,
  retryCampaignBidDecrease,
  PlacementBidActionError,
  type ApplyPlacementBidResult,
  type ApplyBidDecreaseResult,
} from "@/lib/hooks/usePlacementBidActions";
import {
  usePlacementBidActionsStore,
  getRowActionState,
  table12RowKey,
  table3RowKey,
  isInCooldown,
  type RowActionState,
} from "@/lib/store/usePlacementBidActionsStore";

// ---------------------------------------------------------------------------
// Column definitions
//
// STAGING COLUMN NOTE: `proposed_bid_adjustment_pct` (tables 1 & 2) and
// `proposed_bid_change_pct` (table 3) do NOT come from the API — they're
// added client-side as editable staging fields.
//
// Tables 1 & 2 default `proposed_bid_adjustment_pct` to
// suggestedBidAdjustment(current_bid_adjustment_pct) — current + 50,
// capped at MAX_BID_ADJUSTMENT_PCT — rather than the current value as-is,
// so the suggestion column shows an actionable bump instead of a no-op.
// Rows with no current value (bid lookup unavailable) get no suggestion
// (null) since there's nothing to bump from. This same default is what a
// "Set All" bulk-set in the table would show before the user overrides it,
// since it reads from the same underlying row data.
// Table 3's `proposed_bid_change_pct` defaults to DEFAULT_BID_DECREASE_PCT
// (5%) — table 3 has no existing bid value to bump from, so this is a flat
// starting suggestion rather than a computed one.
//
// A row is "staged" once its proposed value differs from that default (see
// is12Staged/is3Staged) — the panel below each table lists staged rows and
// is how changes actually get pushed via apply-placement-bid /
// apply-bid-decrease.
//
// Table 1 & 2 send `proposed_bid_adjustment_pct` as-is: it's an ABSOLUTE
// target percentage (e.g. "600 -> 650"), matching what apply-placement-bid
// now expects (new_value, not a step delta).
// Table 3's `proposed_bid_change_pct` maps 1:1 onto apply-bid-decrease's
// decrease_pct (a positive percentage to cut every keyword/target bid in
// the campaign by).
// ---------------------------------------------------------------------------

const BID_ADJUSTMENT_SUGGESTION_STEP = 50;
const MAX_BID_ADJUSTMENT_PCT = 900;
const DEFAULT_BID_DECREASE_PCT = 5;

/** Treats a missing-but-present current bid (0 or negative) as a 0 base to
 * increment from. Returns null only when there's genuinely no current value
 * (bid lookup unavailable) — callers decide what to do with that case. */
function baseBidValue(current: number | null | undefined): number | null {
  if (current === null || current === undefined) return null;
  return current <= 0 ? 0 : current;
}

/** Table 1 / Table 2 suggestion default: current + 50, capped at 900,
 * treating a current of 0 or negative as a 0 base. Null when there's no
 * current value to bump from at all (e.g. live bid lookup was unavailable
 * for this campaign/placement). */
function suggestedBidAdjustment(current: number | null | undefined): number | null {
  const base = baseBidValue(current);
  if (base === null) return null;
  return Math.min(base + BID_ADJUSTMENT_SUGGESTION_STEP, MAX_BID_ADJUSTMENT_PCT);
}

/**
 * Reinterprets CampaignDataTable's "Set all" bulk action for
 * proposed_bid_adjustment_pct: the component itself just writes the same
 * raw value to every row (see BulkNumberPopup / applyBulkNumber in
 * campaign-data-table.tsx — not something we modify). We detect that here
 * by comparing to the previous state and treat the typed value as an
 * INCREASE applied per-row on top of that row's own current bid (0 or
 * negative treated as a 0 base), capped at MAX_BID_ADJUSTMENT_PCT, instead
 * of letting every row end up at the same absolute number.
 *
 * A single inline cell edit only ever changes exactly one row for this
 * field (it isn't a spanned/grouped column), so more than one row changing
 * in the same onDataChange call is the reliable signature of the bulk-set
 * popup having fired — that's the detection this relies on. Row count
 * changing (e.g. a delete) is passed through untouched.
 */
function applyBulkBidIncrement<
  T extends { current_bid_adjustment_pct: number | null; proposed_bid_adjustment_pct: number | null },
>(prevRows: T[], newRows: T[]): T[] {
  if (newRows.length !== prevRows.length) return newRows;

  const changedIndices: number[] = [];
  for (let i = 0; i < newRows.length; i++) {
    if (newRows[i].proposed_bid_adjustment_pct !== prevRows[i].proposed_bid_adjustment_pct) {
      changedIndices.push(i);
    }
  }

  // 0 or 1 rows changed -> a normal single-cell edit (or no-op); pass through as-is.
  if (changedIndices.length <= 1) return newRows;

  const incrementBy = Number(newRows[changedIndices[0]].proposed_bid_adjustment_pct);
  if (!Number.isFinite(incrementBy)) return newRows;

  return newRows.map((row) => {
    const base = baseBidValue(row.current_bid_adjustment_pct);
    if (base === null) return row; // no current bid data — nothing to increment from
    return { ...row, proposed_bid_adjustment_pct: Math.min(base + incrementBy, MAX_BID_ADJUSTMENT_PCT) };
  });
}

const TABLE1_COLUMNS: CampaignColumnDefinition[] = [
  { field: "ad_type", headerName: "Ad Type", type: "text", span: true, sortable: true, filterable: true, width: 80, minWidth: 70 },
  { field: "campaign_name", headerName: "Campaign", type: "text", span: true, sortable: true, filterable: true, width: 220, minWidth: 140 },
  { field: "today_impressions", headerName: "Today Impr.", type: "number", span: true, sortable: true, width: 110 },
  { field: "dow_avg_impressions_elapsed_hours", headerName: "DOW Avg Impr. (elapsed)", type: "number", span: true, sortable: true, width: 160 },
  { field: "adjusted_dow_avg_impressions_elapsed_hours", headerName: "Adjusted DOW Avg Impr.", type: "number", span: true, sortable: true, width: 170 },
  { field: "impression_threshold_0_7x", headerName: "Underpace Threshold", type: "number", span: true, sortable: true, width: 130 },
  { field: "placement", headerName: "Placement", type: "text", sortable: true, filterable: true, width: 160, minWidth: 120 },
  { field: "today_placement_impressions", headerName: "Placement Impr.", type: "number", sortable: true, width: 120 },
  { field: "today_placement_clicks", headerName: "Placement Clicks", type: "number", sortable: true, width: 120 },
  { field: "today_placement_ctr_pct", headerName: "Placement CTR", type: "number", sortable: true, width: 130 },
  { field: "dow_placement_ctr_pct", headerName: "DOW Placement CTR", type: "number", sortable: true, width: 150 },
  { field: "account_dow_avg_ctr_pct", headerName: "Account Avg CTR", type: "number", span: true, sortable: true, width: 140 },
  { field: "current_bid_adjustment_pct", headerName: "Current Bid Adj", type: "number", sortable: true, width: 130 },
  { field: "proposed_bid_adjustment_pct", headerName: "Proposed Bid Adj %", type: "number", editable: true, bulkSet: true, bulkSetLabel: "Increase bid % for all rows", sortable: false, width: 150, minWidth: 130 },
];

const TABLE2_COLUMNS: CampaignColumnDefinition[] = [
  { field: "ad_type", headerName: "Ad Type", type: "text", span: true, sortable: true, filterable: true, width: 80, minWidth: 70 },
  { field: "campaign_name", headerName: "Campaign", type: "text", span: true, sortable: true, filterable: true, width: 220, minWidth: 140 },
  { field: "today_campaign_ctr_pct", headerName: "Today Campaign CTR", type: "number", span: true, sortable: true, width: 160 },
  { field: "dow_avg_campaign_ctr_pct", headerName: "DOW Avg Campaign CTR", type: "number", span: true, sortable: true, width: 170 },
  { field: "placement", headerName: "Placement", type: "text", sortable: true, filterable: true, width: 160, minWidth: 120 },
  { field: "today_placement_ctr_pct", headerName: "Placement CTR", type: "number", sortable: true, width: 130 },
  { field: "dow_avg_placement_ctr_pct", headerName: "DOW Placement CTR", type: "number", sortable: true, width: 150 },
  { field: "current_bid_adjustment_pct", headerName: "Current Bid Adj", type: "number", sortable: true, width: 130 },
  { field: "proposed_bid_adjustment_pct", headerName: "Proposed Bid Adj %", type: "number", editable: true, bulkSet: true, bulkSetLabel: "Increase bid % for all rows", sortable: false, width: 150, minWidth: 130 },
];

const TABLE3_COLUMNS: CampaignColumnDefinition[] = [
  { field: "ad_type", headerName: "Ad Type", type: "text", sortable: true, filterable: true, width: 80, minWidth: 70 },
  { field: "campaign_name", headerName: "Campaign", type: "text", sortable: true, filterable: true, width: 240, minWidth: 140 },
  { field: "today_cpc", headerName: "Today CPC", type: "number", sortable: true, width: 110 },
  { field: "dow_avg_cpc", headerName: "DOW Avg CPC", type: "number", sortable: true, width: 120 },
  { field: "adjusted_dow_avg_cpc", headerName: "Adjusted DOW Avg CPC", type: "number", sortable: true, width: 150 },
  { field: "cpc_threshold_1_3x", headerName: "Overspend Threshold", type: "number", sortable: true, width: 140 },
  { field: "today_ctr_pct", headerName: "Today CTR", type: "number", sortable: true, width: 110 },
  { field: "dow_avg_ctr_pct", headerName: "DOW Avg CTR", type: "number", sortable: true, width: 130 },
  { field: "proposed_bid_change_pct", headerName: "Decrease bid by %", type: "number", editable: true, bulkSet: true, bulkSetLabel: "Set decrease % for all rows", sortable: false, width: 170, minWidth: 140 },
];

const GROUP_BY_CAMPAIGN = ["ad_type", "campaign_id"];

function formatBidLookupReason(status: BidLookupStatus | undefined): string {
  if (!status) return "Live bid data status unavailable.";
  const reason = status.reason ?? "";
  if (reason === "no_credentials_configured") {
    return "Live bid data is unavailable — no active Amazon Ads API credentials are configured for this account.";
  }
  if (reason === "token_request_failed") {
    return "Live bid data is unavailable — couldn't authenticate with the Amazon Ads API. The stored credentials may be invalid or expired.";
  }
  if (reason === "no_campaigns_matched") {
    return "Live bid data is unavailable — the Amazon Ads API returned no matching campaigns for this profile.";
  }
  return `Live bid data is unavailable (${reason}).`;
}

type TabKey = "table1" | "table2" | "table3";

// Staged row shapes — the API row types plus the client-only proposed field.
type StagedTable1 = Table1Row & { proposed_bid_adjustment_pct: number | null };
type StagedTable2 = Table2Row & { proposed_bid_adjustment_pct: number | null };
type StagedTable3 = Table3Row & { proposed_bid_change_pct: number | null };

function is12Staged(row: StagedTable1 | StagedTable2): boolean {
  const proposed = row.proposed_bid_adjustment_pct;
  if (proposed === null || proposed === undefined || (proposed as unknown as string) === "") return false;
  const current = row.current_bid_adjustment_pct;
  if (current === null || current === undefined) return true;
  return Number(proposed) !== Number(current);
}

function is3Staged(row: StagedTable3): boolean {
  const v = row.proposed_bid_change_pct;
  return v !== null && v !== undefined && (v as unknown as string) !== "" && Number(v) > 0;
}

/** Runs async jobs with a small concurrency cap instead of firing everything
 * at once — keeps a bulk "Apply All Staged" click from hammering the Ads
 * API (and this service's own live-lookup + push calls) with N simultaneous
 * requests when N is large. */
async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  async function next(): Promise<void> {
    const current = index++;
    if (current >= items.length) return;
    await worker(items[current]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
}

// ---------------------------------------------------------------------------
// Small presentational bits
// ---------------------------------------------------------------------------

function useNowTick(activeMs: number | null) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activeMs === null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeMs]);
}

function CooldownLabel({ until }: { until: number }) {
  useNowTick(until);
  const remainingMs = Math.max(0, until - Date.now());
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" />
      {remainingMs > 0 ? `Retry in ${mins}:${secs.toString().padStart(2, "0")}` : "Ready to retry"}
    </span>
  );
}

function StatusBadge({ state }: { state: RowActionState }) {
  if (state.status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying…
      </span>
    );
  }
  if (state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Applied
      </span>
    );
  }
  if (state.status === "cooldown" && state.cooldownUntil) {
    return <CooldownLabel until={state.cooldownUntil} />;
  }
  if (state.status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium" title={state.errorMessage}>
        <AlertTriangle className="w-3.5 h-3.5" />
        {state.errorMessage ?? "Failed"}
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Staging panels — Table 1 / 2 (placement bid changes)
// ---------------------------------------------------------------------------

interface StagedPanel12Props {
  rows: (StagedTable1 | StagedTable2)[];
  onApplyOne: (row: StagedTable1 | StagedTable2) => void;
  onApplyAll: () => void;
  isBusy: boolean;
}

function StagedPlacementBidPanel({ rows, onApplyOne, onApplyAll, isBusy }: StagedPanel12Props) {
  const rowActions = usePlacementBidActionsStore((s) => s.rowActions);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 border border-blue-100 bg-blue-50/40 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#1a2b3c]">
          Staged changes ({rows.length})
        </p>
        <button
          onClick={onApplyAll}
          disabled={isBusy}
          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
            isBusy ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Apply All Staged
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const key = table12RowKey(row);
          const state = getRowActionState(rowActions, key);
          const cooling = isInCooldown(state);
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 bg-white rounded-md border border-gray-100 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#1a2b3c] truncate">
                  {row.campaign_name || row.campaign_id}
                  <span className="ml-2 text-gray-400 font-normal uppercase text-xs">{row.ad_type}</span>
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {row.placement} · {row.current_bid_adjustment_pct ?? "—"}% → {row.proposed_bid_adjustment_pct}%
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge state={state} />
                <button
                  onClick={() => onApplyOne(row)}
                  disabled={state.status === "pending" || cooling}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    state.status === "pending" || cooling
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staging panel — Table 3 (campaign-wide bid decrease + retry)
// ---------------------------------------------------------------------------

interface StagedPanel3Props {
  stagedRows: StagedTable3[];
  retryableRows: StagedTable3[];
  onApplyOne: (row: StagedTable3) => void;
  onApplyAll: () => void;
  onRetry: (row: StagedTable3) => void;
  isBusy: boolean;
}

function StagedBidDecreasePanel({ stagedRows, retryableRows, onApplyOne, onApplyAll, onRetry, isBusy }: StagedPanel3Props) {
  const rowActions = usePlacementBidActionsStore((s) => s.rowActions);

  if (stagedRows.length === 0 && retryableRows.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {stagedRows.length > 0 && (
        <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#1a2b3c]">Staged changes ({stagedRows.length})</p>
            <button
              onClick={onApplyAll}
              disabled={isBusy}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                isBusy ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Apply All Staged
            </button>
          </div>
          <div className="space-y-2">
            {stagedRows.map((row) => {
              const key = table3RowKey(row);
              const state = getRowActionState(rowActions, key);
              const cooling = isInCooldown(state);
              return (
                <div key={key} className="flex items-center justify-between gap-3 bg-white rounded-md border border-gray-100 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1a2b3c] truncate">
                      {row.campaign_name || row.campaign_id}
                      <span className="ml-2 text-gray-400 font-normal uppercase text-xs">{row.ad_type}</span>
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Decrease all keyword/target bids by {row.proposed_bid_change_pct}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge state={state} />
                    <button
                      onClick={() => onApplyOne(row)}
                      disabled={state.status === "pending" || cooling}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                        state.status === "pending" || cooling
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {retryableRows.length > 0 && (
        <div className="border border-amber-100 bg-amber-50/40 rounded-lg p-4">
          <p className="text-sm font-semibold text-[#1a2b3c] mb-3">Partially failed batches ({retryableRows.length})</p>
          <div className="space-y-2">
            {retryableRows.map((row) => {
              const key = table3RowKey(row);
              const state = getRowActionState(rowActions, key);
              const cooling = isInCooldown(state);
              return (
                <div key={key} className="flex items-center justify-between gap-3 bg-white rounded-md border border-gray-100 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1a2b3c] truncate">
                      {row.campaign_name || row.campaign_id}
                      <span className="ml-2 text-gray-400 font-normal uppercase text-xs">{row.ad_type}</span>
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {state.failedCount ?? "some"} keyword(s) failed to update — cooldown does not apply to retries
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge state={state} />
                    <button
                      onClick={() => onRetry(row)}
                      disabled={state.status === "pending" || cooling}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                        state.status === "pending" || cooling
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry Failed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlacementBidInsightsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("table1");
  const [isBulkBusy, setIsBulkBusy] = useState(false);

  // Draft inputs — bound to the input boxes, free to change on every
  // keystroke/toggle without affecting anything fetched yet.
  const [underpaceRatio, setUnderpaceRatio] = useState(0.7);
  const [baselineMode, setBaselineMode] = useState<"BAU" | "ART">("BAU");
  const [markupMultiplier, setMarkupMultiplier] = useState<number>(1.4);

  const isArtInputInvalid = baselineMode === "ART" && (!markupMultiplier || markupMultiplier < 1);

  // Applied params — this, not the draft state above, is what the query
  // actually uses. It only changes when the user clicks "Run Analysis"
  // (see handleRunAnalysis), so editing the inputs never triggers a fetch
  // on its own. Initialized to the defaults so the page still loads with
  // data on mount.
  const [appliedParams, setAppliedParams] = useState({
    impressionsUnderpaceRatio: 0.7,
    baselineMode: "BAU" as "BAU" | "ART",
    baselineMarkupMultiplier: undefined as number | undefined,
  });

  const handleRunAnalysis = useCallback(() => {
    if (isArtInputInvalid) return;
    setAppliedParams({
      impressionsUnderpaceRatio: underpaceRatio,
      baselineMode,
      baselineMarkupMultiplier: baselineMode === "ART" ? markupMultiplier : undefined,
    });
  }, [isArtInputInvalid, underpaceRatio, baselineMode, markupMultiplier]);

  // enabled stays true throughout — the query fetches on mount (using the
  // initial appliedParams) and again whenever appliedParams changes, which
  // only happens on a Run Analysis click.
  const { data, isLoading, isFetching, error } = usePlacementBidInsightsData({
    impressionsUnderpaceRatio: appliedParams.impressionsUnderpaceRatio,
    baselineMode: appliedParams.baselineMode,
    baselineMarkupMultiplier: appliedParams.baselineMarkupMultiplier,
  });

  const setRowStatus = usePlacementBidActionsStore((s) => s.setRowStatus);
  const rowActions = usePlacementBidActionsStore((s) => s.rowActions);

  // Local, editable copies — CampaignDataTable is a controlled component
  // (data + onDataChange), and the proposed_bid_* columns are staging-only
  // fields that don't exist in the API response (see column notes above).
  const [table1Data, setTable1Data] = useState<StagedTable1[]>([]);
  const [table2Data, setTable2Data] = useState<StagedTable2[]>([]);
  const [table3Data, setTable3Data] = useState<StagedTable3[]>([]);

  // Which rows the user has checked via CampaignDataTable's checkbox column,
  // keyed the same way as the staging panels (table12RowKey / table3RowKey).
  // "Staged" now means BOTH "has a suggested/edited value" AND "checked" —
  // otherwise every row would show as staged the moment it loads, since the
  // default proposed value is a non-trivial suggestion (see
  // suggestedBidAdjustment / DEFAULT_BID_DECREASE_PCT above).
  const [selectedTable1Keys, setSelectedTable1Keys] = useState<Set<string>>(new Set());
  const [selectedTable2Keys, setSelectedTable2Keys] = useState<Set<string>>(new Set());
  const [selectedTable3Keys, setSelectedTable3Keys] = useState<Set<string>>(new Set());

  const handleTable1SelectionChange = useCallback((selected: CampaignTableData[]) => {
    setSelectedTable1Keys(new Set(selected.map((row) => table12RowKey(row as StagedTable1))));
  }, []);
  const handleTable2SelectionChange = useCallback((selected: CampaignTableData[]) => {
    setSelectedTable2Keys(new Set(selected.map((row) => table12RowKey(row as StagedTable2))));
  }, []);
  const handleTable3SelectionChange = useCallback((selected: CampaignTableData[]) => {
    setSelectedTable3Keys(new Set(selected.map((row) => table3RowKey(row as StagedTable3))));
  }, []);

  const handleTable1Change = useCallback((newData: CampaignTableData[]) => {
    setTable1Data((prev) => applyBulkBidIncrement(prev, newData as StagedTable1[]));
  }, []);
  const handleTable2Change = useCallback((newData: CampaignTableData[]) => {
    setTable2Data((prev) => applyBulkBidIncrement(prev, newData as StagedTable2[]));
  }, []);
  const handleTable3Change = useCallback((newData: CampaignTableData[]) => {
    setTable3Data(newData as StagedTable3[]);
  }, []);

  useEffect(() => {
    if (!data) return;
    setTable1Data(
      data.table1_low_impressions.map((row: Table1Row) => ({
        ...row,
        proposed_bid_adjustment_pct: suggestedBidAdjustment(row.current_bid_adjustment_pct),
      })),
    );
    setTable2Data(
      data.table2_low_ctr_placements.map((row: Table2Row) => ({
        ...row,
        proposed_bid_adjustment_pct: suggestedBidAdjustment(row.current_bid_adjustment_pct),
      })),
    );
    setTable3Data(
      data.table3_high_cpc_low_ctr.map((row: Table3Row) => ({
        ...row,
        proposed_bid_change_pct: DEFAULT_BID_DECREASE_PCT,
      })),
    );
    setSelectedTable1Keys(new Set());
    setSelectedTable2Keys(new Set());
    setSelectedTable3Keys(new Set());
  }, [data]);

  const tabCounts = useMemo(
    () => ({
      table1: table1Data.length,
      table2: table2Data.length,
      table3: table3Data.length,
    }),
    [table1Data, table2Data, table3Data],
  );

  const staged1 = useMemo(
    () => table1Data.filter((row) => is12Staged(row) && selectedTable1Keys.has(table12RowKey(row))),
    [table1Data, selectedTable1Keys],
  );
  const staged2 = useMemo(
    () => table2Data.filter((row) => is12Staged(row) && selectedTable2Keys.has(table12RowKey(row))),
    [table2Data, selectedTable2Keys],
  );
  const staged3 = useMemo(
    () => table3Data.filter((row) => is3Staged(row) && selectedTable3Keys.has(table3RowKey(row))),
    [table3Data, selectedTable3Keys],
  );
  const retryable3 = useMemo(
    () => table3Data.filter((row) => getRowActionState(rowActions, table3RowKey(row)).canRetryFailed),
    [table3Data, rowActions],
  );

  // -------------------------------------------------------------------
  // Table 1 / 2 actions
  // -------------------------------------------------------------------

  const applyTable12Row = useCallback(
    async (row: StagedTable1 | StagedTable2, setData: React.Dispatch<React.SetStateAction<any[]>>) => {
      const key = table12RowKey(row);
      setRowStatus(key, { status: "pending", errorMessage: undefined });
      try {
        const result: ApplyPlacementBidResult = await applyPlacementBidAdjustment({
          ad_type: row.ad_type,
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name,
          placement: row.placement,
          new_value: Number(row.proposed_bid_adjustment_pct),
        });
        setRowStatus(key, { status: "success" });
        setData((prev) =>
          prev.map((r) =>
            table12RowKey(r) === key
              ? { ...r, current_bid_adjustment_pct: result.new_value, proposed_bid_adjustment_pct: result.new_value }
              : r,
          ),
        );
      } catch (err) {
        if (err instanceof PlacementBidActionError && err.code === "cooldown_active") {
          setRowStatus(key, {
            status: "cooldown",
            cooldownUntil: Date.now() + (err.retryAfterMinutes ?? 0) * 60_000,
            errorMessage: "Cooldown active for this placement",
          });
        } else {
          setRowStatus(key, {
            status: "error",
            errorMessage: err instanceof Error ? err.message : "Failed to apply",
          });
        }
      }
    },
    [setRowStatus],
  );

  const applyTable12All = useCallback(
    async (rows: (StagedTable1 | StagedTable2)[], setData: React.Dispatch<React.SetStateAction<any[]>>) => {
      if (rows.length === 0) return;
      setIsBulkBusy(true);
      try {
        await runWithConcurrency(rows, 3, (row) => applyTable12Row(row, setData));
      } finally {
        setIsBulkBusy(false);
      }
    },
    [applyTable12Row],
  );

  // -------------------------------------------------------------------
  // Table 3 actions
  // -------------------------------------------------------------------

  const applyTable3Row = useCallback(
    async (row: StagedTable3) => {
      const key = table3RowKey(row);
      setRowStatus(key, { status: "pending", errorMessage: undefined });
      try {
        const result: ApplyBidDecreaseResult = await applyCampaignBidDecrease({
          ad_type: row.ad_type,
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name,
          decrease_pct: Number(row.proposed_bid_change_pct),
        });
        const applied = result.status === "applied";
        setRowStatus(key, {
          status: applied ? "success" : "error",
          batchId: result.batch_id,
          canRetryFailed: result.can_retry_failed,
          successCount: result.successful,
          failedCount: result.failed,
          errorMessage: applied ? undefined : `${result.failed} of ${result.target_count} keyword(s) failed`,
        });
        if (applied) {
          setTable3Data((prev) =>
            prev.map((r) => (table3RowKey(r) === key ? { ...r, proposed_bid_change_pct: null } : r)),
          );
        }
      } catch (err) {
        if (err instanceof PlacementBidActionError && err.code === "cooldown_active") {
          setRowStatus(key, {
            status: "cooldown",
            cooldownUntil: Date.now() + (err.retryAfterMinutes ?? 0) * 60_000,
            errorMessage: "Cooldown active for this campaign",
          });
        } else if (err instanceof PlacementBidActionError && err.status === 404) {
          setRowStatus(key, { status: "error", errorMessage: "No active targets found for this campaign" });
        } else {
          setRowStatus(key, {
            status: "error",
            errorMessage: err instanceof Error ? err.message : "Failed to apply",
          });
        }
      }
    },
    [setRowStatus],
  );

  const applyTable3All = useCallback(
    async (rows: StagedTable3[]) => {
      if (rows.length === 0) return;
      setIsBulkBusy(true);
      try {
        await runWithConcurrency(rows, 3, (row) => applyTable3Row(row));
      } finally {
        setIsBulkBusy(false);
      }
    },
    [applyTable3Row],
  );

  const retryTable3Row = useCallback(
    async (row: StagedTable3) => {
      const key = table3RowKey(row);
      const state = getRowActionState(rowActions, key);
      if (!state.batchId) return;
      setRowStatus(key, { status: "pending", errorMessage: undefined });
      try {
        const result: ApplyBidDecreaseResult = await retryCampaignBidDecrease({
          ad_type: row.ad_type,
          campaign_id: row.campaign_id,
          batch_id: state.batchId,
        });
        const applied = result.status === "applied";
        setRowStatus(key, {
          status: applied ? "success" : "error",
          batchId: result.batch_id,
          canRetryFailed: result.can_retry_failed,
          successCount: result.successful,
          failedCount: result.failed,
          errorMessage: applied ? undefined : `${result.failed} of ${result.target_count} still failing`,
        });
      } catch (err) {
        setRowStatus(key, {
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Retry failed",
        });
      }
    },
    [rowActions, setRowStatus],
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a2b3c] tracking-tight">
            Placement & Bid Insights
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            SP + SB only · today vs. day-of-week baseline
            {data?.metadata?.dow_reference_days_used != null && (
              <> · {data.metadata.dow_reference_days_used} reference day{data.metadata.dow_reference_days_used === 1 ? "" : "s"}</>
            )}
          </p>
        </div>

        {/* Threshold controls + Run Analysis, grouped together */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="underpace-ratio" className="text-xs font-medium text-gray-600">
              Underpace ratio
            </label>
            <input
              id="underpace-ratio"
              type="number"
              min={0.05}
              max={5}
              step={0.05}
              value={underpaceRatio}
              onChange={(e) => setUnderpaceRatio(Number(e.target.value))}
              className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Baseline mode</span>
            <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setBaselineMode("BAU")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  baselineMode === "BAU" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                BAU
              </button>
              <button
                type="button"
                onClick={() => setBaselineMode("ART")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                  baselineMode === "ART" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                ART
              </button>
            </div>
          </div>

          {baselineMode === "ART" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="baseline-markup" className="text-xs font-medium text-gray-600">
                Markup (e.g. 1.4x)
              </label>
              <input
                id="baseline-markup"
                type="number"
                min={1}
                max={10}
                step={0.1}
                value={markupMultiplier}
                onChange={(e) => setMarkupMultiplier(Number(e.target.value))}
                className={`w-24 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                  isArtInputInvalid ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                }`}
              />
            </div>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={isFetching || isArtInputInvalid}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isFetching || isArtInputInvalid
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
      </div>

      {isArtInputInvalid && (
        <p className="text-xs text-red-600 mb-3">Enter a markup of 1.0 or higher, then click Run Analysis.</p>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">
            Error: {error instanceof Error ? error.message : "Failed to load insights"}
          </p>
        </div>
      )}

      {data && !data.metadata.bid_lookup_status.available && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm font-medium">
            {formatBidLookupReason(data.metadata.bid_lookup_status)}
          </p>
          <p className="text-amber-700 text-xs mt-1">
            &quot;Current Bid Adj %&quot; will show blank until this is resolved. Table 1 and Table 2 data are otherwise unaffected.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
          <TabsList>
            <TabsTrigger value="table1" className="gap-1.5">
              <TrendingUp className="size-4" />
              Low Impressions ({tabCounts.table1})
            </TabsTrigger>
            <TabsTrigger value="table2" className="gap-1.5">
              <AlertTriangle className="size-4" />
              Low CTR Placements ({tabCounts.table2})
            </TabsTrigger>
            <TabsTrigger value="table3" className="gap-1.5">
              <TrendingDown className="size-4" />
              High CPC / Low CTR ({tabCounts.table3})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            <p className="text-sm text-gray-500">Running placement analysis...</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "table1" && (
            table1Data.length > 0 ? (
              <>
                <CampaignDataTable
                  data={table1Data}
                  columns={TABLE1_COLUMNS}
                  groupByFields={GROUP_BY_CAMPAIGN}
                  onDataChange={handleTable1Change}
                  onSelectionChange={handleTable1SelectionChange}
                  showCheckboxColumn
                  showDeleteOption={false}
                  rowsPerPage={10}
                />
                <StagedPlacementBidPanel
                  rows={staged1}
                  onApplyOne={(row) => applyTable12Row(row, setTable1Data)}
                  onApplyAll={() => applyTable12All(staged1, setTable1Data)}
                  isBusy={isBulkBusy}
                />
              </>
            ) : (
              <EmptyState icon={Zap} message="No campaigns are currently underpacing on impressions." />
            )
          )}

          {activeTab === "table2" && (
            table2Data.length > 0 ? (
              <>
                <CampaignDataTable
                  data={table2Data}
                  columns={TABLE2_COLUMNS}
                  groupByFields={GROUP_BY_CAMPAIGN}
                  onDataChange={handleTable2Change}
                  onSelectionChange={handleTable2SelectionChange}
                  showCheckboxColumn
                  showDeleteOption={false}
                  rowsPerPage={10}
                />
                <StagedPlacementBidPanel
                  rows={staged2}
                  onApplyOne={(row) => applyTable12Row(row, setTable2Data)}
                  onApplyAll={() => applyTable12All(staged2, setTable2Data)}
                  isBusy={isBulkBusy}
                />
              </>
            ) : (
              <EmptyState icon={Zap} message="No campaigns are currently below their CTR baseline." />
            )
          )}

          {activeTab === "table3" && (
            table3Data.length > 0 || retryable3.length > 0 ? (
              <>
                <CampaignDataTable
                  data={table3Data}
                  columns={TABLE3_COLUMNS}
                  groupByFields={GROUP_BY_CAMPAIGN}
                  onDataChange={handleTable3Change}
                  onSelectionChange={handleTable3SelectionChange}
                  showCheckboxColumn
                  showDeleteOption={false}
                  rowsPerPage={10}
                />
                <StagedBidDecreasePanel
                  stagedRows={staged3}
                  retryableRows={retryable3}
                  onApplyOne={applyTable3Row}
                  onApplyAll={() => applyTable3All(staged3)}
                  onRetry={retryTable3Row}
                  isBusy={isBulkBusy}
                />
              </>
            ) : (
              <EmptyState icon={Zap} message="No campaigns are currently over-spending on CPC with low CTR." />
            )
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Zap; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
      <Icon className="w-6 h-6 text-gray-300" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}