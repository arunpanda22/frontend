'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../../sp-campaigns/components/shared/FormFields'
import { PerKeywordTable, SBResultBanner, type KWRow } from '../../shared/SBFormComponents'
import { useSBOperations, useCampaignDefaults } from '@/lib/hooks/sbCampaignHooks'
import { isValidAsin } from '@/lib/utils/asinValidation'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:   string   // now the editable "preview" field
  ad_group_name:   string
  product_ad_name: string
  asin:            string
  video_asset_id:  string
  budget:          number | string
  start_date:      string
  intent:          string
}

type Errors = Partial<Record<keyof Form | 'keywords', string>>

const defaultForm = (): Form => ({
  campaign_name: '', ad_group_name: '', product_ad_name: '', asin: '',
  video_asset_id: '', budget: '', start_date: today, intent: '',
})

function buildName(asin: string, rows: KWRow[], intent: string) {
  if (!asin.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const filled = rows.filter((r) => r.text.trim())
  if (filled.length === 0) return `${asin.trim()} - SBV - KW${intentSuffix}`
  if (filled.length === 1) {
    const mt = filled[0].matchType.charAt(0).toUpperCase() + filled[0].matchType.slice(1)
    return `${asin.trim()} - SBV - KW - ${filled[0].text.trim()} - SK - ${mt}${intentSuffix}`
  }
  return `${asin.trim()} - SBV - KW - MK${intentSuffix}`
}

export function SBVSingleAsinKWForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSBVSingleKW, loading, result } = useSBOperations()

  const [form,     setForm]     = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [keywords, setKeywords] = useState<KWRow[]>([{ text: '', matchType: 'exact', bid: '' }])
  const [errors,   setErrors]   = useState<Errors>({})

  // Track whether the user has manually edited the campaign name.
  // If not, keep it in sync with the auto-generated value.
  const [nameEdited, setNameEdited] = useState(false)
  const generatedName = buildName(form.asin, keywords, form.intent)
  const campaignNameDisplay = nameEdited ? form.campaign_name : generatedName

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function handleCampaignNameChange(v: string) {
    setNameEdited(true)
    setField('campaign_name', v)
  }

  // If the user clears the name field, revert to auto-generated behaviour
  function handleCampaignNameBlur(v: string) {
    if (!v.trim()) {
      setNameEdited(false)
      setField('campaign_name', '')
    }
  }

  function handleKeywordsChange(rows: KWRow[]) {
    setKeywords(rows)
    setErrors((e) => ({ ...e, keywords: undefined }))
    // If name hasn't been manually edited, the display updates automatically
    // via generatedName — nothing extra needed here.
    const bids = rows.filter((r) => r.text.trim()).map((r) => Number(r.bid)).filter((b) => b > 0)
    if (bids.length > 0) {
      const rec = recommendedBudget(bids)
      setForm((f) => ({ ...f, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
    }
  }

  function validate() {
    const e: Errors = {}
    if (!form.asin.trim())            e.asin           = 'Required'
    else if (!isValidAsin(form.asin)) e.asin           = 'Invalid ASIN'
    if (!form.video_asset_id.trim())  e.video_asset_id = 'Required'
    if (!form.budget)                 e.budget         = 'Required'
    if (!form.start_date)             e.start_date     = 'Required'
    const filled = keywords.filter((r) => r.text.trim())
    if (filled.length === 0)          e.keywords       = 'At least one keyword required'
    else if (filled.some((r) => Number(r.bid) < minBid))
                                      e.keywords       = `All keywords need a bid ≥ ${minBid}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSBVSingleKW({
      // Use the user-edited name if set, otherwise use the generated one
      campaign_name:   campaignNameDisplay || undefined,
      asin:            form.asin.trim(),
      video_asset_id:  form.video_asset_id.trim(),
      keyword_text:    keywords
        .filter((r) => r.text.trim())
        .map((r) => ({ text: r.text.trim(), matchType: r.matchType, bid: Number(r.bid) })),
      budget:          Number(form.budget),
      bid:             minBid,   // always use region minBid — no user input needed
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
          placeholder="Fill in ASIN and keywords to auto-generate…"
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

      <SectionCard title="Advertised Product" description="The ASIN to advertise">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="ASIN *" placeholder="e.g. B009GCTZWC" value={form.asin}
            onChange={(e) => setField('asin', e.target.value.trim())} error={errors.asin} className="font-mono" />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor"
            value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
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

      <SectionCard title="Keywords" description="Each keyword has its own match type and bid">
        <PerKeywordTable
          rows={keywords} onChange={handleKeywordsChange}
          error={errors.keywords} minBid={minBid} currency={currencySymbol}
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