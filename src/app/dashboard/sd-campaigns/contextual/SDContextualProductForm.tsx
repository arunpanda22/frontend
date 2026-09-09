'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../sp-campaigns/components/shared/FormFields'
import { AsinListInput, SDResultBanner } from '../shared/SDFormComponents'
import { useSDOperations, useCampaignDefaults } from '@/lib/hooks/sdCampaignHooks'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name: string
  ad_group_name: string
  budget:        number | string
  bid:           number | string
  start_date:    string
  intent:        string
}

type Errors = Partial<Record<keyof Form | 'asins' | 'asin_list', string>>

// Mirrors the bulk paste naming convention (asin - SD - CP - targetAsin - intent),
// extended to handle multiple advertised/target ASINs so single-form campaigns
// stay distinguishable the same way bulk rows are.
function buildName(asins: string[], targetAsins: string[], intent: string) {
  const filledAsins   = asins.filter((a) => a.trim())
  const filledTargets = targetAsins.filter((a) => a.trim())
  if (!filledAsins.length) return ''

  const asinLabel     = filledAsins.slice(0, 2).join(', ')
  const intentSuffix  = intent.trim() ? ` - ${intent.trim()}` : ''

  if (!filledTargets.length) return `${asinLabel} - SD - CP${intentSuffix}`

  const targetLabel = filledTargets.slice(0, 2).join(', ')
  return `${asinLabel} - SD - CP - ${targetLabel}${intentSuffix}`
}

export function SDContextualProductForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSDContextualProduct, loading, result } = useSDOperations()

  const [form,     setForm]     = useState<Form>({ campaign_name: '', ad_group_name: '', budget: minBudget, bid: '', start_date: today, intent: '' })
  const [asins,    setAsins]    = useState<string[]>([''])
  const [asinList, setAsinList] = useState<string[]>([''])
  const [errors,   setErrors]   = useState<Errors>({})
  const [nameEdited, setNameEdited] = useState(false)

  const generatedName       = buildName(asins, asinList, form.intent)
  const campaignNameDisplay = nameEdited ? form.campaign_name : generatedName

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function handleCampaignNameChange(v: string) {
    setNameEdited(true)
    setField('campaign_name', v)
  }

  function handleCampaignNameBlur(v: string) {
    if (!v.trim()) {
      setNameEdited(false)
      setField('campaign_name', '')
    }
  }

  function validate() {
    const e: Errors = {}
    if (!asins.filter((a) => a.trim()).length)    e.asins     = 'At least one advertised ASIN required'
    if (!asinList.filter((a) => a.trim()).length) e.asin_list = 'At least one target ASIN required'
    if (!form.budget)                             e.budget    = 'Required'
    if (!form.bid)                                e.bid       = 'Required'
    if (!form.start_date)                         e.start_date = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSDContextualProduct({
      campaign_name: campaignNameDisplay || undefined,
      ad_group_name: form.ad_group_name.trim() || undefined,
      asins:         asins.filter((a) => a.trim()),
      asin_list:     asinList.filter((a) => a.trim()),
      budget:        Number(form.budget),
      bid:           Number(form.bid),
      start_date:    form.start_date,
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
          placeholder="Fill in ASINs to auto-generate…"
          className="w-full bg-transparent font-mono text-sm font-medium text-indigo-700 placeholder-indigo-300
                     border-0 border-b border-indigo-200 focus:border-indigo-400 focus:outline-none
                     pb-0.5 transition-colors"
        />
        {nameEdited && (
          <button
            type="button"
            onClick={() => {
              setNameEdited(false)
              setField('campaign_name', '')
            }}
            className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            ↺ Reset to auto-generated
          </button>
        )}
      </div>

      <SectionCard title="Advertised Products" description="ASINs to advertise — resolved to SKUs by the backend">
        <AsinListInput asins={asins} onChange={(v) => { setAsins(v); setErrors((e) => ({ ...e, asins: undefined })) }} error={errors.asins} />
      </SectionCard>

      <SectionCard title="Target Products" description="Competitor or related ASINs to target contextually">
        <AsinListInput asins={asinList} onChange={(v) => { setAsinList(v); setErrors((e) => ({ ...e, asin_list: undefined })) }} error={errors.asin_list} label="Target ASINs" />
      </SectionCard>

      <SectionCard title="Bids & Budget" description="Bidding settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput label="Daily Budget *" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget} onChange={(e) => setField('budget', e.target.value)} error={errors.budget} />
          <NumberInput label="Targeting Bid *" prefix={currencySymbol} placeholder="1.50"
            value={form.bid} min={minBid} step={minBid}
            onChange={(e) => {
              const rec = recommendedBudget([Number(e.target.value)])
              setForm((f) => ({ ...f, bid: e.target.value, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
              setErrors((err) => ({ ...err, bid: undefined }))
            }} error={errors.bid} />
        </div>
      </SectionCard>

      <SectionCard title="Campaign Settings" description="Schedule and optional naming">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DatePicker label="Start Date" value={form.start_date} onChange={(v) => setField('start_date', v)} error={errors.start_date} />
          <Input label="Intent (optional)" placeholder="e.g. competitor, niche" value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3">
        <SDResultBanner result={result} />
        <div className="flex justify-end"><SubmitButton loading={loading} label="Create Campaign" /></div>
      </div>
    </form>
  )
}