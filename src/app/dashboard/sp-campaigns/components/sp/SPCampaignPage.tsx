'use client'

import { useState } from 'react'
import { Box, Boxes, Zap } from 'lucide-react'
import { SingleAsinPage } from './single-asin/SingleAsinPage'
import { MultiAsinPage } from './multi-asin/MultiAsinPage'

// ── Types ─────────────────────────────────────────────────────────────────────

type AsinMode = 'single-asin' | 'multi-asin' | 'auto'

interface AsinModeTab {
  id:          AsinMode
  label:       string
  description: string
  icon:        React.ComponentType<{ className?: string }>
  available:   boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const ASIN_MODES: AsinModeTab[] = [
  {
    id:          'single-asin',
    label:       'Single ASIN',
    description: 'One product per campaign',
    icon:        Box,
    available:   true,
  },
  {
    id:          'multi-asin',
    label:       'Multi ASIN',
    description: 'Group products in one campaign',
    icon:        Boxes,
    available:   true,
  },
  {
    id:          'auto',
    label:       'Auto Targeting',
    description: 'Amazon-managed targeting',
    icon:        Zap,
    available:   false,
  },
]

// ── Tab Bar ───────────────────────────────────────────────────────────────────

function AsinModeTabBar({
  active,
  onChange,
}: {
  active:   AsinMode
  onChange: (id: AsinMode) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 border-b border-slate-200 bg-white px-6 sm:px-10 min-w-max">
        {ASIN_MODES.map((tab) => {
          const Icon     = tab.icon
          const isActive = active === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              disabled={!tab.available}
              onClick={() => tab.available && onChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-5 py-4 text-sm
                border-b-2 -mb-px transition-all duration-150 whitespace-nowrap
                ${isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : tab.available
                    ? 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    : 'border-transparent text-slate-300 cursor-not-allowed'}
              `}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-500' : ''}`} />
              <span className="font-semibold">{tab.label}</span>
              <span className={`hidden sm:inline text-xs ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                · {tab.description}
              </span>
              {!tab.available && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Soon
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Coming Soon ───────────────────────────────────────────────────────────────

function ComingSoon({ tab }: { tab: AsinModeTab }) {
  const Icon = tab.icon
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{tab.label}</p>
      <p className="mt-1 text-xs text-slate-400 max-w-xs">Coming soon.</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SPCampaignPage() {
  const [activeMode, setActiveMode] = useState<AsinMode>('single-asin')
  const activeTab = ASIN_MODES.find((t) => t.id === activeMode)!

  return (
    <div>
      <AsinModeTabBar active={activeMode} onChange={setActiveMode} />

      {activeMode === 'single-asin' ? (
        <SingleAsinPage />
      ) : activeMode === 'multi-asin' ? (
        <MultiAsinPage />
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <ComingSoon tab={activeTab} />
          </div>
        </div>
      )}
    </div>
  )
}