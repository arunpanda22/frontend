'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { isValidAsin } from '@/lib/utils/asinValidation'
import { useBulkCampaignStore, today, type SBVProductBulkRow } from '@/lib/store/sbCampaignStore'
import { useSBBrands, useSBVProductBulkSubmit, type SBBulkGroupingMode } from '@/lib/hooks/sbCampaignHooks'
import { GroupingToggle } from '@/app/dashboard/sp-campaigns/components/shared/GroupingToggle'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type {
  CampaignColumnDefinition,
  CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'
import { useCampaignDefaults } from '@/lib/hooks/sbCampaignHooks'

// ── Column definitions ────────────────────────────────────────────────────────
// Built as a function of currencySymbol — was previously a static array with
// hardcoded "£" in the Bid/Budget headers, so non-GBP accounts saw the wrong
// currency.

const MATCH_OPTIONS = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

function buildColumns(currencySymbol: string): CampaignColumnDefinition[] {
  return [
    {
      field: 'campaign_name', headerName: 'Campaign Name',
      type: 'text', span: true, editable: true, sortable: true,
      width: 280, minWidth: 180, maxWidth: 460,
    },
    {
      field: 'asin', headerName: 'ASIN',
      type: 'text', span: true, editable: true, sortable: true, filterable: true,
      width: 140, minWidth: 120,
    },
    {
      field: 'video_asset_id', headerName: 'Video Asset ID',
      type: 'text', span: true, editable: true,
      width: 200, minWidth: 140,
    },
    {
      field: 'target_asin', headerName: 'Target ASIN',
      type: 'text', span: false, editable: true, sortable: true, filterable: true,
      width: 160, minWidth: 120,
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
    { field: 'intent', headerName: 'Intent', type: 'text', span: true, editable: true, width: 160, minWidth: 120 },
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

interface SharedDefaults {
  budget:          number | string
  start_date:      string
  brand_entity_id: string
  intent:          string
}

const VALID_MATCH: Record<string, string> = { EXACT: 'EXACT', EXPANDED: 'EXPANDED' }


// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSBVPTCampaignName(
  asin:       string,
  targetAsin: string,
  matchType:  string,
  intent:     string,
  mode:       'individual' | 'grouped' = 'individual',
): string {
  const mt           = matchType.charAt(0).toUpperCase() + matchType.slice(1).toLowerCase()
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  if (mode === 'grouped') {
    return `${asin} - SBV - PT - MPT - ${mt}${intentSuffix}`
  }
  return `${asin} - SBV - PT - SPT - ${targetAsin.trim()} - ${mt}${intentSuffix}`
}

function renameSBVPTRows(
  currentRows: SBVProductBulkRow[],
  mode: SBBulkGroupingMode,
): SBVProductBulkRow[] {
  const counts = new Map<string, number>()
  for (const r of currentRows) {
    const key = `${r.asin}__${r.video_asset_id}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return currentRows.map((r) => {
    const key           = `${r.asin}__${r.video_asset_id}`
    const effectiveMode = (counts.get(key) ?? 1) > 1 ? mode : 'individual'
    return {
      ...r,
      campaign_name: buildSBVPTCampaignName(r.asin, r.target_asin, r.match_type, r.intent, effectiveMode),
    }
  })
}

// Computes what a single row's "auto" name would be given its own current
// fields and how many rows currently share its asin+video group — mirrors
// renameSBVPTRows's effective-mode logic for one row, so handleTableChange
// can tell whether an edited row's existing name is still auto-generated
// (and therefore safe to recompute) or was manually typed by the user.
function computeAutoName(
  row: SBVProductBulkRow,
  allRows: SBVProductBulkRow[],
  mode: SBBulkGroupingMode,
): string {
  const key = `${row.asin}__${row.video_asset_id}`
  const count = allRows.filter((r) => `${r.asin}__${r.video_asset_id}` === key).length
  const effectiveMode = count > 1 ? mode : 'individual'
  return buildSBVPTCampaignName(row.asin, row.target_asin, row.match_type, row.intent, effectiveMode)
}

function SharedSettingsPanel({ defaults, onChange, currencySymbol, minBudget }: {
  defaults:       SharedDefaults
  onChange:       (patch: Partial<SharedDefaults>) => void
  currencySymbol: string
  minBudget:      number
}) {
  const brands = useSBBrands()
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-800">Default Settings</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Applied to every pasted row — you can override individual cells in the table
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Brand *</label>
            <select
              value={defaults.brand_entity_id}
              onChange={(e) => onChange({ brand_entity_id: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            >
              <option value="">Select brand…</option>
              {(brands.data ?? []).map((b) => (
                <option key={b.brand_entity_id} value={b.brand_entity_id}>{b.brand_name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">Applied to all pasted rows</p>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Start Date</label>
            <input
              type="date"
              value={defaults.start_date}
              onChange={(e) => onChange({ start_date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function toStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

function parseLine(
  line:      string,
  defaults:  SharedDefaults,
  minBid:    number,
  minBudget: number,
): { row: SBVProductBulkRow | null; invalidAsin: boolean } {
  const cols = line.split('\t').map((c) => c.trim())
  // ASIN | Target ASIN | Bid | Match Type | Video Asset ID | Intent
  const [asin, targetAsin, bidRaw, matchRaw, videoAssetId, rawIntent] = cols

  if (!asin || !targetAsin || !videoAssetId) return { row: null, invalidAsin: false }
  if (!isValidAsin(asin))                    return { row: null, invalidAsin: true }
  if (!isValidAsin(targetAsin))              return { row: null, invalidAsin: true }

  const bid = parseFloat(bidRaw)
  if (isNaN(bid) || bid <= 0)               return { row: null, invalidAsin: false }

  const matchType = VALID_MATCH[matchRaw?.trim().toUpperCase()] ?? 'EXACT'
  const intent    = rawIntent?.trim() || defaults.intent || ''

  // Budget is computed per-row from the bid, same as every other bulk
  // section (SD contextual, SBV keyword) — previously this fell back to
  // `Number(defaults.budget)` first, which is always truthy since the
  // shared default starts at minBudget, so every row silently got the
  // exact same flat budget regardless of its own bid. The hardcoded
  // `Math.max(10, bid * 10)` fallback also didn't match the 15x multiplier
  // / real minBudget used elsewhere.
  const budget = Math.max(minBudget, bid * 15)

  return {
    invalidAsin: false,
    row: {
      _id:             nanoid(),
      _status:         'idle',
      campaign_name:   buildSBVPTCampaignName(asin.toUpperCase().trim(), targetAsin.toUpperCase().trim(), matchType, intent),
      asin:            asin.toUpperCase().trim(),
      video_asset_id:  videoAssetId.trim(),
      brand_entity_id: defaults.brand_entity_id,
      target_asin:     targetAsin.toUpperCase().trim(),
      match_type:      matchType,
      bid,
      budget,
      start_date:      defaults.start_date || today(),
      intent,
    },
  }
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
          Copy 6 columns from Excel:&nbsp;
          <span className="font-mono">ASIN</span> →&nbsp;
          <span className="font-mono">Target ASIN</span> →&nbsp;
          <span className="font-mono">Bid</span> →&nbsp;
          <span className="font-mono">Match Type</span> →&nbsp;
          <span className="font-mono">Video Asset ID</span> →&nbsp;
          <span className="font-mono">Intent</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Match Type optional — defaults to <span className="font-mono">EXACT</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Rows grouped by <span className="font-mono">ASIN + Video Asset ID</span>
        </p>
      </div>
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for SBV product bulk data"
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

export function SBVProductBulkSection() {
  const store = useBulkCampaignStore()

  const { minBid, minBudget, currencySymbol } = useCampaignDefaults()

  const {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  } = useSBVProductBulkSubmit()

  const [sharedDefaults, setSharedDefaults] = useState<SharedDefaults>(() => ({
    budget:          minBudget,
    start_date:      today(),
    brand_entity_id: '',
    intent:          '',
  }))

  function patchDefaults(patch: Partial<SharedDefaults>) {
    setSharedDefaults((prev) => ({ ...prev, ...patch }))
  }

  const COLUMNS = useMemo(() => buildColumns(currencySymbol), [currencySymbol])

  const [groupingMode, setGroupingMode] = useState<SBBulkGroupingMode>('individual')
  const [parseInfo, setParseInfo]       = useState<{ added: number; skipped: number; invalidAsins: number } | null>(null)

  const pendingCount = groupingMode === 'individual' ? rowPendingCount : groupPendingCount
  const failedCount  = groupingMode === 'individual' ? rowFailedCount  : groupFailedCount
  const successCount = groupingMode === 'individual' ? rowSuccessCount : groupSuccessCount

  const hasGroupableRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      const key = `${r.asin}__${r.video_asset_id}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.values()].some((n) => n > 1)
  }, [rows])

  const uniqueGroupCount = useMemo(
    () => new Set(rows.map((r) => `${r.asin}__${r.video_asset_id}`)).size,
    [rows],
  )

  const tableData: CampaignTableData[] = rows.map((r) => ({
    _id:            r._id,
    campaign_name:  r.campaign_name,
    asin:           r.asin,
    video_asset_id: r.video_asset_id,
    target_asin:    r.target_asin,
    match_type:     r.match_type,
    bid:            r.bid,
    budget:         r.budget,
    intent:         r.intent,
    start_date:     r.start_date,
    _statusLabel:   toStatusLabel(r._status, r._error),
  }))

  function handlePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: SBVProductBulkRow[] = []
    for (const line of lines) {
      const { row, invalidAsin } = parseLine(line, sharedDefaults, minBid, minBudget)
      if (!row) { if (invalidAsin) invalidAsins++; skipped++; continue }
      newRows.push(row)
      added++
    }
    const allRows = renameSBVPTRows([...rows, ...newRows], groupingMode)
    store.setRows<SBVProductBulkRow>('sbv_product', allRows)
    setParseInfo({ added, skipped, invalidAsins })
    setTimeout(() => setParseInfo(null), 4000)
  }

  // Same reconciliation pattern as the SBV keyword section: merge the
  // table's edits into row shape first, then recompute campaign_name from
  // the *new* field values only when the row's previous name still matched
  // what auto-generation would have produced from its *previous* values —
  // i.e. the user hasn't manually overridden it. Previously this copied
  // row.campaign_name straight through, so editing intent/target ASIN/match
  // type in the table never touched the name.
  function handleTableChange(updated: CampaignTableData[]) {
    const merged: SBVProductBulkRow[] = updated.map((row) => {
      const prev = rows.find((r) => r._id === row._id)
      return {
        _id:             String(row._id),
        campaign_name:   String(row.campaign_name  ?? ''), // reconciled below
        asin:            String(row.asin           ?? ''),
        video_asset_id:  String(row.video_asset_id ?? ''),
        brand_entity_id: prev?.brand_entity_id ?? sharedDefaults.brand_entity_id,
        target_asin:     String(row.target_asin    ?? ''),
        match_type:      VALID_MATCH[String(row.match_type ?? '').toUpperCase()] ?? 'EXACT',
        bid:             Number(row.bid)    || 0,
        budget:          Number(row.budget) || 0,
        start_date:      String(row.start_date ?? ''),
        intent:          String(row.intent ?? ''),
        _status:         prev?._status ?? 'idle',
        _error:          prev?._error,
      }
    })

    const withNames = merged.map((row) => {
      const prev = rows.find((r) => r._id === row._id)
      const prevAutoName = prev ? computeAutoName(prev, rows, groupingMode) : ''
      const isAutoName = !prev || prev.campaign_name === prevAutoName
      return {
        ...row,
        campaign_name: isAutoName
          ? computeAutoName(row, merged, groupingMode)
          : row.campaign_name,
      }
    })

    store.setRows<SBVProductBulkRow>('sbv_product', withNames)
  }

  const hasRows     = rows.length > 0
  const canSubmit   = pendingCount > 0 && !isSubmitting
  const submitLabel = isSubmitting
    ? 'Creating campaigns…'
    : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`

  return (
    <div className="flex flex-col gap-5">

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            SBV Single ASIN — Product Targeting · Data is appended each time you paste
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <SharedSettingsPanel
            defaults={sharedDefaults}
            onChange={patchDefaults}
            currencySymbol={currencySymbol}
            minBudget={minBudget}
          />
          <PasteArea onPaste={handlePaste} />
          {parseInfo && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-emerald-600 font-medium">
                ✓ Added {parseInfo.added} row{parseInfo.added !== 1 ? 's' : ''}
                {parseInfo.skipped > 0 && ` · ${parseInfo.skipped} skipped`}
              </p>
              {parseInfo.invalidAsins > 0 && (
                <p className="text-xs text-amber-600 font-medium flex items-start gap-1.5">
                  <span>⚠️</span>
                  <span>
                    {parseInfo.invalidAsins} row{parseInfo.invalidAsins !== 1 ? 's' : ''} had invalid ASINs and were skipped.
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {hasRows && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-800">
                {groupingMode === 'grouped' ? uniqueGroupCount : rows.length} campaign{(groupingMode === 'grouped' ? uniqueGroupCount : rows.length) !== 1 ? 's' : ''}
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
              onClick={() => { store.clearRows('sbv_product'); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          <GroupingToggle
            mode={groupingMode}
            disableGrouped={!hasGroupableRows}
            onChange={(m) => {
              const newMode = m as SBBulkGroupingMode
              setGroupingMode(newMode)
              store.setRows<SBVProductBulkRow>('sbv_product', renameSBVPTRows(rows, newMode))
              clearSummary()
            }}
            groupedLabel="Group by ASIN + Video"
            groupedSublabel="Multiple target ASINs per campaign"
          />

          <CampaignDataTable
            data={tableData}
            columns={COLUMNS}
            groupByFields={groupingMode === 'grouped' ? ['asin', 'video_asset_id'] : ['_id']}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={20}
          />

          {summary && (
            <SummaryBanner
              summary={summary}
              onRetry={() => retryFailed(groupingMode)}
              onDismiss={clearSummary}
            />
          )}

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