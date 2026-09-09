// Tracks the state of user-triggered apply/retry actions on the Placement &
// Bid Insights tables (Table 1/2 placement-bid changes, Table 3 bid
// decreases). Kept separate from the tables' own row data (which stays as
// local component state in PlacementBidInsightsSection) because this state
// is about *actions in flight*, not the underlying analytics — a row's
// action status shouldn't get wiped just because the analytics data
// re-shapes on refetch.
//
// Row identity:
//   Table 1 / Table 2 rows -> table12RowKey(ad_type, campaign_id, placement)
//   Table 3 rows           -> table3RowKey(ad_type, campaign_id)

import { create } from "zustand";

export type PlacementBidActionStatus =
  | "idle"
  | "pending"
  | "success"
  | "error"
  | "cooldown";

export interface RowActionState {
  status: PlacementBidActionStatus;
  errorMessage?: string;
  /** epoch ms — set when a 429 cooldown_active response comes back */
  cooldownUntil?: number;
  /** Table 3 only — batch id returned by apply-bid-decrease, needed for retry */
  batchId?: string;
  /** Table 3 only — whether the last batch had failed line items left to retry */
  canRetryFailed?: boolean;
  /** Table 3 only — counts from the last apply/retry response */
  successCount?: number;
  failedCount?: number;
  lastUpdatedAt?: number;
}

interface PlacementBidActionsStoreState {
  rowActions: Record<string, RowActionState>;
  setRowStatus: (key: string, patch: Partial<RowActionState>) => void;
  resetRow: (key: string) => void;
  resetAll: () => void;
}

const DEFAULT_ROW_STATE: RowActionState = { status: "idle" };

export const usePlacementBidActionsStore = create<PlacementBidActionsStoreState>(
  (set) => ({
    rowActions: {},
    setRowStatus: (key, patch) =>
      set((state) => ({
        rowActions: {
          ...state.rowActions,
          [key]: {
            ...(state.rowActions[key] ?? DEFAULT_ROW_STATE),
            ...patch,
            lastUpdatedAt: Date.now(),
          },
        },
      })),
    resetRow: (key) =>
      set((state) => {
        const next = { ...state.rowActions };
        delete next[key];
        return { rowActions: next };
      }),
    resetAll: () => set({ rowActions: {} }),
  }),
);

export function getRowActionState(
  rowActions: Record<string, RowActionState>,
  key: string,
): RowActionState {
  return rowActions[key] ?? DEFAULT_ROW_STATE;
}

export function table12RowKey(row: {
  ad_type: string;
  campaign_id: string;
  placement: string;
}): string {
  return `${row.ad_type}:${row.campaign_id}:${row.placement}`;
}

export function table3RowKey(row: { ad_type: string; campaign_id: string }): string {
  return `${row.ad_type}:${row.campaign_id}`;
}

/** True while a row's cooldown hasn't expired yet. */
export function isInCooldown(rowState: RowActionState): boolean {
  return (
    rowState.status === "cooldown" &&
    !!rowState.cooldownUntil &&
    rowState.cooldownUntil > Date.now()
  );
}