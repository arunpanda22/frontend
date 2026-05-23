'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  campaignApi,
  useCampaignDefaults,
  type KeywordTargetingPayload,
} from '@/lib/hooks/campaignCreationHooks'
import { buildSKCampaignName } from '@/lib/store/campaignCreationStore'
import {
  CampaignDataTable,
  type CampaignColumnDefinition,
  type CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'
import type { SQPSearchQuery } from '@/lib/hooks/use-opportunities'

// ─── Constants ────────────────────────────────────────────────────────────────

const SQP_INTENT      = 'SQP'
const SQP_TOS         = 100
const SQP_DYNAMIC_BID = 'LEGACY_FOR_SALES' as const

type MatchType = 'EXACT' | 'BROAD' | 'PHRASE'
type RowStatus = 'idle' | 'loading' | 'success' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function calcBudget(bid: number, minBudget: number): number {
  return bid > 0 ? Math.max(minBudget, bid * 15) : minBudget
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface SQPCampaignRow {
  index: number         // original index in queries array — used for status callback
  query: SQPSearchQuery
}

interface SQPCampaignModalProps {
  asin:         string
  rows:         SQPCampaignRow[]   // length 1 = single form, >1 = bulk table
  onClose:      () => void
  onRowSuccess: (index: number, campaignId: string) => void
  onRowError:   (index: number, error: string) => void
}

// ─── Shared small components ──────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
)

const FixedChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-gray-400">{label}:</span>
    <span className="text-[11px] font-semibold text-gray-600">{value}</span>
  </div>
)

// ─── Single Campaign Form ─────────────────────────────────────────────────────

interface SingleFormProps {
  asin:           string
  rowIndex:       number
  query:          SQPSearchQuery
  minBid:         number
  minBudget:      number
  currencySymbol: string
  onRowSuccess:   (index: number, campaignId: string) => void
  onRowError:     (index: number, error: string) => void
}

const MATCH_OPTS: { value: MatchType; label: string }[] = [
  { value: 'EXACT',  label: 'Exact'  },
  { value: 'BROAD',  label: 'Broad'  },
  { value: 'PHRASE', label: 'Phrase' },
]

