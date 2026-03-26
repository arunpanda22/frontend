'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../sp-campaigns/components/shared/FormFields'
import {
  AssetSelect, BrandSelect, PerKeywordTable, AsinListInput, SubPagesTable, SBResultBanner,
  type KWRow,
  type SubPage,
} from '../shared/SBFormComponents'
import { useSBOperations, useSBAssets, useCampaignDefaults } from '@/lib/hooks/sbCampaignHooks'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:         string
  ad_group_name:         string
  ad_name:               string
  headline:              string
  brand_name:            string
  home_page_url:         string
  budget:                number | string
  start_date:            string
  brand_logo_asset_id:   string
  custom_image_asset_id: string
  intent:                string
}

type Errors = Partial<Record<keyof Form | 'asin_list' | 'keywords' | 'sub_pages', string>>

const defaultForm = (): Form => ({
  campaign_name: '', ad_group_name: '', ad_name: '', headline: '',
  brand_name: '', home_page_url: '', budget: '',
  start_date: today, brand_logo_asset_id: '', custom_image_asset_id: '', intent: '',
})

function buildName(brandName: string, keywords: KWRow[], intent: string) {
  if (!brandName.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const filled = keywords.filter((k) => k.text.trim())
  if (filled.length === 1) return `${brandName} - SB - Spotlight - ${filled[0].text} - SK${intentSuffix}`
  return `${brandName} - SB - Spotlight - MK${intentSuffix}`
}

export function StoreSpotlightForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { images, logos } = useSBAssets()
  const { createSBVSpotlight, loading, result } = useSBOperations()

  const [form,     setForm]     = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [asinList, setAsinList] = useState<string[]>(['', '', ''])
  const [keywords, setKeywords] = useState<KWRow[]>([{ text: '', matchType: 'exact', bid: '' }])
  const [subPages, setSubPages] = useState<SubPage[]>([{ pageTitle: '', asin: '', url: '' }])
  const [errors,   setErrors]   = useState<Errors>({})

  const filled = keywords.filter((k) => k.text.trim())
  const campaignName = buildName(form.brand_name, keywords, form.intent)

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
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
    if (!form.headline.trim())              e.headline              = 'Required'
    if (!form.brand_name.trim())            e.brand_name            = 'Required'
    if (!form.home_page_url.trim())         e.home_page_url         = 'Required'
    if (!form.brand_logo_asset_id)          e.brand_logo_asset_id   = 'Required'
    if (!form.custom_image_asset_id)        e.custom_image_asset_id = 'Required'
    if (!form.budget)                       e.budget                = 'Required'
    if (!form.start_date)                   e.start_date            = 'Required'
    if (asinList.filter((a) => a.trim()).length < 1) e.asin_list    = 'At least one ASIN required'
    if (filled.length === 0)                e.keywords              = 'At least one keyword required'
    else if (filled.some((r) => Number(r.bid) < minBid))
                                            e.keywords              = `All keywords need a bid ≥ ${minBid}`
    const validPages = subPages.filter((p) => p.pageTitle.trim() && p.url.trim())
    if (validPages.length === 0)            e.sub_pages             = 'At least one sub-page required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSBVSpotlight({
      campaign_name:         campaignName || undefined,
      ad_group_name:         form.ad_group_name.trim() || undefined,
      ad_name:               form.ad_name.trim()       || undefined,
      headline:              form.headline,
      brand_logo_asset_id:   form.brand_logo_asset_id,
      custom_image_asset_id: form.custom_image_asset_id,
      asin_list:             asinList.filter((a) => a.trim()),
      keyword_text:          filled.map((r) => ({ text: r.text.trim(), matchType: r.matchType, bid: Number(r.bid) })),
      home_page_url:         form.home_page_url,
      sub_pages:             subPages.filter((p) => p.pageTitle.trim() && p.url.trim()),
      budget:                Number(form.budget),
      start_date:            form.start_date,
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

      <SectionCard title="Brand & Creative" description="Brand identity and creative assets">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BrandSelect value={form.brand_name} onChange={(v) => setField('brand_name', v)} error={errors.brand_name} />
          <Input label="Headline *" placeholder="Check out our store!"
            value={form.headline} onChange={(e) => setField('headline', e.target.value)} error={errors.headline} />
          <AssetSelect label="Brand Logo Asset *" assets={logos.data ?? []}
            value={form.brand_logo_asset_id} onChange={(v) => setField('brand_logo_asset_id', v)} error={errors.brand_logo_asset_id} />
          <AssetSelect label="Custom Image Asset *" assets={images.data ?? []}
            value={form.custom_image_asset_id} onChange={(v) => setField('custom_image_asset_id', v)} error={errors.custom_image_asset_id} />
        </div>
      </SectionCard>

      <SectionCard title="Store URLs" description="Home page and featured sub-pages">
        <div className="flex flex-col gap-4">
          <Input label="Store Home Page URL *" placeholder="https://amazon.com/stores/..."
            value={form.home_page_url} onChange={(e) => setField('home_page_url', e.target.value)} error={errors.home_page_url} />
          <div className="flex flex-col gap-1">
            <p className="text-xs text-slate-500">Sub-pages *</p>
            <SubPagesTable pages={subPages} onChange={setSubPages} error={errors.sub_pages} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Advertised ASINs" description="Products featured in the spotlight">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput label="Daily Budget" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget} onChange={(e) => setField('budget', e.target.value)} error={errors.budget} />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor"
            value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
          <DatePicker label="Start Date" value={form.start_date}
            onChange={(v) => setField('start_date', v)} error={errors.start_date} />
        </div>
      </SectionCard>

      <SectionCard title="Ad Naming (optional)" description="Custom names — auto-generated if blank">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Campaign Name" value={form.campaign_name} onChange={(e) => setField('campaign_name', e.target.value)} />
          <Input label="Ad Group Name" value={form.ad_group_name} onChange={(e) => setField('ad_group_name', e.target.value)} />
          <Input label="Ad Name"       value={form.ad_name}       onChange={(e) => setField('ad_name', e.target.value)} />
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