'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { useCampaignCreationStore } from '@/lib/store/campaignCreationStore'
import { useBulkCampaignSubmit, type GroupingMode } from '@/lib/hooks/campaignCreationHooks'
import { GroupingToggle } from '../../../shared/GroupingToggle'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type {
  CampaignColumnDefinition,
  CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'

// ── Table column definitions ──────────────────────────────────────────────────

const MATCH_OPTIONS = [
  { value: 'EXACT',  label: 'Exact'  },
  { value: 'BROAD',  label: 'Broad'  },
  { value: 'PHRASE', label: 'Phrase' },
]

const BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const COLUMNS: CampaignColumnDefinition[] = [
  {
    field:      'campaign_name',
    headerName: 'Campaign Name',
    type:       'text',
    span:       true,
    editable:   true,
    sortable:   true,
    width:      300,
    minWidth:   200,
    maxWidth:   500,
  },
  {
    field:      'asin',
    headerName: 'ASIN',
    type:       'text',
    span:       true,
    editable:   true,
    sortable:   true,
    filterable: true,
    width:      140,
    minWidth:   120,
  },
  {
    field:      'keyword',
    headerName: 'Keyword',
    type:       'text',
    span:       false,
    editable:   true,
    sortable:   true,
    filterable: true,
    width:      200,
    minWidth:   140,
  },
  {
    field:      'match_type',
    headerName: 'Match Type',
    type:       'dropdown',
    span:       false,
    editable:   true,
    width:      120,
    minWidth:   100,
    options:    MATCH_OPTIONS,
  },
  {
    field:      'bid',
    headerName: 'Bid',
    type:       'number',
    span:       false,
    editable:   true,
    width:      100,
    minWidth:   80,
  },
  {
    field:      'budget',
    headerName: 'Budget',
    type:       'number',
    span:       true,
    editable:   true,
    width:      110,
    minWidth:   80,
  },
  {
    field:      'start_date',
    headerName: 'Start Date',
    type:       'date',
    span:       true,
    editable:   true,
    width:      150,
  },
  {
    field:      'dynamic_bidding',
    headerName: 'Strategy',
    type:       'dropdown',
    span:       true,
    editable:   true,
    width:      160,
    minWidth:   130,
    options:    BIDDING_OPTIONS,
  },
  {
    field:      '_statusLabel',
    headerName: 'Status',
    type:       'text',
    span:       true,
    editable:   false,
    width:      120,
    minWidth:   100,
  },
]

// ── Status label mapper ───────────────────────────────────────────────────────

function toStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

// ── Paste area ────────────────────────────────────────────────────────────────

function PasteArea({ onPaste }: { onPaste: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [flash, setFlash] = useState(false)

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text')
      if (text.trim()) {
        onPaste(text)
        setFlash(true)
        setTimeout(() => setFlash(false), 600)
      }
    },
    [onPaste]
  )

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
        <p className="text-sm font-semibold text-slate-600">
          Paste Excel data here
        </p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Copy 4 columns from Excel:&nbsp;
          <span className="font-mono">ASIN</span> →&nbsp;
          <span className="font-mono">Keyword</span> →&nbsp;
          <span className="font-mono">Bid</span> →&nbsp;
          <span className="font-mono">Match Type</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Match Type is optional — defaults to EXACT
        </p>
      </div>
      {/* Invisible full-area textarea captures paste */}
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for bulk campaign data"
      />
    </div>
  )
}

// ── Summary Banner ────────────────────────────────────────────────────────────

