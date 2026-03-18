import { apiClient } from '@/lib/api/config'
import { useCallback, useState, useMemo } from 'react'
import {
  useCampaignCreationStore,
  type BulkCampaignRow,
  type BulkProductRow,
} from '@/lib/store/campaignCreationStore'

// ── Response / Error Types ────────────────────────────────────────────────────

export interface CampaignSuccessResponse {
  statusCode:    number
  campaign_name: string
  campaign_id:   string
  ad_group_id:   string
  ad_ids:        string[]
  keyword_ids?:  string[]
  target_ids?:   unknown
}

export interface CampaignErrorDetail {
  message:   string
  reason?:   string
  location?: string
  trigger?:  string
}

export interface CampaignApiErrorShape {
  failed_step?:      string
  errors?:           CampaignErrorDetail[]
  partial_creation?: Record<string, unknown>
  error?:            string
}

// ── Payload Types ─────────────────────────────────────────────────────────────

interface BasePayload {
  campaign_name?:  string
  budget:          number
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL'
  default_bid:     number
  start_date:      string
}

export interface KeywordItem {
  text:       string
  match_type: 'EXACT' | 'BROAD' | 'PHRASE'
  bid:        number
}

export interface KeywordTargetingPayload extends BasePayload {
  asins:    string[]
  keywords: KeywordItem[]
  theme?:   string
}

export interface ProductTargetingTarget {
  asin:       string
  match_type: 'EXACT' | 'EXPANDED'
  bid:        number
}

export interface ProductTargetingPayload extends BasePayload {
  asins:   string[]
  targets: ProductTargetingTarget[]
  theme?:  string
}

export type AutoState = 'ENABLED' | 'PAUSED'

export interface AutoTargetingPayload extends BasePayload {
  asins:             string[]
  close_match_state: AutoState
  loose_match_state: AutoState
  substitutes_state: AutoState
  complements_state: AutoState
  close_match_bid:   number
  loose_match_bid:   number
  substitutes_bid:   number
  complements_bid:   number
  theme?:            string
}

export interface MultiCategoryPayload extends BasePayload {
  asin:            string
  bid:             number
  expression_type: 'MANUAL' | 'AUTO'
  type:            string
}

