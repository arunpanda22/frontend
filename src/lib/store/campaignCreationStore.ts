import { create } from 'zustand'
import { isValidAsin } from '@/lib/utils/asinValidation'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DynamicBidding = 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL'
export type MatchType      = 'EXACT' | 'BROAD' | 'PHRASE'
export type RowStatus      = 'idle' | 'loading' | 'success' | 'error'

export interface SharedDefaults {
  budget:          number
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: DynamicBidding
  default_bid:     number
  start_date:      string
  intent:          string 
}

// ── Row types ─────────────────────────────────────────────────────────────────

export interface BulkCampaignRow {
  _id:             string
  campaign_name:   string
  asin:            string
  keyword:         string
  match_type:      MatchType
  bid:             number
  budget:          number
  start_date:      string
  dynamic_bidding: DynamicBidding
  _status:         RowStatus
  _error?:         string
  intent:          string
}

export type ProductMatchType = 'EXACT' | 'EXPANDED'

// Flat model — one row per target ASIN.
// The CampaignDataTable handles visual grouping via groupByFields=['asin'].
// On submit, rows are grouped by asin in the hook before calling the API.
export interface BulkProductRow {
  _id:             string
  campaign_name:   string   // shared across all targets for same asin (spanned)
  asin:            string   // advertised ASIN               (spanned)
  target_asin:     string   // individual target             (per-row)
  match_type:      ProductMatchType                       //  (per-row)
  bid:             number                                 //  (per-row)
  budget:          number   //                               (spanned)
  start_date:      string   //                               (spanned)
  dynamic_bidding: DynamicBidding                        //  (spanned)
  _status:         RowStatus                             //  (spanned, set on all rows of group)
  _error?:         string
}

// ── Multi-ASIN bulk row types ─────────────────────────────────────────────────
// Flat model: one row per keyword / target.
// Rows sharing the same `theme` belong to the same campaign.
// `asins_raw` is comma-separated; parsed to string[] on submit.

export interface MultiAsinKWBulkRow {
  _id:             string
  campaign_name:   string         // spanned — same for all rows with same theme
  theme:           string         // spanned — campaign grouping key
  asin:            string         // per-row — one ASIN per row, deduplicated at submit
  keyword:         string         // per-row
  match_type:      MatchType      // per-row
  bid:             number         // per-row
  budget:          number         // spanned
  start_date:      string         // spanned
  dynamic_bidding: DynamicBidding // spanned
  _status:         RowStatus      // spanned
  _error?:         string
}

