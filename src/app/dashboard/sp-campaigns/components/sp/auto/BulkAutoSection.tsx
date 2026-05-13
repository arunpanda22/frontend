'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { useCampaignCreationStore } from '@/lib/store/campaignCreationStore'
import { useBulkAutoSubmit, useCampaignDefaults } from '@/lib/hooks/campaignCreationHooks'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type {
  CampaignColumnDefinition,
  CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'
import type { AutoTargetGroup } from '@/lib/store/campaignCreationStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const TARGET_GROUP_OPTIONS = [
  { value: 'close_match', label: 'Close Match'  },
  { value: 'loose_match', label: 'Loose Match'  },
  { value: 'substitutes', label: 'Substitutes'  },
  { value: 'complements', label: 'Complements'  },
]

const BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const GROUP_LABEL: Record<AutoTargetGroup, string> = {
  close_match: 'Close Match',
  loose_match: 'Loose Match',
  substitutes: 'Substitutes',
  complements: 'Complements',
}

function toStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

// ── Paste Area ────────────────────────────────────────────────────────────────

function PasteArea({ onPaste }: { onPaste: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [flash,      setFlash]      = useState(false)

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
    [onPaste],
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
        <p className="text-sm font-semibold text-slate-600">Paste Excel data here</p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          <span className="font-mono">ASIN</span> →&nbsp;
          <span className="font-mono">Targeting Group</span> →&nbsp;
          <span className="font-mono">Bid</span> →&nbsp;
          <span className="font-mono">Budget</span> →&nbsp;
          <span className="font-mono">Intent</span>
        </p>
        <p className="text-[11px] text-slate-400 text-center">
          Targeting group accepts: <span className="font-mono">close</span>, <span className="font-mono">loose</span>, <span className="font-mono">subs</span>, <span className="font-mono">comps</span> (or full names) · Budget &amp; Intent optional
        </p>
      </div>
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for bulk auto targeting data"
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
          : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0"   />}
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

export function BulkAutoSection() {
  const {
    autoBulkRows,
    parsePastedAutoData,
    setAutoBulkRows,
    clearAutoBulkRows,
  } = useCampaignCreationStore()

  const { minBid, minBudget, currencySymbol } = useCampaignDefaults()

  const {
    submitAll,
    retryFailed,
    clearSummary,
    isSubmitting,
    summary,
    pendingCount,
    failedCount,
    successCount,
  } = useBulkAutoSubmit()

  const [parseInfo, setParseInfo] = useState<{
    added: number; skipped: number; invalidAsins: number
  } | null>(null)

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo<CampaignColumnDefinition[]>(() => [
    {
      field:      'campaign_name',
      headerName: 'Campaign Name',
      type:       'text',
      span:       false,
      editable:   true,
      sortable:   true,
      width:      280,
      minWidth:   180,
      maxWidth:   420,
    },
    {
      field:      'asin',
      headerName: 'ASIN',
      type:       'text',
      span:       false,
      editable:   true,
      sortable:   true,
      filterable: true,
      width:      140,
      minWidth:   110,
    },
    {
      field:      'target_group',
      headerName: 'Targeting Group',
      type:       'dropdown',
      span:       false,
      editable:   true,
      sortable:   true,
      filterable: true,
      width:      150,
      minWidth:   130,
      options:    TARGET_GROUP_OPTIONS,
    },
    {
      field:      'bid',
      headerName: `Bid (${currencySymbol})`,
      type:       'number',
      span:       false,
      editable:   true,
      width:      100,
      minWidth:   80,
    },
    {
      field:      'budget',
      headerName: `Budget (${currencySymbol})`,
      type:       'number',
      span:       false,
      editable:   true,
      width:      110,
      minWidth:   90,
    },
    {
      field:      'intent',
      headerName: 'Intent',
      type:       'text',
      span:       false,
      editable:   true,
      sortable:   false,
      width:      140,
      minWidth:   100,
    },
    {
      field:      'start_date',
      headerName: 'Start Date',
      type:       'date',
      span:       false,
      editable:   true,
      width:      150,
    },
    {
      field:      'dynamic_bidding',
      headerName: 'Strategy',
      type:       'dropdown',
      span:       false,
      editable:   true,
      width:      160,
      minWidth:   130,
      options:    BIDDING_OPTIONS,
    },
    {
      field:      '_statusLabel',
      headerName: 'Status',
      type:       'text',
      span:       false,
      editable:   false,
      width:      120,
      minWidth:   100,
    },
  ], [currencySymbol])

  // ── Table data ──────────────────────────────────────────────────────────────
  const tableData: CampaignTableData[] = autoBulkRows.map((r) => ({
    _id:             r._id,
    campaign_name:   r.campaign_name,
    asin:            r.asin,
    target_group:    r.target_group,
    bid:             r.bid,
    budget:          r.budget,
    intent:          r.intent,
    start_date:      r.start_date,
    dynamic_bidding: r.dynamic_bidding,
    _statusLabel:    toStatusLabel(r._status, r._error),
  }))

  // ── Paste handler ──────────────────────────────────────────────────────────
  function handlePaste(text: string) {
    const result = parsePastedAutoData(text, minBudget, minBid)
    setParseInfo(result)
    setTimeout(() => setParseInfo(null), 4000)
  }

  // ── Table change — recalc budget on bid change, rebuild campaign name ───────
  function handleTableChange(updated: CampaignTableData[]) {
    setAutoBulkRows(
      updated.map((row) => {
        const prev       = autoBulkRows.find((r) => r._id === row._id)
        const newBid     = Number(row.bid) || 0
        const bidChanged = prev && newBid !== prev.bid
        const newBudget  = bidChanged
          ? Math.max(minBudget, newBid * 15)
          : Number(row.budget) || minBudget

        // Rebuild campaign name whenever group, intent, or asin changes
        const group        = (row.target_group as AutoTargetGroup) ?? prev?.target_group ?? 'close_match'
        const intent       = String(row.intent ?? '')
        const asin         = String(row.asin ?? '')
        const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
        const campaign_name = `${asin} - SP - AUTO - ${GROUP_LABEL[group]}${intentSuffix}`

        return {
          _id:             String(row._id),
          campaign_name,
          asin,
          target_group:    group,
          bid:             newBid,
          budget:          newBudget,
          intent,
          start_date:      String(row.start_date ?? ''),
          dynamic_bidding: (row.dynamic_bidding as any) ?? 'AUTO_FOR_SALES',
          _status:         prev?._status ?? 'idle',
          _error:          prev?._error,
        }
      })
    )
  }

  const hasRows     = autoBulkRows.length > 0
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
            One row per ASIN — each row enables exactly one targeting group
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
                {autoBulkRows.length} campaign{autoBulkRows.length !== 1 ? 's' : ''}
              </span>
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
              onClick={() => { clearAutoBulkRows(); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          <CampaignDataTable
            data={tableData}
            columns={columns}
            groupByFields={['_id']}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={20}
          />

          {summary && (
            <SummaryBanner
              summary={summary}
              onRetry={retryFailed}
              onDismiss={clearSummary}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => submitAll()}
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