const SingleCampaignForm: React.FC<SingleFormProps> = ({
  asin,
  rowIndex,
  query,
  minBid,
  minBudget,
  currencySymbol,
  onRowSuccess,
  onRowError,
}) => {
  const tomorrow = getTomorrow()

  const [campaignName, setCampaignName] = useState(() =>
    buildSKCampaignName(asin, query.search_query, 'individual', SQP_INTENT)
  )
  const [matchType,    setMatchType]    = useState<MatchType>('PHRASE')
  const [bid,          setBid]          = useState('')
  const [budgetManual, setBudgetManual] = useState('')
  const [startDate,    setStartDate]    = useState(tomorrow)

  const [status,    setStatus]    = useState<RowStatus>('idle')
  const [resultMsg, setResultMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const bidNum         = parseFloat(bid) || 0
  const autoBudgetVal  = calcBudget(bidNum, minBudget)
  const effectiveBudget = budgetManual ? parseFloat(budgetManual) || autoBudgetVal : autoBudgetVal

  const canSubmit = status !== 'loading' && status !== 'success' && bidNum >= minBid

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStatus('loading')
    setResultMsg(null)

    const payload: KeywordTargetingPayload = {
      campaign_name:   campaignName,
      budget:          effectiveBudget,
      TOS_bidding:     SQP_TOS,
      ROS_bidding:     0,
      PP_bidding:      0,
      AB_bidding:      0,
      dynamic_bidding: SQP_DYNAMIC_BID,
      default_bid:     minBid,
      start_date:      startDate,
      asins:           [asin],
      keywords:        [{ text: query.search_query, match_type: matchType, bid: bidNum }],
    }

    try {
      const res = await campaignApi.createKeywordTargeting(payload)
      setStatus('success')
      setResultMsg({ ok: true, text: `Campaign created · ${res.data.campaign_id}` })
      onRowSuccess(rowIndex, res.data.campaign_id)
    } catch (err: any) {
      const body = err?.response?.data
      const msg  = body?.errors?.[0]?.message ?? body?.error ?? err?.message ?? 'Unknown error'
      setStatus('error')
      setResultMsg({ ok: false, text: msg })
      onRowError(rowIndex, msg)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Campaign name */}
      <Field label="Campaign name">
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
        />
      </Field>

      {/* ASIN + Keyword */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="ASIN">
          <input
            readOnly
            value={asin}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-mono text-gray-400 cursor-not-allowed"
          />
        </Field>
        <Field label="Search query (keyword)">
          <input
            readOnly
            value={query.search_query}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] text-gray-400 cursor-not-allowed"
          />
        </Field>
      </div>

      {/* Match type */}
      <Field label="Match type">
        <div className="flex gap-2">
          {MATCH_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMatchType(opt.value)}
              className={`flex-1 rounded-lg border py-2 text-[11px] font-semibold transition-colors ${
                matchType === opt.value
                  ? 'border-[#f5a623] bg-amber-50 text-[#f5a623]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Bid + Budget */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Bid (${currencySymbol})`}>
          <input
            type="number"
            value={bid}
            onChange={(e) => setBid(e.target.value)}
            min={minBid}
            step="0.01"
            placeholder={`Min ${currencySymbol}${minBid.toFixed(2)}`}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
          />
        </Field>
        <Field label={`Daily budget (${currencySymbol})`}>
          <div className="relative">
            <input
              type="number"
              value={budgetManual !== '' ? budgetManual : autoBudgetVal.toFixed(2)}
              onChange={(e) => setBudgetManual(e.target.value)}
              onFocus={() => { if (!budgetManual) setBudgetManual(autoBudgetVal.toFixed(2)) }}
              min={minBudget}
              step="0.01"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
            />
            {!budgetManual && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-gray-400 bg-white">
                auto
              </span>
            )}
          </div>
          {!budgetManual && bid && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              = max({currencySymbol}{minBudget}, {currencySymbol}{bidNum.toFixed(2)} × 15)
            </p>
          )}
        </Field>
      </div>

      {/* Start date */}
      <Field label="Start date">
        <input
          type="date"
          value={startDate}
          min={tomorrow}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
        />
      </Field>

      {/* Fixed values info strip */}
      <div className="flex items-center gap-5 flex-wrap rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
        <FixedChip label="Intent"    value="SQP" />
        <FixedChip label="TOS"       value="100%" />
        <FixedChip label="Strategy"  value="Legacy for Sales" />
      </div>

      {/* Result feedback */}
      {resultMsg && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-[12px] border ${
          resultMsg.ok
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {resultMsg.ok
            ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            : <AlertCircle  className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          }
          <span className="break-all">{resultMsg.text}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-xl bg-[#f5a623] px-6 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#e09010] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {status === 'success' ? '✓ Campaign Created' : 'Create Campaign'}
        </button>
      </div>
    </div>
  )
}

// ─── Bulk Row type (for the table inside the modal) ───────────────────────────

interface BulkRow extends CampaignTableData {
  _id:              string
  campaign_name:    string
  keyword:          string        // search_query
  match_type:       string
  bid:              number
  budget:           number
  start_date:       string
  _statusLabel:     string
  // internal — not rendered as columns
  _status:          RowStatus
  _error?:          string
  _originalIndex:   number        // maps back to SQP queries index
}

// ─── Bulk Campaign Table ──────────────────────────────────────────────────────

interface BulkTableProps {
  asin:           string
  rows:           SQPCampaignRow[]
  minBid:         number
  minBudget:      number
  currencySymbol: string
  onRowSuccess:   (index: number, campaignId: string) => void
  onRowError:     (index: number, error: string) => void
}

function toStatusLabel(status: RowStatus, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

function initBulkRows(
  asin:      string,
  rows:      SQPCampaignRow[],
  minBudget: number,
): BulkRow[] {
  const tomorrow = getTomorrow()
  return rows.map((r) => ({
    _id:            r.query.search_query + '__' + r.index,
    campaign_name:  buildSKCampaignName(asin, r.query.search_query, 'individual', SQP_INTENT),
    keyword:        r.query.search_query,
    match_type:     'PHRASE',
    bid:            0,
    budget:         minBudget,
    start_date:     tomorrow,
    _statusLabel:   '',
    _status:        'idle',
    _originalIndex: r.index,
  }))
}

const BulkCampaignTable: React.FC<BulkTableProps> = ({
  asin,
  rows,
  minBid,
  minBudget,
  currencySymbol,
  onRowSuccess,
  onRowError,
}) => {
  const [tableRows,    setTableRows]    = useState<BulkRow[]>(() => initBulkRows(asin, rows, minBudget))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<{ total: number; success: number; failed: number } | null>(null)

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = useMemo<CampaignColumnDefinition[]>(() => [
    {
      field:      'campaign_name',
      headerName: 'Campaign name',
      type:       'text',
      editable:   true,
      sortable:   false,
      width:      280,
      minWidth:   200,
    },
    {
      field:      'keyword',
      headerName: 'Keyword (search query)',
      type:       'text',
      editable:   false,
      width:      220,
      minWidth:   160,
    },
    {
      field:      'match_type',
      headerName: 'Match type',
      type:       'dropdown',
      editable:   true,
      bulkSet:    true,
      width:      120,
      options:    [
        { value: 'EXACT',  label: 'Exact'  },
        { value: 'BROAD',  label: 'Broad'  },
        { value: 'PHRASE', label: 'Phrase' },
      ],
    },
    {
      field:      'bid',
      headerName: `Bid (${currencySymbol})`,
      type:       'number',
      editable:   true,
      bulkSet:    true,
      width:      100,
      minWidth:   80,
    },
    {
      field:      'budget',
      headerName: `Budget (${currencySymbol})`,
      type:       'number',
      editable:   true,
      bulkSet:    true,
      width:      110,
      minWidth:   80,
    },
    {
      field:      'start_date',
      headerName: 'Start date',
      type:       'date',
      editable:   true,
      width:      140,
    },
    {
      field:      '_statusLabel',
      headerName: 'Status',
      type:       'text',
      editable:   false,
      width:      120,
      minWidth:   100,
    },
  ], [currencySymbol])

  // ── Table change handler — recalculate budget when bid changes ───────────────
  const handleTableChange = useCallback((updated: CampaignTableData[]) => {
    setTableRows((prev) =>
      updated.map((row) => {
        const existing = prev.find((r) => r._id === row._id)
        const newBid   = Number(row.bid) || 0
        const bidChanged = existing && newBid !== existing.bid
        const newBudget  = bidChanged
          ? calcBudget(newBid, minBudget)
          : Number(row.budget) || minBudget

        return {
          ...existing!,
          campaign_name: String(row.campaign_name ?? existing?.campaign_name ?? ''),
          match_type:    String(row.match_type    ?? 'EXACT'),
          bid:           newBid,
          budget:        newBudget,
          start_date:    String(row.start_date    ?? existing?.start_date ?? getTomorrow()),
        }
      })
    )
  }, [minBudget])

  // ── Submit all ────────────────────────────────────────────────────────────────
  const handleSubmitAll = async () => {
    const pending = tableRows.filter((r) => r._status !== 'success')
    if (!pending.length) return

    setIsSubmitting(true)
    setSummary(null)
    let successes = 0
    let failures  = 0

    for (const row of pending) {
      // Mark as loading
      setTableRows((prev) =>
        prev.map((r) =>
          r._id === row._id
            ? { ...r, _status: 'loading', _statusLabel: toStatusLabel('loading') }
            : r
        )
      )

      const payload: KeywordTargetingPayload = {
        campaign_name:   row.campaign_name,
        budget:          row.budget,
        TOS_bidding:     SQP_TOS,
        ROS_bidding:     0,
        PP_bidding:      0,
        AB_bidding:      0,
        dynamic_bidding: SQP_DYNAMIC_BID,
        default_bid:     minBid,
        start_date:      row.start_date,
        asins:           [asin],
        keywords:        [{
          text:       row.keyword,
          match_type: row.match_type as 'EXACT' | 'BROAD' | 'PHRASE',
          bid:        row.bid,
        }],
      }

      try {
        const res = await campaignApi.createKeywordTargeting(payload)
        setTableRows((prev) =>
          prev.map((r) =>
            r._id === row._id
              ? { ...r, _status: 'success', _statusLabel: toStatusLabel('success') }
              : r
          )
        )
        onRowSuccess(row._originalIndex, res.data.campaign_id)
        successes++
      } catch (err: any) {
        const body = err?.response?.data
        const msg  = body?.errors?.[0]?.message ?? body?.error ?? err?.message ?? 'Unknown error'
        setTableRows((prev) =>
          prev.map((r) =>
            r._id === row._id
              ? { ...r, _status: 'error', _error: msg, _statusLabel: toStatusLabel('error', msg) }
              : r
          )
        )
        onRowError(row._originalIndex, msg)
        failures++
      }
    }

    setSummary({ total: pending.length, success: successes, failed: failures })
    setIsSubmitting(false)
  }

  // ── Retry failed ──────────────────────────────────────────────────────────────
  const handleRetry = () => {
    setTableRows((prev) =>
      prev.map((r) =>
        r._status === 'error'
          ? { ...r, _status: 'idle', _error: undefined, _statusLabel: '' }
          : r
      )
    )
    setSummary(null)
  }

  const tableData: CampaignTableData[] = tableRows.map((r) => ({ ...r }))

  const pendingCount = tableRows.filter((r) => r._status === 'idle').length
  const successCount = tableRows.filter((r) => r._status === 'success').length
  const failedCount  = tableRows.filter((r) => r._status === 'error').length
  const allBidsFilled = tableRows.every((r) => r.bid >= minBid)
  const canSubmit    = pendingCount > 0 && !isSubmitting && allBidsFilled

  return (
    <div className="flex flex-col gap-4">

      {/* Fixed values strip */}
      <div className="flex items-center gap-5 flex-wrap rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
        <FixedChip label="ASIN"     value={asin} />
        <FixedChip label="Intent"   value="SQP"  />
        <FixedChip label="TOS"      value="100%" />
        <FixedChip label="Strategy" value="Legacy for Sales" />
      </div>

      {/* Bid hint */}
      {!allBidsFilled && (
        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Enter a bid ≥ {currencySymbol}{minBid.toFixed(2)} for every row before submitting
        </p>
      )}

      {/* Table */}
      <CampaignDataTable
        data={tableData}
        columns={columns}
        groupByFields={['_id']}
        onDataChange={handleTableChange}
        showCheckboxColumn={false}
        showDeleteOption={false}
        rowsPerPage={20}
      />

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px]">
        <span className="font-semibold text-gray-700">{tableRows.length} campaigns</span>
        {successCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> {successCount} created
          </span>
        )}
        {failedCount > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertCircle className="h-3 w-3" /> {failedCount} failed
          </span>
        )}
      </div>

      {/* Summary banner */}
      {summary && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
          summary.failed === 0
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
            {summary.failed === 0
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              : <AlertCircle  className="h-4 w-4 text-amber-500 shrink-0" />
            }
            {summary.success} of {summary.total} campaigns created
            {summary.failed > 0 && ` · ${summary.failed} failed`}
          </div>
          {summary.failed > 0 && (
            <button
              type="button"
              onClick={handleRetry}
              className="text-[11px] font-semibold text-amber-700 underline hover:no-underline"
            >
              Retry failed
            </button>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmitAll}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-xl bg-[#f5a623] px-6 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#e09010] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isSubmitting
            ? 'Creating…'
            : `Create ${pendingCount} Campaign${pendingCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const SQPCampaignModal: React.FC<SQPCampaignModalProps> = ({
  asin,
  rows,
  onClose,
  onRowSuccess,
  onRowError,
}) => {
  const isBulk = rows.length > 1
  const { minBid, minBudget, currencySymbol } = useCampaignDefaults()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] overflow-hidden ${
          isBulk ? 'max-w-5xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">
              {isBulk ? `Create ${rows.length} Campaigns` : 'Create Campaign'}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isBulk
                ? `${rows.length} SQP keywords · ASIN ${asin}`
                : `SQP opportunity · ${asin}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isBulk ? (
            <BulkCampaignTable
              asin={asin}
              rows={rows}
              minBid={minBid}
              minBudget={minBudget}
              currencySymbol={currencySymbol}
              onRowSuccess={onRowSuccess}
              onRowError={onRowError}
            />
          ) : (
            <SingleCampaignForm
              asin={asin}
              rowIndex={rows[0].index}
              query={rows[0].query}
              minBid={minBid}
              minBudget={minBudget}
              currencySymbol={currencySymbol}
              onRowSuccess={onRowSuccess}
              onRowError={onRowError}
            />
          )}
        </div>
      </div>
    </div>
  )
}