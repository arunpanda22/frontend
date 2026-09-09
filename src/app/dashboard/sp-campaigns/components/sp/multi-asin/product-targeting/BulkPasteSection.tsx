'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ClipboardPaste, Trash2, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { useCampaignCreationStore } from '@/lib/store/campaignCreationStore'
import { useBulkMultiAsinPTSubmit, type MultiAsinPTMode } from '@/lib/hooks/campaignCreationHooks'
import { CampaignDataTable } from '@/components/dashboard/table/campaign-data-table'
import type { CampaignColumnDefinition, CampaignTableData } from '@/components/dashboard/table/campaign-data-table'

// ── Columns ───────────────────────────────────────────────────────────────────

const MATCH_OPTIONS = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

const BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

function getColumns(mode: MultiAsinPTMode): CampaignColumnDefinition[] {
  return [
  { field: 'campaign_name',   headerName: 'Campaign Name', type: 'text',     span: true,  editable: true,  sortable: true,  width: 280, minWidth: 200, maxWidth: 480 },
  { field: 'theme',           headerName: 'Theme',         type: 'text',     span: true,  editable: true,  sortable: true,  filterable: true, width: 150, minWidth: 120 },
  { field: 'asin',            headerName: 'ASIN',          type: 'text',     span: false, editable: true,  sortable: true, filterable: true, width: 150, minWidth: 120 },
  { field: 'target_asin',     headerName: 'Target ASIN',   type: 'text',     span: mode === 'spt', editable: true,  sortable: true,  width: 160, minWidth: 130 },
  { field: 'match_type',      headerName: 'Match Type',    type: 'dropdown', span: mode === 'spt', editable: true,  width: 130, minWidth: 110, options: MATCH_OPTIONS },
  { field: 'bid',             headerName: 'Bid',           type: 'number',   span: mode === 'spt', editable: true,  sortable: true,  width: 90,  minWidth: 70  },
  { field: 'budget',          headerName: 'Budget',        type: 'number',   span: true,  editable: true,  width: 100, minWidth: 80  },
  { field: 'start_date',      headerName: 'Start Date',    type: 'date',     span: true,  editable: true,  width: 140 },
  { field: 'dynamic_bidding', headerName: 'Strategy',      type: 'dropdown', span: true,  editable: true,  width: 150, minWidth: 130, options: BIDDING_OPTIONS },
  { field: 'intent', headerName: 'Intent', type: 'text', span: true, editable: true, width: 160, minWidth: 120 },
  { field: '_statusLabel',    headerName: 'Status',        type: 'text',     span: true,  editable: false, width: 120, minWidth: 100 },
  ]
}

function toStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

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
          5 columns:&nbsp;
          <span className="font-mono font-medium text-slate-600">Theme</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">ASIN</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Target ASIN</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Bid</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Match Type</span> →&nbsp;
          <span className="font-mono font-medium text-slate-600">Intent</span>
        </p>
        <p className="text-[11px] text-slate-400 text-center">
           Match Type defaults to Exact if not provided. Intent is optional — Intent is used as a campaign name suffix
        </p>
      </div>
      <textarea
        onPaste={handlePaste}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer resize-none"
        readOnly
        aria-label="Paste area for multi-ASIN product targeting data"
      />
    </div>
  )
}

