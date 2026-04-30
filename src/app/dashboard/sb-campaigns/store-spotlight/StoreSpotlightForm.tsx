'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../sp-campaigns/components/shared/FormFields'
import {
  BrandSelect, PerKeywordTable, AsinListInput, SubPagesTable, SBResultBanner,
  type KWRow,
  type SubPage,
} from '../shared/SBFormComponents'
import { useSBOperations, useCampaignDefaults, useSBAssets } from '@/lib/hooks/sbCampaignHooks'
import { XCircle } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:         string   // editable preview field
  ad_group_name:         string
  ad_name:               string
  headline:              string
  brand_name:            string
  brand_entity_id:       string
  home_page_url:         string
  budget:                number | string
  start_date:            string
  brand_logo_asset_id:   string
  custom_image_asset_id: string
  intent:                string
}

interface Asset {
  asset_id:  string
  asset_url: string | null
  name?:     string
}

type Errors = Partial<Record<keyof Form | 'asin_list' | 'keywords', string>>

const defaultForm = (): Form => ({
  campaign_name: '', ad_group_name: '', ad_name: '', headline: '',
  brand_name: '', brand_entity_id: '', home_page_url: '', budget: '',
  start_date: today, brand_logo_asset_id: '', custom_image_asset_id: '', intent: '',
})

function buildName(brandName: string, keywords: KWRow[], intent: string) {
  if (!brandName.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const filled = keywords.filter((k) => k.text.trim())
  if (filled.length === 1) return `${brandName} - SB - Spotlight - ${filled[0].text} - SK${intentSuffix}`
  return `${brandName} - SB - Spotlight - MK${intentSuffix}`
}

function ImageAssetPicker({
  label, assets, value, onChange,
}: {
  label:    string
  assets:   Asset[]
  value:    string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = assets.find((a) => a.asset_id === value)

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:border-indigo-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition text-left"
      >
        {selected ? (
          <>
            {selected.asset_url
              ? <img src={selected.asset_url} alt={selected.name ?? selected.asset_id}
                  className="h-8 w-8 rounded object-cover shrink-0 border border-slate-200" />
              : <div className="h-8 w-8 rounded bg-slate-100 shrink-0 border border-slate-200" />
            }
            <span className="truncate text-xs text-slate-700 font-mono">
              {selected.name ?? selected.asset_id}
            </span>
          </>
        ) : (
          <span className="text-slate-400">Select image asset…</span>
        )}
        <span className="ml-auto text-slate-400 text-xs">▾</span>
      </button>
      {value && (
        <button type="button" onClick={() => { onChange(''); setOpen(false) }}
          className="absolute right-8 top-[34px] text-slate-300 hover:text-slate-500 transition"
          aria-label="Clear selection">
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {assets.length === 0
            ? <p className="px-4 py-6 text-center text-xs text-slate-400">No assets found</p>
            : (
              <div className="grid grid-cols-3 gap-2 p-3">
                {assets.map((a) => (
                  <button key={a.asset_id} type="button"
                    onClick={() => { onChange(a.asset_id); setOpen(false) }}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition
                      ${value === a.asset_id ? 'border-indigo-400 bg-indigo-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    {a.asset_url
                      ? <img src={a.asset_url} alt={a.name ?? a.asset_id}
                          className="h-16 w-full rounded object-cover border border-slate-100" />
                      : <div className="h-16 w-full rounded bg-slate-100 border border-slate-100 flex items-center justify-center text-[10px] text-slate-400">No preview</div>
                    }
                    <span className="text-[10px] text-slate-500 truncate w-full text-center leading-tight">
                      {a.name ?? a.asset_id}
                    </span>
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

export function StoreSpotlightForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSBVSpotlight, loading, result } = useSBOperations()
  const { allImages, logos } = useSBAssets()

  const [form,     setForm]     = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [asinList, setAsinList] = useState<string[]>(['', '', ''])
  const [keywords, setKeywords] = useState<KWRow[]>([{ text: '', matchType: 'exact', bid: '' }])
  const [subPages, setSubPages] = useState<SubPage[]>([{ pageTitle: '', asin: '', url: '' }])
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
    if (!form.home_page_url.trim())          e.home_page_url         = 'Required'
    if (!form.brand_logo_asset_id.trim())    e.brand_logo_asset_id   = 'Required'
    if (!form.custom_image_asset_id.trim())  e.custom_image_asset_id = 'Required'
    if (!form.budget)                        e.budget                = 'Required'
    if (!form.start_date)                    e.start_date            = 'Required'
    if (asinList.filter((a) => a.trim()).length < 1)
                                             e.asin_list             = 'At least one ASIN required'
    if (filled.length === 0)                 e.keywords              = 'At least one keyword required'
    else if (filled.some((r) => Number(r.bid) < minBid))
                                             e.keywords              = `All keywords need a bid ≥ ${minBid}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSBVSpotlight({
      campaign_name:         campaignNameDisplay || undefined,
      ad_group_name:         form.ad_group_name.trim() || undefined,
      ad_name:               form.ad_name.trim()       || undefined,
      headline:              form.headline,
      brand_logo_asset_id:   form.brand_logo_asset_id.trim(),
      brand_entity_id:       form.brand_entity_id,
      brand_name:            form.brand_name,
      custom_image_asset_id: form.custom_image_asset_id.trim(),
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BrandSelect
            value={form.brand_name}
            onChange={(v) => setField('brand_name', v)}
            onEntityId={(id) => setField('brand_entity_id', id)}
            error={errors.brand_name}
          />
          <Input label="Headline *" placeholder="Check out our store!"
            value={form.headline} onChange={(e) => setField('headline', e.target.value)} error={errors.headline} />
          <ImageAssetPicker
            label="Brand Logo Asset *"
            assets={logos.data ?? []}
            value={form.brand_logo_asset_id}
            onChange={(v) => setField('brand_logo_asset_id', v)}
          />
          <ImageAssetPicker
            label="Custom Image Asset *"
            assets={allImages.data ?? []}
            value={form.custom_image_asset_id}
            onChange={(v) => setField('custom_image_asset_id', v)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Store URLs" description="Home page and featured sub-pages">
        <div className="flex flex-col gap-4">
          <Input label="Store Home Page URL *" placeholder="https://amazon.com/stores/..."
            value={form.home_page_url} onChange={(e) => setField('home_page_url', e.target.value)} error={errors.home_page_url} />
          <div className="flex flex-col gap-1">
            <p className="text-xs text-slate-500">Sub-pages <span className="text-slate-400">(optional)</span></p>
            <SubPagesTable pages={subPages} onChange={setSubPages} />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberInput label="Daily Budget" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget} onChange={(e) => setField('budget', e.target.value)} error={errors.budget} />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor"
            value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
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