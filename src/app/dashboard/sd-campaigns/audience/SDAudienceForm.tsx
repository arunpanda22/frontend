'use client'

import { useState, useEffect } from 'react'
import {
  Input, NumberInput, DatePicker, SectionCard, SubmitButton,
} from '../../sp-campaigns/components/shared/FormFields'
import {
  AudienceTypeToggle, AudiencePicker, AudienceFetchTrigger, SDResultBanner,
  cell, type AudienceType,
} from '../shared/SDFormComponents'
import {
  useSDOperations, useSDAudienceSuggestions, useCampaignDefaults,
} from '@/lib/hooks/sdCampaignHooks'
import { isValidAsin } from '@/lib/utils/asinValidation'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name: string
  ad_group_name: string
  asin:          string
  audience_type: AudienceType
  budget:        number | string
  bid:           number | string
  start_date:    string
  intent:        string
}

type Errors = Partial<Record<keyof Form | 'audience_ids', string>>

const defaultForm = (): Form => ({
  campaign_name: '', ad_group_name: '',
  asin: '', audience_type: 'IN_MARKET',
  budget: '', bid: '',
  start_date: today, intent: '',
})

function buildName(asin: string, audienceType: AudienceType, intent: string) {
  if (!asin.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  return `${asin.trim()} - SD - ${audienceType}${intentSuffix}`
}

/** Mirrors the budget defaulting logic in parseSDRetargetLine */
function calcBudget(bid: number | string, minBudget: number): string {
  const b = parseFloat(String(bid))
  if (isNaN(b) || b <= 0) return ''
  return String(Math.max(minBudget, b * 15))
}

export function SDAudienceForm() {
  const { minBid, minBudget, currencySymbol } = useCampaignDefaults()
  const { createSDAudience, loading, result }  = useSDOperations()
  const {
    fetch: fetchSuggestions,
    loading: suggestionsLoading,
    suggestions,
    error: suggestionsError,
    clear: clearSuggestions,
  } = useSDAudienceSuggestions()

  const [form,        setForm]        = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [audienceIds, setAudienceIds] = useState<string[]>([])
  const [errors,      setErrors]      = useState<Errors>({})

  const campaignName = buildName(form.asin, form.audience_type, form.intent)

  const [budgetManuallyEdited, setBudgetManuallyEdited] = useState(false)

  // Auto-fill budget from bid unless the user has manually changed it.
  // If bid is cleared, drop the manual flag so the next bid entry auto-fills.
  useEffect(() => {
    if (!form.bid || Number(form.bid) <= 0) {
      setBudgetManuallyEdited(false)
      return
    }
    if (budgetManuallyEdited) return
    const calculated = calcBudget(form.bid, minBudget)
    setForm((f) => ({ ...f, budget: calculated || minBudget }))
  }, [form.bid, minBudget, budgetManuallyEdited])

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function handleAudienceTypeChange(v: AudienceType) {
    setField('audience_type', v)
    setAudienceIds([])
    clearSuggestions()
  }

  function handleAsinChange(v: string) {
    setField('asin', v.trim().toUpperCase())
    setAudienceIds([])
    clearSuggestions()
  }

  function handleFetch() {
    fetchSuggestions(form.asin, form.audience_type)
    setAudienceIds([])
  }

  function removeAudience(id: string) {
    setAudienceIds((ids) => ids.filter((a) => a !== id))
  }

  function validate() {
    const e: Errors = {}
    if (!form.asin.trim())            e.asin         = 'Required'
    else if (!isValidAsin(form.asin)) e.asin         = 'Invalid ASIN'
    if (!form.budget)                 e.budget       = 'Required'
    if (!form.bid)                    e.bid          = 'Required'
    if (!form.start_date)             e.start_date   = 'Required'
    if (audienceIds.length === 0)     e.audience_ids = 'Select at least one audience'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSDAudience({
      campaign_name: campaignName || undefined,
      ad_group_name: form.ad_group_name.trim() || undefined,
      asin:          form.asin.trim(),
      audience_type: form.audience_type,
      audience_ids:  audienceIds,
      budget:        Number(form.budget),
      default_bid:   minBid,
      bid:           Number(form.bid),
      start_date:    form.start_date,
    })
  }

  // Build a name→id map from suggestions so chips can show names
  const audienceNameMap = Object.fromEntries(
    (suggestions?.audiences ?? []).map((a) => [a.audienceId, a.audienceName])
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {campaignName && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1">Campaign Name Preview</p>
          <p className="text-sm font-mono font-medium text-indigo-700">{campaignName}</p>
        </div>
      )}

      {/* Audience type toggle */}
      <SectionCard title="Audience Type" description="Choose the targeting approach">
        <AudienceTypeToggle
          value={form.audience_type}
          onChange={handleAudienceTypeChange}
        />
      </SectionCard>

      {/* Advertised ASIN + fetch trigger */}
      <SectionCard
        title="Advertised Product"
        description="Enter your ASIN then fetch audiences — suggestions are based on the product's category"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 max-w-xs">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Advertised ASIN *
              </label>
              <input
                type="text"
                value={form.asin}
                onChange={(e) => handleAsinChange(e.target.value)}
                placeholder="e.g. B009GCTZWC"
                className={`${cell} font-mono`}
              />
              {errors.asin && <p className="text-xs text-red-500">{errors.asin}</p>}
            </div>
            <AudienceFetchTrigger
              asin={form.asin}
              audienceType={form.audience_type}
              loading={suggestionsLoading}
              onFetch={handleFetch}
            />
          </div>
        </div>
      </SectionCard>

      {/* Audience multi-select + selected chips */}
      <SectionCard
        title="Select Audiences"
        description="Choose the audiences to target — IDs sent directly to Amazon Ads"
      >
        <AudiencePicker
          audiences={suggestions?.audiences ?? []}
          selected={audienceIds}
          onChange={(ids) => {
            setAudienceIds(ids)
            setErrors((e) => ({ ...e, audience_ids: undefined }))
          }}
          loading={suggestionsLoading}
          error={errors.audience_ids}
          fetchError={suggestionsError}
        />

        {/* Selected audience chips */}
        {audienceIds.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {audienceIds.length} audience{audienceIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {audienceIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 pl-3 pr-2 py-1 text-xs font-medium text-indigo-700"
                >
                  <span className="max-w-[200px] truncate" title={audienceNameMap[id] ?? id}>
                    {audienceNameMap[id] ?? id}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAudience(id)}
                    className="flex-shrink-0 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                    aria-label={`Remove ${audienceNameMap[id] ?? id}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Bids & Budget */}
      <SectionCard title="Bids & Budget" description="Bidding settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput
            label="Targeting Bid *"
            prefix={currencySymbol}
            placeholder="1.50"
            value={form.bid}
            min={minBid}
            step={minBid}
            onChange={(e) => setField('bid', e.target.value)}
            error={errors.bid}
          />
          <div className="flex flex-col gap-1">
            <NumberInput
              label="Daily Budget *"
              prefix={currencySymbol}
              placeholder="100"
              value={form.budget}
              min={minBudget}
              onChange={(e) => {
                setBudgetManuallyEdited(true)
                setField('budget', e.target.value)
              }}
              error={errors.budget}
            />
            {form.bid && Number(form.bid) > 0 && (
              <div className="flex items-center gap-2">
                {/* <p className="text-[11px] text-slate-400">
                  {budgetManuallyEdited
                    ? `Auto-calculated: ${currencySymbol}${calcBudget(form.bid, minBudget)}`
                    : `Auto: max(${currencySymbol}${minBudget} min, bid × 15)`}
                </p> */}
                {budgetManuallyEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetManuallyEdited(false)
                      setField('budget', calcBudget(form.bid, minBudget) || String(minBudget))
                    }}
                    className="text-[11px] text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Campaign Settings */}
      <SectionCard title="Campaign Settings" description="Schedule and optional naming">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DatePicker label="Start Date" value={form.start_date}
            onChange={(v) => setField('start_date', v)} error={errors.start_date} />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor"
            value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3">
        <SDResultBanner result={result} />
        <div className="flex justify-end">
          <SubmitButton loading={loading} label="Create Campaign" />
        </div>
      </div>
    </form>
  )
}