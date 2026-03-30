import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/config'
import { useCampaignDefaults } from '@/lib/hooks/campaignCreationHooks'
import {
  useSDRetargetStore,
  useSDContextualProductStore,
  useSDContextualCategoryStore,
  useSDAudienceStore,
  type SDRetargetBulkRow,
  type SDContextualProductBulkRow,
  type SDContextualCategoryBulkRow,
  type SDAudienceBulkRow,
} from '@/lib/store/sdCampaignCreationStore'

export { useCampaignDefaults }

// ── Result types ──────────────────────────────────────────────────────────────

export interface SDResult {
  success:      boolean
  data?:        Record<string, unknown>
  error?:       string
  failed_step?: string
}

function parseResult(raw: unknown): SDResult {
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

export interface SDBasePayload {
  campaign_name?: string
  ad_group_name?: string
  start_date:     string
  budget:         number
  default_bid:    number
  bid:            number
}

export interface SDRetargetPayload extends SDBasePayload {
  asins:           string[]
  expression_type: 'views' | 'purchases'
}

export interface SDContextualProductPayload extends SDBasePayload {
  asins:     string[]
  asin_list: string[]
}

export interface SDContextualCategoryPayload extends SDBasePayload {
  asin:        string
  target_asin: string
}

export interface SDAudiencePayload extends SDBasePayload {
  asin:          string
  audience_type: 'IN_MARKET' | 'INTEREST'
  audience_ids:  string[]
}

// ── Suggestion types ──────────────────────────────────────────────────────────

export interface SDCategory {
  index: number
  id:    string
  name:  string
  path:  string[]
}

export interface SDAudience {
  index:        number
  audienceId:   string
  audienceName: string
}

export interface SDAudienceSuggestions {
  categories: SDCategory[]
  audiences:  SDAudience[]
}

// ── API helpers ───────────────────────────────────────────────────────────────

const BASE = '/api/v1/campaign-creation/sd'

async function post(path: string, payload: unknown): Promise<SDResult> {
  try {
    const res = await apiClient.post(`${BASE}${path}`, payload)
    return parseResult(res.data)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } } })
      ?.response?.data?.detail ?? 'Request failed'
    return { success: false, error: msg }
  }
}

// ── useSDAudienceSuggestions ──────────────────────────────────────────────────

export function useSDAudienceSuggestions() {
  const [loading,     setLoading]     = useState(false)
  const [suggestions, setSuggestions] = useState<SDAudienceSuggestions | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  const fetch = useCallback(async (
    asin:         string,
    audienceType: 'IN_MARKET' | 'INTEREST',
  ) => {
    if (!asin.trim()) return
    setLoading(true)
    setError(null)
    setSuggestions(null)
    try {
      const res = await apiClient.get(`${BASE}/audience-suggestions/`, {
        params: { asin: asin.trim().toUpperCase(), audience_type: audienceType },
      })
      setSuggestions(res.data as SDAudienceSuggestions)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to fetch audience suggestions'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setSuggestions(null)
    setError(null)
  }, [])

  return { fetch, loading, suggestions, error, clear }
}

// ── useSDOperations ───────────────────────────────────────────────────────────

export function useSDOperations() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<SDResult | null>(null)

  const run = useCallback(async (fn: () => Promise<SDResult>) => {
    setLoading(true)
    setResult(null)
    const r = await fn()
    setResult(r)
    setLoading(false)
    return r
  }, [])

  const createSDRetarget = useCallback(
    (p: SDRetargetPayload) => run(() => post('/retarget/', p)),
    [run],
  )
  const createSDContextualProduct = useCallback(
    (p: SDContextualProductPayload) => run(() => post('/contextual-product/', p)),
    [run],
  )
  const createSDContextualCategory = useCallback(
    (p: SDContextualCategoryPayload) => run(() => post('/contextual-category/', p)),
    [run],
  )
  const createSDAudience = useCallback(
    (p: SDAudiencePayload) => run(() => post('/audience/', p)),
    [run],
  )

  return {
    loading, result,
    createSDRetarget,
    createSDContextualProduct,
    createSDContextualCategory,
    createSDAudience,
  }
}

// =============================================================================
// BULK SUBMIT HOOKS
// =============================================================================

interface BulkSummary { total: number; success: number; failed: number }

// ── useSDRetargetBulkSubmit ───────────────────────────────────────────────────

