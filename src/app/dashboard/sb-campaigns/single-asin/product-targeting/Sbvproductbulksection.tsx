'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { isValidAsin } from '@/lib/utils/asinValidation'
import { useBulkCampaignStore, today, type SBVProductBulkRow } from '@/lib/store/sbCampaignStore'
import { useSBVProductBulkSubmit, type SBBulkGroupingMode } from '@/lib/hooks/sbCampaignHooks'
import { GroupingToggle } from '@/app/dashboard/sp-campaigns/components/shared/GroupingToggle'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type {
  CampaignColumnDefinition,
  CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'

// ── Column definitions ────────────────────────────────────────────────────────

const MATCH_OPTIONS = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

const COLUMNS: CampaignColumnDefinition[] = [
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
    field: 'bid', headerName: 'Bid (£)',
    type: 'number', span: false, editable: true,
    width: 90, minWidth: 70,
  },
  {
    field: 'budget', headerName: 'Budget (£)',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

function parseLine(line: string): { row: SBVProductBulkRow | null; invalidAsin: boolean } {
  const cols = line.split('\t').map((c) => c.trim())
  // Expected: ASIN | Target ASIN | Bid | Match Type | Video Asset ID
  const [asin, targetAsin, bidRaw, matchRaw, videoAssetId] = cols

  if (!asin || !targetAsin || !videoAssetId) return { row: null, invalidAsin: false }

  if (!isValidAsin(asin))       return { row: null, invalidAsin: true }
  if (!isValidAsin(targetAsin)) return { row: null, invalidAsin: true }

  const bid = parseFloat(bidRaw)
  if (isNaN(bid) || bid <= 0)   return { row: null, invalidAsin: false }

  return {
    invalidAsin: false,
    row: {
      _id:            nanoid(),
      _status:        'idle',
      campaign_name:  '',
      asin:           asin.toUpperCase().trim(),
      video_asset_id: videoAssetId.trim(),
      target_asin:    targetAsin.toUpperCase().trim(),
      match_type:     matchRaw?.trim() || 'EXACT',
      bid,
      budget:         Math.max(10, bid * 10),
      start_date:     today(),
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
          Copy 5 columns from Excel:&nbsp;
          <span className="font-mono">ASIN</span> →&nbsp;
          <span className="font-mono">Target ASIN</span> →&nbsp;
          <span className="font-mono">Bid</span> →&nbsp;
          <span className="font-mono">Match Type</span> →&nbsp;
          <span className="font-mono">Video Asset ID</span>
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

  const {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount, rowFailedCount, rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  } = useSBVProductBulkSubmit()

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
    start_date:     r.start_date,
    _statusLabel:   toStatusLabel(r._status, r._error),
  }))

  function handlePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: SBVProductBulkRow[] = []
    for (const line of lines) {
      const { row, invalidAsin } = parseLine(line)
      if (!row) { if (invalidAsin) invalidAsins++; skipped++; continue }
      newRows.push(row)
      added++
    }
    store.appendRows('sbv_product', newRows)
    setParseInfo({ added, skipped, invalidAsins })
    setTimeout(() => setParseInfo(null), 4000)
  }

  function handleTableChange(updated: CampaignTableData[]) {
    store.setRows<SBVProductBulkRow>(
      'sbv_product',
      updated.map((row) => ({
        _id:            String(row._id),
        campaign_name:  String(row.campaign_name  ?? ''),
        asin:           String(row.asin           ?? ''),
        video_asset_id: String(row.video_asset_id ?? ''),
        target_asin:    String(row.target_asin    ?? ''),
        match_type:     String(row.match_type     ?? 'EXACT'),
        bid:            Number(row.bid)    || 0,
        budget:         Number(row.budget) || 0,
        start_date:     String(row.start_date ?? ''),
        _status:        rows.find((r) => r._id === row._id)?._status ?? 'idle',
        _error:         rows.find((r) => r._id === row._id)?._error,
      })),
    )
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
            onChange={(m) => { setGroupingMode(m as SBBulkGroupingMode); clearSummary() }}
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