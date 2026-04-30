'use client'

import { useState, useCallback } from 'react'
import { ClipboardPaste, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  useSDContextualProductStore,
  useSDContextualCategoryStore,
  parseSDContextualLine,
  type SDContextualProductBulkRow,
  type SDContextualCategoryBulkRow,
} from '@/lib/store/sdCampaignCreationStore'
import {
  useSDContextualProductBulkSubmit,
  useSDContextualCategoryBulkSubmit,
  useCampaignDefaults,
} from '@/lib/hooks/sdCampaignHooks'
import { SDBulkSummaryBanner } from '../shared/SDFormComponents'
import type { ContextualType } from '../shared/SDFormComponents'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type { CampaignColumnDefinition, CampaignTableData } from '@/components/dashboard/table/campaign-data-table'

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS: CampaignColumnDefinition[] = [
  { field: 'campaign_name', headerName: 'Campaign Name',     type: 'text',   span: true, editable: true,  sortable: true,  width: 280, minWidth: 180, maxWidth: 460 },
  { field: 'asin',          headerName: 'Advertised ASIN',   type: 'text',   span: true, editable: true,  sortable: true,  filterable: true, width: 150, minWidth: 120 },
  { field: 'target_asin',   headerName: 'Target ASIN',       type: 'text',   span: true, editable: true,  sortable: true,  filterable: true, width: 150, minWidth: 120 },
  { field: 'bid',           headerName: 'Targeting Bid (£)', type: 'number', span: true, editable: true,  width: 150, minWidth: 100 },
  { field: 'budget',        headerName: 'Budget (£)',         type: 'number', span: true, editable: true,  width: 110, minWidth: 80  },
  { field: 'intent',        headerName: 'Intent',             type: 'text',   span: true, editable: true,  width: 160, minWidth: 120 },
  { field: 'start_date',    headerName: 'Start Date',         type: 'date',   span: true, editable: true,  width: 150 },
  { field: '_statusLabel',  headerName: 'Status',             type: 'text',   span: true, editable: false, width: 120, minWidth: 100 },
]

function toStatusLabel(status: string, error?: string) {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

// ── Name builder ──────────────────────────────────────────────────────────────

function buildCampaignName(asin: string, subtype: ContextualType, intent: string) {
  const tag          = subtype === 'category' ? 'CAT' : 'CP'
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  return `${asin.toUpperCase().trim()} - SD - ${tag}${intentSuffix}`
}

// ── Paste area ────────────────────────────────────────────────────────────────

function PasteArea({ contextualType, onPaste }: { contextualType: ContextualType; onPaste: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [flash,      setFlash]      = useState(false)

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    if (text.trim()) { onPaste(text); setFlash(true); setTimeout(() => setFlash(false), 600) }
  }, [onPaste])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      className={`relative rounded-xl border-2 border-dashed transition-all
        ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}
        ${flash ? 'border-emerald-400 bg-emerald-50' : ''}`}
    >
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-6 pointer-events-none select-none">
        <ClipboardPaste className={`h-7 w-7 transition-colors ${isDragging || flash ? 'text-indigo-500' : 'text-slate-300'}`} />
        <p className="text-sm font-semibold text-slate-600">Paste Excel data here</p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          <span className="font-mono">Advertised ASIN</span> →&nbsp;
          <span className="font-mono">Target ASIN</span> →&nbsp;
          <span className="font-mono">Targeting Bid</span> →&nbsp;
          <span className="font-mono text-slate-300">Budget</span> →&nbsp;
          <span className="font-mono text-slate-300">Intent</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Last 2 columns optional · Budget defaults to <span className="font-mono">bid × 15</span>
          {contextualType === 'category' && ' · Category resolved from Target ASIN by Amazon'}
        </p>
      </div>
      <textarea onPaste={handlePaste} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none" readOnly />
    </div>
  )
}

// ── Parse info banner ─────────────────────────────────────────────────────────

