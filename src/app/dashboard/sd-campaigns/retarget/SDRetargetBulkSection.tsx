'use client'

import { useState, useCallback } from 'react'
import { ClipboardPaste, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useSDRetargetStore, parseSDRetargetLine, type SDRetargetBulkRow } from '@/lib/store/sdCampaignCreationStore'
import { useSDRetargetBulkSubmit, useCampaignDefaults } from '@/lib/hooks/sdCampaignHooks'
import { SDBulkSummaryBanner, type ExpressionType } from '../shared/SDFormComponents'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type { CampaignColumnDefinition, CampaignTableData } from '@/components/dashboard/table/campaign-data-table'

// ── Columns ───────────────────────────────────────────────────────────────────

const EXPRESSION_OPTIONS = [
  { value: 'views',     label: 'Views'     },
  { value: 'purchases', label: 'Purchases' },
]

const LOOKBACK_OPTIONS = [
  { value: '7',   label: '7 days'   },
  { value: '14',  label: '14 days'  },
  { value: '30',  label: '30 days'  },
  { value: '60',  label: '60 days'  },
  { value: '90',  label: '90 days'  },
  { value: '180', label: '180 days' },
  { value: '365', label: '365 days' },
]

const COLUMNS: CampaignColumnDefinition[] = [
  { field: 'campaign_name',   headerName: 'Campaign Name',     type: 'text',     span: true, editable: true,  sortable: true,  width: 280, minWidth: 180, maxWidth: 460 },
  { field: 'asin',            headerName: 'ASIN',              type: 'text',     span: true, editable: true,  sortable: true,  filterable: true, width: 140, minWidth: 120 },
  { field: 'expression_type', headerName: 'Type',              type: 'dropdown', span: true, editable: true,  width: 120, minWidth: 100, options: EXPRESSION_OPTIONS },
  { field: 'lookback_window', headerName: 'Lookback',        type: 'dropdown', span: true, editable: true, width: 120, minWidth: 100, options: LOOKBACK_OPTIONS },
  { field: 'bid',             headerName: 'Targeting Bid (£)', type: 'number',   span: true, editable: true,  width: 150, minWidth: 100 },
  { field: 'budget',          headerName: 'Budget (£)',        type: 'number',   span: true, editable: true,  width: 110, minWidth: 80  },
  { field: 'intent',          headerName: 'Intent',            type: 'text',     span: true, editable: true,  width: 160, minWidth: 120 },
  { field: 'start_date',      headerName: 'Start Date',        type: 'date',     span: true, editable: true,  width: 150 },
  { field: '_statusLabel',    headerName: 'Status',            type: 'text',     span: true, editable: false, width: 120, minWidth: 100 },
]

function toStatusLabel(status: string, error?: string) {
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
          <span className="font-mono">ASIN</span> →&nbsp;
          <span className="font-mono">Expression Type</span> →&nbsp;
          <span className="font-mono">Targeting Bid</span> →&nbsp;
          <span className="font-mono text-slate-300">Budget</span> →&nbsp;
          <span className="font-mono text-slate-300">Lookback</span> →&nbsp;
          <span className="font-mono text-slate-300">Intent</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Last 3 columns optional · Budget defaults to <span className="font-mono">bid × 15</span> · Expression defaults to <span className="font-mono">views</span>
        </p>
      </div>
      <textarea onPaste={handlePaste} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none" readOnly />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SDRetargetBulkSection() {
  const store                                  = useSDRetargetStore()
  const { minBid, minBudget }                  = useCampaignDefaults()
  const {
    rows, submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    pendingCount, failedCount, successCount,
  } = useSDRetargetBulkSubmit()

  const [parseInfo, setParseInfo] = useState<{ added: number; skipped: number; invalidAsins: number } | null>(null)

  const tableData: CampaignTableData[] = rows.map((r) => ({
    _id:             r._id,
    campaign_name:   r.campaign_name,
    asin:            r.asin,
    expression_type: r.expression_type,
    bid:             r.bid,
    budget:          r.budget,
    intent:          r.intent,
    start_date:      r.start_date,
    lookback_window: r.lookback_window,
    _statusLabel:    toStatusLabel(r._status, r._error),
  }))

  function handlePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    let added = 0, skipped = 0, invalidAsins = 0
    const newRows: SDRetargetBulkRow[] = []
    for (const line of lines) {
      const { row, invalidAsin } = parseSDRetargetLine(line, minBid, minBudget)
      if (!row) { if (invalidAsin) invalidAsins++; skipped++; continue }
      newRows.push(row)
      added++
    }
    store.appendRows(newRows)
    setParseInfo({ added, skipped, invalidAsins })
    setTimeout(() => setParseInfo(null), 4000)
  }

  function buildCampaignName(asin: string, expressionType: ExpressionType, intent: string) {
    const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
    return `${asin.toUpperCase().trim()} - SD - RT - ${expressionType.charAt(0).toUpperCase() + expressionType.slice(1)}${intentSuffix}`
  }

 function handleTableChange(updated: CampaignTableData[]) {
  store.setRows(updated.map((row) => {
    const asin           = String(row.asin           ?? '').toUpperCase().trim()
    const expressionType = (row.expression_type as ExpressionType) ?? 'views'
    const intent         = String(row.intent         ?? '')

    // Clamp lookback if views doesn't support 180/365
    const rawLookback    = Number(row.lookback_window) || 30
    const lookback_window = expressionType === 'views' && rawLookback > 90 ? 90 : rawLookback

    const existingRow  = rows.find((r) => r._id === row._id)
    const prevAutoName = existingRow
      ? buildCampaignName(existingRow.asin, existingRow.expression_type, existingRow.intent)
      : ''
    const isAutoName    = !existingRow || existingRow.campaign_name === prevAutoName
    const campaign_name = isAutoName
      ? buildCampaignName(asin, expressionType, intent)
      : String(row.campaign_name ?? '')

    return {
      _id:             String(row._id),
      campaign_name,
      intent,
      asin,
      expression_type: expressionType,
      lookback_window,                      // ← clamped
      default_bid:     0,
      bid:             Number(row.bid)    || 0,
      budget:          Number(row.budget) || 0,
      start_date:      String(row.start_date ?? ''),
      _status:         existingRow?._status ?? 'idle',
      _error:          existingRow?._error,
    }
  }))
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
          <p className="mt-0.5 text-xs text-slate-500">SD Retargeting · One campaign per row</p>
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
                  <span>{parseInfo.invalidAsins} row{parseInfo.invalidAsins !== 1 ? 's' : ''} had invalid ASINs and were skipped.</span>
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
              <span className="font-semibold text-slate-800">{rows.length} campaign{rows.length !== 1 ? 's' : ''}</span>
              {successCount > 0 && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {successCount} created</span>}
              {failedCount  > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3.5 w-3.5" /> {failedCount} failed</span>}
            </div>
            <button type="button" onClick={() => { store.clearRows(); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          <CampaignDataTable data={tableData} columns={COLUMNS} groupByFields={['_id']}
            onDataChange={handleTableChange} showCheckboxColumn showDeleteOption rowsPerPage={20} />

          {summary && <SDBulkSummaryBanner summary={summary} onRetry={retryFailed} onDismiss={clearSummary} />}

          {rows.some(r => r.expression_type === 'views' && r.lookback_window > 90) && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Lookback clamped to 90 days for <span className="font-mono">views</span> rows — max allowed is 90.</span>
            </p>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={submitAll} disabled={!canSubmit}
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