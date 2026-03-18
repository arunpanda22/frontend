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
import type { ProductTargetingTarget } from '@/lib/hooks/campaignCreationHooks'
import { useMinBid } from '@/lib/hooks/queries/use-user-profile'
import { AsinsInput } from '../AsinsInput'

// ── Constants ─────────────────────────────────────────────────────────────────

const DYNAMIC_BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const MATCH_TYPE_OPTIONS: { value: 'EXACT' | 'EXPANDED'; label: string }[] = [
  { value: 'EXACT',    label: 'Exact'    },
  { value: 'EXPANDED', label: 'Expanded' },
]

const today = new Date().toISOString().split('T')[0]

// ── Types ─────────────────────────────────────────────────────────────────────

type DynamicBidding = 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL'

interface TargetRow extends Omit<ProductTargetingTarget, 'bid'> {
  bid: number | string
}

interface FormState {
  theme:           string
  budget:          number | string
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: DynamicBidding
  start_date:      string
}

type FormErrors = Partial<Record<keyof FormState | 'asins' | 'targets', string>>

const defaultForm: FormState = {
  theme:           '',
  budget:          '',
  TOS_bidding:     100,
  ROS_bidding:     0,
  PP_bidding:      0,
  AB_bidding:      0,
  dynamic_bidding: 'AUTO_FOR_SALES',
  start_date:      today,
}

function emptyTarget(): TargetRow {
  return { asin: '', match_type: 'EXACT', bid: '' }
}

// ── Campaign name preview ─────────────────────────────────────────────────────

function buildCampaignName(asins: string[], theme: string, targets: TargetRow[]): string {
  const filledAsins   = asins.filter((a) => a.trim())
  const filledTargets = targets.filter((t) => t.asin.trim())
  if (filledAsins.length === 0) return ''

  const label = filledAsins.length > 1
    ? (theme.trim() || '{theme}')
    : filledAsins[0]

  const suffix = filledTargets.length > 1 ? ' - MPT' : ''
  return `TOM - ${label} - SP - PT${suffix}`
}

// ── Targets table ─────────────────────────────────────────────────────────────

function TargetsTable({
  rows,
  onChange,
  error,
}: {
  rows:     TargetRow[]
  onChange: (rows: TargetRow[]) => void
  error?:   string
}) {
  function updateRow(index: number, patch: Partial<TargetRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target ASIN</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Type</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid</span>
        <span />
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
            <input
              type="text"
              value={row.asin}
              onChange={(e) => updateRow(index, { asin: e.target.value.trim() })}
              placeholder="e.g. B007OU5Y5K"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-mono text-[13px] text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
            <select
              value={row.match_type}
              onChange={(e) => updateRow(index, { match_type: e.target.value as 'EXACT' | 'EXPANDED' })}
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
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange([...rows, emptyTarget()])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add target
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IndividualForm() {
  const { minBid } = useMinBid()
  const { createProductTargetingCampaign, isProductLoading, productResult } =
    useCampaignOperations()

  const [asins,   setAsins]   = useState<string[]>(['', ''])
  const [targets, setTargets] = useState<TargetRow[]>([emptyTarget()])
  const [form,    setForm]    = useState<FormState>(defaultForm)
  const [errors,  setErrors]  = useState<FormErrors>({})

  const filledAsins = asins.filter((a) => a.trim())
  const isMulti     = filledAsins.length > 1

  const campaignName = buildCampaignName(asins, form.theme, targets)

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}

    if (filledAsins.length === 0) e.asins = 'At least one ASIN is required'
    if (!form.budget)              e.budget = 'Required'
    if (!form.start_date)          e.start_date = 'Required'
    if (isMulti && !form.theme.trim()) {
      e.theme = 'Theme is required when advertising more than one ASIN'
    }

    const filledTargets = targets.filter((t) => t.asin.trim())
    if (filledTargets.length === 0) {
      e.targets = 'At least one target ASIN is required'
    } else if (filledTargets.some((t) => Number(t.bid) < minBid)) {
      e.targets = `All targets need a bid ≥ ${minBid}`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const validTargets: ProductTargetingTarget[] = targets
      .filter((t) => t.asin.trim())
      .map((t) => ({
        asin:       t.asin.trim(),
        match_type: t.match_type,
        bid:        Number(t.bid),
      }))

    await createProductTargetingCampaign({
      campaign_name:   campaignName,
      budget:          Number(form.budget),
      TOS_bidding:     form.TOS_bidding,
      ROS_bidding:     form.ROS_bidding,
      PP_bidding:      form.PP_bidding,
      AB_bidding:      form.AB_bidding,
      dynamic_bidding: form.dynamic_bidding,
      default_bid:     minBid,
      start_date:      form.start_date,
      asins:           filledAsins,
      targets:         validTargets,
      ...(isMulti && form.theme.trim() ? { theme: form.theme.trim() } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {campaignName && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1">
            Campaign Name Preview
          </p>
          <p className="text-sm font-mono font-medium text-indigo-700">{campaignName}</p>
        </div>
      )}

      {/* Advertised ASINs */}
      <SectionCard
        title="Advertised Products"
        description="All ASINs will be advertised in the same campaign"
      >
        <div className="flex flex-col gap-4">
          <AsinsInput
            asins={asins}
            onChange={(updated) => {
              setAsins(updated)
              setErrors((e) => ({ ...e, asins: undefined }))
            }}
            error={errors.asins}
          />
          {isMulti && (
            <>
              <Input
                label="Campaign Theme"
                placeholder="e.g. Kids Toys"
                value={form.theme}
                onChange={(e) => setField('theme', e.target.value)}
                error={errors.theme}
              />
              <p className="text-[11px] text-slate-400 -mt-2">
                Theme is used as the campaign name label when multiple ASINs are grouped together
              </p>
            </>
          )}
        </div>
      </SectionCard>

      {/* Product Targets */}
      <SectionCard
        title="Product Targets"
        description="ASINs to target — each with its own match type and bid"
      >
        <TargetsTable
          rows={targets}
          onChange={(rows) => {
            setTargets(rows)
            setErrors((e) => ({ ...e, targets: undefined }))
          }}
          error={errors.targets}
        />
      </SectionCard>

      {/* Campaign Settings */}
      <SectionCard title="Campaign Settings" description="Budget, bidding strategy and schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput
            label="Daily Budget"
            prefix="£"
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

      <SectionCard
        title="Placement Bid Adjustments"
        description="Percentage increase on top of default bid"
      >
        <BiddingAdjustments
          values={form}
          onChange={(key, val) => setField(key, val)}
        />
      </SectionCard>

      <div className="flex flex-col gap-3">
        <ResultBanner result={productResult} />
        <div className="flex justify-end">
          <SubmitButton loading={isProductLoading} />
        </div>
      </div>
    </form>
  )
}