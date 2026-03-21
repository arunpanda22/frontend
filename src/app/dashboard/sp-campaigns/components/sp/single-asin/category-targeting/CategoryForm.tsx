'use client'

import { useState } from 'react'
import { LayoutGrid, Tag } from 'lucide-react'
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

// ── Constants ─────────────────────────────────────────────────────────────────

const DYNAMIC_BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const EXPRESSION_TYPE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTO',   label: 'Auto'   },
]

const today = new Date().toISOString().split('T')[0]

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryMode   = 'multi' | 'single'
type DynamicBidding = 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL'
type ExpressionType = 'MANUAL' | 'AUTO'

interface FormState {
  theme:           string
  intent:          string
  asin:            string
  bid:             number | string
  expression_type: ExpressionType
  type:            string
  budget:          number | string
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: DynamicBidding
  default_bid:     number | string
  start_date:      string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const defaultForm: FormState = {
  theme:           '',
  intent:          '',
  asin:            '',
  bid:             '',
  expression_type: 'MANUAL',
  type:            'ASIN_CATEGORY_SAME_AS',
  budget:          '',
  TOS_bidding:     100,
  ROS_bidding:     0,
  PP_bidding:      0,
  AB_bidding:      0,
  dynamic_bidding: 'AUTO_FOR_SALES',
  default_bid:     0,
  start_date:      today,
}

// ── Campaign name preview ─────────────────────────────────────────────────────

function buildCampaignName(asin: string, mode: CategoryMode, theme: string, intent: string): string {
  if (!asin.trim()) return ''
  const label        = theme.trim() || asin.trim()
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const suffix = mode === 'multi' ? 'CAT - MCT' : 'CAT - SCT'
  return `${label} - SP - ${suffix}${intentSuffix}`
}

// ── Mode toggle ───────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  {
    value:    'multi'  as CategoryMode,
    label:    'Multi Category',
    sublabel: 'All categories',
    icon:     LayoutGrid,
  },
  {
    value:    'single' as CategoryMode,
    label:    'Single Category',
    sublabel: 'One category',
    icon:     Tag,
  },
] as const

function ModeToggle({
  mode,
  onChange,
}: {
  mode:     CategoryMode
  onChange: (mode: CategoryMode) => void
}) {
  return (
    <div className="flex gap-1.5">
      {MODE_OPTIONS.map((opt) => {
        const Icon     = opt.icon
        const isActive = mode === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              flex items-center gap-2 rounded-xl border px-4 py-2.5
              transition-all duration-150
              ${isActive
                ? 'border-indigo-300 bg-indigo-600 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}
            `}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <div className="text-left">
              <p className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>
                {opt.label}
              </p>
              <p className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                {opt.sublabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CategoryForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const {
    createMultiCategoryCampaign,  isMultiCatLoading,  multiCatResult,
    createSingleCategoryCampaign, isSingleCatLoading, singleCatResult,
  } = useCampaignOperations()

  const [mode,   setMode]   = useState<CategoryMode>('multi')
  const [form,   setForm]   = useState<FormState>(() => ({ ...defaultForm, budget: minBudget }))
  const [errors, setErrors] = useState<FormErrors>({})

  const isLoading    = mode === 'multi' ? isMultiCatLoading  : isSingleCatLoading
  const result       = mode === 'multi' ? multiCatResult     : singleCatResult
  const campaignName = buildCampaignName(form.asin, mode, form.theme, form.intent)

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.asin.trim())         e.asin = 'Required'
    else if (!isValidAsin(form.asin)) e.asin = 'Invalid ASIN — must be 10 characters starting with B'
    if (!form.bid)         e.bid         = 'Required'
    if (!form.budget)      e.budget      = 'Required'
    if (!form.start_date)  e.start_date  = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      campaign_name:   campaignName,
      budget:          Number(form.budget),
      TOS_bidding:     form.TOS_bidding,
      ROS_bidding:     form.ROS_bidding,
      PP_bidding:      form.PP_bidding,
      AB_bidding:      form.AB_bidding,
      dynamic_bidding: form.dynamic_bidding,
      default_bid:     Number(form.default_bid),
      start_date:      form.start_date,
      asin:            form.asin.trim(),
      ...(form.theme.trim()  ? { theme:  form.theme.trim()  } : {}),
      ...(form.intent.trim() ? { intent: form.intent.trim() } : {}),
      bid:             Number(form.bid),
      expression_type: form.expression_type,
      type:            form.type,
    }

    if (mode === 'multi') {
      await createMultiCategoryCampaign(payload)
    } else {
      await createSingleCategoryCampaign(payload)
    }
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

      {/* Targeting */}

      <SectionCard title="Campaign Naming" description="Theme groups campaigns — intent describes the targeting strategy">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Theme (optional)"
            placeholder="e.g. Kids Toys"
            value={form.theme}
            onChange={(e) => setField('theme', e.target.value)}
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
        title="Targeting"
        description="Category IDs are resolved automatically by Amazon for your ASIN"
      >
        <div className="flex flex-col gap-4">
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setErrors({}) }} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Advertised ASIN"
              placeholder="e.g. B009GCTZWC"
              value={form.asin}
              onChange={(e) => setField('asin', e.target.value.trim())}
              error={errors.asin}
              className="font-mono"
            />
            <NumberInput
              label="Category Bid"
              prefix={currencySymbol}
              placeholder="0.00"
              value={form.bid}
              min={0.02}
              step={0.01}
              onChange={(e) => {
                setField('bid', e.target.value)
                const rec = recommendedBudget([Number(e.target.value)])
                if (!form.budget || Number(form.budget) < rec) setField('budget', rec)
              }}
              error={errors.bid}
            />
            <Select
              label="Expression Type"
              options={EXPRESSION_TYPE_OPTIONS}
              value={form.expression_type}
              onChange={(e) => setField('expression_type', e.target.value as ExpressionType)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Campaign Settings */}
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
          <NumberInput
            label="Default Bid"
            prefix={currencySymbol}
            placeholder="0.00"
            value={form.default_bid}
            min={0}
            step={0.01}
            onChange={(e) => setField('default_bid', e.target.value)}
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
        <ResultBanner result={result} />
        <div className="flex justify-end">
          <SubmitButton loading={isLoading} />
        </div>
      </div>
    </form>
  )
}