export interface MultiAsinPTBulkRow {
  _id:             string
  campaign_name:   string
  theme:           string          // spanned
  asin:            string          // per-row — one ASIN per row, deduplicated at submit
  target_asin:     string          // per-row
  match_type:      ProductMatchType// per-row
  bid:             number          // per-row
  budget:          number          // spanned
  start_date:      string          // spanned
  dynamic_bidding: DynamicBidding  // spanned
  _status:         RowStatus       // spanned
  _error?:         string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildSKCampaignName(
  asin: string,
  keyword: string,
  mode: 'individual' | 'grouped' = 'individual',
  intent?: string,
): string {
  const intentSuffix = intent?.trim() ? ` - ${intent.trim()}` : ''
  if (mode === 'grouped') {
    return `${asin.trim()} - SP - KW - MK${intentSuffix}`
  }
  const kw = keyword.trim() ? ` - ${keyword.trim()} - SK` : ' - SK'
  return `${asin.trim()} - SP - KW${kw}${intentSuffix}`
}

// Keep old name as alias so existing imports don't break
export const buildCampaignName = buildSKCampaignName

export function buildPTCampaignName(
  asin: string,
  targetAsin: string = '',
  mode: 'individual' | 'grouped' = 'individual',
  intent?: string,
): string {
  const intentSuffix = intent?.trim() ? ` - ${intent.trim()}` : ''
  if (mode === 'grouped') {
    return `${asin.trim()} - SP - PT - MPT${intentSuffix}`
  }
  const target = targetAsin.trim() ? ` - ${targetAsin.trim()}` : ''
  return `${asin.trim()} - SP - PT - SPT${target}${intentSuffix}`
}


function computeMultiAsinKWName(theme: string, rows: Array<{ keyword: string; match_type: string }>): string {
  const uniqueKeywords = new Set(rows.map((r) => r.keyword.toLowerCase().trim()))
  const uniqueMatches  = [...new Set(rows.map((r) => r.match_type))]
  const mt = uniqueMatches.length === 1
    ? uniqueMatches[0].charAt(0) + uniqueMatches[0].slice(1).toLowerCase()
    : null
  if (uniqueKeywords.size === 1) {
    const kw = rows[0].keyword.trim()
    return mt ? `${theme} - SP - KW - ${kw} - SK - ${mt}` : `${theme} - SP - KW - ${kw} - SK`
  }
  return mt ? `${theme} - SP - KW - MK - ${mt}` : `${theme} - SP - KW - MK`
}

function computeMultiAsinPTName(theme: string, rows: Array<{ target_asin: string; match_type: string }>): string {
  const uniqueTargets = new Set(rows.map((r) => r.target_asin.toLowerCase().trim()))
  const uniqueMatches = [...new Set(rows.map((r) => r.match_type))]
  const mt = uniqueMatches.length === 1
    ? uniqueMatches[0].charAt(0) + uniqueMatches[0].slice(1).toLowerCase()
    : null
  if (uniqueTargets.size === 1) {
    const target = rows[0].target_asin.trim()
    return mt ? `${theme} - SP - PT - SPT - ${target} - ${mt}` : `${theme} - SP - PT - SPT - ${target}`
  }
  return mt ? `${theme} - SP - PT - MPT - ${mt}` : `${theme} - SP - PT - MPT`
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const today = new Date().toISOString().split('T')[0]

const DEFAULT_SHARED: SharedDefaults = {
  budget:          100,
  TOS_bidding:     100,
  ROS_bidding:     0,
  PP_bidding:      0,
  AB_bidding:      0,
  dynamic_bidding: 'AUTO_FOR_SALES',
  default_bid:     0,
  start_date:      today,
  intent:          '', 
}

// ── Store Interface ───────────────────────────────────────────────────────────

interface CampaignCreationState {
  // Mode
  mode: 'individual' | 'bulk'
  setMode: (mode: 'individual' | 'bulk') => void

  // Shared defaults
  sharedDefaults: SharedDefaults
  setSharedDefault: <K extends keyof SharedDefaults>(key: K, value: SharedDefaults[K]) => void
  resetSharedDefaults: () => void

  // ── SK Bulk rows ────────────────────────────────────────────────────────────
  bulkRows: BulkCampaignRow[]
  setBulkRows: (rows: BulkCampaignRow[]) => void
  updateBulkRow: (id: string, patch: Partial<Omit<BulkCampaignRow, '_id'>>) => void
  syncTableData: (tableRows: Record<string, unknown>[]) => void
  deleteBulkRows: (ids: string[]) => void
  setRowStatus: (id: string, status: RowStatus, error?: string) => void
  /** Sets _status on every SK row sharing the same advertised asin */
  setRowStatusByAsin: (asin: string, status: RowStatus, error?: string) => void
  resetRowStatuses: () => void
  parsePastedData: (text: string) => { added: number; skipped: number; invalidAsins: number }
  clearBulkRows: () => void

  // ── Product targeting bulk rows ─────────────────────────────────────────────
  productBulkRows: BulkProductRow[]
  setProductBulkRows: (rows: BulkProductRow[]) => void
  setProductRowStatus: (id: string, status: RowStatus, error?: string) => void
  /** Sets _status on every row sharing the same advertised asin */
  setProductRowStatusByAsin: (asin: string, status: RowStatus, error?: string) => void
  deleteProductBulkRows: (ids: string[]) => void
  parsePastedProductData: (text: string) => { added: number; skipped: number; invalidAsins: number }
  clearProductBulkRows: () => void

  /** Recomputes campaign_name for all SK rows based on grouping mode */
  renameBulkRows: (mode: 'individual' | 'grouped') => void

  /** Recomputes campaign_name for all PT rows based on grouping mode */
  renameProductBulkRows: (mode: 'individual' | 'grouped') => void

  // ── Multi-ASIN KW bulk ────────────────────────────────────────────────────
  multiAsinKWRows:           MultiAsinKWBulkRow[]
  setMultiAsinKWRows:        (rows: MultiAsinKWBulkRow[]) => void
  setMultiAsinKWRowStatus:   (id: string, status: RowStatus, error?: string) => void
  setMultiAsinKWStatusByTheme:(theme: string, status: RowStatus, error?: string) => void
  parsePastedMultiAsinKW:    (text: string) => { added: number; skipped: number; invalidAsins: number }
  clearMultiAsinKWRows:      () => void
  renameMultiAsinKWRows:     (mode: 'mk' | 'sk') => void

  // ── Multi-ASIN PT bulk ────────────────────────────────────────────────────
  multiAsinPTRows:           MultiAsinPTBulkRow[]
  setMultiAsinPTRows:        (rows: MultiAsinPTBulkRow[]) => void
  setMultiAsinPTRowStatus:   (id: string, status: RowStatus, error?: string) => void
  setMultiAsinPTStatusByTheme:(theme: string, status: RowStatus, error?: string) => void
  parsePastedMultiAsinPT:    (text: string) => { added: number; skipped: number; invalidAsins: number }
  clearMultiAsinPTRows:      () => void
  renameMultiAsinPTRows:     (mode: 'mpt' | 'spt') => void

  // Reset
  reset: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCampaignCreationStore = create<CampaignCreationState>((set, get) => ({
  mode: 'individual',
  setMode: (mode) => set({ mode }),

  // ── Shared Defaults ─────────────────────────────────────────────────────────

  sharedDefaults: { ...DEFAULT_SHARED },

  setSharedDefault: (key, value) =>
    set((state) => ({ sharedDefaults: { ...state.sharedDefaults, [key]: value } })),

  resetSharedDefaults: () => set({ sharedDefaults: { ...DEFAULT_SHARED } }),

  // ── SK Bulk Rows ─────────────────────────────────────────────────────────────

  bulkRows: [],

  setBulkRows: (rows) => set({ bulkRows: rows }),

  updateBulkRow: (id, patch) =>
    set((state) => ({
      bulkRows: state.bulkRows.map((r) => (r._id === id ? { ...r, ...patch } : r)),
    })),

  syncTableData: (tableRows) => {
    const { bulkRows } = get()
    const statusMap = new Map(bulkRows.map((r) => [r._id, { _status: r._status, _error: r._error }]))

    const next: BulkCampaignRow[] = tableRows.map((row) => {
      const id       = row._id as string
      const existing = statusMap.get(id)
      return {
        _id:             id,
        campaign_name:   String(row.campaign_name ?? ''),
        asin:            String(row.asin ?? ''),
        keyword:         String(row.keyword ?? ''),
        match_type:      (row.match_type as MatchType) ?? 'EXACT',
        bid:             Number(row.bid) || 0,
        budget:          Number(row.budget) || 0,
        start_date:      String(row.start_date ?? ''),
        intent: String(row.intent ?? ''),     
        dynamic_bidding: (row.dynamic_bidding as DynamicBidding) ?? 'AUTO_FOR_SALES',
        _status:         existing?._status ?? 'idle',
        _error:          existing?._error,
      }
    })

    set({ bulkRows: next })
  },

  deleteBulkRows: (ids) =>
    set((state) => ({ bulkRows: state.bulkRows.filter((r) => !ids.includes(r._id)) })),

  setRowStatus: (id, status, error) =>
    set((state) => ({
      bulkRows: state.bulkRows.map((r) =>
        r._id === id ? { ...r, _status: status, _error: error } : r
      ),
    })),

  setRowStatusByAsin: (asin, status, error) =>
    set((state) => ({
      bulkRows: state.bulkRows.map((r) =>
        r.asin === asin ? { ...r, _status: status, _error: error } : r
      ),
    })),

  resetRowStatuses: () =>
    set((state) => ({
      bulkRows: state.bulkRows.map((r) => ({ ...r, _status: 'idle' as RowStatus, _error: undefined })),
    })),

  parsePastedData: (text) => {
    const { sharedDefaults } = get()
    const VALID_MATCH: Record<string, MatchType> = { EXACT: 'EXACT', BROAD: 'BROAD', PHRASE: 'PHRASE' }
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: BulkCampaignRow[] = []

    text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const [rawAsin, rawKeyword, rawBid, rawMatch] = line.split('\t').map((c) => c.trim())
      const asin    = rawAsin?.trim()
      const keyword = rawKeyword?.trim()
      if (!asin || !keyword) { skipped++; return }
      // Reject rows where keyword column looks like an ASIN — likely PT data pasted in wrong section
      if (isValidAsin(keyword)) { skipped++; return }
      // Skip rows with invalid advertised ASIN
      if (!isValidAsin(asin)) { invalidAsins++; skipped++; return }

      newRows.push({
        _id:             uid(),
        campaign_name:   buildSKCampaignName(asin, keyword, 'individual'),
        asin,
        keyword,
        match_type:      VALID_MATCH[rawMatch?.toUpperCase()] ?? 'EXACT',
        bid:             Number(rawBid) || sharedDefaults.default_bid || 0,
        budget:          sharedDefaults.budget,
        start_date:      sharedDefaults.start_date,
        dynamic_bidding: sharedDefaults.dynamic_bidding,
        intent:        sharedDefaults.intent,
        _status:         'idle',
      })
      added++
    })

    if (newRows.length > 0) set((state) => ({ bulkRows: [...state.bulkRows, ...newRows] }))
    return { added, skipped, invalidAsins }
  },

  clearBulkRows: () => set({ bulkRows: [] }),

  // ── Product Targeting Bulk Rows ───────────────────────────────────────────────

  productBulkRows: [],

  setProductBulkRows: (rows) => set({ productBulkRows: rows }),

  // Sets _status + _error on every row sharing the same advertised asin.
  // Called from useBulkProductSubmit — one campaign = all rows with that asin.
  setProductRowStatus: (id, status, error) =>
    set((state) => ({
      productBulkRows: state.productBulkRows.map((r) =>
        r._id === id ? { ...r, _status: status, _error: error } : r
      ),
    })),

  setProductRowStatusByAsin: (asin, status, error) =>
    set((state) => ({
      productBulkRows: state.productBulkRows.map((r) =>
        r.asin === asin ? { ...r, _status: status, _error: error } : r
      ),
    })),

  deleteProductBulkRows: (ids) =>
    set((state) => ({
      productBulkRows: state.productBulkRows.filter((r) => !ids.includes(r._id)),
    })),

  // Flat paste parser — one row per pasted line.
  // Columns: Advertised ASIN | Target ASIN | Bid | Match Type
  // Rows with the same advertised ASIN are shown grouped by the table (groupByFields).
  parsePastedProductData: (text) => {
    const { sharedDefaults } = get()
    const VALID_MATCH: Record<string, ProductMatchType> = { EXACT: 'EXACT', EXPANDED: 'EXPANDED' }
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: BulkProductRow[] = []

    text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const [rawAsin, rawTargetAsin, rawBid, rawMatch] = line.split('\t').map((c) => c.trim())
      const asin       = rawAsin?.trim()
      const targetAsin = rawTargetAsin?.trim()
      if (!asin || !targetAsin) { skipped++; return }
      // Reject rows where target column is not a valid ASIN — likely KW data pasted in wrong section
      if (!isValidAsin(targetAsin)) { skipped++; return }
      if (!isValidAsin(asin)) { invalidAsins++; skipped++; return }

      newRows.push({
        _id:             uid(),
        campaign_name:   buildPTCampaignName(asin, targetAsin, 'individual'),
        asin,
        target_asin:     targetAsin,
        match_type:      VALID_MATCH[rawMatch?.toUpperCase()] ?? 'EXACT',
        bid:             Number(rawBid) || sharedDefaults.default_bid || 0,
        budget:          sharedDefaults.budget,
        start_date:      sharedDefaults.start_date,
        dynamic_bidding: sharedDefaults.dynamic_bidding,
        _status:         'idle',
      })
      added++
    })

    if (newRows.length > 0) {
      set((state) => ({ productBulkRows: [...state.productBulkRows, ...newRows] }))
    }
    return { added, skipped, invalidAsins }
  },

  clearProductBulkRows: () => set({ productBulkRows: [] }),

  renameBulkRows: (mode) =>
    set((state) => {
      // Count rows per asin — only ASINs with >1 row are actually groupable
      const countByAsin = new Map<string, number>()
      for (const r of state.bulkRows) {
        countByAsin.set(r.asin, (countByAsin.get(r.asin) ?? 0) + 1)
      }
      return {
        bulkRows: state.bulkRows.map((r) => {
          const effectiveMode = (countByAsin.get(r.asin) ?? 1) > 1 ? mode : 'individual'
          return { ...r, campaign_name: buildSKCampaignName(r.asin, r.keyword, effectiveMode, r.intent) }
        }),
      }
    }),

  renameProductBulkRows: (mode) =>
    set((state) => {
      const countByAsin = new Map<string, number>()
      for (const r of state.productBulkRows) {
        countByAsin.set(r.asin, (countByAsin.get(r.asin) ?? 0) + 1)
      }
      return {
        productBulkRows: state.productBulkRows.map((r) => {
          const effectiveMode = (countByAsin.get(r.asin) ?? 1) > 1 ? mode : 'individual'
          return { ...r, campaign_name: buildPTCampaignName(r.asin, r.target_asin, effectiveMode) }
        }),
      }
    }),

  // ── Multi-ASIN KW Bulk ──────────────────────────────────────────────────────

  multiAsinKWRows: [],
  setMultiAsinKWRows: (rows) => set({ multiAsinKWRows: rows }),

  setMultiAsinKWRowStatus: (id, status, error) =>
    set((state) => ({
      multiAsinKWRows: state.multiAsinKWRows.map((r) =>
        r._id === id ? { ...r, _status: status, _error: error } : r
      ),
    })),

  setMultiAsinKWStatusByTheme: (theme, status, error) =>
    set((state) => ({
      multiAsinKWRows: state.multiAsinKWRows.map((r) =>
        r.theme === theme ? { ...r, _status: status, _error: error } : r
      ),
    })),

  parsePastedMultiAsinKW: (text) => {
    const { sharedDefaults } = get()
    const VALID_MATCH: Record<string, MatchType> = { EXACT: 'EXACT', BROAD: 'BROAD', PHRASE: 'PHRASE' }
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: MultiAsinKWBulkRow[] = []

    // Format (one row per ASIN + keyword pair):
    // Theme | ASIN | Keyword | Bid | Match Type
    // Rows sharing the same theme are grouped into one campaign at submit time.
    text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const [rawTheme, rawAsin, rawKeyword, rawBid, rawMatch] = line.split('\t').map((c) => c.trim())
      const theme   = rawTheme?.trim()
      const asin    = rawAsin?.trim()
      const keyword = rawKeyword?.trim()
      if (!theme || !asin || !keyword) { skipped++; return }
      if (isValidAsin(keyword)) { skipped++; return }  // PT data pasted in wrong section
      if (!isValidAsin(asin)) { invalidAsins++; skipped++; return }

      newRows.push({
        _id:             uid(),
        campaign_name:   `${theme} - SP - KW - MK`,
        theme,
        asin,
        keyword,
        match_type:      VALID_MATCH[rawMatch?.toUpperCase()] ?? 'EXACT',
        bid:             Number(rawBid) || sharedDefaults.default_bid || 0,
        budget:          sharedDefaults.budget,
        start_date:      sharedDefaults.start_date,
        dynamic_bidding: sharedDefaults.dynamic_bidding,
        _status:         'idle',
      })
      added++
    })

