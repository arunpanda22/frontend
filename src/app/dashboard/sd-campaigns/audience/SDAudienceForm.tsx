'use client'

import { useState } from 'react'
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

export function SDAudienceForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSDAudience, loading, result }                    = useSDOperations()
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

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  // When audience type changes, clear previous suggestions + selections
  function handleAudienceTypeChange(v: AudienceType) {
    setField('audience_type', v)
    setAudienceIds([])
    clearSuggestions()
  }

  // When ASIN changes, clear previous suggestions + selections
  function handleAsinChange(v: string) {
    setField('asin', v.trim().toUpperCase())
    setAudienceIds([])
    clearSuggestions()
  }

  function handleFetch() {
    fetchSuggestions(form.asin, form.audience_type)
    setAudienceIds([])
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
      default_bid:   minBid,      // always region minimum — not user-facing
      bid:           Number(form.bid),
      start_date:    form.start_date,
    })
  }

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

      {/* Audience multi-select */}
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
      </SectionCard>

      {/* Bids & Budget */}
      <SectionCard title="Bids & Budget" description="Bidding settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput label="Daily Budget *" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget}
            onChange={(e) => setField('budget', e.target.value)} error={errors.budget} />
          <NumberInput label="Targeting Bid *" prefix={currencySymbol} placeholder="1.50"
            value={form.bid} min={minBid} step={minBid}
            onChange={(e) => setField('bid', e.target.value)} error={errors.bid} />
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

      {/* Ad Naming */}
      <SectionCard title="Ad Naming (optional)" description="Custom names — auto-generated if blank">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Campaign Name" value={form.campaign_name}
            onChange={(e) => setField('campaign_name', e.target.value)} />
          <Input label="Ad Group Name" value={form.ad_group_name}
            onChange={(e) => setField('ad_group_name', e.target.value)} />
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