export function useSDRetargetBulkSubmit() {
  const store                = useSDRetargetStore()
  const { createSDRetarget } = useSDOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const submitAll = useCallback(async () => {
    const pending = store.rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    let success = 0, failed = 0

    for (const row of pending) {
      store.patchRows([row._id], 'loading')
      const result = await createSDRetarget({
        campaign_name:   row.campaign_name || undefined,
        start_date:      row.start_date,
        budget:          row.budget,
        default_bid:     row.default_bid,
        bid:             row.bid,
        asins:           [row.asin],
        expression_type: row.expression_type,
      })
      if (result.success) {
        store.patchRows([row._id], 'success'); success++
      } else {
        store.patchRows([row._id], 'error', result.error); failed++
      }
    }

    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [store.rows])

  const retryFailed = useCallback(() => {
    store.resetFailed()
    submitAll()
  }, [store.rows, submitAll])

  const pendingCount = store.rows.filter((r) => r._status === 'idle').length
  const failedCount  = store.rows.filter((r) => r._status === 'error').length
  const successCount = store.rows.filter((r) => r._status === 'success').length

  return {
    rows: store.rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    pendingCount, failedCount, successCount,
  }
}

// ── useSDContextualProductBulkSubmit ──────────────────────────────────────────

export function useSDContextualProductBulkSubmit() {
  const store                         = useSDContextualProductStore()
  const { createSDContextualProduct } = useSDOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const submitAll = useCallback(async () => {
    const pending = store.rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    let success = 0, failed = 0

    for (const row of pending) {
      store.patchRows([row._id], 'loading')
      const result = await createSDContextualProduct({
        campaign_name: row.campaign_name || undefined,
        start_date:    row.start_date,
        budget:        row.budget,
        default_bid:   row.default_bid,
        bid:           row.bid,
        asins:         [row.asin],
        asin_list:     [row.target_asin],
      })
      if (result.success) {
        store.patchRows([row._id], 'success'); success++
      } else {
        store.patchRows([row._id], 'error', result.error); failed++
      }
    }

    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [store.rows])

  const retryFailed = useCallback(() => {
    store.resetFailed()
    submitAll()
  }, [store.rows, submitAll])

  const pendingCount = store.rows.filter((r) => r._status === 'idle').length
  const failedCount  = store.rows.filter((r) => r._status === 'error').length
  const successCount = store.rows.filter((r) => r._status === 'success').length

  return {
    rows: store.rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    pendingCount, failedCount, successCount,
  }
}

// ── useSDContextualCategoryBulkSubmit ─────────────────────────────────────────

export function useSDContextualCategoryBulkSubmit() {
  const store                          = useSDContextualCategoryStore()
  const { createSDContextualCategory } = useSDOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const submitAll = useCallback(async () => {
    const pending = store.rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    let success = 0, failed = 0

    for (const row of pending) {
      store.patchRows([row._id], 'loading')
      const result = await createSDContextualCategory({
        campaign_name: row.campaign_name || undefined,
        start_date:    row.start_date,
        budget:        row.budget,
        default_bid:   row.default_bid,
        bid:           row.bid,
        asin:          row.asin,
        target_asin:   row.target_asin,
      })
      if (result.success) {
        store.patchRows([row._id], 'success'); success++
      } else {
        store.patchRows([row._id], 'error', result.error); failed++
      }
    }

    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [store.rows])

  const retryFailed = useCallback(() => {
    store.resetFailed()
    submitAll()
  }, [store.rows, submitAll])

  const pendingCount = store.rows.filter((r) => r._status === 'idle').length
  const failedCount  = store.rows.filter((r) => r._status === 'error').length
  const successCount = store.rows.filter((r) => r._status === 'success').length

  return {
    rows: store.rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    pendingCount, failedCount, successCount,
  }
}

// ── useSDAudienceBulkSubmit ───────────────────────────────────────────────────

export function useSDAudienceBulkSubmit() {
  const store                = useSDAudienceStore()
  const { createSDAudience } = useSDOperations()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSummary | null>(null)

  const clearSummary = useCallback(() => setSummary(null), [])

  const submitAll = useCallback(async () => {
    const pending = store.rows.filter((r) => r._status === 'idle' || r._status === 'error')
    if (!pending.length) return
    setIsSubmitting(true)
    let success = 0, failed = 0

    for (const row of pending) {
      store.patchRows([row._id], 'loading')
      const result = await createSDAudience({
        campaign_name: row.campaign_name || undefined,
        start_date:    row.start_date,
        budget:        row.budget,
        default_bid:   row.default_bid,
        bid:           row.bid,
        asin:          row.asin,
        audience_type: row.audience_type,
        audience_ids:  row.audience_ids,
      })
      if (result.success) {
        store.patchRows([row._id], 'success'); success++
      } else {
        store.patchRows([row._id], 'error', result.error); failed++
      }
    }

    setSummary({ total: pending.length, success, failed })
    setIsSubmitting(false)
  }, [store.rows])

  const retryFailed = useCallback(() => {
    store.resetFailed()
    submitAll()
  }, [store.rows, submitAll])

  const pendingCount = store.rows.filter((r) => r._status === 'idle').length
  const failedCount  = store.rows.filter((r) => r._status === 'error').length
  const successCount = store.rows.filter((r) => r._status === 'success').length

  return {
    rows: store.rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    pendingCount, failedCount, successCount,
  }
}