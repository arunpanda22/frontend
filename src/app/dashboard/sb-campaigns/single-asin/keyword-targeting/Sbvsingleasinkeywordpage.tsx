'use client'

import { useState } from 'react'
import { FileText, TableProperties } from 'lucide-react'
import { SBVSingleAsinKWForm } from './SBVSingleAsinKWForm'
import { SBVKeywordBulkSection } from './SBVKeywordBulkSection'

type CampaignMode = 'individual' | 'bulk'

const MODES: {
  value:       CampaignMode
  label:       string
  description: string
  icon:        React.ComponentType<{ className?: string }>
}[] = [
  {
    value:       'individual',
    label:       'Individual',
    description: 'Fill in a form to create one campaign at a time',
    icon:        FileText,
  },
  {
    value:       'bulk',
    label:       'Bulk Upload',
    description: 'Paste data from Excel to create dozens of campaigns at once',
    icon:        TableProperties,
  },
]

export function SBVSingleAsinKeywordPage() {
  const [mode, setMode] = useState<CampaignMode | null>(null)

  if (mode !== null) {
    return (
      <div className="flex flex-col gap-5">
        {/* Mode toggle — compact, shown above the form */}
        <div className="flex gap-2">
          {MODES.map((m) => {
            const Icon     = m.icon
            const isActive = mode === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`
                  flex items-center gap-2 rounded-xl border px-4 py-2.5
                  transition-all duration-150
                  ${isActive
                    ? 'border-indigo-300 bg-indigo-600 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                `}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className={`text-sm font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {m.label}
                  </p>
                  <p className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {m.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {mode === 'individual' && <SBVSingleAsinKWForm />}
        {mode === 'bulk'       && <SBVKeywordBulkSection />}
      </div>
    )
  }

  // ── Mode picker card (matches SingleAsinPage › ModePicker) ─────────────────
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <p className="text-sm font-semibold text-slate-800">How would you like to create campaigns?</p>
        <p className="text-xs text-slate-400 mt-0.5">Choose a creation method to continue</p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        {MODES.map((m) => {
          const Icon = m.icon
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className="group flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-indigo-100">
                <Icon className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{m.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}