function SummaryBanner({ summary, onRetry, onDismiss }: {
  summary:   { total: number; success: number; failed: number }
  onRetry:   () => void
  onDismiss: () => void
}) {
  const allSuccess = summary.failed === 0
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3
      ${allSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-3">
        {allSuccess
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0" />}
        <p className="text-sm font-medium text-slate-700">
          {summary.success} of {summary.total} campaigns created
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

export function BulkPasteSection() {
  const {
    multiAsinPTRows,
    parsePastedMultiAsinPT,
    setMultiAsinPTRows,
    clearMultiAsinPTRows,
    renameMultiAsinPTRows,
  } = useCampaignCreationStore()

  const {
    submitAll, retryFailed, clearSummary,
    isSubmitting, summary,
    pendingCount, failedCount, successCount,
  } = useBulkMultiAsinPTSubmit()

  const [parseInfo, setParseInfo] = useState<{ added: number; skipped: number; invalidAsins: number } | null>(null)
  const [ptMode,    setPtMode]    = useState<MultiAsinPTMode>('mpt')

  const tableData: CampaignTableData[] = multiAsinPTRows.map((r) => ({
    _id:             r._id,
    campaign_name:   r.campaign_name,
    theme:           r.theme,
    asin:            r.asin,
    target_asin:     r.target_asin,
    match_type:      r.match_type,
    bid:             r.bid,
    budget:          r.budget,
    start_date:      r.start_date,
    dynamic_bidding: r.dynamic_bidding,
    intent:          r.intent,
    _statusLabel:    toStatusLabel(r._status, r._error),
  }))

  function handlePaste(text: string) {
    const result = parsePastedMultiAsinPT(text)
    renameMultiAsinPTRows(ptMode)
    setParseInfo(result)
    setTimeout(() => setParseInfo(null), 4000)
  }

  function handleTableChange(updated: CampaignTableData[]) {
    setMultiAsinPTRows(
      updated.map((row) => ({
        _id:             String(row._id),
        campaign_name:   String(row.campaign_name ?? ''),
        theme:           String(row.theme ?? ''),
        asin:            String(row.asin ?? ''),
        target_asin:     String(row.target_asin ?? ''),
        match_type:      (row.match_type as any) ?? 'EXACT',
        bid:             Number(row.bid) || 0,
        budget:          Number(row.budget) || 0,
        start_date:      String(row.start_date ?? ''),
        dynamic_bidding: (row.dynamic_bidding as any) ?? 'AUTO_FOR_SALES',
        intent:          String(row.intent ?? ''),
        _status:  multiAsinPTRows.find((r) => r._id === row._id)?._status  ?? 'idle',
        _error:   multiAsinPTRows.find((r) => r._id === row._id)?._error,
      }))
    )
  }

  const uniqueThemes          = new Set(multiAsinPTRows.map((r) => r.theme)).size
  const hasGroupableThemes    = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of multiAsinPTRows) counts.set(r.theme, (counts.get(r.theme) ?? 0) + 1)
    return [...counts.values()].some((n) => n > 1)
  }, [multiAsinPTRows])
  // Every theme must have the same target_asin in all its rows for SPT to be valid
  const hasUniformTargets = useMemo(() => {
    const groupMap = new Map<string, string[]>()
    for (const r of multiAsinPTRows) {
      if (!groupMap.has(r.theme)) groupMap.set(r.theme, [])
      groupMap.get(r.theme)!.push(r.target_asin.toLowerCase().trim())
    }
    return [...groupMap.values()].every((targets) => new Set(targets).size === 1)
  }, [multiAsinPTRows])

  const hasRows      = multiAsinPTRows.length > 0
  const canSubmit    = pendingCount > 0 && !isSubmitting

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Paste Excel Data</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Rows sharing the same Theme are grouped into one campaign
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-800">
                {uniqueThemes} campaign{uniqueThemes !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{multiAsinPTRows.length} target{multiAsinPTRows.length !== 1 ? 's' : ''}</span>
              {successCount > 0 && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {successCount} created</span>}
              {failedCount  > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3.5 w-3.5" /> {failedCount} failed</span>}
            </div>
            <button type="button" onClick={() => { clearMultiAsinPTRows(); clearSummary() }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          {/* MPT / SPT mode toggle */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">CAMPAIGN TYPE</p>
            <div className="flex gap-2">
              {([
                { value: 'mpt' as MultiAsinPTMode, label: 'Multi Target',  sublabel: 'All targets → one campaign per theme', disabled: false },
                { value: 'spt' as MultiAsinPTMode, label: 'Single Target', sublabel: hasUniformTargets ? 'Same target across ASINs → deduplicated' : 'Not available — themes have different targets', disabled: !hasUniformTargets },
              ]).map((opt) => (
                <button key={opt.value} type="button"
                  disabled={opt.disabled}
                  onClick={() => { if (!opt.disabled) { setPtMode(opt.value); renameMultiAsinPTRows(opt.value); clearSummary() } }}
                  className={`flex flex-col rounded-xl border px-4 py-2.5 text-left transition-all duration-150
                    ${opt.disabled ? 'cursor-not-allowed opacity-40 border-slate-200 bg-slate-50'
                      : ptMode === opt.value
                        ? 'border-indigo-300 bg-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <p className={`text-xs font-semibold leading-none ${opt.disabled ? 'text-slate-400' : ptMode === opt.value ? 'text-white' : 'text-slate-700'}`}>{opt.label}</p>
                  <p className={`text-[10px] leading-none mt-0.5 ${opt.disabled ? 'text-slate-300' : ptMode === opt.value ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.sublabel}</p>
                </button>
              ))}
            </div>
          </div>

          <CampaignDataTable
            data={tableData}
            columns={getColumns(ptMode)}
            groupByFields={['theme']}
            onDataChange={handleTableChange}
            showCheckboxColumn
            showDeleteOption
            rowsPerPage={15}
          />

          {summary && <SummaryBanner summary={summary} onRetry={() => retryFailed(ptMode)} onDismiss={clearSummary} />}

          <div className="flex justify-end">
            <button type="button" onClick={() => submitAll(ptMode)} disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating campaigns…' : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}