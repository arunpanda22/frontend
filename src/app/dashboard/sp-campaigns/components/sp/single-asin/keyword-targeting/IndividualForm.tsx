'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Input,
  NumberInput,
  Select,
  DatePicker,
  SectionCard,
  BiddingAdjustments,
  SubmitButton,
  ResultBanner,
} from '../../../shared/FormFields'
import { useCampaignOperations } from '@/lib/hooks/campaignCreationHooks'
import { useMinBid } from '@/lib/hooks/queries/use-user-profile'

// ── Constants ─────────────────────────────────────────────────────────────────

const DYNAMIC_BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const MATCH_TYPE_OPTIONS = [
  { value: 'EXACT',  label: 'Exact'  },
  { value: 'BROAD',  label: 'Broad'  },
  { value: 'PHRASE', label: 'Phrase' },
]

const today = new Date().toISOString().split('T')[0]

// ── Types ─────────────────────────────────────────────────────────────────────

type DynamicBidding = 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL'
type MatchType      = 'EXACT' | 'BROAD' | 'PHRASE'

interface KeywordRow {
  text:       string
  match_type: MatchType
  bid:        number | string   // string while typing, converted on submit
}

interface FormState {
  asin:            string
  budget:          number | string
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: DynamicBidding
  start_date:      string
}

type FormErrors = Partial<Record<keyof FormState | 'keywords', string>>

const defaultForm: FormState = {
  asin:            '',
  budget:          '',
  TOS_bidding:     100,
  ROS_bidding:     0,
  PP_bidding:      0,
  AB_bidding:      0,
  dynamic_bidding: 'AUTO_FOR_SALES',
  start_date:      today,
}

function emptyKeyword(): KeywordRow {
  return { text: '', match_type: 'EXACT', bid: '' }
}

// ── Campaign name preview ─────────────────────────────────────────────────────

function buildCampaignName(asin: string, keywords: KeywordRow[]): string {
  if (!asin.trim()) return ''
  const filled = keywords.filter((k) => k.text.trim())
  if (filled.length === 0) return `TOM - ${asin.trim()} - SP - KW`
  if (filled.length === 1) return `TOM - ${asin.trim()} - SP - KW - ${filled[0].text.trim()} - SK`
  return `TOM - ${asin.trim()} - SP - KW - MK`
}

// ── Keywords table ────────────────────────────────────────────────────────────

function KeywordsTable({
  rows,
  onChange,
  error,
  minBid,
}: {
  rows:     KeywordRow[]
  onChange: (rows: KeywordRow[]) => void
  error?:   string
  minBid:   number
}) {
  function updateRow(index: number, patch: Partial<KeywordRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Keyword</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Type</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid</span>
        <span />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
            <input
              type="text"
              value={row.text}
              onChange={(e) => updateRow(index, { text: e.target.value })}
              placeholder="e.g. kids toy"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
            <select
              value={row.match_type}
              onChange={(e) => updateRow(index, { match_type: e.target.value as MatchType })}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            >
              {MATCH_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={row.bid}
              onChange={(e) => updateRow(index, { bid: e.target.value })}
              placeholder="0.00"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              disabled={rows.length === 1}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add row + error */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange([...rows, emptyKeyword()])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add keyword
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IndividualForm() {
  const { minBid } = useMinBid()
  const { createKeywordTargetingCampaign, isKeywordLoading, keywordResult } =
    useCampaignOperations()

  const [form,     setForm]     = useState<FormState>(defaultForm)
  const [keywords, setKeywords] = useState<KeywordRow[]>([emptyKeyword()])
  const [errors,   setErrors]   = useState<FormErrors>({})

  const campaignName = buildCampaignName(form.asin, keywords)

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.asin.trim()) e.asin   = 'Required'
    if (!form.budget)      e.budget = 'Required'
    if (!form.start_date)  e.start_date = 'Required'

    const filled = keywords.filter((k) => k.text.trim())
    if (filled.length === 0) {
      e.keywords = 'At least one keyword is required'
    } else if (filled.some((k) => Number(k.bid) < minBid)) {
      e.keywords = `All keywords need a bid ≥ ${minBid}`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const validKeywords = keywords
      .filter((k) => k.text.trim())
      .map((k) => ({
        text:       k.text.trim(),
        match_type: k.match_type,
        bid:        Number(k.bid),
      }))

    await createKeywordTargetingCampaign({
      budget:          Number(form.budget),
      TOS_bidding:     form.TOS_bidding,
      ROS_bidding:     form.ROS_bidding,
      PP_bidding:      form.PP_bidding,
      AB_bidding:      form.AB_bidding,
      dynamic_bidding: form.dynamic_bidding,
      default_bid:     minBid,
      start_date:      form.start_date,
      asins:           [form.asin.trim()],
      keywords:        validKeywords,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Campaign name preview */}
      {campaignName && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1">
            Campaign Name Preview
          </p>
          <p className="text-sm font-mono font-medium text-indigo-700">{campaignName}</p>
        </div>
      )}

      {/* Advertised ASIN */}
      <SectionCard title="Advertised Product" description="The ASIN you want to advertise">
        <div className="max-w-xs">
          <Input
            label="ASIN"
            placeholder="e.g. B009GCTZWC"
            value={form.asin}
            onChange={(e) => setField('asin', e.target.value.trim())}
            error={errors.asin}
            className="font-mono"
          />
        </div>
      </SectionCard>

      {/* Keywords table */}
      <SectionCard
        title="Keywords"
        description="Add one or more keywords — each with its own match type and bid"
      >
        <KeywordsTable
          rows={keywords}
          onChange={(rows) => {
            setKeywords(rows)
            setErrors((e) => ({ ...e, keywords: undefined }))
          }}
          error={errors.keywords}
          minBid={minBid}
        />
      </SectionCard>

      {/* Campaign Settings */}
      <SectionCard title="Campaign Settings" description="Budget, bidding strategy and schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput
            label="Daily Budget"
            prefix=""
            placeholder="100"
            value={form.budget}
            min={1}
            onChange={(e) => setField('budget', e.target.value)}
            error={errors.budget}
          />
          <Select
            label="Bidding Strategy"
            options={DYNAMIC_BIDDING_OPTIONS}
            value={form.dynamic_bidding}
            onChange={(e) => setField('dynamic_bidding', e.target.value as DynamicBidding)}
          />
          <DatePicker
            label="Start Date"
            value={form.start_date}
            onChange={(v) => setField('start_date', v)}
            error={errors.start_date}
          />
        </div>
      </SectionCard>

      {/* Placement Adjustments */}
      <SectionCard
        title="Placement Bid Adjustments"
        description="Percentage increase on top of default bid"
      >
        <BiddingAdjustments
          values={form}
          onChange={(key, val) => setField(key, val)}
        />
      </SectionCard>

      {/* Footer */}
      <div className="flex flex-col gap-3">
        <ResultBanner result={keywordResult} />
        <div className="flex justify-end">
          <SubmitButton loading={isKeywordLoading} />
        </div>
      </div>
    </form>
  )
}