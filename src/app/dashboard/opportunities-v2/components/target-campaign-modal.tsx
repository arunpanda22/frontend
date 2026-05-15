'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  campaignApi,
  useCampaignDefaults,
  type KeywordTargetingPayload,
  type ProductTargetingPayload,
} from '@/lib/hooks/campaignCreationHooks'
import { buildSKCampaignName, buildPTCampaignName } from '@/lib/store/campaignCreationStore'
import {
  CampaignDataTable,
  type CampaignColumnDefinition,
  type CampaignTableData,
} from '@/components/dashboard/table/campaign-data-table'
import type { KeywordRecommendation } from '@/lib/hooks/use-opportunities'

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_INTENT       = 'api'
const TARGET_TOS          = 100
const TARGET_DYNAMIC_BID  = 'LEGACY_FOR_SALES' as const

type KWMatchType  = 'EXACT' | 'BROAD' | 'PHRASE'
type PTMatchType  = 'EXACT' | 'EXPANDED'
type RowStatus    = 'idle' | 'loading' | 'success' | 'error'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface TargetKWRow {
  index:   number               // original index in keywords array
  keyword: KeywordRecommendation
}

export interface TargetASINRow {
  index:    number              // original index in ASIN section
  asin:     string              // the target ASIN
  category: string              // which section: "top" | "low" | "fvt"
}

export type TargetCampaignMode = 'keyword' | 'product'

