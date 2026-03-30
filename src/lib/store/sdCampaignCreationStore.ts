/**
 * sdCampaignCreationStore.ts
 *
 * Fully self-contained Zustand store for all Sponsored Display campaign types.
 * No dependency on bulkCampaignStore or any SB store.
 *
 * Slices:
 *   'sd_retarget'            → SDRetargetBulkRow[]
 *   'sd_contextual_product'  → SDContextualProductBulkRow[]
 *   'sd_contextual_category' → SDContextualCategoryBulkRow[]
 *   'sd_audience'            → SDAudienceBulkRow[]
 */

import { create }  from 'zustand'
import { nanoid }  from 'nanoid'
import { isValidAsin } from '@/lib/utils/asinValidation'

// ── Row status ────────────────────────────────────────────────────────────────

export type SDRowStatus = 'idle' | 'loading' | 'success' | 'error'

// ── Base row ──────────────────────────────────────────────────────────────────

export interface SDBaseRow {
  _id:     string
  _status: SDRowStatus
  _error?: string
}

// ── Row types ─────────────────────────────────────────────────────────────────

export interface SDRetargetBulkRow extends SDBaseRow {
  campaign_name:   string
  asin:            string
  expression_type: 'views' | 'purchases'
  budget:          number
  default_bid:     number
  bid:             number
  start_date:      string
}

export interface SDContextualProductBulkRow extends SDBaseRow {
  campaign_name: string
  asin:          string
  target_asin:   string
  budget:        number
  default_bid:   number
  bid:           number
  start_date:    string
}

export interface SDContextualCategoryBulkRow extends SDBaseRow {
  campaign_name: string
  asin:          string
  target_asin:   string
  budget:        number
  default_bid:   number
  bid:           number
  start_date:    string
}

export interface SDAudienceBulkRow extends SDBaseRow {
  campaign_name: string
  asin:          string
  audience_type: 'IN_MARKET' | 'INTEREST'
  audience_ids:  string[]
  budget:        number
  default_bid:   number
  bid:           number
  start_date:    string
}

// ── Union ─────────────────────────────────────────────────────────────────────

export type SDAnyCampaignRow =
  | SDRetargetBulkRow
  | SDContextualProductBulkRow
  | SDContextualCategoryBulkRow
  | SDAudienceBulkRow

// ── Slice keys ────────────────────────────────────────────────────────────────

export type SDCampaignType =
  | 'sd_retarget'
  | 'sd_contextual_product'
  | 'sd_contextual_category'
  | 'sd_audience'

// ── Store ─────────────────────────────────────────────────────────────────────

interface SDSlice<R extends SDAnyCampaignRow> {
  rows: R[]
}

interface SDCampaignState {
  slices: Partial<Record<SDCampaignType, SDSlice<SDAnyCampaignRow>>>

  getRows:     <R extends SDAnyCampaignRow>(type: SDCampaignType) => R[]
  setRows:     <R extends SDAnyCampaignRow>(type: SDCampaignType, rows: R[]) => void
  appendRows:  <R extends SDAnyCampaignRow>(type: SDCampaignType, rows: R[]) => void
  clearRows:   (type: SDCampaignType) => void
  patchRows:   (type: SDCampaignType, ids: string[], status: SDRowStatus, error?: string) => void
  resetFailed: (type: SDCampaignType) => void
}

