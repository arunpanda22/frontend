'use client'

import { useState } from 'react'
import { Search, Target, ArrowLeft, type LucideProps } from 'lucide-react'
import { FileText, TableProperties } from 'lucide-react'
import { MultiAsinKeywordPage } from './keyword-targeting/MultiAsinKeywordPage'
import { MultiAsinProductPage } from './product-targeting/MultiAsinProductPage'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MultiAsinSubtype = 'keyword' | 'product'
export type CampaignMode     = 'individual' | 'bulk'

interface SubtypeTab {
  id:       MultiAsinSubtype
  label:    string
  sublabel: string
  icon:     React.ComponentType<LucideProps>
}

// ── Config ────────────────────────────────────────────────────────────────────

const SUBTYPES: SubtypeTab[] = [
  {
    id:       'keyword',
    label:    'Keyword Targeting',
    sublabel: 'SK · MK',
    icon:     Search,
  },
  {
    id:       'product',
    label:    'Product Targeting',
    sublabel: 'SPT · MPT',
    icon:     Target,
  },
]

// ── Subtype tab bar ───────────────────────────────────────────────────────────

function SubtypeTabBar({
  selected,
  onSelect,
}: {
  selected: MultiAsinSubtype | null
  onSelect: (id: MultiAsinSubtype) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {SUBTYPES.map((tab) => {
        const Icon     = tab.icon
        const isActive = selected === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
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
              <p className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>
                {tab.label}
              </p>
              <p className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                {tab.sublabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Mode picker ───────────────────────────────────────────────────────────────

function ModePicker({ onSelect }: { onSelect: (mode: CampaignMode) => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <p className="text-sm font-semibold text-slate-800">How would you like to create campaigns?</p>
        <p className="text-xs text-slate-400 mt-0.5">Choose a creation method to continue</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('individual')}
          className="group flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-indigo-100">
            <FileText className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Individual</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Fill in a form to create one campaign at a time
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('bulk')}
          className="group flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-indigo-100">
            <TableProperties className="h-5 w-5 text-slate-500 transition-colors group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Bulk Upload</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Paste data from Excel to create dozens of campaigns at once
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MultiAsinPage() {
  const [selectedSubtype, setSelectedSubtype] = useState<MultiAsinSubtype | null>(null)
  const [selectedMode,    setSelectedMode]    = useState<CampaignMode | null>(null)

  const showForm = selectedSubtype !== null && selectedMode !== null

  const activeTab = SUBTYPES.find((t) => t.id === selectedSubtype) ?? null

  function handleSubtypeSelect(id: MultiAsinSubtype) {
    setSelectedSubtype(id)
    setSelectedMode(null)
  }

  function handleBack() {
    if (selectedMode !== null) {
      setSelectedMode(null)
    } else {
      setSelectedSubtype(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">

      {/* Tab bar — always visible */}
      <div className="flex flex-col gap-1">
        <SubtypeTabBar selected={selectedSubtype} onSelect={handleSubtypeSelect} />
        {selectedSubtype && !showForm && (
          <p className="text-[11px] text-slate-400 pl-1 mt-0.5">
            {activeTab?.label} · Select creation method below
          </p>
        )}
      </div>

      {!selectedSubtype ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-400">Select a targeting type above to get started</p>
        </div>
      ) : showForm ? (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Multi ASIN</span>
              <span>·</span>
              <span className="text-slate-600 font-medium">{activeTab?.label}</span>
              <span>·</span>
              <span className="capitalize text-slate-600 font-medium">{selectedMode}</span>
            </div>
          </div>

          {selectedSubtype === 'keyword' && <MultiAsinKeywordPage mode={selectedMode!} />}
          {selectedSubtype === 'product' && <MultiAsinProductPage mode={selectedMode!} />}
        </>
      ) : (
        <ModePicker onSelect={(mode) => setSelectedMode(mode)} />
      )}
    </div>
  )
}