function ParseInfo({ info }: { info: { added: number; skipped: number; invalidAsins: number } }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-emerald-600 font-medium">
        ✓ Added {info.added} row{info.added !== 1 ? 's' : ''}
        {info.skipped > 0 && ` · ${info.skipped} skipped`}
      </p>
      {info.invalidAsins > 0 && (
        <p className="text-xs text-amber-600 font-medium flex items-start gap-1.5">
          <span>⚠️</span>
          <span>{info.invalidAsins} row{info.invalidAsins !== 1 ? 's' : ''} had invalid ASINs and were skipped.</span>
        </p>
      )}
    </div>
  )
}

// ── Shared bulk table + submit UI ─────────────────────────────────────────────

interface BulkTableProps {
  contextualType: ContextualType
  rows:           (SDContextualProductBulkRow | SDContextualCategoryBulkRow)[]
  onTableChange:  (updated: CampaignTableData[]) => void
  onClear:        () => void
  onSubmit:       () => void
  isSubmitting:   boolean
  pendingCount:   number
  failedCount:    number
  successCount:   number
  summary:        { total: number; success: number; failed: number } | null
  onRetry:        () => void
  onDismiss:      () => void
}

function BulkTable({
  rows, onTableChange, onClear, onSubmit,
  isSubmitting, pendingCount, failedCount, successCount,
  summary, onRetry, onDismiss,
}: BulkTableProps) {
  const tableData: CampaignTableData[] = rows.map((r) => ({
    _id:          r._id,
    campaign_name: r.campaign_name,
    asin:          r.asin,
    target_asin:   r.target_asin,
    bid:           r.bid,
    budget:        r.budget,
    intent:        r.intent,
    start_date:    r.start_date,
    _statusLabel:  toStatusLabel(r._status, r._error),
  }))

  const canSubmit   = pendingCount > 0 && !isSubmitting
  const submitLabel = isSubmitting
    ? 'Creating campaigns…'
    : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-slate-800">{rows.length} campaign{rows.length !== 1 ? 's' : ''}</span>
          {successCount > 0 && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {successCount} created</span>}
          {failedCount  > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3.5 w-3.5" /> {failedCount} failed</span>}
        </div>
        <button type="button" onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 className="h-3 w-3" /> Clear all
        </button>
      </div>

      <CampaignDataTable data={tableData} columns={COLUMNS} groupByFields={['_id']}
        onDataChange={onTableChange} showCheckboxColumn showDeleteOption rowsPerPage={20} />

      {summary && <SDBulkSummaryBanner summary={summary} onRetry={onRetry} onDismiss={onDismiss} />}

      <div className="flex justify-end">
        <button type="button" onClick={onSubmit} disabled={!canSubmit}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </>
  )
}

// ── Product bulk ──────────────────────────────────────────────────────────────