    if (newRows.length > 0) {
      // Recompute campaign_name per theme after all rows are collected
      const themeMap = new Map<string, typeof newRows>()
      for (const r of newRows) {
        if (!themeMap.has(r.theme)) themeMap.set(r.theme, [])
        themeMap.get(r.theme)!.push(r)
      }
      for (const r of newRows) {
        r.campaign_name = computeMultiAsinKWName(r.theme, themeMap.get(r.theme)!)
      }
      set((state) => ({ multiAsinKWRows: [...state.multiAsinKWRows, ...newRows] }))
    }
    return { added, skipped, invalidAsins }
  },

  clearMultiAsinKWRows: () => set({ multiAsinKWRows: [] }),

  renameMultiAsinKWRows: (mode) =>
    set((state) => {
      // Group rows by theme so we can compute the correct name per group
      const themeMap = new Map<string, typeof state.multiAsinKWRows>()
      for (const r of state.multiAsinKWRows) {
        if (!themeMap.has(r.theme)) themeMap.set(r.theme, [])
        themeMap.get(r.theme)!.push(r)
      }
      return {
        multiAsinKWRows: state.multiAsinKWRows.map((r) => {
          const group = themeMap.get(r.theme) ?? [r]
          const uniqueKws = new Set(group.map((g) => g.keyword.toLowerCase().trim()))
          // In SK mode force single-keyword name; otherwise use actual count
          const effectiveGroup = mode === 'sk' ? [group[0]] : group
          return { ...r, campaign_name: computeMultiAsinKWName(r.theme, effectiveGroup) }
        }),
      }
    }),

  // ── Multi-ASIN PT Bulk ──────────────────────────────────────────────────────

  multiAsinPTRows: [],
  setMultiAsinPTRows: (rows) => set({ multiAsinPTRows: rows }),

  setMultiAsinPTRowStatus: (id, status, error) =>
    set((state) => ({
      multiAsinPTRows: state.multiAsinPTRows.map((r) =>
        r._id === id ? { ...r, _status: status, _error: error } : r
      ),
    })),

  setMultiAsinPTStatusByTheme: (theme, status, error) =>
    set((state) => ({
      multiAsinPTRows: state.multiAsinPTRows.map((r) =>
        r.theme === theme ? { ...r, _status: status, _error: error } : r
      ),
    })),

  parsePastedMultiAsinPT: (text) => {
    const { sharedDefaults } = get()
    const VALID_MATCH: Record<string, ProductMatchType> = { EXACT: 'EXACT', EXPANDED: 'EXPANDED' }
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: MultiAsinPTBulkRow[] = []

    // Format (one row per ASIN + target pair):
    // Theme | ASIN | Target ASIN | Bid | Match Type
    // Rows sharing the same theme are grouped into one campaign at submit time.
    text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const [rawTheme, rawAsin, rawTargetAsin, rawBid, rawMatch] = line.split('\t').map((c) => c.trim())
      const theme      = rawTheme?.trim()
      const asin       = rawAsin?.trim()
      const targetAsin = rawTargetAsin?.trim()
      if (!theme || !asin || !targetAsin) { skipped++; return }
      if (!isValidAsin(targetAsin)) { skipped++; return }  // KW data pasted in wrong section
      if (!isValidAsin(asin)) { invalidAsins++; skipped++; return }

      newRows.push({
        _id:             uid(),
        campaign_name:   `${theme} - SP - PT`,
        theme,
        asin,
        target_asin:     targetAsin,
        match_type:      VALID_MATCH[rawMatch?.toUpperCase()] ?? 'EXACT',
        bid:             Number(rawBid) || sharedDefaults.default_bid || 0,
        budget:          sharedDefaults.budget,
        start_date:      sharedDefaults.start_date,
        dynamic_bidding: sharedDefaults.dynamic_bidding,
        _status:         'idle',
      })
      added++
    })

    if (newRows.length > 0) {
      const themeMap = new Map<string, typeof newRows>()
      for (const r of newRows) {
        if (!themeMap.has(r.theme)) themeMap.set(r.theme, [])
        themeMap.get(r.theme)!.push(r)
      }
      for (const r of newRows) {
        r.campaign_name = computeMultiAsinPTName(r.theme, themeMap.get(r.theme)!)
      }
      set((state) => ({ multiAsinPTRows: [...state.multiAsinPTRows, ...newRows] }))
    }
    return { added, skipped, invalidAsins }
  },

  clearMultiAsinPTRows: () => set({ multiAsinPTRows: [] }),

  renameMultiAsinPTRows: (mode) =>
    set((state) => {
      const themeMap = new Map<string, typeof state.multiAsinPTRows>()
      for (const r of state.multiAsinPTRows) {
        if (!themeMap.has(r.theme)) themeMap.set(r.theme, [])
        themeMap.get(r.theme)!.push(r)
      }
      return {
        multiAsinPTRows: state.multiAsinPTRows.map((r) => {
          const group = themeMap.get(r.theme) ?? [r]
          const effectiveGroup = mode === 'spt' ? [group[0]] : group
          return { ...r, campaign_name: computeMultiAsinPTName(r.theme, effectiveGroup) }
        }),
      }
    }),

  // ── Reset ─────────────────────────────────────────────────────────────────────

  reset: () =>
    set({
      mode:            'individual',
      sharedDefaults:  { ...DEFAULT_SHARED },
      bulkRows:        [],
      productBulkRows: [],
      multiAsinKWRows: [],
      multiAsinPTRows: [],
    }),
}))