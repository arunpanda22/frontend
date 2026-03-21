'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { useCampaignCreationStore } from '@/lib/store/campaignCreationStore'
import { useBulkProductSubmit, type GroupingMode } from '@/lib/hooks/campaignCreationHooks'
import { GroupingToggle } from '../../../shared/GroupingToggle'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type { CampaignColumnDefinition, CampaignTableData } from '@/components/dashboard/table/campaign-data-table'

// ── Column definitions ────────────────────────────────────────────────────────
// span: true  → rowspan across all rows in the same group (campaign-level field)
// span: false → one cell per target row

const MATCH_OPTIONS = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

const BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const COLUMNS: CampaignColumnDefinition[] = [
  // ── Campaign-level (spanned) ───────────────────────────────────────────────
  {
    field:      'asin',
    headerName: 'Advertised ASIN',
    type:       'text',
    span:       true,
    editable:   true,
    sortable:   true,
    filterable: true,
    width:      160,
    minWidth:   130,
  },
  {
    field:      'campaign_name',
    headerName: 'Campaign Name',
    type:       'text',
    span:       true,
    editable:   true,
    width:      280,
    minWidth:   200,
    maxWidth:   480,
  },
  {
    field:      'budget',
    headerName: 'Budget (£)',
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

  // ── Per-target-row ─────────────────────────────────────────────────────────
  {
    field:      'target_asin',
    headerName: 'Target ASIN',
    type:       'text',
    span:       false,
    editable:   true,
    sortable:   true,
    filterable: true,
    width:      160,
    minWidth:   130,
  },
  {
    field:      'match_type',
    headerName: 'Match Type',
    type:       'dropdown',
    span:       false,
    editable:   true,
    width:      130,
    minWidth:   110,
    options:    MATCH_OPTIONS,
  },
  {
    field:      'bid',
    headerName: 'Bid (£)',
    type:       'number',
    span:       false,
    editable:   true,
    sortable:   true,
    width:      100,
    minWidth:   80,
  },

  // ── Status (spanned, read-only) ────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
          <span className="font-mono font-medium text-slate-600">Advertised ASIN</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Target ASIN</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Bid</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Match Type</span>
        </p>
        <p className="text-[11px] text-slate-400 text-center">
          Rows with the same Advertised ASIN are grouped into one campaign automatically
        </p>
      </div>
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for bulk product targeting data"
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
          : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0" />
        }
        <p className="text-sm font-medium text-slate-700">
          {summary.success} of {summary.total} campaigns created
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
        <button type="button" onClick={onDismiss} className="rounded-lg px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function BulkPasteSection() {
  const {
    productBulkRows,
    parsePastedProductData,
    setProductBulkRows,
    clearProductBulkRows,
    renameProductBulkRows,
  } = useCampaignCreationStore()

  const [groupingMode, setGroupingMode] = useState<GroupingMode>('individual')

  const {
    submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    rowPendingCount,  rowFailedCount,  rowSuccessCount,
    groupPendingCount, groupFailedCount, groupSuccessCount,
  } = useBulkProductSubmit()

  const pendingCount = groupingMode === 'individual' ? rowPendingCount : groupPendingCount
  const failedCount  = groupingMode === 'individual' ? rowFailedCount  : groupFailedCount
  const successCount = groupingMode === 'individual' ? rowSuccessCount : groupSuccessCount

  const [parseInfo, setParseInfo] = useState<{ added: number; skipped: number; invalidAsins: number } | null>(null)

  // ── Table data — flat rows, one per target ──────────────────────────────────
  const tableData: CampaignTableData[] = productBulkRows.map((r) => ({
    _id:             r._id,
    asin:            r.asin,
    campaign_name:   r.campaign_name,
    budget:          r.budget,
    start_date:      r.start_date,
    dynamic_bidding: r.dynamic_bidding,
    target_asin:     r.target_asin,
    match_type:      r.match_type,
    bid:             r.bid,
    _statusLabel:    toStatusLabel(r._status, r._error),
  }))

  // ── onDataChange — table passes back full flat array with all edits applied ─
  // The new CampaignDataTable already handles spanned edits by updating all rows
  // in the group, so we just set the rows directly.
  function handleTableChange(updated: CampaignTableData[]) {
    setProductBulkRows(
      updated.map((row) => ({
        _id:             String(row._id),
        campaign_name:   String(row.campaign_name ?? ''),
        asin:            String(row.asin ?? ''),
        target_asin:     String(row.target_asin ?? ''),
        match_type:      (row.match_type as 'EXACT' | 'EXPANDED') ?? 'EXACT',
        bid:             Number(row.bid) || 0,
        budget:          Number(row.budget) || 0,
        start_date:      String(row.start_date ?? ''),
        dynamic_bidding: (row.dynamic_bidding as any) ?? 'AUTO_FOR_SALES',
        // Preserve status from existing rows — table never touches _status
        _status:  productBulkRows.find((r) => r._id === row._id)?._status  ?? 'idle',
        _error:   productBulkRows.find((r) => r._id === row._id)?._error,
      }))
    )
  }

  function handlePaste(text: string) {
    const result = parsePastedProductData(text)
    setParseInfo(result)
    setTimeout(() => setParseInfo(null), 4000)
  }

  const totalTargets  = productBulkRows.length
  const uniqueCampaigns = new Set(productBulkRows.map((r) => r.asin)).size
  // True when at least one ASIN appears more than once
  const hasGroupableAsins = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of productBulkRows) counts.set(r.asin, (counts.get(r.asin) ?? 0) + 1)
    return [...counts.values()].some((n) => n > 1)
  }, [productBulkRows])

  const hasRows       = totalTargets > 0
  const canSubmit     = pendingCount > 0 && !isSubmitting

  return (
    <div className="flex flex-col gap-5">

      {/* Paste input */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            One row per target ASIN — rows sharing the same Advertised ASIN are grouped into one campaign
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
                      {" "}Make sure you're pasting product targeting data here, not keyword data.
                    </span>
                  </p>
                )}
              </div>
            )}
        </div>
      </div>

      {hasRows && (
        <>
          {/* Stats bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-800">
                {groupingMode === 'grouped' ? uniqueCampaigns : totalTargets} campaign{(groupingMode === 'grouped' ? uniqueCampaigns : totalTargets) !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{totalTargets} target{totalTargets !== 1 ? 's' : ''}</span>
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
              onClick={() => { clearProductBulkRows(); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          {/* Grouping toggle */}
          <GroupingToggle
            mode={groupingMode}
            disableGrouped={!hasGroupableAsins}
            onChange={(m) => { setGroupingMode(m); renameProductBulkRows(m); clearSummary() }}
            groupedLabel="Group by ASIN"
            groupedSublabel="Multiple targets per campaign"
          />

          {/* Grouped table */}
          <CampaignDataTable
            data={tableData}
            columns={COLUMNS}
            groupByFields={groupingMode === 'grouped' ? ['asin'] : ['_id']}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={15}
          />

          {summary && (
            <SummaryBanner
              summary={summary}
              onRetry={() => retryFailed(groupingMode)}
              onDismiss={clearSummary}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => submitAll(groupingMode)}
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? 'Creating campaigns…'
                : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}