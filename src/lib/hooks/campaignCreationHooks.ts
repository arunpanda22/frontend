import { apiClient } from '@/lib/api/config'
import {
  getMinBid,
  getMinBudget,
  getCurrencySymbol,
  useUserProfile,
} from '@/lib/hooks/queries/use-user-profile'
import { useCallback, useState, useMemo } from 'react'
import {
  useCampaignCreationStore,
  type BulkCampaignRow,
  type BulkProductRow,
  type MultiAsinKWBulkRow,
  type MultiAsinPTBulkRow,
  type RowStatus,
} from '@/lib/store/campaignCreationStore'

// ── useCampaignDefaults ───────────────────────────────────────────────────────

export const useCampaignDefaults = () => {
  const { data: userProfile, isLoading } = useUserProfile()

  const profile       = userProfile?.connected_advertising_profiles?.find((p) => p.is_active)
                     ?? userProfile?.connected_advertising_profiles?.[0]
  const currencyCode  = profile?.currency_code  ?? 'GBP'
  const marketplaceId = profile?.marketplace_id ?? ''

  const minBid    = getMinBid(currencyCode)
  const minBudget = getMinBudget(marketplaceId)

  const recommendedBudget = (bids: number[]): number => {
    const validBids = bids.filter((b) => b > 0)
    const maxBid    = validBids.length > 0 ? Math.max(...validBids) : 0
    return Math.max(minBudget, maxBid * 15)
  }

  return {
    minBid,
    minBudget,
    currencySymbol: getCurrencySymbol(currencyCode),
    currencyCode,
    marketplaceId,
    isLoading,
    recommendedBudget,
  }
}

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
  asin:                string
  bid:                 number
  expression_type:     'MANUAL' | 'AUTO'
  type:                string
  price_greater_than?: number
}