interface TargetCampaignModalProps {
  asin:         string
  mode:         TargetCampaignMode
  intent?:      string 
  kwRows?:      TargetKWRow[]
  asinRows?:    TargetASINRow[]
  onClose:      () => void
  onRowSuccess: (index: number, category: string | null, campaignId: string) => void
  onRowError:   (index: number, category: string | null, error: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function calcBudget(bid: number, minBudget: number): number {
  return bid > 0 ? Math.max(minBudget, bid * 15) : minBudget
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

// ─── Match type button sets ───────────────────────────────────────────────────

const KW_MATCH_OPTS: { value: KWMatchType; label: string }[] = [
  { value: 'EXACT',  label: 'Exact'  },
  { value: 'BROAD',  label: 'Broad'  },
  { value: 'PHRASE', label: 'Phrase' },
]

const PT_MATCH_OPTS: { value: PTMatchType; label: string }[] = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

// ─── Single Keyword Form ──────────────────────────────────────────────────────

interface SingleKWFormProps {
  asin:           string
  rowIndex:       number
  intent:         string
  keyword:        KeywordRecommendation
  minBid:         number
  minBudget:      number
  currencySymbol: string
  onRowSuccess:   (index: number, category: string | null, campaignId: string) => void
  onRowError:     (index: number, category: string | null, error: string) => void
}

const SingleKWForm: React.FC<SingleKWFormProps> = ({
  asin,
  rowIndex,
  intent,
  keyword,
  minBid,
  minBudget,
  currencySymbol,
  onRowSuccess,
  onRowError,
}) => {
  const tomorrow = getTomorrow()

  const [campaignName, setCampaignName] = useState(() =>
    buildSKCampaignName(asin, keyword.keyword, 'individual', intent)
  )
  const [matchType,    setMatchType]    = useState<KWMatchType>(
    // pre-select the match type from the recommendation if valid
    (['EXACT', 'BROAD', 'PHRASE'].includes(keyword.matchType?.toUpperCase())
      ? keyword.matchType.toUpperCase()
      : 'EXACT') as KWMatchType
  )
  const [bid,          setBid]          = useState(() =>
    keyword.bid > 0 ? keyword.bid.toFixed(2) : ''
  )
  const [budgetManual, setBudgetManual] = useState('')
  const [startDate,    setStartDate]    = useState(tomorrow)
  const [status,       setStatus]       = useState<RowStatus>('idle')
  const [resultMsg,    setResultMsg]    = useState<{ ok: boolean; text: string } | null>(null)

  const bidNum          = parseFloat(bid) || 0
  const autoBudgetVal   = calcBudget(bidNum, minBudget)
  const effectiveBudget = budgetManual ? parseFloat(budgetManual) || autoBudgetVal : autoBudgetVal
  const canSubmit       = status !== 'loading' && status !== 'success' && bidNum >= minBid

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStatus('loading')
    setResultMsg(null)

    const payload: KeywordTargetingPayload = {
      campaign_name:   campaignName,
      budget:          effectiveBudget,
      TOS_bidding:     TARGET_TOS,
      ROS_bidding:     0,
      PP_bidding:      0,
      AB_bidding:      0,
      dynamic_bidding: TARGET_DYNAMIC_BID,
      default_bid:     minBid,
      start_date:      startDate,
      asins:           [asin],
      keywords:        [{ text: keyword.keyword, match_type: matchType, bid: bidNum }],
    }

    try {
      const res = await campaignApi.createKeywordTargeting(payload)
      setStatus('success')
      setResultMsg({ ok: true, text: `Campaign created · ${res.data.campaign_id}` })
      onRowSuccess(rowIndex, null, res.data.campaign_id)
    } catch (err: any) {
      const body = err?.response?.data
      const msg  = body?.errors?.[0]?.message ?? body?.error ?? err?.message ?? 'Unknown error'
      setStatus('error')
      setResultMsg({ ok: false, text: msg })
      onRowError(rowIndex, null, msg)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Campaign name">
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="ASIN">
          <input
            readOnly
            value={asin}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-mono text-gray-400 cursor-not-allowed"
          />
        </Field>
        <Field label="Keyword">
          <input
            readOnly
            value={keyword.keyword}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] text-gray-400 cursor-not-allowed"
          />
        </Field>
      </div>

      <Field label="Match type">
        <div className="flex gap-2">
          {KW_MATCH_OPTS.map((opt) => (
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
          {keyword.suggestedBid_rangeStart > 0 && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Suggested: {currencySymbol}{keyword.suggestedBid_rangeStart.toFixed(2)} – {currencySymbol}{keyword.suggestedBid_rangeEnd.toFixed(2)}
            </p>
          )}
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

      <Field label="Start date">
        <input
          type="date"
          value={startDate}
          min={tomorrow}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
        />
      </Field>

      <div className="flex items-center gap-5 flex-wrap rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
        <FixedChip label="Intent" value={intent} />
        <FixedChip label="TOS"      value="100%" />
        <FixedChip label="Strategy" value="Legacy for Sales" />
      </div>

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

// ─── Single Product Form ──────────────────────────────────────────────────────

interface SinglePTFormProps {
  asin:           string
  rowIndex:       number
  targetAsin:     string
  category:       string
  minBid:         number
  minBudget:      number
  currencySymbol: string
  intent:         string 
  onRowSuccess:   (index: number, category: string | null, campaignId: string) => void
  onRowError:     (index: number, category: string | null, error: string) => void
}

const SinglePTForm: React.FC<SinglePTFormProps> = ({
  asin,
  rowIndex,
  targetAsin,
  category,
  minBid,
  minBudget,
  currencySymbol,
  intent,
  onRowSuccess,
  onRowError,
}) => {
  const tomorrow = getTomorrow()

  const [campaignName, setCampaignName] = useState(() =>
    buildPTCampaignName(asin, targetAsin, 'individual', intent)
  )
  const [matchType,    setMatchType]    = useState<PTMatchType>('EXACT')
  const [bid,          setBid]          = useState('')
  const [budgetManual, setBudgetManual] = useState('')
  const [startDate,    setStartDate]    = useState(tomorrow)
  const [status,       setStatus]       = useState<RowStatus>('idle')
  const [resultMsg,    setResultMsg]    = useState<{ ok: boolean; text: string } | null>(null)

  const bidNum          = parseFloat(bid) || 0
  const autoBudgetVal   = calcBudget(bidNum, minBudget)
  const effectiveBudget = budgetManual ? parseFloat(budgetManual) || autoBudgetVal : autoBudgetVal
  const canSubmit       = status !== 'loading' && status !== 'success' && bidNum >= minBid

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStatus('loading')
    setResultMsg(null)

    const payload: ProductTargetingPayload = {
      campaign_name:   campaignName,
      budget:          effectiveBudget,
      TOS_bidding:     TARGET_TOS,
      ROS_bidding:     0,
      PP_bidding:      0,
      AB_bidding:      0,
      dynamic_bidding: TARGET_DYNAMIC_BID,
      default_bid:     minBid,
      start_date:      startDate,
      asins:           [asin],
      targets:         [{ asin: targetAsin, match_type: matchType, bid: bidNum }],
    }

    try {
      const res = await campaignApi.createProductTargeting(payload)
      setStatus('success')
      setResultMsg({ ok: true, text: `Campaign created · ${res.data.campaign_id}` })
      onRowSuccess(rowIndex, category, res.data.campaign_id)
    } catch (err: any) {
      const body = err?.response?.data
      const msg  = body?.errors?.[0]?.message ?? body?.error ?? err?.message ?? 'Unknown error'
      setStatus('error')
      setResultMsg({ ok: false, text: msg })
      onRowError(rowIndex, category, msg)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Campaign name">
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="ASIN (advertised)">
          <input
            readOnly
            value={asin}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-mono text-gray-400 cursor-not-allowed"
          />
        </Field>
        <Field label="Target ASIN">
          <input
            readOnly
            value={targetAsin}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] font-mono text-gray-400 cursor-not-allowed"
          />
        </Field>
      </div>

      <Field label="Match type">
        <div className="flex gap-2">
          {PT_MATCH_OPTS.map((opt) => (
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

      <Field label="Start date">
        <input
          type="date"
          value={startDate}
          min={tomorrow}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
        />
      </Field>

      <div className="flex items-center gap-5 flex-wrap rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
        <FixedChip label="Intent" value={intent} />
        <FixedChip label="TOS"      value="100%" />
        <FixedChip label="Strategy" value="Legacy for Sales" />
      </div>

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

// ─── Bulk row types ───────────────────────────────────────────────────────────

interface BulkKWTableRow extends CampaignTableData {
  _id:            string
  campaign_name:  string
  keyword:        string
  match_type:     string
  bid:            number
  budget:         number
  start_date:     string
  _statusLabel:   string
  _status:        RowStatus
  _error?:        string
  _originalIndex: number
}

interface BulkPTTableRow extends CampaignTableData {
  _id:            string
  campaign_name:  string
  target_asin:    string
  match_type:     string
  bid:            number
  budget:         number
  start_date:     string
  _statusLabel:   string
  _status:        RowStatus
  _error?:        string
  _originalIndex: number
  _category:      string
}

function toStatusLabel(status: RowStatus, error?: string): string {
  switch (status) {
    case 'loading': return '⏳ Creating…'
    case 'success': return '✓ Created'
    case 'error':   return `✗ ${error ?? 'Error'}`
    default:        return ''
  }
}

// ─── Bulk Keyword Table ───────────────────────────────────────────────────────

interface BulkKWTableProps {
  asin:           string
  rows:           TargetKWRow[]
  minBid:         number
  minBudget:      number
  currencySymbol: string
  intent:         string
  onRowSuccess:   (index: number, category: string | null, campaignId: string) => void
  onRowError:     (index: number, category: string | null, error: string) => void
}

function initBulkKWRows(asin: string, rows: TargetKWRow[], minBudget: number, intent: string): BulkKWTableRow[] {
  const tomorrow = getTomorrow()
  return rows.map((r) => {
    const bid = r.keyword.bid > 0 ? r.keyword.bid : 0
    return {
      _id:            `${r.keyword.keyword}__${r.index}`,
      campaign_name:  buildSKCampaignName(asin, r.keyword.keyword, 'individual', intent),
      keyword:        r.keyword.keyword,
      match_type:     (['EXACT', 'BROAD', 'PHRASE'].includes(r.keyword.matchType?.toUpperCase())
                        ? r.keyword.matchType.toUpperCase()
                        : 'EXACT'),
      bid,
      budget:         calcBudget(bid, minBudget),
      start_date:     tomorrow,
      _statusLabel:   '',
      _status:        'idle',
      _originalIndex: r.index,
    }
  })
}

const BulkKWTable: React.FC<BulkKWTableProps> = ({
  asin,
  rows,
  minBid,
  minBudget,
  currencySymbol,
  intent,
  onRowSuccess,
  onRowError,
}) => {
  const [tableRows,    setTableRows]    = useState<BulkKWTableRow[]>(() => initBulkKWRows(asin, rows, minBudget, intent))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<{ total: number; success: number; failed: number } | null>(null)

  const columns = useMemo<CampaignColumnDefinition[]>(() => [
    {
      field:      'campaign_name',
      headerName: 'Campaign name',
      type:       'text',
      editable:   true,
      width:      280,
      minWidth:   200,
    },
    {
      field:      'keyword',
      headerName: 'Keyword',
      type:       'text',
      editable:   false,
      width:      200,
      minWidth:   140,
    },
    {
      field:      'match_type',
      headerName: 'Match type',
      type:       'dropdown',
      editable:   true,
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
      width:      100,
      minWidth:   80,
    },
    {
      field:      'budget',
      headerName: `Budget (${currencySymbol})`,
      type:       'number',
      editable:   true,
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

  const handleTableChange = useCallback((updated: CampaignTableData[]) => {
    setTableRows((prev) =>
      updated.map((row) => {
        const existing = prev.find((r) => r._id === row._id)
        const newBid   = Number(row.bid) || 0
        const bidChanged = existing && newBid !== existing.bid
        const newBudget  = bidChanged ? calcBudget(newBid, minBudget) : Number(row.budget) || minBudget
        return {
          ...existing!,
          campaign_name: String(row.campaign_name ?? existing?.campaign_name ?? ''),
          match_type:    String(row.match_type ?? 'EXACT'),
          bid:           newBid,
          budget:        newBudget,
          start_date:    String(row.start_date ?? existing?.start_date ?? getTomorrow()),
        }
      })
    )
  }, [minBudget])

  const handleSubmitAll = async () => {
    const pending = tableRows.filter((r) => r._status !== 'success')
    if (!pending.length) return

    setIsSubmitting(true)
    setSummary(null)
    let successes = 0, failures = 0

    for (const row of pending) {
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
        TOS_bidding:     TARGET_TOS,
        ROS_bidding:     0,
        PP_bidding:      0,
        AB_bidding:      0,
        dynamic_bidding: TARGET_DYNAMIC_BID,
        default_bid:     minBid,
        start_date:      row.start_date,
        asins:           [asin],
        keywords:        [{ text: row.keyword, match_type: row.match_type as KWMatchType, bid: row.bid }],
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
        onRowSuccess(row._originalIndex, null, res.data.campaign_id)
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
        onRowError(row._originalIndex, null, msg)
        failures++
      }
    }

    setSummary({ total: pending.length, success: successes, failed: failures })
    setIsSubmitting(false)
  }

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
  const pendingCount  = tableRows.filter((r) => r._status === 'idle').length
  const successCount  = tableRows.filter((r) => r._status === 'success').length
  const failedCount   = tableRows.filter((r) => r._status === 'error').length
  const allBidsFilled = tableRows.every((r) => r.bid >= minBid)
  const canSubmit     = pendingCount > 0 && !isSubmitting && allBidsFilled

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5 flex-wrap rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
        <FixedChip label="ASIN"     value={asin} />
        <FixedChip label="Intent"   value="api"  />
        <FixedChip label="TOS"      value="100%" />
        <FixedChip label="Strategy" value="Legacy for Sales" />
      </div>

      {!allBidsFilled && (
        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Enter a bid ≥ {currencySymbol}{minBid.toFixed(2)} for every row before submitting
        </p>
      )}

      <CampaignDataTable
        data={tableData}
        columns={columns}
        groupByFields={['_id']}
        onDataChange={handleTableChange}
        showCheckboxColumn={false}
        showDeleteOption={false}
        rowsPerPage={20}
      />

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

// ─── Bulk Product Targeting Table ─────────────────────────────────────────────

interface BulkPTTableProps {
  asin:           string
  rows:           TargetASINRow[]
  minBid:         number
  minBudget:      number
  currencySymbol: string
  intent:         string
  onRowSuccess:   (index: number, category: string | null, campaignId: string) => void
  onRowError:     (index: number, category: string | null, error: string) => void
}

function initBulkPTRows(asin: string, rows: TargetASINRow[], minBudget: number, intent: string): BulkPTTableRow[] {
  const tomorrow = getTomorrow()
  return rows.map((r) => ({
    _id:            `${r.asin}__${r.index}__${r.category}`,
    campaign_name:  buildPTCampaignName(asin, r.asin, 'individual', intent),
    target_asin:    r.asin,
    match_type:     'EXACT',
    bid:            0,
    budget:         minBudget,
    start_date:     tomorrow,
    _statusLabel:   '',
    _status:        'idle',
    _originalIndex: r.index,
    _category:      r.category,
  }))
}

const BulkPTTable: React.FC<BulkPTTableProps> = ({
  asin,
  rows,
  minBid,
  minBudget,
  currencySymbol,
  intent,
  onRowSuccess,
  onRowError,
}) => {
  const [tableRows,    setTableRows]    = useState<BulkPTTableRow[]>(() => initBulkPTRows(asin, rows, minBudget, intent))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary,      setSummary]      = useState<{ total: number; success: number; failed: number } | null>(null)

  const columns = useMemo<CampaignColumnDefinition[]>(() => [
    {
      field:      'campaign_name',
      headerName: 'Campaign name',
      type:       'text',
      editable:   true,
      width:      280,
      minWidth:   200,
    },
    {
      field:      'target_asin',
      headerName: 'Target ASIN',
      type:       'text',
      editable:   false,
      width:      160,
      minWidth:   120,
    },
    {
      field:      'match_type',
      headerName: 'Match type',
      type:       'dropdown',
      editable:   true,
      width:      120,
      options:    [
        { value: 'EXACT',    label: 'Exact'    },
        { value: 'EXPANDED', label: 'Expanded' },
      ],
    },
    {
      field:      'bid',
      headerName: `Bid (${currencySymbol})`,
      type:       'number',
      editable:   true,
      width:      100,
      minWidth:   80,
    },
    {
      field:      'budget',
      headerName: `Budget (${currencySymbol})`,
      type:       'number',
      editable:   true,
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

  const handleTableChange = useCallback((updated: CampaignTableData[]) => {
    setTableRows((prev) =>
      updated.map((row) => {
        const existing = prev.find((r) => r._id === row._id)
        const newBid   = Number(row.bid) || 0
        const bidChanged = existing && newBid !== existing.bid
        const newBudget  = bidChanged ? calcBudget(newBid, minBudget) : Number(row.budget) || minBudget
        return {
          ...existing!,
          campaign_name: String(row.campaign_name ?? existing?.campaign_name ?? ''),
          match_type:    String(row.match_type ?? 'EXACT'),
          bid:           newBid,
          budget:        newBudget,
          start_date:    String(row.start_date ?? existing?.start_date ?? getTomorrow()),
        }
      })
    )
  }, [minBudget])

  const handleSubmitAll = async () => {
    const pending = tableRows.filter((r) => r._status !== 'success')
    if (!pending.length) return

    setIsSubmitting(true)
    setSummary(null)
    let successes = 0, failures = 0

    for (const row of pending) {
      setTableRows((prev) =>
        prev.map((r) =>
          r._id === row._id
            ? { ...r, _status: 'loading', _statusLabel: toStatusLabel('loading') }
            : r
        )
      )

      const payload: ProductTargetingPayload = {
        campaign_name:   row.campaign_name,
        budget:          row.budget,
        TOS_bidding:     TARGET_TOS,
        ROS_bidding:     0,
        PP_bidding:      0,
        AB_bidding:      0,
        dynamic_bidding: TARGET_DYNAMIC_BID,
        default_bid:     minBid,
        start_date:      row.start_date,
        asins:           [asin],
        targets:         [{ asin: row.target_asin, match_type: row.match_type as PTMatchType, bid: row.bid }],
      }

      try {
        const res = await campaignApi.createProductTargeting(payload)
        setTableRows((prev) =>
          prev.map((r) =>
            r._id === row._id
              ? { ...r, _status: 'success', _statusLabel: toStatusLabel('success') }
              : r
          )
        )
        onRowSuccess(row._originalIndex, row._category, res.data.campaign_id)
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
        onRowError(row._originalIndex, row._category, msg)
        failures++
      }
    }

    setSummary({ total: pending.length, success: successes, failed: failures })
    setIsSubmitting(false)
  }

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
  const pendingCount  = tableRows.filter((r) => r._status === 'idle').length
  const successCount  = tableRows.filter((r) => r._status === 'success').length
  const failedCount   = tableRows.filter((r) => r._status === 'error').length
  const allBidsFilled = tableRows.every((r) => r.bid >= minBid)
  const canSubmit     = pendingCount > 0 && !isSubmitting && allBidsFilled

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5 flex-wrap rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
        <FixedChip label="ASIN"     value={asin} />
        <FixedChip label="Intent" value={intent} />
        <FixedChip label="TOS"      value="100%" />
        <FixedChip label="Strategy" value="Legacy for Sales" />
      </div>

      {!allBidsFilled && (
        <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Enter a bid ≥ {currencySymbol}{minBid.toFixed(2)} for every row before submitting
        </p>
      )}

      <CampaignDataTable
        data={tableData}
        columns={columns}
        groupByFields={['_id']}
        onDataChange={handleTableChange}
        showCheckboxColumn={false}
        showDeleteOption={false}
        rowsPerPage={20}
      />

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

export const TargetCampaignModal: React.FC<TargetCampaignModalProps> = ({
  asin,
  mode,
  intent = 'api', 
  kwRows,
  asinRows,
  onClose,
  onRowSuccess,
  onRowError,
}) => {
  const isBulk = mode === 'keyword'
    ? (kwRows?.length ?? 0) > 1
    : (asinRows?.length ?? 0) > 1

  const { minBid, minBudget, currencySymbol } = useCampaignDefaults()

  const modeLabel = mode === 'keyword' ? 'Keyword' : 'Product'
  const count     = mode === 'keyword' ? kwRows?.length : asinRows?.length

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
              {isBulk ? `Create ${count} ${modeLabel} Campaigns` : `Create ${modeLabel} Campaign`}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isBulk
                ? `${count} ${mode === 'keyword' ? 'keywords' : 'target ASINs'} · ASIN ${asin}`
                : `${modeLabel} targeting · ${asin}`}
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
          {mode === 'keyword' ? (
            isBulk ? (
              <BulkKWTable
                asin={asin}
                rows={kwRows!}
                minBid={minBid}
                minBudget={minBudget}
                currencySymbol={currencySymbol}
                intent={intent}
                onRowSuccess={onRowSuccess}
                onRowError={onRowError}
              />
            ) : (
              <SingleKWForm
                asin={asin}
                rowIndex={kwRows![0].index}
                keyword={kwRows![0].keyword}
                minBid={minBid}
                minBudget={minBudget}
                currencySymbol={currencySymbol}
                intent={intent}
                onRowSuccess={onRowSuccess}
                onRowError={onRowError}
              />
            )
          ) : (
            isBulk ? (
              <BulkPTTable
                asin={asin}
                rows={asinRows!}
                minBid={minBid}
                minBudget={minBudget}
                currencySymbol={currencySymbol}
                intent={intent}
                onRowSuccess={onRowSuccess}
                onRowError={onRowError}
              />
            ) : (
              <SinglePTForm
                asin={asin}
                rowIndex={asinRows![0].index}
                targetAsin={asinRows![0].asin}
                category={asinRows![0].category}
                minBid={minBid}
                minBudget={minBudget}
                currencySymbol={currencySymbol}
                intent={intent}
                onRowSuccess={onRowSuccess}
                onRowError={onRowError}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}