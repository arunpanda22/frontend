'use client'

import { useState } from 'react'
import { Box, Boxes } from 'lucide-react'
import {
  Input,
  NumberInput,
  Select,
  DatePicker,
  SectionCard,
  BiddingAdjustments,
  SubmitButton,
  ResultBanner,
} from '../../shared/FormFields'
import { useCampaignOperations } from '@/lib/hooks/campaignCreationHooks'
import type { AutoState } from '@/lib/hooks/campaignCreationHooks'
import { isValidAsin } from '@/lib/utils/asinValidation'
import { useCampaignDefaults } from '@/lib/hooks/campaignCreationHooks'
import { AsinsInput } from '../multi-asin/AsinsInput'

// ── Constants ─────────────────────────────────────────────────────────────────

const DYNAMIC_BIDDING_OPTIONS = [
  { value: 'AUTO_FOR_SALES',   label: 'Auto for Sales'   },
  { value: 'LEGACY_FOR_SALES', label: 'Legacy for Sales' },
  { value: 'MANUAL',           label: 'Manual'           },
]

const today = new Date().toISOString().split('T')[0]

// ── Types ─────────────────────────────────────────────────────────────────────

type AsinVariant    = 'single' | 'multi'
type DynamicBidding = 'AUTO_FOR_SALES' | 'LEGACY_FOR_SALES' | 'MANUAL'

interface MatchGroup {
  key:      string
  label:    string
  sublabel: string
  state:    AutoState
  bid:      number | string
}

interface FormState {
  asin:            string          // single mode
  theme:           string
  intent:          string          // multi mode
  budget:          number | string
  TOS_bidding:     number
  ROS_bidding:     number
  PP_bidding:      number
  AB_bidding:      number
  dynamic_bidding: DynamicBidding
  start_date:      string
}

type FormErrors = Partial<Record<keyof FormState | 'asins' | 'matchGroups', string>>

const DEFAULT_GROUPS: MatchGroup[] = [
  {
    key:      'close_match',
    label:    'Close Match',
    sublabel: 'Searches closely related to your product',
    state:    'ENABLED',
    bid:      '',
  },
  {
    key:      'loose_match',
    label:    'Loose Match',
    sublabel: 'Searches loosely related to your product',
    state:    'ENABLED',
    bid:      '',
  },
  {
    key:      'substitutes',
    label:    'Substitutes',
    sublabel: 'Similar products customers might buy instead',
    state:    'ENABLED',
    bid:      '',
  },
  {
    key:      'complements',
    label:    'Complements',
    sublabel: 'Products customers buy alongside yours',
    state:    'PAUSED',
    bid:      '',
  },
]

