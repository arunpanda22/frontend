'use client'

import { useState } from 'react'
import { StoreSpotlightBulkSection } from './Storespotlightbulksection'
import { StoreSpotlightForm } from './StoreSpotlightForm'

type CampaignMode = 'individual' | 'bulk'

const MODES: { value: CampaignMode; label: string; description: string }[] = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'Create a single campaign with full control',
  },
  {
    value: 'bulk',
    label: 'Bulk Paste',
    description: 'Paste from Excel to create multiple campaigns',
  },
]

export function StoreSpotlightPage() {
  const [mode, setMode] = useState<CampaignMode>('individual')

  return (
    <div className="flex flex-col gap-5">
      {/* Mode picker */}
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`flex flex-col rounded-xl border px-5 py-3 text-left transition-all duration-150
              ${mode === m.value
                ? 'border-indigo-300 bg-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <p className={`text-xs font-semibold leading-none ${mode === m.value ? 'text-white' : 'text-slate-700'}`}>
              {m.label}
            </p>
            <p className={`text-[10px] leading-none mt-1 ${mode === m.value ? 'text-indigo-200' : 'text-slate-400'}`}>
              {m.description}
            </p>
          </button>
        ))}
      </div>

      {mode === 'individual' && <StoreSpotlightForm />}
      {mode === 'bulk'       && <StoreSpotlightBulkSection />}
    </div>
  )
}