function SDContextualProductBulk() {
  const store           = useSDContextualProductStore()
  const { minBid, minBudget } = useCampaignDefaults()
  const { rows, submitAll, retryFailed, clearSummary, isSubmitting, summary, pendingCount, failedCount, successCount } =
    useSDContextualProductBulkSubmit()

  const [parseInfo, setParseInfo] = useState<{ added: number; skipped: number; invalidAsins: number } | null>(null)

  function handlePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: SDContextualProductBulkRow[] = []
    for (const line of lines) {
      const { row, invalidAsin } = parseSDContextualLine(line, 'product', minBid, minBudget)
      if (!row) { if (invalidAsin) invalidAsins++; skipped++; continue }
      newRows.push(row as SDContextualProductBulkRow)
      added++
    }
    store.appendRows(newRows)
    setParseInfo({ added, skipped, invalidAsins })
    setTimeout(() => setParseInfo(null), 4000)
  }

  function handleTableChange(updated: CampaignTableData[]) {
    store.setRows(updated.map((row) => {
      const asin       = String(row.asin        ?? '').toUpperCase().trim()
      const intent     = String(row.intent      ?? '')
      const existingRow = rows.find((r) => r._id === row._id)
      const prevAuto   = existingRow ? buildCampaignName(existingRow.asin, 'product', existingRow.intent) : ''
      const isAutoName = !existingRow || existingRow.campaign_name === prevAuto
      return {
        _id:           String(row._id),
        campaign_name: isAutoName ? buildCampaignName(asin, 'product', intent) : String(row.campaign_name ?? ''),
        intent,
        asin,
        target_asin:   String(row.target_asin ?? '').toUpperCase().trim(),
        default_bid:   0,
        bid:           Number(row.bid)    || 0,
        budget:        Number(row.budget) || 0,
        start_date:    String(row.start_date ?? ''),
        _status:       existingRow?._status ?? 'idle',
        _error:        existingRow?._error,
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">SD Contextual Product · One campaign per row</p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <PasteArea contextualType="product" onPaste={handlePaste} />
          {parseInfo && <ParseInfo info={parseInfo} />}
        </div>
      </div>
      {rows.length > 0 && (
        <BulkTable
          contextualType="product" rows={rows}
          onTableChange={handleTableChange} onClear={() => { store.clearRows(); clearSummary() }}
          onSubmit={submitAll} isSubmitting={isSubmitting}
          pendingCount={pendingCount} failedCount={failedCount} successCount={successCount}
          summary={summary} onRetry={retryFailed} onDismiss={clearSummary}
        />
      )}
    </div>
  )
}

// ── Category bulk ─────────────────────────────────────────────────────────────

function SDContextualCategoryBulk() {
  const store           = useSDContextualCategoryStore()
  const { minBid, minBudget } = useCampaignDefaults()
  const { rows, submitAll, retryFailed, clearSummary, isSubmitting, summary, pendingCount, failedCount, successCount } =
    useSDContextualCategoryBulkSubmit()

  const [parseInfo, setParseInfo] = useState<{ added: number; skipped: number; invalidAsins: number } | null>(null)

  function handlePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: SDContextualCategoryBulkRow[] = []
    for (const line of lines) {
      const { row, invalidAsin } = parseSDContextualLine(line, 'category', minBid, minBudget)
      if (!row) { if (invalidAsin) invalidAsins++; skipped++; continue }
      newRows.push(row as SDContextualCategoryBulkRow)
      added++
    }
    store.appendRows(newRows)
    setParseInfo({ added, skipped, invalidAsins })
    setTimeout(() => setParseInfo(null), 4000)
  }

  function handleTableChange(updated: CampaignTableData[]) {
    store.setRows(updated.map((row) => {
      const asin        = String(row.asin   ?? '').toUpperCase().trim()
      const intent      = String(row.intent ?? '')
      const existingRow = rows.find((r) => r._id === row._id)
      const prevAuto    = existingRow ? buildCampaignName(existingRow.asin, 'category', existingRow.intent) : ''
      const isAutoName  = !existingRow || existingRow.campaign_name === prevAuto
      return {
        _id:           String(row._id),
        campaign_name: isAutoName ? buildCampaignName(asin, 'category', intent) : String(row.campaign_name ?? ''),
        intent,
        asin,
        target_asin:   String(row.target_asin ?? '').toUpperCase().trim(),
        default_bid:   0,
        bid:           Number(row.bid)    || 0,
        budget:        Number(row.budget) || 0,
        start_date:    String(row.start_date ?? ''),
        _status:       existingRow?._status ?? 'idle',
        _error:        existingRow?._error,
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">SD Contextual Category · One campaign per row · Category resolved by Amazon</p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <PasteArea contextualType="category" onPaste={handlePaste} />
          {parseInfo && <ParseInfo info={parseInfo} />}
        </div>
      </div>
      {rows.length > 0 && (
        <BulkTable
          contextualType="category" rows={rows}
          onTableChange={handleTableChange} onClear={() => { store.clearRows(); clearSummary() }}
          onSubmit={submitAll} isSubmitting={isSubmitting}
          pendingCount={pendingCount} failedCount={failedCount} successCount={successCount}
          summary={summary} onRetry={retryFailed} onDismiss={clearSummary}
        />
      )}
    </div>
  )
}

// ── Exported wrapper ──────────────────────────────────────────────────────────

export function SDContextualBulkSection({ contextualType }: { contextualType: ContextualType }) {
  return contextualType === 'product'
    ? <SDContextualProductBulk />
    : <SDContextualCategoryBulk />
}