const defaultForm: FormState = {
  theme:           '',
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

// ── Campaign name builder ─────────────────────────────────────────────────────

function buildCampaignName(
  variant:  AsinVariant,
  asin:     string,
  asins:    string[],
  theme:    string,
  intent:   string,
  groups:   MatchGroup[],
): string {
  const enabledGroups = groups.filter((g) => g.state === 'ENABLED')
  const suffix =
    enabledGroups.length === 0 ? 'AUTO' :
    enabledGroups.length === 1 ? `AUTO - ${enabledGroups[0].key}` :
    'AUTO - multi-state'
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''

  if (variant === 'single') {
    if (!asin.trim()) return ''
    const label = theme.trim() || asin.trim()
    return `${label} - SP - ${suffix}${intentSuffix}`
  }

  const filledAsins = asins.filter((a) => a.trim())
  if (filledAsins.length === 0) return ''
  const label = filledAsins.length > 1
    ? (theme.trim() || '{theme}')
    : filledAsins[0]
  return `${label} - SP - ${suffix}${intentSuffix}`
}

// ── Variant toggle ─────────────────────────────────────────────────────────────

function VariantToggle({
  variant,
  onChange,
}: {
  variant:  AsinVariant
  onChange: (v: AsinVariant) => void
}) {
  return (
    <div className="flex gap-1.5">
      {([
        { value: 'single' as AsinVariant, label: 'Single ASIN', sublabel: '1 product',   icon: Box   },
        { value: 'multi'  as AsinVariant, label: 'Multi ASIN',  sublabel: '2+ products', icon: Boxes },
      ] as const).map((opt) => {
        const Icon     = opt.icon
        const isActive = variant === opt.value
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

// ── Match Groups table ────────────────────────────────────────────────────────

function MatchGroupsTable({
  groups,
  onChange,
  minBid,
  error,
}: {
  groups:   MatchGroup[]
  onChange: (groups: MatchGroup[]) => void
  minBid:   number
  error?:   string
}) {
  function updateGroup(index: number, patch: Partial<MatchGroup>) {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  function toggleState(index: number) {
    const next: AutoState = groups[index].state === 'ENABLED' ? 'PAUSED' : 'ENABLED'
    updateGroup(index, {
      state: next,
      // Seed bid from minBid when enabling an empty group
      bid: next === 'ENABLED' && !groups[index].bid ? minBid : groups[index].bid,
    })
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_140px] gap-3 px-1 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Targeting Group</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">State</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bid</span>
      </div>

      {/* Rows */}
      {groups.map((group, index) => {
        const isEnabled = group.state === 'ENABLED'
        return (
          <div
            key={group.key}
            className={`
              grid grid-cols-[1fr_80px_140px] gap-3 items-center rounded-xl px-3 py-3 transition-colors
              ${isEnabled ? 'bg-white border border-slate-200' : 'bg-slate-50 border border-slate-100 opacity-60'}
            `}
          >
            {/* Label */}
            <div>
              <p className={`text-sm font-semibold ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>
                {group.label}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{group.sublabel}</p>
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => toggleState(index)}
                className={`
                  relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                  ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
                    transform transition-transform duration-200
                    ${isEnabled ? 'translate-x-4' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Bid */}
            <input
              type="number"
              value={group.bid}
              onChange={(e) => updateGroup(index, { bid: e.target.value })}
              disabled={!isEnabled}
              placeholder={isEnabled ? String(minBid) : '—'}
              min={minBid}
              step={minBid}
              className={`
                h-9 w-full rounded-lg border px-3 text-[13px] transition
                focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
                ${isEnabled
                  ? 'border-slate-200 bg-white text-slate-700 placeholder:text-slate-300'
                  : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'}
              `}
            />
          </div>
        )
      })}

      {error && <p className="text-xs text-red-500 px-1 pt-1">{error}</p>}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutoTargetingForm({
  variant,
  onVariantChange,
}: {
  variant:          AsinVariant
  onVariantChange:  (v: AsinVariant) => void
}) {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createAutoTargetingCampaign, isAutoLoading, autoResult } = useCampaignOperations()

  const [form,   setForm]   = useState<FormState>(() => ({ ...defaultForm, budget: minBudget }))
  const [asins,  setAsins]  = useState<string[]>(['', ''])
  const [groups, setGroups] = useState<MatchGroup[]>(
    DEFAULT_GROUPS.map((g) => ({ ...g, bid: g.state === 'ENABLED' ? minBid : '' }))
  )
  // Auto-update budget when any group bid changes
  function updateGroupsAndBudget(updated: MatchGroup[]) {
    setGroups(updated)
    const bids = updated.filter((g) => g.state === 'ENABLED').map((g) => Number(g.bid)).filter((b) => b > 0)
    if (bids.length > 0) {
      const rec = recommendedBudget(bids)
      setForm((f) => ({ ...f, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
    }
  }
  const [errors, setErrors] = useState<FormErrors>({})

  const filledAsins = asins.filter((a) => a.trim())
  const isMulti     = variant === 'multi'

  const campaignName = buildCampaignName(variant, form.asin, asins, form.theme, form.intent, groups)

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}

    if (isMulti) {
      if (filledAsins.length < 2)    e.asins = 'At least two ASINs are required'
      if (!form.theme.trim())        e.theme = 'Theme is required for multi-ASIN campaigns'
    } else {
      if (!form.asin.trim())              e.asin = 'Required'
      else if (!isValidAsin(form.asin))   e.asin = 'Invalid ASIN — must be 10 characters starting with B'
    }

    if (!form.budget)                e.budget      = 'Required'
    if (!form.start_date)            e.start_date  = 'Required'

    const enabledGroups = groups.filter((g) => g.state === 'ENABLED')
    if (enabledGroups.length === 0) {
      e.matchGroups = 'At least one targeting group must be enabled'
    } else if (enabledGroups.some((g) => Number(g.bid) < minBid)) {
      e.matchGroups = `All enabled groups need a bid ≥ ${minBid}`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const getGroup = (key: string) => groups.find((g) => g.key === key)!

    const payload: Parameters<typeof createAutoTargetingCampaign>[0] = {
      campaign_name:    campaignName,
      budget:           Number(form.budget),
      TOS_bidding:      form.TOS_bidding,
      ROS_bidding:      form.ROS_bidding,
      PP_bidding:       form.PP_bidding,
      AB_bidding:       form.AB_bidding,
      dynamic_bidding:  form.dynamic_bidding,
      default_bid:      minBid,
      start_date:       form.start_date,
      asins:            isMulti ? filledAsins : [form.asin.trim()],
      close_match_state: getGroup('close_match').state,
      close_match_bid:   Number(getGroup('close_match').bid) || minBid,
      loose_match_state: getGroup('loose_match').state,
      loose_match_bid:   Number(getGroup('loose_match').bid) || minBid,
      substitutes_state: getGroup('substitutes').state,
      substitutes_bid:   Number(getGroup('substitutes').bid) || minBid,
      complements_state: getGroup('complements').state,
      complements_bid:   Number(getGroup('complements').bid) || minBid,
      ...(isMulti && form.theme.trim() ? { theme:  form.theme.trim()  } : {}),
      ...(form.intent.trim()              ? { intent: form.intent.trim() } : {}),
    }

    await createAutoTargetingCampaign(payload)
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

      {/* Advertised Products */}
      <SectionCard
        title="Advertised Products"
        description="The product(s) Amazon will automatically find targeting opportunities for"
      >
        <div className="flex flex-col gap-4">
          <VariantToggle variant={variant} onChange={(v) => { onVariantChange(v); setErrors({}) }} />

          {variant === 'single' ? (
            <div className="max-w-xs">
              <Input
                label="Advertised ASIN"
                placeholder="e.g. B009GCTZWC"
                value={form.asin}
                onChange={(e) => setField('asin', e.target.value.trim())}
                error={errors.asin}
                className="font-mono"
              />
            </div>
          ) : (
            <AsinsInput
              asins={asins}
              onChange={(updated) => {
                setAsins(updated)
                setErrors((e) => ({ ...e, asins: undefined }))
              }}
              error={errors.asins}
              minRows={2}
            />
          )}

          {/* Theme — always shown, required for multi */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <Input
                label={`Campaign Theme${variant === 'multi' ? ' *' : ' (optional)'}`}
                placeholder="e.g. Kids Toys"
                value={form.theme}
                onChange={(e) => setField('theme', e.target.value)}
                error={errors.theme}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Used as campaign name label — required for multi-ASIN
              </p>
            </div>
            <Input
              label="Intent (optional)"
              placeholder="e.g. brand, competitor, generic"
              value={form.intent}
              onChange={(e) => setField('intent', e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Auto Targeting Groups */}
      <SectionCard
        title="Auto Targeting Groups"
        description="Toggle each group on or off and set individual bids"
      >
        <MatchGroupsTable
          groups={groups}
          onChange={(updated) => {
            updateGroupsAndBudget(updated)
            setErrors((e) => ({ ...e, matchGroups: undefined }))
          }}
          minBid={minBid}
          error={errors.matchGroups}
        />
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

      <div className="flex flex-col gap-3">
        <ResultBanner result={autoResult} />
        <div className="flex justify-end">
          <SubmitButton loading={isAutoLoading} />
        </div>
      </div>
    </form>
  )
}