export interface SingleCategoryPayload extends BasePayload {
  asin:            string
  category_id?:    string
  bid:             number
  expression_type: 'MANUAL' | 'AUTO'
  type:            string
  price_greater_than?: number
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const campaignApi = {
  createKeywordTargeting: (payload: KeywordTargetingPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/v1/campaign-creation/keyword-targeting/',
      payload
    ),

  createProductTargeting: (payload: ProductTargetingPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/v1/campaign-creation/product-targeting/',
      payload
    ),

  createAutoTargeting: (payload: AutoTargetingPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/v1/campaign-creation/auto-targeting/',
      payload
    ),

  createMultiCategory: (payload: MultiCategoryPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/v1/campaign-creation/multi-category/',
      payload
    ),

  createSingleCategory: (payload: SingleCategoryPayload) =>
    apiClient.post<CampaignSuccessResponse>(
      '/api/v1/campaign-creation/single-category/',
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

export type GroupingMode     = 'individual' | 'grouped'
export type MultiAsinKWMode  = 'mk' | 'sk'   // mk = multi-keyword, sk = single keyword (deduplicated)
export type MultiAsinPTMode  = 'mpt' | 'spt' // mpt = multi-target, spt = single target (deduplicated)

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
  minBid: number,   
): KeywordTargetingPayload {
  return {
    campaign_name:   row.campaign_name, 
    budget:          row.budget,
    TOS_bidding:     TOS,
    ROS_bidding:     ROS,
    PP_bidding:      PP,
    AB_bidding:      AB,
    dynamic_bidding: row.dynamic_bidding,
    default_bid:     minBid, 
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
  const { minBid } = useCampaignDefaults() 

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
            rowToPayload(row, TOS_bidding, ROS_bidding, PP_bidding, AB_bidding, minBid)
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
            campaign_name:   first.campaign_name, 
            budget:          first.budget,
            TOS_bidding,
            ROS_bidding,
            PP_bidding,
            AB_bidding,
            dynamic_bidding: first.dynamic_bidding,
            default_bid:     minBid,
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
  const { minBid } = useCampaignDefaults() 

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
            campaign_name:   row.campaign_name,
            budget:          row.budget,
            TOS_bidding,
            ROS_bidding,
            PP_bidding,
            AB_bidding,
            dynamic_bidding: row.dynamic_bidding,
            default_bid:     minBid,
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
          campaign_name:   first.campaign_name, 
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

export function useBulkCategorySubmit() {
  const {
    categoryBulkRows,
    sharedDefaults,
    setCategoryRowStatus,
  } = useCampaignCreationStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSubmitSummary | null>(null)

  const submitAll = useCallback(async (): Promise<BulkSubmitSummary> => {
    const { TOS_bidding, ROS_bidding, PP_bidding, AB_bidding } = sharedDefaults
    const pending = categoryBulkRows.filter((r) => r._status !== 'success')

    if (pending.length === 0) {
      const s = { total: 0, success: 0, failed: 0 }
      setSummary(s)
      return s
    }

    setIsSubmitting(true)
    setSummary(null)
    let successes = 0, failures = 0

    for (const row of pending) {
      setCategoryRowStatus(row._id, 'loading')
      try {
        const payload: MultiCategoryPayload | SingleCategoryPayload = {
          campaign_name:   row.campaign_name,
          budget:          row.budget,
          TOS_bidding,
          ROS_bidding,
          PP_bidding,
          AB_bidding,
          dynamic_bidding: row.dynamic_bidding,
          default_bid:     1,
          start_date:      row.start_date,
          asin:            row.asin,
          bid:             row.bid,
          expression_type: 'MANUAL',
          type:            'ASIN_CATEGORY_SAME_AS',
          ...(row.price_greater_than !== '' && Number(row.price_greater_than) > 0
            ? { price_greater_than: Number(row.price_greater_than) }
            : {}),
        }

        const response = row.mode === 'multi'
          ? await campaignApi.createMultiCategory(payload as MultiCategoryPayload)
          : await campaignApi.createSingleCategory(payload as SingleCategoryPayload)

        console.log(`✅ Category [${row.asin}/${row.mode}]:`, response.data.campaign_id)
        setCategoryRowStatus(row._id, 'success')
        successes++
      } catch (error) {
        const msg = parseBulkError(error)
        console.error(`❌ Category failed [${row.asin}]:`, msg)
        setCategoryRowStatus(row._id, 'error', msg)
        failures++
      }
    }

    const s: BulkSubmitSummary = { total: pending.length, success: successes, failed: failures }
    setSummary(s)
    setIsSubmitting(false)
    return s
  }, [categoryBulkRows, sharedDefaults, setCategoryRowStatus])

  const retryFailed = useCallback(() => {
    categoryBulkRows.forEach((r) => {
      if (r._status === 'error') setCategoryRowStatus(r._id, 'idle')
    })
    setSummary(null)
  }, [categoryBulkRows, setCategoryRowStatus])

  const clearSummary = useCallback(() => setSummary(null), [])

  return {
    submitAll,
    retryFailed,
    clearSummary,
    isSubmitting,
    summary,
    pendingCount: categoryBulkRows.filter((r) => r._status === 'idle').length,
    failedCount:  categoryBulkRows.filter((r) => r._status === 'error').length,
    successCount: categoryBulkRows.filter((r) => r._status === 'success').length,
  }
}

// ── useBulkMultiAsinKWSubmit ──────────────────────────────────────────────────
// Always groups by theme. Mode controls keyword deduplication within each group:
//   mk  (multi-keyword): all keywords from all rows sent as-is
//   sk  (single keyword): keywords deduplicated — rows within a theme should share same keyword

export function useBulkMultiAsinKWSubmit() {
  const {
    multiAsinKWRows,
    sharedDefaults,
    setMultiAsinKWStatusByTheme,
  } = useCampaignCreationStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSubmitSummary | null>(null)
  const { minBid } = useCampaignDefaults()

  const submitAll = useCallback(async (mode: MultiAsinKWMode): Promise<BulkSubmitSummary> => {
    // Always group by theme
    const groupMap = new Map<string, typeof multiAsinKWRows>()
    for (const row of multiAsinKWRows) {
      if (!groupMap.has(row.theme)) groupMap.set(row.theme, [])
      groupMap.get(row.theme)!.push(row)
    }

    const pending = [...groupMap.entries()].filter(
      ([, rows]) => rows.some((r) => r._status !== 'success')
    )

    if (pending.length === 0) {
      const s = { total: 0, success: 0, failed: 0 }
      setSummary(s)
      return s
    }

    setIsSubmitting(true)
    setSummary(null)
    const { TOS_bidding, ROS_bidding, PP_bidding, AB_bidding } = sharedDefaults
    let successes = 0, failures = 0

    for (const [theme, rows] of pending) {
      const first = rows[0]
      const asins = [...new Set(rows.map((r) => r.asin).filter(Boolean))]

      // Build keywords based on mode
      const allKeywords = rows.map((r) => ({ text: r.keyword, match_type: r.match_type, bid: r.bid }))
      const keywords = mode === 'sk'
        // Deduplicate by keyword text — keeps first occurrence (bid/match of first row wins)
        ? [...new Map(allKeywords.map((k) => [k.text.toLowerCase(), k])).values()]
        : allKeywords

      setMultiAsinKWStatusByTheme(theme, 'loading')
      try {
        const response = await campaignApi.createKeywordTargeting({
          campaign_name:   first.campaign_name,
          budget:          first.budget,
          TOS_bidding, ROS_bidding, PP_bidding, AB_bidding,
          dynamic_bidding: first.dynamic_bidding,
          default_bid:     minBid,
          start_date:      first.start_date,
          asins,
          theme,
          keywords,
        })
        console.log(`✅ Multi-ASIN KW [${theme}] (${mode}):`, response.data.campaign_id)
        setMultiAsinKWStatusByTheme(theme, 'success')
        successes++
      } catch (error) {
        const msg = parseBulkError(error)
        console.error(`❌ Multi-ASIN KW failed [${theme}]:`, msg)
        setMultiAsinKWStatusByTheme(theme, 'error', msg)
        failures++
      }
    }

    const s: BulkSubmitSummary = { total: pending.length, success: successes, failed: failures }
    setSummary(s)
    setIsSubmitting(false)
    return s
  }, [multiAsinKWRows, sharedDefaults, setMultiAsinKWStatusByTheme])

  const retryFailed = useCallback((mode: MultiAsinKWMode) => {
    const failedThemes = new Set(multiAsinKWRows.filter((r) => r._status === 'error').map((r) => r.theme))
    failedThemes.forEach((t) => setMultiAsinKWStatusByTheme(t, 'idle'))
    setSummary(null)
  }, [multiAsinKWRows, setMultiAsinKWStatusByTheme])

  const clearSummary = useCallback(() => setSummary(null), [])

  const themeStatuses = useMemo(() => {
    const map = new Map<string, 'idle' | 'loading' | 'success' | 'error'>()
    const priority = { error: 4, loading: 3, idle: 2, success: 1 } as const
    for (const row of multiAsinKWRows) {
      const cur = map.get(row.theme)
      if (!cur || priority[row._status] > priority[cur]) map.set(row.theme, row._status)
    }
    return [...map.values()]
  }, [multiAsinKWRows])

  return {
    submitAll, retryFailed, clearSummary, isSubmitting, summary,
    pendingCount: themeStatuses.filter((s) => s === 'idle').length,
    failedCount:  themeStatuses.filter((s) => s === 'error').length,
    successCount: themeStatuses.filter((s) => s === 'success').length,
  }
}

// ── useBulkMultiAsinPTSubmit ──────────────────────────────────────────────────
// Always groups by theme. Mode controls target deduplication within each group:
//   mpt (multi-target): all targets from all rows sent as-is
//   spt (single target): targets deduplicated — rows within a theme should share same target

export function useBulkMultiAsinPTSubmit() {
  const {
    multiAsinPTRows,
    sharedDefaults,
    setMultiAsinPTStatusByTheme,
  } = useCampaignCreationStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSubmitSummary | null>(null)
  const { minBid } = useCampaignDefaults() 

  const submitAll = useCallback(async (mode: MultiAsinPTMode): Promise<BulkSubmitSummary> => {
    const groupMap = new Map<string, typeof multiAsinPTRows>()
    for (const row of multiAsinPTRows) {
      if (!groupMap.has(row.theme)) groupMap.set(row.theme, [])
      groupMap.get(row.theme)!.push(row)
    }

    const pending = [...groupMap.entries()].filter(
      ([, rows]) => rows.some((r) => r._status !== 'success')
    )

    if (pending.length === 0) {
      const s = { total: 0, success: 0, failed: 0 }
      setSummary(s)
      return s
    }

    setIsSubmitting(true)
    setSummary(null)
    const { TOS_bidding, ROS_bidding, PP_bidding, AB_bidding } = sharedDefaults
    let successes = 0, failures = 0

    for (const [theme, rows] of pending) {
      const first = rows[0]
      const asins = [...new Set(rows.map((r) => r.asin).filter(Boolean))]

      const allTargets = rows.map((r) => ({ asin: r.target_asin, match_type: r.match_type, bid: r.bid }))
      const targets = mode === 'spt'
        ? [...new Map(allTargets.map((t) => [t.asin.toLowerCase(), t])).values()]
        : allTargets

      setMultiAsinPTStatusByTheme(theme, 'loading')
      try {
        const response = await campaignApi.createProductTargeting({
          campaign_name:   first.campaign_name,
          budget:          first.budget,
          TOS_bidding, ROS_bidding, PP_bidding, AB_bidding,
          dynamic_bidding: first.dynamic_bidding,
          default_bid:     minBid,
          start_date:      first.start_date,
          asins,
          theme,
          targets,
        })
        console.log(`✅ Multi-ASIN PT [${theme}] (${mode}):`, response.data.campaign_id)
        setMultiAsinPTStatusByTheme(theme, 'success')
        successes++
      } catch (error) {
        const msg = parseBulkError(error)
        console.error(`❌ Multi-ASIN PT failed [${theme}]:`, msg)
        setMultiAsinPTStatusByTheme(theme, 'error', msg)
        failures++
      }
    }

    const s: BulkSubmitSummary = { total: pending.length, success: successes, failed: failures }
    setSummary(s)
    setIsSubmitting(false)
    return s
  }, [multiAsinPTRows, sharedDefaults, setMultiAsinPTStatusByTheme])

  const retryFailed = useCallback((mode: MultiAsinPTMode) => {
    const failedThemes = new Set(multiAsinPTRows.filter((r) => r._status === 'error').map((r) => r.theme))
    failedThemes.forEach((t) => setMultiAsinPTStatusByTheme(t, 'idle'))
    setSummary(null)
  }, [multiAsinPTRows, setMultiAsinPTStatusByTheme])

  const clearSummary = useCallback(() => setSummary(null), [])

  const themeStatuses = useMemo(() => {
    const map = new Map<string, 'idle' | 'loading' | 'success' | 'error'>()
    const priority = { error: 4, loading: 3, idle: 2, success: 1 } as const
    for (const row of multiAsinPTRows) {
      const cur = map.get(row.theme)
      if (!cur || priority[row._status] > priority[cur]) map.set(row.theme, row._status)
    }
    return [...map.values()]
  }, [multiAsinPTRows])

  return {
    submitAll, retryFailed, clearSummary, isSubmitting, summary,
    pendingCount: themeStatuses.filter((s) => s === 'idle').length,
    failedCount:  themeStatuses.filter((s) => s === 'error').length,
    successCount: themeStatuses.filter((s) => s === 'success').length,
  }
}

// ── useBulkAutoSubmit ─────────────────────────────────────────────────────────

import type { AutoTargetGroup } from '@/lib/store/campaignCreationStore'

const PAUSED = 'PAUSED' as const
const ENABLED = 'ENABLED' as const

function buildAutoPayload(
  row: import('@/lib/store/campaignCreationStore').AutoTargetingBulkRow,
  TOS: number, ROS: number, PP: number, AB: number,
  minBid: number,
): AutoTargetingPayload {
  const g = row.target_group
  return {
    campaign_name:     row.campaign_name,
    budget:            row.budget,
    TOS_bidding:       TOS,
    ROS_bidding:       ROS,
    PP_bidding:        PP,
    AB_bidding:        AB,
    dynamic_bidding:   row.dynamic_bidding,
    default_bid:       minBid,
    start_date:        row.start_date,
    asins:             [row.asin],
    close_match_state: g === 'close_match'  ? ENABLED : PAUSED,
    close_match_bid:   g === 'close_match'  ? row.bid : minBid,
    loose_match_state: g === 'loose_match'  ? ENABLED : PAUSED,
    loose_match_bid:   g === 'loose_match'  ? row.bid : minBid,
    substitutes_state: g === 'substitutes'  ? ENABLED : PAUSED,
    substitutes_bid:   g === 'substitutes'  ? row.bid : minBid,
    complements_state: g === 'complements'  ? ENABLED : PAUSED,
    complements_bid:   g === 'complements'  ? row.bid : minBid,
    ...(row.intent ? { intent: row.intent } : {}),
  }
}

export function useBulkAutoSubmit() {
  const { autoBulkRows, sharedDefaults, setAutoRowStatus } =
    useCampaignCreationStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<BulkSubmitSummary | null>(null)
  const { minBid } = useCampaignDefaults()

  const submitAll = useCallback(async (): Promise<BulkSubmitSummary> => {
    const { TOS_bidding, ROS_bidding, PP_bidding, AB_bidding } = sharedDefaults
    const pending = autoBulkRows.filter((r) => r._status !== 'success')

    if (pending.length === 0) {
      const s = { total: 0, success: 0, failed: 0 }
      setSummary(s)
      return s
    }

    setIsSubmitting(true)
    setSummary(null)
    let successes = 0, failures = 0

    for (const row of pending) {
      setAutoRowStatus(row._id, 'loading')
      try {
        const response = await campaignApi.createAutoTargeting(
          buildAutoPayload(row, TOS_bidding, ROS_bidding, PP_bidding, AB_bidding, minBid)
        )
        console.log(`✅ Auto [${row.asin} / ${row.target_group}]:`, response.data.campaign_id)
        setAutoRowStatus(row._id, 'success')
        successes++
      } catch (error) {
        const msg = parseBulkError(error)
        console.error(`❌ Auto failed [${row.asin} / ${row.target_group}]:`, msg)
        setAutoRowStatus(row._id, 'error', msg)
        failures++
      }
    }

    const s: BulkSubmitSummary = { total: pending.length, success: successes, failed: failures }
    setSummary(s)
    setIsSubmitting(false)
    return s
  }, [autoBulkRows, sharedDefaults, setAutoRowStatus, minBid])

  const retryFailed = useCallback(() => {
    autoBulkRows.forEach((r) => {
      if (r._status === 'error') setAutoRowStatus(r._id, 'idle')
    })
    setSummary(null)
  }, [autoBulkRows, setAutoRowStatus])

  const clearSummary = useCallback(() => setSummary(null), [])

  return {
    submitAll,
    retryFailed,
    clearSummary,
    isSubmitting,
    summary,
    pendingCount: autoBulkRows.filter((r) => r._status === 'idle').length,
    failedCount:  autoBulkRows.filter((r) => r._status === 'error').length,
    successCount: autoBulkRows.filter((r) => r._status === 'success').length,
  }
}