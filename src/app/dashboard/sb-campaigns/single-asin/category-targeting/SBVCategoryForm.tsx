'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../../sp-campaigns/components/shared/FormFields'
import { SBResultBanner } from '../../shared/SBFormComponents'
import { useSBOperations, useCampaignDefaults, useSBBrands } from '@/lib/hooks/sbCampaignHooks'
import { isValidAsin } from '@/lib/utils/asinValidation'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:   string   // editable preview field
  asin:            string
  video_asset_id:  string
  brand_entity_id: string
  budget:          number | string
  bid:             number | string
  start_date:      string
  intent:          string
}

type Errors = Partial<Record<keyof Form, string>>

const defaultForm = (): Form => ({
  campaign_name: '', asin: '', video_asset_id: '',
  budget: '', bid: '', start_date: today, intent: '', 
  brand_entity_id: '',
})

function buildName(asin: string, intent: string) {
  if (!asin.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  return `${asin.trim()} - SBV - CAT${intentSuffix}`
}

export function SBVCategoryForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSBVCategory, loading, result } = useSBOperations()

  const [form,   setForm]   = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [errors, setErrors] = useState<Errors>({})

  const [nameEdited, setNameEdited] = useState(false)
  const generatedName = buildName(form.asin, form.intent)
  const campaignNameDisplay = nameEdited ? form.campaign_name : generatedName

  const brands = useSBBrands()

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
    if (!form.asin.trim())               e.asin           = 'Required'
    else if (!isValidAsin(form.asin))    e.asin           = 'Invalid ASIN'
    if (!form.video_asset_id.trim())     e.video_asset_id = 'Required'
    if (!form.budget)                    e.budget         = 'Required'
    if (!form.bid)                       e.bid            = 'Required'
    if (!form.start_date)                e.start_date     = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSBVCategory({
      campaign_name:   campaignNameDisplay || undefined,
      asin:            form.asin.trim(),
      video_asset_id:  form.video_asset_id.trim(),
      brand_entity_id: form.brand_entity_id,
      budget:          Number(form.budget),
      bid:             Number(form.bid),
      start_date:      form.start_date,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Campaign Name — editable preview */}
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
            onClick={() => { setNameEdited(false); setField('campaign_name', '') }}
            className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            ↺ Reset to auto-generated
          </button>
        )}
      </div>

      <SectionCard title="Advertised Asin" description="The ASIN to advertise via category targeting">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="ASIN *" placeholder="e.g. B009GCTZWC" value={form.asin}
            onChange={(e) => setField('asin', e.target.value.trim())} error={errors.asin} className="font-mono" />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor"
            value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
        </div>
      </SectionCard>
      
      <SectionCard title="Brand" description="Select the brand entity for this campaign">
        <div className="max-w-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">Brand *</label>
            <select
              value={form.brand_entity_id}
              onChange={(e) => setField('brand_entity_id', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            >
              <option value="">Select brand…</option>
              {(brands.data ?? []).map((b) => (
                <option key={b.brand_entity_id} value={b.brand_entity_id}>{b.brand_name}</option>
              ))}
            </select>
            {errors.brand_entity_id && (
              <p className="text-xs text-red-500">{errors.brand_entity_id}</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Video Creative" description="Paste the video asset ID from your asset library">
        <div className="max-w-sm">
          <Input
            label="Video Asset ID *"
            placeholder="Paste asset ID here"
            value={form.video_asset_id}
            onChange={(e) => setField('video_asset_id', e.target.value.trim())}
            error={errors.video_asset_id}
            className="font-mono"
          />
        </div>
      </SectionCard>

      <SectionCard title="Campaign Settings" description="Budget, bid and schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberInput label="Daily Budget" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget}
            onChange={(e) => setField('budget', e.target.value)}
            error={errors.budget} />
          <NumberInput label="Bid" prefix={currencySymbol} placeholder="0.00"
            value={form.bid} min={minBid} step={minBid}
            onChange={(e) => {
              setField('bid', e.target.value)
              const rec = recommendedBudget([Number(e.target.value)])
              setForm((f) => ({ ...f, bid: e.target.value, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
            }}
            error={errors.bid} />
          <DatePicker label="Start Date" value={form.start_date}
            onChange={(v) => setField('start_date', v)} error={errors.start_date} />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3">
        <SBResultBanner result={result} />
        <div className="flex justify-end">
          <SubmitButton loading={loading} label="Create Campaign" />
        </div>
      </div>
    </form>
  )
}