export const useSDCampaignStore = create<SDCampaignState>((set, get) => ({
  slices: {},

  getRows: <R extends SDAnyCampaignRow>(type: SDCampaignType): R[] =>
    (get().slices[type]?.rows ?? []) as R[],

  setRows: <R extends SDAnyCampaignRow>(type: SDCampaignType, rows: R[]) =>
    set((s) => ({
      slices: { ...s.slices, [type]: { rows } },
    })),

  appendRows: <R extends SDAnyCampaignRow>(type: SDCampaignType, rows: R[]) =>
    set((s) => ({
      slices: {
        ...s.slices,
        [type]: { rows: [...(s.slices[type]?.rows ?? []), ...rows] },
      },
    })),

  clearRows: (type) =>
    set((s) => ({
      slices: { ...s.slices, [type]: { rows: [] } },
    })),

  patchRows: (type, ids, status, error) =>
    set((s) => {
      const existing = s.slices[type]?.rows ?? []
      return {
        slices: {
          ...s.slices,
          [type]: {
            rows: existing.map((r) =>
              ids.includes(r._id) ? { ...r, _status: status, _error: error } : r
            ),
          },
        },
      }
    }),

  resetFailed: (type) =>
    set((s) => {
      const existing = s.slices[type]?.rows ?? []
      return {
        slices: {
          ...s.slices,
          [type]: {
            rows: existing.map((r) =>
              r._status === 'error' ? { ...r, _status: 'idle', _error: undefined } : r
            ),
          },
        },
      }
    }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

export const sdToday = () => new Date().toISOString().split('T')[0]

// ── Parse helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a tab-delimited line into a SDRetargetBulkRow.
 * Columns: ASIN | Expression Type | Default Bid | Bid | Budget
 */
export function parseSDRetargetLine(
  line: string,
): { row: SDRetargetBulkRow | null; invalidAsin: boolean } {
  const cols = line.split('\t').map((c) => c.trim())
  const [asin, expressionRaw, defaultBidRaw, bidRaw, budgetRaw] = cols

  if (!asin) return { row: null, invalidAsin: false }
  if (!isValidAsin(asin)) return { row: null, invalidAsin: true }

  const defaultBid = parseFloat(defaultBidRaw)
  const bid        = parseFloat(bidRaw)
  const budget     = parseFloat(budgetRaw)

  if (isNaN(defaultBid) || defaultBid <= 0) return { row: null, invalidAsin: false }
  if (isNaN(bid)        || bid        <= 0) return { row: null, invalidAsin: false }
  if (isNaN(budget)     || budget     <= 0) return { row: null, invalidAsin: false }

  const expressionType = (
    expressionRaw?.toLowerCase() === 'purchases' ? 'purchases' : 'views'
  ) as 'views' | 'purchases'

  return {
    invalidAsin: false,
    row: {
      _id:             nanoid(),
      _status:         'idle',
      campaign_name:   '',
      asin:            asin.toUpperCase().trim(),
      expression_type: expressionType,
      default_bid:     defaultBid,
      bid,
      budget,
      start_date:      sdToday(),
    },
  }
}

/**
 * Parse a tab-delimited line into a SDContextualProductBulkRow
 * or SDContextualCategoryBulkRow (same column layout, different type key).
 * Columns: ASIN | Target ASIN | Default Bid | Bid | Budget
 */
export function parseSDContextualLine(
  line: string,
): { row: SDContextualProductBulkRow | null; invalidAsin: boolean } {
  const cols = line.split('\t').map((c) => c.trim())
  const [asin, targetAsin, defaultBidRaw, bidRaw, budgetRaw] = cols

  if (!asin || !targetAsin)   return { row: null, invalidAsin: false }
  if (!isValidAsin(asin))       return { row: null, invalidAsin: true }
  if (!isValidAsin(targetAsin)) return { row: null, invalidAsin: true }

  const defaultBid = parseFloat(defaultBidRaw)
  const bid        = parseFloat(bidRaw)
  const budget     = parseFloat(budgetRaw)

  if (isNaN(defaultBid) || defaultBid <= 0) return { row: null, invalidAsin: false }
  if (isNaN(bid)        || bid        <= 0) return { row: null, invalidAsin: false }
  if (isNaN(budget)     || budget     <= 0) return { row: null, invalidAsin: false }

  return {
    invalidAsin: false,
    row: {
      _id:           nanoid(),
      _status:       'idle',
      campaign_name: '',
      asin:          asin.toUpperCase().trim(),
      target_asin:   targetAsin.toUpperCase().trim(),
      default_bid:   defaultBid,
      bid,
      budget,
      start_date:    sdToday(),
    },
  }
}

// ── Typed store accessors ─────────────────────────────────────────────────────

export function useSDRetargetStore() {
  const store = useSDCampaignStore()
  return {
    rows:        store.getRows<SDRetargetBulkRow>('sd_retarget'),
    setRows:     (rows: SDRetargetBulkRow[]) => store.setRows('sd_retarget', rows),
    appendRows:  (rows: SDRetargetBulkRow[]) => store.appendRows('sd_retarget', rows),
    clearRows:   () => store.clearRows('sd_retarget'),
    patchRows:   (ids: string[], status: SDRowStatus, error?: string) =>
                   store.patchRows('sd_retarget', ids, status, error),
    resetFailed: () => store.resetFailed('sd_retarget'),
  }
}

export function useSDContextualProductStore() {
  const store = useSDCampaignStore()
  return {
    rows:        store.getRows<SDContextualProductBulkRow>('sd_contextual_product'),
    setRows:     (rows: SDContextualProductBulkRow[]) => store.setRows('sd_contextual_product', rows),
    appendRows:  (rows: SDContextualProductBulkRow[]) => store.appendRows('sd_contextual_product', rows),
    clearRows:   () => store.clearRows('sd_contextual_product'),
    patchRows:   (ids: string[], status: SDRowStatus, error?: string) =>
                   store.patchRows('sd_contextual_product', ids, status, error),
    resetFailed: () => store.resetFailed('sd_contextual_product'),
  }
}

export function useSDContextualCategoryStore() {
  const store = useSDCampaignStore()
  return {
    rows:        store.getRows<SDContextualCategoryBulkRow>('sd_contextual_category'),
    setRows:     (rows: SDContextualCategoryBulkRow[]) => store.setRows('sd_contextual_category', rows),
    appendRows:  (rows: SDContextualCategoryBulkRow[]) => store.appendRows('sd_contextual_category', rows),
    clearRows:   () => store.clearRows('sd_contextual_category'),
    patchRows:   (ids: string[], status: SDRowStatus, error?: string) =>
                   store.patchRows('sd_contextual_category', ids, status, error),
    resetFailed: () => store.resetFailed('sd_contextual_category'),
  }
}

export function useSDAudienceStore() {
  const store = useSDCampaignStore()
  return {
    rows:        store.getRows<SDAudienceBulkRow>('sd_audience'),
    setRows:     (rows: SDAudienceBulkRow[]) => store.setRows('sd_audience', rows),
    appendRows:  (rows: SDAudienceBulkRow[]) => store.appendRows('sd_audience', rows),
    clearRows:   () => store.clearRows('sd_audience'),
    patchRows:   (ids: string[], status: SDRowStatus, error?: string) =>
                   store.patchRows('sd_audience', ids, status, error),
    resetFailed: () => store.resetFailed('sd_audience'),
  }
}