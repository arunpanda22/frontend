'use client'

import { useState } from 'react'
import { SDRetargetPage } from './retarget/Sdretargetpage'
import { SDContextualPage } from './contextual/Sdcontextualpage'
import { SDAudienceForm }    from './audience/SDAudienceForm'

type Tab = 'retarget' | 'contextual' | 'audience'

const TABS: { value: Tab; label: string; sublabel: string }[] = [
  { value: 'retarget',   label: 'Retargeting', sublabel: 'Re-engage viewers or past buyers'              },
  { value: 'contextual', label: 'Contextual',  sublabel: 'Product or category-based contextual targeting' },
  { value: 'audience',   label: 'Audience',    sublabel: 'In-market or interest-based audience targeting' },
]

export default function SDCampaignPage() {
  const [tab, setTab] = useState<Tab>('retarget')

  return (
    <div className="flex flex-col gap-6 m-12">
      {/* Tab row */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.value} type="button" onClick={() => setTab(t.value)}
            className={`flex flex-col rounded-xl border px-5 py-3 text-left transition-all duration-150
              ${tab === t.value
                ? 'border-indigo-300 bg-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
            <p className={`text-xs font-semibold leading-none ${tab === t.value ? 'text-white' : 'text-slate-700'}`}>
              {t.label}
            </p>
            <p className={`text-[10px] leading-none mt-1 ${tab === t.value ? 'text-indigo-200' : 'text-slate-400'}`}>
              {t.sublabel}
            </p>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'retarget'   && <SDRetargetPage />}
      {tab === 'contextual' && <SDContextualPage />}
      {tab === 'audience'   && <SDAudienceForm />}
    </div>
  )
}