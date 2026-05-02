/**
 * bulkCampaignStore.ts
 *
 * General-purpose bulk campaign store shared across ALL campaign types
 * (SP and SB). Each campaign type gets its own isolated slice keyed by
 * a string type identifier so slices never interfere with each other.
 *
 * Adding a new campaign type later requires only:
 *  1. Define a new BulkRowShape for that type
 *  2. Call useBulkStore('<new-type>') in the relevant hook / component
 */

import { create } from 'zustand'
import { nanoid } from 'nanoid'

// ── Row status ────────────────────────────────────────────────────────────────

export type BulkRowStatus = 'idle' | 'loading' | 'success' | 'error'

// ── Base row — every bulk row has these ──────────────────────────────────────

export interface BulkBaseRow {
  _id:     string
  _status: BulkRowStatus
  _error?: string
}

// ── Per-type row shapes ───────────────────────────────────────────────────────

/** SP keyword targeting */
export interface SPKeywordBulkRow extends BulkBaseRow {
  campaign_name:   string
  asin:            string
  keyword:         string
  match_type:      string
  bid:             number
  budget:          number
  start_date:      string
  dynamic_bidding: string
}

/** SP product targeting */
export interface SPProductBulkRow extends BulkBaseRow {
  campaign_name:  string
  asin:           string
  target_asin:    string
  match_type:     string
  bid:            number
  budget:         number
  start_date:     string
  dynamic_bidding: string
}

/** SBV Single ASIN Multi Keyword */
export interface SBVKeywordBulkRow extends BulkBaseRow {
  campaign_name:  string
  asin:           string
  video_asset_id: string
  brand_entity_id: string 
  keyword:        string
  match_type:     string
  bid:            number
  budget:         number
  start_date:     string
  intent:          string
}

/** SBV Single ASIN Multi Product */
export interface SBVProductBulkRow extends BulkBaseRow {
  campaign_name:   string
  asin:            string
  video_asset_id:  string
  brand_entity_id: string  
  target_asin:     string
  match_type:      string
  bid:             number
  budget:          number
  start_date:      string
  intent:          string   
}

/** SBV Category Target */
export interface SBVCategoryBulkRow extends BulkBaseRow {
  campaign_name:   string
  asin:            string
  video_asset_id:  string
  brand_entity_id: string
  bid:             number
  budget:          number
  start_date:      string
  intent:          string
  price_greater_than: number | ''
}

/** SB Store Spotlight — Keyword Targeting */
export interface SBVSpotlightBulkRow extends BulkBaseRow {
  campaign_name:         string
  brand_name:            string
  headline:              string
  home_page_url:         string
  brand_logo_asset_id:   string
  brand_entity_id:       string
  custom_image_asset_id: string
  keyword:               string
  match_type:            string
  bid:                   number
  budget:                number
  start_date:            string
}

// ── Union of all row shapes ───────────────────────────────────────────────────

export type AnyBulkRow =
  | SPKeywordBulkRow
  | SPProductBulkRow
  | SBVKeywordBulkRow
  | SBVProductBulkRow
  | SBVCategoryBulkRow
  | SBVSpotlightBulkRow

// ── Campaign type keys ────────────────────────────────────────────────────────

export type BulkCampaignType =
  | 'sp_keyword'
  | 'sp_product'
  | 'sbv_keyword'
  | 'sbv_product'
  | 'sbv_category'
  | 'sbv_spotlight'

// ── Slice shape ───────────────────────────────────────────────────────────────

interface BulkSlice<R extends AnyBulkRow> {
  rows: R[]
}

// ── Store state ───────────────────────────────────────────────────────────────

interface BulkCampaignState {
  slices: Partial<Record<BulkCampaignType, BulkSlice<AnyBulkRow>>>

  getRows:    <R extends AnyBulkRow>(type: BulkCampaignType) => R[]
  setRows:    <R extends AnyBulkRow>(type: BulkCampaignType, rows: R[]) => void
  clearRows:  (type: BulkCampaignType) => void
  appendRows: <R extends AnyBulkRow>(type: BulkCampaignType, rows: R[]) => void

  /** Patch status/error on specific rows by _id */
  patchRows: (
    type:    BulkCampaignType,
    ids:     string[],
    status:  BulkRowStatus,
    error?:  string,
  ) => void

  /** Reset error rows back to idle (for retry) */
  resetFailed: (type: BulkCampaignType) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBulkCampaignStore = create<BulkCampaignState>((set, get) => ({
  slices: {},

  getRows: <R extends AnyBulkRow>(type: BulkCampaignType): R[] =>
    ((get().slices[type]?.rows ?? []) as R[]),

  setRows: <R extends AnyBulkRow>(type: BulkCampaignType, rows: R[]) =>
    set((s) => ({
      slices: {
        ...s.slices,
        [type]: { rows },
      },
    })),

  clearRows: (type) =>
    set((s) => ({
      slices: { ...s.slices, [type]: { rows: [] } },
    })),

  appendRows: <R extends AnyBulkRow>(type: BulkCampaignType, rows: R[]) =>
    set((s) => ({
      slices: {
        ...s.slices,
        [type]: { rows: [...(s.slices[type]?.rows ?? []), ...rows] },
      },
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

export function makeBaseRow(): BulkBaseRow {
  return { _id: nanoid(), _status: 'idle' }
}

export const today = () => new Date().toISOString().split('T')[0]