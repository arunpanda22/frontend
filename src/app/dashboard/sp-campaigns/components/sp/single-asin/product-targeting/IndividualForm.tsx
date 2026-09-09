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
import { useCampaignDefaults } from '@/lib/hooks/campaignCreationHooks'
import { isValidAsin } from '@/lib/utils/asinValidation'
import type { ProductTargetingTarget } from '@/lib/hooks/campaignCreationHooks'

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

// bid is string | number while typing — converted on submit
interface TargetRow extends Omit<ProductTargetingTarget, 'bid'> {
  bid: number | string
}

interface FormState {
  campaign_name:   string
  intent:          string
  asin:            string
  budget:          number | string
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: DynamicBidding
  start_date:      string
}

type FormErrors = Partial<Record<keyof FormState | 'targets', string>>

const defaultForm: FormState = {
  campaign_name:   '',
  intent:          '',
  asin:            '',
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

// ── Targets table ─────────────────────────────────────────────────────────────

function TargetsTable({
  rows,
  onChange,
  error,
  minBid,
  currencySymbol,
}: {
  rows:     TargetRow[]
  onChange: (rows: TargetRow[]) => void
  error?:   string
  minBid: number;
  currencySymbol: string;
}) {
  function updateRow(index: number, patch: Partial<TargetRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target ASIN</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Type</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid ({currencySymbol})</span>
        <span />
      </div>

      {/* Rows */}
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
              placeholder={String(minBid)}
              min={minBid}
              step={0.01}
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

// ── Campaign name preview ─────────────────────────────────────────────────────

function buildCampaignName(asin: string, targets: TargetRow[], intent: string): string {
  const label        = asin.trim()
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const filled = targets.filter((t) => t.asin.trim())
  if (filled.length === 1) {
    const mt = filled[0].match_type.charAt(0) + filled[0].match_type.slice(1).toLowerCase()
    return `${label} - SP - PT - SPT - ${filled[0].asin.trim()} - ${mt}${intentSuffix}`
  }
  const matchTypes = new Set(filled.map((t) => t.match_type))
  const mtSuffix   = matchTypes.size === 1
    ? ` - ${[...matchTypes][0].charAt(0) + [...matchTypes][0].slice(1).toLowerCase()}`
    : ''
  return `${label} - SP - PT - MPT${mtSuffix}${intentSuffix}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IndividualForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createProductTargetingCampaign, isProductLoading, productResult } =
    useCampaignOperations()

  const [form,    setForm]    = useState<FormState>(() => ({ ...defaultForm, budget: minBudget }))
  const [targets, setTargets] = useState<TargetRow[]>([emptyTarget()])
  const [errors,  setErrors]  = useState<FormErrors>({})
  const [nameEdited, setNameEdited] = useState(false);

  const generatedName = form.asin.trim() ? buildCampaignName(form.asin, targets, form.intent) : ''
  const campaignNameDisplay = nameEdited ? form.campaign_name : generatedName;

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleCampaignNameChange(v: string) {
    setNameEdited(true);
    setField("campaign_name", v);
  }

  function handleCampaignNameBlur(v: string) {
    if (!v.trim()) {
      setNameEdited(false);
      setField("campaign_name", "");
    }
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.asin.trim())         e.asin = 'Required'
    else if (!isValidAsin(form.asin)) e.asin = 'Invalid ASIN — must be 10 characters starting with B'
    if (!form.budget)      e.budget      = 'Required'
    if (!form.start_date)  e.start_date  = 'Required'

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
      campaign_name:   campaignNameDisplay,   
      budget:          Number(form.budget),
      TOS_bidding:     form.TOS_bidding,
      ROS_bidding:     form.ROS_bidding,
      PP_bidding:      form.PP_bidding,
      AB_bidding:      form.AB_bidding,
      dynamic_bidding: form.dynamic_bidding,
      default_bid:     minBid,
      start_date:      form.start_date,
      asins:           [form.asin.trim()],
      ...(form.intent.trim() ? { intent: form.intent.trim() } : {}),
      targets:         validTargets,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1.5">
          Campaign Name
        </p>
        <input
          type="text"
          value={campaignNameDisplay}
          onChange={(e) => handleCampaignNameChange(e.target.value)}
          onBlur={(e) => handleCampaignNameBlur(e.target.value)}
          placeholder="Fill in ASIN to auto-generate…"
          className="w-full bg-transparent font-mono text-sm font-medium text-indigo-700 placeholder-indigo-300
                     border-0 border-b border-indigo-200 focus:border-indigo-400 focus:outline-none
                     pb-0.5 transition-colors"
        />
        {nameEdited && (
          <button
            type="button"
            onClick={() => {
              setNameEdited(false);
              setField("campaign_name", "");
            }}
            className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            ↺ Reset to auto-generated
          </button>
        )}
      </div>

      <SectionCard
        title="Advertised Product"
        description="The ASIN you want to advertise"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Advertised ASIN"
            placeholder="e.g. B009GCTZWC"
            value={form.asin}
            onChange={(e) => setField('asin', e.target.value.trim())}
            error={errors.asin}
            className="font-mono"
          />
          <Input
            label="Intent (optional)"
            placeholder="e.g. brand, competitor, generic"
            value={form.intent}
            onChange={(e) => setField('intent', e.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Product Targets"
        description="ASINs to target — each with its own match type and bid"
      >
        <TargetsTable
          rows={targets}
          onChange={(rows) => {
            setTargets(rows)
            setErrors((e) => ({ ...e, targets: undefined }))
            const bids = rows.filter((r) => r.asin.trim()).map((r) => Number(r.bid)).filter((b) => b > 0)
            if (bids.length > 0) {
              const rec = recommendedBudget(bids)
              setForm((f) => ({ ...f, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
            }
          }}
          error={errors.targets}
          minBid={minBid}
          currencySymbol={currencySymbol}
        />
      </SectionCard>

      <SectionCard title="Campaign Settings" description="Budget, bidding strategy and schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput
            label="Daily Budget"
            prefix={currencySymbol}
            placeholder="100"
            value={form.budget}
            min={minBudget}
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