export interface SingleCategoryPayload extends BasePayload {
  asin:            string
  category_id?:     string
  bid:             number
  expression_type: 'MANUAL' | 'AUTO'
  type:            string
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const campaignApi = {
  createKeywordTargeting: (payload: KeywordTargetingPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/campaigns/keyword-targeting/',
      payload
    ),

  createProductTargeting: (payload: ProductTargetingPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/campaigns/product-targeting/',
      payload
    ),

  createAutoTargeting: (payload: AutoTargetingPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/campaigns/auto-targeting/',
      payload
    ),

  createMultiCategory: (payload: MultiCategoryPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/campaigns/multi-category/',
      payload
    ),

  createSingleCategory: (payload: SingleCategoryPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/campaigns/single-category/',
      payload
    ),
}

// ── useCampaignOperations ─────────────────────────────────────────────────────

export interface CampaignOperationResult {
  success:        boolean
  data?:          CampaignSuccessResponse
  error?:         string
  failed_step?:   string
  error_details?: CampaignApiErrorShape['errors']
  partial?:       CampaignApiErrorShape['partial_creation']
}

interface OperationState {
  isLoading: boolean
  result:    CampaignOperationResult | null
}

function parseError(error: unknown): CampaignOperationResult {
  const body = (error as any)?.response?.data as CampaignApiErrorShape | undefined

  console.error('❌ Campaign creation failed:', {
    step:    body?.failed_step,
    errors:  body?.errors,
    partial: body?.partial_creation,
    raw:     (error as any)?.message,
  })

  return {
    success:       false,
    error:         body?.errors?.[0]?.message ?? body?.error ?? (error as any)?.message ?? 'Unknown error',
    failed_step:   body?.failed_step,
    error_details: body?.errors,
    partial:       body?.partial_creation,
  }
}

function useCampaignOperation<TPayload>(
  apiFn: (payload: TPayload) => Promise<{ data: CampaignSuccessResponse }>,
  label: string,
) {
  const [state, setState] = useState<OperationState>({ isLoading: false, result: null })

  const execute = useCallback(async (payload: TPayload): Promise<CampaignOperationResult> => {
    try {
      setState({ isLoading: true, result: null })
      const response = await apiFn(payload)
      const result: CampaignOperationResult = { success: true, data: response.data }
      console.log(`✅ ${label} campaign created:`, response.data)
      setState({ isLoading: false, result })
      return result
    } catch (error) {
      const result = parseError(error)
      setState({ isLoading: false, result })
      return result
    }
  }, [apiFn, label])

  return { execute, isLoading: state.isLoading, result: state.result }
}

export function useCampaignOperations() {
  const keyword   = useCampaignOperation(campaignApi.createKeywordTargeting,  'Keyword targeting')
  const product   = useCampaignOperation(campaignApi.createProductTargeting,  'Product targeting')
  const auto      = useCampaignOperation(campaignApi.createAutoTargeting,     'Auto targeting')
  const multiCat  = useCampaignOperation(campaignApi.createMultiCategory,     'Multi-category')
  const singleCat = useCampaignOperation(campaignApi.createSingleCategory,    'Single-category')

  return {
    createKeywordTargetingCampaign:  keyword.execute,
    isKeywordLoading:                keyword.isLoading,
    keywordResult:                   keyword.result,

    createProductTargetingCampaign:  product.execute,
    isProductLoading:                product.isLoading,
    productResult:                   product.result,

    createAutoTargetingCampaign:     auto.execute,
    isAutoLoading:                   auto.isLoading,
    autoResult:                      auto.result,

    createMultiCategoryCampaign:     multiCat.execute,
    isMultiCatLoading:               multiCat.isLoading,
    multiCatResult:                  multiCat.result,

    createSingleCategoryCampaign:    singleCat.execute,
    isSingleCatLoading:              singleCat.isLoading,
    singleCatResult:                 singleCat.result,
  }
}

// ── useBulkCampaignSubmit ─────────────────────────────────────────────────────

export type GroupingMode = 'individual' | 'grouped'

export interface BulkSubmitSummary {
  total:   number
  success: number
  failed:  number
}

function rowToPayload(
  row: BulkCampaignRow,
  TOS: number,
  ROS: number,
  PP: number,
  AB: number,
): KeywordTargetingPayload {
  return {
    budget:          row.budget,
    TOS_bidding:     TOS,
    ROS_bidding:     ROS,
    PP_bidding:      PP,
    AB_bidding:      AB,
    dynamic_bidding: row.dynamic_bidding,
    default_bid:     row.bid,
    start_date:      row.start_date,
    asins:           [row.asin],
    keywords: [{ text: row.keyword, match_type: row.match_type, bid: row.bid }],
  }
}

function parseBulkError(error: unknown): string {
  const body = (error as any)?.response?.data as CampaignApiErrorShape | undefined
  return body?.errors?.[0]?.message ?? body?.error ?? (error as any)?.message ?? 'Unknown error'
}

export function useBulkCampaignSubmit() {
  const { bulkRows, sharedDefaults, setRowStatus, setRowStatusByAsin } =
    useCampaignCreationStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSubmitSummary | null>(null)

  const submitAll = useCallback(async (mode: GroupingMode): Promise<BulkSubmitSummary> => {
    const { TOS_bidding, ROS_bidding, PP_bidding, AB_bidding } = sharedDefaults
    setIsSubmitting(true)
    setSummary(null)
    let successes = 0
    let failures  = 0
    let total     = 0

    if (mode === 'individual') {
      // ── One row = one campaign ───────────────────────────────────────────────
      const pending = bulkRows.filter((r) => r._status !== 'success')
      total = pending.length
      if (total === 0) { setIsSubmitting(false); const s = { total: 0, success: 0, failed: 0 }; setSummary(s); return s }

      for (const row of pending) {
        setRowStatus(row._id, 'loading')
        try {
          const response = await campaignApi.createKeywordTargeting(
            rowToPayload(row, TOS_bidding, ROS_bidding, PP_bidding, AB_bidding)
          )
          console.log(`✅ KW campaign [${row.asin} / ${row.keyword}]:`, response.data.campaign_id)
          setRowStatus(row._id, 'success')
          successes++
        } catch (error) {
          const msg = parseBulkError(error)
          console.error(`❌ KW campaign failed [${row.asin} / ${row.keyword}]:`, msg)
          setRowStatus(row._id, 'error', msg)
          failures++
        }
      }
    } else {
      // ── Group by asin = one campaign per asin with all its keywords ──────────
      const groupMap = new Map<string, BulkCampaignRow[]>()
      for (const row of bulkRows) {
        if (!groupMap.has(row.asin)) groupMap.set(row.asin, [])
        groupMap.get(row.asin)!.push(row)
      }
      const pendingGroups = [...groupMap.entries()].filter(
        ([, rows]) => rows.some((r) => r._status !== 'success')
      )
      total = pendingGroups.length
      if (total === 0) { setIsSubmitting(false); const s = { total: 0, success: 0, failed: 0 }; setSummary(s); return s }

      for (const [asin, rows] of pendingGroups) {
        const first = rows[0]
        setRowStatusByAsin(asin, 'loading')
        try {
          const response = await campaignApi.createKeywordTargeting({
            budget:          first.budget,
            TOS_bidding,
            ROS_bidding,
            PP_bidding,
            AB_bidding,
            dynamic_bidding: first.dynamic_bidding,
            default_bid:     first.bid,
            start_date:      first.start_date,
            asins:           [asin],
            keywords:        rows.map((r) => ({
              text:       r.keyword,
              match_type: r.match_type,
              bid:        r.bid,
            })),
          })
          console.log(`✅ KW grouped campaign [${asin}, ${rows.length} keywords]:`, response.data.campaign_id)
          setRowStatusByAsin(asin, 'success')
          successes++
        } catch (error) {
          const msg = parseBulkError(error)
          console.error(`❌ KW grouped campaign failed [${asin}]:`, msg)
          setRowStatusByAsin(asin, 'error', msg)
          failures++
        }
      }
    }

    const s: BulkSubmitSummary = { total, success: successes, failed: failures }
    setSummary(s)
    setIsSubmitting(false)
    return s
  }, [bulkRows, sharedDefaults, setRowStatus, setRowStatusByAsin])

  const retryFailed = useCallback((mode: GroupingMode) => {
    if (mode === 'individual') {
      bulkRows.forEach((r) => { if (r._status === 'error') setRowStatus(r._id, 'idle') })
    } else {
      const failedAsins = new Set(bulkRows.filter((r) => r._status === 'error').map((r) => r.asin))
      failedAsins.forEach((asin) => setRowStatusByAsin(asin, 'idle'))
    }
    setSummary(null)
  }, [bulkRows, setRowStatus, setRowStatusByAsin])

  const clearSummary = useCallback(() => setSummary(null), [])

  // Expose both row-level and group-level counts — component picks based on mode
  const groupStatuses = useMemo(() => {
    const map = new Map<string, 'idle' | 'loading' | 'success' | 'error'>()
    const priority = { error: 4, loading: 3, idle: 2, success: 1 } as const
    for (const row of bulkRows) {
      const current = map.get(row.asin)
      if (!current || priority[row._status] > priority[current]) map.set(row.asin, row._status)
    }
    return [...map.values()]
  }, [bulkRows])

  return {
    submitAll,
    retryFailed,
    clearSummary,
    isSubmitting,
    summary,
    // Individual counts (per row)
    rowPendingCount: bulkRows.filter((r) => r._status === 'idle').length,
    rowFailedCount:  bulkRows.filter((r) => r._status === 'error').length,
    rowSuccessCount: bulkRows.filter((r) => r._status === 'success').length,
    // Grouped counts (per unique asin)
    groupPendingCount: groupStatuses.filter((s) => s === 'idle').length,
    groupFailedCount:  groupStatuses.filter((s) => s === 'error').length,
    groupSuccessCount: groupStatuses.filter((s) => s === 'success').length,
  }
}

// ── useBulkProductSubmit ──────────────────────────────────────────────────────
// Flat rows grouped by asin at submit time.
// Each unique asin = one createProductTargeting API call.
// _status is set on ALL rows sharing that asin via setProductRowStatusByAsin.

export function useBulkProductSubmit() {
  const { productBulkRows, sharedDefaults, setProductRowStatus, setProductRowStatusByAsin } =
    useCampaignCreationStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSubmitSummary | null>(null)

  const submitAll = useCallback(async (mode: GroupingMode): Promise<BulkSubmitSummary> => {
    const { TOS_bidding, ROS_bidding, PP_bidding, AB_bidding } = sharedDefaults
    setIsSubmitting(true)
    setSummary(null)
    let successes = 0
    let failures  = 0
    let total     = 0

    if (mode === 'individual') {
      // ── One row = one campaign with one target ──────────────────────────────
      const pending = productBulkRows.filter((r) => r._status !== 'success')
      total = pending.length
      if (total === 0) { setIsSubmitting(false); const s = { total: 0, success: 0, failed: 0 }; setSummary(s); return s }

      for (const row of pending) {
        setProductRowStatus(row._id, 'loading')
        try {
          const response = await campaignApi.createProductTargeting({
            budget:          row.budget,
            TOS_bidding,
            ROS_bidding,
            PP_bidding,
            AB_bidding,
            dynamic_bidding: row.dynamic_bidding,
            default_bid:     row.bid,
            start_date:      row.start_date,
            asins:           [row.asin],
            targets:         [{ asin: row.target_asin, match_type: row.match_type, bid: row.bid }],
          })
          console.log(`✅ PT individual [${row.asin} → ${row.target_asin}]:`, response.data.campaign_id)
          setProductRowStatus(row._id, 'success')
          successes++
        } catch (error) {
          const msg = parseBulkError(error)
          console.error(`❌ PT individual failed [${row.asin} → ${row.target_asin}]:`, msg)
          setProductRowStatus(row._id, 'error', msg)
          failures++
        }
      }

      const s: BulkSubmitSummary = { total, success: successes, failed: failures }
      setSummary(s)
      setIsSubmitting(false)
      return s
    }

    // ── Grouped: one campaign per asin with all its targets ─────────────────
    // ── Group flat rows by asin, skip any group already fully succeeded ────────
    const groupMap = new Map<string, BulkProductRow[]>()
    for (const row of productBulkRows) {
      if (!groupMap.has(row.asin)) groupMap.set(row.asin, [])
      groupMap.get(row.asin)!.push(row)
    }

    // A group is pending if at least one row is not 'success'
    const pendingGroups = [...groupMap.entries()].filter(
      ([, rows]) => rows.some((r) => r._status !== 'success')
    )

    if (pendingGroups.length === 0) {
      const s = { total: 0, success: 0, failed: 0 }
      setSummary(s)
      return s
    }

    for (const [asin, rows] of pendingGroups) {
      // Use campaign-level fields from the first row of the group
      const first = rows[0]

      setProductRowStatusByAsin(asin, 'loading')

      try {
        const response = await campaignApi.createProductTargeting({
          budget:          first.budget,
          TOS_bidding,
          ROS_bidding,
          PP_bidding,
          AB_bidding,
          dynamic_bidding: first.dynamic_bidding,
          default_bid:     first.bid,
          start_date:      first.start_date,
          asins:           [asin],
          targets:         rows.map((r) => ({
            asin:       r.target_asin,
            match_type: r.match_type,
            bid:        r.bid,
          })),
        })

        console.log(
          `✅ PT campaign created [${asin}, ${rows.length} target${rows.length !== 1 ? 's' : ''}]:`,
          response.data.campaign_id,
        )
        setProductRowStatusByAsin(asin, 'success')
        successes++
      } catch (error) {
        const msg = parseBulkError(error)
        console.error(
          `❌ PT campaign failed [${asin}, ${rows.length} target${rows.length !== 1 ? 's' : ''}]:`,
          msg,
        )
        setProductRowStatusByAsin(asin, 'error', msg)
        failures++
      }
    }

    total = pendingGroups.length
    const s: BulkSubmitSummary = { total, success: successes, failed: failures }
    setSummary(s)
    setIsSubmitting(false)
    return s
  }, [productBulkRows, sharedDefaults, setProductRowStatus, setProductRowStatusByAsin])

  const retryFailed = useCallback((mode: GroupingMode) => {
    if (mode === 'individual') {
      productBulkRows.forEach((r) => { if (r._status === 'error') setProductRowStatus(r._id, 'idle') })
    } else {
      const failedAsins = new Set(productBulkRows.filter((r) => r._status === 'error').map((r) => r.asin))
      failedAsins.forEach((asin) => setProductRowStatusByAsin(asin, 'idle'))
    }
    setSummary(null)
  }, [productBulkRows, setProductRowStatus, setProductRowStatusByAsin])

  const clearSummary = useCallback(() => setSummary(null), [])

  // Counts are per-group (unique asin), not per-row
  const uniqueAsinStatuses = useMemo(() => {
    const map = new Map<string, 'idle' | 'loading' | 'success' | 'error'>()
    for (const row of productBulkRows) {
      // A group's status = the worst status of its rows
      const current = map.get(row.asin)
      const priority = { error: 4, loading: 3, idle: 2, success: 1 } as const
      if (!current || priority[row._status] > priority[current]) {
        map.set(row.asin, row._status)
      }
    }
    return [...map.values()]
  }, [productBulkRows])

  return {
    submitAll,
    retryFailed,
    clearSummary,
    isSubmitting,
    summary,
    // Individual counts (per row)
    rowPendingCount: productBulkRows.filter((r) => r._status === 'idle').length,
    rowFailedCount:  productBulkRows.filter((r) => r._status === 'error').length,
    rowSuccessCount: productBulkRows.filter((r) => r._status === 'success').length,
    // Grouped counts (per unique asin)
    groupPendingCount: uniqueAsinStatuses.filter((s) => s === 'idle').length,
    groupFailedCount:  uniqueAsinStatuses.filter((s) => s === 'error').length,
    groupSuccessCount: uniqueAsinStatuses.filter((s) => s === 'success').length,
  }
}