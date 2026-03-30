'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../sp-campaigns/components/shared/FormFields'
import {
  BrandSelect, PerKeywordTable, AsinListInput, SBResultBanner,
  type KWRow,
} from '../shared/SBFormComponents'
import { useSBOperations, useCampaignDefaults } from '@/lib/hooks/sbCampaignHooks'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:         string   // editable preview field
  ad_group_name:         string
  ad_name_prod:          string
  headline:              string
  brand_name:            string
  budget:                number | string
  start_date:            string
  brand_logo_asset_id:   string
  custom_image_asset_id: string
  intent:                string
}

type Errors = Partial<Record<keyof Form | 'asin_list' | 'keywords', string>>

const defaultForm = (): Form => ({
  campaign_name: '', ad_group_name: '', ad_name_prod: '', headline: '',
  brand_name: '', budget: '',
  start_date: today, brand_logo_asset_id: '', custom_image_asset_id: '', intent: '',
})

function buildName(brandName: string, keywords: KWRow[], intent: string) {
  if (!brandName.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const filled = keywords.filter((k) => k.text.trim())
  if (filled.length === 1) return `${brandName} - SB - PC - ${filled[0].text} - SK${intentSuffix}`
  return `${brandName} - SB - PC - MK${intentSuffix}`
}

export function ProductCollectionForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createProductCollection, loading, result } = useSBOperations()

  const [form,     setForm]     = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [asinList, setAsinList] = useState<string[]>(['', '', ''])
  const [keywords, setKeywords] = useState<KWRow[]>([{ text: '', matchType: 'exact', bid: '' }])
  const [errors,   setErrors]   = useState<Errors>({})

  const [nameEdited, setNameEdited] = useState(false)
  const generatedName = buildName(form.brand_name, keywords, form.intent)
  const campaignNameDisplay = nameEdited ? form.campaign_name : generatedName

  const filled = keywords.filter((k) => k.text.trim())

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

  function handleKeywordsChange(rows: KWRow[]) {
    setKeywords(rows)
    setErrors((e) => ({ ...e, keywords: undefined }))
    const bids = rows.filter((r) => r.text.trim()).map((r) => Number(r.bid)).filter((b) => b > 0)
    if (bids.length > 0) {
      const rec = recommendedBudget(bids)
      setForm((f) => ({ ...f, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
    }
  }

  function validate() {
    const e: Errors = {}
    if (!form.headline.trim())               e.headline              = 'Required'
    if (!form.brand_name.trim())             e.brand_name            = 'Required'
    if (!form.brand_logo_asset_id.trim())    e.brand_logo_asset_id   = 'Required'
    if (!form.custom_image_asset_id.trim())  e.custom_image_asset_id = 'Required'
    if (!form.budget)                        e.budget                = 'Required'
    if (!form.start_date)                    e.start_date            = 'Required'
    const filledAsins = asinList.filter((a) => a.trim())
    if (filledAsins.length < 1)              e.asin_list             = 'At least one ASIN required'
    if (filled.length === 0)                 e.keywords              = 'At least one keyword required'
    else if (filled.some((r) => Number(r.bid) < minBid))
                                             e.keywords              = `All keywords need a bid ≥ ${minBid}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createProductCollection({
      campaign_name:         campaignNameDisplay || undefined,
      ad_group_name:         form.ad_group_name.trim() || undefined,
      ad_name_prod:          form.ad_name_prod.trim()  || undefined,
      headline:              form.headline,
      brand_name:            form.brand_name,
      brand_logo_asset_id:   form.brand_logo_asset_id.trim(),
      custom_image_asset_id: form.custom_image_asset_id.trim(),
      asin_list:             asinList.filter((a) => a.trim()),
      keywords:              filled.map((r) => ({ text: r.text.trim(), matchType: r.matchType, bid: Number(r.bid) })),
      budget:                Number(form.budget),
      start_date:            form.start_date,
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
          placeholder="Fill in brand and keywords to auto-generate…"
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

      <SectionCard title="Brand & Creative" description="Brand identity and creative assets">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BrandSelect value={form.brand_name} onChange={(v) => setField('brand_name', v)} error={errors.brand_name} />
          <Input label="Headline *" placeholder="Check out our latest products!"
            value={form.headline} onChange={(e) => setField('headline', e.target.value)} error={errors.headline} />
          <Input
            label="Brand Logo Asset ID *"
            placeholder="Paste asset ID here"
            value={form.brand_logo_asset_id}
            onChange={(e) => setField('brand_logo_asset_id', e.target.value.trim())}
            error={errors.brand_logo_asset_id}
            className="font-mono"
          />
          <Input
            label="Custom Image Asset ID *"
            placeholder="Paste asset ID here"
            value={form.custom_image_asset_id}
            onChange={(e) => setField('custom_image_asset_id', e.target.value.trim())}
            error={errors.custom_image_asset_id}
            className="font-mono"
          />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor"
            value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Advertised ASINs" description="Products to show in the collection ad">
        <AsinListInput asins={asinList} onChange={setAsinList} error={errors.asin_list} />
      </SectionCard>

      <SectionCard title="Keywords" description="Each keyword has its own match type and bid">
        <PerKeywordTable
          rows={keywords}
          onChange={handleKeywordsChange}
          error={errors.keywords}
          minBid={minBid}
          currency={currencySymbol}
        />
      </SectionCard>

      <SectionCard title="Campaign Settings" description="Budget and schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput label="Daily Budget" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget} onChange={(e) => setField('budget', e.target.value)} error={errors.budget} />
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