import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/config'
import { useCampaignDefaults } from '@/lib/hooks/campaignCreationHooks'
import { useAssets, useBrands } from '@/lib/hooks/queries/use-assets-brands'
import {
  useBulkCampaignStore,
  type SBVKeywordBulkRow,
  type SBVProductBulkRow,
  type SBVCategoryBulkRow,
  type SBVSpotlightBulkRow,
} from '@/lib/store/sbCampaignStore'

// ── Re-export for convenience ─────────────────────────────────────────────────
export { useCampaignDefaults }

// ── Asset / Brand selectors ───────────────────────────────────────────────────

export const useSBAssets = () => {
  const videos = useAssets('VIDEO')
  const images = useAssets('IMAGE')
  const logos  = useAssets('BRAND_LOGO')
  return { videos, images, logos }
}

export const useSBBrands = useBrands

// ── Result types ──────────────────────────────────────────────────────────────

export interface SBResult {
  success:      boolean
  data?:        Record<string, unknown>
  error?:       string
  failed_step?: string
}

function parseResult(raw: unknown): SBResult {
  const r      = raw as Record<string, unknown>
  const status = (r.statusCode as number) ?? 200
  if (status >= 400 || r.failed_step) {
    const errors = r.errors as Array<{ message: string }> | undefined
    return {
      success:     false,
      error:       errors?.[0]?.message ?? (r.error as string) ?? 'Campaign creation failed',
      failed_step: r.failed_step as string | undefined,
    }
  }
  return { success: true, data: r }
}

// ── Payload types ─────────────────────────────────────────────────────────────

export interface SBBasePayload {
  campaign_name?: string
  ad_group_name?: string
  start_date:     string
  budget:         number
  bid?:           number
}

export interface SBVCategoryPayload extends SBBasePayload {
  bid:            number
  asin:           string
  video_asset_id: string
}

export interface SBProductCollectionPayload extends SBBasePayload {
  headline:               string
  ad_name_prod?:          string
  asin_list:              string[]
  brand_logo_asset_id:    string
  brand_name:             string
  keywords:               { text: string; matchType: 'exact' | 'phrase' | 'broad'; bid: number }[]
  custom_image_asset_id:  string
}

export interface SBVSingleKWPayload extends SBBasePayload {
  video_asset_id:   string
  product_ad_name?: string
  asin:             string
  keyword_text:     { text: string; matchType: 'exact' | 'phrase' | 'broad'; bid: number }[]
}

export interface SBVSingleProductPayload extends SBBasePayload {
  video_asset_id: string
  asin:           string
  target_asins:   { asin: string; bid: number; matchType: 'EXACT' | 'EXPANDED' }[]
}

export interface SBVSpotlightPayload extends SBBasePayload {
  headline:               string
  ad_name?:               string
  asin_list:              string[]
  brand_logo_asset_id:    string
  keyword_text:           { text: string; matchType: 'exact' | 'phrase' | 'broad'; bid: number }[]
  custom_image_asset_id:  string
  home_page_url:          string
  sub_pages:              { pageTitle: string; asin: string; url: string }[]
}

// ── API calls ─────────────────────────────────────────────────────────────────

const BASE = '/api/campaign-creation/sb'

async function post(path: string, payload: unknown): Promise<SBResult> {
  try {
    const res = await apiClient.post(`${BASE}${path}`, payload)
    return parseResult(res.data)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } } })
      ?.response?.data?.detail ?? 'Request failed'
    return { success: false, error: msg }
  }
}

// ── useSBOperations ───────────────────────────────────────────────────────────

export function useSBOperations() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<SBResult | null>(null)

  const run = useCallback(async (fn: () => Promise<SBResult>) => {
    setLoading(true)
    setResult(null)
    const r = await fn()
    setResult(r)
    setLoading(false)
    return r
  }, [])

  const createSBVCategory = useCallback(
    (p: SBVCategoryPayload) => run(() => post('/sbv-category/', p)),
    [run],
  )

  const createProductCollection = useCallback(
    (p: SBProductCollectionPayload) => run(() => post('/product-collection/', p)),
    [run],
  )

  const createSBVSingleKW = useCallback(
    (p: SBVSingleKWPayload) => run(() => post('/sbv-single-asin-multi-kw/', p)),
    [run],
  )

  const createSBVSingleProduct = useCallback(
    (p: SBVSingleProductPayload) => run(() => post('/sbv-single-asin-multi-product/', p)),
    [run],
  )

  const createSBVSpotlight = useCallback(
    (p: SBVSpotlightPayload) => run(() => post('/store-spotlight/', p)),
    [run],
  )

  return {
    loading, result,
    createSBVCategory,
    createProductCollection,
    createSBVSingleKW,
    createSBVSingleProduct,
    createSBVSpotlight,
  }
}

