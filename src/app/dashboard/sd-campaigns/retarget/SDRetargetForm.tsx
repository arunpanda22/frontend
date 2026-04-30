'use client'

import { useState } from 'react'
import { Input, NumberInput, DatePicker, SectionCard, SubmitButton } from '../../sp-campaigns/components/shared/FormFields'
import { AsinListInput, ExpressionTypeToggle, SDResultBanner, type ExpressionType } from '../shared/SDFormComponents'
import { useSDOperations, useCampaignDefaults } from '@/lib/hooks/sdCampaignHooks'

const today = new Date().toISOString().split('T')[0]

interface Form {
  campaign_name:   string
  ad_group_name:   string
  budget:          number | string
  bid:             number | string
  start_date:      string
  expression_type: ExpressionType
  intent:          string
}

type Errors = Partial<Record<keyof Form | 'asins', string>>

function buildName(asins: string[], expressionType: ExpressionType, intent: string) {
  const filled = asins.filter((a) => a.trim())
  if (!filled.length) return ''
  const intentSuffix = intent.trim() ? ` - ${intent.trim()}` : ''
  return `${filled.slice(0, 2).join(', ')} - SD - RT - ${expressionType.charAt(0).toUpperCase() + expressionType.slice(1)}${intentSuffix}`
}

export function SDRetargetForm() {
  const { minBid, minBudget, currencySymbol, recommendedBudget } = useCampaignDefaults()
  const { createSDRetarget, loading, result } = useSDOperations()

  const [form,   setForm]   = useState<Form>({ campaign_name: '', ad_group_name: '', budget: minBudget, bid: '', start_date: today, expression_type: 'views', intent: '' })
  const [asins,  setAsins]  = useState<string[]>([''])
  const [errors, setErrors] = useState<Errors>({})

  const campaignName = buildName(asins, form.expression_type, form.intent)

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e: Errors = {}
    if (!asins.filter((a) => a.trim()).length) e.asins      = 'At least one ASIN required'
    if (!form.budget)                          e.budget     = 'Required'
    if (!form.bid)                             e.bid        = 'Required'
    if (!form.start_date)                      e.start_date = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createSDRetarget({
      campaign_name:   campaignName || undefined,
      ad_group_name:   form.ad_group_name.trim() || undefined,
      asins:           asins.filter((a) => a.trim()),
      expression_type: form.expression_type,
      budget:          Number(form.budget),
      bid:             Number(form.bid),
      start_date:      form.start_date,
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

      <SectionCard title="Retargeting Type" description="Choose how to re-engage shoppers">
        <ExpressionTypeToggle value={form.expression_type} onChange={(v) => setField('expression_type', v)} />
      </SectionCard>

      <SectionCard title="Advertised Products" description="ASINs to advertise — resolved to SKUs by the backend">
        <AsinListInput asins={asins} onChange={(v) => { setAsins(v); setErrors((e) => ({ ...e, asins: undefined })) }} error={errors.asins} />
      </SectionCard>

      <SectionCard title="Bids & Budget" description="Bidding settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput label="Daily Budget *" prefix={currencySymbol} placeholder="100"
            value={form.budget} min={minBudget} onChange={(e) => setField('budget', e.target.value)} error={errors.budget} />
          <NumberInput label="Targeting Bid *" prefix={currencySymbol} placeholder="1.50"
            value={form.bid} min={minBid} step={minBid}
            onChange={(e) => {
              setField('bid', e.target.value)
              const rec = recommendedBudget([Number(e.target.value)])
              setForm((f) => ({ ...f, bid: e.target.value, budget: !f.budget || Number(f.budget) < rec ? rec : f.budget }))
            }} error={errors.bid} />
        </div>
      </SectionCard>

      <SectionCard title="Campaign Settings" description="Schedule and optional naming">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DatePicker label="Start Date" value={form.start_date} onChange={(v) => setField('start_date', v)} error={errors.start_date} />
          <Input label="Intent (optional)" placeholder="e.g. brand, competitor" value={form.intent} onChange={(e) => setField('intent', e.target.value)} />
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