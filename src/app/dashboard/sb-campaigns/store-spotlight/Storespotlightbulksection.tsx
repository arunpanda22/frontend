'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { useBulkCampaignStore, today } from '@/lib/store/sbCampaignStore'
import { useSBVSpotlightBulkSubmit, type SBBulkGroupingMode } from '@/lib/hooks/sbCampaignHooks'
import { useCampaignDefaults } from '@/lib/hooks/sbCampaignHooks'
import { GroupingToggle } from '@/app/dashboard/sp-campaigns/components/shared/GroupingToggle'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type {
  CampaignColumnDefinition,
  CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'

// ── Row shape ─────────────────────────────────────────────────────────────────

export interface SBVSpotlightBulkRow {
  _id:                   string
  _status:               'idle' | 'loading' | 'success' | 'error'
  _error?:               string
  campaign_name:         string
  brand_name:            string
  headline:              string
  home_page_url:         string
  brand_logo_asset_id:   string
  custom_image_asset_id: string
  keyword:               string
  match_type:            string
  bid:                   number
  budget:                number
  start_date:            string
}

// ── Shared defaults ───────────────────────────────────────────────────────────

interface SharedDefaults {
  bid:                   number | string
  budget:                number | string
  start_date:            string
  headline:              string
  home_page_url:         string
  brand_logo_asset_id:   string
  custom_image_asset_id: string
}

// ── Column definitions ────────────────────────────────────────────────────────

const MATCH_OPTIONS = [
  { value: 'exact',  label: 'Exact'  },
  { value: 'phrase', label: 'Phrase' },
  { value: 'broad',  label: 'Broad'  },
]

function buildColumns(currencySymbol: string): CampaignColumnDefinition[] {
  return [
    {
      field: 'campaign_name', headerName: 'Campaign Name',
      type: 'text', span: true, editable: true, sortable: true,
      width: 280, minWidth: 180, maxWidth: 460,
    },
    {
      field: 'brand_name', headerName: 'Brand',
      type: 'text', span: true, editable: true, sortable: true, filterable: true,
      width: 160, minWidth: 120,
    },
    {
      field: 'headline', headerName: 'Headline',
      type: 'text', span: true, editable: true,
      width: 200, minWidth: 140,
    },
    {
      field: 'home_page_url', headerName: 'Store URL',
      type: 'text', span: true, editable: true,
      width: 220, minWidth: 160,
    },
    {
      field: 'keyword', headerName: 'Keyword',
      type: 'text', span: false, editable: true, sortable: true, filterable: true,
      width: 180, minWidth: 140,
    },
    {
      field: 'match_type', headerName: 'Match Type',
      type: 'dropdown', span: false, editable: true,
      width: 120, minWidth: 100, options: MATCH_OPTIONS,
    },
    {
      field: 'bid', headerName: `Bid (${currencySymbol})`,
      type: 'number', span: false, editable: true,
      width: 90, minWidth: 70,
    },
    {
      field: 'budget', headerName: `Budget (${currencySymbol})`,
      type: 'number', span: true, editable: true,
      width: 110, minWidth: 80,
    },
    {
      field: 'start_date', headerName: 'Start Date',
      type: 'date', span: true, editable: true, width: 150,
    },
    {
      field: '_statusLabel', headerName: 'Status',
      type: 'text', span: true, editable: false,
      width: 120, minWidth: 100,
    },
  ]
}

// ── Campaign name builder ─────────────────────────────────────────────────────

function buildCampaignName(
  brandName: string,
  keyword:   string,
  mode:      'individual' | 'grouped',
): string {
  if (!brandName.trim()) return ''
  if (mode === 'grouped') return `${brandName} - SB - Spotlight - MK`
  return keyword.trim()
    ? `${brandName} - SB - Spotlight - ${keyword.trim()} - SK`
    : `${brandName} - SB - Spotlight - SK`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

/**
 * Parse one TSV line into a bulk row.
 * Expected columns: Brand Name | Keyword | Bid | Match Type
 * Headline, URL, logo/image asset IDs come from shared defaults.
 */
function parseLine(
  line:     string,
  defaults: SharedDefaults,
): SBVSpotlightBulkRow | null {
  const cols = line.split('\t').map((c) => c.trim())
  const [brandName, keyword, bidRaw, matchRaw] = cols
  if (!brandName || !keyword) return null

  const bid = parseFloat(bidRaw) || Number(defaults.bid) || 0
  if (bid <= 0) return null

  return {
    _id:                   nanoid(),
    _status:               'idle',
    campaign_name:         buildCampaignName(brandName, keyword, 'individual'),
    brand_name:            brandName,
    headline:              defaults.headline,
    home_page_url:         defaults.home_page_url,
    brand_logo_asset_id:   defaults.brand_logo_asset_id,
    custom_image_asset_id: defaults.custom_image_asset_id,
    keyword:               keyword,
    match_type:            matchRaw?.toLowerCase() || 'exact',
    bid,
    budget:                Number(defaults.budget) || Math.max(10, bid * 10),
    start_date:            defaults.start_date || today(),
  }
}

// ── Shared Settings Panel ─────────────────────────────────────────────────────

interface SharedSettingsPanelProps {
  defaults:       SharedDefaults
  onChange:       (patch: Partial<SharedDefaults>) => void
  currencySymbol: string
  minBid:         number
  minBudget:      number
}

function SharedSettingsPanel({
  defaults, onChange, currencySymbol, minBid, minBudget,
}: SharedSettingsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-800">Default Settings</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Applied to every pasted row — override individual cells in the table after pasting
        </p>
      </div>

      <div className="p-6 flex flex-col gap-5">

        {/* Row 1 — creative defaults */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Creative
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Headline</label>
              <input
                type="text"
                value={defaults.headline}
                onChange={(e) => onChange({ headline: e.target.value })}
                placeholder="e.g. Shop our full range"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Store Home Page URL</label>
              <input
                type="url"
                value={defaults.home_page_url}
                onChange={(e) => onChange({ home_page_url: e.target.value })}
                placeholder="https://amazon.com/stores/..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Brand Logo Asset ID</label>
              <input
                type="text"
                value={defaults.brand_logo_asset_id}
                onChange={(e) => onChange({ brand_logo_asset_id: e.target.value })}
                placeholder="Asset ID"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Custom Image Asset ID</label>
              <input
                type="text"
                value={defaults.custom_image_asset_id}
                onChange={(e) => onChange({ custom_image_asset_id: e.target.value })}
                placeholder="Asset ID"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Row 2 — campaign defaults */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Campaign
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Default Bid</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min={minBid}
                  step={minBid}
                  value={defaults.bid}
                  onChange={(e) => onChange({ bid: e.target.value })}
                  placeholder={String(minBid)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-7 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400">Used when bid column is blank</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Daily Budget</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min={minBudget}
                  value={defaults.budget}
                  onChange={(e) => onChange({ budget: e.target.value })}
                  placeholder={String(minBudget)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-7 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400">Applied to all pasted rows</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Start Date</label>
              <input
                type="date"
                value={defaults.start_date}
                onChange={(e) => onChange({ start_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
              <p className="text-[11px] text-slate-400">Applied to all pasted rows</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

// ── Paste area ────────────────────────────────────────────────────────────────

function PasteArea({ onPaste }: { onPaste: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [flash,      setFlash]      = useState(false)

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    if (text.trim()) {
      onPaste(text)
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
    }
  }, [onPaste])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      className={`
        relative rounded-xl border-2 border-dashed transition-all
        ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}
        ${flash ? 'border-emerald-400 bg-emerald-50' : ''}
      `}
    >
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-6 pointer-events-none select-none">
        <ClipboardPaste className={`h-7 w-7 transition-colors ${isDragging || flash ? 'text-indigo-500' : 'text-slate-300'}`} />
        <p className="text-sm font-semibold text-slate-600">Paste Excel data here</p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Copy 4 columns from Excel:&nbsp;
          <span className="font-mono">Brand Name</span> →&nbsp;
          <span className="font-mono">Keyword</span> →&nbsp;
          <span className="font-mono">Bid</span> →&nbsp;
          <span className="font-mono">Match Type</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Match Type optional — defaults to <span className="font-mono">exact</span>
          &nbsp;·&nbsp;Bid optional — uses Default Bid above
        </p>
        <p className="text-[11px] text-slate-400">
          Headline · Store URL · Asset IDs are taken from Default Settings above
        </p>
      </div>
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for Store Spotlight bulk data"
      />
    </div>
  )
}

// ── Summary banner ────────────────────────────────────────────────────────────

function SummaryBanner({
  summary, onRetry, onDismiss,
}: {
  summary:   { total: number; success: number; failed: number }
  onRetry:   () => void
  onDismiss: () => void
}) {
  const allSuccess = summary.failed === 0
  return (
    <div className={`
      flex items-center justify-between gap-4 rounded-xl border px-4 py-3
      ${allSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}
    `}>
      <div className="flex items-center gap-3">
        {allSuccess
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0"  />
        }
        <p className="text-sm font-medium text-slate-700">
          {summary.success} of {summary.total} campaigns created successfully
          {summary.failed > 0 && ` · ${summary.failed} failed`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {summary.failed > 0 && (
          <button type="button" onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
            <RotateCcw className="h-3 w-3" /> Retry Failed
          </button>
        )}
        <button type="button" onClick={onDismiss}
          className="rounded-lg px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StoreSpotlightBulkSection() {
  const store = useBulkCampaignStore()
  const { minBid, minBudget, currencySymbol } = useCampaignDefaults()

  const {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  } = useSBVSpotlightBulkSubmit()

  const [groupingMode, setGroupingMode] = useState<SBBulkGroupingMode>('individual')
  const [parseInfo, setParseInfo]       = useState<{ added: number; skipped: number } | null>(null)

  const [sharedDefaults, setSharedDefaults] = useState<SharedDefaults>(() => ({
    bid:                   minBid,
    budget:                minBudget,
    start_date:            today(),
    headline:              '',
    home_page_url:         '',
    brand_logo_asset_id:   '',
    custom_image_asset_id: '',
  }))

  function patchDefaults(patch: Partial<SharedDefaults>) {
    setSharedDefaults((prev) => ({ ...prev, ...patch }))
  }

  const COLUMNS = useMemo(() => buildColumns(currencySymbol), [currencySymbol])

  const pendingCount = groupingMode === 'individual' ? rowPendingCount : groupPendingCount
  const failedCount  = groupingMode === 'individual' ? rowFailedCount  : groupFailedCount
  const successCount = groupingMode === 'individual' ? rowSuccessCount : groupSuccessCount

  // ── Groupable: same brand_name appears more than once ──────────────────────
  const hasGroupableRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.brand_name, (counts.get(r.brand_name) ?? 0) + 1)
    return [...counts.values()].some((n) => n > 1)
  }, [rows])

  const uniqueBrandCount = useMemo(
    () => new Set(rows.map((r) => r.brand_name)).size,
    [rows],
  )

  // ── Table data ─────────────────────────────────────────────────────────────
  const tableData: CampaignTableData[] = rows.map((r) => ({
    _id:                   r._id,
    campaign_name:         r.campaign_name,
    brand_name:            r.brand_name,
    headline:              r.headline,
    home_page_url:         r.home_page_url,
    keyword:               r.keyword,
    match_type:            r.match_type,
    bid:                   r.bid,
    budget:                r.budget,
    start_date:            r.start_date,
    _statusLabel:          toStatusLabel(r._status, r._error),
  }))

  // ── Paste handler ──────────────────────────────────────────────────────────
  function handlePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    let added = 0, skipped = 0
    const newRows: SBVSpotlightBulkRow[] = []
    for (const line of lines) {
      const row = parseLine(line, sharedDefaults)
      if (!row) { skipped++; continue }
      newRows.push(row)
      added++
    }
    store.appendRows('sbv_spotlight' as any, newRows as any)
    setParseInfo({ added, skipped })
    setTimeout(() => setParseInfo(null), 4000)
  }

  // ── Table change handler ───────────────────────────────────────────────────
  function handleTableChange(updated: CampaignTableData[]) {
    store.setRows(
      'sbv_spotlight' as any,
      updated.map((row) => ({
        _id:                   String(row._id),
        campaign_name:         String(row.campaign_name         ?? ''),
        brand_name:            String(row.brand_name            ?? ''),
        headline:              String(row.headline              ?? ''),
        home_page_url:         String(row.home_page_url         ?? ''),
        brand_logo_asset_id:   String(row.brand_logo_asset_id   ?? ''),
        custom_image_asset_id: String(row.custom_image_asset_id ?? ''),
        keyword:               String(row.keyword               ?? ''),
        match_type:            String(row.match_type            ?? 'exact'),
        bid:                   Number(row.bid)    || 0,
        budget:                Number(row.budget) || 0,
        start_date:            String(row.start_date            ?? ''),
        _status:               (rows as SBVSpotlightBulkRow[]).find((r) => r._id === row._id)?._status ?? 'idle',
        _error:                (rows as SBVSpotlightBulkRow[]).find((r) => r._id === row._id)?._error,
      })) as any,
    )
  }

  // ── Rename campaign names when grouping mode changes ───────────────────────
  function handleGroupingChange(m: string) {
    const mode = m as SBBulkGroupingMode
    // Recompute campaign_name on all rows to match new mode
    const renamed = (rows as SBVSpotlightBulkRow[]).map((r) => ({
      ...r,
      campaign_name: buildCampaignName(r.brand_name, r.keyword, mode === 'grouped' ? 'grouped' : 'individual'),
    }))
    store.setRows('sbv_spotlight' as any, renamed as any)
    setGroupingMode(mode)
    clearSummary()
  }

  const hasRows     = rows.length > 0
  const canSubmit   = pendingCount > 0 && !isSubmitting
  const submitLabel = isSubmitting
    ? 'Creating campaigns…'
    : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`

  return (
    <div className="flex flex-col gap-5">

      {/* Shared settings */}
      <SharedSettingsPanel
        defaults={sharedDefaults}
        onChange={patchDefaults}
        currencySymbol={currencySymbol}
        minBid={minBid}
        minBudget={minBudget}
      />

      {/* Paste area */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            SB Store Spotlight — Keyword Targeting · Data is appended each time you paste
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <PasteArea onPaste={handlePaste} />
          {parseInfo && (
            <p className="text-xs text-emerald-600 font-medium">
              ✓ Added {parseInfo.added} row{parseInfo.added !== 1 ? 's' : ''}
              {parseInfo.skipped > 0 && ` · ${parseInfo.skipped} skipped`}
            </p>
          )}
        </div>
      </div>

      {hasRows && (
        <>
          {/* Status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-800">
                {groupingMode === 'grouped' ? uniqueBrandCount : rows.length} campaign{(groupingMode === 'grouped' ? uniqueBrandCount : rows.length) !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{rows.length} row{rows.length !== 1 ? 's' : ''}</span>
              {successCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {successCount} created
                </span>
              )}
              {failedCount > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-3.5 w-3.5" /> {failedCount} failed
                </span>
              )}
            </div>
            <button type="button"
              onClick={() => { store.clearRows('sbv_spotlight' as any); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          {/* Grouping toggle */}
          <GroupingToggle
            mode={groupingMode}
            disableGrouped={!hasGroupableRows}
            onChange={handleGroupingChange}
            groupedLabel="Group by Brand"
            groupedSublabel="Multiple keywords per campaign"
          />

          {/* Table */}
          <CampaignDataTable
            data={tableData}
            columns={COLUMNS}
            groupByFields={groupingMode === 'grouped' ? ['brand_name'] : ['_id']}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={20}
          />

          {/* Summary */}
          {summary && (
            <SummaryBanner
              summary={summary}
              onRetry={() => retryFailed(groupingMode)}
              onDismiss={clearSummary}
            />
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button type="button"
              onClick={() => submitAll(groupingMode)}
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}