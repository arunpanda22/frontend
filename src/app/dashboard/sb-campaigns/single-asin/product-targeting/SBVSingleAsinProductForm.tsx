'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../../sp-campaigns/components/shared/FormFields'
import { TargetAsinsTable, SBResultBanner, type SBTargetRow } from '../../shared/SBFormComponents'
import { useSBOperations, useCampaignDefaults } from '@/lib/hooks/sbCampaignHooks'
import { isValidAsin } from '@/lib/utils/asinValidation'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:  string   // editable preview field
  asin:           string
  video_asset_id: string
  budget:         number | string
  start_date:     string
  intent:         string
}

type Errors = Partial<Record<keyof Form | 'target_asins', string>>

const defaultForm = (): Form => ({
  campaign_name: '', asin: '',
  video_asset_id: '', budget: '', start_date: today, intent: '',
})

function buildName(asin: string, targets: SBTargetRow[], intent: string) {
  if (!asin.trim()) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  const filled = targets.filter((t) => t.asin.trim())
  const suffix = filled.length > 1 ? 'MPT' : filled.length === 1 ? `SPT - ${filled[0].asin}` : 'PT'
  return `${asin.trim()} - SBV - ${suffix}${intentSuffix}`
}

export function SBVSingleAsinProductForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSBVSingleProduct, loading, result } = useSBOperations()

  const [form,        setForm]        = useState<Form>(() => ({ ...defaultForm(), budget: minBudget }))
  const [targetAsins, setTargetAsins] = useState<SBTargetRow[]>([{ asin: '', matchType: 'EXACT', bid: '' }])
  const [errors,      setErrors]      = useState<Errors>({})

  const [nameEdited, setNameEdited] = useState(false)
  const generatedName = buildName(form.asin, targetAsins, form.intent)
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

  function handleTargetsChange(rows: SBTargetRow[]) {
    setTargetAsins(rows)
    setErrors((e) => ({ ...e, target_asins: undefined }))
    const bids = rows.filter((r) => r.asin.trim()).map((r) => Number(r.bid)).filter((b) => b > 0)
    if (bids.length > 0) {
      const rec = recommendedBudget(bids)
      setForm((f) => ({ ...f, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
    }
  }

  function validate() {
    const e: Errors = {}
    if (!form.asin.trim())               e.asin           = 'Required'
    else if (!isValidAsin(form.asin))    e.asin           = 'Invalid ASIN'
    if (!form.video_asset_id.trim())     e.video_asset_id = 'Required'
    if (!form.budget)                    e.budget         = 'Required'
    if (!form.start_date)                e.start_date     = 'Required'
    const filled = targetAsins.filter((t) => t.asin.trim())
    if (filled.length === 0)
      e.target_asins = 'At least one target ASIN required'
    else if (filled.some((t) => Number(t.bid) < minBid))
      e.target_asins = `All targets need a bid ≥ ${minBid}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSBVSingleProduct({
      campaign_name:  campaignNameDisplay || undefined,
      asin:           form.asin.trim(),
      video_asset_id: form.video_asset_id.trim(),
      target_asins:   targetAsins
        .filter((t) => t.asin.trim())
        .map((t) => ({ asin: t.asin.trim(), bid: Number(t.bid), matchType: t.matchType })),
      budget:         Number(form.budget),
      start_date:     form.start_date,
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
          placeholder="Fill in ASIN and targets to auto-generate…"
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

      <SectionCard title="Target ASINs" description="Competitor or related ASINs to target — each with its own match type and bid">
        <TargetAsinsTable
          rows={targetAsins}
          onChange={handleTargetsChange}
          error={errors.target_asins}
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