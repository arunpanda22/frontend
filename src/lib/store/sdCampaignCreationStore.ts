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
  intent:          string 
  expression_type: 'views' | 'purchases'
  lookback_window: number 
  budget:          number
  default_bid:     number
  bid:             number
  start_date:      string
}

export interface SDContextualProductBulkRow extends SDBaseRow {
  campaign_name: string
  intent:        string 
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
  intent:        string
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
 * Columns: ASIN | Expression Type | Targeting Bid | Budget (opt) | Intent (opt)
 * Budget defaults to max(minBudget, bid * 15) if missing.
 * Intent is used to build campaign_name if provided.
 */
export function parseSDRetargetLine(
  line:      string,
  minBid:    number,
  minBudget: number,
): { row: SDRetargetBulkRow | null; invalidAsin: boolean } {
  const cols = line.split('\t').map((c) => c.trim())
  const [asin, expressionRaw, bidRaw, budgetRaw,lookbackRaw, intentRaw] = cols

  const parsedLookback = parseInt(lookbackRaw)
  const lookback_window = !isNaN(parsedLookback) && [7,14,30,60,90,180,365].includes(parsedLookback)
    ? parsedLookback
    : 30  

  if (!asin) return { row: null, invalidAsin: false }
  if (!isValidAsin(asin)) return { row: null, invalidAsin: true }

  const bid = parseFloat(bidRaw)
  if (isNaN(bid) || bid <= 0) return { row: null, invalidAsin: false }

  const parsedBudget = parseFloat(budgetRaw)
  const budget = !isNaN(parsedBudget) && parsedBudget > 0
    ? parsedBudget
    : Math.max(minBudget, bid * 15)

  const expressionType = (
    expressionRaw?.toLowerCase() === 'purchases' ? 'purchases' : 'views'
  ) as 'views' | 'purchases'

  const intent = intentRaw?.trim() ?? ''
  const intentSuffix = intent ? ` - ${intent}` : ''
  const campaign_name = `${asin.toUpperCase().trim()} - SD - RT - ${expressionType.charAt(0).toUpperCase() + expressionType.slice(1)}${intentSuffix}`

  return {
    invalidAsin: false,
    row: {
      _id:             nanoid(),
      _status:         'idle',
      campaign_name,
      intent,
      asin:            asin.toUpperCase().trim(),
      expression_type: expressionType,
      lookback_window,  
      default_bid:     0,
      bid,
      budget,
      start_date:      sdToday(),
    },
  }
}

/**
 * Columns: Advertised ASIN | Target ASIN | Targeting Bid | Budget (opt) | Intent (opt)
 * Budget defaults to max(minBudget, bid * 15) if missing.
 * subtype drives the campaign name suffix: 'product' → CP, 'category' → CAT
 *
 * The target ASIN is always folded into campaign_name (before the intent suffix).
 * Without it, bulk-pasted rows that share the same advertised ASIN but target
 * different ASINs would all resolve to the identical campaign name.
 */
export function parseSDContextualLine(
  line:      string,
  subtype:   'product' | 'category',
  minBid:    number,
  minBudget: number,
): { row: SDContextualProductBulkRow | null; invalidAsin: boolean } {
  const cols = line.split('\t').map((c) => c.trim())
  const [asin, targetAsin, bidRaw, budgetRaw, intentRaw] = cols

  if (!asin || !targetAsin)     return { row: null, invalidAsin: false }
  if (!isValidAsin(asin))       return { row: null, invalidAsin: true }
  if (!isValidAsin(targetAsin)) return { row: null, invalidAsin: true }

  const bid = parseFloat(bidRaw)
  if (isNaN(bid) || bid <= 0) return { row: null, invalidAsin: false }

  const parsedBudget = parseFloat(budgetRaw)
  const budget = !isNaN(parsedBudget) && parsedBudget > 0
    ? parsedBudget
    : Math.max(minBudget, bid * 15)

  const intent        = intentRaw?.trim() ?? ''
  const intentSuffix  = intent ? ` - ${intent}` : ''
  const tag           = subtype === 'category' ? 'CAT' : 'CP'
  const targetSuffix  = ` - ${targetAsin.toUpperCase().trim()}`
  const campaign_name = `${asin.toUpperCase().trim()} - SD - ${tag}${targetSuffix}${intentSuffix}`

  return {
    invalidAsin: false,
    row: {
      _id:           nanoid(),
      _status:       'idle',
      campaign_name,
      intent,
      asin:          asin.toUpperCase().trim(),
      target_asin:   targetAsin.toUpperCase().trim(),
      default_bid:   0,
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