// =============================================================================
// SB BULK SUBMIT
// =============================================================================

export type SBBulkGroupingMode = 'individual' | 'grouped'

interface BulkSummary { total: number; success: number; failed: number }

// ── Group rows by asin + video_asset_id ───────────────────────────────────────

function groupByAsinVideo<R extends { _id: string; asin: string; video_asset_id: string }>(
  rows: R[],
): Map<string, R[]> {
  const map = new Map<string, R[]>()
  for (const row of rows) {
    const key = `${row.asin}__${row.video_asset_id}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return map
}

// ── Group rows by brand_name ──────────────────────────────────────────────────

function groupByBrand<R extends { _id: string; brand_name: string }>(
  rows: R[],
): Map<string, R[]> {
  const map = new Map<string, R[]>()
  for (const row of rows) {
    if (!map.has(row.brand_name)) map.set(row.brand_name, [])
    map.get(row.brand_name)!.push(row)
  }
  return map
}

// ── useSBVKeywordBulkSubmit ───────────────────────────────────────────────────

export function useSBVKeywordBulkSubmit() {
  const store        = useBulkCampaignStore()
  const { createSBVSingleKW } = useSBOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const rows = store.getRows<SBVKeywordBulkRow>('sbv_keyword')

  async function _submitIndividual(pending: SBVKeywordBulkRow[]) {
    let success = 0, failed = 0
    for (const row of pending) {
      store.patchRows('sbv_keyword', [row._id], 'loading')
      const result = await createSBVSingleKW({
        campaign_name:  row.campaign_name || undefined,
        start_date:     row.start_date,
        budget:         row.budget,
        asin:           row.asin,
        video_asset_id: row.video_asset_id,
        keyword_text:   [{ text: row.keyword, matchType: row.match_type as any, bid: row.bid }],
      })
      if (result.success) {
        store.patchRows('sbv_keyword', [row._id], 'success'); success++
      } else {
        store.patchRows('sbv_keyword', [row._id], 'error', result.error); failed++
      }
    }
    return { success, failed }
  }

  async function _submitGrouped(pending: SBVKeywordBulkRow[]) {
    const groups = groupByAsinVideo(pending)
    let success = 0, failed = 0
    for (const [, groupRows] of groups) {
      const first = groupRows[0]
      const ids   = groupRows.map((r) => r._id)
      store.patchRows('sbv_keyword', ids, 'loading')
      const result = await createSBVSingleKW({
        campaign_name:  first.campaign_name || undefined,
        start_date:     first.start_date,
        budget:         first.budget,
        asin:           first.asin,
        video_asset_id: first.video_asset_id,
        keyword_text:   groupRows.map((r) => ({
          text:      r.keyword,
          matchType: r.match_type as any,
          bid:       r.bid,
        })),
      })
      if (result.success) {
        store.patchRows('sbv_keyword', ids, 'success'); success++
      } else {
        store.patchRows('sbv_keyword', ids, 'error', result.error); failed++
      }
    }
    return { success, failed, total: groups.size }
  }

  const submitAll = useCallback(async (mode: SBBulkGroupingMode) => {
    const pending = rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    const { success, failed } = mode === 'grouped'
      ? await _submitGrouped(pending)
      : await _submitIndividual(pending)
    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [rows])

  const retryFailed = useCallback((mode: SBBulkGroupingMode) => {
    store.resetFailed('sbv_keyword')
    submitAll(mode)
  }, [rows, submitAll])

  // ── Counts ─────────────────────────────────────────────────────────────────
  const rowPendingCount  = rows.filter((r) => r._status === 'idle').length
  const rowFailedCount   = rows.filter((r) => r._status === 'error').length
  const rowSuccessCount  = rows.filter((r) => r._status === 'success').length

  const groups            = groupByAsinVideo(rows)
  const groupPendingCount = [...groups.values()].filter((g) => g.every((r) => r._status === 'idle')).length
  const groupFailedCount  = [...groups.values()].filter((g) => g.some((r) => r._status === 'error')).length
  const groupSuccessCount = [...groups.values()].filter((g) => g.every((r) => r._status === 'success')).length

  return {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  }
}

// ── useSBVProductBulkSubmit ───────────────────────────────────────────────────

export function useSBVProductBulkSubmit() {
  const store        = useBulkCampaignStore()
  const { createSBVSingleProduct } = useSBOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const rows = store.getRows<SBVProductBulkRow>('sbv_product')

  async function _submitIndividual(pending: SBVProductBulkRow[]) {
    let success = 0, failed = 0
    for (const row of pending) {
      store.patchRows('sbv_product', [row._id], 'loading')
      const result = await createSBVSingleProduct({
        campaign_name:  row.campaign_name || undefined,
        start_date:     row.start_date,
        budget:         row.budget,
        asin:           row.asin,
        video_asset_id: row.video_asset_id,
        target_asins:   [{ asin: row.target_asin, bid: row.bid, matchType: row.match_type as any }],
      })
      if (result.success) {
        store.patchRows('sbv_product', [row._id], 'success'); success++
      } else {
        store.patchRows('sbv_product', [row._id], 'error', result.error); failed++
      }
    }
    return { success, failed }
  }

  async function _submitGrouped(pending: SBVProductBulkRow[]) {
    const groups = groupByAsinVideo(pending)
    let success = 0, failed = 0
    for (const [, groupRows] of groups) {
      const first = groupRows[0]
      const ids   = groupRows.map((r) => r._id)
      store.patchRows('sbv_product', ids, 'loading')
      const result = await createSBVSingleProduct({
        campaign_name:  first.campaign_name || undefined,
        start_date:     first.start_date,
        budget:         first.budget,
        asin:           first.asin,
        video_asset_id: first.video_asset_id,
        target_asins:   groupRows.map((r) => ({
          asin:      r.target_asin,
          bid:       r.bid,
          matchType: r.match_type as any,
        })),
      })
      if (result.success) {
        store.patchRows('sbv_product', ids, 'success'); success++
      } else {
        store.patchRows('sbv_product', ids, 'error', result.error); failed++
      }
    }
    return { success, failed, total: groups.size }
  }

  const submitAll = useCallback(async (mode: SBBulkGroupingMode) => {
    const pending = rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    const { success, failed } = mode === 'grouped'
      ? await _submitGrouped(pending)
      : await _submitIndividual(pending)
    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [rows])

  const retryFailed = useCallback((mode: SBBulkGroupingMode) => {
    store.resetFailed('sbv_product')
    submitAll(mode)
  }, [rows, submitAll])

  const rowPendingCount  = rows.filter((r) => r._status === 'idle').length
  const rowFailedCount   = rows.filter((r) => r._status === 'error').length
  const rowSuccessCount  = rows.filter((r) => r._status === 'success').length

  const groups            = groupByAsinVideo(rows)
  const groupPendingCount = [...groups.values()].filter((g) => g.every((r) => r._status === 'idle')).length
  const groupFailedCount  = [...groups.values()].filter((g) => g.some((r) => r._status === 'error')).length
  const groupSuccessCount = [...groups.values()].filter((g) => g.every((r) => r._status === 'success')).length

  return {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  }
}

// ── useSBVCategoryBulkSubmit ──────────────────────────────────────────────────
// Category has no grouping concept (no multi-target rows) so grouping mode
// is always 'individual' — one campaign per ASIN + video_asset_id pair.

export function useSBVCategoryBulkSubmit() {
  const store      = useBulkCampaignStore()
  const { createSBVCategory } = useSBOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const rows = store.getRows<SBVCategoryBulkRow>('sbv_category')

  const submitAll = useCallback(async () => {
    const pending = rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    let success = 0, failed = 0
    for (const row of pending) {
      store.patchRows('sbv_category', [row._id], 'loading')
      const result = await createSBVCategory({
        campaign_name:  row.campaign_name || undefined,
        start_date:     row.start_date,
        budget:         row.budget,
        asin:           row.asin,
        video_asset_id: row.video_asset_id,
        bid:            row.bid,
      })
      if (result.success) {
        store.patchRows('sbv_category', [row._id], 'success'); success++
      } else {
        store.patchRows('sbv_category', [row._id], 'error', result.error); failed++
      }
    }
    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [rows])

  const retryFailed = useCallback(() => {
    store.resetFailed('sbv_category')
    submitAll()
  }, [rows, submitAll])

  const rowPendingCount = rows.filter((r) => r._status === 'idle').length
  const rowFailedCount  = rows.filter((r) => r._status === 'error').length
  const rowSuccessCount = rows.filter((r) => r._status === 'success').length

  return {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
  }
}

// ── useSBVSpotlightBulkSubmit ─────────────────────────────────────────────────
// Grouped by brand_name — one campaign per brand with all its keywords batched.

export function useSBVSpotlightBulkSubmit() {
  const store      = useBulkCampaignStore()
  const { createSBVSpotlight } = useSBOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const rows = store.getRows<SBVSpotlightBulkRow>('sbv_spotlight')

  async function _submitIndividual(pending: SBVSpotlightBulkRow[]) {
    let success = 0, failed = 0
    for (const row of pending) {
      store.patchRows('sbv_spotlight', [row._id], 'loading')
      const result = await createSBVSpotlight({
        campaign_name:         row.campaign_name || undefined,
        start_date:            row.start_date,
        budget:                row.budget,
        headline:              row.headline,
        brand_logo_asset_id:   row.brand_logo_asset_id,
        custom_image_asset_id: row.custom_image_asset_id,
        home_page_url:         row.home_page_url,
        asin_list:             [],
        sub_pages:             [],
        keyword_text: [{
          text:      row.keyword,
          matchType: row.match_type as any,
          bid:       row.bid,
        }],
      })
      if (result.success) {
        store.patchRows('sbv_spotlight', [row._id], 'success'); success++
      } else {
        store.patchRows('sbv_spotlight', [row._id], 'error', result.error); failed++
      }
    }
    return { success, failed }
  }

  async function _submitGrouped(pending: SBVSpotlightBulkRow[]) {
    const groups = groupByBrand(pending)
    let success = 0, failed = 0
    for (const [, groupRows] of groups) {
      const first = groupRows[0]
      const ids   = groupRows.map((r) => r._id)
      store.patchRows('sbv_spotlight', ids, 'loading')
      const result = await createSBVSpotlight({
        campaign_name:         first.campaign_name || undefined,
        start_date:            first.start_date,
        budget:                first.budget,
        headline:              first.headline,
        brand_logo_asset_id:   first.brand_logo_asset_id,
        custom_image_asset_id: first.custom_image_asset_id,
        home_page_url:         first.home_page_url,
        asin_list:             [],
        sub_pages:             [],
        keyword_text: groupRows.map((r) => ({
          text:      r.keyword,
          matchType: r.match_type as any,
          bid:       r.bid,
        })),
      })
      if (result.success) {
        store.patchRows('sbv_spotlight', ids, 'success'); success++
      } else {
        store.patchRows('sbv_spotlight', ids, 'error', result.error); failed++
      }
    }
    return { success, failed, total: groups.size }
  }

  const submitAll = useCallback(async (mode: SBBulkGroupingMode) => {
    const pending = rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    const { success, failed } = mode === 'grouped'
      ? await _submitGrouped(pending)
      : await _submitIndividual(pending)
    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [rows])

  const retryFailed = useCallback((mode: SBBulkGroupingMode) => {
    store.resetFailed('sbv_spotlight')
    submitAll(mode)
  }, [rows, submitAll])

  // ── Counts ─────────────────────────────────────────────────────────────────
  const rowPendingCount  = rows.filter((r) => r._status === 'idle').length
  const rowFailedCount   = rows.filter((r) => r._status === 'error').length
  const rowSuccessCount  = rows.filter((r) => r._status === 'success').length

  const groups            = groupByBrand(rows)
  const groupPendingCount = [...groups.values()].filter((g) => g.every((r) => r._status === 'idle')).length
  const groupFailedCount  = [...groups.values()].filter((g) => g.some((r) => r._status === 'error')).length
  const groupSuccessCount = [...groups.values()].filter((g) => g.every((r) => r._status === 'success')).length

  return {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  }
}