function SummaryBanner({
  summary,
  onRetry,
  onDismiss,
}: {
  summary: { total: number; success: number; failed: number }
  onRetry: () => void
  onDismiss: () => void
}) {
  const allSuccess = summary.failed === 0

  return (
    <div className={`
      flex items-center justify-between gap-4 rounded-xl border px-4 py-3
      ${allSuccess
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-amber-200 bg-amber-50'}
    `}>
      <div className="flex items-center gap-3">
        {allSuccess
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        }
        <p className="text-sm font-medium text-slate-700">
          {summary.success} of {summary.total} campaigns created successfully
          {summary.failed > 0 && ` · ${summary.failed} failed`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {summary.failed > 0 && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Retry Failed
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BulkPasteSection() {
  const { bulkRows, parsePastedData, setBulkRows, clearBulkRows, renameBulkRows } =
    useCampaignCreationStore()

  const [groupingMode, setGroupingMode] = useState<GroupingMode>('individual')

  const {
    submitAll,
    retryFailed,
    clearSummary,
    isSubmitting,
    summary,
    rowPendingCount,
    rowFailedCount,
    rowSuccessCount,
    groupPendingCount,
    groupFailedCount,
    groupSuccessCount,
  } = useBulkCampaignSubmit()

  const pendingCount = groupingMode === 'individual' ? rowPendingCount : groupPendingCount
  const failedCount  = groupingMode === 'individual' ? rowFailedCount  : groupFailedCount
  const successCount = groupingMode === 'individual' ? rowSuccessCount : groupSuccessCount

  const [parseInfo, setParseInfo] = useState<{ added: number; skipped: number } | null>(null)

  // ── Convert store rows → table data ────────────────────────────────────────
  const tableData: CampaignTableData[] = bulkRows.map((r) => ({
    _id:             r._id,
    campaign_name:   r.campaign_name,
    asin:            r.asin,
    keyword:         r.keyword,
    match_type:      r.match_type,
    bid:             r.bid,
    budget:          r.budget,
    start_date:      r.start_date,
    dynamic_bidding: r.dynamic_bidding,
    _statusLabel:    toStatusLabel(r._status, r._error),
  }))

  // ── Paste handler ──────────────────────────────────────────────────────────
  function handlePaste(text: string) {
    const result = parsePastedData(text)
    setParseInfo(result)
    setTimeout(() => setParseInfo(null), 4000)
  }

  // ── Table change handler ───────────────────────────────────────────────────
  function handleTableChange(updated: CampaignTableData[]) {
    setBulkRows(
      updated.map((row) => ({
        _id:             String(row._id),
        campaign_name:   String(row.campaign_name ?? ''),
        asin:            String(row.asin ?? ''),
        keyword:         String(row.keyword ?? ''),
        match_type:      (row.match_type as any) ?? 'EXACT',
        bid:             Number(row.bid) || 0,
        budget:          Number(row.budget) || 0,
        start_date:      String(row.start_date ?? ''),
        dynamic_bidding: (row.dynamic_bidding as any) ?? 'AUTO_FOR_SALES',
        _status:  bulkRows.find((r) => r._id === row._id)?._status  ?? 'idle',
        _error:   bulkRows.find((r) => r._id === row._id)?._error,
      }))
    )
  }

  // True when at least one ASIN appears more than once
  const hasGroupableAsins = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of bulkRows) counts.set(r.asin, (counts.get(r.asin) ?? 0) + 1)
    return [...counts.values()].some((n) => n > 1)
  }, [bulkRows])

  const hasRows     = bulkRows.length > 0
  const canSubmit   = pendingCount > 0 && !isSubmitting
  const submitLabel = isSubmitting
    ? 'Creating campaigns…'
    : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`

  return (
    <div className="flex flex-col gap-5">

      {/* Paste area */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Data is appended each time you paste — clear the table to start fresh
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <PasteArea onPaste={handlePaste} />

          {/* Parse feedback */}
          {parseInfo && (
            <p className="text-xs text-emerald-600 font-medium">
              ✓ Added {parseInfo.added} row{parseInfo.added !== 1 ? 's' : ''}
              {parseInfo.skipped > 0 && ` · ${parseInfo.skipped} skipped (missing ASIN or keyword)`}
            </p>
          )}
        </div>
      </div>

      {/* Table + controls */}
      {hasRows && (
        <>
          {/* Row / status summary bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-800">{bulkRows.length} rows</span>
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
            <button
              type="button"
              onClick={() => { clearBulkRows(); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          {/* Grouping toggle */}
          <GroupingToggle
            mode={groupingMode}
            disableGrouped={!hasGroupableAsins}
            onChange={(m) => { setGroupingMode(m); renameBulkRows(m); clearSummary() }}
            groupedLabel="Group by ASIN"
            groupedSublabel="Multiple keywords per campaign"
          />

          {/* Editable table */}
          <CampaignDataTable
            data={tableData}
            columns={COLUMNS}
            groupByFields={groupingMode === 'grouped' ? ['asin'] : ['_id']}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={20}
          />

          {/* Summary banner */}
          {summary && (
            <SummaryBanner
              summary={summary}
              onRetry={() => retryFailed(groupingMode)}
              onDismiss={clearSummary}
            />
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => submitAll(groupingMode)}
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}